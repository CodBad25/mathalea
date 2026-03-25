<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { millisecondToMinSec } from '../../../../lib/components/time'
  import ElapsedTime from './ElapsedTime.svelte'

  export let durationInMilliSeconds
  const dispatch = createEventDispatcher()

  let elapsed = 0
  const duration = durationInMilliSeconds // 1min
  let displayedTime = ''
  let widthFactor = 1
  export const terminateTimer = (): void => {
    if (frame) cancelAnimationFrame(frame)
    frame = undefined
    dispatch('message', {
      state: 'endTimer',
      elapsed,
      duration,
    })
  }
  let lastTime = window.performance.now()
  let frame: number | undefined
  ;(function update() {
    const time = window.performance.now()
    elapsed += time - lastTime

    if (elapsed > duration) {
      terminateTimer()
    } else {
      frame = requestAnimationFrame(update)
      const timeD = millisecondToMinSec(duration - elapsed)
      const formattedtime = [
        timeD.minutes.toString().padStart(2, '0'),
        timeD.seconds.toString().padStart(2, '0'),
      ].join(':')

      displayedTime = formattedtime
      widthFactor = (duration - elapsed) / duration
      lastTime = time
    }
  })()

  onDestroy(() => {
    if (frame) cancelAnimationFrame(frame)
    frame = undefined
  })
</script>

<ElapsedTime {widthFactor} {displayedTime} />
