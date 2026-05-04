import Figure from 'apigeom'
import { Coords } from 'apigeom/src/elements/calculus/Coords'
import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { Droite, droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { ObjetMathalea2D } from '../../lib/2d/ObjetMathalea2D'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { labelPoint, texteParPosition } from '../../lib/2d/textes'
import type { TracePoint } from '../../lib/2d/TracePoint'
import { tracePoint } from '../../lib/2d/TracePoint'
import { bleuMathalea } from '../../lib/colors'
import figureApigeom, { isFigureArray } from '../../lib/figureApigeom'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
  reduireAxPlusB,
} from '../../lib/outils/ecritures'
import { abs } from '../../lib/outils/nombres'
import { pgcd } from '../../lib/outils/primalite'
import { context } from '../../modules/context'
import { fraction } from '../../modules/fractions'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'

export const titre = 'Représenter graphiquement une fonction affine'
export const dateDeModifImportante = '06/04/2024'
export const interactifReady = true
export const interactifType = 'custom'

/**
 * @author Stéphane Guyon (mise à jour avec les cas Gilles Mora + figure interactive Rémi Angot)
 */
export const uuid = 'c360e'

export const refs = {
  'fr-fr': ['2F10-3'],
  'fr-ch': ['10FA5-15'],
}
export default class Representerfonctionaffine extends Exercice {
  coefficients!: [number, number][]
  figuresApiGeom: Figure[] = []
  level: 3 | 2 = 2
  constructor() {
    super()
    this.nbQuestions = 3 // On complète le nb de questions
    this.sup = 1
    this.sup2 = 1
    this.besoinFormulaireNumerique = [
      'Types de question ',
      3,
      '1 : Valeurs entières\n2 : Valeurs fractionnaires\n3 : Mélange des deux cas précédents',
    ]
    this.besoinFormulaire2Numerique = [
      'Choix de la correction',
      2,
      "1 : Avec coefficient directeur et ordonnée à l'origine\n2 :Avec deux points",
    ]
  }

