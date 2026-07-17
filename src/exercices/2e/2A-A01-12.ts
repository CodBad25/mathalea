import MetaExercice from '../MetaExerciceCan'
import Question3 from '../EAMPremiere/EAM-PolynesieSpe-2026-Q3'
import Question4 from '../EAMPremiere/EAM-PolynesieSpe-2026-Q4'
import Question6 from '../EAMPremiere/EAM-PolynesieSpe-2026-Q6'
import Question8 from '../EAMPremiere/EAM-PolynesieSpe-2026-Q8'

export const titre = 'Sujet n°12'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '67626'
export const refs = {
  'fr-fr': ['2A-A01-12'],
  'fr-ch': [],
}
export const dateDePublication = '15/07/2026'

/**
 * Annales Auto 2026
 * @author Ingrid Vernimmen
 */

const questions = [
  Question3,
  Question4,
  Question6,
  Question8,
]

export default class AutoPolynesieSpe2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
