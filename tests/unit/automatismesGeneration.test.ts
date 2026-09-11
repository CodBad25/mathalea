import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import MetaExercice from '../../src/exercices/MetaExerciceCan'
import {
  createAutomatismesCanExercice,
  type ExerciceModule,
} from '../../src/exercices/_automatismesCan'

function deferredModule() {
  let resolve!: (module: ExerciceModule) => void
  let reject!: (error: Error) => void
  const promise = new Promise<ExerciceModule>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

class QuestionA extends Exercice {
  titre = 'A'
}
class QuestionB extends Exercice {
  titre = 'B'
}

// Laisser finir les chaînes de promesses, y compris celles qui doivent être
// ignorées et ne doivent donc pas émettre d'événement de fin.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
let fixtureIndex = 0

function fixture() {
  const prefix = `race${++fixtureIndex}`
  const a = deferredModule()
  const b = deferredModule()
  const Selection = createAutomatismesCanExercice({
    modules: {
      [`${prefix}A01`]: () => a.promise,
      [`${prefix}B01`]: () => b.promise,
    },
    refRegex: new RegExp(`^${prefix}([AB])`),
    categories: ['A', 'B'],
    categoriesForm: {
      titre: 'Questions par catégorie',
      categories: [
        { label: 'A', max: 1 },
        { label: 'B', max: 1 },
      ],
      defaut: [1, 0],
    },
    defaultSup: '1-0',
  })
  const exercise = new Selection()
  exercise.seed = 'jYwp'
  return { exercise, Selection, a, b }
}

describe('Ordre des générations asynchrones des automatismes', () => {
  const updated = vi.fn()
  const notify = vi.fn()

  beforeEach(() => {
    updated.mockClear()
    notify.mockClear()
    vi.stubGlobal('notify', notify)
    document.addEventListener('updateAsyncEx', updated)
    // Isoler l'ordonnancement du rendu mathématique, testé par automatismesCan.
    vi.spyOn(MetaExercice.prototype, 'nouvelleVersion').mockImplementation(
      function () {
        this.listeQuestions = this.Exercices.map(
          (Question) => new Question().titre,
        )
        this.listeCorrections = this.listeQuestions.map(
          (title) => `Correction ${title}`,
        )
        this.autoCorrection = this.listeQuestions.map((title) => ({
          formatInteractif: title === 'A' ? 'mathlive' : 'clique-figure',
        }))
      },
    )
  })

  afterEach(() => {
    document.removeEventListener('updateAsyncEx', updated)
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('conserve B lorsque A termine après B, avec les métadonnées et paramètres de B', async () => {
    const { exercise, a, b } = fixture()
    exercise.nouvelleVersion()
    expect(exercise.generationStatus).toBe('loading')
    exercise.sup = '0-1'
    exercise.sup2 = true
    exercise.nouvelleVersion()
    b.resolve({ default: QuestionB })
    await settle()
    expect(exercise.listeQuestions).toEqual(['B'])
    expect(exercise.generationStatus).toBe('ready')
    expect(updated).toHaveBeenCalledTimes(1)

    a.resolve({ default: QuestionA })
    await settle()
    expect(exercise.listeQuestions).toEqual(['B'])
    expect(exercise.listeCorrections).toEqual(['Correction B'])
    expect(exercise.autoCorrection[0].formatInteractif).toBe('clique-figure')
    expect(exercise.sup).toBe('0-1')
    expect(exercise.sup2).toBe(true)
    expect(exercise.generationStatus).toBe('ready')
    expect(exercise.questionRefs?.[0]).toMatch(/B01$/)
    expect(updated).toHaveBeenCalledTimes(1)
  })

  it('une génération depuis le cache invalide aussi une génération en attente', async () => {
    const { exercise, a, b } = fixture()
    exercise.sup = '0-1'
    exercise.nouvelleVersion()
    b.resolve({ default: QuestionB })
    await settle()
    updated.mockClear()

    exercise.sup = '1-0'
    exercise.nouvelleVersion()
    exercise.sup = '0-1'
    exercise.nouvelleVersion()
    expect(exercise.listeQuestions).toEqual(['B'])
    a.resolve({ default: QuestionA })
    await settle()
    expect(exercise.listeQuestions).toEqual(['B'])
    expect(exercise.generationStatus).toBe('ready')
    expect(updated).not.toHaveBeenCalled()
  })

  it('ignore les résultats reçus après destruction', async () => {
    const { exercise, a } = fixture()
    exercise.nouvelleVersion()
    exercise.destroy()
    const before = [...exercise.listeQuestions]
    a.resolve({ default: QuestionA })
    await settle()
    expect(exercise.listeQuestions).toEqual(before)
    expect(updated).not.toHaveBeenCalled()
  })

  it('ignore les erreurs des générations remplacées', async () => {
    const { exercise, a, b } = fixture()
    exercise.nouvelleVersion()
    exercise.sup = '0-1'
    exercise.nouvelleVersion()
    b.resolve({ default: QuestionB })
    await settle()
    a.reject(new Error('Ancien chargement en échec'))
    await settle()
    expect(exercise.listeQuestions).toEqual(['B'])
    expect(notify).not.toHaveBeenCalled()
  })

  it('signale encore une erreur de la génération courante', async () => {
    const { exercise, a } = fixture()
    exercise.nouvelleVersion()
    a.reject(new Error('Chargement courant en échec'))
    await settle()
    expect(notify).toHaveBeenCalledOnce()
    expect(exercise.generationStatus).toBe('error')
    expect(updated).not.toHaveBeenCalled()
  })

  it('isole les générations de deux instances du même sélecteur', async () => {
    const { exercise, Selection, a, b } = fixture()
    const other = new Selection()
    other.sup = '0-1'
    exercise.nouvelleVersion()
    other.nouvelleVersion()
    b.resolve({ default: QuestionB })
    a.resolve({ default: QuestionA })
    await settle()
    expect(exercise.listeQuestions).toEqual(['A'])
    expect(other.listeQuestions).toEqual(['B'])
    expect(updated).toHaveBeenCalledTimes(2)
  })
})
