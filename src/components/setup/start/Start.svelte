<script lang="ts">
  //
  //
  // /!\ Il reste à traiter ReferentielEnding.svelte qui contient encore des accès au generalStore
  //     Il faut faire remonter les demandes à Start.svelte pour qu'il reste le seul avec ces accès
  //        et faire en sorte que ReferentielEnding.svelte ne gère que de l'affichage en bon presentationalComponent
  // /!\ Chip.svelte, SearchInput.svelte et Filtres.svelte contiennet encore des createEventDispatcher, dans l'idéal il
  //     faudrait plutôtqu'ils fassent remonter les changements jusqu'à SideMenu.svelte via une {function} pour qu'ils
  //     les fassent redescendre ensuite par des {attributs}
  //
  import {
    afterUpdate,
    beforeUpdate,
    onDestroy,
    onMount,
    setContext,
    tick,
  } from 'svelte'
  import { get } from 'svelte/store'
  import { qcmCamExportAll } from '../../../../src/lib/qcmCam'
  import appsTierce from '../../../json/referentielAppsTierce.json'
  import { buildEsParams } from '../../../lib/components/urls'
  import { downloadFile } from '../../../lib/files'
  import handleCapytale from '../../../lib/handleCapytale'
  import { sendActivityParams } from '../../../lib/handleRecorder'
  import {
    getExercisesFromExercicesParams,
    mathaleaUpdateExercicesParamsFromUrl,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import { canOptions } from '../../../lib/stores/canStore'
  import {
    darkMode,
    exercicesParams,
    previousView,
  } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import {
    localisedIDToUuid,
    referentielLocale,
  } from '../../../lib/stores/languagesStore'
  import type {
    InterfaceGlobalOptions,
    InterfaceParams,
  } from '../../../lib/types'
  import type { CanOptions } from '../../../lib/types/can'
  import type { Language } from '../../../lib/types/languages'
  import { ALLOWED_LANGUAGES, isLanguage } from '../../../lib/types/languages'
  import { type AppTierceGroup } from '../../../lib/types/referentiels'
  import type { VueType } from '../../../lib/VueType'
  import Footer from '../../Footer.svelte'
  import Keyboard from '../../keyboard/Keyboard.svelte'
  import { SM_BREAKPOINT } from '../../keyboard/lib/sizes'
  import BasicClassicModal from '../../shared/modal/BasicClassicModal.svelte'
  import Sidenav from '../../shared/sidenav/Sidenav.svelte'
  import ButtonBackToTop from './presentationalComponents/ButtonBackToTop.svelte'
  import Exercices from './presentationalComponents/Exercices.svelte'
  import Header from './presentationalComponents/header/Header.svelte'
  import SideMenuWrapper from './presentationalComponents/header/SideMenuWrapper.svelte'
  import ModalCapytalSettings from './presentationalComponents/modalCapytalSettings/ModalCapytalSettings.svelte'
  import ModalThirdApps from './presentationalComponents/ModalThirdApps.svelte'
  import Placeholder from './presentationalComponents/Placeholder.svelte'
  import SideMenu from './presentationalComponents/sideMenu/SideMenu.svelte'

  let isNavBarVisible: boolean = true
  let innerWidth = 0
  let isBackToTopButtonVisible = false
  let selectedThirdApps: string[]
  let thirdAppsChoiceModal: BasicClassicModal | undefined
  let showThirdAppsChoiceDialog = false
  let isMd: boolean
  let localeValue: Language = get(referentielLocale)
  let isSidenavOpened: boolean = true

  const unsubscribeToReferentielLocale = referentielLocale.subscribe(
    (value) => {
      localeValue = value
    },
  )

  let debug = false
  function log(str: string) {
    if (debug || window.logDebug > 1) {
      console.info(str)
    }
  }

  beforeUpdate(() => {
    log('Start.svelte beforeUpdate')
  })

  afterUpdate(() => {
    log('Start.svelte afterUpdate')
  })

  onMount(async () => {
    log('Start.svelte onMount')
    await tick() // globalOptions n'est pas encore initialisé si on n'attend pas
    if ($globalOptions.recorder === 'capytale') {
      handleCapytale()
    }
    addScrollListener()
    log('Fin Start.svelte onMount')
  })

  onDestroy(() => {
    log('Start.svelte destroyed')
    unsubscribeToReferentielLocale()
  })

  // Spécifique à Capytale
  let isSettingsDialogDisplayed = false
  // Gestion de la graine
  function buildUrlAndOpenItInNewTab(status: 'eleve' | 'usual') {
    const url = new URL('https://coopmaths.fr/alea/')
    for (const ex of $exercicesParams) {
      url.searchParams.append('uuid', ex.uuid)
      if (ex.id !== undefined) url.searchParams.append('id', ex.id)
      if (ex.nbQuestions !== undefined) {
        url.searchParams.append('n', ex.nbQuestions.toString())
      }
      if (ex.duration !== undefined) {
        url.searchParams.append('d', ex.duration.toString())
      }
      if (ex.sup !== undefined) url.searchParams.append('s', ex.sup)
      if (ex.sup2 !== undefined) url.searchParams.append('s2', ex.sup2)
      if (ex.sup3 !== undefined) url.searchParams.append('s3', ex.sup3)
      if (ex.sup4 !== undefined) url.searchParams.append('s4', ex.sup4)
      if (ex.sup5 !== undefined) url.searchParams.append('s5', ex.sup5)
      if (ex.alea !== undefined) url.searchParams.append('alea', ex.alea)
      if (ex.interactif === '1') url.searchParams.append('i', '1')
      if (ex.cd !== undefined) url.searchParams.append('cd', ex.cd)
      if (ex.cols !== undefined) {
        url.searchParams.append('cols', ex.cols.toString())
      }
    }
    switch (status) {
      case 'eleve':
        if ($canOptions.isChoosen) {
          url.searchParams.append('v', 'can')
        } else {
          url.searchParams.append('v', 'eleve')
        }
        break
      default:
        break
    }
    url.searchParams.append('title', $globalOptions.title ?? '')
    const presMode =
      $exercicesParams.length === 1 ? 'liste_exos' : 'un_exo_par_page'
    url.searchParams.append('es', buildEsParams(presMode))

    if ($canOptions.isChoosen) {
      if ($canOptions.durationInMinutes !== 0) {
        url.searchParams.append(
          'canD',
          $canOptions.durationInMinutes.toString(),
        )
      }
      if ($canOptions.subTitle !== '') {
        url.searchParams.append('canT', $canOptions.subTitle)
      }
      url.searchParams.append('canSA', $canOptions.solutionsAccess ? '1' : '0')
      if ($canOptions.solutionsAccess) {
        url.searchParams.append('canSM', $canOptions.solutionsMode)
      }
    }
    window.open(url, '_blank')?.focus()
  }

  function toggleCan() {
    if ($canOptions.isChoosen) {
      $globalOptions.setInteractive = '1'
    }
  }

  function showSettingsDialog() {
    isSettingsDialogDisplayed = true
  }

  const handleLanguage = (lang: string) => {
    let selectedLanguage: Language = ALLOWED_LANGUAGES[0]
    // on se déplace circulairement dans le tableau allowedLanguages
    // idée prise ici :https://dev.to/turneremma21/circular-access-of-array-in-javascript-j52
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
        const frenchID = (
          Object.keys(
            localisedIDToUuid['fr-FR'],
          ) as (keyof (typeof localisedIDToUuid)['fr-FR'])[]
        ).find((key) => {
          return localisedIDToUuid['fr-FR'][key] === list[i].uuid
        })
        list[i].id =
          localeID !== undefined && localeID.length !== 0 ? localeID : frenchID
      }
      return list
    })
    const event = new window.Event('languageHasChanged', {
      bubbles: true,
    })
    document.dispatchEvent(event)
    mathaleaUpdateUrlFromExercicesParams()
  }

  $: {
    isNavBarVisible = $globalOptions.v !== 'l'
    updateSelectedThirdApps()
    isMd = innerWidth >= SM_BREAKPOINT
  }

  function addScrollListener() {
    function updateBackToTopButtonVisibility() {
      isBackToTopButtonVisible =
        document.body.scrollTop > 500 ||
        document.documentElement.scrollTop > 500
    }
    window.addEventListener('scroll', () => updateBackToTopButtonVisibility())
  }

  /* MGu empeche le zoom sur double touch sur IPAD */
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault()
  })

  /* Pour que les apps puissent fermer la sidenav */
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'closeSidenav') {
      if (isSidenavOpened) toggleSidenav(false)
    }
  })

  function updateSelectedThirdApps() {
    const appsTierceReferentielArray: AppTierceGroup[] =
      Object.values(appsTierce)
    const uuidList: string[] = $exercicesParams.map(
      (exerciceParams) => exerciceParams.uuid,
    )
    selectedThirdApps = []
    for (const group of appsTierceReferentielArray) {
      for (const app of group.liste) {
        if (uuidList.includes(app.uuid)) {
          selectedThirdApps.push(app.uuid)
        }
      }
    }
  }

  function zoomUpdate(plusMinus: '+' | '-') {
    let zoom = Number($globalOptions.z)
    if (plusMinus === '+') zoom = Number.parseFloat((zoom + 0.1).toFixed(1))
    if (plusMinus === '-') zoom = Number.parseFloat((zoom - 0.1).toFixed(1))
    globalOptions.update((params) => {
      params.z = zoom.toString()
      return params
    })
  }

  function setAllInteractive(isAllInteractive: boolean) {
    let eventName: string
    if (isAllInteractive) {
      $globalOptions.setInteractive = '1'
      eventName = 'setAllInteractif'
    } else {
      $globalOptions.setInteractive = '0'
      eventName = 'removeAllInteractif'
    }
    const event = new window.Event(eventName, { bubbles: true })
    document.dispatchEvent(event)
  }

  function newDataForAll() {
    const newDataForAll = new window.Event('newDataForAll', { bubbles: true })
    document.dispatchEvent(newDataForAll)
  }

  function trash() {
    exercicesParams.set([])
    toggleSidenav(true)
  }

  function setFullScreen(isFullScreen: boolean) {
    globalOptions.update((params) => {
      isFullScreen ? (params.v = 'l') : (params.v = '')
      return params
    })
  }

  function handleExport(vue: VueType) {
    $previousView = ''
    globalOptions.update((params) => {
      params.v = vue
      return params
    })
  }

  function addExercise(uuid: string, id: string) {
    const newExercise: InterfaceParams = { uuid, id }
    if (
      $globalOptions.recorder === 'capytale' ||
      $globalOptions.setInteractive === '1'
    ) {
      newExercise.interactif = '1'
    }
    exercicesParams.update((list) => [...list, newExercise])
  }

  function backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function importExercises(urlFeuilleEleve: string) {
    const tempRecorder = $globalOptions.recorder
    let url = urlFeuilleEleve.replace('&v=confeleve', '')
    url = url.replace('&v=eleve', '&recorder=' + $globalOptions.recorder)
    if (url.includes('v=can')) {
      $canOptions.isChoosen = true
    }
    url = url.replace('&v=can', '&recorder=' + $globalOptions.recorder)
    // presMode|setInteractive|isSolutionAccessible|isInteractiveFree|oneShot|twoColumns|isTitleDisplayed|isReferenceDisplayed
    if (url.includes('coopmaths.fr/alea') || url.includes('mathalea.fr/alea')) {
      const options = mathaleaUpdateExercicesParamsFromUrl(url)
      if (options !== null) {
        // On utilise update() pour fusionner les options au lieu de les remplacer complètement
        // On force presMode à 'un_exo_par_page' lors de l'import
        globalOptions.update((current) => {
          return {
            ...current,
            ...options,
            recorder: tempRecorder,
            presMode: 'un_exo_par_page',
            title: '',
          }
        })
      } else {
        alert('URL non valide !')
      }
    }
  }

  /**
   * Gestion des référentiels
   */
  // Contexte pour le modal des apps tierces
  setContext('thirdAppsChoiceContext', {
    toggleThirdAppsChoiceDialog: () => {
      showThirdAppsChoiceDialog = !showThirdAppsChoiceDialog
      if (showThirdAppsChoiceDialog === false && thirdAppsChoiceModal) {
        thirdAppsChoiceModal.closeModal()
      }
    },
  })

  function updateParams(params: {
    globalOptions: InterfaceGlobalOptions
    canOptions: CanOptions
  }) {
    // MGu d'après bugsnag, il arrive que params.canOptions soit null!
    if (params.canOptions) canOptions.set(params.canOptions)
    if (params.globalOptions) globalOptions.set(params.globalOptions) // en dernier car c'est sa modification qui déclenche la mise à jour de l'url dans App.svelte qui prévient ensuite Capytale d'une mise à jour
  }

  function toggleSidenav(forceOpening: boolean): void {
    if (forceOpening) {
      isSidenavOpened = true
    } else {
      isSidenavOpened = !isSidenavOpened
    }
  }

  async function exportQcmCam(): Promise<void> {
    const exercises = await getExercisesFromExercicesParams()
    const exercisesQcms = exercises.filter((exercise) => {
      exercise.nouvelleVersion()
      const questionsQcm = exercise.autoCorrection.filter(
        (el) =>
          el.formatInteractif === 'qcm' &&
          el.propositions != null &&
          el.propositions?.length > 1,
      ).length
      return questionsQcm !== 0
    })

    if (exercisesQcms.length === 0) {
      alert(
        "Il n'y a pas encore d'export vers QCM Cam pour les exercices sélectionnés",
      )
      return
    }
    const content = qcmCamExportAll(exercisesQcms)
    if (content === '{}') {
      alert(
        "Il n'y a pas encore d'export vers QCM Cam pour les exercices sélectionnés",
      )
      return
    }
    downloadFile(content, 'questions.txt') // @todo Si possible, il faudrait l'nvoyer directement à travers l'ouverture d'un nouvel onglet qcmcam.net avec le lien vers ce fichier en argument.
  }
