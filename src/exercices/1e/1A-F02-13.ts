import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import { deuxColonnes } from '../../lib/format/miseEnPage'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
import { bleuMathalea } from '../../lib/colors'
export const dateDePublication = '28/07/2025'
export const uuid = '8fa9b'

export const refs = {
  'fr-fr': ['1A-F02-13'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Reconnaître une parabole (forme canonique)'
export default class AutoF2e extends ExerciceQcmA {
  private creerRepere(xMin: number, xMax: number, yMin: number, yMax: number) {
    const o = latex2d('\\text{O}', -0.2, -0.3, { letterSize: 'scriptsize' })
    const r = repere({
      xMin,
      yMin,
      yMax,
      xMax,
      grille: false,
      xThickListe: [0],
      yThickListe: [0],
      xLabelListe: [-6],
      yLabelListe: [-6],
      axeXStyle: '->',
      axeYStyle: '->',
    })
    return { o, r }
  }

  private creerEnonce(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    F: (x: number) => number,
  ) {
    const { o, r } = this.creerRepere(xMin, xMax, yMin, yMax)

    return `${deuxColonnes(
      `On a représenté ci-contre une parabole $\\mathscr{P}$.<br><br>
       Une seule des quatre fonctions ci-dessous est susceptible d'être représentée par la parabole $\\mathscr{P}$. <br><br>
       Laquelle ?`,
      mathalea2d(
        {
          xmin: xMin,
          xmax: xMax,
          ymin: yMin,
          ymax: yMax,
          pixelsParCm: 25,
          scale: 0.65,
          center: true,
        },
        r,
        o,
        courbe(F, { repere: r, color: bleuMathalea, epaisseur: 2 }),
      ),
    )}<br>`
  }

  private casFormeSimple(
    a: number,
    b: number,
    orientationHaut: boolean,
    ordonneePositive: boolean,
  ) {
    const F = (x: number) => a * x ** 2 + (ordonneePositive ? b : -b)

    this.enonce = this.creerEnonce(-5, 5, -4, 3, F)

    this.correction = `Les paraboles proposées ont des équations de la forme $y=ax^2+b$.<br>
      La parabole $\\mathscr{P}$ a "les bras" tournés vers ${orientationHaut ? 'le haut' : 'le bas'}, on en déduit que $a ${orientationHaut ? '>' : '<'} 0$. <br>
      De plus, son sommet a une ordonnée ${ordonneePositive ? 'positive' : 'négative'}, donc $b ${ordonneePositive ? '>' : '<'} 0$.<br>
      On en déduit que la seule fonction susceptible de représenter $\\mathscr{P}$ est : $${miseEnEvidence(`x\\longmapsto ${texNombre(a)}x^2${ordonneePositive ? '+' : '-'}${b}`)}$.`

    this.reponses = [
      `$x\\longmapsto ${texNombre(a)}x^2${ordonneePositive ? '+' : '-'}${b}$`,
      `$x\\longmapsto ${texNombre(a)}x^2${ordonneePositive ? '-' : '+'}${b}$`,
      `$x\\longmapsto${texNombre(-a)}x^2${ordonneePositive ? '+' : '-'}${b}$`,
      `$x\\longmapsto${texNombre(-a)}x^2${ordonneePositive ? '-' : '+'}${b}$`,
    ]
  }

  private casFormeCanonique(
    a: number,
    alpha: number,
    b: number,
    orientationHaut: boolean,
    alphaPositif: boolean,
    betaPositif: boolean,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    fonction: (x: number) => number,
  ) {
    this.enonce = this.creerEnonce(xMin, xMax, yMin, yMax, fonction)

    this.correction = `Les paraboles proposées ont des équations de la forme $y=a(x-\\alpha)^2+\\beta$.<br>
      Le sommet de la parabole a pour coordonnées $(\\alpha\\, ;\\, \\beta)$.<br>
      La parabole $\\mathscr{P}$ a "les bras" tournés vers ${orientationHaut ? 'le haut' : 'le bas'}, on en déduit que $a ${orientationHaut ? '>' : '<'} 0$. <br>
      De plus, son sommet a une abscisse ${alphaPositif ? 'positive' : 'négative'} et une ordonnée ${betaPositif ? 'positive' : 'négative'}, donc $\\alpha ${alphaPositif ? '>' : '<'} 0$ et $\\beta ${betaPositif ? '>' : '<'} 0$.<br>
      On en déduit que la seule fonction susceptible de représenter $\\mathscr{P}$ est : $${miseEnEvidence(`x\\longmapsto ${texNombre(a)}(x${alphaPositif ? '-' : '+'}${alpha})^2${betaPositif ? '+' : '-'}${b}`)}$.`

    this.reponses = [
      `$x\\longmapsto ${texNombre(a)}(x${alphaPositif ? '-' : '+'}${alpha})^2${betaPositif ? '+' : '-'}${b}$`,
      `$x\\longmapsto ${texNombre(a)}(x${alphaPositif ? '+' : '-'}${alpha})^2${betaPositif ? '+' : '-'}${b}$`,
      `$x\\longmapsto${texNombre(-a)}(x${alphaPositif ? '+' : '-'}${alpha})^2${betaPositif ? '+' : '-'}${b}$`,
      `$x\\longmapsto${texNombre(-a)}(x${alphaPositif ? '-' : '+'}${alpha})^2${betaPositif ? '+' : '-'}${b}$`,
    ]
  }

  versionOriginale: () => void = () => {
    const F = (x: number) => -0.5 * x ** 2 + 3

    this.enonce = this.creerEnonce(-5, 5, -1.5, 4, F)

    this.correction = `Les paraboles proposées ont des équations de la forme $y=ax^2+b$.<br>
      La parabole $\\mathscr{P}$ a "les bras" tournés vers le bas, on en déduit que $a < 0$. <br>
      De plus, son sommet a une ordonnée positive ($10$).<br>
      On en déduit que la seule fonction susceptible de représenter $\\mathscr{P}$ est : $${miseEnEvidence(`x\\longmapsto -x^2+10`)}$.`

    this.reponses = [
      '$x\\longmapsto -x^2+10$',
      '$x\\longmapsto -x^2-10$',
      '$x\\longmapsto x^2+10$',
      '$x\\longmapsto x^2-10$',
    ]
  }

  versionAleatoire = () => {
    const cas = randint(1, 8)
    const a = randint(3, 8, 5) / 5
    const b = randint(2, 4)
    const alpha = randint(2, 5)

    switch (cas) {
      case 1: // a>0, b<0 (forme simple)
        this.casFormeSimple(a, b, true, false)
        break

      case 2: // a>0, alpha>0, beta<0
        this.casFormeCanonique(
          a,
          alpha,
          b,
          true,
          true,
          false,
          -2,
          5,
          -3,
          3,
          (x: number) => (x - 2) ** 2 - 2,
        )
        break

      case 3: // a>0, alpha>0, beta>0
        this.casFormeCanonique(
          a,
          alpha,
          b,
          true,
          true,
          true,
          -2,
          5,
          -1,
          5,
          (x: number) => (x - 2) ** 2 + 2,
        )
        break

      case 4: // a>0, alpha<0, beta<0
        this.casFormeCanonique(
          a,
          alpha,
          b,
          true,
          false,
          false,
          -5,
          2,
          -3,
          3,
          (x: number) => (x + 2) ** 2 - 2,
        )
        break

      case 5: // a>0, alpha<0, beta>0
        this.casFormeCanonique(
          a,
          alpha,
          b,
          true,
          false,
          true,
          -5,
          2,
          -1,
          5,
          (x: number) => (x + 2) ** 2 + 2,
        )
        break

      case 6: // a<0, alpha>0, beta>0
        this.casFormeCanonique(
          -a,
          alpha,
          b,
          false,
          true,
          true,
          -2,
          5,
          -3,
          5,
          (x: number) => -1 * (x - 2) ** 2 + 3,
        )
        break

      case 7: // a<0, alpha>0, beta<0
        this.casFormeCanonique(
          -a,
          alpha,
          b,
          false,
          true,
          false,
          -2,
          5,
          -5,
          1,
          (x: number) => -1 * (x - 2) ** 2 - 1,
        )
        break

      case 8: // a<0, alpha<0, beta>0
        this.casFormeCanonique(
          -a,
          alpha,
          b,
          false,
          false,
          true,
          -5,
          2,
          -3,
          5,
          (x: number) => -1 * (x + 2) ** 2 + 3,
        )
        break
    }
  }

  constructor() {
    super()
    this.versionAleatoire()
    this.options = { vertical: true, ordered: false }
  }
}
