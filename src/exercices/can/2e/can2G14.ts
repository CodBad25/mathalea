import { ecritureParentheseSiNegatif } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

export const titre =
  "Déterminer les coordonnées d'un point avec une translation"
export const interactifReady = true
export const interactifType = 'mathLive'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '04/03:2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Stéphane Guyon

 */
export const uuid = '0dfad'

export const refs = {
  'fr-fr': ['can2G14'],
  'fr-ch': ['3G91-9'],
}
export default class TranslationVecteur extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.listeAvecNumerotation = false
  }

  nouvelleVersion() {
    const xA = randint(-5, 5)
    const yA = randint(-5, 5)
    const ux = randint(-5, 5, 0)
    const uy = randint(-5, 5)

    this.question = `Dans un repère orthonormé, on donne un point $A$ de coordonnées $A\\left(${xA}${sp(1)} ; ${sp(1)}${yA}\\right)$ et un vecteur $\\vec{u}$ de coordonnées $\\vec{u}\\begin{pmatrix}${ux} \\\\ ${uy}\\end{pmatrix}$.<br>
    Donner les coordonnées du point $B$ image du point $A$ par la translation de vecteur $\\vec{u}$.<br><br>`
    this.optionsChampTexte = { texteAvant: '$B$ a pour coordonnées :' }
    this.correction = `On sait d'après le cours, que si le point $B$ est l'image du point $A$ par la translation de vecteur $\\vec{u}$, alors $\\overrightarrow{AB}=\\vec{u}$.<br>
    En appliquant  aux données de l'énoncé, on obtient  : $\\overrightarrow{AB}\\begin{pmatrix}x_B-${ecritureParentheseSiNegatif(xA)} \\\\ y_B-${ecritureParentheseSiNegatif(yA)}\\end{pmatrix}$.<br>
    $\\overrightarrow{AB}=\\vec{u}\\iff \\begin{cases}x_B-${ecritureParentheseSiNegatif(xA)}${sp(1)} =${ux}\\\\  ${sp(1)} y_B-${ecritureParentheseSiNegatif(yA)} ${sp(1)}=${uy}\\end{cases}$<br><br>
    D'où : $\\begin{cases}x_B=${xA + ux}${sp(1)} \\\\  ${sp(1)} y_B=${sp(1)}${yA + uy}\\end{cases}$<br><br>
    Les coordonnées du point $B$ sont donc $${miseEnEvidence('(')} ${miseEnEvidence(`${xA + ux}`)}\\,${miseEnEvidence(';')}\\,${miseEnEvidence(`${yA + uy}`)} ${miseEnEvidence(')')}$.`
    this.reponse = `(${xA + ux};${yA + uy})`

    this.canEnonce = this.question // 'Compléter'
    this.canReponseACompleter = ''
  }
}
