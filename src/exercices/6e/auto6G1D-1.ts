import {
  addEditeurIep,
  ElementIepEditeur,
  pointsConstruitsDepuisProgramme,
  type ElementIepVerificationCallback,
  type InstructionIep,
  type TypeInstructionIep,
} from '../../lib/customElements/ElementIepEditeur'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { creerNomDePolygone } from '../../lib/outils/outilString'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Construire un quadrilatère aux instruments'
export const interactifType = 'alea-iep-editeur'
export const interactifReady = true
export const dateDePublication = '23/08/2026'
export const uuid = 'd1b7f'

export const refs = {
  'fr-fr': ['auto6G1D-1', '6AutoG2-2'],
  'fr-2016': [],
  'fr-ch': [],
}

const typesFigures = ['Carré', 'Rectangle', 'Losange'] as const

type TypeFigure = (typeof typesFigures)[number]
type PointIep = {
  nom: string
  x: number
  y: number
}
type FigureAConstruire = {
  type: TypeFigure
  noms: [string, string, string, string]
  points: [PointIep, PointIep, PointIep, PointIep]
  angleAB: number
  angleAD: number
}
type ReponseAttendue = {
  type: TypeFigure
  noms: [string, string, string, string]
  programme: InstructionIep[]
}

const EPSILON_LONGUEUR = 0.25
const EPSILON_ANGLE_DROIT = 0.08
const EPSILON_PARALLELISME = 0.08

const VERIFICATION_QUADRILATERE_INSTRUMENTS_CALLBACK_NAME =
  'verification-construction-quadrilatere-instruments'

function distance(A: PointIep, B: PointIep): number {
  return Math.hypot(B.x - A.x, B.y - A.y)
}

function produitScalaire(A: PointIep, B: PointIep, C: PointIep): number {
  return (A.x - B.x) * (C.x - B.x) + (A.y - B.y) * (C.y - B.y)
}

function produitVectoriel(A: PointIep, B: PointIep, C: PointIep, D: PointIep) {
  return (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x)
}

function angleDroit(A: PointIep, B: PointIep, C: PointIep): boolean {
  const denominateur = distance(A, B) * distance(C, B)
  return (
    denominateur > 0 &&
    Math.abs(produitScalaire(A, B, C) / denominateur) <= EPSILON_ANGLE_DROIT
  )
}

function paralleles(
  A: PointIep,
  B: PointIep,
  C: PointIep,
  D: PointIep,
): boolean {
  const denominateur = distance(A, B) * distance(C, D)
  return (
    denominateur > 0 &&
    Math.abs(produitVectoriel(A, B, C, D) / denominateur) <=
      EPSILON_PARALLELISME
  )
}

function memeSegment(instruction: InstructionIep, p1: string, p2: string) {
  if (
    instruction.type !== 'segment' &&
    instruction.type !== 'trait' &&
    instruction.type !== 'segmentCodage'
  ) {
    return false
  }
  return (
    (instruction.p1 === p1 && instruction.p2 === p2) ||
    (instruction.p1 === p2 && instruction.p2 === p1)
  )
}

function segmentTrace(programme: InstructionIep[], p1: string, p2: string) {
  return programme.some((instruction) => {
    if (memeSegment(instruction, p1, p2)) return true
    if (
      instruction.type !== 'polygone' &&
      instruction.type !== 'polygoneRapide'
    ) {
      return false
    }
    const sommets = instruction.sommets
      .split(/[,;\s]+/)
      .map((sommet) => sommet.trim())
      .filter((sommet) => sommet !== '')
    return sommets.some((sommet, index) => {
      const suivant = sommets[(index + 1) % sommets.length]
      return (
        (sommet === p1 && suivant === p2) || (sommet === p2 && suivant === p1)
      )
    })
  })
}

function codageSegment(
  programme: InstructionIep[],
  p1: string,
  p2: string,
): string | undefined {
  const instruction = programme.find(
    (instruction) =>
      instruction.type === 'segmentCodage' && memeSegment(instruction, p1, p2),
  )
  return instruction?.type === 'segmentCodage' ? instruction.codage : undefined
}

function angleCodeDroit(
  programme: InstructionIep[],
  p1: string,
  p2: string,
  p3: string,
) {
  return programme.some(
    (instruction) =>
      instruction.type === 'codageAngleDroit' &&
      instruction.p2 === p2 &&
      ((instruction.p1 === p1 && instruction.p3 === p3) ||
        (instruction.p1 === p3 && instruction.p3 === p1)),
  )
}

