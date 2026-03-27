<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import MetaExercice from '../../../exercices/MetaExerciceCan'
  import {
    buildExercisesList,
    splitExercisesIntoQuestions,
  } from '../../../lib/components/exercisesUtils'
  import { millisecondToMinSec } from '../../../lib/components/time'
  import {
    answersFromCapytale,
    assignmentDataFromCapytale,
    sendToCapytaleSaveStudentAssignment,
  } from '../../../lib/handleCapytale'
  import {
    indexQuestionCliqueFigure,
    verifQuestionCliqueFigure,
  } from '../../../lib/interactif/cliqueFigure'
  import { verifDragAndDrop } from '../../../lib/interactif/DragAndDrop'
  import { verifQuestionMetaInteractif2d } from '../../../lib/interactif/gestionInteractif'
  import { verifQuestionMathLive } from '../../../lib/interactif/mathLive'
  import { verifQuestionQcm } from '../../../lib/interactif/qcm'
  import { verifQuestionListeDeroulante } from '../../../lib/interactif/questionListeDeroulante'
  import { verifQuestionSvgSelection } from '../../../lib/interactif/questionSvgSelection/questionSvgSelection'
  import { mathaleaUpdateUrlFromExercicesParams } from '../../../lib/mathalea'
  import { canOptions } from '../../../lib/stores/canStore'
  import {
    darkMode,
    exercicesParams,
    resultsByExercice,
  } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import type { IExercice, InterfaceResultExercice } from '../../../lib/types'
  import type { CanState } from '../../../lib/types/can'
  import { context } from '../../../modules/context'
  import { statsCanTracker } from '../../../modules/stats'
  import { keyboardState } from '../../keyboard/stores/keyboardStore'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import ButtonToggleDarkMode from '../../shared/forms/ButtonToggleDarkMode.svelte'
  import CountDown from './presentationalComponents/CountDown.svelte'
  import End from './presentationalComponents/End.svelte'
  import KickOff from './presentationalComponents/KickOff.svelte'
  import Race from './presentationalComponents/Race.svelte'
  import Solutions from './presentationalComponents/Solutions.svelte'

  let state: CanState = 'canHomeScreen'
  let exercises: IExercice[] = []
  let questions: string[] = []
  let consignes: string[] = []
  let corrections: string[] = []
  let consignesCorrections: string[] = []
  let indiceExercice: number[] = []
  let indiceQuestionInExercice: number[] = []
  let resultsByQuestion: boolean[] = []
  let answers: string[] = []
  let recordedTimeFromCapytale: number
  let unavailableMessage = ''
  onMount(async () => {
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
        resultsByQuestion = assignmentDataFromCapytale.resultsByQuestion
      if (assignmentDataFromCapytale?.duration !== undefined)
        recordedTimeFromCapytale = assignmentDataFromCapytale.duration
    })
    context.isDiaporama = true
    // force le mode interactif
    globalOptions.update((gOpt) => {
      gOpt.setInteractive = '1'
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
    if ($canOptions.isInteractive) {
      $keyboardState.isVisible = true
      for (const param of exercises) {
        param.interactif = true
      }
    }
    // découpage des exerices en questions
    const splitResults = splitExercisesIntoQuestions(exercises)
    questions = splitResults.questions.filter(
      (question): question is string => typeof question === 'string',
    )
    consignes = [...splitResults.consignes]
    corrections = [...splitResults.corrections]
    consignesCorrections = [...splitResults.consignesCorrections]
    indiceExercice = [...splitResults.indiceExercice]
    indiceQuestionInExercice = [...splitResults.indiceQuestionInExercice]
    for (let i = 0; i < questions.length; i++) {
      $canOptions.questionGetAnswer.push(false)
    }
  })

  type answerType = {
    type:
      | 'mathlive'
      | 'fillInTheBlank'
      | 'dnd'
      | 'qcm'
      | 'listeDeroulante'
      | 'custom'
      | 'cliqueFigure'
      | 'svgSelection'
      | 'MetaInteractif2d'
      | 'unknown'
    index: number
    answers?: { [key: string]: string }
    answerTxt: string
  }

  function checkAnswers() {
    statsCanTracker($globalOptions.recorder ?? '', $globalOptions.v ?? '')
    const answersType: answerType[] = []
    for (let i = 0; i < questions.length; i++) {
      const exercice = exercises[indiceExercice[i]]
      const type =
        exercice.autoCorrection?.[indiceQuestionInExercice[i]]?.reponse?.param
          ?.formatInteractif ?? exercice.interactifType
      if (type === 'mathlive' || type === 'fillInTheBlank') {
        resultsByQuestion[i] = Boolean(
          verifQuestionMathLive(exercice, indiceQuestionInExercice[i])?.isOk,
        )
        // récupération de la réponse
        answersType[i] = {
          type,
          index: i,
          answers: {
            [`Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`]:
              exercice.answers![
                `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
              ],
          },
          answerTxt:
            exercice.answers![
              `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
            ],
        }
        answers[i] = answersType[i].answerTxt
      } else if (type === 'dnd') {
        resultsByQuestion[i] = verifDragAndDrop(
          exercice,
          indiceQuestionInExercice[i],
        ).isOk
        // récupération de la réponse
        answersType[i] = {
          type,
          index: i,
          answers: Object.keys(exercice.answers ?? {})
            .filter(
              (key: string) =>
                key.startsWith(
                  `rectangleDNDEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
                ) ||
                key.startsWith(
                  `texteDNDEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
                ),
            )
            .reduce((result: { [key: string]: any }, k) => {
              result[k] = exercice.answers![k]
              return result
            }, {}),
          answerTxt: Object.keys(exercice.answers ?? {})
            .filter((key: string) =>
              key.startsWith(
                `texteDNDEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
              ),
            )
            .reduce((result: string, k) => {
              result = exercice.answers![k]
              return result
            }, ''),
        }
        answers[i] = answersType[i].answerTxt
        answersType[i].answers![
          `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
        ] = answersType[i].answerTxt
      } else if (type === 'qcm') {
        resultsByQuestion[i] =
          verifQuestionQcm(exercice, indiceQuestionInExercice[i]) === 'OK'
        // récupération de la réponse
        const propositions =
          exercice.autoCorrection[indiceQuestionInExercice[i]].propositions
        const qcmAnswers: string[] = []
        propositions!.forEach((proposition, indice: number) => {
          if (
            exercice.answers![
              `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}R${indice}`
            ] === '1'
          ) {
            if (proposition.texte !== undefined) {
              qcmAnswers.push(proposition.texte)
            }
          }
        })
        answers[i] = qcmAnswers.join(' ; ')
        exercice.answers![
          `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
        ] = answers[i]
        answersType[i] = {
          type,
          index: i,
          answers: Object.keys(exercice.answers ?? {})
            .filter((key: string) =>
              key.startsWith(
                `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
              ),
            )
            .reduce((result: { [key: string]: any }, k) => {
              result[k] = exercice.answers![k]
              return result
            }, {}),
          answerTxt: answers[i],
        }
      } else if (type === 'listeDeroulante') {
        resultsByQuestion[i] =
          verifQuestionListeDeroulante(
            exercice,
            indiceQuestionInExercice[i],
          ) === 'OK'
        answers[i] =
          exercice.answers?.[
            `ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
          ] ??
          exercice.answers?.[
            `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
          ] ??
          ''
        answersType[i] = {
          type,
          index: i,
          answers: Object.keys(exercice.answers ?? {})
            .filter(
              (key: string) =>
                key.startsWith(
                  `ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
                ) ||
                key.startsWith(
                  `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
                ),
            )
            .reduce((result: { [key: string]: any }, k) => {
              result[k] = exercice.answers![k]
              return result
            }, {}),
          answerTxt: answers[i],
        }
      } else if (type === 'cliqueFigure') {
        resultsByQuestion[i] =
          verifQuestionCliqueFigure(exercice, indiceQuestionInExercice[i]) ===
          'OK'
        answers[i] = indexQuestionCliqueFigure(
          exercice,
          indiceQuestionInExercice[i],
        )
        answersType[i] = {
          type,
          index: i,
          answers: Object.keys(exercice.answers ?? {})
            .filter((key: string) =>
              key.endsWith(
                `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
              ),
            )
            .reduce((result: { [key: string]: any }, k) => {
              result[k] = exercice.answers![k]
              return result
            }, {}),
          answerTxt: answers[i],
        }
      } else if (type === 'custom') {
        // si le type est `custom` on est sûr que `correctionInteractive` existe
        // d'où le ! après `correctionInteractive`
        if (exercice instanceof MetaExercice) {
          const result = exercice.correctionInteractives[
            indiceQuestionInExercice[i]
          ](indiceQuestionInExercice[i])
          Array.isArray(result)
            ? (resultsByQuestion[i] = result.includes('OK'))
            : (resultsByQuestion[i] = result === 'OK')
        } else {
          const result = exercice.correctionInteractive!(
            indiceQuestionInExercice[i],
          )
          Array.isArray(result)
            ? (resultsByQuestion[i] = result.includes('OK'))
            : (resultsByQuestion[i] = result === 'OK')
        }
        answersType[i] = {
          type,
          index: i,
          answers: Object.keys(exercice.answers ?? {})
            .filter(
              (key: string) =>
                key.endsWith(
                  `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
                ) ||
                key.startsWith(
                  `apigeomEx${indiceExercice[i]}F${indiceQuestionInExercice[i]}`,
                ),
            )
            .reduce((result: { [key: string]: any }, k) => {
              result[k] = exercice.answers![k]
              return result
            }, {}),
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
      } else if (type === 'svgSelection') {
        resultsByQuestion[i] = Boolean(
          verifQuestionSvgSelection(exercice, indiceQuestionInExercice[i]) ===
          'OK',
        )
        // récupération de la réponse
        answersType[i] = {
          type,
          index: i,
          answers: {
            [`Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`]:
              exercice.answers![
                `svgSelectionEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
              ],
          },
          answerTxt:
            exercice.answers![
              `svgSelectionEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
            ],
        }
        answers[i] = answersType[i].answerTxt
      } else if (type === 'MetaInteractif2d') {
        resultsByQuestion[i] = Boolean(
          verifQuestionMetaInteractif2d(exercice, indiceQuestionInExercice[i])
            .isOk,
        )
        // récupération de la réponse
        answersType[i] = {
          type,
          index: i,
          answers: {
            [`Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`]:
              exercice.answers![
                `MetaInteractif2dEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
              ],
          },
          answerTxt:
            exercice.answers![
              `MetaInteractif2dEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`
            ],
        }
        answers[i] = answersType[i].answerTxt
      } else {
        answersType[i] = {
          type: 'unknown',
          index: i,
          answers: Object.keys(exercice.answers ?? {})
            .filter((key: string) =>
              key.endsWith(
                `Ex${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
              ),
            )
            .reduce((result: { [key: string]: any }, k) => {
              result[k] = exercice.answers![k]
              return result
            }, {}),
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
          resultsByQuestion,
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
      recordedTimeFromCapytale ||
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

<div
  class="{$darkMode.isActive
    ? 'dark'
    : ''} relative w-full h-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
>
  {#if state === 'start' || state === 'canHomeScreen'}
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
  <div class="fixed flex bottom-2 right-2">
    <ButtonToggleDarkMode />
  </div>
</div>
