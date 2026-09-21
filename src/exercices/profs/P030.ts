import {
  addSchemaEnBarre,
  TYPES_SCHEMA_EN_BARRE,
} from '../../lib/customElements/SchemaEnBarreElement'
import Exercice from '../Exercice'

export const titre = 'Créer un schéma en barre'

export const refs = {
  'fr-fr': ['P030'],
  'fr-ch': [],
}
export const uuid = 'a9f83'

/**
 * Outil du professeur pour afficher et compléter un schéma en barre (additif
 * ou multiplicatif, parties-tout ou comparaison), par exemple pour
 * modéliser un problème au tableau.
 * @author Rémi Angot
 */
export default class CreateurSchemaEnBarre extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.pasDeVersionLatex = true
    this.pasDeVersionAleatoire = true
    this.correctionDetailleeDisponible = false
    this.besoinFormulaireNumerique = [
      'Type de schéma',
      4,
      '0 : Au choix\n1 : Additif parties-tout\n2 : Additif comparaison\n3 : Multiplicatif parties-tout\n4 : Multiplicatif comparaison',
    ]
    this.sup = 0
  }

  nouvelleVersion() {
    const choix = Number(this.sup)
    const typeImpose =
      Number.isInteger(choix) && choix >= 1 && choix <= 4
        ? TYPES_SCHEMA_EN_BARRE[choix - 1]
        : undefined
    const contenuGenere = addSchemaEnBarre(this, 0, { typeImpose })
    this.contenu = contenuGenere
    this.listeQuestions[0] = contenuGenere
  }
}
