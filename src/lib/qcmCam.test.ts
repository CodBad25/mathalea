import { describe, expect, it } from 'vitest'
import AutoC8d from '../exercices/1e/1A-C08-4'
import { mathaleaHandleExerciceSimple } from './mathalea'
import type { IExercice } from './types'
import { qcmCamExport } from './qcmCam'

describe('qcmCamExport', () => {
  it.each(['qcm', 'mathalea-qcm'])(
    'exporte tous les choix et toutes les bonnes réponses au format %s',
    (formatInteractif) => {
      const exercice = {
        autoCorrection: [
          {
            formatInteractif,
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
    },
  )

  it('exporte la version QCM d’un ExerciceSimple', () => {
    const exercice = new AutoC8d()

    mathaleaHandleExerciceSimple(exercice, false, 0, 'qcm-cam-simple')

    expect(exercice.versionQcm).toBe(true)
    expect(qcmCamExport(exercice)).toHaveLength(1)
  })
})
