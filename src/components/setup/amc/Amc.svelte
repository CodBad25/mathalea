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

  type GroupSetting = {
    seed: string
    questionCount: number
    restitueCount: number
  }

  let exercices: IExercice[] = []
  let groupSettings: GroupSetting[] = []
  let selectedRef: BlockRef | null = null
  let selectedExerciseIndex: number | null = null
  let latexContent = ''
  let groupConsistencyReport: AMCGroupConsistencyReport | null = null
  let isDropTargetActive = false

  let unsubscribeExercicesParams: (() => void) | null = null

  function asAMCExercices(exos: IExercice[]): IExerciceAMC[] {
    return exos as unknown as IExerciceAMC[]
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
    exercices = [...exercices]
    updateLatexPreview()
  }

  function generateHtmlQuestionsForExercise(
    exercice: IExercice,
    seed: string,
  ): void {
    const ex = exercice as any
    const originalInteractif = exercice.interactif

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

    // 1. Passe interactive HTML : permet a handleAnswers de remplir autoCorrection.
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

    // 2. Passe HTML non interactive : conserve un apercu papier dans la preview.
    runHtmlGeneration(false)
    if (exercice.typeExercice === 'simple') {
      ex.htmlQuestions =
        exercice.question != null ? [String(exercice.question)] : []
    } else {
      ex.htmlQuestions = [...exercice.listeQuestions]
    }

    exercice.interactif = originalInteractif
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
      exercices: asAMCExercices(exercices),
      nbQuestions,
      typeEntete: 'AMCcodeGrid',
      format: 'A4',
      matiere: 'Mathématiques',
      titre: 'Aperçu AMC',
      nbExemplaires: 1,
    })

    groupConsistencyReport = checkAMCGroupConsistency(latexContent)
  }

  function getBlocks(exercise: IExercice, exerciseIndex: number) {
    const blocks: Array<{
      key: string
      label: string
      ref: BlockRef
      enonce: string
      htmlContent: string
      data: any
    }> = []

    const autoCorrection = Array.isArray((exercise as any).autoCorrection)
      ? ((exercise as any).autoCorrection as any[])
      : []

    const htmlQuestions: string[] = (exercise as any).htmlQuestions ?? []

    autoCorrection.forEach((item, questionIndex) => {
      const type = (exercise as any).amcType
      const htmlContent = htmlQuestions[questionIndex] ?? ''

      if (type === 'AMCHybride') {
        const propositions = Array.isArray(item?.propositions)
          ? item.propositions
          : []
        propositions.forEach((prop: any, propositionIndex: number) => {
          const propType = prop?.type
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
              enonce: item?.enonce ?? '',
              htmlContent,
              data: prop,
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
              enonce: item?.enonce ?? '',
              htmlContent,
              data: prop,
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
              enonce: item?.enonce ?? '',
              htmlContent,
              data: prop,
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
        })
      }
    })

    return blocks
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
    mathaleaUpdateUrlFromExercicesParams()
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
      subtitle="AMC Builder"
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
                <h2
                  class="font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
                >
                  {exercice.id} - {exercice.titre}
                </h2>
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
                {#each getBlocks(exercice, exerciseIndex) as block}
                  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                  <div
                    role="button"
                    tabindex="0"
                    class="rounded-xl p-1 text-left transition-colors cursor-pointer {isSelected(
                      block.ref,
                    )
                      ? 'ring-2 ring-coopmaths-action'
                      : 'hover:bg-coopmaths-canvas/40 dark:hover:bg-coopmathsdark-canvas/40'}"
                    on:click={() => selectBlock(block.ref)}
                    on:keydown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        selectBlock(block.ref)
                    }}
                  >
                    <div class="mb-1 flex items-center justify-between gap-1">
                      <p
                        class="text-xs font-semibold uppercase tracking-wide text-coopmaths-action dark:text-coopmathsdark-action"
                      >
                        {block.label}
                      </p>
                      <button
                        type="button"
                        class="shrink-0 rounded px-1 text-xs text-coopmaths-corpus/60 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                        aria-label="Supprimer la question"
                        on:click|stopPropagation={() =>
                          deleteQuestion(
                            block.ref.exerciseIndex,
                            block.ref.questionIndex,
                          )}>×</button
                      >
                    </div>

                    {#if block.ref.kind === 'qcm'}
                      <AmcPreviewQcm
                        enonce={block.enonce}
                        htmlContent={block.htmlContent}
                        mode={block.data?.type === 'qcmMult' ||
                        exercice.amcType === 'qcmMult'
                          ? 'qcmMult'
                          : 'qcmMono'}
                        choix={block.data?.propositions ?? []}
                      />
                    {:else if block.ref.kind === 'num'}
                      <AmcPreviewNumeric
                        enonce={block.enonce}
                        htmlContent={block.htmlContent}
                        param={block.data?.propositions?.[0]?.reponse?.param ??
                          block.data?.reponse?.param ??
                          {}}
                      />
                    {:else}
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
            <p class="text-sm font-semibold">Groupe d'exercice</p>
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
        {:else if selectedRef.kind === 'num'}
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

            <label for="amc-num-decimals" class="block text-xs">Decimals</label>
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
            <button
              type="button"
              class="mt-2 w-full rounded border px-3 py-1 text-xs"
              on:click={appliquerParametresQuestionAuGroupe}
            >
              Appliquer ces parametres a tout le groupe
            </button>
          </div>
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
