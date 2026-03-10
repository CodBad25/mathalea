import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { texNombre } from '../../../lib/outils/texNombre'
import FractionEtendue from '../../../modules/FractionEtendue'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = "Passer d'un décimal à une fraction"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '31/10/2022'
/**
 * @author Gilles Mora
 */

export const uuid = '67f09'

export const refs = {
  'fr-fr': ['can5C22'],
  'fr-ch': [],
}
export default class DecimalVersFraction extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.optionsChampTexte = { texteAvant: '<br>' }
  }

  nouvelleVersion() {
    let a, d, maFraction

    a = randint(1, 39, [10, 20, 30])
    switch (choice([1, 2, 3])) {
      case 1: // division par 10
        d = a / 10
        maFraction = new FractionEtendue(a, 10)
        this.correction = `$${texNombre(d, 1)}=\\dfrac{${texNombre(d * 10, 0)}}{10}${maFraction.texSimplificationAvecEtapes()}$ `
        break
      case 2: // division par 100
        d = a / 100
        maFraction = new FractionEtendue(a, 100)
        this.correction = `$${texNombre(d, 2)}=\\dfrac{${texNombre(d * 100, 2)}}{100}${maFraction.texSimplificationAvecEtapes()}$ `
        break

      case 3: // division par 1000
      default:
        a = choice([
          a,
          randint(201, 299, [210, 220, 230, 240, 250, 260, 270, 280, 290]),
        ])
        d = a / 1000
        maFraction = new FractionEtendue(a, 1000)
        this.correction = `$${texNombre(d, 3)}=\\dfrac{${texNombre(d * 1000, 3)}}{1000}${maFraction.texSimplificationAvecEtapes()}$ `
        break
    }
    if (this.interactif)
      this.correction +=
        "<br><br><em>Remarque : une fraction a une infinité d'écritures différentes.</em>"
    this.question = `Écrire $${texNombre(d, 3)}$ sous la forme d'une fraction.`
    this.reponse = maFraction
  }
}
