import LectureExpressionFonctionsAffines from './3F21-1'
export const titre = 'Déterminer une fonction linéaire'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'b4c0d'
export const refs = {
  'fr-fr': ['3F21', 'BP1AUTO054'],
  'fr-ch': ['11FA1B-4'],
}
export default class LectureExpressionFonctionsLineaires extends LectureExpressionFonctionsAffines {
  constructor() {
    super()
    this.lineaire = true
  }
}
