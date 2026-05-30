import seedrandom from 'seedrandom'
import Exercice from './Exercice'
import MetaExercice from './MetaExerciceCan'

/**
 * Code commun aux exercices « Sélection d'automatismes » (1A, 3A, …).
 *
 * Ces exercices tirent aléatoirement, par catégorie, un certain nombre de
 * questions parmi tous les automatismes d'un niveau, puis délèguent l'affichage
 * à {@link MetaExercice} (MetaExerciceCan). Seules la liste des modules, les
 * catégories et le formulaire associé changent d'un niveau à l'autre : tout le
 * reste est factorisé ici.
 *
 * @author Rémi Angot
 */

export type ExerciceModule = {
  default: new () => Exercice
  refs?: Record<string, string[]>
}

type CategoryEntry = { loader: () => Promise<ExerciceModule>; ref: string }

export type CategoriesForm = {
  titre: string
  categories: { label: string; max: number }[]
  defaut: number[]
}

export type AutomatismesCanConfig = {
  /** Modules chargés en lazy via `import.meta.glob` (eager: false) dans le fichier appelant */
  modules: Record<string, () => Promise<ExerciceModule>>
  /** Expression régulière extrayant la lettre de catégorie du nom de fichier (un groupe capturant) */
  refRegex: RegExp
  /** Liste ordonnée des lettres de catégories */
  categories: readonly string[]
  /** Formulaire « nombre de questions par catégorie » */
  categoriesForm: CategoriesForm
  /** Valeur par défaut de `sup` (ex. `'2-2-2-2-2-2'`) */
  defaultSup: string
  /** Type d'interactivité à forcer sur l'instance (sinon celui de MetaExerciceCan) */
  interactifType?: string
}

function pickRandom<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/**
 * Fabrique la classe d'un exercice « Sélection d'automatismes » à partir de sa
 * configuration de niveau.
 */
export function createAutomatismesCanExercice(config: AutomatismesCanConfig) {
  const {
    modules,
    refRegex,
    categories,
    categoriesForm,
    defaultSup,
    interactifType,
  } = config

  // Indexation des exercices par catégorie à partir des noms de fichiers (sans chargement)
  const categoryEntries: Record<string, CategoryEntry[]> = {}
  for (const cat of categories) categoryEntries[cat] = []

  for (const [path, loader] of Object.entries(modules)) {
    const filename = path.replace(/^.*\//, '').replace(/\.ts$/, '')
    const match = filename.match(refRegex)
    if (match && match[1] in categoryEntries) {
      categoryEntries[match[1]].push({ loader, ref: filename })
    }
  }

  return class AutomatismesCan extends MetaExercice {
    constructor() {
      super([])
      if (interactifType) this.interactifType = interactifType
      this.sup = defaultSup
      this.sup3 = false
      this.sup4 = false // graine figée de la sélection quand sup3 est coché
      this.besoinFormulaire2CaseACocher = [
        'Afficher la référence de chaque question',
      ]
      this.besoinFormulaire3CaseACocher = ['Garder la sélection d\'exercices']
      this.besoinFormulaireNombresCategories = categoriesForm
      this.comment = ''
    }

    nouvelleVersion(): void {
      const showRefs = !!this.sup2
      const keepSelection = !!this.sup3
      const savedSup = this.sup
      const savedSup2 = this.sup2
      const savedSup3 = this.sup3

      const parts = String(this.sup || defaultSup)
        .split('-')
        .map((s) => {
          const n = parseInt(s)
          return isNaN(n) ? 2 : Math.max(0, n)
        })

      // « Garder la sélection d'exercices » : on fige dans sup4 (paramètre
      // persisté et inutilisé par MetaExerciceCan) la graine de la sélection.
      // Au moment où la case est cochée, this.seed vaut encore la graine de la
      // version affichée (modifier un formulaire ne régénère pas la graine) :
      // on la capture donc telle quelle, ce qui conserve exactement la
      // sélection et l'ordre à l'écran (pas de saut). Les données des questions
      // dépendent de this.seed et continuent d'être aléatoirisées à chaque
      // « Nouvelles données ».
      let selectionSeed: string
      if (keepSelection) {
        const frozen = this.sup4
        if (frozen != null && frozen !== false && String(frozen) !== '') {
          selectionSeed = String(frozen)
        } else {
          selectionSeed = String(this.seed)
          this.sup4 = selectionSeed
        }
      } else {
        selectionSeed = String(this.seed)
        this.sup4 = false
      }
      const rng = seedrandom(selectionSeed)

      const selected: CategoryEntry[] = []
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i]
        const picked = pickRandom(categoryEntries[cat], parts[i] ?? 2, rng)
        selected.push(...picked)
      }

      // Mélanger toutes les questions sélectionnées
      selected.sort(() => rng() - 0.5)

      const totalQuestions = selected.length
      this.nbQuestions = totalQuestions

      // Forcer les params de formulaire avant le retour synchrone — MetaExercice
      // constructor a mis besoinFormulaireCaseACocher = ['Sujet officiel'] et le
      // framework lirait ces valeurs si on ne les corrige pas maintenant.
      this.besoinFormulaireCaseACocher = false
      this.besoinFormulaire2CaseACocher = [
        'Afficher la référence de chaque question',
      ]
      this.besoinFormulaire2Texte = false
      this.besoinFormulaire3CaseACocher = ['Garder la sélection d\'exercices']
      this.besoinFormulaireNombresCategories = categoriesForm

      // Placeholders pendant le chargement asynchrone
      this.listeQuestions = Array(totalQuestions).fill('chargement...')
      this.listeCorrections = Array(totalQuestions).fill('')
      this.autoCorrection = Array(totalQuestions).fill(undefined)

      // Chargement uniquement des modules sélectionnés
      Promise.all(selected.map((e) => e.loader())).then((loadedModules) => {
        this.Exercices = loadedModules.map((m) => m.default)
        this.sup2 = selected.map((_, i) => i + 1).join('-')
        this.sup = false
        this.sup3 = false

        super.nouvelleVersion()

        this.questionRefs = showRefs ? selected.map((e) => e.ref) : undefined

        // Restaurer nos paramètres de formulaire après l'écrasement par MetaExerciceCan
        this.comment = ''
        this.sup = savedSup
        this.sup2 = savedSup2
        this.sup3 = savedSup3
        // this.sup4 n'est pas restauré : il conserve la graine figée (ou false)
        // afin d'être persisté dans l'URL et réutilisé aux versions suivantes.
        this.besoinFormulaireCaseACocher = false
        this.besoinFormulaire2CaseACocher = [
          'Afficher la référence de chaque question',
        ]
        this.besoinFormulaire2Texte = false
        this.besoinFormulaire3CaseACocher = ['Garder la sélection d\'exercices']
        this.besoinFormulaireNombresCategories = categoriesForm

        document.dispatchEvent(
          new window.Event('updateAsyncEx', { bubbles: true }),
        )
      })
    }
  }
}
