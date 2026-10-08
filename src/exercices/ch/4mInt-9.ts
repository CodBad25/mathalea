import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { courbe } from '../../lib/2d/Courbe'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import {
  lireFormulaireComplexe,
  serialiseFormulaireComplexe,
  valeursParDefaut,
  type FormulaireComplexe,
} from '../../lib/formulaireComplexe'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { Polynome } from '../../lib/mathFonctions/Polynome'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique, rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Calculer un volume de révolution'
export const dateDePublication = '08/10/2026'
export const uuid = 'bae8f'
export const interactifReady = true
export const refs = { 'fr-fr': [], 'fr-ch': ['4mInt-9'] }

const formulaire: FormulaireComplexe = {
  champs: [
    {
      type: 'listePonderee',
      nom: 'regions',
      label: 'Région à faire tourner autour de l’axe Ox',
      items: [
        { nom: 'disques', label: 'Une fonction f et l’axe Ox' },
        { nom: 'couronnes', label: 'Deux fonctions f et g' },
      ],
    },
    {
      type: 'listePonderee',
      nom: 'familles',
      label: 'Familles de fonctions',
      items: [
        { nom: 'droite', label: 'Droite (ou droite et parabole)' },
        { nom: 'parabole', label: 'Parabole (ou deux paraboles)' },
        { nom: 'racine', label: 'Racine carrée (ou racine et droite)' },
      ],
    },
  ],
}

type Draw = {
  a: number
  b: number
  fTex: string
  gTex?: string
  f: (x: number) => number
  g: (x: number) => number
  integrand: Polynome
  boundsExplanation: string
  radiusExplanation: string
}

const fraction = (n: number, d = 1) => new FractionEtendue(n, d).simplifie()

const factor = (root: number) =>
  root === 0 ? 'x' : `\\left(x${ecritureAlgebrique(-root)}\\right)`

function drawDisks(family: string): Draw {
  const a = randint(-2, 1)
  const b = a + randint(2, 4)
  let p: Polynome
  let fTex: string
  let f: (x: number) => number
  let integrand: Polynome
  if (family === 'racine') {
    const k = randint(1, 3)
    fTex = `${rienSi1(k)}\\sqrt{${Polynome.fromRationalCoefficients([-a, 1]).toLatex()}}`
    f = (x) => k * Math.sqrt(Math.max(0, x - a))
    integrand = Polynome.fromRationalCoefficients([-k * k * a, k * k])
  } else {
    if (family === 'droite') {
      p = Polynome.fromRationalCoefficients([
        randint(-3, 3),
        choice([-2, -1, 1, 2]),
      ])
    } else {
      const shift = randint(a, b)
      const k = randint(1, 2)
      p = Polynome.fromRationalCoefficients([
        k * shift ** 2 + randint(1, 3),
        -2 * k * shift,
        k,
      ])
    }
    fTex = p.toLatex()
    f = p.fonction
    integrand = p.multiplyExact(p)
  }
  return {
    a,
    b,
    fTex,
    f,
    g: () => 0,
    integrand,
    boundsExplanation: `Les bornes sont données : $a=${a}$ et $b=${b}$.`,
    radiusExplanation: '',
  }
}

