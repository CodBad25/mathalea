import { context } from '../../modules/context'
import { orangeMathalea } from '../colors'
import { miseEnEvidence } from '../outils/embellissements'
import { estPremier } from '../outils/primalite'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

/**
 * Le jeu du Juniper Green.
 *
 * Les joueurs choisissent tour à tour un nombre de la grille : chaque nombre
 * doit être un multiple ou un diviseur du précédent et aucun nombre ne peut
 * servir deux fois. La partie s'arrête quand plus aucun multiple ni diviseur
 * du dernier nombre n'est disponible.
 *
 * Le composant ne porte aucune réponse d'élève : il n'est donc pas déclaré
 * dans `listOfCustomElements` et l'exercice qui l'utilise n'est pas interactif
 * au sens de MathALÉA (ni score, ni bouton « Vérifier »).
 *
 * @author Rémi Angot
 */

export type ReglesJuniperGreen = {
  /** Plus grand nombre de la grille. */
  max: number
  /** Interdit de commencer la partie par un nombre premier. */
  debutPremierInterdit: boolean
}

export type JuniperGreenOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  /** Plus grand nombre de la grille. */
  max?: number
  /** Nombre de cases par ligne : 5 ou 10. */
  nombresParLigne?: number
  /** Interdit de commencer la partie par un nombre premier. */
  debutPremierInterdit?: boolean
  /** Partie déjà jouée : sert à afficher un exemple dans la correction. */
  suite?: number[]
  /** Dévoile la partie reçue un nombre à la fois, une seconde par nombre. */
  animation?: boolean
  interactivityOn?: boolean
}

const MAX_PAR_DEFAUT = 40
const PAR_LIGNE_PAR_DEFAUT = 10
/** Durée d'affichage d'un nombre de la partie animée. */
const DELAI_ANIMATION_MS = 1000
/** Côté d'une case, en em pour suivre le zoom des vues (voir `construitInterface`). */
const TAILLE_CASE = '2.25em'

/** La grille commence à 1 : en dessous de 2 nombres il n'y a pas de partie. */
function normaliseMax(valeur: unknown): number {
  const nombre = Math.round(Number(valeur))
  if (!Number.isFinite(nombre)) return MAX_PAR_DEFAUT
  return Math.min(200, Math.max(2, nombre))
}

/** Seules les dispositions 5 et 10 sont proposées par l'exercice. */
function normaliseParLigne(valeur: unknown): number {
  return Math.round(Number(valeur)) === 5 ? 5 : PAR_LIGNE_PAR_DEFAUT
}

function nombresDeLaGrille(max: number): number[] {
  return Array.from({ length: max }, (_, index) => index + 1)
}

/**
 * Le refus opposé au coup, ou `null` si le coup est licite.
 *
 * Les règles du jeu ne sont écrites qu'ici : l'exercice s'en sert pour tirer
 * la partie donnée en exemple dans la correction, le composant pour arbitrer
 * les clics de l'élève.
 */
export function raisonDuRefus(
  suite: readonly number[],
  nombre: number,
  regles: ReglesJuniperGreen,
): string | null {
  if (nombre < 1 || nombre > regles.max) {
    return `${nombre} n'est pas dans la grille.`
  }
  if (suite.includes(nombre)) return `${nombre} a déjà été utilisé.`
  const dernier = suite.at(-1)
  if (dernier === undefined) {
    if (regles.debutPremierInterdit && estPremier(nombre)) {
      return `Il est interdit de commencer par un nombre premier, et ${nombre} en est un.`
    }
    return null
  }
  if (nombre % dernier !== 0 && dernier % nombre !== 0) {
    return `${nombre} n'est ni un multiple ni un diviseur de ${dernier}.`
  }
  return null
}

/** Tous les coups encore jouables après `suite`. */
export function coupsPossibles(
  suite: readonly number[],
  regles: ReglesJuniperGreen,
): number[] {
  return nombresDeLaGrille(regles.max).filter(
    (nombre) => raisonDuRefus(suite, nombre, regles) === null,
  )
}

