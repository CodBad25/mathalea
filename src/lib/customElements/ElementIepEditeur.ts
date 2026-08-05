import Alea2iep from '../../modules/Alea2iep'
import { context } from '../../modules/context'
import { cercle } from '../2d/cercle'
import { droite } from '../2d/droites'
import { pointAbstrait, type PointAbstrait } from '../2d/PointAbstrait'
import { projectionOrtho, rotation } from '../2d/transformations'
import { longueur } from '../2d/utilitairesGeometriques'
import {
  milieu,
  pointAdistance,
  pointIntersectionCC,
  pointIntersectionDD,
  pointIntersectionLC,
  pointSurDroite,
  pointSurSegment,
} from '../2d/utilitairesPoint'
import { stringNombre } from '../outils/texNombre'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

/**
 * Éditeur d'animations de constructions aux instruments (Instrumenpoche)
 *
 * Custom element <alea-iep-editeur> qui permet de :
 * - construire un programme de construction avec des boutons
 * - afficher/réordonner/supprimer les étapes du programme
 * - tester l'animation avec le lecteur Instrumenpoche (boutons de lecture)
 *
 * @author Rémi Angot
 */

export type OutilIep =
  'regle' | 'crayon' | 'equerre' | 'requerre' | 'compas' | 'rapporteur'

// Nom de l'instrument avec son article pour les descriptions en français
const nomsOutils: Record<OutilIep, string> = {
  regle: 'la règle',
  crayon: 'le crayon',
  equerre: 'l’équerre',
  requerre: 'la réquerre',
  compas: 'le compas',
  rapporteur: 'le rapporteur',
}

// Types d'instructions dont le tracé peut servir de support à une intersection
type TypeElementIntersectable =
  | 'droite'
  | 'droitePointPente'
  | 'segment'
  | 'trait'
  | 'demiDroite'
  | 'demiDroitePointDirection'
  | 'demiDroiteAngle'
  | 'cercle'
  | 'arc'
  | 'parallele'
  | 'paralleleAObjet'
  | 'paralleleObjet'
  | 'perpendiculaireAObjet'
  | 'perpendiculaire'
  | 'mediatrice'
  | 'bissectrice'

type TypeElementDirection =
  | 'droite'
  | 'droitePointPente'
  | 'segment'
  | 'trait'
  | 'demiDroite'
  | 'demiDroitePointDirection'
  | 'demiDroiteAngle'
  | 'parallele'
  | 'paralleleAObjet'
  | 'paralleleObjet'
  | 'perpendiculaireAObjet'
  | 'perpendiculaire'
  | 'mediatrice'
  | 'bissectrice'

const typesElementsIntersectables: TypeElementIntersectable[] = [
  'droite',
  'droitePointPente',
  'segment',
  'trait',
  'demiDroite',
  'demiDroitePointDirection',
  'demiDroiteAngle',
  'cercle',
  'arc',
  'parallele',
  'paralleleAObjet',
  'paralleleObjet',
  'perpendiculaireAObjet',
  'perpendiculaire',
  'mediatrice',
  'bissectrice',
]

const typesElementsDirection: TypeElementDirection[] = [
  'droite',
  'droitePointPente',
  'segment',
  'trait',
  'demiDroite',
  'demiDroitePointDirection',
  'demiDroiteAngle',
  'parallele',
  'paralleleAObjet',
  'paralleleObjet',
  'perpendiculaireAObjet',
  'perpendiculaire',
  'mediatrice',
  'bissectrice',
]

// Préposition + nom pour décrire l'élément référencé par une intersection
const prepositionElementIntersectable: Record<
  TypeElementIntersectable,
  string
> = {
  droite: 'de la droite',
  droitePointPente: 'de la droite',
  segment: 'du segment',
  trait: 'du trait',
  demiDroite: 'de la demi-droite',
  demiDroitePointDirection: 'de la demi-droite',
  demiDroiteAngle: 'de la demi-droite',
  cercle: 'du cercle',
  arc: 'de l’arc',
  parallele: 'de la parallèle',
  paralleleAObjet: 'de la parallèle',
  paralleleObjet: 'de la parallèle',
  perpendiculaireAObjet: 'de la perpendiculaire',
  perpendiculaire: 'de la perpendiculaire',
  mediatrice: 'de la médiatrice',
  bissectrice: 'de la bissectrice',
}

// Nom seul (sans article) pour les options du menu de sélection d'une étape
const nomsTypesElementsIntersectables: Record<
  TypeElementIntersectable,
  string
> = {
  droite: 'droite',
  droitePointPente: 'droite',
  segment: 'segment',
  trait: 'trait',
  demiDroite: 'demi-droite',
  demiDroitePointDirection: 'demi-droite',
  demiDroiteAngle: 'demi-droite',
  cercle: 'cercle',
  arc: 'arc',
  parallele: 'parallèle',
  paralleleAObjet: 'parallèle',
  paralleleObjet: 'parallèle',
  perpendiculaireAObjet: 'perpendiculaire',
  perpendiculaire: 'perpendiculaire',
  mediatrice: 'médiatrice',
  bissectrice: 'bissectrice',
}

type InstructionIepBase = {
  protege?: boolean
}

type InstructionIepSansOptions =
  | { type: 'point'; nom: string; x: number; y: number }
  | {
      type: 'pointADistance'
      nom: string
      p1: string
      distance: number
      angle: number
    }
  | { type: 'segment'; p1: string; p2: string }
  | { type: 'trait'; p1: string; p2: string }
  | { type: 'polygone'; sommets: string }
  | { type: 'polygoneRapide'; sommets: string }
  | { type: 'droite'; p1: string; p2: string }
  | { type: 'droitePointPente'; p1: string; pente?: number | string }
  | { type: 'demiDroite'; p1: string; p2: string }
  | { type: 'demiDroitePointDirection'; p1: string; angle?: number | string }
  | { type: 'cercle'; p1: string; p2: string }
  | { type: 'arc'; p1: string; p2: string }
  | { type: 'milieu'; nom: string; p1: string; p2: string }
  | { type: 'demiTourPoint'; nom: string; p1: string; p2: string }
  | {
      type: 'intersection'
      nom: string
      etape1: number
      etape2: number
      choix: number
    }
  | { type: 'mediatrice'; p1: string; p2: string }
  | { type: 'perpendiculaire'; p1: string; p2: string; p3: string }
  | { type: 'perpendiculaireAObjet'; etape: number; p1: string }
  | { type: 'parallele'; p1: string; p2: string; p3: string }
  | { type: 'paralleleAObjet'; etape: number; p1: string }
  | { type: 'paralleleObjet'; element: number; p1: string }
  | { type: 'prolongerObjet'; etape: number; longueur?: number }
  | { type: 'bissectrice'; p1: string; p2: string; p3: string }
  | { type: 'codageAngleDroit'; p1: string; p2: string; p3: string }
  | { type: 'demiDroiteAngle'; p1: string; p2: string; angle: number }
  | { type: 'montrerOutil'; outil: OutilIep; p1?: string }
  | { type: 'masquerOutil'; outil: OutilIep }
  | { type: 'segmentCodage'; p1: string; p2: string; codage: string }
  | { type: 'angleCodage'; p1: string; p2: string; p3: string; codage: string }
  | { type: 'regleMontrerGraduations' }
  | { type: 'regleMasquerGraduations' }
  | { type: 'regleModifierLongueur'; longueur: number }
  | { type: 'texte'; texte: string; x: number; y: number }
  | { type: 'pause'; secondes: number }
  | { type: 'attente'; secondes: number }
  | { type: 'codageMilieu'; p1: string; p2: string; p3: string; codage: string }

export type InstructionIep = InstructionIepSansOptions & InstructionIepBase

export type EditeurIepOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  conditionsInitiales?: InstructionIep[]
  programmeInitial?: InstructionIep[]
  instructionsDisponibles?: InstructionsDisponiblesIep
  instructionsInitialesProtegees?: number[]
  programmeInitialProtege?: boolean
  loadSaveButtons?: boolean
  allowFullscreen?: boolean
  interactivityOn?: boolean
  verifyCallbackName?: string
  verifyCallback?: ElementIepVerificationCallback
}

export type TypeInstructionIep = InstructionIep['type']

export type InstructionsDisponiblesIep = TypeInstructionIep[]

export type ElementIepVerificationResult = {
  isOk: boolean
  feedback?: string
  score?: { nbBonnesReponses: number; nbReponses: number }
}

export type ElementIepVerificationContext = {
  exercice: IExercice
  questionIndex: number
  editor: ElementIepEditeur
  studentProgram: InstructionIep[]
  expectedRaw: unknown
}

export type ElementIepVerificationCallback = (
  context: ElementIepVerificationContext,
) => ElementIepVerificationResult

type ChampSpec = {
  cle: string
  genre:
    | 'nom'
    | 'point'
    | 'pointOptionnel'
    | 'outil'
    | 'nombre'
    | 'texte'
    | 'etape'
    | 'objetDirection'
    | 'choix'
    | 'codageSegment'
    | 'codageAngle'
  label: string
  defaut?: number | string
  optionnel?: boolean
}

// Symboles de codage disponibles pour un segment (marque de longueur égale)
const optionsCodageSegment: string[] = ['/', '//', '///', 'X', 'O']

// Symboles de codage disponibles pour un angle (voir Alea2iep.angleCodage)
const optionsCodageAngle: string[] = [
  'simple',
  '/',
  '//',
  '///',
  'O',
  'double',
  'double/',
  'double//',
  'double///',
  'doubleO',
  'triple',
  'triple/',
  'triple//',
  'triple///',
  'tripleO',
  'plein',
  'plein/',
  'plein//',
  'plein///',
  'pleinO',
]

const longueurObjetDirectionEditeurIep = 12
const longueurProlongementObjetEditeurIep = 12

const catalogue: Record<
  TypeInstructionIep,
  { label: string; champs: ChampSpec[] }
