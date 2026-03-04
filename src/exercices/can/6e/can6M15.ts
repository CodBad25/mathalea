import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { grille } from '../../../lib/2d/Grille'
import { point } from '../../../lib/2d/PointAbstrait'
import { Polyquad } from '../../../lib/2d/Polyquad'
import { segment } from '../../../lib/2d/segmentsVecteurs'
import { texteParPosition } from '../../../lib/2d/textes'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import type { NestedObjetMathalea2dArray } from '../../../types/2d'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Mesurer un périmètre par comptage'
export const dateDePublication = '25/04/2025'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true

/**
 * @author Jean-Claude Lhote
 * Créé le 25/04/2024

 */
export const uuid = 'b9878'

export const refs = {
  'fr-fr': ['can6M15', 'CM1M1H-flash3'],
  'fr-ch': ['9GM1-13'],
}
export default class PerimetreParComptageCan extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1
    this.typeExercice = 'simple'
    this.besoinFormulaireNumerique = [
      'Aire maximale',
      3,
      '1 : Inférieure à 10\n2 : Inférieure à 20\n3 : Inférieure à 30',
    ]
    this.besoinFormulaire2CaseACocher = ['Avec grille', true]
    this.sup = 1
    this.sup2 = true
    this.spacing = 3
  }

  nouvelleVersion() {
    const aire =
      this.sup === 1
        ? randint(5, 9)
        : this.sup === 2
          ? randint(10, 19)
          : randint(20, 29)
    const tetris = new Polyquad(aire, 0, 0)
    if (tetris.rectangle.xMax < tetris.rectangle.yMax)
      tetris.rotate(choice([true, false]))
    const xmin = tetris.rectangle.xMin
    const ymin = tetris.rectangle.yMin
    const xmax = tetris.rectangle.xMax + 3
    const ymax = tetris.rectangle.yMax
    const grid = grille(xmin, ymin, xmax, ymax)
    const uniteLongueur = segment(
      point(xmax - 2, ymax - 1),
      point(xmax - 1, ymax - 1),
    )
    uniteLongueur.epaisseur = 2
    uniteLongueur.styleExtremites = '|-|'
    uniteLongueur.tailleExtremites = 0.2
    const texteUniteLongueur = texteParPosition('u.l', xmax - 1.5, ymax - 1.8)
    const objets: NestedObjetMathalea2dArray = [
      tetris.poly,
      uniteLongueur,
      texteUniteLongueur,
    ]
    if (this.sup2) objets.push(grid)
    const fig1 = mathalea2d(
      Object.assign(
        { pixelsParCm: 20, scale: 0.5, style: 'display: inline-block' },
        fixeBordures(objets, {
          rxmin: -0.1,
          rymin: -0.1,
          rxmax: 0.1,
          rymax: 0.1,
        }),
      ),
      objets,
    )
    this.question = `Quel est le périmètre de la figure ci-dessous ?<br>

    ${fig1}`
    this.optionsChampTexte = { texteApres: ' u.l' }
    this.reponse = tetris.poly.perimetre
    this.correction = `Le périmètre de cette figure est : $${miseEnEvidence(String(this.reponse))}$ u.l.`
  }
}
