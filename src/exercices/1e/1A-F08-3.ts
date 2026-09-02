import TrouverCoeffDir from '../can/2e/can2F21-09'

export const titre =
  "Déterminer le coefficient directeur d'une fonction affine à partir de deux images"
export const dateDePublication = '01/09/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can2G31-09 pour les auto 1er avec énoncé différent par A.Meistermann

 * @author Gilles Mora
 */

export const uuid = '69ad3'

export const refs = {
  'fr-fr': ['1A-F08-3'],
  'fr-ch': [],
}
export default class Auto1AF6d extends TrouverCoeffDir {
  constructor() {
    super()
    this.versionQcm = true
  }
}
