<script lang="ts">
  import type TypeExercice from '../../../../../../exercices/Exercice'
  import { mathaleaFormatExercice } from '../../../../../../lib/mathalea'

  export let exercise: TypeExercice
  export let exerciseIndex: number
  export let questionIndex: number
  export let isCorrectionVisible: boolean
</script>

<div
  style="break-inside:avoid"
  id="consigne{exerciseIndex}-{questionIndex}"
  class="container max-w-full text-justify grid grid-cols-1 auto-cols-min gap-4 mb-3 lg:mb-4"
>
  <li
    id="exercice{exerciseIndex}Q{questionIndex}"
    style="line-height: {exercise.spacing || 1}"
  >
    {#if exercise.questionRefs?.[questionIndex]}
      <span class="text-xs font-mono text-coopmaths-struct dark:text-coopmathsdark-struct mr-2">{exercise.questionRefs[questionIndex]}</span><br>
    {/if}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html mathaleaFormatExercice(exercise.listeQuestions[questionIndex])}
  </li>
  {#if isCorrectionVisible}
    <div
      class="relative self-start border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] text-coopmaths-corpus dark:text-coopmathsdark-corpus mt-6 mb-4 lg:mb-0 ml-0 lg:ml-0 py-2 pl-4 lg:pl-6"
      id="correction-exo{exerciseIndex}Q{questionIndex}"
    >
      <div
        class={exercise.consigneCorrection.length !== 0
          ? 'container max-w-full text-justify bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark px-4 py-2 mr-2 ml-6 mb-2 font-light relative w-2/3'
          : 'hidden'}
      >
        <div
          class="{exercise.consigneCorrection.length !== 0
            ? 'container max-w-full text-justify absolute top-4 -left-4'
            : 'hidden'} "
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
        class="container overflow-x-auto overflow-y-hidden md:overflow-x-auto py-1"
        style="line-height: {exercise.spacingCorr || 1}; break-inside:avoid"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html mathaleaFormatExercice(exercise.listeCorrections[questionIndex])}
      </div>
      <div
        class="absolute flex flex-row py-[1.5px] px-3 rounded-t-md justify-center items-center -left-0.75 -top-3.75 bg-coopmaths-struct dark:bg-coopmathsdark-struct font-semibold text-xs text-coopmaths-canvas dark:text-coopmathsdark-canvas"
      >
        Correction
      </div>
      <div
        class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct bottom-0 left-0 border-b-[3px] w-4"
      ></div>
    </div>
  {/if}
</div>

<style>
  li {
    break-inside: avoid;
  }
</style>
