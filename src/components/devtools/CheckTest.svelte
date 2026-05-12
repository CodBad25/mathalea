<script lang="ts">
  import { onMount } from 'svelte'
  import type { MathfieldElement } from 'mathlive'
  import Keyboard from '../keyboard/Keyboard.svelte'
  import { keyboardState } from '../keyboard/stores/keyboardStore'
  import type { BlockForKeyboard } from '../keyboard/types/keyboardContent'
  import {
    all,
    seq,
    contains,
    doesNotContain,
    distributed,
    equals,
    extractedRadicands,
    irreducibleFractions,
    isReduced,
    noNumericComputation,
    noTrivialFactor,
    noDecimal,
    sameDescribedSet,
    sameParametricLine,
    setEquality,
    singleParameterVariable,
    stringEquals,
    termsGrouped,
  } from '../../lib/interactif/checks'
  import type { Check, CompareResult } from '../../lib/interactif/checks'

  type CheckKind =
    | 'equals'
    | 'contains'
    | 'doesNotContain'
    | 'isReduced'
    | 'noTrivialFactor'
    | 'noNumericComputation'
    | 'termsGrouped'
    | 'distributed'
    | 'irreducibleFractions'
    | 'noDecimal'
    | 'extractedRadicands'
    | 'sameDescribedSet'
    | 'sameParametricLine'
    | 'setEquality'
    | 'singleParameterVariable'
    | 'stringEquals'

  type CheckConfig = {
    id: number
    kind: CheckKind
    name: string
    weight: string | number
    feedbackEnabled: boolean
    feedbackOnSuccess: boolean
    feedbackKo: string
    feedbackOk: string
    // equals
    equalsMode: 'exact' | 'tolerance'
    tolerance: string | number
    // contains / doesNotContain
    pattern: string
    // setEquality / sameDescribedSet
    variable: string
    // singleParameterVariable
    expectedParameter: string
    strictExpectedParameter: boolean
    // stringEquals
    trim: boolean
    ignoreCase: boolean
  }

  const CHECK_LABELS: Record<CheckKind, string> = {
    equals: 'equals',
    contains: 'contains',
    doesNotContain: 'doesNotContain',
    isReduced: 'isReduced',
    noTrivialFactor: 'noTrivialFactor',
    noNumericComputation: 'noNumericComputation',
    termsGrouped: 'termsGrouped',
    distributed: 'distributed',
    irreducibleFractions: 'irreducibleFractions',
    noDecimal: 'noDecimal',
    extractedRadicands: 'extractedRadicands',
    sameDescribedSet: 'sameDescribedSet',
    sameParametricLine: 'sameParametricLine',
    setEquality: 'setEquality',
    singleParameterVariable: 'singleParameterVariable',
    stringEquals: 'stringEquals',
  }

  const CHECK_DESCRIPTIONS: Record<CheckKind, string> = {
    equals: "Vérifie l'égalité mathématique (ou avec tolérance numérique)",
    contains: 'Vérifie que la saisie contient un motif (texte ou /regex/)',
    doesNotContain: 'Vérifie que la saisie ne contient pas un motif',
    isReduced:
      'Compose noTrivialFactor, noNumericComputation, termsGrouped et distributed',
    noTrivialFactor: 'Refuse les facteurs triviaux et les termes nuls',
    noNumericComputation: 'Refuse les calculs numériques non effectués',
    termsGrouped: 'Vérifie que les termes semblables sont regroupés',
    distributed: 'Vérifie que les produits sur des sommes sont développés',
    irreducibleFractions:
      'Vérifie que toutes les fractions saisies sont irréductibles',
    noDecimal: 'Refuse les écritures décimales non entières dans la saisie',
    extractedRadicands:
      'Vérifie que les facteurs carrés sont extraits des racines carrées',
    sameDescribedSet:
      'Vérifie que deux expressions décrivent le même ensemble quand la variable parcourt Z',
    sameParametricLine:
      'Vérifie que deux systèmes paramétriques décrivent la même droite de l’espace',
    setEquality: "Vérifie l'égalité de deux ensembles en extension",
    singleParameterVariable:
      'Vérifie que le système paramétrique utilise une seule variable de paramétrage',
    stringEquals:
      'Compare directement la saisie textuelle à la réponse attendue',
  }

  const ALL_BLOCKS: BlockForKeyboard[] = [
    'numbers',
    'fullOperations',
    'variables',
    'trigo',
    'greek',
    'ensemble',
    'compare',
    'basicOperations',
    'complexes',
    'advanced',
    'equationsTerminale',
    'limites',
    'suite',
    'probabilite',
    'angles',
    'degre',
    'majuscules',
    'minuscules',
  ]

  const DEFAULT_BLOCKS: BlockForKeyboard[] = [
    'numbers',
    'fullOperations',
    'variables',
    'trigo',
    'greek',
    'ensemble',
    'compare',
  ]

  let selectedBlocks: BlockForKeyboard[] = [...DEFAULT_BLOCKS]

  let nextId = 0
  let checks: CheckConfig[] = []
  let combinator: 'all' | 'seq' = 'all'
  let expectedAnswer = ''
  let userInput = ''
  let expandedIds = new Set<number>()

  let result: CompareResult | null = null
  let runtimeError = ''

  const MATH_FIELD_ID = 'check-test-mf'
  const ANSWER_FIELD_ID = 'check-test-answer-mf'

  // Capture URL params at module evaluation time, before the SPA (App.svelte /
  // mathaleaUpdateUrlFromExercicesParams) rebuilds and overwrites the URL.
  const INITIAL_URL_PARAMS =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()

  function attachMathField(id: string, onInput: (val: string) => void) {
    const mf = document.getElementById(id) as MathfieldElement | null
    if (!mf) return
    mf.addEventListener('input', () => onInput(mf.value))
    mf.addEventListener('focus', () => {
      $keyboardState.idMathField = id
      $keyboardState.blocks = selectedBlocks
      $keyboardState.isInLine = false
      $keyboardState.isVisible = true
    })
  }

  // ---- URL state ----

  type SerializedCheck = Omit<CheckConfig, 'id'>

  function serializeState(): string {
    const params = new URLSearchParams(window.location.search)
    params.set('v', 'check-test')
    if (expectedAnswer) params.set('a', expectedAnswer)
    else params.delete('a')
    if (userInput) params.set('si', userInput)
    else params.delete('si')
    params.set('c', combinator)
    if (checks.length > 0) {
      const slim: SerializedCheck[] = checks.map(({ id: _id, ...rest }) => rest)
      params.set('q', btoa(unescape(encodeURIComponent(JSON.stringify(slim)))))
    } else {
      params.delete('q')
    }
    return params.toString()
  }

  function loadFromUrl() {
    const params = INITIAL_URL_PARAMS
    const a = params.get('a')
    if (a) expectedAnswer = a
    const s = params.get('si')
    if (s) userInput = s
    const c = params.get('c')
    if (c === 'all' || c === 'seq') combinator = c
    const q = params.get('q')
    if (q) {
      try {
        const slim: SerializedCheck[] = JSON.parse(
          decodeURIComponent(escape(atob(q))),
        )
        checks = slim.map((s) => ({ ...s, id: nextId++ }))
      } catch (e) {
        console.error('[CheckTest] loadFromUrl parse error', e)
      }
    }
  }

  let urlSyncTimeout: ReturnType<typeof setTimeout>

  function scheduleUrlSync() {
    clearTimeout(urlSyncTimeout)
    urlSyncTimeout = setTimeout(() => {
      history.replaceState(null, '', '?' + serializeState())
    }, 400)
  }

  $: {
    void expectedAnswer
    void userInput
    void combinator
    void checks
    if (typeof window !== 'undefined') scheduleUrlSync()
  }

  onMount(() => {
    loadFromUrl()

    // Student input field — standard attachment
    attachMathField(MATH_FIELD_ID, (v) => (userInput = v))

    // Answer field — the input listener must NOT be attached before the initial
    // value is set. MathfieldElement fires `input` asynchronously after a
    // programmatic .value assignment; if the listener existed at that moment it
    // would read an empty .value and silently wipe the URL-loaded answer.
    // Solution: attach the input listener only on the first focus (user intent),
    // never during initialisation.
    const af = document.getElementById(
      ANSWER_FIELD_ID,
    ) as MathfieldElement | null
    if (af) {
      let answerListenerAttached = false
      af.addEventListener('focus', () => {
        $keyboardState.idMathField = ANSWER_FIELD_ID
        $keyboardState.blocks = selectedBlocks
        $keyboardState.isInLine = false
        $keyboardState.isVisible = true
        if (!answerListenerAttached) {
          answerListenerAttached = true
          af.addEventListener('input', () => {
            expectedAnswer = af.value
          })
        }
      })
      // Set the display value after the element has had a tick to initialise
      window.requestAnimationFrame(() => {
        if (expectedAnswer) af.value = expectedAnswer
      })
    }

    $keyboardState.isInLine = false
    $keyboardState.blocks = selectedBlocks
    $keyboardState.isVisible = true
    const mf = document.getElementById(MATH_FIELD_ID) as MathfieldElement | null
    if (mf) {
      $keyboardState.idMathField = MATH_FIELD_ID
      window.requestAnimationFrame(() => {
        if (userInput) mf.value = userInput
      })
      window.setTimeout(() => mf.focus(), 50)
    }
  })

  $: {
    $keyboardState.blocks = selectedBlocks
  }

  function toggleBlock(block: BlockForKeyboard) {
    if (selectedBlocks.includes(block)) {
      selectedBlocks = selectedBlocks.filter((b) => b !== block)
    } else {
      selectedBlocks = [...selectedBlocks, block]
    }
  }

  function defaultName(kind: CheckKind): string {
    const count = checks.filter((c) => c.kind === kind).length
    return count === 0 ? kind : `${kind}_${count + 1}`
  }

  function addCheck(kind: CheckKind) {
    const config: CheckConfig = {
      id: nextId++,
      kind,
      name: defaultName(kind),
      weight: '',
      feedbackEnabled: true,
      feedbackOnSuccess: false,
      feedbackKo: '',
      feedbackOk: '',
      equalsMode: 'exact',
      tolerance: '',
      pattern: '',
      variable: '',
      expectedParameter: '',
      strictExpectedParameter: false,
      trim: false,
      ignoreCase: false,
    }
    expandedIds = new Set([...expandedIds, config.id])
    checks = [...checks, config]
  }

  function removeCheck(id: number) {
    checks = checks.filter((c) => c.id !== id)
    expandedIds.delete(id)
    expandedIds = new Set(expandedIds)
  }

  function updateCheckConfig<K extends keyof CheckConfig>(
    id: number,
    key: K,
    value: CheckConfig[K],
  ) {
    checks = checks.map((check) =>
      check.id === id ? { ...check, [key]: value } : check,
    )
  }

  function toggleExpand(id: number) {
    if (expandedIds.has(id)) {
      expandedIds.delete(id)
    } else {
      expandedIds.add(id)
    }
    expandedIds = new Set(expandedIds)
  }

  function moveUp(index: number) {
    if (index === 0) return
    const arr = [...checks]
    ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
    checks = arr
  }

  function moveDown(index: number) {
    if (index === checks.length - 1) return
    const arr = [...checks]
    ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
    checks = arr
  }

  function parsePattern(s: string): string | RegExp {
    const m = s.match(/^\/(.+)\/([gimsuy]*)$/)
    if (m) {
      try {
        return new RegExp(m[1], m[2])
      } catch {
        return s
      }
    }
    return s
  }

  function asText(value: string | number | null | undefined): string {
    return value == null ? '' : String(value)
  }

  function parseOptionalNumber(value: string | number): number | undefined {
    const text = asText(value).trim()
    if (text === '') return undefined
    const parsed = parseFloat(text)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  function formatTolerance(cfg: CheckConfig): string {
    if (cfg.equalsMode === 'exact') return 'Comparaison exacte'
    const tol = parseOptionalNumber(cfg.tolerance) ?? 0
    return `Tolérance effective : 10^${tol} = ${10 ** tol}`
  }

  function buildCheck(cfg: CheckConfig): Check {
    const weight = parseOptionalNumber(cfg.weight)
    const overrides = {
      name: cfg.name.trim() || cfg.kind,
      weight,
      feedbackEnabled: cfg.feedbackEnabled,
      feedbackOnSuccess: cfg.feedbackOnSuccess,
      feedbackKo: cfg.feedbackKo.trim() || undefined,
      feedbackOk: cfg.feedbackOk.trim() || undefined,
    }
    switch (cfg.kind) {
      case 'equals': {
        return equals({
          ...overrides,
          tolerance:
            cfg.equalsMode === 'tolerance'
              ? (parseOptionalNumber(cfg.tolerance) ?? 0)
              : undefined,
        })
      }
      case 'contains':
        return contains({ pattern: parsePattern(cfg.pattern), ...overrides })
      case 'doesNotContain':
        return doesNotContain({
          pattern: parsePattern(cfg.pattern),
          ...overrides,
        })
      case 'isReduced':
        return isReduced(overrides)
      case 'noTrivialFactor':
        return noTrivialFactor(overrides)
      case 'noNumericComputation':
        return noNumericComputation(overrides)
      case 'termsGrouped':
        return termsGrouped(overrides)
      case 'distributed':
        return distributed(overrides)
      case 'irreducibleFractions':
        return irreducibleFractions(overrides)
      case 'noDecimal':
        return noDecimal(overrides)
      case 'extractedRadicands':
        return extractedRadicands(overrides)
      case 'sameDescribedSet':
        return sameDescribedSet({
          ...overrides,
          variable: cfg.variable.trim() || undefined,
        })
      case 'sameParametricLine':
        return sameParametricLine(overrides)
      case 'setEquality':
        return setEquality({
          ...overrides,
          variable: cfg.variable.trim() || undefined,
        })
      case 'singleParameterVariable':
        return singleParameterVariable({
          ...overrides,
          expectedParameter: cfg.expectedParameter.trim() || undefined,
          strictExpectedParameter: cfg.strictExpectedParameter,
        })
      case 'stringEquals':
        return stringEquals({
          ...overrides,
          trim: cfg.trim,
          ignoreCase: cfg.ignoreCase,
        })
    }
  }

  function evaluate() {
    runtimeError = ''
    result = null
    if (checks.length === 0 || expectedAnswer.trim() === '') return
    try {
      const builtChecks = checks.map(buildCheck)
      const comparator =
        combinator === 'all' ? all(builtChecks) : seq(builtChecks)
      result = comparator(userInput, expectedAnswer) as CompareResult
    } catch (e) {
      runtimeError = e instanceof Error ? e.message : String(e)
    }
  }

  $: {
    // Reactive trigger — all dependencies watched
    void userInput
    void expectedAnswer
    void combinator
    void checks
    evaluate()
  }

  const SCORE_COLOR = (score: number) => {
    if (score >= 1) return 'text-green-600 dark:text-green-400'
    if (score > 0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  let linkCopied = false

  async function copyLink() {
    const url = new URL(window.location.origin + window.location.pathname)
    url.search = serializeState()
    await navigator.clipboard.writeText(url.toString())
    linkCopied = true
    setTimeout(() => (linkCopied = false), 2000)
  }

  // ---- Code generation ----

  function serializePattern(s: string): string {
    const m = s.match(/^\/(.+)\/([gimsuy]*)$/)
    if (m) return `/${m[1]}/${m[2]}`
    return JSON.stringify(s)
  }

  function generateCheckCode(cfg: CheckConfig): string {
    const opts: string[] = []

    if (cfg.kind === 'contains' || cfg.kind === 'doesNotContain') {
      opts.push(`pattern: ${serializePattern(cfg.pattern)}`)
    }
    if (
      (cfg.kind === 'setEquality' || cfg.kind === 'sameDescribedSet') &&
      cfg.variable.trim()
    ) {
      opts.push(`variable: ${JSON.stringify(cfg.variable.trim())}`)
    }
    if (cfg.kind === 'equals') {
      if (cfg.equalsMode === 'tolerance') {
        const tol = parseOptionalNumber(cfg.tolerance) ?? 0
        opts.push(`tolerance: ${tol}`)
      }
    }
    if (cfg.kind === 'singleParameterVariable') {
      if (cfg.expectedParameter.trim()) {
        opts.push(
          `expectedParameter: ${JSON.stringify(cfg.expectedParameter.trim())}`,
        )
      }
      if (cfg.strictExpectedParameter)
        opts.push('strictExpectedParameter: true')
    }
    if (cfg.kind === 'stringEquals') {
      if (cfg.trim) opts.push('trim: true')
      if (cfg.ignoreCase) opts.push('ignoreCase: true')
    }

    const effectiveName = cfg.name.trim() || cfg.kind
    if (effectiveName !== cfg.kind)
      opts.push(`name: ${JSON.stringify(effectiveName)}`)

    const weight = parseOptionalNumber(cfg.weight)
    if (weight !== undefined) opts.push(`weight: ${weight}`)
    if (!cfg.feedbackEnabled) opts.push('feedbackEnabled: false')
    if (cfg.feedbackOnSuccess) opts.push('feedbackOnSuccess: true')
    if (cfg.feedbackKo.trim())
      opts.push(`feedbackKo: ${JSON.stringify(cfg.feedbackKo.trim())}`)
    if (cfg.feedbackOk.trim())
      opts.push(`feedbackOk: ${JSON.stringify(cfg.feedbackOk.trim())}`)

    if (opts.length === 0) return `${cfg.kind}()`
    const inline = `{ ${opts.join(', ')} }`
    if (inline.length <= 60) return `${cfg.kind}(${inline})`
    return `${cfg.kind}({\n    ${opts.join(',\n    ')},\n  })`
  }

  function generateCode(cfgs: CheckConfig[], comb: 'all' | 'seq'): string {
    if (cfgs.length === 0) return ''

    const usedFns = new Set<string>([comb])
    for (const cfg of cfgs) usedFns.add(cfg.kind)
    const importLine = `import { ${[...usedFns].join(', ')} } from '../../lib/interactif/checks'`

    const checkLines = cfgs
      .map((cfg) => `  ${generateCheckCode(cfg)}`)
      .join(',\n')
    const expr = `${comb}([\n${checkLines},\n])`

    return `${importLine}\n\n${expr}`
  }

  let codeCopied = false

  $: generatedCode = generateCode(checks, combinator)

  async function copyCode() {
    await navigator.clipboard.writeText(generatedCode)
    codeCopied = true
    setTimeout(() => (codeCopied = false), 2000)
  }
</script>

<div
  class="min-h-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus"
>
  <!-- Header -->
  <header
    class="bg-coopmaths-struct dark:bg-coopmathsdark-struct text-white px-6 py-4 flex items-center justify-between shadow-md"
  >
    <div>
      <h1 class="text-xl font-bold tracking-wide">
        Check Test — Multi-comparaison
      </h1>
      <p class="text-sm opacity-75 mt-0.5">
        Testez les nouvelles fonctions de vérification interactivement
      </p>
    </div>
    <button
      class="flex items-center gap-2 transition px-3 py-1.5 rounded-lg text-sm font-medium
             {linkCopied ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}"
      on:click={copyLink}
    >
      <i class="bx {linkCopied ? 'bx-check' : 'bx-link'}"></i>
      {linkCopied ? 'Lien copié !' : 'Partager le lien'}
    </button>
  </header>

  <div class="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-72px)]">
    <!-- ====== LEFT PANEL: Configuration ====== -->
    <div
      class="lg:w-[480px] xl:w-[520px] flex-shrink-0 border-r border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark overflow-y-auto"
    >
      <div class="p-5 space-y-5">
        <!-- Expected answer -->
        <section>
          <label
            class="block text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-2"
          >
            Réponse attendue
          </label>
          <div
            class="check-test-field-wrapper rounded-lg border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark
                   bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest"
          >
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <math-field
              id={ANSWER_FIELD_ID}
              virtual-keyboard-mode="manual"
              class="check-test-field"
            ></math-field>
          </div>
        </section>

        <!-- Combinator -->
        <section>
          <label
            class="block text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-2"
          >
            Combinateur
          </label>
          <div class="flex gap-2">
            {#each ['all', 'seq'] as const as mode}
              <button
                class="flex-1 py-2 rounded-lg border text-sm font-semibold transition-all
                       {combinator === mode
                  ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-white border-transparent shadow'
                  : 'border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
                on:click={() => (combinator = mode)}
              >
                {mode}
                <span class="ml-1 font-normal opacity-70 text-xs">
                  {mode === 'all' ? '(tous)' : '(séquence)'}
                </span>
              </button>
            {/each}
          </div>
          <p
            class="text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mt-1.5"
          >
            {combinator === 'all'
              ? 'Tous les checks sont évalués. Le score peut être partiel si des poids sont définis.'
              : "Les checks sont évalués dans l'ordre et s'arrêtent au premier échec."}
          </p>
        </section>

        <!-- Checks list -->
        <section>
          <div class="flex items-center justify-between mb-2">
            <label
              class="text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
            >
              Checks ({checks.length})
            </label>
          </div>

          {#if checks.length === 0}
            <div
              class="text-sm text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light text-center py-6 border border-dashed border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark rounded-lg"
            >
              Aucun check ajouté — utilisez les boutons ci-dessous
            </div>
          {:else}
            <div class="space-y-2">
              {#each checks as cfg, i (cfg.id)}
                {@const isExpanded = expandedIds.has(cfg.id)}
                {@const detail = result?.details?.find(
                  (d) => d.name === (cfg.name.trim() || cfg.kind),
                )}
                <div
                  class="rounded-lg border overflow-hidden
                            {detail !== undefined
                    ? detail.passed
                      ? 'border-green-400 dark:border-green-600'
                      : 'border-red-400 dark:border-red-600'
                    : 'border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark'}"
                >
                  <!-- Check header -->
                  <div
                    class="flex items-center gap-2 px-3 py-2 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
                  >
                    <!-- Status dot -->
                    {#if detail !== undefined}
                      <span
                        class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs
                                   {detail.passed
                          ? 'bg-green-500'
                          : 'bg-red-500'}"
                      >
                        <i class="bx {detail.passed ? 'bx-check' : 'bx-x'}"></i>
                      </span>
                    {:else}
                      <span
                        class="flex-shrink-0 w-5 h-5 rounded-full bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest"
                      ></span>
                    {/if}

                    <button
                      class="flex-1 text-left"
                      on:click={() => toggleExpand(cfg.id)}
                    >
                      <span class="font-mono text-sm font-bold"
                        >{cfg.name.trim() || cfg.kind}</span
                      >
                      <span class="ml-2 text-xs opacity-60 font-normal"
                        >{CHECK_LABELS[cfg.kind]}</span
                      >
                      {#if asText(cfg.weight).trim()}
                        <span class="ml-1 text-xs opacity-60"
                          >× {cfg.weight}</span
                        >
                      {/if}
                    </button>

                    <div class="flex items-center gap-1">
                      <button
                        class="p-1 opacity-50 hover:opacity-100 disabled:opacity-20"
                        disabled={i === 0}
                        on:click={() => moveUp(i)}
                        title="Monter"
                      >
                        <i class="bx bx-chevron-up text-base"></i>
                      </button>
                      <button
                        class="p-1 opacity-50 hover:opacity-100 disabled:opacity-20"
                        disabled={i === checks.length - 1}
                        on:click={() => moveDown(i)}
                        title="Descendre"
                      >
                        <i class="bx bx-chevron-down text-base"></i>
                      </button>
                      <button
                        class="p-1 opacity-50 hover:opacity-100 text-red-500"
                        on:click={() => removeCheck(cfg.id)}
                        title="Supprimer"
                      >
                        <i class="bx bx-trash text-base"></i>
                      </button>
                      <button
                        class="p-1 opacity-50 hover:opacity-100"
                        on:click={() => toggleExpand(cfg.id)}
                        title="Configurer"
                      >
                        <i
                          class="bx {isExpanded
                            ? 'bx-chevron-up'
                            : 'bx-chevron-down'} text-base"
                        ></i>
                      </button>
                    </div>
                  </div>

                  <!-- Check config (expanded) -->
                  {#if isExpanded}
                    <div
                      class="p-3 space-y-3 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-sm"
                      on:input={() => (checks = checks)}
                      on:change={() => (checks = checks)}
                    >
                      <p
                        class="text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light italic"
                      >
                        {CHECK_DESCRIPTIONS[cfg.kind]}
                      </p>

                      <!-- Kind-specific options -->
                      {#if cfg.kind === 'equals'}
                        <div class="space-y-2">
                          <div>
                            <label
                              class="block text-xs font-semibold mb-1 opacity-70"
                              >Mode de comparaison</label
                            >
                            <select
                              value={cfg.equalsMode}
                              on:change={(event) =>
                                updateCheckConfig(
                                  cfg.id,
                                  'equalsMode',
                                  (event.currentTarget as HTMLSelectElement)
                                    .value as CheckConfig['equalsMode'],
                                )}
                              class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                            >
                              <option value="exact">exact</option>
                              <option value="tolerance">tolérance 10^n</option>
                            </select>
                          </div>
                          {#if cfg.equalsMode === 'tolerance'}
                            <div>
                              <label
                                class="block text-xs font-semibold mb-1 opacity-70"
                                >Exposant de tolérance</label
                              >
                              <input
                                type="number"
                                step="any"
                                placeholder="vide ou 0 : 10^0 = 1 ; -2 : 10^-2"
                                value={cfg.tolerance}
                                on:input={(event) =>
                                  updateCheckConfig(
                                    cfg.id,
                                    'tolerance',
                                    (event.currentTarget as HTMLInputElement)
                                      .value,
                                  )}
                                class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                              />
                            </div>
                          {/if}
                          <p
                            class="text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
                          >
                            {formatTolerance(cfg)}
                          </p>
                        </div>
                      {/if}

                      {#if cfg.kind === 'contains' || cfg.kind === 'doesNotContain'}
                        <div>
                          <label
                            class="block text-xs font-semibold mb-1 opacity-70"
                            >Motif <span class="font-normal opacity-60"
                              >(texte ou /regex/flags)</span
                            ></label
                          >
                          <input
                            type="text"
                            placeholder="ex: \sin ou /x\^2/i"
                            bind:value={cfg.pattern}
                            class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                          />
                        </div>
                      {/if}

                      {#if cfg.kind === 'setEquality' || cfg.kind === 'sameDescribedSet'}
                        <div>
                          <label
                            class="block text-xs font-semibold mb-1 opacity-70"
                            >Variable <span class="font-normal opacity-60"
                              >(défaut : x)</span
                            ></label
                          >
                          <input
                            type="text"
                            placeholder="x"
                            bind:value={cfg.variable}
                            class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                          />
                        </div>
                      {/if}

                      {#if cfg.kind === 'singleParameterVariable'}
                        <div class="space-y-3">
                          <div>
                            <label
                              class="block text-xs font-semibold mb-1 opacity-70"
                              >Variable attendue <span
                                class="font-normal opacity-60">(optionnel)</span
                              ></label
                            >
                            <input
                              type="text"
                              placeholder="k"
                              bind:value={cfg.expectedParameter}
                              class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                            />
                          </div>
                          <label
                            class="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              bind:checked={cfg.strictExpectedParameter}
                              class="rounded"
                            />
                            <span class="text-xs font-semibold opacity-70"
                              >Rendre cette variable obligatoire</span
                            >
                          </label>
                        </div>
                      {/if}

                      {#if cfg.kind === 'stringEquals'}
                        <div class="grid grid-cols-2 gap-3">
                          <label
                            class="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              bind:checked={cfg.trim}
                              class="rounded"
                            />
                            <span class="text-xs font-semibold opacity-70"
                              >Ignorer les espaces autour</span
                            >
                          </label>
                          <label
                            class="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              bind:checked={cfg.ignoreCase}
                              class="rounded"
                            />
                            <span class="text-xs font-semibold opacity-70"
                              >Ignorer la casse</span
                            >
                          </label>
                        </div>
                      {/if}

                      <!-- Common overrides -->
                      <div
                        class="border-t border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark pt-3 space-y-3"
                      >
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              class="block text-xs font-semibold mb-1 opacity-70"
                              >Nom</label
                            >
                            <input
                              type="text"
                              placeholder={cfg.kind}
                              bind:value={cfg.name}
                              class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-xs font-semibold mb-1 opacity-70"
                              >Poids <span class="font-normal opacity-60"
                                >(0–1)</span
                              ></label
                            >
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              placeholder="–"
                              bind:value={cfg.weight}
                              class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                            />
                          </div>
                        </div>

                        <label
                          class="flex items-center gap-2 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            bind:checked={cfg.feedbackEnabled}
                            class="rounded"
                          />
                          <span class="text-xs font-semibold opacity-70"
                            >Feedback activé</span
                          >
                        </label>

                        <label
                          class="flex items-center gap-2 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            bind:checked={cfg.feedbackOnSuccess}
                            class="rounded"
                          />
                          <span class="text-xs font-semibold opacity-70"
                            >Afficher le feedback si la réponse est correcte</span
                          >
                        </label>

                        <div>
                          <label
                            class="block text-xs font-semibold mb-1 opacity-70"
                            >Feedback KO</label
                          >
                          <input
                            type="text"
                            placeholder="message si raté (défaut selon le check)"
                            bind:value={cfg.feedbackKo}
                            class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-xs font-semibold mb-1 opacity-70"
                            >Feedback OK</label
                          >
                          <input
                            type="text"
                            placeholder="message si réussi (optionnel)"
                            bind:value={cfg.feedbackOk}
                            class="w-full px-2 py-1.5 rounded border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest text-sm focus:outline-none focus:ring-1 focus:ring-coopmaths-action"
                          />
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <!-- Add check buttons -->
          <div class="mt-3">
            <p
              class="text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-2"
            >
              Ajouter un check
            </p>
            <div class="flex flex-wrap gap-2">
              {#each Object.keys(CHECK_LABELS) as kind}
                <button
                  class="px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border border-coopmaths-action dark:border-coopmathsdark-action text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-action dark:hover:bg-coopmathsdark-action hover:text-white transition"
                  on:click={() => addCheck(kind as CheckKind)}
                >
                  + {kind}
                </button>
              {/each}
            </div>
          </div>
        </section>

        <!-- Keyboard block selector -->
        <section>
          <label
            class="block text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-2"
          >
            Clavier virtuel
          </label>
          <div class="flex flex-wrap gap-1.5">
            {#each ALL_BLOCKS as block}
              <button
                class="px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-all
                       {selectedBlocks.includes(block)
                  ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-white border-transparent'
                  : 'border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark opacity-60 hover:opacity-100'}"
                on:click={() => toggleBlock(block)}
              >
                {block}
              </button>
            {/each}
          </div>
          <p
            class="text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mt-1.5"
          >
            Cliquez sur un bloc pour l'activer/désactiver dans le clavier.
          </p>
        </section>

        <!-- Code export — toujours visible si au moins un check -->
        <section>
          <div class="flex items-center justify-between mb-2">
            <label
              class="text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
            >
              Code à copier
            </label>
            {#if generatedCode}
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                       {codeCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-coopmaths-action dark:bg-coopmathsdark-action text-white hover:opacity-90'}"
                on:click={copyCode}
              >
                <i class="bx {codeCopied ? 'bx-check' : 'bx-copy'} text-base"
                ></i>
                {codeCopied ? 'Copié !' : 'Copier'}
              </button>
            {/if}
          </div>
          {#if generatedCode}
            <pre
              class="w-full font-mono text-xs leading-relaxed px-4 py-3 rounded-lg overflow-x-auto cursor-pointer
                     bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest
                     border border-coopmaths-action dark:border-coopmathsdark-action
                     text-coopmaths-corpus dark:text-coopmathsdark-corpus
                     whitespace-pre select-all hover:opacity-80 transition-opacity"
              on:click={copyCode}
              title="Cliquez pour copier">{generatedCode}</pre>
          {:else}
            <div
              class="text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light italic px-3 py-2 rounded-lg border border-dashed border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark"
            >
              Ajoutez un check pour générer le code
            </div>
          {/if}
        </section>
      </div>
    </div>

    <!-- ====== RIGHT PANEL: Test & Results ====== -->
    <div class="flex-1 flex flex-col min-h-0">
      <div class="p-5 space-y-5 flex-1 overflow-y-auto">
        <!-- User input -->
        <section>
          <label
            class="block text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-2"
          >
            Saisie de l'élève
          </label>
          <div
            class="check-test-field-wrapper rounded-lg border-2 transition-colors
                   {result !== null
              ? result.isOk
                ? 'border-green-400 dark:border-green-600'
                : 'border-red-400 dark:border-red-600'
              : 'border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark'}
                   bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest"
          >
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <math-field
              id={MATH_FIELD_ID}
              virtual-keyboard-mode="manual"
              class="check-test-field check-test-field--large"
            ></math-field>
          </div>
        </section>

        <!-- Error display -->
        {#if runtimeError}
          <div
            class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 p-4"
          >
            <p
              class="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1"
            >
              Erreur de configuration
            </p>
            <p class="font-mono text-sm text-red-700 dark:text-red-300">
              {runtimeError}
            </p>
          </div>
        {/if}

        <!-- Results -->
        {#if result !== null}
          <!-- Global result banner -->
          <div
            class="rounded-xl p-5 flex items-center gap-5
                      {result.isOk
              ? 'bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700'}"
          >
            <div
              class="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white
                        {result.isOk ? 'bg-green-500' : 'bg-red-500'}"
            >
              <i class="bx {result.isOk ? 'bx-check' : 'bx-x'}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-3">
                <span
                  class="text-lg font-bold {result.isOk
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'}"
                >
                  {result.isOk ? 'Correct' : 'Incorrect'}
                </span>
                <span class="text-sm font-mono {SCORE_COLOR(result.score)}">
                  score : {result.score.toFixed(2)}
                </span>
              </div>
              <!-- Score bar -->
              <div
                class="mt-2 h-2 rounded-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark overflow-hidden"
              >
                <div
                  class="h-full rounded-full transition-all {result.isOk
                    ? 'bg-green-500'
                    : result.score > 0
                      ? 'bg-yellow-500'
                      : 'bg-red-500'}"
                  style="width: {(result.score * 100).toFixed(1)}%"
                ></div>
              </div>
            </div>
          </div>

          <!-- Feedback -->
          {#if result.feedback}
            <div
              class="rounded-lg border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark p-4"
            >
              <p
                class="text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-2"
              >
                Feedback
              </p>
              <p class="text-sm whitespace-pre-line">{result.feedback}</p>
            </div>
          {/if}

          <!-- Per-check details -->
          {#if result.details && result.details.length > 0}
            <div>
              <p
                class="text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-3"
              >
                Détail des checks
              </p>
              <div class="space-y-2">
                {#each result.details as detail}
                  {@const cfg = checks.find(
                    (c) => (c.name.trim() || c.kind) === detail.name,
                  )}
                  <div
                    class="flex items-center gap-3 px-4 py-3 rounded-lg border
                              {detail.passed
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950'
                      : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'}"
                  >
                    <span
                      class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs
                                 {detail.passed
                        ? 'bg-green-500'
                        : 'bg-red-500'}"
                    >
                      <i class="bx {detail.passed ? 'bx-check' : 'bx-x'}"></i>
                    </span>
                    <span class="font-mono text-sm font-bold flex-1"
                      >{detail.name}</span
                    >
                    {#if cfg?.kind}
                      <span class="text-xs opacity-50">{cfg.kind}</span>
                    {/if}
                    {#if cfg != null && asText(cfg.weight).trim()}
                      <span class="text-xs font-mono opacity-60"
                        >× {cfg.weight}</span
                      >
                    {/if}
                    <span
                      class="text-xs font-semibold {detail.passed
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'}"
                    >
                      {detail.passed ? 'OK' : 'KO'}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {:else if checks.length > 0 && expectedAnswer.trim() !== ''}
          <div
            class="text-center py-10 text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            <i class="bx bx-edit-alt text-4xl mb-3"></i>
            <p class="text-sm">Entrez une réponse à tester ci-dessus.</p>
          </div>
        {:else}
          <div
            class="text-center py-10 text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light space-y-2"
          >
            <i class="bx bx-chip text-4xl mb-3"></i>
            <p class="text-sm font-medium">Pour commencer :</p>
            <ol
              class="text-sm space-y-1 list-decimal list-inside text-left inline-block"
            >
              <li>Saisissez la réponse attendue (à gauche)</li>
              <li>Ajoutez un ou plusieurs checks</li>
              <li>Entrez une réponse à tester ici</li>
            </ol>
          </div>
        {/if}

        <!-- Quick examples -->
        {#if checks.length === 0}
          <div
            class="border-t border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark pt-5"
          >
            <p
              class="text-xs font-bold uppercase tracking-widest text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light mb-3"
            >
              Exemples rapides
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                class="text-left p-3 rounded-lg border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark transition"
                on:click={() => {
                  expectedAnswer = '\\frac{1}{2}'
                  addCheck('equals')
                  addCheck('isReduced')
                  const e = checks.find((c) => c.kind === 'equals')
                  const r = checks.find((c) => c.kind === 'isReduced')
                  if (e) {
                    e.weight = '0.7'
                    checks = [...checks]
                  }
                  if (r) {
                    r.weight = '0.3'
                    checks = [...checks]
                  }
                }}
              >
                <p class="font-mono text-sm font-bold mb-1">Fraction réduite</p>
                <p class="text-xs opacity-60">
                  equals (70%) + isReduced (30%) pour <code
                    >\frac{`{1}{2}`}</code
                  >
                </p>
              </button>

              <button
                class="text-left p-3 rounded-lg border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark transition"
                on:click={() => {
                  expectedAnswer = 'x'
                  addCheck('equals')
                  addCheck('contains')
                  const c = checks.find((ch) => ch.kind === 'contains')
                  if (c) {
                    c.pattern = '\\sin'
                    checks = [...checks]
                  }
                }}
              >
                <p class="font-mono text-sm font-bold mb-1">Contient sin</p>
                <p class="text-xs opacity-60">
                  equals + contains("\sin") pour forcer la forme
                </p>
              </button>

              <button
                class="text-left p-3 rounded-lg border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark transition"
                on:click={() => {
                  expectedAnswer = '2x'
                  combinator = 'seq'
                  addCheck('equals')
                  addCheck('doesNotContain')
                  const d = checks.find((c) => c.kind === 'doesNotContain')
                  if (d) {
                    d.pattern = '\\times'
                    d.feedbackKo = 'Pas de signe ×, écris 2x directement.'
                    checks = [...checks]
                  }
                }}
              >
                <p class="font-mono text-sm font-bold mb-1">Sans ×</p>
                <p class="text-xs opacity-60">
                  seq: equals puis doesNotContain("×")
                </p>
              </button>

              <button
                class="text-left p-3 rounded-lg border border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark transition"
                on:click={() => {
                  expectedAnswer = '3.14'
                  addCheck('equals')
                  const e = checks.find((c) => c.kind === 'equals')
                  if (e) {
                    e.equalsMode = 'tolerance'
                    e.tolerance = '-2'
                    checks = [...checks]
                  }
                }}
              >
                <p class="font-mono text-sm font-bold mb-1">Tolérance 10^n</p>
                <p class="text-xs opacity-60">
                  equals avec tolerance=-2 pour π ≈ 3.14
                </p>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<Keyboard />

<style>
  :global(.check-test-field-wrapper) {
    position: relative;
  }

  :global(.check-test-field) {
    display: block !important;
    width: 100% !important;
    min-height: 2.75rem;
    font-size: 1rem;
    padding: 0.5rem 1rem;
    margin-left: 0 !important;
    background: transparent !important;
    border: none !important;
    text-align: left;
  }

  :global(.check-test-field::part(container)) {
    border: none !important;
    min-height: 2.75rem;
    align-items: center;
    background: transparent !important;
  }

  :global(.check-test-field::part(content)) {
    padding: 0.25rem 0;
    text-align: left;
  }

  :global(.check-test-field--large) {
    font-size: 1.25rem !important;
    min-height: 3.5rem;
    padding: 0.75rem 1rem;
  }

  :global(.check-test-field--large::part(container)) {
    min-height: 3.5rem;
  }
</style>
