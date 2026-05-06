import loadjs from 'loadjs'
import { MathfieldElement } from 'mathlive'
import { get } from 'svelte/store'
import { keyboardState } from '../components/keyboard/stores/keyboardStore'
import { getKeyboardShortcusts } from '../lib/interactif/claviers/keyboard'
import { isMathfieldFocused } from '../lib/interactif/mathfieldFocus'
import { globalOptions } from '../lib/stores/globalOptions'
import { context } from './context'
import { UserFriendlyError } from './messages'
/**
 * Nos applis prédéterminées avec la liste des fichiers à charger
 * @type {Object}
 */
const apps = {
  scratchblocks: 'assets/externalJs/scratchblocks-v3.5-min',
  slick: [
    '/assets/externalJs/semantic-ui/semantic.min.css',
    '/assets/externalJs/semantic-ui/semantic.min',
    '/assets/externalJs/semantic-ui/components/state.min',
  ],
}

let hasGlobalTabTracker = false
let lastTabDirection = null
let lastTabTimestamp = 0

function handleGlobalTabKeydown(event) {
  if (event.key !== 'Tab') return
  lastTabDirection = event.shiftKey ? 'backward' : 'forward'
  lastTabTimestamp = Date.now()
}

function consumeRecentTabDirection() {
  if (lastTabDirection == null) return null
  if (Date.now() - lastTabTimestamp > 250) {
    lastTabDirection = null
    return null
  }
  const direction = lastTabDirection
  lastTabDirection = null
  return direction
}

function ensureGlobalTabTracker() {
  if (hasGlobalTabTracker) return
  document.addEventListener('keydown', handleGlobalTabKeydown, true)
  hasGlobalTabTracker = true
}

/**
 * Charge une appli listée dans apps (pour mutualiser l'appel de loadjs)
 * @private
 * @param {string} name
 * @return {Promise<undefined, Error>} promesse de chargement
 */
async function load(name) {
  // on est dans une fct async, si l'une de ces deux lignes plantent ça va retourner une promesse rejetée avec l'erreur
  if (!apps[name]) throw UserFriendlyError(`application ${name} inconnue`)
  // cf https://github.com/muicss/loadjs
  try {
    if (!loadjs.isDefined(name)) {
      await loadjs(apps[name], name, { returnPromise: true })
    }
  } catch (error) {
    console.error(error)
    throw new UserFriendlyError(`Le chargement de ${name} a échoué`)
  }
  // loadjs.ready veut une callback, on emballe ça dans une promesse
  return new Promise((resolve, reject) => {
    loadjs.ready(name, {
      success: resolve,
      // si le chargement précédent a réussi on voit pas trop comment on pourrait arriver là, mais ça reste plus prudent de gérer l'erreur éventuelle
      error: () =>
        reject(new UserFriendlyError(`Le chargement de ${name} a échoué`)),
    })
  })
}

/**
 * Charge prism
 * @return {Promise<undefined>}
 */
export function loadPrism() {
  return load('prism')
}

/**
 * Charge scratchblocks
 * @return {Promise} qui peut échouer…
 */
export function loadScratchblocks() {
  return load('scratchblocks')
}

export function injectStyleForCells(mf) {
  if (!mf.classList.contains('tableauMathlive')) return
  const shadow = mf.shadowRoot
  const container = shadow.querySelector('.ML__container')
  if (container) {
    const span = container.parentElement
    span.style.display = 'flex'
    span.style.flexDirection = 'row'
  }
  if (shadow && !shadow.getElementById('ml-cell-style')) {
    const style = document.createElement('style')
    style.id = 'ml-cell-style'
    style.textContent = `
      .ML__container {
        display: inline-block;
        width: 100%;
        justify-content: center !important;
      }
      .ML__content {
        justify-content: center !important;
        padding: 0;
      }
    `
    shadow.appendChild(style)
  }
}

export function injectFontInMetaInteractif2d(mf) {
  if (!mf.classList.contains('metaInteractif2d')) return
  const shadow = mf.shadowRoot
  if (shadow && !shadow.getElementById('prompt-for-2d')) {
    // Crée une balise style
    const style = document.createElement('style')
    style.id = 'prompt-for-2d'
    style.textContent = `
        .ML__text {
          font-family: 'KaTeX_Main', serif !important;
        }
          .ML__content {
          "justify-content": center !important;
          padding: 0;
          }
          .ML__latex {
          line-height: 0.9em !important;
          }
        .ML__prompt-atom {
    line-height: 0.9 !important;
     vertical-align: 0.1em !important;
    }
      .ML__prompt:not(.ML__lockedPromptBox) {
    min-height: 0.9em !important;
   
    }
      `
    shadow.appendChild(style)
  }
}

