/**
 * Minimal glob matching for sensitive-path detection.
 *
 * Supports `**` (any path segment run), `*` (any chars within a segment), and
 * `?` (one char within a segment). A pattern with no `/` (e.g. `.env`,
 * `*.pem`) is treated as a basename pattern and matched at any depth.
 */
export function globToRegExp(glob: string): RegExp {
  let g = glob.replace(/\\/g, '/');
  if (!g.includes('/')) g = `**/${g}`;

  let src = '';
  for (let i = 0; i < g.length; i++) {
    const ch = g[i]!;
    if (ch === '*') {
      if (g[i + 1] === '*') {
        const consume = g[i + 2] === '/';
        src += consume ? '(?:.*/)?' : '.*';
        i += consume ? 2 : 1;
      } else {
        src += '[^/]*';
      }
    } else if (ch === '?') {
      src += '[^/]';
    } else {
      src += escapeRegExp(ch);
    }
  }

  return new RegExp(`^${src}$`, 'i');
}

function escapeRegExp(ch: string): string {
  return /[.+^${}()|[\]\\/]/.test(ch) ? `\\${ch}` : ch;
}

export function isSensitivePath(path: string, patterns: string[]): boolean {
  const normalized = path.replace(/\\/g, '/');
  for (const pattern of patterns) {
    if (globToRegExp(pattern).test(normalized)) return true;
  }
  return false;
}
