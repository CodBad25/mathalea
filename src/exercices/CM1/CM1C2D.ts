import AdditionsSoustractionsMultiplicationsPosees from '../6e/6N2A-1'

export const dateDePublication = '28/01/2026'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = 'mathLive'

export const titre = 'Poser multiplications de nombres entiers'
export const uuid = 'ekf64'
export const refs = {
  'fr-fr': ['CM1C2D'],
  'fr-ch': [],
}

/**
 * @author Éric Elter
 */

export default class MultiplicationsPoseesCM1 extends AdditionsSoustractionsMultiplicationsPosees {
  constructor() {
    super()
    this.nbQuestions = 2
    this.besoinFormulaireTexte = [
      'Types de calculs',
      'Nombres séparés par des tirets :\n1 : abc * d0e (tables de 2 à 5)\n2 : abc * de (tables de 5 à 9)\n3 : Mélange',
    ]
    this.version = 'CM1'
    this.sup = '3'
  }
}
