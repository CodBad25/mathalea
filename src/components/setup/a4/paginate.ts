import type { A4UnitData } from './types'

/**
 * Répartit les unités de contenu dans des pages A4 composées de colonnes.
 *
 * Algorithme glouton : on remplit chaque colonne jusqu'à sa hauteur maximale
 * puis on passe à la colonne suivante (et à la page suivante quand toutes les
 * colonnes de la page sont pleines). Les titres et consignes restent solidaires
 * de l'unité qui les suit pour éviter un titre orphelin en bas de colonne.
 *
 * @param units unités de contenu dans l'ordre du document
 * @param heights hauteur mesurée (en px) de chaque unité, même indexation que `units`
 * @param firstPageColumnHeight hauteur utile (px) des colonnes de la première page (en-tête déduit)
 * @param columnHeight hauteur utile (px) des colonnes des pages suivantes
 * @param columnsPerPage nombre de colonnes par page
 * @param forcedBreaksAfter indices d'unités après lesquelles un saut de colonne est imposé
 * @returns pages → colonnes → indices d'unités
 */
export function paginate(
  units: A4UnitData[],
  heights: number[],
  firstPageColumnHeight: number,
  columnHeight: number,
  columnsPerPage: number,
  forcedBreaksAfter: Set<number> = new Set(),
): number[][][] {
  // Groupes insécables : titre(s) et consigne collés à l'unité suivante du même exercice
  const groups: number[][] = []
  let currentGroup: number[] = []
  for (let i = 0; i < units.length; i++) {
    currentGroup.push(i)
    const isSticky = units[i].kind === 'title' || units[i].kind === 'intro'
    const nextIsSameExercise =
      i + 1 < units.length &&
      units[i + 1].exerciseIndex === units[i].exerciseIndex
    if (!(isSticky && nextIsSameExercise) || forcedBreaksAfter.has(i)) {
      groups.push(currentGroup)
      currentGroup = []
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)

  const pages: number[][][] = []
  let page: number[][] = []
  let column: number[] = []
  let usedHeight = 0

  const maxHeight = () =>
    pages.length === 0 ? firstPageColumnHeight : columnHeight

  const closeColumn = () => {
    page.push(column)
    column = []
    usedHeight = 0
    if (page.length === columnsPerPage) {
      pages.push(page)
      page = []
    }
  }

  for (const group of groups) {
    const groupHeight = group.reduce((sum, i) => sum + heights[i], 0)
    // Si le groupe ne tient pas dans la place restante, on change de colonne.
    // Un groupe plus haut qu'une colonne entière est placé seul (il débordera).
    if (usedHeight > 0 && usedHeight + groupHeight > maxHeight()) {
      closeColumn()
    }
    column.push(...group)
    usedHeight += groupHeight
    // Saut de colonne imposé par l'utilisateur après la dernière unité du groupe
    if (forcedBreaksAfter.has(group[group.length - 1])) {
      closeColumn()
    }
  }
  if (column.length > 0) page.push(column)
  if (page.length > 0) pages.push(page)
  if (pages.length === 0) pages.push([[]])

  // On complète avec des colonnes vides pour que la mise en page flex reste stable
  for (const p of pages) {
    while (p.length < columnsPerPage) p.push([])
  }
  return pages
}
