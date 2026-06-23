import {
  createAutomatismesCanExercice,
  type ExerciceModule,
} from '../_automatismesCan'

export const titre = "Sélection d'automatismes"
export const interactifReady = true
// Les automatismes de 1e sont des qcms, MetaExerciceCan produit un interactifType = 'mathLive' !
export const interactifType = 'qcm'
export const uuid = '722e4'
export const refs = { 'fr-fr': ['1A'], 'fr-ch': [] }
export const dateDePublication = '30/04/2026'

/**
 * @author Rémi Angot
 */

// Chargement lazy : seuls les modules sélectionnés sont téléchargés
const allModules = import.meta.glob('./1A-*.ts') as Record<
  string,
  () => Promise<ExerciceModule>
>

export default createAutomatismesCanExercice({
  modules: allModules,
  refRegex: /^1A-([CEFPRSG])/,
  categories: ['C', 'E', 'F', 'P', 'R', 'S', 'G'],
  categoriesForm: {
    titre: 'Nombre de questions par catégorie',
    categories: [
      { label: 'Calcul :', max: 12 },
      { label: 'Évolution :', max: 12 },
      { label: 'Fonctions :', max: 12 },
      { label: 'Probabilités :', max: 12 },
      { label: 'Proportions :', max: 12 },
      { label: 'Statistiques :', max: 12 },
      { label: 'Géométrie :', max: 12 },
    ],
    defaut: [2, 2, 2, 2, 2, 1, 1],
  },
  defaultSup: '2-2-2-2-2-2',
  interactifType: 'qcm',
})
