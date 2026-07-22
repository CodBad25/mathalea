import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import {
  CliqueFigureElement,
  prepareCliqueFigure,
} from '../../src/lib/customElements/CliqueFigureElement'
import {
  listOfCustomElements,
  mathaleaCustomElementsRegistry,
} from '../../src/lib/customElements/MathaleaCustomElement'
import {
  exerciceInteractif,
  setCliqueFigure,
} from '../../src/lib/interactif/gestionInteractif'
import { interactivityTypeToCustomElementFormat } from '../../src/lib/types'
import { setOutputHtml } from '../../src/modules/context'

describe('CliqueFigureElement', () => {
  let exercice: Exercice

  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
    exercice = new Exercice()
    exercice.numeroExercice = 3
    exercice.nbQuestions = 1
    exercice.autoCorrection[0] = {}
    exercice.cliqueFiguresArray = [
      [
        { id: 'figureA', solution: true },
        { id: 'figureB', solution: false },
      ],
    ]
  })

  it('enregistre le tag dans les registres MathALEA', () => {
    expect(customElements.get('clique-figure')).toBe(CliqueFigureElement)
    expect(listOfCustomElements).toContain('clique-figure')
    expect(mathaleaCustomElementsRegistry.get('clique-figure')).toBe(
      CliqueFigureElement,
    )
  })

  it('normalise le format cliqueFigure historique pour le dispatch', () => {
    expect(interactivityTypeToCustomElementFormat('cliqueFigure')).toBe(
      'clique-figure',
    )
  })

  it('prepare, verifie et fige les figures existantes', () => {
    setCliqueFigure(exercice.autoCorrection[0])
    document.body.innerHTML = `
      <div id="exercice3">
        <div id="figureA"></div>
        <div id="figureB"></div>
        <span id="resultatCheckEx3Q0"></span>
      </div>
    `
    prepareCliqueFigure(exercice)
    const host = document.querySelector('clique-figure') as CliqueFigureElement
    const figureA = document.getElementById('figureA')!
    const figureB = document.getElementById('figureB')!

    figureA.click()
    const result = CliqueFigureElement.verifQuestion(exercice, 0)

    expect(host.id).toBe('clique-figureEx3Q0')
    expect(result).toEqual({
      isOk: true,
      feedback: '',
      score: { nbBonnesReponses: 1, nbReponses: 1 },
    })
    expect(document.getElementById('resultatCheckEx3Q0')?.innerHTML).toBe('😎')
    expect(exercice.answers?.figureA).toBe('1')
    expect(exercice.answers?.['clique-figureEx3Q0']).toBe('["figureA"]')
    expect(
      (figureA as typeof figureA & { hasMathaleaListener: boolean })
        .hasMathaleaListener,
    ).toBe(false)
    expect(
      (figureB as typeof figureB & { hasMathaleaListener: boolean })
        .hasMathaleaListener,
    ).toBe(false)
  })

  it('corrige le format historique par le dispatch central', () => {
    exercice.autoCorrection[0].formatInteractif = 'cliqueFigure'
    document.body.innerHTML = `
      <div id="exercice3">
        <div id="figureA"></div>
        <div id="figureB"></div>
        <span id="resultatCheckEx3Q0"></span>
      </div>
    `
    prepareCliqueFigure(exercice)
    document.getElementById('figureA')?.click()

    const result = exerciceInteractif(
      exercice,
      document.createElement('div'),
      document.createElement('button'),
    )

    expect(result).toEqual({ numberOfPoints: 1, numberOfQuestions: 1 })
    expect(exercice.answers?.figureA).toBe('1')
  })
})
