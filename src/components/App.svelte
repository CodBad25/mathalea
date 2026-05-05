<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { Unsubscriber } from 'svelte/store'
  import { checkBrowserVersion } from '../lib/components/browserVersion'
  import { fetchServerVersion } from '../lib/components/version'
  import {
    mathaleaUpdateExercicesParamsFromUrl,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../lib/mathalea'
  import { canOptions } from '../lib/stores/canStore'
  import {
    darkMode,
    exercicesParams,
    freezeUrl,
    isInIframe,
  } from '../lib/stores/generalStore'
  import { globalOptions } from '../lib/stores/globalOptions'
  import { updateReferentielLocaleFromURL } from '../lib/stores/languagesStore'
  import { vendor } from '../lib/stores/vendorStore'
  import type { CanSolutionsMode } from '../lib/types/can'
  import { context } from '../modules/context'

  import Can from './display/can/Can.svelte'
  import Eleve from './display/eleve/Eleve.svelte'
  import Alacarte from './setup/alacarte/Alacarte.svelte'
  import Amc from './setup/amc/Amc.svelte'
  import Anki from './setup/anki/Anki.svelte'
  import ConfigEleve from './setup/configEleve/ConfigEleve.svelte'
  import Diaporama from './setup/diaporama/Diaporama.svelte'
  import Latex from './setup/latex/Latex.svelte'
  import Pdf from './setup/latex/Pdf.svelte'
  import RawLatex from './setup/latex/RawLatex.svelte'
  import Moodle from './setup/moodle/Moodle.svelte'
  import Start from './setup/start/Start.svelte'
  import Tools from './setup/tools/Tools.svelte'
  import Popup from './shared/modal/Popup.svelte'

  let showPopup = false
  let popupMessage = ''
  let globalOptionsUnsubscriber: Unsubscriber
  let exercicesParamsUnsubscriber: Unsubscriber

  function handlePopupClose() {
    // console.log('Popup has been closed');
    showPopup = false
  }

  onMount(() => {
    updateParams()
    addEventListener('popstate', updateParams)
    globalOptionsUnsubscriber = globalOptions.subscribe(() => {
      updateContext() // Si on attend les 500 ms de mise à jour de l'url, la sortie LaTeX sera chargée avant la mise à jour du contexte et on se retrouvera avec du svg dans le LaTeX
      updateVendor() // Par prévention, on met aussi à jour le vendor
      mathaleaUpdateUrlFromExercicesParams()
    })
    exercicesParamsUnsubscriber = exercicesParams.subscribe(() => {
      mathaleaUpdateUrlFromExercicesParams()
    })

    const version = checkBrowserVersion()
    if (version.popupMessage.length > 0) {
      showPopup = true
      popupMessage = version.popupMessage
    }
  })

  onDestroy(() => {
    removeEventListener('popstate', updateParams)
    globalOptionsUnsubscriber()
    exercicesParamsUnsubscriber()
  })

  // charge le numéro de version du serveur
  fetchServerVersion()

  // Gestion des recorders (Moodle, Capytale, etc. )
  // Lorsque la page d'accueil est dans un iFrame, l'URL est bloquée et les boutons d'exports cachés
  const url = new URL(window.location.href)
  const recorder = url.searchParams.get('recorder')
  if (recorder !== null) {
    isInIframe.set(true)
    freezeUrl.set(true)
  } else {
    isInIframe.set(false)
  }

  // le plus tôt possible, on met à jour la vue
  // const view = url.searchParams.get('v') ?? ''
  // const v = convertVueType(view) ?? ''
  // globalOptions.update((options) => {
  //   options.v = v
  //   return options
  // })

  // Gestion des paramètres de la CAN
  const canDuration = url.searchParams.get('canD')
  if (canDuration !== null) {
    $canOptions.durationInMinutes = parseInt(canDuration)
  }
  const canSub = url.searchParams.get('canT')
  if (canSub !== null) {
    $canOptions.subTitle = canSub
  }
  const canSolAccess = url.searchParams.get('canSA')
  if (canSolAccess !== null) {
    $canOptions.solutionsAccess = canSolAccess === '1'
  }
  const canSolMode = url.searchParams.get('canSM')
  if (canSolMode !== null) {
    $canOptions.solutionsMode = canSolMode as CanSolutionsMode
  }
  const canIsInteractive = url.searchParams.get('canI')
  if (canIsInteractive !== null) {
    $canOptions.isInteractive = canIsInteractive === '1'
  }

  function updateParams() {
    updateParamsFromUrl()
    updateContext()
    updateVendor()
  }

  function updateParamsFromUrl() {
    updateReferentielLocaleFromURL()
    const urlOptions = mathaleaUpdateExercicesParamsFromUrl()
    if (JSON.stringify($globalOptions) !== JSON.stringify(urlOptions)) {
      globalOptions.set(urlOptions)
    }
  }

  function updateContext() {
    context.isDiaporama = $globalOptions.v === 'diaporama'
    if (
      $globalOptions.v === 'latex' ||
      $globalOptions.v === 'pdf' ||
      $globalOptions.v === 'raw'
    ) {
      context.isHtml = false
    } else {
      context.isHtml = true
    }
    if ($globalOptions.v === 'confeleve') {
      context.isHtml = false
    }
    if ($globalOptions.v === 'alacarte') {
      context.isHtml = false
    }
    if ($globalOptions.v === 'amc') {
      context.isAmc = true
      context.isHtml = false
    } else {
      context.isAmc = false
    }
    context.vue = ''
    if ($globalOptions.v === 'diaporama') context.vue = 'diap' // for compatibility
    if ($globalOptions.v === 'latex' || $globalOptions.v === 'raw')
      context.vue = 'latex' // for compatibility
    if ($globalOptions.v === 'can') context.vue = 'can' // for compatibility
    // lorsque l'éditeur sera intégré à la v3, il faudra mettre à true cette propriété pour l'editeur
    context.isInEditor = false
  }

  function updateVendor() {
    // initialisation du vendor pour l'intégration de la bannière dans la vue élève
    if ($globalOptions.v === 'myriade') {
      $vendor.product = {
        name: 'indices',
        logoPath: 'assets/images/vendors/bordas/myriade-bordas-logo.png',
      }
    }
    if ($globalOptions.v === 'indices') {
      $vendor.product = {
        name: 'indices',
        logoPath: 'assets/images/vendors/bordas/indices-bordas-logo.png',
      }
    }
  }

  function isDevMode() {
    return window.location.href.startsWith('http://localhost')
  }
</script>

<div
  class=" {$darkMode.isActive
    ? 'dark'
    : ''} subpixel-antialiased bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
  id="appComponent"
