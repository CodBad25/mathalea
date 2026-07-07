import { tex2typst } from 'tex2typst'

/**
 * Conversion du contenu HTML des exercices (avec formules LaTeX en `$...$`)
 * vers du balisage Typst, pour la vue Typst.
 *
 * Le HTML traité est celui produit par les exercices en contexte HTML
 * (le même que celui affiché par la vue A4) : texte, balises simples
 * (br, b, i, sup, listes...), formules KaTeX et figures SVG.
 * Les figures et tableaux ne sont pas convertis : ils sont remplacés par
 * un encart signalant l'élément manquant.
 */

/** Macros LaTeX propres à MathALÉA (ou absentes de tex2typst) */
const CUSTOM_TEX_MACROS: Record<string, string> = {
  // virgule décimale française : sans espace après la virgule
  '\\dcomma': '\\text{,}',
  '\\euro': '\\text{€}',
  '\\pourcent': '\\%',
  '\\degre': '{}^\\circ',
  '\\np': '\\text{np}',
}

/**
 * Remplace `{\color{X}CONTENU}` (produit par miseEnEvidence) par
 * `\textcolor{X}{CONTENU}` que tex2typst sait convertir.
 */
function replaceColorGroups(tex: string): string {
  let result = ''
  let index = 0
  while (index < tex.length) {
    const start = tex.indexOf('{\\color{', index)
    if (start === -1) {
      result += tex.slice(index)
      break
    }
    result += tex.slice(index, start)
    const colorStart = start + '{\\color{'.length
    const colorEnd = tex.indexOf('}', colorStart)
    if (colorEnd === -1) {
      result += tex.slice(start)
      break
    }
    const color = tex.slice(colorStart, colorEnd)
    // recherche de l'accolade fermante du groupe
    let depth = 1
    let cursor = colorEnd + 1
    while (cursor < tex.length && depth > 0) {
      if (tex[cursor] === '{') depth++
      else if (tex[cursor] === '}') depth--
      cursor++
    }
    const content = tex.slice(colorEnd + 1, cursor - 1)
    result += `\\textcolor{${color}}{${replaceColorGroups(content)}}`
    index = cursor
  }
  return result
}

/** Prépare une formule LaTeX de MathALÉA avant sa conversion par tex2typst */
function preprocessTex(tex: string): string {
  // le contenu vient du HTML : il peut contenir des entités (&nbsp;...)
  let output = replaceColorGroups(decodeEntities(tex))
  // \textbf en mode mathématique (produit par miseEnEvidence)
  output = output.replace(/\\textbf\s*\{/g, '\\mathbf{')
  // \num{12\,345,6} et \numprint{...} : on garde le contenu tel quel,
  // la virgule décimale devenant \dcomma (voir CUSTOM_TEX_MACROS)
  output = output.replace(
    /\\(?:numprint|num)\s*\{([^{}]*)\}/g,
    // seules les virgules « seules » deviennent décimales (pas le \, des
    // espaces fines de séparation des milliers)
    (_, content: string) => content.replace(/(?<!\\),/g, '\\dcomma '),
  )
  // virgule décimale française : 3,5 ou 3{,}5 -> 3\dcomma 5
  output = output.replace(/(\d)\s*\{,\}\s*(?=\d)/g, '$1\\dcomma ')
  output = output.replace(/(\d),(?=\d)/g, '$1\\dcomma ')
  // \phantom n'a pas d'équivalent direct : on le remplace par une espace
  output = output.replace(/\\(?:phantom|hphantom)\s*\{[^{}]*\}/g, '\\;')
  return output
}

/** Corrige la sortie de tex2typst pour qu'elle compile avec Typst */
function postprocessTypst(typst: string): string {
  return (
    typst
      // tex2typst émet `fill: #f15929` pour \textcolor : Typst attend rgb("...")
      .replace(
        /fill: #([0-9a-fA-F]{3,8})\b/g,
        (_, hex: string) => `fill: rgb("#${hex}")`,
      )
      // virgule décimale : Typst la colle aux chiffres seulement si la
      // chaîne `","` est écrite sans espaces autour
      .replace(/(\d) ?"," ?(?=\d)/g, '$1","')
  )
}

/**
 * Convertit une formule LaTeX en mathématiques Typst.
 * En cas d'échec, la formule est renvoyée telle quelle sous forme de
 * chaîne littérale (affichée verbatim dans le document).
 */
export function latexMathToTypst(tex: string): string {
  const trimmed = tex.trim()
  if (trimmed.length === 0) return ''
  try {
    const converted = tex2typst(preprocessTex(trimmed), {
      customTexMacros: CUSTOM_TEX_MACROS,
    })
    return (
      postprocessTypst(converted)
        .trim()
        // un saut de ligne (`\`) final échapperait le `$` fermant
        .replace(/(\s*\\)+$/, '')
    )
  } catch {
    return `"${trimmed.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: '\u00a0',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  times: '×',
  divide: '÷',
  deg: '°',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  euro: '€',
  minus: '−',
  ndash: '–',
  mdash: '—',
  rsquo: '’',
}

/** Décode les entités HTML usuelles (nommées et numériques) */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
    .replace(/&([a-zA-Z]+);/g, (match, name: string) =>
      name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : match,
    )
}

/** Échappe les caractères spéciaux du balisage Typst dans du texte brut */
export function escapeTypstText(text: string): string {
  return text.replace(/[\\#$*_@`[\]<>~]/g, (char) => '\\' + char)
}

