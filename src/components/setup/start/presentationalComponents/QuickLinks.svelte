<script lang="ts">
  import quickLinksData from '../../../../json/quickLinks.json'

  const links = quickLinksData.links
</script>

<div class="flex flex-wrap gap-3">
    {#each links as link}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 min-w-45 flex flex-col gap-2 px-4 py-3
               bg-coopmaths-canvas dark:bg-coopmathsdark-canvas
               border-2 border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest
               rounded-lg hover:shadow-md transition-shadow duration-150 no-underline group"
      >
        <div class="w-9 h-9 rounded-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark flex items-center justify-center shrink-0">
          <i class="{link.icon} text-lg text-coopmaths-action dark:text-coopmathsdark-action" aria-hidden="true"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold text-coopmaths-struct dark:text-coopmathsdark-struct leading-tight">
            {link.title}
          </div>
          <div class="text-xs text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light leading-tight mt-0.5">
            {link.subtitle}
          </div>
        </div>
        <div class="flex items-center gap-1 text-xs font-semibold text-coopmaths-action dark:text-coopmathsdark-action group-hover:gap-2 transition-all duration-150">
          Ouvrir
          <i class="bx bx-chevron-right text-base" aria-hidden="true"></i>
        </div>
      </a>
    {/each}
</div>
