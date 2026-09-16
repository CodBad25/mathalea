import { describe, expect, it } from 'vitest'
import type { IExercice } from './types'
import { qcmCamExport } from './qcmCam'

describe('qcmCamExport', () => {
  it('exporte tous les choix et toutes les bonnes réponses', () => {
    const exercice = {
      autoCorrection: [
        {
          formatInteractif: 'qcm',
          propositions: [
            { texte: 'A', statut: true },
            { texte: 'B', statut: false },
            { texte: 'C', statut: false },
            { texte: 'D', statut: false },
            { texte: 'E', statut: true },
          ],
        },
      ],
      consigne: '',
      introduction: '',
      listeQuestions: ['Question'],
    } as unknown as IExercice

    const [question] = qcmCamExport(exercice)

    expect(question.reponse).toBe('AE')
    expect(question.question.match(/<li/g)).toHaveLength(5)
  })
})
