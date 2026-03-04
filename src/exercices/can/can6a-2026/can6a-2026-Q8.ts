import { droiteGraduee } from '../../../lib/2d/DroiteGraduee'
import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Déterminer l\'abscisse d\'un point sur une droite graduée'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'nuwgb'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20266Q8 extends ExerciceCan {
enonce(pas?: number, position?: number, label1?: number, label2?: number) {
    if (pas == null || position == null || label1 == null || label2 == null) {
      pas = choice([10, 20, 30, 40])
      label1 = 2
      label2 = 5
      position = randint(3, 8, [label1, label2])
    }
    const valeur = position * pas
    const nbGrad = Math.max(position + 2, label2 + 2)

    const drGrad = droiteGraduee({
      axeEpaisseur: context.isHtml ? 1.5 : 1.5,
      Unite: 1,
      Min: 0,
      Max: nbGrad,
      thickSec: false,
      thickSecDist: 1,
      labelsPrincipaux: false,
      
      labelListe: [[0, '0'], [label1, texNombre(label1 * pas, 0)], [label2, texNombre(label2 * pas, 0)]],
      pointListe: [[position, 'A']],
    })

    const objets = [drGrad]

    const graphique = mathalea2d(
      Object.assign({ pixelsParCm: 25,scale: 0.6 }, fixeBordures(objets)),
      objets,
    )

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.reponse = texNombre(valeur, 0)
    this.question = 'Quel nombre est repéré par le point $A$ ?<br>'
    this.question += graphique
    this.canEnonce = 'Quel nombre est repéré par le point $A$ ?<br>' + graphique
    this.canReponseACompleter = ''
    this.correction = `Les graduations vont de $${texNombre(pas, 0)}$ en $${texNombre(pas, 0)}$, ainsi le point $A$ repère le nombre $${miseEnEvidence(texNombre(valeur, 0))}$.`
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(20, 6, 2, 5) : this.enonce()
  }
}
