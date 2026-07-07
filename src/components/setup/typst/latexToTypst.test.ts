import { describe, expect, it } from 'vitest'
import {
  escapeTypstText,
  htmlToTypst,
  latexMathToTypst,
  sanitizeSvg,
  svgToTypstImage,
} from './latexToTypst'

describe('latexMathToTypst', () => {
  it('convertit les fractions et opérations usuelles', () => {
    expect(latexMathToTypst('\\dfrac{3}{4}+2\\times x')).toBe(
      'frac(3, 4) + 2 times x',
    )
  })

  it('convertit les racines et symboles', () => {
    expect(latexMathToTypst('\\sqrt{25}')).toBe('sqrt(25)')
    expect(latexMathToTypst('x\\in\\mathbb{R}')).toBe('x in RR')
  })

  it('rend la virgule décimale française sans espace', () => {
    expect(latexMathToTypst('3,5')).toBe('3","5')
    expect(latexMathToTypst('3{,}5')).toBe('3","5')
    expect(latexMathToTypst('\\dfrac{3,5}{2}')).toBe('frac(3","5, 2)')
  })

  it('convertit \\num et \\numprint en gardant les espaces fines', () => {
    expect(latexMathToTypst('\\num{12\\,345,6}')).toBe('12 thin 345","6')
  })

  it('convertit la mise en évidence colorée de MathALÉA', () => {
    const result = latexMathToTypst('{\\color{#f15929}\\boldsymbol{x=2}}')
    expect(result).toContain('rgb("#f15929")')
    expect(result).toContain('bold(x = 2)')
  })

  it('convertit le texte inclus dans les formules', () => {
    expect(latexMathToTypst('5\\,\\text{cm}')).toBe('5 thin "cm"')
  })

  it("supprime le saut de ligne final qui échapperait le $ fermant", () => {
    expect(latexMathToTypst('2x=4\\\\')).toBe('2 x = 4')
    expect(latexMathToTypst('\\begin{aligned}2x&=4\\\\x&=2\\\\\\end{aligned}')).toBe(
      '2 x &= 4 \\ x &= 2',
    )
  })

  it('décode les entités HTML présentes dans la formule', () => {
    expect(latexMathToTypst('\\text{Donc&nbsp;: }x=2')).toBe(
      '"Donc : " x = 2',
    )
  })

  it('convertit \\textbf en mode mathématique', () => {
    expect(latexMathToTypst('\\textbf{cm}')).toBe('upright(bold(c m))')
  })

  it('renvoie la formule en chaîne littérale quand la conversion échoue', () => {
    // environnement non pris en charge par tex2typst
    expect(latexMathToTypst('\\begin{tabular}{cc}a&b\\end{tabular}')).toBe(
      '"\\\\begin{tabular}{cc}a&b\\\\end{tabular}"',
    )
  })
})

describe('escapeTypstText', () => {
  it('échappe les caractères spéciaux du balisage Typst', () => {
    expect(escapeTypstText('50 % de #tag *gras* [a]')).toBe(
      '50 % de \\#tag \\*gras\\* \\[a\\]',
    )
    expect(escapeTypstText('2 $ et _souligné_')).toBe(
      '2 \\$ et \\_souligné\\_',
    )
  })
})

