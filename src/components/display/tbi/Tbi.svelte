<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { get, type Unsubscriber } from 'svelte/store'
  import { isStatic, isSvelte } from '../../../lib/components/componentsUtils'
  import { getStaticExercicePngUrls } from '../../../lib/components/exercisesUtils'
  import {
    mathaleaHandleParamOfOneExercice,
    mathaleaLoadExerciceFromUuid,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import {
    exercicesParams,
    tbiParamStore,
  } from '../../../lib/stores/generalStore'
  import {
    applyTbiSharedState,
    decodeTbiParam,
    deleteTbiCard,
    encodeTbiParam,
    exportTbiSettings,
    getTbiSharedState,
    importTbiSettings,
    isTbiSettingsFile,
    loadTbiLocalLayout,
    reconcileTbiCards,
    reorderTbiCard,
    moveTbiCardInColumns,
    saveTbiLocalLayout,
    shuffleTbiCards,
    tbiIsShuffling,
    tbiState,
  } from '../../../lib/stores/tbiStore'
  import TbiCalculatorWidget from './TbiCalculatorWidget.svelte'
  import type { InterfaceParams } from '../../../lib/types'
  import TypstAddExerciseModal from '../../setup/typst/addExercise/TypstAddExerciseModal.svelte'
  import TbiClockWidget from './TbiClockWidget.svelte'
  import TbiToolbar from './TbiToolbar.svelte'
  import TbiTrafficLightWidget from './TbiTrafficLightWidget.svelte'
  import type { TbiItem } from './tbiTypes'
  import TbiColumnsLayout from './layouts/TbiColumnsLayout.svelte'
  import TbiFreeLayout from './layouts/TbiFreeLayout.svelte'
  import TbiTabsLayout from './layouts/TbiTabsLayout.svelte'

  let items: TbiItem[] = $state([])
  let isReady = $state(false)
  let uuids: string[] = []
  let tbiStateUnsubscriber: Unsubscriber | undefined
  let lastEncodedSharedState = ''
  let syncUrlTimer: ReturnType<typeof setTimeout> | undefined

  let nextItemKey = 0

  async function buildTbiItem(
    param: InterfaceParams,
    index: number,
  ): Promise<TbiItem> {
    const base = {
      paramsIndex: index,
      uuid: param.uuid,
      id: param.id ?? param.uuid,
      key: nextItemKey++,
    }
    if (isStatic(param.uuid)) {
      // annale scannée / banque externe : affichée telle quelle comme image
      return {
        ...base,
        exercise: null,
        staticContent: getStaticExercicePngUrls(param.uuid),
      }
    }
    if (isSvelte(param.uuid)) {
      return { ...base, exercise: null, staticContent: null }
    }
    const exercise = await mathaleaLoadExerciceFromUuid(param.uuid)
    if (!exercise) {
      return { ...base, exercise: null, staticContent: null }
    }
    mathaleaHandleParamOfOneExercice(exercise, param)
    exercise.numeroExercice = index
    exercise.interactif = false
    return { ...base, exercise, staticContent: null }
  }

  async function loadItems() {
    const params = get(exercicesParams)
    const result: TbiItem[] = []
    for (let i = 0; i < params.length; i++) {
      result.push(await buildTbiItem(params[i], i))
    }
    items = result
    uuids = items.map((item) => item.uuid)
  }

  function persistLayout() {
    saveTbiLocalLayout(uuids)
  }

  /** Modale « Ajouter un exercice » (déclenchée depuis la barre d'outils) */
  let isAddExerciseOpen = $state(false)

  function openAddExercise() {
    isAddExerciseOpen = true
  }

  /**
   * Ajoute une ressource à la fin de l'affichage : ses paramètres rejoignent
   * exercicesParams (donc l'URL), une carte TBI est créée pour elle
   * (reconcileTbiCards) et la disposition est persistée.
   * @param {InterfaceParams} params paramètres de l'exercice choisi
   */
  async function addExerciseToTbi(params: InterfaceParams) {
    exercicesParams.update((list) => [...list, params])
    const item = await buildTbiItem(params, items.length)
    items = [...items, item]
    uuids = items.map((i) => i.uuid)
    reconcileTbiCards(uuids)
    persistLayout()
  }

  /**
   * Mélange aléatoirement l'ordre des exercices puis réaligne `items` sur la
   * permutation obtenue. Active brièvement `tbiIsShuffling` pour que les
   * dispositions animent le glissement des cartes vers leur nouvelle place.
   */
  let shuffleResetTimer: ReturnType<typeof setTimeout> | undefined
  function applyShuffle() {
    const order = shuffleTbiCards()
    if (!order) return
    tbiIsShuffling.set(true)
    items = order.map((oldIndex, newIndex) => {
      const item = items[oldIndex]
      item.paramsIndex = newIndex
      if (item.exercise) item.exercise.numeroExercice = newIndex
      return item
    })
    uuids = items.map((item) => item.uuid)
    persistLayout()
    if (shuffleResetTimer !== undefined) clearTimeout(shuffleResetTimer)
    // fenêtre couvrant la durée de l'animation FLIP la plus longue
    shuffleResetTimer = setTimeout(() => tbiIsShuffling.set(false), 800)
  }

  /** Déplace un exercice (sémantique splice) et réaligne items sur le nouvel ordre */
  function applyReorder(from: number, to: number, groups?: number[][]) {
    if (groups) {
      const destination = moveTbiCardInColumns(from, groups)
      if (destination === null) return
      to = destination
    } else if (!reorderTbiCard(from, to)) return
    items.splice(to, 0, items.splice(from, 1)[0])
    items = items.map((item, i) => {
      item.paramsIndex = i
      if (item.exercise) item.exercise.numeroExercice = i
      return item
    })
    uuids = items.map((item) => item.uuid)
    persistLayout()
  }

  /** Supprime un exercice et réaligne items sur les indices restants */
  function applyDelete(paramsIndex: number) {
    deleteTbiCard(paramsIndex)
    items.splice(paramsIndex, 1)
    items = items.map((item, i) => {
      item.paramsIndex = i
      if (item.exercise) item.exercise.numeroExercice = i
      return item
    })
    uuids = items.map((item) => item.uuid)
    persistLayout()
  }

  /** Fichier de réglages : sauvegarde (téléchargement) et chargement (JSON) */
  let settingsFileInput: HTMLInputElement | undefined = $state()

  function saveSettings() {
    const blob = new Blob([JSON.stringify(exportTbiSettings(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'reglages-tbi.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function loadSettings() {
    settingsFileInput?.click()
  }

  async function onSettingsFileChosen(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    // permet de recharger deux fois de suite le même fichier
    input.value = ''
    if (!file) return
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      data = null
    }
    if (!isTbiSettingsFile(data)) {
      window.alert("Ce fichier n'est pas un fichier de réglages de la vue TBI.")
      return
    }
    // le fichier embarque la liste des exercices (avec leurs paramètres) :
    // elle remplace la sélection actuelle, après confirmation s'il y en a une
    const exercices = data.exercices
    if (Array.isArray(exercices) && exercices.length > 0) {
      if (
        get(exercicesParams).length > 0 &&
        !window.confirm(
          'Remplacer les exercices actuels par ceux du fichier de réglages ?',
        )
      ) {
        return
      }
      exercicesParams.set(structuredClone(exercices))
      await loadItems()
      // cartes remises à zéro : le fichier décrit tout l'état de la vue
      tbiState.update((state) => ({ ...state, cards: [], tabConfigs: [] }))
      reconcileTbiCards(uuids)
    } else if (get(exercicesParams).length === 0) {
      // fichier d'une ancienne version : sans exercice à régler, rien ne
      // serait appliqué et le chargement semblerait ne rien faire
      window.alert(
        "Ce fichier ne contient pas la liste des exercices (il a été sauvegardé avec une ancienne version). Ajoutez d'abord des exercices, ou sauvegardez à nouveau vos réglages.",
      )
      return
    }
    importTbiSettings(data)
    mathaleaUpdateUrlFromExercicesParams()
    persistLayout()
  }

  onMount(async () => {
    await loadItems()
    reconcileTbiCards(uuids)
    // l'URL (tbiParam) décrit la disposition partagée, le localStorage
    // les positions/tailles dépendantes de l'écran : le localStorage est
    // appliqué en premier, puis l'URL (si présente) par-dessus, pour que
    // la position partagée d'un widget prenne le pas sur la sauvegarde locale
    loadTbiLocalLayout(uuids)
    const urlParam = new URL(window.location.href).searchParams.get('tbiParam')
    if (urlParam != null) {
      tbiParamStore.set(urlParam)
      applyTbiSharedState(decodeTbiParam(urlParam))
    }
    isReady = true
    // Maintient l'URL à jour avec la partie partageable de l'état. tbiState
    // notifie sur CHAQUE mutation, y compris les positions/tailles du mode
    // libre (pas concernées par l'URL) mises à jour à chaque pointermove
    // d'un glisser-déposer : sans ce débounce, un encodage JSON+base64 de
    // tout l'état tournerait à chaque déplacement de souris et rendrait
    // l'interface perceptiblement lente pendant le geste.
    tbiStateUnsubscriber = tbiState.subscribe(() => {
      if (!isReady) return
      if (syncUrlTimer !== undefined) clearTimeout(syncUrlTimer)
      syncUrlTimer = setTimeout(() => {
        syncUrlTimer = undefined
        const encoded = encodeTbiParam(getTbiSharedState(get(tbiState)))
        if (encoded === lastEncodedSharedState) return
        lastEncodedSharedState = encoded
        tbiParamStore.set(encoded)
        mathaleaUpdateUrlFromExercicesParams()
      }, 200)
    })
  })

  onDestroy(() => {
    if (syncUrlTimer !== undefined) clearTimeout(syncUrlTimer)
    if (shuffleResetTimer !== undefined) clearTimeout(shuffleResetTimer)
    tbiStateUnsubscriber?.()
  })
</script>

<main
  class="min-h-screen w-full bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
>
  <TbiToolbar
    {items}
    onAddExercise={openAddExercise}
    onShuffle={applyShuffle}
    onSaveSettings={saveSettings}
    onLoadSettings={loadSettings}
  />
  <input
    bind:this={settingsFileInput}
    type="file"
    accept=".json,application/json"
    class="hidden"
    onchange={onSettingsFileChosen}
  />
  <!-- sans exercice, la page reste vide : l'ajout se fait depuis la barre d'outils -->
  {#if isReady && items.length > 0}
    {#if $tbiState.mode === 'columns'}
      <TbiColumnsLayout
        {items}
        nbColumns={$tbiState.nbColumns}
        singleColumnAlign={$tbiState.singleColumnAlign}
        onMove={applyReorder}
        onDelete={applyDelete}
      />
    {:else if $tbiState.mode === 'free'}
      <TbiFreeLayout {items} {persistLayout} onDelete={applyDelete} />
    {:else if $tbiState.mode === 'tabs'}
      <TbiTabsLayout
        {items}
        onMove={applyReorder}
        {persistLayout}
        onDelete={applyDelete}
      />
    {/if}
  {/if}
  {#if $tbiState.widget.visible}
    <TbiClockWidget {persistLayout} />
  {/if}
  {#if $tbiState.trafficLight.visible}
    <TbiTrafficLightWidget {persistLayout} />
  {/if}
  {#if $tbiState.calculette.visible}
    <TbiCalculatorWidget kind="calculette" {persistLayout} />
  {/if}
  {#if $tbiState.collegeCalculator.visible}
    <TbiCalculatorWidget kind="college" {persistLayout} />
  {/if}
  {#if $tbiState.lyceeCalculator.visible}
    <TbiCalculatorWidget kind="lycee" {persistLayout} />
  {/if}
  {#if isAddExerciseOpen}
    <TypstAddExerciseModal
      onAdd={addExerciseToTbi}
      onClose={() => (isAddExerciseOpen = false)}
    />
  {/if}
</main>
