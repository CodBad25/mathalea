<script lang="ts">
  import seedrandom from 'seedrandom'
  import { onDestroy, onMount, tick } from 'svelte'
  import { get } from 'svelte/store'
  import ExerciceSimple from '../../../exercices/ExerciceSimple'
  import { buildExercisesList } from '../../../lib/components/exercisesUtils'
  import {
    mathaleaFormatExercice,
    mathaleaHandleExerciceSimple,
    mathaleaHandleSup,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import { mathaleaGoToView } from '../../../lib/mathaleaUtils'
  import {
    a4ParamStore,
    darkMode,
    exercicesParams,
  } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import { isLocalStorageAvailable } from '../../../lib/stores/storage'
  import type { IExercice, InterfaceParams } from '../../../lib/types'
  import Settings from '../../shared/exercice/exerciceMathalea/exerciceMathaleaVueProf/presentationalComponents/Settings.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import { decodeBase64, encodeBase64 } from '../latex/LatexConfig'
  import A4EditUnitModal from './A4EditUnitModal.svelte'
  import A4Unit from './A4Unit.svelte'
  import { paginate } from './paginate'
  import {
    defaultA4Options,
    type A4ExerciseOverrides,
    type A4Options,
    type A4Section,
    type A4UnitData,
  } from './types'

  const MM_TO_PX = 96 / 25.4
  /** Dimensions (mm) en portrait, par format de page */
  const PAGE_SIZES_MM: Record<A4Options['pageFormat'], [number, number]> = {
    A4: [210, 297],
    A5: [148, 210],
  }
  const COLUMN_GAP_MM = 6
  const FOOTER_MM = 8
  const HEADER_GAP_MM = 4
  const STORAGE_KEY = 'mathaleaA4View'
  const DEFAULT_TITLE = "Fiche d'exercices"
  const DEFAULT_HEADER_LINE =
    'Nom : ______________________    Prénom : ______________________    Classe : ______'
  /** Padding de base (em) sous chaque question, multiplié par l'espacement choisi */
  const QUESTION_PADDING_EM = 0.55

  let options: A4Options = { ...defaultA4Options }
  let docTitle = DEFAULT_TITLE
  let headerLine = DEFAULT_HEADER_LINE
  /** Indices des exercices avant lesquels un saut de colonne est imposé */
  let breaksBefore: number[] = []
  /** Blocs de texte libres insérés au-dessus d'un exercice (source `$...$`) */
  let textBlocksBefore: Record<number, string> = {}
  /** Réglages A4 propres à chaque exercice (zoom des figures, espacement...) */
  let exOverrides: Record<number, A4ExerciseOverrides> = {}
  /**
   * Énoncés personnalisés par le professeur, indexés par id d'unité
   * (donc par version de sujet). La valeur est la source de l'unité :
   * HTML avec les formules en `$...$`.
   */
  let customContent: Record<string, string> = {}

  // Les préférences génériques (localStorage) servent de valeurs par défaut,
  // puis l'URL (a4Param) — qui décrit LA fiche courante — a le dernier mot.
  if (isLocalStorageAvailable()) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const parsed = JSON.parse(saved)
        options = { ...options, ...(parsed.options ?? {}) }
        if (typeof parsed.docTitle === 'string') docTitle = parsed.docTitle
        if (typeof parsed.headerLine === 'string') {
          headerLine = parsed.headerLine
        }
      }
    } catch {
      // paramètres sauvegardés illisibles : on garde les valeurs par défaut
    }
  }
  const urlParam = new URL(window.location.href).searchParams.get('a4Param')
  if (urlParam != null) {
    a4ParamStore.set(urlParam)
    const parsed = decodeBase64(urlParam)
    options = { ...options, ...(parsed.options ?? {}) }
    if (typeof parsed.docTitle === 'string') docTitle = parsed.docTitle
    if (typeof parsed.headerLine === 'string') headerLine = parsed.headerLine
    if (Array.isArray(parsed.breaksBefore)) {
      breaksBefore = parsed.breaksBefore
    } else if (Array.isArray(parsed.breaksAfterExercise)) {
      // ancien format : saut APRÈS l'exercice k = saut AVANT l'exercice k+1
      breaksBefore = parsed.breaksAfterExercise.map((k: number) => k + 1)
    }
    if (
      parsed.textBlocksBefore != null &&
      typeof parsed.textBlocksBefore === 'object'
    ) {
      textBlocksBefore = parsed.textBlocksBefore
    }
    if (parsed.exOverrides != null && typeof parsed.exOverrides === 'object') {
      exOverrides = parsed.exOverrides
    }
    if (
      parsed.customContent != null &&
      typeof parsed.customContent === 'object'
    ) {
      customContent = parsed.customContent
    }
  }

  let exercises: (IExercice | null)[] = []
  /**
   * Sections du document : une par version du sujet (Sujet A, B...) puis,
   * si le corrigé est activé, une par corrigé de version. Chaque section a
   * ses propres pages et sa numérotation qui recommence à 1.
   * Les pages contiennent les objets unités eux-mêmes (et non des indices)
   * pour que la mise à jour soit atomique : entre la reconstruction des
   * unités et la fin de la mesure, l'aperçu continue d'afficher l'ancienne
   * pagination cohérente.
   */
  let sections: A4Section[] = []
  /**
   * Le DOM des pages est entièrement reconstruit ({#key}) quand la pagination
   * change : la réconciliation fine de Svelte sur les each imbriqués n'ajuste
   * pas de manière fiable le nombre de pages/colonnes après les mutations
   * DOM opérées par KaTeX.
   */
  let layoutVersion = 0
  let lastLayoutSignature = ''
  /** Incrémenté à chaque reconstruction du contenu des unités */
  let unitsVersion = 0
  /** Incrémenté pour réinitialiser les champs contenteditable de l'en-tête */
  let headerVersion = 0
  let isLoading = true
  let isGeneratingPdf = false
  let hoveredExercise: number | null = null
  let hoveredColumnKey: string | null = null
  let settingsExerciseIndex: number | null = null
  /** Cible de la modale d'édition MathLive : énoncé d'une unité ou bloc de texte */
  let editing:
    | { type: 'unit'; unit: A4UnitData }
    | { type: 'textblock'; exerciseIndex: number }
    | null = null
  /** Exercice dont le menu « + » (insertion) est ouvert */
  let insertMenuExercise: number | null = null
  /** Modale des réglages de la page (roue dentée) */
  let isPageSettingsOpen = false

  let galleyEl: HTMLDivElement
  let galleySubjectHeaderEl: HTMLDivElement
  let galleyCorrectionHeaderEl: HTMLDivElement
  let pagesEl: HTMLDivElement
  let previewAreaEl: HTMLDivElement
  /** Espace disponible (px) pour la page dans la zone d'aperçu, hors zoom */
  let previewWidthPx = 0
  let previewHeightPx = 0

  $: settingsExercise =
    settingsExerciseIndex !== null
      ? (exercises[settingsExerciseIndex] ?? null)
      : null
  $: [portraitWidthMm, portraitHeightMm] = PAGE_SIZES_MM[options.pageFormat]
  $: PAGE_WIDTH_MM =
    options.orientation === 'landscape' ? portraitHeightMm : portraitWidthMm
  $: PAGE_HEIGHT_MM =
    options.orientation === 'landscape' ? portraitWidthMm : portraitHeightMm
  $: PAGE_WIDTH_PX = PAGE_WIDTH_MM * MM_TO_PX
  $: PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX
  $: contentWidthMm = PAGE_WIDTH_MM - 2 * options.marginHMm
  $: columnWidthMm =
    (contentWidthMm - (options.columns - 1) * COLUMN_GAP_MM) / options.columns

  /** Zoom (%) réellement appliqué : fixe, ou calculé pour adapter la page */
  $: computedZoomPercent =
    options.zoomMode === 'fixed'
      ? options.zoom
      : (() => {
          const widthRatio =
            previewWidthPx > 0
              ? (previewWidthPx / PAGE_WIDTH_PX) * 100
              : options.zoom
          if (options.zoomMode === 'width') return widthRatio
          const heightRatio =
            previewHeightPx > 0
              ? (previewHeightPx / PAGE_HEIGHT_PX) * 100
              : widthRatio
          return Math.min(widthRatio, heightRatio)
        })()
  /** Valeur du <select> de zoom : le pourcentage fixe, ou le mode d'adaptation */
  $: zoomSelectValue =
    options.zoomMode === 'fixed' ? String(options.zoom) : options.zoomMode
  $: if (!isLoading && previewAreaEl != null) measurePreviewArea()

  const versionLetter = (version: number) => String.fromCharCode(65 + version)

  /** (Re)construit les exercices à partir du store exercicesParams */
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
    await refreshLayout(true)
  }

  /**
   * Mesure l'espace disponible (hors zoom) dans la zone d'aperçu, pour les
   * modes d'adaptation automatique (largeur / page entière).
   */
  function measurePreviewArea() {
    if (previewAreaEl == null) return
    const rect = previewAreaEl.getBoundingClientRect()
    const style = getComputedStyle(previewAreaEl)
    const paddingX =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const paddingTop = parseFloat(style.paddingTop)
    const paddingBottom = parseFloat(style.paddingBottom)
    previewWidthPx = previewAreaEl.clientWidth - paddingX
    previewHeightPx = window.innerHeight - rect.top - paddingTop - paddingBottom
  }

  onMount(() => {
    loadExercises()
    window.addEventListener('resize', measurePreviewArea)
    return () => window.removeEventListener('resize', measurePreviewArea)
  })

  onDestroy(() => {
    clearTimeout(refreshTimer)
    for (const exercise of exercises) {
      if (exercise == null) continue
      exercise.reinit?.()
      exercise.destroy?.()
    }
  })

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
    if (exercise.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(exercise, false, k)
    } else if (typeof exercise.nouvelleVersionWrapper === 'function') {
      exercise.nouvelleVersionWrapper(k)
    }
  }

  /** Unités du sujet (énoncés) pour l'état courant des exercices */
  function buildUnits(idPrefix: string): A4UnitData[] {
    const list: A4UnitData[] = []
    for (const [k, exercise] of exercises.entries()) {
      const overrides = exOverrides[k] ?? {}
      const svgZoom = overrides.svgZoom ?? 1
      const textBlock = textBlocksBefore[k]
      if (textBlock != null) {
        list.push({
          id: `${idPrefix}${k}-textblock`,
          exerciseIndex: k,
          kind: 'textblock',
          html: textBlock,
          source: textBlock,
        })
      }
      if (exercise == null) {
        list.push({
          id: `${idPrefix}${k}-warning`,
          exerciseIndex: k,
          kind: 'warning',
          html: "Cet exercice n'a pas pu être chargé : il n'est pas pris en charge par l'impression A4.",
        })
        continue
      }
      if (options.showExerciseTitles) {
        list.push({
          id: `${idPrefix}${k}-title`,
          exerciseIndex: k,
          kind: 'title',
          html: `${options.exerciseLabel} ${k + 1}`,
        })
      }
      if (
        exercise.typeExercice != null &&
        exercise.typeExercice.includes('html')
      ) {
        list.push({
          id: `${idPrefix}${k}-warning`,
          exerciseIndex: k,
          kind: 'warning',
          html: `${exercise.titre} : cet exercice n'existe qu'en version interactive, il ne peut pas être imprimé.`,
        })
        continue
      }
      const intro = [exercise.consigne, exercise.introduction]
        .filter((text) => text != null && text.length > 0)
        .join('<br>')
      if (intro.length > 0) {
        const introId = `${idPrefix}${k}-intro`
        const introSource =
          customContent[introId] ?? mathaleaFormatExercice(intro)
        list.push({
          id: introId,
          exerciseIndex: k,
          kind: 'intro',
          html: introSource,
          source: introSource,
          svgZoom,
        })
      }
      const questions = exercise.listeQuestions ?? []
      const numbered =
        questions.length > 1 && exercise.listeAvecNumerotation !== false
      const paddingEm = QUESTION_PADDING_EM * (overrides.spacing ?? 1)
      for (const [i, question] of questions.entries()) {
        const questionId = `${idPrefix}${k}-q-${i}`
        const questionSource =
          customContent[questionId] ??
          mathaleaFormatExercice(question).replaceAll('{zoomFactor}', '1')
        let html = questionSource
        if (numbered) {
          html = `<span class="a4-question-number">${i + 1}.</span> ${html}`
        }
        list.push({
          id: questionId,
          exerciseIndex: k,
          kind: 'question',
          html,
          source: questionSource,
          style: `line-height: ${exercise.spacing || 1.4}; padding-bottom: ${paddingEm}em;`,
          svgZoom,
        })
      }
    }
    return list
  }

  /** Unités du corrigé pour l'état courant des exercices */
  function buildCorrectionUnits(idPrefix: string): A4UnitData[] {
    const list: A4UnitData[] = []
    for (const [k, exercise] of exercises.entries()) {
      if (exercise == null) continue
      if (
        exercise.typeExercice != null &&
        exercise.typeExercice.includes('html')
      ) {
        continue
      }
      const corrections = exercise.listeCorrections ?? []
      if (corrections.length === 0) continue
      const overrides = exOverrides[k] ?? {}
      const svgZoom = overrides.svgZoom ?? 1
      // Le titre est toujours affiché dans le corrigé pour identifier l'exercice
      list.push({
        id: `${idPrefix}${k}-title`,
        exerciseIndex: k,
        kind: 'title',
        html: `${options.exerciseLabel} ${k + 1}`,
      })
      if (
        exercise.consigneCorrection != null &&
        exercise.consigneCorrection.length > 0
      ) {
        const introId = `${idPrefix}${k}-intro`
        const introSource =
          customContent[introId] ??
          mathaleaFormatExercice(exercise.consigneCorrection)
        list.push({
          id: introId,
          exerciseIndex: k,
          kind: 'intro',
          html: introSource,
          source: introSource,
          svgZoom,
        })
      }
      const numbered =
        corrections.length > 1 && exercise.listeAvecNumerotation !== false
      for (const [i, correction] of corrections.entries()) {
        const correctionId = `${idPrefix}${k}-q-${i}`
        const correctionSource =
          customContent[correctionId] ??
          mathaleaFormatExercice(correction).replaceAll('{zoomFactor}', '1')
        let html = correctionSource
        if (numbered) {
          html = `<span class="a4-question-number">${i + 1}.</span> ${html}`
        }
        list.push({
          id: correctionId,
          exerciseIndex: k,
          kind: 'question',
          html,
          source: correctionSource,
          style: `line-height: ${exercise.spacingCorr || 1.4}; padding-bottom: ${QUESTION_PADDING_EM}em;`,
          svgZoom,
        })
      }
    }
    return list
  }

  function boundaryUnitIdsOf(units: A4UnitData[]): {
    first: Record<number, string>
    last: Record<number, string>
  } {
    const first: Record<number, string> = {}
    const last: Record<number, string> = {}
    for (const unit of units) {
      if (first[unit.exerciseIndex] === undefined) {
        first[unit.exerciseIndex] = unit.id
      }
      last[unit.exerciseIndex] = unit.id
    }
    return { first, last }
  }

  /**
   * Construit toutes les sections : chaque version du sujet est générée avec
   * une graine dérivée de la graine de base (Sujet A = graine de l'URL,
   * Sujet B = graine + « V1 »...), et son corrigé est capturé dans la même
   * passe pour correspondre aux mêmes données.
   */
  function buildSections(): A4Section[] {
    // Graine de base de chaque exercice : celle visible dans l'URL et les réglages
    const baseSeeds: (string | undefined)[] = exercises.map((exercise, k) => {
      if (exercise == null) return undefined
      if (
        exercise.seed === undefined &&
        typeof exercise.applyNewSeed === 'function'
      ) {
        exercise.applyNewSeed()
      }
      const params = get(exercicesParams)[k]
      if (
        params != null &&
        exercise.seed !== undefined &&
        params.alea !== exercise.seed
      ) {
        params.alea = exercise.seed
      }
      return exercise.seed
    })
    exercicesParams.update((list) => list)

    const subjectSections: A4Section[] = []
    const correctionSections: A4Section[] = []
    for (let version = 0; version < options.nbVersions; version++) {
      for (const [k, exercise] of exercises.entries()) {
        if (exercise == null) continue
        const base = baseSeeds[k]
        exercise.seed =
          version === 0 || base === undefined ? base : `${base}V${version}`
        regenerate(k)
      }
      const units = buildUnits(`v${version}-`)
      const boundaries = boundaryUnitIdsOf(units)
      subjectSections.push({
        kind: 'subject',
        version,
        units,
        pages: [],
        firstUnitIds: boundaries.first,
        lastUnitIds: boundaries.last,
      })
      if (options.showCorrection) {
        const correctionUnits = buildCorrectionUnits(`c${version}-`)
        correctionSections.push({
          kind: 'correction',
          version,
          units: correctionUnits,
          pages: [],
          firstUnitIds: {},
          lastUnitIds: {},
        })
      }
    }
    // On restaure la graine de base : c'est elle que montrent les réglages
    for (const [k, exercise] of exercises.entries()) {
      if (exercise != null) exercise.seed = baseSeeds[k]
    }
    return [...subjectSections, ...correctionSections].filter(
      (section) => section.kind === 'subject' || section.units.length > 0,
    )
  }

  function waitForImages(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img')).filter(
      (img) => !img.complete,
    )
    if (images.length === 0) return Promise.resolve()
    return new Promise((resolve) => {
      let remaining = images.length
      const timer = setTimeout(resolve, 3000)
      const done = () => {
        remaining--
        if (remaining <= 0) {
          clearTimeout(timer)
          resolve()
        }
      }
      for (const img of images) {
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
      }
    })
  }

  /**
   * Pipeline de mise en page : rendu des unités dans la galée cachée,
   * mesure des hauteurs puis répartition en pages/colonnes, section par section.
   */
  let layoutToken = 0
  async function refreshLayout(rebuildUnits = false) {
    const token = ++layoutToken
    if (rebuildUnits) {
      sections = buildSections()
      unitsVersion++
    }
    await tick()
    if (token !== layoutToken || galleyEl == null) return
    // KaTeX et scratch sont rendus par A4Unit lui-même (action setHtml) :
    // au tick suivant la reconstruction, la galée est déjà complètement rendue.
    try {
      await document.fonts.ready
    } catch {
      // API non disponible : on mesure sans attendre les polices
    }
    await waitForImages(galleyEl)
    if (token !== layoutToken || galleyEl == null) return
    // Mesures groupées par section (la galée les rend dans l'ordre)
    const heightsBySection: number[][] = sections.map(() => [])
    for (const el of galleyEl.querySelectorAll<HTMLElement>('[data-unit]')) {
      const sectionIndex = Number(el.dataset.section)
      heightsBySection[sectionIndex]?.push(el.offsetHeight)
    }
    const columnHeightPx =
      (PAGE_HEIGHT_MM -
        2 * options.marginVMm -
        (options.showFooter ? FOOTER_MM : 0)) *
      MM_TO_PX
    const subjectHeaderPx =
      galleySubjectHeaderEl != null
        ? galleySubjectHeaderEl.offsetHeight + HEADER_GAP_MM * MM_TO_PX
        : 0
    const correctionHeaderPx =
      galleyCorrectionHeaderEl != null
        ? galleyCorrectionHeaderEl.offsetHeight + HEADER_GAP_MM * MM_TO_PX
        : 0
    const layouts = sections.map((section, sectionIndex) => {
      // Sauts de colonne forcés : avant la première unité des exercices
      // marqués (bloc de texte compris), uniquement dans les sujets
      const forcedBreaks = new Set<number>()
      if (section.kind === 'subject') {
        for (const [index, unit] of section.units.entries()) {
          if (
            index > 0 &&
            breaksBefore.includes(unit.exerciseIndex) &&
            unit.id === section.firstUnitIds[unit.exerciseIndex]
          ) {
            forcedBreaks.add(index - 1)
          }
        }
      }
      const headerPx =
        section.kind === 'subject' ? subjectHeaderPx : correctionHeaderPx
      return paginate(
        section.units,
        heightsBySection[sectionIndex],
        columnHeightPx - headerPx,
        columnHeightPx,
        options.columns,
        forcedBreaks,
      )
    })
    // Signature de la mise en page : si elle n'a pas changé (et que le contenu
    // n'a pas été reconstruit), on ne touche pas au DOM des pages, ce qui
    // préserve notamment le focus dans l'en-tête éditable.
    const signature = JSON.stringify(layouts) + '|' + unitsVersion
    if (signature !== lastLayoutSignature) {
      lastLayoutSignature = signature
      sections = sections.map((section, sectionIndex) => ({
        ...section,
        pages: layouts[sectionIndex].map((page) =>
          page.map((column) =>
            column.map((unitIndex) => section.units[unitIndex]),
          ),
        ),
      }))
      layoutVersion++
    }
    persist()
  }

  let refreshTimer: ReturnType<typeof setTimeout>
  function scheduleRefresh(rebuildUnits = false, delay = 300) {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      refreshLayout(rebuildUnits)
    }, delay)
  }

  function persist() {
    // localStorage : préférences par défaut pour les prochaines fiches
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ options, docTitle, headerLine }),
        )
      } catch {
        // stockage plein ou indisponible : sans conséquence
      }
    }
    // URL : tous les réglages de la fiche courante (partageables).
    // Le store est la source de vérité ; on redéclenche ensuite l'écrivain
    // d'URL de l'app pour que sa prochaine écriture (débouncée) reparte de
    // cette valeur et n'écrase pas l'URL avec un instantané périmé.
    const encoded = encodeBase64({
      options,
      docTitle,
      headerLine,
      breaksBefore,
      textBlocksBefore,
      exOverrides,
      customContent,
    })
    a4ParamStore.set(encoded)
    mathaleaUpdateUrlFromExercicesParams()
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('a4Param', encoded)
      history.replaceState(null, '', url)
    } catch {
      // URL non modifiable (iframe sandboxée...) : sans conséquence
    }
  }

  /** Initialise le contenu d'un champ contenteditable sans le rendre réactif
   * (pour ne pas perdre le focus et la position du curseur pendant la saisie) */
  function initEditable(node: HTMLElement, value: string) {
    node.textContent = value
    return {
      update() {
        // volontairement vide : le contenu appartient à l'utilisateur
      },
    }
  }

  function onTitleInput(event: Event) {
    docTitle = (event.currentTarget as HTMLElement).textContent ?? ''
    scheduleRefresh(false, 500)
  }

  function onHeaderLineInput(event: Event) {
    headerLine = (event.currentTarget as HTMLElement).textContent ?? ''
    scheduleRefresh(false, 500)
  }

  /** Choix dans le <select> de zoom : pourcentage fixe ou mode d'adaptation */
  function onZoomSelectChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value
    if (value === 'width' || value === 'page') {
      options.zoomMode = value
    } else {
      options.zoomMode = 'fixed'
      options.zoom = Number(value)
    }
    measurePreviewArea()
    persist()
  }

  /** Réinitialise tous les réglages de la modale « Réglages de la page » */
  function resetPageSettings() {
    options = {
      ...options,
      pageFormat: defaultA4Options.pageFormat,
      orientation: defaultA4Options.orientation,
      showHeader: defaultA4Options.showHeader,
      showFooter: defaultA4Options.showFooter,
      showExerciseTitles: defaultA4Options.showExerciseTitles,
      exerciseLabel: defaultA4Options.exerciseLabel,
      marginHMm: defaultA4Options.marginHMm,
      marginVMm: defaultA4Options.marginVMm,
    }
    docTitle = DEFAULT_TITLE
    headerLine = DEFAULT_HEADER_LINE
    headerVersion++ // force la recréation des champs contenteditable
    scheduleRefresh(true, 0)
  }

  /** Applique les réglages émis par le panneau Settings de la vue prof */
  function applyNewSettings(k: number, detail: Record<string, unknown>) {
    const exercise = exercises[k]
    const params = get(exercicesParams)[k]
    if (exercise == null || params == null) return
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
    clearCustomContentFor(k)
    refreshLayout(true)
  }

  /** Ouvre l'éditeur (MathLive) pour une unité modifiable */
  function openEditor(unit: A4UnitData) {
    if (unit.source == null) return
    editing =
      unit.kind === 'textblock'
        ? { type: 'textblock', exerciseIndex: unit.exerciseIndex }
        : { type: 'unit', unit }
  }

  function saveEditing(newSource: string) {
    if (editing == null) return
    if (editing.type === 'unit') {
      customContent = { ...customContent, [editing.unit.id]: newSource }
    } else if (newSource.trim().length > 0) {
      textBlocksBefore = {
        ...textBlocksBefore,
        [editing.exerciseIndex]: newSource,
      }
    } else {
      // un bloc de texte vide n'a pas de raison d'exister
      deleteTextBlock(editing.exerciseIndex)
      return
    }
    editing = null
    refreshLayout(true)
  }

  function restoreCustomContent() {
    if (editing?.type !== 'unit') return
    const next = { ...customContent }
    delete next[editing.unit.id]
    customContent = next
    editing = null
    refreshLayout(true)
  }

  function deleteTextBlock(k: number) {
    const next = { ...textBlocksBefore }
    delete next[k]
    textBlocksBefore = next
    editing = null
    refreshLayout(true)
  }

  /** Menu « + » au-dessus d'un exercice */
  function toggleInsertMenu(k: number) {
    insertMenuExercise = insertMenuExercise === k ? null : k
  }

  function insertTextBlockAbove(k: number) {
    insertMenuExercise = null
    editing = { type: 'textblock', exerciseIndex: k }
  }

  function toggleBreakBefore(k: number) {
    insertMenuExercise = null
    breaksBefore = breaksBefore.includes(k)
      ? breaksBefore.filter((i) => i !== k)
      : [...breaksBefore, k]
    refreshLayout(false)
  }

  /**
   * Oublie les énoncés personnalisés d'un exercice : quand son contenu est
   * regénéré (nouvelles données, changement de réglages), le texte d'origine
   * qui avait été modifié n'existe plus.
   */
  function clearCustomContentFor(k: number) {
    const pattern = new RegExp(`^[vc]\\d+-${k}-`)
    const next: Record<string, string> = {}
    let changed = false
    for (const [key, value] of Object.entries(customContent)) {
      if (pattern.test(key)) changed = true
      else next[key] = value
    }
    if (changed) customContent = next
  }

  /** Réindexe les énoncés personnalisés après réordonnancement/suppression */
  function remapCustomContent(
    mapIndex: (index: number) => number | null,
  ): void {
    const next: Record<string, string> = {}
    for (const [key, value] of Object.entries(customContent)) {
      const match = key.match(/^([vc]\d+)-(\d+)-(.+)$/)
      if (match == null) continue
      const mapped = mapIndex(Number(match[2]))
      if (mapped == null) continue
      next[`${match[1]}-${mapped}-${match[3]}`] = value
    }
    customContent = next
  }

  /** Réglages propres à la vue A4 (zoom des figures, espacement des questions) */
  function applyA4Overrides(k: number, patch: A4ExerciseOverrides) {
    const current = exOverrides[k] ?? {}
    exOverrides = { ...exOverrides, [k]: { ...current, ...patch } }
    // Refresh différé (macrotâche) : lancé directement, le re-rendu complet
    // des unités bloquerait le mouseup du spinner assez longtemps pour que
    // son auto-répétition native (500 ms) ajoute un second incrément.
    scheduleRefresh(true, 0)
  }

  /** Nouvelle graine pour l'exercice d'indice k (sans rafraîchir) */
  function applyNewSeedTo(k: number) {
    const exercise = exercises[k]
    if (exercise == null) return
    exercise.seed = undefined
    if (typeof exercise.applyNewSeed === 'function') exercise.applyNewSeed()
    const params = get(exercicesParams)[k]
    if (params != null && exercise.seed !== undefined) {
      params.alea = exercise.seed
    }
    clearCustomContentFor(k)
  }

  /** Nouvelles données aléatoires pour l'exercice d'indice k */
  function newData(k: number) {
    applyNewSeedTo(k)
    exercicesParams.update((list) => list)
    refreshLayout(true)
  }

  /** Nouvelles données aléatoires pour tous les exercices de la fiche */
  function newDataForAll() {
    for (const k of exercises.keys()) applyNewSeedTo(k)
    exercicesParams.update((list) => list)
    refreshLayout(true)
  }

  /** Réindexe un enregistrement indexé par numéro d'exercice */
  function remapNumericRecord<T>(
    record: Record<number, T>,
    mapIndex: (index: number) => number | null,
  ): Record<number, T> {
    const next: Record<number, T> = {}
    for (const [key, value] of Object.entries(record)) {
      const mapped = mapIndex(Number(key))
      if (mapped != null) next[mapped] = value
    }
    return next
  }

  function moveExercise(k: number, delta: -1 | 1) {
    const target = k + delta
    if (target < 0 || target >= exercises.length) return
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
    // Les réglages, blocs de texte et sauts suivent leur exercice
    const swap = (i: number) => (i === k ? target : i === target ? k : i)
    exOverrides = remapNumericRecord(exOverrides, swap)
    textBlocksBefore = remapNumericRecord(textBlocksBefore, swap)
    breaksBefore = breaksBefore.map(swap)
    remapCustomContent(swap)
    hoveredExercise = null
    insertMenuExercise = null
    refreshLayout(true)
  }

  function removeExercise(k: number) {
    const exercise = exercises[k]
    exercise?.reinit?.()
    exercise?.destroy?.()
    exercises = exercises.filter((_, index) => index !== k)
    exercicesParams.update((list) => list.filter((_, index) => index !== k))
    // Décalage des réglages, blocs de texte et sauts
    const shift = (i: number) => (i === k ? null : i > k ? i - 1 : i)
    exOverrides = remapNumericRecord(exOverrides, shift)
    textBlocksBefore = remapNumericRecord(textBlocksBefore, shift)
    breaksBefore = breaksBefore
      .filter((i) => i !== k)
      .map((i) => (i > k ? i - 1 : i))
    remapCustomContent(shift)
    hoveredExercise = null
    insertMenuExercise = null
    settingsExerciseIndex = null
    refreshLayout(true)
  }

  /**
   * Export PDF côté navigateur : chaque page A4 est capturée en image
   * (modern-screenshot, rendu natif via SVG foreignObject — contrairement à
   * html2canvas qui redessinait le CSS et plaçait mal les traits de fraction
   * KaTeX) puis insérée dans un PDF (jsPDF). Import dynamique pour ne pas
   * alourdir le bundle des autres vues.
   */
  async function downloadPdf() {
    if (isGeneratingPdf || pagesEl == null) return
    isGeneratingPdf = true
    hoveredExercise = null
    hoveredColumnKey = null
    try {
      await tick()
      const [{ domToCanvas }, { jsPDF }] = await Promise.all([
        import('modern-screenshot'),
        import('jspdf'),
      ])
      const pageEls = Array.from(
        pagesEl.querySelectorAll<HTMLElement>('.a4-page'),
      )
      const pdf = new jsPDF({
        unit: 'mm',
        format: options.pageFormat.toLowerCase(),
        orientation: options.orientation,
        compress: true,
      })
      for (const [index, pageEl] of pageEls.entries()) {
        const canvas = await domToCanvas(pageEl, {
          scale: 3,
          backgroundColor: '#ffffff',
        })
        if (index > 0) pdf.addPage()
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.92),
          'JPEG',
          0,
          0,
          PAGE_WIDTH_MM,
          PAGE_HEIGHT_MM,
        )
      }
      pdf.save(`${exportFilename()}.pdf`)
    } catch (error) {
      console.error("Erreur lors de l'export PDF", error)
    } finally {
      isGeneratingPdf = false
    }
  }

  /** Nom de fichier dérivé du titre de la fiche (PDF et JSON) */
  function exportFilename() {
    return (
      docTitle
        .trim()
        .replace(/[^\p{L}\p{N} _-]/gu, '')
        .replace(/\s+/g, '_') || 'fiche-a4'
    )
  }

  /**
   * Sauvegarde JSON autonome de la fiche : liste des exercices (uuid,
   * graines, réglages) et tout l'état propre à la vue A4, y compris les
   * énoncés modifiés. Rechargeable via le bouton voisin.
   */
  function exportJson() {
    const data = {
      format: 'mathalea-a4',
      version: 1,
      exercicesParams: get(exercicesParams),
      options,
      docTitle,
      headerLine,
      breaksBefore,
      textBlocksBefore,
      exOverrides,
      customContent,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportFilename()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  let importInputEl: HTMLInputElement

  async function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = '' // permet de recharger deux fois de suite le même fichier
    if (file == null) return
    try {
      const parsed = JSON.parse(await file.text())
      if (
        parsed?.format !== 'mathalea-a4' ||
        !Array.isArray(parsed.exercicesParams)
      ) {
        throw new Error('format de fiche A4 inattendu')
      }
      await applyImportedSheet(parsed)
    } catch (error) {
      console.error('Fichier de fiche A4 illisible', error)
      window.alert("Ce fichier n'est pas une fiche A4 MathALÉA valide.")
    }
  }

  /** Remplace toute la fiche courante par celle du fichier importé */
  async function applyImportedSheet(parsed: Record<string, unknown>) {
    clearTimeout(refreshTimer)
    editing = null
    settingsExerciseIndex = null
    isPageSettingsOpen = false
    clearHover()
    for (const exercise of exercises) {
      exercise?.reinit?.()
      exercise?.destroy?.()
    }
    exercises = []
    options = { ...defaultA4Options, ...((parsed.options as object) ?? {}) }
    docTitle =
      typeof parsed.docTitle === 'string' ? parsed.docTitle : DEFAULT_TITLE
    headerLine =
      typeof parsed.headerLine === 'string'
        ? parsed.headerLine
        : DEFAULT_HEADER_LINE
    breaksBefore = Array.isArray(parsed.breaksBefore)
      ? parsed.breaksBefore.filter((k): k is number => typeof k === 'number')
      : []
    textBlocksBefore =
      parsed.textBlocksBefore != null &&
      typeof parsed.textBlocksBefore === 'object'
        ? (parsed.textBlocksBefore as Record<number, string>)
        : {}
    exOverrides =
      parsed.exOverrides != null && typeof parsed.exOverrides === 'object'
        ? (parsed.exOverrides as Record<number, A4ExerciseOverrides>)
        : {}
    customContent =
      parsed.customContent != null && typeof parsed.customContent === 'object'
        ? (parsed.customContent as Record<string, string>)
        : {}
    headerVersion++ // recrée les champs contenteditable avec le nouveau texte
    exercicesParams.set(parsed.exercicesParams as InterfaceParams[])
    await loadExercises()
  }

  function handleUnitHover(unit: A4UnitData) {
    hoveredExercise = unit.exerciseIndex
  }

  function clearHover() {
    hoveredExercise = null
    hoveredColumnKey = null
    insertMenuExercise = null
  }
</script>

<svelte:head>
  <title>MathALÉA - Impression A4</title>
  {@html `<style>@page { size: ${PAGE_WIDTH_MM}mm ${PAGE_HEIGHT_MM}mm; margin: 0; }</style>`}
</svelte:head>

<main
  class="a4-view {$darkMode.isActive
    ? 'dark'
    : ''} min-h-screen bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest"
  class:a4-generating={isGeneratingPdf}
