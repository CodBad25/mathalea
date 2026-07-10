<script lang="ts">
  import AmcIcon from '../../../../../../../components/shared/icons/AmcIcon.svelte'
  import AnkiIcon from '../../../../../../../components/shared/icons/AnkiIcon.svelte'
  import MoodleIcon from '../../../../../../../components/shared/icons/MoodleIcon.svelte'
  import PdfTextIcon from '../../../../../../../components/shared/icons/PdfTextIcon.svelte'
  import type { VueType } from '../../../../../../../lib/VueType'
  import ButtonActionInfo from '../../../../../../shared/forms/ButtonActionInfo.svelte'
  import ButtonIconTooltip from '../../../../../../shared/forms/ButtonIconTooltip.svelte'
  import { exportKutsum } from '../../../../../../../lib/kutsum'
  import QcmCamIcon from '../../../../../../shared/icons/QcmCamIcon.svelte'
  import { downloadFile } from '../../../../../../../lib/files'
  import { buildMathAleaURL } from '../../../../../../../lib/components/urls'
  import BasicInfoModal from '../../../../../../shared/modal/BasicInfoModal.svelte'

  export let handleExport: (vue: VueType) => void
  export let exportQcmCam: () => Promise<void>

  // Bouton Kutsum masqué en production — activer avec ?kutsum=1 dans l'URL
  const showKutsum =
    new URLSearchParams(window.location.search).get('kutsum') === '1' ||
    window.location.hostname === 'localhost'

  const showA4 =
    new URLSearchParams(window.location.search).get('beta') === '1' ||
    window.location.hostname === 'localhost'

  let showMoreModal = false
  let moreDialog: HTMLDialogElement
  let downloadContentDisplayed: 'success' | 'error' | 'none' = 'none'

  function downloadRedirectFile() {
    const text = `<html><head><meta http-equiv="refresh" content="0;URL=${encodeURI(buildMathAleaURL({}).toString())}"></head></html>`
    downloadFile(text, 'mathAlea.html').then((returnString) => {
      downloadContentDisplayed = returnString
    })
  }

  $: if (moreDialog && showMoreModal) moreDialog.showModal()
  $: if (moreDialog && !showMoreModal) moreDialog.close()

  function exportAndClose(vue: VueType) {
    showMoreModal = false
    handleExport(vue)
  }

  interface ExportOption {
    id: string
    label: string
    description: string
    icon?: string
    component?: any
    action: () => void
  }

  const exportOptions: ExportOption[] = [
    {
      id: 'moodle',
      label: 'Moodle',
      description: 'Pour importer dans la plateforme Moodle ou ÉLÉA',
      component: MoodleIcon,
      action: () => exportAndClose('moodle'),
    },
    {
      id: 'typst',
      label: 'PDF via Typst',
      description: 'Pour générer un PDF avec le moteur de composition Typst',
      icon: 'bx bx-code-alt',
      action: () => exportAndClose('typst'),
    },
    {
      id: 'alacarte',
      label: 'À la carte',
      description:
        "Pour créer un PDF personnalisé en associant des sélections d'exercices à des élèves",
      icon: 'bx bx-layout',
      action: () => exportAndClose('alacarte'),
    },
    {
      id: 'qcmcam',
      label: 'QCM Cam',
      description: "La web'app pour sonder avec une webcam ou un smartphone",
      component: QcmCamIcon,
      action: () => {
        showMoreModal = false
        exportQcmCam()
      },
    },
    {
      id: 'amc',
      label: 'AMC',
      description:
        'Auto Multiple Choice - Pour la correction automatisée avec scan des copies',
      component: AmcIcon,
      action: () => exportAndClose('amc'),
    },
    {
      id: 'anki',
      label: 'Anki',
      description:
        'Pour les flashcards et apprentissage par répétition espacée',
      component: AnkiIcon,
      action: () => exportAndClose('anki'),
    },
    // Kutsum masqué en production — visible uniquement avec ?kutsum=1 dans l'URL
    ...(showKutsum
      ? [
          {
            id: 'kutsum',
            label: 'Kutsum',
            description: 'Pour créer des quiz interactifs sur Kutsum',
            icon: 'bx bx-game',
            action: () => {
              showMoreModal = false
              exportKutsum()
            },
          } satisfies ExportOption,
        ]
      : []),
  ]
