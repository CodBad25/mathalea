import { couleurLien, type RelierEtiquettesConfig } from './types'

/**
 * Export LaTeX (TikZ) du composant « Relier les étiquettes ».
 *
 * Le rendu imprimé reprend la géométrie du rendu HTML : deux colonnes
 * d'étiquettes carrées séparées par un couloir vide dans lequel l'élève trace
 * ses traits, et un point de raccordement sur le bord intérieur de chaque
 * étiquette. Les liens de `config.liens` (corrigé) sont tracés avec la couleur
 * de `couleurLien()`, la même que dans les rendus HTML et Typst.
 */

/** Côté d'une étiquette carrée, en cm. */
const TAILLE_ETIQUETTE = 2.4
/** Largeur du couloir entre les deux colonnes, en cm. */
const ECART_COLONNES = 4
/** Espace vertical entre deux étiquettes d'une même colonne, en cm. */
const ECART_LIGNES = 0.5
/** Rayon des points de raccordement, en pt. */
const RAYON_POINT = 1.6

/** Couleur TikZ inline à partir d'une couleur hexadécimale `#rrggbb`. */
function couleurTikz(hex: string): string {
  const rouge = Number.parseInt(hex.slice(1, 3), 16)
  const vert = Number.parseInt(hex.slice(3, 5), 16)
  const bleu = Number.parseInt(hex.slice(5, 7), 16)
  return `{rgb,255:red,${rouge};green,${vert};blue,${bleu}}`
}

/** Ordonnée du centre de l'étiquette d'indice `index` dans une colonne de `nb` étiquettes. */
function ordonnee(index: number, nb: number, nbMax: number): number {
  const pas = TAILLE_ETIQUETTE + ECART_LIGNES
  // Colonnes de tailles différentes : chacune est centrée verticalement.
  const decalage = ((nbMax - nb) * pas) / 2
  return -(index * pas + decalage)
}

/** Arrondi court, pour ne pas polluer le code LaTeX de décimales inutiles. */
function cm(valeur: number): string {
  return Number(valeur.toFixed(3)).toString()
}

export function toLatex(config: RelierEtiquettesConfig): string {
  const { gauche, droite, liens } = config
  const nbMax = Math.max(gauche.length, droite.length)
  if (nbMax === 0) return ''

  const xDroite = TAILLE_ETIQUETTE + ECART_COLONNES
  const lignes: string[] = []
  lignes.push('\\begin{center}')
  lignes.push('\\begin{tikzpicture}[')
  lignes.push('  etiquetteRelier/.style={')
  lignes.push('    draw=black!45,')
  lignes.push('    line width=0.6pt,')
  lignes.push('    rounded corners=3pt,')
  lignes.push(`    minimum width=${cm(TAILLE_ETIQUETTE)}cm,`)
  lignes.push(`    minimum height=${cm(TAILLE_ETIQUETTE)}cm,`)
  lignes.push(`    text width=${cm(TAILLE_ETIQUETTE - 0.4)}cm,`)
  lignes.push('    align=center,')
  lignes.push('    inner sep=2pt')
  lignes.push('  }')
  lignes.push(']')

  gauche.forEach((etiquette, index) => {
    const y = ordonnee(index, gauche.length, nbMax)
    lignes.push(
      `\\node[etiquetteRelier] (relierG${index}) at (0,${cm(y)}) {${etiquette.texte}};`,
    )
  })
  droite.forEach((etiquette, index) => {
    const y = ordonnee(index, droite.length, nbMax)
    lignes.push(
      `\\node[etiquetteRelier] (relierD${index}) at (${cm(xDroite)},${cm(y)}) {${etiquette.texte}};`,
    )
  })

  gauche.forEach((_, index) => {
    lignes.push(
      `\\fill[black!45] (relierG${index}.east) circle (${RAYON_POINT}pt);`,
    )
  })
  droite.forEach((_, index) => {
    lignes.push(
      `\\fill[black!45] (relierD${index}.west) circle (${RAYON_POINT}pt);`,
    )
  })

  const indexGauche = new Map(gauche.map((etiquette, i) => [etiquette.id, i]))
  const indexDroite = new Map(droite.map((etiquette, i) => [etiquette.id, i]))
  for (const lien of liens) {
    const i = indexGauche.get(lien.gauche)
    const j = indexDroite.get(lien.droite)
    if (i === undefined || j === undefined) continue
    lignes.push(
      `\\draw[line width=1pt, draw=${couleurTikz(couleurLien(i))}] (relierG${i}.east) -- (relierD${j}.west);`,
    )
  }

  lignes.push('\\end{tikzpicture}')
  lignes.push('\\end{center}')
  return lignes.join('\n')
}
