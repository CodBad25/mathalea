<script lang="ts">
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
  import { search, searchKeymap } from '@codemirror/search'
  import { EditorState } from '@codemirror/state'
  import { oneDark } from '@codemirror/theme-one-dark'
  import { EditorView, keymap } from '@codemirror/view'
  import seedrandom from 'seedrandom'
  import { onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import ExerciceSimple from '../../../exercices/ExerciceSimple'
  import { buildExercisesList } from '../../../lib/components/exercisesUtils'
  import {
    mathaleaFormatExercice,
    mathaleaHandleExerciceSimple,
    mathaleaHandleSup,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import {
    darkMode,
    exercicesParams,
    freezeUrl,
    typstParamStore,
  } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import { isLocalStorageAvailable } from '../../../lib/stores/storage'
  import type { IExercice } from '../../../lib/types'
  import { decodeBase64, encodeBase64 } from '../latex/LatexConfig'
  import { context } from '../../../modules/context'
  import Settings from '../../shared/exercice/exerciceMathalea/exerciceMathaleaVueProf/presentationalComponents/Settings.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import {
    BADGE_STYLES,
    HEADER_STYLES,
    INSERTION_TAG,
    MATH_FONTS,
    TEXT_FONTS,
    buildTypstDocument,
    defaultTypstDocumentOptions,
    getGeneratedExerciseCode,
    harvestCarryOver,
    type TypstCarryOver,
    type TypstDocumentOptions,
    type TypstExerciseInput,
  } from './buildTypstDocument'
  import TypstLayoutOverlay, {
    type OverlayWidget,
    type TasksLayoutValue,
  } from './TypstLayoutOverlay.svelte'
  import type { TypstAnchor } from './typstCompiler'
  import { setStaticImagePaths } from './latexToTypst'

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

  let displayMode: DisplayMode = 'preview'
  let documentOptions: TypstDocumentOptions = { ...defaultTypstDocumentOptions }
  let isSettingsOpen = true
  /** Affiche la palette de mise en page sur l'aperçu */
  let showOverlay = true
  if (isLocalStorageAvailable()) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const parsed = JSON.parse(saved)
        if (['code', 'split', 'preview'].includes(parsed.displayMode)) {
          displayMode = parsed.displayMode
        }
        if (typeof parsed.showOverlay === 'boolean') {
          showOverlay = parsed.showOverlay
        }
        if (parsed.documentOptions != null) {
          documentOptions = {
            ...defaultTypstDocumentOptions,
            ...parsed.documentOptions,
          }
          // assainit les réglages issus d'anciennes versions : une valeur qui
          // n'existe plus (ex. style de badge « margin » retiré) retombe sur
          // la valeur par défaut
          const has = (list: readonly string[], value: string) =>
            list.includes(value)
          if (!has(BADGE_STYLES, documentOptions.badgeStyle)) {
            documentOptions.badgeStyle = defaultTypstDocumentOptions.badgeStyle
          }
          if (!has(HEADER_STYLES, documentOptions.headerStyle)) {
            documentOptions.headerStyle = defaultTypstDocumentOptions.headerStyle
          }
          if (!has(TEXT_FONTS, documentOptions.font)) {
            documentOptions.font = defaultTypstDocumentOptions.font
          }
          if (!has(MATH_FONTS, documentOptions.mathFont)) {
            documentOptions.mathFont = defaultTypstDocumentOptions.mathFont
          }
          if (
            !Number.isInteger(documentOptions.nbVersions) ||
            documentOptions.nbVersions < 1 ||
            documentOptions.nbVersions > 4
          ) {
            documentOptions.nbVersions = defaultTypstDocumentOptions.nbVersions
          }
        }
      }
    } catch {
      // préférences illisibles : on garde les valeurs par défaut
    }
  }
  /**
   * Réglages de la palette de mise en page (colonnes/espacement des
   * questions, textes et sections insérés, sauts de page/colonne, fusions,
   * zoom/alignement des figures) restaurés depuis l'URL. Injectés dans la
   * première génération du code ; les modifications suivantes sont relues
   * dans le code courant.
   */
  let urlCarryOver: TypstCarryOver | null = null
  // Le diaporama (bouton « PDF sujets + corrigés ») transmet ici son nombre
  // de vues via typstParam — comme le fait la vue A4 avec a4Param — pour que
  // le nombre de sujets Typst corresponde au nombre de vues jouées. Depuis
  // que la vue Typst réécrit ce paramètre à chaque modification, il porte
  // aussi tous les réglages du document et de la mise en page (rechargeables).
  const typstUrlParam = new URL(window.location.href).searchParams.get(
    'typstParam',
  )
  if (typstUrlParam != null) {
    typstParamStore.set(typstUrlParam)
    const parsed = decodeBase64(typstUrlParam)
    if (parsed.options != null) {
      documentOptions = { ...documentOptions, ...parsed.options }
    }
    if (parsed.carryOver != null) {
      urlCarryOver = parsed.carryOver
    }
  }

  let exercises: (IExercice | null)[] = []
  let isLoading = true
  /**
   * Le code a été modifié à la main depuis sa génération. Les éditions
   * faites par la palette de mise en page ne comptent pas : elles sont
   * reprises telles quelles à la régénération (carry-over), il n'y a donc
   * rien à perdre — l'avertissement ne concerne que la frappe directe.
   */
  let isEdited = false
  /** Édition en cours déclenchée par la palette (et non par la frappe) */
  let isPaletteEdit = false

  /** Édition du code par la palette : ne marque pas le code comme modifié */
  function dispatchPaletteEdit(changes: {
    from: number
    to?: number
    insert: string
  }) {
    if (editorView == null) return
    isPaletteEdit = true
    try {
      editorView.dispatch({ changes })
    } finally {
      isPaletteEdit = false
    }
  }
  let isCompiling = false
  let isCompilerLoading = false
  /**
   * Vrai seulement une fois confirmé que le compilateur n'est PAS en cache
   * (téléchargement à prévoir). Par défaut faux : on affiche un message
   * neutre tant qu'on ne sait pas, pour éviter un clignotement « première
   * visite » sur les rechargements où le compilateur est déjà en cache.
   */
  let compilerFirstVisit = false
  let isGeneratingPdf = false
  let diagnostics: string[] = []
  let svgContent = ''

  let editorEl: HTMLDivElement
  let editorView: EditorView | null = null

  /** Géométrie d'une page dans le SVG de l'aperçu (unités pt du viewBox) */
  interface PreviewPageGeometry {
    /** Ordonnée du haut de la page (espacement entre pages inclus) */
    y: number
    width: number
    height: number
  }
  let previewPages: PreviewPageGeometry[] = []
  let previewViewBox = { width: 0, height: 0 }
  /** Repères publiés par le document compilé (palette de mise en page) */
  let anchors: TypstAnchor[] = []
  /**
   * Mise en page des questions, lue dans le code courant, par préfixe de
   * variables (`ex1` pour l'énoncé, `ex1-corr` pour la correction)
   */
  let tasksLayoutValues: Record<string, TasksLayoutValue> = {}
  /** Insertions (texte/section) présentes dans le code, par repère de gap */
  let insertionValues: Record<number, string[]> = {}
  /**
   * Numéros (1-based) des exercices fusionnés avec le précédent, lus dans
   * le code courant (bouton de la palette de mise en page).
   */
  let mergedExercises: number[] = []
  /** Variables d'en-tête de la fiche, lues dans le code courant */
  let headerValues = { titre: '', 'sous-titre': '', entete: '' }
  /** Nombre de colonnes du document (`#let colonnes`), lu dans le code */
  let documentColumns = 1
  /** Zoom de chaque figure (`#let fig-N-zoom`), lu dans le code courant */
  let figureZoomValues: Record<number, number> = {}
  /** Alignement de chaque figure (`#let fig-N-align`), lu dans le code courant */
  let figureAlignValues: Record<number, 'left' | 'center' | 'right'> = {}
  /** Exercice dont la modale de réglages (panneau Settings) est ouverte */
  let settingsExerciseIndex: number | null = null
  $: settingsExercise =
    settingsExerciseIndex !== null
      ? (exercises[settingsExerciseIndex] ?? null)
      : null
  /** Surcharges de code Typst par exercice (modale d'édition), lues dans le code */
  let codeOverrideValues: Record<number, string> = {}
  /** Numéro de l'exercice dont la modale d'édition du code Typst est ouverte */
  let codeEditNum: number | null = null
  /** Brouillon de la modale d'édition du code Typst */
  let codeEditDraft = ''

  /** Convertit les repères (pt, par page) en positions % sur l'aperçu */
  function computeOverlayWidgets(
    anchorList: TypstAnchor[],
    pages: PreviewPageGeometry[],
    viewBox: { width: number; height: number },
  ): OverlayWidget[] {
    if (viewBox.width <= 0 || viewBox.height <= 0) return []
    const widgets: OverlayWidget[] = []
    for (const anchor of anchorList) {
      const page = pages[anchor.page - 1]
      if (page == null) continue
      const isTasks = anchor.kind === 'tasks' || anchor.kind === 'tasks-corr'
      widgets.push({
        kind: isTasks
          ? 'tasks'
          : (anchor.kind as 'exo' | 'gap' | 'header' | 'figure'),
        num: anchor.num,
        // les variables de la correction sont indépendantes de l'énoncé
        target: isTasks
          ? anchor.kind === 'tasks-corr'
            ? `ex${anchor.num}-corr`
            : `ex${anchor.num}`
          : undefined,
        left: (anchor.x / viewBox.width) * 100,
        top: ((page.y + anchor.y) / viewBox.height) * 100,
        // les contrôles des questions vont dans la marge la plus proche :
        // à gauche pour la colonne de gauche, à droite sinon
        side: anchor.x < page.width / 2 ? 'left' : 'right',
      })
    }
    return widgets
  }
  $: overlayWidgets = computeOverlayWidgets(anchors, previewPages, previewViewBox)

  /**
   * Relit dans le code les données de la palette : valeurs
   * `#let exN-colonnes`/`#let exN-gutter` (et variantes `-corr`), variables
   * d'en-tête et insertions marquées.
   */
  function refreshTasksLayout(code: string) {
    const values: Record<string, TasksLayoutValue> = {}
    const defaults = (): TasksLayoutValue => ({
      columns: '"auto-fit"',
      gutter: 'interligne-questions',
    })
    for (const match of code.matchAll(
      /^#let (ex\d+(?:-corr)?)-colonnes = (.+?)\s*$/gm,
    )) {
      const value = match[2].trim()
      ;(values[match[1]] ??= defaults()).columns = /^\d+$/.test(value)
        ? Number(value)
        : value
    }
    for (const match of code.matchAll(
      /^#let (ex\d+(?:-corr)?)-gutter = (\S+)/gm,
    )) {
      ;(values[match[1]] ??= defaults()).gutter = match[2]
    }
    tasksLayoutValues = values
    const harvested = harvestCarryOver(code)
    insertionValues = harvested.insertions ?? {}
    mergedExercises = harvested.merges ?? []
    codeOverrideValues = harvested.codeOverrides ?? {}
    const columns = code.match(/^#let colonnes = (\d+)/m)
    documentColumns = columns != null ? Number(columns[1]) : 1
    const figureZoom: Record<number, number> = {}
    for (const match of code.matchAll(/^#let fig-(\d+)-zoom = ([\d.]+)/gm)) {
      figureZoom[Number(match[1])] = Number(match[2])
    }
    figureZoomValues = figureZoom
    const figureAlign: Record<number, 'left' | 'center' | 'right'> = {}
    for (const match of code.matchAll(
      /^#let fig-(\d+)-align = (left|center|right)/gm,
    )) {
      figureAlign[Number(match[1])] = match[2] as 'left' | 'center' | 'right'
    }
    figureAlignValues = figureAlign
    const header = { titre: '', 'sous-titre': '', entete: '' }
    for (const name of ['titre', 'sous-titre', 'entete'] as const) {
      const match = new RegExp(`^#let ${name} = "((?:[^"\\\\]|\\\\.)*)"`, 'm').exec(
        code,
      )
      if (match != null) {
        header[name] = match[1].replace(/\\(.)/g, '$1')
      }
    }
    headerValues = header
  }

  /** Modifie la ligne `#let <prefix>-<clef> = ...` (édition ciblée, annulable) */
  function setTasksVariable(
    target: string,
    key: 'colonnes' | 'gutter',
    value: string,
  ) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let ${target}-${key} = .*$`, 'm').exec(doc)
    if (match == null) return
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let ${target}-${key} = ${value}`,
    })
  }

  function adjustColumns(target: string, delta: number) {
    const raw = tasksLayoutValues[target]?.columns ?? '"auto-fit"'
    if (typeof raw !== 'number') {
      setTasksVariable(target, 'colonnes', String(delta < 0 ? 3 : 4))
      return
    }
    const current = raw
    const next = Math.min(4, Math.max(1, current + delta))
    if (next !== current) setTasksVariable(target, 'colonnes', String(next))
  }

  /** Pas d'ajustement de l'espacement vertical des questions, en em */
  const GUTTER_STEP = 0.25
  function adjustGutter(target: string, delta: number) {
    const raw = tasksLayoutValues[target]?.gutter ?? 'interligne-questions'
    // « interligne-questions » (le défaut global) vaut 1,2 em : le premier
    // clic le remplace par une valeur explicite pour cet exercice
    const current = raw.endsWith('em') ? parseFloat(raw) : 1.2
    const next = Math.max(
      0,
      Math.round((current + delta * GUTTER_STEP) * 100) / 100,
    )
    setTasksVariable(target, 'gutter', `${next}em`)
  }

  /** Pas d'ajustement du zoom d'une figure, et bornes (20 % à 300 %) */
  const FIGURE_ZOOM_STEP = 0.1
  function adjustFigureZoom(figNum: number, delta: number) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let fig-${figNum}-zoom = .*$`, 'm').exec(doc)
    if (match == null) return
    const current = figureZoomValues[figNum] ?? 1
    const next = Math.min(
      3,
      Math.max(0.2, Math.round((current + delta * FIGURE_ZOOM_STEP) * 100) / 100),
    )
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let fig-${figNum}-zoom = ${next}`,
    })
  }

  /** Alignement d'une figure : gauche, centré ou à droite */
  function setFigureAlign(
    figNum: number,
    align: 'left' | 'center' | 'right',
  ) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let fig-${figNum}-align = .*$`, 'm').exec(doc)
    if (match == null) return
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let fig-${figNum}-align = ${align}`,
    })
  }

  /** Nombre de questions par exercice (null : non réglable), pour la palette */
  $: questionCounts = Object.fromEntries(
    exercises.map((exercise, k) => [k + 1, exercise?.nbQuestions ?? null]),
  ) as Record<number, number | null>

  /** Change le nombre de questions de l'exercice num et régénère le code */
  function changeQuestionCount(num: number, delta: number) {
    const exercise = exercises[num - 1]
    if (exercise?.nbQuestions == null) return
    const next = Math.max(1, exercise.nbQuestions + delta)
    if (next === exercise.nbQuestions || !confirmOverwrite()) return
    // fige le contenu courant : les questions déjà affichées gardent leurs
    // valeurs (la régénération avec un autre nbQuestions rebrasse les tirages)
    const current = buildInputs()[num - 1]
    if (current.warning == null) {
      frozenInputs.set(exercise, {
        intro: current.intro,
        introCorrection: current.introCorrection,
        questions: current.questions,
        corrections: current.corrections,
      })
    }
    exercise.nbQuestions = next
    const params = get(exercicesParams)
    if (params[num - 1] != null) params[num - 1].nbQuestions = next
    exercicesParams.update((list) => list)
    exercises = exercises
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Décale les réglages de la palette après la suppression de l'exercice
   * `removed` : `ex3` devient `ex2`, etc. Les insertions qui suivaient
   * l'exercice supprimé sont rattachées au repère précédent.
   */
  function shiftCarryOver(
    carryOver: ReturnType<typeof harvestCarryOver>,
    removed: number,
  ): ReturnType<typeof harvestCarryOver> {
    const tasksLayout: NonNullable<typeof carryOver.tasksLayout> = {}
    for (const [prefix, layout] of Object.entries(
      carryOver.tasksLayout ?? {},
    )) {
      const match = prefix.match(/^ex(\d+)(-corr)?$/)
      if (match == null) continue
      const n = Number(match[1])
      if (n === removed) continue
      tasksLayout[n > removed ? `ex${n - 1}${match[2] ?? ''}` : prefix] = layout
    }
    const insertions: NonNullable<typeof carryOver.insertions> = {}
    for (const [key, lines] of Object.entries(carryOver.insertions ?? {})) {
      const n = Number(key)
      const target = n >= removed ? Math.max(0, n - 1) : n
      insertions[target] = [...(insertions[target] ?? []), ...lines]
    }
    // l'exercice supprimé ne peut plus être fusionné ; les suivants décalent
    const merges = (carryOver.merges ?? [])
      .filter((n) => n !== removed)
      .map((n) => (n > removed ? n - 1 : n))
    const codeOverrides: NonNullable<typeof carryOver.codeOverrides> = {}
    for (const [key, value] of Object.entries(carryOver.codeOverrides ?? {})) {
      const n = Number(key)
      if (n === removed) continue
      codeOverrides[n > removed ? n - 1 : n] = value
    }
    return { tasksLayout, insertions, merges, codeOverrides }
  }

  /** Retire l'exercice num de la fiche et régénère le code */
  function deleteExercise(num: number) {
    if (!window.confirm(`Supprimer l'exercice ${num} de la fiche ?`)) return
    const carryOver =
      editorView != null
        ? shiftCarryOver(harvestCarryOver(currentCode()), num)
        : {}
    const exercise = exercises[num - 1]
    exercise?.reinit?.()
    exercise?.destroy?.()
    exercises = exercises.filter((_, k) => k !== num - 1)
    exercicesParams.update((list) => list.filter((_, k) => k !== num - 1))
    const code = buildTypstDocument(buildInputs(), documentOptions, carryOver)
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Échange les réglages de la palette (colonnes/espacement des questions,
   * insertions) entre les exercices `numA` et `numB` : ce que le professeur
   * avait réglé « pour cet exercice » le suit quand il change de position.
   */
  function swapCarryOver(
    carryOver: ReturnType<typeof harvestCarryOver>,
    numA: number,
    numB: number,
  ): ReturnType<typeof harvestCarryOver> {
    const swapNum = (n: number) => (n === numA ? numB : n === numB ? numA : n)
    const tasksLayout: NonNullable<typeof carryOver.tasksLayout> = {}
    for (const [prefix, layout] of Object.entries(
      carryOver.tasksLayout ?? {},
    )) {
      const match = prefix.match(/^ex(\d+)(-corr)?$/)
      if (match == null) continue
      tasksLayout[`ex${swapNum(Number(match[1]))}${match[2] ?? ''}`] = layout
    }
    const insertions: NonNullable<typeof carryOver.insertions> = {}
    for (const [key, lines] of Object.entries(carryOver.insertions ?? {})) {
      // le repère de gap `g` précède l'exercice `g + 1`
      const newGap = swapNum(Number(key) + 1) - 1
      insertions[newGap] = [...(insertions[newGap] ?? []), ...lines]
    }
    const merges = (carryOver.merges ?? []).map(swapNum)
    const codeOverrides: NonNullable<typeof carryOver.codeOverrides> = {}
    for (const [key, value] of Object.entries(carryOver.codeOverrides ?? {})) {
      codeOverrides[swapNum(Number(key))] = value
    }
    return { tasksLayout, insertions, merges, codeOverrides }
  }

  /** Échange l'exercice num avec son voisin (delta : -1 monter, 1 descendre) */
  function moveExercise(num: number, delta: -1 | 1) {
    const k = num - 1
    const target = k + delta
    if (target < 0 || target >= exercises.length) return
    if (!confirmOverwrite()) return
    const carryOver =
      editorView != null
        ? swapCarryOver(harvestCarryOver(currentCode()), k + 1, target + 1)
        : {}
    const newExercises = [...exercises]
    ;[newExercises[k], newExercises[target]] = [
      newExercises[target],
      newExercises[k],
    ]
    exercises = newExercises
    exercicesParams.update((list) => {
      const copy = [...list]
      ;[copy[k], copy[target]] = [copy[target], copy[k]]
      return copy
    })
    const code = buildTypstDocument(buildInputs(), documentOptions, carryOver)
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Nouvelle graine pour l'exercice d'indice k (sans régénérer le code) */
  function applyNewSeedTo(k: number) {
    const exercise = exercises[k]
    if (exercise == null) return
    // regenerate() (via seedrandom(..., { global: true })) laisse Math.random
    // verrouillé sur la graine du dernier exercice régénéré : sans ce
    // réamorçage sur de l'entropie réelle, le tirage de la nouvelle graine
    // serait déterministe et se figerait au bout de quelques clics.
    seedrandom(undefined, { global: true })
    exercise.seed = undefined
    if (typeof exercise.applyNewSeed === 'function') exercise.applyNewSeed()
    const params = get(exercicesParams)[k]
    if (params != null && exercise.seed !== undefined) {
      params.alea = exercise.seed
    }
    frozenInputs.delete(exercise)
  }

  /** Nouvelles données aléatoires pour l'exercice num */
  function newDataForExercise(num: number) {
    if (!confirmOverwrite()) return
    applyNewSeedTo(num - 1)
    exercicesParams.update((list) => list)
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  function openSettings(num: number) {
    settingsExerciseIndex = num - 1
  }

  /**
   * Ouvre la modale d'édition du code Typst de l'exercice num, préremplie
   * avec sa surcharge existante ou, à défaut, le code actuellement généré
   * pour cet exercice (voir `getGeneratedExerciseCode`).
   */
  function openCodeEdit(num: number) {
    const carryOver =
      editorView != null ? harvestCarryOver(currentCode()) : {}
    codeEditDraft =
      carryOver.codeOverrides?.[num] ??
      getGeneratedExerciseCode(buildInputs(), num, documentOptions, carryOver)
    codeEditNum = num
  }

  /**
   * Retire la surcharge de l'exercice num : son énoncé redevient celui
   * généré automatiquement (icône crayon désactivée, « Nouvelles données »
   * de nouveau opérant sur son contenu). Contrairement au brouillon de la
   * modale, une surcharge n'est un texte figé que tant qu'elle existe : la
   * restaurer doit donc réellement la supprimer, pas seulement préremplir le
   * brouillon avec un instantané du texte généré.
   */
  function restoreGeneratedCode(num: number) {
    updateExerciseCode(num, '')
  }

  /**
   * Applique (ou retire, si `code` est vide) la surcharge de code Typst de
   * l'exercice num, saisie dans la modale d'édition. Régénère le document
   * (comme suppression/déplacement/fusion) : la surcharge change la
   * structure du code (elle remplace l'énoncé généré), un simple patch de
   * texte comme pour les insertions ne suffit pas.
   */
  function updateExerciseCode(num: number, code: string) {
    if (!confirmOverwrite()) return
    const carryOver =
      editorView != null ? harvestCarryOver(currentCode()) : {}
    const codeOverrides = { ...(carryOver.codeOverrides ?? {}) }
    const trimmed = code.trim()
    if (trimmed.length === 0) delete codeOverrides[num]
    else codeOverrides[num] = code
    carryOver.codeOverrides = codeOverrides
    const [primary, ...extraVersions] = buildAllVersionInputs()
    const newCode = buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
    )
    setEditorContent(newCode)
    scheduleCompile(newCode, 0)
    codeEditNum = null
  }

  /**
   * Fusionne/sépare l'exercice num avec celui qui le précède : ils partagent
   * alors un seul titre (banque exercise-bank) et la numérotation de ses
   * questions continue celle de son prédécesseur. Régénère le code (comme
   * suppression/déplacement) plutôt que d'éditer le texte : la fusion
   * change la structure du document (les deux exercices rejoignent la même
   * définition `exo.with(...)`).
   */
  function toggleMergeBefore(num: number) {
    if (!confirmOverwrite()) return
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const merges = carryOver.merges ?? []
    carryOver.merges = merges.includes(num)
      ? merges.filter((n) => n !== num)
      : [...merges, num]
    const [primary, ...extraVersions] = buildAllVersionInputs()
    const code = buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
    )
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Applique les réglages émis par le panneau Settings de la vue prof */
  function applyNewSettings(k: number, detail: Record<string, unknown>) {
    const exercise = exercises[k]
    const params = get(exercicesParams)[k]
    if (exercise == null || params == null) return
    if (!confirmOverwrite()) return
    if (detail.nbQuestions != null) {
      exercise.nbQuestions = detail.nbQuestions as number
      params.nbQuestions = exercise.nbQuestions
    }
    if (detail.duration != null) {
      exercise.duration = detail.duration as number
      params.duration = exercise.duration
    }
    const supKeys = ['sup', 'sup2', 'sup3', 'sup4', 'sup5'] as const
    for (const key of supKeys) {
      if (detail[key] !== undefined) {
        exercise[key] = detail[key] as boolean | number | string
        params[key] = mathaleaHandleSup(
          exercise[key] as boolean | number | string,
        )
      }
    }
    if (detail.versionQcm !== undefined && exercise instanceof ExerciceSimple) {
      exercise.versionQcm = detail.versionQcm as boolean
      params.versionQcm = exercise.versionQcm ? '1' : '0'
    }
    if (detail.alea !== undefined) {
      exercise.seed = detail.alea as string
      params.alea = exercise.seed
    }
    if (detail.correctionDetaillee !== undefined) {
      exercise.correctionDetaillee = detail.correctionDetaillee as boolean
      params.cd = exercise.correctionDetaillee ? '1' : '0'
    }
    exercicesParams.update((list) => list)
    frozenInputs.delete(exercise)
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Modifie une variable d'en-tête (`#let titre = "..."`) dans le code et
   * reporte la valeur dans les réglages persistés (elle survit ainsi à une
   * régénération).
   */
  function updateHeaderValue(
    name: 'titre' | 'sous-titre' | 'entete',
    value: string,
  ) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let ${name} = ".*"`, 'm').exec(doc)
    if (match == null) return
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let ${name} = "${escaped}"`,
    })
    if (name === 'titre') documentOptions.title = value
    else if (name === 'sous-titre') documentOptions.subtitle = value
    else documentOptions.headerLine = value
    persistPreferences()
  }

  /** Repère de gap `num` dans le code (indentation et fin de sa ligne) */
  function findGapAnchor(
    doc: string,
    num: number,
  ): { indent: string; lineEnd: number } | null {
    const match = new RegExp(
      `^([ \\t]*)#mathalea-anchor\\("gap", ${num}\\).*$`,
      'm',
    ).exec(doc)
    if (match == null) return null
    return { indent: match[1], lineEnd: match.index + match[0].length }
  }

  /**
   * Bornes de la ligne de la `index`-ième insertion qui suit le repère de
   * gap `num` (sans son saut de ligne initial). La recherche s'arrête au
   * repère suivant.
   */
  function findInsertionLine(
    doc: string,
    num: number,
    index: number,
  ): { from: number; to: number } | null {
    const anchor = findGapAnchor(doc, num)
    if (anchor == null) return null
    let offset = anchor.lineEnd
    let count = 0
    while (offset < doc.length) {
      const from = offset + 1 // saute le saut de ligne
      let to = doc.indexOf('\n', from)
      if (to === -1) to = doc.length
      const line = doc.slice(from, to)
      if (line.includes('#mathalea-anchor(')) return null
      if (/\/\/ mathalea:insertion\s*$/.test(line)) {
        if (count === index) return { from, to }
        count++
      }
      offset = to
    }
    return null
  }

  /** Insère un fragment (texte, #section[...]) juste après l'exercice num */
  function insertAfterExercise(num: number, snippet: string) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const anchor = findGapAnchor(doc, num)
    if (anchor == null) return
    // la nouvelle ligne s'ajoute après les insertions déjà présentes
    // (leur ordre d'affichage est conservé)
    let insertAt = anchor.lineEnd
    let offset = anchor.lineEnd
    while (offset < doc.length) {
      const from = offset + 1
      let to = doc.indexOf('\n', from)
      if (to === -1) to = doc.length
      const line = doc.slice(from, to)
      if (line.includes('#mathalea-anchor(')) break
      if (/\/\/ mathalea:insertion\s*$/.test(line)) insertAt = to
      else if (line.trim().length > 0) break
      offset = to
    }
    dispatchPaletteEdit({
      from: insertAt,
      insert: `\n${anchor.indent}${snippet} ${INSERTION_TAG}`,
    })
  }

  /** Remplace la `index`-ième insertion qui suit l'exercice num */
  function updateInsertion(num: number, index: number, snippet: string) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const line = findInsertionLine(doc, num, index)
    if (line == null) return
    const indent = doc.slice(line.from, line.to).match(/^[ \t]*/)?.[0] ?? ''
    dispatchPaletteEdit({
      from: line.from,
      to: line.to,
      insert: `${indent}${snippet} ${INSERTION_TAG}`,
    })
  }

  /** Supprime la `index`-ième insertion qui suit l'exercice num */
  function deleteInsertion(num: number, index: number) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const line = findInsertionLine(doc, num, index)
    if (line == null) return
    // la ligne entière disparaît, saut de ligne précédent compris
    dispatchPaletteEdit({ from: line.from - 1, to: line.to, insert: '' })
  }

  function persistPreferences() {
    persistToUrl()
    if (!isLocalStorageAvailable()) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ displayMode, documentOptions, showOverlay }),
      )
    } catch {
      // stockage plein ou indisponible : sans conséquence
    }
  }

  /** Dernière valeur écrite dans `typstParam` (évite les réécritures inutiles) */
  let lastTypstParam = typstUrlParam ?? ''

  /**
   * Sauvegarde dans l'URL (`typstParam`) tous les réglages du document et de
   * la mise en page (colonnes/espacement des questions, textes et sections
   * insérés, sauts de page/colonne, fusions, zoom/alignement des figures) pour
   * pouvoir recharger la fiche à l'identique. La liste des exercices, leurs
   * graines et leurs réglages sont déjà portés par l'URL (`exercicesParams`).
   */
  function persistToUrl() {
    const carryOver =
      editorView != null
        ? harvestCarryOver(currentCode())
        : (urlCarryOver ?? {})
    const encoded = encodeBase64({ options: documentOptions, carryOver })
    // le store est la source de vérité ; on redéclenche ensuite l'écrivain
    // d'URL de l'app pour que sa prochaine écriture (débouncée) reparte de
    // cette valeur et ne réécrive pas l'URL sans typstParam (comme la vue A4)
    typstParamStore.set(encoded)
    mathaleaUpdateUrlFromExercicesParams()
    if (encoded === lastTypstParam) return
    lastTypstParam = encoded
    // l'URL est bloquée dans un iframe (recorder Capytale/Moodle…)
    if (get(freezeUrl)) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('typstParam', encoded)
      window.history.replaceState(null, '', url)
    } catch {
      // URL non modifiable (iframe sandboxée…) : sans conséquence
    }
  }

  function setDisplayMode(mode: DisplayMode) {
    displayMode = mode
    isSettingsOpen = false
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
    persistPreferences()
    // réinitialisation complète : les réglages de la palette de mise en page
    // (colonnes/espacement par exercice, insertions) ne sont pas repris
    const code = buildTypstDocument(buildInputs(), documentOptions)
    setEditorContent(code)
    scheduleCompile(code, 0)
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
    context.isTypst = true
    try {
      if (exercise.typeExercice === 'simple') {
        mathaleaHandleExerciceSimple(exercise, false, k)
      } else if (typeof exercise.nouvelleVersionWrapper === 'function') {
        exercise.nouvelleVersionWrapper(k)
      }
    } finally {
      context.isTypst = false
    }
  }

  /**
   * Contenu figé des exercices dont le nombre de questions a été changé via
   * la palette : régénérer un exercice avec un autre `nbQuestions` rebrasse
   * toutes ses valeurs (mêmes graines, tirages décalés). Les questions déjà
   * affichées sont donc figées ; seules les questions ajoutées prennent le
   * contenu fraîchement généré. Vidé par « Nouvelles données ».
   */
  const frozenInputs = new Map<
    IExercice,
    {
      intro: string
      introCorrection: string
      questions: string[]
      corrections: string[]
    }
  >()

  /**
   * Lien vers l'exercice seul sur MathALÉA (réglages et graine inclus),
   * encodé dans le QR-code. Mêmes paramètres que la sortie LaTeX.
   */
  function exerciceUrl(exercise: IExercice): string {
    const url = new URL('https://coopmaths.fr/alea')
    url.searchParams.append('uuid', String(exercise.uuid))
    if (exercise.id !== undefined) url.searchParams.append('id', exercise.id)
    if (exercise.nbQuestions !== undefined) {
      url.searchParams.append('n', exercise.nbQuestions.toString())
    }
    if (exercise.duration !== undefined) {
      url.searchParams.append('d', exercise.duration.toString())
    }
    if (exercise.sup !== undefined) url.searchParams.append('s', String(exercise.sup))
    if (exercise.sup2 !== undefined) url.searchParams.append('s2', String(exercise.sup2))
    if (exercise.sup3 !== undefined) url.searchParams.append('s3', String(exercise.sup3))
    if (exercise.sup4 !== undefined) url.searchParams.append('s4', String(exercise.sup4))
    if (exercise.sup5 !== undefined) url.searchParams.append('s5', String(exercise.sup5))
    if (exercise.seed !== undefined) url.searchParams.append('alea', exercise.seed)
    if (exercise.correctionDetaillee !== undefined) {
      url.searchParams.append('cd', exercise.correctionDetaillee ? '1' : '0')
    }
    if (exercise.nbCols !== undefined) {
      url.searchParams.append('cols', exercise.nbCols.toString())
    }
    // vue élève, sans réglages affichés (comme le QR-code de la sortie LaTeX)
    url.searchParams.append('v', 'eleve')
    url.searchParams.append('es', '0211')
    return url.href
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
      input.url = exerciceUrl(exercise)
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
      // le nombre de questions n'entre pas en jeu ici : un exercice à
      // question unique n'est de toute façon jamais mis dans un
      // environnement `tasks` (donc jamais numéroté), sauf s'il rejoint un
      // groupe fusionné (voir `forceList` dans buildTypstDocument)
      input.numbered = exercise.listeAvecNumerotation !== false
      // questions figées par la palette (nombre de questions modifié) : les
      // questions déjà affichées gardent leur contenu, seules les questions
      // ajoutées prennent le contenu fraîchement généré
      const frozen = frozenInputs.get(exercise)
      if (frozen != null) {
        input.intro = frozen.intro
        input.introCorrection = frozen.introCorrection
        input.questions = input.questions.map(
          (question, i) => frozen.questions[i] ?? question,
        )
        input.corrections = input.corrections.map(
          (correction, i) => frozen.corrections[i] ?? correction,
        )
      }
      return input
    })
  }

  /**
   * Contenu de chaque version du sujet (Sujet A, B...) : la version 0 utilise
   * la graine de base (visible dans les réglages), les suivantes une graine
   * dérivée — même formule que la vue A4 (`Diaporama.svelte` `reroll`), pour
   * que la 2e version corresponde à la 2e vue du diaporama.
   */
  function buildAllVersionInputs(): TypstExerciseInput[][] {
    const baseSeeds = exercises.map((exercise) => exercise?.seed)
    const nbVersions = Math.max(1, documentOptions.nbVersions)
    const perVersion: TypstExerciseInput[][] = []
    for (let version = 0; version < nbVersions; version++) {
      for (const [k, exercise] of exercises.entries()) {
        if (exercise == null) continue
        const base = baseSeeds[k]
        exercise.seed =
          version === 0 || base === undefined ? base : `${base}${version}`
      }
      perVersion.push(buildInputs())
    }
    // on restaure la graine de base : c'est elle que montrent les réglages
    for (const [k, exercise] of exercises.entries()) {
      if (exercise != null) exercise.seed = baseSeeds[k]
    }
    return perVersion
  }

  function buildCode(): string {
    // les ajustements faits via la palette de mise en page (colonnes,
    // espacement, insertions) sont repris du code courant pour survivre
    // à la régénération ; au tout premier rendu (éditeur pas encore créé),
    // on repart des réglages restaurés depuis l'URL le cas échéant
    const carryOver =
      editorView != null
        ? harvestCarryOver(currentCode())
        : (urlCarryOver ?? {})
    const [primary, ...extraVersions] = buildAllVersionInputs()
    return buildTypstDocument(primary, documentOptions, carryOver, extraVersions)
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
              // les éditions de la palette survivent à la régénération :
              // seule la frappe directe arme l'avertissement d'écrasement
              if (!isPaletteEdit) isEdited = true
              const code = update.state.doc.toString()
              refreshTasksLayout(code)
              // toute modification structurée (palette, régénération) est
              // reportée dans l'URL ; le garde-fou sur la valeur encodée
              // évite d'écrire à chaque frappe qui ne change pas les réglages
              persistToUrl()
              scheduleCompile(code)
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
    refreshTasksLayout(content)
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

  /** Aperçu préparé : SVG retouché et géométrie des pages pour la palette */
  interface SeparatedPreview {
    svg: string
    pages: PreviewPageGeometry[]
    viewBox: { width: number; height: number }
  }

  /**
   * Le SVG de typst.ts empile les pages sans séparation : on insère un
   * fond blanc bordé derrière chaque page (`g.typst-page`) et un espace
   * entre les pages, sur le fond gris du panneau d'aperçu. La géométrie des
   * pages est renvoyée pour positionner la palette de mise en page.
   */
  function separatePages(svg: string): SeparatedPreview {
    const degraded: SeparatedPreview = {
      svg,
      pages: [],
      viewBox: { width: 0, height: 0 },
    }
    try {
      // parseur HTML (pas XML) : le SVG de typst.ts embarque un <script>
      // et des styles qui ne sont pas du XML strict
      const doc = new DOMParser().parseFromString(svg, 'text/html')
      const root = doc.querySelector('svg')
      if (root == null) return degraded
      const pages = [...root.querySelectorAll('g.typst-page')]
      if (pages.length === 0) return degraded
      const viewBox = (root.getAttribute('viewBox') ?? '')
        .trim()
        .split(/\s+/)
        .map(Number)
      if (viewBox.length !== 4 || viewBox.some(Number.isNaN)) return degraded
      const geometry: PreviewPageGeometry[] = []
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
        geometry.push({ y: pageY + i * PAGE_GAP, width, height })
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
      return {
        svg: root.outerHTML,
        pages: geometry,
        viewBox: { width: viewBox[2], height: viewBox[3] },
      }
    } catch {
      // aperçu dégradé (pages non séparées, pas de palette) plutôt que rien
      return degraded
    }
  }

  async function compile(code: string) {
    const token = ++compileToken
    isCompiling = true
    if (svgContent === '') isCompilerLoading = true
    try {
      const { compileTypstToSvg, isCompilerCached } = await import(
        './typstCompiler'
      )
      // adapte le message d'attente : « première visite » seulement si le
      // compilateur n'est pas déjà en cache (téléchargement à prévoir)
      if (isCompilerLoading) compilerFirstVisit = !(await isCompilerCached())
      const result = await compileTypstToSvg(code)
      if (token !== compileToken) return
      diagnostics = result.diagnostics
      if (result.svg != null) {
        const separated = separatePages(result.svg)
        svgContent = separated.svg
        previewPages = separated.pages
        previewViewBox = separated.viewBox
        anchors = result.anchors ?? []
      }
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

  /**
   * Récupère les images (PNG) des exercices statiques (annales scannées) et
   * les charge dans le compilateur Typst (système de fichiers virtuel), pour
   * qu'elles s'affichent dans l'aperçu au lieu d'un encart « non convertie ».
   * Une image dont la récupération échoue reste absente du registre : elle
   * s'affiche alors comme un encart, sans bloquer le reste de la fiche.
   */
  /**
   * Récrit une URL `https://coopmaths.fr/alea/...` en URL de même origine
   * que l'application (proxyée vers coopmaths.fr en développement, voir
   * `vite.config.ts`) : coopmaths.fr n'envoie pas d'en-têtes CORS, un fetch
   * direct échouerait sinon dès que l'appli n'est pas servie depuis ce domaine.
   */
  function toSameOriginUrl(url: string): string {
    const prefix = 'https://coopmaths.fr/alea/'
    return url.startsWith(prefix)
      ? `${window.location.origin}${import.meta.env.BASE_URL}${url.slice(prefix.length)}`
      : url
  }

  async function prefetchStaticImages() {
    const urls = new Set<string>()
    const imgSrc = /<img[^>]*\ssrc=["']([^"']+)["']/gi
    for (const exercise of exercises) {
      if (exercise == null || exercise.typeExercice !== 'statique') continue
      const html = [
        ...(exercise.listeQuestions ?? []),
        ...(exercise.listeCorrections ?? []),
      ].join('')
      for (const match of html.matchAll(imgSrc)) urls.add(match[1])
    }
    if (urls.size === 0) return
    const { cachedBytes, setStaticImageBytes } = await import('./typstCompiler')
    const paths = new Map<string, string>()
    const bytes = new Map<string, Uint8Array>()
    await Promise.all(
      [...urls].map(async (url, i) => {
        try {
          bytes.set(
            `/static-img-${i}.png`,
            await cachedBytes(toSameOriginUrl(url)),
          )
          paths.set(url, `/static-img-${i}.png`)
        } catch {
          // image indisponible : elle apparaîtra comme un encart
        }
      }),
    )
    setStaticImagePaths(paths)
    setStaticImageBytes(bytes)
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
    await prefetchStaticImages()
    isLoading = false
  }

  onMount(async () => {
    await loadExercises()
    const code = buildCode()
    initEditor(code)
    // normalise l'URL : elle porte désormais l'ensemble des réglages
    // (document + mise en page) tels qu'appliqués au premier rendu
    persistToUrl()
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
    // nouvelles graines : les questions figées par la palette sont libérées
    frozenInputs.clear()
    // voir applyNewSeedTo : Math.random peut être verrouillé sur la graine
    // du dernier exercice régénéré, il faut le réamorcer avant de tirer
    seedrandom(undefined, { global: true })
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

  /** Compile un code Typst en PDF et le télécharge (nom `filename.pdf`) */
  async function compileAndDownload(
    code: string,
    filename: string,
  ): Promise<boolean> {
    const { compileTypstToPdf } = await import('./typstCompiler')
    const pdf = await compileTypstToPdf(code)
    if (pdf == null) return false
    downloadBlob(
      new Blob([pdf as BlobPart], { type: 'application/pdf' }),
      `${filename}.pdf`,
    )
    return true
  }

  async function downloadPdf() {
    if (isGeneratingPdf) return
    isGeneratingPdf = true
    try {
      const ok = await compileAndDownload(currentCode(), exportFilename())
      if (!ok) {
        window.alert(
          'La compilation du PDF a échoué : corrigez les erreurs signalées sous l’aperçu.',
        )
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF", error)
    } finally {
      isGeneratingPdf = false
    }
  }

  /**
   * Code de l'énoncé seul : `corrige = false` masque le corrigé
   * (le paquet exercise-bank passe alors en affichage « ex »).
   */
  function enonceCode(code: string): string {
    return code.replace('#let corrige = true', '#let corrige = false')
  }

  /**
   * Code du corrigé seul (mode banque exercise-bank) : affichage « sol » —
   * chaque exercice rend sa correction à la place de l'énoncé. `corrige`
   * repasse à false pour ignorer le bloc de corrections regroupées (sinon un
   * titre « Corrections » vide s'ajouterait). En mode fusionné (pas de banque),
   * la séparation n'est pas possible : on garde le document complet.
   */
  function corrigeCode(code: string): string {
    const bankDisplay = 'display: if corrige { "both" } else { "ex" }'
    if (!code.includes(bankDisplay)) return code
    return (
      code
        .replace('#let corrige = true', '#let corrige = false')
        .replace(bankDisplay, 'display: "sol"')
        // on garde le titre mais on retire la ligne Nom/Prénom/Classe
        // (inutile sur le corrigé) en vidant la variable `entete`
        .replace(/#let entete = .*/, '#let entete = ""')
    )
  }

  /**
   * Télécharge deux PDF à la suite : `titre_enonce.pdf` puis
   * `titre_corrige.pdf`, à partir du code courant.
   */
  async function downloadPdfSeparate() {
    if (isGeneratingPdf) return
    isGeneratingPdf = true
    try {
      const code = currentCode()
      const base = exportFilename()
      const okEnonce = await compileAndDownload(
        enonceCode(code),
        `${base}_enonce`,
      )
      // court délai : certains navigateurs ignorent deux téléchargements
      // déclenchés dans le même tick
      await new Promise((resolve) => setTimeout(resolve, 400))
      const okCorrige = await compileAndDownload(
        corrigeCode(code),
        `${base}_corrige`,
      )
      if (!okEnonce || !okCorrige) {
        window.alert(
          'La compilation du PDF a échoué : corrigez les erreurs signalées sous l’aperçu.',
        )
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF séparé", error)
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
      subtitle="Impression"
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
        aria-pressed={isSettingsOpen}
        class="flex items-center gap-1 text-sm {isSettingsOpen
          ? 'text-coopmaths-action font-semibold dark:text-coopmathsdark-action'
          : 'text-coopmaths-action/60 hover:text-coopmaths-action dark:text-coopmathsdark-action/60 dark:hover:text-coopmathsdark-action'}"
        on:click={() => (isSettingsOpen = !isSettingsOpen)}
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

      <button
        type="button"
        title="Afficher sur l'aperçu les contrôles de mise en page (colonnes et espacement des questions, insertions entre les exercices)"
        aria-pressed={showOverlay}
        class="flex items-center gap-1 text-sm {showOverlay
          ? 'text-coopmaths-action font-semibold dark:text-coopmathsdark-action'
          : 'text-coopmaths-action/60 hover:text-coopmaths-action dark:text-coopmathsdark-action/60 dark:hover:text-coopmathsdark-action'}"
        on:click={() => {
          showOverlay = !showOverlay
          persistPreferences()
        }}
      >
        <i class="bx bx-slider text-xl"></i>
        Mise en page
      </button>

      <label class="flex items-center gap-2 text-sm">
        <i class="bx bx-copy text-xl"></i>
        Versions
        <select
          class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
          bind:value={documentOptions.nbVersions}
          on:change={applyDocumentOptions}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>

      <div class="grow"></div>

      {#if displayMode === 'code'}
        <ButtonTextAction
          text="Télécharger le .typ"
          icon="bx-file-blank"
          inverted={true}
          class="rounded-lg py-1 px-2"
          on:click={downloadTyp}
        />
      {:else}
        <ButtonTextAction
          text={isGeneratingPdf ? 'PDF en cours...' : 'Télécharger le PDF'}
          icon={isGeneratingPdf ? 'bx-loader-alt bx-spin' : 'bx-download'}
          inverted={true}
          class="rounded-lg py-1 px-2 min-w-42.5"
          on:click={downloadPdf}
        />
        <ButtonTextAction
          text={isGeneratingPdf
            ? 'PDF en cours...'
            : 'Énoncé + corrigé séparés'}
          icon={isGeneratingPdf ? 'bx-loader-alt bx-spin' : 'bx-copy'}
          inverted={true}
          class="rounded-lg py-1 px-2 min-w-42.5"
          title="Télécharge deux PDF : l'énoncé seul puis le corrigé seul"
          on:click={downloadPdfSeparate}
        />
      {/if}
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
      {#if isSettingsOpen}
        <div
          class="typst-settings-pane w-80 shrink-0 overflow-y-auto border-r border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus p-5 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h3
              class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
            >
              Réglages du document
            </h3>
            <button
              type="button"
              aria-label="Fermer les réglages"
              on:click={() => (isSettingsOpen = false)}
            >
              <i
                class="bx bx-x text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
              ></i>
            </button>
          </div>

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

          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              bind:checked={documentOptions.showQrCode}
              disabled={documentOptions.mergeExercises}
              on:change={applyDocumentOptions}
            />
            <span class:opacity-50={documentOptions.mergeExercises}>
              QR-code vers chaque exercice
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

          <p class="text-xs opacity-75">
            Le titre, le sous-titre et la ligne d'en-tête se modifient
            directement sur l'aperçu (bouton
            <i class="bx bx-edit"></i> à gauche du titre).
          </p>

          <label class="flex items-center justify-between gap-4 text-sm">
            Police du texte
            <select
              class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
              bind:value={documentOptions.font}
              on:change={applyDocumentOptions}
            >
              {#each TEXT_FONTS as font}
                <option value={font}>{font}</option>
              {/each}
            </select>
          </label>

          <label class="flex items-center justify-between gap-4 text-sm">
            Police des maths
            <select
              class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
              bind:value={documentOptions.mathFont}
              on:change={applyDocumentOptions}
            >
              {#each MATH_FONTS as font}
                <option value={font}>{font}</option>
              {/each}
            </select>
          </label>

          <div class="flex items-center justify-between gap-4 text-sm">
            <label for="typst-font-size-input">Taille du texte (pt)</label>
            <input
              id="typst-font-size-input"
              type="number"
              min="7"
              max="16"
              step="0.5"
              class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
              bind:value={documentOptions.fontSize}
              on:change={applyDocumentOptions}
            />
          </div>

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
            <label for="typst-word-spacing-input"
              >Espacement entre les mots (%)</label
            >
            <input
              id="typst-word-spacing-input"
              type="number"
              min="50"
              max="300"
              step="5"
              class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
              bind:value={documentOptions.wordSpacing}
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
      {/if}
      <div
        class="typst-editor-pane {isSettingsOpen
          ? 'hidden'
          : displayMode === 'code'
            ? 'w-full'
            : displayMode === 'split'
              ? 'w-1/2'
              : 'hidden'} min-h-0"
        bind:this={editorEl}
      ></div>
      <div
        class="typst-preview-pane {isSettingsOpen
          ? 'grow'
          : displayMode === 'preview'
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
              <span class="text-sm">
                {compilerFirstVisit
                  ? 'Chargement du compilateur Typst (première visite, ~30 Mo)…'
                  : 'Chargement du compilateur Typst…'}
              </span>
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
            <div class="typst-svg-container relative mx-auto">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html svgContent}
              {#if showOverlay && overlayWidgets.length > 0}
                <TypstLayoutOverlay
                  widgets={overlayWidgets}
                  layoutValues={tasksLayoutValues}
                  insertions={insertionValues}
                  header={headerValues}
                  {documentColumns}
                  {questionCounts}
                  {figureZoomValues}
                  {figureAlignValues}
                  codeOverrides={codeOverrideValues}
                  exerciseCount={exercises.length}
                  {mergedExercises}
                  mergeExercisesEnabled={!documentOptions.mergeExercises}
                  onAdjustColumns={adjustColumns}
                  onAdjustGutter={adjustGutter}
                  onAdjustFigureZoom={adjustFigureZoom}
                  onSetFigureAlign={setFigureAlign}
                  onInsert={insertAfterExercise}
                  onUpdateInsertion={updateInsertion}
                  onDeleteInsertion={deleteInsertion}
                  onUpdateHeader={updateHeaderValue}
                  onChangeQuestionCount={changeQuestionCount}
                  onDeleteExercise={deleteExercise}
                  onMoveExercise={moveExercise}
                  onNewData={newDataForExercise}
                  onOpenSettings={openSettings}
                  onEditCode={openCodeEdit}
                  onToggleMergeBefore={toggleMergeBefore}
                />
              {/if}
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

  {#if settingsExerciseIndex !== null && settingsExercise != null}
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      on:click|self={() => (settingsExerciseIndex = null)}
    >
      <div
        class="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg shadow-xl bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        {#key settingsExerciseIndex}
          <Settings
            exercice={settingsExercise}
            exerciceIndex={settingsExerciseIndex}
            inModal={true}
            on:settings={(event) => {
              if (settingsExerciseIndex !== null) {
                applyNewSettings(settingsExerciseIndex, event.detail)
              }
            }}
            on:clickSettings={() => (settingsExerciseIndex = null)}
          />
        {/key}
      </div>
    </div>
  {/if}

  {#if codeEditNum !== null}
    {@const num = codeEditNum}
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      on:click|self={() => (codeEditNum = null)}
    >
      <div
        class="relative flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-coopmaths-canvas-dark p-4 shadow-xl dark:bg-coopmathsdark-canvas-dark"
      >
        <h2 class="text-base font-semibold">
          Code Typst de l'exercice {num}
        </h2>
        <p class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus">
          Modifiez le code ci-dessous : il remplacera l'énoncé généré de cet
          exercice (QR-code et numérotation continue des questions désactivés
          pour lui). Videz le champ pour revenir à l'énoncé généré
          automatiquement.
        </p>
        <textarea
          class="h-64 w-full rounded border border-gray-300 p-2 font-mono text-xs"
          bind:value={codeEditDraft}
          on:keydown={(e) => {
            if (e.key === 'Escape') codeEditNum = null
          }}
        ></textarea>
        <div class="flex justify-between gap-2">
          <button
            type="button"
            class="px-3 py-1 hover:text-coopmaths-action"
            on:click={() => restoreGeneratedCode(num)}
          >
            Restaurer le code d'origine
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1 hover:text-coopmaths-action"
              on:click={() => (codeEditNum = null)}
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded bg-coopmaths-action px-3 py-1 text-white"
              on:click={() => updateExerciseCode(num, codeEditDraft)}
            >
              Enregistrer
            </button>
          </div>
        </div>
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
