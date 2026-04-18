import { describe, expect, it } from 'vitest'
import {
  assignVariables,
  calculer,
  programmeCalcul,
  resoudre,
  toTex,
} from '../../src/modules/outilsMathjs'

function logSteps(equationStatus: any) {
  for (let i = 0; i < equationStatus.length; i++) {
    const step = equationStatus[i]
    // eslint-disable-next-line
    console.log(step.oldEquation.ascii())
    console.log('=>' + step.changeType)
    // eslint-disable-next-line
    console.log(step.newEquation.ascii())
    if (step.substeps.length > 0) {
      // eslint-disable-next-line
      console.log('\n substeps: ')
      step.substeps.forEach(logSteps)
    }
  }
}

describe('nodeMath', () => {
  it('assignVariables should substitute variables with provided values', () => {
    expect(assignVariables('a + b', { a: 2, b: 3 })).toBe('2 + 3')
    expect(assignVariables('x*y + z', { x: 4, y: 5, z: 6 })).toBe('4 * 5 + 6')
    expect(assignVariables('m/n', { m: 10, n: 2 })).toBe('10 / 2')
    expect(assignVariables('a + b + c', { a: 1, b: 2 })).toBe('1 + 2 + c')
    expect(assignVariables('k', { k: 7 })).toBe('7')
    expect(assignVariables('p*q*r', { p: 2, q: 3 })).toBe('2 * 3 * r')
    expect(assignVariables('x^2 + y^2', { x: 3, y: 4 })).toBe('3 ^ 2 + 4 ^ 2')
    expect(assignVariables('test + a', { test: 5, a: 1 })).toBe('5 + 1')
    expect(assignVariables('a + b', {})).toBe('a + b')
  })

  it('toTex should convert simple arithmetic expressions to LaTeX', () => {
    expect(toTex('3/2+4*x')).toBe('\\dfrac{3}{2}+4 x')
    expect(toTex('1*x+-3=6*x+0')).toBe(' x - 3=6 x')
    expect(toTex('0+x+y+0/2')).toBe(' x+ y')
    expect(toTex('y-1*x')).toBe(' y - x')
    expect(toTex('n*-c')).toBe(' n \\left(- c\\right)')
    expect(toTex('-3/4')).toBe('\\dfrac{-3}{4}')
    expect(toTex('2*x')).toBe('2 x')
    expect(toTex('x^2')).toBe('{ x}^{2}')
    expect(toTex('2*x+3')).toBe('2 x+3')
    expect(toTex('2*(x+3)')).toBe('2 \\left( x+3\\right)')
    expect(toTex('x+0')).toBe(' x')
    expect(toTex('1*x')).toBe(' x')
    expect(toTex('x/1')).toBe(' x')
    expect(toTex('x+-y')).toBe(' x - y')
    expect(toTex('x+(-y)')).toBe(' x - y')
    expect(toTex('x-(y/2)')).toBe(' x+\\dfrac{-1}{2} y')
    expect(toTex('x*2')).toBe('2 x')
    expect(toTex('x*(-2)')).toBe('-2 x')
    expect(toTex('x^2')).toBe('{ x}^{2}')
    expect(toTex('-x^2')).toBe('-{ x}^{2}')
    expect(toTex('(-x)^2')).toBe('{\\left(- x\\right)}^{2}')
    expect(toTex('(-x)^1')).toBe('- x')
    expect(toTex('(-x)^0')).toBe('1')
    expect(toTex('-1 * x')).toBe('- x')
    expect(toTex('-1*x')).toBe('- x')
    expect(toTex('(n1)-n2')).toBe(' n1 - n2')
    expect(toTex('(n1)-(n2)')).toBe(' n1 - n2')
    expect(toTex('(n1+0*n2)')).toBe(' n1')
    expect(toTex('(1*n1+0*n2)')).toBe(' n1')
    expect(toTex('(n1-n2)')).toBe(' n1 - n2')
    expect(toTex('n1-(n2/n3)')).toBe(' n1 - \\dfrac{ n2}{ n3}')
    expect(toTex('2x^1')).toBe('2 x')
    expect(toTex('x=2')).toBe(' x=2')
    expect(toTex('x>=2')).toBe(' x\\geqslant2')
    expect(toTex('x<=2')).toBe(' x\\leqslant2')
    expect(toTex('x<2')).toBe(' x<2')
    expect(toTex('x>2')).toBe(' x>2')
    expect(toTex('x*2/3')).toBe('\\dfrac{2 x}{3}')
    expect(toTex('x*(y/2)')).toBe(' x\\dfrac{ y}{2}')
  })

  it('toTex should substitute variables if provided', () => {
    expect(toTex('a+b', { variables: { a: 2, b: 3 } })).toBe('2+3')
    expect(toTex('x*y+z', { variables: { x: 4, y: 5, z: 6 } })).toBe(
      '4\\times 5+6',
    )
    expect(toTex('m/n', { variables: { m: 10, n: 2 } })).toBe('\\dfrac{10}{2}')
    expect(toTex('a+b+c', { variables: { a: 1, b: 2 } })).toBe('1+2+ c')
    expect(toTex('k', { variables: { k: 7 } })).toBe('7')
    expect(toTex('p*q*r', { variables: { p: 2, q: 3 } })).toBe('2\\times 3 r')
    expect(toTex('x^2+y^2', { variables: { x: 3, y: 4 } })).toBe(
      '{3}^{2}+{4}^{2}',
    )
    expect(toTex('test+a', { variables: { test: 5, a: 1 } })).toBe('5+1')
    expect(toTex('a+b', { variables: {} })).toBe(' a+{b}') // les accolades car b est considéré comme une unité
    expect(toTex('x+y', { variables: {} })).toBe(' x+ y') // les accolades car y est considéré comme une unité
  })

  it('toTex should handle implicit and explicit multiplication', () => {
    expect(toTex('2*x', { removeImplicit: false })).toContain('\\times')
    expect(toTex('2*x', { removeImplicit: true })).not.toContain('\\times')
    expect(toTex('2*(x+3)', { removeImplicit: false })).toContain('\\times')
    expect(toTex('2*(x+3)', { removeImplicit: true })).not.toContain('\\times')
  })

  it('toTex return empty string if string is empty', () => {
    expect(toTex('')).toBe('')
  })

  it('should solve a simple linear equation', () => {
    const result = resoudre('2*x+4=4*x-5', {})
    console.log('"""""""""""""""""')
    logSteps(result.steps)

    expect(result.solution).toBeDefined()
    expect(result.solution.exact).toBe(' 9 / 2')
    expect(result.solution.exact).toBeTypeOf('string')
    expect(result.solution.decimal).toBeTypeOf('number')
    expect(result.solution.decimal).equal(4.5)
    expect(result.equation).toContain('2')
    expect(result.steps.length).toBeGreaterThan(8)

    const result2 = resoudre('7*x+3=5', {})
    console.log(result2.printSteps)
    result2.printSteps.forEach((step) => {
      console.log(step)
    })
    const leftNode2 = result2.steps[0].oldEquation.leftNode.cloneDeep()
    const rightNode2 = result2.steps[0].oldEquation.rightNode.cloneDeep()
    console.log('"""""""""""""""""')
    console.log(toTex(leftNode2))
    console.log(toTex(rightNode2))
    expect(result2.solution).toBeDefined()
    expect(result2.solution.exact).toBe(' 2 / 7')
    expect(result2.solution.exact).toBeTypeOf('string')
    expect(result2.solution.decimal).toBeTypeOf('number')
    expect(result2.solution.decimal).toBeCloseTo(2 / 7)
    expect(result2.equation).toContain('7')
    expect(result2.steps.length).toBeGreaterThan(4)
  })

  it('should solve with fraction format', () => {
    const result = resoudre('3*x=7', { formatSolution: 'fraction' })
    expect(result.solution.exact).toBe(' 7 / 3')
    expect(result.solution.decimal).toBeCloseTo(7 / 3)
  })

  it('should solve with decimal format', () => {
    const result = resoudre('x=2/3', { formatSolution: 'decimal' })
    expect(result.solution.decimal).toBeCloseTo(2 / 3)
  })

  it('should include comments if requested', () => {
    const result = resoudre('x+2=5', { comment: true })
    expect(result.printSteps.some((step) => step.includes('\\text'))).toBe(true)
  })

  it('should handle equations with variables', () => {
    const result = resoudre('a*x+c=b*x+d', {
      variables: { a: true, b: true, c: true, d: true },
    })
    expect(result.equation).toMatch(/x/)
    expect(result.solution).toBeDefined()
  })

  it('should include verification steps if requested', () => {
    const result = resoudre('x+1=3', { verifications: true })
    expect(result.texteCorr).toContain('Vérification')
    expect(result.verifLeftSide).toBeDefined()
    expect(result.verifRightSide).toBeDefined()
  })

  it('should solve equations with produitsencroix', () => {
    const result = resoudre('2/x=3/5', { produitsencroix: true })
    expect(
      result.steps.some((step) => step.changeType === 'CROSS_PRODUCT_EQUALITY'),
    ).toBe(true)
  })

  it('should solve equations with substeps', () => {
    const result = resoudre('2*x+4=4*x-5', { substeps: true })
    expect(result.steps.length).toBeGreaterThan(0)
  })

  it('should compute expressions with substeps', () => {
    const result = calculer('2 * (-3) + 4 + (-3) ^ 2 * (-5)', {
      substeps: true,
    })
    expect(result.steps.length).toBeGreaterThan(0)
  })

  it('programmeCalcul should return expected structure for default stepProg and nombreChoisi', () => {
    const result = programmeCalcul(['+', '*'], 5)
    // console.log(result)
    expect(result).toHaveProperty('phrases')
    expect(result.phrases).toHaveLength(3)
    expect(result.phrases[0]).toBe('Choisir un nombre.')
    expect(result.phrases[1]).to.include('Ajouter $')
    expect(result.phrases[2]).to.include('Multiplier par $')
    expect(result).toHaveProperty('steps')
    expect(result).toHaveProperty('stepsSimplified')
    expect(result).toHaveProperty('stepsInv')
    expect(result).toHaveProperty('stepsSimplifiedInv')
    expect(result).toHaveProperty('phrasesInv')
    expect(result).toHaveProperty('nodes')
    expect(result).toHaveProperty('stepProg')
    expect(result).toHaveProperty('calculIntermediaire')
    expect(result).toHaveProperty('resultatIntermediaire')
    expect(result).toHaveProperty('calculIntermediaireInv')
    expect(result).toHaveProperty('resultatIntermediaireInv')
    expect(Array.isArray(result.phrases)).toBe(true)
    expect(Array.isArray(result.steps)).toBe(true)
    expect(Array.isArray(result.stepsSimplified)).toBe(true)
    expect(Array.isArray(result.stepsInv)).toBe(true)
    expect(Array.isArray(result.stepsSimplifiedInv)).toBe(true)
    expect(Array.isArray(result.phrasesInv)).toBe(true)
    expect(Array.isArray(result.nodes)).toBe(true)
    expect(Array.isArray(result.calculIntermediaire)).toBe(true)
    expect(Array.isArray(result.resultatIntermediaire)).toBe(true)
    expect(Array.isArray(result.calculIntermediaireInv)).toBe(true)
    expect(Array.isArray(result.resultatIntermediaireInv)).toBe(true)
    expect(result.phrases.length).toBeGreaterThan(0)
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.stepsSimplified.length).toBeGreaterThan(0)
    expect(result.stepsInv.length).toBeGreaterThan(0)
    expect(result.stepsSimplifiedInv.length).toBeGreaterThan(0)
    expect(result.phrasesInv.length).toBeGreaterThan(0)
  })

  // it('programmeCalcul should handle custom stepProg and nombreChoisi', () => {
  //   const stepProg = ['+', '*', '^2']
  //   const result = programmeCalcul(stepProg, 3)
  //   expect(result.phrases.length).toBe(stepProg.length + 2) // +2 for "Choisir un nombre." and "Écrire le résultat"
  //   expect(result.steps.length).toBe(stepProg.length + 2)
  //   expect(result.stepsSimplified.length).toBe(stepProg.length + 2)
  //   expect(result.stepsInv.length).toBe(stepProg.length + 2)
  //   expect(result.stepsSimplifiedInv.length).toBe(stepProg.length + 2)
  //   expect(result.phrasesInv.length).toBe(stepProg.length + 2)
  //   expect(result.stepProg).toEqual(stepProg)
  // })

  // it('programmeCalcul should handle empty stepProg', () => {
  //   const result = programmeCalcul([], 7)
  //   expect(result.phrases.length).toBe(2) // "Choisir un nombre." and "Écrire le résultat"
  //   expect(result.steps.length).toBe(2)
  //   expect(result.stepsSimplified.length).toBe(2)
  //   expect(result.stepsInv.length).toBe(2)
  //   expect(result.stepsSimplifiedInv.length).toBe(2)
  //   expect(result.phrasesInv.length).toBe(2)
  //   expect(result.stepProg).toEqual([])
  // })

  // it('programmeCalcul should handle undefined nombreChoisi', () => {
  //   const result = programmeCalcul(['+'], undefined)
  //   expect(result.phrases.length).toBe(3)
  //   expect(result.steps.length).toBe(3)
  //   expect(result.stepsSimplified.length).toBe(3)
  //   expect(result.stepsInv.length).toBe(3)
  //   expect(result.stepsSimplifiedInv.length).toBe(3)
  //   expect(result.phrasesInv.length).toBe(3)
  //   expect(result.stepProg).toEqual(['+'])
  // })

  // it('programmeCalcul should handle debug=true', () => {
  //   const result = programmeCalcul(['+', '*'], 2, true)
  //   expect(result.phrases.length).toBe(4)
  //   expect(result.steps.length).toBe(4)
  //   expect(result.stepsSimplified.length).toBe(4)
  //   expect(result.stepsInv.length).toBe(4)
  //   expect(result.stepsSimplifiedInv.length).toBe(4)
  //   expect(result.phrasesInv.length).toBe(4)
  //   expect(result.stepProg).toEqual(['+', '*'])
  // })

  // it('programmeCalcul should produce correct phrases for known stepProg', () => {
  //   const result = programmeCalcul(['+', '*'], 2)
  //   expect(result.phrases[0]).toBe('Choisir un nombre.')
  //   expect(result.phrases[1]).toMatch(/Ajouter/)
  //   expect(result.phrases[2]).toMatch(/Multiplier par/)
  //   expect(result.phrases[result.phrases.length - 1]).toBe('Écrire le résultat')
  //   expect(result.phrasesInv[0]).toBe('On obtient le nombre choisi.')
  //   expect(result.phrasesInv[result.phrasesInv.length - 1]).toBe(
  //     'Résultat du programme',
  //   )
  // })
})
