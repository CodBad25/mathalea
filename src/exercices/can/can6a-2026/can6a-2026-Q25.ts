import { propositionsQcm } from '../../../lib/interactif/qcm'
import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Q25'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'js3qp'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Jean-Claude Lhote

*/
export default class Can20266Q25 extends ExerciceCan {
  constructor() {
    super()
    this.formatInteractif = 'qcm'
  }

  enonce(a?: string, b?: string, vf?: boolean) {
    if (a == null || b == null || vf == null) {
      ;[a, b] = choice([
        ['triangles équilatéraux', 'des triangles isocèles'],
        ['carrés', 'des rectangles'],
        ['losanges', 'des parallélogrammes'],
        ['rectangles', 'des parallélogrammes'],
        ['carrés', 'des losanges'],
        ['carrés', 'des parallélogrammes'],
      ])
      vf = choice([true, false])
    }

    this.question = vf
      ? `${context.isHtml ? '<u>Vrai ou Faux</u><br>' : '\\underline{Vrai ou Faux}<br>'}
     Tous les ${a} sont ${b}.`
      : `${context.isHtml ? '<u>Vrai ou Faux</u><br>' : '\\underline{Vrai ou Faux}<br>'}
     Tous les ${b.replace('des ', '')} sont des ${a}.`
    this.autoCorrection[0] = {
      enonce: this.question,
      options: { vertical: false },
      propositions: [
        {
          texte: `Vrai`,
          statut: vf,
        },
        {
          texte: `Faux`,
          statut: !vf,
        },
      ],
    }
    const monQcm = propositionsQcm(this, 0)
    this.question += monQcm.texte

    this.correction = vf
      ? `Oui, tous les ${a} sont ${b}.`
      : `Non, ce n'est pas vrai.`

    this.canEnonce = vf
      ? `\\underline{Vrai ou Faux}<br>
    Tous les ${a} sont ${b}.<br>
    ${texteEnCouleurEtGras('Entoure la bonne réponse', 'black')}`
      : `\\underline{Vrai ou Faux}<br>
    Tous les ${b.replace('des ', '')} sont des ${a}.<br>
    ${texteEnCouleurEtGras('Entoure la bonne réponse', 'black')}`
    this.canReponseACompleter = `Vrai \\quad Faux`
  }

  nouvelleVersion() {
    this.canOfficielle || this.sup
      ? this.enonce('triangles équilatéraux', 'isocèles', true)
      : this.enonce()
  }
}
