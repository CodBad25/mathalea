<script lang="ts">
  import { missing } from '../../../lib/parcours/parcoursEditing'
  import {
    validationLabels,
    beltColor,
    levelGroups,
    levelName,
    type Parcours,
  } from '../../../lib/parcours/parcoursTypes'

  /**
   * Schéma du parcours tel que l'élève le suivra : paliers (ou ceintures) et
   * leurs exercices, condition pour passer au suivant, pauses, fin. Un clic
   * sur un élément amène à sa partie de l'éditeur.
   */
  let {
    parcours,
    onfocus,
  }: { parcours: Parcours; onfocus: (anchor: string) => void } = $props()

  const groups = $derived(levelGroups(parcours))
  const withLevels = $derived((parcours.paliers?.length ?? 0) > 1)
  const questions = (g: number[]) =>
    g.reduce((a, i) => a + (parcours.etapes[i].nbQuestions ?? 0), 0)
  const objectivesOf = (g: number[]) => [
    ...new Set(g.flatMap((i) => parcours.etapes[i].objectifs ?? [])),
  ]
  const todo = $derived(missing(parcours))
  const line =
    'mx-auto w-0.5 h-4 bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest'
  const quiet =
    'text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light'
</script>

<nav class="flex flex-col min-w-0 text-sm" aria-label="Schéma du parcours">
  <p
    class="mb-3 font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
  >
    Schéma du parcours
  </p>

  <div
    class="flex flex-row items-center gap-2 self-center rounded-full px-3 py-1 bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
  >
    <i class="bx bx-play" aria-hidden="true"></i> Début
  </div>

  {#each groups as g, k (k)}
    {@const level = parcours.paliers?.[k]}
    {@const objectives = objectivesOf(g)}
    <div class={line}></div>
    {#if withLevels && k > 0}
      <span
        class="self-center max-w-full rounded-full px-2 py-0.5 text-xs font-semibold border
        {level?.acces === 'seuil'
          ? 'border-coopmaths-action dark:border-coopmathsdark-action text-coopmaths-action dark:text-coopmathsdark-action'
          : 'border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light'}"
      >
        {#if level?.acces === 'seuil'}<i
            class="bx bx-lock-alt"
            aria-hidden="true"
          ></i>
          au moins {level.seuil ?? 80} %{:else}<i
            class="bx bx-lock-open-alt"
            aria-hidden="true"
          ></i> ouvert{/if}
      </span>
      <div class={line}></div>
    {/if}
    <button
      type="button"
      class="w-full min-w-0 flex flex-col gap-1 rounded-xl p-3 text-left border transition-colors
      {g.length
        ? 'border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark hover:border-coopmaths-action dark:hover:border-coopmathsdark-action'
        : 'border-dashed border-coopmaths-warn-dark dark:border-coopmathsdark-warn-dark'}"
      onclick={() => onfocus(`palier-${k}`)}
    >
      <span
        class="flex flex-row items-center gap-2 font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        {#if withLevels && parcours.style === 'ceintures'}
          <span
            class="inline-block w-5 h-2.5 rounded-sm ring-1 ring-coopmaths-canvas-darkest dark:ring-coopmathsdark-canvas-darkest"
            style="background-color: {beltColor(parcours, k)}"
            aria-hidden="true"
          ></span>
        {:else if withLevels}
          <span
            class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
            aria-hidden="true">{k + 1}</span
          >
        {/if}
        {withLevels ? levelName(parcours, k) : 'Exercices'}
      </span>
      {#if level?.titre}<span
          class="text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >{level.titre}</span
        >{/if}
      {#if g.length}
        <span class="flex flex-row flex-wrap gap-1">
          {#each g as i (i)}
            <span
              class="rounded px-1.5 py-0.5 text-xs font-semibold bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-struct dark:text-coopmathsdark-struct"
              >{parcours.etapes[i].id ?? parcours.etapes[i].uuid}</span
            >
          {/each}
        </span>
        <span class={quiet}
          >{questions(g)} questions{objectives.length
            ? ` · ${objectives.length} objectif${objectives.length > 1 ? 's' : ''}`
            : ''}</span
        >
      {:else}
        <span class={quiet}>Aucun exercice</span>
      {/if}
      {#if level?.ressource?.lien}
        <span class="{quiet} flex items-center gap-1"
          ><i class="bx bx-book-open" aria-hidden="true"></i>
          {level.ressource.titre || 'Ressource'}</span
        >
      {/if}
    </button>
    {#if withLevels && level?.pause}
      <div class={line}></div>
      <button
        type="button"
        class="w-full min-w-0 flex flex-row items-start gap-2 rounded-xl px-3 py-2 text-left border border-dashed border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest hover:border-coopmaths-action dark:hover:border-coopmathsdark-action"
        onclick={() => onfocus(`pause-${k}`)}
      >
        <i
          class="bx bx-pause-circle text-lg text-coopmaths-action dark:text-coopmathsdark-action"
          aria-hidden="true"
        ></i>
        <span
          class="min-w-0 line-clamp-2 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >{level.pause.texte || 'Pause'}</span
        >
      </button>
    {/if}
  {/each}

  <div class={line}></div>
  <div
    class="flex flex-col items-center gap-1 self-center max-w-full text-center"
  >
    <span
      class="flex flex-row items-center gap-2 rounded-full px-3 py-1 bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
    >
      <i class="bx bx-flag" aria-hidden="true"></i> Fin
    </span>
    <span class={quiet}
      >{questions(parcours.etapes.map((_, i) => i))} questions · correction : {validationLabels(
        parcours,
      )[parcours.correction].toLowerCase()}</span
    >
  </div>

  {#if todo.length}
    <p
      class="mt-4 rounded-lg px-3 py-2 text-xs bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <i
        class="bx bx-error-circle text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
        aria-hidden="true"
      ></i>
      À compléter : {todo.join(', ')}.
    </p>
  {/if}
</nav>