> = {
  point: {
    label: 'Placer un point (coordonnées)',
    champs: [
      { cle: 'nom', genre: 'nom', label: 'Nom' },
      { cle: 'x', genre: 'nombre', label: 'x', defaut: 3 },
      { cle: 'y', genre: 'nombre', label: 'y', defaut: 3 },
    ],
  },
  pointADistance: {
    label: 'Placer un point à distance d’un autre',
    champs: [
      { cle: 'nom', genre: 'nom', label: 'Nom' },
      { cle: 'p1', genre: 'point', label: 'Depuis' },
      { cle: 'distance', genre: 'nombre', label: 'Distance (cm)', defaut: 5 },
      { cle: 'angle', genre: 'nombre', label: 'Angle (°)', defaut: 0 },
    ],
  },
  segment: {
    label: 'Tracer un segment à la règle',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Extrémité 1' },
      { cle: 'p2', genre: 'point', label: 'Extrémité 2' },
    ],
  },
  trait: {
    label: 'Tracer un trait',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Extrémité 1' },
      { cle: 'p2', genre: 'point', label: 'Extrémité 2' },
    ],
  },
  polygone: {
    label: 'Tracer un polygone à la règle',
    champs: [
      {
        cle: 'sommets',
        genre: 'texte',
        label: 'Sommets',
        defaut: 'A,B,C',
      },
    ],
  },
  polygoneRapide: {
    label: 'Tracer un polygone rapidement',
    champs: [
      {
        cle: 'sommets',
        genre: 'texte',
        label: 'Sommets',
        defaut: 'A,B,C',
      },
    ],
  },
  droite: {
    label: 'Tracer une droite à la règle',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point 1' },
      { cle: 'p2', genre: 'point', label: 'Point 2' },
    ],
  },
  droitePointPente: {
    label: 'Tracer une droite (point + pente)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point' },
      { cle: 'pente', genre: 'texte', label: 'Pente', optionnel: true },
    ],
  },
  demiDroite: {
    label: 'Tracer une demi-droite à la règle',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Origine' },
      { cle: 'p2', genre: 'point', label: 'Direction' },
    ],
  },
  demiDroitePointDirection: {
    label: 'Tracer une demi-droite (origine + angle)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Origine' },
      { cle: 'angle', genre: 'texte', label: 'Angle (°)', optionnel: true },
    ],
  },
  cercle: {
    label: 'Tracer un cercle au compas (centre + point)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Centre' },
      { cle: 'p2', genre: 'point', label: 'Point du cercle' },
    ],
  },
  arc: {
    label: 'Tracer un arc de cercle au compas',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Centre' },
      { cle: 'p2', genre: 'point', label: 'Point visé' },
    ],
  },
  milieu: {
    label: 'Placer le milieu d’un segment',
    champs: [
      { cle: 'nom', genre: 'nom', label: 'Nom' },
      { cle: 'p1', genre: 'point', label: 'Extrémité 1' },
      { cle: 'p2', genre: 'point', label: 'Extrémité 2' },
    ],
  },
  demiTourPoint: {
    label: 'Construire le symétrique d’un point',
    champs: [
      { cle: 'nom', genre: 'nom', label: 'Nom' },
      { cle: 'p1', genre: 'point', label: 'Point' },
      { cle: 'p2', genre: 'point', label: 'Centre' },
    ],
  },
  intersection: {
    label: 'Placer un point d’intersection',
    champs: [
      { cle: 'nom', genre: 'nom', label: 'Nom' },
      { cle: 'etape1', genre: 'etape', label: '1er élément' },
      { cle: 'etape2', genre: 'etape', label: '2e élément' },
      { cle: 'choix', genre: 'choix', label: 'Si 2 points possibles' },
    ],
  },
  mediatrice: {
    label: 'Tracer la médiatrice d’un segment au compas',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Extrémité 1' },
      { cle: 'p2', genre: 'point', label: 'Extrémité 2' },
    ],
  },
  perpendiculaire: {
    label: 'Tracer une perpendiculaire (règle + équerre)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point 1 de la droite' },
      { cle: 'p2', genre: 'point', label: 'Point 2 de la droite' },
      { cle: 'p3', genre: 'point', label: 'Passant par' },
    ],
  },
  perpendiculaireAObjet: {
    label: 'Tracer une perpendiculaire à un objet',
    champs: [
      { cle: 'etape', genre: 'objetDirection', label: 'Objet' },
      { cle: 'p1', genre: 'point', label: 'Passant par' },
    ],
  },
  parallele: {
    label: 'Tracer une parallèle (règle + équerre)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point 1 de la droite' },
      { cle: 'p2', genre: 'point', label: 'Point 2 de la droite' },
      { cle: 'p3', genre: 'point', label: 'Passant par' },
    ],
  },
  paralleleAObjet: {
    label: 'Tracer une parallèle à un objet',
    champs: [
      { cle: 'etape', genre: 'objetDirection', label: 'Objet' },
      { cle: 'p1', genre: 'point', label: 'Passant par' },
    ],
  },
  paralleleObjet: {
    label: 'Tracer une parallèle à un objet',
    champs: [
      { cle: 'element', genre: 'objetDirection', label: 'Objet' },
      { cle: 'p1', genre: 'point', label: 'Passant par' },
    ],
  },
  prolongerObjet: {
    label: 'Prolonger un objet',
    champs: [
      { cle: 'etape', genre: 'objetDirection', label: 'Objet' },
      {
        cle: 'longueur',
        genre: 'nombre',
        label: 'Longueur (cm)',
        defaut: longueurProlongementObjetEditeurIep,
      },
    ],
  },
  bissectrice: {
    label: 'Tracer la bissectrice d’un angle au compas',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point sur un côté' },
      { cle: 'p2', genre: 'point', label: 'Sommet de l’angle' },
      { cle: 'p3', genre: 'point', label: 'Point sur l’autre côté' },
    ],
  },
  codageAngleDroit: {
    label: 'Coder un angle droit',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point sur un côté' },
      { cle: 'p2', genre: 'point', label: 'Sommet de l’angle' },
      { cle: 'p3', genre: 'point', label: 'Point sur l’autre côté' },
    ],
  },
  demiDroiteAngle: {
    label: 'Tracer un angle au rapporteur (demi-droite)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Sommet' },
      { cle: 'p2', genre: 'point', label: 'Aligné avec' },
      { cle: 'angle', genre: 'nombre', label: 'Angle (°)', defaut: 60 },
    ],
  },
  montrerOutil: {
    label: 'Montrer un instrument',
    champs: [
      { cle: 'outil', genre: 'outil', label: 'Instrument' },
      { cle: 'p1', genre: 'pointOptionnel', label: 'En' },
    ],
  },
  masquerOutil: {
    label: 'Cacher un instrument',
    champs: [{ cle: 'outil', genre: 'outil', label: 'Instrument' }],
  },
  segmentCodage: {
    label: 'Coder un segment (marque de longueur)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Extrémité 1' },
      { cle: 'p2', genre: 'point', label: 'Extrémité 2' },
      { cle: 'codage', genre: 'codageSegment', label: 'Codage' },
    ],
  },
  codageMilieu: {
    label: 'Coder le milieu d’un segment',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Extrémité 1' },
      { cle: 'p2', genre: 'point', label: 'Milieu' },
      { cle: 'p3', genre: 'point', label: 'Extrémité 2' },
      { cle: 'codage', genre: 'codageSegment', label: 'Codage' },
    ],
  },
  angleCodage: {
    label: 'Coder un angle',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point sur un côté' },
      { cle: 'p2', genre: 'point', label: 'Sommet de l’angle' },
      { cle: 'p3', genre: 'point', label: 'Point sur l’autre côté' },
      { cle: 'codage', genre: 'codageAngle', label: 'Codage' },
    ],
  },
  regleMontrerGraduations: {
    label: 'Montrer les graduations de la règle',
    champs: [],
  },
  regleMasquerGraduations: {
    label: 'Masquer les graduations de la règle',
    champs: [],
  },
  regleModifierLongueur: {
    label: 'Modifier la longueur de la règle',
    champs: [
      { cle: 'longueur', genre: 'nombre', label: 'Longueur (cm)', defaut: 20 },
    ],
  },
  texte: {
    label: 'Écrire un texte',
    champs: [
      { cle: 'texte', genre: 'texte', label: 'Texte' },
      { cle: 'x', genre: 'nombre', label: 'x', defaut: 1 },
      { cle: 'y', genre: 'nombre', label: 'y', defaut: 9 },
    ],
  },
  pause: {
    label: 'Marquer une pause (clic requis pour continuer)',
    champs: [
      { cle: 'secondes', genre: 'nombre', label: 'Secondes', defaut: 2 },
    ],
  },
  attente: {
    label: 'Attendre quelques secondes (sans clic)',
    champs: [
      { cle: 'secondes', genre: 'nombre', label: 'Secondes', defaut: 2 },
    ],
  },
}

// Ordre d'affichage dans le menu déroulant
const ordreCatalogue: TypeInstructionIep[] = [
  'point',
  'pointADistance',
  'segment',
  'trait',
  'polygone',
  'polygoneRapide',
  'droite',
  'droitePointPente',
  'demiDroite',
  'demiDroitePointDirection',
  'cercle',
  'arc',
  'milieu',
  'demiTourPoint',
  'intersection',
  'mediatrice',
  'perpendiculaire',
  'perpendiculaireAObjet',
  'parallele',
  'paralleleAObjet',
  'prolongerObjet',
  'bissectrice',
  'demiDroiteAngle',
  'codageAngleDroit',
  'segmentCodage',
  'codageMilieu',
  'angleCodage',
  'regleMontrerGraduations',
  'regleMasquerGraduations',
  'regleModifierLongueur',
  'montrerOutil',
  'masquerOutil',
  'texte',
  'pause',
  'attente',
]

type CategorieInstructionIep = {
  id: string
  label: string
  types: TypeInstructionIep[]
}

const categoriesCatalogue: CategorieInstructionIep[] = [
  {
    id: 'points',
    label: 'Points',
    types: ['point', 'pointADistance', 'milieu', 'intersection'],
  },
  {
    id: 'traces-base',
    label: 'Tracés de base',
    types: [
      'segment',
      'trait',
      'polygone',
      'polygoneRapide',
      'droite',
      'droitePointPente',
      'demiDroite',
      'demiDroitePointDirection',
      'cercle',
      'arc',
      'prolongerObjet',
    ],
  },
  {
    id: 'constructions',
    label: 'Constructions',
    types: [
      'mediatrice',
      'perpendiculaire',
      'perpendiculaireAObjet',
      'parallele',
      'paralleleAObjet',
      'demiTourPoint',
      'bissectrice',
      'demiDroiteAngle',
    ],
  },
  {
    id: 'codages',
    label: 'Codages',
    types: ['codageAngleDroit', 'segmentCodage', 'codageMilieu', 'angleCodage'],
  },
  {
    id: 'outils',
    label: 'Instruments',
    types: [
      'regleMontrerGraduations',
      'regleMasquerGraduations',
      'regleModifierLongueur',
      'montrerOutil',
      'masquerOutil',
    ],
  },
  {
    id: 'animation',
    label: 'Animation',
    types: ['texte', 'pause', 'attente'],
  },
]

function formateNombre(n: number) {
  return stringNombre(n, 2)
}

function lireNombreFiniOuInfini(valeur: number | string): number {
  if (typeof valeur === 'number') return valeur
  const normalisee = valeur.trim().replace(',', '.')
  if (
    normalisee === 'Infinity' ||
    normalisee === '+Infinity' ||
    normalisee === 'inf' ||
    normalisee === '+inf'
  ) {
    return Number.POSITIVE_INFINITY
  }
  if (normalisee === '-Infinity' || normalisee === '-inf') {
    return Number.NEGATIVE_INFINITY
  }
  return Number(normalisee)
}

function valeurEstVide(
  valeur: number | string | undefined,
): valeur is undefined | '' {
  return valeur === undefined || valeur === ''
}

function angleAleatoire() {
  return Math.floor(Math.random() * 361) - 180
}

function penteAleatoire() {
  return Math.floor(Math.random() * 11) - 5
}

function lireNombreOptionnelFiniOuInfini(
  valeur: number | string | undefined,
): number | undefined {
  if (valeurEstVide(valeur)) return undefined
  return lireNombreFiniOuInfini(valeur)
}

function formatePente(pente: number | string | undefined) {
  if (valeurEstVide(pente)) return 'aléatoire'
  const valeur = lireNombreFiniOuInfini(pente)
  if (valeur === Number.POSITIVE_INFINITY) return '+∞'
  if (valeur === Number.NEGATIVE_INFINITY) return '-∞'
  return formateNombre(valeur)
}

function formateAngleOptionnel(angle: number | string | undefined) {
  if (valeurEstVide(angle)) return 'aléatoire'
  return `de ${formateNombre(lireNombreFiniOuInfini(angle))}°`
}

function lireSommetsPolygone(sommets: string): string[] {
  return sommets
    .split(/[,\s;]+/)
    .map((nom) => nom.trim())
    .filter((nom) => nom !== '')
}

/**
 * Décrit l'élément référencé par une intersection (ex. « de la droite de l'étape 1 »)
 */
function decrireElementPourIntersection(
  programme: InstructionIep[],
  etape: number,
): string {
  const instr = programme[etape]
  if (instr === undefined || !estElementIntersectable(instr)) {
    return `de l’étape ${etape + 1}`
  }
  return `${prepositionElementIntersectable[instr.type]} de l’étape ${etape + 1}`
}

function etapeObjetDirection(
  instr: Extract<
    InstructionIep,
    { type: 'paralleleAObjet' | 'paralleleObjet' }
  >,
) {
  return instr.type === 'paralleleAObjet' ? instr.etape : instr.element
}

/**
 * Description en français d'une instruction pour l'affichage du programme
 * @param {InstructionIep[]} [programme] Programme complet, nécessaire pour décrire les étapes référencées par une intersection
 */
