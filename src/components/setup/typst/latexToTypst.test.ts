import { afterEach, describe, expect, it } from 'vitest'
import {
  escapeTypstText,
  htmlToTypst,
  latexMathToTypst,
  sanitizeSvg,
  setStaticImagePaths,
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

  it('convertit une union d\'intervalles en notation française mise en évidence sans casser les crochets', () => {
    // notation française "à crochets inversés" ([-4;-2[∪]3;4]) mêlée à
    // \color{} : le "[union]" produit par tex2typst pour \cup coïncide
    // textuellement avec une paire de crochets imbriquée dans les crochets
    // d'intervalle — un bug antérieur y voyait une paire [...] mal formée,
    // laissant un crochet orphelin qui désynchronisait tout le parenthésage.
    const result = latexMathToTypst(
      '{\\color{#f15929}\\boldsymbol{[-4\\,;\\,-2[\\cup ]3\\,;\\,4]}}',
    )
    expect(result).not.toMatch(/[[\]]/)
    const opens = (result.match(/\(/g) ?? []).length
    const closes = (result.match(/\)/g) ?? []).length
    expect(opens).toBe(closes)
    expect(result).toContain('bracket.l')
    expect(result).toContain('bracket.r')
    expect(result).toContain('union')
  })

  it('convertit le texte inclus dans les formules via #txt (police du texte)', () => {
    expect(latexMathToTypst('5\\,\\text{cm}')).toBe('5 thin #txt("cm")')
  })

  it('gère les unités avec exposant et $ imbriqués dans \\text{}', () => {
    // unités MathALÉA écrites `m$^2$` / `$\\text{cm}^2$` : le $ intérieur
    // rebascule en mode math dans \text{} — ne doit pas casser la conversion
    expect(latexMathToTypst('387\\text{ m$^2$/h}')).toBe(
      '387 #txt(" m")^2 #txt("/h")',
    )
    expect(latexMathToTypst('\\text{ dam$^2$}')).toBe('#txt(" dam")^2')
    expect(latexMathToTypst('648\\text{ $\\text{cm}^2$/h}')).toBe(
      '648 " " #txt("cm")^2 #txt("/h")',
    )
  })

  it('ne coupe pas un bloc $…$ sur un $ imbriqué dans une accolade', () => {
    // le $ de `m$^2$` est dans les accolades de \text{} : il fait partie du
    // bloc et ne le referme pas prématurément
    expect(
      htmlToTypst('$387\\text{ m$^2$/h} = \\dfrac{387\\text{ m$^2$}}{1}$'),
    ).toBe('$387 #txt(" m")^2 #txt("/h") = frac(387 #txt(" m")^2, 1)$')
  })

  it('supprime le saut de ligne final qui échapperait le $ fermant', () => {
    expect(latexMathToTypst('2x=4\\\\')).toBe('2 x = 4')
    expect(
      latexMathToTypst('\\begin{aligned}2x&=4\\\\x&=2\\\\\\end{aligned}'),
    ).toBe('2 x &= 4 \\ x &= 2')
  })

  it('décode les entités HTML présentes dans la formule', () => {
    expect(latexMathToTypst('\\text{Donc&nbsp;: }x=2')).toBe(
      '#txt("Donc\u00a0: ") x = 2',
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

describe('latexMathToTypst — accents nus en mode maths', () => {
  // Un mot accentué oublié hors de \text{} (erreur d'auteur d'exercice, ex.
  // ordinaux « ième », « ère ») est décomposé lettre par lettre par
  // tex2typst (`n^{ième}` → `n^(i è m e)`) : chaque lettre accentuée devient
  // alors un caractère isolé en mode maths, que certaines polices maths
  // (ex. Noto Sans Math, dépourvue des lettres latines accentuées dans sa
  // table cmap) ne peuvent pas afficher (« shaping ... yielded more than
  // one glyph »). `preprocessTex` protège ces mots en les enveloppant dans
  // \text{}, rendus ensuite via #txt (police du texte, jamais celle des
  // maths — sûr même quand la police maths ne couvre pas les accents).
  it('protège un mot accentué en exposant oublié hors de \\text{}', () => {
    expect(latexMathToTypst('n^{ième}')).toBe('n^(#txt("ième"))')
  })

  it('protège un mot accentué en indice oublié hors de \\text{}', () => {
    expect(latexMathToTypst('a_{à}')).toBe('a_(#txt("à"))')
  })

  it('protège un mot entièrement accentué (aucune lettre ASCII)', () => {
    // "à" seul : aucune lettre a-z, cas particulier qui échappait à
    // l'ancien marquage (qui exigeait une lettre ASCII avant #txt)
    expect(latexMathToTypst('à')).toBe('#txt("à")')
  })

  it('protège un caractère accentué isolé au milieu d\'une formule', () => {
    expect(latexMathToTypst('x = é')).toBe('x = #txt("é")')
  })

  it('laisse les mots déjà protégés par \\text{} inchangés', () => {
    expect(latexMathToTypst('3 \\text{ à } 5')).toBe('3 #txt(" à ") 5')
  })
})

describe('escapeTypstText', () => {
  it('échappe les caractères spéciaux du balisage Typst', () => {
    expect(escapeTypstText('50 % de #tag *gras* [a]')).toBe(
      '50 % de \\#tag \\*gras\\* \\[a\\]',
    )
    expect(escapeTypstText('2 $ et _souligné_')).toBe('2 \\$ et \\_souligné\\_')
  })
})

describe('latexMathToTypst — commandes de taille', () => {
  it('supprime \\large même collé à un chiffre', () => {
    // miseEnEvidence(`\\large${n}`) produit `\large5` sans espace
    expect(latexMathToTypst('\\large5')).toBe('5')
    expect(
      latexMathToTypst('{\\color{#216D9A}\\boldsymbol{\\large5}}'),
    ).not.toContain('large')
    expect(latexMathToTypst('\\Large 12 + \\small3')).toBe('12 + 3')
  })
})

describe('htmlToTypst — schémas en barres (SchemaEnBoite)', () => {
  const schemaHtml =
    '<div class="SchemaContainer">' +
    '<div class="SchemaTop" style="grid-row: 1; grid-column-start: 1; grid-column-end: 10; text-align:center; border: none"; --brace-color: black">' +
    '<div class="latexAccoladeTop" style="text-align: center; color: black; font-size: 1em; font-weight: normal; line-height: 1.2em">42</div>' +
    '<div class="braceTop"><div class="braceTopLeft"></div></div>' +
    '</div>' +
    '<div class="SchemaItem" style="grid-row: 2; grid-column-start: 1; grid-column-end: 4; background-color:lightgray; justify-content:center; color:black; font-size:1em; font-weight:normal; border: solid 1px black;">9</div>' +
    '<div class="SchemaItem" style="grid-row: 2; grid-column-start: 4; grid-column-end: 7; background-color:lightgray; justify-content:center; color:black; border-left: none;">12</div>' +
    '<div class="SchemaItem" style="grid-row: 2; grid-column-start: 7; grid-column-end: 10; background-color:lightgray; justify-content:center; color:black; border-left: none;">....</div>' +
    '<div class="SchemaTop" style="grid-row: 3; grid-column-start: 1; grid-column-end: 7; text-align:center; border: none; --arrow-color: #f15929">' +
    '<div class="latexAccoladeTop" style="text-align: center; color: #f15929; font-size: 1em; font-weight: bold; line-height: 1.2em">29</div>' +
    '</div>' +
    '</div>'

  it('convertit le schéma en grille Typst avec accolades et flèches', () => {
    const typst = htmlToTypst(schemaHtml)
    expect(typst).toContain('#grid(')
    expect(typst).toContain('columns: (1fr,) * 9,')
    // accolade supérieure sur toute la largeur
    expect(typst).toContain(
      'grid.cell(x: 0, y: 0, colspan: 9, mathalea-schema-span([42]))',
    )
    // boîtes grises : fond, bordure (côtés partagés omis), texte centré
    expect(typst).toContain(
      'grid.cell(x: 0, y: 1, colspan: 3, fill: rgb("#d3d3d3"), stroke: 0.6pt + black, inset: 4pt, align: center + horizon)[9]',
    )
    expect(typst).toContain(
      'stroke: (left: none, rest: 0.6pt + black), inset: 4pt, align: center + horizon)[12]',
    )
    // flèche colorée
    expect(typst).toContain(
      'mathalea-schema-span([29], kind: "arrow", color: rgb("#f15929"))',
    )
  })

  it('redessine les empilements de cubes canvas-3d en SVG isométrique', () => {
    const content = encodeURIComponent(
      JSON.stringify({
        objects: [
          { type: 'cube', pos: [0, 0, 0], size: 1, color: '#ffffff' },
          { type: 'cube', pos: [1, 0, 0], size: 1, color: '#ffffff' },
          { type: 'ambientLight', color: 0xffffff, intensity: 1.2 },
        ],
      }),
    )
    const figures: string[] = []
    const typst = htmlToTypst(
      `<canvas-3d id="m1" content='${content}' width="250" height="250"></canvas-3d>`,
      figures,
    )
    expect(typst).toContain('#mathalea-fit(fig-1)')
    expect(figures).toHaveLength(1)
    // 2 cubes × 3 faces visibles
    expect(figures[0].match(/<polygon /g)).toHaveLength(6)
    expect(typst).not.toContain('canvas-3d')
  })

  it("remplace les figures 3D sans cubes par un encart", () => {
    const typst = htmlToTypst(
      '<canvas-3d id="m1" content=\'%7B%7D\' width="250"></canvas-3d>',
    )
    expect(typst).toContain('figure 3D non convertie')
    expect(typst).not.toContain('canvas-3d')
  })
})

describe('htmlToTypst', () => {
  it('convertit du texte avec formules', () => {
    expect(htmlToTypst('Calculer $\\dfrac{1}{2}+\\dfrac{1}{3}$.')).toBe(
      'Calculer $frac(1, 2) + frac(1, 3)$.',
    )
  })

  it('convertit les array LaTeX bordés en tableaux natifs', () => {
    const result = htmlToTypst(
      '$\\def\\arraystretch{1.5}\\begin{array}{|l|c|c|}\\hline x & 1 & 2 \\\\ \\hline f(x) & 3 & 4 \\\\ \\hline\\end{array}$',
    )
    expect(result).toContain('#table(')
    expect(result).toContain('align: (left, center, center,)')
    expect(result).toContain('inset: (x: 5pt, y: 4.5pt)')
    expect(result).toContain('stroke: 0.5pt')
    expect(result).toContain('[$x$]')
    expect(result).not.toContain('arraystretch')
  })

  it('reporte arraystretch (renewcommand) et la couleur de fond des cellules', () => {
    const result = htmlToTypst(
      '$\\renewcommand{\\arraystretch}{1.2}\\begin{array}{|c|c|c|}\\hline \\cellcolor{lightgray} x & 1 & 2 \\\\ \\hline f(x) & 3 & 4 \\\\ \\hline\\end{array}\\renewcommand{\\arraystretch}{1}$',
    )
    expect(result).toContain('#table(')
    expect(result).toContain('inset: (x: 5pt, y: 3.6pt)')
    expect(result).toContain('stroke: 0.5pt')
    expect(result).toContain('table.cell(fill: rgb("#d3d3d3"))[$x$]')
    expect(result).not.toContain('arraystretch')
    expect(result).not.toContain('cellcolor')
  })

  it('neutralise \\hspace* (évite le `#h(*)` invalide en Typst)', () => {
    const result = latexMathToTypst('\\hspace*{0.4cm}')
    expect(result).not.toContain('*')
  })

  it('ne fragmente pas un array imbriqué dans une cellule', () => {
    const result = htmlToTypst(
      '$\\begin{array}{|c|c|}\\hline a & \\begin{array}{c|c} x & y\\end{array} \\\\ \\hline b & c \\\\ \\hline\\end{array}$',
    )
    expect(result).toContain('#table(')
    expect(result).toContain('columns: 2')
    // le `\begin{array}` imbriqué ne doit pas être recraché en littéral éclaté
    expect(result).not.toContain('\\\\begin{array}')
  })

  it('convertit les tableaux LaTeX délimités par \\[...\\]', () => {
    const result = htmlToTypst(
      '\\[\\def\\arraystretch{1.5}\\begin{array}{|l|c|}\\hline x & 1 \\\\ \\hline f(x) & 2 \\\\ \\hline\\end{array}\\]',
    )
    expect(result).toContain('#table(')
    expect(result).not.toContain('\\[')
    expect(result).not.toContain('\\]')
  })

  it('laisse les array mathématiques non bordés à tex2typst', () => {
    const result = htmlToTypst(
      '$\\begin{array}{lcl}u&=&1\\\\v&=&2\\end{array}$',
    )
    expect(result).toContain('$mat(')
    expect(result).not.toContain('#context tblr(')
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
    expect(htmlToTypst('5&nbsp;: un score &lt; 10')).toBe('5 : un score \\< 10')
  })

  it('échappe le texte qui ressemble à du balisage Typst', () => {
    expect(htmlToTypst('code #include *fort*')).toBe(
      'code \\#include \\*fort\\*',
    )
  })

  it('convertit un rendu KaTeX en utilisant uniquement son annotation TeX', () => {
    const result = htmlToTypst(
      'Angle : <span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">78^\\circ</annotation></semantics></math></span><span class="katex-html">78∘{\\color{black} \\scriptsize{78^\\circ}}78∘</span></span>',
    )
    expect(result).toBe('Angle : $78^circle.small$')
    expect(result).not.toContain('78∘')
    expect(result).not.toContain('\\scriptsize')
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
    // #mathalea-fit adapte la figure à la largeur ; ligne vide après chaque
    // figure : le texte suivant reprend dans un nouveau paragraphe
    expect(result).toBe(
      'Figure 1 : #mathalea-fit(fig-1)\n\n et figure 2 : #mathalea-fit(fig-2)',
    )
    expect(figures).toHaveLength(2)
    expect(figures[0]).toBe(
      'image(bytes("<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"96\\" height=\\"48\\"><rect/></svg>"), format: "svg", width: 72.0pt)',
    )
    expect(figures[1]).toBe(
      'image(bytes("<svg xmlns=\\"http://www.w3.org/2000/svg\\"><circle/></svg>"), format: "svg")',
    )
  })

  it('garde les labels mathalea2d en Typst au-dessus du SVG de figure', () => {
    const figures: string[] = []
    const result = htmlToTypst(
      '<div class="svgContainer"><div><svg class="mathalea2d" width="96" height="48"><line x1="0" y1="0" x2="10" y2="10"/></svg><div class="divLatex" style="position: absolute; top: 10px; left: 20px; transform: translate(-50%,-50%) rotate(0deg);" data-top=10 data-left=20><span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">{\\color{black} \\scriptsize{78^\\circ}}</annotation></semantics></math></span><span class="katex-html">78∘</span></span></div></div></div>',
      figures,
    )
    expect(result).toContain(
      '#mathalea-figure-block(1, fig-1-align, fig-1-zoom,',
    )
    expect(result).toContain(
      'mathalea-figure(72.0pt, 36.0pt, fig-1, labels: (',
    )
    expect(result).toContain(
      'mathalea-label(15.0pt, 7.5pt, [$78^circle.small$], size: 0.7em)',
    )
    expect(result).not.toContain('#place(')
    expect(result).not.toContain('78∘')
    expect(figures).toHaveLength(1)
    expect(figures[0]).toContain('image(bytes("<svg')
  })

  it('convertit les spans colorés (texteEnCouleur, texteEnCouleurEtGras)', () => {
    expect(
      htmlToTypst('Un losange est <span style="color:#f15929;">un quadrilatère</span>.'),
    ).toBe('Un losange est #text(fill: rgb("#f15929"))[un quadrilatère].')
    expect(
      htmlToTypst('<span style="color:#f15929;font-weight: bold;">réponse B</span>'),
    ).toBe('#text(fill: rgb("#f15929"))[#strong[réponse B]]')
    // span sans style : contenu conservé tel quel
    expect(htmlToTypst('<span class="katex-html">x</span>')).toBe('x')
    // couleur noire par défaut : pas de mise en couleur
    expect(htmlToTypst('<span style="color:black;">x</span>')).toBe('x')
  })

  it('remplace les images par un encart', () => {
    expect(htmlToTypst('<img src="a.png">')).toContain('image non convertie')
  })

  describe('images d’exercices statiques (registre `setStaticImagePaths`)', () => {
    afterEach(() => setStaticImagePaths(new Map()))

    it('affiche une image enregistrée à la place de l’encart', () => {
      setStaticImagePaths(new Map([['a.png', '/static-img-0.png']]))
      const figures: string[] = []
      const result = htmlToTypst('<img src="a.png" alt="énoncé" />', figures)
      expect(result).not.toContain('image non convertie')
      expect(figures).toHaveLength(1)
      expect(figures[0]).toContain('"/static-img-0.png"')
      expect(result).toContain('#mathalea-fit(fig-1)')
    })

    it("affiche l'encart si l'image n'est pas dans le registre", () => {
      setStaticImagePaths(new Map([['a.png', '/static-img-0.png']]))
      const figures: string[] = []
      expect(htmlToTypst('<img src="b.png">', figures)).toContain(
        'image non convertie',
      )
    })

    it('affiche l’encart si aucun collecteur de figures n’est fourni', () => {
      setStaticImagePaths(new Map([['a.png', '/static-img-0.png']]))
      expect(htmlToTypst('<img src="a.png">')).toContain(
        'image non convertie',
      )
    })
  })

  it('convertit les propositions de QCM (format case) en colonnes taskize', () => {
    const result = htmlToTypst(
      '<div class="my-3">' +
        '<div class="ex1 inline-block my-2 align-center"><input type="checkbox" disabled><label id="labelEx1Q0R0" class="ml-2">$1$&emsp;</label></div>' +
        '<div class="ex1 inline-block my-2 align-center"><input type="checkbox" disabled><label id="labelEx1Q0R1" class="ml-2">$2$&emsp;</label></div>' +
        '</div><div class="m-2" id="resultatCheckEx1Q0"></div>',
    )
    expect(result).toContain('#tasks(columns: qcm-colonnes, label: "A)"')
    expect(result).toContain('+ $1$')
    expect(result).toContain('+ $2$')
    expect(result).not.toContain('#qcm-bonne')
  })

  it('détecte le format lettre et met en évidence la bonne réponse du corrigé', () => {
    const result = htmlToTypst(
      '<div class="my-3">' +
        '<div class="inline-block"><label class="ml-2"><span style="color:#f15929;font-weight: bold;">A</span>.</label><label id="labelEx1Q0R0" class="ml-2">$8$</label></div>' +
        '<div class="inline-block"><label class="ml-2"><b><span class="oblique-strike">B</span></b>.</label><label id="labelEx1Q0R1" class="ml-2">$4$</label></div>' +
        '</div>',
    )
    expect(result).toContain('#tasks(columns: qcm-colonnes, label: "A)"')
    expect(result).toContain('+ #qcm-bonne[$8$]')
    expect(result).toContain('+ $4$')
  })

  it('conserve le QCM quand une figure mathalea2d suit dans le même contenu', () => {
    // régression : les étapes suivantes (figures, tableaux, katex) re-parsent
    // le HTML via template.innerHTML — le jeton de protection du QCM doit
    // survivre à ce round-trip (les caractères U+0000 étaient supprimés)
    const figures: string[] = []
    const result = htmlToTypst(
      'Question ?<br>' +
        '<div class="svgContainer" style="display: inline;"><div style="position: relative; display: inline-block">' +
        '<svg class="mathalea2d" width="96" height="48"><line x1="0" y1="0" x2="10" y2="10"/></svg>' +
        '</div></div><br><br>' +
        '<div class="my-3">' +
        '<div class="ex0 inline-block my-2 align-center"><label class="ml-2"><b>A</b>.</label><label id="labelEx0Q0R0" class="ml-2">$1$&emsp;</label></div>' +
        '<div class="ex0 inline-block my-2 align-center"><label class="ml-2"><b>B</b>.</label><label id="labelEx0Q0R1" class="ml-2">$2$&emsp;</label></div>' +
        '</div><div class="m-2" id="resultatCheckEx0Q0"></div>',
      figures,
    )
    expect(result).toContain('#tasks(columns: qcm-colonnes, label: "A)"')
    expect(result).toContain('+ $1$')
    expect(result).toContain('+ $2$')
    expect(result).toContain('#mathalea-figure-block(1, fig-1-align, fig-1-zoom,')
    expect(result).not.toMatch(/(^|[^-\w])0($|[^.\w])/m)
    expect(figures).toHaveLength(1)
  })

  it('convertit un tableau HTML MathALÉA en tableau natif', () => {
    const result = htmlToTypst(
      '<table class="tableauMathlive">' +
        '<tr><th style="background-color: lightgray; color: black"><span>$x$</span></th><td><span>$1$</span></td></tr>' +
        '<tr><th><span>$f(x)$</span></th><td><span>$2$</span></td></tr>' +
        '</table>',
    )
    expect(result).toContain('#table(')
    expect(result).toContain('columns: 2')
    expect(result).toContain('stroke: 0.5pt')
    expect(result).toContain('table.cell(fill: rgb("#d3d3d3"))[$x$]')
    expect(result).toContain('[$1$]')
    expect(result).toContain('[$f(x)$]')
  })

  describe('protection des `&` bruts (tableau LaTeX) contre le round-trip DOM', () => {
    // régression : protectQcm/protectSchemaContainers/protectHtmlTables font
    // `template.innerHTML = html` puis renvoient `template.innerHTML` dès
    // qu'ils trouvent une correspondance — cette sérialisation ré-échappe
    // tout `&` littéral présent ailleurs dans le texte (ex. séparateur de
    // colonnes d'un tableau LaTeX brut `$\begin{array}...&...&...\end{array}$`
    // pas encore extrait) en `&amp;`. `latexSegmentToTypst` décode ce `&amp;`
    // avant conversion (voir son premier `.replace`), ce qui neutralise le
    // problème quelle que soit la fonction qui l'a provoqué.
    const rawTable =
      '$\\begin{array}{|c|c|}\\hline a & b \\\\ \\hline c & d \\\\ \\hline\\end{array}$'

    it('un QCM suivi d’un tableau LaTeX brut ne corrompt pas les `&` du tableau', () => {
      const result = htmlToTypst(
        '<div class="my-3">' +
          '<div class="ex1 inline-block my-2 align-center"><input type="checkbox" disabled><label id="labelEx1Q0R0" class="ml-2">$1$&emsp;</label></div>' +
          '</div><div class="m-2" id="resultatCheckEx1Q0"></div>' +
          rawTable,
      )
      expect(result).toContain('#tasks(columns: qcm-colonnes, label: "A)"')
      expect(result).toContain('#table(')
      expect(result).not.toContain('&amp;')
      expect(result).not.toContain('amp;')
      expect(result).toContain('[$a$]')
      expect(result).toContain('[$b$]')
    })

    it('un SchemaContainer suivi d’un tableau LaTeX brut ne corrompt pas les `&` du tableau', () => {
      const result = htmlToTypst(
        '<div class="SchemaContainer">' +
          '<div class="SchemaItem" style="grid-row: 1; grid-column-start: 1; grid-column-end: 2;">9</div>' +
          '</div>' +
          rawTable,
      )
      expect(result).toContain('#grid(')
      expect(result).toContain('#table(')
      expect(result).not.toContain('&amp;')
      expect(result).not.toContain('amp;')
      expect(result).toContain('[$a$]')
      expect(result).toContain('[$b$]')
    })

    it('un tableau HTML suivi d’un tableau LaTeX brut ne corrompt pas les `&` du second', () => {
      const result = htmlToTypst(
        '<table class="tableauMathlive"><tr><th><span>$x$</span></th><td><span>$1$</span></td></tr></table>' +
          rawTable,
      )
      // les deux tableaux (HTML converti, puis LaTeX brut) doivent apparaître
      expect(result.match(/#table\(/g)).toHaveLength(2)
      expect(result).not.toContain('&amp;')
      expect(result).not.toContain('amp;')
      expect(result).toContain('[$a$]')
      expect(result).toContain('[$b$]')
    })

    it('un span KaTeX suivi d’un tableau LaTeX brut ne corrompt pas les `&` du tableau', () => {
      const result = htmlToTypst(
        '<span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">78^\\circ</annotation></semantics></math></span><span class="katex-html">78∘</span></span>' +
          rawTable,
      )
      expect(result).toContain('$78^circle.small$')
      expect(result).toContain('#table(')
      expect(result).not.toContain('&amp;')
      expect(result).not.toContain('amp;')
      expect(result).toContain('[$a$]')
      expect(result).toContain('[$b$]')
    })
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
      sanitizeSvg(
        '<text font-family= "Book Antiqua"; font-style= "italic" >F</text>',
      ),
    ).toBe('<text font-family="Book Antiqua" font-style= "italic">F</text>')
    // forme sérialisée par le DOM
    expect(
      sanitizeSvg(
        '<text font-family="Book Antiqua" ;="" font-style="italic">F</text>',
      ),
    ).toBe('<text font-family="Book Antiqua" font-style="italic">F</text>')
  })

  it('supprime les attributs SVG dupliqués produits par certains objets 2d', () => {
    expect(
      sanitizeSvg('<path stroke-opacity="0.5" stroke-opacity="0.5" d="M0 0"/>'),
    ).toBe('<path stroke-opacity="0.5" d="M0 0"/>')
  })

  it('rend les entités compatibles XML', () => {
    expect(sanitizeSvg('<text>a&nbsp;b &amp; c & d</text>')).toBe(
      '<text>a&#160;b &amp; c &amp; d</text>',
    )
  })
})

describe('svgToTypstImage', () => {
  it('reprend la largeur de la figure en points (96 px = 72 pt)', () => {
    expect(svgToTypstImage('<svg width="170.4" height="105.8"></svg>')).toBe(
      'image(bytes("<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"170.4\\" height=\\"105.8\\"></svg>"), format: "svg", width: 127.8pt)',
    )
  })

  it('omet la largeur quand la figure ne la précise pas', () => {
    expect(svgToTypstImage('<svg viewBox="0 0 10 10"></svg>')).toBe(
      'image(bytes("<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 10 10\\"></svg>"), format: "svg")',
    )
  })
})
