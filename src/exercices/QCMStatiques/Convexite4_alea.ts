import { fixeBordures } from '../../lib/2d/fixeBordures'
import RepereBuilder from '../../lib/2d/RepereBuilder'
import { spline } from '../../lib/mathFonctions/Spline'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcm from '../ExerciceQcm'

export const uuid = 'a594f'
export const refs = {
  'fr-fr': ['TSA2-QCM05'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'QCM de cours : convéxité'
export const dateDePublication = '03/11/2024'
/**
 * Ceci est un exo construit à partir d'une question de qcm de Bac.
 * Il utilise la classe ExerciceQcm qui définit les contours de l'exo (sans version aléatoire)
 * Ce moule à exo dispose d'une méthode qcmCamExport qui permet de récupérer le JSON de la question et de la reponse pour qcmCam.
 * Il est interactif et dispose d'un export AMC d'office
 */
/**
 *
 * @author Stéphane Guyon
 *
 */
export default class metropoleSept2024Ex4Q1 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    const a = randint(-4, -1)
    const b = randint(-5, -2)
    const stepX1 = randint(2, 4)
    const stepY1 = randint(3, 6)
    const stepX2 = randint(3, 5)
    const stepX3 = randint(2, 4)
    const stepX4 = randint(2, 4)
    const stepY2 = randint(2, 4)
    const stepY3 = randint(1, 4)
    const stepY4 = randint(1, 4)

    const nuage = [
      { x: a, y: b, deriveeGauche: 0, deriveeDroit: 1, isVisible: true },
      {
        x: a + stepX1,
        y: b + stepY1,
        deriveeGauche: 2,
        deriveeDroit: 2,
        isVisible: false,
      },
      {
        x: a + stepX1 + 1,
        y: b + stepY1 + 1,
        deriveeGauche: 0,
        deriveeDroit: 0,
        isVisible: true,
      },
      {
        x: a + stepX1 + stepX2,
        y: b + stepY1 - stepY2,
        deriveeGauche: -1,
        deriveeDroit: -1,
        isVisible: false,
      },
      {
        x: a + stepX1 + stepX2 + 1,
        y: b + stepY1 - stepY2 - 1,
        deriveeGauche: 0,
        deriveeDroit: 0,
        isVisible: true,
      },
      {
        x: a + stepX1 + stepX2 + stepX3,
        y: b + stepY1 - stepY2 + stepY3,
        deriveeGauche: 1,
        deriveeDroit: 1,
        isVisible: false,
      },
      {
        x: a + stepX1 + stepX2 + stepX3 + stepX4,
        y: b + stepY1 - stepY2 + stepY3 + stepY4,
        deriveeGauche: 1,
        deriveeDroit: 1,
        isVisible: false,
      },
    ]
    const f = spline(nuage)

    this.reponses = [
      `$f$ est convexe sur $[${a};  ${a + stepX1 + 1}]$`,
      `$f$ est concave sur $[${a};  ${a + stepX1 + 1}]$`,
      `$f$ est convexe sur $[${a + stepX1 + 1};  ${a + stepX1 + stepX2 + 1}]$`,
      `$f$ est croissante sur $[${a};  ${a + stepX1 + 1}]$ `,
    ]
    const rep = new RepereBuilder({
      xMin: a,
      xMax: a + stepX1 + stepX2 + stepX3 + stepX4,
      yMin: b,
      yMax: b + stepY1 - stepY2 + stepY3 + stepY4,
    }).buildStandard().objets
    const maCourbe = f.courbe({
      color: 'red',
      epaisseur: 2,
      ajouteNoeuds: true,
      optionsNoeuds: {},
    })
    this.enonce = `On a représenté ici, sur l'intervalle $[${a};${a + stepX1 + stepX2 + stepX3 + stepX4}]$ la courbe de $f^{\\prime}$, dérivée d'une fonction $f$.<br>`
    this.enonce += mathalea2d(
      Object.assign({}, fixeBordures([rep, maCourbe])),
      rep,
      maCourbe,
    )
    this.enonce += 'On peut en déduire que : '
    this.correction = `On observe que  $f^{\\prime}$ est croissante sur $[${a};  ${a + stepX1 + 1}]$<br> `
    this.correction +=
      'Sa dérivée, la dérivée seconde, est donc positive sur cet intervalle.<br>'
    this.correction += 'La fonction est donc convexe sur cet intervalle.<br>'
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
