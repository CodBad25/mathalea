import RangerOrdreCroissantDecroissant from './6N0A-10'
export const titre = 'Ranger des nombres décimaux'
export const dateDePublication = '13/05/2025'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * * Ranger une liste de nombres décimaux
 * @author Éric Elter
 */

export const uuid = '15ece'

export const refs = {
  'fr-fr': ['6N1J'],
  'fr-2016': ['6N31-7'],
  'fr-ch': ['9NO7-12'],
}

export default class RangerOrdreCroissantDecroissantDecimaux extends RangerOrdreCroissantDecroissant {
  constructor() {
    super()
    this.besoinFormulaire2Texte = [
      'Type de nombres',
      [
        'Nombres séparés par des tirets  :',
        '1 : Au dixième',
        '2 : Au centième',
        '3 : Au millième',
        '4 : Mélange',
      ].join('\n'),
    ]
    this.besoinFormulaire3CaseACocher = ['Nombres décimaux', true]
    this.besoinFormulaire4CaseACocher = ['Même partie entière', true]
    this.sup = 1
    this.sup2 = '4'
    this.comment =
      'Le type de nombres permet de sélectionner que des nombres au dixième ou au centième ou au millième ou bien un mélange affiné des uns et des autres.'
    this.correctionDetailleeDisponible = true
  }
}
