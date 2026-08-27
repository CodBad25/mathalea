import RelationDeThales from '../4e/_RelationDeThales'
export const dateDePublication = '05/01/2023'
export const dateDeModifImportante = '08/11/2025'

export const interactifReady = true
export const titre = 'Écrire une relation de Thalès'
export const uuid = '6fd12'
export const refs = {
  'fr-fr': ['3G20-2', 'BP2AutoR8', 'BP2G15'],
  'fr-ch': ['11GM1B-2'],
}
export default class RelationDeThales3e extends RelationDeThales {
  constructor() {
    super()
    this.sup = 2
    this.level = 3
  }
}
