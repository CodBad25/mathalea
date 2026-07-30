import { demiDroite } from '../../lib/2d/DemiDroite'
import { droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { nommePolygone, polygone } from '../../lib/2d/polygones'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { rotation, similitude, translation } from '../../lib/2d/transformations'
import { milieu, pointAdistance } from '../../lib/2d/utilitairesPoint'
import { vecteur } from '../../lib/2d/Vecteur'
import {
  addEditeurIep,
  ElementIepEditeur,
  pointsConstruitsDepuisProgramme,
  type ElementIepVerificationCallback,
  type InstructionIep,
  type InstructionsDisponiblesIep,
} from '../../lib/customElements/ElementIepEditeur'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
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
  'fr-fr': ['5G6B-2'],
  'fr-2016': [],
  'fr-ch': [],
}

const VERIFICATION_PARALLELOGRAMME_CALLBACK_NAME =
  '5G6B-2-verification-parallelogramme'

const memePosition = (
  point: { x: number; y: number },
  attendu: { x: number; y: number },
): boolean => Math.hypot(point.x - attendu.x, point.y - attendu.y) < 1e-6

const memeCote = (coteA: [string, string], coteB: [string, string]): boolean =>
  (coteA[0] === coteB[0] && coteA[1] === coteB[1]) ||
  (coteA[0] === coteB[1] && coteA[1] === coteB[0])

const sommetsPolygone = (sommets: string): string[] =>
  sommets
    .split(/[,\s;]+/)
    .map((sommet) => sommet.trim())
    .filter((sommet) => sommet.length > 0)

const programmeContientCote = (
  programme: InstructionIep[],
  cote: [string, string],
): boolean =>
  programme.some((instruction) => {
    if (instruction.type === 'segment') {
      return memeCote([instruction.p1, instruction.p2], cote)
    }
    if (
      instruction.type !== 'polygone' &&
      instruction.type !== 'polygoneRapide'
    ) {
      return false
    }
    const sommets = sommetsPolygone(instruction.sommets)
    return sommets.some((sommet, index) => {
      const suivant = sommets[(index + 1) % sommets.length]
      return memeCote([sommet, suivant], cote)
    })
  })

const cotesTraceesParProgramme = (
  programme: InstructionIep[],
): [string, string][] =>
  programme.flatMap((instruction) => {
    if (instruction.type === 'segment') {
      return [[instruction.p1, instruction.p2] satisfies [string, string]]
    }
    if (
      instruction.type !== 'polygone' &&
      instruction.type !== 'polygoneRapide'
    ) {
      return []
    }
    const sommets = sommetsPolygone(instruction.sommets)
    return sommets.map(
      (sommet, index) =>
        [sommet, sommets[(index + 1) % sommets.length]] satisfies [
          string,
          string,
        ],
    )
  })

const cotesUniques = (cotes: [string, string][]): [string, string][] =>
  cotes.reduce<[string, string][]>((uniques, cote) => {
    if (!uniques.some((coteUnique) => memeCote(coteUnique, cote))) {
      uniques.push(cote)
    }
    return uniques
  }, [])

const verifierParallelogramme: ElementIepVerificationCallback = ({
  studentProgram,
  expectedRaw,
}) => {
  if (typeof expectedRaw !== 'string') {
    return {
      isOk: false,
      feedback: 'Réponse attendue invalide.',
    }
  }
  let expectedProgram: InstructionIep[]
  try {
    const parsed = JSON.parse(expectedRaw)
    if (!Array.isArray(parsed)) {
      return {
        isOk: false,
        feedback: 'Réponse attendue invalide.',
      }
    }
    expectedProgram = parsed as InstructionIep[]
  } catch {
    return {
      isOk: false,
      feedback: 'Réponse attendue invalide.',
    }
  }
  const expectedPoints = pointsConstruitsDepuisProgramme(expectedProgram)
  const studentPoints = pointsConstruitsDepuisProgramme(studentProgram)
  const pointsOk = [...expectedPoints].every(([nom, point]) => {
    const construit = studentPoints.get(nom)
    return construit !== undefined && memePosition(construit, point)
  })
  const expectedCotes = cotesUniques(cotesTraceesParProgramme(expectedProgram))
  const cotesOk = expectedCotes.every((cote) =>
    programmeContientCote(studentProgram, cote),
  )
  const isOk = pointsOk && cotesOk
  return {
    isOk,
    feedback: isOk
      ? 'Bravo !'
      : 'La construction ne donne pas le parallélogramme attendu.',
  }
}

