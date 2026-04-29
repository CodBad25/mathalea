import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre =
  'Déterminer le coefficient de colinéarité entre deux vecteurs'
export const interactifReady = true
export const interactifType = 'mathLive'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '30/10/2021' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export const uuid = 'ee579'

export const refs = {
  'fr-fr': ['can2G09'],
  'fr-ch': ['3G93-2'],
}
export default class VecteursColineaires extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const p = choice([-2, 2, 3, 4, -4, -3])
    const ux = randint(1, 5)
    const uy = randint(1, 5)
    const vx = p * ux
    const vy = p * uy
    this.question = `Dans un repère orthonormé $\\big(O\\,;\\,\\vec \\imath,\\,\\vec \\jmath\\big)$, on a :<br>
       $\\vec{u}\\left(${ux}${sp(1)} ; ${sp(1)} ${uy}\\right)$ et $\\vec{v}\\left(${vx}${sp(1)} ; ${sp(1)} a\\right)$<br>
      Pour quelle valeur de $a$, les vecteurs $\\vec{u}$ et $\\vec{v}$ sont-ils colinéaires ?`
    this.correction = `Les deux vecteurs sont colinéaires, donc il existe un réel $k$ tel que $\\vec{v}=k\\times \\vec{u}$.<br>
       Comme $${vx}=${p}\\times ${ux}$, alors $y_{\\vec{v}}=${p}\\times${uy}=${p * uy}$, donc $a=${miseEnEvidence(`${p * uy}`)}$.`
    this.reponse = vy

    this.canReponseACompleter = '$a=\\ldots$'
  }
}
