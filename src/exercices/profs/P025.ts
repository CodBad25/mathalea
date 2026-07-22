import { ensureElementIepEditeurRegistered } from '../../modules/ElementIepEditeur'
import { context } from '../../modules/context'
import Exercice from '../Exercice'

export const titre =
  'Créer une animation de construction aux instruments (Instrumenpoche)'

export const refs = {
  'fr-fr': ['P025'],
  'fr-ch': [],
}
export const uuid = 'a9f31'

/**
 * Outil du professeur pour créer pas à pas, avec des boutons,
 * un programme de construction aux instruments (règle, compas, équerre,
 * rapporteur) et tester l'animation Instrumenpoche correspondante.
 * @author Rémi Angot
 */
export default class CreateurAnimationInstruments extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.pasDeVersionLatex = true
  }

  nouvelleVersion() {
    let contenuGenere: string
    if (context.isHtml) {
      ensureElementIepEditeurRegistered()
      contenuGenere = `<alea-iep-editeur id="editeur-iep-${this.numeroExercice ?? 0}"></alea-iep-editeur>`
    } else {
      contenuGenere = ''
    }
    this.contenu = contenuGenere
    this.listeQuestions[0] = contenuGenere
  }
}
