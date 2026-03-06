import { tableauColonneLigne } from '../../../lib/2d/tableau'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Q12'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'suvzx'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20266Q12 extends ExerciceCan {
 enonce(ouiF?: number, nonF?: number, ouiG?: number, nonG?: number, cas?: number) {
    if (ouiF == null || nonF == null || ouiG == null || nonG == null || cas == null) {
      ouiF = randint(2, 6) * 5
      nonF = randint(6, 12) * 5
      ouiG = randint(2, 5) * 5
      nonG = randint(10, 16) * 5
      cas = choice([1, 2])
    }

    this.formatChampTexte = KeyboardType.clavierDeBase

    const tableau = tableauColonneLigne(
      ['', '\\text{Oui}', '\\text{Non}'],
      ['\\text{Filles}', '\\text{Garçons}'],
      [ouiF, nonF, ouiG, nonG]
    )

    if (cas === 1) {
      const result = nonF + nonG
      this.reponse = texNombre(result, 0)

      this.question = `Viens-tu à vélo ? <br>${tableau}<br>$\\ldots$ élèves ne sont pas venus à vélo.`
      if (this.interactif) {
        this.question = `Viens-tu à vélo ? <br>${tableau}<br>`
        this.optionsChampTexte = { texteApres: ' élèves ne sont pas venus à vélo.' }
      }

      this.correction = `Le nombre d'élèves qui ne sont pas venus à vélo est $${nonF} + ${nonG} = ${miseEnEvidence(texNombre(result, 0))}$.`
      this.canEnonce = `Viens-tu à vélo ? <br>${tableau}`
      this.canReponseACompleter = `$\\ldots$ élèves ne sont pas venus à vélo.`
    } else {
      const result = ouiF + ouiG
      this.reponse = texNombre(result, 0)

      this.question = `Viens-tu à vélo ? <br>${tableau}<br>$\\ldots$ élèves sont venus à vélo.`
      if (this.interactif) {
        this.question = `Viens-tu à vélo ? <br>${tableau}<br>`
        this.optionsChampTexte = { texteApres: ' élèves sont venus à vélo.' }
      }

      this.correction = `Le nombre d'élèves qui sont venus à vélo est $${ouiF} + ${ouiG} = ${miseEnEvidence(texNombre(result, 0))}$.`
      this.canEnonce = `Viens-tu à vélo ? <br>${tableau}`
      this.canReponseACompleter = `$\\ldots$ élèves sont venus à vélo.`
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(25, 45, 15, 70, 1) : this.enonce()
  }
}
