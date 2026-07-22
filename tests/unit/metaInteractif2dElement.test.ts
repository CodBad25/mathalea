import { beforeEach, describe, expect, it, vi } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { MetaInteractif2dElement } from '../../src/lib/customElements/MetaInteractif2dElement'
import {
  listOfCustomElements,
  mathaleaCustomElementsRegistry,
} from '../../src/lib/customElements/MathaleaCustomElement'
import {
  exerciceInteractif,
  handleAnswers,
} from '../../src/lib/interactif/gestionInteractif'
import { interactivityTypeToCustomElementFormat } from '../../src/lib/types'
import { setOutputHtml } from '../../src/modules/context'

describe('MetaInteractif2dElement', () => {
  let exercice: Exercice

  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
    exercice = new Exercice()
    exercice.numeroExercice = 5
    exercice.nbQuestions = 1
    exercice.interactif = true
  })

  it('enregistre le tag dans les registres MathALEA', () => {
    expect(customElements.get('meta-interactif-2d')).toBe(
      MetaInteractif2dElement,
    )
    expect(listOfCustomElements).toContain('meta-interactif-2d')
    expect(mathaleaCustomElementsRegistry.get('meta-interactif-2d')).toBe(
      MetaInteractif2dElement,
    )
  })

  it('normalise le format MetaInteractif2d historique pour le dispatch', () => {
    expect(interactivityTypeToCustomElementFormat('MetaInteractif2d')).toBe(
      'meta-interactif-2d',
    )
  })

  it('cree un wrapper en conservant le math-field interne', () => {
    const html = MetaInteractif2dElement.create({
      numeroExercice: 5,
      questionIndex: 0,
      fieldIndex: 0,
      innerHtml: '<math-field id="MetaInteractif2dEx5Q0field0"></math-field>',
    })

    expect(html).toContain('<meta-interactif-2d')
    expect(html).toContain('id="meta-interactif-2dEx5Q0field0"')
    expect(html).toContain('id="MetaInteractif2dEx5Q0field0"')
  })

  it('verifie une question par le dispatch central', () => {
    handleAnswers(
      exercice,
      0,
      { field0: { value: '7' } },
      { formatInteractif: 'MetaInteractif2d' },
    )
    document.body.innerHTML = MetaInteractif2dElement.create({
      numeroExercice: 5,
      questionIndex: 0,
      fieldIndex: 0,
      innerHtml: '<math-field id="MetaInteractif2dEx5Q0field0"></math-field>',
    })
    const field = document.getElementById(
      'MetaInteractif2dEx5Q0field0',
    ) as HTMLElement & {
      getPromptValue: (prompt: string) => string
      setPromptState: (prompt: string, state: string, value: boolean) => void
    }
    field.getPromptValue = vi.fn(() => '7')
    field.setPromptState = vi.fn()

    const result = exerciceInteractif(
      exercice,
      document.createElement('div'),
      document.createElement('button'),
    )

    expect(result).toEqual({ numberOfPoints: 1, numberOfQuestions: 1 })
    expect(document.getElementById('resultatCheckEx5Q0')?.innerHTML).toBe('😎')
    expect(field.setPromptState).toHaveBeenCalledWith('champ1', 'correct', true)
    expect(exercice.answers?.MetaInteractif2dEx5Q0).toBe(
      '{"MetaInteractif2dEx5Q0field0":"7"}',
    )
  })
})