  nouvelleVersion() {
    this.figuresApiGeom = []
    this.consigne =
      'Représenter graphiquement ' +
      (this.nbQuestions === 1 || context.isDiaporama
        ? 'la fonction affine suivante  définie'
        : 'les fonctions affines suivantes définies') +
      ' sur $\\mathbb R$ par :'
    this.figures = []
    this.coefficients = []

    let typesDeQuestionsDisponibles: (1 | 2)[] = []

    if (this.sup === 1) {
      typesDeQuestionsDisponibles = [1]
    }
    if (this.sup === 2) {
      typesDeQuestionsDisponibles = [2]
    }
    if (this.sup === 3) {
      typesDeQuestionsDisponibles = [1, 2]
    }

    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    const textO = texteParPosition('O', -0.5, -0.5, 0, 'black', 1)
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      let a: number,
        b: number,
        d: number,
        xA: number,
        yA: number,
        xB: number,
        yB: number,
        droiteAB: Droite,
        cadre: { xMin: number; yMin: number; xMax: number; yMax: number },
        monRepere: ObjetMathalea2D,
        tA: TracePoint,
        tB: TracePoint,
        lA: NestedObjetMathalea2dArray,
        lB: NestedObjetMathalea2dArray,
        cadreFenetreSvg: {
          xmin: number
          ymin: number
          xmax: number
          ymax: number
          scale: number
        },
        f: (x: number) => number,
        texte,
        texteCorr: string
      switch (listeTypeDeQuestions[i]) {
        case 1:
          {
            f = (x) => a * x + b
            a = randint(0, 4) * choice([-1, 1]) // coefficient non nul a de la fonction affine
            b = randint(0, 3, [0]) * choice([-1, 1]) // ordonnée à l'origine b non nulle de la fonction affine
            this.coefficients[i] = [a, b]
            f = (x) => a * x + b

            xA = 0
            yA = f(xA)
            xB = this.sup2 === 1 ? 1 : randint(1, 3) * choice([-1, 1]) // Abscisse de B
            yB = f(xB) // Ordonnée de B

            const A = pointAbstrait(xA, yA, 'A')
            const B = pointAbstrait(xB, yB, 'B')
            droiteAB = droite(A, B)
            droiteAB.color = colorToLatexOrHTML('red')
            droiteAB.epaisseur = 2

            cadre = {
              xMin: Math.min(-5, xA - 1, xB - 1),
              yMin: Math.min(-5, yA - 1, yB - 1),
              xMax: Math.max(5, xA + 1, xB + 1),
              yMax: Math.max(5, yA + 1, yB + 1),
            }
            // C'est bizarre mais c'est parce que dans mathAlea, les attributs n'ont pas de majuscules.
            // Donc même quand c'est le même cadre, on doit le faire.
            cadreFenetreSvg = {
              xmin: cadre.xMin,
              ymin: cadre.yMin,
              xmax: cadre.xMax,
              ymax: cadre.yMax,
              scale: 0.6,
            }

            monRepere = repere(cadre)

            tA = tracePoint(A, 'red') // Variable qui trace les points avec une croix
            tB = tracePoint(B, 'red') // Variable qui trace les points avec une croix
            lA = labelPoint(A, 'red') // Variable qui trace les nom s A et B
            lB = labelPoint(B, 'red') // Variable qui trace les nom s A et B

            tA.taille = 5
            tA.epaisseur = 2
            tB.taille = 5
            tB.epaisseur = 2

            texte = `$f_{${i + 1}}(x)=${reduireAxPlusB(a, b)}$ <br>`
            texteCorr =
              "On sait que la représentation graphique d'une fonction affine est une droite.<br>"
            if (this.sup2 === 1) {
              if (a !== 0) {
                texteCorr += `La droite a pour équation $y=${reduireAxPlusB(a, b)}$. <br>
              L'ordonnée à l'origine est $${b}$, on place donc le point $A$ de coordonnées $(0\\,;\\,${b})$.<br>
             Le coefficient directeur est égal à $${a}$. En se décalant d'une unité vers la droite à partir du point $A$, on ${a > 0 ? 'monte' : 'descend'} de $${abs(a)}$ ${a === 1 || a === -1 ? 'unité' : 'unités'}. <br>
             On obtient alors le point $B$. <br>
             On trace la droite $(AB)$.`
              } else {
                texteCorr += `Il s'agit d'une fonction affine particulière constante ($f(x)=0x${ecritureAlgebrique(b)}$).<br>
              L'ordonnée à l'origine est $${b}$, on place donc le point $A$ de coordonnées $(0\\,;\\,${b})$.<br>
              Le coefficient directeur de la droite est nul, on trace la droite horizontale qui passe par $A$.`
              }
            } else {
              if (a !== 0) {
                texteCorr += `Il suffit donc de déterminer les coordonnées de deux points pour pouvoir représenter $f$.<br>
                Comme $f(${xA})=${yA}$, on a  $A(${xA};${yA}) \\in \\mathcal{C_f}$.<br>
                On cherche un deuxième point, et on prend un antécédent au hasard :<br>
                Soit $x=${xB}$ :<br>On calcule : $f(${xB})=${a} \\times ${ecritureParentheseSiNegatif(xB)}${ecritureAlgebrique(b)}=${yB}$.<br>
                On en déduit que $B(${xB};${yB}) \\in \\mathcal{C_f}$.<br>`
              } else {
                texteCorr = 'On observe que $f$ est une fonction constante.<br>'
                texteCorr += `Sa représentation graphique est donc une droite parallèle à l'axe des abscisses, d'équation $y=${yA}$.<br>`
              }
            }
            const objets: NestedObjetMathalea2dArray = [
              lA,
              lB,
              monRepere,
              droiteAB,
              tA,
              tB,
              textO,
            ]
            texteCorr += mathalea2d(
              Object.assign({}, fixeBordures(objets)),
              objets,
            )
          }
          break

        case 2: // cas du coefficient directeur fractionnaire
          {
            a = randint(-5, 5, [0]) // numérateur coefficient directeur non nul
            b = randint(-4, 4, [0]) // ordonnée à l'origine non nulle
            if (this.level === 3) {
              d = 2
              a = randint(-5, 5, [0, -4, -2, 2, 4]) // numérateur coefficient directeur non nul
            } else {
              d = randint(2, 5) // dénominateur coefficient directeur non multiple du numérateur pour éviter nombre entier
            }
            while (pgcd(a, d) !== 1) {
              a = randint(-5, 5, [0]) // numérateur coefficient directeur non nul
              b = randint(-4, 4, [0]) // ordonnée à l'origine non nulle
              d = randint(2, 5)
            }
            f = (x) => (a / d) * x + b
            this.coefficients[i] = [a / d, b]
            xA = 0 // Abscisse de A
            yA = f(xA) // Ordonnée de A
            xB = d
            yB = f(xB)

            const A1 = pointAbstrait(xA, yA, 'A')
            const B1 = pointAbstrait(xB, yB, 'B')
            droiteAB = droite(A1, B1)
            droiteAB.color = colorToLatexOrHTML('red')
            droiteAB.epaisseur = 2

            cadre = {
              xMin: Math.min(-5, xA - 1, xB - 1),
              yMin: Math.min(-5, yA - 1, yB - 1),
              xMax: Math.max(5, xA + 1, xB + 1),
              yMax: Math.max(5, yA + 1, yB + 1),
            }

            cadreFenetreSvg = {
              xmin: cadre.xMin,
              ymin: cadre.yMin,
              xmax: cadre.xMax,
              ymax: cadre.yMax,
              scale: 0.6,
            }

            texte = `$f_{${i + 1}}(x)=${texFractionReduite(a, d)}x ${ecritureAlgebrique(b)}$ <br>`
            texteCorr =
              "On sait que la représentation graphique d'une fonction affine est une droite.<br>"
            if (this.sup2 === 1) {
              texteCorr += `La droite a pour équation $y=${texFractionReduite(a, d)}x ${ecritureAlgebrique(b)}$. <br>
              L'ordonnée à l'origine est $${b}$, on place donc le point $A$ de coordonnées $(0\\,;\\,${b})$.<br>
             Le coefficient directeur est égal à $${texFractionReduite(a, d)}$. En se décalant de $${d}$ unités vers la droite à partir du point $A$, on ${a > 0 ? 'monte' : 'descend'} de $${abs(a)}$  ${a === 1 || a === -1 ? 'unité' : 'unités'}. <br>
             On obtient alors le point $B$. <br>
             On trace la droite $(AB)$.`
            } else {
              texteCorr += `Il suffit donc de déterminer les coordonnées de deux points pour pouvoir représenter $f$.<br>
            Comme $f(${xA})=${yA}$, on a : $A(${xA};${yA}) \\in \\mathcal{C_f}$.<br>
            On cherche un deuxième point, et on prend un antécédent qui facilite les calculs :<br>
            Par exemple $x=${xB}$ :<br>
            On calcule : $f(${xB})=${texFractionReduite(a, d)} \\times ${ecritureParentheseSiNegatif(xB)}${ecritureAlgebrique(b)}=${yB}$.<br>On en déduit que $B(${xB};${yB}) \\in \\mathcal{C_f}$.<br>`
            }

            tA = tracePoint(A1, 'red') // Variable qui trace les points avec une croix
            lA = labelPoint(A1, 'red') // Variable qui trace les nom s A et B
            tB = tracePoint(B1, 'red') // Variable qui trace les points avec une croix
            lB = labelPoint(B1, 'red') // Variable qui trace les nom s A et B

            monRepere = repere(cadre) // On définit le repère
            texteCorr += mathalea2d(
              cadreFenetreSvg,
              monRepere,
              droiteAB,
              tA,
              lA,
              tB,
              lB,
              textO,
            )
            // On trace le graphique
          }
          break
      }

      if (this.interactif) {
        const figure = new Figure({
          xMin: -5.5,
          yMin: -5.5,
          width: 330,
          height: 330,
        })
        if (isFigureArray(this.figures)) this.figures.push(figure)
        this.figuresApiGeom[i] = figure
        figure.setToolbar({
          tools: ['POINT', 'LINE', 'DRAG', 'REMOVE'],
          position: 'top',
        })
        figure.create('Grid')
        figure.options.color = bleuMathalea
        figure.options.thickness = 2
        figure.snapGrid = true
        figure.dx = 0.5
        figure.dy = 0.5
        texte += figureApigeom({ exercice: this, i, figure })
        if (figure.ui) figure.ui.send({ type: 'LINE' })
      }

      if (this.questionJamaisPosee(i, a, b)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
    }
    listeQuestionsToContenu(this)
  }

