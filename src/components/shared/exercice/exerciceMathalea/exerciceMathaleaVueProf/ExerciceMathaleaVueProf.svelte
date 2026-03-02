<script lang="ts">
  import seedrandom from 'seedrandom'
  import { afterUpdate, beforeUpdate, onDestroy, onMount, tick } from 'svelte'
  import { get } from 'svelte/store'
  import ExerciceSimple from '../../../../../exercices/ExerciceSimple'
  import {
    exercisesUuidRanking,
    uuidCount,
  } from '../../../../../lib/components/counts'
  import {
    exerciceInteractif,
    prepareExerciceCliqueFigure,
  } from '../../../../../lib/interactif/gestionInteractif'
  import {
    mathaleaFormatExercice,
    mathaleaHandleExerciceSimple,
    mathaleaHandleSup,
    mathaleaRenderDiv,
    mathaleaUpdateUrlFromExercicesParams,
    renderDiv,
  } from '../../../../../lib/mathalea'
  import {
    changes,
    exercicesParams,
    resultsByExercice,
  } from '../../../../../lib/stores/generalStore'
  import { globalOptions } from '../../../../../lib/stores/globalOptions'
  import { isLocalStorageAvailable } from '../../../../../lib/stores/storage'
  import type {
    IExercice,
    IExerciceSimple,
    InterfaceParams,
  } from '../../../../../lib/types'
  import type { HeaderProps } from '../../../../../lib/types/ui'
  import { loadMathLive } from '../../../../../modules/loaders'
  import { countMathField } from '../../countMathField'
  import { handleCorrectionAffichee } from '../../handleCorrection'
  import HeaderExerciceVueProf from '../../shared/headerExerciceVueProf/HeaderExerciceVueProf.svelte'
  import Settings from './presentationalComponents/Settings.svelte'

  export let exercise: IExercice | IExerciceSimple
  export let exerciseIndex: number
  export let indiceLastExercice: number
  export let isCorrectionVisible = false
  export let toggleSidenav: (open: boolean) => void

  let divExercice: HTMLDivElement
  let divScore: HTMLDivElement
  let buttonScore: HTMLButtonElement
  /*
   * MGu Attention interfaceParams est un objet qui est une copie du store,
   * donc le mettre à jour directement met à jour le store sans le signaler au subscriber
   * DE PLUS, si on change l'ordre des exercices OU si on supprime un exercice, exerciseIndex
   * va devenir faux mais cela n'est pas génant car l'exercice va être destroy...
   * Cependant, avant un DESTROY, il y aura un beforeupdate et un afterupdate, donc cette variable
   * peut devenir UNDEFINED ou ERRONEE
   */
  let interfaceParams: InterfaceParams | undefined =
    get(exercicesParams)[exerciseIndex]
  let exercicesNumber: number = get(exercicesParams).length

  let id: string =
    interfaceParams && interfaceParams.id
      ? interfaceParams.id
      : (exercise.id ?? '')

  const subscribeExercicesParamsStore = exercicesParams.subscribe((value) => {
    log('new interface')
    if (value[exerciseIndex] !== interfaceParams) {
      // MGu c'est une comparaison par référence
      log('new interfaceParams subscribe:' + JSON.stringify(interfaceParams))
      interfaceParams = value[exerciseIndex]
    }
    if (exercicesNumber !== value.length) {
      exercicesNumber = value.length
    }
  })

  let columnsCount = interfaceParams.cols || 1
  let isVisible = true
  let isContentVisible = true
  let isSettingsVisible = true
  let isInteractif = exercise.interactif
  const interactifReady = exercise.interactifReady
  const exerciceHasNoSettings =
    !exercise.nbQuestionsModifiable &&
    !exercise.correctionDetailleeDisponible &&
    !exercise.seed &&
    !exercise.besoinFormulaireCaseACocher &&
    !exercise.besoinFormulaireNumerique &&
    !exercise.besoinFormulaireTexte &&
    !exercise.besoinFormulaire2CaseACocher &&
    !exercise.besoinFormulaire2Numerique &&
    !exercise.besoinFormulaire2Texte &&
    !exercise.besoinFormulaire3CaseACocher &&
    !exercise.besoinFormulaire3Numerique &&
    !exercise.besoinFormulaire3Texte &&
    !exercise.besoinFormulaire4CaseACocher &&
    !exercise.besoinFormulaire4Numerique &&
    !exercise.besoinFormulaire4Texte &&
    !exercise.besoinFormulaire5CaseACocher &&
    !exercise.besoinFormulaire5Numerique &&
    !exercise.besoinFormulaire5Texte
  let isExerciceChecked = false
  const generateTitleAddendum = (): string => {
    const ranks = exercisesUuidRanking(get(exercicesParams))
    const counts = uuidCount(get(exercicesParams))
    if (
      interfaceParams &&
      interfaceParams.uuid &&
      counts[interfaceParams.uuid] > 1
    ) {
      return '|' + ranks[exerciseIndex]
    } else {
      return ''
    }
  }
  let headerProps: HeaderProps = {
    title: '',
    id,
    indiceExercice: exerciseIndex,
    indiceLastExercice,
    isInteractif,
    interactifReady,
    isSettingsVisible,
  }

  $: {
    if (isContentVisible && isInteractif && buttonScore) initButtonScore()
    if (!isInteractif && divScore) divScore.innerHTML = ''
    headerProps.settingsReady = !exerciceHasNoSettings
    headerProps.isSortable = true
    headerProps.isDeletable = true
    headerProps.isHidable = true
    headerProps.id = id
    headerProps.isInteractif = isInteractif
    headerProps.correctionExists = exercise.listeCorrections.length > 0
    headerProps.title = exercise.titre + generateTitleAddendum()
    headerProps.indiceExercice = exerciseIndex
    headerProps.indiceLastExercice = exercicesNumber
    headerProps.isSettingsVisible = isSettingsVisible
    headerProps = headerProps
    isCorrectionVisible = isCorrectionVisible // MGU pour déclencher le reactive
  }

  let numberOfAnswerFields: number = 0

  // on détecte les changements dans la liste des exercices
  // afin de mettre à jour le titre
  const unsubscribeToChangesStore = changes.subscribe(() => {
    headerProps.title = exercise.titre + generateTitleAddendum()
  })

  async function forceUpdate() {
    if (exercise == null) return
    exercise.numeroExercice = exerciseIndex
    await adjustMathalea2dFiguresWidth()
  }

  function log(str: string) {
    const debug = new URL(window.location.href).searchParams.get('log') === '1'
    if (debug) {
      console.info(exerciseIndex, exercise.id)
      console.info(str)
    }
  }

  beforeUpdate(async () => {
    log('beforeUpdate:' + exercise.id)
    if (numberOfAnswerFields !== countMathField(exercise)) {
      numberOfAnswerFields = countMathField(exercise)
    }
    if (get(exercicesParams)[exerciseIndex] !== interfaceParams) {
      // interface à changer car un exercice a été supprimé au dessus...
      interfaceParams = get(exercicesParams)[exerciseIndex]
      log('new interfaceParams beforeUpdate:' + JSON.stringify(interfaceParams))
      // obliger de charger l'exercice car son numéro à changer, et il faut gérer les id correctement des HTMLElements
      await updateDisplay()
    }
  })

  /**
   * Fonction appelée lorsque le listener détecte `languageHasChanged`.
   * Elle change la variable `interfaceParams` et surtout met à jour `id`
   * qui est succeptible de changer avec la langue.
   * @author sylvain
   */
  const updateExerciceAfterLanguageChange = () => {
    if ($exercicesParams.length !== 0) {
      interfaceParams = get(exercicesParams)[exerciseIndex]
      id = get(exercicesParams)[exerciseIndex].id || ''
    }
  }

  onMount(async () => {
    log('onMount:' + exercise.id)
    document.addEventListener('newDataForAll', newData)
    document.addEventListener('setAllInteractif', setAllInteractif)
    document.addEventListener('removeAllInteractif', removeAllInteractif)
    document.addEventListener('updateAsyncEx', forceUpdate)
    document.addEventListener(
      'languageHasChanged',
      updateExerciceAfterLanguageChange,
    )
    await updateDisplay()
  })

  onDestroy(() => {
    log('ondestroy' + exercise.id)
    // Détruit l'objet exercice pour libérer la mémoire
    exercise.reinit() // MGu nécessaire pour supprimer les listeners
    exercise.destroy()
    for (const prop of Object.keys(exercise)) {
      Reflect.deleteProperty(exercise, prop)
    }
    document.removeEventListener('newDataForAll', newData)
    document.removeEventListener('setAllInteractif', setAllInteractif)
    document.removeEventListener('removeAllInteractif', removeAllInteractif)
    document.removeEventListener('updateAsyncEx', forceUpdate)
    document.removeEventListener(
      'languageHasChanged',
      updateExerciceAfterLanguageChange,
    )
    unsubscribeToChangesStore()
    subscribeExercicesParamsStore()
  })

  afterUpdate(async () => {
    log('afterUpdate:' + exercise.id)
    if (exercise) {
      await tick()
      mathaleaRenderDiv(divExercice)
      if (isInteractif) {
        await loadMathLive()
        if (
          exercise?.interactifType === 'cliqueFigure' &&
          !isCorrectionVisible
        ) {
          prepareExerciceCliqueFigure(exercise)
        }
        // Ne pas être noté sur un exercice dont on a déjà vu la correction
        if (
          isLocalStorageAvailable() &&
          exercise.id !== undefined &&
          exercise.seed !== undefined &&
          window.localStorage.getItem(`${exercise.id}|${exercise.seed}`) !=
            null &&
          isContentVisible
        ) {
          await newData()
        }
      }
      if (exerciceHasNoSettings) {
        isSettingsVisible = false
      }
    }
    // Evènement indispensable pour pointCliquable par exemple
    const exercicesAffiches = new window.Event('exercicesAffiches', {
      bubbles: true,
    })
    document.dispatchEvent(exercicesAffiches)
    if (isCorrectionVisible) {
      handleCorrectionAffichee()
    }
  })

  async function newData() {
    log('newData' + exercise.id)
    if (Object.prototype.hasOwnProperty.call(exercise, 'listeQuestions')) {
      if (isCorrectionVisible && isInteractif) isCorrectionVisible = false
      if (
        exercise !== undefined &&
        typeof exercise?.applyNewSeed === 'function'
      ) {
        exercise.applyNewSeed()
      }
      if (buttonScore) initButtonScore()
      if (divScore) divScore.innerHTML = ''
      if (
        isLocalStorageAvailable() &&
        exercise.id !== undefined &&
        isCorrectionVisible
      ) {
        window.localStorage.setItem(`${exercise.id}|${exercise.seed}`, 'true')
      }
      await updateDisplay()
    }
  }

  async function setAllInteractif() {
    if (exercise?.interactifReady) isInteractif = true
    await updateDisplay()
  }
  async function removeAllInteractif() {
    if (exercise?.interactifReady) isInteractif = false
    await updateDisplay()
  }

  function handleNewSettings(event: CustomEvent) {
    log('handleNewSettings:' + JSON.stringify(event.detail))
    if (!interfaceParams) {
      return
    }
    if (event.detail.nbQuestions) {
      exercise.nbQuestions = event.detail.nbQuestions
      interfaceParams.nbQuestions = exercise.nbQuestions
    }
    if (event.detail.duration) {
      exercise.duration = event.detail.duration
      interfaceParams.duration = exercise.duration
    }
    if (event.detail.sup !== undefined) {
      exercise.sup = event.detail.sup
      interfaceParams.sup = mathaleaHandleSup(exercise.sup)
    }
    if (event.detail.sup2 !== undefined) {
      exercise.sup2 = event.detail.sup2
      interfaceParams.sup2 = mathaleaHandleSup(exercise.sup2)
    }
    if (event.detail.sup3 !== undefined) {
      exercise.sup3 = event.detail.sup3
      interfaceParams.sup3 = mathaleaHandleSup(exercise.sup3)
    }
    if (event.detail.sup4 !== undefined) {
      exercise.sup4 = event.detail.sup4
      interfaceParams.sup4 = mathaleaHandleSup(exercise.sup4)
    }
    if (event.detail.sup5 !== undefined) {
      exercise.sup5 = event.detail.sup5
      interfaceParams.sup5 = mathaleaHandleSup(exercise.sup5)
    }
    if (
      event.detail.versionQcm !== undefined &&
      exercise instanceof ExerciceSimple
    ) {
      exercise.versionQcm = event.detail.versionQcm
      interfaceParams.versionQcm = exercise.versionQcm ? '1' : '0'
    }
    if (event.detail.alea !== undefined) {
      exercise.seed = event.detail.alea
      interfaceParams.alea = exercise.seed
    }
    if (event.detail.correctionDetaillee !== undefined) {
      exercise.correctionDetaillee = event.detail.correctionDetaillee
      interfaceParams.cd = exercise.correctionDetaillee ? '1' : '0'
    }
    exercicesParams.update((list) => {
      // interfaceParams a été mis à jour donc le store est à jour
      return list
    })
    if (isExerciceChecked) {
      // Si on change des réglages alors qu'on a déjà une note à l'exercice
      // alors on part sur de nouvelles données ainsi on efface le score et les réponses proposées
      isExerciceChecked = false
      newData()
    } else {
      updateDisplay()
    }
  }

  async function updateDisplay(withNewVersion = true) {
    log('updateDisplay:' + exercise.id)
    if (
      exercise === null ||
      interfaceParams === undefined ||
      exercise.uuid !== interfaceParams.uuid
    ) {
      return
    }
    if (
      exercise.seed === undefined &&
      typeof exercise.applyNewSeed === 'function'
    ) {
      exercise.applyNewSeed()
    }
    seedrandom(exercise.seed, { global: true })
    if (exercise.typeExercice === 'simple' && withNewVersion) {
      mathaleaHandleExerciceSimple(
        exercise,
        Boolean(isInteractif),
        exerciseIndex,
      )
    }
    exercise.interactif = isInteractif
    if (interfaceParams.alea !== exercise.seed && exercise.seed !== undefined) {
      // on met à jour le storer seulement si besoin
      interfaceParams.alea = exercise.seed
      log('interfaceParams.alea updated' + interfaceParams.alea)
      exercicesParams.update((list) => {
        // interfaceParams a été mis à jour donc le store est à jour
        return list
      })
    }
    if (interfaceParams.interactif !== (isInteractif ? '1' : '0')) {
      // on met à jour le storer seulement si besoin
      interfaceParams.interactif = isInteractif ? '1' : '0'
      log('interfaceParams.interactif updated' + interfaceParams.interactif)
      exercicesParams.update((list) => {
        // interfaceParams a été mis à jour donc le store est à jour
        return list
      })
    }
    if (interfaceParams.cols !== columnsCount) {
      // on met à jour le storer seulement si besoin
      if (columnsCount === 1 && interfaceParams.cols !== undefined) {
        interfaceParams.cols = undefined
        log('interfaceParams.cols updated' + interfaceParams.cols)
        exercicesParams.update((list) => {
          // interfaceParams a été mis à jour donc le store est à jour
          return list
        })
      } else if (columnsCount > 1 && interfaceParams.cols !== columnsCount) {
        interfaceParams.cols = columnsCount
        log('interfaceParams.cols updated' + interfaceParams.cols)
        exercicesParams.update((list) => {
          // interfaceParams a été mis à jour donc le store est à jour
          return list
        })
      }
    }
    exercise.numeroExercice = exerciseIndex
    if (
      exercise.typeExercice !== 'simple' &&
      typeof exercise.nouvelleVersionWrapper === 'function' &&
      withNewVersion
    ) {
      exercise.nouvelleVersionWrapper(exerciseIndex)
    }
    mathaleaUpdateUrlFromExercicesParams()
    await adjustMathalea2dFiguresWidth()
  }

  function verifExercice() {
    isCorrectionVisible = true
    isExerciceChecked = true
    resultsByExercice.update((l) => {
      const indice = exercise.numeroExercice ?? 0
      const result = {
        ...exerciceInteractif(exercise, divScore, buttonScore),
        indice,
      }
      if (result != null) {
        l[indice] = result
      }
      return l
    })
  }

  function initButtonScore() {
    buttonScore.classList.remove(...buttonScore.classList)
    buttonScore.classList.add(
      'inline-flex',
      'px-6',
      'py-2.5',
      'ml-6',
      'bg-coopmaths-action',
      'dark:bg-coopmathsdark-action',
      'text-coopmaths-canvas',
      'dark:text-coopmathsdark-canvas',
      'font-medium',
      'text-xs',
      'leading-tight',
      'uppercase',
      'rounded',
      'shadow-md',
      'transform',
      'hover:bg-coopmaths-action-lightest',
      'dark:hover:bg-coopmathsdark-action-lightest',
      'hover:shadow-lg',
      'focus:bg-coopmaths-action-lightest',
      'dark:focus:bg-coopmathsdark-action-lightest',
      'focus:shadow-lg',
      'focus:outline-none',
      'focus:ring-0',
      'active:bg-coopmaths-action-lightest',
      'dark:active:bg-coopmathsdark-action-lightest',
      'active:shadow-lg',
      'transition',
      'duration-150',
      'ease-in-out',
      'checkReponses',
    )
  }

  /**
   * Recherche toutes les figures ayant la classe `mathalea2d` et réduit leur largeur à 95% de la valeur
   * maximale du div reperé par l'ID `consigne<X>-0` où `X` est l'indice de l'exercice
   * @param {boolean} initialDimensionsAreNeeded si `true`, les valeurs initiales sont rechargées ()`false` par défaut)
   * @author sylvain
   */
  async function adjustMathalea2dFiguresWidth(
    initialDimensionsAreNeeded: boolean = false,
  ) {
    await tick()
    const mathalea2dFigures =
      document?.querySelectorAll<SVGElement>('.mathalea2d')
    if (
      mathalea2dFigures !== null &&
      mathalea2dFigures !== undefined &&
      mathalea2dFigures.length !== 0
    ) {
      for (let k = 0; k < mathalea2dFigures.length; k++) {
        if (initialDimensionsAreNeeded) {
          // réinitialisation
          const initialWidth = mathalea2dFigures[k].getAttribute(
            'data-width-initiale',
          )
          const initialHeight = mathalea2dFigures[k].getAttribute(
            'data-height-initiale',
          )
          mathalea2dFigures[k].setAttribute('width', initialWidth ?? '0')
          mathalea2dFigures[k].setAttribute('height', initialHeight ?? '0')
          // les éléments Katex des figures SVG
          if (
            mathalea2dFigures[k] != null &&
            mathalea2dFigures[k].parentElement != null
          ) {
            const eltsInFigures =
              mathalea2dFigures[k].parentElement?.querySelectorAll<HTMLElement>(
                'div.divLatex',
              ) || []
            for (const elt of eltsInFigures) {
              const e = elt
              e.style.setProperty('top', e.dataset.top + 'px')
              e.style.setProperty('left', e.dataset.left + 'px')
            }
          }
        }
        const consigneDiv = mathalea2dFigures[k].closest('[id^="consigne"]')
        if (
          consigneDiv &&
          mathalea2dFigures[k].clientWidth > consigneDiv.clientWidth
        ) {
          const coef =
            (consigneDiv.clientWidth * 0.95) / mathalea2dFigures[k].clientWidth
          const width = mathalea2dFigures[k].getAttribute('width')
          const height = mathalea2dFigures[k].getAttribute('height')
          if (!mathalea2dFigures[k].dataset.widthInitiale && width != null) {
            mathalea2dFigures[k].dataset.widthInitiale = width
          }
          if (!mathalea2dFigures[k].dataset.heightInitiale && height != null) {
            mathalea2dFigures[k].dataset.heightInitiale = height
          }
          mathalea2dFigures[k].setAttribute(
            'height',
            (
              Number(mathalea2dFigures[k].dataset.heightInitiale) * coef
            ).toString(),
          )
          mathalea2dFigures[k].setAttribute(
            'width',
            (
              Number(mathalea2dFigures[k].dataset.widthInitiale) * coef
            ).toString(),
          )

          if (
            mathalea2dFigures[k] != null &&
            mathalea2dFigures[k].parentElement !== null
          ) {
            const eltsInFigures =
              mathalea2dFigures[k].parentElement?.querySelectorAll<HTMLElement>(
                'div.divLatex',
              ) || []
            for (const elt of eltsInFigures) {
              const e = elt
              const initialTop = Number(e.dataset.top) ?? 0
              const initialLeft = Number(e.dataset.left) ?? 0
              e.style.setProperty('top', (initialTop * coef).toString() + 'px')
              e.style.setProperty(
                'left',
                (initialLeft * coef).toString() + 'px',
              )
            }
          }
        }
      }
    }
  }
  // pour recalculer les tailles lors d'un changement de dimension de la fenêtre
  window.onresize = async () => {
    await adjustMathalea2dFiguresWidth(true)
  }

  async function handleExerciseRemoved(event: CustomEvent) {
    if ($exercicesParams.length === 0) {
      toggleSidenav(true)
    }
    await updateDisplay()
  }
