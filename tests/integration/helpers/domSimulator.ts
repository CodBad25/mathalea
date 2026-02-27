import type { MathfieldElement } from 'mathlive'
import ListeDeroulanteElement from '../../../src/lib/interactif/listeDeroulante/ListeDeroulanteElement'

function createFakeMfe(
  id: string,
  champValues: Record<string, string> = {},
): MathfieldElement {
  const el = document.createElement('div') as unknown as MathfieldElement // A real MathfieldElement would require a lot of DOM logic (shadow DOM, renderMathInElement) which doesn't belong in a unit test simulator. We'd likely run into more JSDOM issues.
  el.id = id
  el.value = 'filled'
  el.readOnly = false
  el.getValue = () => 'filled'
  el.getPromptValue = (key: string) => champValues[key] ?? ''
  el.setPromptState = () => {}
  return el
}

/**
 * Injects minimal DOM elements for verifying a single mathlive/texte question.
 *
 * verifQuestionMathLive() reads:
 *   - document.getElementById(`champTexteEx${exIdx}Q${qIdx}`) -> .value
 *   - document.querySelector(`#resultatCheckEx${exIdx}Q${qIdx}`) -> writes emoji
 */
export function injectMathLiveDOM(
  exerciceIndex: number,
  questionIndex: number,
  answer: string,
) {
  const inputId = `champTexteEx${exerciceIndex}Q${questionIndex}`
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  const feedbackId = `feedbackEx${exerciceIndex}Q${questionIndex}`

  document.getElementById(inputId)?.remove()
  document.getElementById(resultId)?.remove()
  document.getElementById(feedbackId)?.remove()

  const input = document.createElement('input') as HTMLInputElement & {
    getValue: () => string
  }
  input.id = inputId
  input.value = answer
  input.getValue = () => answer
  Object.defineProperty(input, 'readOnly', { value: false, writable: true })
  document.body.appendChild(input)

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)

  const feedbackDiv = document.createElement('div')
  feedbackDiv.id = feedbackId
  document.body.appendChild(feedbackDiv)
}

/**
 * Injects DOM for a fillInTheBlank question.
 * Creates a fake MathfieldElement with getPromptValue/setPromptState.
 */
export function injectFillInTheBlankDOM(
  exerciceIndex: number,
  questionIndex: number,
  champValues: Record<string, string>,
) {
  const inputId = `champTexteEx${exerciceIndex}Q${questionIndex}`
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  const feedbackId = `feedbackEx${exerciceIndex}Q${questionIndex}`

  document.getElementById(inputId)?.remove()
  document.getElementById(resultId)?.remove()
  document.getElementById(feedbackId)?.remove()

  const fakeMfe = createFakeMfe(inputId, champValues)
  document.body.appendChild(fakeMfe)

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)

  const feedbackDiv = document.createElement('div')
  feedbackDiv.id = feedbackId
  document.body.appendChild(feedbackDiv)
}

/**
 * Injects DOM for a tableauMathlive question.
 * Each cell has its own input: champTexteEx{exIdx}Q{qIdx}L{row}C{col}
 * verifQuestionMathLive looks for `table#tabMathliveEx{exIdx}Q{qIdx}` and then
 * queries math-field elements inside. We use a <table> with <input> children.
 */
export function injectTableauMathliveDOM(
  exerciceIndex: number,
  questionIndex: number,
  cellValues: Record<string, string>,
) {
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  const feedbackId = `feedbackEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(resultId)?.remove()
  document.getElementById(feedbackId)?.remove()

  const tableId = `tabMathliveEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(tableId)?.remove()
  const table = document.createElement('table')
  table.id = tableId
  document.body.appendChild(table)

  for (const [key, value] of Object.entries(cellValues)) {
    const cellId = `champTexteEx${exerciceIndex}Q${questionIndex}${key}`
    document.getElementById(cellId)?.remove()

    const input = document.createElement(
      'math-field',
    ) as unknown as MathfieldElement & HTMLElement
    input.id = cellId
    input.value = value
    input.getValue = () => value
    Object.defineProperty(input, 'readOnly', { value: false, writable: true })
    table.appendChild(input)

    const cellResultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}${key}`
    document.getElementById(cellResultId)?.remove()
    const cellResult = document.createElement('span')
    cellResult.id = cellResultId
    table.appendChild(cellResult)
  }

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)

  const feedbackDiv = document.createElement('div')
  feedbackDiv.id = feedbackId
  document.body.appendChild(feedbackDiv)
}

/**
 * Injects DOM for QCM questions.
 * Checkboxes: #checkEx{exIdx}Q{qIdx}R{propIdx}
 * Labels: #labelEx{exIdx}Q{qIdx}R{propIdx}
 */
export function injectQcmDOM(
  exerciceIndex: number,
  questionIndex: number,
  propositions: { statut?: boolean | number | string }[],
  isRadio: boolean = false,
) {
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(resultId)?.remove()

  for (let r = 0; r < propositions.length; r++) {
    const checkId = `checkEx${exerciceIndex}Q${questionIndex}R${r}`
    const labelId = `labelEx${exerciceIndex}Q${questionIndex}R${r}`
    document.getElementById(checkId)?.remove()
    document.getElementById(labelId)?.remove()

    const checkbox = document.createElement('input')
    checkbox.type = isRadio ? 'radio' : 'checkbox'
    checkbox.id = checkId
    checkbox.name = `checkEx${exerciceIndex}Q${questionIndex}`
    checkbox.checked = Boolean(propositions[r].statut)
    document.body.appendChild(checkbox)

    const label = document.createElement('label')
    label.id = labelId
    document.body.appendChild(label)

    const feedbackId = `feedbackEx${exerciceIndex}Q${questionIndex}R${r}`
    document.getElementById(feedbackId)?.remove()
    const feedbackDiv = document.createElement('div')
    feedbackDiv.id = feedbackId
    document.body.appendChild(feedbackDiv)
  }

  const globalFeedbackId = `feedbackEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(globalFeedbackId)?.remove()
  const globalFeedback = document.createElement('div')
  globalFeedback.id = globalFeedbackId
  document.body.appendChild(globalFeedback)

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)
}

