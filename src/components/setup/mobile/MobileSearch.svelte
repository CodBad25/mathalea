<script lang="ts">
  import { stringToCriterion } from '../../../lib/components/filters'
  import {
    sortArrayOfResourcesBasedOnProp,
    sortArrayOfResourcesBasedOnYearAndMonth,
  } from '../../../lib/components/sorting'
  import { debounce } from '../../../lib/components/time'
  import {
    isExamItemInReferentiel,
    isExerciceItemInReferentiel,
    isStaticType,
    type JSONReferentielEnding,
    type ResourceAndItsPath,
  } from '../../../lib/types/referentiels'
  import MobileEndingItem from './MobileEndingItem.svelte'

  /**
   * Recherche textuelle sur la page d'accueil de la vue mobile : mêmes
   * critères de recherche que le menu latéral de la vue bureau
   * (`SearchInput.svelte`), sans les filtres avancés (niveaux, types…).
   */
  type Props = {
    resourcesSet: ResourceAndItsPath[]
    addExercise: (ending: JSONReferentielEnding) => void
    selectedCount: (ending: JSONReferentielEnding) => number
  }

  const { resourcesSet, addExercise, selectedCount }: Props = $props()

  let inputSearch = $state('')
  let results = $state<ResourceAndItsPath[]>([])

  function getUniques(list: ResourceAndItsPath[]): ResourceAndItsPath[] {
    const uniques: ResourceAndItsPath[] = []
    const treatedUuids: string[] = []
    for (const elt of list) {
      if (!treatedUuids.includes(elt.resource.uuid)) {
        treatedUuids.push(elt.resource.uuid)
        uniques.push(elt)
      }
    }
    return uniques
  }

  function updateResults(input: string) {
    const matches = [
      ...stringToCriterion(input, true).meetCriterion(resourcesSet),
    ]
    const unsortedResults = getUniques(matches)
    let nonStatics: ResourceAndItsPath[] = []
    let statics: ResourceAndItsPath[] = []
    const others: ResourceAndItsPath[] = []
    for (const item of unsortedResults) {
      if (isExerciceItemInReferentiel(item.resource)) {
        nonStatics.push(item)
      } else if (isStaticType(item.resource)) {
        statics.push(item)
      } else {
        others.push(item)
      }
    }
    nonStatics = [...sortArrayOfResourcesBasedOnProp(nonStatics, 'id')]
    statics = [
      ...sortArrayOfResourcesBasedOnYearAndMonth(statics, 'desc'),
    ].sort((eltA, eltB) => {
      const nameA = eltA.resource.uuid.slice(0, -1)
      const nameB = eltB.resource.uuid.slice(0, -1)
      if (
        nameA.localeCompare(nameB) === 0 &&
        isExamItemInReferentiel(eltA.resource) &&
        isExamItemInReferentiel(eltB.resource)
      ) {
        return (
          parseInt(eltA.resource.numeroInitial) -
          parseInt(eltB.resource.numeroInitial)
        )
      }
      return 0
    })
    results = [...nonStatics, ...statics, ...others]
  }

  const fetchResults = debounce<typeof updateResults>(updateResults, 300)

  function onInput() {
    if (inputSearch.length === 0) {
      results = []
    } else {
      fetchResults(inputSearch)
    }
  }
</script>

<div>
  <input
    type="search"
    placeholder="🔍 Thème, identifiant..."
    bind:value={inputSearch}
    oninput={onInput}
    autocomplete="off"
    autocorrect="off"
    class="w-full rounded-lg px-3 py-2
    border border-coopmaths-action dark:border-coopmathsdark-action
    focus:border-coopmaths-action-lightest dark:focus:border-coopmathsdark-action-lightest
    focus:outline-0 focus:ring-0 focus:border-1
    bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark
    text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light text-sm
    placeholder-coopmaths-corpus-lightest dark:placeholder-coopmathsdark-corpus-lightest
    placeholder:italic placeholder-opacity-50"
  />
  {#if inputSearch.length !== 0 && results.length !== 0}
    <ul
      class="flex flex-col rounded-xl overflow-hidden mt-3
      border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest
      divide-y divide-coopmaths-canvas-darkest dark:divide-coopmathsdark-canvas-darkest"
    >
      {#each results as result (result.resource.uuid + ('id' in result.resource ? result.resource.id : ''))}
        <MobileEndingItem
          ending={result.resource}
          count={selectedCount(result.resource)}
          onclick={() => addExercise(result.resource)}
        />
      {/each}
    </ul>
  {/if}
</div>