function drawWashers(family: string): Draw {
  if (family === 'racine') {
    const k = randint(1, 3)
    const scale = randint(1, 3)
    const f = Polynome.fromRationalCoefficients([0, fraction(scale, k)])
    return {
      a: 0,
      b: k ** 2,
      fTex: f.toLatex(),
      gTex: `${rienSi1(scale)}\\sqrt{x}`,
      f: f.fonction,
      g: (x) => scale * Math.sqrt(Math.max(0, x)),
      integrand: Polynome.fromRationalCoefficients([0, scale ** 2])
        .add(f.multiplyExact(f).multiplyExact(-1))
        .toRational(),
      boundsExplanation: `Sur $x\\geq0$, les deux membres sont positifs ou nuls, donc on peut élever au carré :<br>$f(x)=g(x)\\iff ${f.toLatex()}=${rienSi1(scale)}\\sqrt{x}\\iff x^2=${k ** 2}x\\iff x${factor(k ** 2)}=0$.<br>Les bornes sont donc $a=0$ et $b=${k ** 2}$.`,
      radiusExplanation: `Sur $[0;${k ** 2}]$, on a $0\\leq x\\leq ${k ** 2}$, donc $x^2\\leq ${k ** 2}x$ et $0\\leq f(x)\\leq g(x)$. Le rayon extérieur est $g(x)$ et le rayon intérieur est $f(x)$ : les sections sont des couronnes.`,
    }
  }
  const a = randint(0, 2)
  const b = a + randint(2, 4)
  const k = randint(1, 2)
  const m = randint(0, 2)
  const flat = family === 'droite' && choice([false, true])
  const height = randint(1, 3) + (flat ? k * Math.ceil((b - a) ** 2 / 4) : 0)
  // f = k(x-a)² + m(x-a) + h reste positive. g-f = -c(x-a)(x-b) reste positive sur [a;b].
  const f = flat
    ? Polynome.fromRationalCoefficients([height + k * a * b, -k * (a + b), k])
    : Polynome.fromRationalCoefficients([
        k * a ** 2 - m * a + height,
        m - 2 * k * a,
        k,
      ])
  const c = family === 'droite' ? k : 2 * k
  const diff = Polynome.fromRationalCoefficients([-c * a * b, c * (a + b), -c])
  const g = f.add(diff).toRational()
  const positivity = flat
    ? `$f(x)=${rienSi1(k)}\\left(x-${fraction(a + b, 2).texFractionSimplifiee}\\right)^2+${fraction(4 * height - k * (b - a) ** 2, 4).texFractionSimplifiee}>0$`
    : `$f(x)=${rienSi1(k)}${factor(a)}^2${m === 0 ? '' : `+${rienSi1(m)}${factor(a)}`}+${height}>0$`
  return {
    a,
    b,
    fTex: f.toLatex(),
    gTex: g.toLatex(),
    f: f.fonction,
    g: g.fonction,
    integrand: g
      .multiplyExact(g)
      .add(f.multiplyExact(f).multiplyExact(-1))
      .toRational(),
    boundsExplanation: `$f(x)=g(x)\\iff ${f.toLatex()}=${g.toLatex()}\\iff ${diff.toLatex()}=0\\iff -${rienSi1(c)}${factor(a)}${factor(b)}=0$.<br>Un produit est nul si l’un des facteurs est nul : les bornes sont $a=${a}$ et $b=${b}$.`,
    radiusExplanation: `Sur $[${a};${b}]$, ${positivity}. De plus, $g(x)-f(x)=-${rienSi1(c)}${factor(a)}${factor(b)}\\geq0$, car $x-${a}\\geq0$ et $x-${b}\\leq0$. Ainsi, $0\\leq f(x)\\leq g(x)$. Le rayon extérieur est $g(x)$ et le rayon intérieur est $f(x)$ : les sections sont des couronnes.`,
  }
}

/** Esquisse de la région plane qui tourne autour de Ox, incluse dans la correction. */
function figure(t: Draw): string {
  const points = []
  let yMin = 0
  let yMax = 0
  for (let j = 0; j <= 100; j++) {
    const x = t.a + ((t.b - t.a) * j) / 100
    yMin = Math.min(yMin, t.f(x), t.g(x))
    yMax = Math.max(yMax, t.f(x), t.g(x))
  }
  yMin = Math.floor(yMin) - 1
  yMax = Math.ceil(yMax) + 1
  const xMin = Math.min(0, t.a) - 1
  const xMax = t.b + 1
  const xUnit = Math.min(1.5, 10 / (xMax - xMin))
  const yUnit = Math.min(1, 5 / (yMax - yMin))
  const stepY = Math.ceil((yMax - yMin) / 6)
  const r = repere({
    xMin,
    xMax,
    yMin,
    yMax,
    xUnite: xUnit,
    yUnite: yUnit,
    grille: false,
    yThickDistance: stepY,
    yLabelDistance: stepY,
  })
  for (let j = 0; j <= 60; j++) {
    const x = t.a + ((t.b - t.a) * j) / 60
    points.push(pointAbstrait(x * xUnit, t.f(x) * yUnit))
  }
  for (let j = 60; j >= 0; j--) {
    const x = t.a + ((t.b - t.a) * j) / 60
    points.push(pointAbstrait(x * xUnit, t.g(x) * yUnit))
  }
  const region = polygone(points, 'none')
  region.couleurDeRemplissage = colorToLatexOrHTML('gray')
  region.opaciteDeRemplissage = 0.35
  region.epaisseur = 0
  const x = t.a + 0.65 * (t.b - t.a)
  const curves = [
    courbe(t.f, {
      repere: r,
      color: 'blue',
      xMin: t.a,
      xMax: t.b,
      step: (t.b - t.a) / 200,
    }),
    latex2d('f', x * xUnit, t.f(x) * yUnit - 0.35, { color: 'blue' }),
  ]
  if (t.gTex)
    curves.push(
      courbe(t.g, {
        repere: r,
        color: 'red',
        xMin: t.a,
        xMax: t.b,
        step: (t.b - t.a) / 200,
      }),
      latex2d('g', x * xUnit, t.g(x) * yUnit + 0.35, { color: 'red' }),
    )
  return mathalea2d(
    {
      xmin: xMin * xUnit - 0.5,
      xmax: xMax * xUnit + 0.5,
      ymin: yMin * yUnit - 0.5,
      ymax: yMax * yUnit + 0.5,
      pixelsParCm: 40,
      scale: 1,
      center: true,
      centerLatex: true,
    },
    r,
    region,
    ...curves,
  )
}

