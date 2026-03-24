import Exercice from '../../4e/4C37'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'qcm'
export const titre = 'Déterminer le signe d’une puissance'

export const dateDePublication = '04/07/2022'

/**
 * @author Delphine David (reprise de 4C37)
 */
export const uuid = '4239a'

export const refs = {
  'fr-fr': ['can4C11'],
  'fr-ch': [],
}
export default class SignePuissance extends Exercice {
  can: boolean
  constructor() {
    super()
    this.consigne = 'Déterminer le signe de l’expression :'
    this.nbQuestions = 1
    this.can = true
  }
}