>
  <div class="a4-print-hidden bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
    <NavBar
      subtitle="Impression A4"
      subtitleType="export"
      handleLanguage={() => {}}
      locale={$referentielLocale}
    />
    <div
      class="flex flex-row flex-wrap items-center gap-x-6 gap-y-3 px-4 md:px-8 py-3 border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <!-- <button
        type="button"
        class="flex items-center gap-1 text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={() => mathaleaGoToView('')}
      >
        <i class="bx bx-arrow-back text-xl"></i>
        <span class="text-sm">Retour</span>
      </button> -->

      <label class="flex items-center gap-2 text-sm">
        <i class="bx bx-columns text-xl"></i>
        Colonnes
        <select
          class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
          bind:value={options.columns}
          on:change={() => scheduleRefresh(false, 0)}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm">
        <i class="bx bx-font-size text-xl"></i>
        Taille
        <select
          class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
          bind:value={options.fontSizePt}
          on:change={() => scheduleRefresh(false, 0)}
        >
          <option value={9}>9 pt</option>
          <option value={10}>10 pt</option>
          <option value={11}>11 pt</option>
          <option value={12}>12 pt</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm">
        <i class="bx bx-copy text-xl"></i>
        Versions
        <select
          class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
          bind:value={options.nbVersions}
          on:change={() => scheduleRefresh(true, 0)}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          bind:checked={options.showCorrection}
          on:change={() => scheduleRefresh(true, 0)}
        />
        Corrigé
      </label>

      <label class="flex items-center gap-2 text-sm">
        <i class="bx bx-zoom-in text-xl"></i>
        <select
          class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
          value={zoomSelectValue}
          on:change={onZoomSelectChange}
        >
          <option value="50">50 %</option>
          <option value="75">75 %</option>
          <option value="100">100 %</option>
          <option value="130">130 %</option>
          <option value="width">Adapter à la largeur</option>
          <option value="page">Adapter à la page</option>
        </select>
      </label>

      <button
        type="button"
        title="Réglages de la page"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={() => (isPageSettingsOpen = true)}
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
        title="Sauvegarder la fiche (fichier JSON)"
        aria-label="Sauvegarder la fiche (fichier JSON)"
        class="flex items-center text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={exportJson}
      >
        <i class="bx bx-save text-2xl"></i>
      </button>
      <button
        type="button"
        title="Recharger une fiche (fichier JSON)"
        aria-label="Recharger une fiche (fichier JSON)"
        class="flex items-center text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        on:click={() => importInputEl.click()}
      >
        <i class="bx bx-upload text-2xl"></i>
      </button>
      <input
        type="file"
        accept="application/json,.json"
        class="hidden"
        bind:this={importInputEl}
        on:change={importJson}
      />

      <ButtonTextAction
        text={isGeneratingPdf ? 'PDF en cours...' : 'Télécharger le PDF'}
        icon={isGeneratingPdf ? 'bx-loader-alt bx-spin' : 'bx-download'}
        inverted={true}
        class="rounded-lg py-1 px-2 min-w-42.5"
        on:click={downloadPdf}
      />
      <ButtonTextAction
        text="Imprimer"
        icon="bx-printer"
        on:click={() => window.print()}
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
    <div
      class="a4-preview-area overflow-auto px-4 py-6"
      bind:this={previewAreaEl}
    >
      <div
        class="a4-zoom-wrapper"
        style="zoom: {isGeneratingPdf ? 1 : computedZoomPercent / 100}"
      >
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="a4-pages" bind:this={pagesEl} on:mouseleave={clearHover}>
          {#key layoutVersion}
            {#each sections as section, sectionIndex}
              {#each section.pages as pageColumns, pageIndex}
                <section
                  class="a4-page"
                  class:a4-page-correction={section.kind === 'correction'}
                  style="width: {PAGE_WIDTH_MM}mm; height: {PAGE_HEIGHT_MM}mm; padding: {options.marginVMm}mm {options.marginHMm}mm; font-size: {options.fontSizePt}pt;"
                >
                  {#if pageIndex === 0}
                    {#if section.kind === 'subject' && (options.showHeader || options.nbVersions > 1)}
                      <header
                        class="a4-doc-header"
                        style="margin-bottom: {HEADER_GAP_MM}mm;"
                      >
                        {#if options.showHeader}
                          {#if sectionIndex === 0}
                            {#key headerVersion}
                              <div
                                class="a4-doc-title"
                                contenteditable="true"
                                role="textbox"
                                aria-label="Titre de la fiche"
                                spellcheck="false"
                                use:initEditable={docTitle}
                                on:input={onTitleInput}
                              ></div>
                              <div class="a4-doc-meta-row">
                                <div
                                  class="a4-doc-meta"
                                  contenteditable="true"
                                  role="textbox"
                                  aria-label="Ligne d'en-tête (nom, classe...)"
                                  spellcheck="false"
                                  use:initEditable={headerLine}
                                  on:input={onHeaderLineInput}
                                ></div>
                                {#if options.nbVersions > 1}
                                  <div class="a4-doc-version">
                                    Sujet {versionLetter(section.version)}
                                  </div>
                                {/if}
                              </div>
                            {/key}
                          {:else}
                            <div class="a4-doc-title">{docTitle}</div>
                            <div class="a4-doc-meta-row">
                              <div class="a4-doc-meta">{headerLine}</div>
                              {#if options.nbVersions > 1}
                                <div class="a4-doc-version">
                                  Sujet {versionLetter(section.version)}
                                </div>
                              {/if}
                            </div>
                          {/if}
                        {:else if options.nbVersions > 1}
                          <div class="a4-doc-version a4-doc-version-standalone">
                            Sujet {versionLetter(section.version)}
                          </div>
                        {/if}
                      </header>
                    {:else if section.kind === 'correction'}
                      <header
                        class="a4-doc-header"
                        style="margin-bottom: {HEADER_GAP_MM}mm;"
                      >
                        <div class="a4-doc-title">
                          Corrigé{options.nbVersions > 1
                            ? ` — Sujet ${versionLetter(section.version)}`
                            : ''}
                        </div>
                      </header>
                    {/if}
                  {/if}
                  <div class="a4-columns" style="gap: {COLUMN_GAP_MM}mm;">
                    {#each pageColumns as column, columnIndex}
                      <!-- svelte-ignore a11y-no-static-element-interactions -->
                      <div
                        class="a4-column"
                        style="width: {columnWidthMm}mm;"
                        on:mouseenter={() =>
                          (hoveredColumnKey = `${sectionIndex}-${pageIndex}-${columnIndex}`)}
                      >
                        {#each column as unit, unitIndex (unit.id)}
                          {#if section.kind === 'subject' && breaksBefore.includes(unit.exerciseIndex) && unit.id === section.firstUnitIds[unit.exerciseIndex]}
                            <div class="a4-break-marker a4-print-hidden">
                              <span>saut de colonne</span>
                              <button
                                type="button"
                                title="Retirer le saut de colonne"
                                aria-label="Retirer le saut de colonne"
                                on:click={() =>
                                  toggleBreakBefore(unit.exerciseIndex)}
                              >
                                <i class="bx bx-x"></i>
                              </button>
                            </div>
                          {/if}
                          {#if section.kind === 'subject' && unit.kind === 'textblock'}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div
                              class="a4-unit-wrapper a4-textblock-wrapper"
                              title="Double-clic pour modifier le bloc de texte"
                              on:mouseenter={() => handleUnitHover(unit)}
                              on:dblclick={() => openEditor(unit)}
                            >
                              <button
                                type="button"
                                class="a4-textblock-delete a4-print-hidden"
                                title="Supprimer le bloc de texte"
                                aria-label="Supprimer le bloc de texte"
                                on:click={() =>
                                  deleteTextBlock(unit.exerciseIndex)}
                              >
                                <i class="bx bx-x"></i>
                              </button>
                              {#if hoveredExercise === unit.exerciseIndex && hoveredColumnKey === `${sectionIndex}-${pageIndex}-${columnIndex}` && unit.id === section.firstUnitIds[unit.exerciseIndex]}
                                <div class="a4-insert a4-print-hidden">
                                  <button
                                    type="button"
                                    class="a4-insert-plus"
                                    title="Insérer au-dessus"
                                    aria-label="Insérer au-dessus"
                                    on:click|stopPropagation={() =>
                                      toggleInsertMenu(unit.exerciseIndex)}
                                  >
                                    <i class="bx bx-plus"></i>
                                  </button>
                                  {#if insertMenuExercise === unit.exerciseIndex}
                                    <div class="a4-insert-menu">
                                      {#if unit.exerciseIndex > 0}
                                        <button
                                          type="button"
                                          on:click={() =>
                                            toggleBreakBefore(
                                              unit.exerciseIndex,
                                            )}
                                        >
                                          <i class="bx bx-arrow-to-right"></i>
                                          {breaksBefore.includes(
                                            unit.exerciseIndex,
                                          )
                                            ? 'Retirer le saut de colonne'
                                            : 'Saut de colonne'}
                                        </button>
                                      {/if}
                                      <button
                                        type="button"
                                        disabled={textBlocksBefore[
                                          unit.exerciseIndex
                                        ] != null}
                                        on:click={() =>
                                          insertTextBlockAbove(
                                            unit.exerciseIndex,
                                          )}
                                      >
                                        <i class="bx bx-text"></i>
                                        Bloc de texte
                                      </button>
                                    </div>
                                  {/if}
                                </div>
                              {/if}
                              <A4Unit {unit} />
                            </div>
                          {:else if section.kind === 'subject'}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div
                              class="a4-unit-wrapper"
                              class:a4-exo-hovered={hoveredExercise ===
                                unit.exerciseIndex}
                              title={unit.source != null
                                ? "Double-clic pour modifier l'énoncé"
                                : undefined}
                              on:mouseenter={() => handleUnitHover(unit)}
                              on:dblclick={() => openEditor(unit)}
                            >
                              {#if hoveredExercise === unit.exerciseIndex && hoveredColumnKey === `${sectionIndex}-${pageIndex}-${columnIndex}` && unit.id === section.firstUnitIds[unit.exerciseIndex]}
                                <div class="a4-insert a4-print-hidden">
                                  <button
                                    type="button"
                                    class="a4-insert-plus"
                                    title="Insérer au-dessus"
                                    aria-label="Insérer au-dessus"
                                    on:click|stopPropagation={() =>
                                      toggleInsertMenu(unit.exerciseIndex)}
                                  >
                                    <i class="bx bx-plus"></i>
                                  </button>
                                  {#if insertMenuExercise === unit.exerciseIndex}
                                    <div class="a4-insert-menu">
                                      {#if unit.exerciseIndex > 0}
                                        <button
                                          type="button"
                                          on:click={() =>
                                            toggleBreakBefore(
                                              unit.exerciseIndex,
                                            )}
                                        >
                                          <i class="bx bx-arrow-to-right"></i>
                                          {breaksBefore.includes(
                                            unit.exerciseIndex,
                                          )
                                            ? 'Retirer le saut de colonne'
                                            : 'Saut de colonne'}
                                        </button>
                                      {/if}
                                      <button
                                        type="button"
                                        disabled={textBlocksBefore[
                                          unit.exerciseIndex
                                        ] != null}
                                        on:click={() =>
                                          insertTextBlockAbove(
                                            unit.exerciseIndex,
                                          )}
                                      >
                                        <i class="bx bx-text"></i>
                                        Bloc de texte
                                      </button>
                                    </div>
                                  {/if}
                                </div>
                              {/if}
                              {#if hoveredExercise === unit.exerciseIndex && hoveredColumnKey === `${sectionIndex}-${pageIndex}-${columnIndex}` && (unitIndex === 0 || column[unitIndex - 1].exerciseIndex !== unit.exerciseIndex || column[unitIndex - 1].kind === 'textblock')}
                                <div class="a4-hover-toolbar">
                                  <button
                                    type="button"
                                    title="Monter l'exercice"
                                    aria-label="Monter l'exercice"
                                    disabled={unit.exerciseIndex === 0}
                                    on:click={() =>
                                      moveExercise(unit.exerciseIndex, -1)}
                                  >
                                    <i class="bx bx-up-arrow-alt"></i>
                                  </button>
                                  <button
                                    type="button"
                                    title="Descendre l'exercice"
                                    aria-label="Descendre l'exercice"
                                    disabled={unit.exerciseIndex ===
                                      exercises.length - 1}
                                    on:click={() =>
                                      moveExercise(unit.exerciseIndex, 1)}
                                  >
                                    <i class="bx bx-down-arrow-alt"></i>
                                  </button>
                                  {#if exercises[unit.exerciseIndex] != null}
                                    <button
                                      type="button"
                                      title="Réglages de l'exercice"
                                      aria-label="Réglages de l'exercice"
                                      on:click={() =>
                                        (settingsExerciseIndex =
                                          unit.exerciseIndex)}
                                    >
                                      <i class="bx bx-cog"></i>
                                    </button>
                                    <button
                                      type="button"
                                      title="Nouvelles données"
                                      aria-label="Nouvelles données"
                                      on:click={() =>
                                        newData(unit.exerciseIndex)}
                                    >
                                      <i class="bx bx-refresh"></i>
                                    </button>
                                  {/if}
                                  <button
                                    type="button"
                                    title="Supprimer l'exercice"
                                    aria-label="Supprimer l'exercice"
                                    on:click={() =>
                                      removeExercise(unit.exerciseIndex)}
                                  >
                                    <i class="bx bx-trash"></i>
                                  </button>
                                </div>
                              {/if}
                              <A4Unit {unit} />
                            </div>
                          {:else}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div
                              class="a4-unit-wrapper"
                              title={unit.source != null
                                ? 'Double-clic pour modifier la correction'
                                : undefined}
                              on:dblclick={() => openEditor(unit)}
                            >
                              <A4Unit {unit} />
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {/each}
                  </div>
                  {#if options.showFooter}
                    <div
                      class="a4-footer-license"
                      style="left: {options.marginHMm}mm;"
                    >
                      <span class="font-logo9">MathALÉA</span> CC-BY-SA
                    </div>
                    <div class="a4-page-number">
                      {pageIndex + 1} / {section.pages.length}
                    </div>
                  {/if}
                </section>
              {/each}
            {/each}
          {/key}
        </div>
      </div>
    </div>
  {/if}

  <!-- Galée de mesure : mêmes styles que les pages, hors écran -->
  <div class="a4-galley" aria-hidden="true">
    <div
      bind:this={galleyEl}
      style="width: {columnWidthMm}mm; font-size: {options.fontSizePt}pt;"
    >
      {#each sections as section, sectionIndex}
        {#each section.units as unit (unit.id)}
          <div data-unit data-section={sectionIndex}>
            <A4Unit {unit} />
          </div>
        {/each}
      {/each}
    </div>
    <div style="width: {contentWidthMm}mm; font-size: {options.fontSizePt}pt;">
      {#if options.showHeader || options.nbVersions > 1}
        <div bind:this={galleySubjectHeaderEl}>
          <header class="a4-doc-header">
            {#if options.showHeader}
              <div class="a4-doc-title">{docTitle}</div>
              <div class="a4-doc-meta-row">
                <div class="a4-doc-meta">{headerLine}</div>
                {#if options.nbVersions > 1}
                  <div class="a4-doc-version">Sujet A</div>
                {/if}
              </div>
            {:else if options.nbVersions > 1}
              <div class="a4-doc-version a4-doc-version-standalone">
                Sujet A
              </div>
            {/if}
          </header>
        </div>
      {/if}
      {#if options.showCorrection}
        <div bind:this={galleyCorrectionHeaderEl}>
          <header class="a4-doc-header">
            <div class="a4-doc-title">Corrigé</div>
          </header>
        </div>
      {/if}
    </div>
  </div>

  {#if editing != null}
    <A4EditUnitModal
      source={editing.type === 'unit'
        ? (editing.unit.source ?? '')
        : (textBlocksBefore[editing.exerciseIndex] ?? '')}
      isCustom={editing.type === 'unit' &&
        customContent[editing.unit.id] != null}
      title={editing.type === 'unit' ? "Modifier l'énoncé" : 'Bloc de texte'}
      deleteLabel={editing.type === 'textblock' &&
      textBlocksBefore[editing.exerciseIndex] != null
        ? 'Supprimer le bloc'
        : null}
      on:save={(event) => saveEditing(event.detail.source)}
      on:restore={restoreCustomContent}
      on:delete={() => {
        if (editing?.type === 'textblock') {
          deleteTextBlock(editing.exerciseIndex)
        }
      }}
      on:close={() => (editing = null)}
    />
  {/if}

  {#if isPageSettingsOpen}
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
    <div
      class="a4-print-hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      on:click|self={() => (isPageSettingsOpen = false)}
    >
      <div
        class="relative w-full max-w-md rounded-lg shadow-xl bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus p-5 space-y-4"
      >
        <button
          type="button"
          class="absolute top-3 right-3"
          aria-label="Fermer"
          on:click={() => (isPageSettingsOpen = false)}
        >
          <i
            class="bx bx-x text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
          ></i>
        </button>
        <h3
          class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
        >
          Réglages de la page
        </h3>

        <div class="flex items-center justify-between gap-4 text-sm">
          <span>Format</span>
          <div class="flex items-center gap-4">
            <select
              class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
              bind:value={options.pageFormat}
              on:change={() => scheduleRefresh(true, 0)}
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
            </select>
            <select
              class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
              bind:value={options.orientation}
              on:change={() => scheduleRefresh(true, 0)}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Paysage</option>
            </select>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            bind:checked={options.showHeader}
            on:change={() => scheduleRefresh(false, 0)}
          />
          Afficher l'en-tête
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            bind:checked={options.showFooter}
            on:change={() => scheduleRefresh(false, 0)}
          />
          Afficher le pied de page (numéros de page)
        </label>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            bind:checked={options.showExerciseTitles}
            on:change={() => scheduleRefresh(true, 0)}
          />
          Afficher le titre des exercices
        </label>
        <label class="flex items-center justify-between gap-4 text-sm">
          Nommer les exercices
          <select
            class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
            bind:value={options.exerciseLabel}
            on:change={() => scheduleRefresh(true, 0)}
          >
            <option value="Exercice">Exercice</option>
            <option value="Question">Question</option>
            <option value="Activité">Activité</option>
          </select>
        </label>
        <div class="flex items-center justify-between gap-4 text-sm">
          <span>Marges</span>
          <div class="flex items-center gap-4">
            <!-- Inputs hors des labels (for/id) : un input number imbriqué
                 dans un label reçoit un second clic synthétique lors d'un
                 clic sur le spinner, ce qui incrémente deux fois. -->
            <div class="flex items-center gap-2">
              <label for="a4-margin-h-input">Horizontale</label>
              <input
                id="a4-margin-h-input"
                type="number"
                min="5"
                max="30"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={options.marginHMm}
                on:change={() => scheduleRefresh(false, 0)}
              />
              mm
            </div>
            <div class="flex items-center gap-2">
              <label for="a4-margin-v-input">Verticale</label>
              <input
                id="a4-margin-v-input"
                type="number"
                min="5"
                max="30"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={options.marginVMm}
                on:change={() => scheduleRefresh(false, 0)}
              />
              mm
            </div>
          </div>
        </div>

        <button
          type="button"
          class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
          on:click={resetPageSettings}
        >
          <i class="bx bx-reset"></i>
          Réinitialiser les réglages de la page
        </button>
      </div>
    </div>
  {/if}

  {#if settingsExerciseIndex !== null && settingsExercise != null}
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
    <div
      class="a4-print-hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
          <div
            class="text-lg lg:text-base mx-2 lg:mx-4 space-y-4 p-3 text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            <h3 class="font-bold">Mise en page A4</h3>
            <div class="flex flex-row flex-wrap gap-x-8 gap-y-3">
              <!-- Inputs hors des labels (for/id) pour éviter le double
                   incrément au clic sur le spinner (voir barre d'options). -->
              <div class="flex items-center gap-2 text-sm font-light">
                <label for="a4-svg-zoom-input">Zoom des figures</label>
                <input
                  id="a4-svg-zoom-input"
                  type="number"
                  min="0.3"
                  max="3"
                  step="0.1"
                  class="w-20 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas py-0.5 text-sm"
                  value={exOverrides[settingsExerciseIndex]?.svgZoom ?? 1}
                  on:change={(event) => {
                    if (settingsExerciseIndex !== null) {
                      applyA4Overrides(settingsExerciseIndex, {
                        svgZoom: Number(event.currentTarget.value) || 1,
                      })
                    }
                  }}
                />
              </div>
              <div class="flex items-center gap-2 text-sm font-light">
                <label for="a4-spacing-input">Espacement des questions</label>
                <input
                  id="a4-spacing-input"
                  type="number"
                  min="1"
                  max="12"
                  step="0.5"
                  class="w-20 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas py-0.5 text-sm"
                  value={exOverrides[settingsExerciseIndex]?.spacing ?? 1}
                  on:change={(event) => {
                    if (settingsExerciseIndex !== null) {
                      applyA4Overrides(settingsExerciseIndex, {
                        spacing: Number(event.currentTarget.value) || 1,
                      })
                    }
                  }}
                />
              </div>
            </div>
          </div>
        {/key}
      </div>
    </div>
  {/if}
</main>

<style>
  .a4-pages {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  .a4-page {
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    flex: none;
    background: white;
    color: black;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    line-height: 1.4;
  }
  .a4-columns {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-height: 0;
    align-items: flex-start;
  }
  .a4-column {
    flex: none;
    min-width: 0;
  }
  .a4-doc-header {
    border-bottom: 1.5pt solid black;
    padding-bottom: 2mm;
  }
  .a4-doc-title {
    font-size: 1.5em;
    font-weight: 700;
    text-align: center;
    outline: none;
    min-height: 1em;
  }
  .a4-doc-meta-row {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 6mm;
    margin-top: 2mm;
  }
  .a4-doc-meta {
    flex: 1;
    outline: none;
    min-height: 1em;
    white-space: pre-wrap;
  }
  .a4-doc-version {
    font-weight: 600;
    white-space: nowrap;
  }
  .a4-doc-version-standalone {
    text-align: center;
    margin-top: 1mm;
  }
  .a4-doc-title[contenteditable]:hover,
  .a4-doc-meta[contenteditable]:hover,
  .a4-doc-title[contenteditable]:focus,
  .a4-doc-meta[contenteditable]:focus {
    background: #eef4fb;
    border-radius: 2px;
  }
  .a4-page-number {
    position: absolute;
    bottom: 3mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8pt;
    color: #666666;
  }
  .a4-footer-license {
    position: absolute;
    bottom: 3mm;
    font-size: 8pt;
    color: #666666;
  }
  .a4-unit-wrapper {
    position: relative;
  }
  /* Surlignage continu de l'exercice survolé : pas de bordure par unité
     pour que l'exercice apparaisse comme une seule zone */
  .a4-exo-hovered {
    background: #eef4fb;
  }
  .a4-hover-toolbar {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: row;
    gap: 2px;
    padding: 2px;
    background: white;
    border: 1px solid #b9d4f1;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  .a4-hover-toolbar button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 4px;
    font-size: 18px;
    color: #145a9d;
  }
  .a4-hover-toolbar button:hover {
    background: #e3eefa;
  }
  .a4-hover-toolbar button:disabled {
    color: #b0b0b0;
    cursor: default;
  }
  .a4-hover-toolbar button:disabled:hover {
    background: transparent;
  }
  .a4-insert {
    position: absolute;
    top: -9px;
    left: 6px;
    z-index: 20;
  }
  .a4-insert-plus {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #145a9d;
    color: white;
    font-size: 14px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }
  .a4-insert-plus:hover {
    background: #1d76cc;
  }
  .a4-insert-menu {
    position: absolute;
    top: 20px;
    left: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    min-width: 200px;
    padding: 4px;
    background: white;
    border: 1px solid #b9d4f1;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }
  .a4-insert-menu button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #145a9d;
    text-align: left;
  }
  .a4-insert-menu button:hover {
    background: #e3eefa;
  }
  .a4-insert-menu button:disabled {
    color: #b0b0b0;
  }
  .a4-insert-menu button:disabled:hover {
    background: transparent;
  }
  .a4-textblock-wrapper:hover {
    outline: 1px dashed #b9d4f1;
    outline-offset: 1px;
  }
  .a4-textblock-delete {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    display: none;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 1px solid #b9d4f1;
    color: #d33;
    font-size: 13px;
  }
  .a4-textblock-wrapper:hover .a4-textblock-delete {
    display: flex;
  }
  .a4-generating .a4-insert,
  .a4-generating .a4-textblock-delete {
    display: none !important;
  }
  .a4-break-marker {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 2px 0 6px 0;
    padding: 0 4px;
    border-top: 1px dashed #145a9d;
    color: #145a9d;
    font-size: 8pt;
    justify-content: center;
  }
  .a4-break-marker button {
    display: flex;
    align-items: center;
  }
  .a4-generating .a4-break-marker {
    display: none;
  }
  .a4-galley {
    position: fixed;
    top: 0;
    left: -10000px;
    visibility: hidden;
    pointer-events: none;
    background: white;
    color: black;
    line-height: 1.4;
  }

  @media print {
    :global(.a4-print-hidden) {
      display: none !important;
    }
    .a4-view {
      background: white !important;
      min-height: 0;
    }
    .a4-preview-area {
      overflow: visible !important;
      padding: 0 !important;
    }
    .a4-zoom-wrapper {
      zoom: 1 !important;
    }
    .a4-pages {
      gap: 0 !important;
    }
    .a4-page {
      box-shadow: none !important;
      break-after: page;
    }
    .a4-exo-hovered {
      background: transparent !important;
    }
    .a4-hover-toolbar {
      display: none !important;
    }
    .a4-galley {
      display: none !important;
    }
    .a4-doc-title[contenteditable],
    .a4-doc-meta[contenteditable] {
      background: transparent !important;
    }
  }
</style>
