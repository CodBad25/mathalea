import { context } from '../../modules/context'
import GlisseNombreWrapperElement, {
  type GlisseNombreWrapperOptions,
} from '../customElements/GlisseNombreWrapperElement'

type GlisseNombreInteractifOptions = GlisseNombreWrapperOptions

/**
 * Retourne le code HTML pour afficher un glisse-nombre interactif
 * @param options - options pour personnaliser le glisse-nombre
 * @param options.number - le nombre à afficher (par défaut 0)
 * @param options.addZeros - pour afficher les zéros automatiquement (par défaut à true)
 * @param options.animation - pour désactiver le déplacement manuel et animer une multiplication (par défaut à 0)
 * @param options.showCalculus - pour afficher ✕ ou ÷ 10, 100... (par défaut à true)
 * @param options.showComma1 - pour afficher la virgule de la première ligne (par défaut à true)
 * @param options.showComma2 - pour afficher la virgule de la deuxième ligne (par défaut à true)
 * @param options.removeLeftZeros - pour ne pas afficher les zéros à gauche du premier chiffre non nul pour par exemple n'afficher que le chiffre des centièmes dans 0,01 (par défaut à false)
 * @param options.initialPower - pour choisir la colonne de départ des calculs (par défaut à 0)
 * @returns le code HTML du glisse-nombre interactif
 */
export function glisseNombreInteractif(
  options?: GlisseNombreInteractifOptions,
): string {
  if (!context.isHtml) {
    return '' // La sortie LaTeX n'est pas encore gérée
  }
  return `<div class="block">${GlisseNombreWrapperElement.create(options)}</div>`
}