export function decrireInstruction(
  instr: InstructionIep,
  programme: InstructionIep[] = [],
): string {
  switch (instr.type) {
    case 'point':
      return `Placer le point ${instr.nom} (${formateNombre(instr.x)} ; ${formateNombre(instr.y)}).`
    case 'pointADistance':
      return `Placer le point ${instr.nom} à ${formateNombre(instr.distance)} cm de ${instr.p1} (direction ${formateNombre(instr.angle)}°).`
    case 'segment':
      return `Tracer le segment [${instr.p1}${instr.p2}] à la règle.`
    case 'trait':
      return `Tracer le trait [${instr.p1}${instr.p2}].`
    case 'polygone':
      return `Tracer le polygone ${lireSommetsPolygone(instr.sommets).join('')} à la règle.`
    case 'polygoneRapide':
      return `Tracer le polygone ${lireSommetsPolygone(instr.sommets).join('')}.`
    case 'droite':
      return `Tracer la droite (${instr.p1}${instr.p2}) à la règle.`
    case 'droitePointPente':
      return `Tracer la droite passant par ${instr.p1} et de pente ${formatePente(instr.pente)} à la règle.`
    case 'demiDroite':
      return `Tracer la demi-droite [${instr.p1}${instr.p2}) à la règle.`
    case 'demiDroitePointDirection':
      return `Tracer la demi-droite d’origine ${instr.p1} formant un angle ${formateAngleOptionnel(instr.angle)} avec l’horizontale.`
    case 'cercle':
      return `Tracer le cercle de centre ${instr.p1} passant par ${instr.p2} au compas.`
    case 'arc':
      return `Tracer un arc de cercle de centre ${instr.p1} passant par ${instr.p2} au compas.`
    case 'milieu':
      return `Placer le milieu ${instr.nom} du segment [${instr.p1}${instr.p2}] à la règle graduée.`
    case 'demiTourPoint':
      return `Construire le symétrique ${instr.nom} du point ${instr.p1} par rapport au point ${instr.p2} et coder le milieu.`
    case 'intersection':
      return `Placer le point ${instr.nom}, intersection ${decrireElementPourIntersection(programme, instr.etape1)} et ${decrireElementPourIntersection(programme, instr.etape2)}.`
    case 'mediatrice':
      return `Tracer la médiatrice du segment [${instr.p1}${instr.p2}] au compas.`
    case 'perpendiculaire':
      return `Tracer la perpendiculaire à (${instr.p1}${instr.p2}) passant par ${instr.p3} avec la règle et l’équerre.`
    case 'perpendiculaireAObjet':
      return `Tracer la perpendiculaire ${decrireElementPourIntersection(programme, instr.etape)} passant par ${instr.p1} avec la règle et l’équerre.`
    case 'parallele':
      return `Tracer la parallèle à (${instr.p1}${instr.p2}) passant par ${instr.p3} avec la règle et l’équerre.`
    case 'paralleleAObjet':
      return `Tracer la parallèle ${decrireElementPourIntersection(programme, instr.etape)} passant par ${instr.p1} avec la règle et l’équerre.`
    case 'paralleleObjet':
      return `Tracer la parallèle ${decrireElementPourIntersection(programme, instr.element)} passant par ${instr.p1} avec la règle et l’équerre.`
    case 'prolongerObjet':
      return `Prolonger ${decrireElementPourIntersection(programme, instr.etape).replace('de', '')} à la règle (${formateNombre(instr.longueur ?? longueurProlongementObjetEditeurIep)} cm).`
    case 'bissectrice':
      return `Tracer la bissectrice de l’angle ${instr.p1}${instr.p2}${instr.p3} au compas.`
    case 'codageAngleDroit':
      return `Coder l’angle droit ${instr.p1}${instr.p2}${instr.p3}.`
    case 'demiDroiteAngle':
      return `Tracer au rapporteur la demi-droite d’origine ${instr.p1} formant un angle de ${formateNombre(instr.angle)}° avec [${instr.p1}${instr.p2}).`
    case 'montrerOutil':
      return `Montrer ${nomsOutils[instr.outil]}${instr.p1 ? ` en ${instr.p1}` : ''}.`
    case 'masquerOutil':
      return `Cacher ${nomsOutils[instr.outil]}.`
    case 'segmentCodage':
      return `Coder le segment [${instr.p1}${instr.p2}] (${instr.codage}).`
    case 'codageMilieu':
      return `Coder que ${instr.p2} est le milieu du segment [${instr.p1}${instr.p3}] (${instr.codage}).`
    case 'angleCodage':
      return `Coder l’angle ${instr.p1}${instr.p2}${instr.p3} (${instr.codage}).`
    case 'regleMontrerGraduations':
      return 'Montrer les graduations de la règle.'
    case 'regleMasquerGraduations':
      return 'Masquer les graduations de la règle.'
    case 'regleModifierLongueur':
      return `Modifier la longueur de la règle (${formateNombre(instr.longueur)} cm).`
    case 'texte':
      return `Écrire « ${instr.texte} » en (${formateNombre(instr.x)} ; ${formateNombre(instr.y)}).`
    case 'pause':
      return `Marquer une pause de ${formateNombre(instr.secondes)} s (clic requis pour continuer).`
    case 'attente':
      return `Attendre ${formateNombre(instr.secondes)} s (reprise automatique, sans clic).`
  }
}

/**
 * Renvoie la liste des noms de points définis par le programme
 */
export function pointsDefinis(programme: InstructionIep[]): string[] {
  const noms: string[] = []
  for (const instr of programme) {
    if (
      (instr.type === 'point' ||
        instr.type === 'pointADistance' ||
        instr.type === 'milieu' ||
        instr.type === 'intersection') &&
      instr.nom !== '' &&
      !noms.includes(instr.nom)
    ) {
      noms.push(instr.nom)
    }
  }
  return noms
}

/**
 * Indique si l'instruction trace un élément (droite, segment, demi-droite, cercle ou arc)
 * pouvant servir de support à une intersection
 */
function estElementIntersectable(
  instr: InstructionIep | undefined,
): instr is Extract<InstructionIep, { type: TypeElementIntersectable }> {
  return (
    instr !== undefined &&
    (typesElementsIntersectables as string[]).includes(instr.type)
  )
}

function estElementDirection(
  instr: InstructionIep | undefined,
): instr is Extract<InstructionIep, { type: TypeElementDirection }> {
  return (
    instr !== undefined &&
    (typesElementsDirection as string[]).includes(instr.type)
  )
}

/**
 * Renvoie la liste des étapes du programme utilisables comme support d'intersection
 */
function elementsIntersectablesDefinis(
  programme: InstructionIep[],
): { index: number; type: TypeElementIntersectable }[] {
  const elements: { index: number; type: TypeElementIntersectable }[] = []
  programme.forEach((instr, index) => {
    if (estElementIntersectable(instr)) {
      elements.push({ index, type: instr.type })
    }
  })
  return elements
}

function elementsDirectionDefinis(
  programme: InstructionIep[],
): { index: number; type: TypeElementDirection }[] {
  const elements: { index: number; type: TypeElementDirection }[] = []
  programme.forEach((instr, index) => {
    if (estElementDirection(instr)) {
      elements.push({ index, type: instr.type })
    }
  })
  return elements
}

function intersectionPeutAvoirDeuxPoints(
  programme: InstructionIep[],
  etape1: number,
  etape2: number,
) {
  const element1 = programme[etape1]
  const element2 = programme[etape2]
  return (
    estElementIntersectable(element1) &&
    estElementIntersectable(element2) &&
    (element1.type === 'cercle' ||
      element1.type === 'arc' ||
      element2.type === 'cercle' ||
      element2.type === 'arc')
  )
}

function pointDepuisPente(
  A: PointAbstrait,
  pente: number | string | undefined,
) {
  const valeur = lireNombreOptionnelFiniOuInfini(pente)
  if (valeur === undefined) return undefined
  if (Number.isNaN(valeur)) return undefined
  if (Number.isFinite(valeur)) return pointAbstrait(A.x + 1, A.y + valeur)
  return pointAbstrait(A.x, A.y + (valeur > 0 ? 1 : -1))
}

function pointDepuisAngle(
  A: PointAbstrait,
  angle: number | string | undefined,
) {
  const valeur = lireNombreOptionnelFiniOuInfini(angle)
  if (valeur === undefined || Number.isNaN(valeur)) return undefined
  return pointAdistance(A, 1, valeur)
}

function deuxPointsSurDroitePourAnimation(
  d: ReturnType<typeof droite>,
  longueurTrace = longueurObjetDirectionEditeurIep,
) {
  const centre = pointSurDroite(d, 0)
  const normeDirecteur = Math.hypot(d.directeur.x, d.directeur.y)
  const coefficient =
    normeDirecteur === 0 ? 1 : longueurTrace / 2 / normeDirecteur
  return [
    pointAbstrait(
      centre.x - d.directeur.x * coefficient,
      centre.y - d.directeur.y * coefficient,
    ),
    pointAbstrait(
      centre.x + d.directeur.x * coefficient,
      centre.y + d.directeur.y * coefficient,
    ),
  ] as const
}

function deuxPointsProlongementCentre(
  A: PointAbstrait,
  B: PointAbstrait,
  longueurTrace: number,
) {
  const longueurAB = longueur(A, B)
  if (longueurAB === 0) return [A, B] as const
  const centre = milieu(A, B)
  const demiLongueur = Math.abs(longueurTrace) / 2
  return [
    pointSurSegment(centre, A, demiLongueur),
    pointSurSegment(centre, B, demiLongueur),
  ] as const
}

function segmentTraceParallele(
  A: PointAbstrait,
  B: PointAbstrait,
  C: PointAbstrait,
) {
  const d = droite(A, B)
  const H = projectionOrtho(C, d)
  const prodScal = (B.x - A.x) * (C.x - A.x) + (B.y - A.y) * (C.y - A.y)
  const H1 = prodScal < 0 ? B : A
  const H2 = pointAbstrait(H1.x + C.x - H.x, H1.y + C.y - H.y)
  return [H2, C] as const
}

function segmentVisibleObjetDirection(
  instr: InstructionIep | undefined,
  points: Map<string, PointAbstrait>,
  programme: InstructionIep[],
): readonly [PointAbstrait, PointAbstrait] | undefined {
  if (instr === undefined || !estElementDirection(instr)) return undefined
  if (instr.type === 'segment' || instr.type === 'trait') {
    const A = points.get(instr.p1)
    const B = points.get(instr.p2)
    if (A === undefined || B === undefined) return undefined
    return [A, B] as const
  }
  if (
    instr.type === 'demiDroite' ||
    instr.type === 'demiDroitePointDirection'
  ) {
    const O = points.get(instr.p1)
    if (O === undefined) return undefined
    const direction =
      instr.type === 'demiDroite'
        ? points.get(instr.p2)
        : pointDepuisAngle(O, instr.angle)
    if (direction === undefined) return undefined
    return [
      O,
      pointSurSegment(O, direction, longueurObjetDirectionEditeurIep),
    ] as const
  }
  if (instr.type === 'parallele') {
    const A = points.get(instr.p1)
    const B = points.get(instr.p2)
    const C = points.get(instr.p3)
    if (A === undefined || B === undefined || C === undefined) return undefined
    return segmentTraceParallele(A, B, C)
  }
  if (instr.type === 'paralleleAObjet' || instr.type === 'paralleleObjet') {
    const C = points.get(instr.p1)
    const base = elementGeometrique(
      programme[etapeObjetDirection(instr)],
      points,
      programme,
    )
    if (C === undefined || base?.nature !== 'droite') return undefined
    const [A, B] = deuxPointsSurDroitePourAnimation(base.objet)
    return segmentTraceParallele(A, B, C)
  }
  const element = elementGeometrique(instr, points, programme)
  if (element?.nature !== 'droite') return undefined
  return deuxPointsSurDroitePourAnimation(element.objet)
}

function tracerProlongementObjet(
  anim: Alea2iep,
  instr: InstructionIep | undefined,
  points: Map<string, PointAbstrait>,
  programme: InstructionIep[],
  longueurTrace: number,
) {
  const segmentVisible = segmentVisibleObjetDirection(instr, points, programme)
  if (segmentVisible === undefined) return false
  const [P, Q] = deuxPointsProlongementCentre(
    segmentVisible[0],
    segmentVisible[1],
    longueurTrace,
  )
  anim.regleSegment(P, Q, { longueur: Math.abs(longueurTrace) })
  return true
}

/**
 * Indique si l'instruction à l'index donné a toutes ses dépendances
 * (points ou étapes référencés) satisfaites par des étapes qui la précèdent
 */
function instructionEstValide(
  programme: InstructionIep[],
  index: number,
): boolean {
  const instr = programme[index]
  if (instr.type === 'intersection') {
    return (
      instr.etape1 < index &&
      instr.etape2 < index &&
      estElementIntersectable(programme[instr.etape1]) &&
      estElementIntersectable(programme[instr.etape2])
    )
  }
  if (instr.type === 'paralleleAObjet' || instr.type === 'paralleleObjet') {
    const etape = etapeObjetDirection(instr)
    if (etape >= index || !estElementDirection(programme[etape])) {
      return false
    }
  }
  if (instr.type === 'prolongerObjet') {
    if (instr.etape >= index || !estElementDirection(programme[instr.etape])) {
      return false
    }
  }
  if (instr.type === 'perpendiculaireAObjet') {
    if (instr.etape >= index || !estElementDirection(programme[instr.etape])) {
      return false
    }
  }
  const nomsConnus = new Set<string>()
  for (let i = 0; i < index; i++) {
    const precedente = programme[i]
    if (
      precedente.type === 'point' ||
      precedente.type === 'pointADistance' ||
      precedente.type === 'milieu' ||
      precedente.type === 'demiTourPoint' ||
      precedente.type === 'intersection'
    ) {
      nomsConnus.add(precedente.nom)
    }
  }
  const references: string[] = []
  if (instr.type === 'polygone' || instr.type === 'polygoneRapide') {
    const sommets = lireSommetsPolygone(instr.sommets)
    if (sommets.length < 3) return false
    references.push(...sommets)
  }
  for (const cle of ['p1', 'p2', 'p3'] as const) {
    if (cle in instr) {
      references.push((instr as unknown as Record<string, string>)[cle])
    }
  }
  return references.every((nom) => nomsConnus.has(nom))
}

/**
 * Indique si on peut échanger les étapes i et j du programme sans casser
 * une référence : ni leur propre validité, ni une intersection ailleurs dans
 * le programme qui viserait l'une de ces deux étapes par son numéro.
 */
function peutEchangerEtapes(
  programme: InstructionIep[],
  i: number,
  j: number,
): boolean {
  if (j < 0 || j >= programme.length) return false
  const viseUneEtapeEchangee = programme.some(
    (instr) =>
      instr.type === 'intersection' &&
      (instr.etape1 === i ||
        instr.etape1 === j ||
        instr.etape2 === i ||
        instr.etape2 === j),
  )
  if (viseUneEtapeEchangee) return false
  const copie = [...programme]
  ;[copie[i], copie[j]] = [copie[j], copie[i]]
  return instructionEstValide(copie, i) && instructionEstValide(copie, j)
}

type ElementGeometrique =
  | { nature: 'droite'; objet: ReturnType<typeof droite> }
  | { nature: 'cercle'; objet: ReturnType<typeof cercle> }

