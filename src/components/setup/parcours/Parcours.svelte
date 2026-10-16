<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { get } from 'svelte/store'
  import { downloadFile } from '../../../lib/files'
  import {
    readParcoursFile,
    timestampedName,
  } from '../../../lib/parcours/parcoursFile'
  import {
    addClass,
    deleteParcours,
    duplicate,
    emptyLibrary,
    knownChapters,
    move,
    publish,
    removeClass,
    renameClass,
    restore,
    saveParcours,
    setClassParcours,
    toPublish,
    unpublishedCount,
    type TeacherLibrary,
  } from '../../../lib/parcours/parcoursLibrary'
  import { addSteps, missing } from '../../../lib/parcours/parcoursEditing'
  import {
    exerciseKey,
    mergeObjectives,
    taggedExercises,
  } from '../../../lib/parcours/parcoursObjectives'
  import {
    exerciseIndex,
    type ReferentialExercise,
  } from '../../../lib/parcours/parcoursReferential'
  import {
    LEVELS,
    emptyParcours,
    levelGroups,
    type Parcours,
    type Step,
  } from '../../../lib/parcours/parcoursTypes'
  import { exercicesParams } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import { isLocalStorageAvailable } from '../../../lib/stores/storage'
  import NavBar from '../../shared/header/NavBar.svelte'
  import ParcoursClasses from './ParcoursClasses.svelte'
  import ParcoursEditor from './ParcoursEditor.svelte'
  import ParcoursObjectives from './ParcoursObjectives.svelte'
  import ParcoursSchema from './ParcoursSchema.svelte'

  /**
   * Parcours de l'application MathALÉA, préparés sur le site : bibliothèque de
   * l'enseignant (enregistrée dans ce navigateur), classes, objectifs, et un
   * seul fichier à publier dans le dossier partagé des élèves. Le même fichier
   * se reprend ici ou dans l'application. Rien n'est envoyé à un serveur.
   */

  const STORAGE_KEY = 'mathalea-parcours-bibliotheque'

  function load(): TeacherLibrary {
    try {
      const raw = isLocalStorageAvailable()
        ? localStorage.getItem(STORAGE_KEY)
        : null
      const lib = raw ? (JSON.parse(raw) as TeacherLibrary) : null
      return lib && Array.isArray(lib.entries) && Array.isArray(lib.classes)
        ? { ...emptyLibrary(), ...lib }
        : emptyLibrary()
    } catch {
      return emptyLibrary()
    }
  }

  let library: TeacherLibrary = $state(load())
  $effect(() => {
    const snapshot = JSON.stringify($state.snapshot(library))
    try {
      if (isLocalStorageAvailable()) localStorage.setItem(STORAGE_KEY, snapshot)
    } catch {
      // Stockage plein ou refusé : la publication reste le moyen de garder la bibliothèque
    }
  })

  type View = 'parcours' | 'classes' | 'objectifs'
  let view: View = $state('parcours')
  // Premier parcours de la bibliothèque à l'ouverture (valeur initiale voulue)
  let selectedId: string | null = $state(
    untrack(() => library.entries[0]?.parcours.id ?? null),
  )
  const selected = $derived(
    library.entries.find((e) => e.parcours.id === selectedId),
  )
  let index = $state<Map<string, ReferentialExercise> | null>(null)
  let notice = $state('')
  let confirmDelete = $state(false)
  let dropping = $state(false)

  const levels = LEVELS
  const tags = $derived(
    taggedExercises(library.entries.flatMap((e) => e.parcours.etapes)),
  )
  const toSend = $derived(unpublishedCount(library))
  const ready = $derived(
    library.entries.filter(
      (e) => e.classes.length && !missing(e.parcours).length,
    ).length,
  )

  // ---------- Exercices de la feuille composée sur le site ----------
  function stepFrom(params: (typeof $exercicesParams)[number]): Step | null {
    const e = index?.get(params.uuid)
    if (!e || !e.interactif) return null
    const s: Step = {
      uuid: e.uuid,
      id: params.id ?? e.id,
      titre: e.titre,
      nbQuestions: Number(params.nbQuestions) || 3,
    }
    for (const k of ['sup', 'sup2', 'sup3', 'sup4'] as const)
      if (params[k] !== undefined) s[k] = String(params[k])
    const objectifs =
      tags.get(exerciseKey(s)) ??
      (e.objective ? [e.objective.libelle] : undefined)
    return objectifs ? { ...s, objectifs } : s
  }
  const sheet = $derived(
    index
      ? $exercicesParams.map(stepFrom).filter((s): s is Step => s !== null)
      : [],
  )
  const skipped = $derived(index ? $exercicesParams.length - sheet.length : 0)

  function addSheet(id: string, level: number) {
    const entry = library.entries.find((e) => e.parcours.id === id)
    if (!entry || !sheet.length) return
    const n = sheet.length
    change(addSteps(entry.parcours, sheet, level))
    exercicesParams.set([])
    notice = `${n} exercice${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à « ${entry.parcours.titre || 'Sans titre'} »${skipped ? ` ; ${skipped} non interactif${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''} (l’application ne propose que des exercices interactifs)` : ''}.`
  }

  onMount(async () => {
    index = await exerciseIndex()
  })

  // ---------- Bibliothèque ----------
  function change(p: Parcours) {
    const r = saveParcours(library, p)
    library = r.library
    selectedId = r.id
  }

  function create() {
    const d = library.defaults
    change(
      emptyParcours(
        d
          ? {
              niveau: d.niveau,
              difficulte: d.difficulte,
              presentation: d.presentation,
              correction: d.correction,
            }
          : {},
      ),
    )
    view = 'parcours'
    notice = ''
    // Avec la feuille du site en cours, ses exercices entrent dans le nouveau parcours
    if (sheet.length) addSheet(selectedId!, 0)
  }

  async function open(file: File | undefined) {
    if (!file) return
    try {
      const f = readParcoursFile(await file.text())
      library = restore(library, f)
      const ids = new Set(
        [
          ...f.classes.flatMap((c) => c.parcours),
          ...(f.bibliotheque?.parcours ?? []),
        ].map((p) => p.id),
      )
      selectedId ??= library.entries[0]?.parcours.id ?? null
      notice = `${ids.size} parcours repris${f.classes.length ? `, ${f.classes.length} classe${f.classes.length > 1 ? 's' : ''}` : ''}. Rien n’a été effacé.`
    } catch (e) {
      notice = (e as Error).message
    }
  }

  async function publishLibrary() {
    const { text, library: published } = publish(library)
    const name = timestampedName('parcours-mathalea')
    if ((await downloadFile(text, name)) === 'success') {
      library = published
      notice = `${name} enregistré : déposez-le dans le dossier partagé de vos classes (les anciens peuvent y rester). Les élèves le reçoivent au prochain lancement de l’application.`
    } else notice = 'Le fichier n’a pas pu être enregistré.'
  }

  const byLevel = $derived.by(() => {
    const rank = (n: string) =>
      levels.indexOf(n) === -1 ? levels.length : levels.indexOf(n)
    const lv = [...new Set(library.entries.map((e) => e.parcours.niveau))].sort(
      (a, b) => rank(a) - rank(b),
    )
    return lv.map((niveau) => {
      const of = library.entries.filter((e) => e.parcours.niveau === niveau)
      return {
        niveau,
        chapters: [...new Set(of.map((e) => e.parcours.theme.trim()))].map(
          (theme) => ({
            theme,
            entries: of.filter((e) => e.parcours.theme.trim() === theme),
          }),
        ),
      }
    })
  })

  const summary = (e: (typeof library.entries)[number]) => {
    const levelsCount = levelGroups(e.parcours).length
    const n = e.parcours.etapes.length
    const organisation =
      levelsCount > 1
        ? e.parcours.style === 'ceintures'
          ? `${levelsCount} ceintures`
          : `${levelsCount} paliers`
        : `${n} exercice${n > 1 ? 's' : ''}`
    return [
      e.classes.length ? e.classes.join(', ') : 'Aucune classe',
      organisation,
    ].join(' · ')
  }

  const tab = (on: boolean) =>
    `px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
      on
        ? 'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-struct dark:text-coopmathsdark-struct shadow-sm'
        : 'text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light hover:text-coopmaths-struct dark:hover:text-coopmathsdark-struct'
    }`
  const primary =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas hover:bg-coopmaths-action-lightest dark:hover:bg-coopmathsdark-action-lightest disabled:opacity-40'
  const secondary =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold border border-coopmaths-action dark:border-coopmathsdark-action text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-action hover:text-coopmaths-canvas dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas cursor-pointer'
  const quiet =
    'text-sm text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light'
