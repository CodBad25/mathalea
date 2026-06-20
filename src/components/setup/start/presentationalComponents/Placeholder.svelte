<script lang="ts">
  import { getLang } from '../../../../lib/stores/languagesStore'
  import Footer from '../../../Footer.svelte'
  import Carousel from './carousel/Carousel.svelte'
  import QuickLinks from './QuickLinks.svelte'

  export let text: string
  const lang = getLang()
</script>

<div class="relative flex-1 h-full">
  <div
    class="flex flex-col justify-between h-full text-coopmaths-corpus dark:text-coopmathsdark-corpus md:px-10 py-6"
  >
    <!-- <div class="bg-coopmaths-canvas">
      <span class="text-coopmaths-canvas">&nbsp;</span>  <- Décommenter si pas d'Advertising
    </div> -->
    <!-- <Advertising /> -->
    {#if lang === 'fr-FR'}
      <div class="hidden md:flex md:flex-col md:h-full gap-3">
        <QuickLinks />
        <div class="flex-1 min-h-0">
          <Carousel />
        </div>
      </div>
    {/if}
    <div
      class="animate-pulse flex flex-col md:flex-row justify-start space-x-6 items-center {lang !==
      'fr-FR'
        ? 'mt-32 md:mt-40'
        : 'md:hidden'}"
    >
      <div class="mt-[10px]">
        <div class="hidden md:inline-flex">
          <i class="bx bx-chevron-left text-[50px]"></i>
        </div>
        <div class="inline-flex md:hidden">
          <i class="bx bx-chevron-up text-[50px]"></i>
        </div>
      </div>
      <div class="font-extralight text-[50px]">
        {text}
      </div>
    </div>
    <div class="invisible sm:visible flex items-center justify-center">
      <Footer />
    </div>
  </div>
</div>
