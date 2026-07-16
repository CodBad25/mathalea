import { latex2d } from '../../../lib/2d/textes'
import { choice } from '../../../lib/outils/arrayOutils'
import { texNombre } from '../../../lib/outils/texNombre'

import { droiteGraduee } from '../../../lib/2d/DroiteGraduee'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import ExerciceSimple from '../../ExerciceSimple'
import { bleuMathalea } from '../../../lib/colors'
export const titre =
  "Lire l'abscisse décimale d'un point sur une droite graduée"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '29/08/2021'
export const dateDeModifImportante = '12/10/2024'
/**
 * @author Jean-claude Lhote
 * Publié le 11 / 09 / 2021

 */
export const uuid = '34d01'

export const refs = {
  'fr-fr': ['can6N07', '6N1H-flash1'],
  'fr-ch': [],
}
export default class LireAbscisseDecimaleDeFraction extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let a
    switch (
      this.quotaChoice('cas', [1, 2]) //
    ) {
      case 1: // droite graduée     /4 resultat décimal
        a = choice([1, 3, 5, 6, 7, 9, 10, 11]) // numérateur
        this.reponse = a / 4
        this.question = `Determiner l'abscisse du point $A$.<br>
        On donnera le résultat sous  forme décimale.<br>`

        this.question += mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: 14,
            ymax: 1,
            pixelsParCm: 35,
            scale: 0.6,
            center: true,
          },
          latex2d('A', (3 * a) / 4, 0.5, { color: bleuMathalea }),
          droiteGraduee({
            Unite: 3,
            Min: 0,
            Max: 3.2,
            x: 0,
            y: 0,
            thickSecDist: 1 / 4,
            thickSec: true,
            axeStyle: '|->',
            pointListe: [[a / 4, '']],
            pointCouleur: bleuMathalea,
            pointStyle: 'x',
            labelsPrincipaux: true,
            step1: 1,
            step2: 1,
          }),
        )
        this.correction = `L'abscisse du point A est $\\dfrac{${a}}{${4}}=${miseEnEvidence(texNombre(this.reponse, 2))}$`

        break
      case 2: // droite graduée     /5 resultat décimal
        a = choice([1, 2, 3, 4, 6, 7, 8, 9]) // numérateur
        this.reponse = a / 5
        this.question = `Determiner l'abscisse du point $A$.<br>
        On donnera le résultat sous  forme décimale.<br>
    
    `

        this.question += mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: 14,
            ymax: 1,
            pixelsParCm: 35,
            scale: 0.6,
            center: true,
          },
          latex2d('A', (3 * a) / 5, 0.5, { color: bleuMathalea }),
          droiteGraduee({
            Unite: 3,
            Min: 0,
            Max: 3.2,
            x: 0,
            y: 0,
            thickSecDist: 1 / 5,
            thickSec: true,
            axeStyle: '|->',
            pointListe: [[a / 5, '']],
            pointCouleur: bleuMathalea,
            pointStyle: 'x',
            labelsPrincipaux: true,
            step1: 1,
            step2: 1,
          }),
        )
        this.correction = `L'abscisse du point A est $\\dfrac{${a}}{${5}}=${miseEnEvidence(texNombre(this.reponse, 2))}$`

        break
    }
  }
}
