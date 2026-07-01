import RepereBuilder from '../../lib/2d/RepereBuilder'
import { tableauDeVariation } from '../../lib/mathFonctions/etudeFonction'
import { spline } from '../../lib/mathFonctions/Spline'
import { choice } from '../../lib/outils/arrayOutils'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '9daa5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Retrouver le tableau de signes d'une fonction"
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ9AGt2026 extends ExerciceQcmA {
  private appliquerLesValeurs(params: {
    zeroDerivee1: number
    minMax1: number
    racine: number
    zeroDerivee2: number
    minMax2: number
    image0: number
    borneInf: number
    borneSup: number
    imageInf: number
    imageSup: number
  }): void {
    const inf = params.borneInf
    const sup = params.borneSup
    const mM1 = params.minMax1
    const zD1 = params.zeroDerivee1
    const zD2 = params.zeroDerivee2
    const mM2 = params.minMax2
    const rac = params.racine
    const f0 = params.image0
    const imInf = params.imageInf
    const imSup = params.imageSup
    const repere = new RepereBuilder({
      xMin: params.borneInf - 0.7,
      xMax: params.borneSup + 1.5,
      yMin: Math.min(mM1, mM2) - 1,
      yMax: Math.max(mM1, mM2) + 1,
    })
      .setGrille({
        grilleX: { dx: 1, style: 'pointilles' },
        grilleY: { dy: 1, style: 'pointilles' },
      })
      .setThickX({ xMax: sup, xMin: inf, dx: 1 })
      .setThickY({
        yMax: Math.max(mM1, mM2) + 1,
        yMin: Math.min(mM1, mM2) - 1,
        dy: 1,
      })
      .setLabelsX([{ valeur: 1, texte: '1' }])
      .setLabelsY([{ valeur: 1, texte: '1' }])
      .buildCustom()
    const noeuds = [
      {
        x: inf,
        y: imInf,
        deriveeGauche: mM1 > imInf ? 2 : -2,
        deriveeDroit: mM1 > imInf ? 2 : -2,
        isVisible: false,
      },
      {
        x: zD1,
        y: mM1,
        deriveeDroit: 0,
        deriveeGauche: 0,
        isVisible: false,
      },
      {
        x: rac,
        y: 0,
        deriveeGauche: (2 * (mM2 - mM1)) / (zD2 - zD1),
        deriveeDroit: (2 * (mM2 - mM1)) / (zD2 - zD1),
        isVisible: false,
      },
      {
        x: 0,
        y: f0,
        deriveeDroit: mM1 < 0 ? 1 : -1,
        deriveeGauche: mM1 < 0 ? 1 : -1,
        isVisible: false,
      },
      {
        x: zD2,
        y: mM2,
        deriveeDroit: 0,
        deriveeGauche: 0,
        isVisible: false,
      },
      {
        x: sup,
        y: imSup,
        deriveeGauche: mM2 < imSup ? 1.5 : -1.5,
        deriveeDroit: mM2 < imSup ? 1.5 : -1.5,
        isVisible: false,
      },
    ]
    const s = spline(noeuds)
    const largeurPremiereColonne = 2 // Première colonne
    const deltacl = 0.8 // Distance entre la bordure et les premiers et derniers antécédents
    const espcl = context.isHtml ? 2 : 2 // Espace entre les antécédents

    const sol = tableauDeVariation({
      scale: 0.4,
      tabInit: [
        [
          ['$x$', 2, 30],
          [`$f(x)$`, 2, 20],
        ],
        [`$${inf}$`, 20, `$${texNombre(rac, 1)}$`, 20, `$${sup}$`, 20],
      ],
      tabLines: [
        [
          'Line',
          30,
          '',
          0,
          imInf < 0 ? '-' : '+',
          20,
          'z',
          20,
          imSup > 0 ? '+' : '-',
          20,
        ],
      ],
      // colorBackground: '',
      espcl,
      deltacl,
      lgt: largeurPremiereColonne,
    })
    const dist1 = tableauDeVariation({
      scale: 0.4,
      tabInit: [
        [
          ['$x$', 2, 30],
          [`$f(x)$`, 2, 20],
        ],
        [`$${inf}$`, 20, `$${texNombre(f0, 1)}$`, 20, `$${sup}$`, 20],
      ],
      tabLines: [['Line', 30, '', 0, '-', 20, 'z', 20, '+', 20]],
      // colorBackground: '',
      espcl,
      deltacl,
      lgt: largeurPremiereColonne,
    })
    const dist2 = tableauDeVariation({
      scale: 0.4,
      tabInit: [
        [
          ['$x$', 2, 30],
          [`$f(x)$`, 2, 20],
        ],
        [
          `$${inf}$`,
          20,
          `$${texNombre(zD1, 1)}$`,
          20,
          `$${texNombre(zD2, 1)}$`,
          20,
          `$${sup}$`,
          20,
        ],
      ],
      tabLines: [
        [
          'Line',
          30,
          '',
          20,
          mM1 > imInf ? '+' : '-',
          20,
          'z',
          20,
          mM2 > f0 ? '+' : '-',
          20,
          'z',
          20,
          mM2 > imSup ? '-' : '+',
          20,
        ],
      ],
      // colorBackground: '',
      espcl,
      deltacl,
      lgt: largeurPremiereColonne,
    })
    const dist3 = tableauDeVariation({
      scale: 0.4,
      tabInit: [
        [
          ['$x$', 2, 20],
          [`$f(x)$`, 2, 20],
        ],
        [
          `$${inf}$`,
          20,
          `$${rac < 0 ? texNombre(rac, 1) : '0'}$`,
          20,
          `$${rac < 0 ? '0' : texNombre(rac, 1)}$`,
          20,
          `$${sup}$`,
          20,
        ],
      ],
      tabLines: [
        [
          'Line',
          30,
          '',
          20,
          mM1 > 0 ? '+' : '-',
          20,
          'z',
          20,
          mM1 > 0 ? '-' : '+',
          20,
          'z',
          20,
          '+',
          20,
        ],
      ],
      // colorBackground: '',
      espcl,
      deltacl,
      lgt: largeurPremiereColonne,
    })

    const figure = mathalea2d(
      { xmin: -6, xmax: 6.5, ymin: -5, ymax: 5, scale: 0.5 },
      [repere, s.courbe()],
    )
    this.reponses = ['a', 'b', 'c', 'd'].map((x) => `$${x}$`)
    this.enonce = `Dans le repère ci-dessous, on a représenté la fonction $f$ définie sur l'intervalle $[${inf};${sup}]$.<br>
    ${figure}
    Le tableau de signes de la fonction $f$ est :<br>`
    this.reponses = [sol, dist1, dist2, dist3]

    this.correction = `La fonction $f$ s'annule en $x=${texNombre(rac, 1)}$. Entre $${inf}$ et $${texNombre(rac, 1)}$, la fonction est ${mM1 > 0 ? 'positive' : 'négative'} et entre $${texNombre(rac, 1)}$ et $${sup}$ elle est ${mM2 > 0 ? 'positive' : 'négative'}.<br>`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs({
      borneInf: -5,
      borneSup: 3,
      zeroDerivee1: -3,
      minMax1: 2.5,
      zeroDerivee2: 1.5,
      minMax2: -2.5,
      racine: -1,
      image0: -1.5,
      imageInf: 0.5,
      imageSup: -1,
    })
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    const signe = choice([-1, 1])
    const borneInf = randint(-5, -4)
    const borneSup = borneInf + 10
    const zeroDerivee1 = randint(borneInf + 1, -2)
    const zeroDerivee2 = randint(2, borneSup - 1)
    const minMax1 = randint(3, 7) * 0.5 * signe
    const minMax2 = randint(3, 7) * 0.5 * (minMax1 > 0 ? -1 : 1)
    const imageInf = randint(1, 2) * 0.5 * (minMax1 > 0 ? 1 : -1)
    const imageSup = randint(1, 2) * 0.5 * (minMax2 > 0 ? 1 : -1)
    const racine = randint(zeroDerivee1 + 1, zeroDerivee2 - 1, 0)
    const image0 =
      racine < 0
        ? minMax2 < 0
          ? -randint(2, 3) * 0.5
          : randint(2, 3) * 0.5
        : minMax1 < 0
          ? -randint(2, 3) * 0.5
          : randint(2, 3) * 0.5

    this.appliquerLesValeurs({
      borneInf,
      borneSup,
      zeroDerivee1,
      zeroDerivee2,
      imageInf,
      imageSup,
      racine,
      image0,
      minMax1,
      minMax2,
    })
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
