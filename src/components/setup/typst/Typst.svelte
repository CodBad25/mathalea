<script lang="ts">
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
  import { search, searchKeymap } from '@codemirror/search'
  import { EditorState } from '@codemirror/state'
  import { oneDark } from '@codemirror/theme-one-dark'
  import { EditorView, keymap } from '@codemirror/view'
  import seedrandom from 'seedrandom'
  import { onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { buildExercisesList } from '../../../lib/components/exercisesUtils'
  import {
    mathaleaFormatExercice,
    mathaleaHandleExerciceSimple,
  } from '../../../lib/mathalea'
  import { darkMode, exercicesParams } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import { isLocalStorageAvailable } from '../../../lib/stores/storage'
  import type { IExercice } from '../../../lib/types'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import {
    BADGE_STYLES,
    HEADER_STYLES,
    buildTypstDocument,
    defaultTypstDocumentOptions,
    type TypstDocumentOptions,
    type TypstExerciseInput,
  } from './buildTypstDocument'

  /** Libellés des habillages d'en-tête/pied de page */
  const HEADER_STYLE_LABELS: Record<(typeof HEADER_STYLES)[number], string> = {
    epure: 'Épuré',
    cartouche: 'Cartouche',
    cadre: 'Cadre',
  }

  /** Libellés des styles de badge du paquet exercise-bank */
  const BADGE_STYLE_LABELS: Record<(typeof BADGE_STYLES)[number], string> = {
    'border-accent': 'Barre latérale',
    box: 'Encadré (marge)',
    'rounded-box': 'Encadré arrondi',
    'header-card': 'Bandeau',
    underline: 'Souligné',
    pill: 'Pastille (marge)',
    tag: 'Étiquette (marge)',
    circled: 'Numéro cerclé (marge)',
    'filled-circle': 'Numéro plein (marge)',
    margin: 'Titre en marge',
  }

  /** Palette de couleurs proposées pour les badges (expression Typst) */
  const BADGE_COLORS: { label: string; value: string; css: string }[] = [
    { label: 'Noir', value: 'black', css: '#000000' },
    { label: 'Orange', value: 'rgb("#f15929")', css: '#f15929' },
    { label: 'Bleu', value: 'rgb("#1d4ed8")', css: '#1d4ed8' },
    { label: 'Vert', value: 'rgb("#4a7c59")', css: '#4a7c59' },
    { label: 'Rouge', value: 'rgb("#dc2626")', css: '#dc2626' },
    { label: 'Violet', value: 'rgb("#7c3aed")', css: '#7c3aed' },
  ]

  /** Couleur des badges au format `#rrggbb` pour le sélecteur natif */
  $: badgeColorHex = (() => {
    const value = documentOptions.badgeColor
    const hex = value.match(/#([0-9a-fA-F]{6})/)
    if (hex != null) return `#${hex[1]}`
    if (value === 'black') return '#000000'
    return '#000000'
  })()
  /** La couleur active ne fait pas partie des pastilles prédéfinies */
  $: isCustomBadgeColor = !BADGE_COLORS.some(
    (color) => color.value === documentOptions.badgeColor,
  )

  type DisplayMode = 'code' | 'split' | 'preview'
  const STORAGE_KEY = 'mathaleaTypstView'

  let displayMode: DisplayMode = 'split'
  let documentOptions: TypstDocumentOptions = { ...defaultTypstDocumentOptions }
  let isSettingsOpen = false
  if (isLocalStorageAvailable()) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const parsed = JSON.parse(saved)
        if (['code', 'split', 'preview'].includes(parsed.displayMode)) {
          displayMode = parsed.displayMode
        }
        if (parsed.documentOptions != null) {
          documentOptions = {
            ...defaultTypstDocumentOptions,
            ...parsed.documentOptions,
          }
        }
      }
    } catch {
      // préférences illisibles : on garde les valeurs par défaut
    }
  }

  let exercises: (IExercice | null)[] = []
  let isLoading = true
  /** Le code a été modifié à la main depuis sa génération */
  let isEdited = false
  let isCompiling = false
  let isCompilerLoading = false
  let isGeneratingPdf = false
  let diagnostics: string[] = []
  let svgContent = ''
  let copied = false

  let editorEl: HTMLDivElement
  let editorView: EditorView | null = null

  function persistPreferences() {
    if (!isLocalStorageAvailable()) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ displayMode, documentOptions }),
      )
    } catch {
      // stockage plein ou indisponible : sans conséquence
    }
  }

  function setDisplayMode(mode: DisplayMode) {
    displayMode = mode
    persistPreferences()
  }

  /** Regénère le code à partir des réglages du document (interligne...) */
  function applyDocumentOptions() {
    persistPreferences()
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  function resetDocumentOptions() {
    documentOptions = { ...defaultTypstDocumentOptions }
    applyDocumentOptions()
  }

  /** Regénère le contenu (listeQuestions, listeCorrections...) de l'exercice k */
  function regenerate(k: number) {
    const exercise = exercises[k]
    if (exercise == null) return
    exercise.numeroExercice = k
    if (
      exercise.seed === undefined &&
      typeof exercise.applyNewSeed === 'function'
    ) {
      exercise.applyNewSeed()
    }
    seedrandom(exercise.seed, { global: true })
    if (exercise.typeExercice === 'statique') {
      // Contenu figé (images/texte fixes) : rien à régénérer.
      return
    }
    if (exercise.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(exercise, false, k)
    } else if (typeof exercise.nouvelleVersionWrapper === 'function') {
      exercise.nouvelleVersionWrapper(k)
    }
  }

  /** Contenu HTML (avec formules `$...$`) de chaque exercice */
  function buildInputs(): TypstExerciseInput[] {
    const params = get(exercicesParams)
    return exercises.map((exercise, k) => {
      const input: TypstExerciseInput = {
        ref: params[k]?.id ?? '',
        intro: '',
        questions: [],
        introCorrection: '',
        corrections: [],
        numbered: false,
      }
      if (exercise == null) {
        input.warning =
          "Cet exercice n'a pas pu être chargé : il n'est pas pris en charge par la vue Typst."
        return input
      }
      if (
        exercise.typeExercice != null &&
        exercise.typeExercice.includes('html')
      ) {
        input.warning = `${exercise.titre} : cet exercice n'existe qu'en version interactive, il ne peut pas être exporté.`
        return input
      }
      regenerate(k)
      input.intro = mathaleaFormatExercice(
        [exercise.consigne, exercise.introduction]
          .filter((text) => text != null && text.length > 0)
          .join('<br>'),
      )
      const format = (text: string) =>
        mathaleaFormatExercice(text).replaceAll('{zoomFactor}', '1')
      input.questions = (exercise.listeQuestions ?? []).map(format)
      input.corrections = (exercise.listeCorrections ?? []).map(format)
      input.introCorrection = mathaleaFormatExercice(
        exercise.consigneCorrection ?? '',
      )
      input.numbered =
        input.questions.length > 1 && exercise.listeAvecNumerotation !== false
      return input
    })
  }

  function buildCode(): string {
    return buildTypstDocument(buildInputs(), documentOptions)
  }

  function initEditor(content: string) {
    editorView?.destroy()
    editorView = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          history(),
          oneDark,
          search({ top: true }),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              isEdited = true
              scheduleCompile(update.state.doc.toString())
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
          EditorView.lineWrapping,
        ],
      }),
      parent: editorEl,
    })
  }

  function setEditorContent(content: string) {
    if (editorView == null) return
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    })
    isEdited = false
  }

  function currentCode(): string {
    return editorView?.state.doc.toString() ?? ''
  }

  /**
   * Compilation en direct : débouncée pendant la frappe et sérialisée
   * (une seule compilation à la fois, la dernière demande gagne).
   */
  let compileTimer: ReturnType<typeof setTimeout>
  let compileToken = 0
  function scheduleCompile(code: string, delay = 500) {
    clearTimeout(compileTimer)
    compileTimer = setTimeout(() => compile(code), delay)
  }

  /** Espace entre deux pages de l'aperçu, en unités SVG (pt) */
  const PAGE_GAP = 16

  /**
   * Le SVG de typst.ts empile les pages sans séparation : on insère un
   * fond blanc bordé derrière chaque page (`g.typst-page`) et un espace
   * entre les pages, sur le fond gris du panneau d'aperçu.
   */
  function separatePages(svg: string): string {
    try {
      // parseur HTML (pas XML) : le SVG de typst.ts embarque un <script>
      // et des styles qui ne sont pas du XML strict
      const doc = new DOMParser().parseFromString(svg, 'text/html')
      const root = doc.querySelector('svg')
      if (root == null) return svg
      const pages = [...root.querySelectorAll('g.typst-page')]
      if (pages.length === 0) return svg
      const viewBox = (root.getAttribute('viewBox') ?? '')
        .trim()
        .split(/\s+/)
        .map(Number)
      if (viewBox.length !== 4 || viewBox.some(Number.isNaN)) return svg
      let cumulatedY = 0
      for (const [i, page] of pages.entries()) {
        const width = parseFloat(page.getAttribute('data-page-width') ?? '0')
        const height = parseFloat(page.getAttribute('data-page-height') ?? '0')
        // la position verticale de la page est celle de son transform
        // (les pages sont empilées) ; à défaut, la somme des hauteurs
        const translate = (page.getAttribute('transform') ?? '').match(
          /translate\(\s*[\d.e+-]+[ ,]+([\d.e+-]+)\s*\)/i,
        )
        const pageY = translate != null ? parseFloat(translate[1]) : cumulatedY
        cumulatedY += height
        const wrapper = doc.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        )
        wrapper.setAttribute('transform', `translate(0, ${i * PAGE_GAP})`)
        const sheet = doc.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect',
        )
        sheet.setAttribute('x', '0')
        sheet.setAttribute('y', String(pageY))
        sheet.setAttribute('width', String(width))
        sheet.setAttribute('height', String(height))
        sheet.setAttribute('fill', '#ffffff')
        sheet.setAttribute('stroke', '#c8c8c8')
        sheet.setAttribute('stroke-width', '1')
        page.replaceWith(wrapper)
        wrapper.appendChild(sheet)
        wrapper.appendChild(page)
      }
      const totalGap = (pages.length - 1) * PAGE_GAP
      viewBox[3] += totalGap
      root.setAttribute('viewBox', viewBox.join(' '))
      const heightAttr = parseFloat(root.getAttribute('height') ?? '')
      if (!Number.isNaN(heightAttr)) {
        root.setAttribute('height', String(heightAttr + totalGap))
      }
      return root.outerHTML
    } catch {
      // aperçu dégradé (pages non séparées) plutôt que pas d'aperçu
      return svg
    }
  }

  async function compile(code: string) {
    const token = ++compileToken
    isCompiling = true
    if (svgContent === '') isCompilerLoading = true
    try {
      const { compileTypstToSvg } = await import('./typstCompiler')
      const result = await compileTypstToSvg(code)
      if (token !== compileToken) return
      diagnostics = result.diagnostics
      if (result.svg != null) svgContent = separatePages(result.svg)
    } catch (error) {
      if (token !== compileToken) return
      console.error('Erreur lors de la compilation Typst', error)
      diagnostics = [
        'La compilation a échoué : ' +
          (error instanceof Error ? error.message : String(error)),
      ]
    } finally {
      if (token === compileToken) {
        isCompiling = false
        isCompilerLoading = false
      }
    }
  }

  async function loadExercises() {
    isLoading = true
    const results = await Promise.allSettled(buildExercisesList())
    exercises = results.map((result) =>
      result.status === 'fulfilled' ? result.value : null,
    )
    for (const exercise of exercises) {
      if (exercise != null) exercise.interactif = false
    }
    isLoading = false
  }

  onMount(async () => {
    await loadExercises()
    const code = buildCode()
    initEditor(code)
    compile(code)
  })

  onDestroy(() => {
    clearTimeout(compileTimer)
    editorView?.destroy()
    editorView = null
    for (const exercise of exercises) {
      if (exercise == null) continue
      exercise.reinit?.()
      exercise.destroy?.()
    }
  })

  /** Le professeur perd ses modifications manuelles : on le prévient */
  function confirmOverwrite(): boolean {
    if (!isEdited) return true
    return window.confirm(
      'Le code Typst a été modifié : le regénérer écrasera vos modifications. Continuer ?',
    )
  }

  /** Nouvelles données aléatoires pour tous les exercices */
  function newDataForAll() {
    if (!confirmOverwrite()) return
    const params = get(exercicesParams)
    for (const [k, exercise] of exercises.entries()) {
      if (exercise == null) continue
      exercise.seed = undefined
      if (typeof exercise.applyNewSeed === 'function') exercise.applyNewSeed()
      if (params[k] != null && exercise.seed !== undefined) {
        params[k].alea = exercise.seed
      }
    }
    exercicesParams.update((list) => list)
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  function exportFilename() {
    return (
      documentOptions.title
        .trim()
        .replace(/[^\p{L}\p{N} _-]/gu, '')
        .replace(/\s+/g, '_') || 'fiche'
    )
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPdf() {
    if (isGeneratingPdf) return
    isGeneratingPdf = true
    try {
      const { compileTypstToPdf } = await import('./typstCompiler')
      const pdf = await compileTypstToPdf(currentCode())
      if (pdf == null) {
        window.alert(
          'La compilation du PDF a échoué : corrigez les erreurs signalées sous l’aperçu.',
        )
        return
      }
      downloadBlob(
        new Blob([pdf as BlobPart], { type: 'application/pdf' }),
        `${exportFilename()}.pdf`,
      )
    } catch (error) {
      console.error("Erreur lors de l'export PDF", error)
    } finally {
      isGeneratingPdf = false
    }
  }

  function downloadTyp() {
    downloadBlob(
      new Blob([currentCode()], { type: 'text/plain;charset=utf-8' }),
      `${exportFilename()}.typ`,
    )
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(currentCode())
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch (error) {
      console.error('Copie impossible', error)
    }
  }
</script>

<svelte:head>
  <title>MathALÉA - Typst</title>
</svelte:head>

<main
  class="typst-view {$darkMode.isActive
    ? 'dark'
    : ''} flex flex-col h-screen bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest"
>
  <div class="bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
    <NavBar
      subtitle="Typst"
      subtitleType="export"
      handleLanguage={() => {}}
      locale={$referentielLocale}
    />
    <div
      class="flex flex-row flex-wrap items-center gap-x-6 gap-y-3 px-4 md:px-8 py-3 border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <div
        class="flex flex-row rounded-lg overflow-hidden border border-coopmaths-action dark:border-coopmathsdark-action"
        role="group"
        aria-label="Mode d'affichage"
      >
        {#each [{ mode: 'code', icon: 'bx-code-alt', label: 'Code' }, { mode: 'split', icon: 'bx-columns', label: 'Côte à côte' }, { mode: 'preview', icon: 'bx-file-pdf', label: 'Aperçu' }] as choice}
          <button
            type="button"
            class="flex items-center gap-1 px-3 py-1 text-sm {displayMode ===
            choice.mode
              ? 'bg-coopmaths-action text-coopmaths-canvas dark:bg-coopmathsdark-action dark:text-coopmathsdark-canvas'
              : 'text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
            aria-pressed={displayMode === choice.mode}
            on:click={() => setDisplayMode(choice.mode as DisplayMode)}
          >
            <i class="bx {choice.icon} text-lg"></i>
            {choice.label}
          </button>
        {/each}
      </div>

      <button
        type="button"
        title="Réglages du document"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={() => (isSettingsOpen = true)}
      >
        <i class="bx bx-cog text-xl"></i>
        Réglages
      </button>

      <button
        type="button"
        title="Nouvelles données aléatoires pour tous les exercices"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={newDataForAll}
      >
        <i class="bx bx-refresh text-xl"></i>
        Nouvelles données
      </button>

      <div class="grow"></div>

      <button
        type="button"
        title="Copier le code Typst"
        aria-label="Copier le code Typst"
        class="flex items-center text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={copyCode}
      >
        <i class="bx {copied ? 'bx-check' : 'bx-copy'} text-2xl"></i>
      </button>
      <ButtonTextAction
        text="Télécharger le .typ"
        icon="bx-file-blank"
        inverted={true}
        class="rounded-lg py-1 px-2"
        on:click={downloadTyp}
      />
      <ButtonTextAction
        text={isGeneratingPdf ? 'PDF en cours...' : 'Télécharger le PDF'}
        icon={isGeneratingPdf ? 'bx-loader-alt bx-spin' : 'bx-download'}
        inverted={true}
        class="rounded-lg py-1 px-2 min-w-42.5"
        on:click={downloadPdf}
      />
    </div>
  </div>

  {#if isLoading}
    <div
      class="flex w-full justify-center items-center py-24 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <i class="bx bx-loader-alt bx-spin text-4xl"></i>
    </div>
  {:else}
    <div class="flex flex-row grow min-h-0">
      <div
        class="typst-editor-pane {displayMode === 'code'
          ? 'w-full'
          : displayMode === 'split'
            ? 'w-1/2'
            : 'hidden'} min-h-0"
        bind:this={editorEl}
      ></div>
      <div
        class="typst-preview-pane {displayMode === 'preview'
          ? 'w-full'
          : displayMode === 'split'
            ? 'w-1/2'
            : 'hidden'} min-h-0 flex flex-col"
      >
        <div class="relative grow overflow-auto p-4">
          {#if isCompilerLoading}
            <div
              class="flex flex-col items-center gap-2 py-24 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
            >
              <i class="bx bx-loader-alt bx-spin text-4xl"></i>
              <span class="text-sm"
                >Chargement du compilateur Typst (première visite)...</span
              >
            </div>
          {:else if svgContent !== ''}
            {#if isCompiling}
              <div
                class="absolute top-2 right-4 z-10 text-coopmaths-action dark:text-coopmathsdark-action"
              >
                <i class="bx bx-loader-alt bx-spin text-2xl"></i>
              </div>
            {/if}
            <!-- le fond blanc des pages est dessiné dans le SVG (separatePages) -->
            <div class="typst-svg-container mx-auto">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html svgContent}
            </div>
          {/if}
        </div>
        {#if diagnostics.length > 0}
          <div
            data-testid="typst-diagnostics"
            class="max-h-40 overflow-auto shrink-0 px-4 py-2 text-sm font-mono bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200 border-t border-red-300 dark:border-red-800"
          >
            {#each diagnostics as diagnostic}
              <div>{diagnostic}</div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if isSettingsOpen}
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      on:click|self={() => (isSettingsOpen = false)}
    >
      <div
        class="relative w-full max-w-md rounded-lg shadow-xl bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus p-5 space-y-4"
      >
        <button
          type="button"
          class="absolute top-3 right-3"
          aria-label="Fermer"
          on:click={() => (isSettingsOpen = false)}
        >
          <i
            class="bx bx-x text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
          ></i>
        </button>
        <h3
          class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
        >
          Réglages du document
        </h3>

        <label class="flex items-center justify-between gap-4 text-sm">
          Format
          <select
            class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.pageFormat}
            on:change={applyDocumentOptions}
          >
            <option value="a4">A4</option>
            <option value="a5">A5</option>
          </select>
        </label>

        <label class="flex items-center justify-between gap-4 text-sm">
          Orientation
          <select
            class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.orientation}
            on:change={applyDocumentOptions}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Paysage</option>
          </select>
        </label>

        <div class="flex items-center justify-between gap-4 text-sm">
          <label for="typst-columns-input">Nombre de colonnes</label>
          <input
            id="typst-columns-input"
            type="number"
            min="1"
            max="3"
            step="1"
            class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.columns}
            on:change={applyDocumentOptions}
          />
        </div>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            bind:checked={documentOptions.mergeExercises}
            on:change={applyDocumentOptions}
          />
          Fusionner tous les exercices (questions numérotées à la suite)
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            bind:checked={documentOptions.showExerciseRefs}
            disabled={documentOptions.mergeExercises}
            on:change={applyDocumentOptions}
          />
          <span class:opacity-50={documentOptions.mergeExercises}>
            Afficher la référence des exercices
          </span>
        </label>

        <label class="flex items-center justify-between gap-4 text-sm">
          Habillage en-tête
          <select
            class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.headerStyle}
            on:change={applyDocumentOptions}
          >
            {#each HEADER_STYLES as style}
              <option value={style}>{HEADER_STYLE_LABELS[style]}</option>
            {/each}
          </select>
        </label>

        <label class="flex items-center justify-between gap-4 text-sm">
          Titre
          <input
            type="text"
            class="w-40 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.title}
            on:change={applyDocumentOptions}
          />
        </label>

        <label class="flex items-center justify-between gap-4 text-sm">
          Sous-titre (niveau, classe…)
          <input
            type="text"
            class="w-40 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.subtitle}
            on:change={applyDocumentOptions}
          />
        </label>

        <label class="flex items-center justify-between gap-4 text-sm">
          Ligne d'en-tête
          <input
            type="text"
            class="w-40 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.headerLine}
            on:change={applyDocumentOptions}
          />
        </label>

        <div class="flex items-center justify-between gap-4 text-sm">
          <label for="typst-line-spacing-input">Interligne</label>
          <input
            id="typst-line-spacing-input"
            type="number"
            min="0.3"
            max="2"
            step="0.05"
            class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.lineSpacing}
            on:change={applyDocumentOptions}
          />
        </div>

        <div class="flex items-center justify-between gap-4 text-sm">
          <label for="typst-exercise-spacing-input"
            >Espacement entre les exercices</label
          >
          <input
            id="typst-exercise-spacing-input"
            type="number"
            min="0"
            max="6"
            step="0.1"
            class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.exerciseSpacing}
            on:change={applyDocumentOptions}
          />
        </div>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            bind:checked={documentOptions.boldQuestionNumbers}
            on:change={applyDocumentOptions}
          />
          Numéros des questions en gras
        </label>

        <label
          class="flex items-center justify-between gap-4 text-sm"
          class:opacity-50={documentOptions.mergeExercises}
        >
          Style des exercices
          <select
            class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={documentOptions.badgeStyle}
            disabled={documentOptions.mergeExercises}
            on:change={applyDocumentOptions}
          >
            {#each BADGE_STYLES as style}
              <option value={style}>{BADGE_STYLE_LABELS[style]}</option>
            {/each}
          </select>
        </label>

        <div
          class="flex items-center justify-between gap-4 text-sm"
          class:opacity-50={documentOptions.mergeExercises}
        >
          <span>Couleur des titres</span>
          <div class="flex items-center gap-1.5">
            {#each BADGE_COLORS as color}
              <button
                type="button"
                title={color.label}
                aria-label={color.label}
                aria-pressed={documentOptions.badgeColor === color.value}
                disabled={documentOptions.mergeExercises}
                class="h-6 w-6 rounded-full border-2 transition {documentOptions.badgeColor ===
                color.value
                  ? 'border-coopmaths-action dark:border-coopmathsdark-action scale-110'
                  : 'border-transparent'}"
                style="background-color: {color.css};"
                on:click={() => {
                  documentOptions.badgeColor = color.value
                  applyDocumentOptions()
                }}
              ></button>
            {/each}
            <input
              type="color"
              title="Couleur personnalisée"
              aria-label="Couleur personnalisée"
              disabled={documentOptions.mergeExercises}
              class="h-6 w-6 cursor-pointer rounded-full border-2 {isCustomBadgeColor
                ? 'border-coopmaths-action dark:border-coopmathsdark-action scale-110'
                : 'border-transparent'} bg-transparent p-0"
              value={badgeColorHex}
              on:input={(e) => {
                documentOptions.badgeColor = `rgb("${e.currentTarget.value}")`
                applyDocumentOptions()
              }}
            />
          </div>
        </div>

        <p class="text-xs opacity-75">
          Ces réglages régénèrent le code Typst à partir des exercices : vos
          modifications manuelles du code seront perdues.
        </p>

        <button
          type="button"
          class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
          on:click={resetDocumentOptions}
        >
          <i class="bx bx-reset"></i>
          Réinitialiser les réglages du document
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
  .typst-svg-container {
    max-width: 900px;
  }
  .typst-svg-container :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
