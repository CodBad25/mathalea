import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const titre = 'Utiliser le produit cartésien.'
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '20/4/2025'

export const uuid = '20106'
export const refs = {
  'fr-fr': ['TSG1-05'],
  'fr-ch': ['4mProbStat-1'],
}

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Stéphane Guyon

*/
export default class NomExercice extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const filles = randint(12, 18) // nombre de filles
    const garçons = randint(12, 18) // nombre de garçons
    this.question = `Dans une classe de terminale, il y a ${filles} filles et ${garçons} garçons. <br>`
    this.question +=
      'On souhaite élire un binôme mixte de délégués de classe. <br>'
    this.question += 'Déterminer le nombre de binômes possibles. <br>'
    this.correction =
      "Soit $F$ l'ensemble des filles de la classe et $G$ l'ensemble des garçons.<br>"
    this.correction +=
      'On cherche le nombre de couples $(f,g)\\in F \\times G$ .<br>'
    this.correction +=
      'En appliquanf le principe multiplicatif, on sait que $\\mathrm{card}(F \\times G) = \\mathrm{card}(F) \\times \\mathrm{card}(G)$.<br>'
    this.correction += `Comme $${filles}\\times${garçons}=${filles * garçons}$ ,<br>`
    this.correction += `il y a donc $${miseEnEvidence(filles * garçons)}$ couples possibles.<br>`
    this.reponse = filles * garçons
  }
}