</script>

<ButtonIconTooltip
  icon="bx-slideshow text-3xl"
  tooltip="Diaporama"
  on:click={() => handleExport('diaporama')}
/>
<ButtonIconTooltip
  icon={'bx-link text-3xl'}
  cornerIcon="bxs-graduation"
  cornerIconClass="text-coopmaths-action dark:text-coopmathsdark-action"
  tooltip="Lien pour les élèves"
  on:click={() => handleExport('confeleve')}
/>
<button
  class="tooltip tooltip-bottom tooltip-neutral"
  data-tip="PDF via LaTeX"
  on:click={() => handleExport('latex')}
>
  <PdfTextIcon
    class="w-7 h-7 hover:fill-coopmaths-action-lightest fill-coopmaths-action dark:fill-coopmathsdark-action dark:hover:fill-coopmathsdark-action-lightest"
  />
</button>
{#if showA4}
  <ButtonIconTooltip
    icon="bx-printer text-3xl"
    tooltip="Impression"
    on:click={() => handleExport('a4')}
  />
{/if}
<ButtonIconTooltip
  icon="bx-dots-horizontal-rounded text-3xl"
  tooltip="Plus d'exports"
  on:click={() => (showMoreModal = true)}
/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
  bind:this={moreDialog}
  on:click|self={() => (showMoreModal = false)}
  on:close={() => (showMoreModal = false)}
  class="m-auto rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto
    text-coopmaths-corpus dark:text-coopmathsdark-corpus
    bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
>
  <div class="relative">
    <button
      class="absolute top-0 right-0 text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:text-coopmaths-action dark:hover:text-coopmathsdark-action"
      aria-label="Fermer"
      on:click={() => (showMoreModal = false)}
    >
      <i class="bx bx-x text-2xl"></i>
    </button>
    <h2
      class="text-2xl font-bold mb-6 text-coopmaths-struct dark:text-coopmathsdark-struct"
    >
      Autres exports
    </h2>
    <div class="grid grid-cols-1 gap-4">
      {#each exportOptions as option (option.id)}
        <button
          class="flex items-start gap-4 p-4 rounded-lg hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark transition-colors"
          on:click={option.action}
        >
          <div class="shrink-0 pt-1">
            {#if option.component}
              <svelte:component
                this={option.component}
                class="w-10 h-10 text-coopmaths-action dark:text-coopmathsdark-action"
              />
            {:else if option.icon}
              <i
                class="{option.icon} text-3xl text-coopmaths-action dark:text-coopmathsdark-action"
              ></i>
            {/if}
          </div>
          <div class="flex-1 text-left">
            <p
              class="font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct mb-1"
            >
              {option.label}
            </p>
            <p
              class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus opacity-75"
            >
              {option.description}
            </p>
          </div>
          <div class="shrink-0 pt-1">
            <i
              class="bx bx-chevron-right text-2xl text-coopmaths-action dark:text-coopmathsdark-action opacity-50"
            ></i>
          </div>
        </button>
      {/each}

      <button
        class="flex items-start gap-4 p-4 rounded-lg hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark transition-colors"
        on:click={() => {
          showMoreModal = false
          downloadRedirectFile()
        }}
      >
        <div class="shrink-0 pt-1">
          <i
            class="bx bxs-file-export text-3xl text-coopmaths-action dark:text-coopmathsdark-action"
          ></i>
        </div>
        <div class="flex-1 text-left">
          <p
            class="font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct mb-1"
          >
            Fichier de redirection
          </p>
          <p
            class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus opacity-75"
          >
            Téléchargez un fichier pour partager facilement cette configuration
          </p>
        </div>
        <div class="shrink-0 pt-1">
          <i
            class="bx bx-download text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
          ></i>
        </div>
      </button>
    </div>
  </div>
</dialog>

<BasicInfoModal
  bind:contentDisplayed={downloadContentDisplayed}
  successMessage="Téléchargement en cours"
  errorMessage="Erreur lors du téléchargement"
  displayDuration={3000}
/>
