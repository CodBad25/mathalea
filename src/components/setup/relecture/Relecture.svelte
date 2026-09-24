<script lang="ts">
  import referentiel from '../../../json/referentiel2022FR.json'
  import {
    buildRelectureUrls,
    collectExercicesARelire,
    filterExercices,
    sortByDate,
    VUES_DE_RELECTURE,
    type ExerciceARelire,
    type LienDeRelecture,
  } from '../../../lib/components/relecture'
  import { darkMode } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import Footer from '../../Footer.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'

  const PAR_PAGE = 20

  const exercices = collectExercicesARelire(referentiel)
  const nouveaux = sortByDate(exercices, 'datePublication')
  const modifies = sortByDate(exercices, 'dateModification')

  let recherche = ''
  let pageNouveaux = 0
  let pageModifies = 0

  $: nouveauxFiltres = filterExercices(nouveaux, recherche)
  $: modifiesFiltres = filterExercices(modifies, recherche)
  // une nouvelle recherche ramène les deux colonnes à leur première page
  $: (recherche, (pageNouveaux = 0), (pageModifies = 0))

  $: colonnes = [
    {
      titre: 'Nouveaux exercices',
      dateKey: 'datePublication' as const,
      liste: nouveauxFiltres,
      page: pageNouveaux,
      setPage: (page: number) => (pageNouveaux = page),
    },
    {
      titre: 'Exercices mis à jour',
      dateKey: 'dateModification' as const,
      liste: modifiesFiltres,
      page: pageModifies,
      setPage: (page: number) => (pageModifies = page),
    },
  ]

  function nbPages(liste: ExerciceARelire[]): number {
    return Math.max(1, Math.ceil(liste.length / PAR_PAGE))
  }

  /**
   * Liens que le navigateur a refusé d'ouvrir, par uuid d'exercice.
   * Safari n'ouvre qu'une fenêtre par clic (sauf si les fenêtres surgissantes
   * sont autorisées pour le site) : on propose alors les liens restants.
   */
  let liensBloques: Record<string, LienDeRelecture[]> = {}

  function ouvrirVues(exercice: ExerciceARelire) {
    const baseUrl = window.location.origin + window.location.pathname
    const bloques: LienDeRelecture[] = []
    for (const lien of buildRelectureUrls(exercice, baseUrl)) {
      // pas de `noopener` : window.open renverrait toujours null et on ne
      // pourrait pas savoir si l'onglet a été bloqué
      const onglet = window.open(lien.url, '_blank')
      if (onglet == null) bloques.push(lien)
      else onglet.opener = null
    }
    liensBloques = { ...liensBloques, [exercice.uuid]: bloques }
  }

  function lienOuvert(exercice: ExerciceARelire, lien: LienDeRelecture) {
    liensBloques = {
      ...liensBloques,
      [exercice.uuid]: (liensBloques[exercice.uuid] ?? []).filter(
        (l) => l !== lien,
      ),
    }
  }
</script>

<main
  class="min-h-screen flex flex-col bg-coopmaths-canvas dark:bg-coopmathsdark-canvas {$darkMode.isActive
    ? 'dark'
    : ''}"
>
  <NavBar
    subtitle="Relecture"
    subtitleType="design"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />

  <section
    class="flex-1 px-4 py-4 md:py-6 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
  >
    <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-6">
      <label class="flex flex-row items-center gap-2 w-full md:w-1/2">
        <i class="bx bx-search text-2xl" aria-hidden="true"></i>
        <input
          type="search"
          bind:value={recherche}
          placeholder="Rechercher par référence, titre ou uuid"
          aria-label="Rechercher un exercice"
          class="w-full rounded-md border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest
                 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-coopmaths-action dark:focus:ring-coopmathsdark-action"
        />
      </label>
      <p
        class="text-sm text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
      >
        Le bouton <i class="bx bx-window-open" aria-hidden="true"></i> ouvre
        l'exercice dans {VUES_DE_RELECTURE.length} onglets. Il faut autoriser les
        fenêtres surgissantes (pop-up) pour ce site.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {#each colonnes as colonne (colonne.dateKey)}
        {@const debut = colonne.page * PAR_PAGE}
        {@const pages = nbPages(colonne.liste)}
        <div class="flex flex-col">
          <h2
            class="text-2xl font-bold mb-3 text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            {colonne.titre}
            <span class="text-base font-normal">({colonne.liste.length})</span>
          </h2>
          {#if colonne.liste.length === 0}
            <p class="italic">Aucun exercice ne correspond à la recherche.</p>
          {:else}
            <ul class="flex flex-col gap-1">
              {#each colonne.liste.slice(debut, debut + PAR_PAGE) as exercice (exercice.uuid)}
                <li
                  class="flex flex-row items-center gap-2 rounded-md px-2 py-1
                         bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
                >
                  <span class="text-xs font-mono shrink-0 w-20">
                    {exercice[colonne.dateKey]}
                  </span>
                  <span class="text-sm">
                    <span class="font-bold">{exercice.id}</span> - {exercice.titre}
                  </span>
                  <button
                    type="button"
                    class="ml-auto shrink-0 tooltip tooltip-left tooltip-neutral
                           text-coopmaths-action hover:text-coopmaths-action-lightest
                           dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
                    data-tip="Ouvrir les vues de relecture"
                    aria-label="Ouvrir les vues de relecture de {exercice.id}"
                    on:click={() => ouvrirVues(exercice)}
                  >
                    <i class="bx bx-window-open text-2xl"></i>
                  </button>
                </li>
                {#if (liensBloques[exercice.uuid] ?? []).length > 0}
                  <li
                    class="rounded-md px-2 py-2 text-sm
                           bg-coopmaths-warn-100 dark:bg-coopmathsdark-warn-dark"
                  >
                    <p class="mb-1">
                      Le navigateur a bloqué l'ouverture de certains onglets.
                      Cliquer sur chaque vue ou autoriser les fenêtres
                      surgissantes pour ce site (sous Safari : Réglages &gt;
                      Sites web &gt; Fenêtres surgissantes).
                    </p>
                    <ul class="flex flex-row flex-wrap gap-x-4 gap-y-1">
                      {#each liensBloques[exercice.uuid] as lien (lien.url)}
                        <li>
                          <a
                            href={lien.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="underline text-coopmaths-action hover:text-coopmaths-action-lightest
                                   dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
                            on:click={() => lienOuvert(exercice, lien)}
                            >{lien.label}</a
                          >
                        </li>
                      {/each}
                    </ul>
                  </li>
                {/if}
              {/each}
            </ul>
            {#if pages > 1}
              <nav
                class="flex flex-row items-center justify-center gap-4 mt-3"
                aria-label="Pagination - {colonne.titre}"
              >
                <button
                  type="button"
                  class="disabled:opacity-30 text-coopmaths-action dark:text-coopmathsdark-action"
                  disabled={colonne.page === 0}
                  aria-label="Page précédente"
                  on:click={() => colonne.setPage(colonne.page - 1)}
                >
                  <i class="bx bx-chevron-left text-3xl"></i>
                </button>
                <span class="text-sm">Page {colonne.page + 1} / {pages}</span>
                <button
                  type="button"
                  class="disabled:opacity-30 text-coopmaths-action dark:text-coopmathsdark-action"
                  disabled={colonne.page >= pages - 1}
                  aria-label="Page suivante"
                  on:click={() => colonne.setPage(colonne.page + 1)}
                >
                  <i class="bx bx-chevron-right text-3xl"></i>
                </button>
              </nav>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <Footer />
</main>
