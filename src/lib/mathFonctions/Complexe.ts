import FractionEtendue from '../../modules/FractionEtendue'
import { fraction } from '../../modules/fractions'
import { ecritureAlgebriqueSauf1 } from '../outils/ecritures'
import { texNombre } from '../outils/texNombre'

function numerise(c: Complexe): Complexe {
  let re: number | FractionEtendue
  let im: number | FractionEtendue
  if (c.re instanceof FractionEtendue) {
    if (c.re.denIrred === 1) {
      re = c.re.numIrred
    } else {
      re = c.re.simplifie()
    }
  } else {
    re = c.re
  }
  if (c.im instanceof FractionEtendue) {
    if (c.im.denIrred === 1) {
      im = c.im.numIrred
    } else {
      im = c.im.simplifie()
    }
  } else {
    im = c.im
  }
  return new Complexe(re, im)
}

// Classe pour représenter les nombres complexes, avec des méthodes pour les opérations algébriques
/**
 * @author : Jean-Claude Lhote
 */
export class Complexe {
  public re: number | FractionEtendue
  public im: number | FractionEtendue
  public arg: number
  public mod: number
  public isReal: boolean
  public isImaginary: boolean

  constructor(re: number | FractionEtendue, im: number | FractionEtendue) {
    this.re = re
    this.im = im
    // Pour arg et mod, on convertit en nombre si besoin
    const reNum = re instanceof FractionEtendue ? re.numIrred / re.denIrred : re
    const imNum = im instanceof FractionEtendue ? im.numIrred / im.denIrred : im
    this.arg = Math.atan2(imNum, reNum)
    this.mod = Math.sqrt(reNum * reNum + imNum * imNum)
    this.isReal = imNum === 0
    this.isImaginary = reNum === 0
  }

  add(other: Complexe): Complexe {
    const reA =
      this.re instanceof FractionEtendue
        ? this.re
        : fraction(this.re, undefined)
    const reB =
      other.re instanceof FractionEtendue
        ? other.re
        : fraction(other.re, undefined)
    const imA =
      this.im instanceof FractionEtendue
        ? this.im
        : fraction(this.im, undefined)
    const imB =
      other.im instanceof FractionEtendue
        ? other.im
        : fraction(other.im, undefined)
    const re = reA.sommeFraction(reB)
    const im = imA.sommeFraction(imB)
    return numerise(new Complexe(re, im))
  }

  sub(other: Complexe): Complexe {
    const reA =
      this.re instanceof FractionEtendue
        ? this.re
        : fraction(this.re, undefined)
    const reB =
      other.re instanceof FractionEtendue
        ? other.re
        : fraction(other.re, undefined)
    const imA =
      this.im instanceof FractionEtendue
        ? this.im
        : fraction(this.im, undefined)
    const imB =
      other.im instanceof FractionEtendue
        ? other.im
        : fraction(other.im, undefined)
    const re = reA.differenceFraction(reB)
    const im = imA.differenceFraction(imB)
    return numerise(new Complexe(re, im))
  }

  mul(other: Complexe): Complexe {
    const a =
      this.re instanceof FractionEtendue
        ? this.re
        : fraction(this.re, undefined)
    const b =
      this.im instanceof FractionEtendue
        ? this.im
        : fraction(this.im, undefined)
    const c =
      other.re instanceof FractionEtendue
        ? other.re
        : fraction(other.re, undefined)
    const d =
      other.im instanceof FractionEtendue
        ? other.im
        : fraction(other.im, undefined)
    const re = a.produitFraction(c).differenceFraction(b.produitFraction(d))
    const im = a.produitFraction(d).sommeFraction(b.produitFraction(c))
    return numerise(new Complexe(re, im))
  }

  pow(n: number): Complexe {
    if (n === 0) {
      return new Complexe(1, 0)
    }
    if (n === 1) {
      return this
    }
    if (n === 2) {
      return this.mul(this)
    }
    let result: Complexe = new Complexe(this.re, this.im)
    for (let i = 2; i <= n; i++) {
      result = result.mul(this)
    }
    return numerise(result)
  }

  div(other: Complexe): Complexe {
    const a =
      this.re instanceof FractionEtendue
        ? this.re
        : fraction(this.re, undefined)
    const b =
      this.im instanceof FractionEtendue
        ? this.im
        : fraction(this.im, undefined)
    const c =
      other.re instanceof FractionEtendue
        ? other.re
        : fraction(other.re, undefined)
    const d =
      other.im instanceof FractionEtendue
        ? other.im
        : fraction(other.im, undefined)
    const denom = c.produitFraction(c).sommeFraction(d.produitFraction(d))
    const re = a
      .produitFraction(c)
      .sommeFraction(b.produitFraction(d))
      .diviseFraction(denom)
    const im = b
      .produitFraction(c)
      .differenceFraction(a.produitFraction(d))
      .diviseFraction(denom)
    return numerise(new Complexe(re, im))
  }

  inverse(): Complexe {
    const a =
      this.re instanceof FractionEtendue
        ? this.re
        : fraction(this.re, undefined)
    const b =
      this.im instanceof FractionEtendue
        ? this.im
        : fraction(this.im, undefined)

    const denom = a.produitFraction(a).sommeFraction(b.produitFraction(b))
    const re = a.diviseFraction(denom)
    const im = b.oppose().diviseFraction(denom)
    return numerise(new Complexe(re, im))
  }

  conjugue(): Complexe {
    const im = this.im instanceof FractionEtendue ? this.im.oppose() : -this.im
    return numerise(new Complexe(this.re, im))
  }

  negate(): Complexe {
    const re = this.re instanceof FractionEtendue ? this.re.oppose() : -this.re
    const im = this.im instanceof FractionEtendue ? this.im.oppose() : -this.im
    return numerise(new Complexe(re, im))
  }

  isEqual(other: Complexe): boolean {
    let isEqualRe: boolean
    let isEqualIm: boolean
    if (
      this.re instanceof FractionEtendue &&
      other.re instanceof FractionEtendue
    ) {
      isEqualRe =
        this.re.numIrred === other.re.numIrred &&
        this.re.denIrred === other.re.denIrred
    } else {
      isEqualRe = Number(this.re) === Number(other.re)
    }
    if (
      this.im instanceof FractionEtendue &&
      other.im instanceof FractionEtendue
    ) {
      isEqualIm =
        this.im.numIrred === other.im.numIrred &&
        this.im.denIrred === other.im.denIrred
    } else {
      isEqualIm = Number(this.im) === Number(other.im)
    }
    return isEqualRe && isEqualIm
  }

  toString(): string {
    if (this.isReal) {
      return Number(this.re).toString()
    } else if (this.isImaginary) {
      return `${Number(this.im).toString()}i`
    }
    return `${Number(this.re).toString()} ${Number(this.im) >= 0 ? '+' : '-'} ${Math.abs(
      this.im instanceof FractionEtendue
        ? this.im.numIrred / this.im.denIrred
        : this.im,
    )}i`
  }

  tex(): string {
    if (this.isReal) {
      return this.re instanceof FractionEtendue
        ? this.re.texFraction
        : texNombre(this.re, 8)
    } else if (this.isImaginary) {
      return `${ecritureAlgebriqueSauf1(this.im)}i`
    }
    return `${this.re instanceof FractionEtendue ? this.re.texFSD : texNombre(this.re, 8)}${ecritureAlgebriqueSauf1(this.im)}i`
  }
}
