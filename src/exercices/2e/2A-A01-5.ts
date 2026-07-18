import MetaExercice from '../MetaExerciceCan'
import Question1 from '../EAMPremiere/EAM-CETechno-2026-Q1'
import Question2 from '../EAMPremiere/EAM-CETechno-2026-Q2'
import Question3 from '../EAMPremiere/EAM-PolynesieSpe-2026-Q8'
import Question5 from '../EAMPremiere/EAM-ANSpe-2026-Q3'
import Question4 from '../EAMPremiere/EAM-ANnonSpe-2026-Q4'
import Question6 from '../EAMPremiere/EAM-CETechno-2026-Q6'
import Question8 from '../EAMPremiere/EAM-CETechno-2026-Q8'
import Question7 from '../EAMPremiere/EAM-ANnonSpe-2026-Q1'
import Question9 from '../EAMPremiere/EAM-PolynesieSpe-2026-Q4'
import Question10 from '../EAMPremiere/EAM-AGnonSpe-2026-Q2'
export const titre = 'Sujet n°5'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'e0193'
export const refs = {
  'fr-fr': ['2A-A01-5'],
  'fr-ch': [],
}
export const dateDePublication = '15/07/2026'

/**
 * Annales Auto 2026
 * @author Ingrid Vernimmen
 */

const questions = [Question1, Question2, Question3, Question4, Question5, Question6, Question7, Question8, Question9, Question10]

export default class AutoCEtechno2026 extends MetaExercice {
  constructor() {
    super(questions)
  }
}
