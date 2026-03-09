import LectureGraphiqueParaboleA from '../can/1e/can1SD06'
export const titre =
  'Lire graphiquement les valeurs de $a$ et de $b$ dans $ax^2+b$'
export const dateDePublication = '01/08/2025'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can1F24 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '2f147'

export const refs = {
  'fr-fr': ['1A-F02-12'],
  'fr-ch': ['1mF3-22'],
}
export default class Auto1AF2d extends LectureGraphiqueParaboleA {
  constructor() {
    super()
    this.versionQcm = true
  }
}
