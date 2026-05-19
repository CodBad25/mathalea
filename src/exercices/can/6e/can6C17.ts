import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'

import { bleuMathalea } from '../../../lib/colors'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer la fraction d’une quantité'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021
 */
export const uuid = 'daaa3'

export const refs = {
  'fr-fr': ['can6C17', 'auto6N3E-flash1', '3AutoN04-1'],
  'fr-ch': [],
}
export default class FractionSimpleDeQuantite extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.optionsChampTexte = { texteApres: '  $\\text{ L}$' }
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
  }

  nouvelleVersion() {
    const a = randint(2, 6)
    this.reponse = randint(2, 9) * 10
    const b = this.reponse * a
    this.question = `Calculer $\\dfrac{1}{${a}} \\text{ de } ${b} \\text{ L}$.`
    this.correction = `$\\dfrac{1}{${a}}$ de $${b} \\text{ L}$ = $${miseEnEvidence(this.reponse)} \\text{ L}$<br>`
    this.correction += texteEnCouleur(
      `
    <br> Mentalement : <br>
    Prendre $\\dfrac{1}{${a}}$ d'une quantité revient à la diviser par $${a}$.<br>
    Ainsi, $\\dfrac{1}{${a}}$ de $${b}=${b}\\div ${a}=${b / a}$.
     `,
      bleuMathalea,
    )

    this.canReponseACompleter = '$\\dots \\text{ L}$'
  }
}
