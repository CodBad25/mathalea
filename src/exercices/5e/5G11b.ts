import Transformations from '../6e/_Transformations'
export const titre = "Trouver l'image d'un point par une symétrie centrale"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDePublication = '02/05/2026'

/**
 * @author Éric Elter (juste du clone)
 */

export const uuid = '9f711'

export const refs = {
  'fr-fr': ['5G11b'],
  'fr-ch': [''],
}
export default class Transformations5eSymCentrale extends Transformations {
  constructor() {
    super()
    this.besoinFormulaireTexte = false
    this.sup = '7'
    this.comment =
      'Cet exercice ne concerne que la symétrie centrale, le demi-tour.'
  }
}
