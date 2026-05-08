import type {
  Reporter,
  FullResult,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

type Outcome = 'passed' | 'failed' | 'skipped' | 'flaky';

interface TestRecord {
  title: string;
  file: string;
  tags: string[];
  outcome: Outcome;
  durationMs: number;
  errorLine: string;
}

export default class KpiReporter implements Reporter {
  private readonly outputFile: string;
  private readonly startTime = Date.now();
  private readonly records: TestRecord[] = [];

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile =
      options.outputFile ?? path.join('reports', 'kpi', 'summary.md');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const tags = test.title.match(/@\w+/g) ?? [];
    const errorLine =
      result.error?.message?.split('\n')[0]?.slice(0, 120) ?? '';

    const raw = test.outcome();
    const outcome: Outcome =
      raw === 'flaky'      ? 'flaky'   :
      raw === 'expected'   ? 'passed'  :
      raw === 'unexpected' ? 'failed'  : 'skipped';

    const title = test.titlePath().slice(1).join(' › ');
    const existing = this.records.findIndex(r => r.title === title);
    const record: TestRecord = {
      title,
      file: path.basename(test.location.file),
      tags,
      outcome,
      durationMs: result.duration,
      errorLine,
    };

    if (existing >= 0) {
      this.records[existing] = record;
    } else {
      this.records.push(record);
    }
  }

  onEnd(result: FullResult): void {
    const totalMs = Date.now() - this.startTime;
    const passed  = this.records.filter(r => r.outcome === 'passed').length;
    const failed  = this.records.filter(r => r.outcome === 'failed').length;
    const skipped = this.records.filter(r => r.outcome === 'skipped').length;
    const flaky   = this.records.filter(r => r.outcome === 'flaky').length;
    const total   = this.records.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const runTs  = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const durStr = this.fmtDuration(totalMs);

    // ── tag breakdown ────────────────────────────────────────────────────────
    const ALL_TAGS = ['@smoke', '@regression', '@transfer'];
    const tagStats = ALL_TAGS.map(tag => {
      const tagged = this.records.filter(r => r.tags.includes(tag));
      const tp     = tagged.filter(r => r.outcome === 'passed').length;
      const tf     = tagged.filter(r => r.outcome === 'failed').length;
      const rate   = tagged.length > 0
        ? ((tp / tagged.length) * 100).toFixed(1) + '%'
        : '—';
      return { tag, total: tagged.length, passed: tp, failed: tf, rate };
    }).filter(t => t.total > 0);

    // ── file breakdown ───────────────────────────────────────────────────────
    const fileMap = new Map<string, { passed: number; failed: number; skipped: number }>();
    for (const r of this.records) {
      const entry = fileMap.get(r.file) ?? { passed: 0, failed: 0, skipped: 0 };
      if (r.outcome === 'passed')  entry.passed++;
      if (r.outcome === 'failed')  entry.failed++;
      if (r.outcome === 'skipped') entry.skipped++;
      fileMap.set(r.file, entry);
    }

    // ── slowest tests ────────────────────────────────────────────────────────
    const slowest = [...this.records]
      .filter(r => r.outcome === 'passed' || r.outcome === 'failed')
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 5);

    // ── failures ─────────────────────────────────────────────────────────────
    const failures = this.records.filter(r => r.outcome === 'failed');

    // ── terminal output ──────────────────────────────────────────────────────
    const c = {
      reset: '\x1b[0m', bold: '\x1b[1m',
      green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
      cyan: '\x1b[36m', gray: '\x1b[90m',
    };

    const statusIcon = result.status === 'passed' ? `${c.green}✔ PASSED${c.reset}`
      : result.status === 'failed' ? `${c.red}✘ FAILED${c.reset}`
      : `${c.yellow}⚠ ${result.status.toUpperCase()}${c.reset}`;

    console.log('');
    console.log(`${c.bold}${'═'.repeat(62)}${c.reset}`);
    console.log(`${c.bold}  KPI SUMMARY  ${runTs}  ${statusIcon}${c.reset}`);
    console.log(`${'═'.repeat(62)}`);
    console.log(`  Total     ${c.bold}${String(total).padStart(4)}${c.reset}   Duration  ${durStr}`);
    console.log(`  ${c.green}Passed${c.reset}    ${c.bold}${String(passed).padStart(4)}${c.reset}   Pass Rate ${c.bold}${passRate}%${c.reset}`);
    console.log(`  ${c.red}Failed${c.reset}    ${c.bold}${String(failed).padStart(4)}${c.reset}`);
    console.log(`  ${c.yellow}Skipped${c.reset}   ${c.bold}${String(skipped).padStart(4)}${c.reset}${flaky > 0 ? `   Flaky  ${c.bold}${flaky}${c.reset}` : ''}`);

    if (tagStats.length > 0) {
      console.log('');
      console.log(`${c.cyan}  BY TAG${c.reset}`);
      console.log(`  ${'─'.repeat(42)}`);
      for (const t of tagStats) {
        const bar = this.sparkBar(t.passed, t.total, 12);
        console.log(`  ${t.tag.padEnd(14)} ${String(t.passed).padStart(3)}/${t.total} ${bar} ${t.rate}`);
      }
    }

    console.log('');
    console.log(`${c.cyan}  BY FILE${c.reset}`);
    console.log(`  ${'─'.repeat(54)}`);
    for (const [file, s] of [...fileMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const t   = s.passed + s.failed + s.skipped;
      const bar = this.sparkBar(s.passed, t, 10);
      const failStr = s.failed > 0 ? `  ${c.red}${s.failed} failed${c.reset}` : '';
      console.log(`  ${file.padEnd(36)} ${String(s.passed).padStart(3)}/${t} ${bar}${failStr}`);
    }

    if (slowest.length > 0) {
      console.log('');
      console.log(`${c.cyan}  TOP 5 SLOWEST${c.reset}`);
      console.log(`  ${'─'.repeat(54)}`);
      for (const r of slowest) {
        const icon = r.outcome === 'failed' ? `${c.red}✘${c.reset}` : `${c.green}✔${c.reset}`;
        console.log(`  ${icon} ${this.fmtDuration(r.durationMs).padEnd(8)} ${r.title.slice(-50)}`);
      }
    }

    if (failures.length > 0) {
      console.log('');
      console.log(`${c.red}  FAILURES${c.reset}`);
      console.log(`  ${'─'.repeat(54)}`);
      failures.forEach((r, i) => {
        console.log(`  ${c.red}${i + 1}.${c.reset} ${r.title}`);
        if (r.errorLine) console.log(`     ${c.gray}${r.errorLine}${c.reset}`);
      });
    }

    console.log(`${'═'.repeat(62)}`);
    console.log('');

    // ── markdown file ────────────────────────────────────────────────────────
    this.writeMarkdown({
      runTs, durStr, total, passed, failed, skipped, flaky, passRate,
      tagStats, fileMap, slowest, failures,
      overallStatus: result.status,
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private sparkBar(filled: number, total: number, width: number): string {
    if (total === 0) return '░'.repeat(width);
    const n = Math.round((filled / total) * width);
    return '█'.repeat(n) + '░'.repeat(width - n);
  }

  private fmtDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  }

  private writeMarkdown(d: {
    runTs: string; durStr: string; total: number; passed: number; failed: number;
    skipped: number; flaky: number; passRate: string; overallStatus: string;
    tagStats: Array<{ tag: string; total: number; passed: number; failed: number; rate: string }>;
    fileMap: Map<string, { passed: number; failed: number; skipped: number }>;
    slowest: TestRecord[];
    failures: TestRecord[];
  }): void {
    const statusBadge = d.overallStatus === 'passed' ? '🟢 PASSED'
      : d.overallStatus === 'failed' ? '🔴 FAILED'
      : `🟡 ${d.overallStatus.toUpperCase()}`;

    const lines: string[] = [
      `# Test Run KPI — ${d.runTs}`,
      '',
      `**Status:** ${statusBadge} &nbsp; **Duration:** ${d.durStr}`,
      '',
      '## Summary',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Total Tests | ${d.total} |`,
      `| ✅ Passed | ${d.passed} |`,
      `| ❌ Failed | ${d.failed} |`,
      `| ⏭ Skipped | ${d.skipped} |`,
      `| 🔁 Flaky | ${d.flaky} |`,
      `| Pass Rate | **${d.passRate}%** |`,
      '',
    ];

    if (d.tagStats.length > 0) {
      lines.push('## By Tag', '', '| Tag | Passed | Total | Pass Rate |', '|-----|--------|-------|-----------|');
      for (const t of d.tagStats) {
        lines.push(`| ${t.tag} | ${t.passed} | ${t.total} | ${t.rate} |`);
      }
      lines.push('');
    }

    lines.push('## By Spec File', '', '| File | Passed | Failed | Skipped | Total |', '|------|--------|--------|---------|-------|');
    for (const [file, s] of [...d.fileMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const t = s.passed + s.failed + s.skipped;
      lines.push(`| ${file} | ${s.passed} | ${s.failed} | ${s.skipped} | ${t} |`);
    }
    lines.push('');

    if (d.slowest.length > 0) {
      lines.push('## Top 5 Slowest Tests', '', '| Status | Duration | Test |', '|--------|----------|------|');
      for (const r of d.slowest) {
        const icon = r.outcome === 'failed' ? '❌' : '✅';
        lines.push(`| ${icon} | ${this.fmtDuration(r.durationMs)} | ${r.title} |`);
      }
      lines.push('');
    }

    if (d.failures.length > 0) {
      lines.push('## Failures', '');
      d.failures.forEach((r, i) => {
        lines.push(`### ${i + 1}. ${r.title}`);
        lines.push('');
        lines.push(`**File:** \`${r.file}\``);
        if (r.errorLine) lines.push('', `\`\`\`\n${r.errorLine}\n\`\`\``);
        lines.push('');
      });
    }

    try {
      fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
      fs.writeFileSync(this.outputFile, lines.join('\n'), 'utf8');
    } catch {
      // Non-fatal — terminal output is the primary channel.
    }
  }
}
