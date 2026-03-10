import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { arrondi } from '../../../lib/outils/nombres'
import { sp } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Utiliser les intervalles'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication 24/10/2021
*/
export const uuid = 'f6f76'

export const refs = {
  'fr-fr': ['can2N01'],
  'fr-ch': [],
}
export default class Intervalles extends ExerciceSimple {
  date: number
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.date = 1635094684684
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let a, b, c, N, d, e

    switch (
      choice([1, 2]) //, 2, 2
    ) {
      case 1:
        a = randint(1, 4) * -1
        b = randint(1, 4)
        c = arrondi(randint(-4, -1) + randint(-9, -1) / 10)
        N = choice(['a', 'b', 'c', 'd', 'e']) //, ${miseEnEvidence(a, 'black') + sp(2)} ; ${sp(2) + miseEnEvidence(b, 'black')}     Bigg[${a}  ${sp(2)} ; ${sp(2)} ${b}\\Bigg]$ <br><br>$\\left]${miseEnEvidence(a, 'black') + sp(2)} ; ${sp(2) + miseEnEvidence(b, 'black')}\\right]$?<br>
        if (N === 'a') {
          this.question = `Combien y a-t-il d'entiers dans l'intervalle $\\bigg[${a}  ${sp(1)} ; ${sp(1)} ${b}\\bigg]$ ?
                    `
          this.correction = ` Il y a $${b - a + 1}$ ${b - a + 1 === 1 ? 'entier' : 'entiers'} dans l'intervalle $\\bigg[${a}${sp(1)} ; ${sp(1)}${b}\\bigg]$.`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
  Comptez-les !<br>
 Ou bien en calculant la différence des bornes et en ajoutant $1$ puisque les bornes de l'intervalle sont "comprises".<br>
 On trouve : $${b}-(${a})+1=${b - a + 1}$.
    `)
          this.reponse = b - a + 1
        }
        if (N === 'b') {
          this.question = `Combien y a-t-il d'entiers dans l'intervalle $\\bigg]${a}  ${sp(1)} ; ${sp(1)} ${b}\\bigg]$ ?`
          this.correction = ` Il y a $${b - a}$ ${b - a === 1 ? 'entier' : 'entiers'} dans l'intervalle $\\bigg]${a}  ${sp(1)} ; ${sp(1)} ${b}\\bigg]$.`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
  Comptez-les !<br>
 Attention l'entier $${a}$ n'appartient pas à l'intervalle.
    `)
          this.reponse = b - a
        }
        if (N === 'c') {
          this.question = `Combien y a-t-il d'entiers dans l'intervalle $\\bigg]${a}  ${sp(1)} ; ${sp(1)} ${b}\\bigg[$ ?`
          this.correction = ` Il y a $${b - a - 1}$ ${b - a - 1 === 1 ? 'entier' : 'entiers'} dans l'intervalle $\\bigg]${a}  ${sp(1)} ; ${sp(1)} ${b}\\bigg[$.`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
        Comptez-les !<br>
       Attention les entiers $${a}$ et $${b}$ n'appartiennent pas à l'intervalle.
          `)
          this.reponse = b - a - 1
        }
        if (N === 'd') {
          this.question = `Combien y a-t-il d'entiers dans l'intervalle $\\bigg[${texNombre(c)}  ${sp(1)} ; ${sp(1)} ${b} \\bigg[$ ?`
          this.correction = `Il y a $${b - Math.trunc(c)}$ ${b - Math.trunc(c) === 1 ? 'entier' : 'entiers'} dans l'intervalle $\\bigg[${texNombre(c)}  ${sp(1)} ; ${sp(1)}  ${b}\\bigg[$.`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
        Comptez-les !<br>
                `)
          this.reponse = b - Math.trunc(c)
        }
        if (N === 'e') {
          this.question = `Combien y a-t-il d'entiers dans l'intervalle $\\bigg[${texNombre(c)}  ${sp(1)} ; ${sp(1)} ${b}\\bigg]$ ?`
          this.correction = `Il y a $${b - Math.trunc(c) + 1}$ ${b - Math.trunc(c) === 1 ? 'entier' : 'entiers'} dans dans l'intervalle $\\bigg[${texNombre(c)}  ${sp(1)} ; ${sp(1)} ${b}\\bigg]$.`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
    Comptez-les !<br>
            `)
          this.reponse = b - Math.trunc(c) + 1
        }
        break

      case 2:
        a = randint(1, 4) * -1
        b = randint(1, 4)
        c = arrondi(randint(-9, -4) + randint(-9, -1) / 10)
        d = arrondi(c + randint(2, 4))
        e = randint(-8, -1)
        N = choice(['a', 'b', 'c', 'd']) //,
        if (N === 'a') {
          this.question = `Quel est le plus petit entier appartenant à l'intervalle $\\bigg]${a}  ${sp(1)} ; ${sp(1)} ${b}\\bigg[$ ?`
          this.correction = `C'est le plus petit entier strictement supérieur à  $${a}$ : il s'agit de $${a + 1}$.`
          this.reponse = a + 1
        }
        if (N === 'b') {
          this.question = `Quel est le plus petit entier de l'intervalle $\\bigg]${texNombre(c)}  ${sp(1)} ; ${sp(1)} ${b}\\bigg[$ ?`
          this.correction = `C'est le plus petit entier strictement supérieur à  $${texNombre(c)}$ : il s'agit de $${Math.trunc(c)}$.`
          this.reponse = Math.trunc(c)
        }
        if (N === 'c') {
          this.question = `Quel est le plus grand entier de l'intervalle $\\bigg]${texNombre(c)}  ${sp(1)} ; ${sp(1)} ${texNombre(d)}\\bigg[$ ?`
          this.correction = `C'est le plus grand entier strictement inférieur à  $${texNombre(d)}$ : il s'agit de $${Math.trunc(d) - 1}$.`
          this.reponse = Math.trunc(d) - 1
        }
        if (N === 'd') {
          this.question = `Quel est le plus grand entier de l'intervalle $\\bigg]${texNombre(e - 4)}  ${sp(1)} ; ${sp(1)} ${texNombre(e)}\\bigg[$ ?`
          this.correction = `C'est le plus grand entier strictement inférieur à  $${texNombre(e)}$ : il s'agit de $${e - 1}$.`
          this.reponse = e - 1
        }
        break
    }
  }
}
