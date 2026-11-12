/**
 * Best-effort language guess for fenced blocks with no info string.
 * Cheap regex heuristics limited to the languages we bundle in highlighter.ts.
 * Returns null when nothing scores confidently — callers then show plain text.
 */

const rules: [lang: string, patterns: RegExp[]][] = [
  ['diff', [/^@@ .+ @@/m, /^diff --git /m, /^(\+\+\+|---) \S/m]],
  ['dockerfile', [/^FROM\s+\S+/m, /^(RUN|CMD|COPY|ENTRYPOINT|WORKDIR|EXPOSE)\s/m]],
  ['bash', [/^#!.*\b(ba|z)?sh\b/, /^\s*\$\s+\S/m, /^\s*(sudo|npm|bun|yarn|pnpm|git|cd|ls|curl|echo|export|mkdir|apt|brew|docker)\s/m]],
  ['python', [/^\s*def\s+\w+\(.*\):/m, /^\s*(from\s+\S+\s+)?import\s+\w+/m, /^\s*(elif|except\b.*|class\s+\w+.*):\s*$/m, /\bself\./, /^\s*print\(/m]],
  ['go', [/^package\s+\w+/m, /^func\s+(\(.*\)\s*)?\w+\(/m, /:=/]],
  ['rust', [/^\s*fn\s+\w+/m, /\blet\s+mut\b/, /^\s*(pub\s+)?(struct|impl|enum|trait)\s+\w+/m, /println!\(/]],
  ['java', [/\bpublic\s+(static\s+)?(class|void|interface)\b/, /System\.out\.print/, /^import\s+java\./m]],
  ['sql', [/^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/im, /\bFROM\s+\w+/i]],
  ['tsx', [/<\w+[^>]*>[\s\S]*<\/\w+>|<\w+[^>]*\/>/, /\b(useState|useEffect|React)\b/]],
  ['typescript', [/^\s*(interface|type)\s+\w+\s*(=|\{)/m, /:\s*(string|number|boolean|unknown|void)\b/, /\bas\s+const\b/, /^\s*(export\s+)?enum\s+\w+/m]],
  ['javascript', [/\b(const|let|var)\s+\w+\s*=/, /=>/, /\bfunction\s*\w*\(/, /\bconsole\.\w+\(/, /^\s*(import|export)\s.+from\s+['"]/m, /\brequire\(/]],
  ['html', [/^\s*<!doctype html/i, /^\s*<(html|head|body|div|span|p|a|ul|section)\b/im]],
  ['css', [/^\s*[.#]?[\w-]+(\s+[.#]?[\w-]+)*\s*\{[^}]*:[^}]*;/m, /^\s*@(media|import|keyframes)\b/m]],
  ['yaml', [/^---\s*$/m, /^[\w-]+:\s*(\S.*)?$/m, /^\s*-\s+[\w-]+:\s/m]],
  ['toml', [/^\[[\w.-]+\]\s*$/m, /^[\w-]+\s*=\s*("|\d|\[|true|false)/m]],
]

/** Score at which a guess is trusted. */
const THRESHOLD = 2

function tryJson(text: string): boolean {
  const t = text.trim()
  if (!/^[{[]/.test(t)) return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

export function detectLanguage(text: string): string | null {
  const sample = text.slice(0, 4000)
  if (tryJson(sample)) return 'json'

  let best: string | null = null
  let bestScore = 0
  for (const [lang, patterns] of rules) {
    const score = patterns.reduce((n, re) => n + (re.test(sample) ? 1 : 0), 0)
    // Strict `>` keeps the earlier (more specific) rule on ties.
    if (score > bestScore) {
      best = lang
      bestScore = score
    }
  }
  return bestScore >= THRESHOLD ? best : null
}

/** Display names for the label; falls back to the raw lang string. */
const LABELS: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX',
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX',
  json: 'JSON', css: 'CSS', html: 'HTML', md: 'Markdown', markdown: 'Markdown',
  sh: 'Shell', bash: 'Bash', shell: 'Shell', shellscript: 'Shell', zsh: 'Shell',
  yaml: 'YAML', yml: 'YAML', toml: 'TOML', py: 'Python', python: 'Python',
  go: 'Go', rust: 'Rust', rs: 'Rust', java: 'Java', sql: 'SQL',
  diff: 'Diff', dockerfile: 'Dockerfile', text: 'Text', txt: 'Text',
}

export function langLabel(lang: string): string {
  return LABELS[lang.toLowerCase()] ?? lang
}
