import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'

import { bleuMathalea } from '../../../lib/colors'
import { arrondi } from '../../../lib/outils/nombres'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer la valeur décimale d’une fraction'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
/**
 * @author Jean-Claude Lhote & Gilles Mora
 * Créé pendant l'été 2021
 */
export const uuid = 'bf6e6'

export const refs = {
  'fr-fr': ['can6C22', '6N3A-flash1', '3AutoN01-1'],
  'fr-ch': [],
}
export default class ValeursDecimalesFractions extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.clavierNumbers
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    let a, b
    switch (choice([1, 2, 3, 4])) {
      case 1:
        a = randint(1, 9, 5)
        this.reponse = arrondi(a / 5)
        this.question = `Donner la valeur décimale de  $\\dfrac{${a}}{5}$.`
        this.correction = `$\\dfrac{${a}}{5}=${miseEnEvidence(texNombre(this.reponse))}$<br>`
        if (a === 2 || a === 3 || a === 4) {
          this.correction += texteEnCouleur(
            `
    <br> Mentalement : <br>
         $\\dfrac{1}{5}=0,2$ et $\\dfrac{${a}}{5}=${a}\\times \\dfrac{1}{5}=${a}\\times 0,2=${texNombre(this.reponse)}$.`,
            bleuMathalea,
          )
        }
        if (a > 5) {
          this.correction += texteEnCouleur(
            `
  <br> Mentalement : <br>
   $\\dfrac{${a}}{5}=\\dfrac{5}{5}+\\dfrac{${a - 5}}{5}=1+${texNombre((a - 5) / 5)}=${texNombre(this.reponse)}$.`,
            bleuMathalea,
          )
        }
        break
      case 2:
        b = choice([1, 3, 5, 7, 9, 11])
        this.question = `Donner la valeur décimale de  $\\dfrac{${b}}{4}$.`
        this.reponse = arrondi(b / 4)
        this.correction = `$\\dfrac{${b}}{4}=${miseEnEvidence(texNombre(this.reponse))}$<br>`
        if (b === 5 || b === 7) {
          this.correction += texteEnCouleur(
            `
          <br> Mentalement : <br>
          $\\dfrac{${b}}{4}=\\dfrac{4}{4}+\\dfrac{${b - 4}}{4}=
          1+${texNombre((b - 4) / 4)}=${texNombre(this.reponse)}$.`,
            bleuMathalea,
          )
        }
        if (b === 9 || b === 11) {
          this.correction += texteEnCouleur(
            `
          <br> Mentalement : <br>
          $\\dfrac{${b}}{4}=\\dfrac{8}{4}+\\dfrac{${b - 8}}{4}=
          2+${texNombre((b - 8) / 4)}=${texNombre(this.reponse)}$.`,
            bleuMathalea,
          )
        }
        break
      case 3:
        b = choice([1, 3, 5, 7, 9, 11, 13, 17, 19])
        this.question = `Donner la valeur décimale de  $\\dfrac{${b}}{10}$.`
        this.reponse = arrondi(b / 10)
        this.correction = `$\\dfrac{${b}}{10}=${miseEnEvidence(texNombre(this.reponse))}$<br>`
        if (b > 1) {
          this.correction += texteEnCouleur(
            `
          <br> Mentalement : <br>
          $\\dfrac{${b}}{10}=${b}\\times \\dfrac{1}{10}=
          ${b}\\times 0,1=${texNombre(this.reponse)}$.`,
            bleuMathalea,
          )
        }
        break
      case 4:
        b = choice([3, 5, 7, 9, 11, 13, 17, 19])
        this.question = `Donner la valeur décimale de  $\\dfrac{${b}}{2}$.`
        this.reponse = arrondi(b / 2)

        this.correction = `$\\dfrac{${b}}{2}=${miseEnEvidence(texNombre(this.reponse))}$<br>`
        this.correction += texteEnCouleur(
          `
          <br> Mentalement : <br>
          $\\dfrac{${b}}{2}=${b}\\div 2=${texNombre(this.reponse)}$.`,
          bleuMathalea,
        )

        break
    }
  }
}
