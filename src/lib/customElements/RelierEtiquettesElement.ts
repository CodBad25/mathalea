import { context } from '../../modules/context'
import { toLatex } from '../interactif/relierEtiquettes/latexExport'
import { toTypst } from '../interactif/relierEtiquettes/typstExport'
import {
  cleLien,
  couleurLien,
  type EtiquetteRelier,
  type LienRelier,
  normaliseEtiquettes,
  parseEtiquettes,
  parseLiens,
  type RelierEtiquettesConfig,
} from '../interactif/relierEtiquettes/types'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type {
  EtiquetteRelier,
  LienRelier,
} from '../interactif/relierEtiquettes/types'

export type RelierEtiquettesOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  /** Étiquettes de la colonne de gauche (chaîne ou `{ id, texte }`). */
  gauche: (string | EtiquetteRelier)[]
  /** Étiquettes de la colonne de droite (chaîne ou `{ id, texte }`). */
  droite: (string | EtiquetteRelier)[]
  /** Liens déjà tracés : corrigé imprimé, correction affichée, copie restaurée. */
  liens?: LienRelier[]
  /** Autorise plusieurs liens par étiquette. Par défaut un lien en remplace un autre. */
  multiple?: boolean
  interactivityOn?: boolean
}

type Cote = 'gauche' | 'droite'

type Ancre = { x: number; y: number }

type EtatGlisser = {
  cote: Cote
  id: string
  pointerId: number
  depuisX: number
  depuisY: number
  aBouge: boolean
}

/** Distance (px) au-delà de laquelle un appui devient un glisser. */
const SEUIL_GLISSER = 8

const SVG_NS = 'http://www.w3.org/2000/svg'
const COULEUR_JUSTE = '#16a34a'
const COULEUR_FAUX = '#dc2626'

export class RelierEtiquettesElement extends MathaleaCustomElement {
  static readonly elementTag = 'relier-etiquettes'

  private gauche: EtiquetteRelier[] = []
  private droite: EtiquetteRelier[] = []
  private liens: LienRelier[] = []
  private multiple = false

  private board: HTMLDivElement | null = null
  private svg: SVGSVGElement | null = null
  private boutonEffacer: HTMLButtonElement | null = null
  private observateur: ResizeObserver | null = null

  private selection: { cote: Cote; id: string } | null = null
  private glisser: EtatGlisser | null = null
  /** Liens attendus, renseignés à la correction pour colorer les traits. */
  private attendus: LienRelier[] | null = null
  /** Clés des liens créés depuis le dernier tracé, à animer. */
  private aAnimer = new Set<string>()
  /** Étiquettes (`cote:id`) à faire clignoter au prochain rafraîchissement. */
  private aFlasher = new Set<string>()

