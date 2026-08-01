import { describe, expect, it } from 'vitest'
import AutomatismesPremiere from '../../src/exercices/1e/1a-automatismes'
import AutomatismesTroisieme from '../../src/exercices/3e/3a-automatismes'
import { createAutomatismesCanExercice } from '../../src/exercices/_automatismesCan'
import type { CategoriesForm } from '../../src/exercices/_automatismesCan'

/**
 * Les exercices « Sélection d'automatismes » (1A, 3A, …) déduisent leur nombre
 * de questions du formulaire par catégories. Le diaporama lit `nbQuestions` et
 * `besoinFormulaireNombresCategories` pour afficher le total et verrouiller le
 * champ correspondant : ces tests protègent ce contrat.
 */

const cases = [
  { titre: '1A', Exercice: AutomatismesPremiere },
  { titre: '3A', Exercice: AutomatismesTroisieme },
]

describe.each(cases)('$titre - Sélection d\'automatismes', ({ Exercice }) => {
  it('interdit de régler le nombre de questions ailleurs que par catégorie', () => {
    expect(new Exercice().nbQuestionsModifiable).toBe(false)
  })

  it('propose une valeur de `sup` par défaut par catégorie', () => {
    const exercice = new Exercice()
    const categories = (
      exercice.besoinFormulaireNombresCategories as CategoriesForm
    ).categories
    expect(String(exercice.sup).split('-')).toHaveLength(categories.length)
  })

  it('ne demande jamais plus de questions qu\'il n\'y a d\'exercices', () => {
    const exercice = new Exercice()
    const form = exercice.besoinFormulaireNombresCategories as CategoriesForm
    form.categories.forEach((categorie, i) => {
      expect(form.defaut[i]).toBeLessThanOrEqual(categorie.max)
    })
  })

  it('annonce un nombre de questions égal à la somme des catégories', async () => {
    const exercice = new Exercice()
    exercice.seed = 'test'
    const total = String(exercice.sup)
      .split('-')
      .reduce((somme, part) => somme + parseInt(part), 0)
    // `nouvelleVersion()` charge les modules sélectionnés en tâche de fond et
    // signale la fin du chargement par un événement `updateAsyncEx`.
    const chargementTermine = new Promise<void>((resolve) => {
      document.addEventListener('updateAsyncEx', () => resolve(), {
        once: true,
      })
    })
    exercice.nouvelleVersion()
    expect(exercice.nbQuestions).toBe(total)
    await chargementTermine
  }, 30000)
})

describe('createAutomatismesCanExercice', () => {
  const categoriesForm: CategoriesForm = {
    titre: 'Nombre de questions par catégorie',
    categories: [
      { label: 'Abondante :', max: 12 },
      { label: 'Rare :', max: 12 },
    ],
    defaut: [2, 2],
  }
  const modules = {
    './XA01.ts': async () => ({ default: class {} }),
    './XA02.ts': async () => ({ default: class {} }),
    './XB01.ts': async () => ({ default: class {} }),
  } as unknown as Parameters<typeof createAutomatismesCanExercice>[0]['modules']

  it('borne le formulaire et le `sup` par défaut sur les exercices existants', () => {
    const Exercice = createAutomatismesCanExercice({
      modules,
      refRegex: /^X([AB])/,
      categories: ['A', 'B'],
      categoriesForm,
      defaultSup: '2-2',
    })
    const exercice = new Exercice()
    const form = exercice.besoinFormulaireNombresCategories as CategoriesForm
    // La catégorie B n'a qu'un seul exercice disponible
    expect(form.categories.map((c) => c.max)).toEqual([2, 1])
    expect(exercice.sup).toBe('2-1')
  })
})
