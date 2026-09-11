import { get } from 'svelte/store'
import { beforeEach, describe, expect, it } from 'vitest'
import { exercicesParams } from '../../src/lib/stores/generalStore'
import {
  applyTbiSharedState,
  TBI_MAX_ZOOM,
  TBI_MIN_ZOOM,
  TBI_WIDGET_MAX_ZOOM,
  TBI_WIDGET_MIN_ZOOM,
  balanceColumnBreaks,
  decodeTbiParam,
  defaultTbiState,
  deleteTbiCard,
  encodeTbiParam,
  getTbiSharedState,
  moveCardToTab,
  reconcileTbiCards,
  reorderTbiCard,
  shuffleTbiCards,
  tbiState,
  toggleTbiCardCollapsed,
  zoomAllCardsBy,
  zoomWidgetBy,
} from '../../src/lib/stores/tbiStore'

describe('tbiStore', () => {
  beforeEach(() => {
    tbiState.set(defaultTbiState())
    exercicesParams.set([])
  })

  it('reconcileTbiCards étend cards avec des valeurs par défaut', () => {
    reconcileTbiCards(['e1', 'e2', 'e3'])
    const state = get(tbiState)
    expect(state.cards).toHaveLength(3)
    expect(state.cards.map((c) => c.tab)).toEqual([0, 1, 2])
    expect(state.cards.every((c) => c.zoom === 1)).toBe(true)
    expect(state.tabConfigs).toHaveLength(3)
  })

  it("reconcileTbiCards réinitialise une carte dont l'exercice a été remplacé", () => {
    reconcileTbiCards(['e1', 'e2', 'e3'])
    tbiState.update((state) => {
      state.cards[1].zoom = 2
      state.cards[1].x = 999
      state.cards[1].w = 900
      return state
    })
    // e2 est remplacé par e2bis à l'indice 1 : ne doit pas hériter du zoom/de la position d'e2
    reconcileTbiCards(['e1', 'e2bis', 'e3'])
    const state = get(tbiState)
    expect(state.cards[1].zoom).toBe(1)
    expect(state.cards[1].x).toBe(40 + (1 % 3) * 80)
    expect(state.cards[1].w).toBe(600)
    // les exercices inchangés conservent leur état
    expect(state.cards[0].uuid).toBe('e1')
    expect(state.cards[2].uuid).toBe('e3')
  })

  it('reconcileTbiCards tronque le surplus et remappe les onglets hors bornes', () => {
    reconcileTbiCards(['e1', 'e2', 'e3', 'e4'])
    tbiState.update((state) => {
      state.cards[1].tab = 3
      return state
    })
    reconcileTbiCards(['e1', 'e2'])
    const state = get(tbiState)
    expect(state.cards).toHaveLength(2)
    // l'onglet 3 n'existe plus avec 2 exercices : retour à l'indice de la carte
    expect(state.cards[1].tab).toBe(1)
  })

  it('moveCardToTab fusionne, élague et renumérote les onglets', () => {
    reconcileTbiCards(['e1', 'e2', 'e3'])
    // l'exercice 0 rejoint l'onglet de l'exercice 1 : onglets [1,1,2] → [0,0,1]
    moveCardToTab(0, 1)
    let state = get(tbiState)
    expect(state.cards.map((c) => c.tab)).toEqual([0, 0, 1])
    expect(state.tabConfigs).toHaveLength(2)
    // « nouvel onglet » (indice compact = nombre d'onglets)
    moveCardToTab(0, 2)
    state = get(tbiState)
    expect(state.cards.map((c) => c.tab)).toEqual([2, 0, 1])
    expect(state.tabConfigs).toHaveLength(3)
  })

  it("reorderTbiCard déplace l'exercice et son état de carte", () => {
    exercicesParams.set([
      { uuid: 'a' },
      { uuid: 'b' },
      { uuid: 'c' },
    ])
    reconcileTbiCards(['a', 'b', 'c'])
    tbiState.update((state) => {
      state.cards[2].zoom = 2
      return state
    })
    expect(reorderTbiCard(2, 0)).toBe(true)
    expect(get(exercicesParams).map((p) => p.uuid)).toEqual(['c', 'a', 'b'])
    expect(get(tbiState).cards[0].zoom).toBe(2)
    expect(reorderTbiCard(0, 5)).toBe(false)
  })

  it('shuffleTbiCards applique la même permutation à exercicesParams et aux cartes', () => {
    exercicesParams.set([
      { uuid: 'a' },
      { uuid: 'b' },
      { uuid: 'c' },
      { uuid: 'd' },
      { uuid: 'e' },
    ])
    reconcileTbiCards(['a', 'b', 'c', 'd', 'e'])
    const labels = ['a', 'b', 'c', 'd', 'e']
    tbiState.update((state) => {
      state.cards.forEach((card, i) => {
        card.zoom = 1 + i / 10
      })
      return state
    })

    const order = shuffleTbiCards()
    expect(order).not.toBeNull()
    const uuids = get(exercicesParams).map((p) => p.uuid)
    const cards = get(tbiState).cards
    // c'est bien une permutation : aucun exercice perdu ni dupliqué
    expect([...uuids].sort()).toEqual(labels)
    expect(order).not.toEqual([0, 1, 2, 3, 4])
    // le zoom et l'uuid de chaque carte suivent son exercice
    order!.forEach((oldIndex, newIndex) => {
      expect(uuids[newIndex]).toBe(labels[oldIndex])
      expect(cards[newIndex].uuid).toBe(labels[oldIndex])
      expect(cards[newIndex].zoom).toBeCloseTo(1 + oldIndex / 10)
    })
  })

  it('shuffleTbiCards réordonne les onglets et fait suivre tabConfigs', () => {
    exercicesParams.set([{ uuid: 'a' }, { uuid: 'b' }, { uuid: 'c' }])
    reconcileTbiCards(['a', 'b', 'c'])
    // chaque exercice dans son propre onglet, avec une config distincte
    tbiState.update((state) => {
      state.cards.forEach((card, i) => (card.tab = i))
      state.tabConfigs = [
        { layout: 'columns', nbColumns: 1 },
        { layout: 'free', nbColumns: 2 },
        { layout: 'columns', nbColumns: 3 },
      ]
      return state
    })

    const order = shuffleTbiCards()!
    const state = get(tbiState)
    // onglets toujours compacts 0..k-1
    expect([...state.cards.map((c) => c.tab)].sort()).toEqual([0, 1, 2])
    // l'onglet suit l'exercice : la carte en position i porte l'onglet i
    expect(state.cards.map((c) => c.tab)).toEqual([0, 1, 2])
    // tabConfigs réordonné selon la permutation
    const initialConfigs = [
      { layout: 'columns', nbColumns: 1 },
      { layout: 'free', nbColumns: 2 },
      { layout: 'columns', nbColumns: 3 },
    ]
    expect(state.tabConfigs).toEqual(order.map((oldIndex) => initialConfigs[oldIndex]))
  })

  it('shuffleTbiCards conserve le regroupement des onglets partagés', () => {
    exercicesParams.set([
      { uuid: 'a' },
      { uuid: 'b' },
      { uuid: 'c' },
      { uuid: 'd' },
    ])
    reconcileTbiCards(['a', 'b', 'c', 'd'])
    // a et c dans l'onglet 0, b et d dans l'onglet 1
    tbiState.update((state) => {
      state.cards[0].tab = 0
      state.cards[1].tab = 1
      state.cards[2].tab = 0
      state.cards[3].tab = 1
      state.tabConfigs = [
        { layout: 'columns', nbColumns: 2 },
        { layout: 'free', nbColumns: 1 },
      ]
      return state
    })

    shuffleTbiCards()
    const state = get(tbiState)
    // toujours exactement deux onglets, chacun avec deux exercices
    const byTab = new Map<number, string[]>()
    state.cards.forEach((c) =>
      byTab.set(c.tab, [...(byTab.get(c.tab) ?? []), c.uuid!]),
    )
    expect([...byTab.keys()].sort()).toEqual([0, 1])
    expect([...byTab.values()].map((g) => g.sort())).toEqual(
      expect.arrayContaining([
        ['a', 'c'],
        ['b', 'd'],
      ]),
    )
    expect(state.tabConfigs).toHaveLength(2)
  })

  it('shuffleTbiCards ré-équilibre les sauts de colonne (mode colonnes)', () => {
    exercicesParams.set([
      { uuid: 'a' },
      { uuid: 'b' },
      { uuid: 'c' },
      { uuid: 'd' },
      { uuid: 'e' },
    ])
    reconcileTbiCards(['a', 'b', 'c', 'd', 'e'])
    tbiState.update((state) => {
      state.mode = 'columns'
      state.nbColumns = 2
      // sauts mal répartis : les deux premiers exercices, colonne suivante vide
      state.cards[0].colBreak = true
      state.cards[1].colBreak = true
      return state
    })

    shuffleTbiCards()
    // 5 exercices sur 2 colonnes : un seul saut, à la position 3 (3 puis 2)
    expect(get(tbiState).cards.map((c) => c.colBreak)).toEqual([
      false,
      false,
      false,
      true,
      false,
    ])
  })

  it('shuffleTbiCards ré-équilibre les sauts de colonne de chaque onglet (mode onglets)', () => {
    exercicesParams.set(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((uuid) => ({ uuid })),
    )
    reconcileTbiCards(['a', 'b', 'c', 'd', 'e', 'f'])
    tbiState.update((state) => {
      state.mode = 'tabs'
      // deux onglets de 3 exercices, chacun affiché sur 2 colonnes
      state.cards.forEach((card, i) => {
        card.tab = i < 3 ? 0 : 1
        card.colBreak = true
      })
      state.tabConfigs = [
        { layout: 'columns', nbColumns: 2 },
        { layout: 'columns', nbColumns: 2 },
      ]
      return state
    })

    shuffleTbiCards()
    const state = get(tbiState)
    // dans chaque onglet : 3 exercices sur 2 colonnes → un seul saut (2 puis 1)
    for (const tab of [0, 1]) {
      const breaks = state.cards
        .filter((c) => c.tab === tab)
        .map((c) => c.colBreak)
      expect(breaks).toEqual([false, false, true])
    }
  })

  it('shuffleTbiCards ne fait rien avec moins de deux exercices', () => {
    exercicesParams.set([{ uuid: 'a' }])
    reconcileTbiCards(['a'])
    expect(shuffleTbiCards()).toBeNull()
    expect(get(exercicesParams).map((p) => p.uuid)).toEqual(['a'])
  })

  it("deleteTbiCard retire l'exercice et renumérote les onglets", () => {
    exercicesParams.set([{ uuid: 'a' }, { uuid: 'b' }, { uuid: 'c' }])
    reconcileTbiCards(['a', 'b', 'c'])
    // b et c partagent un onglet ; a est seul dans le sien
    moveCardToTab(2, 1)
    let state = get(tbiState)
    expect(state.cards.map((c) => c.tab)).toEqual([0, 1, 1])

    // suppression de a (seul de son onglet) : l'onglet de b/c devient l'onglet 0
    deleteTbiCard(0)
    expect(get(exercicesParams).map((p) => p.uuid)).toEqual(['b', 'c'])
    state = get(tbiState)
    expect(state.cards).toHaveLength(2)
    expect(state.cards.map((c) => c.tab)).toEqual([0, 0])
    expect(state.tabConfigs).toHaveLength(1)
  })

  it('toggleTbiCardCollapsed bascule le repli de la carte visée', () => {
    reconcileTbiCards(['e1', 'e2'])
    expect(get(tbiState).cards.map((c) => c.collapsed ?? false)).toEqual([
      false,
      false,
    ])
    toggleTbiCardCollapsed(1)
    expect(get(tbiState).cards.map((c) => c.collapsed ?? false)).toEqual([
      false,
      true,
    ])
    toggleTbiCardCollapsed(1)
    expect(get(tbiState).cards[1].collapsed).toBe(false)
    // indice hors bornes : sans effet, sans erreur
    expect(() => toggleTbiCardCollapsed(9)).not.toThrow()
  })

  it('balanceColumnBreaks répartit les sauts par nombre d’exercices et écrase les précédents', () => {
    reconcileTbiCards(['e1', 'e2', 'e3', 'e4', 'e5'])
    balanceColumnBreaks([0, 1, 2, 3, 4], 2)
    let state = get(tbiState)
    // 5 exercices sur 2 colonnes : 3 puis 2
    expect(state.cards.map((c) => c.colBreak)).toEqual([
      false,
      false,
      false,
      true,
      false,
    ])

    balanceColumnBreaks([0, 1, 2, 3, 4], 3)
    state = get(tbiState)
    expect(state.cards.map((c) => c.colBreak)).toEqual([
      false,
      false,
      true,
      true,
      false,
    ])

    // repasser à 1 colonne efface les sauts précédents
    balanceColumnBreaks([0, 1, 2, 3, 4], 1)
    state = get(tbiState)
    expect(state.cards.every((c) => !c.colBreak)).toBe(true)
  })

  it('zoomWidgetBy fait varier et borne le zoom du widget', () => {
    expect(get(tbiState).widget.zoom).toBe(1)
    zoomWidgetBy(0.1)
    expect(get(tbiState).widget.zoom).toBeCloseTo(1.1)
    zoomWidgetBy(10)
    expect(get(tbiState).widget.zoom).toBe(TBI_WIDGET_MAX_ZOOM)
    zoomWidgetBy(-10)
    expect(get(tbiState).widget.zoom).toBe(TBI_WIDGET_MIN_ZOOM)
  })

  it('getTbiSharedState / applyTbiSharedState font un aller-retour', () => {
    reconcileTbiCards(['e1', 'e2', 'e3'])
    tbiState.update((state) => {
      state.mode = 'tabs'
      state.nbColumns = 3
      state.cards[2].tab = 0
      state.cards[1].colBreak = true
      state.cards[0].zoom = 1.5
      state.tabConfigs = [
        { layout: 'columns', nbColumns: 3 },
        { layout: 'free', nbColumns: 2 },
      ]
      state.widget.visible = true
      state.trafficLight.visible = true
      state.widget.x = 120
      state.widget.y = 80
      state.trafficLight.x = 200
      state.trafficLight.y = 150
      state.collegeCalculator.visible = true
      state.collegeCalculator.x = 10
      state.collegeCalculator.y = 20
      state.lyceeCalculator.visible = true
      state.lyceeCalculator.x = 30
      state.lyceeCalculator.y = 40
      return state
    })
    const shared = getTbiSharedState(get(tbiState))
    expect(shared).toEqual({
      mode: 'tabs',
      nbColumns: 3,
      singleColumnAlign: 'center',
      tabs: [0, 1, 0],
      breaks: [1],
      tabConfigs: [
        { layout: 'columns', nbColumns: 3 },
        { layout: 'free', nbColumns: 2 },
      ],
      widgetVisible: true,
      trafficLightVisible: true,
      collegeCalculatorVisible: true,
      lyceeCalculatorVisible: true,
      zooms: [1.5, 1, 1],
      widgetX: 120,
      widgetY: 80,
      trafficLightX: 200,
      trafficLightY: 150,
      collegeCalculatorX: 10,
      collegeCalculatorY: 20,
      lyceeCalculatorX: 30,
      lyceeCalculatorY: 40,
    })

    tbiState.set(defaultTbiState())
    reconcileTbiCards(['e1', 'e2', 'e3'])
    applyTbiSharedState(shared)
    const state = get(tbiState)
    expect(state.mode).toBe('tabs')
    expect(state.nbColumns).toBe(3)
    expect(state.cards.map((c) => c.tab)).toEqual([0, 1, 0])
    expect(state.cards.map((c) => c.colBreak)).toEqual([false, true, false])
    expect(state.tabConfigs[0]).toEqual({ layout: 'columns', nbColumns: 3 })
    expect(state.tabConfigs[1]).toEqual({ layout: 'free', nbColumns: 2 })
    expect(state.widget.visible).toBe(true)
    expect(state.trafficLight.visible).toBe(true)
    expect(state.cards.map((c) => c.zoom)).toEqual([1.5, 1, 1])
    expect(state.widget.x).toBe(120)
    expect(state.widget.y).toBe(80)
    expect(state.trafficLight.x).toBe(200)
    expect(state.trafficLight.y).toBe(150)
    expect(state.collegeCalculator.visible).toBe(true)
    expect(state.collegeCalculator.x).toBe(10)
    expect(state.collegeCalculator.y).toBe(20)
    expect(state.lyceeCalculator.visible).toBe(true)
    expect(state.lyceeCalculator.x).toBe(30)
    expect(state.lyceeCalculator.y).toBe(40)
  })

  it('zoomAllCardsBy fait varier et borne le zoom de tous les exercices', () => {
    reconcileTbiCards(['e1', 'e2', 'e3'])
    tbiState.update((state) => {
      state.cards[1].zoom = 2
      return state
    })
    zoomAllCardsBy(0.1)
    let state = get(tbiState)
    expect(state.cards.map((c) => c.zoom)).toEqual([1.1, 2.1, 1.1])
    zoomAllCardsBy(10)
    state = get(tbiState)
    expect(state.cards.every((c) => c.zoom === TBI_MAX_ZOOM)).toBe(true)
    zoomAllCardsBy(-10)
    state = get(tbiState)
    expect(state.cards.every((c) => c.zoom === TBI_MIN_ZOOM)).toBe(true)
  })

  it('encodeTbiParam / decodeTbiParam gèrent la visibilité des widgets et le zoom', () => {
    const encoded = encodeTbiParam({
      mode: 'columns',
      nbColumns: 1,
      singleColumnAlign: 'center',
      tabs: [0, 1],
      breaks: [],
      tabConfigs: [],
      widgetVisible: true,
      trafficLightVisible: true,
      collegeCalculatorVisible: false,
      lyceeCalculatorVisible: false,
      zooms: [1.5, 0.8],
      widgetX: 0,
      widgetY: 0,
      trafficLightX: 0,
      trafficLightY: 0,
      collegeCalculatorX: 0,
      collegeCalculatorY: 0,
      lyceeCalculatorX: 0,
      lyceeCalculatorY: 0,
    })
    expect(encoded).toBe('w-1_f-1_z-15.8')
    expect(decodeTbiParam(encoded)).toEqual({
      widgetVisible: true,
      trafficLightVisible: true,
      zooms: [1.5, 0.8],
    })
    // valeurs par défaut : rien n'est encodé
    expect(
      encodeTbiParam({
        mode: 'columns',
        nbColumns: 1,
        singleColumnAlign: 'center',
        tabs: [0, 1],
        breaks: [],
        tabConfigs: [],
        widgetVisible: false,
        trafficLightVisible: false,
        collegeCalculatorVisible: false,
        lyceeCalculatorVisible: false,
        zooms: [1, 1],
        widgetX: 0,
        widgetY: 0,
        trafficLightX: 0,
        trafficLightY: 0,
        collegeCalculatorX: 0,
        collegeCalculatorY: 0,
        lyceeCalculatorX: 0,
        lyceeCalculatorY: 0,
      }),
    ).toBe('')
  })

  it("encodeTbiParam / decodeTbiParam gèrent l'alignement de la colonne unique", () => {
    const base = {
      mode: 'columns' as const,
      nbColumns: 1,
      tabs: [],
      breaks: [],
      tabConfigs: [],
      widgetVisible: false,
      trafficLightVisible: false,
      collegeCalculatorVisible: false,
      lyceeCalculatorVisible: false,
      zooms: [],
      widgetX: 0,
      widgetY: 0,
      trafficLightX: 0,
      trafficLightY: 0,
      collegeCalculatorX: 0,
      collegeCalculatorY: 0,
      lyceeCalculatorX: 0,
      lyceeCalculatorY: 0,
    }
    // 'center' est la valeur par défaut : rien n'est encodé
    expect(encodeTbiParam({ ...base, singleColumnAlign: 'center' })).toBe('')
    const encoded = encodeTbiParam({ ...base, singleColumnAlign: 'right' })
    expect(encoded).toBe('sc-right')
    expect(decodeTbiParam(encoded)).toEqual({ singleColumnAlign: 'right' })

    // aller-retour via applyTbiSharedState, valeur inconnue ignorée
    reconcileTbiCards(['e1'])
    applyTbiSharedState({ singleColumnAlign: 'left' })
    expect(get(tbiState).singleColumnAlign).toBe('left')
    applyTbiSharedState({
      // @ts-expect-error valeur inconnue volontaire
      singleColumnAlign: 'pirouette',
    })
    expect(get(tbiState).singleColumnAlign).toBe('left')
  })

  it('encodeTbiParam / decodeTbiParam gèrent la visibilité et la position des calculatrices', () => {
    const encoded = encodeTbiParam({
      mode: 'columns',
      nbColumns: 1,
      singleColumnAlign: 'center',
      tabs: [],
      breaks: [],
      tabConfigs: [],
      widgetVisible: false,
      trafficLightVisible: false,
      collegeCalculatorVisible: true,
      lyceeCalculatorVisible: true,
      zooms: [],
      widgetX: 0,
      widgetY: 0,
      trafficLightX: 0,
      trafficLightY: 0,
      collegeCalculatorX: 10,
      collegeCalculatorY: 20,
      lyceeCalculatorX: -5,
      lyceeCalculatorY: 15,
    })
    expect(encoded).toBe('cc-1_cl-1_ccp-10.20_clp--5.15')
    expect(decodeTbiParam(encoded)).toEqual({
      collegeCalculatorVisible: true,
      lyceeCalculatorVisible: true,
      collegeCalculatorX: 10,
      collegeCalculatorY: 20,
      lyceeCalculatorX: -5,
      lyceeCalculatorY: 15,
    })
  })

  it('encodeTbiParam / decodeTbiParam gèrent la position des widgets (y compris négative)', () => {
    const encoded = encodeTbiParam({
      mode: 'columns',
      nbColumns: 1,
      singleColumnAlign: 'center',
      tabs: [],
      breaks: [],
      tabConfigs: [],
      widgetVisible: false,
      trafficLightVisible: false,
      collegeCalculatorVisible: false,
      lyceeCalculatorVisible: false,
      zooms: [],
      widgetX: 120,
      widgetY: -40,
      trafficLightX: -15,
      trafficLightY: 300,
      collegeCalculatorX: 0,
      collegeCalculatorY: 0,
      lyceeCalculatorX: 0,
      lyceeCalculatorY: 0,
    })
    expect(encoded).toBe('wp-120.-40_fp--15.300')
    expect(decodeTbiParam(encoded)).toEqual({
      widgetX: 120,
      widgetY: -40,
      trafficLightX: -15,
      trafficLightY: 300,
    })
  })

  it('applyTbiSharedState ignore les valeurs invalides', () => {
    reconcileTbiCards(['e1', 'e2'])
    applyTbiSharedState({
      // @ts-expect-error valeur inconnue volontaire
      mode: 'pirouette',
      nbColumns: 42,
      tabs: [1],
      // @ts-expect-error valeur inconnue volontaire
      tabConfigs: [{ layout: 'pirouette', nbColumns: 99 }],
    })
    const state = get(tbiState)
    expect(state.mode).toBe('columns')
    expect(state.nbColumns).toBe(1)
    expect(state.cards.map((c) => c.tab)).toEqual([1, 1])
    expect(state.tabConfigs[0]).toEqual({ layout: 'columns', nbColumns: 1 })
  })
})
