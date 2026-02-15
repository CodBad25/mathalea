<script context="module" lang="ts">
  // Module-level flag: persists across component mount/unmount cycles
  let returningFromExport = false
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import referentielProfs from '../../../json/referentielProfs.json'
  import {
    darkMode,
    exercicesParams,
    previousView,
  } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import {
    referentielLocale,
    localisedIDToUuid,
  } from '../../../lib/stores/languagesStore'
  import {
    ALLOWED_LANGUAGES,
    isLanguage,
    type Language,
  } from '../../../lib/types/languages'
  import type { InterfaceParams } from '../../../lib/types'
  import type { VueType } from '../../../lib/VueType'
  import Footer from '../../Footer.svelte'
  import Exercice from '../../shared/exercice/Exercice.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import ButtonIconTooltip from '../../shared/forms/ButtonIconTooltip.svelte'
  import PdfTextIcon from '../../shared/icons/PdfTextIcon.svelte'
  import SideMenuWrapper from '../start/presentationalComponents/header/SideMenuWrapper.svelte'
  import Sidenav from '../../shared/sidenav/Sidenav.svelte'
  import { SM_BREAKPOINT } from '../../keyboard/lib/sizes'

  interface ToolEntry {
    id: string
    uuid: string
    titre: string
    url: string
    typeExercice: string
  }

  // Liste triée par id
  const tools: ToolEntry[] = Object.values(referentielProfs).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true }),
  )

  // Map qui compte combien de fois chaque outil est sélectionné
  let selectedToolCounts: Map<string, number> = new Map()
  let isSidenavOpened = true
  let innerWidth = 0
  let isMd: boolean
  let localeValue: Language = get(referentielLocale)

  const unsubscribeToReferentielLocale = referentielLocale.subscribe(
    (value) => {
      localeValue = value
    },
  )

  $: isMd = innerWidth >= SM_BREAKPOINT

  function selectTool(tool: ToolEntry) {
    const currentCount = selectedToolCounts.get(tool.id) ?? 0
    selectedToolCounts.set(tool.id, currentCount + 1)
    selectedToolCounts = new Map(selectedToolCounts) // trigger reactivity
    exercicesParams.update((list) => [
      ...list,
      { uuid: tool.uuid, id: tool.id } as InterfaceParams,
    ])
  }

  function toggleSidenav(forceOpening: boolean): void {
    if (forceOpening) {
      isSidenavOpened = true
    } else {
      isSidenavOpened = !isSidenavOpened
    }
  }

  function handleExport(vue: VueType) {
    returningFromExport = true
    $previousView = 'tools'
    globalOptions.update((params) => {
      params.v = vue
      return params
    })
  }

  const handleLanguage = (lang: string) => {
    let selectedLanguage: Language = ALLOWED_LANGUAGES[0]
    if (isLanguage(lang)) {
      selectedLanguage = lang
    } else {
      window.notify(`${lang} is not allowed as language.`, {})
    }
    referentielLocale.set(selectedLanguage)
    const currentRefToUuid = localisedIDToUuid[get(referentielLocale)]
    exercicesParams.update((list) => {
      for (let i = 0; i < list.length; i++) {
        const localeID = (
          Object.keys(currentRefToUuid) as (keyof typeof currentRefToUuid)[]
        ).find((key) => {
          return currentRefToUuid[key] === list[i].uuid
        })
        if (localeID) {
          list[i].id = localeID
        }
      }
      return list
    })
  }

  /**
   * Reconstruit selectedToolCounts à partir de la liste exercicesParams actuelle
   */
  function rebuildCountsFromParams() {
    const counts = new Map<string, number>()
    for (const param of $exercicesParams) {
      if (param.id) {
        counts.set(param.id, (counts.get(param.id) ?? 0) + 1)
      }
    }
    selectedToolCounts = counts
  }

  onMount(() => {
    if (returningFromExport) {
      // On revient d'un export (confeleve, latex…) : on conserve les exercices
      rebuildCountsFromParams()
      returningFromExport = false
    } else {
      // Arrivée fraîche sur la vue tools : on repart de zéro
      exercicesParams.set([])
      selectedToolCounts = new Map()
    }
  })

  onDestroy(() => {
    unsubscribeToReferentielLocale()
  })
</script>

<svelte:window bind:innerWidth />

<div
  class="{$darkMode.isActive
    ? 'dark'
    : ''} relative flex w-screen h-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
  id="toolsComponent"
