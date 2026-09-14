import { describe, expect, it } from 'vitest'

import { MathaleaTextfieldElement } from '../../src/lib/customElements/MathaleaTextfield'

describe('MathaleaTextfieldElement', () => {
  it('adapte la largeur du champ au contenu saisi', () => {
    const wrapper = new MathaleaTextfieldElement()
    const input = document.createElement('input')
    wrapper.appendChild(input)
    document.body.appendChild(wrapper)

    expect(input.size).toBe(20)

    input.value = 'une réponse beaucoup plus longue'
    input.dispatchEvent(new Event('input'))
    expect(input.size).toBe(33)

    input.value = 'court'
    input.dispatchEvent(new Event('input'))
    expect(input.size).toBe(20)

    wrapper.remove()
  })

  it('adapte aussi la largeur après une affectation par le wrapper', () => {
    const wrapper = new MathaleaTextfieldElement()
    const input = document.createElement('input')
    wrapper.appendChild(input)
    document.body.appendChild(wrapper)

    wrapper.value = 'vingt-deux caractères'

    expect(input.size).toBe(22)
    wrapper.remove()
  })
})
