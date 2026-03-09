import {
  ecritureAlgebrique,
  reduirePolynomeDegre3,
  rienSi1,
} from '../../../lib/outils/ecritures'
import ExerciceSimple from '../../ExerciceSimple'
import { randint } from '../../../modules/outils'
import FractionEtendue from '../../../modules/FractionEtendue'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
export const titre = 'Résoudre une équation $ax^2+bx+c=c$ '
export const interactifReady = true
export const interactifType = 'mathLive'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '19/06/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 *
 * @author Gilles Mora

 */
export const uuid = '6adb0'

export const refs = {
  'fr-fr': ['can1SD17'],
  'fr-ch': [],
}
export default class EquationSecondDegreParticuliere extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierEnsemble
    this.versionQcmDisponible = true
    this.optionsDeComparaison = { ensembleDeNombres: true }
  }

  nouvelleVersion() {
    const a = randint(-10, 10, 0)
    const b = randint(-10, 10, [0, a, -a])
    const c = randint(-10, 10, 0)
    const f = new FractionEtendue(-b, a)
    if (this.versionQcm) {
      this.question = `L'ensemble des solutions $\\mathscr{S}$ de l'équation  $${reduirePolynomeDegre3(0, a, b, c)}=${c}$ est :`
    } else {
      this.question = `Donner l'ensemble des solutions $\\mathscr{S}$ de l'équation :<br> $${reduirePolynomeDegre3(0, a, b, c)}=${c}$.`
    }
    if (-b * a < 0) {
      this.reponse = this.versionQcm
        ? `$\\mathscr{S}=\\left\\{${f.texFractionSimplifiee}\\,;\\,0\\right\\}$`
        : `\\{0;${f.texFSD}\\}`
      this.distracteurs = [
        `$\\mathscr{S}=\\left\\{${f.texFractionSimplifiee}\\right\\}$`,
        `$\\mathscr{S}=\\left\\{0\\,;\\,${f.oppose().texFractionSimplifiee}\\right\\}$`,
        `$\\mathscr{S}=\\left\\{${f.inverse().texFractionSimplifiee}\\,;\\,0\\right\\}$`,
      ]
    } else {
      this.reponse = this.versionQcm
        ? `$\\mathscr{S}=\\left\\{0\\,;\\,${f.texFractionSimplifiee}\\right\\}$`
        : `\\{0;${f.texFSD}\\}`
      this.distracteurs = [
        `$\\mathscr{S}=\\left\\{${f.texFractionSimplifiee}\\right\\}$`,
        `$\\mathscr{S}=\\left\\{${f.oppose().texFractionSimplifiee}\\,;\\,0\\right\\}$`,
        `$\\mathscr{S}=\\left\\{0\\,;\\,${f.inverse().texFractionSimplifiee}\\right\\}$`,
      ]
    }

    if (this.interactif && !this.versionQcm) {
      this.question += '<br>$\\mathscr{S}=$'
    }

    this.correction = `L'équation $${reduirePolynomeDegre3(0, a, b, c)}=${c}$ s'écrit $${reduirePolynomeDegre3(0, a, b, 0)}=0$.<br>
          En factorisant le premier membre (facteur commun $x$), on obtient $x(${rienSi1(a)}x${ecritureAlgebrique(b)})=0$.<br>
          On reconnaît une équation produit nul dont les solutions sont : $0$ et $\\dfrac{${-b}}{${a}}${f.texSimplificationAvecEtapes()}$.<br>
          $\\mathscr{S}=${miseEnEvidence(`\\{0;${new FractionEtendue(-b, a).texFractionSimplifiee}\\}`)}$`

    this.canEnonce = this.question
    this.canReponseACompleter = ''
  }
}
