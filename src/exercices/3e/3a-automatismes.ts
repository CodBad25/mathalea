import MetaExercice from '../MetaExerciceCan'
import Exercice from '../Exercice'
import seedrandom from 'seedrandom'

export const titre = 'Sélection d\'automatismes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'c6be6'
export const refs = { 'fr-fr': ['3A'], 'fr-ch': [] }
export const dateDePublication = '08/05/2026'

/**
 * @author Rémi Angot
 */

type ExerciceModule = {
  default: new () => Exercice
  refs?: Record<string, string[]>
}

// Chargement synchrone de tous les exercices 3Auto au build-time
const allModules = import.meta.glob('./3Auto*.ts', {
  eager: true,
}) as Record<string, ExerciceModule>

type CategoryEntry = { ExerciceClass: new () => Exercice; ref: string }

const categoryEntries: Record<string, CategoryEntry[]> = {
  G: [],
  I: [],
  M: [],
  N: [],
  P: [],
}

for (const mod of Object.values(allModules)) {
  const frRefs = mod.refs?.['fr-fr'] ?? []
  for (const ref of frRefs) {
    const match = ref.match(/^3Auto([GIMNP])/)
    if (match && match[1] in categoryEntries) {
      categoryEntries[match[1]].push({ ExerciceClass: mod.default, ref })
      break
    }
  }
}

const CATEGORIES = ['G', 'I', 'M', 'N', 'P'] as const

function pickRandom<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

const CATEGORIES_FORM = {
  titre: 'Nombre de questions par catégorie',
  categories: [
    { label: 'Géométrie :', max: 12 },
    { label: 'Scratch :', max: 12 },
    { label: 'Mesure :', max: 12 },
    { label: 'Calcul :', max: 12 },
    { label: 'Statistiques :', max: 12 },
  ],
  defaut: [2, 2, 2, 2, 2],
}

export default class Automatismes3A extends MetaExercice {
  constructor() {
    super([])
    this.sup = '2-2-2-2-2'
    this.besoinFormulaire2CaseACocher = [
      'Afficher la référence de chaque question',
    ]
    this.besoinFormulaireNombresCategories = CATEGORIES_FORM
    this.comment = ''
  }

  nouvelleVersion(): void {
    const showRefs = !!this.sup2
    const savedSup = this.sup
    const savedSup2 = this.sup2

    const parts = String(this.sup || '2-2-2-2-2')
      .split('-')
      .map((s) => {
        const n = parseInt(s)
        return isNaN(n) ? 2 : Math.max(0, n)
      })

    const rng = seedrandom(String(this.seed))

    const selected: CategoryEntry[] = []
    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i]
      const picked = pickRandom(categoryEntries[cat], parts[i] ?? 2, rng)
      selected.push(...picked)
    }

    // Mélanger toutes les questions sélectionnées
    selected.sort(() => rng() - 0.5)

    // Préparer les paramètres pour MetaExerciceCan
    this.Exercices = selected.map((e) => e.ExerciceClass)
    this.sup2 = selected.map((_, i) => i + 1).join('-')
    this.sup = false // canOfficielle = false → données aléatoires

    super.nouvelleVersion()

    // Référence de chaque question (uniquement pour vue prof/élève)
    this.questionRefs = showRefs ? selected.map((e) => e.ref) : undefined

    // Restaurer nos paramètres de formulaire après l'écrasement par MetaExerciceCan
    this.comment = ''
    this.sup = savedSup
    this.sup2 = savedSup2
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire2CaseACocher = [
      'Afficher la référence de chaque question',
    ]
    this.besoinFormulaire2Texte = false
    this.besoinFormulaire3CaseACocher = false
    this.besoinFormulaireNombresCategories = CATEGORIES_FORM
  }
}
