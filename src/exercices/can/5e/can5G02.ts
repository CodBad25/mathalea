import { afficheMesureAngle } from '../../../lib/2d/AfficheMesureAngle'
import { codageAngleDroit } from '../../../lib/2d/CodageAngleDroit'
import { codageSegments } from '../../../lib/2d/CodageSegment'
import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { point } from '../../../lib/2d/PointAbstrait'
import { polygoneAvecNom } from '../../../lib/2d/polygones'
import { choice } from '../../../lib/outils/arrayOutils'
import { creerNomDePolygone } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

/**
+ * Calcule la tangente d'un angle en degrés
+ */
function degTan(deg: number): number {
  return Math.tan((deg * Math.PI) / 180)
}

export const titre = 'Calculer un angle dans un triangle isocèle'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication
 */
export const uuid = '7b386'

export const refs = {
  'fr-fr': ['can5G02'],
  'fr-ch': [],
}
export default class AngleTriangleIsocele extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'

    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let objets
    const nom = creerNomDePolygone(3, ['QD'])
    const a = randint(8, 14, 12) * 5
    const A = point(0, 0, nom[0])
    const B = point(5, 0, nom[1])
    const C = point(2.5, 2.5 * degTan(a), nom[2])
    const pol = polygoneAvecNom(A, B, C)

    switch (choice(['a', 'b'])) {
      case 'a':
        objets = []

        objets.push(pol[0], pol[1])
        objets.push(
          afficheMesureAngle(B, A, C, 'black', 1, a + '^\\circ'),
          codageSegments('||', 'blue', C, A, C, B),
        )
        this.question = `Quelle est la mesure en degré de l'angle $\\widehat{${nom[2]}}$ ? <br>
        `
        this.question += mathalea2d(
          Object.assign(
            {
              pixelsParCm: 20,
              mainlevee: false,
              amplitude: 0.3,
              scale: 1,
              style: 'margin: auto',
            },
            fixeBordures(objets),
          ),
          objets,
        )
        this.optionsChampTexte = { texteApres: ' °' }
        this.correction = ` Le triangle est isocèle. Ses deux angles à la base sont égaux.<br>
        Ainsi $\\widehat{${nom[2]}}=180°-2\\times ${a}°=${texNombre(180 - 2 * a)}°$
    <br>`
        this.reponse = 180 - 2 * a
        break
      case 'b':
        objets = []
        objets.push(pol[0], pol[1])
        objets.push(
          a === 45
            ? codageAngleDroit(A, C, B)
            : afficheMesureAngle(A, C, B, 'black', 1, 180 - 2 * a + '^\\circ'),
          codageSegments('||', 'blue', C, A, C, B),
        )
        this.question = `Quelle est la mesure en degré de l'angle $\\widehat{${nom[1]}}$ ?<br>
            `
        this.question += mathalea2d(
          Object.assign(
            {
              pixelsParCm: 20,
              mainlevee: false,
              amplitude: 0.3,
              scale: 0.8,
              style: 'margin: auto',
            },
            fixeBordures(objets),
          ),
          objets,
        )
        this.optionsChampTexte = { texteApres: ' °' }
        this.correction = ` Le triangle est isocèle. Ses deux angles à la base sont égaux.<br>
          Ainsi $\\widehat{${nom[1]}}=(180-${180 - 2 * a})\\div 2=${texNombre(a)}$.
      <br>`
        this.reponse = a

        break
    }
    this.canEnonce = this.question
    this.canReponseACompleter = '$\\ldots ^\\circ$'
  }
}