function texteSuite(suite: readonly number[], fleche: string): string {
  return suite.length === 0
    ? 'Suite des nombres choisis : aucun pour l’instant.'
    : `Suite des nombres choisis : ${suite.join(fleche)}.`
}

function renderLatexGrille(
  max: number,
  nombresParLigne: number,
  suite: readonly number[],
): string {
  const nombres = nombresDeLaGrille(max)
  const lignes: string[] = []
  for (let debut = 0; debut < nombres.length; debut += nombresParLigne) {
    const ligne = nombres
      .slice(debut, debut + nombresParLigne)
      .map((nombre) =>
        suite.includes(nombre) ? `$${miseEnEvidence(nombre)}$` : `$${nombre}$`,
      )
    while (ligne.length < nombresParLigne) ligne.push('')
    lignes.push(`${ligne.join(' & ')} \\\\ \\hline`)
  }
  const grille = [
    '\\begin{center}',
    `\\begin{tabular}{|${'c|'.repeat(nombresParLigne)}}`,
    '\\hline',
    ...lignes,
    '\\end{tabular}',
    '\\end{center}',
  ].join('\n')
  if (suite.length === 0) return grille
  return `${grille}\nSuite des nombres choisis : $${suite.join(' \\to ')}$.`
}

function renderTypstGrille(
  max: number,
  nombresParLigne: number,
  suite: readonly number[],
): string {
  const cellules = nombresDeLaGrille(max)
    .map((nombre) =>
      suite.includes(nombre)
        ? `text(fill: rgb("${orangeMathalea}"), weight: "bold")[$${nombre}$]`
        : `[$${nombre}$]`,
    )
    .join(', ')
  const grille = `#align(center, table(columns: ${nombresParLigne}, align: center + horizon, stroke: 0.5pt, inset: 6pt, ${cellules}))`
  if (suite.length === 0) return grille
  return `${grille}\n\n${texteSuite(suite, ' → ')}`
}

/** Accepte aussi bien un tableau qu'une chaîne JSON (reprise de session). */
function parseSuite(valeur: unknown): number[] {
  let brut: unknown = valeur
  if (typeof valeur === 'string') {
    try {
      brut = JSON.parse(valeur)
    } catch {
      return []
    }
  }
  if (!Array.isArray(brut)) return []
  return brut
    .map((element) => Math.round(Number(element)))
    .filter((nombre) => Number.isFinite(nombre))
}

export class JuniperGreenElement extends MathaleaCustomElement {
  static readonly elementTag = 'juniper-green'

  private nombresParLigne = PAR_LIGNE_PAR_DEFAUT
  private regles: ReglesJuniperGreen = {
    max: MAX_PAR_DEFAUT,
    debutPremierInterdit: false,
  }

  private suite: number[] = []
  /** Nombres de `suite` déjà dévoilés : toute la suite hors animation. */
  private nbAffiches = 0
  private animation = false
  private minuterie: number | null = null
  private avertissement = ''
  private cellules = new Map<number, HTMLButtonElement>()
  private zoneSuite: HTMLElement | null = null
  private zoneMessage: HTMLElement | null = null

  static create(options: JuniperGreenOptions = {}): string {
    const max = normaliseMax(options.max)
    const nombresParLigne = normaliseParLigne(options.nombresParLigne)
    const debutPremierInterdit = options.debutPremierInterdit ?? false
    const suite = options.suite ?? []
    const animation = options.animation ?? false
    if (context.isTypst) {
      return `<mathalea-typst>${renderTypstGrille(max, nombresParLigne, suite)}</mathalea-typst>`
    }
    if (!context.isHtml) {
      return renderLatexGrille(max, nombresParLigne, suite)
    }
    const id =
      options.id ??
      `${JuniperGreenElement.elementTag}Ex${options.numeroExercice ?? 0}Q${options.questionIndex ?? 0}`
    return super.create({
      id,
      max,
      nombresParLigne,
      debutPremierInterdit,
      suite,
      animation,
      interactivityOn: options.interactivityOn ?? true,
    })
  }

