import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '10/08/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = 'a3ec3'

export const refs = {
  'fr-fr': ['1A-C03-6'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Combiner produit et puissance de puissance'

// @Author Stéphane Guyon
export default class Auto1AC3f extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecVariable
    this.versionQcmDisponible = true
    this.versionQcm = false
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    L'expression mélange deux règles sur les puissances : le produit et la puissance de puissance. <br>
    Il est donc essentiel d'identifier les priorités opératoires.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Commencer par traiter la puissance placée entre parenthèses.</li>
    <li>Observer ensuite que les deux facteurs ont la même base (le nombre élevé à une puissance).</li>
    <li>Utiliser la propriété du produit de puissances de même base.</li>
    <li>Faire le même calcul avec des nombres à la place de $n$ si la variable gêne.</li>
  </ul>
`
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true
    this.formatInteractif = this.versionQcm ? 'mathlive' : 'fillInTheBlank'

    const k = this.quotaRandint('k', 2, 5)
    const p = randint(2, 5, k)

    this.correction = `On applique la propriété du produit des puissances d'un réel.<br>
   Soient $n$ et $p$ deux entiers et $a$ un réel :  $a^n\\times a^p=a^{n+p}$<br>
    et la propriété des puissances de puissances : <br>
     Pour tous entiers $n$ et $p$ et $a$ réel, on a :  $\\left(a^{n}\\right)^p=a^{np}$<br>
    $\\begin{aligned} a^{${k}n}(a^n)^${p}&=a^{${k}n}\\times a^{${p}n}\\\\
   &=${miseEnEvidence(`a^{${k + p}n}`)}
    \\end{aligned}$<br>`

    if (this.versionQcm) {
      this.consigne = ''
      this.question = `Soit $a$ un nombre réel non nul et $n$ un entier non nul. <br>À quelle expression est égale $a^{${k}n}(a^n)^${p}$ ?`
      this.reponse = `$a^{${k + p}n}$`
      this.distracteurs = [
        `$a^{${k * p}n}$`,
        `$a^{${k + p}n^2}$`,
        `$a^{${k * p}n^2}$`,
      ]
    } else {
      this.consigne =
        "Soit $a$ un nombre réel non nul et $n$ un entier non nul. Compléter l'égalité."
      this.question = `a^{${k}n}(a^n)^${p}=a^{%{champ1}}`
      this.reponse = { champ1: { value: `${k + p}n` } }
    }
  }
}
