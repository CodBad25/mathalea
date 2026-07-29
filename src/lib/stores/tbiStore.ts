import { get, writable } from 'svelte/store'
import { exercicesParams, moveExercice } from './generalStore'
import { isLocalStorageAvailable } from './storage'

/**
 * État de la vue TBI (vidéoprojection).
 *
 * - Le mode d'affichage, le nombre de colonnes, les sauts de colonne,
 *   la répartition des onglets, la disposition de chaque onglet, la
 *   visibilité et la position des widgets (horloge, feu tricolore) et le
 *   zoom de chaque exercice sont partageables : ils sont sérialisés dans
 *   l'URL (paramètre tbiParam) par la vue TBI elle-même via tbiParamStore.
 * - Les positions/tailles du mode libre et la taille des widgets dépendent
 *   de l'écran : elles sont sauvegardées en localStorage. Au chargement,
 *   l'URL (si présente) est appliquée après le localStorage pour que la
 *   position partagée d'un widget prenne le pas sur la sauvegarde locale.
 */

export type TbiMode = 'columns' | 'free' | 'tabs'
/** Disposition interne d'un onglet */
export type TbiTabLayout = 'columns' | 'free'

export const TBI_BASE_WIDTH = 600
export const TBI_MIN_ZOOM = 0.4
export const TBI_MAX_ZOOM = 3

export const TBI_WIDGET_MIN_ZOOM = 0.5
export const TBI_WIDGET_MAX_ZOOM = 2.5

export const TBI_TRAFFIC_LIGHT_MIN_W = 90
export const TBI_TRAFFIC_LIGHT_MAX_W = 500
export const TBI_TRAFFIC_LIGHT_MIN_H = 220
export const TBI_TRAFFIC_LIGHT_MAX_H = 1200

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

export type TbiTrafficLightColor = 'red' | 'orange' | 'green'

export interface TbiTrafficLightState {
  visible: boolean
  active: TbiTrafficLightColor
  x: number
  y: number
  w: number
  h: number
}

export interface TbiState {
  mode: TbiMode
  nbColumns: number
  /** Aligné par indice sur exercicesParams */
  cards: TbiCardState[]
  /** Disposition de chaque onglet, indexée par indice compact d'onglet */
  tabConfigs: TbiTabConfig[]
  widget: TbiWidgetState
  trafficLight: TbiTrafficLightState
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
  return { layout: 'columns', nbColumns: 1 }
}

