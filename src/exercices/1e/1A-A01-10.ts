import MetaExercice from '../MetaExerciceCan'
import Question1 from '../EAMPremiere/EAM-AGnonSpe-2026-Q1'
import Question2 from '../EAMPremiere/EAM-AGnonSpe-2026-Q2'
import Question3 from '../EAMPremiere/EAM-AGnonSpe-2026-Q3'
import Question4 from '../EAMPremiere/EAM-AGnonSpe-2026-Q4'
import Question5 from '../EAMPremiere/EAM-AGnonSpe-2026-Q5'
import Question6 from '../EAMPremiere/EAM-AGnonSpe-2026-Q6'
import Question7 from '../EAMPremiere/EAM-AGnonSpe-2026-Q7'
import Question8 from '../EAMPremiere/EAM-AGnonSpe-2026-Q8'
export const titre = 'Antilles Guyane Sans Spécialité'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'dd7dc'
export const refs = {
  'fr-fr': ['1A-A01-10'],
  'fr-ch': [],
}
export const dateDePublication = '11/06/2026'

/**
 * Annales Auto 2026
 * @author Gilles Mora
 */

const questions = [Question1, Question2, Question3, Question4, Question5, Question6, Question7, Question8]

export default class AutoAGNonSpe2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
