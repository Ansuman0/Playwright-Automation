import type {
  Reporter,
  FullResult,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

interface TestRecord {
  id:          number;
  title:       string;
  file:        string;
  tags:        string[];
  outcome:     'passed' | 'failed' | 'skipped' | 'flaky';
  durationMs:  number;
  errorMsg:    string;
  project:     string;
  startTime:   number;
}

export default class AdvancedHtmlReporter implements Reporter {
  private readonly outputDir: string;
  private readonly autoOpen:  boolean;
  private readonly suiteName: string;
  private readonly runTs:     string;
  private readonly wallStart  = Date.now();
  private readonly records:   TestRecord[] = [];
  private idSeq = 0;

  constructor(options: { outputDir?: string; autoOpen?: boolean; suiteName?: string } = {}) {
    this.runTs     = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const ts       = new Date().toISOString().replace(/T/, '_').replace(/[:.]/g, '-').slice(0, 19);
    this.outputDir = options.outputDir ?? path.join('reports', 'advanced', ts);
    this.autoOpen  = options.autoOpen !== false;
    this.suiteName = options.suiteName ?? 'Neo-Bank E2E Suite';
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const tags = test.title.match(/@\w+/g) ?? [];
    const raw  = test.outcome();
    const outcome: TestRecord['outcome'] =
      raw === 'flaky'      ? 'flaky'   :
      raw === 'expected'   ? 'passed'  :
      raw === 'unexpected' ? 'failed'  : 'skipped';

    const title    = test.titlePath().slice(1).join(' › ');
    const existing = this.records.findIndex(r => r.title === title && r.project === (test.parent.project()?.name ?? ''));

    const record: TestRecord = {
      id:         ++this.idSeq,
      title,
      file:       path.basename(test.location.file),
      tags,
      outcome,
      durationMs: result.duration,
      errorMsg:   result.error?.message?.split('\n').slice(0, 6).join('\n') ?? '',
      project:    test.parent.project()?.name ?? '',
      startTime:  result.startTime.getTime(),
    };

    if (existing >= 0) this.records[existing] = record;
    else this.records.push(record);
  }

  onEnd(result: FullResult): void {
    const totalMs = Date.now() - this.wallStart;
    const html    = this.buildHtml(result, totalMs);

    try {
      fs.mkdirSync(this.outputDir, { recursive: true });
      const filePath = path.join(this.outputDir, 'index.html');
      fs.writeFileSync(filePath, html, 'utf8');

      // Keep a "latest" copy for easy access
      const latestDir = path.resolve(this.outputDir, '..', 'latest');
      fs.mkdirSync(latestDir, { recursive: true });
      fs.writeFileSync(path.join(latestDir, 'index.html'), html, 'utf8');

      const abs = path.resolve(filePath);
      console.log(`\n\u{1F4CA}  Advanced Report → ${abs}\n`);

      if (this.autoOpen && !process.env.CI) {
        const cmd =
          process.platform === 'win32'  ? `start "" "${abs}"` :
          process.platform === 'darwin' ? `open "${abs}"`      : `xdg-open "${abs}"`;
        exec(cmd, (err) => {
          if (err) console.warn(`   ⚠ Could not auto-open report: ${err.message}`);
        });
      }
    } catch (e) {
      console.error('AdvancedHtmlReporter: failed to write report', e);
    }
  }

  // ─── HTML builder ─────────────────────────────────────────────────────────

  private buildHtml(result: FullResult, totalMs: number): string {
    const passed  = this.records.filter(r => r.outcome === 'passed').length;
    const failed  = this.records.filter(r => r.outcome === 'failed').length;
    const skipped = this.records.filter(r => r.outcome === 'skipped').length;
    const flaky   = this.records.filter(r => r.outcome === 'flaky').length;
    const total   = this.records.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const durStr   = this.fmtDuration(totalMs);

    const statusCls  = result.status === 'passed' ? 'status-pass' : result.status === 'failed' ? 'status-fail' : 'status-warn';
    const statusText = result.status === 'passed' ? '✔ PASSED' : result.status === 'failed' ? '✘ FAILED' : `⚠ ${result.status.toUpperCase()}`;

    const sorted = [...this.records].sort((a, b) => a.startTime - b.startTime);

    // Tag stats
    const allTags = [...new Set(this.records.flatMap(r => r.tags))].sort();

    // File stats
    const fileMap = new Map<string, { passed: number; failed: number; skipped: number; flaky: number }>();
    for (const r of this.records) {
      const e = fileMap.get(r.file) ?? { passed: 0, failed: 0, skipped: 0, flaky: 0 };
      e[r.outcome]++;
      fileMap.set(r.file, e);
    }

    // Slowest 5
    const slowest = [...this.records]
      .filter(r => r.outcome !== 'skipped')
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 5);

    const envUrl  = process.env.BASE_URL ?? '';
    const browser = process.env.BROWSER ?? 'chromium';
    const isCI    = process.env.CI ? 'CI' : 'Local';

    const pie = this.svgPie(passed, failed, flaky, skipped, 160);

    // --- tag rows
    const tagRows = allTags.map(tag => {
      const tagged = this.records.filter(r => r.tags.includes(tag));
      const tp = tagged.filter(r => r.outcome === 'passed').length;
      const tf = tagged.filter(r => r.outcome === 'failed').length;
      const ts = tagged.filter(r => r.outcome === 'skipped').length;
      const rate = tagged.length > 0 ? ((tp / tagged.length) * 100).toFixed(1) + '%' : '—';
      return `<tr>
        <td><span class="tag-badge">${this.esc(tag)}</span></td>
        <td class="center">${tagged.length}</td>
        <td class="center pass-text"><b>${tp}</b></td>
        <td class="center fail-text">${tf > 0 ? `<b>${tf}</b>` : tf}</td>
        <td class="center skip-text">${ts}</td>
        <td class="center">${this.rateBar(tp, tagged.length)} <span class="rate-val">${rate}</span></td>
      </tr>`;
    }).join('');

    // --- file rows
    const fileRows = [...fileMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, s]) => {
        const t    = s.passed + s.failed + s.skipped + s.flaky;
        const rate = t > 0 ? ((s.passed / t) * 100).toFixed(1) + '%' : '—';
        return `<tr>
          <td class="mono small">${this.esc(file)}</td>
          <td class="center">${t}</td>
          <td class="center pass-text"><b>${s.passed}</b></td>
          <td class="center fail-text">${s.failed > 0 ? `<b>${s.failed}</b>` : s.failed}</td>
          <td class="center flaky-text">${s.flaky > 0 ? s.flaky : '—'}</td>
          <td class="center skip-text">${s.skipped > 0 ? s.skipped : '—'}</td>
          <td class="center">${this.rateBar(s.passed, t)} <span class="rate-val">${rate}</span></td>
        </tr>`;
      }).join('');

    // --- slowest rows
    const slowestRows = slowest.map((r, i) => {
      const icon = r.outcome === 'failed' ? '<span class="fail-text">✘</span>' : '<span class="pass-text">✔</span>';
      return `<tr>
        <td class="center muted">${i + 1}</td>
        <td class="center">${icon}</td>
        <td class="small">${this.esc(r.title)}</td>
        <td class="small mono muted">${this.esc(r.file)}</td>
        <td class="center dur">${this.fmtDuration(r.durationMs)}</td>
      </tr>`;
    }).join('');

    // --- test rows
    const testRows = sorted.map((r, i) => this.testRow(r, i + 1)).join('');

    // --- failure section
    const failures = this.records.filter(r => r.outcome === 'failed');
    const failureSection = failures.length === 0 ? '' : `
    <section class="card" style="margin-top:16px">
      <h2>❌ Failure Details <span class="badge fail-bg">${failures.length}</span></h2>
      <div class="failures-list">
        ${failures.map((r, i) => `
          <div class="failure-item">
            <div class="failure-header">
              <span class="failure-num">${i + 1}</span>
              <span class="failure-title">${this.esc(r.title)}</span>
              <span class="failure-file">${this.esc(r.file)}</span>
            </div>
            ${r.errorMsg ? `<pre class="error-msg">${this.esc(r.errorMsg)}</pre>` : ''}
          </div>`).join('')}
      </div>
    </section>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Test Report — ${this.esc(this.runTs)}</title>
<style>${this.css()}</style>
</head>
<body>

<header>
  <div class="header-inner">
    <div>
      <h1>\u{1F9EA} ${this.esc(this.suiteName)}</h1>
      <p class="meta">Run: ${this.esc(this.runTs)}&nbsp;&nbsp;|&nbsp;&nbsp;Duration: ${durStr}&nbsp;&nbsp;|&nbsp;&nbsp;${isCI}&nbsp;&nbsp;|&nbsp;&nbsp;Browser: ${this.esc(browser)}</p>
    </div>
    <span class="status-badge ${statusCls}">${statusText}</span>
  </div>
</header>

<main>

  <!-- KPI cards -->
  <div class="kpi-row">
    <div class="kpi-card" style="border-top-color:#475569">
      <div class="kpi-value">${total}</div>
      <div class="kpi-label">Total Executed</div>
    </div>
    <div class="kpi-card" style="border-top-color:#16a34a">
      <div class="kpi-value pass-text">${passed}</div>
      <div class="kpi-label">Passed</div>
    </div>
    <div class="kpi-card" style="border-top-color:#dc2626">
      <div class="kpi-value fail-text">${failed}</div>
      <div class="kpi-label">Failed</div>
    </div>
    <div class="kpi-card" style="border-top-color:#d97706">
      <div class="kpi-value flaky-text">${flaky}</div>
      <div class="kpi-label">Flaky / Warning</div>
    </div>
    <div class="kpi-card" style="border-top-color:#94a3b8">
      <div class="kpi-value skip-text">${skipped}</div>
      <div class="kpi-label">Skipped</div>
    </div>
    <div class="kpi-card" style="border-top-color:#0ea5e9">
      <div class="kpi-value" style="color:#0ea5e9">${passRate}%</div>
      <div class="kpi-label">Pass Rate</div>
    </div>
  </div>

  <!-- Chart + tags row -->
  <div class="chart-tags-row">
    <div class="card chart-card">
      <h2>Execution Summary</h2>
      <div class="chart-wrap">
        ${pie}
        <div class="legend">
          <div class="legend-item"><span class="dot" style="background:#16a34a"></span>Passed &nbsp;<strong>${passed}</strong></div>
          <div class="legend-item"><span class="dot" style="background:#dc2626"></span>Failed &nbsp;<strong>${failed}</strong></div>
          ${flaky > 0 ? `<div class="legend-item"><span class="dot" style="background:#d97706"></span>Flaky &nbsp;<strong>${flaky}</strong></div>` : ''}
          <div class="legend-item"><span class="dot" style="background:#94a3b8"></span>Skipped &nbsp;<strong>${skipped}</strong></div>
        </div>
      </div>
      <div class="pass-rate-section">
        <div class="pass-rate-label">Pass Rate: <strong>${passRate}%</strong> &nbsp;<span class="muted small">(${passed} / ${total})</span></div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${passRate}%;background:${parseFloat(passRate) >= 80 ? '#16a34a' : parseFloat(passRate) >= 60 ? '#d97706' : '#dc2626'}"></div>
        </div>
      </div>
      <div class="exec-info">
        <div class="info-row"><span>⏱</span><span>Duration: <strong>${durStr}</strong></span></div>
        ${envUrl ? `<div class="info-row"><span>\u{1F310}</span><span>${this.esc(envUrl)}</span></div>` : ''}
        <div class="info-row"><span>\u{1F5A5}</span><span>Browser: <strong>${this.esc(browser)}</strong></span></div>
        <div class="info-row"><span>\u{1F4C5}</span><span>${this.esc(this.runTs)}</span></div>
        <div class="info-row"><span>\u{1F3AF}</span><span>Environment: <strong>${isCI}</strong></span></div>
      </div>
    </div>

    ${allTags.length > 0 ? `
    <div class="card">
      <h2>\u{1F3F7} By Tag</h2>
      <table class="inner-table">
        <thead>
          <tr><th>Tag</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th></tr>
        </thead>
        <tbody>${tagRows}</tbody>
      </table>
    </div>` : '<div class="card"><h2>No Tags</h2><p class="muted small">Add @smoke, @regression, or @transfer tags to your tests for tag-level reporting.</p></div>'}
  </div>

  <!-- Test results table -->
  <section class="card" style="margin-top:16px">
    <div class="table-header">
      <h2>Test Results <span class="badge" style="background:#e2e8f0;color:#1e293b">${total}</span></h2>
      <div class="controls">
        <input type="text" id="search" placeholder="\u{1F50D} Search tests…" oninput="applyFilters()">
        <div class="filter-btns">
          <button class="filter-btn active" data-filter="all"     onclick="setFilter('all')">All (${total})</button>
          <button class="filter-btn pass"   data-filter="passed"  onclick="setFilter('passed')">✅ Passed (${passed})</button>
          <button class="filter-btn fail"   data-filter="failed"  onclick="setFilter('failed')">❌ Failed (${failed})</button>
          ${flaky > 0 ? `<button class="filter-btn flaky" data-filter="flaky" onclick="setFilter('flaky')">⚠ Flaky (${flaky})</button>` : ''}
          <button class="filter-btn skip"   data-filter="skipped" onclick="setFilter('skipped')">⏭ Skipped (${skipped})</button>
        </div>
      </div>
    </div>
    <div id="no-results" class="no-results" style="display:none">No tests match the current filter.</div>
    <div class="table-wrap">
      <table id="test-table">
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th style="width:72px">Status</th>
            <th>Test Case</th>
            <th style="width:160px">Spec File</th>
            <th style="width:130px">Tags</th>
            <th style="width:110px">Project</th>
            <th style="width:80px">Duration</th>
            <th style="width:80px">Start</th>
          </tr>
        </thead>
        <tbody id="test-tbody">${testRows}</tbody>
      </table>
    </div>
  </section>

  <!-- Bottom sections -->
  <div class="bottom-row">
    <section class="card">
      <h2>\u{1F4C1} By Spec File</h2>
      <table class="inner-table">
        <thead>
          <tr><th>File</th><th>Total</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skip</th><th>Pass Rate</th></tr>
        </thead>
        <tbody>${fileRows}</tbody>
      </table>
    </section>

    ${slowest.length > 0 ? `
    <section class="card">
      <h2>⏱ Top 5 Slowest Tests</h2>
      <table class="inner-table">
        <thead>
          <tr><th>#</th><th>St.</th><th>Test</th><th>File</th><th>Duration</th></tr>
        </thead>
        <tbody>${slowestRows}</tbody>
      </table>
    </section>` : ''}
  </div>

  ${failureSection}

</main>

<footer>
  Generated by <strong>${this.esc(this.suiteName)}</strong> &nbsp;|&nbsp; Playwright &nbsp;|&nbsp; ${this.esc(this.runTs)}
</footer>

<script>
  let currentFilter = 'all';

  function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
    applyFilters();
  }

  function applyFilters() {
    const q = document.getElementById('search').value.toLowerCase();
    const rows = document.querySelectorAll('#test-tbody tr.test-row');
    let visible = 0;
    rows.forEach(row => {
      const outcome = row.dataset.outcome;
      const text    = row.dataset.title.toLowerCase();
      const show    = (currentFilter === 'all' || outcome === currentFilter) && (!q || text.includes(q));
      row.style.display = show ? '' : 'none';
      const next = row.nextElementSibling;
      if (next && next.classList.contains('error-row')) {
        next.style.display = show ? next.getAttribute('data-open') === '1' ? '' : 'none' : 'none';
      }
      if (show) visible++;
    });
    document.getElementById('no-results').style.display = visible === 0 ? '' : 'none';
  }

  function toggleError(id) {
    const el = document.getElementById('err-' + id);
    if (!el) return;
    const row = el.previousElementSibling;
    const open = el.style.display === 'none' || el.style.display === '';
    el.style.display = open ? 'table-row' : 'none';
    el.setAttribute('data-open', open ? '1' : '0');
    if (row) row.querySelector('.expand-icon').textContent = open ? '▾' : '▸';
  }
</script>
</body>
</html>`;
  }

  // ─── row builders ─────────────────────────────────────────────────────────

  private testRow(r: TestRecord, num: number): string {
    const icons: Record<string, string> = {
      passed:  '<span class="s-icon pass-bg">✔</span>',
      failed:  '<span class="s-icon fail-bg">✘</span>',
      flaky:   '<span class="s-icon flaky-bg">⚠</span>',
      skipped: '<span class="s-icon skip-bg">⏭</span>',
    };
    const startStr = r.startTime ? new Date(r.startTime).toTimeString().slice(0, 8) : '—';
    const tags     = r.tags.map(t => `<span class="tag-badge">${this.esc(t)}</span>`).join(' ');
    const hasError = r.outcome === 'failed' && !!r.errorMsg;
    const clickAttr = hasError ? ` style="cursor:pointer" onclick="toggleError(${r.id})"` : '';

    let html = `<tr class="test-row outcome-${r.outcome}" data-outcome="${r.outcome}" data-title="${this.esc(r.title)}"${clickAttr}>
      <td class="center muted small">${num}</td>
      <td class="center">${icons[r.outcome]}</td>
      <td class="test-title">${this.esc(r.title)}${hasError ? ` <span class="expand-icon muted">▸</span>` : ''}</td>
      <td class="small mono muted">${this.esc(r.file)}</td>
      <td>${tags}</td>
      <td class="small muted">${this.esc(r.project)}</td>
      <td class="center dur">${this.fmtDuration(r.durationMs)}</td>
      <td class="center small muted">${startStr}</td>
    </tr>`;

    if (hasError) {
      html += `<tr class="error-row" id="err-${r.id}" style="display:none" data-open="0">
        <td colspan="8"><pre class="error-detail">${this.esc(r.errorMsg)}</pre></td>
      </tr>`;
    }
    return html;
  }

  // ─── SVG pie (donut, no external deps) ────────────────────────────────────

  private svgPie(passed: number, failed: number, flaky: number, skipped: number, size: number): string {
    const slices = [
      { v: passed,  c: '#16a34a' },
      { v: failed,  c: '#dc2626' },
      { v: flaky,   c: '#d97706' },
      { v: skipped, c: '#94a3b8' },
    ].filter(s => s.v > 0);

    const total = slices.reduce((n, s) => n + s.v, 0);
    if (total === 0) return `<svg width="${size}" height="${size}"></svg>`;

    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    let paths = '';
    let angle = -Math.PI / 2;

    for (const slice of slices) {
      const sweep = (slice.v / total) * 2 * Math.PI;
      const end   = angle + sweep;
      const x1    = cx + r * Math.cos(angle);
      const y1    = cy + r * Math.sin(angle);
      const x2    = cx + r * Math.cos(end);
      const y2    = cy + r * Math.sin(end);
      const large = sweep > Math.PI ? 1 : 0;
      paths += `<path d="M${cx},${cy}L${x1.toFixed(1)},${y1.toFixed(1)}A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)}Z" fill="${slice.c}" stroke="#fff" stroke-width="2.5"/>`;
      angle = end;
    }

    const inner = (r * 0.54).toFixed(1);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink:0">
  ${paths}
  <circle cx="${cx}" cy="${cy}" r="${inner}" fill="#fff"/>
  <text x="${cx}" y="${cy - 7}" text-anchor="middle" font-size="18" font-weight="800" fill="#1e293b">${total}</text>
  <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="10" fill="#94a3b8" font-weight="600">TOTAL</text>
</svg>`;
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  private rateBar(passed: number, total: number): string {
    if (total === 0) return '—';
    const pct   = (passed / total) * 100;
    const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
    return `<span style="display:inline-block;width:46px;height:7px;background:#e2e8f0;border-radius:3px;vertical-align:middle"><span style="display:block;width:${pct.toFixed(0)}%;height:100%;background:${color};border-radius:3px"></span></span>`;
  }

  private fmtDuration(ms: number): string {
    if (ms < 1_000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  }

  private esc(s: string): string {
    return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── CSS ──────────────────────────────────────────────────────────────────

  private css(): string {
    return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f1f5f9;--card:#fff;--border:#e2e8f0;--text:#1e293b;--muted:#64748b;
  --pass:#16a34a;--fail:#dc2626;--flaky:#d97706;--skip:#94a3b8;--info:#0ea5e9;
  --hdr:#1e293b;
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5}

header{background:var(--hdr);color:#f8fafc;padding:18px 32px;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(0,0,0,.3)}
.header-inner{display:flex;align-items:center;justify-content:space-between;max-width:1440px;margin:0 auto;gap:16px}
header h1{font-size:19px;font-weight:700}
.meta{font-size:11px;color:#94a3b8;margin-top:3px}

.status-badge{padding:6px 18px;border-radius:20px;font-weight:700;font-size:12px;letter-spacing:.6px;white-space:nowrap}
.status-pass{background:#16a34a;color:#fff}
.status-fail{background:#dc2626;color:#fff}
.status-warn{background:#d97706;color:#fff}

main{max-width:1440px;margin:0 auto;padding:20px 20px 32px}

.kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:16px}
.kpi-card{background:var(--card);border-radius:10px;padding:16px 18px;border-top:4px solid;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center}
.kpi-value{font-size:34px;font-weight:800;line-height:1.1;margin-bottom:4px}
.kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);font-weight:600}

.chart-tags-row{display:grid;grid-template-columns:290px 1fr;gap:14px;margin-bottom:0}
.card{background:var(--card);border-radius:10px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.07)}
.card h2{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.badge{display:inline-flex;align-items:center;justify-content:center;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600}
.pass-bg{background:#dcfce7;color:#16a34a}.fail-bg{background:#fee2e2;color:#dc2626}.flaky-bg{background:#fef3c7;color:#d97706}.skip-bg{background:#f1f5f9;color:#64748b}

.chart-wrap{display:flex;align-items:center;gap:14px;margin-bottom:12px}
.legend{display:flex;flex-direction:column;gap:7px}
.legend-item{display:flex;align-items:center;gap:7px;font-size:13px}
.dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}

.pass-rate-section{margin-bottom:12px}
.pass-rate-label{font-size:13px;margin-bottom:5px}
.progress-bar{height:9px;background:#e2e8f0;border-radius:5px;overflow:hidden}
.progress-fill{height:100%;border-radius:5px;transition:width .4s}

.exec-info{display:flex;flex-direction:column;gap:5px;border-top:1px solid var(--border);padding-top:10px;margin-top:4px}
.info-row{display:flex;gap:8px;font-size:12px;color:var(--muted);align-items:flex-start}

.table-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px}
.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#search{padding:6px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;width:210px;outline:none;color:var(--text)}
#search:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(59,130,246,.15)}

.filter-btns{display:flex;gap:5px;flex-wrap:wrap}
.filter-btn{padding:5px 11px;border:1px solid var(--border);border-radius:20px;font-size:11px;cursor:pointer;background:#fff;color:var(--muted);font-weight:500;transition:all .12s}
.filter-btn:hover{border-color:#94a3b8;color:var(--text)}
.filter-btn.active{background:var(--text);color:#fff;border-color:var(--text)}
.filter-btn.pass.active{background:var(--pass);border-color:var(--pass)}.filter-btn.fail.active{background:var(--fail);border-color:var(--fail)}.filter-btn.flaky.active{background:var(--flaky);border-color:var(--flaky)}.filter-btn.skip.active{background:#94a3b8;border-color:#94a3b8}

.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);border-bottom:2px solid var(--border);background:#f8fafc;font-weight:600;white-space:nowrap}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
tr.test-row:hover td{background:#f8fafc}
tr.outcome-failed .test-title{font-weight:600}
tr.outcome-skipped{opacity:.6}

.s-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700}
.test-title{font-size:13px}
.expand-icon{color:var(--muted);font-size:11px;margin-left:3px;user-select:none}
.error-row td{padding:0}
.error-detail{padding:10px 16px;font-size:12px;color:#991b1b;background:#fff5f5;border-left:3px solid #dc2626;white-space:pre-wrap;word-break:break-word;margin:0;font-family:'Courier New',monospace}

.tag-badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:11px;background:#eff6ff;color:#3b82f6;font-weight:500;margin:1px;white-space:nowrap}
.dur{font-family:monospace;font-size:12px;color:var(--muted)}
.rate-val{font-size:12px;font-weight:600;vertical-align:middle;margin-left:5px}
.muted{color:var(--muted)}.small{font-size:12px}.mono{font-family:monospace}.center{text-align:center}
.pass-text{color:var(--pass)}.fail-text{color:var(--fail)}.flaky-text{color:var(--flaky)}.skip-text{color:var(--skip)}

.bottom-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.inner-table{width:100%;border-collapse:collapse;font-size:13px}
.inner-table th{padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);border-bottom:1px solid var(--border);font-weight:600;background:#fafafa}
.inner-table td{padding:7px 10px;border-bottom:1px solid #f8fafc}
.inner-table tr:last-child td{border-bottom:none}
.inner-table tr:hover td{background:#f8fafc}

.failures-list{display:flex;flex-direction:column;gap:10px}
.failure-item{border:1px solid #fee2e2;border-radius:8px;overflow:hidden}
.failure-header{display:flex;align-items:center;gap:8px;padding:9px 14px;background:#fff5f5}
.failure-num{background:#dc2626;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.failure-title{font-weight:600;font-size:13px;flex:1;min-width:0}
.failure-file{font-size:11px;color:var(--muted);font-style:italic;white-space:nowrap}
.error-msg{padding:10px 14px;font-size:12px;color:#7f1d1d;background:#fef2f2;white-space:pre-wrap;word-break:break-word;font-family:monospace;margin:0;border-top:1px solid #fee2e2}

.no-results{text-align:center;padding:32px;color:var(--muted);font-size:14px}

footer{text-align:center;padding:18px;color:var(--muted);font-size:11px;border-top:1px solid var(--border);margin-top:20px}

@media(max-width:960px){.chart-tags-row{grid-template-columns:1fr}.bottom-row{grid-template-columns:1fr}}
@media(max-width:640px){.kpi-row{grid-template-columns:repeat(3,1fr)}.header-inner{flex-direction:column;align-items:flex-start}}
`;
  }
}
