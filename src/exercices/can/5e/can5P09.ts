import { texPrix } from '../../../lib/format/style'
import { choice } from '../../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = "Calculer un prix à partir d'un prix au kg"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '13/11/2022'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication
*/

export const uuid = '7b350'

export const refs = {
  'fr-fr': ['can5P09'],
  'fr-ch': [],
}
export default class CalculPrix extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.optionsChampTexte = { texteApres: '€', texteAvant: '<br>' }
  }

  nouvelleVersion() {
    let a, b, n, b1, b2, reponse
    switch (
      choice([1, 2, 3]) //,
    ) {
      case 1:
        a = randint(2, 6)
        n = choice([
          ' de pommes de terre',
          ' de carottes',
          ' de courgettes',
          'de navets',
          'de tomates',
          'de poireaux',
          "d'aubergines",
        ])
        b = randint(1, 9) * 100
        b1 = b / 1000
        b2 = b1 * a
        reponse = b2
        this.question = `Le prix d'un kg ${n} est $${texPrix(a)}$ €. <br>

        Quel est le prix de $${b}$ g ? `

        this.correction = `Comme $${b}$ g $=${texNombre(b1, 1)}$ kg, le  prix  de $${b}$ g ${n} est donné par : <br>
        $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texNombre(b2, 2)}$.<br>
        Le prix de $${b}$ g ${n} est $${miseEnEvidence(texPrix(b2))}$ €.`
        if (b !== 100) {
          if (b === 500) {
            this.correction += texteEnCouleur(`
  <br> Mentalement : <br>
  Multiplier par $0,5$ revient à diviser par $2$. <br>
  Ainsi, $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texPrix(a)}\\div 2=${texPrix(reponse)}$.

`)
          } else {
            this.correction += texteEnCouleur(`
  <br> Mentalement : <br>
  $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texNombre(b1 * 10, 1)}\\times 0,1\\times ${texNombre(a, 1)}=${texNombre(b1 * 10, 1)}\\times ${texNombre(a / 10, 1)}=${texPrix(reponse)}$.

`)
          }
        } else {
          this.correction += ''
        }

        this.reponse = reponse
        break

      case 2:
        a = randint(7, 15)
        n = choice(['de cerises', 'de fraises', 'de framboises'])
        b = randint(1, 9) * 100
        b1 = b / 1000
        b2 = b1 * a
        reponse = b2
        this.question = `Le prix d'un kg ${n} est $${texPrix(a)}$ €. <br>

        Quel est le prix de $${b}$ g ? `

        this.correction = `Comme $${b}$ g $=${texNombre(b1, 1)}$ kg, le  prix  de $${b}$ g ${n} est donné par : <br>
        $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texNombre(b2, 2)}$.<br>
        Le prix de $${b}$ g ${n} est $${miseEnEvidence(texPrix(b2))}$ €.`
        if (b !== 100) {
          if (b === 500) {
            this.correction += texteEnCouleur(`
  <br> Mentalement : <br>
  Multiplier par $0,5$ revient à diviser par $2$. <br>
  Ainsi, $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texPrix(a)}\\div 2=${texPrix(reponse)}$.

`)
          } else {
            this.correction += texteEnCouleur(`
  <br> Mentalement : <br>
  $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texNombre(b1 * 10, 1)}\\times 0,1\\times ${texNombre(a, 1)}=${texNombre(b1 * 10, 1)}\\times ${texNombre(a / 10, 1)}=${texPrix(reponse)}$.

`)
          }
        } else {
          this.correction += ''
        }

        this.reponse = reponse
        break

      case 3:
      default:
        a = randint(16, 25)
        n = choice([
          'du Costa Rica',
          'du Kenya',
          'de Colombie',
          "d'Ethiopie",
          'du Salvador',
          'du Nicaragua',
          'du Mexique',
          'du Honduras',
          'du Guatemala',
        ])
        b = randint(1, 9) * 100
        b1 = b / 1000
        b2 = b1 * a
        reponse = b2
        this.question = `Le prix d'un kg de café ${n} est $${texPrix(a)}$ €. <br>

          Quel est le prix de $${b}$ g ? `

        this.correction = `Comme $${b}$ g $=${texNombre(b1, 1)}$ kg, le  prix  de $${b}$ g de café ${n} est donné par : <br>
          $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texNombre(b2, 2)}$.<br>
          Le prix de $${b}$ g de café ${n} est $${miseEnEvidence(texPrix(b2))}$ €.`
        if (b !== 100) {
          if (b === 500) {
            this.correction += texteEnCouleur(`
    <br> Mentalement : <br>
    Multiplier par $0,5$ revient à diviser par $2$. <br>
    Ainsi, $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texPrix(a)}\\div 2=${texPrix(reponse)}$.

  `)
          } else {
            this.correction += texteEnCouleur(`
    <br> Mentalement : <br>
    $${texNombre(b1, 1)}\\times ${texPrix(a)}=${texNombre(b1 * 10, 1)}\\times 0,1\\times ${texNombre(a, 1)}=${texNombre(b1 * 10, 1)}\\times ${texNombre(a / 10, 1)}=${texPrix(reponse)}$.

  `)
          }
        } else {
          this.correction += ''
        }

        this.reponse = reponse
        break
    }
    this.reponse = this.reponse.toFixed(2)

    this.canReponseACompleter = '$\\ldots$ €'
  }
}
