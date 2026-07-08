import { get } from 'svelte/store'
import { defaultA4Options } from '../a4/types'
import { a4ParamStore } from '../../../lib/stores/generalStore'
import { globalOptions } from '../../../lib/stores/globalOptions'
import { encodeBase64 } from '../latex/LatexConfig'

/** Envoie vers la vue A4 avec autant de séries que de vues du diaporama,
 * corrigés inclus, pour que l'enseignant puisse imprimer sujets et corrigés
 * des différentes vues. */
export function goToA4WithSeries() {
  const nbVersions = get(globalOptions).nbVues ?? 1
  const encoded = encodeBase64({
    options: {
      ...defaultA4Options,
      nbVersions,
      showCorrection: true,
      mergeExercises: true,
      exerciseLabel: '',
    },
  })
  const url = new URL(window.location.href)
  url.searchParams.set('a4Param', encoded)
  history.replaceState(null, '', url)
  a4ParamStore.set(encoded)
  globalOptions.update((options) => {
    options.v = 'a4'
    return options
  })
}