  static create({
    id,
    numeroExercice = 0,
    questionIndex = 0,
    gauche,
    droite,
    liens = [],
    multiple = false,
    interactivityOn = true,
  }: RelierEtiquettesOptions): string {
    const config: RelierEtiquettesConfig = {
      gauche: normaliseEtiquettes(gauche, 'G'),
      droite: normaliseEtiquettes(droite, 'D'),
      liens,
      multiple,
    }
    if (!context.isHtml) return toLatex(config)
    if (context.isTypst) {
      // L'export Typst réutilise le rendu HTML (context.isHtml reste vrai),
      // mais ce web component ne peut pas être « rejoué » par htmlToTypst
      // (JS exécuté après montage dans le DOM). On insère donc directement le
      // code Typst via le marqueur <mathalea-typst>, reconnu tel quel par
      // htmlToTypst (latexToTypst.ts).
      return `<mathalea-typst>${toTypst(config)}</mathalea-typst>`
    }
    const elementId =
      id ??
      `${RelierEtiquettesElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const elementHtml = super.create({
      id: elementId,
      numeroExercice,
      questionIndex,
      gauche: config.gauche,
      droite: config.droite,
      liens: config.liens,
      multiple,
      interactivityOn,
    })
    if (elementHtml === '') return ''
    if (!interactivityOn) return elementHtml
    return `${elementHtml}<span id="resultatCheckEx${numeroExercice}Q${questionIndex}"></span><div id="feedbackEx${numeroExercice}Q${questionIndex}"></div>`
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    const elementId = `${RelierEtiquettesElement.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`
    const element = document.getElementById(
      elementId,
    ) as RelierEtiquettesElement | null
    const attendus = parseLiens(
      exercice.autoCorrection?.[questionIndex]?.valeur?.reponse?.value,
    )
    const donnes = element?.liensEleve ?? []

    exercice.answers ??= {}
    if (element != null) exercice.answers[elementId] = element.value

    const clesAttendues = new Set(attendus.map(cleLien))
    const nbJustes = donnes.filter((lien) =>
      clesAttendues.has(cleLien(lien)),
    ).length
    const isOk =
      nbJustes === attendus.length && donnes.length === attendus.length

    element?.montreCorrection(attendus)
    if (element != null) element.interactivityOn = false

    const resultatCheck = document.querySelector(
      `#resultatCheckEx${exercice.numeroExercice}Q${questionIndex}`,
    )
    if (resultatCheck != null) resultatCheck.innerHTML = isOk ? '😎' : '☹️'

    return {
      isOk,
      feedback: '',
      score: {
        nbBonnesReponses: nbJustes,
        nbReponses: Math.max(attendus.length, 1),
      },
    }
  }

  static formatStudentAnswer(rawAnswer: string, questionHtml?: string): string {
    const liens = parseLiens(rawAnswer)
    if (liens.length === 0) return 'aucun lien'
    const textes = new Map<string, string>()
    if (questionHtml != null && typeof document !== 'undefined') {
      const gabarit = document.createElement('template')
      gabarit.innerHTML = questionHtml
      const element = gabarit.content.querySelector(
        RelierEtiquettesElement.elementTag,
      )
      for (const attribut of ['gauche', 'droite']) {
        for (const etiquette of parseEtiquettes(
          element?.getAttribute(attribut),
        )) {
          textes.set(etiquette.id, etiquette.texte)
        }
      }
    }
    return liens
      .map(
        (lien) =>
          `${textes.get(lien.gauche) ?? lien.gauche} ↔ ${textes.get(lien.droite) ?? lien.droite}`,
      )
      .join(' ; ')
  }

  connectedCallback(): void {
    this.hydrateCommonAttributes()
    this.render()
  }

  disconnectedCallback(): void {
    this.observateur?.disconnect()
    this.observateur = null
  }

  render(): string | void {
    if (!context.isHtml || context.isTypst) return this.renderLatex()
    this.hydrateAttributes()
    this.construitDom()
    this.rafraichit()
  }

  protected renderLatex(): string {
    this.hydrateAttributes()
    return toLatex(this.config)
  }

  /** Configuration courante, utilisable par les exports LaTeX et Typst. */
  get config(): RelierEtiquettesConfig {
    return {
      gauche: this.gauche,
      droite: this.droite,
      liens: this.liens,
      multiple: this.multiple,
    }
  }

  /** Liens tracés par l'élève. */
  get liensEleve(): LienRelier[] {
    return this.liens.map((lien) => ({ ...lien }))
  }

  get value(): string {
    return JSON.stringify(this.liens)
  }

  set value(nextValue: string | LienRelier[]) {
    this.update(nextValue)
  }

  /** Applique un état restaurable (liens tracés) et redessine. */
  update(nextValue: string | LienRelier[]): void {
    const idsGauche = new Set(this.gauche.map((etiquette) => etiquette.id))
    const idsDroite = new Set(this.droite.map((etiquette) => etiquette.id))
    this.liens = parseLiens(nextValue).filter(
      (lien) => idsGauche.has(lien.gauche) && idsDroite.has(lien.droite),
    )
    this.selection = null
    this.rafraichit()
  }

  /**
   * Colore les traits en fonction des liens attendus : vert pour un lien juste,
   * rouge pour un lien faux, pointillés verts pour un lien manquant.
   */
  montreCorrection(attendus: LienRelier[]): void {
    this.attendus = attendus
    this.selection = null
    this.rafraichit()
  }

