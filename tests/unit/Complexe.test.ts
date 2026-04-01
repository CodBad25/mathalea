import { describe, expect, it } from 'vitest'
import { Complexe } from '../../src/lib/mathFonctions/Complexe'
import FractionEtendue from '../../src/modules/FractionEtendue'

// Tests unitaires pour la classe Complexe
// @author : Jean-Claude Lhote
describe('Complexe', () => {
  it('devrait créer un complexe avec number ou FractionEtendue', () => {
    const c1 = new Complexe(3, 4)
    expect(c1.re).toBe(3)
    expect(c1.im).toBe(4)
    expect(c1.mod).toBeCloseTo(5)
    expect(c1.arg).toBeCloseTo(Math.atan2(4, 3))
    expect(c1.isReal).toBe(false)
    expect(c1.isImaginary).toBe(false)

    const f1 = new FractionEtendue(1, 2)
    const f2 = new FractionEtendue(2, 3)
    const c2 = new Complexe(f1, f2)
    expect(c2.re).toBeInstanceOf(FractionEtendue)
    expect(c2.im).toBeInstanceOf(FractionEtendue)
    expect((c2.re as FractionEtendue).numIrred).toBe(1)
    expect((c2.re as FractionEtendue).denIrred).toBe(2)
    expect((c2.im as FractionEtendue).numIrred).toBe(2)
    expect((c2.im as FractionEtendue).denIrred).toBe(3)
    expect(c2.isReal).toBe(false)
    expect(c2.isImaginary).toBe(false)
  })

  it('devrait détecter un nombre réel', () => {
    const c = new Complexe(5, 0)
    expect(c.isReal).toBe(true)
    expect(c.isImaginary).toBe(false)
  })

  it('devrait détecter un nombre imaginaire pur', () => {
    const c = new Complexe(0, -2)
    expect(c.isReal).toBe(false)
    expect(c.isImaginary).toBe(true)
  })

  it('add : addition de deux complexes (number et FractionEtendue)', () => {
    const a = new Complexe(1, 2)
    const b = new Complexe(new FractionEtendue(3, 2), new FractionEtendue(5, 2))
    const r = a.add(b)
    expect(r.re).toBeInstanceOf(FractionEtendue)
    expect(r.im).toBeInstanceOf(FractionEtendue)
    expect((r.re as FractionEtendue).numIrred).toBe(5)
    expect((r.re as FractionEtendue).denIrred).toBe(2)
    expect((r.im as FractionEtendue).numIrred).toBe(9)
    expect((r.im as FractionEtendue).denIrred).toBe(2)
  })

  it('sub : soustraction de deux complexes (number et FractionEtendue)', () => {
    const a = new Complexe(5, 7)
    const b = new Complexe(new FractionEtendue(1, 2), new FractionEtendue(1, 3))
    const r = a.sub(b)
    expect(r.re).toBeInstanceOf(FractionEtendue)
    expect(r.im).toBeInstanceOf(FractionEtendue)
    expect((r.re as FractionEtendue).numIrred).toBe(9)
    expect((r.re as FractionEtendue).denIrred).toBe(2)
    expect((r.im as FractionEtendue).numIrred).toBe(20)
    expect((r.im as FractionEtendue).denIrred).toBe(3)
  })

  it('mul : multiplication de deux complexes (fractions)', () => {
    const a = new Complexe(new FractionEtendue(2, 3), new FractionEtendue(1, 2))
    const b = new Complexe(
      new FractionEtendue(3, 4),
      new FractionEtendue(-2, 5),
    )
    const r = a.mul(b)
    expect(r.re).toBeInstanceOf(FractionEtendue)
    expect(r.im).toBeInstanceOf(FractionEtendue)
    // Calculs manuels : re = 2/3*3/4 - 1/2*(-2/5) = 1/2 + 1/5 = 7/10
    expect((r.re as FractionEtendue).numIrred).toBe(7)
    expect((r.re as FractionEtendue).denIrred).toBe(10)
    // im = 2/3*(-2/5) + 1/2*3/4 = -4/15 + 3/8 = ( -32 + 45 ) / 120 = 13/120
    expect((r.im as FractionEtendue).numIrred).toBe(13)
    expect((r.im as FractionEtendue).denIrred).toBe(120)
  })

  it('div : division de deux complexes (fractions)', () => {
    const a = new Complexe(new FractionEtendue(1, 2), new FractionEtendue(1, 3))
    const b = new Complexe(
      new FractionEtendue(2, 5),
      new FractionEtendue(-1, 4),
    )
    const r = a.div(b)
    expect(r.re).toBeInstanceOf(FractionEtendue)
    expect(r.im).toBeInstanceOf(FractionEtendue)
    // Calculs manuels :
    // denom = (2/5)^2 + (-1/4)^2 = 4/25 + 1/16 = (64+25)/400 = 89/400
    // re = (1/2*2/5 + 1/3*-1/4)/denom = (1/5 - 1/12)/(89/400) = (12-5)/60 * 400/89 = 7/60*400/89 = 2800/5340 = 140/267
    // im = (1/3*2/5 - 1/2*-1/4)/denom = (2/15 + 1/8)/(89/400) = (16+15)/120*400/89 = 31/120*400/89 = 12400/10680 = 310/267
    expect((r.re as FractionEtendue).numIrred).toBe(140)
    expect((r.re as FractionEtendue).denIrred).toBe(267)
    expect((r.im as FractionEtendue).numIrred).toBe(310)
    expect((r.im as FractionEtendue).denIrred).toBe(267)
  })

  it('inverse : inverse du complexe (fraction)', () => {
    const c = new Complexe(new FractionEtendue(2, 3), new FractionEtendue(1, 2))
    const inv = c.inverse()
    // denom = (2/3)^2 + (1/2)^2 = 4/9 + 1/4 = (16+9)/36 = 25/36
    // re = (2/3)/(25/36) = 2/3*36/25 = 72/75 = 24/25
    // im = -(1/2)/(25/36) = -1/2*36/25 = -36/50 = -18/25
    expect(inv.re).toBeInstanceOf(FractionEtendue)
    expect(inv.im).toBeInstanceOf(FractionEtendue)
    expect((inv.re as FractionEtendue).numIrred).toBe(24)
    expect((inv.re as FractionEtendue).denIrred).toBe(25)
    expect((inv.im as FractionEtendue).numIrred).toBe(-18)
    expect((inv.im as FractionEtendue).denIrred).toBe(25)
  })

  it('toString : affichage standard et fractions', () => {
    expect(new Complexe(2, 0).toString()).toBe('2')
    expect(new Complexe(0, -3).toString()).toBe('-3i')
    expect(new Complexe(1, 2).toString()).toBe('1 + 2i')
    expect(new Complexe(1, -2).toString()).toBe('1 - 2i')
    expect(new Complexe(new FractionEtendue(1, 2), 0).toString()).toBe('0.5')
    expect(new Complexe(0, new FractionEtendue(-3, 4)).toString()).toBe(
      '-0.75i',
    )
    expect(
      new Complexe(
        new FractionEtendue(1, 2),
        new FractionEtendue(2, 3),
      ).toString(),
    ).toBe('0.5 + 0.6666666666666666i')
    expect(
      new Complexe(
        new FractionEtendue(1, 2),
        new FractionEtendue(-2, 3),
      ).toString(),
    ).toBe('0.5 - 0.6666666666666666i')
  })

  describe('tex', () => {
    it('ne plante pas pour des nombres', () => {
      const c = new Complexe(3, 4)
      expect(() => c.tex()).not.toThrow()
    })

    it('affiche bien un réel (number)', () => {
      const c = new Complexe(2, 0)
      expect(c.tex()).toBe('2')
    })

    it('affiche bien un imaginaire pur (number)', () => {
      const c = new Complexe(0, -3)
      expect(c.tex()).toBe('-3i')
    })

    it('affiche bien un complexe (number)', () => {
      const c = new Complexe(1, 2)
      expect(c.tex()).toBe('1+2i')
    })

    it('affiche bien un réel (FractionEtendue)', () => {
      const c = new Complexe(new FractionEtendue(1, 2), 0)
      expect(c.tex()).toBe('\\dfrac{1}{2}')
    })

    it('affiche bien un imaginaire pur (FractionEtendue)', () => {
      const c = new Complexe(0, new FractionEtendue(-3, 4))
      expect(c.tex()).toBe('-\\dfrac{3}{4}i')
    })

    it('affiche bien un complexe (FractionEtendue)', () => {
      const c = new Complexe(
        new FractionEtendue(1, 2),
        new FractionEtendue(2, 3),
      )
      expect(c.tex()).toBe('\\dfrac{1}{2}+\\dfrac{2}{3}i')
    })

    it('affiche bien un complexe avec imaginaire négatif (FractionEtendue)', () => {
      const c = new Complexe(
        new FractionEtendue(1, 2),
        new FractionEtendue(-2, 3),
      )
      expect(c.tex()).toBe('\\dfrac{1}{2}-\\dfrac{2}{3}i')
    })
  })

  it('conjugue() retourne le conjugué', () => {
    const c = new Complexe(2, 3)
    const conj = c.conjugue()
    expect(conj.re).toBe(2)
    expect(conj.im).toBe(-3)

    const f1 = new FractionEtendue(1, 2)
    const f2 = new FractionEtendue(2, 3)
    const c2 = new Complexe(f1, f2)
    const conj2 = c2.conjugue()
    expect(conj2.re).toBeInstanceOf(FractionEtendue)
    expect(conj2.im).toBeInstanceOf(FractionEtendue)
    expect((conj2.re as FractionEtendue).numIrred).toBe(1)
    expect((conj2.re as FractionEtendue).denIrred).toBe(2)
    expect((conj2.im as FractionEtendue).numIrred).toBe(-2)
    expect((conj2.im as FractionEtendue).denIrred).toBe(3)
  })

  it('negate() retourne l opposé', () => {
    const c = new Complexe(2, -3)
    const neg = c.negate()
    expect(neg.re).toBe(-2)
    expect(neg.im).toBe(3)

    const f1 = new FractionEtendue(1, 2)
    const f2 = new FractionEtendue(-2, 3)
    const c2 = new Complexe(f1, f2)
    const neg2 = c2.negate()
    expect(neg2.re).toBeInstanceOf(FractionEtendue)
    expect(neg2.im).toBeInstanceOf(FractionEtendue)
    expect((neg2.re as FractionEtendue).numIrred).toBe(-1)
    expect((neg2.re as FractionEtendue).denIrred).toBe(2)
    expect((neg2.im as FractionEtendue).numIrred).toBe(2)
    expect((neg2.im as FractionEtendue).denIrred).toBe(3)
  })

  it('isEqual() compare correctement', () => {
    const c1 = new Complexe(2, 3)
    const c2 = new Complexe(2, 3)
    const c3 = new Complexe(2, 4)
    expect(c1.isEqual(c2)).toBe(true)
    expect(c1.isEqual(c3)).toBe(false)

    const f1 = new FractionEtendue(1, 2)
    const f2 = new FractionEtendue(2, 3)
    const f3 = new FractionEtendue(1, 2)
    const f4 = new FractionEtendue(3, 4)
    const cf1 = new Complexe(f1, f2)
    const cf2 = new Complexe(f3, f2)
    const cf3 = new Complexe(f1, f4)
    expect(cf1.isEqual(cf2)).toBe(true)
    expect(cf1.isEqual(cf3)).toBe(false)
  })

  it('pow() élève à la puissance entière', () => {
    const c = new Complexe(2, 3)
    const c2 = c.pow(2)
    // (2+3i)^2 = 4 + 12i + 9i^2 = 4 + 12i - 9 = -5 + 12i
    expect(c2.re).toBe(-5)
    expect(c2.im).toBe(12)
    const c0 = c.pow(0)
    expect(c0.re).toBe(1)
    expect(c0.im).toBe(0)

    const f1 = new FractionEtendue(1, 2)
    const f2 = new FractionEtendue(1, 3)
    const cf = new Complexe(f1, f2)
    const cf2 = cf.pow(2)
    // (1/2 + 1/3i)^2 = 1/4 + 2/6i + 1/9i^2 = 1/4 + 1/3i - 1/9 = (1/4-1/9) + 1/3i = (9-4)/36 = 5/36
    expect((cf2.re as FractionEtendue).numIrred).toBe(5)
    expect((cf2.re as FractionEtendue).denIrred).toBe(36)
    expect((cf2.im as FractionEtendue).numIrred).toBe(1)
    expect((cf2.im as FractionEtendue).denIrred).toBe(3)
  })
})
