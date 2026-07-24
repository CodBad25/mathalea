import MathaleaCustomElement, { registerMathaleaCustomElement } from '../lib/customElements/MathaleaCustomElement'
import { cercle } from '../lib/2d/cercle'
import { droite } from '../lib/2d/droites'
import { pointAbstrait, type PointAbstrait } from '../lib/2d/PointAbstrait'
import { longueur } from '../lib/2d/utilitairesGeometriques'
import {
  pointAdistance,
  pointIntersectionCC,
  pointIntersectionDD,
  pointIntersectionLC,
} from '../lib/2d/utilitairesPoint'
import Alea2iep from './Alea2iep'

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
  | 'regle'
  | 'crayon'
  | 'equerre'
  | 'requerre'
  | 'compas'
  | 'rapporteur'

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
  | 'segment'
  | 'demiDroite'
  | 'cercle'
  | 'arc'

const typesElementsIntersectables: TypeElementIntersectable[] = [
  'droite',
  'segment',
  'demiDroite',
  'cercle',
  'arc',
]

// Préposition + nom pour décrire l'élément référencé par une intersection
const prepositionElementIntersectable: Record<TypeElementIntersectable, string> = {
  droite: 'de la droite',
  segment: 'du segment',
  demiDroite: 'de la demi-droite',
  cercle: 'du cercle',
  arc: 'de l’arc',
}

// Nom seul (sans article) pour les options du menu de sélection d'une étape
const nomsTypesElementsIntersectables: Record<TypeElementIntersectable, string> =
  {
    droite: 'droite',
    segment: 'segment',
    demiDroite: 'demi-droite',
    cercle: 'cercle',
    arc: 'arc',
  }

export type InstructionIep =
  | { type: 'point'; nom: string; x: number; y: number }
  | {
      type: 'pointADistance'
      nom: string
      p1: string
      distance: number
      angle: number
    }
  | { type: 'segment'; p1: string; p2: string }
  | { type: 'droite'; p1: string; p2: string }
  | { type: 'demiDroite'; p1: string; p2: string }
  | { type: 'cercle'; p1: string; p2: string }
  | { type: 'arc'; p1: string; p2: string }
  | {
      type: 'intersection'
      nom: string
      etape1: number
      etape2: number
      choix: number
    }
  | { type: 'mediatrice'; p1: string; p2: string }
  | { type: 'perpendiculaire'; p1: string; p2: string; p3: string }
  | { type: 'parallele'; p1: string; p2: string; p3: string }
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

type TypeInstruction = InstructionIep['type']

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
    | 'choix'
    | 'codageSegment'
    | 'codageAngle'
  label: string
  defaut?: number | string
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

