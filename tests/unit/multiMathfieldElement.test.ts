import type { MathfieldElement } from 'mathlive'
import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { MultiMathfieldElement } from '../../src/lib/customElements/MultiMathfield'
import { handleAnswers } from '../../src/lib/interactif/gestionInteractif'
import { setOutputHtml, setOutputLatex } from '../../src/modules/context'

describe('MultiMathfieldElement', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('hydrate exercice.answers avec la value de l element apres verification', () => {
    const exercice = new Exercice()
    exercice.numeroExercice = 2
    handleAnswers(
      exercice,
      0,
      { champ1: { value: '3' }, champ2: { value: 'x+1' } },
      { formatInteractif: 'multi-mathfield' },
    )
    exercice.answers = undefined

    const multi = document.createElement('div')
    multi.id = 'multi-mathfieldEx2Q0'
    multi.setAttribute('data-template', 'a) %{champ1} b) %{champ2}')
    const shadowRoot = multi.attachShadow({ mode: 'open' })

    for (const [field, value] of Object.entries({
      champ1: '3',
      champ2: 'x+1',
    })) {
      const mathfield = document.createElement(
        'div',
      ) as unknown as MathfieldElement
      mathfield.id = `multi-mathfieldEx2Q0-${field}`
      mathfield.setAttribute('data-name', field)
      mathfield.getValue = () => value
      mathfield.readOnly = false
      shadowRoot.appendChild(mathfield)

      const checkSpan = document.createElement('span')
      checkSpan.id = `check-multi-mathfieldEx2Q0-${field}`
      shadowRoot.appendChild(checkSpan)
    }
    document.body.appendChild(multi)
    const resultSpan = document.createElement('span')
    resultSpan.id = 'resultatCheckEx2Q0'
    document.body.appendChild(resultSpan)

    const result = MultiMathfieldElement.verifQuestion(exercice, 0)

    expect(result.isOk).toBe(true)
    expect(exercice.answers).toEqual({
      'multi-mathfieldEx2Q0': '{"champ1":"3","champ2":"x+1"}',
    })
  })

  it('rehydrate mathfields et listes deroulantes depuis sa value', () => {
    const source = new MultiMathfieldElement()
    const sourceMathfield = document.createElement(
      'math-field',
    ) as MathfieldElement
    sourceMathfield.setAttribute('data-name', 'champ1')
    sourceMathfield.value = '42'
    source.shadowRoot?.appendChild(sourceMathfield)

    const sourceList = document.createElement(
      'liste-deroulante',
    ) as HTMLElement & {
      choices: Array<{ label: string; value: string }>
      value: string
    }
    sourceList.setAttribute('data-name', 'choix')
    sourceList.choices = [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]
    sourceList.value = 'B'
    source.shadowRoot?.appendChild(sourceList)

    const savedValue = source.value

    const target = new MultiMathfieldElement()
    const targetMathfield = document.createElement(
      'math-field',
    ) as MathfieldElement
    targetMathfield.setAttribute('data-name', 'champ1')
    targetMathfield.value = ''
    target.shadowRoot?.appendChild(targetMathfield)

    const targetList = document.createElement(
      'liste-deroulante',
    ) as HTMLElement & {
      choices: Array<{ label: string; value: string }>
      value: string
    }
    targetList.setAttribute('data-name', 'choix')
    targetList.choices = [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]
    targetList.value = ''
    target.shadowRoot?.appendChild(targetList)

    target.value = savedValue

    expect(savedValue).toBe('{"champ1":"42","choix":"B"}')
    expect(target.getValue()).toEqual({ champ1: '42', choix: 'B' })
  })

  it('regroupe chaque bouton QCM avec sa proposition et utilise la couleur Mathalea', () => {
    const multi = document.createElement(
      'multi-mathfield',
    ) as MultiMathfieldElement
    multi.setAttribute('id', 'multi-mathfieldEx0Q0')
    multi.setAttribute('interactivity-on', 'true')
    multi.setAttribute('data-template', '%{champ1}')
    multi.setAttribute(
      'data-options',
      encodeURIComponent(
        JSON.stringify({
          champ1: {
            qcm: [
              { label: 'Oui', value: 'oui' },
              { label: 'Non', value: 'non' },
            ],
          },
        }),
      ),
    )
    document.body.appendChild(multi)

    const qcm = multi.shadowRoot?.querySelector('[data-type="qcm"]')
    const items = Array.from(qcm?.children ?? [])
    const styles = multi.shadowRoot?.querySelector('style')?.textContent ?? ''

    expect(qcm?.getAttribute('data-vertical')).toBe('false')
    expect(items).toHaveLength(2)
    expect(items[0].querySelector('input + label')?.textContent).toBe('Oui')
    expect(items[1].querySelector('input + label')?.textContent).toBe('Non')
    expect(styles).toContain("[data-type='qcm'] > span")
    expect(styles).toContain('display: inline-flex')
    expect(styles).toContain('gap: 0.5rem')
    expect(styles).toContain('var(--color-coopmaths-action, #f15929)')
  })

  it('rend un contenu statique en sortie LaTeX', () => {
    setOutputLatex()

    const result = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate:
        'a) Calculer $g(1)=$%{champ1}<br>b) Calculer $g(2)=$%{champ2}',
      dataOptions: {},
    })

    expect(result).not.toContain('<multi-mathfield')
    expect(result).toContain('Calculer $g(1)=$')
    expect(result).toContain('Calculer $g(2)=$')
  })

  it('n ajoute pas le texteApres apres un champ vide en rendu statique', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: 'Quel sera le capital au bout de 3 ans ? %{champ1}',
      dataOptions: {
        champ1: { texteApres: ' euros' },
      },
      interactivityOn: false,
    })

    expect(rendu).not.toContain('<multi-mathfield')
    expect(rendu).not.toContain('euros')
  })

  it('espace et colore les QCM du rendu HTML statique', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: 'Choisir : %{champ1}',
      dataOptions: {
        champ1: {
          qcm: [
            { label: 'Oui', value: 'oui' },
            { label: 'Non', value: 'non' },
          ],
        },
      },
      interactivityOn: false,
    })

    const template = document.createElement('template')
    template.innerHTML = rendu
    const qcm = template.content.querySelector('span.mx-2') as HTMLElement
    const items = Array.from(qcm.children) as HTMLElement[]
    const input = items[0].querySelector('input') as HTMLInputElement

    expect(qcm.style.display).toBe('inline-flex')
    expect(qcm.style.gap).toBe('1.5rem')
    expect(items).toHaveLength(2)
    expect(items[0].style.display).toBe('inline-flex')
    expect(items[0].style.gap).toBe('0.5rem')
    expect(input.style.border).toContain(
      'var(--color-coopmaths-action, #f15929)',
    )
    expect(rendu).not.toContain('currentColor')
  })

  it('ajoute le texteApres apres les pointilles en rendu statique', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: 'Quel sera le capital au bout de 3 ans ? %{champ1}',
      dataOptions: {
        champ1: { ldots: true, texteApres: ' euros' },
      },
      interactivityOn: false,
    })

    expect(rendu).toContain('...')
    expect(rendu).toContain('euros')
  })

  it('rend des pointilles au lieu des champs quand l interactivite est desactivee', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: '$g(1)=$%{champ1}',
      dataOptions: {
        champ1: { ldots: true },
      },
      interactivityOn: false,
    })

    expect(rendu).not.toContain('<multi-mathfield')
    expect(rendu).toContain('...')

    const multi = document.createElement(
      'multi-mathfield',
    ) as MultiMathfieldElement
    multi.setAttribute('id', 'multi-mathfieldEx0Q0')
    multi.setAttribute('numero-exercice', '0')
    multi.setAttribute('question-index', '0')
    multi.setAttribute('interactivity-on', 'false')
    multi.setAttribute('data-template', '$g(1)=$%{champ1}')
    multi.setAttribute(
      'data-options',
      encodeURIComponent(JSON.stringify({ champ1: { ldots: true } })),
    )
    document.body.appendChild(multi)

    expect(multi.shadowRoot?.querySelector('math-field')).toBeNull()
    expect(multi.shadowRoot?.textContent).toContain('...')
  })
})
