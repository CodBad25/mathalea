import { couleurLien, type RelierEtiquettesConfig } from './types'

/**
 * Export Typst du composant « Relier les étiquettes ».
 *
 * Miroir de `toLatex` (TikZ) : mêmes proportions, mêmes couleurs de traits.
 * Le rendu n'utilise aucun paquet externe (pas de cetz) : le dessin tient dans
 * un `block` de taille fixe où chaque étiquette et chaque trait sont posés en
 * coordonnées absolues avec `place`.
 *
 * Le résultat est destiné à être inséré tel quel dans le document via le
 * marqueur `<mathalea-typst>` (voir `latexToTypst.ts`), pas à être imbriqué
 * dans du HTML converti.
 */

/** Côté d'une étiquette carrée, en pt (2,4 cm). */
const TAILLE_ETIQUETTE = 68
/** Largeur du couloir entre les deux colonnes, en pt (4 cm). */
const ECART_COLONNES = 113
/** Espace vertical entre deux étiquettes d'une même colonne, en pt. */
const ECART_LIGNES = 14
/** Rayon des points de raccordement, en pt. */
const RAYON_POINT = 2

/**
 * Convertit un fragment LaTeX simple (contenu d'une étiquette) en syntaxe
 * mathématique Typst.
 *
 * Ce n'est volontairement pas un convertisseur LaTeX général (voir
 * `latexMathToTypst`/tex2typst dans `src/components/setup/typst/`) : ce module
 * vit dans `src/lib/interactif` et ne doit pas dépendre de `src/components`.
 * Il couvre le sous-ensemble réellement utilisé dans des étiquettes courtes
 * (comparaisons, opérations usuelles, fractions).
 */
function latexFragmentToTypstMath(latex: string): string {
  let s = latex
  s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
  s = s.replace(/\\text(?:rm|bf|it)?\{([^{}]*)\}/g, '"$1"')
  // Les variantes longues d'abord : `\geqslant` avant `\ge`.
  s = s.replace(/\\(?:geqslant|geqq|geq|ge)\b/g, '>=')
  s = s.replace(/\\(?:leqslant|leqq|leq|le)\b/g, '<=')
  s = s.replace(/\\(?:neq|ne)\b/g, '!=')
  s = s.replace(/\\infty\b/g, 'infinity')
  s = s.replace(/\\pm\b/g, 'plus.minus')
  s = s.replace(/\\times\b/g, 'times')
  s = s.replace(/\\div\b/g, 'div')
  s = s.replace(/\\cdot\b/g, 'dot.op')
  s = s.replace(/\\,/g, 'thin')
  s = s.replace(/\\%/g, '%')
  return s
}

/** Échappe le texte destiné au balisage Typst. */
function echappeTexteTypst(texte: string): string {
  return texte.replace(/[\\#$[\]*_`<>@~]/g, (caractere) => `\\${caractere}`)
}

/**
 * Convertit le contenu d'une étiquette (texte mêlé de LaTeX entre `$`) en
 * corps de contenu Typst, à insérer entre crochets.
 */
export function contenuEtiquetteTypst(texte: string): string {
  return texte
    .split('$')
    .map((fragment, index) =>
      index % 2 === 1
        ? `$${latexFragmentToTypstMath(fragment)}$`
        : echappeTexteTypst(fragment),
    )
    .join('')
}

/** Ordonnée du centre de l'étiquette d'indice `index` dans une colonne de `nb` étiquettes. */
function ordonnee(index: number, nb: number, nbMax: number): number {
  const pas = TAILLE_ETIQUETTE + ECART_LIGNES
  const decalage = ((nbMax - nb) * pas) / 2
  return index * pas + decalage
}

/** Arrondi court, pour ne pas polluer le code Typst de décimales inutiles. */
function pt(valeur: number): string {
  return `${Number(valeur.toFixed(2))}pt`
}

export function toTypst(config: RelierEtiquettesConfig): string {
  const { gauche, droite, liens } = config
  const nbMax = Math.max(gauche.length, droite.length)
  if (nbMax === 0) return ''

  const pas = TAILLE_ETIQUETTE + ECART_LIGNES
  const largeur = 2 * TAILLE_ETIQUETTE + ECART_COLONNES
  const hauteur = nbMax * pas - ECART_LIGNES
  const xDroite = TAILLE_ETIQUETTE + ECART_COLONNES

  const lignes: string[] = []
  lignes.push(
    `#align(center)[#block(width: ${pt(largeur)}, height: ${pt(hauteur)})[`,
  )

  const etiquette = (x: number, y: number, contenu: string) =>
    `  #place(top + left, dx: ${pt(x)}, dy: ${pt(y)}, box(` +
    `width: ${pt(TAILLE_ETIQUETTE)}, height: ${pt(TAILLE_ETIQUETTE)}, ` +
    'radius: 4pt, stroke: 0.6pt + luma(55%), inset: 5pt, ' +
    `align(center + horizon)[${contenu}]))`

  gauche.forEach((item, index) => {
    lignes.push(
      etiquette(
        0,
        ordonnee(index, gauche.length, nbMax),
        contenuEtiquetteTypst(item.texte),
      ),
    )
  })
  droite.forEach((item, index) => {
    lignes.push(
      etiquette(
        xDroite,
        ordonnee(index, droite.length, nbMax),
        contenuEtiquetteTypst(item.texte),
      ),
    )
  })

  const ancreGauche = (index: number) => ({
    x: TAILLE_ETIQUETTE,
    y: ordonnee(index, gauche.length, nbMax) + TAILLE_ETIQUETTE / 2,
  })
  const ancreDroite = (index: number) => ({
    x: xDroite,
    y: ordonnee(index, droite.length, nbMax) + TAILLE_ETIQUETTE / 2,
  })

  const indexGauche = new Map(gauche.map((item, i) => [item.id, i]))
  const indexDroite = new Map(droite.map((item, i) => [item.id, i]))
  for (const lien of liens) {
    const i = indexGauche.get(lien.gauche)
    const j = indexDroite.get(lien.droite)
    if (i === undefined || j === undefined) continue
    const depart = ancreGauche(i)
    const arrivee = ancreDroite(j)
    lignes.push(
      `  #place(top + left, line(start: (${pt(depart.x)}, ${pt(depart.y)}), ` +
        `end: (${pt(arrivee.x)}, ${pt(arrivee.y)}), ` +
        `stroke: 1pt + rgb("${couleurLien(i)}")))`,
    )
  }

  const point = (x: number, y: number) =>
    `  #place(top + left, dx: ${pt(x - RAYON_POINT)}, dy: ${pt(y - RAYON_POINT)}, ` +
    `circle(radius: ${pt(RAYON_POINT)}, fill: luma(55%), stroke: none))`

  gauche.forEach((_, index) => {
    const ancre = ancreGauche(index)
    lignes.push(point(ancre.x, ancre.y))
  })
  droite.forEach((_, index) => {
    const ancre = ancreDroite(index)
    lignes.push(point(ancre.x, ancre.y))
  })

  lignes.push(']]')
  return lignes.join('\n')
}
