<script lang="ts" context="module">
  /** Contrôle flottant, positionné en % du conteneur de l'aperçu */
  export interface OverlayWidget {
    /**
     * `tasks` : liste de questions réglable ; `exo` : début d'un exercice ;
     * `gap` : espace après un exercice ; `header` : bloc de titre de la fiche
     */
    kind: 'tasks' | 'exo' | 'gap' | 'header'
    /** Numéro de l'exercice concerné (0 = avant le premier exercice) */
    num: number
    /** Préfixe des variables visées par un contrôle `tasks` (`ex1`, `ex1-corr`) */
    target?: string
    left: number
    top: number
    /** Marge de page où placer les contrôles des questions */
    side?: 'left' | 'right'
  }

  /** Mise en page courante des questions d'un exercice (lue dans le code) */
  export interface TasksLayoutValue {
    columns: number
    /** Expression Typst (`1em`, `interligne-questions`…) */
    gutter: string
  }
</script>

<script lang="ts">
  import {
    COLUMN_BREAK_SNIPPET,
    PAGE_BREAK_SNIPPET,
  } from './buildTypstDocument'

  /**
   * Palette de mise en page de l'aperçu Typst : contrôles dessinés par-dessus
   * le SVG aux positions publiées par les repères `mathalea-anchor` du code.
   * - dans la marge, à hauteur de chaque liste de questions : colonnes et
   *   espacement vertical ;
   * - après chaque exercice (et avant le premier) : insertion, modification
   *   et suppression d'un texte ou d'un titre de section.
   */
  export let widgets: OverlayWidget[] = []
  /** Mise en page des questions par préfixe de variables (`ex1`, `ex1-corr`) */
  export let layoutValues: Record<string, TasksLayoutValue> = {}
  /** Insertions présentes dans le code, par repère de gap (code Typst brut) */
  export let insertions: Record<number, string[]> = {}
  /** Variables d'en-tête de la fiche (valeurs lues dans le code) */
  export let header: { titre: string; 'sous-titre': string; entete: string } = {
    titre: '',
    'sous-titre': '',
    entete: '',
  }
  export let onAdjustColumns: (target: string, delta: number) => void
  export let onAdjustGutter: (target: string, delta: number) => void
  /** Insère un fragment de code Typst juste après l'exercice `num` */
  export let onInsert: (num: number, snippet: string) => void
  export let onUpdateInsertion: (
    num: number,
    index: number,
    snippet: string,
  ) => void
  export let onDeleteInsertion: (num: number, index: number) => void
  export let onUpdateHeader: (
    name: 'titre' | 'sous-titre' | 'entete',
    value: string,
  ) => void
  /** Nombre de questions par exercice (null : non réglable) */
  export let questionCounts: Record<number, number | null> = {}
  /** Nombre de colonnes du document (le saut de colonne n'a de sens qu'à > 1) */
  export let documentColumns = 1
  export let onChangeQuestionCount: (num: number, delta: number) => void
  export let onDeleteExercise: (num: number) => void

  /** Numéro du repère de gap dont le panneau d'insertion est ouvert */
  let openInsertion: number | null = null
  let insertionKind: 'section' | 'texte' = 'section'
  let insertionText = ''

  /** Panneau d'édition du titre/en-tête ouvert */
  let headerOpen = false
  let headerDraft = { titre: '', 'sous-titre': '', entete: '' }
  const HEADER_FIELDS = [
    { name: 'titre', label: 'Titre' },
    { name: 'sous-titre', label: 'Sous-titre (niveau, classe…)' },
    { name: 'entete', label: "Ligne d'en-tête" },
  ] as const

  function toggleHeader() {
    headerOpen = !headerOpen
    if (headerOpen) headerDraft = { ...header }
  }

  function submitHeader() {
    for (const field of HEADER_FIELDS) {
      if (headerDraft[field.name] !== header[field.name]) {
        onUpdateHeader(field.name, headerDraft[field.name])
      }
    }
    headerOpen = false
  }

  /** Brouillons d'édition des insertions existantes du panneau ouvert */
  interface InsertionDraft {
    kind: 'section' | 'texte'
    text: string
    /** Position dans la liste complète des insertions du repère */
    index: number
  }
  let drafts: InsertionDraft[] = []

  function parseSnippet(
    snippet: string,
    index: number,
  ): InsertionDraft {
    const section = snippet.match(/^#section\[(.*)\]$/)
    return section != null
      ? { kind: 'section', text: section[1], index }
      : { kind: 'texte', text: snippet, index }
  }

  function composeSnippet(draft: InsertionDraft): string {
    return draft.kind === 'section'
      ? `#section[${draft.text.trim()}]`
      : draft.text.trim()
  }

  // resynchronise les brouillons quand le code change (après enregistrement
  // ou suppression) ; la frappe dans un brouillon ne repasse pas ici.
  // Les sauts de page/colonne sont pilotés par leurs boutons dédiés.
  $: if (openInsertion != null) {
    drafts = (insertions[openInsertion] ?? [])
      .map(parseSnippet)
      .filter(
        (draft) =>
          draft.text !== PAGE_BREAK_SNIPPET &&
          draft.text !== COLUMN_BREAK_SNIPPET,
      )
  }

  /** Ajoute ou retire un saut de page/colonne au repère de gap `num` */
  function toggleBreak(num: number, snippet: string) {
    const index = (insertions[num] ?? []).indexOf(snippet)
    if (index >= 0) onDeleteInsertion(num, index)
    else onInsert(num, snippet)
  }


  function toggleInsertion(num: number) {
    openInsertion = openInsertion === num ? null : num
    insertionText = ''
  }

  function submitInsertion() {
    if (openInsertion == null) return
    const text = insertionText.trim()
    if (text.length === 0) return
    onInsert(
      openInsertion,
      insertionKind === 'section' ? `#section[${text}]` : text,
    )
    insertionText = ''
  }
</script>

<div class="pointer-events-none absolute inset-0 z-10 text-xs text-gray-700">
  {#each widgets as widget, i (i)}
    {#if widget.kind === 'tasks' && widget.target != null}
      {@const target = widget.target}
      {@const label =
        `l'exercice ${widget.num}` +
        (target.endsWith('-corr') ? ' (correction)' : '')}
      <!-- lecture directe de layoutValues dans le gabarit : une lecture via
           une fonction ne serait pas re-rendue quand la prop change -->
      {@const gutter = layoutValues[target]?.gutter}
      {@const gutterLabel =
        gutter == null || gutter === 'interligne-questions' ? 'auto' : gutter}
      <!-- contrôles des questions, dans la marge la plus proche -->
      <div
        class="pointer-events-auto absolute flex -translate-y-1/2 flex-col rounded border border-gray-300 bg-white/80 shadow opacity-50 transition-opacity hover:opacity-100"
        style="top: {widget.top}%; {widget.side === 'right'
          ? 'right: 0.3%'
          : 'left: 0.3%'}"
        data-testid="typst-overlay-tasks"
      >
        <div
          class="flex items-center justify-between"
          title="Colonnes des questions de {label}"
        >
          <button
            type="button"
            aria-label="Moins de colonnes"
            class="hover:text-coopmaths-action"
            on:click={() => onAdjustColumns(target, -1)}
          >
            <i class="bx bx-chevron-left"></i>
          </button>
          <span class="tabular-nums">
            {layoutValues[target]?.columns ?? 1}<i
              class="bx bx-columns text-[0.6rem]"
            ></i>
          </span>
          <button
            type="button"
            aria-label="Plus de colonnes"
            class="hover:text-coopmaths-action"
            on:click={() => onAdjustColumns(target, 1)}
          >
            <i class="bx bx-chevron-right"></i>
          </button>
        </div>
        <div
          class="flex items-center justify-between border-t border-gray-200"
          title="Espacement vertical des questions de {label}"
        >
          <button
            type="button"
            aria-label="Réduire l'espacement des questions"
            class="hover:text-coopmaths-action"
            on:click={() => onAdjustGutter(target, -1)}
          >
            <i class="bx bx-minus"></i>
          </button>
          <span class="px-0.5 text-[0.6rem] tabular-nums">
            {gutterLabel}
          </span>
          <button
            type="button"
            aria-label="Augmenter l'espacement des questions"
            class="hover:text-coopmaths-action"
            on:click={() => onAdjustGutter(target, 1)}
          >
            <i class="bx bx-plus"></i>
          </button>
        </div>
      </div>
    {:else if widget.kind === 'header'}
      <!-- édition du titre, du sous-titre et de la ligne d'en-tête -->
      <div
        class="pointer-events-auto absolute -translate-y-1/2"
        style="left: {widget.left}%; top: {widget.top}%;"
      >
        <button
          type="button"
          title="Modifier le titre, le sous-titre et la ligne d'en-tête"
          aria-label="Modifier le titre, le sous-titre et la ligne d'en-tête"
          aria-expanded={headerOpen}
          class="flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-gray-300 bg-white/85 shadow opacity-60 transition-opacity hover:opacity-100 hover:text-coopmaths-action"
          data-testid="typst-overlay-header"
          on:click={toggleHeader}
        >
          <i class="bx bx-edit"></i>
        </button>
        {#if headerOpen}
          <div
            class="absolute left-4 top-0 z-20 w-80 space-y-2 rounded-lg border border-gray-300 bg-white p-2 shadow-lg"
          >
            {#each HEADER_FIELDS as field}
              <label class="block space-y-0.5">
                <span class="text-[0.65rem] uppercase text-gray-500">
                  {field.label}
                </span>
                <input
                  type="text"
                  class="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                  bind:value={headerDraft[field.name]}
                  on:keydown={(e) => {
                    if (e.key === 'Enter') submitHeader()
                    if (e.key === 'Escape') headerOpen = false
                  }}
                />
              </label>
            {/each}
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-2 py-0.5 hover:text-coopmaths-action"
                on:click={() => (headerOpen = false)}
              >
                Annuler
              </button>
              <button
                type="button"
                class="rounded bg-coopmaths-action px-2 py-0.5 text-white"
                on:click={submitHeader}
              >
                Enregistrer
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else if widget.kind === 'exo'}
      <!-- contrôles de l'exercice : texte avant l'exercice (repère de gap
           précédent), nombre de questions, suppression -->
      {@const gapNum = widget.num - 1}
      {@const exoInsertions = insertions[gapNum] ?? []}
      {@const hasContent = exoInsertions.some(
        (snippet) =>
          snippet !== PAGE_BREAK_SNIPPET && snippet !== COLUMN_BREAK_SNIPPET,
      )}
      <div
        class="pointer-events-auto absolute flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-gray-300 bg-white/85 px-1 shadow opacity-50 transition-opacity hover:opacity-100"
        style="top: {widget.top}%; right: 0.3%;"
        data-testid="typst-overlay-exo"
      >
        <button
          type="button"
          title="Insérer ou modifier un texte ou un titre de section avant l'exercice {widget.num}"
          aria-label="Insérer ou modifier un texte ou un titre de section avant l'exercice {widget.num}"
          aria-expanded={openInsertion === gapNum}
          class="hover:text-coopmaths-action"
          data-testid="typst-overlay-insert"
          on:click={() => toggleInsertion(gapNum)}
        >
          <i class="bx {hasContent ? 'bx-edit' : 'bx-plus'}"></i>
        </button>
        <span class="h-3 w-px bg-gray-300"></span>
        {#if questionCounts[widget.num] != null}
          <button
            type="button"
            title="Une question de moins"
            aria-label="Une question de moins dans l'exercice {widget.num}"
            class="hover:text-coopmaths-action"
            on:click={() => onChangeQuestionCount(widget.num, -1)}
          >
            <i class="bx bx-minus"></i>
          </button>
          <span class="tabular-nums" title="Nombre de questions">
            {questionCounts[widget.num]}<span class="text-[0.6rem]">q</span>
          </span>
          <button
            type="button"
            title="Une question de plus"
            aria-label="Une question de plus dans l'exercice {widget.num}"
            class="hover:text-coopmaths-action"
            on:click={() => onChangeQuestionCount(widget.num, 1)}
          >
            <i class="bx bx-plus"></i>
          </button>
          <span class="h-3 w-px bg-gray-300"></span>
        {/if}
        <button
          type="button"
          title="Supprimer l'exercice {widget.num} de la fiche"
          aria-label="Supprimer l'exercice {widget.num} de la fiche"
          class="hover:text-red-600"
          on:click={() => onDeleteExercise(widget.num)}
        >
          <i class="bx bx-trash"></i>
        </button>
        {#if openInsertion === gapNum}
          <div
            class="absolute right-0 top-6 z-20 w-72 space-y-2 rounded-lg border border-gray-300 bg-white p-2 shadow-lg"
          >
            {#if drafts.length > 0}
              <!-- insertions existantes : modification et suppression
                   (draft.index : position réelle dans le code, les sauts de
                   page/colonne étant filtrés de cette liste) -->
              {#each drafts as draft (draft.index)}
                <div class="flex items-center gap-1">
                  <span
                    class="shrink-0 rounded bg-gray-100 px-1 py-0.5 text-[0.6rem] uppercase text-gray-500"
                  >
                    {draft.kind}
                  </span>
                  <input
                    type="text"
                    class="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                    bind:value={draft.text}
                    on:keydown={(e) => {
                      if (e.key === 'Enter' && draft.text.trim().length > 0) {
                        onUpdateInsertion(
                          gapNum,
                          draft.index,
                          composeSnippet(draft),
                        )
                      }
                      if (e.key === 'Escape') openInsertion = null
                    }}
                  />
                  <button
                    type="button"
                    title="Enregistrer la modification"
                    aria-label="Enregistrer la modification"
                    class="hover:text-coopmaths-action disabled:opacity-40"
                    disabled={draft.text.trim().length === 0}
                    on:click={() =>
                      onUpdateInsertion(
                        gapNum,
                        draft.index,
                        composeSnippet(draft),
                      )}
                  >
                    <i class="bx bx-check text-base"></i>
                  </button>
                  <button
                    type="button"
                    title="Supprimer cette insertion"
                    aria-label="Supprimer cette insertion"
                    class="hover:text-red-600"
                    on:click={() => onDeleteInsertion(gapNum, draft.index)}
                  >
                    <i class="bx bx-trash text-base"></i>
                  </button>
                </div>
              {/each}
              <hr class="border-gray-200" />
            {/if}
            <div class="flex overflow-hidden rounded border border-gray-300">
              {#each [{ kind: 'section', label: 'Section' }, { kind: 'texte', label: 'Texte' }] as choice}
                <button
                  type="button"
                  class="flex-1 px-2 py-0.5 {insertionKind === choice.kind
                    ? 'bg-coopmaths-action text-white'
                    : 'bg-white hover:bg-gray-100'}"
                  aria-pressed={insertionKind === choice.kind}
                  on:click={() =>
                    (insertionKind = choice.kind as 'section' | 'texte')}
                >
                  {choice.label}
                </button>
              {/each}
            </div>
            <!-- svelte-ignore a11y-autofocus : le formulaire vient d'être ouvert au clic -->
            <input
              type="text"
              autofocus={drafts.length === 0}
              class="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs"
              placeholder={insertionKind === 'section'
                ? 'Titre de la section (ex : Monômes)'
                : 'Texte (code Typst accepté)'}
              bind:value={insertionText}
              on:keydown={(e) => {
                if (e.key === 'Enter') submitInsertion()
                if (e.key === 'Escape') openInsertion = null
              }}
            />
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-2 py-0.5 hover:text-coopmaths-action"
                on:click={() => (openInsertion = null)}
              >
                Fermer
              </button>
              <button
                type="button"
                class="rounded bg-coopmaths-action px-2 py-0.5 text-white disabled:opacity-50"
                disabled={insertionText.trim().length === 0}
                on:click={submitInsertion}
              >
                Insérer
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      {@const gapInsertions = insertions[widget.num] ?? []}
      {@const hasPageBreak = gapInsertions.includes(PAGE_BREAK_SNIPPET)}
      {@const hasColumnBreak = gapInsertions.includes(COLUMN_BREAK_SNIPPET)}
      <!-- entre deux exercices : seulement les sauts de page/colonne (le
           texte s'insère depuis les contrôles de l'exercice suivant) -->
      <div
        class="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5"
        style="left: {widget.left}%; top: {widget.top}%;"
      >
        <!-- boutons d'insertion de saut : seulement quand le saut est absent
             (une fois inséré, il devient un badge séparé, retirable) -->
        {#if !hasPageBreak}
          <button
            type="button"
            title="Insérer un saut de page ici"
            aria-label="Insérer un saut de page ici"
            class="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white/85 shadow opacity-60 transition-opacity hover:opacity-100 hover:text-coopmaths-action"
            data-testid="typst-overlay-pagebreak"
            on:click={() => toggleBreak(widget.num, PAGE_BREAK_SNIPPET)}
          >
            <i class="bx bx-arrow-to-bottom"></i>
          </button>
        {/if}
        <!-- saut de colonne : seulement en document multicolonne (le badge
             actif reste visible en 1 colonne pour pouvoir le retirer) -->
        {#if !hasColumnBreak && documentColumns > 1}
          <button
            type="button"
            title="Insérer un saut de colonne ici"
            aria-label="Insérer un saut de colonne ici"
            class="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white/85 shadow opacity-60 transition-opacity hover:opacity-100 hover:text-coopmaths-action"
            data-testid="typst-overlay-colbreak"
            on:click={() => toggleBreak(widget.num, COLUMN_BREAK_SNIPPET)}
          >
            <i class="bx bx-arrow-to-right"></i>
          </button>
        {/if}
        <!-- sauts actifs : badges bien visibles, retirables d'un clic -->
        {#if hasPageBreak}
          <button
            type="button"
            title="Retirer le saut de page"
            aria-label="Retirer le saut de page"
            class="flex items-center gap-1 rounded-full border border-coopmaths-action bg-coopmaths-action px-2 py-0.5 text-white shadow hover:bg-coopmaths-action-lightest"
            data-testid="typst-overlay-pagebreak-active"
            on:click={() => toggleBreak(widget.num, PAGE_BREAK_SNIPPET)}
          >
            <i class="bx bx-arrow-to-bottom"></i>
            Saut de page
            <i class="bx bx-x"></i>
          </button>
        {/if}
        {#if hasColumnBreak}
          <button
            type="button"
            title="Retirer le saut de colonne"
            aria-label="Retirer le saut de colonne"
            class="flex items-center gap-1 rounded-full border border-coopmaths-action bg-coopmaths-action px-2 py-0.5 text-white shadow hover:bg-coopmaths-action-lightest"
            data-testid="typst-overlay-colbreak-active"
            on:click={() => toggleBreak(widget.num, COLUMN_BREAK_SNIPPET)}
          >
            <i class="bx bx-arrow-to-right"></i>
            Saut de colonne
            <i class="bx bx-x"></i>
          </button>
        {/if}
      </div>
    {/if}
  {/each}
</div>
