import LectureDiagrammeBaton from '../6e/auto6P1A'
export const titre = 'Lire un diagramme en bâtons'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = '9926a'
export const refs = {
  'fr-fr': ['5D1C', 'BP1AUTO026'],
  'fr-2016': ['5S11'],
  'fr-ch': ['9FA3A-1'],
}
export default class LectureDiagrammeBarre5e extends LectureDiagrammeBaton {
  constructor() {
    super()
    this.sup = 3
    this.sup2 = 2
  }
}
