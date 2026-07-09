import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import FractionEtendue from '../../../modules/FractionEtendue'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Résoudre un problème avec une fraction'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const dateDePublication = '30/12/2025'

/**
 * @author Gilles Mora
 */

export const uuid = 'c70e1'

export const refs = {
  'fr-fr': ['can5C31, 3autoP07-2', '6N3M-flash1'],
  'fr-ch': [],
}
export default class ProblemeFraction extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.optionsDeComparaison = {
      nombreDecimalSeulement: true,
    }
    this.optionsChampTexte = {
      texteAvant: '<br>',
      texteApres: `  g.`,
    }
  }

  nouvelleVersion() {
    switch (choice([1, 2])) {
      case 1:
        {
          const listeFractions: [string, number, number][] = [
            ['un tiers', 1, 3],
            ['un quart', 1, 4],
            ['un cinquième', 1, 5],
            ['un sixième', 1, 6],
          ]
          const fractionChoisie = choice(listeFractions)
          this.reponse = fractionChoisie[2]
          this.question = `Dans ${fractionChoisie[0]} de sandwich, il y a un gramme de sel.<br>
    Combien y a-t-il de grammes de sel dans un sandwich entier ?`

          this.correction = `Dans ${fractionChoisie[0]} de sandwich, il y a un gramme de sel, donc dans un sandwich entier, il y en a $${fractionChoisie[2]}$ fois plus, donc $${miseEnEvidence(this.reponse)}$ g.`
        }
        break

      case 2:
      default:
        {
          const listeFractions2: [string, number, number, string][] = [
            ['deux tiers', 2, 3, 'tiers'],
            ['trois quarts', 3, 4, 'quart'],
            ['quatre cinquièmes', 4, 5, 'cinquième'],
            ['cinq sixièmes', 5, 6, 'sixième'],
          ]
          const fractionChoisie2 = choice(listeFractions2)
          this.reponse = new FractionEtendue(
            fractionChoisie2[2] * 30,
            fractionChoisie2[1],
          )
          this.question = `Dans ${fractionChoisie2[0]} de gâteau, il y a trente grammes de sucre.<br>
    Combien y a-t-il de grammes de sucre dans un gâteau entier ?`

          this.correction = `Dans ${fractionChoisie2[0]} de gâteau, il y a $30$ g de sucre, donc dans un ${fractionChoisie2[3]} de gâteau, 
   il y a $30 \\div ${fractionChoisie2[1]} = ${texNombre(new FractionEtendue(30, fractionChoisie2[1]).valeurDecimale)}$ g de sucre.<br>
   Donc, dans un gâteau entier, 
   il y a $${texNombre(new FractionEtendue(30, fractionChoisie2[1]).valeurDecimale)} \\times ${fractionChoisie2[2]} = ${miseEnEvidence(texNombre(this.reponse.valeurDecimale))}$ g.`
        }
        break
    }

    this.canReponseACompleter = '$\\ldots$ g'
  }
}
