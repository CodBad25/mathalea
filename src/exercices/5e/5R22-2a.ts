import ExerciceSimplificationSommeAlgebrique from './SimplificationSommeAlgebrique'
export const dateDePublication = '01/07/2026'

export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const titre =
  "Écrire une addition sous la forme d'une expression algébrique sans parenthèses puis calculer"

export const uuid = '9c5e2'

export const refs = {
  'fr-fr': ['5R22-2a'],
  'fr-ch': [],
}
/**
 * @author Éric Elter
 */

export default class ExerciceSimplificationSommeAlgebriqueAddition extends ExerciceSimplificationSommeAlgebrique {
  constructor() {
    super()
    this.sup2 = 1
  }
}
