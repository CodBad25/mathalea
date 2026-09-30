import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '23/07/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '35b05'

export const refs = {
  'fr-fr': ['1A-C03-12', '2A-N3-7'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = "Trouver  l'égalité correcte (puissances)"

/**
 *
 * @author Gilles Mora
 *
 */
export default class TrouverEgalite extends ExerciceSimple {
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
    Il faut vérifier plusieurs égalités avec des puissances.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Traiter les propositions une par une.</li>
    <li>Identifier la propriété utilisée dans chaque proposition.</li>
    <li>Vérifier si cette propriété est appliquée correctement.</li>
    <li>Procéder par élimination : une seule égalité est vraie dans ce QCM.</li>
  </ul>`
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true
    this.formatInteractif = this.versionQcm ? 'mathlive' : 'fillInTheBlank'

    const a = randint(3, 15)
    const n = randint(-10, -3)
    const p = -n + randint(4, 8)
    const a1 = randint(2, 6) * 10
    const n1 = randint(3, 6)
    const a2 = randint(2, 6) * 10
    const n2 = randint(-8, -3)
    const p2 = randint(3, 6)
    const a3 = randint(3, 7)
    const b3 = randint(3, 7, a3)
    const n3 = randint(-6, -2)
    const cas = this.quotaChoice('cas', [1, 2, 3, 4])

    // Chaque cas : le membre de gauche, l'exposant (ou la base) à trouver, des étapes de calcul
    // et une égalité fausse proche de l'égalité vraie (pour le QCM).
    const cases = [
      {
        // a^n/a^p=a^(n-p)
        gauche: `\\dfrac{${a}^{${n}}}{${a}^{${p}}}`,
        droite: (x: string) => `${a}^{${x}}`,
        reponse: String(n - p),
        fausse: `${a}^{${n + p}}`,
        etapes: `\\dfrac{${a}^{${n}}}{${a}^{${p}}}&=${a}^{${n}-${p}}\\\\
      &=${a}^{${n - p}}`,
      },
      {
        // a*1/a^n=a^(1-n)
        gauche: `${a1}\\times \\dfrac{1}{${a1}^{${n1}}}`,
        droite: (x: string) => `${a1}^{${x}}`,
        reponse: String(1 - n1),
        fausse: `${a1}^{${n1 - 1}}`,
        etapes: `${a1}\\times \\dfrac{1}{${a1}^{${n1}}}&=\\dfrac{${a1}^1}{${a1}^{${n1}}}\\\\
    &=${a1}^{1-${n1}}\\\\
      &=${a1}^{${1 - n1}}`,
      },
      {
        // (a^n)^p=a^(n*p)
        gauche: `\\left(${a2}^{${n2}}\\right)^${p2}`,
        droite: (x: string) => `${a2}^{${x}}`,
        reponse: String(n2 * p2),
        fausse: `${a2}^{${n2 + p2}}`,
        etapes: `\\left(${a2}^{${n2}}\\right)^${p2}&=${a2}^{${n2} \\times ${p2}}\\\\
    &=${a2}^{${n2 * p2}}`,
      },
      {
        // a^n*b^n=(a*b)^n
        gauche: `${a3}^{${n3}}\\times ${b3}^{${n3}}`,
        droite: (x: string) => `${x}^{${n3}}`,
        reponse: String(a3 * b3),
        fausse: `${a3 * b3}^{${2 * n3}}`,
        etapes: `${a3}^{${n3}}\\times ${b3}^{${n3}}&=(${a3}\\times  ${b3})^{${n3}}\\\\
    &=${a3 * b3}^{${n3}}`,
      },
    ]
    const courant = cases[cas - 1]
    const vraie = `${courant.gauche}=${courant.droite(courant.reponse)}`
    const fausses = cases
      .filter((c) => c !== courant)
      .map((c) => `${c.gauche}=${c.fausse}`)

    if (this.versionQcm) {
      this.consigne = ''
      this.question = 'Parmi ces égalités, la seule égalité vraie est :'
      this.correction = `La seule égalité vraie est  : $${miseEnEvidence(vraie)}$.<br>
    En effet, <br>  
      $\\begin{aligned}
    ${courant.etapes}
      \\end{aligned}$<br>
    Concernant les autres propositions  :  <br>
    ${cases
      .filter((c) => c !== courant)
      .map((c) => `$${c.gauche}\\neq ${c.fausse}$`)
      .join('<br>')}`
      this.reponse = `$${vraie}$`
      this.distracteurs = fausses.map((f) => `$${f}$`)
    } else {
      this.consigne = "Compléter l'égalité."
      this.question = `${courant.gauche}=${courant.droite('%{champ1}')}`
      this.correction = `$\\begin{aligned}
    ${courant.etapes.replace(/&=[^&]*$/, `&=${miseEnEvidence(courant.droite(courant.reponse))}`)}
      \\end{aligned}$`
      this.reponse = { champ1: { value: courant.reponse } }
    }
  }
}