function tousLesSegmentsTraces(programme: InstructionIep[], noms: string[]) {
  return noms.every((nom, index) =>
    segmentTrace(programme, nom, noms[(index + 1) % noms.length]),
  )
}

function tousLesAnglesDroitsCodes(programme: InstructionIep[], noms: string[]) {
  return noms.every((nom, index) =>
    angleCodeDroit(
      programme,
      noms[(index + noms.length - 1) % noms.length],
      nom,
      noms[(index + 1) % noms.length],
    ),
  )
}

function codagesEgaliteCorrects(
  programme: InstructionIep[],
  typeFigure: TypeFigure,
  noms: string[],
) {
  const [A, B, C, D] = noms
  const codageAB = codageSegment(programme, A, B)
  const codageBC = codageSegment(programme, B, C)
  const codageCD = codageSegment(programme, C, D)
  const codageDA = codageSegment(programme, D, A)
  if (typeFigure === 'Carré' || typeFigure === 'Losange') {
    return (
      codageAB !== undefined &&
      codageAB === codageBC &&
      codageAB === codageCD &&
      codageAB === codageDA
    )
  }
  return (
    codageAB !== undefined &&
    codageBC !== undefined &&
    codageAB !== codageBC &&
    codageAB === codageCD &&
    codageBC === codageDA
  )
}

function pointsDeLaReponse(
  programme: InstructionIep[],
  noms: string[],
): PointIep[] | undefined {
  const points = pointsConstruitsDepuisProgramme(programme) as Map<
    string,
    PointIep
  >
  const sommets = noms.map((nom) => points.get(nom))
  if (sommets.some((point) => point === undefined)) return undefined
  return sommets as PointIep[]
}

function figureCorrecte(typeFigure: TypeFigure, sommets: PointIep[]) {
  const [A, B, C, D] = sommets
  const ab = distance(A, B)
  const bc = distance(B, C)
  const cd = distance(C, D)
  const da = distance(D, A)
  const cotesOpposesParalleles =
    paralleles(A, B, D, C) && paralleles(B, C, A, D)
  if (!cotesOpposesParalleles) return false
  switch (typeFigure) {
    case 'Carré':
      return (
        Math.abs(ab - bc) <= EPSILON_LONGUEUR &&
        Math.abs(ab - cd) <= EPSILON_LONGUEUR &&
        Math.abs(ab - da) <= EPSILON_LONGUEUR &&
        angleDroit(D, A, B) &&
        angleDroit(A, B, C)
      )
    case 'Rectangle':
      return (
        Math.abs(ab - cd) <= EPSILON_LONGUEUR &&
        Math.abs(bc - da) <= EPSILON_LONGUEUR &&
        Math.abs(ab - bc) > EPSILON_LONGUEUR &&
        angleDroit(D, A, B) &&
        angleDroit(A, B, C)
      )
    case 'Losange':
      return (
        Math.abs(ab - bc) <= EPSILON_LONGUEUR &&
        Math.abs(ab - cd) <= EPSILON_LONGUEUR &&
        Math.abs(ab - da) <= EPSILON_LONGUEUR &&
        !angleDroit(D, A, B)
      )
  }
}

function lireReponseAttendue(
  expectedRaw: unknown,
): ReponseAttendue | undefined {
  if (typeof expectedRaw !== 'string') return undefined
  try {
    const parsed = JSON.parse(expectedRaw)
    if (
      parsed == null ||
      !typesFigures.includes(parsed.type) ||
      !Array.isArray(parsed.noms) ||
      parsed.noms.length !== 4
    ) {
      return undefined
    }
    return parsed as ReponseAttendue
  } catch {
    return undefined
  }
}

const verifierConstructionQuadrilatere: ElementIepVerificationCallback = ({
  studentProgram,
  expectedRaw,
}) => {
  const reponseAttendue = lireReponseAttendue(expectedRaw)
  if (reponseAttendue === undefined) {
    return {
      isOk: false,
      feedback: 'Réponse attendue invalide.',
    }
  }
  const sommets = pointsDeLaReponse(studentProgram, reponseAttendue.noms)
  if (sommets === undefined) {
    return {
      isOk: false,
      feedback: `Les points ${reponseAttendue.noms.join(', ')} doivent être construits et nommés correctement.`,
    }
  }
  if (!figureCorrecte(reponseAttendue.type, sommets)) {
    return {
      isOk: false,
      feedback: `La figure obtenue n'a pas les propriétés d'un ${reponseAttendue.type.toLowerCase()}.`,
    }
  }
  if (!tousLesSegmentsTraces(studentProgram, reponseAttendue.noms)) {
    return {
      isOk: false,
      feedback: 'Le contour du quadrilatère doit être tracé.',
    }
  }
  if (
    !codagesEgaliteCorrects(
      studentProgram,
      reponseAttendue.type,
      reponseAttendue.noms,
    )
  ) {
    return {
      isOk: false,
      feedback:
        'Les égalités de longueur doivent être codées sur les côtés concernés.',
    }
  }
  if (
    (reponseAttendue.type === 'Carré' ||
      reponseAttendue.type === 'Rectangle') &&
    !tousLesAnglesDroitsCodes(studentProgram, reponseAttendue.noms)
  ) {
    return {
      isOk: false,
      feedback: 'Les quatre angles droits doivent être codés.',
    }
  }
  return {
    isOk: true,
    feedback: 'Bravo, la figure est construite et correctement codée.',
  }
}

