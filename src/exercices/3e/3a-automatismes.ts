import {
  createAutomatismesCanExercice,
  type ExerciceModule,
} from '../_automatismesCan'

export const titre = 'Sélection d\'automatismes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'c6be6'
export const refs = { 'fr-fr': ['3A'], 'fr-ch': [] }
export const dateDePublication = '08/05/2026'

/**
 * @author Rémi Angot
 */

// Chargement lazy : seuls les modules sélectionnés sont téléchargés
const allModules = import.meta.glob('./3Auto*.ts') as Record<
  string,
  () => Promise<ExerciceModule>
>

export default createAutomatismesCanExercice({
  modules: allModules,
  refRegex: /^3Auto([GIMNP])/,
  categories: ['G', 'I', 'M', 'N', 'P'],
  categoriesForm: {
    titre: 'Nombre de questions par catégorie',
    categories: [
      { label: 'Géométrie :', max: 12 },
      { label: 'Scratch :', max: 12 },
      { label: 'Mesure :', max: 12 },
      { label: 'Calcul :', max: 12 },
      { label: 'Statistiques :', max: 12 },
    ],
    defaut: [2, 2, 2, 2, 2],
  },
  defaultSup: '2-2-2-2-2',
})
