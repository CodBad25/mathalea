import { describe, expect, it } from 'vitest'
import ExerciceQcm from '../../src/exercices/ExerciceQcm'
import ExerciceSimple from '../../src/exercices/ExerciceSimple'
import { compteLesReponsesDifferentes } from '../../src/lib/interactif/qcm'

// Mock d'options de comparaison minimal

describe('compteLesReponsesDifferentes', () => {
  it('QCM: toutes différentes (par défaut)', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['2', '3', '4']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(true)
  })
  it('QCM: doublon simple', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['2', '2', '4']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(false)
  })
  it('Simple: toutes différentes', () => {
    const exo = new ExerciceSimple()
    exo.reponse = '5'
    exo.distracteurs = ['6', '7']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(true)
  })
  it('Simple: doublon', () => {
    const exo = new ExerciceSimple()
    exo.reponse = '5'
    exo.distracteurs = ['5', '7']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(false)
  })
  it('Nombre insuffisant', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['2', '3']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(false)
  })

  it('texteAvecCasse: distingue la casse', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['Bonjour', 'bonjour', 'BONJOUR']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { texteAvecCasse: true }),
    ).toBe(true)
    exo.reponses = ['Bonjour', 'Bonjour', 'BONJOUR']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { texteAvecCasse: true }),
    ).toBe(false)
  })
  it('texteSansCasse: ignore la casse', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['Bonjour', 'bonjour', 'BONJOUR']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { texteSansCasse: true }),
    ).toBe(false)
    exo.reponses = ['Bonjour', 'Salut', 'Coucou']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { texteSansCasse: true }),
    ).toBe(true)
  })
  it('fractions: fractionEgale', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['\\frac{1}{2}', '\\frac{2}{4}', '\\frac{3}{6}']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { fractionEgale: true }),
    ).toBe(false)
    exo.reponses = ['1/2', '2/3', '3/4']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { fractionEgale: true }),
    ).toBe(true)
  })
  it('intervalles: intervalle', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['[1;2]', '[2;3]', '[1;2]']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { intervalle: true }),
    ).toBe(false)
    exo.reponses = ['[1;2]', '[2;3]', '[3;4]']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { intervalle: true }),
    ).toBe(true)
  })
  it('ensembles: ensembleDeNombres', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['{1;2;3}', '{3;2;1}', '{4;5;6}']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { ensembleDeNombres: true }),
    ).toBe(false)
    exo.reponses = ['{1,2,3}', '{4,5,6}', '{7,8,9}']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { ensembleDeNombres: true }),
    ).toBe(true)
  })
  it('unités: unite', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['2 m', '2m', '2 m']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, {
        unite: true,
        precisionUnite: 0.001,
      }),
    ).toBe(false)
    exo.reponses = ['2 m', '3 m', '4 m']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, {
        unite: true,
        precisionUnite: 0.001,
      }),
    ).toBe(true)
  })
  it('puissances: puissance', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['2^{3}', '8', '2^{2}']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { puissance: true }),
    ).toBe(false)
    exo.reponses = ['2^3', '9', '2^2']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { puissance: true }),
    ).toBe(true)
  })
  it('expressions numériques: expressionNumerique', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['1+1', '2', '3']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(false)
    exo.reponses = ['1+1', '3', '4']
    expect(compteLesReponsesDifferentes(exo, 3, true, {})).toBe(true)
  })
  it("égalité d'expressions: egaliteExpression", () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['x+1=2', 'x=1', 'x+1=2']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { egaliteExpression: true }),
    ).toBe(false)
    exo.reponses = ['x+1=2', 'x=1', 'x+2=3']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { egaliteExpression: true }),
    ).toBe(true)
  })
  it('suites de nombres: suiteDeNombres', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['1;2;3', '3;2;1', '4;5;6']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { suiteDeNombres: true }),
    ).toBe(false)
    exo.reponses = ['1;2;3', '4;5;6', '7;8;9']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { suiteDeNombres: true }),
    ).toBe(true)
  })
  it('coordonnées: coordonnees', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['(1;2)', '(1;2)', '(2;3)']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { coordonnees: true }),
    ).toBe(false)
    exo.reponses = ['(1;2)', '(2;3)', '(3;4)']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, { coordonnees: true }),
    ).toBe(true)
  })
  it('fonctions: fonction', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['x^{2}', 'x*x', 'x+1']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, {
        fonction: true,
        variable: 'x',
        domaine: [0, 2],
      }),
    ).toBe(false)
    exo.reponses = ['x^2', 'x+1', 'x+2']
    expect(
      compteLesReponsesDifferentes(exo, 3, true, {
        fonction: true,
        variable: 'x',
        domaine: [0, 2],
      }),
    ).toBe(true)
  })
  it('HMS: heures/minutes/secondes', () => {
    const exo = new ExerciceQcm()
    exo.reponses = ['1h30min0s', '01h30min0s', '2h00min00s']
    expect(compteLesReponsesDifferentes(exo, 3, true, { HMS: true })).toBe(
      false,
    )
    exo.reponses = ['1h30min0s', '2h00min00s', '3h00min00s']
    expect(compteLesReponsesDifferentes(exo, 3, true, { HMS: true })).toBe(true)
  })
})
