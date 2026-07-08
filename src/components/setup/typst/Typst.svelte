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
    buildTypstDocument,
    defaultTypstDocumentOptions,
    type TypstExerciseInput,
  } from './buildTypstDocument'

  type DisplayMode = 'code' | 'split' | 'preview'
  const STORAGE_KEY = 'mathaleaTypstView'

  let displayMode: DisplayMode = 'split'
  if (isLocalStorageAvailable()) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const parsed = JSON.parse(saved)
        if (['code', 'split', 'preview'].includes(parsed.displayMode)) {
          displayMode = parsed.displayMode
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ displayMode }))
    } catch {
      // stockage plein ou indisponible : sans conséquence
    }
  }

  function setDisplayMode(mode: DisplayMode) {
    displayMode = mode
    persistPreferences()
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
    return buildTypstDocument(buildInputs(), defaultTypstDocumentOptions)
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

  async function compile(code: string) {
    const token = ++compileToken
    isCompiling = true
    if (svgContent === '') isCompilerLoading = true
    try {
      const { compileTypstToSvg } = await import('./typstCompiler')
      const result = await compileTypstToSvg(code)
      if (token !== compileToken) return
      diagnostics = result.diagnostics
      if (result.svg != null) svgContent = result.svg
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

  /** Regénère le code Typst à partir des exercices */
  function regenerateCode() {
    if (!confirmOverwrite()) return
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Relance la compilation du code courant sans regénérer les exercices */
  function compileAgain() {
    clearTimeout(compileTimer)
    compile(currentCode())
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
      defaultTypstDocumentOptions.title
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
        title="Nouvelles données aléatoires pour tous les exercices"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={newDataForAll}
      >
        <i class="bx bx-refresh text-xl"></i>
        Nouvelles données
      </button>

      <button
        type="button"
        title="Regénérer le code Typst à partir des exercices"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={regenerateCode}
      >
        <i class="bx bx-reset text-xl"></i>
        Regénérer le code
      </button>

      <button
        type="button"
        title="Compiler à nouveau le code Typst courant"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={compileAgain}
      >
        <i
          class="bx {isCompiling
            ? 'bx-loader-alt bx-spin'
            : 'bx-play-circle'} text-xl"
        ></i>
        Compiler à nouveau
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
      <button
        type="button"
        title="Télécharger le fichier .typ"
        aria-label="Télécharger le fichier .typ"
        class="flex items-center text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={downloadTyp}
      >
        <i class="bx bx-save text-2xl"></i>
      </button>
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
            <div class="typst-svg-container mx-auto bg-white shadow-md">
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