export function defaultTbiState(): TbiState {
  return {
    mode: 'columns',
    nbColumns: 1,
    cards: [],
    tabConfigs: [],
    widget: { visible: false, mode: 'clock', x: 0, y: 0, zoom: 1 },
    trafficLight: {
      visible: false,
      active: 'red',
      x: 0,
      y: 0,
      w: 130,
      h: 340,
    },
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

function clampTrafficLightWidth(w: number): number {
  return clamp(w, TBI_TRAFFIC_LIGHT_MIN_W, TBI_TRAFFIC_LIGHT_MAX_W)
}

function clampTrafficLightHeight(h: number): number {
  return clamp(h, TBI_TRAFFIC_LIGHT_MIN_H, TBI_TRAFFIC_LIGHT_MAX_H)
}

/** Fait varier le zoom du widget horloge/minuteur/chronomètre de `delta` */
export function zoomWidgetBy(delta: number) {
  tbiState.update((state) => {
    state.widget.zoom = clampWidgetZoom(state.widget.zoom + delta)
    return state
  })
}

/** Fait varier le zoom de tous les exercices de `delta` en même temps */
export function zoomAllCardsBy(delta: number) {
  tbiState.update((state) => {
    for (const card of state.cards) {
      card.zoom = clampZoom(card.zoom + delta)
    }
    return state
  })
}

/** Change la couleur éclairée du widget feu tricolore */
export function setTrafficLightActive(color: TbiTrafficLightColor) {
  tbiState.update((state) => {
    state.trafficLight.active = color
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
 * Répartit équitablement (par nombre d'exercices) les sauts de colonne sur
 * `paramsIndices` (ordre d'affichage) pour `nbColumns` colonnes : écrase les
 * sauts existants sur ces indices par la répartition par défaut. Le
 * professeur peut ensuite désactiver individuellement un saut (bouton sur la
 * carte).
 */
export function balanceColumnBreaks(paramsIndices: number[], nbColumns: number) {
  const n = paramsIndices.length
  const breakPositions = new Set<number>()
  for (let k = 1; k < nbColumns; k++) {
    const position = Math.round((k * n) / nbColumns)
    if (position > 0 && position < n) breakPositions.add(position)
  }
  tbiState.update((state) => {
    paramsIndices.forEach((paramsIndex, position) => {
      const card = state.cards[paramsIndex]
      if (card) card.colBreak = breakPositions.has(position)
    })
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
  widgetVisible: boolean
  trafficLightVisible: boolean
  /** Zoom de chaque exercice, aligné par indice sur exercicesParams */
  zooms: number[]
  widgetX: number
  widgetY: number
  trafficLightX: number
  trafficLightY: number
}

export function getTbiSharedState(state: TbiState): TbiSharedState {
  return {
    mode: state.mode,
    nbColumns: state.nbColumns,
    tabs: state.cards.map((card) => card.tab),
    breaks: state.cards.flatMap((card, i) => (card.colBreak ? [i] : [])),
    tabConfigs: state.tabConfigs.map((config) => ({ ...config })),
    widgetVisible: state.widget.visible,
    trafficLightVisible: state.trafficLight.visible,
    zooms: state.cards.map((card) => card.zoom),
    widgetX: state.widget.x,
    widgetY: state.widget.y,
    trafficLightX: state.trafficLight.x,
    trafficLightY: state.trafficLight.y,
  }
}

const TBI_MODES: TbiMode[] = ['columns', 'free', 'tabs']
const TBI_TAB_LAYOUTS: TbiTabLayout[] = ['columns', 'free']

/**
 * Encodage lisible du tbiParam (paramètre d'URL partageable), pensé pour
 * être modifié à la main : `clé-valeur`, champs séparés par `_`, listes
 * séparées par `.`. Seuls les champs qui s'écartent de leur valeur par
 * défaut sont inclus, pour rester court (ex. "c-2" pour 2 colonnes).
 * Limité à [a-z0-9-_.] : les autres caractères sont échappés par
 * URLSearchParams, ce qui rendrait le paramètre illisible dans l'URL.
 */
const TBI_PARAM_FIELD_SEP = '_'
const TBI_PARAM_LIST_SEP = '.'

function isDefaultTabs(tabs: number[]): boolean {
  return tabs.every((tab, i) => tab === i)
}

function isDefaultTabConfigs(tabConfigs: TbiTabConfig[]): boolean {
  return tabConfigs.every((c) => c.layout === 'columns' && c.nbColumns === 1)
}

function isDefaultZooms(zooms: number[]): boolean {
  return zooms.every((zoom) => zoom === 1)
}

function encodePosition(x: number, y: number): string {
  return `${Math.round(x)}${TBI_PARAM_LIST_SEP}${Math.round(y)}`
}

function decodePosition(value: string): { x: number; y: number } | undefined {
  const [x, y] = value.split(TBI_PARAM_LIST_SEP).map(Number)
  if (Number.isNaN(x) || Number.isNaN(y)) return undefined
  return { x, y }
}

export function encodeTbiParam(shared: TbiSharedState): string {
  const fields: string[] = []
  if (shared.mode !== 'columns') fields.push(`m-${shared.mode}`)
  if (shared.nbColumns !== 1) fields.push(`c-${shared.nbColumns}`)
  if (!isDefaultTabs(shared.tabs)) {
    fields.push(`t-${shared.tabs.join(TBI_PARAM_LIST_SEP)}`)
  }
  if (shared.breaks.length > 0) {
    fields.push(`b-${shared.breaks.join(TBI_PARAM_LIST_SEP)}`)
  }
  if (!isDefaultTabConfigs(shared.tabConfigs)) {
    fields.push(
      `g-${shared.tabConfigs
        .map((c) => `${c.layout}-${c.nbColumns}`)
        .join(TBI_PARAM_LIST_SEP)}`,
    )
  }
  if (shared.widgetVisible) fields.push('w-1')
  if (shared.trafficLightVisible) fields.push('f-1')
  if (!isDefaultZooms(shared.zooms)) {
    fields.push(
      `z-${shared.zooms
        .map((zoom) => Math.round(zoom * 10))
        .join(TBI_PARAM_LIST_SEP)}`,
    )
  }
  if (shared.widgetX !== 0 || shared.widgetY !== 0) {
    fields.push(`wp-${encodePosition(shared.widgetX, shared.widgetY)}`)
  }
  if (shared.trafficLightX !== 0 || shared.trafficLightY !== 0) {
    fields.push(`fp-${encodePosition(shared.trafficLightX, shared.trafficLightY)}`)
  }
  return fields.join(TBI_PARAM_FIELD_SEP)
}

export function decodeTbiParam(param: string): Partial<TbiSharedState> {
  const shared: Partial<TbiSharedState> = {}
  if (param.length === 0) return shared
  for (const field of param.split(TBI_PARAM_FIELD_SEP)) {
    const separatorIndex = field.indexOf('-')
    if (separatorIndex === -1) continue
    const key = field.slice(0, separatorIndex)
    const value = field.slice(separatorIndex + 1)
    switch (key) {
      case 'm':
        shared.mode = value as TbiMode
        break
      case 'c': {
        const n = Number(value)
        if (!Number.isNaN(n)) shared.nbColumns = n
        break
      }
      case 't':
        shared.tabs = value
          .split(TBI_PARAM_LIST_SEP)
          .map(Number)
          .filter((n) => !Number.isNaN(n))
        break
      case 'b':
        shared.breaks = value
          .split(TBI_PARAM_LIST_SEP)
          .map(Number)
          .filter((n) => !Number.isNaN(n))
        break
      case 'g':
        shared.tabConfigs = value.split(TBI_PARAM_LIST_SEP).map((entry) => {
          const i = entry.indexOf('-')
          const layout = i === -1 ? entry : entry.slice(0, i)
          const nbColumns = i === -1 ? NaN : Number(entry.slice(i + 1))
          return {
            layout: layout as TbiTabLayout,
            nbColumns: Number.isNaN(nbColumns) ? 1 : nbColumns,
          }
        })
        break
      case 'w':
        shared.widgetVisible = value === '1'
        break
      case 'f':
        shared.trafficLightVisible = value === '1'
        break
      case 'z':
        shared.zooms = value
          .split(TBI_PARAM_LIST_SEP)
          .map((n) => Number(n) / 10)
          .filter((n) => !Number.isNaN(n))
        break
      case 'wp': {
        const position = decodePosition(value)
        if (position) {
          shared.widgetX = position.x
          shared.widgetY = position.y
        }
        break
      }
      case 'fp': {
        const position = decodePosition(value)
        if (position) {
          shared.trafficLightX = position.x
          shared.trafficLightY = position.y
        }
        break
      }
    }
  }
  return shared
}

export function applyTbiSharedState(shared: Partial<TbiSharedState>) {
  tbiState.update((state) => {
    if (shared.mode !== undefined && TBI_MODES.includes(shared.mode)) {
      state.mode = shared.mode
    }
    if (
      typeof shared.nbColumns === 'number' &&
      shared.nbColumns >= 1 &&
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
          : 'columns',
        nbColumns:
          typeof config?.nbColumns === 'number' &&
          config.nbColumns >= 1 &&
          config.nbColumns <= 4
            ? Math.round(config.nbColumns)
            : 1,
      }))
    }
    if (typeof shared.widgetVisible === 'boolean') {
      state.widget.visible = shared.widgetVisible
    }
    if (typeof shared.trafficLightVisible === 'boolean') {
      state.trafficLight.visible = shared.trafficLightVisible
    }
    if (Array.isArray(shared.zooms)) {
      shared.zooms.forEach((zoom, i) => {
        if (state.cards[i] && typeof zoom === 'number') {
          state.cards[i].zoom = clampZoom(zoom)
        }
      })
    }
    if (
      typeof shared.widgetX === 'number' &&
      typeof shared.widgetY === 'number'
    ) {
      state.widget.x = shared.widgetX
      state.widget.y = shared.widgetY
    }
    if (
      typeof shared.trafficLightX === 'number' &&
      typeof shared.trafficLightY === 'number'
    ) {
      state.trafficLight.x = shared.trafficLightX
      state.trafficLight.y = shared.trafficLightY
    }
    ensureTabConfigs(state)
    return state
  })
}

/** Partie locale de l'état (positions dépendantes de l'écran, en localStorage) */
interface TbiLocalLayout {
  cards: { x: number; y: number; w: number; zoom: number }[]
  widget: { x: number; y: number; zoom: number }
  trafficLight?: {
    x: number
    y: number
    w: number
    h: number
    active: TbiTrafficLightColor
  }
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
    trafficLight: {
      x: state.trafficLight.x,
      y: state.trafficLight.y,
      w: state.trafficLight.w,
      h: state.trafficLight.h,
      active: state.trafficLight.active,
    },
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
    if (
      typeof layout.trafficLight?.x === 'number' &&
      typeof layout.trafficLight?.y === 'number'
    ) {
      state.trafficLight.x = layout.trafficLight.x
      state.trafficLight.y = layout.trafficLight.y
    }
    if (typeof layout.trafficLight?.w === 'number') {
      state.trafficLight.w = clampTrafficLightWidth(layout.trafficLight.w)
    }
    if (typeof layout.trafficLight?.h === 'number') {
      state.trafficLight.h = clampTrafficLightHeight(layout.trafficLight.h)
    }
    if (
      layout.trafficLight?.active === 'red' ||
      layout.trafficLight?.active === 'orange' ||
      layout.trafficLight?.active === 'green'
    ) {
      state.trafficLight.active = layout.trafficLight.active
    }
    return state
  })
}
