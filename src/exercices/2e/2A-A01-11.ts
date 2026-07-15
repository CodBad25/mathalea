import Question11 from '../EAMPremiere/EAM-AGTechno-2026-Q11'
import Question2 from '../EAMPremiere/EAM-AGTechno-2026-Q2'
import Question4 from '../EAMPremiere/EAM-AGTechno-2026-Q4'
import Question5 from '../EAMPremiere/EAM-AGTechno-2026-Q5'
import Question6 from '../EAMPremiere/EAM-AGTechno-2026-Q6'
import Question10 from '../EAMPremiere/EAM-AGTechno-2026-Q10'
import MetaExercice from '../MetaExerciceCan'

export const titre = 'Sujet n°11'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'bca1c'
export const refs = {
  'fr-fr': ['2A-A01-11'],
  'fr-ch': [],
}
export const dateDePublication = '15/07/2026'

/**
 * Annales Auto 2026
 * @author Ingrid Vernimmen
 */

const questions = [
  Question2,
  Question4,
  Question5,
  Question6,
  Question10,
  Question11,
]

export default class AutoAGNonSpe2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
