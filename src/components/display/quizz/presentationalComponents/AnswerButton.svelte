<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { quizzRenderDiv } from '../quizzRender'

  export let index: number
  export let html: string
  export let state: 'idle' | 'selected' | 'correct' | 'incorrect' | 'dimmed' =
    'idle'
  export let disabled: boolean = false
  export let onSelect: (index: number) => void = () => {}

  const labels = ['A', 'B', 'C', 'D']
  // Classes statiques pour que Tailwind les détecte à l'analyse du source
  const colorClasses = ['bg-quizz-1', 'bg-quizz-2', 'bg-quizz-3', 'bg-quizz-4']

  let container: HTMLDivElement
  onMount(async () => {
    await tick()
    quizzRenderDiv(container)
  })
</script>

<button
  type="button"
  {disabled}
  class="relative flex items-center gap-[0.6em] w-full rounded-2xl px-[1em] py-[0.55em]
  text-left text-white font-semibold quizz-text-answer
  {colorClasses[index] ?? colorClasses[0]}
  transition duration-150
  {disabled ? 'cursor-default' : 'cursor-pointer hover:brightness-110'}
  {state === 'selected' ? 'ring-4 ring-white scale-[1.02]' : ''}
  {state === 'correct' ? 'ring-4 ring-coopmaths-warn' : ''}
  {state === 'incorrect' ? 'opacity-40' : ''}
  {state === 'dimmed' ? 'opacity-60' : ''}"
  on:click={() => onSelect(index)}
>
  <span
    class="shrink-0 flex items-center justify-center h-[1.7em] w-[1.7em] rounded-lg
    bg-black/25 text-white font-bold text-[0.9em]"
  >
    {labels[index] ?? index + 1}
  </span>
  <div bind:this={container} class="grow drop-shadow-md">
    {@html html}
  </div>
  {#if state === 'correct'}
    <i
      class="bx bx-check shrink-0 text-[1.5em] text-white"
      aria-label="Bonne réponse"
    ></i>
  {:else if state === 'incorrect'}
    <i
      class="bx bx-x shrink-0 text-[1.5em] text-white"
      aria-label="Mauvaise réponse"
    ></i>
  {:else if state === 'selected'}
    <i class="bx bx-check-circle shrink-0 text-[1.2em] text-white"></i>
  {/if}
</button>