/**
 * Injects DOM for listeDeroulante questions.
 * Custom element <liste-deroulante> with id ex{exIdx}Q{qIdx}.
 */
export function injectListeDeroulanteDOM(
  exerciceIndex: number,
  questionIndex: number,
  selectedValue: string,
) {
  const selectId = `ex${exerciceIndex}Q${questionIndex}`
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(selectId)?.remove()
  document.getElementById(resultId)?.remove()

  const fakeDropdown = document.createElement(
    'div',
  ) as unknown as ListeDeroulanteElement // A real ListeDeroulanteElement would require  a lot of DOM logic (shadow DOM, show(), hide(), focus(), renderMathInElement) which doesn't belong in a unit test simulator. We'd likely run into more JSDOM issues.)
  fakeDropdown.id = selectId
  document.body.appendChild(fakeDropdown)
  fakeDropdown.value = selectedValue

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)
}

/**
 * Injects DOM for svgSelection questions.
 * verifQuestionSvgSelection() reads #svgSelectionEx{exIdx}Q{qIdx}.value and
 * writes feedback to #resultatCheckEx{exIdx}Q{qIdx}.
 */
export function injectSvgSelectionDOM(
  exerciceIndex: number,
  questionIndex: number,
  selectedValue: string,
) {
  const selectId = `svgSelectionEx${exerciceIndex}Q${questionIndex}`
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(selectId)?.remove()
  document.getElementById(resultId)?.remove()

  const input = document.createElement('input')
  input.id = selectId
  input.value = selectedValue
  document.body.appendChild(input)

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)
}

/**
 * Injects DOM for MetaInteractif2d questions.
 * Inputs are individual math-field-like elements:
 * #MetaInteractif2dEx{exIdx}Q{qIdx}field{n}
 */
export function injectMetaInteractif2dDOM(
  exerciceIndex: number,
  questionIndex: number,
  fieldValues: Record<string, string>,
) {
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  const feedbackId = `feedbackEx${exerciceIndex}Q${questionIndex}`

  document.getElementById(resultId)?.remove()
  document.getElementById(feedbackId)?.remove()

  for (const [fieldKey, value] of Object.entries(fieldValues)) {
    const index = fieldKey.replace('field', '')
    const inputId = `MetaInteractif2dEx${exerciceIndex}Q${questionIndex}field${index}`
    document.getElementById(inputId)?.remove()

    const input = createFakeMfe(inputId, { champ1: value }) as unknown as
      | MathfieldElement
      | HTMLElement
    input.id = inputId
    document.body.appendChild(input)
  }

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)

  const feedbackDiv = document.createElement('div')
  feedbackDiv.id = feedbackId
  document.body.appendChild(feedbackDiv)
}

/**
 * Injects DOM for cliqueFigure questions.
 * Each clickable figure is represented by an element carrying its `etat`.
 */
export function injectCliqueFigureDOM(
  exerciceIndex: number,
  questionIndex: number,
  figures: Array<{ id: string; solution: boolean }>,
) {
  const resultId = `resultatCheckEx${exerciceIndex}Q${questionIndex}`
  document.getElementById(resultId)?.remove()

  for (const figure of figures) {
    document.getElementById(figure.id)?.remove()
    const el = document.createElement('div') as HTMLDivElement & {
      etat?: boolean
      hasMathaleaListener?: boolean
    }
    el.id = figure.id
    el.etat = figure.solution
    el.hasMathaleaListener = true
    document.body.appendChild(el)
  }

  const resultSpan = document.createElement('span')
  resultSpan.id = resultId
  document.body.appendChild(resultSpan)
}

/**
 * Clears all injected DOM elements.
 */
export function clearDOM() {
  document.body.innerHTML = ''
}
