<script lang="ts">
  import { onMount } from 'svelte'
  import { buildMathAleaURL } from '../../../lib/components/urls'
  import {
    mathaleaGenerateSeed,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea.js'
  import { canOptions } from '../../../lib/stores/canStore'
  import { darkMode, exercicesParams } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import Footer from '../../Footer.svelte'
  import ButtonActionInfo from '../../shared/forms/ButtonActionInfo.svelte'
  import ButtonQRCode from '../../shared/forms/ButtonQRCode.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import FormRadio from '../../shared/forms/FormRadio.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import Tabs from '../../shared/ui/Tabs.svelte'
  import ReglagesCan from './sections/ReglagesCan.svelte'
  import ReglagesClassique from './sections/ReglagesClassique.svelte'
  import ReglagesDonnees from './sections/ReglagesDonnees.svelte'

  $: activeTab = $canOptions.isChoosen ? 'can' : 'classic'

  const tabs = [
    {
      id: 'classic',
      label: 'Présentation classique',
      ariaControls: 'tabs-pres-classic',
    },
    { id: 'can', label: 'Course aux nombres', ariaControls: 'tabs-pres-can' },
  ]

  function handleTabChange(e: CustomEvent<string>) {
    $canOptions.isChoosen = e.detail !== 'classic'
  }

  onMount(() => {
    handleSeed()
  })

  const availableLinkFormats = {
    clear: {
      toolTipsMessage: 'En clair',
      icon: 'bx-glasses-alt',
      isShort: false,
      isEncrypted: false,
    },
    short: {
      toolTipsMessage: 'Raccourci',
      icon: 'bx-move-horizontal',
      isShort: true,
      isEncrypted: false,
    },
    crypt: {
      toolTipsMessage: 'Crypté',
      icon: 'bx-lock',
      isShort: false,
      isEncrypted: true,
    },
  }
  // L'interactivité de la Course aux nombres (`canOptions.isInteractive`) est
  // réglée dans son propre onglet : elle ne doit pas être liée au réglage
  // « Interactivité » de la présentation classique
  // (`globalOptions.setInteractive`), qui ne concerne que la page Élève.
  type LinkFormat = keyof typeof availableLinkFormats
  let currentLinkFormat: LinkFormat = 'clear'

  /**
   * Raccourcissement du lien Élève via edurl.fr (API Shlink de
   * raccourcisseur.apps.education.fr), via le même relais CORS n8n dédié
   * à MathALÉA que le QR-code global de l'export Typst
   * (`TypstLayoutOverlay.svelte`) — même jeton local (clé localStorage
   * partagée), pour ne pas le redemander deux fois à la même personne.
   */
  const EDURL_TOKEN_KEY = 'mathalea-edurl-token'
  const EDURL_API_URL =
    'https://n8n.incubateur.education.gouv.fr/webhook/mathalea-edurl-relay'

  function getEdurlToken(): string | null {
    try {
      return window.localStorage.getItem(EDURL_TOKEN_KEY)
    } catch {
      return null
    }
  }

  function setEdurlToken(value: string) {
    try {
      window.localStorage.setItem(EDURL_TOKEN_KEY, value)
    } catch {
      // stockage indisponible (navigation privée, quota...) : le jeton sera
      // simplement redemandé au prochain raccourcissement
    }
  }

  function clearEdurlToken() {
    try {
      window.localStorage.removeItem(EDURL_TOKEN_KEY)
    } catch {
      // rien à faire : sans stockage, il n'y avait de toute façon rien à retirer
    }
  }

  function pad2(n: number): string {
    return String(n).padStart(2, '0')
  }

  /** `mathalea-<date>-<hhmmss>-<titre de la fiche>`, heure locale du poste */
  function edurlLinkTitle(): string {
    const now = new Date()
    const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
    const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
    return `mathalea-${date}-${time}-${$globalOptions.title ?? ''}`
  }

  async function callEdurl(longUrl: string, token: string): Promise<string> {
    const response = await fetch(EDURL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        longUrl,
        title: edurlLinkTitle(),
        enabled: true,
        token,
      }),
    })
    if (response.status === 401) {
      throw { code: 'TOKEN_INVALID' }
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw { code: 'HTTP_ERROR', message: text || `Erreur ${response.status}` }
    }
    const data = await response.json()
    return data.shortUrl
  }

  let edurlAskToken = false
  let edurlTokenInput = ''
  let edurlBusy = false
  let edurlError = ''
  // Résultat du raccourcissement pour l'URL longue courante (`eleveUrl` hors
  // raccourci) : invalidé (repassé à null) dès que cette URL change, pour ne
  // jamais servir un raccourci périmé correspondant à d'anciens réglages.
  let shortenedUrl: string | null = null
  let shortenedUrlSource: string | null = null

  async function shortenEleveUrl(longUrl: string) {
    const token = getEdurlToken()
    if (token == null) {
      edurlAskToken = true
      return
    }
    edurlError = ''
    edurlBusy = true
    try {
      shortenedUrl = await callEdurl(longUrl, token)
      shortenedUrlSource = longUrl
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code
      if (code === 'TOKEN_INVALID') {
        clearEdurlToken()
        edurlAskToken = true
        edurlError = "Ce jeton n'est plus valide. Merci d'en saisir un nouveau."
      } else {
        edurlError =
          (err as { message?: string } | undefined)?.message ??
          'Une erreur est survenue.'
      }
    } finally {
      edurlBusy = false
    }
  }

  function saveEdurlTokenAndShorten() {
    const value = edurlTokenInput.trim()
    if (!value) return
    setEdurlToken(value)
    edurlTokenInput = ''
    edurlAskToken = false
    shortenEleveUrl(eleveLongUrl)
  }

  function forgetEdurlToken() {
    clearEdurlToken()
    edurlAskToken = false
  }

  /** Sélection du format « Raccourci » : lance le raccourcissement si le
   *  résultat en cache ne correspond plus à l'URL longue courante. */
  function handleLinkFormatChange() {
    if (
      currentLinkFormat === 'short' &&
      shortenedUrlSource !== eleveLongUrl &&
      !edurlBusy
    ) {
      shortenEleveUrl(eleveLongUrl)
    }
  }

  /**
   * Construit l'URL correspondant aux choix de la page de configuration et bascule sur cette page
   */
  function handleVueSetUp() {
    const nextView = $canOptions.isChoosen ? 'can' : 'eleve'
    const url = buildMathAleaURL({
      view: nextView,
      isEncrypted: availableLinkFormats[currentLinkFormat].isEncrypted,
      removeSeed: isDataRandom,
    })
    window.open(url, '_blank')?.focus()
  }

  // Gestion de la graine
  let isDataRandom: boolean = false
  function handleSeed() {
    for (const param of $exercicesParams) {
      if (!isDataRandom && param.alea === undefined) {
        param.alea = mathaleaGenerateSeed()
      } else if (isDataRandom) {
        param.alea = undefined
      }
    }
    mathaleaUpdateUrlFromExercicesParams($exercicesParams)
  }

  // `buildMathAleaURL` lit `globalOptions` via `get()`, ce qui n'est pas
  // détecté par le compilateur Svelte comme une dépendance réactive : on
  // référence explicitement `$globalOptions.presMode` pour forcer le
  // recalcul à chaque changement des réglages (interactivité, etc.)
  // URL longue, jamais cryptée : c'est elle qu'on raccourcit via edurl.fr
  // (on ne raccourcit jamais un lien déjà crypté/illisible côté Shlink).
  $: eleveLongUrl = buildMathAleaURL({
    view: $canOptions.isChoosen ? 'can' : 'eleve',
    isEncrypted: false,
    removeSeed: isDataRandom,
    mode: $globalOptions.presMode,
  }).toString()

  // Le format actif change l'URL affichée (clair/crypté), toujours calculée
  // pour permettre de raccourcir sans attendre la fin du chargement en cours ;
  // le format « Raccourci » relance lui-même le raccourcissement dès que les
  // réglages changent (voir handleLinkFormatChange).
  $: eleveUrlForCurrentFormat = buildMathAleaURL({
    view: $canOptions.isChoosen ? 'can' : 'eleve',
    isEncrypted: availableLinkFormats[currentLinkFormat].isEncrypted,
    removeSeed: isDataRandom,
    mode: $globalOptions.presMode,
  }).toString()

  // Tant que le raccourci n'est pas prêt pour l'URL longue courante, on
  // affiche l'URL longue en repli plutôt qu'un lien vide ou périmé.
  $: eleveUrl =
    currentLinkFormat === 'short'
      ? (shortenedUrlSource === eleveLongUrl && shortenedUrl) || eleveLongUrl
      : eleveUrlForCurrentFormat

  // Relâche un raccourci obsolète dès que les réglages changent l'URL longue,
  // et relance automatiquement le raccourcissement si le format « Raccourci »
  // est déjà sélectionné (jeton déjà connu) pour éviter de laisser affiché
  // un ancien lien correspondant à d'anciens réglages.
  $: if (shortenedUrlSource !== null && shortenedUrlSource !== eleveLongUrl) {
    shortenedUrl = null
    shortenedUrlSource = null
    if (
      currentLinkFormat === 'short' &&
      !edurlBusy &&
      getEdurlToken() != null
    ) {
      shortenEleveUrl(eleveLongUrl)
    }
  }
