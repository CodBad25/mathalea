import Decimal from 'decimal.js'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { pgcd } from '../../lib/outils/primalite'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '02/09/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '4a623'

export const refs = {
  'fr-fr': ['1A-C04-2', '2A-N4-2'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Calculer une somme de fractions décimales'

/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC4a extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.spacingCorr = 1
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
    this.versionQcmDisponible = true
    this.versionQcm = false
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut convertir une somme de fractions décimales.<br>
    On peut, au choix, convertir en écriture décimale ou en fraction décimale, puis effectuer la somme.<br>
    On peut aussi procéder par élimination pour les propositions clairement fausses.
  </p>
  `
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    const denominateurs = [10, 100, 1000, 10000]
    const num = randint(1, 9)
    const d1 = choice(denominateurs)
    let d2 = choice(denominateurs)
    while (d2 === d1) {
      d2 = choice(denominateurs)
    }
    const somme = new Decimal(num).div(d1).plus(new Decimal(num).div(d2))

    // Fraction décimale égale à la somme, puis simplifiée
    const denominateurCommun = Math.max(d1, d2)
    const numerateurFraction =
      num * (denominateurCommun / d1) + num * (denominateurCommun / d2)
    const pgcdFraction = pgcd(numerateurFraction, denominateurCommun)
    const numSimple = numerateurFraction / pgcdFraction
    const denSimple = denominateurCommun / pgcdFraction

    const debut = `A&=\\dfrac{${num}}{${texNombre(d1)}}+\\dfrac{${num}}{${texNombre(d2)}}\\\\
       &=${texNombre(num / d1, 4)}+${texNombre(num / d2, 4)}\\\\`
    const enonce = `$A=\\dfrac{${num}}{${texNombre(d1)}}+\\dfrac{${num}}{${texNombre(d2)}}$`
    // La bonne réponse du QCM est tantôt un nombre décimal, tantôt une fraction
    const formatFraction = this.versionQcm && choice([true, false, false])

    if (formatFraction) {
      this.correction = ` On a  : <br>
       $\\begin{aligned}
       ${debut}
       &=${texNombre(somme, 4)}\\\\
       &=\\dfrac{${numerateurFraction}}{${texNombre(denominateurCommun)}}${
         pgcdFraction > 1
           ? `\\\\
       &=${miseEnEvidence(`\\dfrac{${numSimple}}{${texNombre(denSimple)}}`)}`
           : ''
       }
       \\end{aligned}$ `
    } else {
      this.correction = ` On a  : <br>
     $\\begin{aligned}
     ${debut}
     &=${miseEnEvidence(texNombre(somme, 4))}
     \\end{aligned}$ `
    }

    if (this.versionQcm) {
      this.question = `On considère ${enonce}. On a : `
      if (formatFraction) {
        this.reponse = `$A=\\dfrac{${numSimple}}{${texNombre(denSimple)}}$`
        this.distracteurs = [
          `$A=${texNombre(somme.div(10), 4)}$`,
          `$A=${texNombre(somme.mul(10), 4)}$`,
          `$A=\\dfrac{${2 * num}}{${texNombre(d1 * d2)}}$`,
        ]
      } else {
        this.reponse = `$A=${texNombre(somme, 4)}$`
        this.distracteurs = [
          `$A=\\dfrac{${2 * num}}{${texNombre(d1 * d2)}}$`,
          `$A=${texNombre(somme.mul(10), 4)}$`,
          `$A=\\dfrac{${numSimple + 1}}{${texNombre(denSimple)}}$`,
        ]
      }
    } else {
      this.question = `Calculer ${enonce} et donner le résultat sous forme décimale.`
      this.reponse = somme
    }
  }
}
