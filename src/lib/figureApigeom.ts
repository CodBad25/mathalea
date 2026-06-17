import Figure from 'apigeom'
import { get } from 'svelte/store'
import { canOptions } from '../../src/lib/stores/canStore'
import type { IExercice } from '../lib/types'
import { context } from '../modules/context'
import { exercicesParams } from './stores/generalStore'
import { globalOptions } from './stores/globalOptions'

export function isFigureArray(figs: IExercice['figures']): figs is Figure[] {
  return Array.isArray(figs) && figs.length > 0 && figs[0] instanceof Figure
}

/**
 * - Insère une figure apigeom dans la sortie HTML de l'exercice
 *
 * - defaultAction permet de sélectionner le bouton activé par défaut (bouton qui doit être présent dans la toolbar de la figure)
 *
 * - L'id est générée automatiquement avec le numéro de l'exercice et de la question
 *
 * - Si une même question a plusieurs figures, il faut ajouter un idAddendum (par exemple 'Correction' pour la figure de correction)
 */
export default function figureApigeom({
  exercice,
  figure,
  animation = false,
  i,
  defaultAction,
  idAddendum = '',
  isDynamic,
  hasFeedback = true,
}: {
  exercice: IExercice
  figure: Figure
  animation?: boolean
  i: number
  /** identifiant supplémentaire pour identifier l'
   * si c'est la figure de la correction ou une 2e figure dans la question
   */
  idAddendum?: string
  /** Action en cours au lancement de l'exercice qui doit obligatoirement être un bouton de la toolbar */
  defaultAction?: string
  /** figure chargé en interactif et pourtant on souhaite qu'elle soit statique => isDynamic = false */
  isDynamic?: boolean
  /** la figure sera-t-elle évaluée ? */
  hasFeedback?: boolean
}): string {
  if (!context.isHtml) return ''
  // Styles par défaut
  figure.isDynamic = isDynamic !== undefined ? isDynamic : !!exercice.interactif
  figure.divButtons.style.display = figure.isDynamic ? 'grid' : 'none'
  figure.divUserMessage.style.fontSize = '1em'
  figure.divUserMessage.style.pointerEvents = 'none'
  figure.divUserMessage.style.removeProperty('color')
  figure.divUserMessage.classList.add('text-coopmaths-struct')
  if (!exercice.interactif) {
    figure.divUserMessage.style.display = 'none'
  }
  const idApigeom = `apigeomEx${exercice.numeroExercice}F${i}${idAddendum}`
  figure.id = idApigeom

  // Auto-enregistrement de la figure dans le champ dédié figuresApiGeom pour
  // qu'elle soit détruite par reinit() (cf. exportedReinit), indépendamment de
  // l'endroit où l'exercice la range par ailleurs (this.figure, variable
  // locale…). Sans cela, les figures apigeom non suivies ne sont jamais
  // détruites → fuite mémoire (listeners DOM + références circulaires).
  // NB : on n'utilise PAS exercice.figures qui est surchargé (Figure[] pour
  // apigeom OU ClickFigures[] pour cliqueFigure).
  if (!Array.isArray(exercice.figuresApiGeom)) exercice.figuresApiGeom = []
  if (!exercice.figuresApiGeom.includes(figure)) {
    exercice.figuresApiGeom.push(figure)
  }

  // Pour revoir la copie de l'élève dans Capytale
  // Attention, la clé de answers[] doit contenir apigeom, c'est pourquoi l'id est généré par cette fonction
  function idApigeomFunct(event: Event): void {
    if (!figure.options) {
      // figure effacée, donc on annule la mise à jour...
      destroy()
      return
    }
    const customEvent = event as CustomEvent
    const json = customEvent.detail
    figure.loadJson(JSON.parse(json))
    if (get(canOptions).isChoosen && get(canOptions).state === 'solutions') {
      // c'est la can et on est en mode solutions
      figure.divButtons.style.display = 'none'
      figure.divUserMessage.style.display = 'none'
    }
  }
  document.addEventListener(idApigeom, idApigeomFunct)

  let oldZoom = 1
  function updateZoom(event: Event): void {
    if (!figure.options) {
      // figure effacée, donc on annule la mise à jour...
      destroy()
      return
    }
    // console.log('ExZoom:' + idApigeom)
    const customEvent = event as CustomEvent
    const zoom = Number(customEvent.detail.zoom)
    if (oldZoom !== zoom) {
      oldZoom = zoom
      // console.log('zoom:' + idApigeom + ':' + zoom)
      if (figure != null)
        figure.zoom(zoom, {
          changeHeight: true,
          changeWidth: true,
          changeLeft: false,
          changeBottom: false,
        })
    }
  }
  document.addEventListener('zoomChanged', updateZoom)

  let retryTimeout: number | null = null
  let retryCount = 0
  const MAX_RETRY = 3
  function updateAffichage(): void {
    if (!figure.options) {
      // figure effacée, donc on annule la mise à jour...
      destroy()
      return
    }
    if (!context.isHtml) {
      return
    }

    const eles = document.querySelectorAll(`#${idApigeom}`)
    if (eles.length > 1) {
      if (retryCount < MAX_RETRY) {
        retryCount++
        // MGu ca arrive quand on duplique un exercice,
        //  le temps que l'autre soit modifié,
        // où se retrouve avec 2 éléments avec le même id dans la page
        window.notify(
          `Plusieurs éléments avec le même id ${idApigeom} dans la page.`,
          { exercice, figure, eles },
        )

        // 🔥 retry dans 300 millisecondes
        if (retryTimeout === null) {
          retryTimeout = window.setTimeout(() => {
            retryTimeout = null
            updateAffichage()
          }, 300)
        }

        return
      }
    }
    // ✅ reset si tout est OK
    retryCount = 0
    const container = document.querySelector(`#${idApigeom}`) as HTMLDivElement
    // console.log('container:' + figure.id + ':' + container)
    if (container == null) {
      return
    }

    container.innerHTML = ''
    try {
      figure.setContainer(container)
    } catch (e) {
      window.notify(
        `figureApigeom: erreur lors du setContainer de la figure ${idApigeom}`,
        {
          figure,
          container,
          exo: exercice,
          globalOptions: get(globalOptions),
          exercicesParams: get(exercicesParams),
        },
      )
      throw e
    }

    if (animation) {
      figure.divUserMessage.innerHTML = ''
      figure.restart()
      setTimeout(() => {
        figure.buttons.get('PLAY')?.click()
      }, 3000)
    }
    if (defaultAction) {
      figure.buttons.get(defaultAction)?.click()
      // MGu que la première fois
      defaultAction = ''
    }
    const zoom = Number(get(globalOptions).z)
    if (oldZoom !== zoom) {
      oldZoom = zoom
      figure.zoom(zoom, {
        changeHeight: true,
        changeWidth: true,
        changeLeft: false,
        changeBottom: false,
      })
    }
  }
  document.addEventListener('exercicesAffiches', updateAffichage)

  // --------------------------
  // CLEANUP
  // --------------------------

  let destroyed = false
  const destroy = () => {
    if (destroyed) return
    destroyed = true
    document.removeEventListener(idApigeom, idApigeomFunct)
    document.removeEventListener('zoomChanged', updateZoom)
    document.removeEventListener('exercicesAffiches', updateAffichage)
  }

  // On surcharge la méthode clearHtml de la figure pour faire le cleanup des listeners
  const originalDestroy = figure.destroy?.bind(figure)

  figure.destroy = () => {
    destroy()
    // Appeler Apigeom original pour purger ce qu’il doit purger
    if (figure.options && originalDestroy) {
      originalDestroy()
    }
  }

  if (hasFeedback) {
    return `<div class="m-6 leading-none" id="${idApigeom}"></div><span id="resultatCheckEx${exercice.numeroExercice}Q${i}"></span><div class="ml-2 py-2 text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest" id="feedbackEx${exercice.numeroExercice}Q${i}"></div>`
  }
  return `<div class="m-6 leading-none" id="${idApigeom}"></div>`
}