</script>

<main
  class=" {$darkMode.isActive
    ? 'dark'
    : ''} mb-auto flex flex-col min-h-screen justify-start bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
>
  <NavBar
    subtitle="La page Élève"
    subtitleType="export"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />
  <div
    class="flex flex-col h-full w-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
  >
    <div
      class="h-full w-full md:w-2/3 lg:w-3/5 flex flex-col px-4 pb-4 md:py-10 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark mx-auto"
    >
      <div
        class="flex flex-col md:flex-row justify-start px-4 py-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        <h3
          class="font-bold text-2xl text-coopmaths-struct dark:text-coopmathsdark-struct bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
        >
          Réglages
        </h3>
      </div>
      <!-- Tabulations pour la présentation -->
      <Tabs {tabs} {activeTab} on:change={handleTabChange} />
      <!-- Pages des réglages -->
      <div class="pb-6 pt-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
        <div
          class="transition-opacity duration-150 ease-linear {activeTab ===
          'classic'
            ? 'block opacity-100'
            : 'hidden opacity-0'}"
          id="tabs-pres-classic"
          role="tabpanel"
          aria-labelledby="tabs-pres-classic-btn"
        >
          <!-- Présentation classique -->
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            Les exercices seront posés suivant les réglages ci-dessous.
          </div>
          <ReglagesClassique
            bind:globalOptions={$globalOptions}
            canOptions={$canOptions}
            onAffichageToggle={handleSeed}
          />
        </div>
        <div
          class="transition-opacity duration-150 ease-linear
          {activeTab === 'can' ? 'block opacity-100' : 'hidden opacity-0'}"
          id="tabs-pres-can"
          role="tabpanel"
          aria-labelledby="tabs-pres-can-btn"
        >
          <!-- Can -->
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            Les questions seront posées les unes à la suite des autres en temps
            limité.
          </div>
          <ReglagesCan bind:canOptions={$canOptions} />
        </div>
      </div>

      <div
        class="pt-2 pl-2 grid grid-flow-row md:grid-cols-2 gap-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      >
        <ReglagesDonnees bind:isDataRandom />
      </div>
      <div
        class="pt-4 pb-8 px-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      >
        <ButtonTextAction
          on:click={handleVueSetUp}
          class="px-2 py-1 rounded-md"
          text="Visualiser"
        />
      </div>
      <div
        class="flex flex-row justify-start px-4 pt-4 pb-2 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        <h3
          class="font-bold text-2xl text-coopmaths-struct dark:text-coopmathsdark-struct"
        >
          Utilisation
        </h3>
      </div>
      <div class="py-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
        <div
          class="flex flex-col md:flex-row justify-start space-x-10 items-start md:items-center px-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        >
          <div
            class="text-coopmaths-struct-light dark:text-coopmathsdark-struct-light font-semibold"
          >
            Format de l'URL
          </div>
          <div class="flex">
            <FormRadio
              title="linkFormat"
              bind:valueSelected={currentLinkFormat}
              on:newvalue={handleLinkFormatChange}
              labelsValues={[
                { label: 'En clair', value: 'clear' },
                { label: 'Crypté', value: 'crypt' },
                { label: 'Raccourci (edurl.fr)', value: 'short' },
              ]}
              orientation="row"
            />
          </div>
        </div>
        {#if currentLinkFormat === 'short'}
          <div class="flex flex-col items-start px-4 pt-2 space-y-1">
            {#if edurlAskToken}
              <div class="flex flex-row items-center gap-2">
                <label
                  for="edurl-token"
                  class="text-sm font-light text-coopmaths-corpus/70 dark:text-coopmathsdark-corpus/70"
                >
                  Jeton d’accès edurl.fr&nbsp;:
                </label>
                <input
                  id="edurl-token"
                  type="password"
                  class="rounded border border-coopmaths-action/40 px-1.5 py-0.5 text-xs"
                  autocomplete="off"
                  spellcheck="false"
                  bind:value={edurlTokenInput}
                  on:keydown={(e) => {
                    if (e.key === 'Enter') saveEdurlTokenAndShorten()
                    if (e.key === 'Escape') edurlAskToken = false
                  }}
                />
                <ButtonTextAction
                  on:click={saveEdurlTokenAndShorten}
                  class="px-2 py-0.5 text-xs rounded-md"
                  text="Enregistrer et raccourcir"
                />
              </div>
            {:else if edurlBusy}
              <div
                class="flex items-center gap-1 text-xs text-coopmaths-corpus/70 dark:text-coopmathsdark-corpus/70"
              >
                <i class="bx bx-loader-alt bx-spin"></i>
                Raccourcissement du lien en cours…
              </div>
            {:else}
              <button
                type="button"
                class="text-xs text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action"
                on:click={forgetEdurlToken}
              >
                Oublier le jeton edurl.fr
              </button>
            {/if}
            {#if edurlError}
              <p class="text-xs text-red-600">{edurlError}</p>
            {/if}
          </div>
        {/if}
        <div
          class="flex flex-row justify-start items-start space-x-10 pt-3 pl-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        >
          <div class="flex flex-col items-center px-2">
            <div
              class="text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-light font-semibold"
            >
              Lien
            </div>
            <div class="my-1">
              <ButtonActionInfo
                action="copy"
                textToCopy={eleveUrl}
                tooltip={'Lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage}
                icon={'bx-link text-2xl'}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
                messageSuccess="Le lien de la fiche élève est copié dans le presse-papier !"
                messageError="Impossible de copier le lien dans le presse-papier !"
              />
            </div>
          </div>
          <div class="flex flex-col justify-center items-center px-2">
            <div
              class="font-semibold
              text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-lightest"
            >
              QR-Code
            </div>
            <div class="my-1">
              <ButtonQRCode
                tooltip={'QR-code (lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage +
                  ')'}
                customUrl={eleveUrl}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
              />
            </div>
          </div>
          <div class="flex flex-col justify-center items-center px-2">
            <div
              class="text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-light font-semibold"
            >
              Embarqué
            </div>
            <div class="my-1">
              <ButtonActionInfo
                action="copy"
                textToCopy={`<iframe src="${eleveUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`}
                tooltip={'Code (lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage +
                  ')'}
                icon={'bx-code-alt text-2xl'}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
                messageSuccess="Le code de la fiche élève est copié dans le presse-papier !"
                messageError="Impossible de copier le code dans le presse-papier !"
              />
            </div>
          </div>
          <div class="flex flex-col justify-center items-center px-2">
            <div
              class="text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-light font-semibold"
            >
              Fichier
            </div>
            <div class="my-1">
              <ButtonActionInfo
                action="download"
                urlToDownload={eleveUrl}
                fileName={$globalOptions.title
                  ? $globalOptions.title
                  : 'mathAlea'}
                successMessage="Le téléchargement va début dans quelques instants."
                errorMessage="Impossible de télécharger le fichier."
                tooltip={'Fichier de redirection (lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage +
                  ')'}
                icon={'bxs-file-export text-2xl'}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</main>
