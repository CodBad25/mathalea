/**
 * 🧹 deparenthise()
 * Nettoie une expression LaTeX sans changer les opérateurs d'origine.
 */
export function deparenthise(latexIn: string): string {
  let s = latexIn

  // (+x) -> x
  s = s.replace(/\(\+([^)]+)\)/g, '$1')

  // (-x) -> -x sauf après \times ou \div
  s = s.replace(/(?<!\\times\s)(?<!\\div\s)\(-([^)]+)\)/g, '-$1')

  // parenthèses autour d’un nombre (sauf après \times ou \div)
  s = s.replace(/(?<!\\times\s)(?<!\\div\s)\(([-+]?\d+)\)/g, '$1')

  // produit négatif
  s = s.replace(/\\times-([0-9]+)/g, '\\times(-$1)')

  // division négative
  s = s.replace(/\\div-([0-9]+)/g, '\\div(-$1)')

  // +(...×...) -> +...×...
  s = s.replace(/\+\((\d+\\times[^()]*(?:\([^()]*\)[^()]*)*)\)/g, '+$1')

  // +(...÷...) -> +...÷...
  s = s.replace(/\+\((\d+\\div[^()]*(?:\([^()]*\)[^()]*)*)\)/g, '+$1')

  // (...×...)+ -> ...×...+
  s = s.replace(/\((\d+\\times\d+)\)\+/g, '$1+')

  // (...÷...)+ -> ...÷...+
  s = s.replace(/\((\d+\\div\d+)\)\+/g, '$1+')

  return s
}
/* Ancienne version mais qui ne fonctionne plus depuis le passage à la version 0.54.1 de ComputeEngine
export function deparenthise(latexIn: string): string {
  // Comptage des \frac et \dfrac
  const dfracCount = (latexIn.match(/\\dfrac\b/g) || []).length
  const fracCount = (latexIn.match(/\\frac\b/g) || []).length + dfracCount

  // Normalisation temporaire : \dfrac → \frac pour Compute Engine
  const normalized = latexIn.replace(/\\dfrac\b/g, '\\frac')

  const boxed = ce.parse(normalized, { form: 'raw' })
  const mathJson = boxed.json as MathJsonExpression

  // Nettoyage
  const stripped = stripDelimiter(mathJson)

  // Restauration des "Frac" à partir des Divide
  const restored = restoreFracNodes(stripped, fracCount).node

  // Conversion LaTeX
  // let result = ce.box(restored).toLatex
  let result = mathJsonToLatex(ce.box(restored))

  // Restauration des \dfrac (si présents en tête)
  if (dfracCount > 0) {
    let replaced = 0
    result = result.replace(/\\frac\{/g, () => {
      replaced++
      return replaced <= dfracCount ? '\\dfrac{' : '\\frac{'
    })
  }

  return result
}
*/
