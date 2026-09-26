import { describe, expect, it } from 'vitest'
import SujetCAN2023Seconde from '../../../../src/exercices/can/2e/can2a-2023'

describe('CAN Seconde 2023 : choix des questions', () => {
  it('respecte les numéros et leur ordre', () => {
    const exercice = new SujetCAN2023Seconde()
    exercice.sup2 = true
    exercice.sup = '2-1'
    exercice.nouvelleVersion()
    expect(exercice.nbQuestions).toBe(2)
    expect(exercice.listeQuestions).toHaveLength(2)
    expect(exercice.listeQuestions[0]).toContain('Écriture décimale')
    expect(exercice.listeQuestions[1]).toContain('\\times')
  })

  it('affiche le graphique pour la question 27 seule', () => {
    const exercice = new SujetCAN2023Seconde()
    exercice.sup2 = true
    exercice.sup = '27'
    exercice.nouvelleVersion()
    expect(exercice.listeQuestions).toHaveLength(1)
    expect(exercice.listeQuestions[0]).toContain('mathalea2d')
    expect(exercice.listeQuestions[0]).toContain('sur la droite')
    expect(exercice.listeCanEnonces[0]).toContain('mathalea2d')
  })
})
