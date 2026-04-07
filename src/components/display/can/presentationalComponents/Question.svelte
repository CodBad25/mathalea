<script lang="ts">
  import type { MathfieldElement } from 'mathlive'
  import { afterUpdate, onDestroy, onMount } from 'svelte'
  import { setSizeWithinSvgContainer } from '../../../../lib/components/sizeTools'
  import {
    questionCliqueFigure,
    type FigureClicable,
  } from '../../../../lib/interactif/cliqueFigure'
  import { mathaleaRenderDiv } from '../../../../lib/mathalea'
  import { canOptions } from '../../../../lib/stores/canStore'
  import { loadMathLive } from '../../../../modules/loaders'
  import { keyboardState } from '../../../keyboard/stores/keyboardStore'
  export let question: string
  export let consigne: string
  export let correction: string
  export let consigneCorrection: string
  export let mode: 'display' | 'correction' = 'display'
  export let visible: boolean
  export let index: number
  export let nextQuestion: () => void

  let questionContainer: HTMLDivElement

  onDestroy(() => {
    const mf = questionContainer?.querySelector(
      'math-field',
    ) as MathfieldElement
    if (mf) {
      mf.removeEventListener('keyup', handleKeyUp)
      mf.removeEventListener('input', handleMathfieldElement)
    }
  })
  onMount(() => {
    const questionContent = document.getElementById(
      `question-content-${index}`,
    ) as HTMLDivElement
    if (questionContent) {
      mathaleaRenderDiv(questionContent)
      setSizeWithinSvgContainer(questionContent)
    }
    loadMathLive()
  })

  afterUpdate(() => {
    if (visible) {
      updateInteractivity()
      const questionContent = document.getElementById(
        `question-content-${index}`,
      ) as HTMLDivElement
      setSizeWithinSvgContainer(questionContent)
    }
  })

  function handleKeyUp(e: KeyboardEvent) {
    /* MGu obliger de mettre l'event quand on relache la touche, car sinon events multiples pour la même touche */
    if (e.key === 'Enter') {
      nextQuestion()
    }
  }

  function handleMathfieldElement(this: HTMLElement, ev: Event) {
    /* ca peut venir du clavier vituel ou du clavier physique */
    if ((this as MathfieldElement).value !== '') {
      if ($canOptions.questionGetAnswer[index] !== true) {
        $canOptions.questionGetAnswer[index] = true
      }
    } else {
      if ($canOptions.questionGetAnswer[index] !== false) {
        $canOptions.questionGetAnswer[index] = false
      }
    }
  }

  function handleMultiMathfieldElement(ev: Event) {
    const mf = ev.currentTarget
    if ((mf as MathfieldElement).value !== '') {
      if ($canOptions.questionGetAnswer[index] !== true) {
        $canOptions.questionGetAnswer[index] = true
      }
    } else {
      if ($canOptions.questionGetAnswer[index] !== false) {
        $canOptions.questionGetAnswer[index] = false
      }
    }
  }

  function updateInteractivity() {
    if (questionContainer) {
      const multiMf = questionContainer.querySelector('multi-mathfield')
      // gestion des MultiMathfield
      if (multiMf != null) {
        const shadowRoot = multiMf.shadowRoot
        if (shadowRoot) {
          const mathfields = Array.from(
            shadowRoot.querySelectorAll('math-field'),
          ) as MathfieldElement[]
          for (const mf of mathfields) {
            if (!mf.dataset.listenerAdded) {
              mf.dataset.listenerAdded = 'true' // Marquer comme ajouté
              //   mf.addEventListener('keyup', handleKeyUp) => Ne pas pas passer à la question suivante avec enter, il y a plusieurs champs
              mf.addEventListener('input', handleMultiMathfieldElement)
            }
            $keyboardState.idMathField = mf.id
          }
          window.setTimeout(() => {
            // Ne focus le premier mathfield que si aucun n'a le focus dans le shadowRoot
            const hasFocus =
              shadowRoot.activeElement &&
              mathfields.includes(shadowRoot.activeElement as MathfieldElement)
            if (!hasFocus) {
              const mf = mathfields[0]
              if (mf) mf.focus()
            }
          }, 0)
        }
        return
      }

      const metaI2d = questionContainer.querySelectorAll('.metaInteractif2d')
      // gestion des metaInteractif2d
      if (metaI2d != null && metaI2d.length > 0) {
        console.info('Je gère le metaInteractif2d')
        const listeMf = Array.from(metaI2d) as MathfieldElement[]
        for (const mf of listeMf) {
          if (!mf.dataset.listenerAdded) {
            mf.dataset.listenerAdded = 'true' // Marquer comme ajouté
            mf.addEventListener('input', handleMathfieldElement)
          }
          $keyboardState.idMathField = mf.id
          window.setTimeout(() => {
            const hasFocus =
              document.activeElement &&
              listeMf.includes(document.activeElement as MathfieldElement)
            if (!hasFocus) {
              const mf = listeMf[0]
              if (mf) mf.focus()
            }
          }, 0)
        }
        return
      }

      const mf = questionContainer?.querySelector(
        'math-field',
      ) as MathfieldElement
      if (mf) {
        if (!mf.dataset.listenerAdded) {
          mf.dataset.listenerAdded = 'true' // Marquer comme ajouté
          mf.addEventListener('keyup', handleKeyUp)
          mf.addEventListener('input', handleMathfieldElement)
        }
        $keyboardState.idMathField = mf.id
        window.setTimeout(() => {
          mf.focus()
        }, 0)
        return
      }

      const figureCliquables = Array.from(
        questionContainer?.querySelectorAll<FigureClicable>(
          '[id^="cliquefigure"]',
        ),
      ) as FigureClicable[]
      if (figureCliquables.length > 0) {
        $keyboardState.isVisible = false
        for (const figureCliquable of figureCliquables) {
          questionCliqueFigure(figureCliquable as FigureClicable)
          if (!figureCliquable.dataset.listenerAdded) {
            figureCliquable.dataset.listenerAdded = 'true' // Marquer comme ajouté
            figureCliquable.addEventListener('click', () => {
              const val = Array.from(figureCliquables).reduce((acc, b) => {
                if ((b as any).etat) {
                  acc = true
                }
                return acc
              }, false)
              // au moins une figure cochée
              if ($canOptions.questionGetAnswer[index] !== val) {
                $canOptions.questionGetAnswer[index] = val
              }
            })
          }
        }
        return
      }

      const clocks =
        questionContainer?.querySelectorAll<HTMLInputElement>('[id^="clockEx"]')
      if (clocks.length > 0) {
        $keyboardState.isVisible = false
        if (!clocks[0].dataset.listenerAdded) {
          clocks[0].dataset.listenerAdded = 'true' // Marquer comme ajouté
          clocks[0].addEventListener('click', () => {
            if ($canOptions.questionGetAnswer[index] !== true) {
              $canOptions.questionGetAnswer[index] = true
            }
          })
        }
        return
      }

      const qcm = questionContainer?.querySelectorAll<HTMLInputElement>(
        'input[id^="checkEx"]',
      )
      if (qcm.length > 0) {
        $keyboardState.isVisible = false
        for (const box of qcm) {
          if (!box.dataset.listenerAdded) {
            box.dataset.listenerAdded = 'true' // Marquer comme ajouté
            box.addEventListener('click', () => {
              const val = Array.from(qcm).reduce((acc, b) => {
                if (b.checked) {
                  acc = true
                }
                return acc
              }, false)
              // au moins 1 coché
              if ($canOptions.questionGetAnswer[index] !== val) {
                $canOptions.questionGetAnswer[index] = val
              }
            })
          }
        }
        return
      }

      const apigeoms =
        questionContainer?.querySelectorAll<HTMLElement>('[id^="apigeom"]')
      if (apigeoms.length > 0) {
        $keyboardState.isVisible = false
        if (!apigeoms[0].dataset.listenerAdded) {
          apigeoms[0].dataset.listenerAdded = 'true' // Marquer comme ajouté

          function handleApigeomClick(this: HTMLElement, ev: Event) {
            // MGu: il faudrait faire mieux mais bon...
            // Un click sur la figure ne fonctionne pas car dans apigeom, il ne se propage pas...
            // donc on surveille mouseleave ou touchend est suffisant pour valider la question
            if ($canOptions.questionGetAnswer[index] !== true) {
              $canOptions.questionGetAnswer[index] = true
            }
          }
          apigeoms[0]
            .querySelector('#divFigure > svg')
            ?.addEventListener('pointerleave', handleApigeomClick)
        }
        return
      }

      const selects =
        questionContainer?.querySelectorAll<HTMLSelectElement>(
          'select[id^="ex"]',
        )
      if (selects.length > 0) {
        $keyboardState.isVisible = false
        for (const select of selects) {
          if (!select.dataset.listenerAdded) {
            select.dataset.listenerAdded = 'true' // Marquer comme ajouté
            select.addEventListener('change', function () {
              if (select.selectedIndex > 0) {
                if ($canOptions.questionGetAnswer[index] !== true) {
                  $canOptions.questionGetAnswer[index] = true
                }
              } else {
                if ($canOptions.questionGetAnswer[index] !== false) {
                  $canOptions.questionGetAnswer[index] = false
                }
              }
            })
          }
        }
        return
      }

      const rectangles = questionContainer?.querySelectorAll<HTMLInputElement>(
        '[id^="rectangle"].rectangleDND',
      )
      if (rectangles.length > 0) {
        $keyboardState.isVisible = false
        for (const rectangle of rectangles) {
          if (!rectangle.dataset.listenerAdded) {
            rectangle.dataset.listenerAdded = 'true' // Marquer comme ajouté
            const onHoverEnd = function () {
              const divCount = rectangle.querySelectorAll(':scope > div').length
              if (divCount > 0) {
                if ($canOptions.questionGetAnswer[index] !== true) {
                  $canOptions.questionGetAnswer[index] = true
                }
              } else {
                if ($canOptions.questionGetAnswer[index] !== false) {
                  $canOptions.questionGetAnswer[index] = false
                }
              }
            }
            rectangle.addEventListener('mouseleave', onHoverEnd)
            rectangle.addEventListener('touchend', onHoverEnd)
          }
        }
        return
      }
    }
  }
</script>

<div
  id="question-content-{index}"
  class={visible
    ? 'px-4 md:px-20 lg:px-32 flex flex-col justify-center items-center font-normal leading-relaxed h-[100%]  w-[100%] text-center'
    : 'hidden'}
  bind:this={questionContainer}
>
  {#if mode === 'display' || mode === 'correction'}
    <div
      style="padding:15px;"
      class="flex flex-col overflow-x-auto overflow-y-auto"
    >
      <div class="text-pretty">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html consigne}
      </div>
      <div class="text-pretty" style="">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html question}
      </div>
    </div>
  {/if}

  {#if mode === 'correction'}
    <div
      class="relative flex p-4 mt-10 bg-coopmaths-warn-200 dark:bg-coopmathsdark-warn-lightest text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <div class="text-pretty">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html consigneCorrection}
      </div>
      <div class="text-pretty">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html correction}
      </div>
      <div
        class="flex absolute top-8 -left-12 font-bold text-xl text-coopmaths-warn-1000 dark:text-coopmathsdark-warn-dark -rotate-90"
      >
        Solution
      </div>
    </div>
  {/if}
</div>
