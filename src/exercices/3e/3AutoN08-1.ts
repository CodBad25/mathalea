import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'

export const titre = 'Connaître les carrés parfaits'
export const dateDePublication = '29/10/2025'

export const interactifReady = true

export const uuid = '75b05'
export const refs = {
  'fr-fr': ['3AutoN08-1'],
  'fr-ch': [],
}

/**
 * Ici, on décrit rapidement l'enjeu pédagogique de l'exercice
 * @author Elodie SAVARY
 */

export default class NomExercice extends ExerciceSimple {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = ["Aller jusqu'à 16", false]
    this.sup = false
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.spacingCorr = 1.5
  }

  nouvelleVersion() {
    const max = this.sup ? 16 : 12 // si sup cochée on va jusqu'à 16

    const a = randint(2, max)
    this.question = `Quel est le carré de $${a}$ ?`
    this.reponse = a * a
    this.correction = `Le carré d'un nombre est ce nombre multiplié par lui-même : $${a}\\times${a}=${this.reponse}$`
  }
}
