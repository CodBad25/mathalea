import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '10/08/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '8d704'

export const refs = {
  'fr-fr': ['1A-C03-9'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Calculer l’inverse d’une puissance de $-1$'

// @Author Stéphane Guyon
export default class Auto1AC3i extends ExerciceSimple {
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
    Il faut utiliser le comportement des puissances de $-1$ et de leur inverse.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Tester le résultat de $(-1)^n$ pour différentes valeurs de $n$.</li>
    <li>En déduire une propriété liée à la parité de l'exposant.</li>
    <li>Se demander quel est l'inverse de $1$ et quel est l'inverse de $-1$.</li>
    <li>Tester les propositions une par une en cas d'hésitation.</li>
  </ul>`
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true
    this.formatInteractif = this.versionQcm ? 'mathlive' : 'fillInTheBlank'

    const k = this.quotaRandint('k', 3, 6)
    const pair = k % 2 === 0

    if (pair) {
      this.correction = `Soit $n\\in \\mathbb{N}.$<br> $\\begin{aligned}\\left(-1\\right)^{n+${k}}&=\\left(-1\\right)^{n}\\times \\left(-1\\right)^${k}\\\\
      &=\\left(-1\\right)^{n}
    \\end{aligned}$<br>
   $\\begin{aligned}\\text{or, }\\dfrac{1}{\\left(-1\\right)^{n}}&=\\dfrac{1^n}{\\left(-1\\right)^{n}}\\\\
      &=\\left(\\dfrac{1}{-1}\\right)^{n}\\\\
      &=\\left(-1\\right)^{n}.\\\\
    \\end{aligned}$<br>
    En conséquence, pour tout entier $n$, on a $\\dfrac{1}{\\left(-1\\right)^{n+${k}}}=${miseEnEvidence('\\left(-1\\right)^{n}')}$.`
    } else {
      this.correction = `Soit $n\\in \\mathbb{N}.$<br>$\\begin{aligned}\\left(-1\\right)^{n+${k}}&=\\left(-1\\right)^${k}\\times \\left(-1\\right)^{n} \\\\
      &=-\\left(-1\\right)^{n}
    \\end{aligned}$<br>
   $\\begin{aligned}\\text{or, }\\dfrac{1}{\\left(-1\\right)^{n}}&=\\dfrac{1^n}{\\left(-1\\right)^{n}}\\\\
      &=\\left(\\dfrac{1}{-1}\\right)^{n}\\\\
      &=\\left(-1\\right)^{n}.\\\\
    \\end{aligned}$<br>
     En conséquence, pour tout entier $n$, on a $\\dfrac{1}{\\left(-1\\right)^{n+${k}}}=${miseEnEvidence('-\\left(-1\\right)^{n}')}.$`
    }

    if (this.versionQcm) {
      this.consigne = ''
      this.question = `Soit $n$ un entier.<br> À quelle expression est égale $\\dfrac{1}{\\left(-1\\right)^{n+${k}}}$ ?`
      if (pair) {
        this.reponse = '$\\left(-1\\right)^{n}$'
        this.distracteurs = [
          '$\\left(-1\\right)^{n+1}$',
          '$-\\left(-1\\right)^{n}$',
          '$\\left(-1\\right)^{n-1}$',
        ]
      } else {
        this.reponse = '$-\\left(-1\\right)^{n}$'
        this.distracteurs = [
          '$\\left(-1\\right)^{n}$',
          '$\\left(-1\\right)^{n+2}$',
          '$-\\left(-1\\right)^{n+1}$',
        ]
      }
    } else {
      this.consigne = "Soit $n$ un entier. Compléter l'égalité."
      this.question = `\\dfrac{1}{\\left(-1\\right)^{n+${k}}}=%{champ1}\\times\\left(-1\\right)^{n}`
      this.reponse = { champ1: { value: pair ? '1' : '-1' } }
    }
  }
}
