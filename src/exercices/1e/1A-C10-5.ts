import { courbe } from '../../lib/2d/Courbe'
import { droite } from '../../lib/2d/droites'
import { point } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../lib/2d/textes'
import { deuxColonnes } from '../../lib/format/miseEnPage'
import { choice } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'

import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
import { bleuMathalea } from '../../lib/colors'
export const dateDePublication = '01/10/2025'
export const dateDeModifImportante = '12/10/2025'
export const uuid = '26802'
//
/**
 *
 * @author Gilles Mora + Claude ia pour la factorisation
 *
 */
export const refs = {
  'fr-fr': ['1A-C10-5'],
  'fr-ch': ['2mQCM-2'],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre =
  'Résoudre une inéquation du type $\\dfrac{1}{x}<a$ ou $\\dfrac{1}{x}>a$ (avec ou sans courbe)'
export default class Auto1AC10e extends ExerciceQcmA {
  private appliquerLesValeurs(
    val: number,
    estInegStrict: boolean,
    typeInequation: 'inf' | 'sup',
  ): void {
    // Détermination du signe d'inégalité
    const signeInégalité =
      typeInequation === 'inf'
        ? estInegStrict
          ? '<'
          : ' \\leqslant '
        : estInegStrict
          ? '>'
          : ' \\geqslant '

    // Création des éléments graphiques
    const elements = this.creerElementsGraphiques(
      val,
      estInegStrict,
      typeInequation,
    )
    const { graphique, graphiqueC } = this.creerGraphiques(val, elements)
    const reponses = this.formaterReponses(val, estInegStrict, typeInequation)

    // Énoncé
    this.enonce = this.sup5
      ? `On note $(I)$ l'inéquation, sur $\\mathbb{R}^*$, $\\dfrac{1}{x}${signeInégalité} ${val}$.<br><br>
         L'ensemble des solutions $S$ de cette inéquation est :`
      : `${deuxColonnes(
          `On a représenté l'hyperbole d'équation $y=\\dfrac{1}{x}$. <br><br>
           On note $(I)$ l'inéquation, sur $\\mathbb{R}^*$, $\\dfrac{1}{x}${signeInégalité} ${val}$.<br><br>`,
          `${graphique}<br>`,
        )} L'ensemble des solutions $S$ de cette inéquation est :`

    // Correction
    this.correction = this.genererCorrection(
      val,
      estInegStrict,
      typeInequation,
      graphiqueC,
      reponses[0],
    )

    // Réponses
    this.reponses = reponses
  }

  private creerElementsGraphiques(
    val: number,
    estInegStrict: boolean,
    typeInequation: 'inf' | 'sup',
  ) {
    const o = latex2d('\\text{O}', -0.2, -0.3, { letterSize: 'scriptsize' })
    const O = point(0, 0)

    // Droite horizontale fixe selon le signe de val
    const yDroite = val > 0 ? 1.5 : -1.5

    // Calcul de la position d'intersection sur l'hyperbole avec yDroite
    const xIntersection = 1 / yDroite
    const A = point(xIntersection, yDroite)
    const Ax = point(xIntersection, 0)
    const sAAx = segment(A, Ax)
    sAAx.epaisseur = 2
    sAAx.pointilles = 5

    // Calcul de la borne réelle pour les segments de solution
    const borneReelle = 1 / val

    // Segments de solution selon le type d'inéquation
    let segmentsSolution = []
    if (typeInequation === 'inf') {
      if (val > 0) {
        // Pour 1/x < a avec a > 0 : ]-∞,0[ ∪ ]1/a,+∞[
        const AxI = point(-4, 0)
        const sAxIO = segment(AxI, O, 'red')
        sAxIO.epaisseur = 2
        sAxIO.styleExtremites = '-['
        sAxIO.tailleExtremites = 6

        const AxI2 = point(4, 0)
        const bornePoint = point(1 / 1.5, 0)
        const sAxI2Ax = segment(bornePoint, AxI2, 'red')
        sAxI2Ax.epaisseur = 2
        sAxI2Ax.styleExtremites = estInegStrict ? ']-' : '[-'
        sAxI2Ax.tailleExtremites = 6

        segmentsSolution = [sAxIO, sAxI2Ax]
      } else {
        // Pour 1/x < a avec a < 0 : ]1/a,0[
        const bornePoint = point(-1 / 1.5, 0)
        const sAxO = segment(bornePoint, O, 'red')
        sAxO.epaisseur = 2
        sAxO.styleExtremites = estInegStrict ? ']-[' : '[-['
        sAxO.tailleExtremites = 6
        segmentsSolution = [sAxO]
      }
    } else {
      if (val > 0) {
        // Pour 1/x > a avec a > 0 : ]0,1/a[
        const bornePoint = point(1 / 1.5, 0)
        const sAxO = segment(O, bornePoint, 'red')
        sAxO.epaisseur = 2
        sAxO.styleExtremites = estInegStrict ? ']-[' : ']-]'
        sAxO.tailleExtremites = 6
        segmentsSolution = [sAxO]
      } else {
        // Pour 1/x > a avec a < 0 : ]-∞,1/a[ ∪ ]0,+∞[
        const bornePoint = point(-1 / 1.5, 0)
        const AxI = point(-4, 0)
        const sAxIBx = segment(AxI, bornePoint, 'red')
        sAxIBx.epaisseur = 2
        sAxIBx.styleExtremites = estInegStrict ? '-[' : '-]'
        sAxIBx.tailleExtremites = 6

        const AxI2 = point(4, 0)
        const sOAxI2 = segment(O, AxI2, 'red')
        sOAxI2.epaisseur = 2
        sOAxI2.styleExtremites = ']-'
        sOAxI2.tailleExtremites = 6

        segmentsSolution = [sAxIBx, sOAxI2]
      }
    }

    // Textes pour les labels
    const textes = [
      latex2d(`y=${val}`, 4, yDroite > 0 ? 2 : -1, {
        letterSize: 'scriptsize',
      }),
      latex2d('y=\\dfrac{1}{x}', 1.2, 3, { letterSize: 'scriptsize' }),
    ]

    // Ajouter le label pour l'abscisse de la borne réelle
    if (val > 0) {
      textes.push(
        latex2d(`\\dfrac{1}{${val}}`, borneReelle + 0.3, -0.8, {
          letterSize: 'scriptsize',
        }),
      )
    } else {
      textes.push(
        latex2d(`-\\dfrac{1}{${Math.abs(val)}}`, borneReelle - 0.3, 0.9, {
          letterSize: 'scriptsize',
        }),
      )
    }

    return {
      o,
      O,
      Ax,
      sAAx,
      segmentsSolution,
      textes,
      yDroite,
    }
  }

  private creerGraphiques(val: number, elements: any) {
    const { o, sAAx, segmentsSolution, textes, yDroite } = elements

    const r1 = repere({
      xMin: -4,
      yMin: -3,
      yMax: 4,
      xMax: 4.5,
      xUnite: 1,
      yUnite: 1,
      axeXStyle: '->',
      axeYStyle: '->',
      grilleX: false,
      grilleY: false,
      xThickListe: [0],
      yThickListe: [0],
      xLabelListe: [-6],
      yLabelListe: [-6],
    })

    const f = (x: number) => 1 / Number(x)

    // Droite horizontale fixe
    const Cg = droite(point(-4, yDroite), point(4, yDroite), '', 'green')
    Cg.epaisseur = 2

    // Graphique simple pour l'énoncé
    const graphique = mathalea2d(
      {
        xmin: -5,
        xmax: 5,
        ymin: -4.5,
        ymax: 4,
        pixelsParCm: 20,
        scale: 0.7,
      },
      r1,
      o,
      courbe(f, { repere: r1, color: bleuMathalea, epaisseur: 2 }),
    )

    // Graphique complet pour la correction
    const graphiqueC = mathalea2d(
      {
        xmin: -4,
        xmax: 4.5,
        ymin: -4.5,
        ymax: 4,
        pixelsParCm: 25,
        scale: 1,
      },
      courbe(f, { repere: r1, color: bleuMathalea, epaisseur: 2 }),
      Cg,
      r1,
      o,
      sAAx,
      ...segmentsSolution,
      ...textes,
    )

    return { graphique, graphiqueC }
  }

  private formaterReponses(
    val: number,
    estInegStrict: boolean,
    typeInequation: 'inf' | 'sup',
  ) {
    const borne =
      val > 0 ? `\\dfrac{1}{${val}}` : `-\\dfrac{1}{${Math.abs(val)}}`

    if (typeInequation === 'inf') {
      if (val > 0) {
        // Pour 1/x < a avec a > 0 : ]-∞,0[ ∪ ]1/a,+∞[
        const intervalleCorrect = `]-\\infty\\,;\\,0[ \\cup ${estInegStrict ? '\\left]' : '\\left['}${borne}\\,;\\,+\\infty\\right[`
        const intervalleIncorrect = `]-\\infty\\,;\\,0[ \\cup ${estInegStrict ? '\\left[' : '\\left]'}${val}\\,;\\,+\\infty\\right[`
        return [
          `$S = ${intervalleCorrect}$`,
          `$S = ${intervalleIncorrect}$`,
          `$S = \\left]0\\,;\\,${val}${estInegStrict ? '\\right[' : '\\right]'}$`,
          `$S = \\left]0\\,;\\,${borne}${estInegStrict ? '\\right[' : '\\right]'}$`,
        ]
      } else {
        // Pour 1/x < a avec a < 0 : ]1/a,0[
        const intervalleCorrect = `\\left]${borne}\\,;\\,0\\right[`
        const intervalleIncorrect = `\\left]${val}\\,;\\,0\\right[`
        return [
          `$S = ${intervalleCorrect}$`,
          `$S = ${intervalleIncorrect}$`,
          `$S = \\left]-\\infty\\,;\\,${val}${estInegStrict ? '\\right[' : '\\right]'} \\cup ]0\\,;\\,+\\infty[$`,
          `$S = \\left]-\\infty\\,;\\,${borne}${estInegStrict ? '\\right[' : '\\right]'} \\cup ]0\\,;\\,+\\infty[$`,
        ]
      }
    } else {
      if (val > 0) {
        // Pour 1/x > a avec a > 0 : ]0,1/a[
        const intervalleCorrect = `\\left]0\\,;\\,${borne}${estInegStrict ? '\\right[' : '\\right]'}`
        const intervalleIncorrect = `\\left]0\\,;\\,${val}${estInegStrict ? '\\right[' : '\\right]'}`
        return [
          `$S = ${intervalleCorrect}$`,
          `$S = ${intervalleIncorrect}$`,
          `$S = ]-\\infty\\,;\\,0[ \\cup \\left]${val}\\,;\\,+\\infty\\right[$`,
          `$S = ]-\\infty\\,;\\,0[ \\cup \\left]${borne}\\,;\\,+\\infty\\right[$`,
        ]
      } else {
        // Pour 1/x > a avec a < 0 : ]-∞,1/a[ ∪ ]0,+∞[
        const intervalleCorrect = `\\left]-\\infty\\,;\\,${borne}${estInegStrict ? '\\right[' : '\\right]'} \\cup ]0\\,;\\,+\\infty[`
        const intervalleIncorrect = `\\left]-\\infty\\,;\\,${val}${estInegStrict ? '\\right[' : '\\right]'} \\cup ]0\\,;\\,+\\infty[`
        return [
          `$S = ${intervalleCorrect}$`,
          `$S = ${intervalleIncorrect}$`,
          `$S = \\left]${val}\\,;\\,0\\right[$`,
          `$S = \\left]${borne}\\,;\\,0\\right[$`,
        ]
      }
    }
  }

  private genererCorrection(
    val: number,
    estInegStrict: boolean,
    typeInequation: 'inf' | 'sup',
    graphiqueC: any,
    reponseCorrecte: string,
  ) {
    const borne =
      val > 0 ? `\\dfrac{1}{${val}}` : `-\\dfrac{1}{${Math.abs(val)}}`
    const positionText =
      typeInequation === 'inf'
        ? estInegStrict
          ? 'strictement en-dessous de'
          : ' sur ou sous '
        : estInegStrict
          ? 'strictement au-dessus de'
          : ' sur ou au-dessus de '

    return `Pour résoudre graphiquement cette inéquation : <br>
            $\\bullet$ On trace l'hyperbole d'équation $y=\\dfrac{1}{x}$. <br>
            $\\bullet$ On trace la droite horizontale d'équation $y=${val}$. Cette droite coupe l'hyperbole en un point dont l'abscisse est : $${borne}$. <br>
            $\\bullet$ Les solutions de l'inéquation sont les abscisses des points de la courbe qui se situent ${positionText} la droite.<br>
            ${graphiqueC}<br>
            Comme la fonction inverse est définie sur $\\mathbb{R}^*$, $0$ est une valeur interdite et donc l'ensemble des solutions de l'inéquation $(I)$ est : ${texteEnCouleurEtGras(reponseCorrecte)}.`
  }

  versionOriginale: () => void = () => {
    // Version originale : 1/x ≥ 3
    this.appliquerLesValeurs(
      3, // val
      false, // estInegStrict
      'sup', // typeInequation
    )
  }

  versionAleatoire: () => void = () => {
    const typeInequation = choice(['inf', 'sup'] as const)
    const estInegStrict = choice([true, false])
    const val = randint(-6, 6, [-1, 0, 1])

    this.appliquerLesValeurs(val, estInegStrict, typeInequation)
  }

  constructor() {
    super()
    // this.options = { vertical: true, ordered: false }
    this.versionAleatoire()
    this.besoinFormulaire5CaseACocher = ['Sans la courbe']
  }
}
