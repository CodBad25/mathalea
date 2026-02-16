<script lang="ts">
  import seedrandom from 'seedrandom'
  import { afterUpdate, beforeUpdate, onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import type TypeExercice from '../../../../../exercices/Exercice'
  import { sendToCapytaleSaveStudentAssignment } from '../../../../../lib/handleCapytale'
  import {
    exerciceInteractif,
    prepareExerciceCliqueFigure,
  } from '../../../../../lib/interactif/gestionInteractif'
  import {
    mathaleaGenerateSeed,
    mathaleaHandleExerciceSimple,
    mathaleaRenderDiv,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../../../lib/mathalea'
  import { mathaleaWriteStudentPreviousAnswers } from '../../../../../lib/mathaleaUtils'
  import {
    capytaleStudentAssignment,
    exercicesParams,
    isMenuNeededForExercises,
    resultsByExercice,
  } from '../../../../../lib/stores/generalStore'
  import { globalOptions } from '../../../../../lib/stores/globalOptions'
  import { isLocalStorageAvailable } from '../../../../../lib/stores/storage'
  import type {
    InterfaceParams,
    InterfaceResultExercice,
  } from '../../../../../lib/types'
  import { loadMathLive } from '../../../../../modules/loaders'
  import { statsTracker } from '../../../../../modules/statsUtils'
  import { countMathField } from '../../countMathField'
  import { handleCorrectionAffichee } from '../../handleCorrection'
  import HeaderExerciceVueEleve from '../../presentationalComponents/shared/HeaderExerciceVueEleve.svelte'
  import ExerciceVueEleveButtons from './presentationalComponents/ExerciceVueEleveButtons.svelte'
  import Question from './presentationalComponents/Question.svelte'
  export let exercise: TypeExercice
  export let exerciseIndex: number
  export let indiceLastExercice: number
  export let isCorrectionVisible: boolean = false

  let divExercice: HTMLDivElement
  let divScore: HTMLDivElement
  let buttonScore: HTMLButtonElement
  let isInteractif = exercise.interactif && exercise?.interactifReady

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
  let columnsCount = interfaceParams?.cols || 1

  let debug = false
  function log(str: string, level: number = 3) {
    if (debug || window.logDebug >= level) {
      console.info(str)
    }
  }

  const subscribeExercicesParamsStore = exercicesParams.subscribe((value) => {
    log('new interface:' + JSON.stringify(interfaceParams))
    if (value[exerciseIndex] !== interfaceParams) {
      // MGu c'est une comparaison par référence
      log('new interfaceParams subscribe:' + JSON.stringify(interfaceParams))
      interfaceParams = value[exerciseIndex]
    }
  })

  // une variable locale car si on modifie isCorrectionVisible, parfois elle devient undefined
  let isCorrectVisible = isCorrectionVisible

  // URL-driven display toggles (only used for FlowMath recorder)
  let boutonValidationUrlFlag = true
  let boutonCorrectionUrlFlag = true
  let boutonInteractiviteUrlFlag = true

  let title: string
  const ref = exercise.id
    ? exercise.id.replace('.js', '').replace('.ts', '')
    : ''
  if ($globalOptions.isTitleDisplayed && $globalOptions.isReferenceDisplayed) {
    title = ref ? `${ref} - ${exercise.titre}` : exercise.titre
  } else if ($globalOptions.isTitleDisplayed) {
    title = exercise.titre
  } else if ($globalOptions.isReferenceDisplayed) {
    title = ref
  } else {
    title = ''
  }
  // Evènement indispensable pour pointCliquable par exemple
  const exercicesAffiches = new window.Event('exercicesAffiches', {
    bubbles: true,
  })

  let headerExerciceProps: { title: string } = { title }

  let numberOfAnswerFields: number = 0

  async function forceUpdate() {
    if (exercise == null) return
    exercise.numeroExercice = exerciseIndex
    await adjustMathalea2dFiguresWidth()
  }

  function updateAnswers() {
    if ($globalOptions.done === '1' && $globalOptions.recorder !== 'capytale') {
      const q1 = document.querySelector<HTMLElement>(
        '#exercice' + exercise.numeroExercice + 'Q0',
      )
      if (q1?.innerText === 'chargement...') return // en attente du chargement de l'exercice
      const fields = document.querySelectorAll('math-field')
      fields.forEach((field) => {
        field.setAttribute('disabled', 'true')
      })
      const url = new URL(window.location.href)
      // Pour Moodle, les réponses sont dans l'URL
      const answers = url.searchParams.get('answers')
      const objAnswers = answers ? JSON.parse(answers) : undefined
      if (
        JSON.stringify($globalOptions.answers) === JSON.stringify(objAnswers)
      ) {
        $globalOptions.answers = objAnswers
      }
      mathaleaUpdateUrlFromExercicesParams()
      Promise.all(mathaleaWriteStudentPreviousAnswers(objAnswers)).then(() => {
        // une fois que les réponses sont chargées et on en est sûr, on clique...
        if (buttonScore) {
          exercise.isDone = true
          buttonScore.click()
        }
      })
    }
  }

  onDestroy(() => {
    log('ondestroy' + exercise.id)
    // Détruit l'objet exercice pour libérer la mémoire
    exercise.reinit() // MGu nécessaire pour supprimer les listeners
    subscribeExercicesParamsStore()
  })

  onMount(async () => {
    log('onMount:' + exercise.id + ', v:' + $globalOptions.v)
    // Check boutonValidation mode after component is mounted
    if ($globalOptions.recorder === 'flowmath') {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        boutonValidationUrlFlag = urlParams.get('boutonValidation') !== 'false'
        boutonCorrectionUrlFlag = urlParams.get('boutonCorrection') !== 'false'
        boutonInteractiviteUrlFlag =
          urlParams.get('boutonInteractivite') !== 'false'
      } catch (e) {
        console.warn('Could not check FlowMath button flags:', e)
      }
    }

    document.addEventListener('newDataForAll', newData)
    document.addEventListener('setAllInteractif', setAllInteractif)
    document.addEventListener('removeAllInteractif', removeAllInteractif)
    document.addEventListener('updateAsyncEx', forceUpdate)
    updateDisplay()
    if ($globalOptions.setInteractive === '1') {
      setAllInteractif()
    } else if ($globalOptions.setInteractive === '0') {
      removeAllInteractif()
    }
    log('End onMount:' + exercise.id + ', v:' + $globalOptions.v)
  })

  beforeUpdate(async () => {
    log('beforeUpdate:' + exercise.id + ', v:' + $globalOptions.v)
    const count = countMathField(exercise)
    if (count !== numberOfAnswerFields) {
      numberOfAnswerFields = count
      log('numberOfAnswerFields:' + numberOfAnswerFields)
    }
  })

  afterUpdate(async () => {
    log('afterUpdate:' + exercise.id + ', v:' + $globalOptions.v)
    const starttime = window.performance.now()
    if (exercise && divExercice) {
      mathaleaRenderDiv(divExercice)
      let time = window.performance.now()
      log('duration mathaleaRenderDiv:' + (time - starttime))
      adjustMathalea2dFiguresWidth()
      time = window.performance.now()
      log('duration adjustMathalea2dFiguresWidth:' + (time - starttime))
      if (exercise.interactif) {
        log('loadMathLive')
        loadMathLive(divExercice)
        log('end loadMathLive')
        time = window.performance.now()
        log('duration loadMathLive:' + (time - starttime))
        if (exercise.interactifType === 'cliqueFigure' && !isCorrectVisible) {
          prepareExerciceCliqueFigure(exercise)
        }

        // Ne pas être noté sur un exercice dont on a déjà vu la correction
        try {
          if (
            isLocalStorageAvailable() &&
            exercise.id !== undefined &&
            exercise.seed !== undefined &&
            window.localStorage.getItem(`${exercise.id}|${exercise.seed}`) !=
              null
          ) {
            newData()
          }
        } catch (e) {
          console.error(e)
        }
        time = window.performance.now()
        log('localStorage:' + exerciseIndex + ':' + (time - starttime))
      }
      updateAnswers()
      time = window.performance.now()
      log('duration updateAnswers:' + (time - starttime))
    }
    // affectation du zoom pour les figures scratch
    const scratchDivs = divExercice.getElementsByClassName('scratchblocks')
    for (const scratchDiv of scratchDivs) {
      const svgDivs = scratchDiv.getElementsByTagName('svg')
      for (const svg of svgDivs) {
        if (svg.hasAttribute('data-width') === false) {
          const originalWidth = svg.getAttribute('width')
          svg.dataset.width = originalWidth ?? ''
        }
        if (svg.hasAttribute('data-height') === false) {
          const originalHeight = svg.getAttribute('height')
          svg.dataset.height = originalHeight ?? ''
        }
        const w =
          Number(svg.getAttribute('data-width')) * Number($globalOptions.z)
        const h =
          Number(svg.getAttribute('data-height')) * Number($globalOptions.z)
        svg.setAttribute('width', w.toString())
        svg.setAttribute('height', h.toString())
      }
    }
    document.dispatchEvent(exercicesAffiches)
    if (isCorrectVisible) {
      handleCorrectionAffichee()
    }
    log(
      'afterUpdate:n° ' +
        exerciseIndex +
        ', id: ' +
        exercise.id +
        ', v:' +
        $globalOptions.v +
        ', d:' +
        (window.performance.now() - starttime),
      2,
    )
  })

  async function newData() {
    exercise.isDone = false
    if (isCorrectVisible) switchCorrectionVisible(false)
    const seed = mathaleaGenerateSeed()
    exercise.seed = seed
    if (buttonScore?.dataset?.capytaleLoadAnswers === '1') {
      // si les données ont été chargées par Capytale, on remet à 0
      buttonScore.dataset.capytaleLoadAnswers = '0'
    }
    if (divScore) {
      divScore.innerHTML = ''
    }
    if (buttonScore) {
      buttonScore.classList.remove(
        'cursor-not-allowed',
        'opacity-50',
        'pointer-events-none',
      )
    }
    updateDisplay()
  }

  async function setAllInteractif() {
    if (exercise?.interactifReady && !isInteractif) {
      isInteractif = true
      updateDisplay()
    }
  }
  async function removeAllInteractif() {
    if (exercise?.interactifReady && isInteractif) {
      isInteractif = false
      updateDisplay()
    }
  }

  async function updateDisplay() {
    log('updateDisplay:' + exercise.id + ', v:' + $globalOptions.v)
    if (exercise.typeExercice === 'simple') {
      if (exercise.seed === undefined) exercise.seed = mathaleaGenerateSeed()
      seedrandom(exercise.seed, { global: true })
      mathaleaHandleExerciceSimple(exercise, !!isInteractif, exerciseIndex)
    }
    exercise.interactif = isInteractif
    if (interfaceParams) {
      let changed = false

      if (interfaceParams.alea !== exercise.seed) {
        interfaceParams.alea = exercise.seed
        changed = true
      }

      const interactifValue = isInteractif ? '1' : '0'
      if (interfaceParams.interactif !== interactifValue) {
        interfaceParams.interactif = interactifValue
        changed = true
      }

      if (columnsCount > 1) {
        if (interfaceParams.cols !== columnsCount) {
          interfaceParams.cols = columnsCount
          changed = true
        }
      } else if (columnsCount <= 1) {
        if (interfaceParams.cols !== undefined) {
          interfaceParams.cols = undefined
          changed = true
        }
      }
      if (changed) {
        log(
          'updateDisplay: updating exercicesParams for index ' +
            exerciseIndex +
            ': ' +
            JSON.stringify(interfaceParams),
          2,
        )
        exercicesParams.update((l: InterfaceParams[]) => {
          if (interfaceParams) {
            l[exerciseIndex] = interfaceParams
          }
          return l
        })
      }
    }

    exercise.numeroExercice = exerciseIndex
    if (
      exercise !== undefined &&
      exercise.typeExercice !== 'simple' &&
      typeof exercise.nouvelleVersionWrapper === 'function'
    ) {
      if (exercise.seed === undefined) exercise.seed = mathaleaGenerateSeed()
      log('nouvelleVersionWrapper:' + exercise.id + ', v:' + $globalOptions.v)
      seedrandom(exercise.seed, { global: true })
      exercise.nouvelleVersionWrapper(exerciseIndex)
    }
    numberOfAnswerFields = countMathField(exercise)
    log('numberOfAnswerFields:' + numberOfAnswerFields)
    mathaleaUpdateUrlFromExercicesParams()
    await adjustMathalea2dFiguresWidth()
  }

  async function verifExerciceVueEleve() {
    log('verifExerciceVueEleve')
    if (exercise.numeroExercice != null && !(exercise.isDone === true))
      statsTracker(
        exercise,
        $globalOptions.recorder ?? '',
        $globalOptions.v ?? '',
        buttonScore?.dataset?.capytaleLoadAnswers === '1' ? 'review' : '',
      )
    exercise.isDone = true

    if (exercise.numeroExercice != null) {
      const previousBestScore = interfaceParams?.bestScore ?? 0
      const { numberOfPoints, numberOfQuestions } = exerciceInteractif(
        exercise,
        divScore,
        buttonScore,
      )
      const isThisTryBetter = numberOfPoints >= previousBestScore
      if (
        buttonScore.dataset.capytaleLoadAnswers === '1' &&
        previousBestScore !== numberOfPoints
      ) {
        // ICI les réponses ont été chargées par Capytale et
        //  le score ne peut pas être inferieur à best score,
        //  car c'est de la restitution de la meilleure copie
        // donc si on est ici dans ce IF, c'est un bug du moteur à faire vite remonter
        const newStudentAssignement = get(capytaleStudentAssignment) || []
        const previousResultatByExercice =
          newStudentAssignement[exercise.numeroExercice as number]
        if (exercise?.checkSum !== previousResultatByExercice?.checkSum) {
          window.notify(
            `Exercice ${exercise.numeroExercice} a changé, passé de ${previousBestScore} à ${numberOfPoints}. Checksum différent avant ${previousResultatByExercice?.checkSum} et maintenant ${exercise?.checkSum}.`,
            {
              exo: exercise,
              globalOptions: get(globalOptions),
              exercicesParams: get(exercicesParams),
              resultsByExercice: get(resultsByExercice),
            },
          )
        }

        window.notify(
          `Le score de l'exercice ${exercise.numeroExercice} est incorrect, checksum(${exercise?.checkSum === previousResultatByExercice?.checkSum}), passé de ${previousBestScore} à ${numberOfPoints}. Merci de le signaler au support.`,
          {
            exo: exercise,
            globalOptions: get(globalOptions),
            exercicesParams: get(exercicesParams),
            resultsByExercice: get(resultsByExercice),
          },
        )
      }

      let bestScore = previousBestScore
      // On ne met à jour resultsByExercice que si le score est meilleur
      if (isThisTryBetter) {
        bestScore = numberOfPoints
        exercicesParams.update((l: InterfaceParams[]) => {
          l[exercise.numeroExercice as number].bestScore = bestScore
          return l
        })
        resultsByExercice.update((l: InterfaceResultExercice[]) => {
          l[exercise.numeroExercice as number] = {
            uuid: exercise.uuid,
            title: exercise.titre,
            indice: exercise.numeroExercice as number,
            state: 'done',
            alea: exercise.seed,
            answers: exercise.answers,
            numberOfPoints,
            numberOfQuestions,
            bestScore,
            checkSum: exercise.checkSum,
          }
          return l
        })
      }

      if ($globalOptions.isSolutionAccessible) {
        isCorrectVisible = true
      }

      if ($globalOptions.recorder === 'moodle') {
        const url = new URL(window.location.href)
        const iframe = url.searchParams.get('iframe')
        console.info({
          resultsByExercice: $resultsByExercice,
          action: 'mathalea:score',
          iframe,
        })
        window.parent.postMessage(
          {
            resultsByExercice: $resultsByExercice,
            action: 'mathalea:score',
            iframe,
          },
          '*',
        )
      } else if ($globalOptions.recorder === 'capytale') {
        if (buttonScore.dataset.capytaleLoadAnswers === '1') {
          console.info(
            'Les réponses ont été chargées par Capytale donc on ne les renvoie pas à nouveau',
          )
          return
        }
        if (isThisTryBetter) {
          sendToCapytaleSaveStudentAssignment({
            indiceExercice: exerciseIndex,
          })
        }
      }
    }
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
    const mathalea2dFigures: NodeListOf<SVGElement> | undefined =
      divExercice?.querySelectorAll<SVGElement>('.mathalea2d')
    if (!mathalea2dFigures || mathalea2dFigures.length === 0) return

    const zoom = Number($globalOptions.z ?? 1)
    log('zoom:' + zoom)
    if (mathalea2dFigures.length !== 0) {
      for (let k = 0; k < mathalea2dFigures.length; k++) {
        if (initialDimensionsAreNeeded) {
          // réinitialisation
          const initialWidth = mathalea2dFigures[k].getAttribute(
            'data-width-initiale',
          )
          const initialHeight = mathalea2dFigures[k].getAttribute(
            'data-height-initiale',
          )
          mathalea2dFigures[k].setAttribute(
            'width',
            (Number(initialWidth) * zoom).toString(),
          )
          mathalea2dFigures[k].setAttribute(
            'height',
            (Number(initialHeight) * zoom).toString(),
          )
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
              e.style.setProperty(
                'top',
                (Number(e.dataset.top) * zoom).toString() + 'px',
              )
              e.style.setProperty(
                'left',
                (Number(e.dataset.left) * zoom).toString() + 'px',
              )
            }
          }
        }
        /* Mickael:
          Ne surtout pas mettre la référence de l'exercice dans la requête suivante,
          car dans svelte, la référence est liée au dernier exercice chargé, ce qui bug!
          */
        const consigneDiv = divExercice
          ?.querySelector('article')
          ?.querySelector('[id^="consigne"]')
        if (
          consigneDiv &&
          mathalea2dFigures[k].clientWidth > consigneDiv.clientWidth
        ) {
          const coef =
            (consigneDiv.clientWidth * 0.95) / mathalea2dFigures[k].clientWidth
          // console.log('coef:' + coef )
          const width = mathalea2dFigures[k].getAttribute('width')
          const height = mathalea2dFigures[k].getAttribute('height')
          if (!mathalea2dFigures[k].dataset.widthInitiale && width != null)
            mathalea2dFigures[k].dataset.widthInitiale = width
          if (!mathalea2dFigures[k].dataset.heightInitiale && height != null)
            mathalea2dFigures[k].dataset.heightInitiale = height
          const newHeight = (
            Number(mathalea2dFigures[k].dataset.heightInitiale) *
            zoom *
            coef
          ).toString()
          const newWidth = (
            Number(mathalea2dFigures[k].dataset.widthInitiale) *
            zoom *
            coef
          ).toString()
          if (width !== newWidth) {
            mathalea2dFigures[k].setAttribute('width', newWidth)
          }
          if (height !== newHeight) {
            mathalea2dFigures[k].setAttribute('height', newHeight)
          }

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
              e.style.setProperty(
                'top',
                (initialTop * coef * zoom).toString() + 'px',
              )
              e.style.setProperty(
                'left',
                (initialLeft * coef * zoom).toString() + 'px',
              )
            }
          }
        }
      }
    }
  }

  // pour recalculer les tailles lors d'un changement de dimension de la fenêtre
  window.onresize = () => {
    adjustMathalea2dFiguresWidth(true)
  }

  function switchCorrectionVisible(newdata: boolean = true) {
    isCorrectVisible = !isCorrectVisible
    if (
      isCorrectVisible &&
      isLocalStorageAvailable() &&
      exercise.id !== undefined
    ) {
      window.localStorage.setItem(`${exercise.id}|${exercise.seed}`, 'true')
    }
    if (
      newdata &&
      !$globalOptions.oneShot &&
      exercise.interactif &&
      !isCorrectVisible &&
      !exercise.isDone
    ) {
      newData()
    }
    if (newdata) adjustMathalea2dFiguresWidth()
  }

  function switchInteractif() {
    if (isCorrectVisible) switchCorrectionVisible()
    isInteractif = !isInteractif
    exercise.interactif = isInteractif
    updateDisplay()
  }

  function columnsCountUpdate(plusMinus: '+' | '-') {
    if (plusMinus === '+') columnsCount++
    if (plusMinus === '-') columnsCount--
    updateDisplay()
  }
