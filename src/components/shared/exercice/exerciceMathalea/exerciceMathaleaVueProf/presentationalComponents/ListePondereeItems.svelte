<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ItemPondere } from '../../../../../../lib/formulaireComplexe'
  import InputNumber from '../../../../forms/InputNumber.svelte'

  /** Items à afficher, dans l'ordre d'affichage. */
  export let items: ItemPondere[]
  /** Identifiant de la case à cocher d'un item (il doit être unique dans la page). */
  export let idItem: (item: ItemPondere) => string
  /** Poids maximal saisissable ; `0` masque les champs de poids. */
  export let poidsMax: number = 0
  /** Affiche les flèches de réordonnancement. */
  export let avecFleches: boolean = false

  const dispatch = createEventDispatcher<{
    bascule: { index: number; actif: boolean }
    poids: { index: number; poids: number }
    deplace: { index: number; sens: -1 | 1 }
  }>()
</script>

<!--
  @component
  Liste d'items à cocher, éventuellement pondérés et réordonnables. Composant
  purement présentationnel : il ne connaît ni la sérialisation des valeurs ni
  l'exercice, et remonte chaque action à son appelant
  (`FormulaireComplexe.svelte` et `SupParameterGroup.svelte`).
-->

{#each items as item, index (item.nom)}
  <div class="flex flex-row flex-wrap items-center gap-x-2 gap-y-1">
    <input
      id={idItem(item)}
      type="checkbox"
      class="w-4 h-4 rounded shrink-0 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark
        border-coopmaths-action dark:border-coopmathsdark-action cursor-pointer
        checked:bg-coopmaths-action dark:checked:bg-coopmathsdark-action
        focus:ring-3 focus:ring-coopmaths-action dark:focus:ring-coopmathsdark-action"
      checked={item.poids > 0}
      on:change={(e) =>
        dispatch('bascule', { index, actif: e.currentTarget.checked })}
    />
    <!--
      La marge laisse passer l'anneau de focus de la case (`focus:ring-3`), qui
      déborde vers le libellé et le masquait quand la case était sélectionnée.
    -->
    <label
      for={idItem(item)}
      class="ml-1 grow min-w-0 text-sm font-light leading-tight cursor-pointer
        {item.poids > 0 ? '' : 'opacity-50'}">{item.label}</label
    >
    {#if poidsMax > 0}
      <!--
        Le poids minimal saisissable est 1 : décocher la case est le seul chemin
        vers 0, sinon les boutons se désactiveraient sous le doigt.
      -->
      <span class="w-[4.5rem] shrink-0">
        <InputNumber
          id="{idItem(item)}-poids"
          min={1}
          max={poidsMax}
          value={item.poids}
          isDisabled={item.poids === 0}
          ariaLabel="Poids d'apparition de {item.label}"
          darkBackground={true}
          on:change={(e) =>
            dispatch('poids', { index, poids: Number(e.detail ?? item.poids) })}
        />
      </span>
    {/if}
    {#if avecFleches}
      <span class="inline-flex flex-col shrink-0">
        <button
          type="button"
          aria-label="Déplacer {item.label} vers le haut"
          class="w-5 h-4 flex items-center justify-center text-coopmaths-action dark:text-coopmathsdark-action disabled:opacity-20"
          disabled={index === 0}
          on:click={() => dispatch('deplace', { index, sens: -1 })}
        >
          <i class="bx bx-up-arrow-alt"></i>
        </button>
        <button
          type="button"
          aria-label="Déplacer {item.label} vers le bas"
          class="w-5 h-4 flex items-center justify-center text-coopmaths-action dark:text-coopmathsdark-action disabled:opacity-20"
          disabled={index === items.length - 1}
          on:click={() => dispatch('deplace', { index, sens: 1 })}
        >
          <i class="bx bx-down-arrow-alt"></i>
        </button>
      </span>
    {/if}
  </div>
{/each}