ElementIepEditeur.registerVerificationCallback(
  VERIFICATION_QUADRILATERE_INSTRUMENTS_CALLBACK_NAME,
  verifierConstructionQuadrilatere,
)

function creerFigure(type: TypeFigure): FigureAConstruire {
  const nom = creerNomDePolygone(4, [])
  const noms = [nom[0], nom[1], nom[2], nom[3]] as [
    string,
    string,
    string,
    string,
  ]
  const longueur = randint(40, 75) / 10
  const largeur = randint(20, longueur * 10 - 1) / 10
  const angleLosange = randint(50, 70)
  const angleRad = (angleLosange * Math.PI) / 180
  let coordonnees: Array<[number, number]>
  switch (type) {
    case 'Carré':
      coordonnees = [
        [1, 1],
        [1 + longueur, 1],
        [1 + longueur, 1 + longueur],
        [1, 1 + longueur],
      ]
      break
    case 'Rectangle':
      coordonnees = [
        [1, 1],
        [1 + longueur, 1],
        [1 + longueur, 1 + largeur],
        [1, 1 + largeur],
      ]
      break
    case 'Losange':
      coordonnees = [
        [1, 1],
        [1 + longueur, 1],
        [
          1 + longueur + longueur * Math.cos(angleRad),
          1 + longueur * Math.sin(angleRad),
        ],
        [1 + longueur * Math.cos(angleRad), 1 + longueur * Math.sin(angleRad)],
      ]
      break
  }
  const rotation = (randint(-25, 25) * Math.PI) / 180
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const centre = coordonnees.reduce(
    (acc, [x, y]) => ({ x: acc.x + x / 4, y: acc.y + y / 4 }),
    { x: 0, y: 0 },
  )
  const points = coordonnees.map(([xInitial, yInitial], index) => {
    const x = xInitial - centre.x
    const y = yInitial - centre.y
    return {
      nom: noms[index],
      x: Number((4 + x * cos - y * sin).toFixed(2)),
      y: Number((4 + x * sin + y * cos).toFixed(2)),
    }
  }) as [PointIep, PointIep, PointIep, PointIep]
  const angleAB =
    (Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) * 180) /
    Math.PI
  const angleAD =
    (Math.atan2(points[3].y - points[0].y, points[3].x - points[0].x) * 180) /
    Math.PI
  return { type, noms, points, angleAB, angleAD }
}

