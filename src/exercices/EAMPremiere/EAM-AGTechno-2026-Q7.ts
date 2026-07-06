import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import RepereBuilder from '../../lib/2d/RepereBuilder'
import { latex2d } from '../../lib/2d/textes'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
} from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d, type Mathalea2dDisplay } from '../../modules/mathalea2d'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '9efa5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Déterminer graphiquement l'équation réduite d'une droite"
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ7AGt2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    abscisseAOrigine: number,
    ordonneeAOrigine: number,
  ): void {
    const coefficientDirecteur = -ordonneeAOrigine / abscisseAOrigine
    const coeffBis = -abscisseAOrigine / ordonneeAOrigine
    const sol = `y=${texNombre(coefficientDirecteur, 2)}x+${texNombre(ordonneeAOrigine, 2)}`
    const dist1 = `y=${texNombre(coefficientDirecteur, 2)}x${ecritureAlgebrique(abscisseAOrigine)}`
    const dist2 = `y=${texNombre(coeffBis, 2)}x+${texNombre(ordonneeAOrigine, 2)}`
    const dist3 = `y=${texNombre(coeffBis, 2)}x${ecritureAlgebrique(abscisseAOrigine)}`
    const f = (x: number) =>
      (-ordonneeAOrigine / abscisseAOrigine) * x + ordonneeAOrigine
    const A = pointAbstrait(abscisseAOrigine, 0)
    const B = pointAbstrait(0, ordonneeAOrigine)
    const d = droite(A, B)
    const x = latex2d('x', 6.5, -0.4, { letterSize: 'small' })
    const y = latex2d('y', -0.5, 4.8, { letterSize: 'small' })
    const rep = new RepereBuilder({
      xMin: -6,
      xMax: 7,
      yMin: -1,
      yMax: 5,
    })
      .setGrille({
        grilleX: { dx: 1 },
        grilleY: { dy: 1 },
      })
      .setThickX({ xMax: 6, xMin: -6, dx: 1 })
      .setThickY({ yMax: 4, yMin: -1, dy: 1 })
      .setLabelsX([{ valeur: 1, texte: '1' }])
      .setLabelsY([{ valeur: 1, texte: '1' }])
      .buildCustom()

    d.color = colorToLatexOrHTML('red')
    const labelD = latex2d('(d)', -2, f(-2) + 1, {
      letterSize: 'small',
      color: 'red',
    })
    const objets = [rep, d, x, labelD, y]
    const figure = mathalea2d(
      Object.assign(
        { scale: 0.5, display: 'block' as Mathalea2dDisplay },
        fixeBordures([rep, x, labelD, y], {
          rxmin: 0,
          rxmax: 0,
          rymin: 0,
          rymax: 0,
        }),
      ),
      objets,
    )

    this.reponses = [sol, dist1, dist2, dist3].map((x) => `$${x}$`)
    this.enonce = `Dans le repère ci-dessous, on a représenté une droite $(d)$ :<br>
    ${figure}
    L'équation réduite de cette droite est :<br>`

    this.correction = `La droite $(d)$ passe par les points $A(${texNombre(abscisseAOrigine, 2)};0)$ et $B(0;${texNombre(ordonneeAOrigine, 2)})$.<br>
    Son coefficient directeur est donc :<br>
    $a=\\dfrac{y_B-y_A}{x_B-x_A}=\\dfrac{${texNombre(ordonneeAOrigine, 2)}-0}{0-${ecritureParentheseSiNegatif(-abscisseAOrigine)}}=\\dfrac{${texNombre(ordonneeAOrigine, 2)}}{${ecritureAlgebrique(-abscisseAOrigine)}}=${texNombre(coefficientDirecteur, 2)}$<br>
   Son ordonnée à l'origine est : $y_B=${ordonneeAOrigine}$<br>
    L'équation réduite de la droite $(d)$ est donc :<br>
    $${miseEnEvidence(`y=${texNombre(coefficientDirecteur, 2)}x+${texNombre(ordonneeAOrigine, 2)}`)}$`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(4, 2)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const abs = choice([2, 4, -2, -4, 5, -5])
      const ord = choice([1, 2, 4], Math.abs(abs))
      this.appliquerLesValeurs(abs, ord)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