/**
 * Reconstruit la droite ou le cercle abstrait tracé par une étape du programme,
 * à partir des points déjà placés. Renvoie undefined si l'étape n'est pas
 * intersectable ou si l'un de ses points n'est pas encore défini.
 */
function elementGeometrique(
  instr: InstructionIep | undefined,
  points: Map<string, PointAbstrait>,
  programme: InstructionIep[] = [],
): ElementGeometrique | undefined {
  if (!estElementIntersectable(instr)) return undefined
  if (instr.type === 'parallele') {
    const A = points.get(instr.p1)
    const B = points.get(instr.p2)
    const C = points.get(instr.p3)
    if (A === undefined || B === undefined || C === undefined) return undefined
    const pointDirection = pointAbstrait(C.x + B.x - A.x, C.y + B.y - A.y)
    const d = droite(C, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'paralleleAObjet' || instr.type === 'paralleleObjet') {
    const base = elementGeometrique(
      programme[etapeObjetDirection(instr)],
      points,
      programme,
    )
    const A = points.get(instr.p1)
    if (base?.nature !== 'droite' || A === undefined) return undefined
    const pointDirection = pointAbstrait(
      A.x + base.objet.directeur.x,
      A.y + base.objet.directeur.y,
    )
    const d = droite(A, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'perpendiculaireAObjet') {
    const base = elementGeometrique(programme[instr.etape], points, programme)
    const A = points.get(instr.p1)
    if (base?.nature !== 'droite' || A === undefined) return undefined
    const pointDirection = pointAbstrait(
      A.x - base.objet.directeur.y,
      A.y + base.objet.directeur.x,
    )
    const d = droite(A, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'perpendiculaire') {
    const A = points.get(instr.p1)
    const B = points.get(instr.p2)
    const C = points.get(instr.p3)
    if (A === undefined || B === undefined || C === undefined) {
      return undefined
    }
    const pointDirection = pointAbstrait(C.x - (B.y - A.y), C.y + B.x - A.x)
    const d = droite(C, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'mediatrice') {
    const A = points.get(instr.p1)
    const B = points.get(instr.p2)
    if (A === undefined || B === undefined) return undefined
    const M = milieu(A, B)
    const pointDirection = pointAbstrait(M.x - (B.y - A.y), M.y + B.x - A.x)
    const d = droite(M, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'bissectrice') {
    const A = points.get(instr.p1)
    const B = points.get(instr.p2)
    const C = points.get(instr.p3)
    if (A === undefined || B === undefined || C === undefined) {
      return undefined
    }
    const longueurBA = longueur(B, A)
    const longueurBC = longueur(B, C)
    if (longueurBA === 0 || longueurBC === 0) return undefined
    const pointDirection = pointAbstrait(
      B.x + (A.x - B.x) / longueurBA + (C.x - B.x) / longueurBC,
      B.y + (A.y - B.y) / longueurBA + (C.y - B.y) / longueurBC,
    )
    if (pointDirection.x === B.x && pointDirection.y === B.y) {
      return undefined
    }
    const d = droite(B, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  const A = points.get(instr.p1)
  if (A === undefined) return undefined
  if (instr.type === 'droitePointPente') {
    const B = pointDepuisPente(A, instr.pente)
    if (B === undefined) return undefined
    const d = droite(A, B)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'demiDroitePointDirection') {
    const B = pointDepuisAngle(A, instr.angle)
    if (B === undefined) return undefined
    const d = droite(A, B)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  if (instr.type === 'demiDroiteAngle') {
    const B = points.get(instr.p2)
    if (B === undefined) return undefined
    const pointDirection = rotation(B, A, instr.angle)
    const d = droite(A, pointDirection)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  const B = points.get(instr.p2)
  if (B === undefined) return undefined
  if (
    instr.type === 'droite' ||
    instr.type === 'segment' ||
    instr.type === 'trait' ||
    instr.type === 'demiDroite'
  ) {
    const d = droite(A, B)
    d.isVisible = false
    return { nature: 'droite', objet: d }
  }
  const c = cercle(A, longueur(A, B))
  c.isVisible = false
  return { nature: 'cercle', objet: c }
}

type OptionsLectureProgrammeIep = {
  nombreInstructionsImmediates?: number
  rangerInstruments?: boolean
  instrumentsRequis?: OutilIep[]
  positionsRangement?: Partial<Record<OutilIep, PointAbstrait>>
}

const outilsIep: OutilIep[] = [
  'regle',
  'crayon',
  'equerre',
  'requerre',
  'compas',
  'rapporteur',
]

function outilsRequisParInstruction(instr: InstructionIep): OutilIep[] {
  switch (instr.type) {
    case 'point':
    case 'pointADistance':
    case 'intersection':
    case 'texte':
    case 'segmentCodage':
    case 'codageMilieu':
    case 'angleCodage':
    case 'codageAngleDroit':
    case 'trait':
      return ['crayon']
    case 'segment':
    case 'droite':
    case 'droitePointPente':
    case 'demiDroite':
    case 'demiDroitePointDirection':
    case 'polygone':
    case 'polygoneRapide':
    case 'prolongerObjet':
    case 'milieu':
      return ['regle', 'crayon']
    case 'demiTourPoint':
      return ['compas', 'regle', 'crayon']
    case 'cercle':
    case 'arc':
    case 'mediatrice':
    case 'bissectrice':
      return ['compas', 'regle', 'crayon']
    case 'perpendiculaire':
    case 'perpendiculaireAObjet':
    case 'parallele':
    case 'paralleleAObjet':
    case 'paralleleObjet':
      return ['regle', 'equerre', 'crayon', 'requerre']
    case 'demiDroiteAngle':
      return ['rapporteur', 'regle', 'crayon']
    case 'montrerOutil':
    case 'masquerOutil':
      return [instr.outil]
    case 'regleMontrerGraduations':
    case 'regleMasquerGraduations':
    case 'regleModifierLongueur':
      return ['regle']
    case 'pause':
    case 'attente':
      return []
  }
  return []
}

function outilsRequisParProgramme(programme: InstructionIep[]): OutilIep[] {
  return outilsIep.filter((outil) =>
    programme.some((instruction) =>
      outilsRequisParInstruction(instruction).includes(outil),
    ),
  )
}

function positionsRangementInstruments(
  anim: Alea2iep,
  largeur: number,
): Partial<Record<OutilIep, PointAbstrait>> {
  const xDroite = largeur / 30 - anim.translationX
  const yHaut = anim.translationY
  return {
    regle: pointAbstrait(xDroite - 7.8, yHaut - 0.8),
    equerre: pointAbstrait(xDroite - 4.2, yHaut - 1.1),
    requerre: pointAbstrait(xDroite - 4.2, yHaut - 1.1),
    rapporteur: pointAbstrait(xDroite - 1.7, yHaut - 1.15),
    compas: pointAbstrait(xDroite - 2.6, yHaut - 2.65),
    crayon: pointAbstrait(xDroite - 6.9, yHaut - 2.25),
  }
}

/**
 * Joue le programme sur une instance d'Alea2iep.
 * Renvoie la liste des indices des étapes ignorées (points non définis).
 */
function jouerProgramme(
  anim: Alea2iep,
  programme: InstructionIep[],
  optionsLecture: OptionsLectureProgrammeIep = {},
): number[] {
  const {
    nombreInstructionsImmediates = 0,
    rangerInstruments = false,
    instrumentsRequis = [],
    positionsRangement = {},
  } = optionsLecture
  const points = new Map<string, PointAbstrait>()
  const etapesIgnorees: number[] = []
  if (rangerInstruments) {
    for (const outil of instrumentsRequis) {
      const position = positionsRangement[outil]
      if (position === undefined) continue
      anim.montrer(outil, position, { tempo: 0 })
    }
  } else if (outilsRequisParProgramme(programme).includes('regle')) {
    anim.regleMontrer(undefined, {
      tempo: outilsRequisParProgramme(
        programme.slice(0, nombreInstructionsImmediates),
      ).includes('regle')
        ? 0
        : undefined,
    })
  }
  programme.forEach((instr, index) => {
    const tempoAvantInstruction = anim.tempo
    if (index < nombreInstructionsImmediates) anim.tempo = 0
    // Récupère les points référencés par l'instruction, undefined si l'un manque
    const recupere = (...noms: string[]): PointAbstrait[] | undefined => {
      const resultat: PointAbstrait[] = []
      for (const nom of noms) {
        const point = points.get(nom)
        if (point === undefined) return undefined
        resultat.push(point)
      }
      return resultat
    }
    const jouerInstruction = () => {
      const optionsInstrument = rangerInstruments
        ? { positionsRangementInstruments: positionsRangement }
        : {}
      switch (instr.type) {
        case 'point': {
          const A = pointAbstrait(instr.x, instr.y, instr.nom)
          anim.pointCreer(A, { label: instr.nom })
          points.set(instr.nom, A)
          break
        }
        case 'pointADistance': {
          const origine = recupere(instr.p1)
          if (origine === undefined) {
            etapesIgnorees.push(index)
            break
          }
          const A = pointAdistance(
            origine[0],
            instr.distance,
            instr.angle,
            instr.nom,
          )
          anim.pointCreer(A, { label: instr.nom })
          points.set(instr.nom, A)
          break
        }
        case 'segment': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.regleSegment(pts[0], pts[1])
          break
        }
        case 'trait': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.traitRapide(pts[0], pts[1])
          break
        }
        case 'polygone': {
          const pts = recupere(...lireSommetsPolygone(instr.sommets))
          if (pts === undefined || pts.length < 3) {
            etapesIgnorees.push(index)
            break
          }
          anim.polygoneTracer(...pts)
          break
        }
        case 'polygoneRapide': {
          const pts = recupere(...lireSommetsPolygone(instr.sommets))
          if (pts === undefined || pts.length < 3) {
            etapesIgnorees.push(index)
            break
          }
          anim.polygoneRapide(...pts)
          break
        }
        case 'droite': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.regleDroite(pts[0], pts[1], {
            longueur: longueurObjetDirectionEditeurIep,
          })
          break
        }
        case 'droitePointPente': {
          const pts = recupere(instr.p1)
          const pente =
            lireNombreOptionnelFiniOuInfini(instr.pente) ?? penteAleatoire()
          if (pts === undefined || Number.isNaN(pente)) {
            etapesIgnorees.push(index)
            break
          }
          anim.regleDroite(pts[0], pente, {
            longueur: longueurObjetDirectionEditeurIep,
          })
          break
        }
        case 'demiDroite': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.regleDemiDroite(pts[0], pts[1], {
            longueur: longueurObjetDirectionEditeurIep,
          })
          break
        }
        case 'demiDroitePointDirection': {
          const pts = recupere(instr.p1)
          const angle =
            lireNombreOptionnelFiniOuInfini(instr.angle) ?? angleAleatoire()
          if (pts === undefined || Number.isNaN(angle)) {
            etapesIgnorees.push(index)
            break
          }
          anim.regleDemiDroite(pts[0], angle, {
            longueur: longueurObjetDirectionEditeurIep,
          })
          break
        }
        case 'cercle': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.compasCercleCentrePoint(pts[0], pts[1])
          break
        }
        case 'arc': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.compasTracerArcCentrePoint(pts[0], pts[1])
          break
        }
        case 'milieu': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.milieuALaRegle(pts[0], pts[1], instr.nom)
          const M = milieu(pts[0], pts[1], instr.nom)
          points.set(instr.nom, M)
          break
        }
        case 'demiTourPoint': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.demiTourPoint(pts[0], pts[1], instr.nom)
          points.set(instr.nom, rotation(pts[0], pts[1], 180, instr.nom))
          break
        }
        case 'intersection': {
          const element1 = elementGeometrique(
            programme[instr.etape1],
            points,
            programme,
          )
          const element2 = elementGeometrique(
            programme[instr.etape2],
            points,
            programme,
          )
          if (element1 === undefined || element2 === undefined) {
            etapesIgnorees.push(index)
            break
          }
          let A: PointAbstrait
          if (element1.nature === 'droite' && element2.nature === 'droite') {
            A = pointIntersectionDD(element1.objet, element2.objet, instr.nom)
          } else if (
            element1.nature === 'cercle' &&
            element2.nature === 'cercle'
          ) {
            A = pointIntersectionCC(
              element1.objet,
              element2.objet,
              instr.nom,
              instr.choix,
            )
          } else if (
            element1.nature === 'droite' &&
            element2.nature === 'cercle'
          ) {
            A = pointIntersectionLC(
              element1.objet,
              element2.objet,
              instr.nom,
              instr.choix,
            )
          } else if (
            element1.nature === 'cercle' &&
            element2.nature === 'droite'
          ) {
            A = pointIntersectionLC(
              element2.objet,
              element1.objet,
              instr.nom,
              instr.choix,
            )
          } else {
            etapesIgnorees.push(index)
            break
          }
          anim.pointCreer(A, { label: instr.nom })
          points.set(instr.nom, A)
          break
        }
        case 'mediatrice': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.mediatriceAuCompas(pts[0], pts[1])
          break
        }
        case 'perpendiculaire': {
          const pts = recupere(instr.p1, instr.p2, instr.p3)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.perpendiculaireRegleEquerre2points3epoint(
            pts[0],
            pts[1],
            pts[2],
            optionsInstrument,
          )
          break
        }
        case 'perpendiculaireAObjet': {
          const pts = recupere(instr.p1)
          const element = elementGeometrique(
            programme[instr.etape],
            points,
            programme,
          )
          if (pts === undefined || element?.nature !== 'droite') {
            etapesIgnorees.push(index)
            break
          }
          anim.perpendiculaireRegleEquerreDroitePoint(
            element.objet,
            pts[0],
            optionsInstrument,
          )
          break
        }
        case 'parallele': {
          const pts = recupere(instr.p1, instr.p2, instr.p3)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.paralleleRegleEquerre2points3epoint(pts[0], pts[1], pts[2])
          break
        }
        case 'paralleleAObjet': {
          const pts = recupere(instr.p1)
          const element = elementGeometrique(
            programme[instr.etape],
            points,
            programme,
          )
          if (pts === undefined || element?.nature !== 'droite') {
            etapesIgnorees.push(index)
            break
          }
          const [A, B] = deuxPointsSurDroitePourAnimation(element.objet)
          anim.paralleleRegleEquerre2points3epoint(A, B, pts[0])
          break
        }
        case 'paralleleObjet': {
          const pts = recupere(instr.p1)
          const element = elementGeometrique(
            programme[instr.element],
            points,
            programme,
          )
          if (pts === undefined || element?.nature !== 'droite') {
            etapesIgnorees.push(index)
            break
          }
          const [A, B] = deuxPointsSurDroitePourAnimation(element.objet)
          anim.paralleleRegleEquerre2points3epoint(A, B, pts[0])
          break
        }
        case 'prolongerObjet': {
          const longueurTrace =
            instr.longueur ?? longueurProlongementObjetEditeurIep
          const ok = tracerProlongementObjet(
            anim,
            programme[instr.etape],
            points,
            programme,
            longueurTrace,
          )
          if (!ok) etapesIgnorees.push(index)
          break
        }
        case 'bissectrice': {
          const pts = recupere(instr.p1, instr.p2, instr.p3)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.bissectriceAuCompas(pts[0], pts[1], pts[2])
          break
        }
        case 'codageAngleDroit': {
          const pts = recupere(instr.p1, instr.p2, instr.p3)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.codageAngleDroit(pts[0], pts[1], pts[2])
          break
        }
        case 'demiDroiteAngle': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.rapporteurTracerDemiDroiteAngle(pts[0], pts[1], instr.angle)
          break
        }
        case 'montrerOutil': {
          if (instr.p1 !== undefined) {
            const pts = recupere(instr.p1)
            if (pts === undefined) {
              etapesIgnorees.push(index)
              break
            }
            anim.montrer(instr.outil, pts[0])
          } else {
            anim.montrer(instr.outil, anim[instr.outil].position)
          }
          break
        }
        case 'masquerOutil': {
          anim.masquer(instr.outil)
          break
        }
        case 'segmentCodage': {
          const pts = recupere(instr.p1, instr.p2)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.segmentCodage(pts[0], pts[1], { codage: instr.codage })
          break
        }
        case 'codageMilieu': {
          const pts = recupere(instr.p1, instr.p2, instr.p3)
          if (pts === undefined || longueur(pts[0], pts[2]) === 0) {
            etapesIgnorees.push(index)
            break
          }
          anim.segmentCodage(pts[0], pts[1], { codage: instr.codage })
          anim.segmentCodage(pts[1], pts[2], { codage: instr.codage })
          break
        }
        case 'angleCodage': {
          const pts = recupere(instr.p1, instr.p2, instr.p3)
          if (pts === undefined) {
            etapesIgnorees.push(index)
            break
          }
          anim.angleCodage(pts[0], pts[1], pts[2], { codage: instr.codage })
          break
        }
        case 'regleMontrerGraduations': {
          anim.regleMontrerGraduations()
          break
        }
        case 'regleMasquerGraduations': {
          anim.regleMasquerGraduations()
          break
        }
        case 'regleModifierLongueur': {
          anim.regleModifierLongueur(instr.longueur)
          break
        }
        case 'texte': {
          anim.textePosition(instr.texte, instr.x, instr.y)
          break
        }
        case 'pause': {
          anim.pause({ tempo: instr.secondes * 10 })
          break
        }
        case 'attente': {
          // Instrumenpoche n'a pas d'action d'attente pure : on rejoue un zoom
          // à 100% (valeur déjà en place, donc sans effet visuel) pour ne
          // profiter que de son tempo, qui retarde l'étape suivante sans clic.
          anim.compasZoom(100, { tempo: instr.secondes * 10 })
          break
        }
      }
    }
    if (rangerInstruments) {
      anim.preserverVisibiliteInstruments(jouerInstruction, { tempo: 0 })
      anim.rangerInstruments(positionsRangement, instrumentsRequis, {
        tempo: 0,
        vitesse: 20,
      })
    } else {
      jouerInstruction()
    }
    anim.tempo = tempoAvantInstruction
  })
  if (!rangerInstruments) {
    anim.regleMasquer()
    anim.equerreMasquer()
    anim.requerreMasquer()
    anim.rapporteurMasquer()
    anim.compasMasquer()
    anim.crayonMasquer()
  }
  return etapesIgnorees
}

