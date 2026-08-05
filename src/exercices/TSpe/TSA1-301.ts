import Figure from 'apigeom'
import { Coords } from 'apigeom/src/elements/calculus/Coords'
import { bleuMathalea } from '../../lib/colors'
import figureApigeom from '../../lib/figureApigeom'
import { choice } from '../../lib/outils/arrayOutils'
import { texNombre } from '../../lib/outils/texNombre'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Représenter graphiquement une suite arithmético-géométrique'
export const dateDePublication = '05/08/2026'

export const uuid = '4ad1f'
export const refs = {
  'fr-fr': ['TSA1-301'],
  'fr-ch': [],
}

function coefficientTex(a: number): string {
  switch (a) {
    case -0.5:
      return '-\\dfrac{1}{2}'
    case -0.25:
      return '-\\dfrac{1}{4}'
    case 0.75:
      return '\\dfrac{3}{4}'
    default:
      return '\\dfrac{1}{2}'
  }
}

function expressionAffineTex(a: number, b: number): string {
  return `${coefficientTex(a)}x+${texNombre(b)}`
}

function creeFigure({
  a,
  b,
  avecAffine,
  avecPremiereBissectrice,
}: {
  a: number
  b: number
  avecAffine: boolean
  avecPremiereBissectrice: boolean
}): Figure {
  const figure = new Figure({
    xMin: -1,
    yMin: -1,
    width: 480,
    height: 480,
    border: false,
  })
  figure.create('Grid', {
    xMin: 0,
    yMin: 0,
    xMax: 14,
    yMax: 14,
    axeX: true,
    axeY: true,
    labelX: true,
    labelY: true,
  })
  figure.snapGrid = true
  figure.dx = 0.5
  figure.dy = 0.5
  figure.options.color = bleuMathalea
  figure.options.thickness = 2

  if (avecAffine) {
    figure.create('Graph', {
      expression: `${a}*x+${b}`,
      color: bleuMathalea,
      thickness: 2,
      xMin: 0,
      xMax: 14,
      isSelectable: false,
    })
    figure.create('TextByPosition', {
      text: '$\\mathcal C_f$',
      x: 1.5,
      y: 1.5 * a + b + 0.6,
      color: bleuMathalea,
      isSelectable: false,
    })
  }
  if (avecPremiereBissectrice) {
    figure.create('Graph', {
      expression: 'x',
      color: 'red',
      thickness: 2,
      xMin: 0,
      xMax: 14,
      isSelectable: false,
    })
    figure.create('TextByPosition', {
      text: '$y=x$',
      x: 11.5,
      y: 12.2,
      color: 'red',
      isSelectable: false,
    })
  }

  return figure
}

function ajouteSegment(
  figure: Figure,
  point1: Coords,
  point2: Coords,
  options: { color: string; isDashed?: boolean },
): void {
  const a = figure.create('Point', {
    x: point1.x,
    y: point1.y,
    isVisible: false,
  })
  const b = figure.create('Point', {
    x: point2.x,
    y: point2.y,
    isVisible: false,
  })
  figure.create('Segment', {
    point1: a,
    point2: b,
    color: options.color,
    thickness: 2,
    isDashed: options.isDashed ?? false,
    isSelectable: false,
  })
}

function completeFigureCorrection(figure: Figure, termes: number[]): void {
  for (let k = 0; k < termes.length; k++) {
    figure.create('Point', {
      x: termes[k],
      y: 0,
      label: `u_${k}`,
      color: 'green',
      shape: 'x',
      isSelectable: false,
    })
    if (k > 0) {
      figure.create('Point', {
        x: 0,
        y: termes[k],
        label: `u_${k}`,
        color: 'purple',
        shape: 'x',
        isSelectable: false,
      })
    }
  }

  for (let k = 0; k < termes.length - 1; k++) {
    const depart =
      k === 0 ? new Coords(termes[0], 0) : new Coords(termes[k], termes[k])
    const surAffine = new Coords(termes[k], termes[k + 1])
    const surBissectrice = new Coords(termes[k + 1], termes[k + 1])
    ajouteSegment(figure, depart, surAffine, { color: 'green' })
    ajouteSegment(figure, surAffine, surBissectrice, { color: 'green' })
    ajouteSegment(figure, new Coords(termes[k + 1], 0), surBissectrice, {
      color: 'purple',
      isDashed: true,
    })
    ajouteSegment(figure, new Coords(0, termes[k + 1]), surBissectrice, {
      color: 'purple',
      isDashed: true,
    })
  }
}

/**
 * Construction graphique des termes d'une suite u_(n+1)=a*u_n+b.
 * @author Stéphane Guyon
 */
export default class RepresentationSuiteArithmeticoGeometrique extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.sup = 3
    this.besoinFormulaireNumerique = [
      'Éléments présents sur le graphique',
      3,
      '1 : Graphique vierge\n2 : Fonction affine\n3 : Fonction affine et y = x',
    ]
  }

  nouvelleVersion() {
    this.figuresApiGeom = []
    const a = choice([-0.5, -0.25, 0.5, 0.75])
    const pointFixe = 8
    const b = (1 - a) * pointFixe
    const u0 = pointFixe + choice([-4, 4])
    const termes = [u0]
    for (let k = 0; k < 4; k++) {
      termes.push(a * termes[k] + b)
    }
    const figure = creeFigure({
      a,
      b,
      avecAffine: this.sup >= 2,
      avecPremiereBissectrice: this.sup >= 3,
    })

    let texte = `La suite $(u_n)$ est définie par $u_0=${u0}$ et, pour tout entier naturel $n$, par :<br>$u_{n+1}=${coefficientTex(a)}u_n+${texNombre(b)}$.<br><br>`
    if (this.sup >= 2) {
      texte += `On pose la fonction $f$ définie sur $\\mathbb R$ par $f(x)=${expressionAffineTex(a, b)}$. Sa courbe représentative $\\mathcal C_f$ est tracée dans le repère ci-dessous.<br>`
    }
    if (this.sup >= 3) {
      texte += `On a aussi représenté la droite d’équation $y=x$.<br>`
    }
    texte += `Représenter graphiquement, dans ce repère et sans effectuer de calculs, les quatre termes $u_1$, $u_2$, $u_3$ et $u_4$ de la suite sur l’axe des abscisses.<br><br>`
    texte += figureApigeom({
      exercice: this,
      i: 0,
      figure,
      idAddendum: `Aide${this.sup}`,
      isDynamic: false,
      hasFeedback: false,
    })

    const figureCorrection = creeFigure({
      a,
      b,
      avecAffine: true,
      avecPremiereBissectrice: true,
    })
    completeFigureCorrection(figureCorrection, termes)
    let texteCorr = `On utilise la droite représentant la fonction $f:x\\mapsto ${expressionAffineTex(a, b)}$ et la droite d’équation $y=x$.<br>`
    texteCorr += `On obtient successivement : $u_1\\approx${texNombre(termes[1], 3)}$, $u_2\\approx${texNombre(termes[2], 3)}$, $u_3\\approx${texNombre(termes[3], 3)}$ et $u_4\\approx${texNombre(termes[4], 3)}$.<br><br>`
    texteCorr += figureApigeom({
      exercice: this,
      i: 0,
      figure: figureCorrection,
      idAddendum: `CorrectionAide${this.sup}`,
      isDynamic: false,
      hasFeedback: false,
    })

    this.listeQuestions[0] = texte
    this.listeCorrections[0] = texteCorr
    listeQuestionsToContenu(this)
  }
}
