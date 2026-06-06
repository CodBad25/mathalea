import { expect, test } from 'vitest'
import { Polynome } from '../../src/lib/mathFonctions/Polynome'

const p0 = new Polynome({ coeffs: [0] })
const p1 = new Polynome({ coeffs: [1] })

test('Somme et multiplication de polynômes', () => {
  const p = new Polynome({
    rand: true,
    coeffs: [[10, true], [10, true], [10, true], 0, [10, true]],
  })
  const pp = new Polynome({
    rand: true,
    coeffs: [[10, true], [10, true], [10, true], 0, [10, true]],
  })
  const p2 = p.multiply(p1)
  const p3 = p.add(p0)
  const pFoisPp = p.multiply(pp)
  const ppFoisP = pp.multiply(p)
  const pPlusPp = p.add(pp)
  const ppPlusP = pp.add(p)
  const pMoinsPp = p.add(pp.multiply(-1))
  const ppMoinsP = pp.add(p.multiply(-1))

  // logIfDebug(`pMoinsPP = ${JSON.stringify(pMoinsPp)}`)
  // logIfDebug(`ppMoinsP = ${JSON.stringify(ppMoinsP)}`)
  expect(p.isEqual(p2)).toBe(true)
  expect(p.isEqual(p3)).toBe(true)
  expect(p3.isEqual(p2)).toBe(true)
  expect(pFoisPp.isEqual(ppFoisP)).toBe(true)
  expect(pPlusPp.isEqual(ppPlusP)).toBe(true)
  expect(pMoinsPp.isEqual(ppMoinsP.multiply(-1))).toBe(true)
  expect(p.primitive0().derivee().isEqual(p)).toBe(true)
})