  protected onInteractivityChanged(isOn: boolean): void {
    if (!isOn) {
      this.selection = null
      this.glisser = null
    }
    this.rafraichit()
  }

  // === Construction du DOM ===

  private hydrateAttributes(): void {
    this.gauche = parseEtiquettes(this.getAttribute('gauche'))
    this.droite = parseEtiquettes(this.getAttribute('droite'))
    const idsGauche = new Set(this.gauche.map((etiquette) => etiquette.id))
    const idsDroite = new Set(this.droite.map((etiquette) => etiquette.id))
    this.liens = parseLiens(this.getAttribute('liens')).filter(
      (lien) => idsGauche.has(lien.gauche) && idsDroite.has(lien.droite),
    )
    this.multiple = this.getAttribute('multiple') === 'true'
  }

  private construitDom(): void {
    this.replaceChildren()
    const racine = document.createElement('div')
    racine.className = 'relier-etiquettes'

    const board = document.createElement('div')
    board.className = 'relier-etiquettes__board'
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('class', 'relier-etiquettes__traits')
    svg.setAttribute('aria-hidden', 'true')
    board.appendChild(svg)
    board.appendChild(this.construitColonne('gauche'))
    board.appendChild(this.construitColonne('droite'))
    racine.appendChild(board)

    const actions = document.createElement('div')
    actions.className = 'relier-etiquettes__actions'
    const effacer = document.createElement('button')
    effacer.type = 'button'
    effacer.className = 'relier-etiquettes__effacer'
    effacer.textContent = 'Effacer les traits'
    effacer.addEventListener('click', () => {
      if (!this.interactivityOn) return
      this.liens = []
      this.selection = null
      this.rafraichit()
    })
    actions.appendChild(effacer)
    racine.appendChild(actions)

    this.appendChild(racine)
    this.board = board
    this.svg = svg
    this.boutonEffacer = effacer

    this.observateur?.disconnect()
    if (typeof ResizeObserver !== 'undefined') {
      this.observateur = new ResizeObserver(() => this.dessineTraits())
      this.observateur.observe(board)
    }
  }

  private construitColonne(cote: Cote): HTMLDivElement {
    const colonne = document.createElement('div')
    colonne.className = `relier-etiquettes__colonne relier-etiquettes__colonne--${cote}`
    const etiquettes = cote === 'gauche' ? this.gauche : this.droite
    for (const etiquette of etiquettes) {
      colonne.appendChild(this.construitEtiquette(cote, etiquette))
    }
    return colonne
  }

  private construitEtiquette(
    cote: Cote,
    etiquette: EtiquetteRelier,
  ): HTMLButtonElement {
    const bouton = document.createElement('button')
    bouton.type = 'button'
    bouton.className = 'relier-etiquettes__etiquette'
    bouton.dataset.cote = cote
    bouton.dataset.etiquette = etiquette.id
    const contenu = document.createElement('span')
    contenu.className = 'relier-etiquettes__contenu'
    // textContent et non innerHTML : le contenu d'une étiquette est du texte
    // mêlé de LaTeX entre `$` (rendu ensuite par KaTeX), et une inégalité comme
    // `$n<0$` serait interprétée comme une balise ouvrante par le parseur HTML.
    contenu.textContent = etiquette.texte
    bouton.appendChild(contenu)
    const prise = document.createElement('span')
    prise.className = 'relier-etiquettes__prise'
    bouton.appendChild(prise)

    bouton.addEventListener('pointerdown', this.onPointerDown)
    bouton.addEventListener('pointermove', this.onPointerMove)
    bouton.addEventListener('pointerup', this.onPointerUp)
    bouton.addEventListener('pointercancel', this.onPointerCancel)
    // Activation au clavier : le clic n'est alors pas issu d'un pointeur.
    bouton.addEventListener('click', (event) => {
      if (event.detail !== 0) return
      if (!this.interactivityOn) return
      this.appuie(cote, etiquette.id)
    })
    return bouton
  }

