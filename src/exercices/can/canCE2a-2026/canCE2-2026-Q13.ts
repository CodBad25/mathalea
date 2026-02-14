import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Calculer un rendu de monnaie'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '5c854'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can2026CE2Q13 extends ExerciceCan {
  enonce(nbBillets?: number, valeurBillet?: number, prixArticle?: number) {
    if (nbBillets == null || valeurBillet == null || prixArticle == null) {
      valeurBillet = 20
      nbBillets = randint(2, 4)
      prixArticle = nbBillets * valeurBillet - randint(3, 10)
    }

    const montantDonne = nbBillets * valeurBillet
    this.reponse = montantDonne - prixArticle

    this.question = `Je paie avec ${nbBillets === 1 ? 'un billet' : `$${texNombre(nbBillets)}$ billets`} de $${texNombre(valeurBillet)}$ €
    un article qui coûte $${texNombre(prixArticle)}$ €.<br>
    Combien doit-on me rendre ?`

    this.correction = `J'ai donné: $${nbBillets}\\times ${texNombre(valeurBillet)}=${texNombre(montantDonne)}$ €<br>
   On doit me rendre : $${texNombre(montantDonne)}-${texNombre(prixArticle)}=${miseEnEvidence(texNombre(this.reponse))}$ €`

    this.canEnonce = this.question
    this.canReponseACompleter = '$\\ldots$ €'

    if (this.interactif) {
      this.optionsChampTexte = { texteAvant: '<br>', texteApres: ' €' }
    } else {
      this.question += `<br>$\\ldots$ €`
    }

    this.formatChampTexte = KeyboardType.clavierDeBase
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(2, 20, 33) : this.enonce()
  }
}