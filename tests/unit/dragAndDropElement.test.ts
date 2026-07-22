import { beforeEach, describe, expect, it, vi } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { DragAndDropElement } from '../../src/lib/customElements/DragAndDropElement'
import {
  listOfCustomElements,
  mathaleaCustomElementsRegistry,
} from '../../src/lib/customElements/MathaleaCustomElement'
import DragAndDrop from '../../src/lib/interactif/DragAndDrop'
import {
  exerciceInteractif,
  handleAnswers,
} from '../../src/lib/interactif/gestionInteractif'
import { interactivityTypeToCustomElementFormat } from '../../src/lib/types'
import { setOutputHtml } from '../../src/modules/context'

describe('DragAndDropElement', () => {
  let exercice: Exercice

  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
    exercice = new Exercice()
    exercice.numeroExercice = 4
    exercice.nbQuestions = 1
    exercice.interactif = true
    exercice.dragAndDrops = []
  })

  it('enregistre le tag dans les registres MathALEA', () => {
    expect(customElements.get('drag-and-drop')).toBe(DragAndDropElement)
    expect(listOfCustomElements).toContain('drag-and-drop')
    expect(mathaleaCustomElementsRegistry.get('drag-and-drop')).toBe(
      DragAndDropElement,
    )
  })

  it('normalise le format dnd historique pour le dispatch', () => {
    expect(interactivityTypeToCustomElementFormat('dnd')).toBe('drag-and-drop')
  })

  it('encapsule le HTML historique dans un custom element', () => {
    const dnd = createDnd(exercice)
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    const html = dnd.ajouteDragAndDrop({ melange: false, duplicable: false })

    expect(html).toContain('<drag-and-drop')
    expect(html).toContain('id="drag-and-dropEx4Q0"')
    expect(html).toContain('id="divDragAndDropEx4Q0"')
    expect(html).toContain('id="rectangleEx4Q0R1"')
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'exercicesAffiches',
      expect.any(Function),
    )
    addEventListenerSpy.mockRestore()
  })

  it('verifie une question par le dispatch central', () => {
    const dnd = createDnd(exercice)
    exercice.dragAndDrops[0] = dnd
    handleAnswers(
      exercice,
      0,
      { rectangle1: { value: '1', options: { multi: false } } },
      { formatInteractif: 'dnd' },
    )
    document.body.innerHTML = dnd.ajouteDragAndDrop({
      melange: false,
      duplicable: false,
    })
    const rectangle = document.getElementById('rectangleEx4Q0R1')
    const etiquette = document.getElementById('etiquetteEx4Q0I1')
    rectangle?.appendChild(etiquette!)

    const result = exerciceInteractif(
      exercice,
      document.createElement('div'),
      document.createElement('button'),
    )

    expect(result).toEqual({ numberOfPoints: 1, numberOfQuestions: 1 })
    expect(document.getElementById('resultatCheckEx4Q0')?.innerHTML).toBe('😎')
    expect(exercice.answers?.rectangleDNDEx4Q0R1).toBe('etiquetteEx4Q0I1')
  })
})

function createDnd(exercice: Exercice): DragAndDrop {
  return new DragAndDrop({
    exercice,
    question: 0,
    consigne: 'Déplacer.',
    etiquettes: [[{ id: '1', contenu: 'A' }]],
    enonceATrous: '%{rectangle1}',
  })
}