function injectPromptStyles(mf) {
  if (!mf.classList.contains('fillInTheBlanks')) {
    if (mf.classList.contains('tableauMathlive')) {
      injectStyleForCells(mf)
    }
    return
  }
  const shadow = mf.shadowRoot
  if (shadow && !shadow.getElementById('ml-prompt-styles')) {
    const style = document.createElement('style')
    style.id = 'ml-prompt-styles'
    style.textContent = `
    .ML__prompt:not(.ML__lockedPromptBox):not(.ML__focusedPromptBox) {
    min-height: 0.9em !important;
     outline: solid !important;
  outline-width: thin !important;
  outline-color: var(--color-coopmathsdark-corpus-light) !important;
    }
    :host(:focus-within) .ML__prompt:not(.ML__lockedPromptBox).ML__focusedPromptBox {
      outline: solid !important;
  outline-width: 2px !important;
  outline-color: var(--color-coopmaths-struct) !important;
    min-height: 0.9em !important;
    }
    :host(:not(:focus-within)) .ML__prompt:not(.ML__lockedPromptBox).ML__focusedPromptBox {
      outline: solid !important;
      outline-width: thin !important;
      outline-color: var(--color-coopmathsdark-corpus-light) !important;
    }
    
    .ML__prompt-atom {
    line-height: 0.9 !important;
     vertical-align: -0.1em !important;
    }
    `
    shadow.appendChild(style)
  }
}

/**
 * Charge MathLive et personnalise les réglages
 * MathLive est chargé dès qu'un tag math-field est créé
 */
export async function loadMathLive(divExercice) {
  await import('mathlive')
  ensureGlobalTabTracker()
  let champs
  if (divExercice) {
    champs = divExercice.getElementsByTagName('math-field')
  } else {
    champs = document.getElementsByTagName('math-field')
  }
  if (champs != null) {
    for (const mf of champs) {
      if (mf instanceof MathfieldElement) {
        if (
          mf.classList.contains('fillInTheBlanks') ||
          mf.classList.contains('metaInteractif2d')
        ) {
          mf.classList.remove('invisible')
        }
        //   mf.classList.add('ml-1')
        mf.addEventListener('focus', handleFocusMathField)
        mf.addEventListener('focusout', handleFocusOutMathField)
        mf.addEventListener('input', () => {
          const content = mf.getValue()
          // Remplace les espaces consécutifs par un seul espace
          const filteredContent = content.replaceAll('\\,\\,', '\\,')
          mf.setValue(filteredContent)
        })
        if (mf.getAttribute('data-space') === 'true') {
          mf.mathModeSpace = '\\,'
        }

        if (mf.isConnected) {
          // mf is already in the DOM. You can check if it's ready by accessing a property.
          setMathfield(mf)
        } else {
          // Add a listener for the `mount` event in case it's not mounted yet.
          mf.addEventListener('mount', setMathfield, { once: true })
        }
      }
    }
    // On envoie la hauteur de l'iFrame après le chargement des champs MathLive
    if (context.vue === 'exMoodle') {
      const hauteurExercice =
        window.document.querySelector('section').scrollHeight
      window.parent.postMessage(
        {
          hauteurExercice,
          iMoodle: parseInt(
            new URLSearchParams(window.location.search).get('iMoodle'),
          ),
        },
        '*',
      )
      const domExerciceInteractifReady = new window.Event(
        'domExerciceInteractifReady',
        { bubbles: true },
      )
      document.dispatchEvent(domExerciceInteractifReady)
    }
  }
}

function handleFocusMathField(event) {
  const mf = event.target
  const isFillInTheBlanks =
    mf.classList.contains('fillInTheBlanks') ||
    mf.classList.contains('metaInteractif2d')

  if (mf.classList.contains('fillInTheBlanks')) {
    const tabDirection = consumeRecentTabDirection()
    if (tabDirection != null) {
      // En entrée par TAB dans un nouveau mathfield, on force un prompt cohérent
      // pour éviter la reprise sur un ancien prompt mémorisé par le navigateur.
      setTimeout(() => {
        if (!mf.matches(':focus-within')) return
        if (tabDirection === 'backward') {
          mf.executeCommand('moveToMathfieldEnd')
          mf.executeCommand('moveToPreviousPlaceholder')
        } else {
          mf.executeCommand('moveToMathfieldStart')
          mf.executeCommand('moveToNextPlaceholder')
        }
      }, 0)
    }
  }

  const isNotFillInTheBlanksAndReadOnly = !isFillInTheBlanks && mf.readOnly
  const isCorrected =
    isNotFillInTheBlanksAndReadOnly || mf.classList.contains('corrected')
  getKeyboardShortcusts(mf)
  keyboardState.update((value) => {
    return {
      isVisible: true && !isCorrected, // Les fiilInTheBlanks sont toujours readOnly
      isInLine: value.isInLine,
      idMathField: event.target.id,
      alphanumericLayout: value.alphanumericLayout,
      blocks:
        'keyboard' in mf.dataset
          ? mf.dataset.keyboard.split(' ')
          : ['numbers', 'fullOperations', 'variables'],
    }
  })
}

function handleFocusOutMathField(event) {
  // Si le focus est sur un autre élément que mathfield, on cache le clavier
  // On utilise setTimeout pour être sûr que le focus soit bien sur le nouvel élément
  // car au focusout, le focus est sur body
  if (get(globalOptions).v === 'can') return
  setTimeout(() => {
    if (!isMathfieldFocused(document.activeElement)) {
      keyboardState.update((value) => {
        const newValue = value
        newValue.isVisible = false
        return newValue
      })
    }
  }, 200)
}

function setMathfield(mf) {
  if ('mathVirtualKeyboardPolicy' in mf) mf.mathVirtualKeyboardPolicy = 'manual'
  if ('menuItems' in mf) mf.menuItems = []
  if ('virtualKeyboardMode' in mf) mf.virtualKeyboardMode = 'manual'
  injectFontInMetaInteractif2d(mf)
  injectPromptStyles(mf)
  mf.removeEventListener('mount', setMathfield)
}