function programmeConstruction(figure: FigureAConstruire): InstructionIep[] {
  const [A, B, C, D] = figure.noms
  const ab = distance(figure.points[0], figure.points[1])
  const ad = distance(figure.points[0], figure.points[3])
  const etapeSegmentAB = 2
  const etapeSegmentAD = 4
  const etapeParalleleAD = 5
  const etapeParalleleAB = 6
  const codageCotes =
    figure.type === 'Rectangle'
      ? [
          { type: 'segmentCodage' as const, p1: A, p2: B, codage: '/' },
          { type: 'segmentCodage' as const, p1: C, p2: D, codage: '/' },
          { type: 'segmentCodage' as const, p1: B, p2: C, codage: '//' },
          { type: 'segmentCodage' as const, p1: D, p2: A, codage: '//' },
        ]
      : [
          { type: 'segmentCodage' as const, p1: A, p2: B, codage: '/' },
          { type: 'segmentCodage' as const, p1: B, p2: C, codage: '/' },
          { type: 'segmentCodage' as const, p1: C, p2: D, codage: '/' },
          { type: 'segmentCodage' as const, p1: D, p2: A, codage: '/' },
        ]
  const codageAngles: InstructionIep[] =
    figure.type === 'Losange'
      ? []
      : [
          { type: 'codageAngleDroit', p1: D, p2: A, p3: B },
          { type: 'codageAngleDroit', p1: A, p2: B, p3: C },
          { type: 'codageAngleDroit', p1: B, p2: C, p3: D },
          { type: 'codageAngleDroit', p1: C, p2: D, p3: A },
        ]
  return [
    {
      type: 'point',
      nom: A,
      x: figure.points[0].x,
      y: figure.points[0].y,
    },
    {
      type: 'pointADistance',
      nom: B,
      p1: A,
      distance: Number(ab.toFixed(2)),
      angle: Number(figure.angleAB.toFixed(1)),
    },
    { type: 'segment', p1: A, p2: B },
    {
      type: 'pointADistance',
      nom: D,
      p1: A,
      distance: Number(ad.toFixed(2)),
      angle: Number(figure.angleAD.toFixed(1)),
    },
    { type: 'segment', p1: A, p2: D },
    { type: 'paralleleAObjet', etape: etapeSegmentAD, p1: B },
    { type: 'paralleleAObjet', etape: etapeSegmentAB, p1: D },
    {
      type: 'intersection',
      etape1: etapeParalleleAD,
      etape2: etapeParalleleAB,
      nom: C,
      choix: 1,
    },
    { type: 'polygoneRapide', sommets: figure.noms.join(',') },
    ...codageCotes,
    ...codageAngles,
  ]
}

function enonceFigure(figure: FigureAConstruire) {
  const [A, B, C, D] = figure.noms
  const longueurAB = texNombre(distance(figure.points[0], figure.points[1]), 1)
  const longueurBC = texNombre(distance(figure.points[1], figure.points[2]), 1)
  let consigne = ''
  switch (figure.type) {
    case 'Carré':
      consigne = `Construire aux instruments le carré $${A}${B}${C}${D}$ de côté $${longueurAB}$ cm, puis coder les côtés de même longueur et les angles droits.`
      break
    case 'Rectangle':
      consigne = `Construire aux instruments le rectangle $${A}${B}${C}${D}$ tel que $${A}${B}=${longueurAB}$ cm et $${B}${C}=${longueurBC}$ cm, puis coder les côtés de même longueur et les angles droits.`
      break
    case 'Losange':
      consigne = `Construire aux instruments le losange $${A}${B}${C}${D}$ de côté $${longueurAB}$ cm, puis coder les côtés de même longueur.`
      break
  }
  return (
    consigne +
    `<br>Le polygone devra être tracé avec l'instruction "Tracer un polygone à la règle".`
  )
}

/**
 * @author Jean-Claude Lhote
 */
export default class ConstruireQuadrilatereAuxInstruments extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.besoinFormulaireNumerique = [
      'Type de figure',
      4,
      '1 : Carré\n2 : Rectangle\n3 : Losange\n4 : Mélange',
    ]
    this.sup = 4
  }

  nouvelleVersion() {
    const typeFigure =
      typesFigures[this.sup - 1] ??
      typesFigures[randint(0, typesFigures.length - 1)]
    const figure = creerFigure(typeFigure)
    const programmeAttendu = programmeConstruction(figure)
    const instructionsDisponibles: TypeInstructionIep[] = [
      'point',
      'pointADistance',
      'droite',
      'polygone',
      'perpendiculaireAObjet',
      'paralleleAObjet',
      'intersection',
      'cercle',
      'cercleRayon',
      'reporterLongueurCompas',
      'segmentCodage',
      'codageAngleDroit',
    ]
    const editeur = addEditeurIep(this, 0, {
      instructionsDisponibles,
      programmeAttendu,
      verifyCallbackName: VERIFICATION_QUADRILATERE_INSTRUMENTS_CALLBACK_NAME,
    })
    handleAnswers(
      this,
      0,
      {
        reponse: {
          value: JSON.stringify({
            type: figure.type,
            noms: figure.noms,
            programme: programmeAttendu,
          } satisfies ReponseAttendue),
        },
      },
      { formatInteractif: 'alea-iep-editeur' },
    )
    this.listeQuestions[0] = `${
      context.isHtml && !context.isTypst
        ? enonceFigure(figure)
        : enonceFigure(figure).split('<br>')[0]
    }<br>${editeur}`
    this.listeCorrections[0] = `Voici une construction possible :<br>${addEditeurIep(
      this,
      0,
      {
        id: `IepEditeur-corr-Ex${this.numeroExercice}Q0`,
        interactivityOn: false,
        programmeInitial: programmeAttendu,
        instructionsDisponibles,
      },
    )}`
    listeQuestionsToContenu(this)
  }
}
