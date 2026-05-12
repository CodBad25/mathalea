// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { all } from './combinators'
import { equals } from './equals'
import { extractedRadicands } from './extractedRadicands'
import { irreducibleFractions } from './irreducibleFractions'
import { noDecimal } from './noDecimal'
import { sameCartesianEquation } from './sameCartesianEquation'
import { setEquality } from './setEquality'
import { sameDescribedSet } from './sameDescribedSet'
import { stringEquals } from './stringEquals'

describe('checks heavy atoms', () => {
  describe('irreducibleFractions', () => {
    const accepted: Array<[string, string]> = [
      ['\\dfrac{1}{2}', 'anything'],
      ['-\\dfrac{3}{5}', 'anything'],
      ['\\dfrac{-3}{5}', 'anything'],
      ['\\dfrac{3}{-5}', 'anything'],
      ['\\frac{7}{13}', 'anything'],
      ['-\\frac{7}{13}', 'anything'],
      ['1/3', 'anything'],
      ['x+\\dfrac{2}{3}', 'anything'],
      ['1', 'anything'],
    ]

    const refused: Array<[string, string, string]> = [
      [
        '\\dfrac{2}{4}',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '2/4',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        ' 2/4 ',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '2 / 4',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        'x+2/4',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '\\frac{2}{ 4 }',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '\\tfrac{2}{4}',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      // MathLive serializes single-digit fractions without braces
      [
        '\\dfrac24',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '\\frac24',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '\\dfrac{10}{15}',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '2/2',
        '1',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '-4/6',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        '-\\dfrac{4}{6}',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
      [
        'x+\\dfrac{6}{9}',
        'anything',
        'Résultat incorrect car une fraction irréductible est attendue.',
      ],
    ]

    it.each(accepted)('accepts %s for %s', (saisie, answer) => {
      expect(all([irreducibleFractions()])(saisie, answer)).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it.each(refused)('refuses %s for %s', (saisie, answer, feedback) => {
      expect(all([irreducibleFractions()])(saisie, answer)).toMatchObject({
        isOk: false,
        score: 0,
        feedback,
      })
    })

    it('plain integer 0 (no fraction) passes — nothing to check', () => {
      // No fraction pattern found → hasReducibleFraction returns false → passes
      expect(all([irreducibleFractions()])('0', 'anything')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('\\dfrac{0}{3} fails — gcd(0,3)=3 ≠ 1 (reducible)', () => {
      // gcd(0, 3) = 3, so this fraction is considered reducible
      expect(
        all([irreducibleFractions()])('\\dfrac{0}{3}', 'anything'),
      ).toMatchObject({
        isOk: false,
        score: 0,
        feedback: 'Résultat incorrect car une fraction irréductible est attendue.',
      })
    })

    it('\\dfrac{1}{1} passes — gcd(1,1)=1', () => {
      expect(
        all([irreducibleFractions()])('\\dfrac{1}{1}', 'anything'),
      ).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('large primes \\dfrac{17}{19} pass', () => {
      expect(
        all([irreducibleFractions()])('\\dfrac{17}{19}', 'anything'),
      ).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('expression with both an irreducible and a reducible fraction fails', () => {
      // \\frac{1}{2} is ok but \\frac{2}{4} is reducible
      expect(
        all([irreducibleFractions()])(
          '\\dfrac{1}{2}+\\dfrac{2}{4}',
          'anything',
        ),
      ).toMatchObject({ isOk: false, score: 0 })
    })

    it('\\dfrac{-6}{9} fails — gcd(6,9)=3 ≠ 1', () => {
      expect(
        all([irreducibleFractions()])('\\dfrac{-6}{9}', 'anything'),
      ).toMatchObject({
        isOk: false,
        score: 0,
        feedback: 'Résultat incorrect car une fraction irréductible est attendue.',
      })
    })
  })

  describe('stringEquals', () => {
    it('accepts identical strings', () => {
      expect(all([stringEquals()])('Triangle ABC', 'Triangle ABC')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('refuses different strings', () => {
      expect(all([stringEquals()])('Triangle ABC', 'triangle ABC')).toMatchObject({
        isOk: false,
        score: 0,
        feedback: 'Le texte saisi ne correspond pas à la réponse attendue.',
      })
    })

    it('can ignore case and surrounding spaces', () => {
      expect(
        all([stringEquals({ ignoreCase: true, trim: true })])(
          '  triangle abc ',
          'Triangle ABC',
        ),
      ).toMatchObject({
        isOk: true,
        score: 1,
      })
    })
  })

  describe('sameCartesianEquation', () => {
    it('accepts equivalent cartesian equations of the same line', () => {
      expect(
        all([sameCartesianEquation()])('4x+6y-10=0', '2x+3y-5=0'),
      ).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('refuses equations not written with zero as right-hand side', () => {
      expect(
        all([sameCartesianEquation()])('2x+3y=5', '2x+3y-5=0'),
      ).toMatchObject({
        isOk: false,
        score: 0,
      })
    })

    it('refuses a different cartesian equation', () => {
      expect(
        all([sameCartesianEquation()])('2x+3y-4=0', '2x+3y-5=0'),
      ).toMatchObject({
        isOk: false,
        score: 0,
        feedback: "L'équation saisie ne décrit pas la droite attendue.",
      })
    })
  })

  describe('noDecimal', () => {
    const accepted = [
      '3',
      '-12',
      '0',
      '3.0',
      '-7,000',
      '\\dfrac{1}{2}',
      '\\sqrt{2}',
      '2\\sqrt{3}+\\dfrac{5}{7}',
      'x^2+2x+1',
    ]

    const refused = [
      '3.14',
      '-0.5',
      '2,75',
      '\\dfrac{1.2}{3}',
      '\\sqrt{2.25}',
      'x+0.1',
      '10^{-1}+2',
    ]

    it.each(accepted)('accepts %s', (saisie) => {
      expect(all([noDecimal()])(saisie, '0')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it.each(refused)('refuses %s', (saisie) => {
      expect(all([noDecimal()])(saisie, '0')).toMatchObject({
        isOk: false,
        score: 0,
        feedback: "La réponse ne doit pas contenir d'écriture décimale.",
      })
    })

    it('0.0 passes — Number("0.0") = 0 which is an integer', () => {
      // The pattern matches "0.0" but Number('0.0') === 0, which IS an integer → passes
      expect(all([noDecimal()])('0.0', '0')).toMatchObject({ isOk: true, score: 1 })
    })

    it('3. (trailing dot) passes — Number("3.") = 3 which is an integer', () => {
      // The pattern \d+[.,] matches "3." but Number('3.') === 3 → passes
      expect(all([noDecimal()])('3.', '0')).toMatchObject({ isOk: true, score: 1 })
    })

    it('large integer 1000 passes', () => {
      expect(all([noDecimal()])('1000', '0')).toMatchObject({ isOk: true, score: 1 })
    })

    it('3.14159 fails', () => {
      expect(all([noDecimal()])('3.14159', '0')).toMatchObject({
        isOk: false,
        score: 0,
        feedback: "La réponse ne doit pas contenir d'écriture décimale.",
      })
    })
  })

  describe('extractedRadicands', () => {
    const accepted: Array<[string, string]> = [
      ['2\\sqrt{3}', '\\sqrt{12}'],
      ['3\\sqrt{2}', '\\sqrt{18}'],
      ['5\\sqrt{2}', '\\sqrt{50}'],
      ['6', '\\sqrt{36}'],
      ['-2\\sqrt{3}', '-\\sqrt{12}'],
      ['2\\sqrt{3}+1', '\\sqrt{12}+1'],
      ['\\sqrt{7}', '\\sqrt{7}'],
    ]

    const refused: Array<[string, string]> = [
      ['\\sqrt{12}', '\\sqrt{12}'],
      ['\\sqrt{18}', '3\\sqrt{2}'],
      ['2\\sqrt{12}', '4\\sqrt{3}'],
      ['\\sqrt{4}', '2'],
      ['1+\\sqrt{8}', '1+2\\sqrt{2}'],
    ]

    it.each(accepted)('accepts %s for %s', (saisie, answer) => {
      expect(all([extractedRadicands()])(saisie, answer)).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it.each(refused)('refuses %s for %s', (saisie, answer) => {
      expect(all([extractedRadicands()])(saisie, answer)).toMatchObject({
        isOk: false,
        score: 0,
        feedback:
          'Les facteurs carrés doivent être extraits des racines carrées.',
      })
    })

    it('still refuses an extracted but unequal answer', () => {
      expect(
        all([extractedRadicands()])('2\\sqrt{5}', '\\sqrt{12}'),
      ).toMatchObject({
        isOk: false,
        score: 0,
        feedback: 'Le résultat est incorrect.',
      })
    })

    it('expression with no sqrt at all — passes (nothing to extract)', () => {
      // No sqrt pattern found → hasUnextractedSquareFactor returns false → passed
      expect(all([extractedRadicands()])('3', '3')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('\\sqrt{1} — extraireRacineCarree(1)=[1,1], outside=1 → passes', () => {
      // outside === 1 means no perfect square factor was found → not unextracted → passes
      expect(all([extractedRadicands()])('\\sqrt{1}', '\\sqrt{1}')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('\\sqrt{100} — extraireRacineCarree(100)=[10,1], outside=10 ≠ 1 → fails', () => {
      // 100 = 10², so outside=10 ≠ 1 → unextracted square factor → fails
      expect(all([extractedRadicands()])('\\sqrt{100}', '\\sqrt{100}')).toMatchObject({
        isOk: false,
        score: 0,
        feedback: 'Les facteurs carrés doivent être extraits des racines carrées.',
      })
    })

    it('2\\sqrt{3}+\\sqrt{8} — sqrt(3) is ok but sqrt(8) is not extracted → fails', () => {
      // sqrt(3): extraireRacineCarree(3)=[1,3], outside=1 → ok
      // sqrt(8): extraireRacineCarree(8)=[2,2], outside=2 ≠ 1 → unextracted
      // 2√3 + √8 = 2√3 + 2√2 numerically
      expect(
        all([extractedRadicands()])('2\\sqrt{3}+\\sqrt{8}', '2\\sqrt{3}+2\\sqrt{2}'),
      ).toMatchObject({
        isOk: false,
        score: 0,
        feedback: 'Les facteurs carrés doivent être extraits des racines carrées.',
      })
    })
  })

  describe('setEquality', () => {
    const accepted: Array<[string, string]> = [
      ['\\{1;2;3\\}', '\\{3;2;1\\}'],
      ['\\{-2;0;5\\}', '\\{5;-2;0\\}'],
      ['\\{\\dfrac{1}{2};\\sqrt{2}\\}', '\\{\\sqrt{2};0.5\\}'],
      ['\\emptyset', '\\emptyset'],
    ]

    const refused: Array<[string, string, string]> = [
      [
        '\\{1;2\\}',
        '\\{1;2;3\\}',
        'Toutes les valeurs sont correctes mais il en manque 1.',
      ],
      [
        '1;2;3\\}',
        '\\{1;2;3\\}',
        "Résultat incorrect car cet ensemble doit commencer par une accolade ou bien être l'ensemble vide.",
      ],
      [
        '\\{1;2;3',
        '\\{1;2;3\\}',
        "Résultat incorrect car cet ensemble doit se terminer par une accolade ou bien être l'ensemble vide.",
      ],
      [
        '\\{1;1;2\\}',
        '\\{1;2\\}',
        'Résultat incorrect car cet ensemble contient des valeurs qui se répètent.',
      ],
      ['\\{\\}', '\\emptyset', "L'ensemble est vide."],
    ]

    it.each(accepted)('accepts %s for %s', (saisie, answer) => {
      expect(all([setEquality()])(saisie, answer)).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it.each(refused)('refuses %s for %s', (saisie, answer, feedback) => {
      expect(all([setEquality()])(saisie, answer)).toMatchObject({
        isOk: false,
        score: 0,
        feedback,
      })
    })

    it('single element set matches itself', () => {
      expect(all([setEquality()])('\\{5\\}', '\\{5\\}')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('extra element in input — fails with count mismatch feedback', () => {
      expect(all([setEquality()])('\\{1;2;4\\}', '\\{1;2;3\\}')).toMatchObject({
        isOk: false,
        score: 0,
      })
    })

    it('order-independent matching — {3;1;2} equals {1;2;3}', () => {
      expect(all([setEquality()])('\\{3;1;2\\}', '\\{1;2;3\\}')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('custom feedbackKo overrides the default error message', () => {
      const compare = all([
        setEquality({ feedbackKo: 'Cet ensemble est incorrect.' }),
      ])

      const result = compare('\\{1;2\\}', '\\{1;2;3\\}')
      expect(result.isOk).toBe(false)
      expect(result.feedback).toBe('Cet ensemble est incorrect.')
    })
  })

  describe('sameDescribedSet', () => {
    it('accepts equivalent arithmetic progressions', () => {
      // 2x+2 and 2x describe sets with same step=2, same residue
      expect(all([sameDescribedSet()])('2x+2', '2x')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('accepts equivalent progressions with pi', () => {
      expect(all([sameDescribedSet()])('2k\\pi', '2k\\pi-2\\pi')).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('refuses progressions with different step', () => {
      // step 2 vs step 4 — different
      expect(all([sameDescribedSet()])('2x', '4x')).toMatchObject({
        isOk: false,
        score: 0,
      })
    })

    it('refuses progressions with different residue', () => {
      // 2x+1 vs 2x+2 — same step but different offset modulo step
      expect(all([sameDescribedSet()])('2x+1', '2x+2')).toMatchObject({
        isOk: false,
        score: 0,
      })
    })

    it('accepts with explicit variable option', () => {
      // 4n+1 and 4n-3 describe the same set (mod 4): 1 ≡ -3 (mod 4)
      expect(
        all([sameDescribedSet({ variable: 'n' })])('4n+1', '4n-3'),
      ).toMatchObject({
        isOk: true,
        score: 1,
      })
    })

    it('custom feedbackKo appears when failing', () => {
      const compare = all([
        sameDescribedSet({ feedbackKo: "Les ensembles ne coïncident pas." }),
      ])

      const result = compare('2x+1', '2x+2')
      expect(result.isOk).toBe(false)
      expect(result.feedback).toBe("Les ensembles ne coïncident pas.")
    })
  })

  it('composes the heavy checks with partial scoring', () => {
    const compare = all([
      equals({ weight: 0.6 }),
      extractedRadicands({ weight: 0.2 }),
      noDecimal({ weight: 0.2 }),
    ])

    expect(compare('\\sqrt{12}', '\\sqrt{12}')).toMatchObject({
      isOk: false,
      score: 0.8,
      details: [
        { name: 'equals', passed: true },
        { name: 'extractedRadicands', passed: false },
        { name: 'noDecimal', passed: true },
      ],
    })
  })
})
