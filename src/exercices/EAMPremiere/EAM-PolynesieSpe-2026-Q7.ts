import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import RepereBuilder from '../../lib/2d/RepereBuilder'
import { latex2d } from '../../lib/2d/textes'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d, type Mathalea2dDisplay } from '../../modules/mathalea2d'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'ps267'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Déterminer graphiquement l'équation réduite d'une droite"
export const dateDePublication = '01/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ7PolynesieSpe2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    coefficient: number,
    ordonneeOrigine: number,
  ): void {
    const equation = `y=${texNombre(coefficient, 2)}x${ecritureAlgebrique(ordonneeOrigine)}`
    const coeffInverse = coefficient === 0 ? 1 : 1 / coefficient
    const d = droite(
      pointAbstrait(0, ordonneeOrigine),
      pointAbstrait(5, ordonneeOrigine + 5 * coefficient),
    )
    d.color = colorToLatexOrHTML('red')
    const rep = new RepereBuilder({
      xMin: -2.5,
      xMax: 9.5,
      yMin: -1,
      yMax: 6.5,
    })
      .setGrille({
        grilleX: { dx: 1, style: 'pointilles' },
        grilleY: { dy: 1, style: 'pointilles' },
      })
      .setThickX({ xMin: -2, xMax: 9, dx: 1 })
      .setThickY({ yMin: 0, yMax: 6, dy: 1 })
      .setLabelsX([{ valeur: 1, texte: '1' }])
      .setLabelsY([{ valeur: 1, texte: '1' }])
      .buildCustom()
    const labelD = latex2d('(d)', 1, ordonneeOrigine + coefficient + 0.4, {
      letterSize: 'small',
      color: 'red',
    })
    const figure = mathalea2d(
      Object.assign(
        { scale: 0.5, display: 'block' as Mathalea2dDisplay },
        fixeBordures([rep, labelD]),
      ),
      [rep, d, labelD],
    )

    this.enonce = `Parmi les équations réduites de droites proposées, laquelle est celle de la droite $(d)$ tracée dans le repère ci-dessous ?<br>
    ${figure}`

    this.reponses = [
      `$${equation}$`,
      `$y=${texNombre(-coefficient, 2)}x${ecritureAlgebrique(ordonneeOrigine)}$`,
      `$y=${texNombre(coefficient, 2)}x${ecritureAlgebrique(ordonneeOrigine + Math.sign(ordonneeOrigine) * 2)}$`,
      `$y=${texNombre(coeffInverse, 2)}x${ecritureAlgebrique(ordonneeOrigine)}$`,
    ]

    this.correction = `Graphiquement, l'ordonnée à l'origine vaut environ $${texNombre(Math.round(ordonneeOrigine))}$.<br>
    De plus, avec l'orientation de la droite, on en déduit que le coefficient directeur est ${coefficient > 0 ? 'positif' : 'négatif'}.<br>
    Parmi les équations proposées, la seule qui convient est donc $${miseEnEvidence(equation)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(-0.6, 5.2)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const coefficient = choice([-1.2, -1, -0.8, -0.6, 0.6, 0.8, 1])
      const ordonneeOrigine = choice([1.2, 2.4, 3.2, 4.4, 5.2])
      this.appliquerLesValeurs(coefficient, ordonneeOrigine)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
