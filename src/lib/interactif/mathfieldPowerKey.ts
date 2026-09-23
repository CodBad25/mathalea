import type { MathfieldElement } from 'mathlive'

/** Empêche qu'un raccourci physique MathLive interprète ^ comme une fraction. */
export function handleMathfieldPowerKeydown(
  event: KeyboardEvent,
  mf: MathfieldElement,
): void {
  if (
    !mf.isSelectionEditable ||
    mf.mode !== 'math' ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return
  }

  // Sur les claviers français, la touche ^ peut être une touche morte.
  const isFrenchDeadCaret =
    event.key === 'Dead' && event.code === 'BracketLeft' && !event.shiftKey
  if (event.key !== '^' && !isFrenchDeadCaret) return

  event.preventDefault()
  event.stopPropagation()
  mf.executeCommand('moveToSuperscript')
}