</script>

<svelte:window bind:innerWidth />
{#if $globalOptions.v === '' || $globalOptions.v === undefined || $globalOptions.v === 'l'}
  <div
    class="{$darkMode.isActive
      ? 'dark'
      : ''} relative flex w-screen h-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
    id="startComponent"
  >
    <div class="flex-1 flex flex-col w-full md:overflow-hidden">
      <Header
        {isNavBarVisible}
        isExerciseDisplayed={$exercicesParams.length !== 0}
        {zoomUpdate}
        {setAllInteractive}
        {newDataForAll}
        {trash}
        {setFullScreen}
        {handleExport}
        handleRecorder={sendActivityParams}
        locale={localeValue}
        {handleLanguage}
        isCapytale={$globalOptions.recorder === 'capytale'}
        isRecorder={!!$globalOptions.recorder}
        {buildUrlAndOpenItInNewTab}
        {showSettingsDialog}
        {importExercises}
        isExercisesListEmpty={$exercicesParams.length === 0}
        {isSidenavOpened}
        {toggleSidenav}
        {exportQcmCam}
        {isMd}
        isFlowmath={$globalOptions.recorder === 'flowmath'}
      />
      {#if isMd}
        <!-- ====================================================================================
                    MODE NORMAL
  ========================================================================================= -->
        <!-- Menu choix + Exos en mode non-smartphone -->
        <div
          class="relative flex w-full h-full bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        >
          {#if $globalOptions.recorder}
            <SideMenuWrapper
              isRecorder={$globalOptions.recorder === 'capytale'}
              {isSidenavOpened}
              {toggleSidenav}
              {isMd}
            />
          {/if}
          <Sidenav isOpen={isSidenavOpened} width={400}>
            <div
              class="w-full bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
            >
              <SideMenu {addExercise} />
            </div>
          </Sidenav>
          <!-- Affichage exercices -->
          <main
            id="exercisesPart"
            class="absolute right-0 top-0 flex flex-col w-full h-full px-6 overflow-x-auto overflow-y-auto
            transition-[padding-left] duration-300
            bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
            style="padding-left: {$globalOptions.recorder
              ? isSidenavOpened
                ? '425px'
                : '25px'
              : isSidenavOpened
                ? '400px'
                : '0px'}"
          >
            <!-- MGu si la vue n'est pas START, le composant va être detruit et ici ca empeche de charger des exos inutilement-->
            {#if $exercicesParams.length !== 0 && ($globalOptions.v === '' || $globalOptions.v === undefined || $globalOptions.v === 'l')}
              <Exercices exercicesParams={$exercicesParams} {toggleSidenav} />
            {:else}
              <Placeholder text="Sélectionner les exercices" />
            {/if}
          </main>
        </div>
      {:else}
        <!-- ====================================================================================
                  MODE SMARTPHONE
========================================================================================= -->
        <div
          class="flex flex-col h-full justify-between bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        >
          <!-- Menu choix en mode smartphone -->
          <div>
            <div
              class="w-full flex flex-col bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
            >
              <button
                type="button"
                class="group w-full flex flex-row justify-between items-center p-4"
                aria-expanded={isSidenavOpened}
                aria-controls="choiceMenuWrapper"
                on:click={() => (isSidenavOpened = !isSidenavOpened)}
              >
                <div
                  class="text-lg font-bold text-coopmaths-action dark:text-coopmathsdark-action hover:text-coopmaths-action-lightest hover:dark:text-coopmathsdark-action-lightest"
                >
                  Choix des exercices
                </div>
                <i
                  class="bx bxs-up-arrow text-lg text-coopmaths-action dark:text-coopmathsdark-action hover:text-coopmaths-action-lightest hover:dark:text-coopmathsdark-action-lightest transition-transform duration-300 {isSidenavOpened
                    ? 'rotate-0'
                    : 'rotate-180'}"
                ></i>
              </button>
              {#if isSidenavOpened}
                <div
                  id="choiceMenuWrapper"
                  class="w-full overflow-y-visible overscroll-contain bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
                >
                  <SideMenu {addExercise} />
                </div>
              {/if}
            </div>
            <!-- Affichage exercices en mode smartphone -->
            <main
              id="exercisesPart"
              class="flex w-full px-6 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
            >
              {#if $exercicesParams.length !== 0}
                <Exercices exercicesParams={$exercicesParams} {toggleSidenav} />
              {:else}
                <Placeholder text="Sélectionner les exercices" />
              {/if}
            </main>
          </div>
          <Footer />
        </div>
      {/if}
    </div>
    <Keyboard />
  </div>
  <ButtonBackToTop {isBackToTopButtonVisible} {backToTop} />
  <ModalThirdApps
    {thirdAppsChoiceModal}
    {showThirdAppsChoiceDialog}
    appsTierceInExercisesList={selectedThirdApps}
  />
  <ModalCapytalSettings
    bind:isSettingsDialogDisplayed
    globalOptions={$globalOptions}
    canOptions={$canOptions}
    {toggleCan}
    {buildUrlAndOpenItInNewTab}
    {updateParams}
  />
{/if}

<style>
  :root {
    scrollbar-color: #aaaaaa transparent;
  }
  /* Webkit scrollbar styling for Chrome/Safari */
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