/** Encart affiché à la place d'un élément non convertible (image, tableau) */
function missingBox(label: string): string {
  return `#box(stroke: (dash: "dashed", paint: gray), inset: 6pt, text(fill: gray)[${label}])`
}

/**
 * Nettoie un SVG mathalea2d pour le parseur XML strict de Typst :
 * les textes des figures sont générés avec un point-virgule parasite
 * entre deux attributs (`font-family= "Book Antiqua"; font-style=...`)
 * qui fait échouer la lecture de l'image.
 */
export function sanitizeSvg(svg: string): string {
  return (
    svg
      // attribut parasite tel que sérialisé par le DOM (`;=""`)
      .replace(/\s;=""/g, '')
      // point-virgule orphelin après la valeur d'un attribut
      .replace(/=\s*("[^"]*")\s*;/g, '=$1 ')
      // entités HTML indéfinies en XML
      .replace(/&nbsp;/g, '&#160;')
      // esperluettes nues
      .replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
      .replace(/\s+/g, ' ')
  )
}

/** Chaîne littérale Typst (`"..."`) */
function typstStringLiteral(text: string): string {
  return `"${text.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

/**
 * Expression Typst affichant un SVG mathalea2d embarqué dans le code
 * (le document reste autonome : il compile aussi avec le CLI typst).
 * La largeur reprend celle de la figure (96 px CSS = 72 pt).
 */
export function svgToTypstImage(svg: string): string {
  const cleaned = sanitizeSvg(svg)
  const width = cleaned.match(/<svg[^>]*?\swidth="([\d.]+)"/i)
  const widthPt =
    width != null ? `, width: ${(parseFloat(width[1]) * 0.75).toFixed(1)}pt` : ''
  return `image(bytes(${typstStringLiteral(cleaned)}), format: "svg"${widthPt})`
}

/**
 * Convertit un contenu HTML d'exercice MathALÉA en balisage Typst.
 *
 * Si un collecteur `figures` est fourni, chaque figure SVG est convertie
 * en une expression `image(...)` ajoutée au collecteur et référencée dans
 * le balisage par `#fig-N` (variable déclarée par buildTypstDocument).
 * Sans collecteur, la figure est remplacée par un encart.
 */
export function htmlToTypst(html: string, figures?: string[]): string {
  // 1. Les formules et les blocs générés sont protégés par des jetons
  //    pour traverser intacts l'échappement du texte.
  const protectedSegments: string[] = []
  const protect = (typst: string): string => {
    protectedSegments.push(typst)
    return `\u0000${protectedSegments.length - 1}\u0000`
  }

  let text = html.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_, tex: string) => protect(`$ ${latexMathToTypst(tex)} $`),
  )
  text = text.replace(/\$([^$]+?)\$/g, (_, tex: string) => {
    const converted = latexMathToTypst(tex)
    return converted.length > 0 ? protect(`$${converted}$`) : ''
  })

  // 2. Figures SVG (embarquées dans le document), puis éléments non
  //    convertis : images et tableaux
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => {
    if (figures == null) return protect(missingBox('figure non convertie'))
    figures.push(svgToTypstImage(svg))
    return protect(`#fig-${figures.length}`)
  })
  text = text.replace(/<table[\s\S]*?<\/table>/gi, () =>
    protect(missingBox('tableau non converti')),
  )
  text = text.replace(/<img[^>]*>/gi, () =>
    protect(missingBox('image non convertie')),
  )

  // 3. Parcours des balises restantes
  let output = ''
  /** Profondeur des blocs de contenu Typst ouverts (#strong[, #emph[...]) */
  let bracketDepth = 0
  const listStack: ('ul' | 'ol')[] = []
  const openBlock = (markup: string) => {
    bracketDepth++
    return markup
  }
  const closeBlock = () => {
    if (bracketDepth === 0) return ''
    bracketDepth--
    return ']'
  }
  const tokens = text.match(/<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? []
  for (const token of tokens) {
    if (token[0] !== '<') {
      // nœud texte : les retours à la ligne du HTML ne sont pas
      // significatifs (les blancs sont normalisés avant le décodage
      // des entités pour préserver les espaces insécables)
      output += escapeTypstText(decodeEntities(token.replace(/\s+/g, ' ')))
      continue
    }
    const isClosing = token[1] === '/'
    const name = (token.match(/^<\/?([a-zA-Z0-9]+)/) ?? [])[1]?.toLowerCase()
    switch (name) {
      case 'br':
        output += '\\\n'
        break
      case 'b':
      case 'strong':
        output += isClosing ? closeBlock() : openBlock('#strong[')
        break
      case 'i':
      case 'em':
        output += isClosing ? closeBlock() : openBlock('#emph[')
        break
      case 'u':
        output += isClosing ? closeBlock() : openBlock('#underline[')
        break
      case 'sup':
        output += isClosing ? closeBlock() : openBlock('#super[')
        break
      case 'sub':
        output += isClosing ? closeBlock() : openBlock('#sub[')
        break
      case 'ul':
      case 'ol':
        if (isClosing) {
          listStack.pop()
          output += '\n'
        } else {
          listStack.push(name)
        }
        break
      case 'li':
        if (!isClosing) {
          // le marqueur est protégé pour ne pas être échappé comme s'il
          // s'agissait d'un début de ligne saisi dans le texte
          output +=
            '\n' +
            protect(listStack[listStack.length - 1] === 'ol' ? '+ ' : '- ')
        }
        break
      case 'p':
        output += '\n\n'
        break
      case 'div':
        output += '\n'
        break
      default:
        // balise inconnue ou span : ignorée, seul son contenu est conservé
        break
    }
  }
  while (bracketDepth > 0) output += closeBlock()

  // 4. Nettoyage puis restauration des segments protégés (l'échappement
  //    des débuts de ligne ne doit pas toucher le balisage généré)
  output = output
    .split('\n')
    .map((line) => line.trim())
    // une ligne commençant par -, + ou = serait interprétée comme une
    // liste ou un titre Typst
    .map((line) => (/^[-+=/]/.test(line) ? '\\' + line : line))
    .join('\n')
  output = output.replace(/\n{3,}/g, '\n\n')
  output = output.replace(
    /\u0000(\d+)\u0000/g,
    (_, index: string) => protectedSegments[Number(index)],
  )
  return output.trim()
}
