import SimplifierFractions from '../4e/4C24'
export const titre = "Simplifier des fractions à l'aide des nombres premiers"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDePublication = '28/09/2022'
export const dateDeModifImportante = '03/10/2023'
export const uuid = '1871d'
export const refs = {
  'fr-fr': ['3A11-0'],
  'fr-ch': ['9NO3B-5'],
}
export default class SimplifierFractions3e extends SimplifierFractions {
  constructor() {
    super()
    this.sup = 3
    this.sup2 = '2-3-5-7-11-13-17-19-23'
  }
}
