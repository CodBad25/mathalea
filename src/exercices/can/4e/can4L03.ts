import ExerciceEquationASolutionEntiere from '../../4e/4L20-0'
export const interactifReady = true

export const amcReady = true
export const amcType = 'AMCNum'
export const titre = 'Résoudre une équation $ax+b=cx+d$'
export const uuid = '91cd5'
export const refs = {
  'fr-fr': ['can4L03'],
  'fr-ch': [],
}
export default class UneEquationDifficile extends ExerciceEquationASolutionEntiere {
  constructor() {
    super()
    this.nbQuestions = 1
    this.correctionDetaillee = false
    this.sup = false
    this.sup2 = 3
    this.consigne = "Résoudre l'équation :"
  }
}
