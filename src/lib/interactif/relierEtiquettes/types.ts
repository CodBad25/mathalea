/**
 * Types partagés par le custom element `relier-etiquettes` et ses exports
 * LaTeX et Typst.
 */

/** Une étiquette d'une des deux colonnes à relier. */
export type EtiquetteRelier = {
  /** Identifiant stable, utilisé dans les liens et dans la réponse de l'élève. */
  id: string
  /** Contenu affiché, éventuellement du LaTeX entre `$`. */
  texte: string
}

/** Un lien tracé entre une étiquette de gauche et une étiquette de droite. */
export type LienRelier = {
  gauche: string
  droite: string
}

/** État complet d'un composant « Relier les étiquettes ». */
export type RelierEtiquettesConfig = {
  gauche: EtiquetteRelier[]
  droite: EtiquetteRelier[]
  /** Liens déjà tracés (correction, restauration d'une copie). */
  liens: LienRelier[]
  /** Autorise plusieurs liens par étiquette (sinon un lien remplace le précédent). */
  multiple: boolean
}

/**
 * Palette des traits, partagée par les trois rendus (HTML, LaTeX, Typst) pour
 * qu'un même lien garde sa couleur d'un format à l'autre. L'indice utilisé est
 * celui de l'étiquette de gauche du lien.
 */
export const COULEURS_LIENS = [
  '#2563eb',
  '#ea580c',
  '#059669',
  '#7c3aed',
  '#db2777',
  '#ca8a04',
  '#0891b2',
  '#4d7c0f',
] as const

/** Couleur du trait d'un lien partant de l'étiquette de gauche d'indice `index`. */
export function couleurLien(index: number): string {
  const taille = COULEURS_LIENS.length
  return COULEURS_LIENS[((index % taille) + taille) % taille]
}

/**
 * Clé de comparaison d'un lien, indépendante de l'ordre de création.
 * JSON plutôt qu'une concaténation : les identifiants étant libres, deux
 * couples différents ne doivent pas pouvoir produire la même clé.
 */
export function cleLien(lien: LienRelier): string {
  return JSON.stringify([lien.gauche, lien.droite])
}

/** Normalise une étiquette donnée sous forme de chaîne ou d'objet. */
export function normaliseEtiquettes(
  etiquettes: (string | EtiquetteRelier)[],
  prefixe: string,
): EtiquetteRelier[] {
  return etiquettes.map((etiquette, index) =>
    typeof etiquette === 'string'
      ? { id: `${prefixe}${index}`, texte: etiquette }
      : { id: etiquette.id ?? `${prefixe}${index}`, texte: etiquette.texte },
  )
}

/** Relit une liste de liens sérialisée (chaîne JSON, tableau ou `undefined`). */
export function parseLiens(value: unknown): LienRelier[] {
  if (typeof value === 'string') {
    if (value.trim() === '') return []
    try {
      return parseLiens(JSON.parse(value))
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value.filter(
    (lien): lien is LienRelier =>
      typeof lien === 'object' &&
      lien !== null &&
      typeof lien.gauche === 'string' &&
      typeof lien.droite === 'string',
  )
}

/** Relit une liste d'étiquettes sérialisée (attribut HTML ou tableau). */
export function parseEtiquettes(value: unknown): EtiquetteRelier[] {
  if (typeof value === 'string') {
    if (value.trim() === '') return []
    try {
      return parseEtiquettes(JSON.parse(value))
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value.filter(
    (etiquette): etiquette is EtiquetteRelier =>
      typeof etiquette === 'object' &&
      etiquette !== null &&
      typeof etiquette.id === 'string' &&
      typeof etiquette.texte === 'string',
  )
}