/** @author Nathan Scheinmann */
export default class VolumeDeRevolution extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
    this.spacingCorr = 3
    this.besoinFormulaireComplexe = formulaire
    this.sup = serialiseFormulaireComplexe(
      formulaire,
      valeursParDefaut(formulaire),
    )
  }

  nouvelleVersion() {
    const params = lireFormulaireComplexe(formulaire, this.sup)
    const regions = params.repartition('regions', this.nbQuestions)
    const families = params.repartition('familles', this.nbQuestions)
    for (
      let i = 0, attempts = 0;
      i < this.nbQuestions && attempts < 50;
      attempts++
    ) {
      const t =
        regions[i] === 'disques'
          ? drawDisks(families[i])
          : drawWashers(families[i])
      if (!this.questionJamaisPosee(i, t.fTex, t.gTex ?? '', t.a, t.b)) continue
      const primitive = t.integrand.primitive0()
      const ha = primitive.evaluateExact(t.a)
      const hb = primitive.evaluateExact(t.b)
      const coefficient = hb
        .differenceFraction(ha)
        .simplifie().texFractionSimplifiee
      const result = `${coefficient === '1' ? '' : coefficient}\\pi`
      const bounds = `_{${t.a}}^{${t.b}}`
      const formula = t.gTex ? '\\left((g(x))^2-(f(x))^2\\right)' : '(f(x))^2'
      const squared = t.gTex
        ? `\\left((${t.gTex})^2-(${t.fTex})^2\\right)`
        : `\\left(${t.fTex}\\right)^2`
      let text = t.gTex
        ? `Soient $f(x)=${t.fTex}$ et $g(x)=${t.gTex}$.<br>Calculer le volume $V$ du solide engendré par la rotation autour de l’axe $Ox$ du domaine borné délimité par les courbes de $f$ et de $g$.`
        : `Soit $f(x)=${t.fTex}$.<br>Calculer le volume $V$ du solide engendré par la rotation autour de l’axe $Ox$ du domaine délimité par la courbe de $f$, l’axe $Ox$ et les droites $x=${t.a}$ et $x=${t.b}$.`
      text += ' Donner la valeur exacte en unités de volume.'
      if (this.interactif)
        text +=
          '<br>' +
          ajouteChampTexteMathLive(
            this,
            i,
            KeyboardType.clavierPersonnalisable,
            {
              texteAvant: '$V=$',
              texteApres: ' unités de volume.',
            },
          )
      // Un seul champ et un point par question, dans les deux modes.
      handleAnswers(this, i, { reponse: { value: result } })
      const haTex = ha.texFractionSimplifiee
      this.listeQuestions[i] = text
      this.listeCorrections[i] =
        `${t.boundsExplanation}<br>${figure(t)}<br>` +
        (t.radiusExplanation ? `${t.radiusExplanation}<br>` : '') +
        `La formule du cours donne $V=\\displaystyle\\pi\\int${bounds}${formula}\\,\\mathrm{d}x$.<br>` +
        `On développe l’intégrande :<br>$V=\\displaystyle\\pi\\int${bounds}${squared}\\,\\mathrm{d}x=\\pi\\int${bounds}\\left(${t.integrand.toLatex()}\\right)\\,\\mathrm{d}x$.<br>` +
        `Une primitive de l’intégrande, avec $C=0$, est $H(x)=${primitive.toLatex()}$.<br>` +
        `On évalue aux bornes :<br>$V=\\pi\\left[${primitive.toLatex()}\\right]${bounds}=\\pi\\left(H(${t.b})-H(${t.a})\\right)=\\pi\\left(${hb.texFractionSimplifiee}-${ha.signe < 0 ? `\\left(${haTex}\\right)` : haTex}\\right)$.<br>` +
        `Le volume vaut donc $V=${miseEnEvidence(result)}$ unités de volume.`
      i++
    }
    listeQuestionsToContenu(this)
  }
}