>
  {#if showPopup}
    <Popup
      message={popupMessage}
      visible={showPopup}
      onClose={handlePopupClose}
    />
  {:else if $globalOptions.v === 'diaporama' || $globalOptions.v === 'overview'}
    <Diaporama />
  {:else if $globalOptions.v === 'can'}
    <Can />
  {:else if $globalOptions.v === 'eleve' || $globalOptions.v === 'indices' || $globalOptions.v === 'myriade'}
    <Eleve />
  {:else if $globalOptions.v === 'latex'}
    <Latex />
  {:else if $globalOptions.v === 'raw'}
    <RawLatex />
  {:else if $globalOptions.v === 'alacarte'}
    <Alacarte />
  {:else if $globalOptions.v === 'confeleve'}
    <ConfigEleve />
  {:else if $globalOptions.v === 'amc'}
    <Amc />
  {:else if $globalOptions.v === 'moodle'}
    <Moodle />
  {:else if $globalOptions.v === 'anki'}
    <Anki />
  {:else if $globalOptions.v === 'pdf'}
    <Pdf />
  {:else if $globalOptions.v === 'tools'}
    <Tools />
  {:else if $globalOptions.v !== undefined}
    <Start />
  {/if}
</div>

{#if isDevMode()}
  <dialog
    id="notifDialog"
    class="rounded-xl p-6 bg-coopmaths-canvas text-coopmaths-corpus dark:bg-coopmathsdark-canvas-dark dark:text-coopmathsdark-corpus-light shadow-lg"
  ></dialog>
{/if}
