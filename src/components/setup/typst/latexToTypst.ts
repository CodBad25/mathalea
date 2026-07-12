import { tex2typst } from 'tex2typst'

/**
 * Conversion du contenu HTML des exercices (avec formules LaTeX en `$...$`)
 * vers du balisage Typst, pour la vue Typst.
 *
 * Le HTML traité est celui produit par les exercices en contexte HTML
 * (le même que celui affiché par la vue A4) : texte, balises simples
 * (br, b, i, sup, listes...), formules KaTeX, tableaux et figures SVG.
 * Les tableaux (HTML ou array LaTeX) deviennent des `#table(...)` natifs ;
 * les figures SVG sont embarquées. Les images restantes sont remplacées par
 * un encart signalant l'élément manquant.
 */

/**
 * URLs des images d'exercices statiques (annales scannées) déjà récupérées,
 * associées au chemin virtuel où leurs octets sont chargés dans le
 * compilateur (`mapShadow`, voir `typstCompiler.ts`). Alimenté par
 * `Typst.svelte` avant la génération du code ; une image absente de ce
 * registre est affichée comme un encart « image non convertie ».
 */
let staticImagePaths: Map<string, string> = new Map()

/** Renseigne le registre des images d'exercices statiques (voir `staticImagePaths`) */
export function setStaticImagePaths(paths: Map<string, string>): void {
  staticImagePaths = paths
}

/**
 * Largeur intrinsèque (pt) donnée à une image d'exercice statique avant son
 * passage dans `mathalea-fit` : volontairement bien plus grande que
 * n'importe quelle page (A4 paysage compris, ~842pt), pour que la figure
 * soit toujours réduite à la largeur disponible plutôt que conserver une
 * largeur fixe plus étroite que la colonne/page qui la contient.
 */
const STATIC_IMAGE_INTRINSIC_WIDTH_PT = 2000

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
 * Réduit une figure si elle est plus large que la place disponible (sinon
 * elle déborde de la colonne / de la page). La largeur naturelle est mesurée,
 * puis le contenu est mis à l'échelle avec ses labels. Inclus dès qu'une
 * figure est présente.
 */
export const MATHALEA_FIT_HELPER = `#let mathalea-fit(body, zoom: 1.0) = layout(size => {
  let natural = measure(body).width
  let f = if natural > 0pt { calc.min(zoom, size.width / natural) } else { zoom }
  if f != 1.0 { box(scale(f * 100%, origin: top + left, reflow: true, body)) } else { body }
})`

/**
 * Réduit une figure (mathalea2d, avec ou sans labels) si elle dépasse la
 * largeur disponible, applique le zoom choisi par le professeur, l'aligne
 * (gauche/centre/droite) et place le repère invisible de la palette de mise
 * en page (contrôle de zoom) au coin haut-droit de son rendu final. Le zoom
 * et l'alignement sont résolus dans un seul passage de layout (measure()
 * d'un contenu encore différé par un layout() imbriqué ne donnerait pas sa
 * taille finale) puis appliqués manuellement (scale + pad), plutôt que via
 * mathalea-fit/align, pour rester cohérents entre eux.
 */
export const MATHALEA_FIGURE_BLOCK_HELPER = `#let mathalea-figure-block(num, alignment, zoom, body) = layout(size => {
  let natural = measure(body).width
  let f = if natural > 0pt { calc.min(zoom, size.width / natural) } else { zoom }
  let scaled = if f != 1.0 { box(scale(f * 100%, origin: top + left, reflow: true, body)) } else { body }
  let content-width = natural * f
  let left = if alignment == center { calc.max(0pt, (size.width - content-width) / 2) }
    else if alignment == right { calc.max(0pt, size.width - content-width) }
    else { 0pt }
  mathalea-anchor("figure", num, dx: left + content-width)
  pad(left: left)[#scaled]
})`

export const MATHALEA_FIGURE_HELPERS = `#let mathalea-label(x, y, body, angle: 0deg, size: auto, fill: auto) = {
  let content = if size == auto and fill == auto {
    body
  } else if fill == auto {
    text(size: size, body)
  } else if size == auto {
    text(fill: fill, body)
  } else {
    text(size: size, fill: fill, body)
  }
  (x: x, y: y, angle: angle, body: content)
}

#let mathalea-figure(width, height, graphic, labels: ()) = box(width: width, height: height)[
  #place(top + left, graphic)
  #for label in labels {
    let body = if label.angle == 0deg {
      label.body
    } else {
      rotate(label.angle, origin: center, label.body)
    }
    // le label est centré sur son point : on mesure sa largeur naturelle et
    // on décale le placement de la moitié. Un placement par alignement dans
    // une ancre de largeur nulle contraindrait le label à 0pt et couperait
    // les formules à chaque opérateur (f(x) =, -2x +, 3...).
    context {
      let m = measure(box(body))
      place(top + left, dx: label.x - m.width / 2, dy: label.y - m.height / 2, box(body))
    }
  }
]`

/** Import du paquet taskize (mise en colonnes des propositions de QCM) */
export const TASKIZE_IMPORT = '#import "@preview/taskize:0.2.6": tasks'

/**
 * Aides Typst pour les QCM : une case à cocher (vide dans l'énoncé, remplie
 * pour la bonne réponse dans le corrigé) et le nombre de colonnes réglable.
 */
export const MATHALEA_QCM_HELPERS =
  '#let qcm-bonne(corps) = text(fill: couleur, weight: "bold", corps)'

/**
 * Aide Typst pour les schémas en barres (SchemaEnBoite) : une accolade ou une
 * flèche étirée sur toute la largeur de sa cellule, avec son étiquette.
 */
export const MATHALEA_SCHEMA_HELPER = `#let mathalea-schema-span(label, kind: "brace", flip: false, color: black) = layout(size => {
  let deco = text(fill: color, size: 0.9em,
    if kind == "arrow" {
      $ stretch(<->, size: #size.width) $
    } else if flip {
      $ stretch(brace.b, size: #size.width) $
    } else {
      $ stretch(brace.t, size: #size.width) $
    })
  let lbl = align(center, text(fill: color, label))
  if flip { stack(spacing: 2pt, deco, lbl) } else { stack(spacing: 2pt, lbl, deco) }
})`

const LATEX_SIZE_TO_TYPST_SIZE: Record<string, string> = {
  tiny: '0.55em',
  scriptsize: '0.7em',
  footnotesize: '0.8em',
  small: '0.9em',
  normalsize: '1em',
  large: '1.2em',
  Large: '1.44em',
  LARGE: '1.73em',
  huge: '2.07em',
  Huge: '2.49em',
}

const LATEX_SIZE_COMMANDS = Object.keys(LATEX_SIZE_TO_TYPST_SIZE)
  .sort((a, b) => b.length - a.length)
  .join('|')

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

/**
 * Remplace les blocs `$…$` en tenant compte des accolades : un `$` situé
 * dans un `{…}` (mode texte d'un `\text{…}`) ne referme pas le bloc. Sans
 * cela, `$387\text{ m$^2$/h}…$` serait coupé au premier `$` intérieur.
 */
function replaceBalancedInlineMath(
  text: string,
  convert: (tex: string) => string,
): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    if (text[i] !== '$') {
      out += text[i]
      i++
      continue
    }
    // début d'un bloc : cherche le `$` fermant au niveau d'accolade 0
    let depth = 0
    let close = -1
    for (let j = i + 1; j < text.length; j++) {
      const ch = text[j]
      if (ch === '{') depth++
      else if (ch === '}') {
        if (depth > 0) depth--
      } else if (ch === '$' && depth === 0) {
        close = j
        break
      }
    }
    if (close === -1) {
      // `$` non apparié : laissé tel quel
      out += text[i]
      i++
      continue
    }
    out += convert(text.slice(i + 1, close))
    i = close + 1
  }
  return out
}

