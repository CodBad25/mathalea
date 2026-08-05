<script lang="ts">
  import { get } from 'svelte/store'
  import {
    nodeLabel,
    resolveNode,
    splitChildren,
    typstMenuSections,
  } from '../../../../lib/components/mobileMenu'
  import { banquesExternes } from '../../../../lib/stores/banquesExternesStore'
  import { exercicesParams } from '../../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../../lib/stores/languagesStore'
  import { getReferentiels } from '../../../../lib/stores/referentielsStore'
  import type { InterfaceParams } from '../../../../lib/types'
  import {
    isExerciceItemInReferentiel,
    isTool,
    type JSONReferentielEnding,
    type ReferentielInMenu,
  } from '../../../../lib/types/referentiels'
  import MobileTile from '../../mobile/MobileTile.svelte'
  import TypstExercisePreview from './TypstExercisePreview.svelte'

  /**
   * Modale « Ajouter un exercice » de la vue Typst.
   *
   * Même navigation que la vue mobile (rubrique > niveau > thèmes >
   * sous-thèmes), enrichie de la Course aux nombres et des ressources
   * complémentaires (voir `views` dans `src/json/mobileMenu.json`). Les
   * exercices d'un thème sont tous affichés en aperçu, chacun paramétrable
   * (roue dentée) et ajoutable à la fiche sans quitter la modale.
   */
  type Props = {
    /** Ajoute une ressource à la fiche (traité par `Typst.svelte`) */
    onAdd: (params: InterfaceParams) => void
    onClose: () => void
  }

  const { onAdd, onClose }: Props = $props()

  const referentiels: ReferentielInMenu[] = $derived.by(() => {
    // dépendance explicite : les banques externes sont chargées de façon
    // asynchrone au démarrage, le menu doit se reconstruire à leur arrivée
    void $banquesExternes
    return getReferentiels(get(referentielLocale))
  })

  /** Chemin courant : [rubrique, niveau, ...clés du référentiel]. */
  let path = $state<string[]>([])
  /** Nombre d'exercices ajoutés depuis l'ouverture (retour visuel) */
  let addedCount = $state(0)

  const section = $derived(typstMenuSections.find((s) => s.id === path[0]))
  const entry = $derived(section?.entries.find((e) => e.id === path[1]))
  const node = $derived(
    entry === undefined
      ? undefined
      : resolveNode(referentiels, entry.referentiel, [
          ...entry.path,
          ...path.slice(2),
        ]),
  )
  const children = $derived(splitChildren(node))

  const title = $derived.by(() => {
    if (path.length === 0) return 'Ajouter un exercice'
    if (path.length === 1) return section?.title ?? ''
    if (path.length === 2) return entry?.title ?? ''
    return nodeLabel(path[path.length - 1])
  })

  /**
   * Compte le nombre de fois où une ressource est déjà dans la fiche. Les
   * exercices MathALÉA et les outils sont distingués par leur `id` : plusieurs
   * références peuvent partager un même `uuid`.
   */
  function selectedCount(ending: JSONReferentielEnding): number {
    return $exercicesParams.filter((item) => {
      if (item.uuid !== ending.uuid) return false
      if (isExerciceItemInReferentiel(ending) || isTool(ending)) {
        return item.id === ending.id
      }
      return true
    }).length
  }

  function navigate(newPath: string[]) {
    path = newPath
  }

  function goBack() {
    path = path.slice(0, -1)
  }

  function handleAdd(params: InterfaceParams) {
    onAdd(params)
    addedCount += 1
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose()
  }}
/>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose()
  }}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Ajouter un exercice à la fiche"
    class="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg shadow-xl
    bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
  >
    <header
      class="flex shrink-0 flex-row items-center gap-2 border-b px-4 py-3
      border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
    >
      {#if path.length > 0}
        <button
          type="button"
          aria-label="Revenir à la catégorie précédente"
          class="shrink-0 text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
          onclick={goBack}
        >
          <i class="bx bx-chevron-left"></i>
        </button>
      {/if}
      <h2
        class="min-w-0 grow truncate text-lg font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html title}
      </h2>
      <button
        type="button"
        aria-label="Fermer"
        class="shrink-0 text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
        onclick={onClose}
      >
        <i class="bx bx-x"></i>
      </button>
    </header>

    <div class="min-h-0 grow overflow-y-auto p-4">
      {#if path.length === 0}
        <!-- Rubriques -->
        <div class="flex flex-col gap-3">
          {#each typstMenuSections as menuSection (menuSection.id)}
            <MobileTile
              size="large"
              title={menuSection.title}
              subtitle={menuSection.subtitle}
              icon={menuSection.icon}
              onclick={() => navigate([menuSection.id])}
            />
          {/each}
        </div>
      {:else if path.length === 1}
        <!-- Niveaux de la rubrique choisie -->
        <div class="flex flex-col gap-3">
          {#each section?.entries ?? [] as menuEntry (menuEntry.id)}
            <MobileTile
              title={menuEntry.title}
              onclick={() => navigate([...path, menuEntry.id])}
            />
          {/each}
        </div>
      {:else}
        <!-- Thèmes, sous-thèmes puis exercices en aperçu -->
        <div class="flex flex-col gap-3">
          {#each children.categories as key (key)}
            <MobileTile
              title={nodeLabel(key)}
              onclick={() => navigate([...path, key])}
            />
          {/each}
          {#if children.endings.length !== 0}
            <ul class="flex flex-col gap-3">
              {#each children.endings as [key, ending] (key)}
                <TypstExercisePreview
                  {ending}
                  count={selectedCount(ending)}
                  onAdd={handleAdd}
                />
              {/each}
            </ul>
          {/if}
          {#if children.categories.length === 0 && children.endings.length === 0}
            <p
              class="py-8 text-center font-light text-coopmaths-corpus-lightest dark:text-coopmathsdark-corpus-lightest"
            >
              Aucun exercice dans cette rubrique pour le moment.
            </p>
          {/if}
        </div>
      {/if}
    </div>

    <footer
      class="flex shrink-0 flex-row items-center justify-between gap-3 border-t px-4 py-3
      border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
    >
      <span
        class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus"
        aria-live="polite"
      >
        {#if addedCount === 0}
          Choisissez un exercice à ajouter à la fiche.
        {:else if addedCount === 1}
          1 exercice ajouté à la fiche.
        {:else}
          {addedCount} exercices ajoutés à la fiche.
        {/if}
      </span>
      <button
        type="button"
        class="rounded-lg px-4 py-1.5 font-bold
        bg-coopmaths-action text-coopmaths-canvas hover:bg-coopmaths-action-lightest
        dark:bg-coopmathsdark-action dark:text-coopmathsdark-canvas dark:hover:bg-coopmathsdark-action-lightest"
        onclick={onClose}
      >
        Valider
      </button>
    </footer>
  </div>
</div>
