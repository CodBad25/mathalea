const visualFormula = 'Formule mathématique à consulter visuellement.'

/** Lecture française des formules courantes, sans exposer les commandes inconnues. */
export function formulaToSpeech(latex: string): string {
  let text = latex
    .replace(/\\(?:left|right|displaystyle|textstyle)\b/g, '')
    .replace(/\\(?:[,;:!]|quad\b|qquad\b)|~/g, ' ')
  const group = /\{([^{}]*)\}/
  // Traiter les groupes intérieurs avant les groupes qui les contiennent.
  for (let i = 0; i < latex.length && text.includes('{'); i++) {
    const previous = text
    text = text
      .replace(
        /\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
        ' ( $1 ) sur ( $2 ) ',
      )
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, ' racine carrée de ( $1 ) ')
      .replace(
        /\\(?:text|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g,
        '$1',
      )
      .replace(/\^\{([^{}]*)\}/g, ' puissance ( $1 ) ')
      .replace(/_\{([^{}]*)\}/g, ' indice $1 ')
    if (text === previous) {
      // Conserver les arguments de commandes inconnues pour détecter leur présence.
      if (/\\[a-zA-Z]+\s*\{/.test(text)) return visualFormula
      text = text.replace(group, ' ( $1 ) ')
    }
  }
  const commands: Record<string, string> = {
    times: 'fois',
    cdot: 'fois',
    div: 'divisé par',
    leq: 'inférieur ou égal à',
    le: 'inférieur ou égal à',
    geq: 'supérieur ou égal à',
    ge: 'supérieur ou égal à',
    neq: 'différent de',
    approx: 'environ égal à',
    pi: 'pi',
    infty: 'infini',
    ldots: 'points de suspension',
    dots: 'points de suspension',
    degree: 'degrés',
  }
  text = text.replace(/\\([a-zA-Z]+)/g, (match, command: string) =>
    commands[command] == null ? match : ` ${commands[command]} `,
  )
  text = text.replace(/\\%/g, ' pour cent ').replace(/\\[{}]/g, ' ')
  if (/\\|[{}]/.test(text)) return visualFormula
  return text
    .replace(/\^2\b/g, ' au carré ')
    .replace(/\^3\b/g, ' au cube ')
    .replace(/\^([\w])/g, ' puissance $1 ')
    .replace(/_([\w])/g, ' indice $1 ')
    .replace(/[+]/g, ' plus ')
    .replace(/-/g, ' moins ')
    .replace(/=/g, ' égal à ')
    .replace(/</g, ' inférieur à ')
    .replace(/>/g, ' supérieur à ')
    .replace(/[*/]/g, (symbol) => (symbol === '*' ? ' fois ' : ' divisé par '))
    .replace(/%/g, ' pour cent ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Convertit le recto HTML/LaTeX en texte brut destiné à la synthèse vocale. */
export function memotestQuestionSpeech(front: string): string {
  const doc = new DOMParser().parseFromString(front, 'text/html')
  doc
    .querySelectorAll('script, style, [aria-hidden="true"]')
    .forEach((el) => el.remove())
  doc.querySelectorAll('svg, img').forEach((el) => {
    const description =
      el.getAttribute('aria-label') ||
      el.getAttribute('alt') ||
      el.querySelector('title')?.textContent
    el.replaceWith(
      doc.createTextNode(
        ` ${description?.trim() || 'Illustration à consulter visuellement.'} `,
      ),
    )
  })
  doc
    .querySelectorAll('br')
    .forEach((el) => el.replaceWith(doc.createTextNode(' ')))
  doc.querySelectorAll('p, div, li, tr, td, th').forEach((el) => el.append(' '))
  return (doc.body.textContent ?? '')
    .replace(
      /\$\$([\s\S]*?)\$\$|\$([^$]*?)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g,
      (_match, display, inline, parentheses, brackets) =>
        ` ${formulaToSpeech(display ?? inline ?? parentheses ?? brackets)} `,
    )
    .replace(/\s+/g, ' ')
    .trim()
}
