import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '10/08/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = 'd232e'

export const refs = {
  'fr-fr': ['1A-C03-3', '2A-N3-3'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Appliquer la propriété des puissances de puissances'

// @Author Stéphane Guyon
export default class Auto1AC3c extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.versionQcmDisponible = true
    this.versionQcm = false
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut reconnaître une puissance de puissance.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Repérer la base (le nombre élevé à une puissance), l'exposant à l'intérieur des parenthèses et l'exposant placé à l'extérieur.</li>
    <li>Se demander ce que signifie répéter plusieurs fois la même puissance.</li>
    <li>Utiliser la propriété des puissances de puissances.</li>
  </ul>
`
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true
    this.formatInteractif = this.versionQcm ? 'mathlive' : 'fillInTheBlank'

    const k = this.quotaRandint('k', 2, 3)
    const a = this.quotaRandint('a', 2, 4)

    this.correction = `On applique la propriété des puissances de puissances d'un réel.<br>
    Soit $n\\in \\mathbb{N}$, et $p \\in \\mathbb{N}$, on a : 
     $\\left(a^{n}\\right)^{p}=a^{np}$<br>
    $\\begin{aligned}\\left(${a}^{n}\\right)^{${k}}&=${a}^{${k}n}\\\\
    &=\\left(${a}^{${k}}\\right)^{n}\\\\
    &=${miseEnEvidence(`${a ** k}^{n}`)}
    \\end{aligned}$`

    if (this.versionQcm) {
      this.consigne = ''
      this.question = `Soit $n$ un entier${a === 3 && k === 2 ? ' non nul' : ''}. <br>À quelle expression est égale $\\left(${a}^n\\right)^{${k}}$ ?`
      this.reponse = `$${a ** k}^{n}$`
      this.distracteurs = [
        `$${a}^{n^{${k}}}$`,
        `$${a}^{${k}+n}$`,
        `$${a * k}^{n}$`,
        'Aucune de ces propositions',
      ]
    } else {
      this.consigne = "Soit $n$ un entier. Compléter l'égalité."
      this.question = `\\left(${a}^n\\right)^{${k}}=%{champ1}^{n}`
      this.reponse = { champ1: { value: String(a ** k) } }
    }
  }
}
