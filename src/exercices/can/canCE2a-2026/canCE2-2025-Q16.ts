import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { PieceBuilder } from '../../../lib/2d/pieces'
import { choice } from '../../../lib/outils/arrayOutils'
import { texPrix } from '../../../lib/outils/texNombre'
import { mathalea2d } from '../../../modules/mathalea2d'
import type { NestedObjetMathalea2dArray } from '../../../types/2d'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Compter avec des pièces de monnaie'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = '1474f'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Jean-Claude Lhote

*/
export default class Can2026CE2Q16 extends ExerciceCan {
  enonce(pieces: number[], somme: number) {
    const objets: NestedObjetMathalea2dArray = []

    this.question = `Tu dois $${texPrix(somme)}$€ à ton frère.<br>Entoure ce que tu lui donnes.`
    for (let i = 0; i < pieces.length; i++) {
      const piece = new PieceBuilder(pieces[i]).make(i * 1.2, 0)
      objets.push(piece)
    }

    const figure = mathalea2d(
      Object.assign({ pixelsParCm: 30, scale: 0.7 }, fixeBordures(objets)),
      objets,
    )
    this.canReponseACompleter = figure
    this.canEnonce = this.question
    this.question = this.question + figure
    this.reponse = String(somme)
    this.correction = ``
  }

  nouvelleVersion() {
    const pieces =
      this.canOfficielle || this.sup
        ? [2, 2, 0.5, 0.5, 0.5]
        : [2, 2, 1, 0.5, 0.5]
    this.formatInteractif = 'MetaInteractif2d'
    this.canOfficielle || this.sup
      ? this.enonce(pieces, 3)
      : this.enonce(pieces, choice([2.5, 3, 3.5, 4, 5]))
  }
}
