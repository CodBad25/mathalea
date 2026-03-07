/**
 * ⚠️ Cet exercice est utilisé dans le test : tests/e2e/tests/view/view.capytale.save3L11-2.test.ts ⚠️
 */

import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  ecritureParentheseSiNegatif,
  rienSi1,
} from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { lettreDepuisChiffre } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenuSansNumero,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Réduire une expression'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcType = 'AMCHybride'
export const amcReady = true
export const dateDeModifImportante = '06/02/2024'

/**
 * Réduire des expressions lorsque c'est possible
 *
 * @author Rémi Angot (Amélioration AMC par Eric Elter)
 */
export const uuid = 'f6853'

export const refs = {
  'fr-fr': ['3L11-2', 'BP2AutoI10', '3AutoN11-1'],
  'fr-ch': ['10FA1-13'],
}
export default class ReductionSiPossible extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = ['On peut toujours réduire.']
    this.besoinFormulaire2CaseACocher = [
      'Présentation des corrections en colonnes',
      false,
    ]
    this.besoinFormulaire3Texte = [
      'Type de questions',
      [
        'Nombres séparés par des tirets  :',
        '1 : ax+b',
        '2 : ax+bx',
        '3 : ax+bx²',
        '4 : ax*b',
        '5 : b*ax',
        '6 : ax+b+cx+d',
        '7 : b+ax+d+cx',
        '8 : ax+b+x',
        '9 : Mélange',
      ].join('\n'),
    ]
    this.nbQuestions = 5

    this.spacing = context.isHtml ? 3 : 2
    this.spacingCorr = context.isHtml ? 3 : 2

    this.sup = false
    this.sup2 = false
    this.sup3 = 9
    this.listeAvecNumerotation = false
  }

  nouvelleVersion() {
    this.consigne =
      this.nbQuestions > 1
        ? 'Réduire les expressions suivantes, si cela est possible.'
        : "Réduire l'expression suivante, si cela est possible."

    const exclus = []
    if (this.sup) {
      exclus.push(1)
      exclus.push(3)
    }
    if (context.isAmc) {
      exclus.push(3)
    }

    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      nbQuestions: this.nbQuestions,
      saisie: this.sup3,
      max: 8,
      melange: 9,
      defaut: 2,
      exclus,
    })

    // const listeTypeDeQuestions = combinaisonListes(typesDeQuestionsDisponibles, this.nbQuestions) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    for (
      let i = 0, reponse, coeffa, constb, a, b, c, d, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      let texte = ''
      let texteCorr = ''
      reponse = ''
      coeffa = 0
      constb = 0
      a = randint(-11, 11, 0)
      b = randint(-11, 11, [0, a])
      c = randint(-11, 11, [0])
      d = randint(-11, 11, 0)
      switch (listeTypeDeQuestions[i]) {
        case 1: // 'ax+b':
          texte = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebrique(b)}$`
          texteCorr = texte
          reponse = [
            `${rienSi1(a)}x${ecritureAlgebrique(b)}`,
            `${b}${ecritureAlgebriqueSauf1(a)}x`,
          ]
          coeffa = a
          constb = b
          break
        case 2: // 'ax+bx':
          texte = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebriqueSauf1(b)}x$`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebriqueSauf1(b)}x=${rienSi1(a + b)}x$`
          reponse = `${rienSi1(a + b)}x`
          coeffa = a + b
          constb = 0
          break
        case 3: // 'ax+bx2':
          texte = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebriqueSauf1(b)}x^2$`
          texteCorr = texte
          reponse = [
            `${rienSi1(a)}x${ecritureAlgebriqueSauf1(b)}x^2`,
            `${b}x^2${ecritureAlgebriqueSauf1(a)}x`,
          ]
          // celui-ci ne peut pas être choisi pour AMC
          break
        case 4: // 'ax*b':
          texte = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x\\times ${ecritureParentheseSiNegatif(b)}$`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x\\times ${ecritureParentheseSiNegatif(b)}=${rienSi1(a * b)}x$`
          reponse = `${rienSi1(a * b)}x`
          coeffa = a * b
          constb = 0
          break
        case 5: // 'b*ax':
          a = randint(1, 11)
          texte = `$${lettreDepuisChiffre(i + 1)}=${b}\\times ${rienSi1(a)}x$`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${b}\\times ${rienSi1(a)}x=${rienSi1(b * a)}x$`
          reponse = `${rienSi1(b * a)}x`
          coeffa = a * b
          constb = 0
          break
        case 6: // 'ax+b+cx+d':
          texte = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebrique(b)}${ecritureAlgebriqueSauf1(c)}x${ecritureAlgebrique(d)}$`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebrique(b)}${ecritureAlgebriqueSauf1(c)}x${ecritureAlgebrique(d)}`
          if (b + d === 0) {
            if (a + c === 0) {
              texteCorr += '=0$'
              reponse = 0
              coeffa = 0
              constb = 0
            } else {
              texteCorr += `=${rienSi1(a + c)}x$`
              reponse = `${rienSi1(a + c)}x`
              coeffa = a + c
              constb = 0
            }
          } else {
            if (a + c === 0) {
              texteCorr += `=${b + d}$`
              reponse = b + d
              constb = b + d
              coeffa = 0
            } else {
              texteCorr += `=${rienSi1(a + c)}x${ecritureAlgebrique(b + d)}$`
              reponse = [
                `${rienSi1(a + c)}x${ecritureAlgebrique(b + d)}`,
                `${b + d}${ecritureAlgebriqueSauf1(a + c)}x`,
              ]
              coeffa = a + c
              constb = b + d
            }
          }
          break
        case 7: // 'b+ax+d+cx':
          texte = `$${lettreDepuisChiffre(i + 1)}=${b}${ecritureAlgebriqueSauf1(a)}x${ecritureAlgebrique(d)}${ecritureAlgebriqueSauf1(c)}x$`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${b}${ecritureAlgebriqueSauf1(a)}x${ecritureAlgebrique(d)}${ecritureAlgebriqueSauf1(c)}x`
          if (b + d === 0) {
            if (a + c === 0) {
              texteCorr += '=0$'
              reponse = 0
              coeffa = 0
              constb = 0
            } else {
              texteCorr += `=${rienSi1(a + c)}x$`
              reponse = `${rienSi1(a + c)}x`
              coeffa = a + c
              constb = 0
            }
          } else {
            if (a + c === 0) {
              texteCorr += `=${b + d}$`
              reponse = b + d
              coeffa = 0
              constb = b + d
            } else {
              texteCorr += `=${rienSi1(a + c)}x${ecritureAlgebrique(b + d)}$`
              reponse = [
                `${rienSi1(a + c)}x${ecritureAlgebrique(b + d)}`,
                `${b + d}${ecritureAlgebriqueSauf1(a + c)}x`,
              ]
              coeffa = a + c
              constb = b + d
            }
          }
          break
        case 8: // 'ax+b+x':
          a = randint(-11, 11, [0, -1])
          texte = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebrique(b)}+x$`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${rienSi1(a)}x${ecritureAlgebrique(b)}+x=${rienSi1(a + 1)}x${ecritureAlgebrique(b)}$`
          reponse = [
            `${rienSi1(a + 1)}x${ecritureAlgebrique(b)}`,
            `${b}${ecritureAlgebriqueSauf1(a + 1)}x`,
          ]
          coeffa = a + 1
          constb = b
          break
      }
      // EE : Permet en deux lignes de mettre toutes les réponses attendues en couleur
      // const aMettreEnCouleur = miseEnEvidence(texteCorr.split('=').pop().replace('$', '')) + '$'
      // texteCorr = texteCorr.replace(texteCorr.split('=').pop(), '') + aMettreEnCouleur
      const lastPart = texteCorr.split('=').pop()
      if (lastPart !== undefined) {
        const aMettreEnCouleur = miseEnEvidence(lastPart.replace('$', '')) + '$'
        texteCorr = texteCorr.replace(lastPart, '') + aMettreEnCouleur
      }

      if (this.sup2) {
        // On découpe
        const etapes = texteCorr.split('=')
        texteCorr = ''
        etapes.forEach(function (etape) {
          etape = etape.replace('$', '')
          texteCorr +=
            etape === lettreDepuisChiffre(i + 1)
              ? ''
              : `$${lettreDepuisChiffre(i + 1)} = ${etape}$<br>`
        })
      }

      if (!context.isAmc) {
        handleAnswers(this, i, {
          reponse: {
            value: reponse,
            options: { expressionsForcementReduites: true },
          },
        })
        texte += this.interactif
          ? `<br>$${lettreDepuisChiffre(i + 1)} = $` +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBaseAvecVariable,
            )
          : ''
      } else {
        this.autoCorrection[i] = {
          enonce: '',
          enonceAvant: false,
          options: { multicols: true, barreseparation: true },
          propositions: [
            {
              type: 'AMCOpen',
              propositions: [
                {
                  texte: texteCorr,
                  enonce: texte + '<br>',
                  statut: 4,
                },
              ],
            },
            {
              type: 'AMCNum',
              propositions: [
                {
                  texte: '',
                  statut: '',
                  reponse: {
                    texte: 'valeur de $a$ dans $ax+b$',
                    valeur: [coeffa],
                    param: {
                      digits: 2,
                      decimals: 0,
                      signe: true,
                      approx: 0,
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
                  statut: '',
                  reponse: {
                    texte: 'valeur de $b$ dans $ax+b$',
                    valeur: [constb],
                    param: {
                      digits: 2,
                      decimals: 0,
                      signe: true,
                      approx: 0,
                    },
                  },
                },
              ],
            },
          ],
        }
      }

      if (this.questionJamaisPosee(i, a, b, c, d)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenuSansNumero(this)
  }
}
