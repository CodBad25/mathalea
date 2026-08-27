<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte'
  import { get } from 'svelte/store'
  import MetaExercice from '../../../exercices/MetaExerciceCan'
  import {
    buildExercisesList,
    splitExercisesIntoQuestions,
  } from '../../../lib/components/exercisesUtils'
  import { millisecondToMinSec } from '../../../lib/components/time'
  import {
    listOfCustomElements,
    mathaleaCustomElementsRegistry,
  } from '../../../lib/customElements/MathaleaCustomElement'
  import {
    answersFromCapytale,
    assignmentDataFromCapytale,
    sendToCapytaleSaveStudentAssignment,
  } from '../../../lib/handleCapytale'
  import { handleFullscreenEscape } from '../../../lib/fullscreen'
  import { decodeAnswers } from '../../../lib/lms/answersCodec'
  import { mathaleaUpdateUrlFromExercicesParams } from '../../../lib/mathalea'
  import { mathaleaWriteStudentPreviousAnswers } from '../../../lib/mathaleaUtils'
  import { canOptions } from '../../../lib/stores/canStore'
  import {
    darkMode,
    exercicesParams,
    resultsByExercice,
  } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import {
    interactivityTypeToCustomElementFormat,
    type IExercice,
    type InteractivityType,
    type InterfaceResultExercice,
    type QuestionResult,
  } from '../../../lib/types'
  import type { CanState } from '../../../lib/types/can'
  import { context } from '../../../modules/context'
  import { statsCanTracker } from '../../../modules/stats'
  import { keyboardState } from '../../keyboard/stores/keyboardStore'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import ButtonToggleDarkMode from '../../shared/forms/ButtonToggleDarkMode.svelte'
  import BtnFullscreen from '../../shared/ui/BtnFullscreen.svelte'
  import CountDown from './presentationalComponents/CountDown.svelte'
  import End from './presentationalComponents/End.svelte'
  import KickOff from './presentationalComponents/KickOff.svelte'
  import Question from './presentationalComponents/Question.svelte'
  import Race from './presentationalComponents/Race.svelte'
  import Solutions from './presentationalComponents/Solutions.svelte'

  export function resultsByQuestiontoBoolean(
    resultsByQuestion: QuestionResult[],
  ): QuestionResult[] {
    const results: QuestionResult[] = []
    for (let i = 0; i < resultsByQuestion.length; i++) {
      const resultat = resultsByQuestion[i]
      results.push(oneResultToBoolean(resultat))
    }
    return results
  }

  export function oneResultToBoolean(result: QuestionResult): QuestionResult {
    if (typeof result === 'boolean') {
      return result
    } else if (typeof result === 'object' && 'isOk' in result) {
      return result.isOk ?? false
    } else {
      window.notify("result contient quelque chose d'inconnu", {
        result: JSON.stringify(result),
      })
      return false
    }
  }

  let state: CanState = 'canHomeScreen'
  let exercises: IExercice[] = []
  let questions: string[] = []
  let consignes: string[] = []
  let corrections: string[] = []
  let consignesCorrections: string[] = []
  let indiceExercice: number[] = []
  let indiceQuestionInExercice: number[] = []
  let resultsByQuestion: QuestionResult[] = []
  let answers: string[] = []
  let recordedTimeInSeconds: number
  let unavailableMessage = ''

  /*
    Relecture d'une copie d'élève transmise dans l'URL par un LMS.

    Capytale envoie la copie par postMessage (voir `handleCapytale.ts`), mais
    Moodle recharge simplement l'iframe avec `done=1&answers=…&duration=…`
    (voir `public/assets/externalJs/moodle.scorm.js`). Dans ce cas la CAN ne
    connaît que les réponses : les résultats sont recalculés en rejouant la
    copie, exactement comme le fait la vue élève dans
    `ExerciceMathaleaVueEleve.svelte`.
  */
  const urlSearchParams = new URL(window.location.href).searchParams
  const savedAnswersParam = urlSearchParams.get('answers')
  const savedDurationParam = urlSearchParams.get('duration')
  // Vrai tant que la copie est en cours de relecture : les questions sont alors
  // rendues hors écran pour que les champs interactifs puissent être remplis.
  let isReplayingSavedCopy =
    $globalOptions.done === '1' &&
    $globalOptions.recorder !== 'capytale' &&
    savedAnswersParam != null &&
    savedAnswersParam.length > 0

  function getQuestionAnswerValue(
    exercice: IExercice,
    exerciceIndex: number,
    questionIndex: number,
    customElementType?: string,
  ) {
    const questionKey = `Ex${exerciceIndex}Q${questionIndex}`
    const customElementKey =
      customElementType == null
        ? undefined
        : `${customElementType}Ex${exerciceIndex}Q${questionIndex}`
    return (
      (customElementKey == null
        ? undefined
        : exercice.answers?.[customElementKey]) ??
      exercice.answers?.[questionKey] ??
      ''
    )
  }

  function collectAnswers(
    exercice: IExercice,
    predicate: (key: string) => boolean,
  ): { [key: string]: string } {
    return Object.keys(exercice.answers ?? {})
      .filter(predicate)
      .reduce((result: { [key: string]: string }, key) => {
        result[key] = exercice.answers![key]
        return result
      }, {})
  }

  function getCustomElementAnswers(
    exercice: IExercice,
    exerciceIndex: number,
    questionIndex: number,
    customElementType: string,
  ): { [key: string]: string } {
    const questionKey = `Ex${exerciceIndex}Q${questionIndex}`
    const lowerQuestionKey = `ex${exerciceIndex}Q${questionIndex}`
    const customElementKey = `${customElementType}Ex${exerciceIndex}Q${questionIndex}`
    if (exercice.answers?.[customElementKey] != null) {
      return { [customElementKey]: exercice.answers[customElementKey] }
    }
    return collectAnswers(
      exercice,
      (key) =>
        key.startsWith(customElementKey) ||
        key.startsWith(questionKey) ||
        key.startsWith(lowerQuestionKey) ||
        key.endsWith(questionKey) ||
        key.startsWith(`apigeomEx${exerciceIndex}F${questionIndex}`),
    )
  }

  function getCanAnswerTypeForCustomElement({
    exercice,
    type,
    customElementType,
    displayQuestionIndex,
    exerciceIndex,
    questionIndex,
  }: {
    exercice: IExercice
    type: InteractivityType
    customElementType: string
    displayQuestionIndex: number
    exerciceIndex: number
    questionIndex: number
  }): AnswerType {
    const answers = getCustomElementAnswers(
      exercice,
      exerciceIndex,
      questionIndex,
      customElementType,
    )
    // Certaines réponses ne sont pas indexées par `<tag>Ex{n}Q{i}` : une figure
    // apiGeom est enregistrée sous son propre identifiant. On retombe alors sur
    // la première réponse collectée pour la question.
    const answerTxt =
      getQuestionAnswerValue(
        exercice,
        exerciceIndex,
        questionIndex,
        customElementType,
      ) ||
      (Object.values(answers)[0] ?? '')
    return {
      type,
      index: displayQuestionIndex,
      answers,
      answerTxt: answerTxt.includes('apiGeomVersion') ? 'Voir figure' : answerTxt,
    }
  }

  onMount(async () => {
    document.addEventListener('updateAsyncEx', forceUpdate)
    // handleCapytale peut changer la valeur du store pour que le
    // professeur aille directement aux solutions de l'élève ou pour l'empêcher de recommencer
    canOptions.subscribe((value) => {
      state = value.state
      if (value.state !== 'solutions' && value.state !== 'canHomeScreen') return
      if (answersFromCapytale.length === 0) {
        return
      }
      for (const param of exercises) {
        param.interactif = false
      }

      for (const exercice of answersFromCapytale) {
        if (exercice.answers === undefined) {
          answers.push('')
          continue
        }
        const keys = Object.keys(exercice.answers)
        if (keys.length > 1) {
          const regex = /^Ex\d+Q\d+$/
          const key = keys.find((k) => regex.test(k))
          answers.push(key ? exercice.answers[key] : '')
        } else if (keys.length === 1) {
          const value = exercice.answers[keys[0]]
          if (value?.includes('apiGeomVersion')) {
            answers.push('Voir figure')
            const event = new CustomEvent(keys[0], { detail: value })
            document.dispatchEvent(event)
          } else {
            answers.push(value ? exercice.answers[keys[0]] : '')
          }
        } else {
          answers.push('')
        }
      }
      console.info('answers', answers)

      if (assignmentDataFromCapytale?.resultsByQuestion !== undefined)
        resultsByQuestion = resultsByQuestiontoBoolean(
          assignmentDataFromCapytale.resultsByQuestion,
        )
      if (assignmentDataFromCapytale?.duration !== undefined)
        recordedTimeInSeconds = assignmentDataFromCapytale.duration
    })
    context.isDiaporama = true
    // La vue Course aux nombres impose son propre réglage d'interactivité
    // (paramètre d'URL `canI`) à tous les exercices, sans tenir compte des
    // réglages individuels : afficher des champs de saisie ou des cases à
    // cocher alors que les réponses ne seront jamais vérifiées serait
    // trompeur pour l'élève.
    globalOptions.update((gOpt) => {
      gOpt.setInteractive = $canOptions.isInteractive ? '1' : '0'
      return gOpt
    })
    // reconstitution des exercices
    const builtExercises = await Promise.all(buildExercisesList())
    exercises = builtExercises.filter(
      (exercise) => exercise.typeExercice !== 'html',
    )
    if (builtExercises.length > 0 && exercises.length === 0) {
      unavailableMessage =
        'Cette Course aux nombres ne peut pas démarrer car elle ne contient aucun exercice compatible.'
      canOptions.update((options) => ({
        ...options,
        questionGetAnswer: [],
        state: 'start',
      }))
      return
    }
    // met à jour la url avec la graine...
    mathaleaUpdateUrlFromExercicesParams(get(exercicesParams))
    // interactivité
    $keyboardState.isVisible = $canOptions.isInteractive
    for (const exercise of exercises) {
      // `interactifObligatoire` signale un exercice sans version HTML non
      // interactive : on ne peut pas lui retirer son interactivité.
      exercise.interactif =
        $canOptions.isInteractive || exercise.interactifObligatoire
    }
    // découpage des exerices en questions
    buildQuestions()
    if (isReplayingSavedCopy) {
      await replaySavedCopy()
    }
  })

  /**
   * Rejoue la copie transmise par le LMS dans l'URL : les réponses sont
   * réinjectées dans les champs interactifs (rendus hors écran), puis
   * `checkAnswers()` les corrige comme à la fin d'une course, ce qui alimente
   * `answers` et `resultsByQuestion` pour la vue des corrections.
   */
  async function replaySavedCopy() {
    try {
      const savedAnswers = await decodeAnswers(savedAnswersParam ?? '')
      if (savedAnswers == null) return
      // Les questions doivent être dans le DOM pour que les réponses puissent y
      // être écrites puis relues par les fonctions de vérification.
      await tick()
      await Promise.all(mathaleaWriteStudentPreviousAnswers(savedAnswers))
      checkAnswers({ record: false })
    } catch (error) {
      console.error('Impossible de relire la copie transmise dans l’URL', error)
      window.notify('Copie transmise dans l’URL illisible', {
        error: error instanceof Error ? error.message : String(error),
        answers: savedAnswersParam,
      })
      return
    } finally {
      isReplayingSavedCopy = false
    }
    const duration = Number.parseInt(savedDurationParam ?? '', 10)
    if (Number.isFinite(duration)) {
      recordedTimeInSeconds = duration
    }
    $keyboardState.isVisible = false
    canOptions.update((options) => {
      options.state = 'solutions'
      return options
    })
  }

  // Certains exercices (ex. « Sélection d'automatismes ») chargent leurs
  // questions de façon asynchrone et signalent leur disponibilité via
  // l'événement `updateAsyncEx` : on reconstruit alors les questions, sinon
  // elles resteraient bloquées sur « chargement... ».
  function buildQuestions() {
    const splitResults = splitExercisesIntoQuestions(exercises)
    questions = splitResults.questions.filter(
      (question): question is string => typeof question === 'string',
    )
    consignes = [...splitResults.consignes]
    corrections = [...splitResults.corrections]
    consignesCorrections = [...splitResults.consignesCorrections]
    indiceExercice = [...splitResults.indiceExercice]
    indiceQuestionInExercice = [...splitResults.indiceQuestionInExercice]
    $canOptions.questionGetAnswer = questions.map(() => false)
  }

  function forceUpdate() {
    buildQuestions()
  }

  onDestroy(() => {
    document.removeEventListener('updateAsyncEx', forceUpdate)
  })

  type AnswerType = {
    type: InteractivityType
    index: number
    answers?: { [key: string]: string }
    answerTxt: string
  }

  /**
   * Corrige les réponses présentes dans le DOM et alimente `answers` et
   * `resultsByQuestion`.
   * @param record `false` lors de la relecture d'une copie déjà enregistrée :
   * il ne faut alors ni comptabiliser la course dans les statistiques, ni
   * renvoyer un score au LMS (le temps mis serait faux, la copie écrasée).
   */
  function checkAnswers({ record = true }: { record?: boolean } = {}) {
    if (record) {
      statsCanTracker($globalOptions.recorder ?? '', $globalOptions.v ?? '')
    }
    const answersType: AnswerType[] = []
    for (let i = 0; i < questions.length; i++) {
      const exercice = exercises[indiceExercice[i]]
      const type =
        exercice.autoCorrection?.[indiceQuestionInExercice[i]]
          ?.formatInteractif ?? 'mathlive'
      const customElementType =
        interactivityTypeToCustomElementFormat(type) ?? type

      if (type === 'custom') {
        // si le type est `custom` on est sûr que `correctionInteractive` existe
        // d'où le ! après `correctionInteractive`
        if (exercice instanceof MetaExercice) {
          const result = exercice.correctionInteractives[
            indiceQuestionInExercice[i]
          ](indiceQuestionInExercice[i])
          Array.isArray(result)
            ? (resultsByQuestion[i] = result.every(
                (el) => typeof el === 'string',
              )
                ? !result.includes('KO')
                : false)
            : (resultsByQuestion[i] =
                typeof result === 'string' ? result === 'OK' : result) // On prévoit le cas où un custom renvoie un DetailledQuestionResult
        } else {
          const result = exercice.correctionInteractive!(
            indiceQuestionInExercice[i],
          )
          Array.isArray(result)
            ? (resultsByQuestion[i] = result.every(
                (el) => typeof el === 'string',
              )
                ? !result.includes('KO')
                : false)
            : (resultsByQuestion[i] =
                typeof result === 'string' ? result === 'OK' : result) // On prévoit le cas où un custom renvoie un DetailledQuestionResult
        }
        resultsByQuestion[i] = oneResultToBoolean(resultsByQuestion[i]) // normalement il n'y en a pas besoin, mais sait-on jamais ...
        answersType[i] = {
          type,
          index: i,
          answers: collectAnswers(
            exercice,
            (key) =>
              key.endsWith(
                `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
              ) ||
              key.startsWith(
                `apigeomEx${indiceExercice[i]}F${indiceQuestionInExercice[i]}`,
              ),
          ),
          answerTxt: '',
        }
        answersType[i].answerTxt = Object.keys(answersType[i].answers ?? {})
          .filter((key: string, index: number) => index === 0)
          .reduce((result: string, k) => {
            result = answersType[i].answers![k]
            return result
          }, '')
        answers[i] = answersType[i].answerTxt.includes('apiGeomVersion')
          ? 'Voir figure'
          : answersType[i].answerTxt
      } else if (listOfCustomElements.includes(customElementType)) {
        const liste = Array.from(mathaleaCustomElementsRegistry)
        const [tag, elementClasse] =
          liste.find((custom) => custom[0] === customElementType) ?? []
        if (tag == null || elementClasse == null) {
          throw Error(
            "Une classe de listOfCustomElements n'est pas enregistrée dans le registre mathaleaCustomElementsRegistry",
          )
        }
        const result = elementClasse.verifQuestion(
          exercice,
          indiceQuestionInExercice[i],
        )
        if (
          result == null ||
          typeof result !== 'object' ||
          !('isOk' in result) ||
          !('score' in result)
        ) {
          throw Error(
            `L'élément '${tag}' n'a pas de méthode verifQuestion ou celle-ci n'a pas retourné une valeur conforme)`,
          )
        }
        resultsByQuestion[i] = result.isOk
        answersType[i] = getCanAnswerTypeForCustomElement({
          exercice,
          type: type as InteractivityType,
          customElementType: tag,
          displayQuestionIndex: i,
          exerciceIndex: indiceExercice[i],
          questionIndex: indiceQuestionInExercice[i],
        })
        answers[i] = answersType[i].answerTxt
      } else {
        answersType[i] = {
          type: 'mathlive',
          index: i,
          answers: collectAnswers(exercice, (key) =>
            key.endsWith(`Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`),
          ),
          answerTxt: '',
        }
      }
      // Pour Capytale, on a besoin du score de l'exercice et non de la question
      // donc on sauvegarde le score dans l'exercice
      if (resultsByQuestion[i] && exercice.score !== undefined) {
        exercice.score++
      }
    }

    // Désactiver l'interactivité avant l'affichage des solutions
    for (const param of exercises) {
      param.interactif = false
    }
    const resultsByExerciceArray: InterfaceResultExercice[] = []
    for (let i = 0, ind = 0; i < exercises.length; i++) {
      const exercise = exercises[i]
      for (let q = 0; q < exercise.nbQuestions; q++) {
        const quest: InterfaceResultExercice = {
          uuid: exercise.uuid,
          title: exercise.titre,
          indice: exercise.numeroExercice,
          state: 'done',
          alea: exercise.seed,
          answers: answersType[ind].answers,
          numberOfPoints: resultsByQuestion[ind] ? 1 : 0,
          numberOfQuestions: 1,
          bestScore: resultsByQuestion[ind] ? 1 : 0,
          resultsByQuestion: [resultsByQuestion[ind]],
          duration: Math.floor(
            $canOptions.durationInMinutes * 60 -
              $canOptions.remainingTimeInSeconds,
          ),
        }
        ind++
        resultsByExerciceArray.push(quest)
      }
    }
    resultsByExercice.update((l) => {
      l = resultsByExerciceArray
      return l
    })
    if (!record) return
    if ($globalOptions.recorder === 'moodle') {
      const url = new URL(window.location.href)
      const iframe = url.searchParams.get('iframe')
      console.info({
        resultsByExercice: $resultsByExercice,
        duration: getDuration(),
        action: 'mathalea:score',
        iframe,
      })
      window.parent.postMessage(
        {
          resultsByExercice: $resultsByExercice,
          duration: getDuration(),
          action: 'mathalea:score',
          iframe,
        },
        '*',
      )
    } else if ($globalOptions.recorder === 'capytale') {
      if (
        getRecordedScore() > getScoreTotal() ||
        (getRecordedScore() === getScoreTotal() &&
          assignmentDataFromCapytale?.duration &&
          assignmentDataFromCapytale?.duration < getDuration())
      ) {
        return
      }
      sendToCapytaleSaveStudentAssignment({
        indiceExercice: 'all',
        assignmentData: {
          duration: getDuration(),
          resultsByQuestion: resultsByQuestiontoBoolean(resultsByQuestion),
        },
      })
    }
  }

  function getDuration(): number {
    return Math.floor(
      $canOptions.durationInMinutes * 60 - $canOptions.remainingTimeInSeconds,
    )
  }

  /**
   * Construit la chaîne qui sera affichée pour le score
   * nombre de points obtenu / nombre de questions
   */
  function buildStringScore(): string {
    const score = getScoreTotal()
    return score + '/' + resultsByQuestion.length
  }

  function getScoreTotal(): number {
    let score = 0
    for (const result of resultsByQuestion) {
      if (result === true) {
        score++
      }
    }
    return score
  }

  function getRecordedScore(): number {
    let score = 0
    if (assignmentDataFromCapytale?.resultsByQuestion !== undefined) {
      for (const result of assignmentDataFromCapytale.resultsByQuestion) {
        if (result === true) {
          score++
        }
      }
    }
    return score
  }

  /**
   * Construit la chaîne MM:SS qui sera affichée pour le temps mis à faire la course
   */
  function buildTime(): string {
    const nbOfSeconds =
      recordedTimeInSeconds ||
      $canOptions.durationInMinutes * 60 - $canOptions.remainingTimeInSeconds
    const time = millisecondToMinSec(nbOfSeconds * 1000)
    return [
      time.minutes.toString().padStart(2, '0'),
      time.seconds.toString().padStart(2, '0'),
    ].join(':')
  }

  function returnToSetup() {
    globalOptions.update((options) => {
      options.v = ''
      return options
    })
  }
</script>

<svelte:window on:keydown={handleFullscreenEscape} />
<div
  class="{$darkMode.isActive
    ? 'dark'
    : ''} relative w-full h-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
