import { MathfieldElement } from 'mathlive'
import { get } from 'svelte/store'
import { keyboardState } from '../components/keyboard/stores/keyboardStore'
import { getKeyboardShortcusts } from '../lib/interactif/claviers/keyboard'
import { isMathfieldFocused } from '../lib/interactif/mathfieldFocus'
import { globalOptions } from '../lib/stores/globalOptions'
import { context } from './context'
import { UserFriendlyError } from './messages'
const apps = {
  scratchblocks: ['assets/externalJs/scratchblocks-v3.5-min.js'],
}

const loadedApps = new Set()
const pendingApps = new Map()

function loadUrl(url) {
  return new Promise((resolve, reject) => {
    if (url.endsWith('.css')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      link.onload = resolve
      link.onerror = () => reject(new Error(`Échec du chargement : ${url}`))
      document.head.appendChild(link)
    } else {
      const script = document.createElement('script')
      script.src = url
      script.onload = resolve
      script.onerror = () => reject(new Error(`Échec du chargement : ${url}`))
      document.head.appendChild(script)
    }
  })
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

function selectFillInTheBlanksPrompt(mf, direction) {
  const prompts = mf.getPrompts?.()
  if (!Array.isArray(prompts) || prompts.length === 0) return false

  const promptId = direction === 'backward' ? prompts.at(-1) : prompts.at(0)
  if (promptId == null) return false

  const range = mf.getPromptRange?.(promptId)
  if (range == null) return false

  mf.selection = range
  return true
}

async function load(name) {
  if (!apps[name]) throw UserFriendlyError(`application ${name} inconnue`)
  if (loadedApps.has(name)) return
  if (pendingApps.has(name)) return pendingApps.get(name)
  const urls = Array.isArray(apps[name]) ? apps[name] : [apps[name]]
  const promise = Promise.all(urls.map(loadUrl))
    .then(() => {
      loadedApps.add(name)
      pendingApps.delete(name)
    })
    .catch((error) => {
      pendingApps.delete(name)
      console.error(error)
      throw new UserFriendlyError(`Le chargement de ${name} a échoué`)
    })
  pendingApps.set(name, promise)
  return promise
}

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
    min-height: 1em !important;
     outline: solid !important;
  outline-width: thin !important;
  outline-color: var(--color-coopmathsdark-corpus-light) !important;
    }
    :host(:focus-within) .ML__prompt:not(.ML__lockedPromptBox).ML__focusedPromptBox {
      outline: solid !important;
  outline-width: 2px !important;
  outline-color: var(--color-coopmaths-struct) !important;
    min-height: 1em !important;
    }
    :host(:not(:focus-within)) .ML__prompt:not(.ML__lockedPromptBox).ML__focusedPromptBox {
      outline: solid !important;
      outline-width: thin !important;
      outline-color: var(--color-coopmathsdark-corpus-light) !important;
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
        if (mf.classList.contains('fillInTheBlanks')) {
          let redirecting = false
          mf.addEventListener('selection-change', () => {
            if (redirecting || mf.classList.contains('corrected')) return
            if (mf.matches(':focus-within') && !mf.isSelectionEditable) {
              redirecting = true
              mf.executeCommand('moveToNextPlaceholder')
              requestAnimationFrame(() => {
                redirecting = false
              })
            }
          })
        }
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
    setTimeout(() => {
      if (!mf.matches(':focus-within')) return
      if (tabDirection === 'backward') {
        // En entrée par TAB dans un nouveau mathfield, on force un prompt
        // cohérent sans utiliser moveTo...Placeholder qui est relatif et peut
        // ressortir du champ si MathLive a déjà placé la sélection.
        selectFillInTheBlanksPrompt(mf, 'backward')
      } else if (tabDirection === 'forward') {
        selectFillInTheBlanksPrompt(mf, 'forward')
      }
    }, 0)
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
