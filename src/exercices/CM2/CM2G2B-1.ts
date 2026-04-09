import ParalleleEtPerpendiculaires from './CM2G2B-2'
export const titre = 'Tracer des parallèles'
export const interactifReady = false
export const amcReady = true
export const amcType = 'AMCOpen'

/**
 * @author Jean-claude Lhote (AMC par Éric Elter en septembre 2021)

 */
export const uuid = '46429'

export const refs = {
  'fr-fr': ['CM2G2B-1'],
  'fr-2016': ['6G12'],
  'fr-ch': ['9ES3-3'],
}
export default class TracerDesParalleles extends ParalleleEtPerpendiculaires {
  constructor() {
    super()

    this.sup = 1
    this.type = 2
  }
}
