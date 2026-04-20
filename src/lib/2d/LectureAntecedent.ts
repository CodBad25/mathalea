import { context } from '../../modules/context'
import { ObjetMathalea2D } from './ObjetMathalea2D'
import { pointAbstrait } from './PointAbstrait'
import { segment } from './segmentsVecteurs'
import { texteParPosition } from './textes'
import { vide2d } from './Vide2d'

export class LectureAntecedent extends ObjetMathalea2D {
  x: number
  y: number
  xscale: number
  yscale: number
  textAbs: string
  textOrd: string
  stringColor: string
  constructor(
    x: number,
    y: number,
    xscale: number,
    yscale: number,
    color = 'black',
    textOrd: string,
    textAbs: string,
  ) {
    super()
    //
    this.x = x
    this.y = y
    this.xscale = xscale
    this.yscale = yscale
    // if (textAbs == null) textAbs = this.x.toString().replace('.', ',')
    // if (textOrd == null) textOrd = this.y.toString().replace('.', ',')
    this.textAbs = textAbs
    this.textOrd = textOrd
    this.stringColor = color
    this.bordures = [0, 0, 0, 0]
  }

  svg(coeff: number) {
    const x0 = this.x / this.xscale
    const y0 = this.y / this.yscale
    const M = pointAbstrait(x0, y0)
    const X = pointAbstrait(x0, 0)
    const Y = pointAbstrait(0, y0)
    const Sx =
      M.x === X.x && M.y === X.y ? vide2d() : segment(M, X, this.stringColor)
    const Sy =
      M.x === Y.x && M.y === Y.y ? vide2d() : segment(Y, M, this.stringColor)
    // vide2D n'a pas de styleExtremites ni pointilles mais on s'en fiche car on ne l'affiche pas : son svg() est vide
    Sx.styleExtremites = '->'
    Sy.styleExtremites = '->'
    Sx.pointilles = 5
    Sy.pointilles = 5
    return (
      '\t\n' +
      Sx.svg(coeff) +
      '\t\n' +
      Sy.svg(coeff) +
      '\t\n' +
      (this.textAbs != null
        ? texteParPosition(
            this.textAbs,
            x0,
            (-1 * 20) / coeff,
            0,
            this.stringColor,
          ).svg(coeff)
        : '') +
      '\t\n' +
      (this.textOrd != null
        ? texteParPosition(
            this.textOrd,
            (-1 * 20) / coeff,
            y0,
            0,
            this.stringColor,
          ).svg(coeff)
        : '')
    )
  }

  tikz() {
    const x0 = this.x / this.xscale
    const y0 = this.y / this.yscale
    const M = pointAbstrait(x0, y0)
    const X = pointAbstrait(x0, 0)
    const Y = pointAbstrait(0, y0)
    const Sx =
      M.x === X.x && M.y === X.y ? vide2d() : segment(M, X, this.stringColor)
    const Sy =
      M.x === Y.x && M.y === Y.y ? vide2d() : segment(Y, M, this.stringColor)
    // vide2D n'a pas de styleExtremites ni pointilles mais on s'en fiche car on ne l'affiche pas : son svg() est vide
    Sx.styleExtremites = '->'
    Sy.styleExtremites = '->'
    Sx.pointilles = 5
    Sy.pointilles = 5
    return (
      '\t\n' +
      Sx.tikz() +
      '\t\n' +
      Sy.tikz() +
      '\t\n' +
      texteParPosition(
        this.textAbs,
        x0,
        -1 / context.scale,
        0,
        this.stringColor,
      ).tikz() +
      '\t\n' +
      texteParPosition(
        this.textOrd,
        -1 / context.scale,
        y0,
        0,
        this.stringColor,
      ).tikz()
    )
  }

  svgml(coeff: number, amp: number) {
    const x0 = this.x / this.xscale
    const y0 = this.y / this.yscale
    const M = pointAbstrait(x0, y0)
    const X = pointAbstrait(x0, 0)
    const Y = pointAbstrait(0, y0)
    const Sx =
      M.x === X.x && M.y === X.y ? vide2d() : segment(M, X, this.stringColor)
    const Sy =
      M.x === Y.x && M.y === Y.y ? vide2d() : segment(Y, M, this.stringColor)
    // vide2D n'a pas de styleExtremites ni pointilles mais on s'en fiche car on ne l'affiche pas : son svg() est vide
    Sx.styleExtremites = '->'
    Sy.styleExtremites = '->'
    Sx.pointilles = 5
    Sy.pointilles = 5
    return (
      '\t\n' +
      Sx.svgml(coeff, amp) +
      '\t\n' +
      Sy.svgml(coeff, amp) +
      '\t\n' +
      texteParPosition(
        this.textAbs,
        x0,
        (-1 * 20) / coeff,
        0,
        this.stringColor,
      ).svg(coeff) +
      '\t\n' +
      texteParPosition(
        this.textOrd,
        (-1 * 20) / coeff,
        y0,
        0,
        this.stringColor,
      ).svg(coeff)
    )
  }

  tikzml(amp: number) {
    const x0 = this.x / this.xscale
    const y0 = this.y / this.yscale
    const M = pointAbstrait(x0, y0)
    const X = pointAbstrait(x0, 0)
    const Y = pointAbstrait(0, y0)
    const Sx =
      M.x === X.x && M.y === X.y ? vide2d() : segment(M, X, this.stringColor)
    const Sy =
      M.x === Y.x && M.y === Y.y ? vide2d() : segment(Y, M, this.stringColor)
    // vide2D n'a pas de styleExtremites ni pointilles mais on s'en fiche car on ne l'affiche pas : son svg() est vide
    Sx.styleExtremites = '->'
    Sy.styleExtremites = '->'
    Sx.pointilles = 5
    Sy.pointilles = 5
    return (
      '\t\n' +
      Sx.tikzml(amp) +
      '\t\n' +
      Sy.tikzml(amp) +
      '\t\n' +
      texteParPosition(
        this.textAbs,
        x0,
        -1 / context.scale,
        0,
        this.stringColor,
      ).tikz() +
      '\t\n' +
      texteParPosition(
        this.textOrd,
        -1 / context.scale,
        y0,
        0,
        this.stringColor,
      ).tikz()
    )
  }
}

export function lectureAntecedent(
  x: number,
  y: number,
  xscale: number,
  yscale: number,
  color = 'black',
  textOrd: string,
  textAbs: string,
): LectureAntecedent {
  return new LectureAntecedent(x, y, xscale, yscale, color, textOrd, textAbs)
}