/**
 * Construit l'animation complète : une première passe sert à calculer
 * les bornes de la figure pour cadrer la seconde (viewBox + recadrage).
 */
export function construireAnimation(
  programme: InstructionIep[],
  nombreInstructionsImmediates = 0,
  options: { rangerInstruments?: boolean } = {},
): Alea2iep {
  const programmeResolue = resoudreDirectionsAleatoires(programme)
  const brouillon = new Alea2iep()
  jouerProgramme(brouillon, programmeResolue, {
    nombreInstructionsImmediates,
  })
  const anim = new Alea2iep()
  const largeur = Math.max(600, (brouillon.xMax - brouillon.xMin + 6) * 30)
  const hauteur = Math.max(400, (brouillon.yMax - brouillon.yMin + 6) * 30)
  anim.taille(largeur, hauteur)
  anim.recadre(brouillon.xMin - 3, brouillon.yMax)
  const instrumentsRequis = options.rangerInstruments
    ? outilsRequisParProgramme(programmeResolue)
    : []
  jouerProgramme(anim, programmeResolue, {
    nombreInstructionsImmediates,
    rangerInstruments: options.rangerInstruments,
    instrumentsRequis,
    positionsRangement: positionsRangementInstruments(anim, largeur),
  })
  return anim
}

function resoudreDirectionsAleatoires(programme: InstructionIep[]) {
  return programme.map((instr): InstructionIep => {
    if (instr.type === 'droitePointPente' && valeurEstVide(instr.pente)) {
      return { ...instr, pente: penteAleatoire() }
    }
    if (
      instr.type === 'demiDroitePointDirection' &&
      valeurEstVide(instr.angle)
    ) {
      return { ...instr, angle: angleAleatoire() }
    }
    return instr
  })
}

export function pointsConstruitsDepuisProgramme(
  programme: InstructionIep[],
): Map<string, PointAbstrait> {
  programme = resoudreDirectionsAleatoires(programme)
  const points = new Map<string, PointAbstrait>()
  programme.forEach((instr) => {
    const recupere = (...noms: string[]): PointAbstrait[] | undefined => {
      const resultat: PointAbstrait[] = []
      for (const nom of noms) {
        const point = points.get(nom)
        if (point === undefined) return undefined
        resultat.push(point)
      }
      return resultat
    }
    switch (instr.type) {
      case 'point': {
        points.set(instr.nom, pointAbstrait(instr.x, instr.y, instr.nom))
        break
      }
      case 'pointADistance': {
        const origine = recupere(instr.p1)
        if (origine === undefined) break
        points.set(
          instr.nom,
          pointAdistance(origine[0], instr.distance, instr.angle, instr.nom),
        )
        break
      }
      case 'milieu': {
        const pts = recupere(instr.p1, instr.p2)
        if (pts === undefined) break
        points.set(instr.nom, milieu(pts[0], pts[1], instr.nom))
        break
      }
      case 'demiTourPoint': {
        const pts = recupere(instr.p1, instr.p2)
        if (pts === undefined) break
        points.set(instr.nom, rotation(pts[0], pts[1], 180, instr.nom))
        break
      }
      case 'intersection': {
        const element1 = elementGeometrique(
          programme[instr.etape1],
          points,
          programme,
        )
        const element2 = elementGeometrique(
          programme[instr.etape2],
          points,
          programme,
        )
        if (element1 === undefined || element2 === undefined) break
        let point: PointAbstrait | undefined
        if (element1.nature === 'droite' && element2.nature === 'droite') {
          point = pointIntersectionDD(element1.objet, element2.objet, instr.nom)
        } else if (
          element1.nature === 'cercle' &&
          element2.nature === 'cercle'
        ) {
          point = pointIntersectionCC(
            element1.objet,
            element2.objet,
            instr.nom,
            instr.choix,
          )
        } else if (
          element1.nature === 'droite' &&
          element2.nature === 'cercle'
        ) {
          point = pointIntersectionLC(
            element1.objet,
            element2.objet,
            instr.nom,
            instr.choix,
          )
        } else if (
          element1.nature === 'cercle' &&
          element2.nature === 'droite'
        ) {
          point = pointIntersectionLC(
            element2.objet,
            element1.objet,
            instr.nom,
            instr.choix,
          )
        }
        if (point !== undefined) points.set(instr.nom, point)
        break
      }
    }
  })
  return points
}

type ProgrammeSauvegardeIep = {
  programme: InstructionIep[]
  conditionsInitialesAttribut: string
  programmeInitialAttribut: string
}

// Les programmes sont conservés ici pour survivre aux re-rendus de l'exercice
const programmesParId = new Map<string, ProgrammeSauvegardeIep>()

function clonerProgramme(programme: InstructionIep[]): InstructionIep[] {
  return structuredClone(programme)
}

function normaliserProgramme(programmeRaw: unknown): string {
  let programme: unknown = programmeRaw
  if (typeof programmeRaw === 'string') {
    try {
      programme = JSON.parse(programmeRaw)
    } catch {
      return ''
    }
  }
  if (!Array.isArray(programme)) return ''
  return JSON.stringify(
    programme.map((instruction) => {
      if (instruction == null || typeof instruction !== 'object') {
        return instruction
      }
      const entries = Object.entries(instruction)
        .filter(([key]) => key !== 'protege')
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      return Object.fromEntries(entries)
    }),
  )
}

function lireProgrammeDepuisAttribut(valeur: string | null): InstructionIep[] {
  if (valeur === null || valeur === '') return []
  try {
    const programme = JSON.parse(valeur)
    return Array.isArray(programme) ? (programme as InstructionIep[]) : []
  } catch {
    return []
  }
}

function lireIndicesDepuisAttribut(valeur: string | null): number[] {
  if (valeur === null || valeur === '') return []
  try {
    const indices = JSON.parse(valeur)
    return Array.isArray(indices)
      ? indices.filter(
          (index): index is number => Number.isInteger(index) && index >= 0,
        )
      : []
  } catch {
    return []
  }
}

function lireTypesInstructionsDepuisAttribut(
  valeur: string | null,
): TypeInstructionIep[] {
  if (valeur === null || valeur === '') return ordreCatalogue
  try {
    const types = JSON.parse(valeur)
    if (!Array.isArray(types)) return ordreCatalogue
    const typesDisponibles = types.filter(
      (type): type is TypeInstructionIep =>
        typeof type === 'string' && type in catalogue,
    )
    return typesDisponibles.length > 0 ? typesDisponibles : ordreCatalogue
  } catch {
    return ordreCatalogue
  }
}

const classesBouton = [
  'px-3',
  'py-1.5',
  'bg-coopmaths',
  'text-white',
  'font-medium',
  'text-xs',
  'leading-tight',
  'uppercase',
  'rounded',
  'shadow-md',
  'hover:bg-coopmaths-dark',
  'focus:bg-coopmaths-dark',
  'focus:outline-none',
  'transition',
  'duration-150',
  'ease-in-out',
]

const classesChamp = [
  'border',
  'border-gray-300',
  'rounded',
  'px-2',
  'py-1',
  'text-sm',
]

const classesSelect = [...classesChamp, 'pr-8']

export class ElementIepEditeur extends MathaleaCustomElement {
  static readonly elementTag = 'alea-iep-editeur'
  static get observedAttributes(): string[] {
    return [
      'conditions-initiales',
      'programme-initial',
      'instructions-disponibles',
    ]
  }

  private static readonly verificationCallbacks = new Map<
    string,
    ElementIepVerificationCallback
  >()

