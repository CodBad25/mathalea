import { choice } from '../../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  reduireAxPlusB,
  reduirePolynomeDegre3,
  rienSi1,
} from '../../../lib/outils/ecritures'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer la fonction dérivée d’un polynôme de degré 3'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '21/06/2022'

/**
 *
 * @author Gilles Mora

*/
export const uuid = 'ffbf6'

export const refs = {
  'fr-fr': ['can1F34'],
  'fr-ch': ['3mA2-7'],
}
export default class DeriveePoly3 extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let a, b, c, d
    switch (
      choice([1, 2, 3, 4, 5, 6]) //
    ) {
      case 1: // troisième degre ax^3+bx^2+cx+d
        a = randint(-10, 10, [0])
        b = randint(-10, 10, [0])
        c = randint(-10, 10, [0])
        d = randint(-10, 10, [0])
        if (!this.interactif) {
          this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>
          
          $f(x)= ${reduirePolynomeDegre3(a, b, c, d)}$.<br>

       Déterminer $f'(x)$.`
        } else {
          this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : $f(x)= ${reduirePolynomeDegre3(a, b, c, d)}$.<br>
        La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
        }

        this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$.<br>
    La fonction dérivée est donnée par la somme des dérivées des fonctions $u$, $v$ et $w$ définies par $u(x)=${rienSi1(a)}x^3$, $v(x)=${rienSi1(b)}x^2$ et $w(x)=${reduireAxPlusB(c, d)}$.<br>
     Comme $u'(x)=${3 * a}x^2$, $v'(x)=${2 * b}x$ et $w'(x)=${c}$, on obtient  $f'(x)=${reduirePolynomeDegre3(0, 3 * a, 2 * b, c)}$. `

        this.reponse = [`${3 * a}x^2+${2 * b}x+${c}`]
        break

      case 2: // troisième degre bx^2+ax^3+cx+d ou cx+bx^2+d+ax^3
        a = randint(-10, 10, [0])
        b = randint(-10, 10, [0])
        c = randint(-10, 10, [0])
        d = randint(-10, 10, [0])
        if (choice([true, false])) {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)= ${rienSi1(b)}x^2${ecritureAlgebriqueSauf1(a)}x^3${ecritureAlgebriqueSauf1(c)}x${ecritureAlgebrique(d)}$.<br>
       
            Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
            $f(x)= ${rienSi1(b)}x^2${ecritureAlgebriqueSauf1(a)}x^3${ecritureAlgebriqueSauf1(c)}x${ecritureAlgebrique(d)}$.<br>
        La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        } else {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>
            
            $f(x)=${rienSi1(c)}x${ecritureAlgebriqueSauf1(b)}x^2${ecritureAlgebrique(d)}${ecritureAlgebriqueSauf1(a)}x^3 $.<br>
    
            Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : $f(x)=${rienSi1(c)}x${ecritureAlgebriqueSauf1(b)}x^2${ecritureAlgebrique(d)}${ecritureAlgebriqueSauf1(a)}x^3 $.<br>
      La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        }

        this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$.<br>
    La fonction dérivée est donnée par la somme des dérivées des fonctions $u$, $v$ et $w$ définies par $u(x)=${rienSi1(a)}x^3$, $v(x)=${rienSi1(b)}x^2$ et $w(x)=${reduireAxPlusB(c, d)}$.<br>
     Comme $u'(x)=${3 * a}x^2$, $v'(x)=${2 * b}x$ et $w'(x)=${c}$, on obtient  $f'(x)=${reduirePolynomeDegre3(0, 3 * a, 2 * b, c)}$. `

        this.reponse = [`${3 * a}x^2+${2 * b}x+${c}`]

        break
      case 3: // troisième degre ax^3+bx^2+c ou ax^3+c+bx^2
        a = randint(-10, 10, [0])
        b = randint(-10, 10, [0])
        c = randint(-10, 10, [0])

        if (choice([true, false])) {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)= ${reduirePolynomeDegre3(a, b, 0, c)}$.<br>

        Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
            $f(x)= ${reduirePolynomeDegre3(a, b, 0, c)}$.<br>
        La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        } else {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)=${rienSi1(a)}x^3${ecritureAlgebrique(c)}${ecritureAlgebriqueSauf1(b)}x^2 $.<br>

      Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
             $f(x)=${rienSi1(a)}x^3${ecritureAlgebrique(c)}${ecritureAlgebriqueSauf1(b)}x^2$.<br>
      La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        }

        this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$ avec $c=0$.<br>
        La fonction dérivée est donnée par la somme des dérivées des fonctions $u$, $v$ et $w$ définies par $u(x)=${rienSi1(a)}x^3$, $v(x)=${rienSi1(b)}x^2$ et $w(x)=${c}$.<br>
         Comme $u'(x)=${3 * a}x^2$, $v'(x)=${2 * b}x$ et $w'(x)=0$, on obtient  $f'(x)=${reduirePolynomeDegre3(0, 3 * a, 2 * b, 0)}$. `

        this.reponse = [`${3 * a}x^2+${2 * b}x`]

        break

      case 4: // troisième degre ax^3+bx+c ou bx+c+ax^3
        a = randint(-10, 10, [0])
        b = randint(-10, 10, [0])
        c = randint(-10, 10, [0])

        if (choice([true, false])) {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)= ${reduirePolynomeDegre3(a, 0, b, c)}$.<br>

       Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
            $f(x)= ${reduirePolynomeDegre3(a, 0, b, c)}$.<br>
        La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        } else {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)=${rienSi1(b)}x${ecritureAlgebrique(c)}${ecritureAlgebriqueSauf1(a)}x^3 $.<br>

     Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
             $f(x)=${rienSi1(b)}x${ecritureAlgebrique(c)}${ecritureAlgebriqueSauf1(a)}x^3 $.<br>
      La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        }

        this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$ avec $b=0$.<br>
        La fonction dérivée est donnée par la somme des dérivées des fonctions $u$ et $v$  définies par $u(x)=${rienSi1(a)}x^3$ et $v(x)=${reduireAxPlusB(b, c)}$.<br>
         Comme $u'(x)=${3 * a}x^2$, $v'(x)=${b}$, on obtient  $f'(x)=${3 * a}x^2${ecritureAlgebrique(b)}$. `

        this.reponse = [`${3 * a}x^2+${b}`]

        break

      case 5: // troisième degre ax^3+b ou b+ax^3
        a = randint(-10, 10, [0])
        b = randint(-10, 10, [0])

        if (choice([true, false])) {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
            $f(x)= ${reduirePolynomeDegre3(a, 0, 0, b)}$.<br>
       Déterminer la fonction dérivée de $f$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
            $f(x)= ${reduirePolynomeDegre3(a, 0, 0, b)}$.<br>
        La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        } else {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :<br>

            $f(x)=${b}${ecritureAlgebriqueSauf1(a)}x^3 $.<br>

      Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
             $f(x)=${b}${ecritureAlgebriqueSauf1(a)}x^3 $.<br>
      La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
        }

        this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$ avec $b=0$ et $c=0$.<br>
        La fonction dérivée est donnée par la somme des dérivées des fonctions $u$ et $v$  définies par $u(x)=${rienSi1(a)}x^3$ et $v(x)=${b}$.<br>
         Comme $u'(x)=${3 * a}x^2$, $v'(x)=0$, on obtient  $f'(x)=${3 * a}x^2$. `

        this.reponse = [`${3 * a}x^2`]

        break
      case 6: // troisième degre bx^2+ax^3 ou bx+ax^3
        a = randint(-10, 10, [0])
        b = randint(-10, 10, [0])

        if (choice([true, false])) {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)= ${rienSi1(b)}x^2${ecritureAlgebriqueSauf1(a)}x^3$.<br>

       Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :
                      $f(x)= ${rienSi1(b)}x^2${ecritureAlgebriqueSauf1(a)}x^3$.<br>
        La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
          this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$ avec $c=0$ et $d=0$.<br>
        La fonction dérivée est donnée par la somme des dérivées des fonctions $u$ et $v$  définies par $u(x)=${rienSi1(a)}x^3$ et $v(x)=${b}x^2$.<br>
         Comme $u'(x)=${3 * a}x^2$, $v'(x)=${2 * b}x$, on obtient  $f'(x)=${3 * a}x^2${2 * b}x$. `
          this.reponse = [`${3 * a}x^2+${2 * b}x`]
        } else {
          if (!this.interactif) {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : <br>

            $f(x)=${rienSi1(b)}x${ecritureAlgebriqueSauf1(a)}x^3 $.<br>

     Déterminer $f'(x)$.`
          } else {
            this.question = `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :<br>
             $f(x)=${rienSi1(b)}x${ecritureAlgebriqueSauf1(a)}x^3 $.<br>
      La fonction dérivée de $f$ est définie par : <br>$f'(x)=$`
          }
          this.correction = `$f$ est une fonction polynôme du troisième degré de la forme $f(x)=ax^3+bx^2+cx+d$ avec $b=0$ et $d=0$.<br>
        La fonction dérivée est donnée par la somme des dérivées des fonctions $u$ et $v$  définies par $u(x)=${rienSi1(a)}x^3$ et $v(x)=${b}x$.<br>
         Comme $u'(x)=${3 * a}x^2$, $v'(x)=${b}$, on obtient  $f'(x)=${3 * a}x^2${ecritureAlgebrique(b)}$. `
          this.reponse = [`${3 * a}x^2+${b}`]
        }

        break
    }
    this.canEnonce = this.question
    this.canReponseACompleter = ''
  }
}