describe('htmlToTypst', () => {
  it('convertit du texte avec formules', () => {
    expect(htmlToTypst('Calculer $\\dfrac{1}{2}+\\dfrac{1}{3}$.')).toBe(
      'Calculer $frac(1, 2) + frac(1, 3)$.',
    )
  })

  it('convertit les balises de mise en forme', () => {
    expect(htmlToTypst('Un mot <b>important</b> et <em>discret</em>')).toBe(
      'Un mot #strong[important] et #emph[discret]',
    )
  })

  it('convertit les sauts de ligne', () => {
    expect(htmlToTypst('ligne 1<br>ligne 2')).toBe('ligne 1\\\nligne 2')
  })

  it('convertit les listes', () => {
    expect(htmlToTypst('<ul><li>un</li><li>deux</li></ul>')).toBe(
      '- un\n- deux',
    )
    expect(htmlToTypst('<ol><li>un</li><li>deux</li></ol>')).toBe(
      '+ un\n+ deux',
    )
  })

  it('décode les entités HTML', () => {
    expect(htmlToTypst('5&nbsp;: un score &lt; 10')).toBe(
      '5 : un score \\< 10',
    )
  })

  it("échappe le texte qui ressemble à du balisage Typst", () => {
    expect(htmlToTypst('code #include *fort*')).toBe(
      'code \\#include \\*fort\\*',
    )
  })

  it('remplace les figures SVG par un encart sans collecteur', () => {
    const result = htmlToTypst('Voir la figure : <svg><rect/></svg>')
    expect(result).toContain('figure non convertie')
    expect(result).not.toContain('<svg')
  })

  it('collecte les figures SVG et les référence par #fig-N', () => {
    const figures: string[] = []
    const result = htmlToTypst(
      'Figure 1 : <svg width="96" height="48"><rect/></svg> et figure 2 : <svg><circle/></svg>',
      figures,
    )
    expect(result).toBe('Figure 1 : #fig-1 et figure 2 : #fig-2')
    expect(figures).toHaveLength(2)
    expect(figures[0]).toBe(
      'image(bytes("<svg width=\\"96\\" height=\\"48\\"><rect/></svg>"), format: "svg", width: 72.0pt)',
    )
    expect(figures[1]).toBe(
      'image(bytes("<svg><circle/></svg>"), format: "svg")',
    )
  })

  it('remplace les images et les tableaux par un encart', () => {
    expect(htmlToTypst('<img src="a.png">')).toContain('image non convertie')
    expect(htmlToTypst('<table><tr><td>1</td></tr></table>')).toContain(
      'tableau non converti',
    )
  })

  it('ignore les balises inconnues en gardant leur contenu', () => {
    expect(htmlToTypst('<span class="katex">du texte</span>')).toBe('du texte')
  })

  it('protège les lignes commençant par un caractère de bloc Typst', () => {
    expect(htmlToTypst('4 + 4<br>- 2')).toBe('4 + 4\\\n\\- 2')
  })

  it('referme les blocs de mise en forme non refermés', () => {
    expect(htmlToTypst('<b>gras')).toBe('#strong[gras]')
  })
})

describe('sanitizeSvg', () => {
  it('supprime le point-virgule parasite des textes mathalea2d', () => {
    // forme brute générée par lib/2d/textes.ts
    expect(
      sanitizeSvg('<text font-family= "Book Antiqua"; font-style= "italic" >F</text>'),
    ).toBe('<text font-family="Book Antiqua" font-style= "italic" >F</text>')
    // forme sérialisée par le DOM
    expect(
      sanitizeSvg('<text font-family="Book Antiqua" ;="" font-style="italic">F</text>'),
    ).toBe('<text font-family="Book Antiqua" font-style="italic">F</text>')
  })

  it('rend les entités compatibles XML', () => {
    expect(sanitizeSvg('<text>a&nbsp;b &amp; c & d</text>')).toBe(
      '<text>a&#160;b &amp; c &amp; d</text>',
    )
  })
})

describe('svgToTypstImage', () => {
  it("reprend la largeur de la figure en points (96 px = 72 pt)", () => {
    expect(svgToTypstImage('<svg width="170.4" height="105.8"></svg>')).toBe(
      'image(bytes("<svg width=\\"170.4\\" height=\\"105.8\\"></svg>"), format: "svg", width: 127.8pt)',
    )
  })

  it('omet la largeur quand la figure ne la précise pas', () => {
    expect(svgToTypstImage('<svg viewBox="0 0 10 10"></svg>')).toBe(
      'image(bytes("<svg viewBox=\\"0 0 10 10\\"></svg>"), format: "svg")',
    )
  })
})