  private conditionsInitiales: InstructionIep[] = []
  private programme: InstructionIep[] = []
  private indicesInstructionsProtegees = new Set<number>()
  private instructionsProtegeesInitiales = new Map<number, InstructionIep>()
  private prochaineLettre = 0
  private divParametres!: HTMLDivElement
  private zoneAjout!: HTMLDivElement
  private selectCategorie!: HTMLSelectElement
  private selectType!: HTMLSelectElement
  private listeProgramme!: HTMLOListElement
  private divAnimation!: HTMLDivElement
  private animationVisible = false
  private boutonTester!: HTMLButtonElement
  private boutonValider!: HTMLButtonElement
  private boutonAnnulerEdition!: HTMLButtonElement
  private inputChargerJSON!: HTMLInputElement
  // undefined si allowfullscreen n'est pas activé
  private boutonPleinEcran?: HTMLButtonElement
  // Index de l'étape en cours de modification, null si on est en mode ajout
  private editingIndex: number | null = null

  static create({
    id,
    numeroExercice = 0,
    questionIndex = 0,
    conditionsInitiales = [],
    programmeInitial = [],
    instructionsDisponibles,
    instructionsInitialesProtegees = [],
    programmeInitialProtege = false,
    loadSaveButtons = false,
    allowFullscreen = false,
    interactivityOn = true,
    verifyCallbackName,
    verifyCallback,
  }: EditeurIepOptions = {}): string {
    const computedId =
      id ??
      `${ElementIepEditeur.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const computedCallbackName =
      verifyCallbackName ??
      (verifyCallback == null ? undefined : `${computedId}-verification`)
    if (verifyCallback != null && computedCallbackName != null) {
      ElementIepEditeur.registerVerificationCallback(
        computedCallbackName,
        verifyCallback,
      )
    }
    return super.create({
      id: computedId,
      numeroExercice,
      questionIndex,
      conditionsInitiales,
      programmeInitial,
      instructionsDisponibles,
      instructionsInitialesProtegees,
      programmeInitialProtege,
      loadSaveButtons,
      allowFullscreen,
      interactivityOn,
      verifyCallbackName: computedCallbackName,
    })
  }

  static registerVerificationCallback(
    name: string,
    callback: ElementIepVerificationCallback,
  ): void {
    if (name.trim().length === 0) {
      throw new Error(
        'Le nom du vérificateur Instrumenpoche ne peut pas être vide',
      )
    }
    ElementIepEditeur.verificationCallbacks.set(name, callback)
  }

  static unregisterVerificationCallback(name: string): void {
    ElementIepEditeur.verificationCallbacks.delete(name)
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    const id = `${ElementIepEditeur.elementTag}Ex${exercice.numeroExercice}Q${i}`
    const editor = document.getElementById(id) as ElementIepEditeur | null
    const spanResultat = document.querySelector(
      `#resultatCheckEx${exercice.numeroExercice}Q${i}`,
    )
    const divFeedback = document.querySelector(
      `#feedbackEx${exercice.numeroExercice}Q${i}`,
    ) as HTMLElement | null

    const finish = (result: ElementIepVerificationResult) => {
      const isOk = result.isOk
      const feedback =
        result.feedback ??
        (isOk
          ? 'Bravo !'
          : 'Le programme ne correspond pas à la construction attendue.')
      if (spanResultat) spanResultat.innerHTML = isOk ? '😎' : '☹️'
      if (divFeedback) {
        divFeedback.innerHTML = feedback
        divFeedback.style.display = 'block'
      }
      return {
        isOk,
        feedback,
        score: result.score ?? {
          nbBonnesReponses: isOk ? 1 : 0,
          nbReponses: 1,
        },
      }
    }

    if (editor == null) {
      return finish({
        isOk: false,
        feedback: 'Éditeur Instrumenpoche introuvable.',
      })
    }

    const studentProgram = editor.getProgramme()
    if (exercice.answers == null) exercice.answers = {}
    exercice.answers[id] = JSON.stringify(studentProgram)
    editor.interactivityOn = false

    const expectedRaw = exercice.autoCorrection[i]?.valeur?.reponse?.value
    const verifyCallbackName = editor.getAttribute('verify-callback-name')
    const verifyCallback =
      verifyCallbackName == null
        ? undefined
        : ElementIepEditeur.verificationCallbacks.get(verifyCallbackName)
    if (verifyCallback != null) {
      return finish(
        verifyCallback({
          exercice,
          questionIndex: i,
          editor,
          studentProgram,
          expectedRaw,
        }),
      )
    }

