import {
  applyTypstSourceEdits,
  maskTypstLiterals,
  typstClosingDelimiter,
  typstLiteralRanges,
  typstRemoval,
} from './typstSource'

/**
 * Nettoie le texte actuel de l’éditeur, sans régénérer les exercices.
 * Seuls les repères et commentaires de l’interface sont retirés ; les
 * réglages et expressions Typst restent intacts, y compris les retouches libres.
 */
export function cleanTypstExport(source: string): string {
  const masked = maskTypstLiterals(source)
  const edits: { start: number; end: number; text: string }[] = []
  const definitions: { start: number; end: number }[] = []
  for (const match of masked.matchAll(/#let\s+mathalea-anchor\s*\(/g)) {
    const paramsEnd = typstClosingDelimiter(
      masked,
      match.index + match[0].length - 1,
    )
    if (paramsEnd < 0) continue
    const body = /^\s*=\s*context\s*\{/.exec(masked.slice(paramsEnd + 1))
    if (body == null) continue
    const end = typstClosingDelimiter(masked, paramsEnd + body[0].length)
    if (end < 0) continue
    definitions.push({ start: match.index, end: end + 1 })
    edits.push(typstRemoval(source, match.index, end + 1))
  }
  for (const match of masked.matchAll(/(?<![\w-])#?mathalea-anchor\s*\(/g)) {
    if (
      definitions.some(
        ({ start, end }) => match.index >= start && match.index < end,
      )
    )
      continue
    const end = typstClosingDelimiter(masked, match.index + match[0].length - 1)
    if (end >= 0) edits.push(typstRemoval(source, match.index, end + 1))
  }
  for (const { start, end, kind } of typstLiteralRanges(source)) {
    if (
      kind !== 'comment' ||
      definitions.some((range) => start >= range.start && start < range.end)
    )
      continue
    const comment = source.slice(start, end)
    if (
      /^\/\/\s*mathalea:/.test(comment) ||
      comment ===
        '// ----- Repères invisibles de la palette de mise en page -----'
    ) {
      edits.push(typstRemoval(source, start, end))
    }
  }
  return applyTypstSourceEdits(source, edits)
}
