import { propositionsQcm } from '../../../lib/interactif/qcm'
import { choice } from '../../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'
export const titre =
  'Utiliser une fonction de référence (inverse, cube, racine) pour comparer deux images'
export const interactifReady = true
export const interactifType = 'qcm'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '03/01/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/

export const uuid = '25143'

export const refs = {
  'fr-fr': ['can2F12'],
  'fr-ch': ['NR'],
}
export default class ComparerAvecFctRef extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1

    this.spacing = 1.2
  }

  nouvelleVersion() {
    let texte, texteCorr, a, b, N, props
    for (let i = 0; i < this.nbQuestions; ) {
      N = randint(1, 2)
      switch (
        choice([1, 2, 3]) //
      ) {
        case 1:
          if (N === 1) {
            a = randint(1, 9) + randint(5, 9) / 10
            b = a + (randint(1, 9) / 10) * choice([1, -1])
            texte = 'Sélectionner l’affirmation correcte. '
            if (a < b) {
              this.autoCorrection[i] = {
                enonce: texte,

                propositions: [
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}>\\dfrac{1}{${texNombre(b)}}$`,
                    statut: true,
                  },
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}<\\dfrac{1}{${texNombre(b)}}$`,
                    statut: false,
                  },
                ],
              }
            } else {
              this.autoCorrection[i] = {
                enonce: texte,

                propositions: [
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}<\\dfrac{1}{${texNombre(b)}}$`,
                    statut: true,
                  },
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}>\\dfrac{1}{${texNombre(b)}}$`,
                    statut: false,
                  },
                ],
              }
            }

            props = propositionsQcm(this, i)
            if (this.interactif) texte += props.texte
            else {
              texte = `Comparer $\\dfrac{1}{${texNombre(a)}}$ et $\\dfrac{1}{${texNombre(b)}}$.`
            }

            texteCorr = `         La fonction inverse étant strictement décroissante sur $]0;+\\infty[$, elle change l'ordre.
        Cela signifie que deux nombres strictement positifs  sont rangés dans l'ordre inverse de leurs inverses.<br>
        Autrement dit, si $a$ et $b$ sont deux nombres strictement positifs et si $a < b$, alors $\\dfrac{1}{a} > \\dfrac{1}{b}$.<br>`

            if (a < b) {
              texteCorr += `Comme $${texNombre(a)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(b)}$, alors  $\\dfrac{1}{${texNombre(a)}}${miseEnEvidence('\\boldsymbol{>}', 'blue')}\\dfrac{1}{${texNombre(b)}}$`
            } else {
              texteCorr += `Comme $${texNombre(b)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(a)}$, alors  $\\dfrac{1}{${texNombre(b)}}${miseEnEvidence('\\boldsymbol{>}', 'blue')}\\dfrac{1}{${texNombre(a)}}$`
            }
          } else {
            a = (randint(1, 9) + randint(5, 9) / 10) * -1
            b = a + (randint(1, 9) / 10) * choice([1, -1])
            texte = 'Sélectionner l’affirmation correcte. '
            if (a < b) {
              this.autoCorrection[i] = {
                enonce: texte,

                propositions: [
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}>\\dfrac{1}{${texNombre(b)}}$`,
                    statut: true,
                  },
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}<\\dfrac{1}{${texNombre(b)}}$`,
                    statut: false,
                  },
                ],
              }
            } else {
              this.autoCorrection[i] = {
                enonce: texte,

                propositions: [
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}<\\dfrac{1}{${texNombre(b)}}$`,
                    statut: true,
                  },
                  {
                    texte: `$\\dfrac{1}{${texNombre(a)}}>\\dfrac{1}{${texNombre(b)}}$`,
                    statut: false,
                  },
                ],
              }
            }

            props = propositionsQcm(this, i)
            if (this.interactif) texte += props.texte
            else {
              texte = `Comparer $\\dfrac{1}{${texNombre(a)}}$ et $\\dfrac{1}{${texNombre(b)}}$.`
            }

            texteCorr = `     La fonction inverse étant strictement décroissante sur $]-\\infty;0[$, elle change l'ordre.
    Cela signifie que deux nombres strictement négatifs  sont rangés dans l'ordre inverse de leurs inverses.<br>
    Autrement dit, si $a$ et $b$ sont deux nombres strictement négatifs et si $a < b$, alors $\\dfrac{1}{a} > \\dfrac{1}{b}$.<br>`

            if (a < b) {
              texteCorr += `Comme $${texNombre(a)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(b)}$, alors  $\\dfrac{1}{${texNombre(a)}}${miseEnEvidence('\\boldsymbol{>}', 'blue')}\\dfrac{1}{${texNombre(b)}}$`
            } else {
              texteCorr += `Comme $${texNombre(b)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(a)}$, alors  $\\dfrac{1}{${texNombre(b)}}${miseEnEvidence('\\boldsymbol{>}', 'blue')}\\dfrac{1}{${texNombre(a)}}$`
            }
          }
          this.canEnonce = `Comparer $\\dfrac{1}{${texNombre(a)}}$ et $\\dfrac{1}{${texNombre(b)}}$.`

          break
        case 2:
          a = randint(-10, 10) + (randint(-9, 9, 0) / 10) * choice([-1, 1])
          b = (a + randint(1, 9) / 10) * choice([-1, 1])
          texte = 'Sélectionner l’affirmation correcte. '
          if (a < b) {
            this.autoCorrection[i] = {
              enonce: texte,

              propositions: [
                {
                  texte: `$${ecritureParentheseSiNegatif(b)}^3>${ecritureParentheseSiNegatif(a)}^3$`,
                  statut: true,
                },
                {
                  texte: `$${ecritureParentheseSiNegatif(a)}^3>${ecritureParentheseSiNegatif(b)}^3$`,
                  statut: false,
                },
              ],
            }
          } else {
            this.autoCorrection[i] = {
              enonce: texte,

              propositions: [
                {
                  texte: `$${ecritureParentheseSiNegatif(b)}^3<${ecritureParentheseSiNegatif(a)}^3$`,
                  statut: true,
                },
                {
                  texte: `$(${ecritureParentheseSiNegatif(a)})^3<${ecritureParentheseSiNegatif(b)}^3$`,
                  statut: false,
                },
              ],
            }
          }

          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Comparer $${ecritureParentheseSiNegatif(a)}^3$ et $${ecritureParentheseSiNegatif(b)}^3$.`
          }

          texteCorr = ` La fonction cube étant strictement croissante sur $\\mathbb{R}$, elle conserve l'ordre.
            Cela signifie que deux nombres réels  sont rangés dans le même ordre que leurs cubes.<br>
            Autrement dit, si $a$ et $b$ sont deux nombres réels et si $a < b$, alors $a^3 < b^3$.<br>`
          if (a < b) {
            texteCorr += `Comme $${texNombre(a)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(b)}$,
            alors $${ecritureParentheseSiNegatif(a)}^3${miseEnEvidence('\\boldsymbol{<}', 'blue')}${ecritureParentheseSiNegatif(b)}^3$.`
          } else {
            texteCorr += `Comme $${texNombre(b)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(a)}$, alors $${ecritureParentheseSiNegatif(b)}^3${miseEnEvidence('\\boldsymbol{<}', 'blue')}${ecritureParentheseSiNegatif(a)}^3$.`
          }
          this.canEnonce = `Comparer $${ecritureParentheseSiNegatif(a)}^3$ et $${ecritureParentheseSiNegatif(b)}^3$.`

          break
        case 3:
        default:
          a = randint(0, 10) + randint(6, 9) / 10
          b = a + (randint(1, 5, 0) / 10) * choice([-1, 1])
          if (b === 1) {
            b = 2
          }
          texte = 'Sélectionner l’affirmation correcte. '
          if (a < b) {
            this.autoCorrection[i] = {
              enonce: texte,

              propositions: [
                {
                  texte: `$\\sqrt{${texNombre(b)}}>\\sqrt{${texNombre(a)}}$`,
                  statut: true,
                },
                {
                  texte: `$\\sqrt{${texNombre(a)}}>\\sqrt{${texNombre(b)}}$`,
                  statut: false,
                },
              ],
            }
          } else {
            this.autoCorrection[i] = {
              enonce: texte,

              propositions: [
                {
                  texte: `$\\sqrt{${texNombre(b)}}<\\sqrt{${texNombre(a)}}$`,
                  statut: true,
                },
                {
                  texte: `$\\sqrt{${texNombre(b)}}>\\sqrt{${texNombre(a)}}$`,
                  statut: false,
                },
              ],
            }
          }

          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Comparer $\\sqrt{${texNombre(a)}}$  et $\\sqrt{${texNombre(b)}}$.`
          }

          texteCorr = `                La fonction racine carrée étant strictement croissante sur $[0;+\\infty[$, elle conserve l'ordre.
                Cela signifie que deux nombres réels positifs sont rangés dans le même ordre que leurs racines carrées.<br>
                Autrement dit, si $a$ et $b$ sont deux nombres réels positifs et si $a < b$, alors $\\sqrt{a} < \\sqrt{b}$.<br>`
          if (a < b) {
            texteCorr += ` Comme $${texNombre(a)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(b)}$, alors
                $\\sqrt{${texNombre(a)}}${miseEnEvidence('\\boldsymbol{<}', 'blue')}\\sqrt{${texNombre(b)}}$.`
          } else {
            texteCorr += ` Comme $${texNombre(b)}${miseEnEvidence('\\boldsymbol{<}', 'blue')}${texNombre(a)}$,
                alors $\\sqrt{${texNombre(b)}}${miseEnEvidence('\\boldsymbol{<}', 'blue')}\\sqrt{${texNombre(a)}}$.`
          }
          this.canEnonce = `Comparer $\\sqrt{${texNombre(a)}}$  et $\\sqrt{${texNombre(b)}}$.`

          break
      }
      if (this.questionJamaisPosee(i, N, a, b)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
    }

    listeQuestionsToContenu(this)
  }
}
