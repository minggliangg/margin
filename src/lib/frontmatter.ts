/**
 * Front-matter delimiters recognised at the very start of a document:
 *   - `---` … `---` : YAML front matter (Marp, Jekyll, 11ty, Astro, …)
 *   - `+++` … `+++` : TOML front matter (Hugo)
 *
 * Only a block at offset 0 counts. A `---` appearing later in the body — a
 * thematic break, or a Marp slide separator — is left untouched.
 */
const FRONTMATTER_DELIMS: ReadonlyArray<{ open: string; close: string }> = [
  { open: '---', close: '---' },
  { open: '+++', close: '+++' },
]

// No `m` flag => `^` anchors to the start of the *string*, not a line, so only a
// leading block matches. `[ \t]*` tolerates trailing whitespace on the fence;
// the closing `---`/`+++` must sit on its own line (`\n…---`) which keeps a
// body `---` thematic-break from being mistaken for the closing delimiter.
// Delimiter chars are escaped (`+` is a quantifier in regex, so `+++` as-is is
// invalid) even though `---` needs no escaping.
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const FRONTMATTER_RES = FRONTMATTER_DELIMS.map(
  (d) =>
    new RegExp(
      `^${escapeRe(d.open)}[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n${escapeRe(d.close)}[ \\t]*(?:\\r?\\n|$)`,
    ),
)

/**
 * Remove a leading front-matter block from `source` if one is present.
 *
 * Marp/Jekyll/Hugo decks and posts ship YAML/TOML config at the top of the
 * file; to a Markdown *reader* that is metadata, not content, and rendering it
 * raw just produces a tangle of horizontal rules and broken paragraphs. We strip
 * it before the source reaches react-markdown. If the block is malformed (no
 * closing fence) the source is returned unchanged rather than truncated.
 */
export function stripFrontMatter(source: string): string {
  for (const re of FRONTMATTER_RES) {
    const m = re.exec(source)
    if (m) return source.slice(m[0].length)
  }
  return source
}
