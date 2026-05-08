export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: '\x1b[36m',   // cyan
  WARN: '\x1b[33m',   // yellow
  ERROR: '\x1b[31m',  // red
  RESET: '\x1b[0m',
};

export function getLogger(name: string): Logger {
  const stamp = () => new Date().toISOString();
  const write = (level: string, msg: string) => {
    const color = LEVEL_COLORS[level] ?? '';
    const reset = LEVEL_COLORS['RESET'];
    const line = `${stamp()} ${color}[${level}]${reset} ${name}: ${msg}`;
    if (level === 'ERROR') console.error(line);
    else if (level === 'WARN') console.warn(line);
    else console.log(line);
  };
  return {
    info: (msg) => write('INFO', msg),
    warn: (msg) => write('WARN', msg),
    error: (msg) => write('ERROR', msg),
  };
}
