import { codageAngleDroit } from '../../lib/2d/CodageAngleDroit'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { labelPoint, latex2d } from '../../lib/2d/textes'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre =
  'Calculer un côté dans un triangle rectangle avec le théorème de Pythagore'
export const dateDePublication = '22/06/2026'

export const uuid = '7c4e2'

export const refs = {
  'fr-fr': ['1A-G03-9', '2A-G4-5'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

type CoteCherche = 'AB' | 'AC'

/**
 * Exercice de calcul d'un côté dans un triangle rectangle avec le théorème de Pythagore.
 * @author Stéphane Guyon
 */
export default class CoteTriangleRectanglePythagoreQcm extends ExerciceQcmA {
  private racineTex(radicand: number) {
    const racine = Math.sqrt(radicand)
    return Number.isInteger(racine) ? `${racine}` : `\\sqrt{${radicand}}`
  }

  private appliquerLesValeurs(
    bc: number,
    longueurDonnee: number,
    coteCherche: CoteCherche,
  ) {
    const coteDonne = coteCherche === 'AB' ? 'AC' : 'AB'
    const carreLongueurCorrecte = bc ** 2 - longueurDonnee ** 2
    const sommeDesCarres = bc ** 2 + longueurDonnee ** 2
    const oubliDuCarre = bc ** 2 - longueurDonnee
    const longueurCorrecteTex = this.racineTex(carreLongueurCorrecte)

    this.reponses = [
      `$${longueurCorrecteTex}\\text{ cm}$`,
      `$${this.racineTex(sommeDesCarres)}\\text{ cm}$`,
      `$${this.racineTex(oubliDuCarre)}\\text{ cm}$`,
      `$${bc - longueurDonnee}\\text{ cm}$`,
    ]

    const pointA = pointAbstrait(0, 0, 'A', 'below left')
    const pointC = pointAbstrait(0, 3, 'C', 'above left')
    const pointB = pointAbstrait(4, 0, 'B', 'below right')
    const triangle = polygone([pointA, pointC, pointB])
    const angleDroit = codageAngleDroit(pointC, pointA, pointB)
    const etiquetteAB = coteCherche === 'AB' ? '?' : `${longueurDonnee}`
    const etiquetteAC = coteCherche === 'AC' ? '?' : `${longueurDonnee}`
    const objets = [
      triangle,
      angleDroit,
      labelPoint(pointA, pointC, pointB),
      latex2d(`${bc}`, 2.7, 1.7, {}),
      latex2d(etiquetteAB, 2, -0.8, {}),
      latex2d(etiquetteAC, -0.8, 1.5, {}),
    ]
    const figure = mathalea2d(
      Object.assign(
        { pixelsParCm: 20, scale: 1 },
        fixeBordures(objets, {
          rxmin: -0.6,
          rxmax: 0.6,
          rymin: -0.15,
          rymax: 0.45,
        }),
      ),
      objets,
    )

    this.enonce = `Dans le triangle $ABC$ rectangle en $A$ ci-contre, qui n'est pas représentée à l'échelle, on donne $BC=${bc}\\text{ cm}$ et $${coteDonne}=${longueurDonnee}\\text{ cm}$. <br>Quelle est la longueur du segment $[${coteCherche}]$ ?${figure}`

    this.correction = `Le triangle $ABC$ est rectangle en $A$. D'après le théorème de Pythagore :<br>
$BC^2=AB^2+AC^2$.<br>
Donc $${coteCherche}^2=BC^2-${coteDonne}^2=${bc}^2-${longueurDonnee}^2=${bc ** 2}-${longueurDonnee ** 2}=${carreLongueurCorrecte}$.<br>
Comme une longueur est positive, $${coteCherche}=${miseEnEvidence(`${longueurCorrecteTex}\\text{ cm}`)}$.`
  }

  versionAleatoire = () => {
    const hypotenuse = randint(5, 12)
    const longueurDonnee = randint(2, hypotenuse - 1)
    this.appliquerLesValeurs(
      hypotenuse,
      longueurDonnee,
      choice<CoteCherche>(['AB', 'AC']),
    )
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