</script>

<div class="z-0 flex-1" bind:this={divExercice}>
  <HeaderExerciceVueProf
    {...headerProps}
    on:clickVisible={(event) => {
      isVisible = event.detail.isVisible
    }}
    on:clickSettings={(event) =>
      (isSettingsVisible = event.detail.isSettingsVisible)}
    on:clickCorrection={async (event) => {
      isContentVisible = event.detail.isContentVisible
      isCorrectionVisible = event.detail.isCorrectionVisible

      if (
        isLocalStorageAvailable() &&
        exercise.id !== undefined &&
        isCorrectionVisible
      ) {
        window.localStorage.setItem(`${exercise.id}|${exercise.seed}`, 'true')
      }
      if (isInteractif) {
        isInteractif = !isInteractif
        exercise.interactif = isInteractif
        await updateDisplay()
      }
      await adjustMathalea2dFiguresWidth()
    }}
    on:clickInteractif={async (event) => {
      isInteractif = event.detail.isInteractif
      exercise.interactif = isInteractif
      exercicesParams.update((params) => {
        params[exerciseIndex].interactif = isInteractif ? '1' : '0'
        return params
      })
      await updateDisplay()
    }}
    on:clickNewData={newData}
    interactifReady={Boolean(
      exercise?.interactifReady &&
      !isCorrectionVisible &&
      headerProps?.interactifReady,
    )}
    on:exerciseRemoved={handleExerciseRemoved}
  />

  {#if isVisible}
    <div class="flex flex-col-reverse lg:flex-row">
      <div
        class="flex flex-col justify-start items-start relative {isSettingsVisible
          ? 'w-full lg:w-3/4'
          : 'w-full'} duration-500"
        id="exercice{exerciseIndex}"
      >
        <div
          class="print-hidden hidden md:flex flex-row justify-start text-coopmaths-struct dark:text-coopmathsdark-struct text-xs mt-2 pl-0 md:pl-2"
        >
          <button
            class={columnsCount > 1 ? 'visible' : 'invisible'}
            type="button"
            aria-label="Diminuer le nombre de colonnes"
            title="Diminuer le nombre de colonnes"
            on:click={() => {
              columnsCount--
              updateDisplay(false)
            }}
          >
            <i
              class=" text-coopmaths-action hover:text-coopmaths-action-darkest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-darkest bx ml-2 bx-xs bx-minus"
            ></i>
          </button>
          <i class="bx ml-1 bx-xs bx-columns"></i>
          <button
            type="button"
            aria-label="Augmenter le nombre de colonnes"
            title="Augmenter le nombre de colonnes"
            on:click={() => {
              columnsCount++
              updateDisplay(false)
            }}
          >
            <i
              class="text-coopmaths-action hover:text-coopmaths-action-darkest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-darkest bx ml-1 bx-xs bx-plus"
            ></i>
          </button>
        </div>
        <article
          class="lg:text-base relative"
          style="font-size: {(
            $globalOptions.z || 1
          ).toString()}rem; line-height: calc({$globalOptions.z || 1});"
        >
          <div class="mt-6 mb-4">
            {#key exercise.key + '-' + exerciseIndex}
              {#if typeof exercise.consigne !== 'undefined' && exercise.consigne.length !== 0}
                <div>
                  <p
                    class="mt-2 mb-2 ml-2 lg:mx-5 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
                  >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html mathaleaFormatExercice(exercise.consigne)}
                  </p>
                </div>
              {/if}
              {#if exercise.introduction}
                <div>
                  <p
                    class="mt-2 mb-2 ml-2 lg:mx-5 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
                  >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html exercise.introduction}
                  </p>
                </div>
              {/if}
            {/key}
          </div>
          <div
            style="columns: {columnsCount.toString()}"
            class="mt-4 lg:mt-6 mb-5"
          >
            <ul
              class="{exercise.listeQuestions.length === 1 ||
              !exercise.listeAvecNumerotation
                ? 'list-none'
                : 'numbered-list'} w-full list-inside mb-2 mx-0 marker:text-coopmaths-struct dark:marker:text-coopmathsdark-struct marker:font-bold"
            >
              {#each exercise.listeQuestions as item, i (exercise.key + '-' + exerciseIndex + '-' + i)}
                <div
                  style="break-inside:avoid"
                  id="consigne{exerciseIndex}-{i}"
                  class="container w-full grid grid-cols-1 auto-cols-min gap-1 lg:gap-4 mb-2 lg:mb-4 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
                >
                  <li
                    id="exercice{exerciseIndex}Q{i}"
                    style="line-height: {exercise.spacing || 1}"
                  >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html mathaleaFormatExercice(item)}
                  </li>
                  {#if isCorrectionVisible}
                    <!-- EE : remplacement de ce class pour celui du dessous class="relative border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] text-coopmaths-corpus dark:text-coopmathsdark-corpus mt-6 lg:mt-2 mb-6 py-2 pl-4"  -->
                    <div
                      class="relative border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] text-coopmaths-corpus dark:text-coopmathsdark-corpus py-2 pl-4 mt-6 md:mt-4"
                      id="correction-exo{exerciseIndex}-Q{i}"
                      use:renderDiv={exercise.listeCorrections[i]}
                    >
                      <div
                        class={exercise.consigneCorrection.length !== 0
                          ? 'container bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark px-4 py-2 mr-2 ml-6 mb-2 font-light relative w-2/3'
                          : 'hidden'}
                      >
                        <div
                          class="{exercise.consigneCorrection.length !== 0
                            ? 'container'
                            : 'hidden'} absolute top-4 -left-4"
                        >
                          <i
                            class="bx bx-bulb scale-200 text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
                          ></i>
                        </div>
                        <div class="">
                          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                          {@html exercise.consigneCorrection}
                        </div>
                      </div>
                      <div
                        class="container overflow-x-scroll overflow-y-hidden md:overflow-x-auto py-1"
                        style="line-height: {exercise.spacingCorr ||
                          1}; break-inside:avoid"
                      >
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        {@html mathaleaFormatExercice(
                          exercise.listeCorrections[i],
                        )}
                      </div>
                      <!-- Avant le commit du 28/03/23, il y avait une mise en page plus complexe
                      et cela posait problème au changement des paramètres avec la correction visible -->
                      <!-- <div class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct top-0 left-0 border-b-[3px] w-10" /> -->
                      <div
                        class="absolute flex flex-row py-[1.5px] px-3 rounded-t-md justify-center items-center -left-[3px] -top-[15px] bg-coopmaths-struct dark:bg-coopmathsdark-struct font-semibold text-xs text-coopmaths-canvas dark:text-coopmathsdark-canvas"
                      >
                        Correction
                      </div>
                      <div
                        class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct bottom-0 left-0 border-b-[3px] w-4"
                      ></div>
                    </div>
                  {/if}
                </div>
              {/each}
            </ul>
          </div>
        </article>

        {#if isInteractif && interactifReady && !isCorrectionVisible && isContentVisible}
          <button
            id="verif{exerciseIndex}"
            type="submit"
            on:click={verifExercice}
            bind:this={buttonScore}
            >Vérifier {numberOfAnswerFields > 1
              ? 'les réponses'
              : 'la réponse'}</button
          >
        {/if}
        <div bind:this={divScore}></div>
      </div>
      <Settings
        exercice={exercise}
        bind:isVisible={isSettingsVisible}
        exerciceIndex={exerciseIndex}
        on:settings={handleNewSettings}
      />
    </div>
  {/if}
</div>

<style>
  li {
    break-inside: avoid;
  }
</style>
