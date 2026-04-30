<script lang="ts">
  import seedrandom from 'seedrandom'
  import { onDestroy, onMount } from 'svelte'
  import type { IExerciceAMC } from '../../../lib/amc/amcTypes'
  import {
    checkAMCGroupConsistency,
    creerDocumentAmc,
    type AMCGroupConsistencyReport,
  } from '../../../lib/amc/creerDocumentAmc'
  import {
    mathaleaEnsureAMCCompatibility,
    mathaleaGenerateSeed,
    mathaleaGetExercicesFromParams,
    mathaleaHandleExerciceSimple,
    mathaleaUpdateExercicesParamsFromUrl,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import { darkMode, exercicesParams } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import type { IExercice, InterfaceParams } from '../../../lib/types'
  import { context } from '../../../modules/context'
  import NavBar from '../../shared/header/NavBar.svelte'
  import SetupShell from '../SetupShell.svelte'
  import SideMenu from '../start/presentationalComponents/sideMenu/SideMenu.svelte'
  import AmcEnonceHtml from './builder/AmcEnonceHtml.svelte'
  import AmcPreviewNumeric from './builder/AmcPreviewNumeric.svelte'
  import AmcPreviewOpen from './builder/AmcPreviewOpen.svelte'
  import AmcPreviewQcm from './builder/AmcPreviewQcm.svelte'

  type BlockKind = 'qcm' | 'num' | 'open'

  type BlockRef = {
    exerciseIndex: number
    questionIndex: number
    propositionIndex: number
    kind: BlockKind
  }

  type PreviewBlock = {
    key: string
    label: string
    ref: BlockRef | null
    enonce: string
    htmlContent: string
    data: any
    previewKind: 'qcm' | 'num' | 'open' | 'hybridHeader'
  }

  type PreviewDisplayItem =
    | {
        kind: 'single'
        block: PreviewBlock
      }
    | {
        kind: 'hybridContainer'
        header: PreviewBlock
        children: PreviewBlock[]
      }

  type GroupSetting = {
    seed: string
    questionCount: number
    restitueCount: number
    pageBreakBefore: boolean
    multicols: boolean
  }

  let exercices: IExercice[] = []
  let groupSettings: GroupSetting[] = []
  let selectedRef: BlockRef | null = null
  let selectedExerciseIndex: number | null = null
  let tikzScaleFactorsByQuestion: Record<string, number> = {}
  let tikzScaleSliderValue = 1
  let selectedQuestionKey = ''
  let selectedQuestionTikzScaleFactor = 1
  let selectedQuestionClipDimensionsLabel =
    'Dimensions de figure: clip non détecté'
  let latexContent = ''
  let latexExportStatus = ''
  let groupConsistencyReport: AMCGroupConsistencyReport | null = null
  let isDropTargetActive = false

  let unsubscribeExercicesParams: (() => void) | null = null

  $: selectedQuestionKey =
    selectedRef == null
      ? ''
      : getQuestionKey(selectedRef.exerciseIndex, selectedRef.questionIndex)
  $: selectedQuestionTikzScaleFactor = clampTikzScaleFactor(
    selectedQuestionKey === ''
      ? 1
      : (tikzScaleFactorsByQuestion[selectedQuestionKey] ?? 1),
  )
  $: tikzScaleSliderValue = selectedQuestionTikzScaleFactor
  $: selectedQuestionClipDimensionsLabel =
    getSelectedQuestionScaledClipDimensionsLabel(
      selectedQuestionTikzScaleFactor,
    )

  function asAMCExercices(exos: IExercice[]): IExerciceAMC[] {
    return exos as unknown as IExerciceAMC[]
  }

  function getAMCGroupName(exercise: IExercice | undefined): string {
    if (!exercise) return ''
    const ex = exercise as any
    let ref = `${exercise.id}/${ex.sup ? 'S:' + ex.sup : ''}${ex.sup2 ? 'S2:' + ex.sup2 : ''}${ex.sup3 ? 'S3:' + ex.sup3 : ''}${ex.sup4 ? 'S4:' + ex.sup4 : ''}${ex.sup5 ? 'S5:' + ex.sup5 : ''}`
    if (ref.endsWith('/')) ref = ref.slice(0, -1)
    return ref
  }

  async function regenerateExercise(index: number, forcedSeed?: string) {
    const exercice = exercices[index]
    if (!exercice) return

    const nextSeed = forcedSeed?.trim() || mathaleaGenerateSeed()
    exercice.seed = nextSeed
    groupSettings[index] = {
      ...groupSettings[index],
      seed: nextSeed,
    }

    // 1. Passe HTML : génère les SVG dans listeQuestions
    generateHtmlQuestionsForExercise(exercice, nextSeed)

    // 2. Passe AMC : génère autoCorrection
    const ex = exercice as any
    ex.lastCallback = ''
    context.isHtml = false
    context.isAmc = true
    seedrandom(nextSeed, { global: true })

    if (exercice.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(exercice, false)
    } else if (typeof exercice.nouvelleVersionWrapper === 'function') {
      exercice.nouvelleVersionWrapper()
    }

    mathaleaEnsureAMCCompatibility(exercice)
    ;(exercice as any).amcHtmlQuestions =
      extractAMCQuestionsFromAutoCorrection(exercice)
    exercices = [...exercices]
    updateLatexPreview()
  }

  function extractAMCQuestionsFromAutoCorrection(
    exercice: IExercice,
  ): string[] {
    const ex = exercice as any
    const htmlQuestions: string[] = ex.htmlQuestions ?? []
    const autoCorrection = Array.isArray(exercice.autoCorrection)
      ? exercice.autoCorrection
      : []

    const figureEnvRegex =
      /\\begin\{(?:tikzpicture|pspicture|picture|circuitikz)\}[\s\S]*?\\end\{(?:tikzpicture|pspicture|picture|circuitikz)\}/gi

    const extractSvgBlocks = (html: string): string[] => {
      const matches = html.match(/<svg[\s\S]*?<\/svg>/gi)
      return matches ?? []
    }

    const replaceFigureEnvsWithSvg = (
      amcText: string,
      htmlText: string,
    ): string => {
      const svgBlocks = extractSvgBlocks(htmlText)
      const hasFigureEnv =
        /\\begin\{(?:tikzpicture|pspicture|picture|circuitikz)\}/i.test(amcText)
      let svgIndex = 0
      const replaced = amcText.replace(figureEnvRegex, () => {
        const svg = svgBlocks[svgIndex]
        svgIndex++
        return svg ?? ''
      })

      // Si aucun SVG n'a pu être injecté alors qu'il y a des environnements figure,
      // on retombe sur la version HTML pour ne pas afficher du LaTeX brut.
      if (hasFigureEnv && svgBlocks.length === 0) {
        return htmlText
      }

      return replaced
    }

    const pickPreviewText = (candidate: string, fallback: string): string => {
      const previewSource =
        candidate.trim().length === 0
          ? fallback
          : replaceFigureEnvsWithSvg(candidate, fallback)
      return previewSource.replaceAll('\\\\', '<br>')
    }

    return autoCorrection.map((item: any, i: number) => {
      const fallback = htmlQuestions[i] ?? ''

      const enonce = typeof item?.enonce === 'string' ? item.enonce.trim() : ''
      if (enonce.length > 0) return pickPreviewText(enonce, fallback)

      const propositions = Array.isArray(item?.propositions)
        ? item.propositions
        : []
      for (const prop of propositions) {
        if (prop?.type === 'AMCNum') {
          const texte = prop?.propositions?.[0]?.reponse?.texte
          if (typeof texte === 'string' && texte.trim().length > 0) {
            return pickPreviewText(texte, fallback)
          }
        }
        if (prop?.type === 'AMCOpen') {
          const texte = prop?.propositions?.[0]?.texte
          if (typeof texte === 'string' && texte.trim().length > 0) {
            return pickPreviewText(texte, fallback)
          }
        }
      }

      return fallback
    })
  }

  function generateHtmlQuestionsForExercise(
    exercice: IExercice,
    seed: string,
  ): void {
    const ex = exercice as any
    const originalInteractif = exercice.interactif
    const originalIsAmc = context.isAmc
    const originalIsHtml = context.isHtml

    const runHtmlGeneration = (isInteractif: boolean) => {
      ex.lastCallback = ''
      exercice.interactif = isInteractif
      context.isHtml = true
      context.isAmc = false
      seedrandom(seed, { global: true })

      if (exercice.typeExercice === 'simple') {
        if (typeof exercice.nouvelleVersionWrapper === 'function') {
          exercice.nouvelleVersionWrapper()
        }
      } else if (typeof exercice.nouvelleVersionWrapper === 'function') {
        exercice.nouvelleVersionWrapper()
      }
    }

    // 1. Passe interactive HTML hors AMC : permet a handleAnswers de remplir autoCorrection.
    runHtmlGeneration(true)
    ex.interactiveAutoCorrectionForAMC = exercice.autoCorrection.map(
      (item) => ({
        ...item,
        reponse: item?.reponse
          ? {
              ...item.reponse,
              valeur: item.reponse.valeur,
            }
          : undefined,
      }),
    )

    // 2. Passe HTML non interactive hors AMC : apercu papier avec SVG.
    runHtmlGeneration(false)
    if (exercice.typeExercice === 'simple') {
      ex.htmlQuestions =
        exercice.question != null ? [String(exercice.question)] : []
    } else {
      ex.htmlQuestions = [...exercice.listeQuestions]
    }

    exercice.interactif = originalInteractif
    context.isAmc = originalIsAmc
    context.isHtml = originalIsHtml
    // Le contexte (isHtml/isAmc) est restauré par la passe AMC qui suit.
  }

  async function refreshExercicesFromStore() {
    const loaded = (
      await mathaleaGetExercicesFromParams($exercicesParams)
    ).filter(
      (exercice): exercice is IExercice => exercice.typeExercice !== 'statique',
    )

    const amcReadyExercices: IExercice[] = []

    for (const exercice of loaded) {
      const seed = exercice.seed ?? ''

      // 1. Passe HTML : génère les SVG dans listeQuestions
      generateHtmlQuestionsForExercise(exercice, seed)

      // 2. Passe AMC : génère autoCorrection
      const ex = exercice as any
      ex.lastCallback = ''
      context.isHtml = false
      context.isAmc = true
      seedrandom(seed, { global: true })

      if (exercice.typeExercice === 'simple') {
        mathaleaHandleExerciceSimple(exercice, false)
      } else if (typeof exercice.nouvelleVersionWrapper === 'function') {
        exercice.nouvelleVersionWrapper()
      }

      mathaleaEnsureAMCCompatibility(exercice)
      ;(exercice as any).amcHtmlQuestions =
        extractAMCQuestionsFromAutoCorrection(exercice)
      if (exercice.amcType != null) {
        amcReadyExercices.push(exercice)
      }
    }

    const previousSettings = groupSettings
    exercices = amcReadyExercices
    groupSettings = exercices.map((exercice, index) => ({
      seed: previousSettings[index]?.seed ?? exercice.seed,
      questionCount:
        previousSettings[index]?.questionCount ??
        Math.max(1, exercice.nbQuestions),
      restitueCount:
        previousSettings[index]?.restitueCount ??
        Math.max(1, exercice.nbQuestions),
      pageBreakBefore: previousSettings[index]?.pageBreakBefore ?? index > 0,
      multicols: previousSettings[index]?.multicols ?? false,
    }))

    if (
      selectedExerciseIndex != null &&
      (selectedExerciseIndex < 0 || selectedExerciseIndex >= exercices.length)
    ) {
      selectedExerciseIndex = null
      selectedRef = null
    }

    updateLatexPreview()
  }

  function addExercise(uuid: string, id: string) {
    const newExercise: InterfaceParams = {
      uuid,
      id,
      alea: mathaleaGenerateSeed(),
      interactif: '0',
    }
    exercicesParams.update((list) => [...list, newExercise])
    mathaleaUpdateUrlFromExercicesParams()
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDropTargetActive = false

    const payload =
      event.dataTransfer?.getData('application/x-mathalea-exercise') ||
      event.dataTransfer?.getData('text/plain')

    if (!payload) return

    try {
      const parsed = JSON.parse(payload) as { uuid?: string; id?: string }
      if (typeof parsed.uuid === 'string' && typeof parsed.id === 'string') {
        addExercise(parsed.uuid, parsed.id)
      }
    } catch {
      // Zone permissive: d'autres drag/drop peuvent être ignorés.
    }
  }

  function updateLatexPreview() {
    const exercicesForLatex = asAMCExercices(
      exercices.map((exercice) => JSON.parse(JSON.stringify(exercice))),
    )

    applyTikzScaleFactors(exercicesForLatex)

    const nbQuestions = groupSettings.map((setting) =>
      Math.max(
        1,
        Math.min(
          Number(setting.restitueCount) || 1,
          Number(setting.questionCount) || 1,
        ),
      ),
    )

    latexContent = creerDocumentAmc({
      exercices: exercicesForLatex,
      nbQuestions,
      groupLayouts: groupSettings.map((setting) => ({
        pageBreakBefore: setting.pageBreakBefore,
        multicols: setting.multicols,
      })),
      typeEntete: 'AMCcodeGrid',
      format: 'A4',
      matiere: 'Mathématiques',
      titre: 'Aperçu AMC',
      nbExemplaires: 1,
    })

    groupConsistencyReport = checkAMCGroupConsistency(latexContent)
  }

  function getQuestionKey(
    exerciseIndex: number,
    questionIndex: number,
  ): string {
    return `${exerciseIndex}:${questionIndex}`
  }

  function clampTikzScaleFactor(value: number): number {
    return Math.max(0.5, Math.min(1.2, value))
  }

  function setSelectedQuestionTikzScaleFactor(value: number) {
    if (selectedQuestionKey === '') return
    const factor = clampTikzScaleFactor(value)
    tikzScaleFactorsByQuestion = {
      ...tikzScaleFactorsByQuestion,
      [selectedQuestionKey]: factor,
    }
    updateLatexPreview()
  }

  function formatTikzScale(value: number): string {
    return value
      .toFixed(3)
      .replace(/\.0+$/, '')
      .replace(/(\.\d*[1-9])0+$/, '$1')
  }

  function applyTikzScaleToLatexText(latex: string, factor: number): string {
    if (typeof latex !== 'string' || latex.trim() === '') return latex

    return latex.replace(
      /\\begin\{tikzpicture\}(\[[^\]]*\])?/g,
      (_match, rawOptions: string | undefined) => {
        if (!rawOptions) {
          if (factor === 1) return '\\begin{tikzpicture}'
          return `\\begin{tikzpicture}[scale=${formatTikzScale(factor)}]`
        }

        const options = rawOptions.slice(1, -1)
        const scaleRegex = /(^|,)\s*scale\s*=\s*([+-]?\d*\.?\d+)\s*(?=,|$)/
        const scaleMatch = options.match(scaleRegex)

        if (scaleMatch) {
          const currentScale = Number(scaleMatch[2])
          const nextScale = Number.isFinite(currentScale)
            ? currentScale * factor
            : factor
          const replaced = options.replace(
            scaleRegex,
            `$1 scale=${formatTikzScale(nextScale)}`,
          )
          return `\\begin{tikzpicture}[${replaced.trim()}]`
        }

        if (factor === 1) return `\\begin{tikzpicture}[${options}]`
        const separator = options.trim().length > 0 ? ', ' : ''
        return `\\begin{tikzpicture}[${options}${separator}scale=${formatTikzScale(
          factor,
        )}]`
      },
    )
  }

  function transformQuestionLatexWithTikzScale(
    item: any,
    factor: number,
  ): void {
    const apply = (text: unknown): unknown =>
      typeof text === 'string' ? applyTikzScaleToLatexText(text, factor) : text

    item.enonce = apply(item.enonce)

    const propositions = Array.isArray(item.propositions)
      ? item.propositions
      : []
    for (const prop of propositions) {
      prop.enonce = apply(prop.enonce)
      prop.texte = apply(prop.texte)
      const subProps = Array.isArray(prop.propositions) ? prop.propositions : []
      for (const sub of subProps) {
        sub.texte = apply(sub.texte)
        if (sub.reponse) {
          sub.reponse.texte = apply(sub.reponse.texte)
        }
      }
    }
  }

  function applyTikzScaleFactors(exercicesForLatex: IExerciceAMC[]) {
    for (const [key, factor] of Object.entries(tikzScaleFactorsByQuestion)) {
      if (!Number.isFinite(factor)) continue
      const [exerciseIndexText, questionIndexText] = key.split(':')
      const exerciseIndex = Number(exerciseIndexText)
      const questionIndex = Number(questionIndexText)
      if (
        !Number.isInteger(exerciseIndex) ||
        !Number.isInteger(questionIndex)
      ) {
        continue
      }

      const exercice = exercicesForLatex[exerciseIndex] as any
      const item = exercice?.autoCorrection?.[questionIndex]
      if (!item) continue
      transformQuestionLatexWithTikzScale(item, clampTikzScaleFactor(factor))
    }
  }

  function selectedQuestionHasTikzPicture(): boolean {
    if (!selectedRef) return false
    const exercise = exercices[selectedRef.exerciseIndex] as any
    const item = exercise?.autoCorrection?.[selectedRef.questionIndex]
    if (!item) return false

    const regex = /\\begin\{tikzpicture\}/
    const containsTikz = (value: unknown): boolean =>
      typeof value === 'string' && regex.test(value)

    if (containsTikz(item.enonce)) return true
    const propositions = Array.isArray(item.propositions)
      ? item.propositions
      : []
    for (const prop of propositions) {
      if (containsTikz(prop?.enonce) || containsTikz(prop?.texte)) return true
      const subProps = Array.isArray(prop?.propositions)
        ? prop.propositions
        : []
      for (const sub of subProps) {
        if (containsTikz(sub?.texte) || containsTikz(sub?.reponse?.texte)) {
          return true
        }
      }
    }

    return false
  }

  function getSelectedQuestionItem(): any | null {
    if (!selectedRef) return null
    const exercise = exercices[selectedRef.exerciseIndex] as any
    return exercise?.autoCorrection?.[selectedRef.questionIndex] ?? null
  }

  function toCm(value: number, unit: string | undefined): number {
    const normalized = (unit ?? 'cm').toLowerCase()
    if (normalized === 'cm') return value
    if (normalized === 'mm') return value / 10
    if (normalized === 'in') return value * 2.54
    if (normalized === 'pt') return value * 0.0352778
    return value
  }

  function extractClipDimensionsCmFromText(
    latex: string,
  ): { widthCm: number; heightCm: number } | null {
    const clipRegex =
      /\\clip\s*\(\s*([+-]?\d*\.?\d+)\s*(cm|mm|pt|in)?\s*,\s*([+-]?\d*\.?\d+)\s*(cm|mm|pt|in)?\s*\)\s*rectangle\s*\(\s*([+-]?\d*\.?\d+)\s*(cm|mm|pt|in)?\s*,\s*([+-]?\d*\.?\d+)\s*(cm|mm|pt|in)?\s*\)\s*;/i
    const match = latex.match(clipRegex)
    if (!match) return null

    const x1 = toCm(Number(match[1]), match[2])
    const y1 = toCm(Number(match[3]), match[4])
    const x2 = toCm(Number(match[5]), match[6])
    const y2 = toCm(Number(match[7]), match[8])

    if (![x1, y1, x2, y2].every((v) => Number.isFinite(v))) return null

    return {
      widthCm: Math.abs(x2 - x1),
      heightCm: Math.abs(y2 - y1),
    }
  }

  function getSelectedQuestionClipDimensionsCm(): {
    widthCm: number
    heightCm: number
  } | null {
    const item = getSelectedQuestionItem()
    if (!item) return null

    const candidates: string[] = []
    const pushIfString = (value: unknown) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        candidates.push(value)
      }
    }

    pushIfString(item.enonce)
    const propositions = Array.isArray(item.propositions)
      ? item.propositions
      : []
    for (const prop of propositions) {
      pushIfString(prop?.enonce)
      pushIfString(prop?.texte)
      const subProps = Array.isArray(prop?.propositions)
        ? prop.propositions
        : []
      for (const sub of subProps) {
        pushIfString(sub?.texte)
        pushIfString(sub?.reponse?.texte)
      }
    }

    for (const text of candidates) {
      const dims = extractClipDimensionsCmFromText(text)
      if (dims) return dims
    }

    return null
  }

  function formatCm(value: number): string {
    return value.toFixed(1).replace(/\.0$/, '')
  }

  function getSelectedQuestionScaledClipDimensionsLabel(
    factor: number,
  ): string {
    const dims = getSelectedQuestionClipDimensionsCm()
    if (!dims) return 'Dimensions de figure: clip non détecté'

    const baseWidth = dims.widthCm
    const baseHeight = dims.heightCm
    const width = dims.widthCm * factor
    const height = dims.heightCm * factor
    return `Dimensions de figure: ${formatCm(baseWidth)} x ${formatCm(baseHeight)} cm -> ${formatCm(width)} x ${formatCm(height)} cm`
  }

  async function copyLatexToClipboard() {
    if (!latexContent.trim()) return

    try {
      await navigator.clipboard.writeText(latexContent)
      latexExportStatus = 'LaTeX copié dans le presse-papier.'
    } catch {
      // Fallback pour navigateurs sans permission clipboard.
      const textarea = document.createElement('textarea')
      textarea.value = latexContent
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      latexExportStatus = copied
        ? 'LaTeX copié dans le presse-papier.'
        : 'Impossible de copier automatiquement le LaTeX.'
    }
  }

  function downloadLatexFile() {
    if (!latexContent.trim()) return

    const blob = new Blob([latexContent], { type: 'text/x-tex;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const seed = exercices[0]?.seed ?? 'amc'

    link.href = url
    link.download = `amc-${seed}.tex`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    latexExportStatus =
      'Téléchargement lancé (dossier selon les réglages du navigateur).'
  }

  function getBlocks(exercise: IExercice, exerciseIndex: number) {
    const blocks: PreviewBlock[] = []

    const autoCorrection = Array.isArray((exercise as any).autoCorrection)
      ? ((exercise as any).autoCorrection as any[])
      : []

    const htmlQuestions: string[] = (exercise as any).htmlQuestions ?? []
    const amcHtmlQuestions: string[] = (exercise as any).amcHtmlQuestions ?? []

    autoCorrection.forEach((item, questionIndex) => {
      const type = (exercise as any).amcType
      const htmlContent =
        amcHtmlQuestions[questionIndex] ?? htmlQuestions[questionIndex] ?? ''

      if (type === 'AMCHybride') {
        const propositions = Array.isArray(item?.propositions)
          ? item.propositions
          : []

        blocks.push({
          key: `${exerciseIndex}-${questionIndex}-hybrid-header`,
          label: `AMCHybride ${questionIndex + 1}`,
          ref: null,
          enonce: item?.enonce ?? '',
          htmlContent,
          data: item,
          previewKind: 'hybridHeader',
        })

        propositions.forEach((prop: any, propositionIndex: number) => {
          const propType = prop?.type
          const propEnonce = typeof prop?.enonce === 'string' ? prop.enonce : ''
          const figureEnvRegex =
            /\\begin\{(?:tikzpicture|pspicture|picture|circuitikz)\}[\s\S]*?\\end\{(?:tikzpicture|pspicture|picture|circuitikz)\}/i
          const propSpecificText =
            propType === 'AMCNum'
              ? prop?.propositions?.[0]?.reponse?.texte
              : propType === 'AMCOpen'
                ? prop?.propositions?.[0]?.texte
                : propEnonce
          const propHtmlContent = (() => {
            const raw =
              typeof propSpecificText === 'string'
                ? propSpecificText.trim()
                : ''
            if (raw.length === 0) return ''
            // Si le texte contient encore une figure LaTeX, on garde le fallback HTML
            // (qui contient déjà le SVG substitué).
            const source = figureEnvRegex.test(raw) ? htmlContent : raw
            return source.replaceAll('\\\\', '<br>')
          })()
          if (propType === 'qcmMono' || propType === 'qcmMult') {
            blocks.push({
              key: `${exerciseIndex}-${questionIndex}-${propositionIndex}-qcm`,
              label: `QCM ${questionIndex + 1}.${propositionIndex + 1}`,
              ref: {
                exerciseIndex,
                questionIndex,
                propositionIndex,
                kind: 'qcm',
              },
              enonce: propEnonce,
              htmlContent: propHtmlContent,
              data: prop,
              previewKind: 'qcm',
            })
          }
          if (propType === 'AMCNum') {
            blocks.push({
              key: `${exerciseIndex}-${questionIndex}-${propositionIndex}-num`,
              label: `Numérique ${questionIndex + 1}.${propositionIndex + 1}`,
              ref: {
                exerciseIndex,
                questionIndex,
                propositionIndex,
                kind: 'num',
              },
              enonce: propEnonce,
              htmlContent: propHtmlContent,
              data: prop,
              previewKind: 'num',
            })
          }
          if (propType === 'AMCOpen') {
            blocks.push({
              key: `${exerciseIndex}-${questionIndex}-${propositionIndex}-open`,
              label: `Ouverte ${questionIndex + 1}.${propositionIndex + 1}`,
              ref: {
                exerciseIndex,
                questionIndex,
                propositionIndex,
                kind: 'open',
              },
              enonce: propEnonce,
              htmlContent: propHtmlContent,
              data: prop,
              previewKind: 'open',
            })
          }
        })
        return
      }

      if (type === 'qcmMono' || type === 'qcmMult') {
        blocks.push({
          key: `${exerciseIndex}-${questionIndex}-0-qcm`,
          label: `QCM ${questionIndex + 1}`,
          ref: {
            exerciseIndex,
            questionIndex,
            propositionIndex: 0,
            kind: 'qcm',
          },
          enonce: item?.enonce ?? '',
          htmlContent,
          data: item,
          previewKind: 'qcm',
        })
      }

      if (type === 'AMCNum') {
        blocks.push({
          key: `${exerciseIndex}-${questionIndex}-0-num`,
          label: `Numérique ${questionIndex + 1}`,
          ref: {
            exerciseIndex,
            questionIndex,
            propositionIndex: 0,
            kind: 'num',
          },
          enonce: item?.enonce ?? '',
          htmlContent,
          data: item,
          previewKind: 'num',
        })
      }

      if (type === 'AMCOpen') {
        blocks.push({
          key: `${exerciseIndex}-${questionIndex}-0-open`,
          label: `Ouverte ${questionIndex + 1}`,
          ref: {
            exerciseIndex,
            questionIndex,
            propositionIndex: 0,
            kind: 'open',
          },
          enonce: item?.enonce ?? '',
          htmlContent,
          data: item,
          previewKind: 'open',
        })
      }
    })

    return blocks
  }

  function getPreviewDisplayItems(
    exercise: IExercice,
    exerciseIndex: number,
  ): PreviewDisplayItem[] {
    const blocks = getBlocks(exercise, exerciseIndex)
    const displayItems: PreviewDisplayItem[] = []

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      if (block.previewKind !== 'hybridHeader') {
        displayItems.push({ kind: 'single', block })
        continue
      }

      const children: PreviewBlock[] = []
      let j = i + 1
      while (j < blocks.length && blocks[j].previewKind !== 'hybridHeader') {
        children.push(blocks[j])
        j++
      }

      displayItems.push({ kind: 'hybridContainer', header: block, children })
      i = j - 1
    }

    return displayItems
  }

  function isSelected(ref: BlockRef): boolean {
    return (
      selectedRef?.exerciseIndex === ref.exerciseIndex &&
      selectedRef?.questionIndex === ref.questionIndex &&
      selectedRef?.propositionIndex === ref.propositionIndex &&
      selectedRef?.kind === ref.kind
    )
  }

  function selectBlock(ref: BlockRef) {
    selectedRef = ref
    selectedExerciseIndex = ref.exerciseIndex
  }

  function updateSelectedNumericParam(
    key: 'digits' | 'decimals' | 'approx' | 'signe' | 'vertical',
    value: number | boolean,
  ) {
    if (!selectedRef || selectedRef.kind !== 'num') return

    const exercise = exercices[selectedRef.exerciseIndex] as any
    if (!exercise) return
    const item = exercise.autoCorrection?.[selectedRef.questionIndex]
    if (!item) return

    const isHybrid = exercise.amcType === 'AMCHybride'
    const target = isHybrid
      ? item?.propositions?.[selectedRef.propositionIndex]?.propositions?.[0]
          ?.reponse
      : item?.reponse

    if (!target) return
    target.param = target.param ?? {}
    target.param[key] = value
    exercices = [...exercices]
    updateLatexPreview()
  }

  function updateSelectedOpenParam(
    key: 'statut' | 'pointilles' | 'sanscadre',
    value: number | boolean,
  ) {
    if (!selectedRef || selectedRef.kind !== 'open') return

    const exercise = exercices[selectedRef.exerciseIndex] as any
    if (!exercise) return
    const item = exercise.autoCorrection?.[selectedRef.questionIndex]
    if (!item) return

    const isHybrid = exercise.amcType === 'AMCHybride'
    const target = isHybrid
      ? item?.propositions?.[selectedRef.propositionIndex]?.propositions?.[0]
      : item?.propositions?.[0]

    if (!target) return
    target[key] = value
    exercices = [...exercices]
    updateLatexPreview()
  }

  function updateSelectedQcmOption(
    key: 'ordered' | 'vertical' | 'lastChoice',
    value: number | boolean,
  ) {
    if (!selectedRef || selectedRef.kind !== 'qcm') return

    const exercise = exercices[selectedRef.exerciseIndex] as any
    if (!exercise) return
    const item = exercise.autoCorrection?.[selectedRef.questionIndex]
    if (!item) return

    const isHybrid = exercise.amcType === 'AMCHybride'
    const target = isHybrid
      ? item?.propositions?.[selectedRef.propositionIndex]
      : item

    if (!target) return
    target.options = target.options ?? {}
    target.options[key] = value
    exercices = [...exercices]
    updateLatexPreview()
  }

  function updateSelectedBlockMulticols(value: boolean) {
    if (!selectedRef) return

    const exercise = exercices[selectedRef.exerciseIndex] as any
    if (!exercise) return
    const item = exercise.autoCorrection?.[selectedRef.questionIndex]
    if (!item) return

    if (exercise.amcType === 'AMCHybride') {
      item.options = item.options ?? {}
      item.options.multicols = value
    } else {
      item.options = item.options ?? {}
      item.options.multicols = value
    }

    exercices = [...exercices]
    updateLatexPreview()
  }

  function isSelectedBlockMulticolsEnabled(): boolean {
    if (!selectedRef) return false
    const exercise = exercices[selectedRef.exerciseIndex] as any
    const item = exercise?.autoCorrection?.[selectedRef.questionIndex]
    return Boolean(item?.options?.multicols)
  }

  function appliquerParametresQuestionAuGroupe() {
    if (!selectedRef) return

    const exercise = exercices[selectedRef.exerciseIndex] as any
    if (!exercise) return

    const autoCorrection = Array.isArray(exercise.autoCorrection)
      ? exercise.autoCorrection
      : []
    const isHybrid = exercise.amcType === 'AMCHybride'

    if (selectedRef.kind === 'num') {
      if (isHybrid) {
        const sourceParam =
          autoCorrection[selectedRef.questionIndex]?.propositions?.[
            selectedRef.propositionIndex
          ]?.propositions?.[0]?.reponse?.param
        if (!sourceParam) return
        const copied = JSON.parse(JSON.stringify(sourceParam))
        for (const item of autoCorrection) {
          const propositions = Array.isArray(item?.propositions)
            ? item.propositions
            : []
          for (const prop of propositions) {
            if (prop?.type !== 'AMCNum') continue
            const target = prop?.propositions?.[0]?.reponse
            if (!target) continue
            target.param = JSON.parse(JSON.stringify(copied))
          }
        }
      } else {
        const sourceParam =
          autoCorrection[selectedRef.questionIndex]?.reponse?.param
        if (!sourceParam) return
        const copied = JSON.parse(JSON.stringify(sourceParam))
        for (const item of autoCorrection) {
          if (!item?.reponse) continue
          item.reponse.param = JSON.parse(JSON.stringify(copied))
        }
      }
    }

    if (selectedRef.kind === 'open') {
      if (isHybrid) {
        const source =
          autoCorrection[selectedRef.questionIndex]?.propositions?.[
            selectedRef.propositionIndex
          ]?.propositions?.[0]
        if (!source) return
        for (const item of autoCorrection) {
          const propositions = Array.isArray(item?.propositions)
            ? item.propositions
            : []
          for (const prop of propositions) {
            if (prop?.type !== 'AMCOpen') continue
            const target = prop?.propositions?.[0]
            if (!target) continue
            target.statut = source.statut
            target.pointilles = source.pointilles
            target.sanscadre = source.sanscadre
          }
        }
      } else {
        const source =
          autoCorrection[selectedRef.questionIndex]?.propositions?.[0]
        if (!source) return
        for (const item of autoCorrection) {
          const target = item?.propositions?.[0]
          if (!target) continue
          target.statut = source.statut
          target.pointilles = source.pointilles
          target.sanscadre = source.sanscadre
        }
      }
    }

    if (selectedRef.kind === 'qcm') {
      if (isHybrid) {
        const sourceOptions =
          autoCorrection[selectedRef.questionIndex]?.propositions?.[
            selectedRef.propositionIndex
          ]?.options ?? {}
        const copied = JSON.parse(JSON.stringify(sourceOptions))
        for (const item of autoCorrection) {
          const propositions = Array.isArray(item?.propositions)
            ? item.propositions
            : []
          for (const prop of propositions) {
            if (prop?.type !== 'qcmMono' && prop?.type !== 'qcmMult') continue
            prop.options = JSON.parse(JSON.stringify(copied))
          }
        }
      } else {
        const sourceOptions =
          autoCorrection[selectedRef.questionIndex]?.options ?? {}
        const copied = JSON.parse(JSON.stringify(sourceOptions))
        for (const item of autoCorrection) {
          item.options = JSON.parse(JSON.stringify(copied))
        }
      }
    }

    exercices = [...exercices]
    updateLatexPreview()
  }

  function deleteQuestion(exerciseIndex: number, questionIndex: number) {
    const exercice = exercices[exerciseIndex] as any
    if (!exercice?.autoCorrection) return
    exercice.autoCorrection = (exercice.autoCorrection as any[]).filter(
      (_: any, i: number) => i !== questionIndex,
    )
    if (
      selectedRef?.exerciseIndex === exerciseIndex &&
      selectedRef?.questionIndex === questionIndex
    ) {
      selectedRef = null
    }

    const nextFactors: Record<string, number> = {}
    for (const [key, value] of Object.entries(tikzScaleFactorsByQuestion)) {
      const [exText, qText] = key.split(':')
      const ex = Number(exText)
      const q = Number(qText)
      if (ex !== exerciseIndex) {
        nextFactors[key] = value
        continue
      }
      if (q < questionIndex) {
        nextFactors[key] = value
      } else if (q > questionIndex) {
        nextFactors[getQuestionKey(ex, q - 1)] = value
      }
    }
    tikzScaleFactorsByQuestion = nextFactors

    exercices = [...exercices]
    updateLatexPreview()
  }

  function deleteExercise(index: number) {
    if (selectedRef?.exerciseIndex === index) {
      selectedRef = null
      selectedExerciseIndex = null
    } else if (selectedRef != null && selectedRef.exerciseIndex > index) {
      selectedRef = {
        ...selectedRef,
        exerciseIndex: selectedRef.exerciseIndex - 1,
      }
      if (selectedExerciseIndex != null && selectedExerciseIndex > index) {
        selectedExerciseIndex--
      }
    } else if (selectedExerciseIndex === index) {
      selectedExerciseIndex = null
    } else if (selectedExerciseIndex != null && selectedExerciseIndex > index) {
      selectedExerciseIndex--
    }
    exercicesParams.update((list) => list.filter((_, i) => i !== index))

    const nextFactors: Record<string, number> = {}
    for (const [key, value] of Object.entries(tikzScaleFactorsByQuestion)) {
      const [exText, qText] = key.split(':')
      const ex = Number(exText)
      const q = Number(qText)
      if (ex < index) {
        nextFactors[key] = value
      } else if (ex > index) {
        nextFactors[getQuestionKey(ex - 1, q)] = value
      }
    }
    tikzScaleFactorsByQuestion = nextFactors

    mathaleaUpdateUrlFromExercicesParams()
  }

  function selectNextExercise() {
    if (exercices.length === 0 || selectedExerciseIndex == null) return
    selectedExerciseIndex = (selectedExerciseIndex + 1) % exercices.length
    selectedRef = null
  }

  onMount(async () => {
    await mathaleaUpdateExercicesParamsFromUrl()
    await refreshExercicesFromStore()
    unsubscribeExercicesParams = exercicesParams.subscribe(() => {
      void refreshExercicesFromStore()
    })
  })

  onDestroy(() => {
    if (unsubscribeExercicesParams) unsubscribeExercicesParams()
  })
</script>

<SetupShell id="amcBuilder" mobileSidebarTitle="Bibliothèque d'exercices AMC">
  <div slot="header" class="print-hidden">
    <NavBar
      subtitle="Constructeur d'évaluation AMC"
      subtitleType="export"
      handleLanguage={() => {}}
      locale={$referentielLocale}
    />
  </div>

  <div
    slot="sidebar"
    class="w-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
  >
    <SideMenu
      {addExercise}
      hideThirdAppsButton={true}
      excludedReferentiels={['geometrieDynamique', 'ressources', 'outils']}
    />
  </div>

  <div class="w-full pb-8 {$darkMode.isActive ? 'dark' : ''}">
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-4 mt-4">
      <section class="space-y-4">
        <div
          class="rounded-xl border-2 border-dashed p-4 transition-colors {isDropTargetActive
            ? 'border-coopmaths-action bg-coopmaths-action/10'
            : 'border-coopmaths-struct-light/40 bg-coopmaths-canvas-dark/40 dark:bg-coopmathsdark-canvas-dark/50'}"
          role="region"
          aria-label="Zone de dépôt d'exercices AMC"
          on:dragenter|preventDefault={() => {
            isDropTargetActive = true
          }}
          on:dragover|preventDefault
          on:dragleave|preventDefault={() => {
            isDropTargetActive = false
          }}
          on:drop={handleDrop}
        >
          <p
            class="font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            Zone centrale de composition AMC
          </p>
          <p
            class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus mt-1"
          >
            Dépose un exercice depuis la colonne de gauche, ou clique simplement
            sur un exercice du référentiel.
          </p>
        </div>

        {#if exercices.length === 0}
          <div
            class="rounded-xl border p-6 text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >
            Aucun exercice sélectionné pour AMC.
          </div>
        {:else}
          {#each exercices as exercice, exerciseIndex}
            <article
              class="rounded-2xl border border-coopmaths-struct-light/40 bg-coopmaths-canvas-dark/30 p-4 dark:bg-coopmathsdark-canvas-dark/40 dark:border-coopmathsdark-struct-light/30"
            >
              <header
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <h2
                    class="font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
                  >
                    {exercice.id} - {exercice.titre}
                  </h2>
                  <button
                    type="button"
                    class="rounded border border-red-400 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
                    aria-label="Supprimer le groupe"
                    on:click={() => deleteExercise(exerciseIndex)}
                  >
                    Supprimer
                  </button>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span
                    class="rounded bg-coopmaths-canvas px-2 py-1 dark:bg-coopmathsdark-canvas"
                  >
                    Type: {exercice.amcType}
                  </span>
                  <span
                    class="rounded bg-coopmaths-canvas px-2 py-1 dark:bg-coopmathsdark-canvas"
                  >
                    Seed: {groupSettings[exerciseIndex]?.seed}
                  </span>
                  <button
                    type="button"
                    class="rounded border px-2 py-1"
                    on:click={() => {
                      selectedExerciseIndex = exerciseIndex
                    }}
                  >
                    Sélectionner le groupe
                  </button>
                </div>
              </header>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each getPreviewDisplayItems(exercice, exerciseIndex) as item}
                  {#if item.kind === 'hybridContainer'}
                    <div
                      class="md:col-span-2 rounded-xl border-2 border-coopmaths-action/50 bg-coopmaths-canvas/25 p-3 dark:bg-coopmathsdark-canvas/25"
                    >
                      <div class="mb-1 flex items-center justify-between gap-1">
                        <p
                          class="text-xs font-semibold uppercase tracking-wide text-coopmaths-struct dark:text-coopmathsdark-struct"
                        >
                          {item.header.label}
                        </p>
                      </div>

                      <div
                        class="amc-hybrid-header-card rounded-xl border border-coopmaths-struct-light/40 bg-white/80 p-4 dark:bg-coopmathsdark-canvas-dark/70 dark:border-coopmathsdark-struct-light/30"
                      >
                        <p
                          class="text-base font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
                        >
                          Énoncé commun
                        </p>
                        {#if item.header.htmlContent || item.header.enonce}
                          <div class="mt-2">
                            <AmcEnonceHtml
                              content={item.header.htmlContent ||
                                item.header.enonce}
                            />
                          </div>
                        {/if}
                      </div>

                      <div
                        class="amc-hybrid-children mt-3 grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {#each item.children as block}
                          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                          <div
                            role={block.ref ? 'button' : undefined}
                            tabindex={block.ref ? 0 : undefined}
                            class="amc-hybrid-child rounded-xl p-1 text-left transition-colors {block.ref
                              ? `cursor-pointer ${
                                  isSelected(block.ref)
                                    ? 'ring-2 ring-coopmaths-action'
                                    : 'hover:bg-coopmaths-canvas/40 dark:hover:bg-coopmathsdark-canvas/40'
                                }`
                              : 'bg-coopmaths-canvas/20 dark:bg-coopmathsdark-canvas/20'}"
                            on:click={() => {
                              if (block.ref) selectBlock(block.ref)
                            }}
                            on:keydown={(e) => {
                              if (
                                block.ref &&
                                (e.key === 'Enter' || e.key === ' ')
                              )
                                selectBlock(block.ref)
                            }}
                          >
                            <div
                              class="mb-1 flex items-center justify-between gap-1"
                            >
                              <p
                                class="text-xs font-semibold uppercase tracking-wide text-coopmaths-action dark:text-coopmathsdark-action"
                              >
                                {block.label}
                              </p>
                              {#if block.ref}
                                <button
                                  type="button"
                                  class="shrink-0 rounded px-1 text-xs text-coopmaths-corpus/60 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                                  aria-label="Supprimer la question"
                                  on:click|stopPropagation={() =>
                                    deleteQuestion(
                                      block.ref!.exerciseIndex,
                                      block.ref!.questionIndex,
                                    )}>×</button
                                >
                              {/if}
                            </div>

                            {#if block.previewKind === 'qcm'}
                              <AmcPreviewQcm
                                enonce={block.enonce}
                                htmlContent={block.htmlContent}
                                mode={block.data?.type === 'qcmMult' ||
                                exercice.amcType === 'qcmMult'
                                  ? 'qcmMult'
                                  : 'qcmMono'}
                                choix={block.data?.propositions ?? []}
                              />
                            {:else if block.previewKind === 'num'}
                              <AmcPreviewNumeric
                                enonce={block.enonce}
                                htmlContent={block.htmlContent}
                                param={block.data?.propositions?.[0]?.reponse
                                  ?.param ??
                                  block.data?.reponse?.param ??
                                  {}}
                              />
                            {:else if block.previewKind === 'open'}
                              <AmcPreviewOpen
                                enonce={block.enonce}
                                htmlContent={block.htmlContent}
                                lignes={block.data?.propositions?.[0]?.statut ??
                                  block.data?.propositions?.[0]?.pointilles ??
                                  3}
                                pointilles={block.data?.propositions?.[0]
                                  ?.pointilles}
                                sanscadre={block.data?.propositions?.[0]
                                  ?.sanscadre}
                              />
                            {/if}
                          </div>
                        {/each}
                      </div>
                    </div>
                  {:else}
                    {@const block = item.block}
                    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                    <div
                      role={block.ref ? 'button' : undefined}
                      tabindex={block.ref ? 0 : undefined}
                      class="rounded-xl p-1 text-left transition-colors {block.ref
                        ? `cursor-pointer ${
                            isSelected(block.ref)
                              ? 'ring-2 ring-coopmaths-action'
                              : 'hover:bg-coopmaths-canvas/40 dark:hover:bg-coopmathsdark-canvas/40'
                          }`
                        : 'bg-coopmaths-canvas/20 dark:bg-coopmathsdark-canvas/20'}"
                      on:click={() => {
                        if (block.ref) selectBlock(block.ref)
                      }}
                      on:keydown={(e) => {
                        if (block.ref && (e.key === 'Enter' || e.key === ' '))
                          selectBlock(block.ref)
                      }}
                    >
                      <div class="mb-1 flex items-center justify-between gap-1">
                        <p
                          class="text-xs font-semibold uppercase tracking-wide text-coopmaths-action dark:text-coopmathsdark-action"
                        >
                          {block.label}
                        </p>
                        {#if block.ref}
                          <button
                            type="button"
                            class="shrink-0 rounded px-1 text-xs text-coopmaths-corpus/60 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                            aria-label="Supprimer la question"
                            on:click|stopPropagation={() =>
                              deleteQuestion(
                                block.ref!.exerciseIndex,
                                block.ref!.questionIndex,
                              )}>×</button
                          >
                        {/if}
                      </div>

                      {#if block.previewKind === 'qcm'}
                        <AmcPreviewQcm
                          enonce={block.enonce}
                          htmlContent={block.htmlContent}
                          mode={block.data?.type === 'qcmMult' ||
                          exercice.amcType === 'qcmMult'
                            ? 'qcmMult'
                            : 'qcmMono'}
                          choix={block.data?.propositions ?? []}
                        />
                      {:else if block.previewKind === 'num'}
                        <AmcPreviewNumeric
                          enonce={block.enonce}
                          htmlContent={block.htmlContent}
                          param={block.data?.propositions?.[0]?.reponse
                            ?.param ??
                            block.data?.reponse?.param ??
                            {}}
                        />
                      {:else if block.previewKind === 'open'}
                        <AmcPreviewOpen
                          enonce={block.enonce}
                          htmlContent={block.htmlContent}
                          lignes={block.data?.propositions?.[0]?.statut ??
                            block.data?.propositions?.[0]?.pointilles ??
                            3}
                          pointilles={block.data?.propositions?.[0]?.pointilles}
                          sanscadre={block.data?.propositions?.[0]?.sanscadre}
                        />
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </article>
          {/each}
        {/if}

        <details
          class="rounded-xl border border-coopmaths-struct-light/40 bg-coopmaths-canvas-dark/20 p-3 dark:border-coopmathsdark-struct-light/30 dark:bg-coopmathsdark-canvas-dark/30"
        >
          <summary
            class="cursor-pointer font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            LaTeX AMC généré en temps réel
          </summary>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded border px-3 py-1 text-xs"
              on:click={copyLatexToClipboard}
              disabled={!latexContent.trim()}
            >
              Copier le LaTeX
            </button>
            <button
              type="button"
              class="rounded border px-3 py-1 text-xs"
              on:click={downloadLatexFile}
              disabled={!latexContent.trim()}
            >
              Télécharger le .tex
            </button>
          </div>
          {#if latexExportStatus}
            <p
              class="mt-2 text-xs text-coopmaths-corpus dark:text-coopmathsdark-corpus"
            >
              {latexExportStatus}
            </p>
          {/if}
          <pre
            class="mt-3 max-h-72 overflow-auto text-xs whitespace-pre-wrap">{latexContent}</pre>
        </details>
      </section>

      <aside
        class="rounded-2xl border border-coopmaths-struct-light/40 bg-coopmaths-canvas-dark/30 p-4 dark:bg-coopmathsdark-canvas-dark/40 dark:border-coopmathsdark-struct-light/30 h-fit xl:sticky xl:top-4"
      >
        <h3
          class="font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
        >
          Paramétrage
        </h3>

        {#if selectedExerciseIndex != null}
          <div
            class="mt-4 space-y-3 rounded-xl border border-coopmaths-struct-light/30 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold">
                Groupe d'exercice ({getAMCGroupName(
                  exercices[selectedExerciseIndex],
                )})
              </p>
              <button
                type="button"
                class="rounded border px-3 py-1 text-xs"
                on:click={selectNextExercise}
                disabled={exercices.length < 2}
              >
                Groupe suivant
              </button>
            </div>
            <label for="amc-group-question-count" class="block text-xs"
              >Nombre de questions générées</label
            >
            <input
              id="amc-group-question-count"
              type="number"
              min="1"
              class="w-full rounded border px-2 py-1 text-sm"
              value={groupSettings[selectedExerciseIndex]?.questionCount}
              on:input={async (event) => {
                const value = Math.max(
                  1,
                  Number((event.currentTarget as HTMLInputElement).value) || 1,
                )
                const idx = selectedExerciseIndex!
                groupSettings[idx] = {
                  ...groupSettings[idx],
                  questionCount: value,
                  restitueCount: Math.min(
                    value,
                    groupSettings[idx]?.restitueCount ?? value,
                  ),
                }
                groupSettings = [...groupSettings]
                const exercice = exercices[idx] as any
                if (exercice) {
                  exercice.nbQuestions = value
                }
                await regenerateExercise(idx, groupSettings[idx]?.seed)
              }}
            />

            <label for="amc-group-restitue-count" class="block text-xs"
              >Nombre de questions a restituer (\restituegroupe)</label
            >
            <input
              id="amc-group-restitue-count"
              type="number"
              min="1"
              max={Math.max(
                1,
                Number(groupSettings[selectedExerciseIndex]?.questionCount) ||
                  1,
              )}
              class="w-full rounded border px-2 py-1 text-sm"
              value={groupSettings[selectedExerciseIndex]?.restitueCount}
              on:input={(event) => {
                const idx = selectedExerciseIndex!
                const maxAllowed = Math.max(
                  1,
                  Number(groupSettings[idx]?.questionCount) || 1,
                )
                const value = Math.max(
                  1,
                  Math.min(
                    Number((event.currentTarget as HTMLInputElement).value) ||
                      1,
                    maxAllowed,
                  ),
                )
                groupSettings[idx] = {
                  ...groupSettings[idx],
                  restitueCount: value,
                }
                groupSettings = [...groupSettings]
                updateLatexPreview()
              }}
            />

            <label class="mt-2 inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={groupSettings[selectedExerciseIndex]?.pageBreakBefore}
                on:change={(event) => {
                  const idx = selectedExerciseIndex!
                  groupSettings[idx] = {
                    ...groupSettings[idx],
                    pageBreakBefore: (event.currentTarget as HTMLInputElement)
                      .checked,
                  }
                  groupSettings = [...groupSettings]
                  updateLatexPreview()
                }}
              />
              Saut de page avant ce restituegroupe
            </label>

            <label class="mt-2 inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={groupSettings[selectedExerciseIndex]?.multicols}
                on:change={(event) => {
                  const idx = selectedExerciseIndex!
                  groupSettings[idx] = {
                    ...groupSettings[idx],
                    multicols: (event.currentTarget as HTMLInputElement)
                      .checked,
                  }
                  groupSettings = [...groupSettings]
                  updateLatexPreview()
                }}
              />
              Restituegroupe en multicolonnes (2)
            </label>

            <label for="amc-group-seed" class="block text-xs"
              >Graine de génération aléatoire</label
            >
            <input
              id="amc-group-seed"
              type="text"
              class="w-full rounded border px-2 py-1 text-sm"
              value={groupSettings[selectedExerciseIndex]?.seed}
              on:input={(event) => {
                groupSettings[selectedExerciseIndex!] = {
                  ...groupSettings[selectedExerciseIndex!],
                  seed: (event.currentTarget as HTMLInputElement).value,
                }
                groupSettings = [...groupSettings]
              }}
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded bg-coopmaths-action px-3 py-1 text-xs text-white"
                on:click={() => {
                  void regenerateExercise(
                    selectedExerciseIndex!,
                    groupSettings[selectedExerciseIndex!]?.seed,
                  )
                }}
              >
                Appliquer la graine
              </button>
              <button
                type="button"
                class="rounded border px-3 py-1 text-xs"
                on:click={() => {
                  void regenerateExercise(selectedExerciseIndex!)
                }}
              >
                Nouvelle graine
              </button>
            </div>
            <button
              type="button"
              class="mt-2 w-full rounded border border-red-400 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
              on:click={() => deleteExercise(selectedExerciseIndex!)}
            >
              Supprimer le groupe
            </button>
          </div>
        {/if}

        {#if selectedRef == null}
          <p
            class="mt-4 text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >
            Sélectionne un bloc dans la zone centrale pour éditer ses paramètres
            fins.
          </p>
        {:else if selectedQuestionHasTikzPicture()}
          <div
            class="mt-4 space-y-2 rounded-xl border border-coopmaths-struct-light/30 p-3"
          >
            <p class="text-sm font-semibold">
              Figure TikZ (question sélectionnée)
            </p>
            <label for="amc-tikz-scale" class="block text-xs"
              >{selectedQuestionClipDimensionsLabel}</label
            >
            <input
              id="amc-tikz-scale"
              type="range"
              min="0.5"
              max="1.2"
              step="0.05"
              bind:value={tikzScaleSliderValue}
              on:input={(event) =>
                setSelectedQuestionTikzScaleFactor(
                  Number((event.currentTarget as HTMLInputElement).value) ||
                    tikzScaleSliderValue ||
                    1,
                )}
            />
            <p
              class="text-xs text-coopmaths-corpus dark:text-coopmathsdark-corpus"
            >
              Facteur courant: {formatTikzScale(
                selectedQuestionTikzScaleFactor,
              )}
              (plage 0.5 à 1.2)
            </p>
          </div>
        {/if}

        {#if selectedRef != null}
          {#if selectedRef.kind === 'num'}
            <div class="mt-4 space-y-2">
              <p class="text-sm font-semibold">AMCnumericChoices</p>
              <label for="amc-num-digits" class="block text-xs">Digits</label>
              <input
                id="amc-num-digits"
                type="number"
                min="1"
                class="w-full rounded border px-2 py-1 text-sm"
                on:input={(event) =>
                  updateSelectedNumericParam(
                    'digits',
                    Math.max(
                      1,
                      Number((event.currentTarget as HTMLInputElement).value) ||
                        1,
                    ),
                  )}
              />

              <label for="amc-num-decimals" class="block text-xs"
                >Decimals</label
              >
              <input
                id="amc-num-decimals"
                type="number"
                min="0"
                class="w-full rounded border px-2 py-1 text-sm"
                on:input={(event) =>
                  updateSelectedNumericParam(
                    'decimals',
                    Math.max(
                      0,
                      Number((event.currentTarget as HTMLInputElement).value) ||
                        0,
                    ),
                  )}
              />

              <label for="amc-num-approx" class="block text-xs">Approx</label>
              <input
                id="amc-num-approx"
                type="number"
                min="0"
                class="w-full rounded border px-2 py-1 text-sm"
                on:input={(event) =>
                  updateSelectedNumericParam(
                    'approx',
                    Math.max(
                      0,
                      Number((event.currentTarget as HTMLInputElement).value) ||
                        0,
                    ),
                  )}
              />

              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  on:change={(event) =>
                    updateSelectedNumericParam(
                      'signe',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Autoriser le signe
              </label>
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  on:change={(event) =>
                    updateSelectedNumericParam(
                      'vertical',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Affichage vertical
              </label>
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isSelectedBlockMulticolsEnabled()}
                  on:change={(event) =>
                    updateSelectedBlockMulticols(
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                {exercices[selectedRef.exerciseIndex]?.amcType === 'AMCHybride'
                  ? 'Bloc hybride en multicolonnes (2)'
                  : 'Question en multicolonnes (2)'}
              </label>
              <button
                type="button"
                class="mt-2 w-full rounded border px-3 py-1 text-xs"
                on:click={appliquerParametresQuestionAuGroupe}
              >
                Appliquer ces parametres a tout le groupe
              </button>
            </div>
          {:else if selectedRef.kind === 'open'}
            <div class="mt-4 space-y-2">
              <p class="text-sm font-semibold">AMCOpen</p>
              <label for="amc-open-lines" class="block text-xs"
                >Nombre de lignes (statut)</label
              >
              <input
                id="amc-open-lines"
                type="number"
                min="1"
                class="w-full rounded border px-2 py-1 text-sm"
                on:input={(event) =>
                  updateSelectedOpenParam(
                    'statut',
                    Math.max(
                      1,
                      Number((event.currentTarget as HTMLInputElement).value) ||
                        1,
                    ),
                  )}
              />

              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  on:change={(event) =>
                    updateSelectedOpenParam(
                      'pointilles',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Pointillés
              </label>
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  on:change={(event) =>
                    updateSelectedOpenParam(
                      'sanscadre',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Sans cadre
              </label>
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isSelectedBlockMulticolsEnabled()}
                  on:change={(event) =>
                    updateSelectedBlockMulticols(
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                {exercices[selectedRef.exerciseIndex]?.amcType === 'AMCHybride'
                  ? 'Bloc hybride en multicolonnes (2)'
                  : 'Question en multicolonnes (2)'}
              </label>
              <button
                type="button"
                class="mt-2 w-full rounded border px-3 py-1 text-xs"
                on:click={appliquerParametresQuestionAuGroupe}
              >
                Appliquer ces parametres a tout le groupe
              </button>
            </div>
          {:else}
            <div class="mt-4 space-y-2">
              <p class="text-sm font-semibold">QCM</p>
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  on:change={(event) =>
                    updateSelectedQcmOption(
                      'ordered',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Réponses ordonnées
              </label>
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  on:change={(event) =>
                    updateSelectedQcmOption(
                      'vertical',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Affichage vertical
              </label>
              <label for="amc-qcm-last-choice" class="block text-xs"
                >Index de lastChoice</label
              >
              <input
                id="amc-qcm-last-choice"
                type="number"
                min="0"
                class="w-full rounded border px-2 py-1 text-sm"
                on:input={(event) =>
                  updateSelectedQcmOption(
                    'lastChoice',
                    Math.max(
                      0,
                      Number((event.currentTarget as HTMLInputElement).value) ||
                        0,
                    ),
                  )}
              />
              <label class="mt-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isSelectedBlockMulticolsEnabled()}
                  on:change={(event) =>
                    updateSelectedBlockMulticols(
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                {exercices[selectedRef.exerciseIndex]?.amcType === 'AMCHybride'
                  ? 'Bloc hybride en multicolonnes (2)'
                  : 'Question en multicolonnes (2)'}
              </label>
              <button
                type="button"
                class="mt-2 w-full rounded border px-3 py-1 text-xs"
                on:click={appliquerParametresQuestionAuGroupe}
              >
                Appliquer ces parametres a tout le groupe
              </button>
            </div>
          {/if}
        {/if}

        {#if groupConsistencyReport && groupConsistencyReport.missingGroupDefinitions.length > 0}
          <div class="mt-4 rounded border border-coopmaths-action p-3 text-xs">
            <p class="font-semibold">Alerte cohérence AMC</p>
            <ul class="mt-2 list-disc list-inside">
              {#each groupConsistencyReport.missingGroupDefinitions as name}
                <li>{name}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</SetupShell>

<style>
  .amc-hybrid-header-card :global(.text-sm) {
    font-size: 0.92rem !important;
    line-height: 1.3rem !important;
  }

  .amc-hybrid-children :global(.text-sm) {
    font-size: 0.76rem !important;
    line-height: 1.05rem !important;
  }

  .amc-hybrid-children :global(.text-xs) {
    font-size: 0.66rem !important;
    line-height: 0.9rem !important;
  }

  .amc-hybrid-children :global(.p-3) {
    padding: 0.55rem !important;
  }
</style>
