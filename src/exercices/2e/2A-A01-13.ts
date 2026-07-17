import Question1 from '../EAMPremiere/EAM-PolynesieSpecifique-2026-Q1'
import Question2 from '../EAMPremiere/EAM-PolynesieSpecifique-2026-Q2'
import Question3 from '../EAMPremiere/EAM-PolynesieSpecifique-2026-Q3'
import Question4 from '../EAMPremiere/EAM-PolynesieSpecifique-2026-Q4'
import Question5 from '../EAMPremiere/EAM-PolynesieSpecifique-2026-Q5'
import MetaExercice from '../MetaExerciceCan'

export const titre = 'Sujet n°13'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '08e9a'
export const refs = {
  'fr-fr': ['2A-A01-13'],
  'fr-ch': [],
}
export const dateDePublication = '15/07/2026'

/**
 * Annales Auto 2026
 * @author Ingrid Vernimmen
 */

const questions = [
  Question1,
  Question2,
  Question3,
  Question4,
  Question5,
]

export default class AutoPolynesieSpecifique2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
