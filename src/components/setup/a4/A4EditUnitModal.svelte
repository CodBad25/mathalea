<script lang="ts" context="module">
  /**
   * Constructeur interne (__Mathfield) de MathLive, capturé à la création du
   * premier champ. Il porte le pointeur statique _globallyFocusedMathfield
   * qui, si un champ est détruit alors que MathLive le croit encore focusé
   * (cas typique : fenêtre sans focus système, où blur() est inopérant),
   * reste accroché à une instance morte et fait planter le focus suivant.
   */
  let mathfieldConstructor: {
    _globallyFocusedMathfield?: { host?: Element | null }
  } | null = null

  /** Efface le pointeur global de MathLive s'il désigne un champ détruit */
  function clearStaleGlobalMathfield(hostBeingDestroyed?: Element) {
    try {
      const globallyFocused = mathfieldConstructor?._globallyFocusedMathfield
      if (
        globallyFocused != null &&
        (globallyFocused.host == null ||
          globallyFocused.host === hostBeingDestroyed ||
          !globallyFocused.host.isConnected)
      ) {
        mathfieldConstructor!._globallyFocusedMathfield = undefined
      }
    } catch {
      // API interne : le nettoyage est du meilleur effort
    }
  }
</script>

<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { renderKatex } from '../../../lib/mathalea'
  import { markBlankLines } from './blankLines'

  /** Source de l'unité : HTML avec les formules en `$...$` */
  export let source: string
  /** Vrai si l'unité affiche déjà un énoncé personnalisé (bouton restaurer) */
  export let isCustom: boolean
  /** Titre de la modale */
  export let title: string = "Modifier l'énoncé"
  /** Libellé du bouton de suppression (null : pas de suppression possible) */
  export let deleteLabel: string | null = null
  /** Hauteur (en multiple de la taille de police) des lignes vides d'une question */
  export let blankLineHeight: number = 0
  export let onSave: (source: string) => void
  export let onRestore: () => void
  export let onDelete: () => void
  export let onClose: () => void

  type Segment = { type: 'text' | 'math'; value: string }

  /** Tags de structure (tableau, liste, image...) que le découpage par
   * segments ne sait pas traverser sans casser le HTML : dans ce cas on
   * bascule sur une édition HTML brute, non segmentée par formule. */
  const structuralTagsRegex = /<(table|ul|ol|img|figure|svg)[\s>]/i
  let isStructural = structuralTagsRegex.test(source)

  let rawHtml = source
  let segments: Segment[] = isStructural ? [] : parseSegments(source)
  /** Incrémenté quand la structure (nombre/ordre des segments) change,
   * pour recréer les champs sans perturber la saisie de texte courante */
  let structureVersion = 0
  let isReady = false
  let editorEl: HTMLDivElement
  let previewEl: HTMLDivElement
  let previewTimer: ReturnType<typeof setTimeout>
  /** Mode code : texte brut modifiable directement (formules en `$...$`,
   * balises HTML telles quelles), en alternative aux champs MathLive */
  let codeMode = false
  let codeText = source

  onMount(async () => {
    // Enregistre l'élément <math-field> (no-op si déjà chargé)
    await import('mathlive')
    isReady = true
    await tick()
    updatePreview()
  })

  /** Découpe la source en alternance texte / formule (`$...$`) */
  function parseSegments(text: string): Segment[] {
    const result: Segment[] = []
    const regex = /\$([^$]*)\$/g
    let lastIndex = 0
    let match
    while ((match = regex.exec(text)) !== null) {
      result.push({
        type: 'text',
        value: normalizeWhitespace(text.slice(lastIndex, match.index)),
      })
      result.push({ type: 'math', value: match[1] })
      lastIndex = match.index + match[0].length
    }
    result.push({ type: 'text', value: normalizeWhitespace(text.slice(lastIndex)) })
    return result
  }

  /**
   * Aplatit les espaces/retours à la ligne d'indentation de la source générée
   * (non significatifs en HTML normal) en un espace unique : sans ça, le
   * `white-space: pre-wrap` de `.a4-edit-text` (nécessaire pour respecter les
   * espaces tapés par l'utilisateur) les affiche tels quels et l'énoncé
   * semble éclaté dans tous les sens.
   */
  function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ')
  }

  function assemble(): string {
    if (isStructural) return rawHtml
    return segments
      .map((segment) =>
        segment.type === 'math'
          ? segment.value.trim().length > 0
            ? `$${segment.value}$`
            : ''
          : segment.value,
      )
      .join('')
  }

  /** Source actuellement affichée, quel que soit le mode d'édition */
  function currentSource(): string {
    return codeMode ? codeText : assemble()
  }

  /** Ré-analyse un texte brut (sortie du mode code) en segments ou HTML brut */
  function applySource(newSource: string) {
    isStructural = structuralTagsRegex.test(newSource)
    if (isStructural) {
      rawHtml = newSource
    } else {
      segments = parseSegments(newSource)
    }
    structureVersion++
  }

  function toggleCodeMode() {
    if (codeMode) {
      applySource(codeText)
    } else {
      codeText = assemble()
    }
    codeMode = !codeMode
    updatePreview()
  }

  function onCodeInput() {
    updatePreview()
  }

  /** Initialise le bloc HTML brut (mode structurel) sans le rendre réactif */
  function initRawHtml(node: HTMLElement, value: string) {
    node.innerHTML = value
    return {
      update() {
        // volontairement vide
      },
    }
  }

  function onRawHtmlInput(event: Event) {
    rawHtml = (event.currentTarget as HTMLElement).innerHTML
    updatePreview()
  }

  function updatePreview() {
    clearTimeout(previewTimer)
    previewTimer = setTimeout(() => {
      if (previewEl == null) return
      previewEl.innerHTML = currentSource()
      markBlankLines(previewEl, blankLineHeight)
      try {
        renderKatex(previewEl)
      } catch {
        // formule incomplète pendant la saisie : l'aperçu suivant corrigera
      }
    }, 150)
  }

  /** Initialise un segment de texte éditable sans le rendre réactif
   * (le contenu appartient à l'utilisateur pendant la saisie) */
  function initTextSegment(node: HTMLElement, value: string) {
    node.innerHTML = value
    return {
      update() {
        // volontairement vide
      },
    }
  }

  function onTextInput(index: number, event: Event) {
    segments[index].value = (event.currentTarget as HTMLElement).innerHTML
    updatePreview()
  }

  /**
   * Sur Backspace juste après une ligne vide (deux <br> consécutifs),
   * supprime la ligne vide entière en un seul appui plutôt qu'un <br> à la
   * fois : sans ça, une ligne vide sans aucun texte est difficile à cibler
   * précisément pour la supprimer d'un span à l'autre.
   */
  function collapseBlankLineOnBackspace(event: KeyboardEvent) {
    if (event.key !== 'Backspace') return
    const selection = window.getSelection()
    if (selection == null || !selection.isCollapsed || selection.rangeCount === 0)
      return
    const { startContainer, startOffset } = selection.getRangeAt(0)
    const nodeBefore =
      startContainer.nodeType === Node.TEXT_NODE
        ? startOffset === 0
          ? startContainer.previousSibling
          : null
        : startOffset > 0
          ? startContainer.childNodes[startOffset - 1]
          : null
    if (!(nodeBefore instanceof HTMLElement) || nodeBefore.tagName !== 'BR')
      return
    const secondBr = nodeBefore.previousSibling
    if (!(secondBr instanceof HTMLElement) || secondBr.tagName !== 'BR') return
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    nodeBefore.remove()
    secondBr.remove()
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }

  /** Crée un champ MathLive dans le span porteur */
  function mathField(node: HTMLElement, params: { index: number }) {
    const field = document.createElement('math-field') as HTMLElement & {
      value: string
      getValue?: (format: string) => string
    }
    field.setAttribute('math-virtual-keyboard-policy', 'auto')
    field.value = segments[params.index].value
    field.addEventListener('input', () => {
      segments[params.index].value =
        field.getValue?.('latex') ?? field.value ?? ''
      updatePreview()
    })
    node.appendChild(field)
    // Capture du constructeur interne puis nettoyage d'un éventuel pointeur
    // resté accroché à un champ détruit par une session d'édition précédente
    try {
      const inner = (
        field as unknown as {
          _mathfield?: { constructor: typeof mathfieldConstructor }
        }
      )._mathfield
      if (inner?.constructor != null) {
        mathfieldConstructor = inner.constructor
      }
    } catch {
      // API interne : sans conséquence
    }
    clearStaleGlobalMathfield()
    return {
      destroy() {
        // Un math-field détruit avec le focus laisse une référence morte
        // dans MathLive (plantage au focus suivant) : on le blur d'abord,
        // puis on efface le pointeur global s'il désigne encore ce champ.
        try {
          field.blur()
        } catch {
          // sans conséquence : le champ est détruit
        }
        clearStaleGlobalMathfield(field)
        field.remove()
      },
    }
  }

  function fragmentToHtml(fragment: DocumentFragment): string {
    const div = document.createElement('div')
    div.appendChild(fragment)
    return div.innerHTML
  }

  /**
   * Retire le focus des champs MathLive tant qu'ils sont encore connectés.
   * Indispensable avant de les détruire (fermeture, reconstruction) : un
   * math-field retiré du DOM avec le focus laisse un pointeur global mort
   * dans MathLive qui fait planter le focus suivant. Comme blur() est
   * parfois inopérant sur un champ, on force un focusout natif en donnant
   * brièvement le focus à un input temporaire (équivalent d'un clic ailleurs).
   */
  function blurMathFields() {
    try {
      const sink = document.createElement('input')
      sink.style.cssText = 'position:fixed;top:0;left:0;opacity:0;'
      document.body.appendChild(sink)
      sink.focus({ preventScroll: true })
      sink.remove()
    } catch {
      // le nettoyage du focus est du meilleur effort
    }
  }

  function closeWith(
    type: 'close' | 'restore' | 'save' | 'delete',
    detail?: { source: string },
  ) {
    blurMathFields()
    if (type === 'save') onSave(detail!.source)
    else if (type === 'restore') onRestore()
    else if (type === 'delete') onDelete()
    else onClose()
  }

  /** Insère une formule vide au niveau du curseur (ou en fin d'énoncé) */
  async function insertFormula() {
    let splitIndex = -1
    let before = ''
    let after = ''
    const selection = window.getSelection()
    if (selection != null && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container =
        range.startContainer instanceof Element
          ? range.startContainer
          : range.startContainer.parentElement
      const span = container?.closest<HTMLElement>('[data-seg]')
      if (span != null && editorEl.contains(span)) {
        splitIndex = Number(span.dataset.seg)
        const preRange = document.createRange()
        preRange.selectNodeContents(span)
        preRange.setEnd(range.startContainer, range.startOffset)
        before = fragmentToHtml(preRange.cloneContents())
        const postRange = document.createRange()
        postRange.selectNodeContents(span)
        postRange.setStart(range.endContainer, range.endOffset)
        after = fragmentToHtml(postRange.cloneContents())
      }
    }
    blurMathFields()
    let newFieldIndex: number
    if (splitIndex >= 0 && segments[splitIndex]?.type === 'text') {
      segments = [
        ...segments.slice(0, splitIndex),
        { type: 'text', value: before },
        { type: 'math', value: '' },
        { type: 'text', value: after },
        ...segments.slice(splitIndex + 1),
      ]
      newFieldIndex = splitIndex + 1
    } else {
      segments = [
        ...segments,
        { type: 'math', value: '' },
        { type: 'text', value: '' },
      ]
      newFieldIndex = segments.length - 2
    }
    structureVersion++
    updatePreview()
    await tick()
    try {
      editorEl
        ?.querySelector<HTMLElement>(`[data-seg="${newFieldIndex}"] math-field`)
        ?.focus()
    } catch {
      // le focus est un confort : ne pas casser l'édition s'il échoue
    }
  }

  /** Supprime la formule d'indice index et fusionne les textes adjacents */
  function removeFormula(index: number) {
    blurMathFields()
    const before = segments[index - 1]
    const afterSegment = segments[index + 1]
    const merged: Segment = {
      type: 'text',
      value: (before?.value ?? '') + (afterSegment?.value ?? ''),
    }
    segments = [
      ...segments.slice(0, Math.max(0, index - 1)),
      merged,
      ...segments.slice(index + 2),
    ]
    structureVersion++
    updatePreview()
  }

  function save() {
    closeWith('save', { source: currentSource() })
  }

  /** Place le curseur au point (x, y), y compris dans un span non-éditable
   * (ex: séparateur d'un champ math), en API standard ou WebKit */
  function caretPositionAt(
    x: number,
    y: number,
  ): { node: Node; offset: number } | null {
    const doc = document as Document & {
      caretPositionFromPoint?: (
        x: number,
        y: number,
      ) => { offsetNode: Node; offset: number } | null
      caretRangeFromPoint?: (x: number, y: number) => Range | null
    }
    const pos = doc.caretPositionFromPoint?.(x, y)
    if (pos != null) return { node: pos.offsetNode, offset: pos.offset }
    const range = doc.caretRangeFromPoint?.(x, y)
    if (range != null)
      return { node: range.startContainer, offset: range.startOffset }
    return null
  }

  /** Focus le segment de texte le plus proche verticalement du clic, curseur
   * placé en fin de segment */
  function focusNearestTextSegment(clientY: number) {
    const textSpans = Array.from(
      editorEl.querySelectorAll<HTMLElement>('.a4-edit-text'),
    )
    if (textSpans.length === 0) return
    let target = textSpans[textSpans.length - 1]
    for (const span of textSpans) {
      if (clientY < span.getBoundingClientRect().top) {
        target = span
        break
      }
    }
    target.focus()
    const selection = window.getSelection()
    if (selection == null) return
    const range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  /** Le rectangle orange n'est éditable que via les spans texte qu'il
   * contient : un clic dans l'espace vide autour (marges, fin de ligne,
   * sous un texte court...) tombe sur ce conteneur sans rien focus. On
   * redirige alors le focus vers le segment de texte le plus proche du
   * point cliqué. */
  function focusEditorArea(event: MouseEvent) {
    if (event.target !== editorEl) return
    const position = caretPositionAt(event.clientX, event.clientY)
    const container =
      position != null
        ? position.node instanceof Element
          ? position.node
          : position.node.parentElement
        : null
    const span = container?.closest<HTMLElement>('.a4-edit-text')
    if (span != null && editorEl.contains(span)) {
      span.focus()
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStart(position!.node, position!.offset)
      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)
      return
    }
    focusNearestTextSegment(event.clientY)
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
<div
  class="a4-print-hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  on:click|self={() => closeWith('close')}
>
  <div
    class="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus"
  >
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
    >
      <h3
        class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        {title}
      </h3>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
          title={codeMode
            ? "Revenir à l'édition assistée"
            : 'Modifier le code source (LaTeX et balises HTML)'}
          on:click={toggleCodeMode}
        >
          <i class="bx {codeMode ? 'bx-edit-alt' : 'bx-code-alt'}"></i>
          {codeMode ? 'Mode assisté' : 'Mode code'}
        </button>
        <button
          type="button"
          aria-label="Fermer"
          on:click={() => closeWith('close')}
        >
          <i
            class="bx bx-x text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
          ></i>
        </button>
      </div>
    </div>

    {#if isReady}
      <div class="overflow-y-auto px-4 py-3 space-y-4">
        {#if codeMode}
          <p class="text-xs opacity-70">
            Mode code&nbsp;: le texte brut est modifiable directement (formules
            en <code>$...$</code>, balises HTML comme <code>&lt;br&gt;</code>
            visibles telles quelles).
          </p>
          <textarea
            class="a4-edit-code w-full rounded border border-coopmaths-action/40 bg-white text-black p-3"
            rows="10"
            spellcheck="false"
            aria-label="Code source de l'énoncé"
            bind:value={codeText}
            on:input={onCodeInput}
          ></textarea>
        {:else if isStructural}
          <p class="text-xs opacity-70">
            Ce contenu comporte un tableau, une liste ou une image : il
            s'édite directement en HTML ci-dessous (les formules restent au
            format <code>$...$</code>).
          </p>
          <div
            class="a4-edit-flow rounded border border-coopmaths-action/40 bg-white text-black p-3"
            contenteditable="true"
            role="textbox"
            tabindex="0"
            aria-label="Contenu de l'énoncé"
            spellcheck="false"
            use:initRawHtml={rawHtml}
            on:input={onRawHtmlInput}
            on:keydown={collapseBlankLineOnBackspace}
          ></div>
        {:else}
          <p class="text-xs opacity-70">
            Modifiez le texte directement ; les formules s'éditent dans les
            champs mathématiques. Placez le curseur dans le texte puis «&nbsp;Insérer
            une formule&nbsp;» pour en ajouter une.
          </p>
          {#key structureVersion}
            <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
            <div
              bind:this={editorEl}
              class="a4-edit-flow rounded border border-coopmaths-action/40 bg-white text-black p-3"
              on:click={focusEditorArea}
            >
              {#each segments as segment, index}
                {#if segment.type === 'text'}
                  <span
                    class="a4-edit-text"
                    data-seg={index}
                    contenteditable="true"
                    role="textbox"
                    tabindex="0"
                    aria-label="Texte de l'énoncé"
                    spellcheck="false"
                    use:initTextSegment={segment.value}
                    on:input={(event) => onTextInput(index, event)}
                    on:keydown={collapseBlankLineOnBackspace}
                  ></span>
                {:else}
                  <span class="a4-edit-math" data-seg={index}>
                    <span use:mathField={{ index }}></span>
                    <button
                      type="button"
                      class="a4-edit-math-remove"
                      title="Supprimer la formule"
                      aria-label="Supprimer la formule"
                      on:click={() => removeFormula(index)}
                    >
                      <i class="bx bx-x"></i>
                    </button>
                  </span>
                {/if}
              {/each}
            </div>
          {/key}
          <button
            type="button"
            class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
            on:click={insertFormula}
          >
            <i class="bx bx-math"></i>
            Insérer une formule
          </button>
        {/if}

        <div>
          <div
            class="text-xs font-semibold uppercase opacity-60 mb-1 text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            Aperçu
          </div>
          <div
            bind:this={previewEl}
            class="a4-edit-preview rounded border border-dashed border-coopmaths-action/40 bg-white text-black p-3"
          ></div>
        </div>
      </div>

      <div
        class="flex items-center justify-between gap-4 px-4 py-3 border-t border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
      >
        <div>
          {#if isCustom}
            <button
              type="button"
              class="flex items-center gap-1 text-sm text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
              on:click={() => closeWith('restore')}
            >
              <i class="bx bx-reset"></i>
              Restaurer l'énoncé d'origine
            </button>
          {/if}
          {#if deleteLabel != null}
            <button
              type="button"
              class="flex items-center gap-1 text-sm text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
              on:click={() => closeWith('delete')}
            >
              <i class="bx bx-trash"></i>
              {deleteLabel}
            </button>
          {/if}
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-1.5 rounded text-sm text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark"
            on:click={() => closeWith('close')}
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded text-sm font-semibold text-white bg-coopmaths-action hover:bg-coopmaths-action-lightest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-lightest"
            on:click={save}
          >
            Valider
          </button>
        </div>
      </div>
    {:else}
      <div class="flex justify-center items-center py-16">
        <i class="bx bx-loader-alt bx-spin text-3xl"></i>
      </div>
    {/if}
  </div>
</div>

<style>
  .a4-edit-flow {
    line-height: 2;
    min-height: 3em;
  }
  .a4-edit-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.85em;
    line-height: 1.5;
    resize: vertical;
  }
  .a4-edit-text {
    display: inline-block;
    outline: none;
    white-space: pre-wrap;
  }
  .a4-edit-text:empty {
    /* un span vide est inline et ne peut donc pas être visible ni
       cliquable sans largeur/hauteur propres : sans ça, il n'y a rien
       à voir ni où faire apparaître le curseur clignotant */
    min-width: 1.5em;
    min-height: 1.2em;
  }
  .a4-edit-text:focus {
    background: #eef4fb;
    border-radius: 2px;
  }
  .a4-edit-math {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    margin: 0 2px;
    vertical-align: middle;
  }
  .a4-edit-math :global(math-field) {
    min-width: 3em;
    font-size: 1.1em;
    border: 1px solid #b9d4f1;
    border-radius: 4px;
    padding: 0 2px;
  }
  .a4-edit-math-remove {
    display: inline-flex;
    align-items: center;
    color: #b0b0b0;
    font-size: 14px;
  }
  .a4-edit-math-remove:hover {
    color: #d33;
  }
</style>