/** Prépare une formule LaTeX de MathALÉA avant sa conversion par tex2typst */
function preprocessTex(tex: string): string {
  // les jetons de protection htmlToTypst (\uE000N\uE001) ne sont pas du LaTeX
  // valide ; ils peuvent fuir dans un bloc $…$ via des $$ adjacents — on les supprime
  let output = replaceColorGroups(
    decodeEntities(tex.replace(/\uE000\d+\uE001/g, '')),
  )
  output = stripLatexSizeCommands(output)
  // Unités écrites avec des $ imbriqués dans \text{} (ex. `m$^2$`,
  // `$\text{cm}^2$` de MathALÉA) : à l'intérieur de \text{}, `$…$` rebascule
  // en mode mathématique. On sort explicitement du texte pour cette partie :
  // `\text{ m$^2$/h}` → `\text{ m}^2\text{/h}` (que tex2typst convertit en
  // `" m"^2 "/h"`). Répété pour plusieurs $…$ dans un même \text{}.
  let prevNested = ''
  while (prevNested !== output) {
    prevNested = output
    output = output.replace(
      /\\text\s*\{([^{}$]*)\$([^$]+)\$([^{}$]*)\}/g,
      // n'émet pas de \text{} vide (tex2typst échoue sur un texte vide)
      (_, before: string, math: string, after: string) =>
        `${before ? `\\text{${before}}` : ''}${math}${after ? `\\text{${after}}` : ''}`,
    )
  }
  // \textit{} en mode math → \text{} (tex2typst ne reconnaît pas \textit)
  output = output.replace(/\\textit\s*\{/g, '\\text{')
  // \text{\textbf{X}} ou \text{\textit{X}} : tex2typst ne supporte pas les
  // commandes LaTeX imbriquées dans \text{} — on supprime le wrapper interne
  output = output.replace(
    /\\text\s*\{\s*\\text(?:bf|it)\s*\{([^{}]*)\}\s*\}/g,
    '\\text{$1}',
  )
  // \textbf en mode mathématique (produit par miseEnEvidence)
  output = output.replace(/\\textbf\s*\{/g, '\\mathbf{')
  // \textbf sans accolades (\textbf, ou \textbf; etc.) : suppression de la commande
  output = output.replace(/\\textbf(?!\s*\{)/g, '')
  // \boldsymbol{X} → \mathbf{X} (tex2typst ne connaît pas \boldsymbol)
  output = output.replace(/\\boldsymbol\s*\{/g, '\\mathbf{')
  // \texttt{X} → \text{X} (police machine à écrire, tex2typst décompose lettre par lettre)
  output = output.replace(/\\texttt\s*\{/g, '\\text{')
  // \text X (sans accolades, token unique) → \text{X} (tex2typst exige les accolades)
  output = output.replace(/\\text\s+([^{\\])/g, '\\text{$1}')
  // " en mode math : Typst traite " comme délimiteur de chaîne → on le remplace par ''
  output = output.replace(/"/g, "''")
  // \color{X}{CONTENT} (forme deux-arguments) → \textcolor{X}{CONTENT}
  // replaceColorGroups gère {\color{X}...} ; ici on traite \color{X}{...}
  output = output.replace(/\\color\s*\{([^{}]+)\}\s*\{/g, '\\textcolor{$1}{')
  // \color{X} (sans accolades de contenu) — commande de scope LaTeX non supportée
  // par tex2typst qui la passe telle quelle → on la supprime
  output = output.replace(/\\color\s*\{[^{}]+\}/g, '')
  // \big, \Big, \bigg, \Bigg (avec suffixes l/r/m optionnels) : tex2typst
  // laisse les variantes sans suffixe comme variable nue — on les supprime
  output = output.replace(/\\[Bb]igg?[lrm]?\b/g, '')
  // \{ et \} (accolades littérales en mode math, ex. ensemble {a; b}) :
  // tex2typst les convertit en { et } nus → en Typst math, { est un délimiteur
  // de groupe, non un glyphe → erreur "unclosed delimiter".
  // On remplace par \lbrace / \rbrace que tex2typst convertit correctement en
  // brace.l / brace.r (glyphes Typst pour les accolades affichées).
  output = output.replace(/\\{/g, '\\lbrace ')
  output = output.replace(/\\}/g, '\\rbrace ')
  // ; en mode mathématique : Typst l'interprète comme séparateur de lignes
  // dans mat() et vec() (ex. M(a;b) → erreur "expected content, found array")
  // → on le neutralise via \text{;} sauf s'il fait partie de \; (espace)
  output = output.replace(/(?<!\\);/g, '\\text{;}')
  // Les \text{} imbriqués (produits par le remplacement des ; ou par \text{\text{m}}) :
  // \text{ \text{;} } → \text{ ; }  ou  \text{ \text{m} } → \text{ m }
  // On répète deux fois pour gérer les doubles imbrications
  output = output.replace(
    /\\text\{([^{}]*?)\\text\{([^{}]*?)\}([^{}]*?)\}/g,
    '\\text{$1$2$3}',
  )
  output = output.replace(
    /\\text\{([^{}]*?)\\text\{([^{}]*?)\}([^{}]*?)\}/g,
    '\\text{$1$2$3}',
  )
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
  // \\[dim] (saut de ligne avec espacement optionnel, ex. dans \begin{cases}) :
  // tex2typst ne supporte pas l'argument optionnel — on le supprime
  output = output.replace(/\\\\\s*\[[^\]]*\]/g, '\\\\')
  // \phantom / \vphantom n'ont pas d'équivalent direct : on les remplace par une espace.
  // Le contenu peut avoir un niveau d'imbrication (ex. \phantom{\frac{a}{b}})
  // → [^{}]|\{[^{}]*\} capture les groupes imbriqués
  output = output.replace(
    /\\(?:phantom|hphantom|vphantom)\s*\{(?:[^{}]|\{[^{}]*\})*\}/g,
    '\\;',
  )
  // Contenu LaTeX avec un niveau d'imbrication de {} (ex. \xrightarrow{+x~\text{min}})
  const B1 = '(?:[^{}]|\\{[^{}]*\\})*'
  // \xrightarrow{X} → \overset{X}{\rightarrow} (tex2typst ne connaît pas \xrightarrow)
  output = output.replace(
    new RegExp(`\\\\xrightarrow\\s*(?:\\[[^\\]]*\\])?\\s*\\{(${B1})\\}`, 'g'),
    '\\overset{$1}{\\rightarrow}',
  )
  // \xleftarrow{X} → \overset{X}{\leftarrow}
  output = output.replace(
    new RegExp(`\\\\xleftarrow\\s*(?:\\[[^\\]]*\\])?\\s*\\{(${B1})\\}`, 'g'),
    '\\overset{$1}{\\leftarrow}',
  )
  // \stackrel{A}{B} → \overset{A}{B} (tex2typst ne connaît pas \stackrel)
  output = output.replace(/\\stackrel\s*\{/g, '\\overset{')
  // \bf{X} (ancienne commande LaTeX) → \mathbf{X}
  output = output.replace(/\\bf\s*\{/g, '\\mathbf{')
  // \fbox{X} → \text{[X]} (boîte autour du texte — approximation)
  output = output.replace(
    new RegExp(`\\\\fbox\\s*\\{(${B1})\\}`, 'g'),
    '\\text{[$1]}',
  )
  // \fcolorbox{bord}{fond}{X} → \text{[X]} (approximation)
  output = output.replace(
    new RegExp(
      `\\\\fcolorbox\\s*\\{[^{}]*\\}\\s*\\{[^{}]*\\}\\s*\\{(${B1})\\}`,
      'g',
    ),
    '\\text{[$1]}',
  )
  // \boxed{X} → \text{[X]} approximation (tex2typst produit "boxed x" qui est inconnu)
  output = output.replace(
    new RegExp(`\\\\boxed\\s*\\{(${B1})\\}`, 'g'),
    '\\text{[$1]}',
  )
  // \lvert..\rvert → |..|  /  \lVert..\rVert → ‖..‖
  output = output.replace(/\\lvert\b/g, '|').replace(/\\rvert\b/g, '|')
  output = output.replace(/\\lVert\b/g, '\\|').replace(/\\rVert\b/g, '\\|')
  // \leadstoH, \leadstoV, \leadsto* : flèches personnalisées MathALÉA → \rightarrow
  output = output.replace(/\\leadstoH\b/g, '\\rightarrow')
  output = output.replace(/\\leadstoV\b/g, '\\downarrow')
  // \circlearrowright / \circlearrowleft → flèche Typst
  output = output.replace(/\\circlearrowright\b/g, '\\rightarrow')
  output = output.replace(/\\circlearrowleft\b/g, '\\leftarrow')
  // \overgroup{X} → \overline{X} (approximation)
  output = output.replace(/\\overgroup\s*\{/g, '\\overline{')
  // \iffx → \Leftrightarrow (custom macro "si et seulement si")
  output = output.replace(/\\iffx\b/g, '\\Leftrightarrow')
  // \cfrac → \dfrac (tex2typst gère \dfrac ; \cfrac produit "cfrac")
  output = output.replace(/\\cfrac\b/g, '\\dfrac')
  // \empty → \emptyset (alias standard de l'ensemble vide, tex2typst → nothing)
  output = output.replace(/\\empty(?!set)\b/g, '\\emptyset')
  // \overset{\rule{w}{h}}{X} → \overline{X} : filet horizontal au-dessus d'un symbole
  // (utilisé pour le complément d'un événement, ex. \overset{\rule{0.8em}{0.08em}}{A})
  output = output.replace(
    new RegExp(
      `\\\\overset\\s*\\{\\\\rule\\s*\\{[^{}]*\\}\\s*\\{[^{}]*\\}\\}\\s*\\{(${B1})\\}`,
      'g',
    ),
    '\\overline{$1}',
  )
  // \rule{w}{h} résiduel → supprimé (ligne horizontale sans équivalent Typst direct)
  output = output.replace(/\\rule\s*\{[^{}]*\}\s*\{[^{}]*\}/g, '')
  // Couleurs LaTeX non reconnues par Typst → équivalents RGB
  // (tex2typst passe la couleur telle quelle ; Typst ne connaît que ses propres noms)
  output = output
    .replace(/\\textcolor\s*\{brown\}/g, '\\textcolor{#964B00}')
    .replace(/\\textcolor\s*\{violet\}/g, '\\textcolor{#7F00FF}')
    .replace(/\\textcolor\s*\{pink\}/g, '\\textcolor{#FF69B4}')
    .replace(/\\textcolor\s*\{darkgray\}/g, '\\textcolor{#555555}')
    .replace(/\\textcolor\s*\{lightgray\}/g, '\\textcolor{#D3D3D3}')
    .replace(/\\textcolor\s*\{lightgrey\}/g, '\\textcolor{#D3D3D3}')
    .replace(/\\textcolor\s*\{magenta\}/g, '\\textcolor{#FF00FF}')
    .replace(/\\textcolor\s*\{cyan\}/g, '\\textcolor{#00FFFF}')
    .replace(/\\textcolor\s*\{none_2\}/g, '')
    .replace(/\\textcolor\s*\{none_?\}/g, '')
    .replace(/\\textcolor\s*\{none\}/g, '')
  // Même chose pour {\color{X}...} que replaceColorGroups aura déjà converti en \textcolor
  // (si le nom de couleur n'est pas reconnu, on traite aussi le cas \color{X} restant)
  output = output
    .replace(/\{\\color\s*\{brown\}([^}]*)\}/g, '\\textcolor{#964B00}{$1}')
    .replace(/\{\\color\s*\{violet\}([^}]*)\}/g, '\\textcolor{#7F00FF}{$1}')
  // \hspace*{0.4cm} : tex2typst produirait `#h(*) 0.4 c m` (étoile invalide) ;
  // ces espaces servent surtout à élargir des colonnes, on les neutralise
  output = output.replace(/\\hspace\s*\*?\s*\{[^{}]*\}/g, '\\;')
  // & d'alignement hors environnement (ex. `a \leqslant & b \\ c & d`) :
  // on enveloppe dans \begin{aligned}...\end{aligned} pour que tex2typst
  // accepte la formule sans erreur
  if (
    output.includes('&') &&
    !/\\begin\{(?:array|tabular|tblr|align|aligned|alignedat|cases)\}/.test(
      output,
    )
  ) {
    output = `\\begin{aligned}${output}\\end{aligned}`
  }
  // Mot comportant une lettre latine accentuée et non protégé par \text{}
  // (erreur d'auteur d'exercice, ex. `n^{ième}` ou `à` oubliés hors de
  // \text{}) : tex2typst décompose un tel mot lettre par lettre en
  // identifiants nus (`n^{ième}` → `n^(i è m e)`), ce qui isole chaque
  // lettre accentuée comme un caractère seul en mode maths. Certaines
  // polices maths (ex. Noto Sans Math) n'ont pas ces glyphes précomposés :
  // Typst refuse alors de les afficher (« shaping ... yielded more than
  // one glyph »), quelle que soit la police de repli. On protège d'abord
  // les \text{} déjà présents (ne doivent pas être ré-enveloppés), puis on
  // enveloppe tout mot accentué restant dans \text{} : tex2typst le rend
  // alors en chaîne Typst, toujours affichée correctement quelle que soit
  // la police maths active (contrairement à un caractère nu).
  {
    const protectedTextBlocks: string[] = []
    output = output.replace(/\\text\s*\{[^{}]*\}/g, (match) => {
      protectedTextBlocks.push(match)
      return `${protectedTextBlocks.length - 1}`
    })
    output = output.replace(
      /[a-zA-Z]*[àâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ][a-zA-ZàâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ-]*/g,
      (word) => `\\text{${word}}`,
    )
    output = output.replace(
      /(\d+)/g,
      (_, i: string) => protectedTextBlocks[Number(i)],
    )
  }
  // Marque le contenu des \text{…} qui contient une lettre, y compris
  // accentuée (unités, mots), pour le rendre ensuite avec la police du texte
  // via #txt. La ponctuation seule (\text{,} décimale, \text{;}) n'est pas
  // marquée : elle reste collée. Un mot entièrement accentué (ex. « à »,
  // sans lettre ASCII) doit être marqué comme les autres : laissé en chaîne
  // Typst nue, il hérite de la police maths ambiante, dont le repli
  // automatique de glyphe peut mal composer un accent en position
  // d'exposant/indice (accent flottant au lieu du caractère composé).
  output = output.replace(
    /\\text\s*\{([^{}]*[a-zA-ZàâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ][^{}]*)\}/g,
    `\\text{${TXT_MARK_OPEN}$1${TXT_MARK_CLOSE}}`,
  )
  return output
}

/** Marqueurs (zone privée Unicode) délimitant le texte à rendre via #txt */
const TXT_MARK_OPEN = '\uE010'
const TXT_MARK_CLOSE = '\uE011'

/** Corrige la sortie de tex2typst pour qu'elle compile avec Typst */
function postprocessTypst(typst: string): string {
  let result = typst
    // Texte marqué (unités, mots issus de \text{…}) : rendu avec la police
    // du texte via #txt. tex2typst a transformé \text{⟨mark⟩X⟨mark⟩} en la
    // chaîne "⟨mark⟩X⟨mark⟩" ; on la remplace par #txt("X"). Un indice ou
    // exposant (`_"…"`, `^"…"`) reçoit des parenthèses pour rester valide.
    .replace(
      new RegExp(`([_^]?)"${TXT_MARK_OPEN}([^"]*)${TXT_MARK_CLOSE}"`, 'g'),
      (_m, script: string, body: string) =>
        script ? `${script}(#txt("${body}"))` : `#txt("${body}")`,
    )
    // tex2typst émet `fill: #f15929` pour \textcolor : Typst attend rgb("...")
    .replace(
      /fill: #([0-9a-fA-F]{3,8})\b/g,
      (_, hex: string) => `fill: rgb("#${hex}")`,
    )
    // Les labels mathalea2d peuvent fournir des couleurs HTML sans `#`.
    .replace(
      /fill: ([0-9a-fA-F]{3,8})\b/g,
      (_, hex: string) => `fill: rgb("#${hex}")`,
    )
    // tex2typst laisse parfois passer les macros LaTeX explicites
    // \thinspace, \medspace, \thickspace, absentes de Typst.
    .replace(/\bthinspace\b/g, 'thin')
    .replace(/\bmedspace\b/g, 'med')
    .replace(/\bthickspace\b/g, 'thick')
    .replace(/\bnegthinspace\b/g, '#h(-math.thin.amount)')

  // tex2typst produit #text(fill: C)[$math$] pour \textcolor{C}{math} :
  // les $ imbriqués font sortir du mode math → "unclosed delimiter".
  // → on convertit en text(fill: C, math). Les couleurs imbriquées (ex.
  //   #text(fill: A)[$x + #text(fill: B)[$y$]$]) nécessitent de traiter
  //   l'intérieur en premier : on itère jusqu'à ce qu'il n'y ait plus de match.
  // Le fill peut être `rgb("#hex")` (parens imbriquées) → on le match explicitement
  // avant le fallback [^)]+.
  const colorRe = /#text\(fill: (rgb\("[^"]*"\)|[^)]+)\)\[\$([^$]*)\$\]/g
  let prev = ''
  while (prev !== result) {
    prev = result
    result = result.replace(colorRe, (_, fill: string, math: string) => {
      // Résout la couleur pour le mode code Typst :
      // – rgb(...) → #rgb(...) (appel de fonction Typst)
      // – noms CSS absents de Typst (ex. lightgray) → #rgb("#hex") via NAMED_COLOR_TO_HEX
      // – none / none_2 / transparent → supprimer la couleur, garder le contenu
      // – noms Typst natifs (black, red…) → #nom (variable Typst)
      // – littéraux hex (#F15929) → inchangés (littéral couleur Typst)
      const lower = fill.toLowerCase()
      if (/^none/.test(lower)) return math
      let mathFill: string
      if (/^rgb\(/.test(fill)) {
        mathFill = `#${fill}`
      } else if (lower in NAMED_COLOR_TO_HEX) {
        mathFill = `#rgb("${NAMED_COLOR_TO_HEX[lower]}")`
      } else if (/^[a-z]/.test(fill)) {
        mathFill = `#${fill}`
      } else {
        mathFill = fill
      }
      return `text(fill: ${mathFill}, ${math})`
    })
  }

  result = result
    // \mathbf{[}, \mathbf{]}, \textbf{[} etc. produisent upright(bold([)) ou bold([) en
    // Typst mathématique : [ est interprété comme délimiteur ouvrant → "unclosed delimiter".
    // On remplace par bracket.l / bracket.r (glyphes Typst).
    .replace(/\bupright\(bold\(\[+\)\)/g, 'upright(bold(bracket.l))')
    .replace(/\bupright\(bold\(\]+\)\)/g, 'upright(bold(bracket.r))')
    .replace(/\bbold\(\[+\)\b/g, 'bold(bracket.l)')
    .replace(/\bbold\(\]+\)\b/g, 'bold(bracket.r)')
    .replace(/\bupright\(\[+\)\b/g, 'upright(bracket.l)')
    .replace(/\bupright\(\]+\)\b/g, 'upright(bracket.r)')
    // \mathbf{)} produit bold() vide (le ) ferme immédiatement bold() sans contenu).
    // bold() sans corps → "missing argument: body" dans Typst. On remplace par paren.r.
    .replace(/\bupright\(bold\(\)\)/g, 'upright(bold(paren.r))')
    .replace(/\bbold\(\)\b/g, 'bold(paren.r)')

  // \left[...\right] dans \mathbf{} produit [...] (crochets nus). Si plusieurs [A]×[B]
  // se suivent, la séquence ]×[ crée de faux intervalles. On convertit TOUTES les paires
  // équilibrées [...] en bracket.l/bracket.r sans délimiteurs actifs.
  // Cas 1 (contenu non-alphabétique, ex. [(-6)×(-6)]) et Cas 2 (contenu purement
  // alphabétique, ex. [union]) doivent s'enchaîner : Cas 2 peut réduire une paire
  // imbriquée (ex. [-4;-2[union]3;4], produit par un intervalle-union où le "[union]"
  // interne coïncide textuellement avec une paire de crochets) à une paire simple que
  // Cas 1 doit ensuite traiter — d'où la boucle jusqu'à stabilité. Le Cas 1 exclut
  // explicitement [ et ] de son caractère « spécial » central pour ne jamais franchir
  // une paire imbriquée non encore réduite par le Cas 2 (sinon la paire imbriquée est
  // engloutie dans une capture bancale qui laisse un crochet orphelin).
  {
    let prevBrackets = ''
    while (prevBrackets !== result) {
      prevBrackets = result
      result = result
        .replace(
          /\[([^\[\]]*[^a-zA-Z \t\[\]][^\[\]]*)\]/g,
          'lr(bracket.l $1 bracket.r)',
        )
        // Contexte 2a : [union] ou [ union ] entre délimiteurs ']' et '[' —
        //   on enlève les crochets : ]A[union]B[ → ]A union B[ → règle ] suivante.
        // Contexte 2b : ']'+espaces+mot+espaces+'[' — l'opérateur d'ensemble (\cup, \cap)
        //   apparaît ENTRE deux crochets d'intervalles ; on doit aussi l'extraire.
        // Traitement unifié : tous les [alpha+] et ]alpha+[ sans autre contenu sont nettoyés.
        .replace(/\[([a-zA-Z ]+)\]/g, ' $1 ')
        // ]opérateur[ (ex. ]\cup[ devenu ] union [) entre deux délimiteurs d'intervalles :
        // supprimer les crochets parasites autour du mot pour que l'intervalle englobant
        // soit correctement reconnu par la règle ]...[  ci-après.
        .replace(/\] {0,4}([a-zA-Z]+) {0,4}\[/g, ' $1 ')
    }
  }

  return (
    result
      // tex2typst produit #none_N pour un indice sans base LaTeX (ex. $_2$) →
      // variable inconnue en Typst. On supprime le préfixe invalide.
      .replace(/#none_\w+/g, '')
      // tex2typst convertit \left]...\right[ en lr(]...[), \left[...\right[ en
      // lr([...[). En Typst, ] et [ juste après/avant lr()/lr() sont parsés comme
      // délimiteurs → "unclosed delimiter". On remplace par bracket.r/bracket.l.
      // Cas 1 : ]...[ → intervalles ouverts
      .replace(/lr\(\]([^\[\]]*)\[\)/g, 'lr(bracket.r $1 bracket.l)')
      // Cas 2 : [...[ → semi-ouvert fermé à gauche, ouvert à droite
      .replace(/lr\(\[([^\[\]]*)\[\)/g, 'lr(bracket.l $1 bracket.l)')
      // Cas 3 : ]...] → semi-ouvert ouvert à gauche, fermé à droite
      .replace(/lr\(\]([^\[\]]*)\]\)/g, 'lr(bracket.r $1 bracket.r)')
      // Cas 4 : crochet + parenthèse mixtes (demi-droite [Oz), intervalle [a;b))
      // produits par \left[…\right) → lr([… )). Le crochet resterait non fermé.
      .replace(/lr\(\[([^\[\]()]*)\)\)/g, 'lr(bracket.l $1 paren.r)')
      .replace(/lr\(\(([^\[\]()]*)\]\)/g, 'lr(paren.l $1 bracket.r)')
      // Intervalles français nus (sans \left\right) : ]a;b[, ]a;b], [a;b[
      // (après le traitement des lr(), il ne reste que des crochets résiduels)
      // L'espace initial évite la concaténation d'identifiants : tex2typst peut
      // coller des symboles contre ] sans espace (ex. "union]" → "union lr(…)").
      .replace(/\]([^\[\]]*)\[/g, ' lr(bracket.r $1 bracket.l)')
      .replace(/\]([^\[\]]*)\]/g, ' lr(bracket.r $1 bracket.r)')
      .replace(/\[([^\[\]]*)\[/g, ' lr(bracket.l $1 bracket.l)')
      // demi-droites / intervalles mixtes nus ([Oz), (a;b]) : crochet et
      // parenthèse dépareillés → délimiteurs explicites dans un lr()
      .replace(/\[([^\[\]()]*)\)/g, ' lr(bracket.l $1 paren.r)')
      .replace(/\(([^\[\]()]*)\]/g, ' lr(paren.l $1 bracket.r)')
      // virgule décimale : Typst la colle aux chiffres seulement si la
      // chaîne `","` est écrite sans espaces autour
      .replace(/(\d) ?"," ?(?=\d)/g, '$1","')
  )
}

/**
 * En Typst math, `(` est un délimiteur groupant qui doit toujours être fermé.
 * Quand un bloc $…$ est un fragment d'expression (ex. $)\times(4$ dans une
 * phrase mixte), les parenthèses peuvent être déséquilibrées et provoquer
 * « unclosed delimiter ». On remplace les ( et ) orphelins par paren.l / paren.r.
 */
function balanceTypstMathParens(s: string): string {
  // Passe 1 : aller de gauche à droite, remplacer les ) sans ( précédent
  let depth = 0
  let pass1 = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') {
      depth++
      pass1 += ch
    } else if (ch === ')') {
      if (depth > 0) {
        depth--
        pass1 += ch
      } else {
        pass1 += 'paren.r '
      }
    } else {
      pass1 += ch
    }
  }
  // Passe 2 : aller de droite à gauche, remplacer les ( sans ) suivant
  depth = 0
  let pass2 = ''
  for (let i = pass1.length - 1; i >= 0; i--) {
    const ch = pass1[i]
    if (ch === ')') {
      depth++
      pass2 = ch + pass2
    } else if (ch === '(') {
      if (depth > 0) {
        depth--
        pass2 = ch + pass2
      } else {
        pass2 = ' paren.l ' + pass2
      }
    } else {
      pass2 = ch + pass2
    }
  }
  return pass2
}

function readBraced(
  text: string,
  openIndex: number,
): { value: string; end: number } | null {
  if (text[openIndex] !== '{') return null
  let depth = 0
  for (let index = openIndex; index < text.length; index++) {
    const char = text[index]
    if (char === '\\') {
      index++
      continue
    }
    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) {
        return { value: text.slice(openIndex + 1, index), end: index + 1 }
      }
    }
  }
  return null
}

function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let arrayDepth = 0
  let start = 0
  for (let index = 0; index < text.length; index++) {
    if (text.startsWith('\\begin{array}', index)) {
      arrayDepth++
      index += '\\begin{array}'.length - 1
      continue
    }
    if (text.startsWith('\\end{array}', index)) {
      arrayDepth = Math.max(0, arrayDepth - 1)
      index += '\\end{array}'.length - 1
      continue
    }
    const char = text[index]
    if (char === '\\') {
      index++
      continue
    }
    if (char === '{') depth++
    else if (char === '}') depth = Math.max(0, depth - 1)
    else if (char === separator && depth === 0 && arrayDepth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

function stripLatexSizeCommands(text: string): string {
  let output = ''
  let index = 0
  // fin de commande = tout sauf une lettre : `\large5` est du LaTeX valide,
  // et `\b` ne coupe pas entre une lettre et un chiffre
  const sizeCommand = new RegExp(
    `\\\\(${LATEX_SIZE_COMMANDS})(?![a-zA-Z])`,
    'g',
  )
  while (index < text.length) {
    sizeCommand.lastIndex = index
    const match = sizeCommand.exec(text)
    if (match == null) {
      output += text.slice(index)
      break
    }
    output += text.slice(index, match.index)
    let cursor = match.index + match[0].length
    while (/\s/.test(text[cursor] ?? '')) cursor++
    if (text[cursor] === '{') {
      const arg = readBraced(text, cursor)
      if (arg != null) {
        output += arg.value
        index = arg.end
        continue
      }
    }
    index = cursor
  }
  return output
}

function findMatchingEndEnvironment(
  text: string,
  env: string,
  bodyStart: number,
): number {
  const begin = `\\begin{${env}}`
  const end = `\\end{${env}}`
  let depth = 1
  let cursor = bodyStart
  while (cursor < text.length) {
    const nextBegin = text.indexOf(begin, cursor)
    const nextEnd = text.indexOf(end, cursor)
    if (nextEnd === -1) return -1
    if (nextBegin !== -1 && nextBegin < nextEnd) {
      depth++
      cursor = nextBegin + begin.length
    } else {
      depth--
      if (depth === 0) return nextEnd
      cursor = nextEnd + end.length
    }
  }
  return -1
}

function expandColumnSpecRepeats(spec: string): string {
  let output = spec
  for (let guard = 0; guard < 10; guard++) {
    const next = output.replace(
      /\*\s*\{(\d+)\}\s*\{([^{}]*)\}/g,
      (_, count: string, content: string) => content.repeat(Number(count)),
    )
    if (next === output) break
    output = next
  }
  return output
}

function removeColumnSpecModifiers(spec: string): string {
  let output = spec
  for (const marker of ['>', '<']) {
    let index = 0
    let rebuilt = ''
    while (index < output.length) {
      const start = output.indexOf(`${marker}{`, index)
      if (start === -1) {
        rebuilt += output.slice(index)
        break
      }
      rebuilt += output.slice(index, start)
      const arg = readBraced(output, start + marker.length)
      if (arg == null) {
        rebuilt += output[start]
        index = start + 1
      } else {
        index = arg.end
      }
    }
    output = rebuilt
  }
  return output
}

interface ParsedColumnSpec {
  aligns: ('left' | 'center' | 'right')[]
  vlines: number[]
}

function parseLatexColumnSpec(
  spec: string,
  fallbackColumns = 0,
): ParsedColumnSpec {
  const normalized = removeColumnSpecModifiers(expandColumnSpecRepeats(spec))
  const aligns: ('left' | 'center' | 'right')[] = []
  const vlines: number[] = []
  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index]
    if (char === '|') {
      vlines.push(aligns.length)
    } else if (char === 'l') {
      aligns.push('left')
    } else if (char === 'c' || char === 'X' || char === 'S') {
      aligns.push('center')
    } else if (char === 'r') {
      aligns.push('right')
    } else if (['p', 'm', 'b'].includes(char)) {
      aligns.push('left')
      while (
        index + 1 < normalized.length &&
        /\s/.test(normalized[index + 1])
      ) {
        index++
      }
      if (normalized[index + 1] === '{') {
        const arg = readBraced(normalized, index + 1)
        if (arg != null) index = arg.end - 1
      }
    }
  }
  while (aligns.length < fallbackColumns) aligns.push('center')
  return { aligns, vlines: [...new Set(vlines)] }
}

function parseTblrOptions(options: string): {
  colspec: string
  hlines: boolean
  vlines: boolean
} {
  const colspecMatch = options.match(/colspec\s*=\s*\{([^}]*)\}/)
  return {
    colspec: colspecMatch?.[1] ?? '',
    hlines: /(?:^|,)\s*hlines\s*(?:,|$)/.test(options),
    vlines: /(?:^|,)\s*vlines\s*(?:,|$)/.test(options),
  }
}

type ParsedTableItem = { type: 'hline' } | { type: 'row'; cells: string[] }

function parseLatexTableBody(body: string): ParsedTableItem[] {
  const items: ParsedTableItem[] = []
  let row = ''
  const pushRow = () => {
    const cells = splitTopLevel(row, '&').map((cell) => cell.trim())
    if (cells.some((cell) => cell.length > 0))
      items.push({ type: 'row', cells })
    row = ''
  }

  // Un `array` imbriqué dans une cellule ne doit pas voir ses `\\`/`\hline`
  // interprétés comme des séparateurs du tableau extérieur.
  let arrayDepth = 0
  for (let index = 0; index < body.length; index++) {
    if (body.startsWith('\\begin{array}', index)) {
      arrayDepth++
      row += '\\begin{array}'
      index += '\\begin{array}'.length - 1
    } else if (body.startsWith('\\end{array}', index)) {
      arrayDepth = Math.max(0, arrayDepth - 1)
      row += '\\end{array}'
      index += '\\end{array}'.length - 1
    } else if (arrayDepth > 0) {
      row += body[index]
    } else if (body.startsWith('\\hline', index)) {
      pushRow()
      items.push({ type: 'hline' })
      index += '\\hline'.length - 1
    } else if (body.startsWith('\\cline', index)) {
      pushRow()
      items.push({ type: 'hline' })
      index += '\\cline'.length
      while (/\s/.test(body[index] ?? '')) index++
      const arg = readBraced(body, index)
      if (arg != null) index = arg.end - 1
    } else if (body.startsWith('\\tabularnewline', index)) {
      pushRow()
      index += '\\tabularnewline'.length - 1
    } else if (body.startsWith('\\\\', index)) {
      pushRow()
      index++
    } else {
      row += body[index]
    }
  }
  pushRow()
  return items
}

function stripCellLatex(cell: string): string {
  return cell
    .replace(/\\cellcolor(?:\[[^\]]+\])?\s*\{[^{}]*\}/g, '')
    .replace(
      /\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle)\b/g,
      '',
    )
    .replace(/\\(?:centering|arraybackslash)\b/g, '')
    .replace(/\\rule\s*(?:\[[^\]]*\])?\s*\{[^{}]*\}\s*\{[^{}]*\}/g, '')
    .replace(/~/g, '\\;')
    .trim()
}

function unwrapWholeTextCommand(cell: string): string | null {
  const trimmed = cell.trim()
  if (!trimmed.startsWith('\\text')) return null
  const commandEnd = '\\text'.length
  let cursor = commandEnd
  while (/\s/.test(trimmed[cursor] ?? '')) cursor++
  const arg = readBraced(trimmed, cursor)
  if (arg == null || arg.end !== trimmed.length) return null
  return arg.value
}

/** Couleurs nommées CSS/LaTeX absentes de Typst, converties en hexadécimal */
const NAMED_COLOR_TO_HEX: Record<string, string> = {
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  gray: '#808080',
  grey: '#808080',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  lightblue: '#add8e6',
  lightgreen: '#90ee90',
  lightyellow: '#ffffe0',
  lightpink: '#ffb6c1',
  pink: '#ffc0cb',
  brown: '#964b00',
  violet: '#7f00ff',
  magenta: '#ff00ff',
  cyan: '#00ffff',
}

/** Couleurs nommées directement comprises par Typst */
const TYPST_NAMED_COLORS = new Set([
  'black',
  'white',
  'silver',
  'navy',
  'blue',
  'aqua',
  'teal',
  'eastern',
  'purple',
  'fuchsia',
  'maroon',
  'red',
  'orange',
  'yellow',
  'olive',
  'green',
  'lime',
])

/**
 * Convertit une couleur (CSS `rgb(...)`, hexadécimale ou nommée) en une
 * expression Typst, ou `null` si la couleur est absente/transparente.
 */
function colorToTypst(raw: string): string | null {
  const color = raw.trim().toLowerCase()
  if (color === '' || color === 'transparent' || color === 'inherit') {
    return null
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)/)
  if (rgb != null) {
    const parts = rgb[1].split(',').map((part) => part.trim())
    if (parts.length >= 3) return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`
  }
  const hex = color.replace(/^#/, '')
  if (/^(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) {
    return `rgb("#${hex}")`
  }
  if (color in NAMED_COLOR_TO_HEX) return `rgb("${NAMED_COLOR_TO_HEX[color]}")`
  if (TYPST_NAMED_COLORS.has(color)) return color
  return null
}

/** Extrait `\cellcolor{...}` (ou `\cellcolor[HTML]{...}`) d'une cellule LaTeX */
function extractCellColor(cell: string): {
  color: string | null
  rest: string
} {
  const match = cell.match(/\\cellcolor(\[[^\]]+\])?\s*\{([^{}]*)\}/)
  if (match == null) return { color: null, rest: cell }
  const raw = match[1] === '[HTML]' ? `#${match[2]}` : match[2]
  return { color: colorToTypst(raw), rest: cell.replace(match[0], '') }
}

/** Cellule d'un tableau Typst : contenu déjà converti et couleur de fond */
interface TypstTableCell {
  body: string
  fill: string | null
}

function latexTableCell(cell: string): TypstTableCell {
  const { color, rest } = extractCellColor(cell)
  const stripped = stripCellLatex(rest)
  if (stripped.length === 0) return { body: '', fill: color }
  const textContent = unwrapWholeTextCommand(stripped)
  if (textContent != null) {
    return { body: escapeTypstText(textContent), fill: color }
  }
  return { body: `$${latexMathToTypst(stripped)}$`, fill: color }
}

function formatTypstArray(values: string[]): string {
  if (values.length === 0) return '()'
  return `(${values.join(', ')},)`
}

function stripArrayStretchCommands(text: string): string {
  return text
    .replace(/\\def\s*\\arraystretch\s*\{[\d.]+\}/g, '')
    .replace(/\\renewcommand\s*\{\\arraystretch\}\s*\{[\d.]+\}/g, '')
    .trim()
}

interface LatexTableEnvironment {
  env: 'array' | 'tabular' | 'tblr'
  start: number
  end: number
  colspec: string
  body: string
  stretch: number
  hlines: boolean
  vlines: boolean
}

function findLatexTableEnvironment(tex: string): LatexTableEnvironment | null {
  const match = /\\begin\{(array|tabular|tblr)\}/.exec(tex)
  if (match == null || match.index == null) return null
  const env = match[1] as LatexTableEnvironment['env']
  let cursor = match.index + match[0].length
  while (/\s/.test(tex[cursor] ?? '')) cursor++
  const firstArg = readBraced(tex, cursor)
  if (firstArg == null) return null
  cursor = firstArg.end
  const bodyStart = cursor
  const bodyEnd = findMatchingEndEnvironment(tex, env, bodyStart)
  if (bodyEnd === -1) return null
  const body = tex.slice(bodyStart, bodyEnd)
  const end = bodyEnd + `\\end{${env}}`.length
  let colspec = firstArg.value
  let hlines = false
  let vlines = false
  if (env === 'tblr') {
    const options = parseTblrOptions(firstArg.value)
    colspec = options.colspec
    hlines = options.hlines
    vlines = options.vlines
  }
  const prefix = tex.slice(0, match.index)
  const stretchMatch =
    prefix.match(/\\def\s*\\arraystretch\s*\{([\d.]+)\}/) ??
    prefix.match(/\\renewcommand\s*\{\\arraystretch\}\s*\{([\d.]+)\}/)
  return {
    env,
    start: match.index,
    end,
    colspec,
    body,
    stretch: stretchMatch != null ? Number(stretchMatch[1]) : 1,
    hlines,
    vlines,
  }
}

function shouldConvertAsVisualTable(table: LatexTableEnvironment): boolean {
  if (table.env === 'tabular' || table.env === 'tblr') return true
  return (
    table.colspec.includes('|') ||
    /\\(?:hline|cline|tabularnewline)\b/.test(table.body)
  )
}

/**
 * Rend un tableau au format Typst natif (`#table(...)`).
 * Une grille entièrement bordée (cas des tableaux MathALÉA) utilise un
 * `stroke` global ; sinon les traits sont posés un à un. L'interligne
 * (`inset.y`) reprend le `\arraystretch` LaTeX, qui n'est pas géré par
 * tex2typst.
 */
function renderTypstTable(
  aligns: ('left' | 'center' | 'right')[],
  rows: TypstTableCell[][],
  insetY: number,
  vlines: number[],
  hlineYs: number[],
): string {
  const columns = aligns.length
  const uniform = aligns.every((align) => align === aligns[0])
  const fullBorder =
    vlines.length === columns + 1 && hlineYs.length === rows.length + 1

  const header: string[] = [
    `columns: ${columns}`,
    uniform
      ? `align: ${aligns[0] ?? 'center'}`
      : `align: ${formatTypstArray(aligns)}`,
    `inset: (x: 5pt, y: ${insetY.toFixed(1)}pt)`,
    `stroke: ${fullBorder ? '0.5pt' : 'none'}`,
  ]

  const strokes: string[] = []
  if (!fullBorder) {
    for (const x of vlines) strokes.push(`table.vline(x: ${x}, stroke: 0.5pt)`)
    for (const y of hlineYs) strokes.push(`table.hline(y: ${y}, stroke: 0.5pt)`)
  }

  const cells = rows.map((row) =>
    Array.from({ length: columns }, (_, index) => {
      const cell = row[index] ?? { body: '', fill: null }
      return cell.fill != null
        ? `table.cell(fill: ${cell.fill})[${cell.body}]`
        : `[${cell.body}]`
    }).join(', '),
  )

  return `#table(\n  ${[...header, ...strokes, ...cells].join(',\n  ')},\n)`
}

function latexVisualTableToTypst(tex: string): string | null {
  const table = findLatexTableEnvironment(tex)
  if (table == null || !shouldConvertAsVisualTable(table)) return null

  const items = parseLatexTableBody(table.body)
  const rows: TypstTableCell[][] = []
  const hlineYs = new Set<number>()
  for (const item of items) {
    if (item.type === 'hline') hlineYs.add(rows.length)
    else rows.push(item.cells.map(latexTableCell))
  }
  const maxColumns = Math.max(0, ...rows.map((row) => row.length))
  if (maxColumns === 0) return null

  const parsedColumns = parseLatexColumnSpec(table.colspec, maxColumns)
  const aligns = parsedColumns.aligns.slice(0, maxColumns)
  while (aligns.length < maxColumns) aligns.push('center')
  const vlines = table.vlines
    ? Array.from({ length: maxColumns + 1 }, (_, index) => index)
    : [
        ...new Set(
          parsedColumns.vlines.filter(
            (line) => line >= 0 && line <= maxColumns,
          ),
        ),
      ]
  if (table.hlines && hlineYs.size === 0) {
    for (let y = 0; y <= rows.length; y++) hlineYs.add(y)
  }
  const insetY = Math.max(3, 3 * table.stretch)

  const converted = renderTypstTable(
    aligns,
    rows,
    insetY,
    vlines,
    [...hlineYs].sort((a, b) => a - b),
  )
  const before = stripArrayStretchCommands(tex.slice(0, table.start))
  const after = stripArrayStretchCommands(tex.slice(table.end))
  return [before, converted, after].filter(Boolean).join('\n')
}

/**
 * Convertit un tableau HTML MathALÉA (`table.tableauMathlive`, produit par
 * `tableauColonneLigne` et consorts) en `#table(...)` natif : chaque cellule
 * est reconvertie depuis son HTML (formules incluses) et sa couleur de fond
 * (`background-color`) est reportée.
 */
function htmlTableToTypst(table: HTMLTableElement, figures?: string[]): string {
  const rows: TypstTableCell[][] = []
  for (const tr of [...table.querySelectorAll('tr')]) {
    const cells = [...tr.children].filter(
      (child): child is HTMLTableCellElement =>
        child.tagName === 'TD' || child.tagName === 'TH',
    )
    if (cells.length === 0) continue
    rows.push(
      cells.map((cell) => ({
        body: htmlToTypst(cell.innerHTML, figures),
        fill: colorToTypst(cell.style.backgroundColor ?? ''),
      })),
    )
  }
  const maxColumns = Math.max(0, ...rows.map((row) => row.length))
  if (maxColumns === 0) return missingBox('tableau non converti')

  const aligns = Array.from({ length: maxColumns }, () => 'center' as const)
  const vlines = Array.from({ length: maxColumns + 1 }, (_, index) => index)
  const hlineYs = Array.from({ length: rows.length + 1 }, (_, index) => index)
  return renderTypstTable(aligns, rows, 4, vlines, hlineYs)
}

function latexSegmentToTypst(tex: string, display: boolean): string {
  const table = latexVisualTableToTypst(tex)
  if (table != null) return table
  const converted = latexMathToTypst(tex)
  if (converted.length === 0) return ''
  return display ? `$ ${converted} $` : `$${converted}$`
}

/**
 * Convertit une formule LaTeX en mathématiques Typst.
 * En cas d'échec, la formule est renvoyée telle quelle sous forme de
 * chaîne littérale (affichée verbatim dans le document).
 */
export function latexMathToTypst(tex: string): string {
  const trimmed = tex.trim()
  if (trimmed.length === 0) return ''

  function convert(preprocessed: string): string {
    return (
      balanceTypstMathParens(
        postprocessTypst(
          tex2typst(preprocessed, { customTexMacros: CUSTOM_TEX_MACROS }),
        )
          .trim()
          .replace(/(\s*\\)+$/, ''),
      )
        // filet de sécurité : aucun marqueur #txt ne doit fuir dans la sortie
        .replaceAll(TXT_MARK_OPEN, '')
        .replaceAll(TXT_MARK_CLOSE, '')
    )
  }

  const preprocessed = preprocessTex(trimmed)
  try {
    return convert(preprocessed)
  } catch {
    //   (espace insécable du HTML) échoue en mode math : on remplace par espace
    if (preprocessed.includes(' ')) {
      try {
        return convert(preprocessed.replaceAll(' ', ' '))
      } catch {
        /* fall through to literal */
      }
    }
    return `"${preprocessed.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: '\u00a0',
  emsp: '\u2003',
  ensp: '\u2002',
  thinsp: '\u2009',
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
  const cleaned = svg
    // attribut parasite tel que sérialisé par le DOM (`;=""`)
    .replace(/\s;=""/g, '')
    // point-virgule orphelin après la valeur d'un attribut
    .replace(/=\s*("[^"]*")\s*;/g, '=$1 ')
    // entités HTML indéfinies en XML
    .replace(/&nbsp;/g, '&#160;')
    // esperluettes nues
    .replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/\s+/g, ' ')
    // `currentColor` (fill/stroke/color, en attribut ou en style) hérite de
    // la couleur du texte ambiant dans le navigateur ; une fois le SVG extrait
    // et embarqué seul dans le PDF Typst, plus aucun ancêtre ne le résout et
    // le tracé devient invisible. On le remplace par du noir, la couleur du
    // document imprimé.
    .replace(/currentColor/g, 'black')
    // Le SVG mathalea2d est sérialisé sans `xmlns` (inutile en HTML, où le
    // contexte suffit à déterminer l'espace de noms). Une fois embarqué en
    // image autonome (`data:image/svg+xml` dans le PDF Typst), son absence
    // fait échouer le décodage : l'image ne s'affiche pas du tout.
    .replace(
      /<svg(?![\w-])(?![^>]*\bxmlns=)/i,
      '<svg xmlns="http://www.w3.org/2000/svg"',
    )
  return cleaned.replace(
    /<([a-zA-Z][\w:.-]*)([^<>]*)>/g,
    (_tag, name: string, attrs: string) => {
      const selfClosing = /\/\s*$/.test(attrs)
      const attrText = selfClosing ? attrs.replace(/\/\s*$/, '') : attrs
      const seen = new Set<string>()
      const parsed = [...attrText.matchAll(/\s+([:\w.-]+)(?:\s*=\s*"[^"]*")?/g)]
      const kept: string[] = []
      for (let index = parsed.length - 1; index >= 0; index--) {
        const attr = parsed[index]
        const attrName = attr[1]
        if (seen.has(attrName)) continue
        seen.add(attrName)
        kept.unshift(attr[0].trim())
      }
      return `<${name}${kept.length > 0 ? ' ' + kept.join(' ') : ''}${selfClosing ? '/>' : '>'}`
    },
  )
}

/** Chaîne littérale Typst (`"..."`) */
function typstStringLiteral(text: string): string {
  return `"${text.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function stripOuterBraces(text: string): string {
  let output = text.trim()
  while (output.startsWith('{')) {
    const arg = readBraced(output, 0)
    if (arg == null || arg.end !== output.length) break
    output = arg.value.trim()
  }
  return output
}

function extractLatexSizeCommand(tex: string): string | null {
  const match = new RegExp(`\\\\(${LATEX_SIZE_COMMANDS})(?![a-zA-Z])`).exec(tex)
  return match?.[1] ?? null
}

function extractLatexColor(tex: string): string | null {
  const match = /\\(?:text)?color(?:\[[^\]]+\])?\s*\{([^{}]+)\}/.exec(tex)
  return match?.[1]?.trim() ?? null
}

function unwrapTextColorCommands(text: string): string {
  let output = ''
  let index = 0
  const marker = '\\textcolor'
  while (index < text.length) {
    const start = text.indexOf(marker, index)
    if (start === -1) {
      output += text.slice(index)
      break
    }
    output += text.slice(index, start)
    let cursor = start + marker.length
    while (/\s/.test(text[cursor] ?? '')) cursor++
    if (text[cursor] === '[') {
      const close = text.indexOf(']', cursor)
      if (close === -1) {
        output += text.slice(start, cursor)
        index = cursor
        continue
      }
      cursor = close + 1
      while (/\s/.test(text[cursor] ?? '')) cursor++
    }
    const color = readBraced(text, cursor)
    if (color == null) {
      output += text.slice(start, cursor)
      index = cursor
      continue
    }
    cursor = color.end
    while (/\s/.test(text[cursor] ?? '')) cursor++
    const content = readBraced(text, cursor)
    if (content == null) {
      output += text.slice(start, cursor)
      index = cursor
      continue
    }
    output += content.value
    index = content.end
  }
  return output
}

function removeLatexColorDeclarations(text: string): string {
  return text.replace(/\\color(?:\[[^\]]+\])?\s*\{[^{}]+\}/g, '')
}

function typstColorExpression(color: string): string | null {
  const normalized = color.trim()
  const lower = normalized.toLowerCase()
  if (
    lower === '' ||
    lower === 'transparent' ||
    lower === 'inherit' ||
    /^none/.test(lower)
  )
    return null
  const hex = normalized.replace(/^#/, '')
  if (
    /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
      hex,
    )
  ) {
    return `rgb("#${hex}")`
  }
  if (lower === 'grey') return 'gray'
  if (lower in NAMED_COLOR_TO_HEX) return `rgb("${NAMED_COLOR_TO_HEX[lower]}")`
  if (TYPST_NAMED_COLORS.has(lower)) return lower
  return null
}

function isDefaultBlack(color: string): boolean {
  const normalized = color.trim().toLowerCase().replace(/^#/, '')
  return (
    normalized === 'black' || normalized === '000' || normalized === '000000'
  )
}

function normalizeOverlayLatex(tex: string): {
  tex: string
  color: string | null
  size: string | null
} {
  const color = extractLatexColor(tex)
  const sizeCommand = extractLatexSizeCommand(tex)
  let body = unwrapTextColorCommands(tex)
  body = removeLatexColorDeclarations(body)
  body = stripLatexSizeCommands(body)
  body = stripOuterBraces(body)
  return {
    tex: body.trim(),
    color,
    size: sizeCommand == null ? null : LATEX_SIZE_TO_TYPST_SIZE[sizeCommand],
  }
}

/**
 * Largeur maximale (en pt) d'une figure mathalea2d dans le document : ces
 * figures sont dessinées pour la pleine largeur du navigateur (souvent
 * 750 px CSS, soit 562,5 pt une fois converti) — bien plus large qu'une
 * page A4 (596 pt). Sans plafond, l'image déborde de la page (ou de la
 * colonne/liste qui la contient) et devient invisible dans l'aperçu.
 */
const MAX_FIGURE_WIDTH_PT = 380

/** Dimensions (pt) d'une figure, mises à l'échelle pour ne pas dépasser `MAX_FIGURE_WIDTH_PT` */
function scaledFigureDimensions(
  widthPx: number,
  heightPx: number,
): { widthPt: number; heightPt: number } {
  let widthPt = widthPx * 0.75
  let heightPt = heightPx * 0.75
  if (widthPt > MAX_FIGURE_WIDTH_PT) {
    const factor = MAX_FIGURE_WIDTH_PT / widthPt
    widthPt *= factor
    heightPt *= factor
  }
  return { widthPt, heightPt }
}

/**
 * Expression Typst affichant un SVG mathalea2d embarqué dans le code
 * (le document reste autonome : il compile aussi avec le CLI typst).
 * La largeur reprend celle de la figure (96 px CSS = 72 pt), plafonnée à
 * `MAX_FIGURE_WIDTH_PT`.
 */
export function svgToTypstImage(svg: string): string {
  const cleaned = sanitizeSvg(svg)
  // SVG with zero width or height is rejected by Typst's parser
  const h = cleaned.match(/<svg[^>]*?\sheight="([\d.]+)"/i)
  if (h != null && parseFloat(h[1]) === 0)
    return 'box(width: 0pt, height: 0pt)[]'
  const width = cleaned.match(/<svg[^>]*?\swidth="([\d.]+)"/i)
  if (width != null && parseFloat(width[1]) === 0)
    return 'box(width: 0pt, height: 0pt)[]'
  let widthPt = ''
  if (width != null) {
    const heightPx = h != null ? parseFloat(h[1]) : parseFloat(width[1])
    const scaled = scaledFigureDimensions(parseFloat(width[1]), heightPx)
    widthPt = `, width: ${scaled.widthPt.toFixed(1)}pt`
  }
  return `image(bytes(${typstStringLiteral(cleaned)}), format: "svg"${widthPt})`
}

function extractKatexTex(html: string): string | null {
  const annotationMatch = html.match(
    /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/i,
  )
  if (annotationMatch != null) return decodeEntities(annotationMatch[1])
  return null
}

function divLatexToTypstLabel(
  divHtml: string,
  scaleFactor: number,
): string | null {
  const tex = extractKatexTex(divHtml)
  if (tex == null) return null
  const label = normalizeOverlayLatex(tex)
  if (label.tex.length === 0) return null
  const left = divHtml.match(/\bdata-left=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
  const top = divHtml.match(/\bdata-top=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
  if (left == null || top == null) return null
  const leftPx = Number(left[1] ?? left[2] ?? left[3])
  const topPx = Number(top[1] ?? top[2] ?? top[3])
  if (!Number.isFinite(leftPx) || !Number.isFinite(topPx)) return null
  const rotate = divHtml.match(/rotate\((-?[\d.]+)deg\)/i)
  const angle = rotate != null ? Number(rotate[1]) : 0
  const options: string[] = []
  if (label.size != null && label.size !== '1em') {
    options.push(`size: ${label.size}`)
  }
  if (label.color != null && !isDefaultBlack(label.color)) {
    const color = typstColorExpression(label.color)
    if (color != null) options.push(`fill: ${color}`)
  }
  if (Number.isFinite(angle) && angle !== 0) {
    options.push(`angle: ${angle}deg`)
  }
  const args = [
    `${(leftPx * 0.75 * scaleFactor).toFixed(1)}pt`,
    `${(topPx * 0.75 * scaleFactor).toFixed(1)}pt`,
    `[$${latexMathToTypst(label.tex)}$]`,
    ...options,
  ]
  return `mathalea-label(${args.join(', ')})`
}

function mathalea2dContainerToTypst(
  html: string,
  figures?: string[],
): string | null {
  if (!/\bsvgContainer\b/.test(html)) return null
  const svgMatch = html.match(/<svg\b[\s\S]*?<\/svg>/i)
  if (svgMatch == null) return null
  if (figures == null) return missingBox('figure non convertie')
  figures.push(svgToTypstImage(svgMatch[0]))
  const figureIndex = figures.length
  const figureName = `fig-${figureIndex}`
  const zoomVar = `${figureName}-zoom`
  const alignVar = `${figureName}-align`
  const width = svgMatch[0].match(/<svg[^>]*?\swidth="([\d.]+)"/i)
  const height = svgMatch[0].match(/<svg[^>]*?\sheight="([\d.]+)"/i)
  const widthPx = width != null ? parseFloat(width[1]) : 213.3
  const heightPx = height != null ? parseFloat(height[1]) : 120
  const scaled = scaledFigureDimensions(widthPx, heightPx)
  // les positions des labels sont en pixels de la figure d'origine : le
  // même facteur d'échelle que l'image doit leur être appliqué, sinon ils
  // se retrouvent mal placés une fois la figure plafonnée à MAX_FIGURE_WIDTH_PT
  const scaleFactor = scaled.widthPt / (widthPx * 0.75)
  const widthPt = scaled.widthPt.toFixed(1)
  const heightPt = scaled.heightPt.toFixed(1)
  const labels = [
    ...html.matchAll(
      /<div\b[^>]*\bclass=["'][^"']*\bdivLatex\b[^"']*["'][\s\S]*?<\/div>/gi,
    ),
  ]
    .map((match) => divLatexToTypstLabel(match[0], scaleFactor))
    .filter((label): label is string => label != null)
  const body =
    labels.length === 0
      ? figureName
      : [
          `mathalea-figure(${widthPt}pt, ${heightPt}pt, ${figureName}, labels: (`,
          ...labels.map((label) => `  ${label},`),
          '))',
        ].join('\n')
  // mathalea-figure-block réduit la figure si elle dépasse la largeur
  // disponible, applique le zoom choisi par le professeur, l'aligne et place
  // le repère invisible de la palette de mise en page au coin haut-droit de
  // son rendu final
  return [
    `#mathalea-figure-block(${figureIndex}, ${alignVar}, ${zoomVar},`,
    body,
    ')',
  ].join('\n')
}

function protectMathalea2dContainers(
  html: string,
  protect: (typst: string) => string,
  figures?: string[],
): string {
  if (typeof document !== 'undefined') {
    const template = document.createElement('template')
    template.innerHTML = html
    const containers = [
      ...template.content.querySelectorAll<HTMLElement>('.svgContainer'),
    ]
    if (containers.length > 0) {
      for (const container of containers) {
        const typst = mathalea2dContainerToTypst(container.outerHTML, figures)
        if (typst != null) {
          // ligne vide après la figure : le texte qui suit reprend dans
          // un nouveau paragraphe du code généré (l'espacement fait partie
          // du segment protégé pour survivre à la normalisation des blancs)
          container.replaceWith(
            document.createTextNode(protect(typst + '\n\n')),
          )
        }
      }
      return template.innerHTML
    }
  }
  return html.replace(
    /<div\b[^>]*\bclass=["'][^"']*\bsvgContainer\b[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi,
    (container) =>
      protect(
        (mathalea2dContainerToTypst(container, figures) ?? container) + '\n\n',
      ),
  )
}

/**
 * Convertit un groupe de propositions de QCM en un bloc `#tasks(...)`
 * (paquet taskize) présenté sur `qcm-colonnes` colonnes, avec des étiquettes
 * A) B) C)... Dans le corrigé, la bonne réponse est mise en évidence.
 */
function qcmToTypst(choices: { correct: boolean; body: string }[]): string {
  const items = choices
    .map(
      (choice) =>
        `  + ${choice.correct ? `#qcm-bonne[${choice.body}]` : choice.body}`,
    )
    .join('\n')
  return `#tasks(columns: qcm-colonnes, label: "A)", above: 0.4em, below: 0.4em)[\n${items}\n]`
}

/**
 * Rendu SVG d'une figure `<canvas-3d>` (empilements de cubes des exercices
 * de motifs). L'élément est un canvas WebGL (Three.js), sans image
 * extractible : on redessine les cubes décrits par son attribut `content`
 * en projection isométrique (la caméra de Canvas3DElement regarde l'origine
 * depuis la diagonale (8, 8, 8)), faces triées de l'arrière vers l'avant.
 * Renvoie `null` si le contenu n'est pas un empilement de cubes.
 */
function canvas3dToSvg(tag: string): string | null {
  const content = tag.match(/content=(?:'([^']*)'|"([^"]*)")/)
  if (content == null) return null
  let cubes: { pos: number[]; size: number; color: string }[]
  try {
    const parsed = JSON.parse(decodeURIComponent(content[1] ?? content[2]))
    const objects: unknown[] = Array.isArray(parsed?.objects)
      ? parsed.objects
      : []
    cubes = objects
      .filter(
        (object): object is { type: string; pos: number[]; size?: unknown; color?: unknown } =>
          object != null &&
          typeof object === 'object' &&
          (object as { type?: unknown }).type === 'cube' &&
          Array.isArray((object as { pos?: unknown }).pos),
      )
      .map((cube) => ({
        pos: cube.pos,
        size: typeof cube.size === 'number' ? cube.size : 1,
        color: typeof cube.color === 'string' ? cube.color : '#ffffff',
      }))
  } catch {
    return null
  }
  if (cubes.length === 0) return null
  // projection orthographique le long de la diagonale (axes y vers le haut)
  const UNIT = 24
  const project = ([x, y, z]: number[]): [number, number] => [
    (x - z) * 0.70710678 * UNIT,
    -(-x + 2 * y - z) * 0.40824829 * UNIT,
  ]
  /** Assombrit une couleur hexadécimale (faces latérales) */
  const shade = (hex: string, factor: number): string => {
    const value = hex.replace('#', '')
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return hex
    const channels = [0, 2, 4].map((index) =>
      Math.round(parseInt(value.slice(index, index + 2), 16) * factor),
    )
    return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  interface Face {
    points: [number, number][]
    fill: string
  }
  const faces: Face[] = []
  // cubes triés de l'arrière (x+y+z petit) vers l'avant
  for (const cube of [...cubes].sort(
    (a, b) => a.pos[0] + a.pos[1] + a.pos[2] - (b.pos[0] + b.pos[1] + b.pos[2]),
  )) {
    const [x, y, z] = cube.pos
    const s = cube.size / 2
    const corners: Record<string, number[]> = {}
    for (const dx of [-s, s]) {
      for (const dy of [-s, s]) {
        for (const dz of [-s, s]) {
          corners[`${dx > 0 ? '+' : '-'}${dy > 0 ? '+' : '-'}${dz > 0 ? '+' : '-'}`] =
            [x + dx, y + dy, z + dz]
        }
      }
    }
    // seules les trois faces tournées vers la caméra sont visibles
    const visible: { keys: string[]; factor: number }[] = [
      { keys: ['-+-', '++-', '+++', '-++'], factor: 1 }, // dessus (+y)
      { keys: ['--+', '+-+', '+++', '-++'], factor: 0.87 }, // face +z
      { keys: ['+--', '++-', '+++', '+-+'], factor: 0.72 }, // face +x
    ]
    for (const face of visible) {
      faces.push({
        points: face.keys.map((key) => project(corners[key])),
        fill: shade(cube.color, face.factor),
      })
    }
  }
  const xs = faces.flatMap((face) => face.points.map((point) => point[0]))
  const ys = faces.flatMap((face) => face.points.map((point) => point[1]))
  const pad = 2
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const width = Math.max(...xs) + pad - minX
  const height = Math.max(...ys) + pad - minY
  const polygons = faces.map(
    (face) =>
      `<polygon points="${face.points
        .map(
          ([px, py]) => `${(px - minX).toFixed(1)},${(py - minY).toFixed(1)}`,
        )
        .join(' ')}" fill="${face.fill}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`,
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(1)}" height="${height.toFixed(1)}" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}">${polygons.join('')}</svg>`
}

/** Valeur d'une propriété dans un style CSS en ligne */
function inlineStyleProp(style: string, name: string): string | null {
  const match = new RegExp(`(?:^|[;\\s])${name}\\s*:\\s*([^;]+)`).exec(style)
  return match?.[1]?.trim() ?? null
}

/** Contenu d'une cellule de schéma : HTML converti, replié sur une ligne */
function schemaCellContent(html: string): string {
  return htmlToTypst(html).replace(/\s*\n+\s*/g, ' ').trim()
}

/**
 * Bordure Typst d'une boîte de schéma : les barres partagent leurs bordures
 * en HTML (`border-left: none` sur les boîtes suivantes), on reproduit les
 * côtés omis pour ne pas doubler les traits.
 */
function schemaCellStroke(style: string): string {
  if (/(?:^|[;\s])border\s*:\s*none/.test(style)) return 'none'
  const omitted = ['left', 'right', 'top', 'bottom'].filter((side) =>
    new RegExp(`border-${side}\\s*:\\s*none`).test(style),
  )
  if (omitted.length === 0) return '0.6pt + black'
  return `(${omitted.map((side) => `${side}: none`).join(', ')}, rest: 0.6pt + black)`
}

/**
 * Convertit un schéma en barres (`SchemaEnBoite`, HTML en grille CSS) en une
 * grille Typst : boîtes (`SchemaItem`) reproduites par des cellules avec
 * fond et bordure, accolades et flèches (`SchemaTop`/`SchemaBottom`) par le
 * helper `mathalea-schema-span` (accolade/flèche étirée sur la largeur).
 * Les accolades latérales (`latexAccoladeRight`, rares) ne sont pas rendues.
 */
function schemaEnBoiteToTypst(container: HTMLElement): string {
  interface SchemaCell {
    row: number
    colStart: number
    colEnd: number
    body: (y: number, x: number, colspan: number) => string
  }
  const cells: SchemaCell[] = []
  for (const element of [...container.children] as HTMLElement[]) {
    const className = element.getAttribute('class') ?? ''
    if (/\blatexAccoladeRight\b/.test(className)) continue
    const style = element.getAttribute('style') ?? ''
    const row = parseInt(inlineStyleProp(style, 'grid-row') ?? '', 10)
    const colStart = parseInt(
      inlineStyleProp(style, 'grid-column-start') ?? '',
      10,
    )
    const colEnd = parseInt(inlineStyleProp(style, 'grid-column-end') ?? '', 10)
    if ([row, colStart, colEnd].some(Number.isNaN) || colEnd <= colStart) {
      continue
    }
    if (/\bSchemaTop\b|\bSchemaBottom\b/.test(className)) {
      const flip = /\bSchemaBottom\b/.test(className)
      // le type flèche se reconnaît à sa couleur `--arrow-color` (l'accolade
      // note la sienne hors de l'attribut style, guillemet mal placé)
      const arrow = element.outerHTML.includes('--arrow-color')
      const labelElement = element.querySelector<HTMLElement>(
        '.latexAccoladeTop, .latexAccoladeBottom',
      )
      const label = schemaCellContent(labelElement?.innerHTML ?? '')
      const color = colorToTypst(
        inlineStyleProp(
          labelElement?.getAttribute('style') ?? '',
          'color',
        ) ?? '',
      )
      const options = [
        arrow ? 'kind: "arrow"' : null,
        flip ? 'flip: true' : null,
        color != null && color !== 'black' ? `color: ${color}` : null,
      ].filter((option): option is string => option != null)
      const optionsCode = options.length > 0 ? `, ${options.join(', ')}` : ''
      cells.push({
        row,
        colStart,
        colEnd,
        body: (y, x, colspan) =>
          `grid.cell(x: ${x}, y: ${y}, colspan: ${colspan}, mathalea-schema-span([${label}]${optionsCode}))`,
      })
      continue
    }
    if (!/\bSchemaItem\b/.test(className)) continue
    const height = inlineStyleProp(style, 'height')
    let content = schemaCellContent(element.innerHTML)
    // ligne d'espacement entre deux schémas superposés
    if (content.length === 0 && height != null) {
      content = `#v(${height})`
    }
    const fill = colorToTypst(
      inlineStyleProp(style, 'background-color') ?? '',
    )
    const stroke = schemaCellStroke(style)
    const bold = inlineStyleProp(style, 'font-weight') === 'bold'
    const textColor = colorToTypst(inlineStyleProp(style, 'color') ?? '')
    if (bold) content = `#strong[${content}]`
    if (textColor != null && textColor !== 'black') {
      content = `#text(fill: ${textColor})[${content}]`
    }
    const align =
      inlineStyleProp(style, 'justify-content') === 'center'
        ? 'center + horizon'
        : 'left + horizon'
    const cellOptions = [
      fill != null ? `fill: ${fill}` : null,
      `stroke: ${stroke}`,
      'inset: 4pt',
      `align: ${align}`,
    ].filter((option): option is string => option != null)
    cells.push({
      row,
      colStart,
      colEnd,
      body: (y, x, colspan) =>
        `grid.cell(x: ${x}, y: ${y}, colspan: ${colspan}, ${cellOptions.join(', ')})[${content}]`,
    })
  }
  if (cells.length === 0) return missingBox('schéma non converti')
  const totalCols = Math.max(...cells.map((cell) => cell.colEnd)) - 1
  const rowIndex = new Map(
    [...new Set(cells.map((cell) => cell.row))]
      .sort((a, b) => a - b)
      .map((row, index) => [row, index]),
  )
  const lines = cells.map(
    (cell) =>
      `  ${cell.body(
        rowIndex.get(cell.row) ?? 0,
        cell.colStart - 1,
        Math.min(cell.colEnd, totalCols + 1) - cell.colStart,
      )},`,
  )
  return [
    '#block(width: 100%, inset: (y: 2pt))[#grid(',
    `  columns: (1fr,) * ${totalCols},`,
    '  row-gutter: 2pt,',
    ...lines,
    ')]',
  ].join('\n')
}

/**
 * Repère les schémas en barres (`<div class="SchemaContainer">`) et les
 * convertit avant le reste du HTML (leur contenu interne serait sinon
 * aplati en texte).
 */
function protectSchemaContainers(
  html: string,
  protect: (typst: string) => string,
): string {
  if (!/\bSchemaContainer\b/.test(html)) return html
  if (typeof document === 'undefined') {
    // sans DOM : encart plutôt que du texte aplati illisible
    return html.replace(
      /<div\b[^>]*\bclass=["'][^"']*\bSchemaContainer\b[\s\S]*$/i,
      () => protect(missingBox('schéma non converti') + '\n\n'),
    )
  }
  const template = document.createElement('template')
  template.innerHTML = html
  const containers = [
    ...template.content.querySelectorAll<HTMLElement>('.SchemaContainer'),
  ]
  if (containers.length === 0) return html
  for (const container of containers) {
    container.replaceWith(
      document.createTextNode(
        protect(schemaEnBoiteToTypst(container) + '\n\n'),
      ),
    )
  }
  return template.innerHTML
}

/**
 * Une proposition est « correcte » (dans un corrigé) si sa case est cochée
 * (format `case`) ou si sa lettre est colorée (format `lettre`, la mauvaise
 * réponse étant barrée).
 */
function qcmChoiceIsCorrect(choice: Element): boolean {
  const checkbox = choice.querySelector<HTMLInputElement>(
    'input[type="checkbox"]',
  )
  if (checkbox != null) return checkbox.checked
  return choice.querySelector('label:not([id]) span[style*="color"]') != null
}

/**
 * Détecte les propositions de QCM produites par `propositionsQcm` : chaque
 * proposition porte un libellé `<label id="labelEx{N}Q{i}R{rep}">` (présent
 * quel que soit le format, `case` ou `lettre`). Les propositions d'un même
 * conteneur sont regroupées dans un `#tasks(...)`. Traité avant les formules :
 * les libellés sont reconvertis récursivement par `htmlToTypst`.
 */
function protectQcm(
  html: string,
  protect: (typst: string) => string,
  figures?: string[],
): string {
  if (typeof document === 'undefined') return html
  const template = document.createElement('template')
  template.innerHTML = html
  const labels = [
    ...template.content.querySelectorAll<HTMLLabelElement>('label[id]'),
  ].filter((label) => /^labelEx\d+Q\d+R\d+$/.test(label.id))
  if (labels.length === 0) return html

  const groups = new Map<Element, { correct: boolean; body: string }[]>()
  const order: Element[] = []
  for (const label of labels) {
    const choice = label.closest('div')
    const container = choice?.parentElement
    if (choice == null || container == null) continue
    const body = htmlToTypst(label.innerHTML, figures)
    if (body.length === 0) continue
    if (!groups.has(container)) {
      groups.set(container, [])
      order.push(container)
    }
    groups.get(container)!.push({ correct: qcmChoiceIsCorrect(choice), body })
  }
  if (order.length === 0) return html
  for (const container of order) {
    // le bloc #tasks(...) commence et finit sur sa propre ligne dans le
    // code généré (l'espacement fait partie du segment protégé pour
    // survivre à la normalisation des blancs)
    container.replaceWith(
      document.createTextNode(
        protect('\n' + qcmToTypst(groups.get(container)!) + '\n'),
      ),
    )
  }
  return template.innerHTML
}

/**
 * Convertit les tableaux HTML en Typst avant tout autre traitement (leurs
 * cellules contiennent des formules et éventuellement des figures, reconverties
 * récursivement par `htmlToTypst`).
 */
function protectHtmlTables(
  html: string,
  protect: (typst: string) => string,
  figures?: string[],
): string {
  if (typeof document === 'undefined') {
    return html.replace(/<table[\s\S]*?<\/table>/gi, () =>
      protect(missingBox('tableau non converti')),
    )
  }
  const template = document.createElement('template')
  template.innerHTML = html
  const tables = [...template.content.querySelectorAll('table')]
  if (tables.length === 0) return html
  for (const table of tables) {
    table.replaceWith(
      document.createTextNode(protect(htmlTableToTypst(table, figures))),
    )
  }
  return template.innerHTML
}

function protectKatexSpans(
  html: string,
  protect: (typst: string) => string,
): string {
  if (typeof document !== 'undefined') {
    const template = document.createElement('template')
    template.innerHTML = html
    const spans = [...template.content.querySelectorAll<HTMLElement>('.katex')]
    if (spans.length > 0) {
      for (const span of spans) {
        const tex = extractKatexTex(span.outerHTML)
        if (tex != null) {
          span.replaceWith(
            document.createTextNode(protect(latexSegmentToTypst(tex, false))),
          )
        }
      }
      return template.innerHTML
    }
  }
  return html.replace(
    /<span\b[^>]*\bclass=["'][^"']*\bkatex\b[^"']*["'][\s\S]*?<\/span>/gi,
    (span) => {
      const tex = extractKatexTex(span)
      return tex == null ? span : protect(latexSegmentToTypst(tex, false))
    },
  )
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
    return `\uE000${protectedSegments.length - 1}\uE001`
  }

  let text = protectQcm(html, protect, figures)
  text = protectSchemaContainers(text, protect)
  text = protectHtmlTables(text, protect, figures)
  text = protectMathalea2dContainers(text, protect, figures)
  text = protectKatexSpans(text, protect)
  // `~$€$` (pattern produit par `texPrix(val)~$€$`) : le `$€$` est un bloc math
  // imbriqué dans un autre `$...$`. En mode texte brut (pas de KaTeX rendu),
  // on remplace `~$€$` par `~\euro` pour éviter la confusion des délimiteurs $.
  text = text.replace(/~\$€\$/g, '~\\euro ')
  text = text.replace(/\$€\$/g, '\\euro ')
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex: string) =>
    protect(latexSegmentToTypst(tex, true)),
  )
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex: string) =>
    protect(latexSegmentToTypst(tex, false)),
  )
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex: string) =>
    protect(latexSegmentToTypst(tex, true)),
  )
  // Traite $...$ avant de supprimer les $ adjacents : cela évite que
  // `$\bullet$ $f(x)$` soit fusionné en `$\bulletf(x)$` (bulletf = variable inconnue).
  // Quand deux blocs `$A$ $B$` sont adjacents, chacun est converti séparément ;
  // le bloc espace `$ $` produit une chaîne vide, ce qui est correct.
  // Le repérage tient compte des accolades : un `$` situé dans un `{…}`
  // (ex. `\text{ m$^2$/h}`, unité avec exposant) fait partie du bloc et ne
  // le referme pas.
  text = replaceBalancedInlineMath(text, (tex) => {
    const converted = latexSegmentToTypst(tex, false)
    return converted.length > 0 ? protect(converted) : ''
  })
  // Supprime les $ orphelins restants (ne contenant que des espaces)
  text = text.replace(/\$\s*\$/g, '')

  // 2. Figures SVG (embarquées dans le document), puis éléments non
  //    convertis : images et tableaux
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => {
    if (figures == null) return protect(missingBox('figure non convertie'))
    figures.push(svgToTypstImage(svg))
    // mathalea-fit réduit la figure si elle dépasse la largeur disponible ;
    // ligne vide après la figure : le texte qui suit reprend dans un
    // nouveau paragraphe du code généré
    return protect(`#mathalea-fit(fig-${figures.length})\n\n`)
  })
  // images d'exercices statiques (annales scannées) : l'image est déjà
  // chargée dans le compilateur (voir `staticImagePaths`/`mapShadow`), sinon
  // (référentiel sans image, ou récupération réseau échouée) c'est un encart
  text = text.replace(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi, (_, src: string) => {
    const path = staticImagePaths.get(src)
    if (path == null || figures == null) {
      return protect(missingBox('image non convertie'))
    }
    // largeur intrinsèque volontairement bien plus grande que n'importe
    // quelle colonne/page (A4 paysage compris) : mathalea-fit la réduit
    // alors toujours pour occuper exactement toute la largeur disponible,
    // là où MAX_FIGURE_WIDTH_PT (calibré pour les figures mathalea2d) la
    // laisserait plus étroite que la page
    figures.push(`image(${typstStringLiteral(path)}, width: ${STATIC_IMAGE_INTRINSIC_WIDTH_PT}pt)`)
    return protect(`#mathalea-fit(fig-${figures.length})\n\n`)
  })
  text = text.replace(/<img[^>]*>/gi, () =>
    protect(missingBox('image non convertie')),
  )
  // figures 3D (Three.js) : les empilements de cubes sont redessinés en SVG
  // isométrique à partir de leur description JSON, le reste est signalé
  text = text.replace(/<canvas-3d[^>]*>(?:[\s\S]*?<\/canvas-3d>)?/gi, (tag) => {
    const svg = canvas3dToSvg(tag)
    if (svg == null || figures == null) {
      return protect(missingBox('figure 3D non convertie'))
    }
    figures.push(svgToTypstImage(svg))
    return protect(`#mathalea-fit(fig-${figures.length})\n\n`)
  })

  // 3. Parcours des balises restantes
  let output = ''
  /** Profondeur des blocs de contenu Typst ouverts (#strong[, #emph[...]) */
  let bracketDepth = 0
  const listStack: ('ul' | 'ol')[] = []
  /** Nombre de blocs Typst ouverts par chaque <span> imbriqué */
  const spanStack: number[] = []
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
      case 'span': {
        // les spans stylés (texteEnCouleur, texteEnCouleurEtGras...)
        // conservent leur couleur et leur graisse
        if (isClosing) {
          for (let n = spanStack.pop() ?? 0; n > 0; n--) {
            output += closeBlock()
          }
          break
        }
        const style = token.match(/style\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
        const styleValue = style?.[1] ?? style?.[2] ?? ''
        const colorValue = styleValue.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)
        const isBold = /font-weight\s*:\s*(?:bold|[6-9]00)/i.test(styleValue)
        let opened = 0
        if (colorValue != null && !isDefaultBlack(colorValue[1])) {
          const color = typstColorExpression(colorValue[1])
          if (color != null) {
            output += openBlock(`#text(fill: ${color})[`)
            opened++
          }
        }
        if (isBold) {
          output += openBlock('#strong[')
          opened++
        }
        spanStack.push(opened)
        break
      }
      default:
        // balise inconnue : ignorée, seul son contenu est conservé
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
    /\uE000(\d+)\uE001/g,
    (_, index: string) => protectedSegments[Number(index)],
  )
  // Un \ en fin de contenu (issu d'un <br> final) formerait \] avec l'accolade
  // fermante d'un bloc [contenu] Typst → délimiteur non fermé.
  return output.trim().replace(/\\+$/, '')
}
