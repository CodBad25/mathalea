import ConstructibiliteDesTriangles from './_Constructibilite_des_triangles'

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'AMCHybride'

export const titre =
  'Déterminer si un triangle est constructible à partir de ses 3 longueurs'
export const dateDeModifImportante = '11/01/2025' // Rémi Angot : modification de la rédaction de l'inégalité triangulaire

/**
 * Justifier la construction des triangles via les longueurs
 * @author Sébastien Lozano
 */
export const uuid = 'f789c'

export const refs = {
  'fr-fr': ['5G5B-3'],
  'fr-2016': ['5G21-1'],
  'fr-ch': ['9ES4-12'],
}
export default class ConstructibiliteDesTrianglesLongueurs extends ConstructibiliteDesTriangles {
  exo: string
  constructor() {
    super()
    this.exo = '5G21-1'
    this.besoinFormulaireNumerique = [
      'Niveau de difficulté',
      2,
      '1 : 3 longueurs\n2 : Une longueur et le périmètre\n3 : Mélange',
    ]
  }
}
