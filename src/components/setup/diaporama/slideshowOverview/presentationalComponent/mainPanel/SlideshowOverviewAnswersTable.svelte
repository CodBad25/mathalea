<script lang="ts">
  import { tick } from 'svelte'
  import { mathaleaRenderDiv } from '../../../../../../lib/mathalea'
  import ZoomButtons from '../../../../start/presentationalComponents/header/headerButtons/setupButtons/ZoomButtons.svelte'
  import {
    calculeNombreDeColonnes,
    formuleReponseCourte,
    repartisEnColonnes,
  } from '../../../answersTable'
  import type { Slide } from '../../../types'

  const ZOOM_MIN = 0.2
  // Police plus grande par défaut : pensé pour être lisible projeté en classe.
  const ZOOM_PAR_DEFAUT = 1.6

  export let slides: Slide[]
  export let order: number[]
  export let nbVues: number
  export let revealedAnswersCount: number

  let zoom = ZOOM_PAR_DEFAUT
  let largeurConteneur = 0
  let tableauConteneur: HTMLElement

  $: vuesIndexes = [...Array(nbVues).keys()]
  $: nombreDeColonnes = calculeNombreDeColonnes(largeurConteneur, order.length)
  $: colonnes = repartisEnColonnes(order, nombreDeColonnes)

  // Le nombre de colonnes peut changer après le montage (largeurConteneur
  // n'est connu qu'après le premier rendu, puis évolue avec la fenêtre), ce
  // qui régénère le HTML brut des réponses (`{@html}`) : il faut donc relancer
  // KaTeX à chaque changement de `colonnes`, pas seulement à l'affichage.
  // Idem quand une réponse est révélée par le pas à pas : son `{@html}` vient
  // d'apparaître dans le DOM et n'a jamais été traité par KaTeX.
  $: if (colonnes.length > 0 && revealedAnswersCount >= 0) {
    tick().then(() => mathaleaRenderDiv(tableauConteneur, -1))
  }

  function zoomUpdate(plusMinus: '+' | '-') {
    const newZoom = Number(
      (plusMinus === '+' ? zoom + 0.1 : zoom - 0.1).toFixed(1),
    )
    zoom = Math.max(newZoom, ZOOM_MIN)
  }
</script>

<div
  class="fixed z-20 rounded-b-full rounded-t-full
  bottom-2 lg:bottom-6
  right-2 lg:right-6
  bg-coopmaths-canvas/80 dark:bg-coopmathsdark-canvas/80"
>
  <div
    class="flex flex-col space-y-2
    scale-75 lg:scale-100"
  >
    <ZoomButtons {zoomUpdate} />
  </div>
</div>

<div class="flex flex-col w-full min-w-0" style="font-size: {zoom}rem">
  <div
    class="p-6 pb-2 text-4xl font-black
    text-coopmaths-struct dark:text-coopmathsdark-struct"
  >
    Tableau des réponses
  </div>
  <div
    class="mt-2 mx-2 lg:mx-6 overflow-x-auto"
    bind:clientWidth={largeurConteneur}
    bind:this={tableauConteneur}
  >
    <div
      class="grid divide-x
      divide-coopmaths-canvas-darkest dark:divide-coopmathsdark-canvas-darkest"
      style="grid-template-columns: repeat({colonnes.length}, minmax(0, 1fr)); column-gap: 2.5rem;"
    >
      {#each colonnes as colonne (colonne.indexDeDepart)}
        <table
          class="border-collapse text-left
          text-coopmaths-corpus dark:text-coopmathsdark-corpus"
        >
          <thead>
            <tr
              class="border-b-2
              border-coopmaths-struct dark:border-coopmathsdark-struct
              text-coopmaths-struct dark:text-coopmathsdark-struct"
            >
              <th class="px-4 py-3 font-black">N°</th>
              {#each vuesIndexes as vueIndex (vueIndex)}
                <th class="px-4 py-3 font-black">
                  {nbVues > 1 ? `Série ${vueIndex + 1}` : 'Réponse'}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each colonne.lignes as slideIndex, indexLocal (slides[slideIndex].vues[0].key + '-' + slideIndex)}
              {@const numeroQuestion = colonne.indexDeDepart + indexLocal}
              <tr
                class="border-b
                border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
              >
                <td
                  class="px-4 py-3 align-top font-black
                  text-coopmaths-struct dark:text-coopmathsdark-struct"
                >
                  {numeroQuestion + 1}
                </td>
                {#each vuesIndexes as vueIndex (vueIndex)}
                  {@const vue = slides[slideIndex].vues[vueIndex]}
                  <td class="px-4 py-3 align-top">
                    {#if numeroQuestion >= revealedAnswersCount}
                      <span
                        class="text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
                      >
                        ···
                      </span>
                    {:else if vue === undefined || (vue.lettresQcm.length === 0 && vue.reponsesCourtes.length === 0)}
                      <span
                        class="text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
                      >
                        –
                      </span>
                    {:else}
                      <div
                        class="flex flex-row flex-wrap items-baseline gap-x-3"
                      >
                        {#each vue.lettresQcm as lettre (lettre)}
                          <span
                            class="font-black
                            text-coopmaths-action dark:text-coopmathsdark-action"
                          >
                            {lettre}
                          </span>
                        {/each}
                        {#each vue.reponsesCourtes as reponse, indexReponse (indexReponse)}
                          <span>
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                            {@html formuleReponseCourte(reponse)}
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {/each}
    </div>
  </div>
</div>
