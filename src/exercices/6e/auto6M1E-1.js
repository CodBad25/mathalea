import { afficheLongueurSegment } from '../../lib/2d/afficheLongueurSegment'
import { cercle } from '../../lib/2d/cercle'
import { codageAngleDroit } from '../../lib/2d/CodageAngleDroit'
import { codageSegments } from '../../lib/2d/CodageSegment'
import { point } from '../../lib/2d/PointAbstrait'
import { polygoneAvecNom } from '../../lib/2d/polygones'
import { rotation, similitude, translation } from '../../lib/2d/transformations'
import {
  pointAdistance,
  pointIntersectionCC,
} from '../../lib/2d/utilitairesPoint'
import { vecteur } from '../../lib/2d/Vecteur'
import { bleuMathalea } from '../../lib/colors'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { creerNomDePolygone } from '../../lib/outils/outilString'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Calculer le périmètre de carrés, rectangles et triangles'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifType = 'mathLive'
export const interactifReady = true

export const dateDePublication = '27/11/2022'
/**
 * Un carré, un rectangle et un triangle sont tracés.
 *
 * Il faut calculer les périmètres
 *
 * @author Sébastien LOZANO
 * Lachement repiquer à Rémi Angot et adapté

 */
export const uuid = '5563e'

export const refs = {
  'fr-fr': ['auto6M1E-1'],
  'fr-2016': ['6M11-3'],
  'fr-ch': ['9GM1-1'],
}
export default class AireCarresRectanglesTrianglesSL extends Exercice {
  constructor() {
    super()

    this.interactif = false

    this.spacing = 2

    context.isHtml ? (this.spacingCorr = 3) : (this.spacingCorr = 2)
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    let texte = ''
    let texteCorr = ''
    const nom = creerNomDePolygone(11, 'QD')

    const c = randint(2, 6)
    const L = randint(2, 5)
    const l = randint(2, 5, L)
    let a = randint(2, 5)
    let b = randint(2, 5)
    // Si b<a on permute pour le choix de c
    if (b < a) {
      const tmp = a
      a = b
      b = tmp
    }
    const d = randint(b - a, a + b, [b - a, a + b])
    const A = point(0, 0, nom[0])
    const B = rotation(point(c, 0), A, randint(-15, 15), nom[1])
    const C = rotation(A, B, -90, nom[2])
    const D = rotation(B, A, 90, nom[3])
    const carre = polygoneAvecNom(A, B, C, D)
    const E = point(8, 0, nom[4])
    const F = pointAdistance(E, L, randint(-15, 15), nom[5])
    const G = similitude(E, F, -90, l / L, nom[6])
    const H = translation(G, vecteur(F, E), nom[7])
    const rectangle = polygoneAvecNom(E, F, G, H)
    const I = point(15, 0, nom[8])
    const J = pointAdistance(I, a, randint(-25, 25), nom[9])
    J.positionLabel = 'right'
    const cI = cercle(I, b)
    const cJ = cercle(J, d)
    const K = pointIntersectionCC(cI, cJ, nom[10], 1)
    K.positionLabel = 'above'
    const triangle = polygoneAvecNom(I, J, K)
    this.introduction = mathalea2d(
      {
        xmin: -2,
        xmax: 22,
        ymin: -3,
        ymax: 7,
        pixelsParCm: 20,
        scale: 0.75,
        mainlevee: false,
      },
      carre,
      codageAngleDroit(A, B, C),
      codageAngleDroit(A, D, C),
      codageAngleDroit(D, C, B),
      codageAngleDroit(B, A, D),
      codageSegments('//', bleuMathalea, [A, B, C, D]),
      afficheLongueurSegment(B, A),
      rectangle,
      codageAngleDroit(E, F, G),
      codageAngleDroit(F, G, H),
      codageAngleDroit(G, H, E),
      codageAngleDroit(H, E, F),
      codageSegments('/', 'red', E, F, G, H),
      codageSegments('||', bleuMathalea, F, G, H, E),
      afficheLongueurSegment(F, E),
      afficheLongueurSegment(G, F),
      triangle,
      afficheLongueurSegment(J, I),
      afficheLongueurSegment(K, J),
      afficheLongueurSegment(I, K),
    )
    for (let i = 0; i < 3; i++) {
      texte = ''
      texteCorr = ''
      switch (i) {
        case 0:
          texte = 'Calculer le périmètre du carré en cm.'

          texteCorr += `$\\mathcal{P}_{${nom[0] + nom[1] + nom[2] + nom[3]}}=4\\times ${c}\\text{ cm}=${4 * c}\\text{ cm}$`
          handleAnswers(this, i, {
            reponse: {
              value: 4 * c,
              options: { nombreDecimalSeulement: true },
            },
          })
          if (context.isAmc) {
            this.autoCorrection[i] = {
              enonce: `Calculer le périmètre du carré de côté ${c}cm en cm.`,
              propositions: [{ texte: texteCorr, statut: 0 }],
              reponse: {
                texte: 'Périmètre en cm',
                valeur: 4 * c,
                param: {
                  digits: 2,
                  decimals: 0,
                  signe: false,
                  exposantNbChiffres: 0,
                  exposantSigne: false,
                  approx: 0,
                },
              },
            }
          }
          break
        case 1:
          texte = 'Calculer le périmètre du rectangle en cm.'
          texteCorr += `$\\mathcal{P}_{${nom[4] + nom[5] + nom[6] + nom[7]}}=2\\times ${L}\\text{ cm} + 2\\times${l}\\text{ cm}=${
            2 * L + 2 * l
          }\\text{ cm}$`
          handleAnswers(this, i, {
            reponse: {
              value: 2 * L + 2 * l,
              options: { nombreDecimalSeulement: true },
            },
          })
          if (context.isAmc) {
            this.autoCorrection[i] = {
              enonce: `Calculer le périmètre du rectangle de longueur ${L}cm et de largeur ${l}cm en cm.`,
              propositions: [{ texte: texteCorr, statut: 0 }],
              reponse: {
                texte: 'Périmètre en cm',
                valeur: 2 * L + 2 * l,
                param: {
                  digits: 2,
                  decimals: 0,
                  signe: false,
                  exposantNbChiffres: 0,
                  exposantSigne: false,
                  approx: 0,
                },
              },
            }
          }
          break
        case 2:
          texte = 'Calculer le périmètre du triangle en cm.'
          texteCorr += `$\\mathcal{P}_{${nom[8] + nom[9] + nom[10]}}=${a}\\text{ cm} + ${b}\\text{ cm} + ${d}\\text{ cm} =${a + b + d}\\text{ cm}$`
          handleAnswers(this, i, {
            reponse: {
              value: texNombre(a + b + d),
              options: { nombreDecimalSeulement: true },
            },
          })
          if (context.isAmc) {
            this.autoCorrection[i] = {
              enonce: `Calculer le périmètre du triangle dont les côtés de l'angle droit mesurent ${a}cm, ${b}cm et ${d}cm en cm.`,
              propositions: [{ texte: texteCorr, statut: 0 }],
              reponse: {
                texte: 'Périmètre en cm',
                valeur: a + b + d,
                param: {
                  digits: 2,
                  decimals: 0,
                  signe: false,
                  exposantNbChiffres: 0,
                  exposantSigne: false,
                  approx: 0,
                },
              },
            }
          }
          break
      }
      texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
    }
    listeQuestionsToContenu(this)
  }
}
