import { get, writable } from 'svelte/store'
import { exercicesParams, moveExercice } from './generalStore'
import { isLocalStorageAvailable } from './storage'

/**
 * État de la vue TBI (vidéoprojection).
 *
 * - Le mode d'affichage, le nombre de colonnes, les sauts de colonne,
 *   la répartition des onglets et la disposition de chaque onglet sont
 *   partageables : ils sont sérialisés dans l'URL (paramètre tbiParam)
 *   par la vue TBI elle-même via tbiParamStore.
 * - Les positions/tailles du mode libre et la position du widget horloge
 *   dépendent de l'écran : elles sont sauvegardées en localStorage.
 */

export type TbiMode = 'list' | 'columns' | 'free' | 'tabs'
/** Disposition interne d'un onglet */
export type TbiTabLayout = 'list' | 'columns' | 'free'

export const TBI_BASE_WIDTH = 600
export const TBI_MIN_ZOOM = 0.4
export const TBI_MAX_ZOOM = 3

export const TBI_WIDGET_MIN_ZOOM = 0.5
export const TBI_WIDGET_MAX_ZOOM = 2.5

/** Bornes de largeur de carte en mode libre, indépendantes du zoom */
export const TBI_MIN_CARD_WIDTH = 240
export const TBI_MAX_CARD_WIDTH = 1800

export interface TbiCardState {
  /** Zoom d'affichage du contenu (indépendant de la largeur en mode libre) */
  zoom: number
  /** Position et largeur en px dans le canvas du mode libre */
  x: number
  y: number
  w: number
  /** Indice de l'onglet auquel appartient l'exercice (mode onglets), maintenu compact (0..k-1) */
  tab: number
  /** Saut de colonne avant cet exercice (dispositions en colonnes) */
  colBreak: boolean
  /** uuid de l'exercice actuellement affiché à cet indice, pour détecter un remplacement */
  uuid?: string
}

export interface TbiTabConfig {
  layout: TbiTabLayout
  nbColumns: number
}

export interface TbiWidgetState {
  visible: boolean
  mode: 'clock' | 'timer' | 'stopwatch'
  x: number
  y: number
  zoom: number
}

export interface TbiState {
  mode: TbiMode
  nbColumns: number
  /** Aligné par indice sur exercicesParams */
  cards: TbiCardState[]
  /** Disposition de chaque onglet, indexée par indice compact d'onglet */
  tabConfigs: TbiTabConfig[]
  widget: TbiWidgetState
}

export function defaultTbiCardState(index: number): TbiCardState {
  return {
    zoom: 1,
    // cascade décalée pour que les cartes ne se recouvrent pas totalement
    x: 40 + (index % 3) * 80,
    y: 40 + index * 100,
    w: TBI_BASE_WIDTH,
    tab: index,
    colBreak: false,
  }
}

export function defaultTbiTabConfig(): TbiTabConfig {
  return { layout: 'list', nbColumns: 2 }
}

export function defaultTbiState(): TbiState {
  return {
    mode: 'list',
    nbColumns: 2,
    cards: [],
    tabConfigs: [],
    widget: { visible: false, mode: 'clock', x: 0, y: 0, zoom: 1 },
  }
}

export const tbiState = writable<TbiState>(defaultTbiState())

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function clampZoom(zoom: number): number {
  return clamp(zoom, TBI_MIN_ZOOM, TBI_MAX_ZOOM)
}

function clampWidgetZoom(zoom: number): number {
  return clamp(zoom, TBI_WIDGET_MIN_ZOOM, TBI_WIDGET_MAX_ZOOM)
}

/** Fait varier le zoom du widget horloge/minuteur/chronomètre de `delta` */
export function zoomWidgetBy(delta: number) {
  tbiState.update((state) => {
    state.widget.zoom = clampWidgetZoom(state.widget.zoom + delta)
    return state
  })
}

/** Complète tabConfigs pour couvrir tous les onglets utilisés */
function ensureTabConfigs(state: TbiState) {
  const tabsCount = new Set(state.cards.map((card) => card.tab)).size
  while (state.tabConfigs.length < tabsCount) {
    state.tabConfigs.push(defaultTbiTabConfig())
  }
  state.tabConfigs.length = Math.max(tabsCount, 0)
}

