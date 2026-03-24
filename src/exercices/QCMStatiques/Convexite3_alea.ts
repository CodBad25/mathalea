import { fixeBordures } from '../../lib/2d/fixeBordures'
import RepereBuilder from '../../lib/2d/RepereBuilder'
import { spline } from '../../lib/mathFonctions/Spline'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcm from '../ExerciceQcm'

export const uuid = '33b45'
export const refs = {
  'fr-fr': ['TSA2-QCM04'],
  'fr-ch': ['3mQCM-4'],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'QCM de cours : convexité'
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
    const step1 = randint(2, 5)
    const step2 = randint(1, 3)
    const step3 = randint(1, 3)
    const step4 = randint(1, 3)
    const step5 = randint(7, 10)

    const nuage = [
      { x: a, y: b, deriveeGauche: 0, deriveeDroit: 1, isVisible: true },
      {
        x: a + step1,
        y: 0,
        deriveeGauche: 1,
        deriveeDroit: 1,
        isVisible: true,
      },
      {
        x: a + step1 + step2,
        y: b + step5,
        deriveeGauche: 0,
        deriveeDroit: 0,
        isVisible: true,
      },
      {
        x: a + step1 + step2 + step3,
        y: 0,
        deriveeGauche: 0,
        deriveeDroit: 0,
        isVisible: false,
      },
      {
        x: a + step1 + step2 + step3 + step4,
        y: 2,
        deriveeGauche: 1,
        deriveeDroit: 1,
        isVisible: false,
      },
    ]
    const f = spline(nuage)
    this.reponses = ['Un', 'Zéro', 'Deux', 'Trois']
    const rep = new RepereBuilder({
      xMin: a,
      xMax: a + step1 + step2 + step3 + step4,
      yMin: b,
      yMax: b + step5,
    }).buildStandard().objets
    const maCourbe = f.courbe({
      color: 'red',
      epaisseur: 2,
      ajouteNoeuds: true,
      optionsNoeuds: {},
    })
    this.enonce = `On a représenté ici, dans un repère orthonormé,  la courbe de $f^{\\prime\\prime}$, dérivée seconde d'une fonction $f$,sur l'intervalle $[${a};${a + step1 + step2 + step3 + step4}]$.<br>`
    this.enonce += mathalea2d(
      Object.assign({}, fixeBordures([rep, maCourbe])),
      rep,
      maCourbe,
    )
    this.enonce +=
      "Combien de points d'inflexions possède la courbe représentative de $f$ sur cet intervalle ?"
    this.correction =
      "Pour trouver les abscisses des points d'inflexion, on cherche les valeurs pour lesquelles $f^{\\prime\\prime}(x)$ s'annule et change de signe.<br> "
    this.correction += `Dans cette situation, on observe que la dérivée seconde s'annule deux fois, mais en $${a + step1 + step2 + step3}$ elle ne change pas de signes.`
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