const catalogue: Record<
  TypeInstruction,
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
  droite: {
    label: 'Tracer une droite à la règle',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point 1' },
      { cle: 'p2', genre: 'point', label: 'Point 2' },
    ],
  },
  demiDroite: {
    label: 'Tracer une demi-droite à la règle',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Origine' },
      { cle: 'p2', genre: 'point', label: 'Direction' },
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
  parallele: {
    label: 'Tracer une parallèle (règle + équerre)',
    champs: [
      { cle: 'p1', genre: 'point', label: 'Point 1 de la droite' },
      { cle: 'p2', genre: 'point', label: 'Point 2 de la droite' },
      { cle: 'p3', genre: 'point', label: 'Passant par' },
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
const ordreCatalogue: TypeInstruction[] = [
  'point',
  'pointADistance',
  'segment',
  'droite',
  'demiDroite',
  'cercle',
  'arc',
  'intersection',
  'mediatrice',
  'perpendiculaire',
  'parallele',
  'bissectrice',
  'demiDroiteAngle',
  'codageAngleDroit',
  'segmentCodage',
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

function formateNombre(n: number) {
  return String(n).replace('.', ',')
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
    case 'droite':
      return `Tracer la droite (${instr.p1}${instr.p2}) à la règle.`
    case 'demiDroite':
      return `Tracer la demi-droite [${instr.p1}${instr.p2}) à la règle.`
    case 'cercle':
      return `Tracer le cercle de centre ${instr.p1} passant par ${instr.p2} au compas.`
    case 'arc':
      return `Tracer un arc de cercle de centre ${instr.p1} passant par ${instr.p2} au compas.`
    case 'intersection':
      return `Placer le point ${instr.nom}, intersection ${decrireElementPourIntersection(programme, instr.etape1)} et ${decrireElementPourIntersection(programme, instr.etape2)}.`
    case 'mediatrice':
      return `Tracer la médiatrice du segment [${instr.p1}${instr.p2}] au compas.`
    case 'perpendiculaire':
      return `Tracer la perpendiculaire à (${instr.p1}${instr.p2}) passant par ${instr.p3} avec la règle et l’équerre.`
    case 'parallele':
      return `Tracer la parallèle à (${instr.p1}${instr.p2}) passant par ${instr.p3} avec la règle et l’équerre.`
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
  const nomsConnus = new Set<string>()
  for (let i = 0; i < index; i++) {
    const precedente = programme[i]
    if (
      precedente.type === 'point' ||
      precedente.type === 'pointADistance' ||
      precedente.type === 'intersection'
    ) {
      nomsConnus.add(precedente.nom)
    }
  }
  const references: string[] = []
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
): ElementGeometrique | undefined {
  if (!estElementIntersectable(instr)) return undefined
  const A = points.get(instr.p1)
  const B = points.get(instr.p2)
  if (A === undefined || B === undefined) return undefined
  if (
    instr.type === 'droite' ||
    instr.type === 'segment' ||
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

/**
 * Joue le programme sur une instance d'Alea2iep.
 * Renvoie la liste des indices des étapes ignorées (points non définis).
 */
function jouerProgramme(
  anim: Alea2iep,
  programme: InstructionIep[],
): number[] {
  const points = new Map<string, PointAbstrait>()
  const etapesIgnorees: number[] = []
  programme.forEach((instr, index) => {
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
      case 'droite': {
        const pts = recupere(instr.p1, instr.p2)
        if (pts === undefined) {
          etapesIgnorees.push(index)
          break
        }
        anim.regleDroite(pts[0], pts[1])
        break
      }
      case 'demiDroite': {
        const pts = recupere(instr.p1, instr.p2)
        if (pts === undefined) {
          etapesIgnorees.push(index)
          break
        }
        anim.regleDemiDroiteOriginePoint(pts[0], pts[1])
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
      case 'intersection': {
        const element1 = elementGeometrique(programme[instr.etape1], points)
        const element2 = elementGeometrique(programme[instr.etape2], points)
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
        anim.perpendiculaireRegleEquerre2points3epoint(pts[0], pts[1], pts[2])
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
  })
  anim.regleMasquer()
  anim.equerreMasquer()
  anim.requerreMasquer()
  anim.rapporteurMasquer()
  anim.compasMasquer()
  anim.crayonMasquer()
  return etapesIgnorees
}

/**
 * Construit l'animation complète : une première passe sert à calculer
 * les bornes de la figure pour cadrer la seconde (viewBox + recadrage).
 */
export function construireAnimation(programme: InstructionIep[]): Alea2iep {
  const brouillon = new Alea2iep()
  jouerProgramme(brouillon, programme)
  const anim = new Alea2iep()
  const largeur = Math.max(600, (brouillon.xMax - brouillon.xMin + 6) * 30)
  const hauteur = Math.max(400, (brouillon.yMax - brouillon.yMin + 6) * 30)
  anim.taille(largeur, hauteur)
  anim.recadre(brouillon.xMin - 3, brouillon.yMax)
  jouerProgramme(anim, programme)
  return anim
}

// Les programmes sont conservés ici pour survivre aux re-rendus de l'exercice
const programmesParId = new Map<string, InstructionIep[]>()

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

export class ElementIepEditeur extends MathaleaCustomElement {
  static readonly elementTag = 'alea-iep-editeur'

  private programme: InstructionIep[] = []
  private prochaineLettre = 0
  private divParametres!: HTMLDivElement
  private selectType!: HTMLSelectElement
  private listeProgramme!: HTMLOListElement
  private divAnimation!: HTMLDivElement
  private animationVisible = false
  private boutonValider!: HTMLButtonElement
  private boutonAnnulerEdition!: HTMLButtonElement
  // Index de l'étape en cours de modification, null si on est en mode ajout
  private editingIndex: number | null = null

  connectedCallback() {
    super.connectedCallback()
    if (this.dataset.initialise === '1') return
    this.dataset.initialise = '1'
    const id = this.getAttribute('id') ?? 'editeur-iep'
    const programmeSauvegarde = programmesParId.get(id)
    if (programmeSauvegarde !== undefined) {
      this.programme = programmeSauvegarde
    } else {
      programmesParId.set(id, this.programme)
    }
    this.prochaineLettre = pointsDefinis(this.programme).length
    this.construireInterface()
    this.rafraichirProgramme()
  }

  private construireInterface() {
    const conteneur = document.createElement('div')
    conteneur.classList.add('flex', 'flex-col', 'gap-4', 'my-4', 'max-w-5xl')

    // --- Zone d'ajout d'une instruction ---
    const zoneAjout = document.createElement('div')
    zoneAjout.classList.add(
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
    zoneAjout.appendChild(titreAjout)

    const ligneAjout = document.createElement('div')
    ligneAjout.classList.add('flex', 'flex-wrap', 'items-center', 'gap-2')
    this.selectType = document.createElement('select')
    this.selectType.classList.add(...classesChamp)
    for (const type of ordreCatalogue) {
      const option = document.createElement('option')
      option.value = type
      option.innerText = catalogue[type].label
      this.selectType.appendChild(option)
    }
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
    zoneAjout.appendChild(ligneAjout)
    conteneur.appendChild(zoneAjout)

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
    conteneur.appendChild(zoneProgramme)

    // --- Animation ---
    const zoneAnimation = document.createElement('div')
    zoneAnimation.classList.add('flex', 'flex-col', 'gap-2')
    const boutonTester = document.createElement('button')
    boutonTester.innerText = 'Tester l’animation'
    boutonTester.classList.add(...classesBouton, 'self-start')
    boutonTester.onclick = () => {
      this.animationVisible = true
      this.chargerAnimation()
    }
    zoneAnimation.appendChild(boutonTester)
    this.divAnimation = document.createElement('div')
    this.divAnimation.classList.add('max-w-5xl')
    zoneAnimation.appendChild(this.divAnimation)
    conteneur.appendChild(zoneAnimation)

    this.appendChild(conteneur)
    this.rafraichirParametres()
  }

  private rafraichirParametres() {
    this.divParametres.innerHTML = ''
    const type = this.selectType.value as TypeInstruction
    const noms = pointsDefinis(this.programme)
    for (const champ of catalogue[type].champs) {
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
        select.classList.add(...classesChamp, 'min-w-20')
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
        etiquette.appendChild(select)
      } else if (champ.genre === 'outil') {
        const select = document.createElement('select')
        select.classList.add(...classesChamp)
        select.dataset.cle = champ.cle
        for (const [outil, nom] of Object.entries(nomsOutils)) {
          const option = document.createElement('option')
          option.value = outil
          option.innerText = nom
          select.appendChild(option)
        }
        etiquette.appendChild(select)
      } else if (champ.genre === 'etape') {
        const select = document.createElement('select')
        select.classList.add(...classesChamp, 'min-w-32')
        select.dataset.cle = champ.cle
        const elements = elementsIntersectablesDefinis(this.programme)
        for (const { index: etape, type: typeElement } of elements) {
          const option = document.createElement('option')
          option.value = String(etape)
          option.innerText = `${nomsTypesElementsIntersectables[typeElement]} de l’étape ${etape + 1}`
          select.appendChild(option)
        }
        // Par défaut, on propose des étapes différentes pour chaque champ
        const indice = catalogue[type].champs
          .filter((c) => c.genre === 'etape')
          .findIndex((c) => c.cle === champ.cle)
        if (elements.length > indice) select.value = String(elements[indice].index)
        etiquette.appendChild(select)
      } else if (
        champ.genre === 'codageSegment' ||
        champ.genre === 'codageAngle'
      ) {
        const select = document.createElement('select')
        select.classList.add(
          ...classesChamp,
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
        etiquette.appendChild(select)
      } else if (champ.genre === 'choix') {
        const select = document.createElement('select')
        select.classList.add(...classesChamp)
        select.dataset.cle = champ.cle
        const optionsChoix: [string, string][] = [
          ['1', '1er point'],
          ['2', '2e point'],
        ]
        for (const [valeur, texte] of optionsChoix) {
          const option = document.createElement('option')
          option.value = valeur
          option.innerText = texte
          select.appendChild(option)
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
        etiquette.appendChild(champTexte)
      }
      this.divParametres.appendChild(etiquette)
    }
  }

  private nomSuivant() {
    const noms = pointsDefinis(this.programme)
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
    const type = this.selectType.value as TypeInstruction
    const instruction: Record<string, string | number> = { type }
    for (const champ of catalogue[type].champs) {
      const element = this.divParametres.querySelector<
        HTMLInputElement | HTMLSelectElement
      >(`[data-cle="${champ.cle}"]`)
      if (element === null) return
      if (champ.genre === 'nombre') {
        const valeur = Number(element.value.replace(',', '.'))
        if (Number.isNaN(valeur)) return
        instruction[champ.cle] = valeur
      } else if (champ.genre === 'pointOptionnel') {
        if (element.value !== '') instruction[champ.cle] = element.value
      } else if (champ.genre === 'etape' || champ.genre === 'choix') {
        if (element.value === '') return
        const valeur = Number(element.value)
        if (Number.isNaN(valeur)) return
        instruction[champ.cle] = valeur
      } else {
        if (element.value === '') return
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
      type === 'intersection'
    ) {
      const nom = String(instruction.nom)
      if (pointsDefinis(programmeSansEdition).includes(nom)) {
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
    this.editingIndex = index
    const instruction = this.programme[index]
    this.selectType.value = instruction.type
    this.rafraichirParametres()
    const valeurs = instruction as unknown as Record<
      string,
      string | number | undefined
    >
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

  private annulerEdition() {
    this.terminerEdition()
    this.rafraichirParametres()
  }

  private deplacerInstruction(index: number, decalage: number) {
    const cible = index + decalage
    if (!peutEchangerEtapes(this.programme, index, cible)) return
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
    this.programme.forEach((instruction, index) => {
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
      numero.innerText = `${index + 1}.`
      ligne.appendChild(numero)

      const texte = document.createElement('span')
      texte.classList.add('grow')
      texte.innerText = decrireInstruction(instruction, this.programme)
      if (!instructionEstValide(this.programme, index)) {
        texte.classList.add('text-red-600', 'line-through')
        texte.title =
          instruction.type === 'intersection'
            ? 'Étape ignorée : un des éléments choisis n’est pas valide.'
            : 'Étape ignorée : un des points n’est pas encore placé.'
      }
      ligne.appendChild(texte)

      const boutons: [string, () => void, string, boolean][] = [
        ['✎', () => this.demarrerEdition(index), 'Modifier', false],
        [
          '▲',
          () => this.deplacerInstruction(index, -1),
          'Monter',
          !peutEchangerEtapes(this.programme, index, index - 1),
        ],
        [
          '▼',
          () => this.deplacerInstruction(index, 1),
          'Descendre',
          !peutEchangerEtapes(this.programme, index, index + 1),
        ],
        ['✕', () => this.supprimerInstruction(index), 'Supprimer', false],
      ]
      for (const [symbole, action, titre, desactive] of boutons) {
        const bouton = document.createElement('button')
        bouton.innerText = symbole
        bouton.title = desactive
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
          bouton.classList.add('opacity-40', 'cursor-not-allowed')
        } else {
          bouton.classList.add('hover:bg-gray-200')
          bouton.onclick = action
        }
        ligne.appendChild(bouton)
      }
      this.listeProgramme.appendChild(ligne)
    })
    if (this.animationVisible) this.chargerAnimation()
  }

  private async chargerAnimation() {
    this.divAnimation.innerHTML = ''
    if (this.programme.length === 0) return
    const anim = construireAnimation(this.programme)
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
