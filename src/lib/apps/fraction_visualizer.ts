import { context } from '../../modules/context'
import FractionVisualizerWrapperElement, {
  type FractionVisualizerWrapperOptions,
} from '../customElements/FractionVisualizerWrapperElement'

export type ShapeName = 'square' | 'disk' | 'rectangle' | 'bar' | 'segment'
export type BorderMode = 'none' | 'filled' | 'all' | 'cursor'

type FractionVisualizerOptions = FractionVisualizerWrapperOptions

/**
 * Retourne le code HTML pour afficher un fraction-visualizer interactif
 * @param options - options pour personnaliser le composant
 * @param options.shape - forme de la fraction ('square', 'disk', 'rectangle', 'bar', 'segment')
 * @param options.filled - nombre de parties remplies
 * @param options.total - nombre total de parties par unité
 * @param options.showFilledSlider - afficher le curseur pour ajuster les parties remplies
 * @param options.sliderMaxInput - valeur maximale pour les curseurs
 * @param options.borderMode - mode des bordures ('none', 'filled', 'all', 'cursor')
 * @param options.showPartNumbers - afficher les numéros des parties
 * @param options.showLabels - afficher les abscisses
 * @param options.labelStart - valeur de départ des abscisses
 * @param options.labelValues - abscisses à afficher
 * @param options.borderCount - nombre de bordures à afficher
 * @returns le code HTML du fraction-visualizer interactif
 * @author Guillaume Valmont
 */
export function fractionVisualizer(
  options?: FractionVisualizerOptions,
): string {
  if (!context.isHtml) {
    return '' // La sortie LaTeX n'est pas encore gérée
  }
  return `<div class="block">${FractionVisualizerWrapperElement.create(options)}</div>`
}
