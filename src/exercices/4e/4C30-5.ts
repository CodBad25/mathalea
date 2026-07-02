import { combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import {
  handleAnswers,
  setReponse,
} from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { ecritureParentheseSiNegatif } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { lettreDepuisChiffre, sp } from '../../lib/outils/outilString'
import { context } from '../../modules/context'

export const titre = 'Effectuer des calculs avec des puissances'
export const dateDePublication = '02/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
/**
 * Puissances d'un entier
 * @author Jean-Claude Lhote adaptation pour le programme de 4e et de 3e : pas de règles de calcul
 */
export const uuid = 'c72da'

export const refs = {
  'fr-fr': ['4C30-5'],
  'fr-ch': [],
}
export default class PuissancesDUnEntier extends Exercice {
  niveau: number
  constructor() {
    super()
    this.niveau = 3
    this.besoinFormulaireTexte = [
      'Types de questions',
      'Nombres séparés par des tirets\n0: Mélange\n1: a^n*a^2/a^m\n2: a^n*a^3/a^m\n3: a*a^n/(a^2)^m\n4: a*a^n/(a^2*a^2)\n5: a^(2*n)/a\n6: a^(3*n)/a\n7: a^n*a^m/(a^2)^p*a\n8: (a^3*a)/(a^2)^n',
    ]
    this.consigne = 'Écrire sous la forme $a^n$.'
    this.spacing = 2
    this.spacingCorr = 2.5
    this.nbQuestions = 8
    this.sup = '1'
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 8,
      defaut: 1,
      nbQuestions: this.nbQuestions,
      melange: 0,
    })
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const typesDeQuestions = listeTypeDeQuestions[i]
      let base = 0
      const signeBase = this.niveau === 4 ? 1 : randint(-1, 1, 0)
      let exp0 = 0
      let exp1 = 0
      let exp2 = 0
      const exp: number[] = []
      let texte = ''
      let texteCorr = ''
      let reponseInteractive = ''
      let exposantInteractif = 0

      switch (typesDeQuestions) {
        case 1:
          do {
            // a^n*a^2/a^m
            base = randint(2, 7, 4) * signeBase
            exp1 = randint(3, 6)
            exp2 = randint(3, 6, [exp1])
            exp0 =
              randint(this.niveau === 4 ? 4 : 2, this.niveau === 4 ? 6 : 7, [
                exp1,
                exp2,
              ]) + (this.niveau === 4 ? 5 : 0)
            const expMax = Math.min(exp0 + 2, exp1 + exp2)

            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}^{${exp0}}\\times ${base * base}}{${ecritureParentheseSiNegatif(base)}^{${
              exp1
            }} \\times ${ecritureParentheseSiNegatif(base)}^${exp2}}$`
            // J'ai mis cette phrase pour éviter le placement disgracieux du bloc aligned en latex avec le Numéro de question au milieu.
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${exp0}}`, 'blue')}\\times ${miseEnEvidence(`${base * base}`, 'green')}}{${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^${exp1}`, 'red')} \\times ${ecritureParentheseSiNegatif(base)}^${exp2}}$ :<br>
             $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${new Array(exp0).fill(miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'blue')).join('\\times ')}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'green')}\\times${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'green')}}^{${exp0 + 2}\\text{ fois}}}{\\underbrace{${new Array(
               exp1,
             )
               .fill(
                 `${miseEnEvidence(ecritureParentheseSiNegatif(base).toString(), 'red')}`,
               )
               .join(
                 '\\times ',
               )}\\times ${new Array(exp2).fill(`${ecritureParentheseSiNegatif(base)}`).join('\\times ')}}_{${exp1 + exp2}\\text{ fois}}}\\\\
            &=\\dfrac{${new Array(exp0 + 2)
              .fill(`${ecritureParentheseSiNegatif(base)}`)
              .map((el, i) => {
                if (i < expMax) return `\\cancel{${el}}`
                else return el
              })
              .join('\\times ')}}{${new Array(exp1 + exp2)
              .fill(`${ecritureParentheseSiNegatif(base)}`)
              .map((el, i) => {
                if (i < expMax) return `\\cancel{${el}}`
                else return el
              })
              .join('\\times ')}}\\\\
              &=\\dfrac{${
                exp0 + 2 <= expMax
                  ? '1'
                  : new Array(exp0 + 2 - expMax)
                      .fill(`${ecritureParentheseSiNegatif(base)}`)
                      .join('\\times ')
              }}{${
                exp1 + exp2 <= expMax
                  ? '1'
                  : new Array(exp1 + exp2 - expMax)
                      .fill(`${ecritureParentheseSiNegatif(base)}`)
                      .join('\\times ')
              }}\\\\
              &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${exp0 + 2 - exp1 - exp2}}`)}\\end{aligned}$`

            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${exp0 + 2 - exp1 - exp2}}`
            exposantInteractif = exp0 + 2 - exp1 - exp2
          } while (this.niveau === 4 && exp0 + 2 < exp1 + exp2)
          break
        case 2: // a^n*a^3/a^m
          do {
            base = randint(2, 7, 4) * signeBase
            exp0 = randint(2, 6)
            exp1 = randint(2, 9, [exp0 + 3, exp0])
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}^${exp0}\\times ${ecritureParentheseSiNegatif(base)}^{3}}{${ecritureParentheseSiNegatif(base)}^${
              exp1
            }}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^${exp0}`, 'blue')}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^3`, 'green')}}{${ecritureParentheseSiNegatif(base)}^${exp1}}$ : <br>
            $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${new Array(exp0).fill(miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'blue')).join('\\times ')}\\times ${new Array(
              3,
            )
              .fill(
                miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'green'),
              )
              .join(
                '\\times ',
              )}}^{${exp0 + 3}\\text{ fois}}}{\\underbrace{${new Array(exp1)
              .fill(`${ecritureParentheseSiNegatif(base)}`)
              .join('\\times ')}}_{${exp1}\\text{ fois}}}\\\\
            &=\\dfrac{${new Array(exp0 + 3)
              .fill(`${ecritureParentheseSiNegatif(base)}`)
              .map((el, i) => {
                if (i < exp1) return `\\cancel{${el}}`
                else return el
              })
              .join('\\times ')}}{${new Array(exp1)
              .fill(`${ecritureParentheseSiNegatif(base)}`)
              .map((el, i) => {
                if (i < exp1) return `\\cancel{${el}}`
                else return el
              })
              .join('\\times ')}}\\\\
              &=\\dfrac{${
                exp0 + 3 <= exp1
                  ? '1'
                  : new Array(exp0 + 3 - exp1)
                      .fill(`${ecritureParentheseSiNegatif(base)}`)
                      .join('\\times ')
              }}{${exp1 <= exp1 ? '1' : new Array(exp1 - exp1).fill(`${ecritureParentheseSiNegatif(base)}`).join('\\times ')}}\\\\
              &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${exp0 + 3 - exp1}}`)}\\end{aligned}$`
            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${exp0 + 3 - exp1}}`
            exposantInteractif = exp0 + 3 - exp1
          } while (this.niveau === 4 && exp0 + 3 < exp1)
          break
        case 3: // a*a^n/(a^2)^m
          do {
            base = randint(2, 7, 4) * signeBase
            exp0 = randint(2, 8)
            exp1 = randint(2, 5)
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}\\times ${ecritureParentheseSiNegatif(base)}^${exp0}}{${ecritureParentheseSiNegatif(base ** 2)}^${
              exp1
            }}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^${exp0}`, 'blue')}}{${miseEnEvidence(`${ecritureParentheseSiNegatif(base ** 2)}^${exp1}`, 'green')}}$ :<br>
          $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${ecritureParentheseSiNegatif(base)}\\times ${miseEnEvidence(`${new Array(exp0).fill(`${ecritureParentheseSiNegatif(base)}`).join('\\times ')}`, 'blue')}}^{${1 + exp0}\\text{ fois}}}{\\underbrace{${miseEnEvidence(`${new Array(exp1).fill(`(${ecritureParentheseSiNegatif(base)}\\times ${ecritureParentheseSiNegatif(base)})`).join('\\times ')}`, 'green')}}_{${2 * exp1}\\text{ fois}}}\\\\
          &=\\dfrac{${new Array(1 + exp0)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(1 + exp0, 2 * exp1)) return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}{${new Array(2 * exp1)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(2 * exp1, 1 + exp0)) return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}\\\\
            &=\\dfrac{${
              1 + exp0 <= 2 * exp1
                ? '1'
                : new Array(1 + exp0 - 2 * exp1)
                    .fill(`${ecritureParentheseSiNegatif(base)}`)
                    .join('\\times ')
            }}{${
              2 * exp1 <= 1 + exp0
                ? '1'
                : new Array(2 * exp1 - (1 + exp0))
                    .fill(`${ecritureParentheseSiNegatif(base)}`)
                    .join('\\times ')
            }}\\\\
          &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${1 + exp0 - 2 * exp1}}`)}\\end{aligned}$`

            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${1 + exp0 - 2 * exp1}}`
            exposantInteractif = 1 + exp0 - 2 * exp1
          } while (this.niveau === 4 && 1 + exp0 < 2 * exp1)
          break
        case 4: // a*a^n/(a^2*a^2)
          do {
            base = randint(2, 7, 4) * signeBase
            exp0 = randint(2, 7) // on a besoin de 1 exposant
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}\\times ${ecritureParentheseSiNegatif(base)}^${exp0}}{${
              base ** 2
            }\\times ${base ** 2}}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^${exp0}`, 'blue')}}{${miseEnEvidence(
              `${base ** 2}`,
              'red',
            )}\\times ${miseEnEvidence(`${base ** 2}`, 'green')}}$ :<br>
          $\\begin{aligned}
          ${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{ ${ecritureParentheseSiNegatif(base)} \\times ${miseEnEvidence(`${new Array(exp0).fill(`${ecritureParentheseSiNegatif(base)}`).join('\\times ')}`, 'blue')} } ^ { ${1 + exp0}\\text{ fois} } }
          {\\underbrace{ ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)} \\times ${ecritureParentheseSiNegatif(base)}`, 'red')} \\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)} \\times ${ecritureParentheseSiNegatif(base)}`, 'green')} }_{4\\text{ fois}}}\\\\
          &=\\dfrac{${new Array(1 + exp0)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(1 + exp0, 4)) return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}{${new Array(4)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(4, 1 + exp0)) return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}\\\\
          &=\\dfrac{${
            1 + exp0 <= 4
              ? '1'
              : new Array(1 + exp0 - 4)
                  .fill(`${ecritureParentheseSiNegatif(base)}`)
                  .join('\\times ')
          }}{${
            4 <= 1 + exp0
              ? '1'
              : new Array(4 - (1 + exp0))
                  .fill(`${ecritureParentheseSiNegatif(base)}`)
                  .join('\\times ')
          }}\\\\
          &=${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${1 + exp0 - 4}}`)}\\end{aligned}$`

            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${1 + exp0 - 2 - 2}}`
            exposantInteractif = 1 + exp0 - 2 - 2
          } while (this.niveau === 4 && 1 + exp0 < 4)
          break
        case 5: // a^(2*n)/a
          do {
            base = randint(2, 7, 4) * signeBase
            exp0 = randint(2, 5)
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${base ** 2}^${exp0}}{${base}}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${miseEnEvidence(`${base ** 2}^${exp0}`, 'blue')}}{${ecritureParentheseSiNegatif(base)}}$ :<br>
          $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${new Array(exp0).fill(`${miseEnEvidence(`${base < 0 ? '\\left[' : '('}${ecritureParentheseSiNegatif(base)}\\times ${ecritureParentheseSiNegatif(base)}${base < 0 ? '\\right]' : ')'}`, 'blue')}`).join('\\times ')}}^{${2 * exp0}\\text{ fois} }  }{${ecritureParentheseSiNegatif(base)}}\\\\
          &=\\dfrac{${new Array(2 * exp0)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < 1) return `\\cancel{${el}}`
              else return el
            })
            .join(
              '\\times ',
            )}}{\\cancel{${ecritureParentheseSiNegatif(base)}}}\\\\
          &=\\dfrac{${new Array(2 * exp0 - 1)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .join('\\times ')}}{1}\\\\
          &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${2 * exp0 - 1}}`)}\\end{aligned}$`

            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${2 * exp0 - 1}}`
            exposantInteractif = 2 * exp0 - 1
          } while (this.niveau === 4 && 2 * exp0 < 1)
          break
        case 6: // a^(3*n)/a
          do {
            base = randint(2, 5, 4) * signeBase // On enlève 4 car sinon, on pourrait induire l'élève sur 2^6 plutôt que 8^2.
            exp0 = randint(2, 4)
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base ** 3)}^${exp0}}{${base}}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${miseEnEvidence(`${ecritureParentheseSiNegatif(base ** 3)}^${exp0}`, 'blue')}}{${base}}$ :<br>
          $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${new Array(exp0).fill(`${miseEnEvidence(`${base < 0 ? '\\left[' : '('}${ecritureParentheseSiNegatif(base)}\\times ${ecritureParentheseSiNegatif(base)}\\times ${ecritureParentheseSiNegatif(base)}${base < 0 ? '\\right]' : ')'}`, 'blue')}`).join('\\times ')}}^{${3 * exp0}\\text{ fois} }  }{${ecritureParentheseSiNegatif(base)}}\\\\
          &=\\dfrac{${new Array(3 * exp0)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < 1) return `\\cancel{${el}}`
              else return el
            })
            .join(
              '\\times ',
            )}}{\\cancel{${ecritureParentheseSiNegatif(base)}}}\\\\
          &=\\dfrac{${new Array(3 * exp0 - 1)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .join('\\times ')}}{1}\\\\
          &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${3 * exp0 - 1}}`)}\\end{aligned}$`

            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${3 * exp0 - 1}}`
            exposantInteractif = 3 * exp0 - 1
          } while (this.niveau === 4 && 3 * exp0 < 1)
          break
        case 7: // a^n*a^m/(a^2)^p*a
          do {
            base = randint(2, 7, 4) * signeBase
            exp0 = randint(2, 7)
            exp1 = randint(2, 7, [exp0])
            exp2 = randint(2, 4, [exp0, exp1])
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base)}^${exp0}\\times ${ecritureParentheseSiNegatif(base)}^${exp1}}{${
              base ** 2
            }^${exp2}\\times ${ecritureParentheseSiNegatif(base)}}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^${exp0}`, 'blue')}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^${exp1}`, 'red')}}{${miseEnEvidence(`${base ** 2}^${exp2}`, 'green')}\\times ${ecritureParentheseSiNegatif(base)}}$ :<br>
          $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${new Array(exp0).fill(miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'blue')).join('\\times ')}\\times ${new Array(exp1).fill(miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'red')).join('\\times ')}}^{${exp0 + exp1}\\text{ fois}}}{\\underbrace{${new Array(
            exp2,
          )
            .fill(
              miseEnEvidence(
                `${base < 0 ? '\\left[' : '('}${ecritureParentheseSiNegatif(base)} \\times ${ecritureParentheseSiNegatif(base)}${base < 0 ? '\\right]' : ')'}`,
                'green',
              ),
            )
            .join(
              '\\times ',
            )}\\times ${ecritureParentheseSiNegatif(base)}}_{${2 * exp2 + 1}\\text{ fois}}}\\\\
          &=\\dfrac{${new Array(exp0 + exp1)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(exp0 + exp1, 2 * exp2 + 1))
                return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}{${new Array(2 * exp2 + 1)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(2 * exp2 + 1, exp0 + exp1))
                return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}\\\\
          &=\\dfrac{${
            exp0 + exp1 <= 2 * exp2 + 1
              ? '1'
              : new Array(exp0 + exp1 - (2 * exp2 + 1))
                  .fill(`${ecritureParentheseSiNegatif(base)}`)
                  .join('\\times ')
          }}{${
            2 * exp2 + 1 <= exp0 + exp1
              ? '1'
              : new Array(2 * exp2 + 1 - (exp0 + exp1))
                  .fill(`${ecritureParentheseSiNegatif(base)}`)
                  .join('\\times ')
          }}\\\\
          &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${exp0 + exp1 + 1 - 2 * exp2}}`)}\\end{aligned}$`
            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${exp0 + exp1 + 1 - 2 * exp2}}`
            exposantInteractif = exp0 + exp1 + 1 - 2 * exp2
          } while (this.niveau === 4 && exp0 + exp1 + 1 < 2 * exp2)
          break
        case 8: // (a^3*a)/(a^2)^n
          do {
            base = randint(2, 5, 4)
            exp0 = randint(2, 5)
            texte = `$${lettreDepuisChiffre(i + 1)}=\\dfrac{${ecritureParentheseSiNegatif(base ** 3)}\\times ${ecritureParentheseSiNegatif(base)}}{${base ** 2}^${exp0}}$`
            texteCorr = `Calculons $${lettreDepuisChiffre(i + 1)}=\\dfrac{${miseEnEvidence(`${ecritureParentheseSiNegatif(base ** 3)}`, 'blue')}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'green')}}{${miseEnEvidence(`${base ** 2}^${exp0}`, 'red')}}$ :<br>
          $\\begin{aligned}${lettreDepuisChiffre(i + 1)}&=\\dfrac{\\overbrace{${new Array(
            3,
          )
            .fill(
              miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'blue'),
            )
            .join(
              '\\times ',
            )}\\times ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}`, 'green')}}^{4\\text{ fois}}}{\\underbrace{${new Array(
            exp0,
          )
            .fill(
              miseEnEvidence(
                `${base < 0 ? '\\left[' : '('}${ecritureParentheseSiNegatif(base)} \\times ${ecritureParentheseSiNegatif(base)}${base < 0 ? '\\right]' : ')'}`,
                'red',
              ),
            )
            .join('\\times ')}}_{${2 * exp0}\\text{ fois}}}\\\\
          &=\\dfrac{${new Array(4)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(4, 2 * exp0)) return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}{${new Array(2 * exp0)
            .fill(`${ecritureParentheseSiNegatif(base)}`)
            .map((el, i) => {
              if (i < Math.min(2 * exp0, 4)) return `\\cancel{${el}}`
              else return el
            })
            .join('\\times ')}}\\\\
          &=\\dfrac{${
            4 <= 2 * exp0
              ? '1'
              : new Array(4 - 2 * exp0)
                  .fill(`${ecritureParentheseSiNegatif(base)}`)
                  .join('\\times ')
          }}{${
            2 * exp0 <= 4
              ? '1'
              : new Array(2 * exp0 - 4)
                  .fill(`${ecritureParentheseSiNegatif(base)}`)
                  .join('\\times ')
          }}\\\\
          &= ${miseEnEvidence(`${ecritureParentheseSiNegatif(base)}^{${3 + 1 - 2 * exp0}}`)}\\end{aligned}$`

            reponseInteractive = `${ecritureParentheseSiNegatif(base)}^{${3 + 1 - 2 * exp0}}`
            exposantInteractif = 3 + 1 - 2 * exp0
          } while (this.niveau === 4 && 3 + 1 < 2 * exp0)
          break
      }

      if (this.interactif && !context.isAmc) {
        handleAnswers(this, i, {
          reponse: {
            value: reponseInteractive,
            options: { sansExposantUn: exposantInteractif !== 1 },
          },
        })
        texte += ajouteChampTexteMathLive(
          this,
          i,
          KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets,
          {
            texteAvant: sp(2) + '$=$',
          },
        )
      }
      if (context.isAmc) {
        setReponse(this, i, reponseInteractive, {
          formatInteractif: 'puissance',
          basePuissance: base,
          exposantPuissance: exposantInteractif,
        })
      }

      if (this.questionJamaisPosee(i, texte)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this) // Espacement de 2 em entre chaque questions.
  }
}