  connectedCallback(): void {
    this.hydrateCommonAttributes()
    this.nombresParLigne = normaliseParLigne(
      this.getAttribute('nombres-par-ligne'),
    )
    this.regles = {
      max: normaliseMax(this.getAttribute('max')),
      debutPremierInterdit:
        this.getAttribute('debut-premier-interdit') === 'true',
    }
    this.animation = this.getAttribute('animation') === 'true'
    this.construitInterface()
    this.update(this.getAttribute('suite'))
  }

  disconnectedCallback(): void {
    this.arreteAnimation()
    this.cellules.clear()
    this.zoneSuite = null
    this.zoneMessage = null
    this.innerHTML = ''
  }

  get value(): number[] {
    return [...this.suite]
  }

  set value(prochaineValeur: unknown) {
    this.update(prochaineValeur)
  }

  /** Rejoue la suite reçue coup par coup pour n'accepter qu'une partie licite. */
  update(prochaineValeur: unknown): void {
    this.arreteAnimation()
    this.suite = []
    for (const nombre of parseSuite(prochaineValeur)) {
      if (raisonDuRefus(this.suite, nombre, this.regles) !== null) break
      this.suite.push(nombre)
    }
    this.avertissement = ''
    if (this.animation && this.suite.length > 0) this.demarreAnimation()
    else this.nbAffiches = this.suite.length
    this.render()
  }

  /** Dévoile le premier nombre, puis les suivants une seconde par nombre. */
  private demarreAnimation(): void {
    this.nbAffiches = 1
    this.minuterie = window.setInterval(() => {
      if (this.nbAffiches >= this.suite.length) {
        this.arreteAnimation()
        return
      }
      this.nbAffiches += 1
      this.render()
    }, DELAI_ANIMATION_MS)
  }

  private arreteAnimation(): void {
    if (this.minuterie === null) return
    window.clearInterval(this.minuterie)
    this.minuterie = null
  }

  protected onInteractivityChanged(): void {
    this.render()
  }

  render(): string | void {
    if (!context.isHtml || context.isTypst) return this.renderLatex()
    this.rafraichitGrille()
    this.rafraichitSuite()
    this.rafraichitMessage()
    return ''
  }

  protected renderLatex(): string {
    return renderLatexGrille(
      this.regles.max,
      this.nombresParLigne,
      this.interactivityOn ? [] : this.suite,
    )
  }

  private get nombresAffiches(): number[] {
    return this.suite.slice(0, this.nbAffiches)
  }

  private get dernier(): number | undefined {
    return this.suite.at(-1)
  }

  private get partieTerminee(): boolean {
    if (this.suite.length === 0) return false
    return coupsPossibles(this.suite, this.regles).length === 0
  }

  /**
   * Toutes les longueurs sont en `em`, jamais en `rem` ni en classe Tailwind
   * de taille fixe : le zoom des vues prof, élève et TBI pose une `font-size`
   * en rem sur le conteneur de l'énoncé (voir `resizeContent()`), donc seul le
   * relatif suit l'agrandissement demandé par l'enseignant.
   */
  private construitInterface(): void {
    this.innerHTML = ''
    this.cellules.clear()
    this.classList.add('block', 'not-prose')
    this.style.margin = '1em 0'

    // Une grille agrandie par le zoom, ou large de 10 colonnes sur un écran
    // étroit, dépasse la colonne de l'énoncé : elle défile plutôt que d'être
    // rognée. Le padding laisse la place au liseré du dernier nombre joué.
    const cadre = document.createElement('div')
    cadre.style.maxWidth = '100%'
    cadre.style.overflowX = 'auto'
    cadre.style.padding = '0.2em'

    const grille = document.createElement('div')
    grille.className = 'grid w-fit'
    grille.style.gap = '0.25em'
    grille.style.gridTemplateColumns = `repeat(${this.nombresParLigne}, ${TAILLE_CASE})`
    for (const nombre of nombresDeLaGrille(this.regles.max)) {
      const cellule = document.createElement('button')
      cellule.type = 'button'
      cellule.dataset.nombre = String(nombre)
      cellule.textContent = String(nombre)
      cellule.className =
        'flex items-center justify-center rounded-md border ' +
        'border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest ' +
        'font-semibold leading-none'
      // Largeur et hauteur en em plutôt qu'un `aspect-ratio` déduit de la
      // colonne : les deux dimensions suivent alors directement le zoom.
      cellule.style.fontSize = '1em'
      cellule.style.width = TAILLE_CASE
      cellule.style.height = TAILLE_CASE
      cellule.addEventListener('click', this.clicCellule)
      grille.appendChild(cellule)
      this.cellules.set(nombre, cellule)
    }
    cadre.appendChild(grille)
    this.appendChild(cadre)

    this.zoneSuite = document.createElement('div')
    this.zoneSuite.className =
      'text-coopmaths-corpus dark:text-coopmathsdark-corpus'
    this.zoneSuite.style.marginTop = '1em'
    this.appendChild(this.zoneSuite)

    this.zoneMessage = document.createElement('div')
    this.zoneMessage.style.marginTop = '0.5em'
    this.zoneMessage.style.fontSize = '0.875em'
    this.zoneMessage.setAttribute('aria-live', 'polite')
    this.appendChild(this.zoneMessage)
  }