/**
 * Aligne cards sur la liste d'exercices (identifiée par uuid) : étend avec
 * des valeurs par défaut, tronque le surplus, ramène les onglets hors
 * bornes dans [0, count - 1], et réinitialise (zoom, position, taille)
 * toute carte dont l'exercice à cet indice a été remplacé par un autre
 * (édition de la sélection hors de la vue TBI) pour ne pas hériter du
 * zoom/de la position d'un exercice sans rapport.
 */
export function reconcileTbiCards(uuids: string[]) {
  const count = uuids.length
  tbiState.update((state) => {
    const cards = state.cards.slice(0, count)
    while (cards.length < count) {
      cards.push(defaultTbiCardState(cards.length))
    }
    cards.forEach((card, i) => {
      if (card.uuid !== undefined && card.uuid !== uuids[i]) {
        cards[i] = defaultTbiCardState(i)
      }
      cards[i].uuid = uuids[i]
    })
    for (const card of cards) {
      if (card.tab < 0 || card.tab >= count) {
        card.tab = cards.indexOf(card)
      }
    }
    state.cards = cards
    ensureTabConfigs(state)
    return state
  })
}

/**
 * Déplace un exercice vers un onglet désigné par son indice compact
 * (0..n-1 dans l'ordre d'affichage), n valant « nouvel onglet ».
 * Les valeurs de tab sont ensuite renumérotées 0..k-1 (les onglets vides
 * sont élagués) et tabConfigs suit la renumérotation.
 */
export function moveCardToTab(paramsIndex: number, targetCompactTab: number) {
  tbiState.update((state) => {
    const card = state.cards[paramsIndex]
    if (!card) return state
    const used = [...new Set(state.cards.map((c) => c.tab))].sort(
      (a, b) => a - b,
    )
    card.tab =
      targetCompactTab < used.length
        ? used[targetCompactTab]
        : Math.max(...used) + 1
    const usedAfter = [...new Set(state.cards.map((c) => c.tab))].sort(
      (a, b) => a - b,
    )
    // les configurations d'onglet suivent la renumérotation ; un nouvel
    // onglet reçoit la configuration par défaut
    state.tabConfigs = usedAfter.map((oldTab) => {
      const oldCompact = used.indexOf(oldTab)
      return oldCompact >= 0
        ? (state.tabConfigs[oldCompact] ?? defaultTbiTabConfig())
        : defaultTbiTabConfig()
    })
    for (const c of state.cards) {
      c.tab = usedAfter.indexOf(c.tab)
    }
    return state
  })
}

/**
 * Déplace un exercice de la position from à la position to (sémantique
 * splice : l'ordre relatif des autres exercices est préservé). Réordonne
 * exercicesParams (l'ordre canonique, persisté dans l'URL) et les états
 * de carte associés.
 * @returns true si un déplacement a eu lieu
 */
export function reorderTbiCard(from: number, to: number): boolean {
  const params = get(exercicesParams)
  if (from === to || from < 0 || to < 0) return false
  if (from >= params.length || to >= params.length) return false
  exercicesParams.update((list) => moveExercice(list, from, to))
  tbiState.update((state) => {
    state.cards.splice(to, 0, state.cards.splice(from, 1)[0])
    return state
  })
  return true
}

/**
 * Supprime un exercice : retire son entrée de exercicesParams (source
 * canonique, persistée dans l'URL) ainsi que l'état de carte associé.
 * Les onglets sont ensuite renumérotés (0..k-1) comme moveCardToTab.
 */
export function deleteTbiCard(paramsIndex: number) {
  const params = get(exercicesParams)
  if (paramsIndex < 0 || paramsIndex >= params.length) return
  exercicesParams.update((list) => [
    ...list.slice(0, paramsIndex),
    ...list.slice(paramsIndex + 1),
  ])
  tbiState.update((state) => {
    state.cards.splice(paramsIndex, 1)
    // card.tab est déjà un indice compact (0..k-1) aligné sur tabConfigs ;
    // la suppression peut vider un onglet, d'où la renumérotation.
    const usedAfter = [...new Set(state.cards.map((c) => c.tab))].sort(
      (a, b) => a - b,
    )
    state.tabConfigs = usedAfter.map(
      (oldCompact) => state.tabConfigs[oldCompact] ?? defaultTbiTabConfig(),
    )
    for (const c of state.cards) {
      c.tab = usedAfter.indexOf(c.tab)
    }
    return state
  })
}

/** Partie partageable de l'état (sérialisée dans l'URL) */
export interface TbiSharedState {
  mode: TbiMode
  nbColumns: number
  tabs: number[]
  breaks: number[]
  tabConfigs: TbiTabConfig[]
}

