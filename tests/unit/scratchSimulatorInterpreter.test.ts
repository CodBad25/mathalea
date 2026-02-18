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

  it('gere blocklook dire variable pendant secondes et ignore look sans dire', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{7}}
\\blocklook{dire \\ovalvariable{compteur} pendant \\ovalnum{2} secondes}
\\blocklook{penser \\ovalvariable{compteur}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['7'])
  })

  it("gere blockmove 'ajouter ... a x'", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{ajouter \\ovalnum{5} à x}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(205)
    expect(result.finalY).toBe(200)
  })

  it("gere blockmove 'ajouter ... a y'", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{ajouter \\ovalnum{5} à y}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(200)
    expect(result.finalY).toBe(195)
  })

  it("gere blockmove 'mettre x a ...'", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{mettre x à \\ovalnum{5}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(205)
    expect(result.finalY).toBe(200)
  })

  it("gere blockmove 'mettre y a ...'", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{mettre y à \\ovalnum{5}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(200)
    expect(result.finalY).toBe(195)
  })

  it('gere les variables reservees abscisse x, ordonnee y et direction', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{abscisse x} à \\ovalnum{12}}
\\blockvariable{mettre \\selectmenu{ordonnée y} à \\ovalnum{-3}}
\\blockvariable{mettre \\selectmenu{direction} à \\ovalnum{45}}
\\blocklook{dire \\ovalvariable{abscisse x}}
\\blocklook{dire \\ovalvariable{ordonnée y}}
\\blocklook{dire \\ovalvariable{direction}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(212)
    expect(result.finalY).toBe(203)
    expect(result.finalAngle).toBe(45)
    expect(result.messages).toEqual(['12', '-3', '45'])
  })

  it('gere Ajouter sur variables reservees', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{Ajouter \\ovalnum{5} à \\ovalvariable{abscisse x}}
\\blockvariable{Ajouter \\ovalnum{2} à \\ovalvariable{ordonnée y}}
\\blockvariable{Ajouter \\ovalnum{10} à \\ovalvariable{direction}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(205)
    expect(result.finalY).toBe(198)
    expect(result.finalAngle).toBe(100)
  })

  it("gere blockrepeat jusqu'à ce que avec booloperator <", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter jusqu'à ce que \\booloperator{\\ovalvariable{compteur} > 5}}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.compteur).toBe(6)
  })

  it("gere blockrepeat jusqu'à ce que avec booloperator <=", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{1}}
\\blockrepeat{répéter jusqu'à ce que \\booloperator{\\ovalvariable{x} >= 10}}{
\\blockvariable{Ajouter \\ovalnum{2} à \\ovalvariable{x}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.x).toBe(11)
  })

  it("gere blockrepeat jusqu'à ce que avec booloperator =", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter jusqu'à ce que \\booloperator{\\ovalvariable{compteur} = 3}}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.compteur).toBe(3)
  })

  it("gere blockrepeat jusqu'à ce que en mode anime", async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter jusqu'à ce que \\booloperator{\\ovalvariable{compteur} > 3}}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
}
\\end{scratch}`

    const snapshots: number[] = []

    const result = await interpreter.executeAnimated(
      code,
      () => {
        snapshots.push(interpreter.getCurrentState().variables.compteur ?? 0)
      },
      0,
    )

    expect(result.variables.compteur).toBe(4)
    expect(snapshots).toContain(1)
    expect(snapshots).toContain(2)
    expect(snapshots).toContain(3)
    expect(snapshots).toContain(4)
  })

  it('gere blockifelse avec condition vraie', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{10}}
\\blockifelse{si \\booloperator{\\ovalvariable{x} > 5} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{1}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{0}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.x).toBe(10)
    expect(result.variables.resultat).toBe(1)
  })

  it('gere blockifelse avec condition fausse', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{3}}
\\blockifelse{si \\booloperator{\\ovalvariable{x} > 5} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{1}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{0}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.x).toBe(3)
    expect(result.variables.resultat).toBe(0)
  })

  it('gere blockifelse avec operateurs comparaison', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{a} à \\ovalnum{5}}
\\blockvariable{mettre \\selectmenu{b} à \\ovalnum{5}}
\\blockifelse{si \\booloperator{\\ovalvariable{a} = \\ovalvariable{b}} alors}{
\\blockvariable{mettre \\selectmenu{egal} à \\ovalnum{1}}
}{
\\blockvariable{mettre \\selectmenu{egal} à \\ovalnum{0}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.a).toBe(5)
    expect(result.variables.b).toBe(5)
    expect(result.variables.egal).toBe(1)
  })

  it('gere blockifelse en mode anime', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{7}}
\\blockifelse{si \\booloperator{\\ovalvariable{x} >= 6} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{100}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{50}}
}
\\end{scratch}`

    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.variables.x).toBe(7)
    expect(result.variables.resultat).toBe(100)
  })

  it('gere blockcontrol stop tout', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
\\blockcontrol{stop \\selectmenu{tout}}
\\blockvariable{Ajouter \\ovalnum{10} à \\ovalvariable{compteur}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.compteur).toBe(1)
  })

  it('gere blockcontrol stop tout dans une boucle repeat', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter \\ovalnum{10} fois}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
\\blockifelse{si \\booloperator{\\ovalvariable{compteur} = 3} alors}{
\\blockcontrol{stop \\selectmenu{tout}}
}{
}
}
\\blockvariable{mettre \\selectmenu{apres} à \\ovalnum{99}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.compteur).toBe(3)
    expect(result.variables.apres).toBeUndefined()
  })

  it('gere blockcontrol stop tout en mode anime', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockvariable{Ajouter \\ovalnum{5} à \\ovalvariable{compteur}}
\\blockcontrol{stop \\selectmenu{tout}}
\\blockvariable{Ajouter \\ovalnum{20} à \\ovalvariable{compteur}}
\\end{scratch}`

    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.variables.compteur).toBe(5)
  })
})
