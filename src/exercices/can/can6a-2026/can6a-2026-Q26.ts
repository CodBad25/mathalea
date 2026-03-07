import Figure from 'apigeom'
import Segment from 'apigeom/src/elements/lines/Segment'
import figureApigeom from '../../../lib/figureApigeom'
import { ajouteFeedback } from '../../../lib/interactif/questionMathLive'
import { choice } from '../../../lib/outils/arrayOutils'
import { context } from '../../../modules/context'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Segment de longueur fractionnaire'
export const interactifReady = true
export const interactifType = 'custom'
export const uuid = '73885'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Rémi Angot

*/
export default class Can2026Q26 extends ExerciceCan {
  figure!: Figure
  num: number = 0
  den: number = 0

  constructor() {
    super()
    this.formatChampTexte = 'none' // Pas de champ texte pour cet exercice simple de géométrie dynamique
    this.nbQuestionsModifiable = false
    this.formatInteractif = 'custom'
  }

  enonce(a?: number, b?: number) {
    let num: number
    let den: number
    if (a == null || b == null) {
      ;[num, den] = choice([
        [7, 10],
        [5, 8],
        [3, 4],
        [5, 6],
        [2, 6],
        [3, 8],
      ])
    } else {
      ;[num, den] = [a, b]
    }
    this.num = num
    this.den = den
    this.reponse = num
    this.question = `Tracer un segment de longueur $\\dfrac{${num}}{${den}}~\\text{u.l}$. `
    this.correction = `L'unité a une longueur de $${den}~\\text{carreaux}$ donc $\\dfrac{1}{${den}}~\\text{u.l}=1~\\text{carreau}$.`
    this.correction += `<br><br>Il suffit donc de tracer un segment de longueur $${num}~\\text{carreaux}$.`
    this.canEnonce = this.question
    this.canReponseACompleter = ''
    const figure = new Figure({
      xMin: 0,
      yMin: 0,
      width: 300,
      height: 160,
    })
    this.figure = figure
    this.figure.setToolbar({
      tools: ['SEGMENT', 'REMOVE'],
      position: 'top',
    })
    figure.create('Grid', {
      axeX: false,
      axeY: false,
      labelX: false,
      labelY: false,
    })
    figure.options.color = 'blue'
    figure.options.gridWithTwoPointsOnSamePosition = false
    figure.options.thickness = 2
    figure.snapGrid = true
    const ptA = figure.create('Point', { x: 1, y: 5, isVisible: false })
    const ptB = figure.create('Point', {
      x: this.den + 1,
      y: 5,
      isVisible: false,
    })
    figure.create('Segment', {
      point1: ptA,
      point2: ptB,
      shape: '|-|',
      thickness: 3,
      isSelectable: false,
    })
    figure.create('TextByPosition', {
      x: this.den / 2 + 1,
      y: 4.5,
      text: '$1~\\text{u.l}$',
      isDeletable: false,
    })
    const figureCorr = new Figure({
      xMin: 0,
      yMin: 0,
      width: 300,
      height: 160,
    })
    figureCorr.options.color = 'blue'
    figureCorr.options.thickness = 2
    figureCorr.create('Grid', {
      axeX: false,
      axeY: false,
      labelX: false,
      labelY: false,
    })
    const ptACorr = figure.create('Point', { x: 1, y: 5, isVisible: false })
    const ptBCorr = figure.create('Point', {
      x: this.den + 1,
      y: 5,
      isVisible: false,
    })
    figureCorr.create('Segment', {
      point1: ptACorr,
      point2: ptBCorr,
      shape: '|-|',
      thickness: 3,
    })
    const ptCCorr = figureCorr.create('Point', { x: 1, y: 3, isVisible: false })
    const ptDCorr = figureCorr.create('Point', {
      x: this.num + 1,
      y: 3,
      isVisible: false,
    })
    figureCorr.create('Segment', {
      point1: ptCCorr,
      point2: ptDCorr,
      shape: '|-|',
      thickness: 3,
    })
    figureCorr.create('TextByPosition', {
      x: this.den / 2 + 1,
      y: 4.5,
      text: '$1~\\text{u.l}$',
    })
    figureCorr.create('TextByPosition', {
      x: this.num / 2,
      y: 2,
      text: `$\\dfrac{${this.num}}{${this.den}}~\\text{u.l}$`,
    })

    const emplacementPourFigure = figureApigeom({
      exercice: this,
      i: 25, // On est obligé de mettre le Numéro de la question qui sera dans le MetaExercice sinon le listener ne trouve pas le div !
      figure,
      defaultAction: 'SEGMENT',
    })
    if (context.isHtml) {
      if (this.interactif) {
        this.question += emplacementPourFigure + ajouteFeedback(this, 0)
      } else {
        this.question += figure.getStaticHtml()
      }
    } else {
      this.question += figure.tikz()
      figure.scale = 0.35
      this.canReponseACompleter = figure.tikz()
    }
    this.correction += '\n\n<br><br>\n'
    if (context.isHtml) {
      this.correction += figureCorr.getStaticHtml()
    } else {
      this.correction += '<br>' + figureCorr.tikz()
    }
  }

  nouvelleVersion() {
    this.sup ? this.enonce(4, 10) : this.enonce()
  }

  correctionInteractive = (i: number) => {
    const figure = this.figure
    figure.isDynamic = false
    figure.divButtons.style.display = 'none'
    figure.divUserMessage.style.display = 'none'

    // Sauvegarde de la réponse pour Capytale
    if (this.answers == null) this.answers = {}
    this.answers[figure.id] = figure.json

    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    ) // Ne pas changer le nom du FeedBack, il est écrit en dur, ailleurs.
    const segments = [...figure.elements.values()].filter((e) =>
      e.type.includes('Segment'),
    )
    let distance = Number.POSITIVE_INFINITY
    if (segments.length === 2) {
      if (!(segments[1] instanceof Segment)) throw new Error()
      const point1 = segments[1].point1
      const point2 = segments[1].point2
      distance = Math.hypot(point1.x - point2.x, point1.y - point2.y)
    }

    const isValid = distance === this.reponse
    let result: 'OK' | 'KO' = 'KO'

    if (divFeedback != null) {
      if (isValid) {
        divFeedback.innerHTML = '😎'
        result = 'OK'
      } else {
        const p = document.createElement('p')
        p.innerText = '☹️'
        divFeedback.insertBefore(p, divFeedback.firstChild)
      }
    }
    return result
  }
}