export function getTbiSharedState(state: TbiState): TbiSharedState {
  return {
    mode: state.mode,
    nbColumns: state.nbColumns,
    tabs: state.cards.map((card) => card.tab),
    breaks: state.cards.flatMap((card, i) => (card.colBreak ? [i] : [])),
    tabConfigs: state.tabConfigs.map((config) => ({ ...config })),
  }
}

const TBI_MODES: TbiMode[] = ['list', 'columns', 'free', 'tabs']
const TBI_TAB_LAYOUTS: TbiTabLayout[] = ['list', 'columns', 'free']

export function applyTbiSharedState(shared: Partial<TbiSharedState>) {
  tbiState.update((state) => {
    if (shared.mode !== undefined && TBI_MODES.includes(shared.mode)) {
      state.mode = shared.mode
    }
    if (
      typeof shared.nbColumns === 'number' &&
      shared.nbColumns >= 2 &&
      shared.nbColumns <= 4
    ) {
      state.nbColumns = Math.round(shared.nbColumns)
    }
    if (Array.isArray(shared.tabs)) {
      shared.tabs.forEach((tab, i) => {
        if (state.cards[i] && typeof tab === 'number') {
          state.cards[i].tab = tab
        }
      })
    }
    if (Array.isArray(shared.breaks)) {
      state.cards.forEach((card, i) => {
        card.colBreak = shared.breaks!.includes(i)
      })
    }
    if (Array.isArray(shared.tabConfigs)) {
      state.tabConfigs = shared.tabConfigs.map((config) => ({
        layout: TBI_TAB_LAYOUTS.includes(config?.layout)
          ? config.layout
          : 'list',
        nbColumns:
          typeof config?.nbColumns === 'number' &&
          config.nbColumns >= 2 &&
          config.nbColumns <= 4
            ? Math.round(config.nbColumns)
            : 2,
      }))
    }
    ensureTabConfigs(state)
    return state
  })
}

/** Partie locale de l'état (positions dépendantes de l'écran, en localStorage) */
interface TbiLocalLayout {
  cards: { x: number; y: number; w: number; zoom: number }[]
  widget: { x: number; y: number; zoom: number }
}

function tbiStorageKey(uuids: string[]): string {
  return `tbiLayout:${uuids.join(',')}`
}

export function saveTbiLocalLayout(uuids: string[]) {
  if (!isLocalStorageAvailable()) return
  const state = get(tbiState)
  const layout: TbiLocalLayout = {
    cards: state.cards.map(({ x, y, w, zoom }) => ({ x, y, w, zoom })),
    widget: { x: state.widget.x, y: state.widget.y, zoom: state.widget.zoom },
  }
  try {
    window.localStorage.setItem(tbiStorageKey(uuids), JSON.stringify(layout))
  } catch {
    // stockage plein ou indisponible : sans conséquence
  }
}

export function loadTbiLocalLayout(uuids: string[]) {
  if (!isLocalStorageAvailable()) return
  let layout: TbiLocalLayout
  try {
    const saved = window.localStorage.getItem(tbiStorageKey(uuids))
    if (saved == null) return
    layout = JSON.parse(saved)
  } catch {
    return
  }
  tbiState.update((state) => {
    if (Array.isArray(layout.cards)) {
      layout.cards.forEach((card, i) => {
        if (
          state.cards[i] &&
          typeof card?.x === 'number' &&
          typeof card?.y === 'number' &&
          typeof card?.w === 'number'
        ) {
          state.cards[i].x = card.x
          state.cards[i].y = card.y
          state.cards[i].w = card.w
          // rétrocompatibilité : anciennes sauvegardes sans zoom propre,
          // où la largeur pilotait encore le zoom
          state.cards[i].zoom =
            typeof card.zoom === 'number'
              ? clampZoom(card.zoom)
              : clampZoom(Math.round((card.w / TBI_BASE_WIDTH) * 100) / 100)
        }
      })
    }
    if (
      typeof layout.widget?.x === 'number' &&
      typeof layout.widget?.y === 'number'
    ) {
      state.widget.x = layout.widget.x
      state.widget.y = layout.widget.y
    }
    if (typeof layout.widget?.zoom === 'number') {
      state.widget.zoom = clampWidgetZoom(layout.widget.zoom)
    }
    return state
  })
}
