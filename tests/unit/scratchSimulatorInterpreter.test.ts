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

  it("trace avec stylo lors des blockmove 'ajouter ... a x/y'", () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockpen{stylo en position d'écriture}
\\blockmove{ajouter \\ovalnum{15} à x}
\\blockmove{ajouter \\ovalnum{15} à y}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.traces.length).toBe(2)
    expect(result.traces[0]).toEqual({
      startX: 200,
      startY: 200,
      endX: 215,
      endY: 200,
    })
    expect(result.traces[1]).toEqual({
      startX: 215,
      startY: 200,
      endX: 215,
      endY: 185,
    })
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

  it('expose les compteurs d iterations pour les boucles repeat imbriquees', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{c} à \\ovalnum{0}}
\\blockrepeat{répéter \\ovalnum{2} fois}{
\\blockrepeat{répéter \\ovalnum{3} fois}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{c}}
}
}
\\end{scratch}`

    const iterationSnapshots: Array<string> = []

    const result = await interpreter.executeAnimated(
      code,
      () => {
        const iterations = interpreter.getCurrentState().repeatIterations ?? []
        if (iterations.length > 0) {
          iterationSnapshots.push(
            iterations
              .map(
                (it) =>
                  `${it.level}:${it.current}/${it.total === null ? '?' : it.total}`,
              )
              .join('|'),
          )
        }
      },
      0,
    )

    expect(result.variables.c).toBe(6)
    expect(iterationSnapshots.some((entry) => entry.includes('1:1/2'))).toBe(
      true,
    )
    expect(iterationSnapshots.some((entry) => entry.includes('2:1/3'))).toBe(
      true,
    )
    expect(iterationSnapshots.some((entry) => entry.includes('2:3/3'))).toBe(
      true,
    )
    expect(result.repeatIterations).toEqual([])
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

  it('ne gere pas booloperator ==', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{a} à \\ovalnum{4}}
\\blockifelse{si \\booloperator{\\ovalvariable{a} == \\ovalnum{4}} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{1}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{0}}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.variables.resultat).toBe(0)
  })

  it('gere booloperator = avec valeurs textuelles', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocksensing{demander \\ovalnum{Ton nom} et attendre}
\\blockifelse{si \\booloperator{\\ovalsensing{réponse} = \\ovalnum{Alice}} alors}{
\\blockvariable{mettre \\selectmenu{ok} à \\ovalnum{1}}
}{
\\blockvariable{mettre \\selectmenu{ok} à \\ovalnum{0}}
}
\\end{scratch}`

    interpreter.onAskInput = async () => 'Alice'
    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.variables.ok).toBe(1)
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

  it('gere blockif simple avec condition fausse (sync)', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{0}}
\\blockif{si \\booloperator{\\ovalvariable{x} > 5} alors}{
\\blockmove{ajouter \\ovalnum{15} à y}
}
\\blockmove{ajouter \\ovalnum{15} à x}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(215)
    expect(result.finalY).toBe(200)
  })

  it('gere blockif simple avec condition fausse (anime)', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{0}}