>
  <div class="flex-1 flex flex-col w-full md:overflow-hidden">
    <!-- NavBar identique à Start.svelte -->
    <header
      class="flex flex-col scrollbar-hide w-full
      md:sticky md:top-0 md:z-50
      bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
    >
      <div
        class="bg-coopmaths-canvas dark:bg-coopmathsdark-canvas print-hidden"
      >
        <NavBar
          subtitle="Outils pour le professeur"
          subtitleType="design"
          locale={localeValue}
          {handleLanguage}
        />
      </div>
      <!-- Barre de boutons d'export -->
      <div
        class="flex {$exercicesParams.length > 0
          ? 'xl:h-[50px] md:h-[50px]'
          : 'h-0'}"
      >
        <div
          class={$exercicesParams.length === 0
            ? 'hidden'
            : 'relative w-full flex flex-row justify-between items-center bg-coopmaths-canvas dark:bg-coopmathsdark-canvas px-4'}
          id="barre-boutons"
        >
          <SideMenuWrapper
            isRecorder={false}
            {isSidenavOpened}
            {toggleSidenav}
            {isMd}
          />
          <div></div>
          <div
            class="flex flex-row justify-end items-center space-x-3 md:space-x-4 pr-4"
          >
            <ButtonIconTooltip
              icon={'bx-link text-3xl'}
              cornerIcon="bxs-graduation"
              cornerIconClass="text-coopmaths-action dark:text-coopmathsdark-action"
              tooltip="Lien pour les élèves"
              on:click={() => handleExport('confeleve')}
            />
            <button
              class="tooltip tooltip-bottom tooltip-neutral"
              data-tip="LaTeX"
              on:click={() => handleExport('latex')}
            >
              <PdfTextIcon
                class="w-7 h-7 hover:fill-coopmaths-action-lightest fill-coopmaths-action dark:fill-coopmathsdark-action dark:hover:fill-coopmathsdark-action-lightest"
              />
            </button>
          </div>
        </div>
      </div>
    </header>

    {#if isMd}
      <!-- MODE DESKTOP -->
      <div
        class="relative flex w-full h-full bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      >
        <Sidenav isOpen={isSidenavOpened} width={400}>
          <div
            class="w-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
          >
            <div class="p-3">
              <h2
                class="text-sm font-semibold uppercase tracking-wider text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-3 px-2"
              >
                {tools.length} outils disponibles
              </h2>
              <ul class="flex flex-col gap-1">
                {#each tools as tool (tool.id)}
                  <li>
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150
                        {(selectedToolCounts.get(tool.id) ?? 0) > 0
                        ? 'bg-coopmaths-action text-white dark:bg-coopmathsdark-action'
                        : 'text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:bg-coopmaths-canvas dark:hover:bg-coopmathsdark-canvas'}"
                      on:click={() => selectTool(tool)}
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                          <span class="text-xs font-mono opacity-60"
                            >{tool.id}</span
                          >
                          <span class="block text-sm leading-snug"
                            >{tool.titre}</span
                          >
                        </div>
                        {#if (selectedToolCounts.get(tool.id) ?? 0) > 1}
                          <span
                            class="ml-2 flex-shrink-0 inline-flex items-center justify-center
                              rounded-full px-2 py-0.5 text-xs font-bold
                              bg-white/30 text-white"
                          >
                            ✕{selectedToolCounts.get(tool.id)}
                          </span>
                        {/if}
                      </div>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </Sidenav>

        <!-- Zone principale -->
        <main
          id="exercisesPart"
          class="absolute right-0 top-0 flex flex-col w-full h-full px-6 overflow-x-auto overflow-y-auto
          transition-[padding-left] duration-300
          bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
          style="padding-left: {isSidenavOpened ? '400px' : '0px'}"
        >
          {#if $exercicesParams.length > 0}
            <div class="flex flex-col w-full md:h-full justify-between md:pl-4">
              <div class="flex flex-col md:mt-9 xl:mt-0">
                {#each $exercicesParams as paramsExercice, i (i)}
                  <Exercice
                    {paramsExercice}
                    {toggleSidenav}
                    indiceExercice={i}
                    indiceLastExercice={$exercicesParams.length - 1}
                  />
                {/each}
              </div>
              <div class="hidden md:flex items-center justify-center">
                <Footer />
              </div>
            </div>
          {:else}
            <div
              class="flex-1 h-full flex flex-col justify-between text-coopmaths-corpus dark:text-coopmathsdark-corpus"
            >
              <div></div>
              <div
                class="animate-pulse flex flex-row justify-start space-x-6 items-center"
              >
                <div class="mt-[10px]">
                  <i class="bx bx-chevron-left text-[50px]"></i>
                </div>
                <div class="font-extralight text-[50px]">
                  Sélectionner un outil
                </div>
              </div>
              <div class="flex items-center justify-center">
                <Footer />
              </div>
            </div>
          {/if}
        </main>
      </div>
    {:else}
      <!-- MODE SMARTPHONE -->
      <div
        class="flex flex-col h-full justify-between bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      >
        <div>
          <div
            class="w-full flex flex-col bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
          >
            <button
              type="button"
              class="group w-full flex flex-row justify-between items-center p-4"
              aria-expanded={isSidenavOpened}
              aria-controls="toolsMenuWrapper"
              on:click={() => (isSidenavOpened = !isSidenavOpened)}
            >
              <div
                class="text-lg font-bold text-coopmaths-action dark:text-coopmathsdark-action hover:text-coopmaths-action-lightest hover:dark:text-coopmathsdark-action-lightest"
              >
                Choix de l'outil
              </div>
              <i
                class="bx bxs-up-arrow text-lg text-coopmaths-action dark:text-coopmathsdark-action hover:text-coopmaths-action-lightest hover:dark:text-coopmathsdark-action-lightest transition-transform duration-300 {isSidenavOpened
                  ? 'rotate-0'
                  : 'rotate-180'}"
              ></i>
            </button>
            {#if isSidenavOpened}
              <div
                id="toolsMenuWrapper"
                class="w-full overflow-y-visible overscroll-contain bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
              >
                <div class="p-3">
                  <h2
                    class="text-sm font-semibold uppercase tracking-wider text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-3 px-2"
                  >
                    {tools.length} outils disponibles
                  </h2>
                  <ul class="flex flex-col gap-1">
                    {#each tools as tool (tool.id)}
                      <li>
                        <button
                          type="button"
                          class="w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150
                            {(selectedToolCounts.get(tool.id) ?? 0) > 0
                            ? 'bg-coopmaths-action text-white dark:bg-coopmathsdark-action'
                            : 'text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:bg-coopmaths-canvas dark:hover:bg-coopmathsdark-canvas'}"
                          on:click={() => selectTool(tool)}
                        >
                          <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                              <span class="text-xs font-mono opacity-60"
                                >{tool.id}</span
                              >
                              <span class="block text-sm leading-snug"
                                >{tool.titre}</span
                              >
                            </div>
                            {#if (selectedToolCounts.get(tool.id) ?? 0) > 1}
                              <span
                                class="ml-2 flex-shrink-0 inline-flex items-center justify-center
                                  rounded-full px-2 py-0.5 text-xs font-bold
                                  bg-white/30 text-white"
                              >
                                ✕{selectedToolCounts.get(tool.id)}
                              </span>
                            {/if}
                          </div>
                        </button>
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
            {/if}
          </div>
          <!-- Affichage exercice en mode smartphone -->
          <main
            id="exercisesPart"
            class="flex w-full px-6 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
          >
            {#if $exercicesParams.length > 0}
              <div class="flex flex-col w-full justify-between">
                <div class="flex flex-col">
                  {#each $exercicesParams as paramsExercice, i (i)}
                    <Exercice
                      {paramsExercice}
                      {toggleSidenav}
                      indiceExercice={i}
                      indiceLastExercice={$exercicesParams.length - 1}
                    />
                  {/each}
                </div>
              </div>
            {:else}
              <div
                class="flex-1 flex flex-col items-center justify-center text-coopmaths-corpus dark:text-coopmathsdark-corpus py-20"
              >
                <div class="animate-pulse flex flex-col items-center gap-4">
                  <i class="bx bx-chevron-up text-[50px]"></i>
                  <span class="font-extralight text-[40px]"
                    >Sélectionner un outil</span
                  >
                </div>
              </div>
            {/if}
          </main>
        </div>
        <Footer />
      </div>
    {/if}
  </div>
</div>

<style>
  :root {
    scrollbar-color: #aaaaaa transparent;
  }
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-thumb {
    background: #cccccc;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #dddddd;
  }
  ::-webkit-scrollbar-track {
    background: #ffffff;
    border-radius: 10px;
    box-shadow: inset 7px 10px 12px #f0f0f0;
  }
</style>