    return finish({
      isOk:
        normaliserProgramme(studentProgram) ===
        normaliserProgramme(expectedRaw),
    })
  }

  /**
   * Ajoute des boutons Sauvegarder/Charger pour le JSON du programme
   * @attr {boolean} [loadSaveButtons=false]
   */
  private get loadSaveButtonsActif(): boolean {
    return this.getAttribute('load-save-buttons') === 'true'
  }

  /**
   * Ajoute un bouton pour ne voir que l'animation en plein écran
   * @attr {boolean} [allowfullscreen=false]
   */
  private get allowFullscreenActif(): boolean {
    return this.getAttribute('allowfullscreen') === 'true'
  }

  connectedCallback() {
    super.connectedCallback()
    if (this.dataset.initialise === '1') return
    this.dataset.initialise = '1'
    this.reinitialiserProgrammeDepuisAttributs()
    this.prochaineLettre = pointsDefinis(this.programmeComplet()).length
    this.construireInterface()
    this.rafraichirProgramme()
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (
      this.dataset.initialise !== '1' ||
      oldValue === newValue ||
      ![
        'conditions-initiales',
        'programme-initial',
        'instructions-disponibles',
      ].includes(name)
    ) {
      return
    }
    this.reinitialiserProgrammeDepuisAttributs()
    this.innerHTML = ''
    this.construireInterface()
    this.rafraichirProgramme()
  }

  private reinitialiserProgrammeDepuisAttributs() {
    const id = this.getAttribute('id') ?? 'editeur-iep'
    const conditionsInitialesAttribut =
      this.getAttribute('conditions-initiales') ?? ''
    this.conditionsInitiales = lireProgrammeDepuisAttribut(
      conditionsInitialesAttribut,
    )
    const programmeInitialAttribut =
      this.getAttribute('programme-initial') ?? ''
    const programmeInitial = lireProgrammeDepuisAttribut(
      programmeInitialAttribut,
    )
    this.initialiserInstructionsProtegees(programmeInitial)
    const programmeSauvegarde = programmesParId.get(id)
    if (
      programmeSauvegarde !== undefined &&
      programmeSauvegarde.conditionsInitialesAttribut ===
        conditionsInitialesAttribut &&
      programmeSauvegarde.programmeInitialAttribut === programmeInitialAttribut
    ) {
      this.programme = programmeSauvegarde.programme
    } else {
      this.programme =
        programmeInitial.length > 0 ? clonerProgramme(programmeInitial) : []
      programmesParId.set(id, {
        programme: this.programme,
        conditionsInitialesAttribut,
        programmeInitialAttribut,
      })
    }
    this.prochaineLettre = pointsDefinis(this.programmeComplet()).length
    this.terminerEditionSiInterfacePrete()
  }

  /**
   * Valeur JSON du programme de construction, utilisée par
   * `mathaleaWriteStudentPreviousAnswer()` pour réinjecter une réponse
   * sauvegardée (en association avec `interactivityOn = false`).
   */
  get value(): string {
    return JSON.stringify(this.programmeComplet())
  }

  set value(nextValue: string) {
    if (typeof nextValue !== 'string' || nextValue === '') return
    this.importerProgramme(nextValue)
  }

  getProgramme(): InstructionIep[] {
    return this.programmeComplet()
  }

  private programmeComplet(): InstructionIep[] {
    return clonerProgramme([...this.conditionsInitiales, ...this.programme])
  }

  protected onInteractivityChanged(_isOn: boolean): void {
    this.appliquerInteractivite()
  }

  /**
   * Active/désactive tous les boutons, listes et champs de l'éditeur
   * en fonction de `interactivityOn`.
   * Les boutons ▲/▼ déjà désactivés par la logique du programme (déplacement
   * impossible, cf. `data-desactive-logique`) ne sont pas réactivés.
   */
  private appliquerInteractivite() {
    const actif = this.interactivityOn
    if (this.zoneAjout !== undefined) {
      this.zoneAjout.style.display = actif ? '' : 'none'
    }
    this.querySelectorAll<
      HTMLButtonElement | HTMLSelectElement | HTMLInputElement
    >('button, select, input').forEach((element) => {
      if (element.dataset.boutonEditionProgramme === 'true') {
        element.style.display = actif ? '' : 'none'
      }
      if (element === this.boutonTester) {
        element.disabled = false
        return
      }
      if (!actif) {
        element.disabled = true
      } else if (element.dataset.desactiveLogique !== 'true') {
        element.disabled = false
      }
    })
  }

  /**
   * Remplace le programme courant par celui décrit par le JSON fourni
   * (utilisé par le setter `value` et par le bouton Charger)
   * @returns true si l'import a réussi
   */
  private importerProgramme(json: string): boolean {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return false
    }
    if (!Array.isArray(parsed)) return false
    const programmeImporte = parsed as InstructionIep[]
    this.programme = this.extraireProgrammeVisible(programmeImporte)
    this.restaurerInstructionsProtegees()
    this.prochaineLettre = pointsDefinis(this.programmeComplet()).length
    const id = this.getAttribute('id') ?? 'editeur-iep'
    programmesParId.set(id, {
      programme: this.programme,
      conditionsInitialesAttribut:
        this.getAttribute('conditions-initiales') ?? '',
      programmeInitialAttribut: this.getAttribute('programme-initial') ?? '',
    })
    this.terminerEdition()
    this.rafraichirProgramme()
    this.rafraichirParametres()
    return true
  }

  private extraireProgrammeVisible(programmeImporte: InstructionIep[]) {
    const nombreConditionsInitiales = this.conditionsInitiales.length
    const prefixe = programmeImporte.slice(0, nombreConditionsInitiales)
    if (
      normaliserProgramme(prefixe) ===
      normaliserProgramme(this.conditionsInitiales)
    ) {
      return programmeImporte.slice(nombreConditionsInitiales)
    }
    return programmeImporte
  }

  private construireInterface() {
    const conteneur = document.createElement('div')
    conteneur.classList.add('flex', 'flex-col', 'gap-4', 'my-4', 'max-w-5xl')

    // --- Zone d'ajout d'une instruction ---
    this.zoneAjout = document.createElement('div')
    this.zoneAjout.classList.add(
      'flex',
      'flex-col',
      'gap-2',
      'p-3',
      'border',
      'border-gray-300',
      'rounded-lg',
    )
    const titreAjout = document.createElement('div')
    titreAjout.classList.add('font-bold')
    titreAjout.innerText = 'Ajouter une instruction'
    this.zoneAjout.appendChild(titreAjout)

    const ligneAjout = document.createElement('div')
    ligneAjout.classList.add('flex', 'flex-wrap', 'items-center', 'gap-2')
    this.selectCategorie = document.createElement('select')
    this.selectCategorie.classList.add(...classesSelect)
    for (const categorie of this.categoriesDisponibles()) {
      const option = document.createElement('option')
      option.value = categorie.id
      option.innerText = categorie.label
      this.selectCategorie.appendChild(option)
    }
    this.selectCategorie.onchange = () => {
      this.rafraichirSelectType()
      this.rafraichirParametres()
    }
    ligneAjout.appendChild(this.selectCategorie)

    this.selectType = document.createElement('select')
    this.selectType.classList.add(...classesSelect)
    this.selectType.onchange = () => this.rafraichirParametres()
    ligneAjout.appendChild(this.selectType)

    this.divParametres = document.createElement('div')
    this.divParametres.classList.add(
      'flex',
      'flex-wrap',
      'items-center',
      'gap-2',
    )
    ligneAjout.appendChild(this.divParametres)

    this.boutonValider = document.createElement('button')
    this.boutonValider.innerText = 'Ajouter'
    this.boutonValider.classList.add(...classesBouton)
    this.boutonValider.onclick = () => this.validerInstruction()
    ligneAjout.appendChild(this.boutonValider)

    this.boutonAnnulerEdition = document.createElement('button')
    this.boutonAnnulerEdition.innerText = 'Annuler'
    this.boutonAnnulerEdition.type = 'button'
    this.boutonAnnulerEdition.classList.add(
      'px-3',
      'py-1.5',
      'text-xs',
      'font-medium',
      'uppercase',
      'rounded',
      'border',
      'border-gray-300',
      'hover:bg-gray-200',
      'hidden',
    )
    this.boutonAnnulerEdition.onclick = () => this.annulerEdition()
    ligneAjout.appendChild(this.boutonAnnulerEdition)
    this.zoneAjout.appendChild(ligneAjout)
    conteneur.appendChild(this.zoneAjout)

    // --- Programme de construction ---
    const zoneProgramme = document.createElement('div')
    zoneProgramme.classList.add(
      'flex',
      'flex-col',
      'gap-2',
      'p-3',
      'border',
      'border-gray-300',
      'rounded-lg',
    )
    const titreProgramme = document.createElement('div')
    titreProgramme.classList.add('font-bold')
    titreProgramme.innerText = 'Programme de construction'
    zoneProgramme.appendChild(titreProgramme)
    this.listeProgramme = document.createElement('ol')
    this.listeProgramme.classList.add(
      'list-decimal',
      'list-inside',
      'flex',
      'flex-col',
      'gap-1',
    )
    zoneProgramme.appendChild(this.listeProgramme)
    if (this.loadSaveButtonsActif) {
      zoneProgramme.appendChild(this.construireLigneChargerSauvegarder())
    }
    conteneur.appendChild(zoneProgramme)

    // --- Animation ---
    const zoneAnimation = document.createElement('div')
    zoneAnimation.classList.add('flex', 'flex-wrap', 'gap-2')
    this.boutonTester = document.createElement('button')
    this.boutonTester.innerText = 'Tester l’animation'
    this.boutonTester.type = 'button'
    this.boutonTester.classList.add(...classesBouton, 'self-start')
    this.boutonTester.onclick = () => {
      this.animationVisible = true
      this.chargerAnimation()
    }
    zoneAnimation.appendChild(this.boutonTester)
    if (this.allowFullscreenActif) {
      this.boutonPleinEcran = document.createElement('button')
      this.boutonPleinEcran.innerText = 'Voir en plein écran'
      this.boutonPleinEcran.type = 'button'
      this.boutonPleinEcran.classList.add(...classesBouton, 'self-start')
      this.boutonPleinEcran.onclick = () => this.basculerPleinEcran()
      zoneAnimation.appendChild(this.boutonPleinEcran)
    }
    this.divAnimation = document.createElement('div')
    this.divAnimation.classList.add(
      'max-w-5xl',
      'basis-full',
      'bg-white',
      'flex',
      'items-center',
      'justify-center',
    )
    zoneAnimation.appendChild(this.divAnimation)
    conteneur.appendChild(zoneAnimation)

    this.appendChild(conteneur)
    this.rafraichirSelectType()
    this.rafraichirParametres()
    this.appliquerInteractivite()
  }

  private get instructionsDisponibles(): TypeInstructionIep[] {
    return lireTypesInstructionsDepuisAttribut(
      this.getAttribute('instructions-disponibles'),
    )
  }

  private categoriesDisponibles() {
    const typesDisponibles = new Set(this.instructionsDisponibles)
    return categoriesCatalogue.filter((categorie) =>
      categorie.types.some((type) => typesDisponibles.has(type)),
    )
  }

  private typesDisponiblesDansCategorie(categorieId: string) {
    const typesDisponibles = new Set(this.instructionsDisponibles)
    const categorie =
      categoriesCatalogue.find((categorie) => categorie.id === categorieId) ??
      this.categoriesDisponibles()[0]
    return (
      categorie?.types.filter((type) => typesDisponibles.has(type)) ??
      this.instructionsDisponibles
    )
  }

  private categorieDuType(type: TypeInstructionIep) {
    return categoriesCatalogue.find((categorie) =>
      categorie.types.includes(type),
    )
  }

  private rafraichirSelectType(typeAConserver?: TypeInstructionIep) {
    const typeCourant =
      typeAConserver ?? (this.selectType.value as TypeInstructionIep | '')
    const types = this.typesDisponiblesDansCategorie(this.selectCategorie.value)
    const typeSelectionne = types.includes(typeCourant as TypeInstructionIep)
      ? (typeCourant as TypeInstructionIep)
      : types[0]
    this.selectType.innerHTML = ''
    for (const type of types) {
      const option = document.createElement('option')
      option.value = type
      option.innerText = catalogue[type].label
      this.selectType.appendChild(option)
    }
    if (typeSelectionne !== undefined) this.selectType.value = typeSelectionne
  }

  private ajouterTypeInstructionAuSelectSiBesoin(type: TypeInstructionIep) {
    const categorie = this.categorieDuType(type)
    if (categorie !== undefined) {
      if (
        this.selectCategorie.querySelector(
          `option[value="${categorie.id}"]`,
        ) === null
      ) {
        const optionCategorie = document.createElement('option')
        optionCategorie.value = categorie.id
        optionCategorie.innerText = categorie.label
        this.selectCategorie.appendChild(optionCategorie)
      }
      this.selectCategorie.value = categorie.id
      this.rafraichirSelectType(type)
    }
    if (this.selectType.querySelector(`option[value="${type}"]`) !== null) {
      return
    }
    const option = document.createElement('option')
    option.value = type
    option.innerText = catalogue[type].label
    this.selectType.appendChild(option)
  }

  /**
   * Construit la ligne de boutons Sauvegarder/Charger le JSON du programme
   * (visible uniquement si `loadSaveButtons` vaut `true`)
   */
  private construireLigneChargerSauvegarder(): HTMLDivElement {
    const ligne = document.createElement('div')
    ligne.classList.add('flex', 'items-center', 'gap-2')

    const boutonSauvegarder = document.createElement('button')
    boutonSauvegarder.innerHTML = '<i class="bx bx-save text-lg"></i>'
    boutonSauvegarder.type = 'button'
    boutonSauvegarder.title = 'Sauvegarder le programme (JSON)'
    boutonSauvegarder.setAttribute(
      'aria-label',
      'Sauvegarder le programme (JSON)',
    )
    boutonSauvegarder.classList.add(...classesBouton)
    boutonSauvegarder.onclick = () => this.sauvegarderJSON()
    ligne.appendChild(boutonSauvegarder)

    const boutonCharger = document.createElement('button')
    boutonCharger.innerHTML = '<i class="bx bx-upload text-lg"></i>'
    boutonCharger.type = 'button'
    boutonCharger.title = 'Charger un programme (JSON)'
    boutonCharger.setAttribute('aria-label', 'Charger un programme (JSON)')
    boutonCharger.classList.add(...classesBouton)
    boutonCharger.onclick = () => this.inputChargerJSON.click()
    ligne.appendChild(boutonCharger)

    this.inputChargerJSON = document.createElement('input')
    this.inputChargerJSON.type = 'file'
    this.inputChargerJSON.accept = '.json,application/json'
    this.inputChargerJSON.classList.add('hidden')
    this.inputChargerJSON.onchange = () => this.chargerJSON()
    ligne.appendChild(this.inputChargerJSON)

    return ligne
  }

  /**
   * Télécharge le programme de construction courant au format JSON
   */
  private sauvegarderJSON() {
    const blob = new Blob([JSON.stringify(this.programmeComplet(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = 'programme-construction.json'
    lien.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Lit le fichier JSON sélectionné par l'utilisateur et remplace le
   * programme courant par son contenu
   */
  private chargerJSON() {
    const fichier = this.inputChargerJSON.files?.[0]
    this.inputChargerJSON.value = ''
    if (fichier == null) return
    const lecteur = new FileReader()
    lecteur.onload = () => {
      const reussi = this.importerProgramme(String(lecteur.result))
      if (!reussi) {
        window.alert(
          'Le fichier sélectionné n’est pas un programme de construction valide.',
        )
      }
    }
    lecteur.readAsText(fichier)
  }

  /**
   * Affiche l'animation seule en plein écran (API Fullscreen du navigateur)
   */
  private async basculerPleinEcran() {
    if (!this.animationVisible) {
      this.animationVisible = true
      await this.chargerAnimation()
    }
    if (document.fullscreenElement === this.divAnimation) {
      await document.exitFullscreen()
    } else {
      await this.divAnimation.requestFullscreen()
    }
  }

  private rafraichirParametres(valeursInitiales?: Record<string, string>) {
    const valeursCourantes =
      valeursInitiales ?? this.valeursParametresCourants()
    this.divParametres.innerHTML = ''
    const type = this.selectType.value as TypeInstructionIep
    const noms = pointsDefinis(this.programmeComplet())
    for (const champ of catalogue[type].champs) {
      if (
        type === 'intersection' &&
        champ.genre === 'choix' &&
        !this.intersectionSelectionneePeutAvoirDeuxPoints(valeursCourantes)
      ) {
        continue
      }
      const etiquette = document.createElement('label')
      etiquette.classList.add(
        'flex',
        'items-center',
        'gap-1',
        'text-sm',
        'whitespace-nowrap',
      )
      etiquette.innerText = champ.label + ' :'
      if (champ.genre === 'point' || champ.genre === 'pointOptionnel') {
        const select = document.createElement('select')
        select.classList.add(...classesSelect, 'min-w-20')
        select.dataset.cle = champ.cle
        if (champ.genre === 'pointOptionnel') {
          const option = document.createElement('option')
          option.value = ''
          option.innerText = '(position actuelle)'
          select.appendChild(option)
        }
        for (const nom of noms) {
          const option = document.createElement('option')
          option.value = nom
          option.innerText = nom
          select.appendChild(option)
        }
        // Par défaut, on propose des points différents pour chaque champ
        const indice = catalogue[type].champs
          .filter((c) => c.genre === 'point')
          .findIndex((c) => c.cle === champ.cle)
        if (champ.genre === 'point' && noms.length > indice)
          select.value = noms[indice]
        if (valeursCourantes[champ.cle] !== undefined) {
          select.value = valeursCourantes[champ.cle]
        }
        etiquette.appendChild(select)
      } else if (champ.genre === 'outil') {
        const select = document.createElement('select')
        select.classList.add(...classesSelect)
        select.dataset.cle = champ.cle
        for (const [outil, nom] of Object.entries(nomsOutils)) {
          const option = document.createElement('option')
          option.value = outil
          option.innerText = nom
          select.appendChild(option)
        }
        if (valeursCourantes[champ.cle] !== undefined) {
          select.value = valeursCourantes[champ.cle]
        }
        etiquette.appendChild(select)
      } else if (champ.genre === 'etape' || champ.genre === 'objetDirection') {
        const select = document.createElement('select')
        select.classList.add(...classesSelect, 'min-w-48')
        select.dataset.cle = champ.cle
        select.onchange = () => this.rafraichirParametres()
        const elements =
          champ.genre === 'etape'
            ? elementsIntersectablesDefinis(this.programmeComplet())
            : elementsDirectionDefinis(this.programmeComplet())
        for (const { index: etape, type: typeElement } of elements) {
          const option = document.createElement('option')
          option.value = String(etape)
          option.innerText = `${nomsTypesElementsIntersectables[typeElement]} de l’étape ${etape + 1}`
          select.appendChild(option)
        }
        // Par défaut, on propose des étapes différentes pour chaque champ
        const indice = catalogue[type].champs
          .filter((c) => c.genre === champ.genre)
          .findIndex((c) => c.cle === champ.cle)
        if (elements.length > indice)
          select.value = String(elements[indice].index)
        if (valeursCourantes[champ.cle] !== undefined) {
          select.value = valeursCourantes[champ.cle]
        }
        etiquette.appendChild(select)
      } else if (
        champ.genre === 'codageSegment' ||
        champ.genre === 'codageAngle'
      ) {
        const select = document.createElement('select')
        select.classList.add(
          ...classesSelect,
          champ.genre === 'codageSegment' ? 'min-w-16' : 'min-w-28',
        )
        select.dataset.cle = champ.cle
        const optionsCodage =
          champ.genre === 'codageSegment'
            ? optionsCodageSegment
            : optionsCodageAngle
        for (const valeur of optionsCodage) {
          const option = document.createElement('option')
          option.value = valeur
          option.innerText = valeur
          select.appendChild(option)
        }
        if (valeursCourantes[champ.cle] !== undefined) {
          select.value = valeursCourantes[champ.cle]
        }
        etiquette.appendChild(select)
      } else if (champ.genre === 'choix') {
        const select = document.createElement('select')
        select.classList.add(...classesSelect, 'min-w-40')
        select.dataset.cle = champ.cle
        const optionsChoix: [string, string][] = [
          ['1', 'Point le plus haut'],
          ['2', 'Point le plus bas'],
        ]
        for (const [valeur, texte] of optionsChoix) {
          const option = document.createElement('option')
          option.value = valeur
          option.innerText = texte
          select.appendChild(option)
        }
        if (valeursCourantes[champ.cle] !== undefined) {
          select.value = valeursCourantes[champ.cle]
        }
        etiquette.appendChild(select)
      } else {
        const champTexte = document.createElement('input')
        champTexte.classList.add(...classesChamp)
        champTexte.dataset.cle = champ.cle
        if (champ.genre === 'nombre') {
          champTexte.type = 'number'
          champTexte.step = 'any'
          champTexte.classList.add('w-20')
          champTexte.value = String(champ.defaut ?? 0)
        } else if (champ.genre === 'nom') {
          champTexte.classList.add('w-14')
          champTexte.maxLength = 5
          champTexte.value = this.nomSuivant()
        } else {
          champTexte.classList.add('w-48')
          champTexte.value = String(champ.defaut ?? '')
        }
        if (valeursCourantes[champ.cle] !== undefined) {
          champTexte.value = valeursCourantes[champ.cle]
        }
        etiquette.appendChild(champTexte)
      }
      this.divParametres.appendChild(etiquette)
    }
    this.appliquerInteractivite()
  }

  private valeursParametresCourants() {
    const valeurs: Record<string, string> = {}
    if (this.divParametres === undefined) return valeurs
    this.divParametres
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-cle]')
      .forEach((element) => {
        const cle = element.dataset.cle
        if (cle !== undefined) valeurs[cle] = element.value
      })
    return valeurs
  }

  private intersectionSelectionneePeutAvoirDeuxPoints(
    valeursCourantes: Record<string, string>,
  ) {
    const programme = this.programmeComplet()
    const elements = elementsIntersectablesDefinis(programme)
    const etape1 = Number(
      valeursCourantes.etape1 ?? String(elements[0]?.index ?? ''),
    )
    const etape2 = Number(
      valeursCourantes.etape2 ?? String(elements[1]?.index ?? ''),
    )
    if (Number.isNaN(etape1) || Number.isNaN(etape2)) return false
    return intersectionPeutAvoirDeuxPoints(programme, etape1, etape2)
  }

  private nomSuivant() {
    const noms = pointsDefinis(this.programmeComplet())
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let i = this.prochaineLettre; i < alphabet.length; i++) {
      if (!noms.includes(alphabet[i])) return alphabet[i]
    }
    for (const lettre of alphabet) {
      if (!noms.includes(lettre)) return lettre
    }
    return `P${noms.length + 1}`
  }

  private validerInstruction() {
    if (
      this.editingIndex !== null &&
      this.indexInstructionEstProtege(this.editingIndex)
    ) {
      return
    }
    const type = this.selectType.value as TypeInstructionIep
    const instruction: Record<string, string | number> = { type }
    for (const champ of catalogue[type].champs) {
      const element = this.divParametres.querySelector<
        HTMLInputElement | HTMLSelectElement
      >(`[data-cle="${champ.cle}"]`)
      if (element === null) {
        if (type === 'intersection' && champ.genre === 'choix') {
          instruction[champ.cle] = 1
          continue
        }
        return
      }
      if (champ.genre === 'nombre') {
        const valeur = Number(element.value.replace(',', '.'))
        if (Number.isNaN(valeur)) return
        instruction[champ.cle] = valeur
      } else if (champ.genre === 'pointOptionnel') {
        if (element.value !== '') instruction[champ.cle] = element.value
      } else if (
        champ.genre === 'etape' ||
        champ.genre === 'objetDirection' ||
        champ.genre === 'choix'
      ) {
        if (element.value === '') return
        const valeur = Number(element.value)
        if (Number.isNaN(valeur)) return
        instruction[champ.cle] = valeur
      } else {
        if (element.value === '') {
          if (champ.optionnel) continue
          return
        }
        instruction[champ.cle] = element.value
      }
    }
    const enEdition = this.editingIndex !== null
    const programmeSansEdition = enEdition
      ? this.programme.filter((_, i) => i !== this.editingIndex)
      : this.programme
    if (
      type === 'point' ||
      type === 'pointADistance' ||
      type === 'milieu' ||
      type === 'demiTourPoint' ||
      type === 'intersection'
    ) {
      const nom = String(instruction.nom)
      if (
        pointsDefinis([
          ...this.conditionsInitiales,
          ...programmeSansEdition,
        ]).includes(nom)
      ) {
        window.alert(`Le point ${nom} existe déjà.`)
        return
      }
      if (!enEdition) this.prochaineLettre++
    }
    if (enEdition) {
      this.programme[this.editingIndex as number] =
        instruction as unknown as InstructionIep
      this.terminerEdition()
    } else {
      this.programme.push(instruction as unknown as InstructionIep)
    }
    this.rafraichirProgramme()
    this.rafraichirParametres()
  }

  /**
   * Charge une étape existante dans le formulaire d'ajout pour la modifier
   */
  private demarrerEdition(index: number) {
    if (this.indexInstructionEstProtege(index)) return
    this.editingIndex = index
    const instruction = this.programme[index]
    this.ajouterTypeInstructionAuSelectSiBesoin(instruction.type)
    this.selectType.value = instruction.type
    const valeurs = instruction as unknown as Record<
      string,
      string | number | undefined
    >
    this.rafraichirParametres(
      Object.fromEntries(
        Object.entries(valeurs)
          .filter(([, valeur]) => valeur !== undefined)
          .map(([cle, valeur]) => [cle, String(valeur)]),
      ),
    )
    for (const champ of catalogue[instruction.type].champs) {
      const element = this.divParametres.querySelector<
        HTMLInputElement | HTMLSelectElement
      >(`[data-cle="${champ.cle}"]`)
      if (element === null) continue
      const valeur = valeurs[champ.cle]
      element.value = valeur === undefined ? '' : String(valeur)
    }
    this.boutonValider.innerText = 'Enregistrer'
    this.boutonAnnulerEdition.classList.remove('hidden')
  }

  /**
   * Sort du mode édition sans changer les champs affichés
   */
  private terminerEdition() {
    this.editingIndex = null
    this.boutonValider.innerText = 'Ajouter'
    this.boutonAnnulerEdition.classList.add('hidden')
  }

  private terminerEditionSiInterfacePrete() {
    this.editingIndex = null
    if (
      this.boutonValider === undefined ||
      this.boutonAnnulerEdition === undefined
    ) {
      return
    }
    this.boutonValider.innerText = 'Ajouter'
    this.boutonAnnulerEdition.classList.add('hidden')
  }

  private annulerEdition() {
    this.terminerEdition()
    this.rafraichirParametres()
  }

  private deplacerInstruction(index: number, decalage: number) {
    const cible = index + decalage
    if (
      this.indexInstructionEstProtege(index) ||
      this.indexInstructionEstProtege(cible)
    ) {
      return
    }
    const offset = this.conditionsInitiales.length
    if (
      !peutEchangerEtapes(
        this.programmeComplet(),
        index + offset,
        cible + offset,
      )
    ) {
      return
    }
    const [instruction] = this.programme.splice(index, 1)
    this.programme.splice(cible, 0, instruction)
    if (this.editingIndex === index) {
      this.editingIndex = cible
    } else if (this.editingIndex === cible) {
      this.editingIndex = index
    }
    this.rafraichirProgramme()
  }

  private supprimerInstruction(index: number) {
    if (
      this.indexInstructionEstProtege(index) ||
      this.suppressionDeplaceraitInstructionProtegee(index)
    ) {
      return
    }
    this.programme.splice(index, 1)
    if (this.editingIndex === index) {
      this.terminerEdition()
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--
    }
    this.rafraichirProgramme()
    this.rafraichirParametres()
  }

  private rafraichirProgramme() {
    this.listeProgramme.innerHTML = ''
    if (this.programme.length === 0) {
      const vide = document.createElement('li')
      vide.classList.add('list-none', 'italic', 'text-gray-500')
      vide.innerText =
        'Le programme est vide : ajoutez une première instruction (par exemple, placer deux points).'
      this.listeProgramme.appendChild(vide)
    }
    const programmeComplet = this.programmeComplet()
    const offset = this.conditionsInitiales.length
    this.programme.forEach((instruction, index) => {
      const indexComplet = index + offset
      const protege = this.indexInstructionEstProtege(index)
      const ligne = document.createElement('li')
      ligne.classList.add('flex', 'items-center', 'gap-1')
      if (index === this.editingIndex) {
        ligne.classList.add(
          'bg-amber-100',
          'dark:bg-amber-900/40',
          'rounded',
          'px-1',
        )
      }
      const numero = document.createElement('span')
      numero.classList.add('text-gray-500', 'w-6', 'text-right', 'shrink-0')
      numero.innerText = `${indexComplet + 1}.`
      ligne.appendChild(numero)

      const texte = document.createElement('span')
      texte.classList.add('grow')
      texte.innerText = decrireInstruction(instruction, programmeComplet)
      if (!instructionEstValide(programmeComplet, indexComplet)) {
        texte.classList.add('text-red-600', 'line-through')
        texte.title =
          instruction.type === 'intersection'
            ? 'Étape ignorée : un des éléments choisis n’est pas valide.'
            : 'Étape ignorée : un des points n’est pas encore placé.'
      }
      ligne.appendChild(texte)

      const boutons: [string, () => void, string, boolean][] = [
        ['✎', () => this.demarrerEdition(index), 'Modifier', protege],
        [
          '▲',
          () => this.deplacerInstruction(index, -1),
          'Monter',
          protege ||
            this.indexInstructionEstProtege(index - 1) ||
            !peutEchangerEtapes(
              programmeComplet,
              indexComplet,
              indexComplet - 1,
            ),
        ],
        [
          '▼',
          () => this.deplacerInstruction(index, 1),
          'Descendre',
          protege ||
            this.indexInstructionEstProtege(index + 1) ||
            !peutEchangerEtapes(
              programmeComplet,
              indexComplet,
              indexComplet + 1,
            ),
        ],
        [
          '✕',
          () => this.supprimerInstruction(index),
          'Supprimer',
          protege || this.suppressionDeplaceraitInstructionProtegee(index),
        ],
      ]
      for (const [symbole, action, titre, desactive] of boutons) {
        const bouton = document.createElement('button')
        bouton.innerText = symbole
        bouton.dataset.boutonEditionProgramme = 'true'
        bouton.title = protege
          ? 'Instruction initiale protégée.'
          : desactive
            ? 'Déplacement impossible : une autre étape en dépend.'
            : titre
        bouton.disabled = desactive
        bouton.classList.add(
          'px-1.5',
          'py-0.5',
          'text-xs',
          'rounded',
          'border',
          'border-gray-300',
          'shrink-0',
        )
        if (desactive) {
          bouton.dataset.desactiveLogique = 'true'
          bouton.classList.add('opacity-40', 'cursor-not-allowed')
        } else {
          bouton.classList.add('hover:bg-gray-200')
          bouton.onclick = action
        }
        ligne.appendChild(bouton)
      }
      this.listeProgramme.appendChild(ligne)
    })
    this.appliquerInteractivite()
    if (this.boutonPleinEcran !== undefined) {
      this.boutonPleinEcran.classList.toggle(
        'hidden',
        this.programme.length === 0,
      )
    }
    if (this.animationVisible) this.chargerAnimation()
  }

  private indexInstructionEstProtege(index: number): boolean {
    return this.indicesInstructionsProtegees.has(index)
  }

  private suppressionDeplaceraitInstructionProtegee(index: number): boolean {
    return [...this.indicesInstructionsProtegees].some(
      (indexProtege) => index < indexProtege,
    )
  }

  private initialiserInstructionsProtegees(programmeInitial: InstructionIep[]) {
    const indicesProtegesDepuisOptions =
      this.getAttribute('programme-initial-protege') === 'true'
        ? programmeInitial.map((_, index) => index)
        : lireIndicesDepuisAttribut(
            this.getAttribute('instructions-initiales-protegees'),
          )
    const indicesProtegesDepuisInstructions = programmeInitial.flatMap(
      (instruction, index) => (instruction.protege === true ? [index] : []),
    )
    this.indicesInstructionsProtegees = new Set(
      [
        ...indicesProtegesDepuisOptions,
        ...indicesProtegesDepuisInstructions,
      ].filter((index) => index < programmeInitial.length),
    )
    this.instructionsProtegeesInitiales = new Map(
      [...this.indicesInstructionsProtegees].map((index) => [
        index,
        clonerProgramme([programmeInitial[index]])[0],
      ]),
    )
  }

  private restaurerInstructionsProtegees() {
    for (const [index, instruction] of this.instructionsProtegeesInitiales) {
      this.programme[index] = clonerProgramme([instruction])[0]
    }
  }

  private async chargerAnimation() {
    this.divAnimation.innerHTML = ''
    const programmeComplet = this.programmeComplet()
    if (programmeComplet.length === 0) return
    const anim = construireAnimation(
      programmeComplet,
      this.conditionsInitiales.length,
      { rangerInstruments: true },
    )
    try {
      const { default: iepLoadPromise } = await import('instrumenpoche')
      await iepLoadPromise(this.divAnimation, anim.script(), {})
    } catch (error) {
      this.divAnimation.innerText =
        'Impossible de charger le lecteur Instrumenpoche.'
      console.error(error)
    }
  }
}

/**
 * Enregistre le custom element <alea-iep-editeur> si nécessaire
 */
export function ensureElementIepEditeurRegistered() {
  registerMathaleaCustomElement(ElementIepEditeur)
}

export function addEditeurIep(
  exercice: IExercice,
  questionIndex: number,
  options: EditeurIepOptions = {},
): string {
  if (!context.isHtml) return ''
  if (exercice.autoCorrection == null) exercice.autoCorrection = []
  if (exercice.autoCorrection[questionIndex] == null) {
    exercice.autoCorrection[questionIndex] = {}
  }
  exercice.autoCorrection[questionIndex].formatInteractif =
    ElementIepEditeur.elementTag
  const elementHtml = ElementIepEditeur.create({
    ...options,
    numeroExercice: exercice.numeroExercice,
    questionIndex,
  })
  if (elementHtml === '') return ''
  return `${elementHtml}<span id="resultatCheckEx${exercice.numeroExercice}Q${questionIndex}"></span><div id="feedbackEx${exercice.numeroExercice}Q${questionIndex}"></div>`
}

registerMathaleaCustomElement(ElementIepEditeur)
