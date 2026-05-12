import seedrandom from 'seedrandom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RepresentationParametrique from '../../src/exercices/can/TSpe/canTSpeE03'

vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

function texCoefficient(coefficient: number): string {
  if (coefficient === 1) return ''
  if (coefficient === -1) return '-'
  return String(coefficient)
}

function texConstante(constante: number): string {
  if (constante === 0) return ''
  return constante > 0 ? `+${constante}` : String(constante)
}

function installMathfield(values: Record<string, string>) {
  const mathfield = document.createElement('div') as unknown as HTMLElement & {
    getPromptValue: (key: string) => string
  }
  mathfield.id = 'champTexteEx0Q0'
  mathfield.getPromptValue = (key: string) => values[key] ?? ''
  document.body.appendChild(mathfield)
}

function coordinateExpression(
  expected: { point: [number, number, number]; direction: [number, number, number] },
  index: number,
  multiplier = 1,
) {
  return `${texCoefficient(multiplier * expected.direction[index])}t${texConstante(expected.point[index])}`
}

describe('canTSpeE03 / 3G98-1 interactif', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.notify = vi.fn()
    window.notifyLocal = vi.fn()
  })

  it('accepte les réponses attendues avec le check de droite paramétrique', () => {
    seedrandom('3G98-1', { global: true })
    const exercice = new RepresentationParametrique()
    exercice.interactif = true
    exercice.numeroExercice = 0
    exercice.nouvelleVersion()

    const valeurs = exercice.autoCorrection[0].valeur
    const expected = JSON.parse(String(valeurs.champ1.value)) as {
      point: [number, number, number]
      direction: [number, number, number]
    }
    installMathfield({
      champ1: coordinateExpression(expected, 0),
      champ2: coordinateExpression(expected, 1),
      champ3: coordinateExpression(expected, 2),
    })

    for (const key of ['champ1', 'champ2', 'champ3']) {
      const reponse = valeurs[key]
      const result = reponse.compare('', String(reponse.value), reponse.options)
      expect(result.isOk).toBe(true)
    }
  })

  it('accepte une représentation équivalente utilisant un vecteur directeur proportionnel', () => {
    seedrandom('3G98-1', { global: true })
    const exercice = new RepresentationParametrique()
    exercice.interactif = true
    exercice.numeroExercice = 0
    exercice.nouvelleVersion()

    const valeurs = exercice.autoCorrection[0].valeur
    const expected = JSON.parse(String(valeurs.champ1.value)) as {
      point: [number, number, number]
      direction: [number, number, number]
    }
    installMathfield({
      champ1: coordinateExpression(expected, 0, 2),
      champ2: coordinateExpression(expected, 1, 2),
      champ3: coordinateExpression(expected, 2, 2),
    })

    const result = valeurs.champ1.compare(
      '',
      String(valeurs.champ1.value),
      valeurs.champ1.options,
    )

    expect(result.isOk).toBe(true)
  })
})
