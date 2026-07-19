<script lang="ts" context="module">
  /** Contrôle flottant, positionné en % du conteneur de l'aperçu */
  export interface OverlayWidget {
    /**
     * `tasks` : liste de questions réglable ; `exo` : début d'un exercice ;
     * `gap` : espace après un exercice ; `header` : bloc de titre de la fiche ;
     * `figure` : figure mathalea2d embarquée (zoom)
     */
    kind: 'tasks' | 'exo' | 'gap' | 'header' | 'figure'
    /** Numéro de l'exercice concerné (0 = avant le premier exercice), ou de la figure */
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
    columns: number | string
    /** Expression Typst (`1em`, `interligne-questions`…) */
    gutter: string
  }
</script>

<script lang="ts">
  import {
    COLUMN_BREAK_SNIPPET,
    PAGE_BREAK_SNIPPET,
    WRITING_LINES_POSITIONS,
    type WritingLinesPosition,
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
  /**
   * Exercices statiques (annale scannée, éventuellement convertie en `.typ`),
   * par numéro : contenu figé, sans génération possible de nouvelles données
   * ni de questions supplémentaires, ni de réglages (nbQuestions, durée...)
   * — masque les boutons « Nouvelles données » et « Réglages de l'exercice ».
   */
  export let staticExercises: Record<number, boolean> = {}
  /** Nombre de colonnes du document (le saut de colonne n'a de sens qu'à > 1) */
  export let documentColumns = 1
  /** Zoom de chaque figure, par numéro de figure (`fig-N`) */
  export let figureZoomValues: Record<number, number> = {}
  /** Alignement de chaque figure, par numéro de figure (`fig-N`) */
  export let figureAlignValues: Record<number, 'left' | 'center' | 'right'> = {}
  /** Nombre total d'exercices (borne les boutons monter/descendre) */
  export let exerciseCount = 0
  /**
   * Numéros (1-based) des exercices fusionnés avec le précédent : ils
   * partagent le titre de leur prédécesseur et la numérotation de leurs
   * questions continue la sienne.
   */
  export let mergedExercises: number[] = []
  /** Fusion locale désactivée quand tous les exercices sont déjà fusionnés */
  export let mergeExercisesEnabled = true
  export let onChangeQuestionCount: (num: number, delta: number) => void
  export let onDeleteExercise: (num: number) => void
  export let onToggleMergeBefore: (num: number) => void
  export let onAdjustFigureZoom: (num: number, delta: number) => void
  export let onSetFigureAlign: (
    num: number,
    align: 'left' | 'center' | 'right',
  ) => void
  export let onMoveExercise: (num: number, delta: -1 | 1) => void
  export let onNewData: (num: number) => void
  export let onOpenSettings: (num: number) => void
  /** Surcharges de code Typst existantes, par numéro d'exercice (voir onEditCode) */
  export let codeOverrides: Record<number, string> = {}
  export let onEditCode: (num: number) => void
  /** Lignes en pointillés réglées par exercice (valeurs lues dans le code) */
  export let writingLinesValues: Record<
    number,
    { position: WritingLinesPosition; count: number; spacing: number }
  > = {}
  /** Règle (`value`) ou retire (`null`) les lignes en pointillés de l'exercice num */
  export let onSetWritingLines: (
    num: number,
    value: {
      position: WritingLinesPosition
      count: number
      spacing: number
    } | null,
  ) => void

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

  function parseSnippet(snippet: string, index: number): InsertionDraft {
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
    openWritingLines = null
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

  /** Libellés des emplacements des lignes en pointillés */
  const WRITING_LINES_POSITION_LABELS: Record<WritingLinesPosition, string> = {
    endOfExercise: "Fin d'exercice",
    afterEachQuestion: 'Après chaque question',
  }

  /**
   * Réglage par défaut à l'ouverture du panneau d'un exercice sans lignes :
   * 0 ligne, pour qu'aucune n'apparaisse tant que le professeur n'a pas
   * incrémenté le compteur lui-même.
   */
  const WRITING_LINES_DEFAULT: {
    position: WritingLinesPosition
    count: number
    spacing: number
  } = { position: 'endOfExercise', count: 0, spacing: 2 }

  /** Numéro de l'exercice dont le panneau de lignes en pointillés est ouvert */
  let openWritingLines: number | null = null
  let writingLinesDraft = { ...WRITING_LINES_DEFAULT }

  function toggleWritingLines(num: number) {
    openWritingLines = openWritingLines === num ? null : num
    openInsertion = null
    if (openWritingLines != null) {
      writingLinesDraft = writingLinesValues[num] ?? { ...WRITING_LINES_DEFAULT }
    }
  }

  function setWritingLinesPosition(num: number, position: WritingLinesPosition) {
    writingLinesDraft = { ...writingLinesDraft, position }
    onSetWritingLines(num, writingLinesDraft)
  }

  function setWritingLinesCount(num: number, count: number) {
    writingLinesDraft = {
      ...writingLinesDraft,
      count: Math.min(20, Math.max(0, count)),
    }
    onSetWritingLines(num, writingLinesDraft)
  }

  /** Espacement des lignes, réglable par pas de 0,5 em */
  function setWritingLinesSpacing(num: number, spacing: number) {
    writingLinesDraft = {
      ...writingLinesDraft,
      spacing: Math.min(6, Math.max(0.5, Math.round(spacing * 2) / 2)),
    }
    onSetWritingLines(num, writingLinesDraft)
  }

  function clearWritingLines(num: number) {
    onSetWritingLines(num, null)
    openWritingLines = null
  }
</script>

{#snippet insertionPanel(gapNum: number, positionClass: string)}
  <!-- panneau d'insertion/modification d'un texte ou d'un titre de section
       pour le repère de gap `gapNum` ; partagé entre le bouton du repère
       (barre d'exercice qui suit, ou barre du dernier repère) -->
  {#if openInsertion === gapNum}
    <div
      class="absolute top-6 z-20 w-72 space-y-2 typst-panel p-2 {positionClass}"
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
                  onUpdateInsertion(gapNum, draft.index, composeSnippet(draft))
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
                onUpdateInsertion(gapNum, draft.index, composeSnippet(draft))}
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
              ? 'bg-coopmaths-action text-coopmaths-canvas'
              : 'bg-coopmaths-canvas text-coopmaths-corpus hover:bg-coopmaths-canvas-dark'}"
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
{/snippet}

{#snippet writingLinesPanel(num: number)}
  <!-- panneau de réglage des lignes en pointillés (pour que l'élève y
       écrive) de l'exercice `num` : emplacement, nombre de lignes,
       espacement. Régénère le code à chaque changement (voir onSetWritingLines). -->
  {#if openWritingLines === num}
    <div class="absolute top-6 right-0 z-30 w-64 space-y-2 typst-panel p-2">
      <div class="flex overflow-hidden rounded border border-gray-300">
        {#each WRITING_LINES_POSITIONS as position}
          <button
            type="button"
            class="flex-1 px-2 py-0.5 text-[0.7rem] {writingLinesDraft.position ===
            position
              ? 'bg-coopmaths-action text-coopmaths-canvas'
              : 'bg-coopmaths-canvas text-coopmaths-corpus hover:bg-coopmaths-canvas-dark'}"
            aria-pressed={writingLinesDraft.position === position}
            on:click={() => setWritingLinesPosition(num, position)}
          >
            {WRITING_LINES_POSITION_LABELS[position]}
          </button>
        {/each}
      </div>
      <label class="flex items-center justify-between gap-2 text-xs">
        Nombre de lignes
        <input
          type="number"
          min="0"
          max="20"
          step="1"
          class="w-14 rounded border border-gray-300 px-1 py-0.5 text-xs"
          value={writingLinesDraft.count}
          on:change={(e) =>
            setWritingLinesCount(num, Number(e.currentTarget.value))}
        />
      </label>
      <label class="flex items-center justify-between gap-2 text-xs">
        Espacement (em)
        <input
          type="number"
          min="0.5"
          max="6"
          step="0.5"
          class="w-14 rounded border border-gray-300 px-1 py-0.5 text-xs"
          value={writingLinesDraft.spacing}
          on:change={(e) =>
            setWritingLinesSpacing(num, Number(e.currentTarget.value))}
        />
      </label>
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="px-2 py-0.5 text-xs text-red-600 hover:underline"
          on:click={() => clearWritingLines(num)}
        >
          Retirer
        </button>
        <button
          type="button"
          class="px-2 py-0.5 text-xs hover:text-coopmaths-action"
          on:click={() => (openWritingLines = null)}
        >
          Fermer
        </button>
      </div>
    </div>
  {/if}
{/snippet}

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
        class="pointer-events-auto absolute flex -translate-y-1/2 flex-col typst-pill typst-pill-box"
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
            on:click={() => onAdjustColumns(target, -1)}
          >
            <i class="bx bx-chevron-left"></i>
          </button>
          <span class="tabular-nums">
            {layoutValues[target]?.columns === '"auto-fit"'
              ? 'auto'
              : (layoutValues[target]?.columns ?? 'auto')}<i
              class="bx bx-columns text-[0.6rem]"
            ></i>
          </span>
          <button
            type="button"
            aria-label="Plus de colonnes"
            on:click={() => onAdjustColumns(target, 1)}
          >
            <i class="bx bx-chevron-right"></i>
          </button>
        </div>
        <div
          class="flex items-center justify-between typst-pill-divider-top"
          title="Espacement vertical des questions de {label}"
        >
          <button
            type="button"
            aria-label="Réduire l'espacement des questions"
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
          class="typst-pill typst-pill-round flex h-6 w-6 -translate-x-1/2 items-center justify-center"
          class:typst-pill-force-visible={headerOpen}
          data-testid="typst-overlay-header"
          on:click={toggleHeader}
        >
          <i class="bx bx-edit"></i>
        </button>
        {#if headerOpen}
          <div
            class="absolute left-4 top-0 z-20 w-80 space-y-2 typst-panel p-2"
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
      <!-- insertion avant cet exercice : repère de gap qui précède -->
      {@const insertGapNum = widget.num - 1}
      {@const insertGapInsertions = insertions[insertGapNum] ?? []}
      {@const insertHasText = insertGapInsertions.some(
        (snippet) =>
          snippet !== PAGE_BREAK_SNIPPET && snippet !== COLUMN_BREAK_SNIPPET,
      )}
      <!-- exercice fusionné avec le précédent : le repère de gap qui le
           précède est interne au groupe, l'insertion n'y a pas de sens -->
      {@const showInsert = !mergedExercises.includes(widget.num)}
      <!-- bord droit de la colonne qui contient l'exercice (et non celui de
           la page) : en document multicolonne, la barre doit rester dans la
           même colonne que le titre qu'elle contrôle, sous peine de se
           retrouver au-dessus d'un autre exercice -->
      {@const columnWidth = 100 / Math.max(documentColumns, 1)}
      {@const columnRight =
        (Math.floor(widget.left / columnWidth) + 1) * columnWidth}
      <!-- contrôles de l'exercice : insertion avant l'exercice, déplacement,
           réglages, nouvelles données, nombre de questions, suppression -->
      <div
        class="pointer-events-auto absolute flex -translate-x-full -translate-y-1/2 items-center gap-0.5 typst-pill typst-pill-round px-1"
        class:typst-pill-force-visible={openInsertion === insertGapNum ||
          openWritingLines === widget.num}
        class:z-20={openInsertion === insertGapNum ||
          openWritingLines === widget.num}
        style="top: {widget.top}%; left: {columnRight - 0.3}%;"
        data-testid="typst-overlay-exo"
      >
        <button
          type="button"
          title="Monter l'exercice"
          aria-label="Monter l'exercice {widget.num}"
          disabled={widget.num <= 1}
          on:click={() => onMoveExercise(widget.num, -1)}
        >
          <i class="bx bx-up-arrow-alt"></i>
        </button>
        <button
          type="button"
          title="Descendre l'exercice"
          aria-label="Descendre l'exercice {widget.num}"
          disabled={widget.num >= exerciseCount}
          on:click={() => onMoveExercise(widget.num, 1)}
        >
          <i class="bx bx-down-arrow-alt"></i>
        </button>
        {#if showInsert}
          <button
            type="button"
            title="Insérer ou modifier un texte ou un titre de section avant l'exercice"
            aria-label="Insérer ou modifier un texte ou un titre de section avant l'exercice {widget.num}"
            aria-expanded={openInsertion === insertGapNum}
            data-testid="typst-overlay-insert"
            on:click={() => toggleInsertion(insertGapNum)}
          >
            <i class="bx bx-plus-circle"></i>
          </button>
          <span class="typst-pill-sep"></span>
        {/if}
        {#if !staticExercises[widget.num]}
          <button
            type="button"
            title="Réglages de l'exercice {widget.num}"
            aria-label="Réglages de l'exercice {widget.num}"
            on:click={() => onOpenSettings(widget.num)}
          >
            <i class="bx bx-cog"></i>
          </button>
        {/if}
        <button
          type="button"
          title={codeOverrides[widget.num] != null
            ? 'Modifier le code Typst de cet exercice'
            : 'Éditer le code Typst de cet exercice'}
          aria-label="Éditer le code Typst de l'exercice {widget.num}"
          class:typst-pill-active={codeOverrides[widget.num] != null}
          data-testid="typst-overlay-edit-code"
          on:click={() => onEditCode(widget.num)}
        >
          <i class="bx bx-pencil"></i>
        </button>
        <button
          type="button"
          title={writingLinesValues[widget.num] != null
            ? 'Modifier les lignes pour écrire de cet exercice'
            : 'Ajouter des lignes pour écrire à cet exercice'}
          aria-label="Lignes pour écrire, exercice {widget.num}"
          aria-expanded={openWritingLines === widget.num}
          class:typst-pill-active={writingLinesValues[widget.num] != null}
          data-testid="typst-overlay-writing-lines"
          on:click={() => toggleWritingLines(widget.num)}
        >
          <i class="bx bx-detail"></i>
        </button>
        {@render writingLinesPanel(widget.num)}
        {#if !staticExercises[widget.num]}
          <button
            type="button"
            title="Nouvelles données pour l'exercice {widget.num}"
            aria-label="Nouvelles données pour l'exercice {widget.num}"
            on:click={() => onNewData(widget.num)}
          >
            <i class="bx bx-refresh"></i>
          </button>
        {/if}
        {#if questionCounts[widget.num] != null}
          <span class="typst-pill-sep"></span>
          <button
            type="button"
            title="Une question de moins"
            aria-label="Une question de moins dans l'exercice {widget.num}"
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
            on:click={() => onChangeQuestionCount(widget.num, 1)}
          >
            <i class="bx bx-plus"></i>
          </button>
        {/if}
        <span class="typst-pill-sep"></span>
        <button
          type="button"
          title="Supprimer l'exercice {widget.num} de la fiche"
          aria-label="Supprimer l'exercice {widget.num} de la fiche"
          class="typst-danger"
          on:click={() => onDeleteExercise(widget.num)}
        >
          <i class="bx bx-trash"></i>
        </button>
        {@render insertionPanel(insertGapNum, 'right-0')}
      </div>
    {:else if widget.kind === 'figure'}
      <!-- zoom et alignement d'une figure mathalea2d embarquée : le repère
           est déjà placé au coin haut-droit de son rendu final (zoom et
           alignement compris, voir mathalea-figure-block) ; on ne décale la
           pastille que vers le haut pour qu'elle ne recouvre pas l'image -->
      {@const zoom = figureZoomValues[widget.num] ?? 1}
      {@const figAlign = figureAlignValues[widget.num] ?? 'left'}
      <div
        class="pointer-events-auto absolute flex -translate-x-full -translate-y-full items-center gap-0.5 typst-pill typst-pill-round px-1"
        style="left: {widget.left}%; top: {widget.top}%;"
        data-testid="typst-overlay-figure"
      >
        <button
          type="button"
          title="Réduire la figure"
          aria-label="Réduire la figure"
          on:click={() => onAdjustFigureZoom(widget.num, -1)}
        >
          <i class="bx bx-zoom-out"></i>
        </button>
        <span class="tabular-nums px-0.5 text-[0.6rem]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          title="Agrandir la figure"
          aria-label="Agrandir la figure"
          on:click={() => onAdjustFigureZoom(widget.num, 1)}
        >
          <i class="bx bx-zoom-in"></i>
        </button>
        <span class="typst-pill-sep"></span>
        {#each [{ align: 'left', icon: 'bx-align-left', label: 'Aligner à gauche' }, { align: 'center', icon: 'bx-align-middle', label: 'Centrer' }, { align: 'right', icon: 'bx-align-right', label: 'Aligner à droite' }] as choice}
          <button
            type="button"
            title={choice.label}
            aria-label={choice.label}
            aria-pressed={figAlign === choice.align}
            class:typst-pill-active={figAlign === choice.align}
            on:click={() =>
              onSetFigureAlign(
                widget.num,
                choice.align as 'left' | 'center' | 'right',
              )}
          >
            <i class="bx {choice.icon}"></i>
          </button>
        {/each}
      </div>
    {:else}
      {@const gapInsertions = insertions[widget.num] ?? []}
      {@const hasPageBreak = gapInsertions.includes(PAGE_BREAK_SNIPPET)}
      {@const hasColumnBreak = gapInsertions.includes(COLUMN_BREAK_SNIPPET)}
      {@const hasText = gapInsertions.some(
        (snippet) =>
          snippet !== PAGE_BREAK_SNIPPET && snippet !== COLUMN_BREAK_SNIPPET,
      )}
      <!-- l'exercice qui suit ce repère est fusionné avec celui qui le
           précède : le repère est interne au groupe (un saut de page y est
           impossible à compiler, un saut de colonne ou une insertion n'y
           auraient pas de sens) — seul le bouton de séparation reste -->
      {@const isMergeGap = mergedExercises.includes(widget.num + 1)}
      {@const canMerge =
        !isMergeGap &&
        mergeExercisesEnabled &&
        widget.num >= 1 &&
        widget.num < exerciseCount}
      <!-- ce repère précède un exercice : son bouton d'insertion vit dans la
           barre de cet exercice (kind 'exo'), juste avant les réglages ;
           seul le dernier repère (après le dernier exercice) garde le sien
           ici, faute de barre d'exercice suivante où le placer. -->
      {@const hasFollowingExo = widget.num < exerciseCount}
      <!-- un saut actif éloigne l'exercice suivant (page ou colonne d'après) :
           le repère reste au bas de l'exercice courant, donc la barre doit y
           rester aussi plutôt que remonter vers un titre qui n'est plus juste
           en dessous -->
      {@const hasBreak = hasPageBreak || hasColumnBreak}
      <!-- entre deux exercices (et avant le premier) : insertion/modification
           d'un texte ou d'un titre de section, et sauts de page/colonne. Le
           repère est au bord gauche de la page (déjà proche du bord) : on ne
           le décale que légèrement vers la gauche, et nettement vers le haut,
           pour ne pas recouvrir le titre de l'exercice qui suit — sauf
           lorsqu'un saut est actif, où le repère reste sous l'exercice. -->
      <div
        class="pointer-events-auto absolute flex -translate-x-2 {hasBreak
          ? 'translate-y-2'
          : '-translate-y-[135%]'} items-center gap-0.5 typst-pill typst-pill-round px-1"
        class:typst-pill-force-visible={openInsertion === widget.num}
        class:z-20={openInsertion === widget.num}
        style="left: {widget.left}%; top: {widget.top}%;"
      >
        {#if !isMergeGap}
          {#if !hasFollowingExo}
            <button
              type="button"
              title="Insérer ou modifier un texte ou un titre de section ici"
              aria-label="Insérer ou modifier un texte ou un titre de section ici"
              aria-expanded={openInsertion === widget.num}
              data-testid="typst-overlay-insert"
              on:click={() => toggleInsertion(widget.num)}
            >
              <i class="bx bx-plus-circle"></i>
            </button>
            <span class="typst-pill-sep"></span>
          {/if}
          <button
            type="button"
            title={hasPageBreak
              ? 'Retirer le saut de page'
              : 'Insérer un saut de page ici'}
            aria-label={hasPageBreak
              ? 'Retirer le saut de page'
              : 'Insérer un saut de page ici'}
            class:typst-pill-active={hasPageBreak}
            data-testid={hasPageBreak
              ? 'typst-overlay-pagebreak-active'
              : 'typst-overlay-pagebreak'}
            on:click={() => toggleBreak(widget.num, PAGE_BREAK_SNIPPET)}
          >
            <i class="bx bx-arrow-to-bottom"></i>
          </button>
          <!-- saut de colonne : seulement en document multicolonne (le bouton
               actif reste visible en 1 colonne pour pouvoir le retirer) -->
          {#if hasColumnBreak || documentColumns > 1}
            <button
              type="button"
              title={hasColumnBreak
                ? 'Retirer le saut de colonne'
                : 'Insérer un saut de colonne ici'}
              aria-label={hasColumnBreak
                ? 'Retirer le saut de colonne'
                : 'Insérer un saut de colonne ici'}
              class:typst-pill-active={hasColumnBreak}
              data-testid={hasColumnBreak
                ? 'typst-overlay-colbreak-active'
                : 'typst-overlay-colbreak'}
              on:click={() => toggleBreak(widget.num, COLUMN_BREAK_SNIPPET)}
            >
              <i class="bx bx-arrow-to-right"></i>
            </button>
          {/if}
        {/if}
        {#if isMergeGap}
          <button
            type="button"
            title="Séparer de l'exercice précédent"
            aria-label="Séparer de l'exercice précédent"
            class="typst-pill-active"
            data-testid="typst-overlay-unmerge"
            on:click={() => onToggleMergeBefore(widget.num + 1)}
          >
            <i class="bx bx-unlink"></i>
          </button>
        {:else if canMerge}
          <span class="typst-pill-sep"></span>
          <button
            type="button"
            title={hasPageBreak || hasColumnBreak || hasText
              ? "Retirez d'abord le saut ou l'insertion pour fusionner"
              : "Fusionner avec l'exercice précédent"}
            aria-label="Fusionner avec l'exercice précédent"
            disabled={hasPageBreak || hasColumnBreak || hasText}
            data-testid="typst-overlay-merge"
            on:click={() => onToggleMergeBefore(widget.num + 1)}
          >
            <i class="bx bx-link"></i>
          </button>
        {/if}
        {#if !hasFollowingExo}
          {@render insertionPanel(widget.num, 'left-1/2 -translate-x-1/2')}
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  /* Toolbars de la palette de mise en page : même style que la vue A4
     (fond blanc plein, bordure bleu clair, ombre nette) pour une bonne
     visibilité par-dessus le document. */
  .typst-pill {
    background: white;
    border: 1px solid #b9d4f1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    opacity: 0.5;
    transition: opacity 0.15s ease;
  }
  .typst-pill:hover,
  .typst-pill:focus-within,
  .typst-pill-force-visible {
    opacity: 1;
  }
  .typst-pill-round {
    border-radius: 999px;
  }
  .typst-pill-box {
    border-radius: 6px;
  }
  /* Sélecteur d'enfant direct : ne doit viser que les boutons de la barre
     d'outils, pas ceux du panneau d'insertion (.typst-panel) qu'elle peut
     contenir, qui ont leurs propres couleurs. */
  .typst-pill > :global(button) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 3px;
    border-radius: 4px;
    font-size: 15px;
    color: #145a9d;
  }
  .typst-pill > :global(button:hover) {
    background: #e3eefa;
  }
  .typst-pill > :global(button:disabled) {
    color: #b0b0b0;
    cursor: default;
  }
  .typst-pill > :global(button:disabled:hover) {
    background: transparent;
  }
  .typst-pill-sep {
    width: 1px;
    height: 12px;
    background: #b9d4f1;
    flex-shrink: 0;
  }
  .typst-pill-divider-top {
    border-top: 1px solid #d7e6f7;
  }
  .typst-pill-active {
    background: #145a9d;
    color: white !important;
  }
  .typst-pill-active:hover {
    background: #1d76cc !important;
  }
  .typst-danger:hover {
    background: #fbe2e2 !important;
    color: #c0392b !important;
  }
  .typst-panel {
    background: white;
    border: 1px solid #b9d4f1;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
</style>