</script>

<div class="z-0 flex-1 w-full mb-10 lg:mb-20" bind:this={divExercice}>
  {#if $globalOptions.presMode !== 'recto' && $globalOptions.presMode !== 'verso'}
    <HeaderExerciceVueEleve
      {...headerExerciceProps}
      indiceExercice={exerciseIndex}
      showNumber={indiceLastExercice > 0 &&
        $globalOptions.presMode !== 'un_exo_par_page'}
      isMenuNeededForExercises={$isMenuNeededForExercises}
      presMode={$globalOptions.presMode}
      seed={exercise.seed}
    />
  {/if}

  <div class="flex flex-col-reverse lg:flex-row">
    <div
      class="flex flex-col justify-start items-start"
      id="exercice{exerciseIndex}"
    >
      <ExerciceVueEleveButtons
        globalOptions={$globalOptions}
        {indiceLastExercice}
        {exercise}
        isCorrectionVisible={isCorrectVisible}
        {newData}
        {switchCorrectionVisible}
        {isInteractif}
        {switchInteractif}
        {columnsCount}
        {columnsCountUpdate}
        showCorrectionButton={$globalOptions.recorder === 'flowmath'
          ? boutonCorrectionUrlFlag
          : true}
        showInteractivityButton={$globalOptions.recorder === 'flowmath'
          ? boutonInteractiviteUrlFlag
          : true}
      />
      <article
        class=" {$isMenuNeededForExercises
          ? 'text-2xl'
          : 'text-base'} relative w-full"
        style="font-size: {(
          $globalOptions.z || 1
        ).toString()}rem;  line-height: calc({$globalOptions.z || 1});"
      >
        <div class="flex flex-col w-full mt-2 lg:mt-0 mb-2">
          {#key exercise.key}
            {#if typeof exercise.consigne !== 'undefined' && exercise.consigne.length !== 0}
              <div>
                <p
                  class="mt-2 mb-2 ml-2 lg:mx-6 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
                >
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html exercise.consigne}
                </p>
              </div>
            {/if}
            {#if exercise.introduction}
              <div>
                <p
                  class="mt-2 mb-2 ml-2 lg:mx-6 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
                >
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html exercise.introduction}
                </p>
              </div>
            {/if}
          {/key}
        </div>
        <div
          style="columns: {window.innerWidth > 1000
            ? columnsCount.toString()
            : '1'}"
        >
          <ul
            class="{exercise.listeQuestions.length === 1 ||
            !exercise.listeAvecNumerotation
              ? 'list-none'
              : 'list-decimal'} list-inside mx-2 lg:mx-6 marker:text-coopmaths-struct dark:marker:text-coopmathsdark-struct marker:font-bold"
          >
            <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
            {#each exercise.listeQuestions as question, questionIndex (exercise.key + '_' + exerciseIndex + '_' + questionIndex)}
              <Question
                {exercise}
                {questionIndex}
                {exerciseIndex}
                isCorrectionVisible={isCorrectVisible}
              />
            {/each}
            <div bind:this={divScore} id="divScoreEx{exerciseIndex}"></div>
          </ul>
        </div>
      </article>
      {#if isInteractif && !isCorrectVisible}
        <button
          type="submit"
          bind:this={buttonScore}
          on:click={verifExerciceVueEleve}
          id="buttonScoreEx{exerciseIndex}"
          class={`inline-block px-6 py-2.5 mr-10 my-5 ml-6
                  bg-coopmaths-action dark:bg-coopmathsdark-action
                  text-coopmaths-canvas dark:text-coopmathsdark-canvas
                  font-medium text-xs leading-tight uppercase rounded shadow-md
                  transform hover:bg-coopmaths-action-lightest dark:hover:bg-coopmathsdark-action-lightest
                  hover:shadow-lg focus:bg-coopmaths-action-lightest dark:focus:bg-coopmathsdark-action-lightest
                  focus:shadow-lg focus:outline-none focus:ring-0
                  active:bg-coopmaths-action-lightest dark:active:bg-coopmathsdark-action-lightest
                  active:shadow-lg transition duration-150 ease-in-out checkReponses`}
          class:hidden={$globalOptions.recorder === 'flowmath' &&
            !boutonValidationUrlFlag}
          hidden={$globalOptions.recorder === 'flowmath' &&
            !boutonValidationUrlFlag}
        >
          Vérifier {numberOfAnswerFields > 1 ? 'les réponses' : 'la réponse'}
        </button>
      {/if}
    </div>
  </div>
</div>
