import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { DragAndDropElement } from '../../src/lib/customElements/DragAndDropElement'
import { handleAnswers } from '../../src/lib/interactif/gestionInteractif'
import { setOutputHtml } from '../../src/modules/context'

function renderDndElement(): DragAndDropElement {
  document.body.innerHTML = DragAndDropElement.create({
    numeroExercice: 3,
    questionIndex: 0,
    innerHtml: `
      <div id="etiquettesEx3Q0">
        <div class="etiquette dragOk" id="etiquetteEx3Q0I1">A</div>
        <div class="etiquette dragOk duplicable" id="etiquetteEx3Q0I2">B</div>
      </div>
      <div id="rectanglesEx3Q0">
        <div class="rectangleDND" id="rectangleEx3Q0R1"></div>
        <div class="rectangleDND" id="rectangleEx3Q0R2"></div>
      </div>
      <span id="resultatCheckEx3Q0"></span>
      <div id="feedbackEx3Q0"></div>
    `,
  })
  const element = document.querySelector(
    'drag-and-drop',
  ) as DragAndDropElement
  element.connectedCallback()
  element.querySelectorAll<HTMLElement>('.etiquette').forEach((etiquette) => {
    etiquette.innerText = etiquette.textContent ?? ''
  })
  return element
}

describe('DragAndDropElement', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('rehydrate les rectangles depuis sa value JSON', () => {
    const element = renderDndElement()

    element.value = JSON.stringify([
      'etiquetteEx3Q0I1',
      'etiquetteEx3Q0I2-clone-123',
    ])

    expect(element.value).toBe(
      JSON.stringify(['etiquetteEx3Q0I1', 'etiquetteEx3Q0I2-clone-123']),
    )
    expect(
      element.querySelector('#rectangleEx3Q0R1 #etiquetteEx3Q0I1'),
    ).not.toBeNull()
    expect(
      element.querySelector('#rectangleEx3Q0R2 #etiquetteEx3Q0I2-clone-123'),
    ).not.toBeNull()
  })

  it('formate sa value JSON en texte lisible pour les solutions CAN', () => {
    const element = renderDndElement()

    expect(
      DragAndDropElement.formatStudentAnswer(
        JSON.stringify(['etiquetteEx3Q0I1;etiquetteEx3Q0I2-clone-123']),
        element.outerHTML,
      ),
    ).toBe('A B')
  })

  it('stocke sa value restaurable dans exercice.answers', () => {
    const exercice = new Exercice()
    exercice.numeroExercice = 3
    exercice.dragAndDrops = [{ listeners: [] } as any]
    handleAnswers(
      exercice,
      0,
      {
        rectangle1: { value: '1' },
        rectangle2: { value: '2' },
      },
      { formatInteractif: 'dnd' },
    )
    const element = renderDndElement()
    element.value = JSON.stringify(['etiquetteEx3Q0I1', 'etiquetteEx3Q0I2'])

    const result = DragAndDropElement.verifQuestion(exercice, 0)

    expect(result.isOk).toBe(true)
    expect(exercice.answers?.['drag-and-dropEx3Q0']).toBe(element.value)
    expect(exercice.answers?.rectangleDNDEx3Q0R1).toBe('etiquetteEx3Q0I1')
  })
})