ElementIepEditeur.registerVerificationCallback(
  VERIFICATION_PARALLELOGRAMME_CALLBACK_NAME,
  verifierParallelogramme,
)

export default class ProgrammesConstructionsParallelogrammes extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
      'Type de questions',
      'Nombres séparés par des tirets :\n0: Mélange\n1 : Deux côtés consécutifs sont donnés\n2 : Trois sommets consécutifs sont donnés\n3 : Deux sommets consécutifs et le centre sont donnés\n4: Un angle et le sommet opposé',
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
      const O = milieu(A, C, noms[4], 'above right')
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
      const programmeAttendu: InstructionIep[] = []
      const instructionsDisponibles: InstructionsDisponiblesIep = []
      switch (listeTypeQuestions[i]) {
        case 1: // deux côtés consécutifs
          objetsFigure.push(
            segAB,
            segDA,
            nomPolygone.objets![0],
            nomPolygone.objets![1],
            nomPolygone.objets![3],
            tracePoint(B, D),
            C,
          )
          programmeInitial.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[3], x: D.x, y: D.y, protege: true },
            { type: 'segment', p1: noms[0], p2: noms[1], protege: false },
            { type: 'segment', p1: noms[3], p2: noms[0], protege: false },
          )
          programmeAttendu.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[3], x: D.x, y: D.y, protege: true },
            { type: 'segment', p1: noms[0], p2: noms[1], protege: true },
            { type: 'segment', p1: noms[3], p2: noms[0], protege: true },
            { type: 'parallele', p1: noms[0], p2: noms[1], p3: noms[3] },
            { type: 'parallele', p1: noms[3], p2: noms[0], p3: noms[1] },
            {
              type: 'intersection',
              etape1: 5,
              etape2: 6,
              choix: 1,
              nom: noms[2],
            },
            {
              type: 'polygone',
              sommets: `${noms[0]},${noms[1]},${noms[2]},${noms[3]}`,
            },
          )
          instructionsDisponibles.push(
            'parallele',
            'intersection',
            'polygone',
            'segment',
          )
          texte = `Compléter le programme de construction du  parallélogramme $${nom}$ afin de terminer la figure ci-dessous.<br>`

          break
        case 2: // trois sommets consécutifs
          objetsFigure.push(
            tracePoint(A, B, C),
            nomPolygone.objets![0],
            nomPolygone.objets![1],
            nomPolygone.objets![2],
            C,
          )
          programmeInitial.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[2], x: C.x, y: C.y, protege: true },
          )
          programmeAttendu.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[2], x: C.x, y: C.y, protege: true },
            { type: 'segment', p1: noms[0], p2: noms[2], protege: true },
            {
              type: 'milieu',
              p1: noms[0],
              p2: noms[2],
              protege: true,
              nom: noms[4],
            },
            { type: 'demiDroite', p1: noms[1], p2: noms[4], protege: true },
            { type: 'cercle', p1: noms[4], p2: noms[1], protege: true },
            {
              type: 'intersection',
              etape1: 5,
              etape2: 6,
              choix: 2,
              nom: noms[3],
            },
            {
              type: 'polygone',
              sommets: `${noms[0]},${noms[1]},${noms[2]},${noms[3]}`,
            },
          )
          instructionsDisponibles.push(
            'segment',
            'intersection',
            'cercle',
            'milieu',
            'demiDroite',
            'polygone',
          )
          texte = `Compléter le programme de construction du  parallélogramme $${nom}$ de centre $${noms[4]}$ afin de terminer la figure ci-dessous.<br>`
          break
        case 3: // deux sommets consécutifs et le centre
        default:
          objetsFigure.push(
            tracePoint(A, B, O),
            nomPolygone.objets![0],
            nomPolygone.objets![1],
            labelPoint(O),
            C,
            D,
          )
          programmeInitial.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[4], x: O.x, y: O.y, protege: true },
          )
          programmeAttendu.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[1], x: B.x, y: B.y, protege: true },
            { type: 'point', nom: noms[4], x: O.x, y: O.y, protege: true },
            { type: 'demiDroite', p1: noms[0], p2: noms[4], protege: true },
            { type: 'demiDroite', p1: noms[1], p2: noms[4], protege: true },
            { type: 'cercle', p1: noms[4], p2: noms[0], protege: true },
            { type: 'cercle', p1: noms[4], p2: noms[1], protege: true },
            {
              type: 'intersection',
              etape1: 3,
              etape2: 5,
              choix: 1,
              nom: noms[2],
            },
            {
              type: 'intersection',
              etape1: 4,
              etape2: 6,
              choix: 2,
              nom: noms[3],
            },
            {
              type: 'polygone',
              sommets: `${noms[0]},${noms[1]},${noms[2]},${noms[3]}`,
            },
          )
          instructionsDisponibles.push(
            'segment',
            'intersection',
            'cercle',
            'milieu',
            'demiDroite',
            'polygone',
          )
          texte = `Compléter le programme de construction du  parallélogramme $${nom}$ de centre $${noms[4]}$ afin de terminer la figure ci-dessous.<br>`

          break
        case 4: {
          // un angle et le sommet opposé
          const angleAB = droite(A, B).angleAvecHorizontale
          const angleAD = droite(A, D).angleAvecHorizontale
          objetsFigure.push(
            tracePoint(A, C),
            nomPolygone.objets![0],
            nomPolygone.objets![2],
            demiDroite(A, D),
            demiDroite(A, B),
            D,
            B,
          )
          programmeInitial.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[2], x: C.x, y: C.y, protege: true },
            {
              type: 'demiDroitePointDirection',
              p1: noms[0],
              angle: angleAB,
              protege: true,
            },
            {
              type: 'demiDroitePointDirection',
              p1: noms[0],
              angle: angleAD,
              protege: true,
            },
          )
          programmeAttendu.push(
            { type: 'point', nom: noms[0], x: A.x, y: A.y, protege: true },
            { type: 'point', nom: noms[2], x: C.x, y: C.y, protege: true },
            {
              type: 'demiDroitePointDirection',
              p1: noms[0],
              angle: angleAB,
              protege: true,
            },
            {
              type: 'demiDroitePointDirection',
              p1: noms[0],
              angle: angleAD,
              protege: true,
            },
            { type: 'paralleleAObjet', etape: 2, p1: noms[2] },
            { type: 'paralleleAObjet', etape: 3, p1: noms[2] },
            {
              type: 'intersection',
              etape1: 2,
              etape2: 5,
              choix: 1,
              nom: noms[1],
            },
            {
              type: 'intersection',
              etape1: 3,
              etape2: 4,
              choix: 1,
              nom: noms[3],
            },
            {
              type: 'polygone',
              sommets: `${noms[0]},${noms[1]},${noms[2]},${noms[3]}`,
            },
          )
          instructionsDisponibles.push(
            'segment',
            'intersection',
            'paralleleAObjet',
            'polygone',
            'prolongerObjet',
          )
          texte = `Compléter le programme de construction du  parallélogramme $${nom}$ (sens des aiguilles d'une montre), afin de terminer la figure ci-dessous.<br>`
        }
      }
      texte += mathalea2d(
        Object.assign({}, fixeBordures(objetsFigure)),
        objetsFigure,
      )
      texte += addEditeurIep(this, i, {
        programmeInitial,
        instructionsDisponibles,
        verifyCallbackName: VERIFICATION_PARALLELOGRAMME_CALLBACK_NAME,
      })
      handleAnswers(this, i, {
        reponse: {
          value: JSON.stringify(programmeAttendu),
        },
      })

      texteCorr = `Voici un programme de construction du parallélogramme $${nom}$ :<br>
        ${addEditeurIep(this, i, {
          id: `IepEditeur-corr-Ex${this.numeroExercice}Q${i}`,
          interactivityOn: false,
          programmeInitial: programmeAttendu,
          instructionsDisponibles: [],
          verifyCallbackName: VERIFICATION_PARALLELOGRAMME_CALLBACK_NAME,
        })}`
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
