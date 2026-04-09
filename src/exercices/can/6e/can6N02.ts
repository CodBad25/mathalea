import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre =
  'Déterminer un nombre à partir de son nombre de centaines, dizaines'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '01/07/2022'
export const dateDeModifImportante = '26/10/2024'
/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '75d40'

export const refs = {
  'fr-fr': ['can6N02', '6N1A-flash2'],
  'fr-ch': [],
}
export default class RecomposerEntierSimple extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const c = randint(2, 30)
    const d = randint(2, 30)
    switch (
      choice([1, 2]) //
    ) {
      case 1:
        this.reponse = c * 100
        this.question = `Écrire le nombre égal à $${c}$ centaines.`
        this.correction = `$${c} \\times 100 =${miseEnEvidence(texNombre(c * 100))}$`
        break

      case 2:
        this.reponse = d * 10
        this.question = `Écrire le nombre égal à $${texNombre(d)}$ dizaines. `
        this.correction = `$${texNombre(d)} \\times 10 = ${miseEnEvidence(texNombre(d * 10))}$`
        break
    }
    if (this.interactif) {
      this.question += '<br>'
    }
  }
}
