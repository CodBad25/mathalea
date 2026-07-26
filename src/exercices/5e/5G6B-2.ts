import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { nommePolygone, polygone } from '../../lib/2d/polygones'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { tracePoint } from '../../lib/2d/TracePoint'
import { rotation, similitude, translation } from '../../lib/2d/transformations'
import { milieu, pointAdistance } from '../../lib/2d/utilitairesPoint'
import { vecteur } from '../../lib/2d/Vecteur'
import { vide2d } from '../../lib/2d/Vide2d'
import {
  addEditeurIep,
  type InstructionIep,
} from '../../lib/customElements/ElementIepEditeur'
import { choisitLettresDifferentes } from '../../lib/outils/aleatoires'
import { mathalea2d } from '../../modules/mathalea2d'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'

export const titre = 'Construire des parallélogrammes'
export const dateDeModifImportante = '18/04/2024'
export const dateDePublication = '26/07/2026'
export const interactifType = 'editeur-iep'
export const interactifReady = true

/**
 * Donner le programme de construction d'un parallélogramme dans des situations variées.
 * @author Jean-claude Lhote
 */
export const uuid = 'b612b'

export const refs = {
  'fr-fr': [],
  'fr-2016': [],
  'fr-ch': [],
}
export default class ProgrammesConstructionsParallelogrammes extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
      'Type de questions',
      'Nombres séparés par des tirets :\n0: Mélange\n1 : Deux côtés consécutifs sont donnés\n2 : Trois sommets consécutifs sont donnés\n3 : Deux sommets consécutifs et le centre sont donnés\n4 : Un angle et le centre sont donnés',
    ]

    this.nbQuestions = 1
    this.sup = '1'
    this.sup2 = 2
    this.sup3 = true
    this.spacingCorr = 2
    this.correctionDetaillee = false
    this.correctionDetailleeDisponible = true
  }

  nouvelleVersion(numeroExercice: number) {
    const listeTypeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 4,
      melange: 0,
      defaut: 1,
      nbQuestions: this.nbQuestions,
    }).map(Number)

    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // On prépare la figure...

      const noms = choisitLettresDifferentes(5, 'QO', true) // on choisit 5 lettres, les 4 premières sont les sommets, la 5e est le centre
      const nom = `${noms[0] + noms[1] + noms[2] + noms[3]}`
      const angleRotationFigure = randint(0, 360)
      const angleBAC = randint(30, 45)
      const A = pointAbstrait(0, 0, noms[0])
      const B = rotation(
        pointAdistance(A, 6, 0),
        A,
        angleRotationFigure,
        noms[1],
      )
      const C = similitude(B, A, angleBAC, randint(7, 9) / 10, noms[2])
      const D = translation(C, vecteur(B, A), noms[3])
      const O = milieu(A, C, noms[4])
      const parallelogramme = polygone(A, B, C, D)
      const segAB = segment(A, B)
      const segBC = segment(B, C)
      const segCD = segment(C, D)
      const segDA = segment(D, A)
      const segAC = segment(A, C)
      const segBD = segment(B, D)
      const nomPolygone = nommePolygone(parallelogramme)
      const objetsFigure: NestedObjetMathalea2dArray = []
      const programmeInitial: InstructionIep[] = []
      const pointFantome = vide2d()

      switch (listeTypeQuestions[i]) {
        case 1: // deux côtés consécutifs
        default:
          pointFantome.x = C.x
          pointFantome.y = C.y
          objetsFigure.push(
            segAB,
            segDA,
            nomPolygone.objets![0],
            nomPolygone.objets![1],
            nomPolygone.objets![3],
            tracePoint(B, D),
          )
          programmeInitial.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[3], x: D.x, y: D.y, protege: true },
            { type: 'segment', p1: noms[0], p2: noms[1], protege: false },
            { type: 'segment', p1: noms[3], p2: noms[0], protege: false },
          )
          texte = `Compléter le programme de construction du  parallélogramme $${nom}$ afin de terminer la figure ci-dessous.<br>
          ${mathalea2d(Object.assign({}, fixeBordures(objetsFigure)), objetsFigure)}`
          texte += addEditeurIep(this, i, {
            programmeInitial,
            instructionsDisponibles: ['parallele', 'intersection', 'segment'],
          })

          texteCorr = 'Plusieurs constructions sont possibles'
          break
      }

      // Si la question n'a jamais été posée, on l'enregistre
      if (this.questionJamaisPosee(i, texte)) {
        // <- laisser le i et ajouter toutes les variables qui rendent les exercices différents (par exemple a, b, c et d)
        // Supprime b, c et d dans la ligne ci-dessus et remplace les par NombreAAjouter !
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
