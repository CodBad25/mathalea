import { describe, expect, it } from 'vitest'

import { ScratchInterpreter } from '../../src/lib/scratchSimulator'

describe('ScratchInterpreter', () => {
  it('met a jour les variables avec blockvariable + repeat', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter \\ovalnum{3} fois}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
}
\\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.compteur).toBe(3)
    expect(result.messages).toEqual(['3'])
  })

  it('met a jour les variables en mode anime a chaque etape', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter \\ovalnum{3} fois}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
}
\\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`

    const snapshots: number[] = []

    const result = await interpreter.executeAnimated(
      code,
      () => {
        snapshots.push(interpreter.getCurrentState().variables.compteur ?? 0)
      },
      0,
    )

    expect(result.variables.compteur).toBe(3)
    expect(result.messages).toEqual(['3'])
    expect(snapshots).toContain(1)
    expect(snapshots).toContain(2)
    expect(snapshots).toContain(3)
  })

  it('evalue les ovaloperator imbriques avec variables', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{5}}
\\blockvariable{mettre \\selectmenu{compteur} à \\ovaloperator{\\ovalvariable{compteur} - \\ovalnum{1}}}
\\blockvariable{mettre \\selectmenu{resultat} à \\ovaloperator{\\ovaloperator{\\ovalnum{2}+\\ovalnum{3}}*\\ovalvariable{compteur}}}
\\blocklook{Dire \\ovalvariable{resultat}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.compteur).toBe(4)
    expect(result.variables.resultat).toBe(20)
    expect(result.messages).toEqual(['20'])
  })
})
