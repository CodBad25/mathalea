import { codageAngleDroit } from '../../lib/2d/CodageAngleDroit'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { nommePolygone, polygone } from '../../lib/2d/polygones'
import { rotation } from '../../lib/2d/transformations'
import {
  addObjetsCliquables,
  type ObjetCliquableData,
} from '../../lib/customElements/ObjetsCliquablesElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice } from '../../lib/outils/arrayOutils'
import { creerNomDePolygone } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { gestionnaireFormulaireTexte, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Indentifier les côtés d’un triangle rectangle'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '24/07/2026'

export const uuid = '40d57'

export const refs = {
  'fr-fr': ['4G20-0'],
  'fr-ch': [],
}

/**
 * @author Jean-Claude Lhote
 */
export default class IdentifierCoteTriangleRectangle extends Exercice {
  constructor() {
    super()
    this.sup = '1'
    this.besoinFormulaireTexte = [
      'Niveau de difficulté',
      '0: Mélange\n1 : Un seul triangle\n2 : Plusieurs triangles',
    ]
  }
  nouvelleVersion() {
    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 2,
      melange: 0,
      defaut: 1,
      nbQuestions: this.nbQuestions,
    }).map(Number)

    for (let i = 0; i < this.nbQuestions; ) {
      const terme = choice([
        'opposé',
        'adjacent',
        'opposé',
        'adjacent',
        'hypoténuse',
      ])
      const indexSommet = choice([0, 2])
      let question = ''
      switch (listeTypeDeQuestions[i]) {
        case 1: // Un seul triangle
          {
            const nom = creerNomDePolygone(3)
            const A = pointAbstrait(0, 0, nom[0])
            const B = pointAbstrait(6, 0, nom[1])
            const angle = randint(30, 60)
            const C = pointAbstrait(
              B.x,
              (B.y + 6 * Math.sin((angle * Math.PI) / 180)) * randint(-1, 1, 0),
              nom[2],
            )
            const AB = nom[0] + nom[1]
            const AC = nom[0] + nom[2]
            const BC = nom[1] + nom[2]
            const turnTriangle = randint(0, 360)
            const triangle = rotation(polygone([A, B, C]), A, turnTriangle)
            question =
              context.isHtml && this.interactif
                ? `Dans le triangle rectangle $${nom[0]}${nom[1]}${nom[2]}$, sélectionner ${terme === 'hypoténuse' ? "l'hypoténuse" : `le côté ${terme} à l'angle $\\widehat{${nom[2 - indexSommet]}${nom[indexSommet]}${nom[1]}}$`}.`
                : `Dans le triangle rectangle $${nom[0]}${nom[1]}${nom[2]}$, ${terme === 'hypoténuse' ? "l'hypoténuse" : `le côté ${terme} à l'angle $\\widehat{${nom[2 - indexSommet]}${nom[indexSommet]}${nom[1]}}$`} est :`
            const objetsFigure = [
              triangle,
              codageAngleDroit(
                triangle.listePoints[0],
                triangle.listePoints[1],
                triangle.listePoints[2],
              ),
              nommePolygone(triangle, nom),
            ]
            const figureId = `figEx${this.numeroExercice}Q${i}`
            question += mathalea2d(
              Object.assign({ id: figureId }, fixeBordures(objetsFigure)),
              objetsFigure,
            )
            const objets: ObjetCliquableData[] = [
              {
                type: 'segment',
                id: AB,
                x1: triangle.listePoints[0].x,
                y1: triangle.listePoints[0].y,
                x2: triangle.listePoints[1].x,
                y2: triangle.listePoints[1].y,
                etat: false,
              },
              {
                type: 'segment',
                id: AC,
                x1: triangle.listePoints[0].x,
                y1: triangle.listePoints[0].y,
                x2: triangle.listePoints[2].x,
                y2: triangle.listePoints[2].y,
                etat: false,
              },
              {
                type: 'segment',
                id: BC,
                x1: triangle.listePoints[1].x,
                y1: triangle.listePoints[1].y,
                x2: triangle.listePoints[2].x,
                y2: triangle.listePoints[2].y,
                etat: false,
              },
            ]
            const objetAttendu = objets.map((objet) => ({
              ...objet,
              etat:
                terme === 'hypoténuse'
                  ? objet.id === AC
                  : (terme === 'côté adjacent' && indexSommet === 0) ||
                      (terme === 'côté opposé' && indexSommet === 2)
                    ? objet.id === AB
                    : objet.id === BC,
            }))
            if (this.interactif) {
              question += addObjetsCliquables(this, i, { figureId, objets })
            }
            handleAnswers(
              this,
              i,
              { reponse: { value: JSON.stringify(objetAttendu) } },
              { formatInteractif: 'objets-cliquables' },
            )
          }
          break
        case 2:
          break
      }
      this.listeQuestions.push(question)
      this.listeCorrections.push('')
      i++
    }
  }
}
