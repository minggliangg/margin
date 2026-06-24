const MD_EXT = /\.(md|markdown|mdown|mkd)$/i

export function isMarkdownFile(file: File): boolean {
  if (MD_EXT.test(file.name)) return true
  // Some systems type .md as text/plain; accept those too.
  return file.type === 'text/markdown' || file.type === 'text/x-markdown'
}

export async function readFileAsText(file: File): Promise<string> {
  return await file.text()
}
