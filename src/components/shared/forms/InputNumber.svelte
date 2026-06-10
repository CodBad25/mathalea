<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  export let id: string
  export let min: number = 1
  export let max: number = 100
  export let value: number | undefined | null = undefined
  export let isDisabled: boolean = false
  export let darkBackground: boolean = false
  export let step: number = 1

  const dispatch = createEventDispatcher()

  // Display value: empty string when undefined/null, otherwise the number
  $: displayValue = value === undefined || value === null ? '' : value

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    const rawValue = target.value

    if (rawValue === '') {
      value = undefined
      dispatch('change', undefined)
    } else {
      let numValue = Number(rawValue)
      // Clamp to min/max
      if (numValue < min) numValue = min
      if (numValue > max) numValue = max
      value = numValue
      dispatch('change', value)
    }
  }

  function decrement() {
    if (value === undefined || value === null) {
      // If empty, set to max value when decrementing
      value = max
    } else if (value - step >= min) {
      value = value - step
    }
    dispatch('change', value)
  }

  function increment() {
    if (value === undefined || value === null) {
      // If empty, set to min value when incrementing
      value = min
    } else if (value + step <= max) {
      value = value + step
    }
    dispatch('change', value)
  }
</script>

<span class="inline-flex items-center w-full">
  <input
    type="number"
    {id}
    {min}
    {max}
    {step}
    value={displayValue}
    on:input={handleInput}
    class="{$$props.class} w-full h-10 pr-0
      {darkBackground
      ? 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark'
      : 'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas'}
      text-coopmaths-corpus-lightest dark:text-coopmathsdark-corpus-dark
      border border-r-0
      border-coopmaths-action dark:border-coopmathsdark-action
      focus:outline-0 focus:ring-0
      focus:border-coopmaths-action-lightest dark:focus:border-coopmathsdark-action-lightest
      disabled:opacity-30"
    disabled={isDisabled}
  />
  <span class="inline-flex flex-col">
    <button
      type="button"
      class="w-6 h-5 flex items-center justify-center
      {darkBackground
        ? 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark'
        : 'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas'}
        border border-b-0
        border-coopmaths-action dark:border-coopmathsdark-action
        text-coopmaths-action dark:text-coopmathsdark-action
        hover:bg-coopmaths-action hover:text-coopmaths-canvas
        dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas
        disabled:opacity-30 text-sm"
      disabled={isDisabled ||
        (value !== undefined && value !== null && value >= max)}
      on:click={increment}
      aria-label="Augmenter"
    >
      <i class="bx bx-chevron-up"></i>
    </button>
    <button
      type="button"
      class="w-6 h-5 flex items-center justify-center
      {darkBackground
        ? 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark'
        : 'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas'}
        border
        border-coopmaths-action dark:border-coopmathsdark-action
        text-coopmaths-action dark:text-coopmathsdark-action
        hover:bg-coopmaths-action hover:text-coopmaths-canvas
        dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas
        disabled:opacity-30 text-sm"
      disabled={isDisabled ||
        (value !== undefined && value !== null && value <= min)}
      on:click={decrement}
      aria-label="Diminuer"
    >
      <i class="bx bx-chevron-down"></i>
    </button>
  </span>
</span>

<style>
  /* Cacher les flèches natives */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    display: none;
  }
  input[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
</style>
