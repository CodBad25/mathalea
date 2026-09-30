import Decimal from 'decimal.js'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '18/01/2026'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '4e582'

export const refs = {
  'fr-fr': ['1A-C04-5', '2A-N4-5'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Calculer une somme de nombres'

/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC4e extends ExerciceSimple {
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
    Il faut additionner un entier, un nombre décimal et une fraction décimale.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Identifier séparément la partie entière, la partie décimale et la fraction.</li>
    <li>Convertir la fraction décimale en écriture décimale ou vice-versa.</li>
    <li>Vérifier les propositions en repérant les erreurs classiques de virgule pour vous piéger.</li>
  </ul>`
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    // Configurations possibles : [partie entière, partie décimale, dénominateur]
    const configurations = [
      [10, 0.1, 1000],
      [100, 0.01, 100],
      [1000, 0.1, 10],
      [10, 0.01, 100],
      [100, 0.1, 1000],
      [10, 0.1, 10],
      [10, 0.001, 1000],
      [100, 0.001, 1000],
      [1000, 0.001, 1000],
    ]
    const config = this.quotaChoice('config', configurations)
    const partieEntiere = new Decimal(config[0])
    const partieDecimale = new Decimal(config[1])
    const denominateur = config[2]
    const unSurDen = new Decimal(1).div(denominateur)
    const typeBonneReponse = this.quotaChoice('type', [
      'decimal',
      'fraction',
    ] as const)

    const resultatDecimal = partieEntiere.plus(partieDecimale).plus(unSurDen)
    const numerateurEntier = partieEntiere.mul(denominateur)
    const numerateurDecimal = partieDecimale.mul(denominateur)
    const numerateurFraction = numerateurEntier.plus(numerateurDecimal).plus(1)
    const fraction = (numerateur: Decimal | number) =>
      `\\dfrac{${texNombre(numerateur)}}{${texNombre(denominateur)}}`
    const somme = `${texNombre(partieEntiere)} + ${texNombre(partieDecimale)} + \\dfrac{1}{${texNombre(denominateur)}}`

    if (typeBonneReponse === 'decimal') {
      this.correction = `On a : <br>$\\begin{aligned}
      A &= ${somme}\\\\
      & = ${texNombre(partieEntiere.plus(partieDecimale))} + ${texNombre(unSurDen)}\\\\
      & = ${miseEnEvidence(texNombre(resultatDecimal))}
      \\end{aligned}$.`
    } else {
      this.correction = `On a : <br>
      $\\begin{aligned}
      A &= ${somme}\\\\
      & = ${fraction(numerateurEntier)} + ${fraction(numerateurDecimal)} + ${fraction(1)}\\\\
      & = ${miseEnEvidence(fraction(numerateurFraction))}
      \\end{aligned}$.<br>`
    }

    if (this.versionQcm) {
      const bonneReponse = `$A = ${typeBonneReponse === 'decimal' ? texNombre(resultatDecimal) : fraction(numerateurFraction)}$`
      const decimaux = [
        partieEntiere.plus(partieDecimale).plus(0.1),
        partieEntiere.plus(unSurDen),
        partieEntiere.plus(partieDecimale),
        partieEntiere.plus(partieDecimale).plus(0.01),
        partieEntiere.plus(partieDecimale).plus(0.11),
        partieEntiere.plus(0.01).plus(unSurDen),
        partieEntiere.plus(0.1),
        partieEntiere.plus(1),
        partieEntiere.plus(partieDecimale).plus(1),
        partieEntiere.plus(partieDecimale).plus(0.001),
        partieEntiere.plus(0.001),
      ].map((d) => `$A = ${texNombre(d)}$`)
      const fractions = [
        partieEntiere.plus(denominateur),
        partieEntiere.mul(denominateur).plus(1),
        partieEntiere
          .mul(denominateur)
          .plus(partieDecimale.mul(10 * denominateur)),
        partieEntiere.mul(denominateur),
        partieEntiere.plus(partieDecimale).mul(denominateur).round(),
        partieEntiere.mul(denominateur).plus(10),
      ].map((n) => `$A = ${fraction(n)}$`)
      const autres = (liste: string[]) =>
        shuffle([...new Set(liste)].filter((d) => d !== bonneReponse))
      this.question = `On considère $A = ${somme}$. <br>On a :`
      this.reponse = bonneReponse
      this.distracteurs =
        typeBonneReponse === 'decimal'
          ? [...autres(decimaux).slice(0, 1), ...autres(fractions).slice(0, 2)]
          : [...autres(fractions).slice(0, 1), ...autres(decimaux).slice(0, 2)]
    } else if (typeBonneReponse === 'decimal') {
      this.formatChampTexte = KeyboardType.clavierDeBase
      this.question = `Calculer $A = ${somme}$ et donner le résultat sous forme décimale.`
      this.optionsDeComparaison = { nombreDecimalSeulement: true }
      this.reponse = resultatDecimal
    } else {
      this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
      this.question = `Calculer $A = ${somme}$ et donner le résultat sous la forme d'une fraction décimale.`
      this.optionsDeComparaison = { fractionDecimale: true }
      this.reponse = `\\dfrac{${numerateurFraction.toFixed()}}{${denominateur}}`
    }
  }
}