>
  {#if isReplayingSavedCopy}
    <!--
      Les questions sont montées hors de l'écran, le temps d'y réinjecter les
      réponses de l'élève et de les corriger. Elles sont ensuite démontées : la
      vue des corrections réaffiche les énoncés débarrassés de leurs widgets.
    -->
    <div
      class="w-full h-full flex justify-center items-center text-2xl font-light text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      Chargement de la copie…
    </div>
    <div
      aria-hidden="true"
      class="fixed top-0 w-[1000px]"
      style="left: -10000px;"
    >
      {#each [...Array(questions.length).keys()] as i}
        <Question
          consigne={consignes[i]}
          question={questions[i]}
          consigneCorrection={''}
          correction={''}
          mode={'display'}
          visible={false}
          index={i}
        />
      {/each}
    </div>
  {:else if state === 'start' || state === 'canHomeScreen'}
    <KickOff
      title={$canOptions.title}
      subTitle={$canOptions.subTitle}
      canStart={!unavailableMessage}
      bind:state
    >
      {#if unavailableMessage}
        <div class="mx-6 mt-8 flex max-w-3xl flex-col items-center gap-6">
          <div
            class="w-full rounded-xl bg-coopmaths-canvas/10 px-6 py-4 text-center text-xl font-light"
          >
            {unavailableMessage}
          </div>
          <ButtonTextAction
            class="rounded-xl px-6 py-3 text-xl font-bold"
            text="Retour à la configuration"
            icon="bx-arrow-back bx-md"
            on:click={returnToSetup}
          />
        </div>
      {/if}
    </KickOff>
  {/if}
  {#if state === 'countdown'}
    <CountDown bind:state />
  {/if}
  {#if state === 'race'}
    <Race
      numberOfSeconds={$canOptions.durationInMinutes * 60}
      bind:state
      {questions}
      {consignes}
      {checkAnswers}
    />
  {/if}
  {#if state === 'end'}
    <End bind:state score={buildStringScore()} time={buildTime()} />
  {/if}
  {#if state === 'solutions'}
    <Solutions
      {questions}
      {consignes}
      {corrections}
      {consignesCorrections}
      {answers}
      {resultsByQuestion}
      score={buildStringScore()}
      time={buildTime()}
    />
  {/if}
  <div class="fixed flex flex-row items-center space-x-2 bottom-2 right-2">
    <!-- Dans Moodle, l'iframe est à l'étroit dans la page du cours -->
    {#if $globalOptions.recorder === 'moodle'}
      <BtnFullscreen size="sm" isPlain={true} />
    {/if}
    <ButtonToggleDarkMode />
  </div>
</div>
