import { Arc } from '../../lib/2d/Arc'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { carre } from '../../lib/2d/polygonesParticuliers'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { angleOriente } from '../../lib/2d/utilitairesGeometriques'
import {
  addEditeurIep,
  ElementIepEditeur,
  type ElementIepVerificationCallback,
  type InstructionIep,
  type TypeInstructionIep,
} from '../../lib/customElements/ElementIepEditeur'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { mathalea2d } from '../../modules/mathalea2d'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'
export const interactifType = 'alea-iep-editeur'
export const interactifReady = true

type ArcDansLeCarre = {
  extremite1: number
  extremite2: number
  xCentre?: number
  yCentre?: number
}
type FormeDansLeCarre = Array<ArcDansLeCarre>

const VERIFICATION_FORME_DANS_LE_CARRE_CALLBACK_NAME =
  'verification-forme-dans-le-carre'

const pointsDuCarre = [
  { nom: 'J', x: 0, y: 9 },
  { nom: 'I', x: 3, y: 9 },
  { nom: 'H', x: 6, y: 9 },
  { nom: 'G', x: 9, y: 9 },
  { nom: 'F', x: 9, y: 6 },
  { nom: 'E', x: 9, y: 3 },
  { nom: 'D', x: 9, y: 0 },
  { nom: 'C', x: 6, y: 0 },
  { nom: 'B', x: 3, y: 0 },
  { nom: 'A', x: 0, y: 0 },
  { nom: 'L', x: 0, y: 3 },
  { nom: 'K', x: 0, y: 6 },
  { nom: 'M', x: 3, y: 3 },
  { nom: 'N', x: 6, y: 3 },
  { nom: 'O', x: 6, y: 6 },
  { nom: 'P', x: 3, y: 6 },
]

const pointAPArtirDuNumero = (n: number) =>
  pointAbstrait(pointsDuCarre[n].x, pointsDuCarre[n].y)
const sommetsDuCarre = [0, 1, 2, 3].map((i) => pointsDuCarre[i * 3])

function nomPointDepuisCoordonnees(x: number, y: number): string {
  const point = pointsDuCarre.find((point) => point.x === x && point.y === y)
  if (point === undefined) {
    throw new Error(`Aucun point nommé aux coordonnées (${x}; ${y}).`)
  }
  return point.nom
}

function coordonneesPointDepuisNom(nom: string): string | undefined {
  const point = pointsDuCarre.find((point) => point.nom === nom)
  if (point === undefined) return undefined
  return `${point.x};${point.y}`
}

function cleArcDepuisInstruction(
  instruction: InstructionIep,
): string | undefined {
  if (instruction.type !== 'arcPointPointCentre') return undefined
  const centre = coordonneesPointDepuisNom(instruction.p1)
  const extremite1 = coordonneesPointDepuisNom(instruction.p2)
  const extremite2 = coordonneesPointDepuisNom(instruction.p3)
  if (
    centre === undefined ||
    extremite1 === undefined ||
    extremite2 === undefined
  ) {
    return undefined
  }
  const extremites = [extremite1, extremite2].sort()
  return `${centre}|${extremites[0]}|${extremites[1]}`
}

function arcsTracesParProgramme(programme: InstructionIep[]): string[] {
  return programme
    .map(cleArcDepuisInstruction)
    .filter((arc): arc is string => arc !== undefined)
    .sort()
}

