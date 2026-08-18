<script lang="ts">
  import {
    buildBugReportDescription,
    buildBugReportTitle,
    buildForgeIssueUrl,
    buildMailtoUrl,
    BUG_REPORT_EMAIL,
  } from '../../../../lib/components/bugReport'

  type Props = {
    /** à bind avec le parent */
    isDisplayed: boolean
    /** référence de l'exercice (ex : `3L11`) */
    exerciceId?: string
    /** titre de l'exercice */
    exerciceTitle?: string
    /** indice (0-based) de l'exercice dans la série */
    exerciceIndex?: number
  }

  let {
    isDisplayed = $bindable(),
    exerciceId = undefined,
    exerciceTitle = undefined,
    exerciceIndex = undefined,
  }: Props = $props()

  let dialog: HTMLDialogElement | undefined = $state()
  let canal: 'mail' | 'forge' = $state('mail')
  let isCopied = $state(false)
  let title = $state('')
  let description = $state('')

  const fullText = $derived(`${title}\n\n${description}`)
  const lien = $derived(
    canal === 'mail'
      ? buildMailtoUrl(title, description)
      : buildForgeIssueUrl(title, description),
  )

  /**
   * Le contexte est recalculé à chaque ouverture de la modale car l'URL
   * contient notamment l'alea de l'exercice affiché.
   */
  function refreshContext() {
    const context = {
      exerciceId,
      exerciceTitle,
      exerciceIndex,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }
    title = buildBugReportTitle(context)
    description = buildBugReportDescription(context)
    isCopied = false
  }

  // variable non réactive : sert seulement à repérer les passages fermé -> ouvert
  let wasDisplayed = false
  $effect(() => {
    if (isDisplayed && !wasDisplayed) refreshContext()
    wasDisplayed = isDisplayed
    if (!dialog) return
    if (isDisplayed && !dialog.open) dialog.showModal()
    if (!isDisplayed && dialog.open) dialog.close()
  })

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(fullText)
      isCopied = true
      setTimeout(() => (isCopied = false), 2000)
    } catch (error) {
      console.error('Copie impossible', error)
    }
  }

  function openCanal() {
    if (canal === 'mail') {
      // pas de nouvel onglet pour un mailto: (il resterait vide)
      window.location.href = lien
    } else {
      window.open(lien, '_blank', 'noopener')
    }
  }

  function canalClass(isSelected: boolean): string {
    return isSelected
      ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas'
      : 'text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-action/10'
  }

  const actionButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg py-1 px-3 text-sm ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-action dark:bg-coopmathsdark-action ' +
    'hover:bg-coopmaths-action-lightest dark:hover:bg-coopmathsdark-action-lightest'

  const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg py-1 px-3 text-sm ' +
    'border border-coopmaths-action dark:border-coopmathsdark-action ' +
    'text-coopmaths-action dark:text-coopmathsdark-action ' +
    'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas ' +
    'hover:bg-coopmaths-action dark:hover:bg-coopmathsdark-action ' +
    'hover:text-coopmaths-canvas dark:hover:text-coopmathsdark-canvas'

  const fieldClass =
    'w-full rounded-lg py-1 px-2 ' +
    'border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest ' +
    'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas ' +
    'text-coopmaths-corpus dark:text-coopmathsdark-corpus'
</script>

