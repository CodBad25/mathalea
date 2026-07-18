import MetaExercice from '../MetaExerciceCan'
import Question1 from '../EAMPremiere/EAM-CENonSpe-2026-Q1'
import Question2 from '../EAMPremiere/EAM-CENonSpe-2026-Q2'
import Question3 from '../EAMPremiere/EAM-CENonSpe-2026-Q3'
import Question4 from '../EAMPremiere/EAM-AGSpe-2026-Q3'
import Question5 from '../EAMPremiere/EAM-FMTechno-2026-Q12'
import Question6 from '../EAMPremiere/EAM-PolynesieTechno-2026-Q4'
import Question7 from '../EAMPremiere/EAM-CENonSpe-2026-Q7'
import Question8 from '../EAMPremiere/EAM-CENonSpe-2026-Q10'
export const titre = 'Sujet n°4'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '1497d'
export const refs = {
  'fr-fr': ['2A-A01-4'],
  'fr-ch': [],
}
export const dateDePublication = '15/07/2026'

/**
 * Annales Auto 2026
 * @author Ingrid Vernimmen
 */

const questions = [Question1, Question2, Question3, Question4, Question5, Question6, Question7, Question8]

export default class AutoCEspe2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
