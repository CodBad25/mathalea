import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { labelPoint } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'a9012'
export const refs = {
  'fr-fr': ['1A-G01-2', '2A-G1-2'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Lire les coordonnées d'un point dans un repère"
export const dateDePublication = '18/06/2026'

/**
 * Version QCM de 3AutoG01-2.
 * @author Stéphane Guyon
 */
export default class LireCoordonneesPointQCM extends ExerciceQcmA {
  private coordonneesTex(
    label: string,
    x: number,
    y: number,
    egalApresLabel = false,
  ) {
    return `$${label}${egalApresLabel ? '=' : ''}\\left(${texNombre(x)}\\,;\\,${texNombre(y)}\\right)$`
  }

  private construireFigure(x: number, y: number, label: string) {
    const xMin = Math.min(0, x) - 1
    const xMax = Math.max(0, x) + 1
    const yMin = Math.min(0, y) - 1
    const yMax = Math.max(0, y) + 1
    const point = pointAbstrait(x, y, label, 'above left')
    return mathalea2d(
      {
        xmin: xMin,
        ymin: yMin,
        xmax: xMax,
        ymax: yMax,
        pixelsParCm: 30,
        scale: 0.75,
        display: 'block',
        center: true,
      },
      repere({
        xMin,
        yMin,
        xMax,
        yMax,
        grilleSecondaire: true,
        grilleSecondaireDistance: 1,
        grilleSecondaireXMin: xMin,
        grilleSecondaireYMin: yMin,
        grilleSecondaireXMax: xMax,
        grilleSecondaireYMax: yMax,
      }),
      tracePoint(point, 'red'),
      labelPoint(point),
    )
  }

  versionAleatoire = () => {
    const absX = randint(1, 5)
    let absY = randint(1, 5, absX)
    while (absY === absX) {
      absY = randint(1, 5, absX)
    }
    const x = randint(0, 1) === 0 ? -absX : absX
    const y = -Math.sign(x) * absY
    const label = 'A'

    const bonneReponse = this.coordonneesTex(label, x, y)
    const propositions = [
      bonneReponse,
      this.coordonneesTex(label, y, x),
      this.coordonneesTex(label, -x, y),
      this.coordonneesTex(label, x, -y),
      this.coordonneesTex(label, -y, -x),
    ]
    this.reponses = [...new Set(propositions)].slice(0, 4)

    const figure = this.construireFigure(x, y, label)
    this.enonce = `On considère le repère ci-dessous : ${figure}
Les coordonnées du point $${label}$ sont `
    this.correction = `On lit d'abord l'abscisse sur l'axe horizontal, puis l'ordonnée sur l'axe vertical.<br>
Le point $${label}$ a donc pour coordonnées $${miseEnEvidence(bonneReponse.slice(1, -1))}$.`
  }

  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.nbQuestions = 1
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.versionAleatoire()
  }
}
