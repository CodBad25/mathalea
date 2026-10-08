import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('mathlive', () => {
  class MockMathfieldElement extends HTMLElement {
    value = ''
    readOnly = false

    getValue() {
      return this.value
    }

    setValue(value: string) {
      this.value = value
    }
  }
  if (customElements.get('math-field') == null)
    customElements.define('math-field', MockMathfieldElement)
  return { MathfieldElement: MockMathfieldElement }
})

import Exercice from '../../src/exercices/Exercice'
import {
  addPossibleMultiLinesAnswer,
  PossibleMultiLinesAnswerElement,
  type BaremeMultiLignes,
} from '../../src/lib/customElements/PossibleMultiLinesAnswerElement'
import { pointsMaxQuestion } from '../../src/lib/interactif/baremeExercice'
import { handleAnswers } from '../../src/lib/interactif/gestionInteractif'
import { setOutputHtml } from '../../src/modules/context'

type Champ = HTMLElement & { value: string; readOnly: boolean }

/** A = 3 + 4 × 5 = 23 */
function monte(bareme: BaremeMultiLignes) {
  const exercice = new Exercice()
  exercice.numeroExercice = 0
  exercice.interactif = true
  handleAnswers(exercice, 0, { reponse: { value: 23 } })
  document.body.innerHTML = addPossibleMultiLinesAnswer(exercice, 0, {
    prefix: 'A =',
    bareme,
  })
  const element = document.querySelector(
    PossibleMultiLinesAnswerElement.elementTag,
  ) as PossibleMultiLinesAnswerElement
  const champFinal = () =>
    document.querySelector('#champTexteEx0Q0') as unknown as Champ
  const ajouteLigne = (saisie: string) => {
    champFinal().value = saisie
    element.querySelector<HTMLButtonElement>('[data-pmla-add]')?.click()
  }
  const lignes = () =>
    Array.from(element.querySelectorAll('[data-pmla-lines] > .pmla-line'))
  return { exercice, element, champFinal, ajouteLigne, lignes }
}

describe('PossibleMultiLinesAnswerElement', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('annonce 1 point en mode tout ou rien et 2 points en mode étapes', () => {
    expect(pointsMaxQuestion(monte('toutOuRien').exercice, 0)).toBe(1)
    expect(pointsMaxQuestion(monte('etapes').exercice, 0)).toBe(2)
  })

  it('ne corrige les étapes qu’à la vérification en mode tout ou rien', () => {
    const { exercice, champFinal, ajouteLigne, lignes } = monte('toutOuRien')
    ajouteLigne('3+21')
    expect(lignes()[0].querySelector('[data-pmla-result]')?.textContent).toBe(
      '',
    )
    expect(lignes()[0].querySelector('.pmla-remove')).not.toBeNull()
    champFinal().value = '23'
    const resultat = PossibleMultiLinesAnswerElement.verifQuestion(exercice, 0)
    expect(resultat.score).toEqual({ nbBonnesReponses: 0, nbReponses: 1 })
    expect(lignes()[0].classList.contains('pmla-barre')).toBe(true)
  })

  it('corrige, barre et verrouille chaque étape dès son ajout en mode étapes', () => {
    const { lignes, ajouteLigne } = monte('etapes')
    ajouteLigne('3+21')
    ajouteLigne('3+20')
    const [fausse, juste] = lignes()
    expect(fausse.querySelector('[data-pmla-result]')?.textContent).toBe('✗')
    expect(fausse.classList.contains('pmla-barre')).toBe(true)
    expect(juste.querySelector('[data-pmla-result]')?.textContent).toBe('✓')
    expect(juste.classList.contains('pmla-barre')).toBe(false)
    for (const ligne of lignes()) {
      expect(ligne.querySelector('.pmla-remove')).toBeNull()
      expect(
        (ligne.querySelector('mathalea-mathfield') as unknown as Champ)
          .readOnly,
      ).toBe(true)
    }
  })

  it('donne 1 point sur 2 si le résultat est juste malgré une étape fausse', () => {
    const { exercice, champFinal, ajouteLigne } = monte('etapes')
    ajouteLigne('3+21')
    ajouteLigne('3+20')
    champFinal().value = '23'
    const resultat = PossibleMultiLinesAnswerElement.verifQuestion(exercice, 0)
    expect(resultat.isOk).toBe(false)
    expect(resultat.score).toEqual({ nbBonnesReponses: 1, nbReponses: 2 })
    expect(document.querySelector('#resultatCheckEx0Q0')?.textContent).toBe('✓')
  })

  it('donne 2 points sur 2 si toutes les étapes et le résultat sont justes', () => {
    const { exercice, champFinal, ajouteLigne } = monte('etapes')
    ajouteLigne('3+20')
    champFinal().value = '23'
    const resultat = PossibleMultiLinesAnswerElement.verifQuestion(exercice, 0)
    expect(resultat.isOk).toBe(true)
    expect(resultat.score).toEqual({ nbBonnesReponses: 2, nbReponses: 2 })
    expect(document.querySelector('#resultatCheckEx0Q0')?.textContent).toBe(
      '😎',
    )
  })

  it('compte 2 points même si la question est laissée vide', () => {
    const { exercice } = monte('etapes')
    const resultat = PossibleMultiLinesAnswerElement.verifQuestion(exercice, 0)
    expect(resultat.score).toEqual({ nbBonnesReponses: 0, nbReponses: 2 })
  })

  it('donne 0 point sur 2 si le résultat est faux', () => {
    const { exercice, champFinal, ajouteLigne } = monte('etapes')
    ajouteLigne('3+20')
    champFinal().value = '24'
    const resultat = PossibleMultiLinesAnswerElement.verifQuestion(exercice, 0)
    expect(resultat.score).toEqual({ nbBonnesReponses: 0, nbReponses: 2 })
  })
})