  private readonly clicCellule = (evenement: Event): void => {
    if (!this.interactivityOn || this.partieTerminee) return
    const cellule = evenement.currentTarget as HTMLButtonElement
    const nombre = Number(cellule.dataset.nombre)
    const refus = raisonDuRefus(this.suite, nombre, this.regles)
    if (refus === null) {
      this.avertissement = ''
      this.suite.push(nombre)
      this.nbAffiches = this.suite.length
    } else {
      this.avertissement = refus
    }
    this.render()
  }

  private rafraichitGrille(): void {
    const jouable = this.interactivityOn && !this.partieTerminee
    const affiches = this.nombresAffiches
    for (const [nombre, cellule] of this.cellules) {
      const utilise = affiches.includes(nombre)
      cellule.style.backgroundColor = utilise ? orangeMathalea : ''
      cellule.style.color = utilise ? '#ffffff' : ''
      cellule.style.cursor = jouable ? 'pointer' : 'default'
      cellule.style.outline =
        this.interactivityOn && nombre === this.dernier
          ? `2px solid ${orangeMathalea}`
          : ''
      cellule.style.outlineOffset =
        this.interactivityOn && nombre === this.dernier ? '2px' : ''
      cellule.setAttribute('aria-pressed', utilise ? 'true' : 'false')
      cellule.disabled = !jouable
    }
  }

  private rafraichitSuite(): void {
    if (!this.zoneSuite) return
    this.zoneSuite.textContent = texteSuite(this.nombresAffiches, ' → ')
  }

  private rafraichitMessage(): void {
    if (!this.zoneMessage) return
    // Dans la correction, la partie est donnée toute jouée : ni consigne de
    // coup suivant, ni annonce de fin de partie.
    if (!this.interactivityOn) {
      this.zoneMessage.textContent = ''
      return
    }
    if (this.partieTerminee) {
      const pluriel = this.suite.length > 1 ? 's' : ''
      this.zoneMessage.style.color = orangeMathalea
      this.zoneMessage.textContent =
        `Partie terminée : aucun multiple ni diviseur de ${this.dernier} n'est encore disponible. ` +
        `La suite compte ${this.suite.length} nombre${pluriel}.`
      return
    }
    if (this.avertissement !== '') {
      this.zoneMessage.style.color = orangeMathalea
      this.zoneMessage.textContent = this.avertissement
      return
    }
    this.zoneMessage.style.color = ''
    this.zoneMessage.textContent =
      this.dernier === undefined
        ? this.regles.debutPremierInterdit
          ? 'Choisissez un nombre pour commencer : il ne doit pas être un nombre premier.'
          : 'Choisissez un premier nombre.'
        : `Choisissez un multiple ou un diviseur de ${this.dernier}.`
  }
}

registerMathaleaCustomElement(JuniperGreenElement)

/** Helper d'injection depuis l'exercice. */
export function ajouteJuniperGreen(
  exercice: IExercice,
  questionIndex: number,
  options: JuniperGreenOptions = {},
): string {
  return JuniperGreenElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
  })
}
