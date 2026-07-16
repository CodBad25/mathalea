import MetaExercice from '../MetaExerciceCan'
import Question1 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q1'
import Question2 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q2'
import Question4 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q4'
import Question5 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q5'
import Question6 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q6'
import Question7 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q7'
import Question8 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q8'

export const titre = 'Sujet n°14'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '4885a'
export const refs = {
  'fr-fr': ['2A-A01-14'],
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
  Question4,
  Question5,
  Question6,
  Question7,
  Question8,
]

export default class AutoPolynesieTechno2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
