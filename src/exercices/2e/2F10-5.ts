import { courbe } from '../../lib/2d/Courbe'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { MetaInteractif2d } from '../../lib/2d/interactif2d'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { labelPoint, texteParPosition } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteFeedback } from '../../lib/interactif/questionMathLive'
import {
  creerTableauHtml,
  tableauDeVariation,
} from '../../lib/mathFonctions/etudeFonction'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  reduireAxPlusB,
  rienSi1,
} from '../../lib/outils/ecritures'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { sp } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import FractionEtendue from '../../modules/FractionEtendue'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
import { bleuMathalea } from '../../lib/colors'

export const dateDeModifImportante = '25/01/2026' // Mise en place de MetaInteractif2d par Jean-claude Lhote
export const titre = "Déterminer le signe d'une fonction affine"
export const interactifReady = true
export const interactifType = 'MetaInteractif2d'

/**
 * @author Stéphane Guyon+Gilles Mora
 * Lintage typescript incomplet car tableauDeVariation n'est pas typé Jean-claude Lhote
 * 2F10-3
 */
export const uuid = '03b71'

export const refs = {
  'fr-fr': ['2F10-5'],
  'fr-ch': ['11FA8-28'],
}
export default class Signefonctionaffine extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Type de questions ',
      3,
      '1 : Valeurs entières\n2 : Valeurs fractionnaires\n3 : Mélange',
    ]
    this.besoinFormulaire2Numerique = [
      'Choix des corrections',
      2,
      "1 : En utilisant le sens de variation d'une fonction affine\n2 : En utilisant le calcul",
    ]

    this.nbQuestions = 1 // On complète le nb de questions

    this.sup = 1
    this.sup2 = 1
    this.correctionDetaillee = false
  }

  nouvelleVersion() {
    const listeFractions = [
      [10, 9],
      [2, 3],
      [3, 4],
      [3, 5],
      [4, 5],
      [5, 6],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 7],
      [3, 8],
      [5, 8],
      [7, 8],
      [4, 9],
      [5, 9],
      [7, 9],
      [8, 9],
      [7, 10],
      [9, 10],
      [5, 3],
      [7, 3],
      [9, 4],
      [5, 4],
      [6, 5],
      [7, 5],
      [7, 4],
      [10, 9],
      [8, 7],
      [8, 3],
      [11, 7],
      [7, 6],
      [10, 3],
    ]
    let typesDeQuestionsDisponibles: number[] = []
    const valeursDeB = combinaisonListes(
      [-3, -2, -1, 0, 1, 2, 3],
      this.nbQuestions,
    )
    if (this.sup === 1) {
      typesDeQuestionsDisponibles = [1] // coef de x = 1
    } else if (this.sup === 2) {
      typesDeQuestionsDisponibles = [2] // coef de x > 1
    } else {
      typesDeQuestionsDisponibles = [1, 2] // coef de x positif, difference au carrée.
    }
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const b = valeursDeB[i]
      let texte = ''
      let texteCorr = ''
      const typesDeQuestions = listeTypeDeQuestions[i]
      const variables: number[] = []
      switch (typesDeQuestions) {
        case 1:
          {
            const o = texteParPosition('O', -0.3, -0.3, 0, 'black', 1)
            const a = randint(1, 5) * choice([-1, 1])
            const zero = new FractionEtendue(-b, a).simplifie()
            texte = `${context.isHtml ? 'Compléter' : 'Dresser'} le tableau de signes de la fonction $f$ définie sur $\\mathbb R$ par $f(x)=${reduireAxPlusB(a, b)}$.`
            if (context.isHtml) {
              texteCorr = `${texteEnCouleurEtGras('Dans cet exercice, deux corrections différentes sont proposées.')}<br>`
            } else {
              texteCorr = ''
            }
            if (this.sup2 === 1) {
              texteCorr += `$f(x)$ est de la forme $ax+b$, $f$ est donc une fonction affine avec pour coefficient directeur  $a=${a}$ ${a < 0 ? ' (négatif).' : ' (positif).'}<br>
             D'où, $f$ est une fonction ${a < 0 ? ' décroissante,' : ' croissante,'} c'est-à-dire que lorsque $x$ augmente, $f(x)$ ${a < 0 ? ' diminue.' : ' augmente.'} <br>
             Par conséquent, les valeurs de $f(x)$ sont d'abord ${a < 0 ? 'positives' : 'négatives'} puis ${a < 0 ? 'négatives' : 'positives'}.<br><br>
             Aussi, $${reduireAxPlusB(a, b)}=0 \\iff x=${zero.texFSD}$.<br><br>`
            }
            if (this.sup2 === 2) {
              texteCorr += `Résolution de l'inéquation $${reduireAxPlusB(a, b)}>0$ : <br>`
              if (b === 0) {
                texteCorr += `$\\begin{aligned}
${reduireAxPlusB(a, b)}&>0\\\\
${a !== 1 ? `x& ${a < 0 ? `${miseEnEvidence(`${sp(1.5)}\\boldsymbol{<}${sp(1.5)}`)}` : '>'}${zero.texFSD}` : ''}${a < 0 ? `${miseEnEvidence(`${sp(5)}\\text{car} ${a} <0`)}` : ''}
\\end{aligned}$<br>`
                texteCorr += `De plus, $${reduireAxPlusB(a, b)}=0\\iff x=${zero.texFSD}$.<br><br>`
              } else {
                texteCorr += `$\\begin{aligned}
  ${reduireAxPlusB(a, b)}&>0\\\\
  ${rienSi1(a)}x&>${-b}\\\\
  ${a !== 1 ? `x& ${a < 0 ? `${miseEnEvidence(`${sp(1.5)}\\boldsymbol{<}${sp(1.5)}`)}` : '>'}${zero.texFSD}` : ''}${a < 0 ? `${miseEnEvidence(`${sp(5)}\\text{car} ${a} <0`)}` : ''}
  \\end{aligned}$<br>`
                texteCorr += `De plus, $${reduireAxPlusB(a, b)}=0\\iff x=${zero.texFSD}$.<br><br>`
              }
            }
            let ligne1
            if (a > 0) {
              ligne1 = ['Line', 25, '', 0, '-', 20, 'z', 20, '+']
            } else {
              ligne1 = ['Line', 25, '', 0, '+', 20, 'z', 20, '-']
            }
            texteCorr += " D'où le tableau de signes suivant :<br>"
            texteCorr += tableauDeVariation({
              tabInit: [
                [
                  // Première colonne du tableau avec le format [chaine d'entête, hauteur de ligne, nombre de pixels de largeur estimée du texte pour le centrage]
                  ['$x$', 3, 25],
                  [`$f(x)=${reduireAxPlusB(a, b)}$`, 2, 50],
                ],
                // Première ligne du tableau avec chaque antécédent suivi de son nombre de pixels de largeur estimée du texte pour le centrage
                ['$-\\infty$', 20, `$${zero.texFSD}$`, 20, '$+\\infty$', 30],
              ],
              // tabLines ci-dessous contient les autres lignes du tableau.
              tabLines: [ligne1],
              espcl: 3.5, // taille en cm entre deux antécédents
              deltacl: 0.8, // distance entre la bordure et les premiers et derniers antécédents
              lgt: 8, // taille de la première colonne en cm
              hauteurLignes: [15, 15],
            })

            // On rédcupère les objets Mathalea2d du tableau de signes
            const objetsTableau = creerTableauHtml({
              tabInit: [
                [
                  // Première colonne du tableau avec le format [chaine d'entête, hauteur de ligne, nombre de pixels de largeur estimée du texte pour le centrage]
                  ['$x$', 3, 25],
                  [`$f(x)=${reduireAxPlusB(a, b)}$`, 2, 50],
                ],
                // Première ligne du tableau avec chaque antécédent suivi de son nombre de pixels de largeur estimée du texte pour le centrage
                ['$-\\infty$', 20, '', 20, '$+\\infty$', 30],
              ],
              // tabLines ci-dessous contient les autres lignes du tableau.
              tabLines: [['Line', 25, '', 0, '', 20, 'z', 20, '']],
              espcl: 3.5, // taille en cm entre deux antécédents
              deltacl: 0.8, // distance entre la bordure et les premiers et derniers antécédents
              lgt: 8, // taille de la première colonne en cm
            })
            // On crée l'interactif MetaInteractif2d
            const inputs = new MetaInteractif2d(
              [
                {
                  x: 12.2,
                  y: -1.5,
                  content: '%{champ1}',
                  classe: KeyboardType.clavierDeBaseAvecFraction,
                  blanc: '\\ldots',
                  opacity: 1,
                  index: 0,
                },
                {
                  x: 10,
                  y: -4,
                  content: '%{champ1}',
                  classe: KeyboardType.clavierDeBaseAvecFraction,
                  blanc: '\\ldots',
                  opacity: 1,
                  index: 1,
                },
                {
                  x: 14.4,
                  y: -4,
                  content: '%{champ1}',
                  classe: KeyboardType.clavierDeBaseAvecFraction,
                  blanc: '\\ldots',
                  opacity: 1,
                  index: 2,
                },
              ],
              {
                exercice: this,
                question: i,
              },
            )
            objetsTableau.push(inputs)
            // On gère les réponses
            handleAnswers(
              this,
              i,
              {
                field0: { value: zero.texFSD },
                field1: { value: a < 0 ? '+' : '-' },
                field2: { value: a < 0 ? '-' : '+' },
              },
              { formatInteractif: 'MetaInteractif2d' },
            )
            // On ajoute le tableau, le span pour le résultat et le div pour le feedback
            if (context.isHtml) {
              texte +=
                mathalea2d(
                  Object.assign({}, fixeBordures(objetsTableau)),
                  objetsTableau,
                ) +
                (this.interactif
                  ? `<span id="resultatCheckEx${this.numeroExercice}Q${i}"></span>` +
                    ajouteFeedback(this, i)
                  : '')
            }
            const f = (x: number) => a * x + b
            const monRepere = repere({
              xMin: -8,
              xMax: 8,
              yMin: -7,
              yMax: 7,
              yLabelEcart: 0.8,
              yLabelDistance: 2,
              xLabelDistance: 2,
              grilleX: false,
              grilleY: false,
              grilleSecondaire: true,
              grilleSecondaireYDistance: 1,
              grilleSecondaireXDistance: 1,
              grilleSecondaireYMin: -7,
              grilleSecondaireYMax: 7,
              grilleSecondaireXMin: -8,
              grilleSecondaireXMax: 8,
            })
            const maCourbe = courbe(f, { repere: monRepere, color: bleuMathalea })
            const A = pointAbstrait(-b / a, 0, '')

            const lA = labelPoint(A, 'red')
            const tA = tracePoint(A, 'red') // Variable qui trace les points avec une croix
            tA.taille = 5
            tA.epaisseur = 5
            const objets = []
            objets.push(maCourbe, lA, monRepere, o, tA)
            texteCorr +=
              `<br>Sur la figure ci-dessous, l'abscisse du point rouge est $${zero.texFSD}$.<br>
            ` +
              mathalea2d(
                {
                  xmin: -8,
                  xmax: 8,
                  ymin: -7,
                  ymax: 7,
                  scale: 0.5,
                  style: 'margin: auto',
                },
                objets,
              )
            variables.push(a, b)
          }
          break

        case 2:
          {
            const o = texteParPosition('O', -0.3, -0.3, 0, 'black', 1)
            const fraction = choice(listeFractions)
            const ns = fraction[0] * choice([-1, 1])
            const ds = fraction[1]
            const a = new FractionEtendue(ns, ds).simplifie()
            const aInverse = new FractionEtendue(ns, ds).simplifie().inverse()
            const zero = new FractionEtendue(-b * ds, ns).simplifie()
            texte = `${context.isHtml ? 'Compléter' : 'Dresser'} le tableau de signes de la fonction $f$ définie sur $\\mathbb R$ par ${b === 0 ? `$f(x)=${a.texFSD}x$` : `$f(x)=${a.texFSD}x${ecritureAlgebrique(b)}$`}. <br>`
            if (context.isHtml) {
              texteCorr = `${texteEnCouleurEtGras('Dans cet exercice, deux corrections différentes sont proposées.')}<br>`
            } else {
              texteCorr = ''
            }
            if (this.sup2 === 1) {
              texteCorr += `$f(x)$ est de la forme $ax+b$, $f$ est donc une fonction affine avec pour coefficient directeur  $a=${a.texFSD}$ ${a.valeurDecimale < 0 ? ' (négatif).' : ' (positif).'}<br>
             D'où, $f$ est une fonction ${ns < 0 ? ' décroissante,' : ' croissante,'} c'est-à-dire que lorsque $x$ augmente, $f(x)$ ${a.valeurDecimale < 0 ? ' diminue.' : ' augmente.'} <br>
             Par conséquent, les valeurs de $f(x)$ sont d'abord ${a.valeurDecimale < 0 ? 'positives' : 'négatives'} puis ${ns < 0 ? 'négatives' : 'positives'}.<br><br>
             De plus,  $${b === 0 ? `${a.texFSD}x=0` : `${a.texFSD}x${ecritureAlgebrique(b)}=0`} \\iff x=${zero.texFSD}$.<br><br>`
            }
            if (this.sup2 === 2) {
              if (b === 0) {
                texteCorr += `Résolution de l'inéquation  $ ${a.texFSD}x>0$ : <br>`
                texteCorr += `$\\begin{aligned}
           ${a.texFSD}x&>0\\\\
          x& ${ns < 0 ? `${miseEnEvidence(`${sp(1.5)}\\boldsymbol{<}${sp(1.5)}`)}` : '>'}${zero.texFSD} ${ns < 0 ? `${miseEnEvidence(`\\text{car} ${a.texFSD} <0`)}` : ''}
            \\end{aligned}$<br>`
              } else {
                texteCorr += `Résolution de l'inéquation  $${a.texFSD}x${ecritureAlgebrique(b)}>0$ : <br>`
                texteCorr += `$\\begin{aligned}
           ${a.texFSD}x${ecritureAlgebrique(b)}&>0\\\\
            ${a.texFSD}x&>${-b}\\\\
            x& ${ns < 0 ? `${miseEnEvidence(`${sp(1.5)}\\boldsymbol{<}${sp(1.5)}`)}` : '>'}${-b}\\times ${ns < 0 ? `\\left(${aInverse.texFSD}\\right)` : `${aInverse.texFraction}`} &${ns < 0 ? `${miseEnEvidence(`\\text{car} ${a.texFSD} <0`)}` : ''}\\\\
            x& ${ns < 0 ? '<' : '>'}${zero.texFSD}
            \\end{aligned}$<br>`
              }
              texteCorr += ` De plus,  $${b === 0 ? `${a.texFSD}x=0` : `${a.texFSD}x${ecritureAlgebrique(b)}=0`} \\iff x=${zero.texFSD}$.<br><br>`
            }
            let ligne1
            if (a.valeurDecimale > 0) {
              ligne1 = ['Line', 25, '', 0, '-', 20, 'z', 20, '+']
            } else {
              ligne1 = ['Line', 25, '', 0, '+', 20, 'z', 20, '-']
            }
            texteCorr += " D'où le tableau de signes suivant :<br>"
            texteCorr += tableauDeVariation({
              tabInit: [
                [
                  // Première colonne du tableau avec le format [chaine d'entête, hauteur de ligne, nombre de pixels de largeur estimée du texte pour le centrage]
                  ['$x$', 3, 25],
                  [
                    `${b === 0 ? `$f(x)=${a.texFSD}x$` : `$f(x)=${a.texFSD}x${ecritureAlgebrique(b)}$`}`,
                    2,
                    50,
                  ],
                ],
                // Première ligne du tableau avec chaque antécédent suivi de son nombre de pixels de largeur estimée du texte pour le centrage
                ['$-\\infty$', 20, `$${zero.texFSD}$`, 20, '$+\\infty$', 30],
              ],
              // tabLines ci-dessous contient les autres lignes du tableau.
              tabLines: [ligne1],
              espcl: 3.5, // taille en cm entre deux antécédents
              deltacl: 0.8, // distance entre la bordure et les premiers et derniers antécédents
              lgt: 8, // taille de la première colonne en cm
              hauteurLignes: [15, 15],
            })
            // On rédcupère les objets Mathalea2d du tableau de signes
            const objetsTableau = creerTableauHtml({
              tabInit: [
                [
                  // Première colonne du tableau avec le format [chaine d'entête, hauteur de ligne, nombre de pixels de largeur estimée du texte pour le centrage]
                  ['$x$', 3, 25],
                  [`$f(x)=${reduireAxPlusB(a, b)}$`, 2, 50],
                ],
                // Première ligne du tableau avec chaque antécédent suivi de son nombre de pixels de largeur estimée du texte pour le centrage
                ['$-\\infty$', 20, '', 20, '$+\\infty$', 30],
              ],
              // tabLines ci-dessous contient les autres lignes du tableau.
              tabLines: [['Line', 25, '', 0, '', 20, 'z', 20, '']],
              espcl: 3.5, // taille en cm entre deux antécédents
              deltacl: 0.8, // distance entre la bordure et les premiers et derniers antécédents
              lgt: 8, // taille de la première colonne en cm
            })
            // On crée l'interactif MetaInteractif2d
            const input = new MetaInteractif2d(
              [
                {
                  x: 12.2,
                  y: -1.5,
                  content: '%{champ1}',
                  classe: '',
                  blanc: '\\ldots',
                  opacity: 1,
                  index: 0,
                },
                {
                  x: 10,
                  y: -4,
                  content: '%{champ1}',
                  classe: '',
                  blanc: '\\ldots',
                  opacity: 1,
                  index: 1,
                },
                {
                  x: 14.4,
                  y: -4,
                  content: '%{champ1}',
                  classe: '',
                  blanc: '\\ldots',
                  opacity: 1,
                  index: 2,
                },
              ],
              {
                exercice: this,
                question: i,
              },
            )
            objetsTableau.push(input)

            // On gère les réponses
            handleAnswers(
              this,
              i,
              {
                field0: { value: zero.texFSD },
                field1: { value: a.valeurDecimale < 0 ? '+' : '-' },
                field2: { value: a.valeurDecimale < 0 ? '-' : '+' },
              },
              { formatInteractif: 'MetaInteractif2d' },
            )
            // On ajoute le tableau, le span pour le résultat et le div pour le feedback
            if (context.isHtml) {
              texte +=
                mathalea2d(
                  Object.assign({}, fixeBordures(objetsTableau)),
                  objetsTableau,
                ) +
                (this.interactif
                  ? `<span id="resultatCheckEx${this.numeroExercice}Q${i}"></span>` +
                    ajouteFeedback(this, i)
                  : '')
            }
            const f = (x: number) => a.valeurDecimale * x + b
            const monRepere = repere({
              xMin: -8,
              xMax: 8,
              yMin: -7,
              yMax: 7,
              yLabelEcart: 0.8,
              yLabelDistance: 2,
              xLabelDistance: 2,
              grilleX: false,
              grilleY: false,
              grilleSecondaire: true,
              grilleSecondaireYDistance: 1,
              grilleSecondaireXDistance: 1,
              grilleSecondaireYMin: -7,
              grilleSecondaireYMax: 7,
              grilleSecondaireXMin: -8,
              grilleSecondaireXMax: 8,
            })
            const maCourbe = courbe(f, { repere: monRepere, color: bleuMathalea })
            const A = pointAbstrait(-b / a.valeurDecimale, 0, '')

            const lA = labelPoint(A, 'red')
            const tA = tracePoint(A, 'red') // Variable qui trace les points avec une croix
            tA.taille = 5
            tA.epaisseur = 5
            const objets = []
            objets.push(maCourbe, lA, monRepere, o, tA)
            texteCorr +=
              `<br>Sur la figure ci-dessous, l'abscisse du point rouge est $${zero.texFSD}$.<br>
            ` +
              mathalea2d(
                {
                  xmin: -8,
                  xmax: 8,
                  ymin: -7,
                  ymax: 7,
                  scale: 0.5,
                  style: 'margin: auto',
                },
                objets,
              )
            variables.push(a.valeurDecimale, b)
          }
          break
      }

      if (
        this.questionJamaisPosee(
          i,
          typesDeQuestions,
          variables.map(String).join(';'),
        )
      ) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
