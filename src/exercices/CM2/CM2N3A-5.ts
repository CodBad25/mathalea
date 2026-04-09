import DivisionsEuclidiennes from '../6e/6N2J'
export const titre = 'Poser des divisions euclidiennes'
export const amcReady = true
export const amcType = 'AMCOpen'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '01/11/2014'
/**
 * @author Jean-claude Lhote
 */
export const uuid = 'b259a'

export const refs = {
  'fr-fr': ['CM2N3A-5'],
  'fr-2016': ['c3C11'],
  'fr-ch': [],
}
export default class DivisionCycle3 extends DivisionsEuclidiennes {
  constructor() {
    super()
    this.sup = 1
  }
}