  // === Interactions ===

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.interactivityOn) return
    const bouton = event.currentTarget as HTMLButtonElement
    const cote = bouton.dataset.cote as Cote
    const id = bouton.dataset.etiquette ?? ''
    this.glisser = {
      cote,
      id,
      pointerId: event.pointerId,
      depuisX: event.clientX,
      depuisY: event.clientY,
      aBouge: false,
    }
    bouton.setPointerCapture?.(event.pointerId)
  }

  private onPointerMove = (event: PointerEvent): void => {
    const glisser = this.glisser
    if (glisser == null || glisser.pointerId !== event.pointerId) return
    if (!glisser.aBouge) {
      const distance = Math.hypot(
        event.clientX - glisser.depuisX,
        event.clientY - glisser.depuisY,
      )
      if (distance < SEUIL_GLISSER) return
      glisser.aBouge = true
      this.board?.classList.add('is-glisse')
    }
    this.dessineTraitProvisoire(glisser, event.clientX, event.clientY)
    this.surligneCible(glisser, event.clientX, event.clientY)
  }

  private onPointerUp = (event: PointerEvent): void => {
    const glisser = this.glisser
    if (glisser == null || glisser.pointerId !== event.pointerId) return
    const bouton = event.currentTarget as HTMLButtonElement
    bouton.releasePointerCapture?.(event.pointerId)
    this.glisser = null
    this.board?.classList.remove('is-glisse')
    if (!glisser.aBouge) {
      this.appuie(glisser.cote, glisser.id)
      return
    }
    const cible = this.etiquetteSousLePointeur(event.clientX, event.clientY)
    if (cible != null && cible.cote !== glisser.cote) {
      this.basculeLien(glisser.cote, glisser.id, cible.id)
    }
    this.selection = null
    this.rafraichit()
  }

  private onPointerCancel = (event: PointerEvent): void => {
    if (this.glisser?.pointerId !== event.pointerId) return
    this.glisser = null
    this.board?.classList.remove('is-glisse')
    this.rafraichit()
  }

  /** Appui simple (souris, doigt ou clavier) sur une étiquette. */
  private appuie(cote: Cote, id: string): void {
    const selection = this.selection
    if (selection == null) {
      this.selection = { cote, id }
    } else if (selection.cote === cote) {
      this.selection = selection.id === id ? null : { cote, id }
    } else {
      this.basculeLien(selection.cote, selection.id, id)
      this.selection = null
    }
    this.rafraichit()
  }

  /** Crée le lien s'il n'existe pas, le supprime sinon. */
  private basculeLien(
    coteDepart: Cote,
    idDepart: string,
    idArrivee: string,
  ): void {
    const gauche = coteDepart === 'gauche' ? idDepart : idArrivee
    const droite = coteDepart === 'gauche' ? idArrivee : idDepart
    const cle = cleLien({ gauche, droite })
    const existant = this.liens.findIndex((lien) => cleLien(lien) === cle)
    if (existant !== -1) {
      this.liens.splice(existant, 1)
      return
    }
    if (!this.multiple) {
      this.liens = this.liens.filter(
        (lien) => lien.gauche !== gauche && lien.droite !== droite,
      )
    }
    this.liens.push({ gauche, droite })
    this.aAnimer.add(cle)
    this.aFlasher.add(`gauche:${gauche}`)
    this.aFlasher.add(`droite:${droite}`)
  }

  private etiquetteSousLePointeur(
    clientX: number,
    clientY: number,
  ): { cote: Cote; id: string } | null {
    const cible = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('.relier-etiquettes__etiquette')
    if (cible == null || !this.contains(cible)) return null
    return {
      cote: cible.dataset.cote as Cote,
      id: cible.dataset.etiquette ?? '',
    }
  }

  // === Rendu ===

  private rafraichit(): void {
    if (this.board == null) return
    const relies = new Set<string>()
    for (const lien of this.liens) {
      relies.add(`gauche:${lien.gauche}`)
      relies.add(`droite:${lien.droite}`)
    }
    for (const bouton of this.querySelectorAll<HTMLButtonElement>(
      '.relier-etiquettes__etiquette',
    )) {
      const cote = bouton.dataset.cote as Cote
      const id = bouton.dataset.etiquette ?? ''
      const estSelectionnee =
        this.selection?.cote === cote && this.selection.id === id
      bouton.classList.toggle('is-selected', estSelectionnee)
      bouton.classList.toggle('is-reliee', relies.has(`${cote}:${id}`))
      bouton.classList.toggle(
        'is-cible',
        this.selection != null && this.selection.cote !== cote,
      )
      // Le survol n'existe que pendant un glisser : il est toujours effacé ici.
      bouton.classList.remove('is-survolee')
      bouton.setAttribute('aria-pressed', estSelectionnee ? 'true' : 'false')
      bouton.disabled = !this.interactivityOn
      if (this.aFlasher.has(`${cote}:${id}`)) {
        bouton.classList.add('is-flash')
        globalThis.setTimeout(() => bouton.classList.remove('is-flash'), 600)
      }
    }
    this.aFlasher.clear()
    this.board.classList.toggle('is-inerte', !this.interactivityOn)
    if (this.boutonEffacer != null) {
      this.boutonEffacer.hidden =
        !this.interactivityOn || this.liens.length === 0
    }
    this.dessineTraits()
  }

  private ancre(cote: Cote, id: string): Ancre | null {
    if (this.board == null) return null
    const bouton = this.querySelector<HTMLElement>(
      `.relier-etiquettes__etiquette[data-cote="${cote}"][data-etiquette="${echappeValeurAttribut(id)}"]`,
    )
    if (bouton == null) return null
    const rectBoard = this.board.getBoundingClientRect()
    const rect = bouton.getBoundingClientRect()
    return {
      x: (cote === 'gauche' ? rect.right : rect.left) - rectBoard.left,
      y: rect.top + rect.height / 2 - rectBoard.top,
    }
  }

  private dessineTraits(): void {
    const svg = this.svg
    const board = this.board
    if (svg == null || board == null) return
    const largeur = board.clientWidth
    const hauteur = board.clientHeight
    svg.setAttribute('viewBox', `0 0 ${largeur} ${hauteur}`)
    svg.replaceChildren()

    const indexGauche = new Map(this.gauche.map((item, i) => [item.id, i]))
    const clesDonnees = new Set(this.liens.map(cleLien))
    const clesAttendues = new Set((this.attendus ?? []).map(cleLien))

    for (const lien of this.liens) {
      const depart = this.ancre('gauche', lien.gauche)
      const arrivee = this.ancre('droite', lien.droite)
      if (depart == null || arrivee == null) continue
      const cle = cleLien(lien)
      let couleur = couleurLien(indexGauche.get(lien.gauche) ?? 0)
      let etat = ''
      if (this.attendus != null) {
        const juste = clesAttendues.has(cle)
        couleur = juste ? COULEUR_JUSTE : COULEUR_FAUX
        etat = juste ? 'is-juste' : 'is-faux'
      }
      if (this.interactivityOn && this.attendus == null) {
        svg.appendChild(this.creeZoneClic(depart, arrivee, lien))
      }
      svg.appendChild(
        this.creeTrait(depart, arrivee, couleur, etat, this.aAnimer.has(cle)),
      )
    }

    for (const lien of this.attendus ?? []) {
      if (clesDonnees.has(cleLien(lien))) continue
      const depart = this.ancre('gauche', lien.gauche)
      const arrivee = this.ancre('droite', lien.droite)
      if (depart == null || arrivee == null) continue
      svg.appendChild(
        this.creeTrait(depart, arrivee, COULEUR_JUSTE, 'is-manquant', false),
      )
    }

    this.aAnimer.clear()
  }

  private creeTrait(
    depart: Ancre,
    arrivee: Ancre,
    couleur: string,
    etat: string,
    anime: boolean,
  ): SVGLineElement {
    const trait = document.createElementNS(SVG_NS, 'line')
    trait.setAttribute(
      'class',
      ['relier-etiquettes__trait', etat, anime ? 'is-nouveau' : '']
        .filter(Boolean)
        .join(' '),
    )
    trait.setAttribute('x1', `${depart.x}`)
    trait.setAttribute('y1', `${depart.y}`)
    trait.setAttribute('x2', `${arrivee.x}`)
    trait.setAttribute('y2', `${arrivee.y}`)
    trait.setAttribute('stroke', couleur)
    if (anime) {
      const longueur = Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y)
      trait.style.setProperty('--relier-longueur', `${longueur}`)
    }
    return trait
  }

  /** Trait transparent plus épais : cible de clic pour supprimer un lien. */
  private creeZoneClic(
    depart: Ancre,
    arrivee: Ancre,
    lien: LienRelier,
  ): SVGLineElement {
    const zone = document.createElementNS(SVG_NS, 'line')
    zone.setAttribute('class', 'relier-etiquettes__zone-trait')
    zone.setAttribute('x1', `${depart.x}`)
    zone.setAttribute('y1', `${depart.y}`)
    zone.setAttribute('x2', `${arrivee.x}`)
    zone.setAttribute('y2', `${arrivee.y}`)
    zone.addEventListener('click', () => {
      if (!this.interactivityOn) return
      const cle = cleLien(lien)
      this.liens = this.liens.filter((autre) => cleLien(autre) !== cle)
      this.selection = null
      this.rafraichit()
    })
    return zone
  }

  private dessineTraitProvisoire(
    glisser: EtatGlisser,
    clientX: number,
    clientY: number,
  ): void {
    const svg = this.svg
    const board = this.board
    if (svg == null || board == null) return
    const depart = this.ancre(glisser.cote, glisser.id)
    if (depart == null) return
    const rectBoard = board.getBoundingClientRect()
    let trait = svg.querySelector<SVGLineElement>(
      '.relier-etiquettes__trait--provisoire',
    )
    if (trait == null) {
      trait = document.createElementNS(SVG_NS, 'line')
      trait.setAttribute(
        'class',
        'relier-etiquettes__trait relier-etiquettes__trait--provisoire',
      )
      svg.appendChild(trait)
    }
    trait.setAttribute('x1', `${depart.x}`)
    trait.setAttribute('y1', `${depart.y}`)
    trait.setAttribute('x2', `${clientX - rectBoard.left}`)
    trait.setAttribute('y2', `${clientY - rectBoard.top}`)
  }

  private surligneCible(
    glisser: EtatGlisser,
    clientX: number,
    clientY: number,
  ): void {
    const survolee = this.etiquetteSousLePointeur(clientX, clientY)
    for (const bouton of this.querySelectorAll<HTMLButtonElement>(
      '.relier-etiquettes__etiquette',
    )) {
      const cote = bouton.dataset.cote as Cote
      const id = bouton.dataset.etiquette ?? ''
      bouton.classList.toggle('is-cible', cote !== glisser.cote)
      bouton.classList.toggle(
        'is-survolee',
        survolee != null &&
          survolee.cote === cote &&
          survolee.id === id &&
          cote !== glisser.cote,
      )
      bouton.classList.toggle(
        'is-selected',
        cote === glisser.cote && id === glisser.id,
      )
    }
  }
}

/**
 * Helper d'injection dans un exercice.
 *
 * La réponse attendue se renseigne avec `handleAnswers(exercice, questionIndex,
 * { reponse: { value: JSON.stringify(liensAttendus) } }, { formatInteractif:
 * 'relier-etiquettes' })`.
 */
export function addRelierEtiquettes(
  exercice: IExercice,
  questionIndex: number,
  options: Omit<RelierEtiquettesOptions, 'numeroExercice' | 'questionIndex'>,
): string {
  return RelierEtiquettesElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
  })
}

/** Échappe une valeur insérée dans un sélecteur d'attribut entre guillemets. */
function echappeValeurAttribut(valeur: string): string {
  return valeur.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

registerMathaleaCustomElement(RelierEtiquettesElement)
