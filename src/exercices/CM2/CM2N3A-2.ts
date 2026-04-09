import ExerciceTablesAdditions from '../6e/6N0A-1'
export const titre = "Connaître les tables d'addition"
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '22/08/2024'

/**
 * Lire des nombres déciamux sur une portion de droite graduée
 * Une question demande la forme décimale, une autre, la partie entière plus la fraction décimale, et une troisième demande une seule fraction décimale.
 *
 * @author Jean-claude Lhote
 */
export const uuid = 'ed7fc'

export const refs = {
  'fr-fr': ['CM2N3A-2'],
  'fr-2016': ['c3C10-4'],
  'fr-ch': [],
}
export default class TablesAdditionsCycle3 extends ExerciceTablesAdditions {
  constructor() {
    super(10)
  }
}