<!--
  @component
  Modale de signalement d'un problème dans un exercice.

  Propose deux canaux (mail pour tout le monde, ticket sur la forge pour les
  enseignants disposant d'un compte) à partir d'un même texte pré-rempli,
  modifiable et copiable.

  __Utilisation__ :

  ```tsx
  <BugReportModal bind:isDisplayed={isBugReportDisplayed} exerciceId="3L11" exerciceTitle="Calcul littéral" />
  ```
 -->

<div class="flex justify-center">
  <!-- pour que la modale ne soit pas affectée par les marges de ses parents -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog
    bind:this={dialog}
    onclick={(event) => {
      if (event.target === dialog) dialog?.close()
    }}
    onclose={() => (isDisplayed = false)}
    class="m-auto rounded-xl
      w-full md:w-2/3 xl:w-1/2
      text-coopmaths-corpus dark:text-coopmathsdark-corpus
      bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
  >
    <div class="relative p-6 text-center">
      <button
        type="button"
        aria-label="Fermer"
        class="absolute top-3 right-3 text-coopmaths-action dark:text-coopmathsdark-action
          hover:text-coopmaths-action-lightest dark:hover:text-coopmathsdark-action-lightest"
        onclick={() => dialog?.close()}
      >
        <i class="bx bx-x text-2xl"></i>
      </button>
      <div
        class="flex items-center justify-center h-12 w-12 mx-auto mt-2 mb-6 rounded-full
          bg-coopmaths-warn-100 text-coopmaths-warn-darkest"
      >
        <i class="bx bx-sm bx-bug"></i>
      </div>
      <div
        class="w-full mb-4 text-2xl font-bold
          text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        Signaler un problème
      </div>

      <div class="w-full text-left flex flex-col gap-y-4">
        <p class="text-sm">
          Merci&nbsp;! Chaque signalement nous aide à corriger les erreurs et à
          améliorer MathALÉA, notre outil commun. Même un doute ou une remarque
          rapide est utile.
        </p>

        <div class="flex flex-col gap-y-2">
          <div
            class="text-sm font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            1. Comment souhaitez-vous nous le signaler&nbsp;?
          </div>
          <div class="flex flex-row flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border py-1 px-3 text-sm
                border-coopmaths-action dark:border-coopmathsdark-action
                {canalClass(canal === 'mail')}"
              onclick={() => (canal = 'mail')}
            >
              <i class="bx bx-envelope"></i> Par mail
            </button>
            <button
              type="button"
              class="rounded-lg border py-1 px-3 text-sm
                border-coopmaths-action dark:border-coopmathsdark-action
                {canalClass(canal === 'forge')}"
              onclick={() => (canal = 'forge')}
            >
              <i class="bx bx-git-branch"></i> Sur la forge
            </button>
          </div>
          <p class="text-xs">
            {#if canal === 'mail'}
              Élèves, parents ou enseignants&nbsp;: un mail à <span
                class="font-bold">{BUG_REPORT_EMAIL}</span
              > sera préparé dans votre logiciel de messagerie.
            {:else}
              Réservé aux enseignants&nbsp;: la création d'un ticket nécessite
              d'être connecté à la forge, avec votre compte académique (bouton
              «&nbsp;Se connecter avec son compte académique&nbsp;»).
            {/if}
          </p>
        </div>

        <div class="flex flex-col gap-y-2">
          <div
            class="text-sm font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            2. Complétez la description du problème
          </div>
          <label class="flex flex-col gap-y-1 text-xs">
            Titre
            <input
              type="text"
              bind:value={title}
              class="{fieldClass} text-sm"
            />
          </label>
          <label class="flex flex-col gap-y-1 text-xs">
            Description
            <textarea
              bind:value={description}
              rows="12"
              class="{fieldClass} font-mono text-xs"
            ></textarea>
          </label>
        </div>
      </div>

      <div
        class="w-full mt-6 mb-3 flex flex-row flex-wrap justify-center gap-2"
      >
        <button
          type="button"
          class={secondaryButtonClass}
          onclick={copyToClipboard}
        >
          <i class="bx {isCopied ? 'bx-check' : 'bx-copy'}"></i>
          {isCopied ? 'Texte copié !' : 'Copier le texte'}
        </button>
        <button type="button" class={actionButtonClass} onclick={openCanal}>
          <i class="bx {canal === 'mail' ? 'bx-envelope' : 'bx-git-branch'}"
          ></i>
          {canal === 'mail' ? 'Écrire le mail' : 'Créer le ticket'}
        </button>
      </div>
    </div>
  </dialog>
</div>
