import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { fraction } from '../../modules/fractions'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { arrondi } from '../../lib/outils/nombres'
import { amcConvert } from '../../lib/amc/amcBuilders'


export const titre = 'Donner différentes écritures de nombres décimaux'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDeModifImportante = '21/12/2023'

function texFraction(
  numerateur: number | string,
  denominateur: number | string,
) {
  return `\\dfrac{${numerateur}}{${denominateur}}`
}

/**
 * Compléter des égalités sur les nombres décimaux
 * * 1) n/100 = ...+.../10 + .../100
 * * 2) n/100 = ...+.../100 + .../10
 * * 3).../100 = u + d/10 + c/100
 * * 4) u = .../10
 * * 5) u = .../100
 * * 6) n/10 = ... + .../10 + .../100
 * * 7) .../100 = u + d/10
 * @author Rémi Angot
 * 6N23-1
 */
export const uuid = '1acf7'

export const refs = {
  'fr-fr': ['auto6N2B-1'],
  'fr-2016': ['6N23-1'],
  'fr-ch': ['9NO10-11'],
}
export default class ExerciceDifferentesEcrituresNombresDecimaux extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
      'Type de questions',
      [
        'Nombres séparés par des tirets  :',
        '1 : n/100 = ...+.../10 + .../100',
        '2 : n/100 = ...+.../100 + .../10',
        '3 : .../100 = u + d/10 + c/100',
        '4 : u = .../10',
        '5 : u = .../100',
        '6 : n/10 = ... + .../10 + .../100',
        '7 :  .../100 = u + d/10',
        '8 : Mélange',
      ].join('\n'),
    ]
    this.consigne =
      "Compléter les égalités avec une fraction décimale, la décomposition canonique puis l'écriture décimale."
    this.spacing = 2
    this.spacingCorr = 2
    this.nbCols = 2
    this.nbColsCorr = 2
    this.sup = '1-2-3' // Type de question
  }

  nouvelleVersion() {
    let typesDeQuestions
    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      max: 7,
      defaut: 8,
      melange: 8,
      nbQuestions: this.nbQuestions,
      saisie: this.sup,
    }).map(Number)

    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
      cpt++
    ) {
      typesDeQuestions = listeTypeDeQuestions[i]
      const u =
        typesDeQuestions >= 4 && typesDeQuestions <= 5
          ? randint(2, 19)
          : randint(2, 9) // chiffre des unités
      const d =
        typesDeQuestions >= 4 && typesDeQuestions <= 5 ? 0 : randint(1, 9) // chiffre des dixièmes
      const c =
        (typesDeQuestions >= 4 && typesDeQuestions <= 5) ||
        typesDeQuestions === 7
          ? 0
          : randint(1, 9) // chiffre des centièmes
      const n = 100 * u + 10 * d + c
      if (!this.questionJamaisPosee(i, u, d, c)) {
        // Si la question a été posée, on passe
        // et pas la fin de la boucle à cause de indexQ++
        continue
      }
      let ecritureDecimale
      switch (typesDeQuestions) {
        case 1: // n/100 = .... + .../10 + .../100=...
          ecritureDecimale = texNombre(arrondi(u + d / 10 + c / 100, 2))
          texteCorr = `$${fraction(n, 100).texFraction}=${u}+${fraction(d, 10).texFraction}+${fraction(c, 100).texFraction}=${ecritureDecimale}$`
          if (!context.isAmc) {
            const content = `${fraction(n, 100).texFraction}~=~ %{champ1} + \\dfrac{%{champ2}}{10} + \\dfrac{%{champ3}}{100}~=~%{champ4}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [
                listePoints[0] * listePoints[1] * listePoints[2] +
                  listePoints[3],
                2,
              ],
              champ1: { value: u },
              champ2: { value: d },
              champ3: { value: c },
              champ4: { value: arrondi(u + d / 10 + c / 100, 2) },
            })
          } else {
            texte = `$${fraction(n, 100).texFraction}=${context.isAmc ? 'a' : '\\ldots\\ldots'}+${texFraction(context.isAmc ? 'b' : '\\ldots\\ldots', '10')}+${texFraction(context.isAmc ? 'c' : '\\ldots\\ldots', '100')}=${context.isAmc ? 'd' : '\\ldots\\ldots'}$`
            texteCorr = `$${fraction(n, 100).texFraction}=${miseEnEvidence(u)}+${texFraction(miseEnEvidence(d), '10')}+${texFraction(miseEnEvidence(c), '100')}=${miseEnEvidence(ecritureDecimale)}$`
            this.autoCorrectionAMC[i] = {
              enonceAvant: false,
              options: { multicols: true },
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: u,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'b',
                        valeur: d,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'c',
                        valeur: c,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'd',
                        valeur: arrondi(u + d / 10 + c / 100, 2),
                        param: {
                          signe: false,
                          digits: 5,
                          decimals: 3,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }
          break
        case 2: // n/100 = ... + .../100 + .../10
          ecritureDecimale = texNombre(arrondi(u + d / 10 + c / 100, 2))
          texteCorr = `$${texFraction(n, '100')}=${miseEnEvidence(u)}+${texFraction(
            miseEnEvidence(c),
            100,
          )}+${texFraction(miseEnEvidence(d), 10)}=${miseEnEvidence(ecritureDecimale)}$`
          if (!context.isAmc) {
            const content = `${fraction(n, 100).texFraction}~=~ %{champ1} + \\dfrac{%{champ2}}{100} + \\dfrac{%{champ3}}{10}~=~%{champ4}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [
                listePoints[0] * listePoints[1] * listePoints[2] +
                  listePoints[3],
                2,
              ],
              champ1: { value: u },
              champ3: { value: d },
              champ2: { value: c },
              champ4: { value: arrondi(u + d / 10 + c / 100, 2) },
            })
          } else {
            texte = `$${texFraction(n, '100')}=${context.isAmc ? 'a' : '\\ldots\\ldots'}+${texFraction(
              context.isAmc ? 'b' : '\\ldots\\ldots',
              100,
            )}+${texFraction(context.isAmc ? 'c' : '\\ldots\\ldots', 10)}=${context.isAmc ? 'd' : '\\ldots\\ldots'}$`
            this.autoCorrectionAMC[i] = {
              options: { multicols: true },
              enonceAvant: false,
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: u,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'b',
                        valeur: c,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'c',
                        valeur: d,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'd',
                        valeur: arrondi(u + d / 10 + c / 100, 2),
                        param: {
                          signe: false,
                          digits: 5,
                          decimals: 3,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }

          break
        case 3: // .../... = u + d/10 + c/100=...
          ecritureDecimale = texNombre(arrondi(u + d / 10 + c / 100, 2))
          texteCorr = `$${texFraction(miseEnEvidence(n), '100')}=${u}+${texFraction(
            d,
            '10',
          )}+${texFraction(c, '100')}=${miseEnEvidence(ecritureDecimale)}$`
          if (!context.isAmc) {
            const content = `\\dfrac{%{champ1}}{%{champ2}}~=~ ${u} + \\dfrac{${d}}{10} + \\dfrac{${c}}{100}~=~%{champ3}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [
                listePoints[0] * listePoints[1] + listePoints[2],
                2,
              ],
              champ1: { value: n },
              champ2: { value: 100 },
              champ3: { value: arrondi(u + d / 10 + c / 100, 2) },
            })
          } else {
            texte = `$${texFraction(context.isAmc ? 'a' : '\\ldots\\ldots', '100')}=${u}+${texFraction(
              d,
              '10',
            )}+${texFraction(c, '100')}=${context.isAmc ? 'b' : '\\ldots\\ldots'}$`
            this.autoCorrectionAMC[i] = {
              options: { multicols: true },
              enonceAvant: false,
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: n,
                        param: {
                          signe: false,
                          digits: 4,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'b',
                        valeur: arrondi(u + d / 10 + c / 100, 2),
                        param: {
                          signe: false,
                          digits: 5,
                          decimals: 3,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }
          break
        case 4: // u = .../10
          texteCorr = `$${u}=${texFraction(miseEnEvidence(10 * u), '10')}$`
          if (!context.isAmc) {
            const content = `${u}~=~\\dfrac{%{champ1}}{10}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [listePoints[0] * 2, 2],
              champ1: { value: u * 10 },
            })
          } else {
            texte = `$${u}=${texFraction(context.isAmc ? 'a' : '\\ldots\\ldots', '10')}$`
            this.autoCorrectionAMC[i] = {
              enonceAvant: false,
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: arrondi(10 * u, 2),
                        param: {
                          signe: false,
                          digits: 3,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }

          break
        case 5: // u = .../100
          texteCorr = `$${u}=${texFraction(miseEnEvidence(100 * u), '100')}$`
          if (!context.isAmc) {
            const content = `${u}~=~\\dfrac{%{champ1}}{100}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [listePoints[0] * 2, 2],
              champ1: { value: u * 100 },
            })
          } else {
            texte = `$${u}=${texFraction(context.isAmc ? 'a' : '\\ldots\\ldots', '100')}$`
            this.autoCorrectionAMC[i] = {
              enonceAvant: false,
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: arrondi(100 * u, 2),
                        param: {
                          signe: false,
                          digits: 3,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }
          break
        case 6: // n/10 = ... + .../10 + .../100 = ...
          ecritureDecimale = texNombre(arrondi(n / 10, 1))
          texteCorr = `$${texFraction(n, 10)}=${miseEnEvidence(u * 10 + d)}+${texFraction(miseEnEvidence(c), 10)}+${texFraction(miseEnEvidence(0), 100)}=${miseEnEvidence(ecritureDecimale)}$`
          if (!context.isAmc) {
            const content = `\\dfrac{${n}}{10}~=~ %{champ1} + \\dfrac{%{champ2}}{10} + \\dfrac{%{champ3}}{100}~=~%{champ4}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [
                listePoints[0] * listePoints[1] * listePoints[2] +
                  listePoints[3],
                2,
              ],
              champ1: { value: u * 10 + d },
              champ2: { value: c },
              champ3: { value: 0 },
              champ4: { value: arrondi(u * 10 + d + c / 10, 2) },
            })
          } else {
            texte = `$${texFraction(n, 10)}=${context.isAmc ? 'a' : '\\ldots\\ldots'}+${texFraction(context.isAmc ? 'b' : '\\ldots\\ldots', 10)}+${texFraction(context.isAmc ? 'c' : '\\ldots\\ldots', 100)}=${context.isAmc ? 'd' : '\\ldots\\ldots'}$`
            this.autoCorrectionAMC[i] = {
              options: { multicols: true },
              enonceAvant: false,
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: arrondi(u * 10 + d, 2),
                        param: {
                          signe: false,
                          digits: 3,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'b',
                        valeur: c,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'c',
                        valeur: 0,
                        param: {
                          signe: false,
                          digits: 1,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'd',
                        valeur: arrondi(n / 10, 1),
                        param: {
                          signe: false,
                          digits: 5,
                          decimals: 3,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }
          break
        case 7: // .../100 = u + d/10 =...
        default:
          ecritureDecimale = texNombre(arrondi(u + d / 10, 1))
          texteCorr = `$${texFraction(miseEnEvidence(n), '100')}=${u}+${texFraction(d, '10')}=${miseEnEvidence(ecritureDecimale)}$`
          if (!context.isAmc) {
            const content = `\\dfrac{%{champ1}}{100}~=~ ${u} + \\dfrac{${d}}{10}~=~%{champ2}`
            texte = remplisLesBlancs(
              this,
              i,
              content,
              'fillInTheBlank',
              '\\ldots\\ldots',
            )
            handleAnswers(this, i, {
              bareme: (listePoints) => [listePoints[0] + listePoints[1], 2],
              champ1: { value: n },
              champ2: { value: arrondi(u + d / 10, 1) },
            })
          } else {
            texte = `$${texFraction(context.isAmc ? 'a' : '\\ldots\\ldots', '100')}=${u}+${texFraction(d, '10')}=${context.isAmc ? 'b' : '\\ldots\\ldots'}$`
            this.autoCorrectionAMC[i] = {
              options: { multicols: true },
              enonceAvant: false,
              propositions: [
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: texteCorr,
                      reponse: {
                        texte: texte + '<br>a',
                        valeur: n,
                        param: {
                          signe: false,
                          digits: 4,
                          decimals: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',

                  propositions: [
                    {
                      texte: '',
                      reponse: {
                        texte: 'b',
                        valeur: arrondi(u + d / 10 + c / 100, 2),
                        param: {
                          signe: false,
                          digits: 5,
                          decimals: 3,
                        },
                      },
                    },
                  ],
                },
              ],
            }
            this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
          }
          break
      }

      // if (this.questionJamaisPosee(i, u, d, c)) {
      // Si la question n'a jamais été posée, on en crée une autre
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
      i++
    }
    listeQuestionsToContenu(this)
  }
}