  correctionInteractive = (i?: number) => {
    if (i === undefined) return 'KO'
    let result: 'OK' | 'KO' = 'KO'
    if (this.figuresApiGeom[i] == null)
      throw new Error("La figure n'a pas été créée, n°" + i)
    const figure = this.figuresApiGeom[i]
    if (this.answers == null) this.answers = {}
    // Sauvegarde de la réponse pour Capytale
    this.answers[figure.id] = figure.json
    figure.isDynamic = false
    figure.divButtons.style.display = 'none'
    figure.divUserMessage.style.display = 'none'
    const lines = [...figure.elements.values()].filter((e) =>
      e.type.includes('Line'),
    )
    const [a, b] = this.coefficients[i]
    const point1 = new Coords(0, b)
    const point2 = new Coords(1, a + b)
    const { isValid } = figure.checkLine({ point1, point2 })
    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    )
    if (divFeedback != null) {
      if (isValid && lines.length === 1) {
        divFeedback.innerHTML = '😎'
        result = 'OK'
      } else {
        const p = document.createElement('p')
        p.innerText = '☹️'
        if (lines.length === 0) {
          p.innerHTML += " Aucune droite n'a été tracée."
        } else if (lines.length > 1) {
          p.innerHTML += " Il ne faut tracer qu'une seule droite."
        }
        divFeedback.insertBefore(p, divFeedback.firstChild)
      }
    }
    return result
  }
}

function texFractionReduite(a: number, b: number) {
  const frac = fraction(a, b)
  return frac.simplifie().toLatex()
}
