import ExoRose from '../6e/_Roses'
export const titre = 'Résoudre une Rose multiplicative avec calcul littéral'
export const dateDePublication = '12/08/2022'
export const dateDeModifImportante = '01/10/2023'
export const interactifReady = true
export const interactifType = 'custom'
export const amcReady = true
export const amcType = 'AMCOpen'

/**
 * Travailler la double distributivité
 * @author Jean-claude Lhote
 */

export const uuid = '4963b'

export const refs = {
  'fr-fr': ['3L11-9'],
  'fr-ch': ['11FA2-15'],
}
export default class RoseAdditive4L extends ExoRose {
  // c'est l'ExoRose zéro contenu dans _Roses.js
  constructor() {
    super()
    this.operation = 'multiplication'
    this.typeDonnees = 'litteraux'
    this.besoinFormulaireNumerique = [
      'Valeur maximale (entre 10 et 30) des facteurs',
      30,
    ]
    this.besoinFormulaire2Numerique = ['Nombre de facteurs (entre 3 et 5)', 5]
  }
}
