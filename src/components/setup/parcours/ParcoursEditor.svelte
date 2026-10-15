<script lang="ts">
  import {
    addLevel,
    addSteps,
    canNudge,
    missing,
    moveStep,
    nudgeStep,
    removeLevel,
    removeStep,
    splitIntoLevels,
    studentPreviewUrl,
  } from '../../../lib/parcours/parcoursEditing'
  import { decrireExercice, type DescriptionExercice } from '../../../moteur'
  import {
    menuPathFor,
    officialChapters,
    type OfficialChapter,
    type ReferentialExercise,
  } from '../../../lib/parcours/parcoursReferential'
  import { onMount } from 'svelte'
  import type { InterfaceParams } from '../../../lib/types'
  import TypstAddExerciseModal from '../typst/addExercise/TypstAddExerciseModal.svelte'
  import ExercisePreview from './ExercisePreview.svelte'
  import ExerciseSettings from './ExerciseSettings.svelte'
  import {
    DEFAULT_THRESHOLD,
    DIFFICULTIES,
    PRESENTATION_LABELS,
    beltColor,
    levelGroups,
    levelName,
    BELTS,
    ICONS,
    referentialLevel,
    suggestedIcon,
    validationLabels,
    type LevelStyle,
    type Objective,
    type Parcours,
    type Presentation,
    type Step,
    type Validation,
  } from '../../../lib/parcours/parcoursTypes'

  /**
   * Éditeur d'un parcours de l'application MathALÉA : chaque modification est
   * enregistrée aussitôt (onchange). Les exercices viennent du référentiel
   * (recherche) ou de la feuille composée sur le site ; ils se glissent d'un
   * palier à l'autre.
   */
  let {
    parcours,
    levels,
    chapters,
    objectives,
    tags,
    index,
    sheetCount,
    fromSite,
    onchange,
    onaddsheet,
    onduplicate,
    ondelete,
  }: {
    parcours: Parcours
    levels: string[]
    chapters: { ofLevel: string[]; others: string[] }
    objectives: Objective[]
    tags: Map<string, string[]> // objectifs déjà posés sur un exercice (mêmes réglages)
    index: Map<string, ReferentialExercise> | null
    sheetCount: number // exercices interactifs de la feuille en cours sur le site
    fromSite: (params: InterfaceParams) => Step | null // null : exercice non interactif
    onchange: (p: Parcours) => void
    onaddsheet: (level: number) => void
    onduplicate: () => void
    ondelete: () => void
  } = $props()

  const label =
    'block text-sm font-light text-coopmaths-struct dark:text-coopmathsdark-struct'
  const field =
    'w-full rounded-md border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas px-3 py-2 text-coopmaths-corpus dark:text-coopmathsdark-corpus focus:outline-none focus:border-coopmaths-action dark:focus:border-coopmathsdark-action'
  const quiet =
    'text-sm text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light'
  const link =
    'inline-flex items-center gap-1 text-sm font-semibold text-coopmaths-action dark:text-coopmathsdark-action hover:text-coopmaths-action-lightest dark:hover:text-coopmathsdark-action-lightest'
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border transition-colors ${
      on
        ? 'bg-coopmaths-action dark:bg-coopmathsdark-action border-coopmaths-action dark:border-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas'
        : 'border-coopmaths-action dark:border-coopmathsdark-action text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'
    }`
  const iconButton =
    'inline-flex items-center justify-center w-8 h-8 rounded-full text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark disabled:opacity-30 disabled:hover:bg-transparent'

  const update = (change: (p: Parcours) => void) => {
    const next = structuredClone($state.snapshot(parcours)) as Parcours
    change(next)
    onchange(next)
  }
  const set = (next: Parcours) => onchange(next)

  /** Chapitre : l'icône suit tant que l'enseignant n'en a pas choisi une autre */
  function setTheme(theme: string) {
    update((p) => {
      const auto =
        p.icone === 'bx-book-content' || p.icone === suggestedIcon(p.theme)
      p.theme = theme
      if (auto) p.icone = suggestedIcon(theme)
    })
  }

  const groups = $derived(levelGroups(parcours))
  const withLevels = $derived((parcours.paliers?.length ?? 0) > 1)
  const todo = $derived(missing(parcours))
  const questions = $derived(
    parcours.etapes.reduce((a, s) => a + (s.nbQuestions ?? 0), 0),
  )

  // ---------- Exercices : navigateur (niveau, chapitre, réglages, aperçu) ----------
  let pickerLevel: number | null = $state(null)
  let refused = $state('')

  // Chapitres du site pour le niveau : proposés en pastilles, et chemin d'arrivée de la fenêtre d'ajout
  let official: Record<string, OfficialChapter[]> = $state({})
  onMount(async () => {
    official = await officialChapters()
  })
  const levelChapters = $derived(
    official[referentialLevel(parcours.niveau)] ?? [],
  )
  const chapterCode = $derived(
    levelChapters.find((c) => c.name === parcours.theme.trim())?.code,
  )
  const ownChapters = $derived(
    [...chapters.ofLevel, ...chapters.others].filter(
      (c) => !levelChapters.some((o) => o.name === c),
    ),
  )
  // Exercices déjà dans le parcours, comptés sur les aperçus de la fenêtre d'ajout
  const selection = $derived(
    parcours.etapes.map((e) => ({ uuid: e.uuid, id: e.id }) as InterfaceParams),
  )

  /** Exercice choisi dans la fenêtre d'ajout du site : seuls les interactifs vont dans l'application */
  function addFromSite(params: InterfaceParams) {
    const step = fromSite(params)
    if (!step) {
      refused = `${params.id ?? params.uuid} n’est pas interactif : l’application ne propose que des exercices interactifs.`
      return
    }
    refused = ''
    set(addSteps(parcours, [step], pickerLevel ?? 0))
  }

  // Réglages d'un exercice du parcours : description lue par le moteur à l'ouverture
  const descriptions: Record<string, DescriptionExercice | null> = $state({})
  async function describe(uuid: string) {
    if (uuid in descriptions) return
    try {
      descriptions[uuid] = await decrireExercice(uuid)
    } catch {
      descriptions[uuid] = null
    }
  }

  // ---------- Glisser-déposer ----------
  let dragged: number | null = $state(null)
  let target: { level: number; position: number } | null = $state(null)

  function overRow(event: DragEvent, i: number) {
    if (dragged === null) return
    event.preventDefault()
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const level = groups.findIndex((g) => g.includes(i))
    const position =
      groups[level].indexOf(i) +
      (event.clientY > rect.top + rect.height / 2 ? 1 : 0)
    target = { level, position }
  }

  function overLevel(event: DragEvent, k: number) {
    if (dragged === null) return
    event.preventDefault()
    if (!groups[k].length) target = { level: k, position: 0 }
  }

  function drop(event: DragEvent) {
    event.preventDefault()
    if (dragged !== null && target) {
      const from = groups.findIndex((g) => g.includes(dragged!))
      const fromPosition = groups[from].indexOf(dragged)
      // Même palier, plus bas : la place libérée décale la cible d'un rang
      const position =
        target.level === from && target.position > fromPosition
          ? target.position - 1
          : target.position
      set(moveStep(parcours, dragged, target.level, position))
    }
    dragged = null
    target = null
  }

  const before = (i: number) => {
    if (!target || dragged === null) return false
    const level = groups.findIndex((g) => g.includes(i))
    return target.level === level && groups[level][target.position] === i
  }
  const afterLast = (k: number) =>
    !!target &&
    dragged !== null &&
    target.level === k &&
    target.position === groups[k].length &&
    groups[k].length > 0

  // ---------- Objectifs d'un exercice ----------
  let newObjective: Record<number, string> = $state({})
  const knownLabels = $derived([
    ...new Set([
      ...objectives.map((o) => o.libelle),
      ...[...tags.values()].flat(),
    ]),
  ])

  function addObjective(i: number) {
    const value = (newObjective[i] ?? '').trim()
    if (!value) return
    update((p) => {
      const s = p.etapes[i]
      if (!(s.objectifs ?? []).includes(value))
        s.objectifs = [...(s.objectifs ?? []), value]
    })
    newObjective[i] = ''
  }

  function removeObjective(i: number, o: string) {
    update((p) => {
      p.etapes[i].objectifs = (p.etapes[i].objectifs ?? []).filter(
        (x) => x !== o,
      )
    })
  }

  /** Organisation : liste simple, paliers numérotés ou ceintures */
  function organise(style: LevelStyle | 'liste') {
    if (style === 'liste') {
      update((p) => {
        delete p.paliers
        delete p.style
      })
      return
    }
    const base = withLevels
      ? parcours
      : parcours.etapes.length > 1
        ? splitIntoLevels(parcours)
        : addLevel(parcours)
    onchange({ ...base, style })
  }
  const organisation = $derived(
    withLevels ? (parcours.style ?? 'paliers') : 'liste',
  )

  let openStep: number | null = $state(null)
  const preview = (steps: Step[]) =>
    window.open(
      studentPreviewUrl(window.location.href, steps),
      '_blank',
      'noopener',
    )
</script>

{#snippet stepRow(i: number)}
  {@const s = parcours.etapes[i]}
  {@const known = index?.get(s.uuid)}
  <li
    class="group rounded-lg bg-coopmaths-canvas dark:bg-coopmathsdark-canvas border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest
    {before(i)
      ? 'shadow-[0_-3px_0_0] shadow-coopmaths-action dark:shadow-coopmathsdark-action'
      : ''}
    {dragged === i ? 'opacity-40' : ''}"
    draggable="true"
    ondragstart={(e) => {
      dragged = i
      e.dataTransfer?.setData('text/plain', String(i))
    }}
    ondragend={() => {
      dragged = null
      target = null
    }}
    ondragover={(e) => overRow(e, i)}
    ondrop={drop}
  >
    <div class="flex flex-row items-center gap-2 px-2 py-2">
      <i
        class="bx bx-grid-vertical text-xl cursor-grab text-coopmaths-corpus-lightest dark:text-coopmathsdark-corpus-lightest"
        aria-hidden="true"
      ></i>
      <div class="flex flex-col">
        <button
          type="button"
          class={iconButton}
          aria-label="Monter l’exercice {s.id}"
          disabled={!canNudge(parcours, i, -1)}
          onclick={() => set(nudgeStep(parcours, i, -1))}
        >
          <i class="bx bx-chevron-up text-xl" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class={iconButton}
          aria-label="Descendre l’exercice {s.id}"
          disabled={!canNudge(parcours, i, 1)}
          onclick={() => set(nudgeStep(parcours, i, 1))}
        >
          <i class="bx bx-chevron-down text-xl" aria-hidden="true"></i>
        </button>
      </div>
      <button
        type="button"
        class="min-w-0 flex-1 text-left"
        aria-expanded={openStep === i}
        onclick={() => {
          openStep = openStep === i ? null : i
          if (openStep === i) void describe(s.uuid)
        }}
      >
        <span
          class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
          >{s.id ?? s.uuid}</span
        >
        <span class="ml-2 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >{s.titreMasque
            ? `Exercice ${i + 1}`
            : s.titre.replace(/\$([^$]*)\$/g, '$1')}</span
        >
        <span class="block {quiet} truncate">
          {s.nbQuestions ?? '?'} question{(s.nbQuestions ?? 0) > 1 ? 's' : ''}{s
            .objectifs?.length
            ? ` · ${s.objectifs.join(' ; ')}`
            : ''}
        </span>
      </button>
      <label class="flex items-center gap-1 {quiet}">
        <input
          type="number"
          min="1"
          max="50"
          class="w-16 rounded-md border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas px-2 py-1 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          value={s.nbQuestions ?? 3}
          aria-label="Nombre de questions de l’exercice {s.id}"
          onchange={(e) => {
            const n = Math.max(
              1,
              Math.min(
                50,
                Number((e.currentTarget as HTMLInputElement).value) || 1,
              ),
            )
            update((p) => (p.etapes[i].nbQuestions = n))
          }}
        />
        <span class="hidden md:inline">questions</span>
      </label>
      <button
        type="button"
        class={iconButton}
        title="Essayer comme un élève"
        aria-label="Essayer l’exercice {s.id} comme un élève"
        onclick={() => preview([s])}
      >
        <i class="bx bx-show text-xl" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class={iconButton}
        aria-label="Retirer l’exercice {s.id}"
        onclick={() => set(removeStep(parcours, i))}
      >
        <i class="bx bx-x text-2xl" aria-hidden="true"></i>
      </button>
    </div>
    {#if openStep === i}
      <div
        class="flex flex-col gap-3 px-4 pb-4 pt-1 border-t border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark"
      >
        <div class="flex flex-row items-end gap-2">
          <label class="flex-1">
            <span class={label}>Titre vu par les élèves</span>
            <input
              class={field}
              value={s.titre}
              disabled={s.titreMasque}
              onchange={(e) =>
                update(
                  (p) =>
                    (p.etapes[i].titre = (
                      e.currentTarget as HTMLInputElement
                    ).value),
                )}
            />
          </label>
          <label class="flex items-center gap-2 pb-2 {quiet}">
            <input
              type="checkbox"
              checked={s.titreMasque === true}
              onchange={(e) =>
                update(
                  (p) =>
                    (p.etapes[i].titreMasque =
                      (e.currentTarget as HTMLInputElement).checked ||
                      undefined),
                )}
            />
            Masquer (« Exercice {i + 1} »)
          </label>
        </div>
        <div>
          <span class={label}>Objectifs</span>
          <div class="flex flex-row flex-wrap items-center gap-2 mt-1">
            {#each s.objectifs ?? [] as o (o)}
              <span
                class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus"
              >
                {o}
                <button
                  type="button"
                  class="text-coopmaths-action dark:text-coopmathsdark-action"
                  aria-label="Retirer l’objectif {o}"
                  onclick={() => removeObjective(i, o)}
                >
                  <i class="bx bx-x" aria-hidden="true"></i>
                </button>
              </span>
            {/each}
            {#if known?.objective && !(s.objectifs ?? []).includes(known.objective.libelle)}
              <button
                type="button"
                class={chip(false)}
                onclick={() =>
                  update(
                    (p) =>
                      (p.etapes[i].objectifs = [
                        ...(p.etapes[i].objectifs ?? []),
                        known.objective!.libelle,
                      ]),
                  )}
              >
                <i class="bx bx-plus" aria-hidden="true"></i>{known.objective
                  .libelle} ({known.objective.code})
              </button>
            {/if}
          </div>
          <form
            class="flex flex-row gap-2 mt-2"
            onsubmit={(e) => (e.preventDefault(), addObjective(i))}
          >
            <input
              class={field}
              list="objectifs-connus"
              bind:value={newObjective[i]}
              aria-label="Ajouter un objectif à l’exercice {s.id}"
            />
            <button
              type="submit"
              class="{link} shrink-0 px-2"
              disabled={!(newObjective[i] ?? '').trim()}>Ajouter</button
            >
          </form>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExerciseSettings
            step={s}
            description={descriptions[s.uuid] ?? null}
            onchange={(next) => update((p) => (p.etapes[i] = next))}
          />
          <ExercisePreview step={s} />
        </div>
      </div>
    {/if}
  </li>
{/snippet}

{#snippet addButtons(k: number)}
  <div class="flex flex-row flex-wrap items-center gap-x-5 gap-y-2">
    <button type="button" class={link} onclick={() => (pickerLevel = k)}>
      <i class="bx bx-plus-circle text-lg" aria-hidden="true"></i> Ajouter des
      exercices{withLevels
        ? ` à : ${levelName(parcours, k).toLowerCase()}`
        : ''}
    </button>
    {#if refused && pickerLevel === null}<span
        class="text-sm text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
        role="status">{refused}</span
      >{/if}
    {#if sheetCount}
      <button type="button" class={link} onclick={() => onaddsheet(k)}>
        <i class="bx bx-import text-lg" aria-hidden="true"></i> Ajouter la
        feuille en cours du site ({sheetCount})
      </button>
    {/if}
  </div>
{/snippet}

<datalist id="objectifs-connus">
  {#each knownLabels as o (o)}<option value={o}></option>{/each}
</datalist>

<div class="flex flex-col gap-6">
  <!-- Le parcours -->
  <section class="grid grid-cols-1 md:grid-cols-6 gap-4">
    <label class="md:col-span-4">
      <span class={label}>Titre</span>
      <input
        class="{field} text-lg font-bold"
        value={parcours.titre}
        oninput={(e) =>
          update(
            (p) => (p.titre = (e.currentTarget as HTMLInputElement).value),
          )}
      />
    </label>
    <label class="md:col-span-2">
      <span class={label}>Niveau</span>
      <select
        class={field}
        value={parcours.niveau}
        onchange={(e) =>
          update(
            (p) => (p.niveau = (e.currentTarget as HTMLSelectElement).value),
          )}
      >
        <option value="" disabled>Choisir</option>
        {#each levels as n (n)}<option value={n}>{n}</option>{/each}
      </select>
    </label>
    <label class="md:col-span-3">
      <span class={label}>Chapitre</span>
      <input
        class={field}
        value={parcours.theme}
        oninput={(e) => setTheme((e.currentTarget as HTMLInputElement).value)}
      />
    </label>
    <div class="md:col-span-3">
      <span class={label}>Type</span>
      <div
        class="flex flex-row flex-wrap gap-2 mt-1"
        role="radiogroup"
        aria-label="Type"
      >
        {#each DIFFICULTIES as d, k (d)}
          <button
            type="button"
            role="radio"
            aria-checked={parcours.difficulte === k + 1}
            class={chip(parcours.difficulte === k + 1)}
            onclick={() => update((p) => (p.difficulte = (k + 1) as 1 | 2 | 3))}
            >{d}</button
          >
        {/each}
      </div>
    </div>
    {#if levelChapters.length || ownChapters.length}
      <div class="md:col-span-6 -mt-2 flex flex-col gap-2">
        {#if levelChapters.length}
          <div
            class="flex flex-row flex-wrap items-center gap-2"
            role="radiogroup"
            aria-label="Chapitres de MathALÉA en {parcours.niveau}"
          >
            <span class={quiet}
              >Chapitres de MathALÉA en {parcours.niveau} :</span
            >
            {#each levelChapters as c (c.code)}
              <button
                type="button"
                role="radio"
                aria-checked={parcours.theme.trim() === c.name}
                class={chip(parcours.theme.trim() === c.name)}
                onclick={() => setTheme(c.name)}>{c.name}</button
              >
            {/each}
          </div>
        {/if}
        {#if ownChapters.length}
          <div
            class="flex flex-row flex-wrap items-center gap-2"
            role="radiogroup"
            aria-label="Vos chapitres"
          >
            <span class={quiet}>Vos chapitres :</span>
            {#each ownChapters as c (c)}
              <button
                type="button"
                role="radio"
                aria-checked={parcours.theme.trim() === c}
                class={chip(parcours.theme.trim() === c)}
                onclick={() => setTheme(c)}>{c}</button
              >
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    <div class="md:col-span-6">
      <span class={label}>Icône (proposée d’après le chapitre)</span>
      <div
        class="flex flex-row flex-wrap gap-2 mt-1"
        role="radiogroup"
        aria-label="Icône du parcours"
      >
        {#each ICONS as i (i.icon)}
          <button
            type="button"
            role="radio"
            aria-checked={parcours.icone === i.icon}
            aria-label={i.nom}
            title={i.nom}
            class="{chip(parcours.icone === i.icon)} px-2"
            onclick={() => update((p) => (p.icone = i.icon))}
          >
            <i class="bx {i.icon} text-xl" aria-hidden="true"></i>
          </button>
        {/each}
      </div>
    </div>
    <label class="md:col-span-6">
      <span class={label}>But du parcours (vu par les élèves)</span>
      <input
        class={field}
        value={parcours.objectif}
        oninput={(e) =>
          update(
            (p) => (p.objectif = (e.currentTarget as HTMLInputElement).value),
          )}
      />
    </label>
  </section>

  <!-- Exercices et paliers -->
  <section
    class="flex flex-col gap-3"
    ondragover={(e) => dragged !== null && e.preventDefault()}
    ondrop={drop}
    aria-label="Exercices"
  >
    <div class="flex flex-row flex-wrap items-baseline justify-between gap-2">
      <h3
        class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        Exercices <span class="font-normal {quiet}"
          >{parcours.etapes.length} · {questions} questions</span
        >
      </h3>
      {#if parcours.etapes.length}
        <button
          type="button"
          class={link}
          onclick={() => preview(parcours.etapes)}
          ><i class="bx bx-show text-lg" aria-hidden="true"></i> Essayer comme un
          élève</button
        >
      {/if}
    </div>
    <div class="flex flex-row flex-wrap items-center gap-3">
      <span class={quiet}>Organisation</span>
      <div
        class="flex flex-row rounded-lg overflow-hidden border border-coopmaths-action dark:border-coopmathsdark-action"
        role="radiogroup"
        aria-label="Organisation des exercices"
      >
        {#each [['liste', 'Liste simple', 'bx-list-ul'], ['paliers', 'Paliers', 'bx-layer'], ['ceintures', 'Ceintures', 'bx-medal']] as [value, text, icon] (value)}
          <button
            type="button"
            role="radio"
            aria-checked={organisation === value}
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold
            {organisation === value
              ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas'
              : 'text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
            onclick={() => organise(value as LevelStyle | 'liste')}
          >
            <i class="bx {icon}" aria-hidden="true"></i>{text}
          </button>
        {/each}
      </div>
      {#if organisation === 'ceintures'}
        <div
          class="flex flex-row flex-wrap items-center gap-2"
          role="radiogroup"
          aria-label="Première ceinture"
        >
          <span class={quiet}>Première ceinture</span>
          {#each BELTS as b, r (b.nom)}
            {@const on = (parcours.premiereCeinture ?? 0) === r}
            <button
              type="button"
              role="radio"
              aria-checked={on}
              class="inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 text-sm border transition-colors
              {on
                ? 'border-coopmaths-action dark:border-coopmathsdark-action ring-2 ring-coopmaths-action dark:ring-coopmathsdark-action text-coopmaths-struct dark:text-coopmathsdark-struct font-semibold'
                : 'border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:border-coopmaths-action dark:hover:border-coopmathsdark-action'}"
              onclick={() =>
                update((p) => {
                  if (r) p.premiereCeinture = r
                  else delete p.premiereCeinture
                })}
            >
              <span
                class="inline-block w-5 h-2.5 rounded-sm ring-1 ring-black/20"
                style="background-color: {b.couleur}"
                aria-hidden="true"
              ></span>
              {b.nom}
            </button>
          {/each}
        </div>
      {/if}
      <span class={quiet}>
        {organisation === 'liste'
          ? 'Les élèves font tous les exercices à la suite.'
          : 'Chaque palier se fait en une séance ; le suivant s’ouvre à la réussite choisie.'}
      </span>
    </div>

    {#each groups as g, k (k)}
      {@const level = parcours.paliers?.[k]}
      <div
        id="palier-{k}"
        class="scroll-mt-24 flex flex-col gap-3 {withLevels
          ? 'rounded-xl p-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark'
          : ''}"
        ondragover={(e) => overLevel(e, k)}
        role="group"
        aria-label={withLevels ? `Palier ${k + 1}` : 'Exercices du parcours'}
      >
        {#if withLevels && level}
          <div class="flex flex-row flex-wrap items-end gap-3">
            {#if parcours.style === 'ceintures'}
              <span
                class="shrink-0 inline-block w-9 h-4 rounded-sm ring-1 ring-coopmaths-canvas-darkest dark:ring-coopmathsdark-canvas-darkest mb-3"
                style="background-color: {beltColor(parcours, k)}"
                aria-hidden="true"
              ></span>
            {:else}
              <span
                class="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full font-bold bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
                aria-hidden="true">{k + 1}</span
              >
            {/if}
            <label class="flex-1 min-w-48">
              <span class="{label} font-semibold"
                >{levelName(parcours, k)} · titre vu par les élèves</span
              >
              <input
                class={field}
                value={level.titre}
                oninput={(e) =>
                  update(
                    (p) =>
                      (p.paliers![k].titre = (
                        e.currentTarget as HTMLInputElement
                      ).value),
                  )}
              />
            </label>
            {#if k > 0}
              <label>
                <span class={label}>Pour y accéder</span>
                <select
                  class={field}
                  aria-label="Accès à : {levelName(parcours, k).toLowerCase()}"
                  value={level.acces === 'seuil'
                    ? String(level.seuil ?? DEFAULT_THRESHOLD)
                    : 'libre'}
                  onchange={(e) => {
                    const v = (e.currentTarget as HTMLSelectElement).value
                    update((p) => {
                      p.paliers![k].acces = v === 'libre' ? 'libre' : 'seuil'
                      p.paliers![k].seuil =
                        v === 'libre' ? undefined : Number(v)
                    })
                  }}
                >
                  {#each [50, 60, 70, 80, 90, 100] as n (n)}<option
                      value={String(n)}
                      >Au moins {n} % à : {levelName(
                        parcours,
                        k - 1,
                      ).toLowerCase()}</option
                    >{/each}
                  <option value="libre">Ouvert à tout moment</option>
                </select>
              </label>
            {/if}
            <button
              type="button"
              class={iconButton}
              aria-label="Supprimer le palier {k + 1}"
              title="Supprimer le palier (ses exercices rejoignent le palier voisin)"
              onclick={() => set(removeLevel(parcours, k))}
            >
              <i class="bx bx-trash text-xl" aria-hidden="true"></i>
            </button>
          </div>
        {/if}
        {#if g.length}
          <ul class="flex flex-col gap-2">
            {#each g as i (parcours.etapes[i])}{@render stepRow(i)}{/each}
            {#if afterLast(k)}<li
                class="h-1 rounded bg-coopmaths-action dark:bg-coopmathsdark-action"
                aria-hidden="true"
              ></li>{/if}
          </ul>
        {:else}
          <p
            class="rounded-lg border-2 border-dashed px-4 py-5 text-center {quiet}
            {target?.level === k
              ? 'border-coopmaths-action dark:border-coopmathsdark-action'
              : 'border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest'}"
          >
            {withLevels
              ? 'Glissez des exercices ici, ou ajoutez-en.'
              : 'Ajoutez des exercices.'}
          </p>
        {/if}
        {#if withLevels && level}
          <details class="group/ressource" open={!!level.ressource}>
            <summary class="{link} cursor-pointer list-none"
              ><i class="bx bx-book-open text-lg" aria-hidden="true"></i>
              Ressource pour revoir{level.ressource
                ? ` : ${level.ressource.titre}`
                : ''}</summary
            >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <label>
                <span class={label}>Titre vu par les élèves</span>
                <input
                  class={field}
                  value={level.ressource?.titre ?? ''}
                  onchange={(e) =>
                    update(
                      (p) =>
                        (p.paliers![k].ressource = {
                          titre: (e.currentTarget as HTMLInputElement).value,
                          lien: p.paliers![k].ressource?.lien ?? '',
                        }),
                    )}
                />
              </label>
              <label>
                <span class={label}>Lien (PDF, vidéo sur votre drive)</span>
                <input
                  class={field}
                  type="url"
                  value={level.ressource?.lien ?? ''}
                  onchange={(e) =>
                    update(
                      (p) =>
                        (p.paliers![k].ressource = {
                          titre: p.paliers![k].ressource?.titre ?? '',
                          lien: (e.currentTarget as HTMLInputElement).value,
                        }),
                    )}
                />
              </label>
            </div>
            {#if level.ressource}
              <button
                type="button"
                class="{link} mt-2"
                onclick={() => update((p) => delete p.paliers![k].ressource)}
                >Retirer la ressource</button
              >
            {/if}
          </details>
        {/if}
        {@render addButtons(k)}
      </div>
      {#if withLevels && level}
        <div
          id="pause-{k}"
          class="scroll-mt-24 flex flex-col gap-2 rounded-xl px-4 py-3 border border-dashed border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
        >
          {#if level.pause}
            <label>
              <span class="{label} flex items-center gap-1"
                ><i
                  class="bx bx-pause-circle text-lg text-coopmaths-action dark:text-coopmathsdark-action"
                  aria-hidden="true"
                ></i>
                Pause après le palier {k + 1} (point de cours, consigne, encouragement)</span
              >
              <textarea
                class={field}
                rows="3"
                value={level.pause.texte}
                oninput={(e) =>
                  update(
                    (p) =>
                      (p.paliers![k].pause!.texte = (
                        e.currentTarget as HTMLTextAreaElement
                      ).value),
                  )}
              ></textarea>
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label>
                <span class={label}>Document lié : titre (facultatif)</span>
                <input
                  class={field}
                  value={level.pause.ressource?.titre ?? ''}
                  onchange={(e) =>
                    update(
                      (p) =>
                        (p.paliers![k].pause!.ressource = {
                          titre: (e.currentTarget as HTMLInputElement).value,
                          lien: p.paliers![k].pause!.ressource?.lien ?? '',
                        }),
                    )}
                />
              </label>
              <label>
                <span class={label}>Document lié : lien (facultatif)</span>
                <input
                  class={field}
                  type="url"
                  value={level.pause.ressource?.lien ?? ''}
                  onchange={(e) =>
                    update(
                      (p) =>
                        (p.paliers![k].pause!.ressource = {
                          titre: p.paliers![k].pause!.ressource?.titre ?? '',
                          lien: (e.currentTarget as HTMLInputElement).value,
                        }),
                    )}
                />
              </label>
            </div>
            <button
              type="button"
              class="{link} self-start"
              onclick={() => update((p) => delete p.paliers![k].pause)}
              >Retirer la pause</button
            >
          {:else}
            <button
              type="button"
              class="{link} self-start"
              onclick={() =>
                update((p) => (p.paliers![k].pause = { texte: '' }))}
            >
              <i class="bx bx-pause-circle text-lg" aria-hidden="true"></i>
              Ajouter une pause après le palier {k + 1}
            </button>
          {/if}
        </div>
      {/if}
    {/each}
    {#if withLevels}
      <button
        type="button"
        class="{link} self-start"
        onclick={() => set(addLevel(parcours))}
      >
        <i class="bx bx-plus text-lg" aria-hidden="true"></i> Ajouter {parcours.style ===
        'ceintures'
          ? `la ${levelName(parcours, groups.length).toLowerCase()}`
          : 'un palier'}
      </button>
    {/if}
  </section>

  <!-- Pages et validation -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <label>
      <span class={label}>Pages</span>
      <select
        class={field}
        value={parcours.presentation}
        onchange={(e) =>
          update(
            (p) =>
              (p.presentation = (e.currentTarget as HTMLSelectElement)
                .value as Presentation),
          )}
      >
        {#each Object.entries(PRESENTATION_LABELS) as [value, text] (value)}<option
            {value}>{text}</option
          >{/each}
      </select>
    </label>
    <label>
      <span class={label}>Validation et correction</span>
      <select
        class={field}
        value={parcours.correction}
        onchange={(e) =>
          update(
            (p) =>
              (p.correction = (e.currentTarget as HTMLSelectElement)
                .value as Validation),
          )}
      >
        {#each Object.entries(validationLabels(parcours)) as [value, text] (value)}<option
            {value}>{text}</option
          >{/each}
      </select>
    </label>
  </section>

  <footer
    class="flex flex-row flex-wrap items-center justify-between gap-3 border-t border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest pt-4"
  >
    <p class={quiet} role="status">
      {#if todo.length}
        <i
          class="bx bx-error-circle text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
          aria-hidden="true"
        ></i>
        À compléter avant la publication : {todo.join(', ')}.
      {:else}
        <i
          class="bx bx-check-circle text-coopmaths-action dark:text-coopmathsdark-action"
          aria-hidden="true"
        ></i>
        Prêt · V{parcours.version} · enregistré dans ce navigateur
      {/if}
    </p>
    <div class="flex flex-row gap-5">
      <button type="button" class={link} onclick={onduplicate}
        ><i class="bx bx-copy text-lg" aria-hidden="true"></i> Dupliquer</button
      >
      <button type="button" class={link} onclick={ondelete}
        ><i class="bx bx-trash text-lg" aria-hidden="true"></i> Supprimer</button
      >
    </div>
  </footer>
</div>

{#if pickerLevel !== null}
  <TypstAddExerciseModal
    onAdd={addFromSite}
    onClose={() => (pickerLevel = null)}
    initialPath={menuPathFor(parcours.niveau, chapterCode)}
    fullScreen
    settingsOpen
    target={withLevels ? `${parcours.style === 'ceintures' ? 'la' : 'le'} ${levelName(parcours, pickerLevel).toLowerCase()}` : 'ce parcours'}
    {selection}
  />
{/if}
