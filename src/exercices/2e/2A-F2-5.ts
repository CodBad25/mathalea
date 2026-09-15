import AntecedentParCalcul from '../3e/3F23-1'
export const titre = 'Déterminer un antécédent par une fonction affine'
export const interactifReady = true

export const dateDeModifImportante = '15/09/2026'

export const uuid = '97300'

export const refs = {
  'fr-fr': ['2A-F2-5', '1A-F02-22'],
  'fr-ch': [],
}
/**
 * Clone de 3F23-1 pour l'automatisme 2A-F2-5 : toujours en version QCM, avec
 * les cas 1 (ax+b petits relatifs), 3 (a(x+b)+c) et 4 (a(bx+c)+dx+e) actifs
 * (poids 1 chacun) — le cas 2 (ax+b grands relatifs) est désactivé.
 * @author Gilles Mora
 */
export default class Automatisme2AF25 extends AntecedentParCalcul {
  constructor() {
    super()
    this.sup2 = true
    this.sup = '1-3'
  }
}
