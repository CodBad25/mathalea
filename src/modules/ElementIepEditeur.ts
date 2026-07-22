import MathaleaCustomElement, { registerMathaleaCustomElement } from '../lib/customElements/MathaleaCustomElement'
import { pointAbstrait, type PointAbstrait } from '../lib/2d/PointAbstrait'
import { pointAdistance } from '../lib/2d/utilitairesPoint'
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
  | { type: 'mediatrice'; p1: string; p2: string }
  | { type: 'perpendiculaire'; p1: string; p2: string; p3: string }
  | { type: 'parallele'; p1: string; p2: string; p3: string }
  | { type: 'bissectrice'; p1: string; p2: string; p3: string }
  | { type: 'codageAngleDroit'; p1: string; p2: string; p3: string }
  | { type: 'demiDroiteAngle'; p1: string; p2: string; angle: number }
  | { type: 'montrerOutil'; outil: OutilIep; p1?: string }
  | { type: 'masquerOutil'; outil: OutilIep }
  | { type: 'texte'; texte: string; x: number; y: number }
  | { type: 'pause' }

type TypeInstruction = InstructionIep['type']

type ChampSpec = {
  cle: string
  genre: 'nom' | 'point' | 'pointOptionnel' | 'outil' | 'nombre' | 'texte'
  label: string
  defaut?: number | string
}

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
  texte: {
    label: 'Écrire un texte',
    champs: [
      { cle: 'texte', genre: 'texte', label: 'Texte' },
      { cle: 'x', genre: 'nombre', label: 'x', defaut: 1 },
      { cle: 'y', genre: 'nombre', label: 'y', defaut: 9 },
    ],
  },
  pause: {
    label: 'Marquer une pause',
    champs: [],
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
  'mediatrice',
  'perpendiculaire',
  'parallele',
  'bissectrice',
  'demiDroiteAngle',
  'codageAngleDroit',
  'montrerOutil',
  'masquerOutil',
  'texte',
  'pause',
]

function formateNombre(n: number) {
  return String(n).replace('.', ',')
}

/**
 * Description en français d'une instruction pour l'affichage du programme
 */
export function decrireInstruction(instr: InstructionIep): string {
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
    case 'texte':
      return `Écrire « ${instr.texte} » en (${formateNombre(instr.x)} ; ${formateNombre(instr.y)}).`
    case 'pause':
      return 'Marquer une pause dans l’animation.'
  }
}

/**
 * Renvoie la liste des noms de points définis par le programme
 */
export function pointsDefinis(programme: InstructionIep[]): string[] {
  const noms: string[] = []
  for (const instr of programme) {
    if (
      (instr.type === 'point' || instr.type === 'pointADistance') &&
      instr.nom !== '' &&
      !noms.includes(instr.nom)
    ) {
      noms.push(instr.nom)
    }
  }
  return noms
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
      case 'texte': {
        anim.textePosition(instr.texte, instr.x, instr.y)
        break
      }
      case 'pause': {
        anim.pause()
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
    conteneur.classList.add('flex', 'flex-col', 'gap-4', 'my-4', 'max-w-3xl')

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

    const boutonAjouter = document.createElement('button')
    boutonAjouter.innerText = 'Ajouter'
    boutonAjouter.classList.add(...classesBouton)
    boutonAjouter.onclick = () => this.ajouterInstruction()
    ligneAjout.appendChild(boutonAjouter)
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
    this.divAnimation.classList.add('max-w-3xl')
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

  private ajouterInstruction() {
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
      } else {
        if (element.value === '') return
        instruction[champ.cle] = element.value
      }
    }
    if (type === 'point' || type === 'pointADistance') {
      const nom = String(instruction.nom)
      if (pointsDefinis(this.programme).includes(nom)) {
        window.alert(`Le point ${nom} existe déjà.`)
        return
      }
      this.prochaineLettre++
    }
    this.programme.push(instruction as unknown as InstructionIep)
    this.rafraichirProgramme()
    this.rafraichirParametres()
  }

  private deplacerInstruction(index: number, decalage: number) {
    const cible = index + decalage
    if (cible < 0 || cible >= this.programme.length) return
    const [instruction] = this.programme.splice(index, 1)
    this.programme.splice(cible, 0, instruction)
    this.rafraichirProgramme()
  }

  private supprimerInstruction(index: number) {
    this.programme.splice(index, 1)
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
    // Détermine les étapes invalides (point utilisé avant d'être placé)
    const nomsConnus = new Set<string>()
    this.programme.forEach((instruction, index) => {
      const ligne = document.createElement('li')
      ligne.classList.add('flex', 'items-center', 'gap-1')
      const numero = document.createElement('span')
      numero.classList.add('text-gray-500', 'w-6', 'text-right', 'shrink-0')
      numero.innerText = `${index + 1}.`
      ligne.appendChild(numero)

      const texte = document.createElement('span')
      texte.classList.add('grow')
      texte.innerText = decrireInstruction(instruction)
      const references: string[] = []
      for (const cle of ['p1', 'p2', 'p3'] as const) {
        if (cle in instruction) {
          references.push(
            (instruction as unknown as Record<string, string>)[cle],
          )
        }
      }
      const invalide = references.some((nom) => !nomsConnus.has(nom))
      if (invalide) {
        texte.classList.add('text-red-600', 'line-through')
        texte.title = 'Étape ignorée : un des points n’est pas encore placé.'
      }
      if (instruction.type === 'point' || instruction.type === 'pointADistance')
        nomsConnus.add(instruction.nom)
      ligne.appendChild(texte)

      const boutons: [string, () => void, string][] = [
        ['▲', () => this.deplacerInstruction(index, -1), 'Monter'],
        ['▼', () => this.deplacerInstruction(index, 1), 'Descendre'],
        ['✕', () => this.supprimerInstruction(index), 'Supprimer'],
      ]
      for (const [symbole, action, titre] of boutons) {
        const bouton = document.createElement('button')
        bouton.innerText = symbole
        bouton.title = titre
        bouton.classList.add(
          'px-1.5',
          'py-0.5',
          'text-xs',
          'rounded',
          'border',
          'border-gray-300',
          'hover:bg-gray-200',
          'shrink-0',
        )
        bouton.onclick = action
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