</script>

<svelte:window
  ondragover={(e) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault()
      dropping = true
    }
  }}
  ondragleave={(e) => {
    if (!e.relatedTarget) dropping = false
  }}
  ondrop={(e) => {
    dropping = false
    const file = e.dataTransfer?.files[0]
    if (file && !e.defaultPrevented) {
      e.preventDefault()
      open(file)
    }
  }}
/>

<div
  class="flex flex-col min-h-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus"
>
  <NavBar
    subtitle="Parcours pour l’application"
    subtitleType="export"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />

  <div
    class="sticky top-0 z-10 flex flex-row flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-3 border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
  >
    <div
      class="flex flex-row gap-1 rounded-lg p-1 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      role="tablist"
      aria-label="Vue"
    >
      {#each [['parcours', 'Parcours'], ['classes', 'Classes'], ['objectifs', 'Objectifs']] as [v, text] (v)}
        <button
          type="button"
          role="tab"
          aria-selected={view === v}
          class={tab(view === v)}
          onclick={() => (view = v as View)}>{text}</button
        >
      {/each}
    </div>
    <div class="flex flex-row flex-wrap items-center gap-3">
      <span class={quiet} role="status">
        {#if toSend}
          <i
            class="bx bx-error-circle text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
            aria-hidden="true"
          ></i>
          {toSend === 1
            ? 'Un parcours n’est pas encore chez les élèves'
            : `${toSend} parcours ne sont pas encore chez les élèves`}
        {:else if ready}
          <i
            class="bx bx-check-circle text-coopmaths-action dark:text-coopmathsdark-action"
            aria-hidden="true"
          ></i> Aucun changement depuis la dernière publication
        {/if}
      </span>
      <label
        class={secondary}
        title="Fichier parcours-mathalea publié par l’application ou par cette page"
      >
        <i class="bx bx-folder-open" aria-hidden="true"></i> Ouvrir
        <input
          type="file"
          accept=".json,application/json"
          class="hidden"
          onchange={(e) => {
            const input = e.currentTarget as HTMLInputElement
            open(input.files?.[0])
            input.value = ''
          }}
        />
      </label>
      <button
        type="button"
        class={primary}
        disabled={!ready}
        onclick={publishLibrary}
      >
        <i class="bx bx-upload" aria-hidden="true"></i> Publier
      </button>
    </div>
  </div>

  {#if dropping}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-coopmaths-canvas/90 dark:bg-coopmathsdark-canvas/90 pointer-events-none"
    >
      <p
        class="rounded-xl border-2 border-dashed border-coopmaths-action dark:border-coopmathsdark-action px-10 py-8 text-xl font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        Déposez le fichier publié pour reprendre la bibliothèque
      </p>
    </div>
  {/if}

  <main
    class="flex-1 w-full max-w-screen-xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6"
  >
    {#if notice}
      <p
        class="flex flex-row items-start gap-3 rounded-lg px-4 py-3 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
        role="status"
      >
        <span class="flex-1">{notice}</span>
        <button
          type="button"
          class="text-coopmaths-action dark:text-coopmathsdark-action"
          aria-label="Fermer le message"
          onclick={() => (notice = '')}
          ><i class="bx bx-x text-xl" aria-hidden="true"></i></button
        >
      </p>
    {/if}

    {#if !library.entries.length && view === 'parcours'}
      <!-- Mise en route : rien dans la bibliothèque -->
      <section
        class="grid grid-cols-1 md:grid-cols-3 gap-4"
        aria-label="Mise en route"
      >
        {#each [['bx-layer', 'Créer', 'Un parcours pour un niveau : exercices du site, paliers, pauses, objectifs.'], ['bx-group', 'Donner aux classes', 'Chaque classe reçoit ses parcours, dans l’ordre choisi.'], ['bx-upload', 'Publier', 'Un fichier à déposer dans le dossier partagé : les applications des élèves le lisent.']] as [icon, title, text], k (title)}
          <div
            class="flex flex-col gap-2 rounded-xl p-5 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
          >
            <span
              class="flex flex-row items-center gap-2 font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
            >
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
                >{k + 1}</span
              >
              <i class="bx {icon} text-xl" aria-hidden="true"></i>{title}
            </span>
            <p class={quiet}>{text}</p>
          </div>
        {/each}
      </section>
      <div class="flex flex-row flex-wrap items-center gap-4">
        <button type="button" class={primary} onclick={create}
          ><i class="bx bx-plus" aria-hidden="true"></i> Créer un parcours{sheet.length
            ? ` avec la feuille en cours (${sheet.length})`
            : ''}</button
        >
        <span class={quiet}
          >ou déposez ici le fichier déjà publié (application ou site) pour
          reprendre votre bibliothèque.</span
        >
      </div>
    {:else if view === 'parcours'}
      <div
        class="grid grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_17rem] gap-8"
      >
        <aside class="flex flex-col gap-4">
          <button
            type="button"
            class="{primary} justify-center"
            onclick={create}
            ><i class="bx bx-plus" aria-hidden="true"></i> Nouveau parcours</button
          >
          {#each byLevel as g (g.niveau)}
            <div>
              <p
                class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
              >
                {g.niveau || 'Sans niveau'}
              </p>
              {#each g.chapters as c (c.theme)}
                <p
                  class="mt-2 text-xs font-semibold uppercase tracking-wide text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
                >
                  {c.theme || 'Sans chapitre'}
                </p>
                <ul class="mt-1 flex flex-col gap-1">
                  {#each c.entries as e (e.parcours.id)}
                    <li>
                      <button
                        type="button"
                        aria-current={e.parcours.id === selectedId}
                        class="w-full rounded-lg px-3 py-2 text-left transition-colors
                        {e.parcours.id === selectedId
                          ? 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark ring-1 ring-coopmaths-action dark:ring-coopmathsdark-action'
                          : 'hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
                        onclick={() => {
                          selectedId = e.parcours.id
                          confirmDelete = false
                        }}
                      >
                        <span
                          class="flex flex-row items-center gap-2 font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
                        >
                          {e.parcours.titre || 'Sans titre'}
                          {#if toPublish(e)}<span
                              class="w-2 h-2 rounded-full bg-coopmaths-warn-dark dark:bg-coopmathsdark-warn-dark"
                              title="Pas encore publié"
                            ></span>{/if}
                        </span>
                        <span class="block {quiet}">{summary(e)}</span>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/each}
            </div>
          {/each}
        </aside>
        <section class="min-w-0">
          {#if selected}
            {#if confirmDelete}
              <div
                class="mb-4 flex flex-row flex-wrap items-center gap-4 rounded-lg p-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
                role="alert"
              >
                <span
                  >Supprimer « {selected.parcours.titre || 'Sans titre'} » de la bibliothèque
                  ? Les élèves le gardent jusqu’à la prochaine publication.</span
                >
                <button
                  type="button"
                  class={primary}
                  onclick={() => {
                    library = deleteParcours(library, selected.parcours.id)
                    selectedId = library.entries[0]?.parcours.id ?? null
                    confirmDelete = false
                  }}>Supprimer</button
                >
                <button
                  type="button"
                  class={secondary}
                  onclick={() => (confirmDelete = false)}>Annuler</button
                >
              </div>
            {/if}
            <!-- Écran étroit : le schéma se déplie au-dessus de l'éditeur -->
            <details
              class="xl:hidden mb-6 rounded-xl p-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
            >
              <summary
                class="cursor-pointer font-semibold text-coopmaths-action dark:text-coopmathsdark-action"
                >Voir le schéma du parcours</summary
              >
              <div class="mt-3">
                <ParcoursSchema
                  parcours={selected.parcours}
                  onfocus={(anchor) =>
                    document
                      .getElementById(anchor)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
              </div>
            </details>
            {#key selected.parcours.id}
              <ParcoursEditor
                parcours={selected.parcours}
                {levels}
                chapters={knownChapters(library, selected.parcours.niveau)}
                objectives={library.objectives}
                {tags}
                {index}
                sheetCount={sheet.length}
                fromSite={stepFrom}
                onchange={change}
                onaddsheet={(level) => addSheet(selected.parcours.id, level)}
                onduplicate={() => change(duplicate(selected.parcours))}
                ondelete={() => (confirmDelete = true)}
              />
            {/key}
          {:else}
            <p class={quiet}>
              Choisissez un parcours dans la liste, ou créez-en un.
            </p>
          {/if}
        </section>
        {#if selected}
          <aside class="hidden xl:block min-w-0">
            <div
              class="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1"
            >
              <ParcoursSchema
                parcours={selected.parcours}
                onfocus={(anchor) =>
                  document
                    .getElementById(anchor)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />
            </div>
          </aside>
        {/if}
      </div>
    {:else if view === 'classes'}
      <ParcoursClasses
        {library}
        onselect={(id) => {
          selectedId = id
          view = 'parcours'
        }}
        onsetparcours={(c, ids) =>
          (library = setClassParcours(library, c, ids))}
        onmove={(id, c, d) => (library = move(library, id, c, d))}
        onadd={(name) => (library = addClass(library, name))}
        onrename={(before, after) =>
          (library = renameClass(library, before, after))}
        onremove={(name) => (library = removeClass(library, name))}
      />
    {:else}
      <ParcoursObjectives
        {library}
        {levels}
        onchange={(objectives) =>
          (library = {
            ...library,
            objectives: mergeObjectives([], objectives),
          })}
      />
    {/if}
  </main>
</div>