\\blockif{si \\booloperator{\\ovalvariable{x} > 5} alors}{
\\blockmove{ajouter \\ovalnum{15} à y}
}
\\blockmove{ajouter \\ovalnum{15} à x}
\\end{scratch}`

    const instructions: string[] = []

    const result = await interpreter.executeAnimated(
      code,
      () => {
        const state = interpreter.getCurrentState()
        if (state.currentInstruction) {
          instructions.push(state.currentInstruction)
        }
      },
      0,
    )

    expect(result.finalX).toBe(215)
    expect(result.finalY).toBe(200)
    expect(instructions.some((item) => item.includes('Ajouter 15 a y'))).toBe(
      false,
    )
    expect(instructions.some((item) => item.includes('Ajouter 15 a x'))).toBe(
      true,
    )
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

  it('gere booloperator avec ovalmove abscisse x dans une condition ifelse', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
\\blockrepeat{répéter \\ovalnum{4} fois}{
\\blockifelse{si \\booloperator{\\ovalmove{abscisse x} < \\ovalnum{-30}} alors}{
\\blockmove{ajouter \\ovalnum{15} à y}
}{
\\blockmove{ajouter \\ovalnum{-15} à x}
}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(155)
    expect(result.finalY).toBe(185)
  })

  it('gere booloperator avec ovalmove ordonnee y dans une condition ifelse', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
\\blockifelse{si \\booloperator{\\ovalmove{ordonnée y} = \\ovalnum{0}} alors}{
\\blockmove{ajouter \\ovalnum{15} à y}
}{
\\blockmove{ajouter \\ovalnum{15} à x}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(200)
    expect(result.finalY).toBe(185)
  })

  it('gere booloperator avec ovalmove direction dans une condition ifelse', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockmove{s'orienter à \\ovalnum{-90}}
\\blockifelse{si \\booloperator{\\ovalmove{direction} = \\ovalnum{-90}} alors}{
\\blockmove{ajouter \\ovalnum{15} à x}
}{
\\blockmove{ajouter \\ovalnum{15} à y}
}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.finalX).toBe(215)
    expect(result.finalY).toBe(200)
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

  describe('ifelse en mode anime', () => {
    it('suit uniquement la branche active des ifelse imbriques', async () => {
      const interpreter = new ScratchInterpreter(200, 200, 90)
      const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{2}}
\\blockifelse{si \\booloperator{\\ovalvariable{x} > 5} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{1}}
}{
\\blockifelse{si \\booloperator{\\ovalvariable{x} = 2} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{42}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{0}}
}
}
\\blockmove{avancer de \\ovalnum{10} pas}
\\end{scratch}`

      const instructions: string[] = []
      const indexes: number[] = []

      const result = await interpreter.executeAnimated(
        code,
        () => {
          const state = interpreter.getCurrentState()
          if (state.currentInstruction) {
            instructions.push(state.currentInstruction)
          }
          if (typeof state.currentInstructionIndex === 'number') {
            indexes.push(state.currentInstructionIndex)
          }
        },
        0,
      )

      expect(result.variables.resultat).toBe(42)
      expect(result.finalX).toBe(210)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 42')),
      ).toBe(true)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 1')),
      ).toBe(false)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 0')),
      ).toBe(false)
      expect(Math.max(...indexes)).toBe(4)
    })

    it('suit uniquement la branche then quand la condition est vraie', async () => {
      const interpreter = new ScratchInterpreter(200, 200, 90)
      const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{x} à \\ovalnum{9}}
\\blockifelse{si \\booloperator{\\ovalvariable{x} > 5} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{100}}
}{
\\blockifelse{si \\booloperator{\\ovalvariable{x} = 9} alors}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{42}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{0}}
}
}
\\blockmove{avancer de \\ovalnum{5} pas}
\\end{scratch}`

      const instructions: string[] = []
      const indexes: number[] = []

      const result = await interpreter.executeAnimated(
        code,
        () => {
          const state = interpreter.getCurrentState()
          if (state.currentInstruction) {
            instructions.push(state.currentInstruction)
          }
          if (typeof state.currentInstructionIndex === 'number') {
            indexes.push(state.currentInstructionIndex)
          }
        },
        0,
      )

      expect(result.variables.resultat).toBe(100)
      expect(result.finalX).toBe(205)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 100')),
      ).toBe(true)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 42')),
      ).toBe(false)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 0')),
      ).toBe(false)
      expect(Math.max(...indexes)).toBe(3)
    })

    it('dans un repeat, suit les instructions enfants ifelse sans surligner le conteneur', async () => {
      const interpreter = new ScratchInterpreter(200, 200, 90)
      const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{compteur} à \\ovalnum{0}}
\\blockrepeat{répéter \\ovalnum{3} fois}{
\\blockifelse{si \\booloperator{\\ovalvariable{compteur} < 2} alors}{
\\blockvariable{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
}{
\\blockvariable{mettre \\selectmenu{resultat} à \\ovalnum{99}}
}
}
\\end{scratch}`

      const instructions: string[] = []

      const result = await interpreter.executeAnimated(
        code,
        () => {
          const state = interpreter.getCurrentState()
          if (state.currentInstruction) {
            instructions.push(state.currentInstruction)
          }
        },
        0,
      )

      expect(result.variables.compteur).toBe(2)
      expect(result.variables.resultat).toBe(99)
      // Vérifier que les instructions atomiques apparaissent
      expect(
        instructions.some((item) => item.includes('Ajouter 1 a compteur')),
      ).toBe(true)
      expect(
        instructions.some((item) => item.includes('Mettre resultat a 99')),
      ).toBe(true)
      // Le conteneur ifelse "si ... alors" devrait apparaître pendant l'évaluation de la condition
      expect(instructions.some((item) => item.includes('si '))).toBe(true)
    })
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

  it('gere blocksensing demander et attendre', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocksensing{demander \\ovalnum{Choisissez un nombre} et attendre}
\\blockvariable{mettre \\selectmenu{x} à \\ovalsensing{réponse}}
\\end{scratch}`

    // Simuler la réponse utilisateur
    interpreter.onAskInput = async (prompt: string) => {
      expect(prompt).toBe('Choisissez un nombre')
      return '15'
    }

    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.variables.x).toBe(15)
  })

  it('gere blocksensing avec reponse dans calcul', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocksensing{demander \\ovalnum{Entrez un nombre} et attendre}
\\blockvariable{mettre \\selectmenu{resultat} à \\ovaloperator{\\ovalsensing{réponse} * \\ovalnum{2}}}
\\end{scratch}`

    interpreter.onAskInput = async () => '7'

    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.variables.resultat).toBe(14)
  })

  it('gere blocksensing avec valeur par defaut si pas de callback', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocksensing{demander \\ovalnum{Test} et attendre}
\\blockvariable{mettre \\selectmenu{x} à \\ovalsensing{réponse}}
\\end{scratch}`

    // Pas de callback défini, devrait utiliser '42' par défaut
    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.variables.x).toBe(42)
  })

  it('gere ovaloperator avec regrouper pour concatenation simple', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{Hello} et \\ovalnum{World}}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['HelloWorld'])
  })

  it('gere ovaloperator avec regrouper et espaces', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{Hello } et \\ovalnum{World}}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['Hello World'])
  })

  it('gere regrouper avec variables', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blockvariable{mettre \\selectmenu{a} à \\ovalnum{10}}
\\blockvariable{mettre \\selectmenu{b} à \\ovalnum{20}}
\\blocklook{dire \\ovaloperator{regrouper \\ovalvariable{a} et \\ovalvariable{b}}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['1020'])
  })

  it('gere regrouper imbrique', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{A} et \\ovaloperator{regrouper \\ovalnum{B} et \\ovalnum{C}}}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['ABC'])
  })

  it('gere regrouper avec ovalsensing reponse', async () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocksensing{demander \\ovalnum{Ton nom} et attendre}
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{Bonjour } et \\ovalsensing{réponse}}}
\\end{scratch}`

    interpreter.onAskInput = async () => 'Alice'

    const result = await interpreter.executeAnimated(code, () => {}, 0)

    expect(result.messages).toEqual(['Bonjour Alice'])
  })

  it('ovaloperator continue de fonctionner en mode arithmetique', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{5 + 3 * 2}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['11'])
  })

  it('gere l operateur modulo avec %', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{17 % 5}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['2'])
  })

  it('gere l operateur modulo avec mod', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{17 mod 5}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['2'])
  })

  it('gere l operateur modulo avec modulo', () => {
    const interpreter = new ScratchInterpreter(200, 200, 90)
    const code = `\\begin{scratch}[blocks]
\\blocklook{dire \\ovaloperator{17 modulo 5}}
\\end{scratch}`

    const result = interpreter.execute(code)

    expect(result.messages).toEqual(['2'])
  })
})
