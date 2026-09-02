/** Données minimales nécessaires au calcul du barème proposé d'un exercice. */
interface CoverBaremeExercise {
  listeQuestions?: unknown[]
  nbQuestions?: number
}

/**
 * Propose un point par item généré. Pendant l'ajout ou la duplication,
 * `listeQuestions` peut être encore vide : le nombre configuré prend alors
 * le relais jusqu'à la première génération de l'exercice.
 */
export function defaultCoverPoints(
  exercise: CoverBaremeExercise | null | undefined,
): number {
  const generatedCount = exercise?.listeQuestions?.length ?? 0
  if (generatedCount > 0) return generatedCount
  const configuredCount = Number(exercise?.nbQuestions)
  return Number.isFinite(configuredCount) && configuredCount > 0
    ? configuredCount
    : 1
}
