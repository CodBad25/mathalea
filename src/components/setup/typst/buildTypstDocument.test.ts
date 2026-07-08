import { describe, expect, it } from 'vitest'
import {
  buildTypstDocument,
  type TypstExerciseInput,
} from './buildTypstDocument'

const exercise = (
  overrides: Partial<TypstExerciseInput> = {},
): TypstExerciseInput => ({
  ref: '6e23-1',
  intro: '',
  questions: [],
  introCorrection: '',
  corrections: [],
  numbered: false,
  ...overrides,
})

describe('buildTypstDocument', () => {
  it('génère un document avec en-tête, exercice et correction', () => {
    const code = buildTypstDocument([
      exercise({
        intro: 'Calculer.',
        questions: ['$2+2$', '$3\\times 4$'],
        corrections: ['$2+2=4$', '$3\\times 4=12$'],
        numbered: true,
      }),
    ])
    expect(code).toContain('#set page(paper: "a4"')
    expect(code).toContain("Fiche d'exercices")
    expect(code).toContain('#titre-exercice[Exercice 1 #reference("6e23-1")]')
    expect(code).toContain('+ $2 + 2$\n+ $3 times 4$')
    expect(code).toContain('#if corrige [')
    expect(code).toContain('$3 times 4 = 12$')
  })

  it("n'ajoute pas de section corrections quand il n'y en a pas", () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).not.toContain('#if corrige [')
  })

  it('numérote les exercices dans leur ordre', () => {
    const code = buildTypstDocument([
      exercise({ questions: ['a'] }),
      exercise({ questions: ['b'], ref: '' }),
    ])
    expect(code).toContain('#titre-exercice[Exercice 1 #reference("6e23-1")]')
    expect(code).toContain('#titre-exercice[Exercice 2]')
  })

  it('déclare les figures SVG en tête et les référence dans le corps', () => {
    const code = buildTypstDocument([
      exercise({
        questions: ['Figure : <svg width="96"><rect/></svg>'],
        corrections: ['Corrigé : <svg><circle/></svg>'],
      }),
    ])
    expect(code).toContain('// ----- Figures (SVG embarqués) -----')
    expect(code).toContain('#let fig-1 = image(bytes(')
    expect(code).toContain('#let fig-2 = image(bytes(')
    expect(code).toContain('Figure : #(fig-1)')
    expect(code).toContain('Corrigé : #(fig-2)')
    // les définitions doivent précéder les références
    expect(code.indexOf('#let fig-1')).toBeLessThan(
      code.indexOf('Figure : #(fig-1)'),
    )
  })

  it('ajoute les helpers mathalea2d quand une figure contient des labels Typst', () => {
    const code = buildTypstDocument([
      exercise({
        questions: [
          '<div class="svgContainer"><div><svg class="mathalea2d" width="96" height="48"></svg><div class="divLatex" style="top: 10px; left: 20px; transform: rotate(0deg);" data-top=10 data-left=20><span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">1</annotation></semantics></math></span></span></div></div></div>',
        ],
      }),
    ])
    expect(code).toContain('// ----- Figures mathalea2d -----')
    expect(code).toContain('#let mathalea-figure')
    expect(code).toContain('#mathalea-figure(72.0pt, 36.0pt, fig-1, labels: (')
    expect(code).toContain('mathalea-label(15.0pt, 7.5pt, [$1$])')
  })

  it('génère un tableau natif sans dépendance externe', () => {
    const code = buildTypstDocument([
      exercise({
        questions: [
          '$\\def\\arraystretch{1.5}\\begin{array}{|l|c|}\\hline x & 1 \\\\ \\hline\\end{array}$',
        ],
      }),
    ])
    expect(code).not.toContain('@preview/tblr')
    expect(code).toContain('#table(')
  })

  it('importe taskize et règle les colonnes quand un QCM est présent', () => {
    const code = buildTypstDocument([
      exercise({
        questions: [
          '<div class="my-3">' +
            '<div class="ex1 inline-block"><input type="checkbox" disabled><label id="labelEx1Q0R0">$1$</label></div>' +
            '<div class="ex1 inline-block"><input type="checkbox" disabled><label id="labelEx1Q0R1">$2$</label></div>' +
            '</div>',
        ],
      }),
    ])
    expect(code).toContain('#import "@preview/taskize:0.2.5": tasks')
    expect(code).toContain('#let qcm-colonnes = 2')
    expect(code).toContain('#let qcm-bonne(')
    expect(code).toContain('#tasks(columns: qcm-colonnes')
  })

  it("n'ajoute pas de section figures sans figure", () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).not.toContain('----- Figures')
    expect(code).not.toContain('mathalea-figure')
  })

  it('affiche un avertissement pour un exercice non exportable', () => {
    const code = buildTypstDocument([
      exercise({ warning: 'Exercice interactif uniquement.' }),
    ])
    expect(code).toContain('Exercice interactif uniquement.')
  })
})
