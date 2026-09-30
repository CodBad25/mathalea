import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '10/08/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = 'facdf'

export const refs = {
  'fr-fr': ['1A-C03-5'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Appliquer la propriété des quotients avec des puissances'

// @Author Stéphane Guyon
export default class Auto1AC3e extends ExerciceSimple {
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
    Il faut simplifier un quotient de puissances ayant la même base.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Identifier l'exposant du numérateur et celui du dénominateur.</li>
    <li>Se rappeler la règle pour diviser deux puissances de même base (le nombre élevé à une puissance).</li>
    <li>Respecter l'ordre de la soustraction des exposants.</li>
    <li>Faire le même calcul avec des nombres à la place de $n$ si la variable gêne.</li>
  </ul>
`
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true
    this.formatInteractif = this.versionQcm ? 'mathlive' : 'fillInTheBlank'

    const inverse = this.quotaChoice('cas', [false, true])
    const k = this.quotaRandint('k', 2, 5)
    const exposant = `n(n${k > 2 ? `^{${k - 1}}` : ''}-1)`
    const fraction = inverse
      ? `\\dfrac{a^{n}}{a^{n^{${k}}}}`
      : `\\dfrac{a^{n^{${k}}}}{a^{n}}`

    if (inverse) {
      // Cas inversé : a^n / a^(n^k)
      this.correction = `On applique la propriété du quotient des puissances d'un réel.<br>
      Soit $n$ et $p$ deux entiers et $a$ un réel :  $\\dfrac{a^n}{a^p}=a^{n-p}$<br>
      $\\begin{aligned} \\dfrac{a^{n}}{a^{n^{${k}}}}&=a^{n-n^{${k}}}\\\\
      &=a^{-n(-1+n^{${rienSi1(k - 1)}})}\\\\
      &=${miseEnEvidence(`a^{-${exposant}}`)}
      \\end{aligned}$<br>`
    } else {
      // Cas normal : a^(n^k) / a^n
      this.correction = `On applique la propriété du quotient des puissances d'un réel.<br>
      Soit $n$ et $p$ deux entiers et $a$ un réel :  $\\dfrac{a^n}{a^p}=a^{n-p}$<br>
      $\\begin{aligned} \\dfrac{a^{n^{${k}}}}{a^{n}}&=a^{n^{${k}}-n}\\\\
      &=${miseEnEvidence(`a^{${exposant}}`)}
      \\end{aligned}$<br>`
    }

    if (this.versionQcm) {
      this.consigne = ''
      this.question = `Soit $a$ un nombre réel non nul et $n$ un entier non nul.<br> À quelle expression est égale $${fraction}$ ?`
      if (inverse) {
        this.reponse = `$a^{-${exposant}}$`
        this.distracteurs = [
          `$a^{-${rienSi1(k - 1)}n}$`,
          k === 2 ? '$a^{1-n}$' : `$a^{-n^${k - 1}}$`,
          `$a^{${exposant}}$`,
        ]
      } else {
        this.reponse = `$a^{${exposant}}$`
        this.distracteurs = [
          `$a^{${rienSi1(k - 1)}n}$`,
          k === 2 ? '$a^{n-1}$' : `$a^{n^${k - 1}}$`,
          `$a^{${k}}$`,
        ]
      }
    } else {
      this.consigne =
        "Soit $a$ un nombre réel non nul et $n$ un entier non nul. Compléter l'égalité."
      this.question = `${fraction}=a^{%{champ1}}`
      this.reponse = {
        champ1: { value: inverse ? `-${exposant}` : exposant },
      }
    }
  }
}