const verifierFormeDansLeCarre: ElementIepVerificationCallback = ({
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
  const arcsAttendus = arcsTracesParProgramme(expectedProgram)
  const arcsEleve = arcsTracesParProgramme(studentProgram)
  const isOk =
    arcsAttendus.length === arcsEleve.length &&
    arcsAttendus.every((arc, index) => arc === arcsEleve[index])
  return {
    isOk,
    feedback: isOk
      ? 'Bravo !'
      : 'Les arcs tracés ne correspondent pas à la forme attendue.',
  }
}

ElementIepEditeur.registerVerificationCallback(
  VERIFICATION_FORME_DANS_LE_CARRE_CALLBACK_NAME,
  verifierFormeDansLeCarre,
)

function estUnSommetDuCarre(numeroPoint: number): boolean {
  return sommetsDuCarre.some(
    (point) =>
      point.x === pointsDuCarre[numeroPoint].x &&
      point.y === pointsDuCarre[numeroPoint].y,
  )
}

function arcPossible(
  extremite1: number,
  extremite2: number,
  delta: number,
): boolean {
  const unPointEstUnSommet =
    estUnSommetDuCarre(extremite1) || estUnSommetDuCarre(extremite2)
  if (unPointEstUnSommet && delta === 4) return false // On ne peut pas avoir un arc de 4 avec un sommet dans le carré
  if (delta === 6 && !unPointEstUnSommet) return false // On ne peut pas avoir un arc de 6 sans sommet dans le carré
  return true
}

function creerListeArcs() {
  const start = Math.round(Math.random() * 3)
  const creerArcs = (
    extremite1: number,
    remaining: number,
    bondPrecedent?: number,
    premierBond?: number,
  ): FormeDansLeCarre | undefined => {
    if (remaining === 0) {
      return bondPrecedent === 2 && premierBond === 2 ? undefined : []
    }
    const bondsPossibles = [2, 4, 6]
      .filter((bond) => bond <= remaining)
      .filter((bond) => bondPrecedent !== 2 || bond !== 2)
      .sort(() => Math.random() - 0.5)
    for (const bond of bondsPossibles) {
      const extremite2 = (extremite1 + bond) % 12
      if (!arcPossible(extremite1, extremite2, bond)) continue
      const suite = creerArcs(
        extremite2,
        remaining - bond,
        bond,
        premierBond ?? bond,
      )
      if (suite !== undefined) {
        return [{ extremite1, extremite2 }, ...suite]
      }
    }
  }

  return creerArcs(start, 12) ?? []
}

function trouverCentreArcEtSens(arc: ArcDansLeCarre) {
  const deuxPointsEnHaut =
    pointsDuCarre[arc.extremite1].y === 9 &&
    pointsDuCarre[arc.extremite2].y === 9
  const deuxPointsEnBas =
    pointsDuCarre[arc.extremite1].y === 0 &&
    pointsDuCarre[arc.extremite2].y === 0
  const deuxPointsAGauche =
    pointsDuCarre[arc.extremite1].x === 0 &&
    pointsDuCarre[arc.extremite2].x === 0
  const deuxPointsADroite =
    pointsDuCarre[arc.extremite1].x === 9 &&
    pointsDuCarre[arc.extremite2].x === 9

  const deuxPointsSurLeMemeCote =
    deuxPointsEnHaut ||
    deuxPointsEnBas ||
    deuxPointsAGauche ||
    deuxPointsADroite
  const p1 = pointsDuCarre[arc.extremite1]
  const p2 = pointsDuCarre[arc.extremite2]
  const delta = (arc.extremite2 - arc.extremite1 + 12) % 12
  switch (delta) {
    case 2:
      if (deuxPointsSurLeMemeCote) {
        if (deuxPointsEnHaut) {
          return { xCentre: (p1.x + p2.x) / 2, yCentre: 9 }
        }
        if (deuxPointsEnBas) {
          return { xCentre: (p1.x + p2.x) / 2, yCentre: 0 }
        }
        if (deuxPointsAGauche) {
          return { xCentre: 0, yCentre: (p1.y + p2.y) / 2 }
        }
        if (deuxPointsADroite) {
          return { xCentre: 9, yCentre: (p1.y + p2.y) / 2 }
        }
      } else {
        const premierCentre = Math.random() > 0.5
        if (premierCentre) return { xCentre: p1.x, yCentre: p2.y }
        else return { xCentre: p2.x, yCentre: p1.y }
      }
      break
    case 4: {
      const premierCentre = Math.random() > 0.5
      if (premierCentre) return { xCentre: p1.x, yCentre: p2.y }
      else return { xCentre: p2.x, yCentre: p1.y }
    }
    case 6:
      switch (p1.x) {
        case 0:
          switch (p1.y) {
            case 0:
              return { xCentre: 9, yCentre: 0 }
            case 9:
              return { xCentre: 0, yCentre: 0 }
          }
          break
        case 9:
          switch (p1.y) {
            case 0:
              return { xCentre: 9, yCentre: 9 }
            case 9:
              return { xCentre: 0, yCentre: 9 }
          }
      }
      return { xCentre: p1.y, yCentre: p2.x }
    default:
      console.error('delta invalide', delta)
  }
  return { xCentre: p1.x, yCentre: p2.y }
}

function creerForme(): FormeDansLeCarre {
  const arcs = creerListeArcs()
  const arcsAvecCentreEtSens = arcs.map((arc) => {
    const { xCentre, yCentre } = trouverCentreArcEtSens(arc)
    return { ...arc, xCentre, yCentre }
  })
  return arcsAvecCentreEtSens
}

function traceShape(arcs: FormeDansLeCarre): string {
  const A = pointAbstrait(0, 0)
  const B = pointAbstrait(9, 0)
  const cadre = carre(A, B)
  const s1 = segment(pointAbstrait(3, 0), pointAbstrait(3, 9))
  const s2 = segment(pointAbstrait(6, 0), pointAbstrait(6, 9))
  const s3 = segment(pointAbstrait(0, 3), pointAbstrait(9, 3))
  const s4 = segment(pointAbstrait(0, 6), pointAbstrait(9, 6))
  const objets: NestedObjetMathalea2dArray = [cadre, s1, s2, s3, s4]
  for (const arc of arcs) {
    const E1 = pointAPArtirDuNumero(arc.extremite1)
    const E2 = pointAPArtirDuNumero(arc.extremite2)
    const centre = pointAbstrait(arc.xCentre ?? 0, arc.yCentre ?? 0)
    objets.push(new Arc(E1, centre, angleOriente(E1, centre, E2)))
  }

  return mathalea2d(Object.assign({}, fixeBordures(objets)), objets)
}

export const titre = 'Reproduire une forme avec des arcs de cercles'
export const uuid = 'ebaef'
export const dateDePublication = '20/08/2026'

export const refs = {
  'fr-fr': ['6G2B-1'],
  'fr-2016': [],
  'fr-ch': [],
}
/**
 * @author Jean-Claude Lhote
 */
export default class FormeDansLeCarreATracer extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }
  nouvelleVersion() {
    const forme = creerForme()
    const conditionsInitiales: InstructionIep[] = [
      ...pointsDuCarre.map(({ nom, x, y }) => ({
        type: 'point' as const,
        nom,
        x,
        y,
      })),
      { type: 'polygoneRapide', sommets: 'A,D,G,J' },
      { type: 'trait', p1: 'B', p2: 'I' },
      { type: 'trait', p1: 'C', p2: 'H' },
      { type: 'trait', p1: 'L', p2: 'E' },
      { type: 'trait', p1: 'K', p2: 'F' },
    ]
    const instructionsDisponibles: TypeInstructionIep[] = [
      'arcPointPointCentre',
    ]
    const programmeAttendu: InstructionIep[] = forme.map((arc) => ({
      type: 'arcPointPointCentre',
      p1: nomPointDepuisCoordonnees(arc.xCentre ?? 0, arc.yCentre ?? 0),
      p2: pointsDuCarre[arc.extremite1].nom,
      p3: pointsDuCarre[arc.extremite2].nom,
    }))
    const editeur = addEditeurIep(this, 0, {
      conditionsInitiales,
      instructionsDisponibles,
      programmeAttendu,
      verifyCallbackName: VERIFICATION_FORME_DANS_LE_CARRE_CALLBACK_NAME,
    })
    handleAnswers(
      this,
      0,
      {
        reponse: { value: JSON.stringify(programmeAttendu) },
      },
      { formatInteractif: 'alea-iep-editeur' },
    )
    this.listeQuestions[0] = `Reproduire la forme ci-dessous<br>${traceShape(forme)}${editeur}`

    this.listeCorrections[0] = `Voici un programme de construction de la forme demandée :<br>
        ${addEditeurIep(this, 0, {
          id: `IepEditeur-corr-Ex${this.numeroExercice}Q0`,
          conditionsInitiales,
          interactivityOn: false,
          programmeInitial: programmeAttendu,
          instructionsDisponibles,
        })}`
  }
}
