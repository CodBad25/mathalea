/**
 * Exercices du référentiel de MathALÉA pour les parcours de l'application :
 * ceux du moteur (src/moteur), indexés par uuid, avec l'objectif du programme
 * sous lequel le site les range.
 */
import { listerExercices, type ExerciceDuReferentiel } from '../../moteur'

export type ReferentialExercise = ExerciceDuReferentiel & {
  objective?: { code: string; libelle: string }
}

let cache: Promise<Map<string, ReferentialExercise>> | null = null

/** Index des exercices par uuid (chargé une fois, à la demande) */
export function exerciseIndex(): Promise<Map<string, ReferentialExercise>> {
  cache ??= listerExercices('FR').then((list) => {
    const index = new Map<string, ReferentialExercise>()
    // Un exercice rangé à plusieurs endroits : sa place sous un objectif du programme d'abord
    for (const e of list) {
      const known = index.get(e.uuid)
      if (!known || (!known.objective && e.objectif))
        index.set(e.uuid, { ...e, objective: e.objectif })
    }
    return index
  })
  return cache
}

export interface OfficialChapter {
  code: string // 5N2…
  name: string
}

let chapterCache: Promise<Record<string, OfficialChapter[]>> | null = null

/** Chapitres du site par niveau (référentiel), dans l'ordre du menu */
export function officialChapters(): Promise<Record<string, OfficialChapter[]>> {
  chapterCache ??= Promise.all([
    import('../../json/referentiel2022FR.json'),
    import('../../json/levelsThemesList.json'),
  ]).then(([{ default: referential }, { default: names }]) => {
    const titles = names as Record<string, { titre?: string }>
    const result: Record<string, OfficialChapter[]> = {}
    for (const [level, chapters] of Object.entries(
      referential as Record<string, Record<string, unknown>>,
    )) {
      result[level] = Object.keys(chapters ?? {})
        .filter((code) => titles[code]?.titre)
        .map((code) => ({ code, name: titles[code].titre! }))
    }
    return result
  })
  return chapterCache
}

/** Rubrique et niveau du menu « Ajouter un exercice » pour un niveau de l'application */
export function menuPathFor(level: string, chapterCode?: string): string[] {
  const college = ['6e', '5e', '4e', '3e']
  const lycee: Record<string, string> = {
    '2e': '2e',
    '1re': '1e',
    Terminale: 'terminale',
  }
  const base = college.includes(level)
    ? ['college', level]
    : lycee[level]
      ? ['lycee', lycee[level]]
      : []
  return base.length && chapterCode ? [...base, chapterCode] : base
}
