import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import {
  ecritureAlgebrique,
  reduireAxPlusB,
} from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import FractionEtendue from '../../../modules/FractionEtendue'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Résoudre une équation en logarithme népérien.'
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '21/02/2025'

export const uuid = '305fd'
export const refs = {
  'fr-fr': ['canTSpeAN14'],
  'fr-ch': ['2mLogExp-4'],
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
    this.formatChampTexte = KeyboardType.clavierFonctionsTerminales
    // this.formatChampTexte = KeyboardType.clavierEnsemble
  }

  nouvelleVersion() {
    const a = randint(-8, 8, 0)
    const b = randint(-8, 8, 0)
    const k = randint(0, 1) // membre de droite de l'égalité ln(ax+b)= k
    let ln = '1' // valeur de ln si k=0
    if (k === 1) {
      ln = '\\mathrm{e}'
    } // valeur de ln si k=1
    const f = new FractionEtendue(-b, a) // racine de ax + b pour déterminer le Df de l'expression
    const racine = f.texFractionSimplifiee // racine de ax + b

    this.question = 'Résoudre sur $D=$ '
    if (a > 0) this.question += `$~]${racine}~;~+\\infty~[~,~$`
    else this.question += `$~]-\\infty~;~${racine}~[~,~$`
    this.question += `l'équation : $\\ln(${reduireAxPlusB(a, b)})=${k}$.`
    this.correction = `On vérifie avant de commencer que l'expression $${reduireAxPlusB(a, b)}$ est bien strictement positive sur $D$.<br> `
    this.correction += `$\\ln(${reduireAxPlusB(a, b)})$ existe donc pour tout $x$ appartenant à $D$.<br> `
    this.correction += `Soit $x\\in D$. <br>On résout :<br>$ \\begin{aligned} \\phantom{\\iff}&\\ln(${reduireAxPlusB(a, b)})=${k}\\quad \\quad(1)\\\\ \\iff&\\ln(${reduireAxPlusB(a, b)})=\\ln ${ln}  \\end{aligned}$`
    this.correction +=
      '<br>On sait que pour tout $a$ et $b$ appartenant à $\\R_+^*,  ~~a=b \\iff \\ln (a) = \\ln (b)$.<br> '
    this.correction += `$\\begin{aligned} (1)\\iff&${reduireAxPlusB(a, b)}=${ln}\\end{aligned}$`
    if (k === 0) {
      const sol = new FractionEtendue(1 - b, a)
      const solution = sol.texFractionSimplifiee
      this.correction += `<br> $\\begin{aligned}\\phantom{(1)}\\iff& x=\\dfrac{${texNombre(1 - b)}}{${a}} \\\\ \\phantom{(1)}\\iff& x=${solution}  \\end{aligned}$`
      this.correction += `<br> On vérifie que $${solution}\\in D$. <br>   La solution de l'équation $\\ln(${reduireAxPlusB(a, b)})=1$ est donc  $S=\\left\\{${miseEnEvidence(solution)}\\right\\}$.`
      this.reponse = solution
    } else {
      this.correction += ` <br>$\\begin{aligned}\\phantom{(1)}\\iff& x=\\dfrac{\\mathrm{e} ${ecritureAlgebrique(-b)}}{${a}}   \\end{aligned}$`
      this.correction += `<br> On vérifie que $\\dfrac{\\mathrm{e} ${ecritureAlgebrique(-b)}}{${a}} \\in D$. <br>   La solution de l'équation $\\ln(${reduireAxPlusB(a, b)})=1$ est donc  $S=\\left\\{${miseEnEvidence(`\\dfrac{\\mathrm{e} ${ecritureAlgebrique(-b)}}{${a}}`)} \\right\\}$.`
      this.reponse = `\\dfrac{e${ecritureAlgebrique(-b)}}{${a}}`
    }
    this.optionsChampTexte = { texteAvant: '<br>$S=~\\{$', texteApres: '$\\}$' }
  }
}
