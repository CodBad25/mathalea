/**
 * Web Component pour simuler et exécuter des programmes Scratch
 * S'active automatiquement quand les éléments <scratch-simulator> sont ajoutés au DOM
 * @author Jean-Claude Lhote
 */

import { context } from '../../modules/context'
import { scratchblock } from '../../modules/scratchblock'
import { orangeMathalea } from '../colors'
import { renderScratchDiv } from '../renderScratch'
import {
  ScratchInterpreter,
  type ExecutionResult,
  type ScratchLookMessageType,
} from './ScratchInterpreter'

type CodeBlockNode = {
  element: SVGGElement
  text: string
  children: CodeBlockNode[]
}

/**
 * Web Component pour afficher et exécuter une simulation Scratch
 */
export class ScratchSimulator extends HTMLElement {
  private static readonly MAX_MAPPING_INSTRUCTIONS = 10000

  private interpreter: ScratchInterpreter | null = null
  private scratchCode: string = ''
  private modal: HTMLDialogElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private canvasWrapper: HTMLDivElement | null = null
  private stepDiv: HTMLDivElement | null = null
  private infoDiv: HTMLDivElement | null = null
  private codeDiv: HTMLDivElement | null = null
  private codeBlocks: CodeBlockNode[] = []
  private allRenderedBlocks: CodeBlockNode[] = []
  private highlightedExecutionIndex: number | null = null
  private highlightedBlockElement: SVGGElement | null = null
  private customDefinitionGroups: Set<SVGGElement> = new Set()
  private customDefinitionEntryIdBySignature: Map<string, string> = new Map()
  private customDefinitionBodyIdsBySignature: Map<string, Set<string>> =
    new Map()

  private conditionBlockElements: Set<SVGGElement> = new Set()
  private blockCacheAttempts: number = 0
  private executionIndexToBlockId: Map<number, string> = new Map() // Map: currentInstructionIndex -> id du bloc SVG
  private delayMs: number = 2000
  private debugMapping: boolean = false
  private isRunning: boolean = false
  private isPaused: boolean = false
  private isHardStopped: boolean = false
  private initialDelayMs: number = 500
  private pauseResolvers: Array<() => void> = []
  private playPauseButton: HTMLButtonElement | null = null
  private greenFlagButton: HTMLButtonElement | null = null
  private resetButton: HTMLButtonElement | null = null
  private runToEndButton: HTMLButtonElement | null = null
  private speedUpButton: HTMLButtonElement | null = null
  private slowDownButton: HTMLButtonElement | null = null
  private stopButton: HTMLButtonElement | null = null
  private simulationRunId: number = 0
  private mappingWarningMessage: string | null = null
  private handleModalKeydown = (event: KeyboardEvent): void => {
    if (!this.modal?.open || !this.interpreter || !this.isRunning) {
      return
    }

    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return
    }

    const keyActivatesButton = event.key === ' ' || event.key === 'Enter'
    if (keyActivatesButton) {
      event.preventDefault()
      event.stopPropagation()
    }

    this.logMappingDebug('event/key-dispatch', {
      key: event.key,
      code: event.code,
      keyActivatesButton,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
    })

    this.interpreter.triggerKeyPress(event.key)
  }

  static get observedAttributes(): string[] {
    return ['code', 'delay', 'debug-mapping']
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) {
      return
    }

    if (name === 'code') {
      this.scratchCode = newValue || ''
      if (this.modal?.open) {
        this.resetModalContent()
      }
      return
    }

    if (name === 'delay') {
      const parsedDelay = parseInt(newValue || '500', 10)
      if (!Number.isNaN(parsedDelay)) {
        this.initialDelayMs = parsedDelay
        this.delayMs = parsedDelay
      }
      return
    }

    if (name === 'debug-mapping') {
      this.debugMapping =
        newValue !== null && newValue !== 'false' && newValue !== '0'
    }
  }

  private logMappingDebug(
    event: string,
    payload: Record<string, unknown>,
  ): void {
    if (!this.debugMapping) {
      return
    }
    console.debug('[ScratchSimulator][mapping]', event, payload)
  }

  private logMappedInstructionsSummary(
    idsByOrder: Map<number, string>,
    orderById: Map<string, number>,
    textByOrder: Map<number, string>,
    validEventOrders: Set<number>,
  ): void {
    if (!this.debugMapping) {
      return
    }

    const sortedEntries = Array.from(
      this.executionIndexToBlockId.entries(),
    ).sort((a, b) => a[0] - b[0])
    const previewLimit = 40
    const preview = sortedEntries.slice(0, previewLimit).map(([index, id]) => {
      const order = orderById.get(id)
      const text = order !== undefined ? (textByOrder.get(order) ?? '') : ''
      const isEvent = order !== undefined ? validEventOrders.has(order) : false
      return {
        instructionIndex: index,
        blockOrder: order ?? null,
        blockId: id,
        blockText: text,
        isEventBlock: isEvent,
      }
    })

    const eventBlocks = Array.from(validEventOrders)
      .sort((a, b) => a - b)
      .map((order) => ({
        blockOrder: order,
        blockId: idsByOrder.get(order) ?? null,
        blockText: textByOrder.get(order) ?? '',
      }))

    this.logMappingDebug('build/summary', {
      totalMappedInstructions: sortedEntries.length,
      shownMappedInstructions: preview.length,
      truncated: sortedEntries.length > previewLimit,
      mappedPreview: preview,
      validEventBlocks: eventBlocks,
      firstMappedInstructionIndex:
        sortedEntries.length > 0 ? sortedEntries[0][0] : null,
    })

    this.logMappingDebug('build/summary-lite', {
      totalMappedInstructions: sortedEntries.length,
      validEventBlocks: eventBlocks.length,
      firstMappedInstructionIndex:
        sortedEntries.length > 0 ? sortedEntries[0][0] : null,
      lastMappedInstructionIndex:
        sortedEntries.length > 0
          ? sortedEntries[sortedEntries.length - 1][0]
          : null,
    })
  }

  private makePointerOnlyButton(button: HTMLButtonElement): void {
    button.tabIndex = -1
    button.addEventListener('keydown', (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
  }

  connectedCallback(): void {
    this.scratchCode = this.getAttribute('code') || ''
    this.initialDelayMs = parseInt(this.getAttribute('delay') || '500', 10)
    this.delayMs = this.initialDelayMs
    this.debugMapping =
      this.hasAttribute('debug-mapping') &&
      this.getAttribute('debug-mapping') !== 'false' &&
      this.getAttribute('debug-mapping') !== '0'
    document.addEventListener('keydown', this.handleModalKeydown, true)

    const button = document.createElement('button')
    button.textContent = '▶ Exécuter'
    button.className = 'btn btn-sm btn-primary mt-2'
    this.makePointerOnlyButton(button)
    button.addEventListener('click', () => this.openModal())

    this.appendChild(button)
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.handleModalKeydown, true)
  }

  // gestion du modal et de son contenu
  private openModal(): void {
    if (!this.modal) {
      this.createModal()
    }
    if (this.modal) {
      this.resetModalContent()
      if (this.modal.showModal) {
        this.modal.showModal()
      } else {
        this.modal.style.display = 'flex'
      }
    }
  }

  private createModal(): void {
    this.modal = document.createElement('dialog')
    this.modal.className = 'modal modal-top'

    const box = document.createElement('div')
    box.className = 'modal-box max-w-6xl mt-4 ml-4 pb-5'

    const closeButton = document.createElement('button')
    closeButton.className =
      'btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
    closeButton.textContent = '✕'
    this.makePointerOnlyButton(closeButton)
    closeButton.addEventListener('click', () => {
      if (this.modal && 'close' in this.modal) {
        ;(this.modal as any).close()
      }
    })

    const title = document.createElement('h3')
    title.className = 'font-bold text-lg mb-3'
    title.textContent = 'Simulation Scratch'

    const highlightStyle = document.createElement('style')
    highlightStyle.textContent = `
      @keyframes scratchGlowPulse {
        0% {
          filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.5))
            drop-shadow(0 0 1px rgba(250, 204, 21, 0.45));
        }
        50% {
          filter: drop-shadow(0 0 10px rgba(250, 204, 21, 1))
            drop-shadow(0 0 4px rgba(250, 204, 21, 0.95));
        }
        100% {
          filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.5))
            drop-shadow(0 0 1px rgba(250, 204, 21, 0.45));
        }
      }

      .scratch-current-block {
        animation: scratchGlowPulse ${this.delayMs / 1000}s ease-in-out 1;
        transition: filter 220ms ease-in-out;
      }
      .scratch-current-block path,
      .scratch-current-block rect,
      .scratch-current-block polygon {
        stroke: #fae015;
        stroke-width: 5;
        transition: stroke-width 220ms ease-in-out, stroke 220ms ease-in-out;
      }
    `

    // Conteneur pour canvas et code côte à côte
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'grid grid-cols-1 gap-4 mb-4 md:grid-cols-2'

    // Colonne gauche: canvas avec bouton de contrôle
    const canvasWrapper = document.createElement('div')
    this.canvasWrapper = canvasWrapper
    canvasWrapper.style.display = 'block'
    this.canvas = document.createElement('canvas')
    this.canvas.width = 400
    this.canvas.height = 400
    this.canvas.className = 'border-2 border-gray-300 bg-white w-full'
    canvasWrapper.appendChild(this.canvas)

    // Colonne droite: code + contexte
    const rightColumn = document.createElement('div')
    rightColumn.className = 'flex flex-col gap-4'

    this.codeDiv = document.createElement('div')
    this.codeDiv.className =
      'border-2 border-gray-300 bg-white p-3 overflow-y-auto max-h-60 md:max-h-96 font-mono text-sm scroll-smooth'
    this.codeDiv.id = 'code-display'

    rightColumn.appendChild(this.codeDiv)

    contentWrapper.appendChild(canvasWrapper)
    contentWrapper.appendChild(rightColumn)

    // Parser le code scratchblock complet
    this.onlyDisplayCode()
    this.stepDiv = document.createElement('div')
    this.stepDiv.className =
      'items-start text-sm text-gray-600 mb-2 ml-1 h-60 overflow-hidden'
    this.stepDiv.id = 'execution-step'
    this.stepDiv.textContent = 'Prêt à exécuter (cliquez sur ▶)'

    // Boutons de contrôle d'exécution
    this.resetButton = document.createElement('button')
    this.resetButton.className = 'btn btn-sm btn-outline'
    this.resetButton.textContent = '|<<'
    this.resetButton.title = 'Réinitialiser le programme'
    this.makePointerOnlyButton(this.resetButton)
    this.resetButton.addEventListener('click', () => this.resetProgramToStart())

    this.greenFlagButton = document.createElement('button')
    this.greenFlagButton.className = 'btn btn-sm btn-outline btn-success'
    this.greenFlagButton.textContent = '⚑'
    this.greenFlagButton.style.fontSize = '2em'
    this.greenFlagButton.style.lineHeight = '1'
    this.greenFlagButton.title = 'Déclencher le drapeau vert'
    this.makePointerOnlyButton(this.greenFlagButton)
    this.greenFlagButton.addEventListener('click', () => {
      this.logMappingDebug('event/greenflag-click', {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        hasInterpreter: Boolean(this.interpreter),
      })

      this.interpreter?.triggerGreenFlagClick()
    })

    this.runToEndButton = document.createElement('button')
    this.runToEndButton.className = 'btn btn-sm btn-outline'
    this.runToEndButton.textContent = '>>|'
    this.runToEndButton.title = "Exécuter jusqu'au bout sans délai"
    this.makePointerOnlyButton(this.runToEndButton)
    this.runToEndButton.addEventListener('click', () => this.runProgramToEnd())

    this.playPauseButton = document.createElement('button')
    this.playPauseButton.className = 'btn btn-sm btn-outline'
    this.playPauseButton.textContent = '▶'
    this.playPauseButton.title = 'Lancer ou mettre en pause'
    this.makePointerOnlyButton(this.playPauseButton)
    this.playPauseButton.addEventListener('click', () => this.togglePlayPause())

    this.speedUpButton = document.createElement('button')
    this.speedUpButton.className = 'btn btn-sm btn-outline'
    this.speedUpButton.textContent = 'x2'
    this.speedUpButton.title = 'Diviser le délai par 2'
    this.makePointerOnlyButton(this.speedUpButton)
    this.speedUpButton.addEventListener('click', () => this.speedUpExecution())

    this.slowDownButton = document.createElement('button')
    this.slowDownButton.className = 'btn btn-sm btn-outline'
    this.slowDownButton.textContent = '/2'
    this.slowDownButton.title = 'Multiplier le délai par 2'
    this.makePointerOnlyButton(this.slowDownButton)
    this.slowDownButton.addEventListener('click', () =>
      this.slowDownExecution(),
    )

    this.stopButton = document.createElement('button')
    this.stopButton.className = 'btn btn-sm btn-outline btn-error'
    this.stopButton.textContent = '■'
    this.stopButton.title = "Stopper définitivement (jusqu'à réinitialisation)"
    this.makePointerOnlyButton(this.stopButton)
    this.stopButton.addEventListener('click', () => this.hardStopExecution())

    const buttonInstructionAndInfoDiv = document.createElement('div')
    buttonInstructionAndInfoDiv.className = 'items-start gap-6 mb-4'
    this.infoDiv = document.createElement('div')
    this.infoDiv.className = 'text-sm text-gray-600 mt-2'
    this.infoDiv.id = 'execution-info'
    const controlsBarDiv = document.createElement('div')
    controlsBarDiv.className =
      'inline-flex flex-nowrap items-center gap-2 mb-2 w-fit max-w-full overflow-x-auto border border-base-300 rounded-lg bg-base-200 p-2 shadow-inner'
    controlsBarDiv.appendChild(this.resetButton)
    controlsBarDiv.appendChild(this.greenFlagButton)
    controlsBarDiv.appendChild(this.runToEndButton)
    controlsBarDiv.appendChild(this.playPauseButton)
    controlsBarDiv.appendChild(this.speedUpButton)
    controlsBarDiv.appendChild(this.slowDownButton)
    controlsBarDiv.appendChild(this.stopButton)

    buttonInstructionAndInfoDiv.appendChild(controlsBarDiv)
    buttonInstructionAndInfoDiv.appendChild(this.infoDiv)
    buttonInstructionAndInfoDiv.appendChild(this.stepDiv)

    rightColumn.appendChild(buttonInstructionAndInfoDiv)

    box.appendChild(closeButton)
    box.appendChild(title)
    box.appendChild(highlightStyle)
    box.appendChild(contentWrapper)

    this.modal.appendChild(box)
    document.body.appendChild(this.modal)

    if (this.codeDiv) {
      renderScratchDiv(this.codeDiv)
      this.cacheRenderedBlocks()
    }
  }

  // Affiche simplement le code dans codeDiv utilisé à l'installation de la modale
  private onlyDisplayCode(): void {
    if (!this.codeDiv) return
    this.codeBlocks = []
    this.allRenderedBlocks = []
    this.highlightedExecutionIndex = null
    this.highlightedBlockElement = null
    this.codeDiv.innerHTML = ''

    const simulatorCode = this.getSimulatorScratchCode()
    const scratchblockHtml = scratchblock(simulatorCode)
    if (scratchblockHtml !== false) {
      this.codeDiv.innerHTML = scratchblockHtml
    } else {
      const pre = document.createElement('pre')
      pre.classList.add('blocks')
      pre.textContent = simulatorCode
      this.codeDiv.appendChild(pre)
    }
  }

  // refait le display dans le codeDiv et lance l'exécution animée.
  private parseAndDisplayCode(): void {
    if (!this.codeDiv) return
    this.codeBlocks = []
    this.allRenderedBlocks = []
    this.highlightedExecutionIndex = null
    this.highlightedBlockElement = null
    this.codeDiv.innerHTML = ''

    const simulatorCode = this.getSimulatorScratchCode()
    const scratchblockHtml = scratchblock(simulatorCode)
    if (scratchblockHtml !== false) {
      this.codeDiv.innerHTML = scratchblockHtml
    } else {
      const pre = document.createElement('pre')
      pre.classList.add('blocks')
      pre.textContent = simulatorCode
      this.codeDiv.appendChild(pre)
    }

    // Rendre le scratchblock et mettre en cache les blocs
    requestAnimationFrame(() => {
      renderScratchDiv(this.codeDiv!)
      this.cacheRenderedBlocks()
    })
  }

  private getSimulatorScratchCode(): string {
    return this.scratchCode.replace(/\\blockinit(\s*)\{/g, '\\blockevent$1{')
  }

  // Highlighting des blocs pendant l'exécution
  private highlightCurrentInstruction(
    currentInstructionHtml: string,
    currentInstructionText: string = '',
    currentInstructionIndex?: number,
    currentConditionText?: string,
    retryAttempt: number = 0,
  ): void {
    if (this.codeBlocks.length === 0) {
      this.cacheRenderedBlocks()
    }

    let targetBlock: CodeBlockNode | null = null
    let executionIndex: number | null = null
    let matchedElement: SVGGElement | null = null
    const normalizedInstruction =
      this.extractInstructionTextFromHtml(currentInstructionHtml) ||
      this.normalizeText(currentInstructionText)
    const isConditionStep = Boolean(currentConditionText)

    const resolveRuntimeMapping = (): void => {
      if (
        currentInstructionIndex === undefined ||
        currentInstructionIndex < 0 ||
        !normalizedInstruction ||
        isConditionStep
      ) {
        return
      }

      const resolvedBlockId = this.resolveBlockIdForInstruction(
        normalizedInstruction,
        currentInstructionIndex,
      )

      if (resolvedBlockId) {
        this.executionIndexToBlockId.set(
          currentInstructionIndex,
          resolvedBlockId,
        )
      }
    }

    // PRIORITÉ 0 : mapping déterministe index d'exécution -> sélecteur CSS complet
    if (
      currentInstructionIndex !== undefined &&
      currentInstructionIndex >= 0 &&
      this.executionIndexToBlockId.has(currentInstructionIndex)
    ) {
      const blockId = this.executionIndexToBlockId.get(currentInstructionIndex)
      const selector = blockId ? this.getSelectorFromBlockId(blockId) : null
      if (selector && this.codeDiv) {
        matchedElement = this.codeDiv.querySelector<SVGGElement>(selector)

        if (matchedElement) {
          this.logMappingDebug('highlight/use-precomputed', {
            instructionIndex: currentInstructionIndex,
            blockId,
            normalizedInstruction,
            matchedText: this.getBlockOwnText(matchedElement),
          })
          targetBlock = {
            element: matchedElement,
            text: this.getBlockOwnText(matchedElement),
            children: [],
          }
          executionIndex = currentInstructionIndex
        }
      }
    }

    if (
      !targetBlock &&
      currentInstructionIndex !== undefined &&
      currentInstructionIndex >= 0
    ) {
      resolveRuntimeMapping()
      const blockId = this.executionIndexToBlockId.get(currentInstructionIndex)
      const selector = blockId ? this.getSelectorFromBlockId(blockId) : null
      if (selector && this.codeDiv) {
        matchedElement = this.codeDiv.querySelector<SVGGElement>(selector)
        if (matchedElement) {
          targetBlock = {
            element: matchedElement,
            text: this.getBlockOwnText(matchedElement),
            children: [],
          }
          executionIndex = currentInstructionIndex
        }
      }
    }
    if (
      targetBlock &&
      this.highlightedBlockElement === targetBlock.element &&
      this.highlightedExecutionIndex === executionIndex
    ) {
      return
    }

    if (!targetBlock && this.highlightedBlockElement === null) {
      this.logMappingDebug('highlight/no-target', {
        instructionIndex: currentInstructionIndex ?? null,
        normalizedInstruction,
        hasPrecomputedMapping:
          currentInstructionIndex !== undefined &&
          currentInstructionIndex >= 0 &&
          this.executionIndexToBlockId.has(currentInstructionIndex),
        mappedBlockId:
          currentInstructionIndex !== undefined && currentInstructionIndex >= 0
            ? (this.executionIndexToBlockId.get(currentInstructionIndex) ??
              null)
            : null,
        retryAttempt,
      })

      if (
        retryAttempt < 6 &&
        currentInstructionIndex !== undefined &&
        currentInstructionIndex >= 0
      ) {
        this.cacheRenderedBlocks()
        requestAnimationFrame(() => {
          this.highlightCurrentInstruction(
            currentInstructionHtml,
            currentInstructionText,
            currentInstructionIndex,
            currentConditionText,
            retryAttempt + 1,
          )
        })
      }
      return
    }

    // Nettoyer TOUS les highlights existants (y compris les blocs parents)
    if (this.codeBlocks.length > 0) {
      this.clearBlockHighlights(this.codeBlocks)
    }
    this.highlightedExecutionIndex = null
    this.highlightedBlockElement = null

    if (targetBlock) {
      this.replayHighlightAnimation(targetBlock.element)
      this.highlightedExecutionIndex = executionIndex
      this.highlightedBlockElement = targetBlock.element
      targetBlock.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  private replayHighlightAnimation(blockElement: SVGGElement): void {
    blockElement.classList.remove('scratch-current-block')
    blockElement.getBoundingClientRect()
    blockElement.classList.add('scratch-current-block')
  }

  private clearBlockHighlights(blocks: CodeBlockNode[]): void {
    blocks.forEach((block) => {
      block.element.classList.remove('scratch-current-block')
      if (block.children.length > 0) {
        this.clearBlockHighlights(block.children)
      }
    })
  }

  // Mettre en cache les blocs rendus pour faire le lien entre exécution et affichage
  private cacheRenderedBlocks(): void {
    if (!this.codeDiv) return

    const svg = this.codeDiv.querySelector('svg')
    if (!svg) {
      this.retryCacheRenderedBlocks()
      return
    }

    const groups = Array.from(svg.querySelectorAll<SVGGElement>('g')).filter(
      (group) => this.isBlockGroup(group),
    )

    if (groups.length === 0) {
      this.retryCacheRenderedBlocks()
      return
    }

    const topLevelGroups = groups
      .filter((group) => !this.getNearestBlockAncestor(group, svg))
      .sort((a, b) => this.compareBlockPosition(a, b))

    if (topLevelGroups.length === 0) {
      this.retryCacheRenderedBlocks()
      return
    }

    this.assignIdsToRenderedBlocks(groups)

    this.codeBlocks = topLevelGroups.map((group) => this.buildBlockTree(group))
    this.stripConditionBlocks(this.codeBlocks)

    this.customDefinitionGroups = this.extractCustomBlockDefinitions(svg)
    this.customDefinitionEntryIdBySignature =
      this.extractCustomDefinitionEntryIdBySignature(svg)
    this.customDefinitionBodyIdsBySignature =
      this.extractCustomDefinitionBodyIdsBySignature(svg)
    this.allRenderedBlocks = groups
      .filter(
        (group) =>
          !this.customDefinitionGroups.has(group) &&
          !this.isDefinitionBlockGroup(group) &&
          !this.conditionBlockElements.has(group),
      )
      .map((group) => ({
        element: group,
        text: this.getBlockOwnText(group),
        children: [],
      }))
    this.blockCacheAttempts = 0
  }

  // retry pour attendre que les blocs soient rendus et éviter les problèmes de timing
  private retryCacheRenderedBlocks(): void {
    if (this.blockCacheAttempts >= 6) return
    this.blockCacheAttempts += 1
    requestAnimationFrame(() => this.cacheRenderedBlocks())
  }

  // Construire un arbre de blocs à partir d'un groupe SVG de bloc, en incluant tous les descendants qui sont des blocs
  private buildBlockTree(group: SVGGElement): CodeBlockNode {
    const scopedGroups = [
      group,
      ...Array.from(group.querySelectorAll<SVGGElement>('g')).filter((child) =>
        this.isBlockGroup(child),
      ),
    ]

    const scopedSet = new Set<SVGGElement>(scopedGroups)
    const nodeMap = new Map<SVGGElement, CodeBlockNode>()

    scopedGroups.forEach((entry) => {
      nodeMap.set(entry, {
        element: entry,
        text: this.getBlockOwnText(entry),
        children: [],
      })
    })

    scopedGroups.forEach((entry) => {
      if (entry === group) {
        return
      }

      const parent = this.getNearestBlockAncestorInSet(entry, scopedSet)
      if (!parent) {
        return
      }

      const parentNode = nodeMap.get(parent)
      const childNode = nodeMap.get(entry)
      if (parentNode && childNode) {
        parentNode.children.push(childNode)
      }
    })

    const sortTree = (node: CodeBlockNode): void => {
      node.children.sort((a, b) =>
        this.compareBlockPosition(a.element, b.element),
      )
      node.children.forEach((child) => sortTree(child))
    }

    const rootNode = nodeMap.get(group) || {
      element: group,
      text: this.getBlockOwnText(group),
      children: [],
    }
    sortTree(rootNode)
    return rootNode
  }

  // Identifier et retirer les blocs de conditions (if, if-else, else) pour les traiter différemment dans le mapping exécution <-> affichage
  private stripConditionBlocks(nodes: CodeBlockNode[]): void {
    this.conditionBlockElements.clear()

    const walk = (node: CodeBlockNode): void => {
      if (this.isIfElseBlock(node) && node.children.length > 0) {
        const conditionCandidates = node.children.filter((child) =>
          this.isConditionBlockNode(child),
        )
        const orderedCandidates = conditionCandidates.sort((a, b) =>
          this.compareBlockPosition(a.element, b.element),
        )
        const fallbackOrdered = node.children
          .slice()
          .sort((a, b) => this.compareBlockPosition(a.element, b.element))
        const conditionChild =
          orderedCandidates[0] || fallbackOrdered[0] || node.children[0]

        if (conditionChild) {
          this.conditionBlockElements.add(conditionChild.element)
          node.children = node.children.filter(
            (child) => child.element !== conditionChild.element,
          )
        }
      }

      node.children.forEach((child) => walk(child))
    }

    nodes.forEach((node) => walk(node))
  }

  // Renvoyer l'ancêtre bloc le plus proche dans un ensemble donné
  private getNearestBlockAncestorInSet(
    group: SVGGElement,
    candidates: Set<SVGGElement>,
  ): SVGGElement | null {
    let parent: Element | null = group.parentElement

    while (parent) {
      if (candidates.has(parent as SVGGElement)) {
        return parent as SVGGElement
      }
      parent = parent.parentElement
    }

    return null
  }

  // Repérer les en-têtes de définitions custom à exclure du mapping visuel
  private extractCustomBlockDefinitions(root: SVGElement): Set<SVGGElement> {
    const definitionGroups = new Set<SVGGElement>()

    const allCustomGroups = Array.from(
      root.querySelectorAll<SVGGElement>('g'),
    ).filter((group) => this.isCustomBlockGroup(group))

    const containers = new Set<SVGGElement>()
    allCustomGroups.forEach((group) => {
      const parent = group.parentElement
      if (parent && parent.tagName.toLowerCase() === 'g') {
        containers.add(parent as unknown as SVGGElement)
      }
    })

    containers.forEach((container) => {
      const childGroups = Array.from(container.children).filter(
        (child): child is SVGGElement => child.tagName.toLowerCase() === 'g',
      )

      const headerIndex = childGroups.findIndex((child) =>
        this.isCustomBlockGroup(child),
      )

      if (headerIndex === -1) return

      const headerGroup = childGroups[headerIndex]
      if (!this.isDefinitionBlockGroup(headerGroup)) return

      const bodyGroups = childGroups
        .slice(headerIndex + 1)
        .filter((group) => this.isBlockGroup(group))
      if (bodyGroups.length === 0) return
      definitionGroups.add(headerGroup)
    })

    return definitionGroups
  }

  private extractCustomDefinitionEntryIdBySignature(
    root: SVGElement,
  ): Map<string, string> {
    const entryBySignature = new Map<string, string>()

    const allCustomGroups = Array.from(
      root.querySelectorAll<SVGGElement>('g'),
    ).filter((group) => this.isCustomBlockGroup(group))

    const containers = new Set<SVGGElement>()
    allCustomGroups.forEach((group) => {
      const parent = group.parentElement
      if (parent && parent.tagName.toLowerCase() === 'g') {
        containers.add(parent as unknown as SVGGElement)
      }
    })

    containers.forEach((container) => {
      const childGroups = Array.from(
        container.querySelectorAll<SVGGElement>('g'),
      )
        .filter((child) => this.isBlockGroup(child))
        .sort((a, b) => this.compareBlockPosition(a, b))

      const headerIndex = childGroups.findIndex((child) =>
        this.isDefinitionBlockGroup(child),
      )
      if (headerIndex === -1) {
        return
      }

      const header = childGroups[headerIndex]
      const signature = this.getDefinitionSignatureFromSiblingLine(
        childGroups,
        headerIndex,
      )
      if (!signature) {
        return
      }

      const bodyGroups: SVGGElement[] = []
      for (
        let cursor = headerIndex + 1;
        cursor < childGroups.length;
        cursor += 1
      ) {
        const candidate = childGroups[cursor]
        if (this.isOnSameVisualLine(header, candidate)) {
          continue
        }

        const candidateText = this.normalizeText(
          this.getBlockOwnText(candidate),
        )
        if (
          this.isHatBlockText(candidateText) ||
          this.isDefinitionBlockGroup(candidate)
        ) {
          break
        }

        bodyGroups.push(candidate)
      }

      const bodyEntry = bodyGroups[0]
      if (!bodyEntry) {
        return
      }

      if (!bodyEntry.id) {
        bodyEntry.id = this.generateBlockId()
      }
      bodyEntry.setAttribute('data-scratch-block-id', bodyEntry.id)

      if (!entryBySignature.has(signature)) {
        entryBySignature.set(signature, bodyEntry.id)
      }
    })

    return entryBySignature
  }

  private extractCustomDefinitionBodyIdsBySignature(
    root: SVGElement,
  ): Map<string, Set<string>> {
    const bodyIdsBySignature = new Map<string, Set<string>>()

    const allCustomGroups = Array.from(
      root.querySelectorAll<SVGGElement>('g'),
    ).filter((group) => this.isCustomBlockGroup(group))

    const containers = new Set<SVGGElement>()
    allCustomGroups.forEach((group) => {
      const parent = group.parentElement
      if (parent && parent.tagName.toLowerCase() === 'g') {
        containers.add(parent as unknown as SVGGElement)
      }
    })

    containers.forEach((container) => {
      const childGroups = Array.from(
        container.querySelectorAll<SVGGElement>('g'),
      )
        .filter((child) => this.isBlockGroup(child))
        .sort((a, b) => this.compareBlockPosition(a, b))

      const headerIndex = childGroups.findIndex((child) =>
        this.isDefinitionBlockGroup(child),
      )
      if (headerIndex === -1) {
        return
      }

      const header = childGroups[headerIndex]
      const signature = this.getDefinitionSignatureFromSiblingLine(
        childGroups,
        headerIndex,
      )
      if (!signature) {
        return
      }

      const bodyIds = new Set<string>()

      for (
        let cursor = headerIndex + 1;
        cursor < childGroups.length;
        cursor += 1
      ) {
        const candidate = childGroups[cursor]
        if (this.isOnSameVisualLine(header, candidate)) {
          continue
        }

        const candidateText = this.normalizeText(
          this.getBlockOwnText(candidate),
        )
        if (
          this.isHatBlockText(candidateText) ||
          this.isDefinitionBlockGroup(candidate)
        ) {
          break
        }

        const scopedGroups = [
          candidate,
          ...Array.from(candidate.querySelectorAll<SVGGElement>('g')).filter(
            (child) => this.isBlockGroup(child),
          ),
        ]

        scopedGroups.forEach((group) => {
          if (!group.id) {
            group.id = this.generateBlockId()
          }
          group.setAttribute('data-scratch-block-id', group.id)
          bodyIds.add(group.id)
        })
      }

      if (bodyIds.size > 0 && !bodyIdsBySignature.has(signature)) {
        bodyIdsBySignature.set(signature, bodyIds)
      }
    })

    return bodyIdsBySignature
  }

  // Extraire le texte propre d'un bloc (sans les textes des blocs imbriqués)
  private getBlockOwnText(group: SVGGElement): string {
    const parts: string[] = []
    const textNodes = Array.from(group.querySelectorAll('text'))

    textNodes.forEach((textNode) => {
      const ownerBlock = this.getNearestBlockAncestorForNode(textNode)
      if (ownerBlock === group) {
        parts.push(textNode.textContent || '')
      }
    })

    const raw = parts.join(' ').trim()
    return this.normalizeText(raw || group.textContent || '')
  }

  // Trouver le bloc propriétaire d'un nœud de texte
  private getNearestBlockAncestorForNode(node: Element): SVGGElement | null {
    let current: Element | null = node.parentElement

    while (current) {
      if (this.isBlockGroup(current)) {
        return current
      }
      current = current.parentElement
    }

    return null
  }

  // Trouver l'ancêtre bloc direct en remontant jusqu'à la racine SVG
  private getNearestBlockAncestor(
    group: SVGGElement,
    root: SVGElement,
  ): SVGGElement | null {
    let parent: Element | null = group.parentElement
    while (parent && parent !== root) {
      if (this.isBlockGroup(parent)) {
        return parent
      }
      parent = parent.parentElement
    }
    return null
  }

  // Lire la translation Y (fallback de tri quand le positionnement absolu est instable)
  private getTranslateY(group: SVGGElement): number {
    const transform = group.getAttribute('transform') || ''
    const match = transform.match(/translate\(([-\d.]+)(?:[ ,]([-\d.]+))?\)/)
    if (!match) return 0
    const y = match[2] ? parseFloat(match[2]) : 0
    return Number.isNaN(y) ? 0 : y
  }

  // Même chose pour la translation X
  private getTranslateX(group: SVGGElement): number {
    const transform = group.getAttribute('transform') || ''
    const match = transform.match(/translate\(([-\d.]+)(?:[ ,]([-\d.]+))?\)/)
    if (!match) return 0
    const x = match[1] ? parseFloat(match[1]) : 0
    return Number.isNaN(x) ? 0 : x
  }

  // Comparer deux blocs selon un ordre visuel stable
  private compareBlockPosition(a: SVGGElement, b: SVGGElement): number {
    const rectA = a.getBoundingClientRect()
    const rectB = b.getBoundingClientRect()
    const yDiff = rectA.top - rectB.top
    if (Math.abs(yDiff) > 0.5) {
      return yDiff
    }
    const xDiff = rectA.left - rectB.left
    if (Math.abs(xDiff) > 0.5) {
      return xDiff
    }
    const fallbackY = this.getTranslateY(a) - this.getTranslateY(b)
    if (Math.abs(fallbackY) > 0.001) {
      return fallbackY
    }
    return this.getTranslateX(a) - this.getTranslateX(b)
  }

  private isConditionBlockNode(node: CodeBlockNode): boolean {
    return /<=|>=|<|>|=/.test(node.text)
  }

  private isIfElseBlock(node: CodeBlockNode): boolean {
    return node.text.includes('si ') && node.text.includes(' alors')
  }

  private isBlockGroup(group: Element): group is SVGGElement {
    const firstChild = group.firstElementChild
    if (!firstChild || firstChild.tagName.toLowerCase() !== 'path') {
      return false
    }
    const className = firstChild.getAttribute('class') || ''
    return className.startsWith('sb3-')
  }

  private isCustomBlockGroup(group: Element): group is SVGGElement {
    const firstChild = group.firstElementChild
    if (!firstChild || firstChild.tagName.toLowerCase() !== 'path') {
      return false
    }
    const className = firstChild.getAttribute('class') || ''
    return className.startsWith('sb3-custom')
  }

  private isDefinitionBlockGroup(group: SVGGElement): boolean {
    const ownText = this.normalizeText(this.getBlockOwnText(group))
    const fullText = this.normalizeText(group.textContent || '')
    return (
      ownText.includes('définir') ||
      ownText.includes('definir') ||
      fullText.includes('définir') ||
      fullText.includes('definir')
    )
  }

  private getDefinitionSignature(group: SVGGElement): string {
    const fullText = this.normalizeText(group.textContent || '')
    const ownText = this.normalizeText(this.getBlockOwnText(group))

    const fromFull = this.normalizeCustomBlockSignature(fullText)
    if (fromFull) {
      return fromFull
    }

    return this.normalizeCustomBlockSignature(ownText)
  }

  private getDefinitionSignatureFromSiblingLine(
    siblingGroups: SVGGElement[],
    headerIndex: number,
  ): string {
    const header = siblingGroups[headerIndex]
    const lineParts: string[] = []

    for (let cursor = headerIndex; cursor < siblingGroups.length; cursor += 1) {
      const candidate = siblingGroups[cursor]
      if (cursor > headerIndex && !this.isOnSameVisualLine(header, candidate)) {
        break
      }

      const own = this.normalizeText(this.getBlockOwnText(candidate))
      const full = this.normalizeText(candidate.textContent || '')
      const part = own || full
      if (part) {
        lineParts.push(part)
      }
    }

    const mergedLine = lineParts.join(' ')
    const fromLine = this.normalizeCustomBlockSignature(mergedLine)
    if (fromLine) {
      return fromLine
    }

    return this.getDefinitionSignature(header)
  }

  private isOnSameVisualLine(a: SVGGElement, b: SVGGElement): boolean {
    const aTop = a.getBoundingClientRect().top
    const bTop = b.getBoundingClientRect().top
    return Math.abs(aTop - bTop) <= 4
  }

  private isIfBlockText(text: string): boolean {
    return (
      text.includes('si') && text.includes('alors') && !text.includes('sinon')
    )
  }

  private isIfElseBlockText(text: string): boolean {
    return (
      text.includes('si') && text.includes('alors') && text.includes('sinon')
    )
  }

  private isHatBlockText(text: string): boolean {
    const normalized = this.normalizeText(text)
    if (/^(quand|lorsque|when)\b/.test(normalized)) {
      return true
    }

    if (/\btouche\b[\s\S]*\bpress(?:ee|e|ed)\b/.test(normalized)) {
      return true
    }

    if (/\bkey\b[\s\S]*\bpress(?:ed)?\b/.test(normalized)) {
      return true
    }

    return /\b(?:greenflag|drapeau)\b[\s\S]*\b(?:clique|clicked)\b/.test(
      normalized,
    )
  }

  private isEventInstructionText(text: string): boolean {
    const normalized = this.normalizeText(text)
    return /^quand\b/.test(normalized) || /^attente\b/.test(normalized)
  }

  private isValidStartEventBlock(block: CodeBlockNode): boolean {
    const normalizedText = this.normalizeText(block.text)
    if (!this.isHatBlockText(normalizedText)) {
      return false
    }

    if (
      this.isDefinitionBlockGroup(block.element) ||
      this.customDefinitionGroups.has(block.element) ||
      this.isCustomBlockGroup(block.element)
    ) {
      return false
    }

    return true
  }

  private hasValidStartEventBlock(): boolean {
    return this.allRenderedBlocks.some((block) =>
      this.isValidStartEventBlock(block),
    )
  }

  private isCustomBlockCallInstructionText(text: string): boolean {
    const normalized = this.normalizeText(text)
    return /^bloc\s+/.test(normalized)
  }

  private normalizeCustomBlockSignature(text: string): string {
    const withoutLatexArgs = text
      .replace(/\\(?:ovalnum|ovalmoreblocks|boolmoreblocks)\{[^{}]*\}/g, ' ')
      .replace(/\\_/g, '_')

    const normalized = this.normalizeText(withoutLatexArgs)
      .replace(/\\_/g, '_')
      .replace(/\s*_\s*/g, '_')
      .replace(/^(définir|definir|bloc)\s+/, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!normalized) {
      return ''
    }

    const simplifiedTokens = normalized
      .split(' ')
      .filter((token) => token.trim() !== '')
      .filter((token) => !/^-?\d+(?:[.,]\d+)?$/.test(token))
      .filter((token) => !/^number\d*$/i.test(token))

    return simplifiedTokens.join(' ').trim()
  }

  private canonicalizeCustomSignature(signature: string): string {
    return signature
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\\_/g, '_')
      .replace(/\s*_\s*/g, '_')
      .replace(/_/g, ' ')
      .replace(/[^a-z0-9_ ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private findMatchingCustomSignatureKey<T>(
    signature: string,
    source: Map<string, T>,
  ): string | null {
    if (source.has(signature)) {
      return signature
    }

    const canonicalTarget = this.canonicalizeCustomSignature(signature)
    if (!canonicalTarget) {
      return null
    }

    for (const key of source.keys()) {
      const canonicalKey = this.canonicalizeCustomSignature(key)
      if (canonicalKey === canonicalTarget) {
        return key
      }

      if (
        canonicalKey.startsWith(`${canonicalTarget} `) ||
        canonicalTarget.startsWith(`${canonicalKey} `)
      ) {
        return key
      }
    }

    return null
  }

  // Normaliser le texte des blocs pour fiabiliser les correspondances
  private normalizeText(text: string): string {
    return text
      .replace(/\[(\d+)\]/g, '$1') // Retirer les crochets autour des nombres [15] -> 15
      .replace(/\[([^\]]+)\]/g, '$1') // Retirer les autres crochets [xxx] -> xxx
      .replace(/[▾▼]/g, ' ')
      .replace(/\s+v\s+/gi, ' ') // Retirer les 'v' de selectmenu (deviennent <use> dans le SVG)
      .replace(/\s+::\s+\w+/g, '') // Retirer les marqueurs de style Scratch (:: sensing, :: move, etc.)
      .replace(/[()]/g, '') // Retirer les parenthèses
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  // Générer un identifiant stable pour cibler un bloc SVG
  private generateBlockId(): string {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return `scratch-block-${crypto.randomUUID()}`
    }
    return `scratch-block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }

  private assignIdsToRenderedBlocks(groups: SVGGElement[]): void {
    groups.forEach((group) => {
      if (!group.id) {
        group.id = this.generateBlockId()
      }
      group.setAttribute('data-scratch-block-id', group.id)
    })
  }

  private escapeCssIdentifier(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value)
    }
    return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1')
  }

  // Construire un sélecteur CSS fiable à partir de l'ID d'un bloc
  private getSelectorFromBlockId(blockId: string): string {
    return `#${this.escapeCssIdentifier(blockId)}`
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private getMappedInstructionText(
    instructionIndex: number | undefined,
  ): string | null {
    if (
      typeof instructionIndex !== 'number' ||
      instructionIndex < 0 ||
      !this.executionIndexToBlockId.has(instructionIndex)
    ) {
      return null
    }

    const blockId = this.executionIndexToBlockId.get(instructionIndex)
    if (!blockId) {
      return null
    }

    const block = this.allRenderedBlocks.find(
      (candidate) => candidate.element.id === blockId,
    )
    if (!block) {
      return null
    }

    const mappedText = this.normalizeText(block.text)
    return mappedText || null
  }

  private chooseNearestOrder(
    candidates: number[],
    lastOrder: number,
    maxOrder: number,
  ): number | null {
    if (candidates.length === 0) return null

    let best: number | null = null
    let bestDelta = Number.POSITIVE_INFINITY

    for (const order of candidates) {
      const delta =
        order >= lastOrder ? order - lastOrder : order + maxOrder - lastOrder
      if (delta < bestDelta) {
        bestDelta = delta
        best = order
      }
    }

    return best
  }

  private getNextOrderAfter(current: number, total: number): number {
    if (total <= 0) return 0
    const next = current + 1
    return next >= total ? 0 : next
  }

  private getNextAllowedOrderAfter(
    current: number,
    total: number,
    isAllowed: (order: number) => boolean,
  ): number | null {
    if (total <= 0) {
      return null
    }

    let probe = current
    for (let attempts = 0; attempts < total; attempts += 1) {
      probe = this.getNextOrderAfter(probe, total)
      if (isAllowed(probe)) {
        return probe
      }
    }

    return null
  }

  private extractInstructionTextFromHtml(html: string): string {
    if (!html) return ''
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return this.normalizeText(tempDiv.textContent || '')
  }

  private extractFirstNumber(text: string): number | null {
    const match = text.match(/-?\d+(?:[.,]\d+)?/)
    if (!match) {
      return null
    }
    const parsed = Number.parseFloat(match[0].replace(',', '.'))
    return Number.isNaN(parsed) ? null : parsed
  }

  private getLooseInstructionKey(text: string): string | null {
    const normalized = this.normalizeText(text)
      .replace(/[↻↺]/g, ' ')
      .replace(/\bdroite\b|\bgauche\b/g, ' ')
      .replace(/\bdegres?\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!normalized) {
      return null
    }

    const value = this.extractFirstNumber(normalized)

    if (normalized.includes('tourner')) {
      return `tourner:${value ?? 'none'}`
    }

    if (normalized.includes('avancer')) {
      return `avancer:${value ?? 'none'}`
    }

    if (normalized.includes('ajouter') && normalized.includes(' x')) {
      return `ajouter-x:${value ?? 'none'}`
    }

    if (normalized.includes('ajouter') && normalized.includes(' y')) {
      return `ajouter-y:${value ?? 'none'}`
    }

    return null
  }

  private resolveBlockIdForInstruction(
    normalizedInstruction: string,
    currentInstructionIndex: number,
  ): string | null {
    if (!this.codeDiv || !normalizedInstruction) {
      return null
    }

    const candidateBlocks = this.allRenderedBlocks.filter(
      (block) =>
        !this.customDefinitionGroups.has(block.element) &&
        !this.conditionBlockElements.has(block.element),
    )

    if (candidateBlocks.length === 0) {
      return null
    }

    const idsByOrder = new Map<number, string>()
    const exactOrdersByText = new Map<string, number[]>()
    const allTexts: Array<{ order: number; text: string }> = []
    const hatOrders = new Set<number>()
    const validEventOrders = new Set<number>()
    const isEventInstruction = this.isEventInstructionText(
      normalizedInstruction,
    )

    candidateBlocks.forEach((block, order) => {
      const blockId = block.element.id || this.generateBlockId()
      if (!block.element.id) {
        block.element.id = blockId
        block.element.setAttribute('data-scratch-block-id', blockId)
      }
      idsByOrder.set(order, blockId)

      const normalizedText = this.normalizeText(block.text)
      allTexts.push({ order, text: normalizedText })
      if (this.isHatBlockText(normalizedText)) {
        hatOrders.add(order)
        if (this.isValidStartEventBlock(block)) {
          validEventOrders.add(order)
        }
      }

      const bucket = exactOrdersByText.get(normalizedText) || []
      bucket.push(order)
      exactOrdersByText.set(normalizedText, bucket)
    })

    let candidateOrders = exactOrdersByText.get(normalizedInstruction) || []

    if (candidateOrders.length === 0) {
      const superNormalized = normalizedInstruction.replace(/\s+/g, '')
      for (const [key, orders] of exactOrdersByText.entries()) {
        const keyNormalized = key.replace(/\s+/g, '')
        if (keyNormalized === superNormalized) {
          candidateOrders = orders
          break
        }
      }
    }

    if (candidateOrders.length === 0) {
      const superNormalizedInstruction = normalizedInstruction.replace(
        /\s+/g,
        '',
      )
      candidateOrders = allTexts
        .filter(({ text }) => {
          const superNormalizedText = text.replace(/\s+/g, '')
          return (
            text.includes(normalizedInstruction) ||
            normalizedInstruction.includes(text) ||
            superNormalizedText.includes(superNormalizedInstruction) ||
            superNormalizedInstruction.includes(superNormalizedText)
          )
        })
        .map(({ order }) => order)
    }

    if (candidateOrders.length === 0) {
      const looseInstructionKey = this.getLooseInstructionKey(
        normalizedInstruction,
      )
      if (looseInstructionKey) {
        candidateOrders = allTexts
          .filter(
            ({ text }) =>
              this.getLooseInstructionKey(text) === looseInstructionKey,
          )
          .map(({ order }) => order)
      }
    }

    if (!isEventInstruction) {
      candidateOrders = candidateOrders.filter((order) => !hatOrders.has(order))
    } else {
      candidateOrders = candidateOrders.filter((order) =>
        validEventOrders.has(order),
      )
      if (candidateOrders.length === 0) {
        candidateOrders = Array.from(validEventOrders)
      }
    }

    if (candidateOrders.length === 0) {
      return null
    }

    const lastOrder = this.findLastMappedOrderBeforeIndex(
      currentInstructionIndex,
      idsByOrder,
    )
    const chosenOrder = this.chooseNearestOrder(
      candidateOrders,
      lastOrder,
      candidateBlocks.length,
    )

    if (chosenOrder === null) {
      return null
    }

    return idsByOrder.get(chosenOrder) || null
  }

  private findLastMappedOrderBeforeIndex(
    currentInstructionIndex: number,
    idsByOrder: Map<number, string>,
  ): number {
    const orderById = new Map<string, number>()
    idsByOrder.forEach((id, order) => {
      orderById.set(id, order)
    })

    let bestIndex = -1
    let bestOrder = -1

    this.executionIndexToBlockId.forEach((blockId, index) => {
      if (index >= currentInstructionIndex) {
        return
      }
      const order = orderById.get(blockId)
      if (order === undefined) {
        return
      }
      if (index > bestIndex) {
        bestIndex = index
        bestOrder = order
      }
    })

    return bestOrder
  }

  private async waitForRenderedBlocks(maxFrames: number = 12): Promise<void> {
    for (let attempt = 0; attempt < maxFrames; attempt += 1) {
      if (this.codeBlocks.length > 0 && this.allRenderedBlocks.length > 0) {
        return
      }
      this.cacheRenderedBlocks()
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
    }
  }

  private async buildExecutionIndexToSelectorMap(): Promise<void> {
    this.mappingWarningMessage = null
    this.executionIndexToBlockId.clear()
    if (!this.customDefinitionEntryIdBySignature) {
      this.customDefinitionEntryIdBySignature = new Map<string, string>()
    }
    if (!this.customDefinitionBodyIdsBySignature) {
      this.customDefinitionBodyIdsBySignature = new Map<string, Set<string>>()
    }
    await this.waitForRenderedBlocks()

    if (!this.codeDiv || this.allRenderedBlocks.length === 0) {
      return
    }

    const candidateBlocks = this.allRenderedBlocks.filter(
      (block) =>
        !this.customDefinitionGroups.has(block.element) &&
        !this.conditionBlockElements.has(block.element),
    )

    if (candidateBlocks.length === 0) {
      return
    }

    const idsByOrder = new Map<number, string>()
    const orderById = new Map<string, number>()
    const textByOrder = new Map<number, string>()
    const customBodyOrdersBySignature = new Map<string, Set<number>>()
    const exactOrdersByText = new Map<string, number[]>()
    const allTexts: Array<{ order: number; text: string }> = []
    const hatOrders = new Set<number>()
    const validEventOrders = new Set<number>()

    candidateBlocks.forEach((block, order) => {
      const blockId = block.element.id || this.generateBlockId()
      if (!block.element.id) {
        block.element.id = blockId
        block.element.setAttribute('data-scratch-block-id', blockId)
      }
      idsByOrder.set(order, blockId)
      orderById.set(blockId, order)

      const normalizedText = this.normalizeText(block.text)
      allTexts.push({ order, text: normalizedText })
      textByOrder.set(order, normalizedText)
      if (this.isHatBlockText(normalizedText)) {
        hatOrders.add(order)
        if (this.isValidStartEventBlock(block)) {
          validEventOrders.add(order)
        }
      }

      const bucket = exactOrdersByText.get(normalizedText) || []
      bucket.push(order)
      exactOrdersByText.set(normalizedText, bucket)
    })

    this.customDefinitionBodyIdsBySignature.forEach((ids, signature) => {
      const orders = new Set<number>()
      ids.forEach((id) => {
        const order = orderById.get(id)
        if (order !== undefined) {
          orders.add(order)
        }
      })
      if (orders.size > 0) {
        customBodyOrdersBySignature.set(signature, orders)
      }
    })

    const dryInterpreter = new ScratchInterpreter(200, 200, 90)
    const seenInstructionIndexes = new Set<number>()
    let mappingGuardTriggered = false
    let lastOrder = -1
    const customBlockReturnOrders: number[] = []
    const customBlockEntryOrders: number[] = []
    const customBlockBodyOrderStack: Array<Set<number>> = []
    const simulatorCode = this.getSimulatorScratchCode()
    try {
      await dryInterpreter.executeAnimated(
        simulatorCode,
        async () => {
          if (
            seenInstructionIndexes.size >=
            ScratchSimulator.MAX_MAPPING_INSTRUCTIONS
          ) {
            if (!mappingGuardTriggered) {
              mappingGuardTriggered = true
              this.mappingWarningMessage =
                'Alerte : le script semble trop récursif (mapping arrêté à 10 000 instructions).'
              this.logMappingDebug('build/guard-stop', {
                maxInstructions: ScratchSimulator.MAX_MAPPING_INSTRUCTIONS,
                message:
                  "Arrêt du mapping dry-run: trop d'instructions (boucle/récursivité potentielle).",
              })
            }
            dryInterpreter.stopExecution()
            return
          }

          const state = dryInterpreter.getCurrentState()
          const index = state.currentInstructionIndex
          if (
            typeof index !== 'number' ||
            index < 0 ||
            seenInstructionIndexes.has(index)
          ) {
            return
          }

          seenInstructionIndexes.add(index)
          const instructionTextFromHtml = this.extractInstructionTextFromHtml(
            state.currentInstructionScratchHtml || '',
          )
          const instructionTextFromLabel = this.normalizeText(
            state.currentInstruction || '',
          )
          const instructionText =
            instructionTextFromHtml || instructionTextFromLabel
          const isConditionStep = Boolean(state.currentConditionText)
          const isEventInstruction =
            this.isEventInstructionText(instructionText)
          const isCustomCallInstruction = this.isCustomBlockCallInstructionText(
            instructionTextFromLabel,
          )
          let activeCustomBodyOrders =
            customBlockBodyOrderStack.length > 0
              ? customBlockBodyOrderStack[customBlockBodyOrderStack.length - 1]
              : null

          const runtimeCustomSignature = this.normalizeCustomBlockSignature(
            state.currentCustomBlockSignature || '',
          )
          const isInsideRuntimeCustom = runtimeCustomSignature !== ''
          if (runtimeCustomSignature) {
            const runtimeSignatureKey = this.findMatchingCustomSignatureKey(
              runtimeCustomSignature,
              customBodyOrdersBySignature,
            )
            if (runtimeSignatureKey) {
              const runtimeScope =
                customBodyOrdersBySignature.get(runtimeSignatureKey)
              if (runtimeScope && runtimeScope.size > 0) {
                activeCustomBodyOrders = runtimeScope
              }
            }
          }

          this.logMappingDebug('build/index-state', {
            instructionIndex: index,
            instructionText,
            instructionTextFromHtml,
            instructionTextFromLabel,
            runtimeCustomSignature,
            isConditionStep,
            isEventInstruction,
            isCustomCallInstruction,
            activeScopeSize: activeCustomBodyOrders?.size ?? 0,
            stackDepth: customBlockBodyOrderStack.length,
          })

          if (
            customBlockEntryOrders.length > 0 &&
            !isConditionStep &&
            !isCustomCallInstruction
          ) {
            const forcedEntryOrder = customBlockEntryOrders.pop() ?? null
            if (forcedEntryOrder !== null) {
              const forcedId = idsByOrder.get(forcedEntryOrder)
              if (forcedId) {
                this.executionIndexToBlockId.set(index, forcedId)
                lastOrder = forcedEntryOrder
                return
              }
            }
          }

          let candidateOrders: number[] = []

          if (isConditionStep) {
            const wantsIfElse = this.isIfElseBlockText(instructionText)
            const matcher = wantsIfElse
              ? (text: string) => this.isIfElseBlockText(text)
              : (text: string) => this.isIfBlockText(text)
            candidateOrders = allTexts
              .filter(({ text }) => matcher(text))
              .map(({ order }) => order)
            if (candidateOrders.length === 0) {
              candidateOrders = allTexts
                .filter(
                  ({ text }) =>
                    this.isIfBlockText(text) || this.isIfElseBlockText(text),
                )
                .map(({ order }) => order)
            }
          } else if (instructionText) {
            candidateOrders = exactOrdersByText.get(instructionText) || []

            // Fallback : si pas de correspondance exacte, essayer une super-normalisation
            if (candidateOrders.length === 0) {
              const superNormalized = instructionText
                .replace(/\s+/g, '')
                .toLowerCase()
              for (const [key, orders] of exactOrdersByText.entries()) {
                const keyNormalized = key.replace(/\s+/g, '').toLowerCase()
                if (keyNormalized === superNormalized) {
                  candidateOrders = orders
                  break
                }
              }
            }
          }

          if (
            candidateOrders.length === 0 &&
            instructionText &&
            !isConditionStep
          ) {
            // Super-normalisation : supprimer tous les espaces pour la comparaison
            const superNormalizedInstruction = instructionText
              .replace(/\s+/g, '')
              .toLowerCase()

            candidateOrders = allTexts
              .filter(({ text }) => {
                const superNormalizedText = text
                  .replace(/\s+/g, '')
                  .toLowerCase()
                return (
                  text.includes(instructionText) ||
                  instructionText.includes(text) ||
                  superNormalizedText.includes(superNormalizedInstruction) ||
                  superNormalizedInstruction.includes(superNormalizedText)
                )
              })
              .map(({ order }) => order)
          }

          if (candidateOrders.length === 0) {
            const looseInstructionKey =
              this.getLooseInstructionKey(instructionText)
            if (looseInstructionKey) {
              candidateOrders = allTexts
                .filter(
                  ({ text }) =>
                    this.getLooseInstructionKey(text) === looseInstructionKey,
                )
                .map(({ order }) => order)
            }
          }

          if (isEventInstruction && candidateOrders.length === 0) {
            candidateOrders = Array.from(validEventOrders)
          }

          if (isEventInstruction && candidateOrders.length > 1) {
            const eventHint = this.normalizeText(
              `${instructionText} ${instructionTextFromLabel}`,
            )

            if (/greenflag|drapeau/.test(eventHint)) {
              const narrowed = candidateOrders.filter((order) => {
                const text = textByOrder.get(order) || ''
                return /greenflag|drapeau|quand/.test(text)
              })

              if (narrowed.length > 0) {
                candidateOrders = narrowed
              }
            }
          }

          if (!isConditionStep && !isEventInstruction) {
            candidateOrders = candidateOrders.filter(
              (order) => !hatOrders.has(order),
            )
          } else if (isEventInstruction) {
            candidateOrders = candidateOrders.filter((order) =>
              validEventOrders.has(order),
            )
          }

          if (activeCustomBodyOrders && !isCustomCallInstruction) {
            candidateOrders = candidateOrders.filter((order) =>
              activeCustomBodyOrders.has(order),
            )
          }

          const expectedReturnOrder =
            customBlockReturnOrders.length > 0
              ? customBlockReturnOrders[customBlockReturnOrders.length - 1]
              : null

          if (
            expectedReturnOrder !== null &&
            !isConditionStep &&
            !isCustomCallInstruction &&
            !activeCustomBodyOrders &&
            !isInsideRuntimeCustom &&
            candidateOrders.includes(expectedReturnOrder)
          ) {
            const returnId = idsByOrder.get(expectedReturnOrder)
            if (returnId) {
              this.executionIndexToBlockId.set(index, returnId)
              lastOrder = expectedReturnOrder
              customBlockReturnOrders.pop()
              customBlockBodyOrderStack.pop()
              return
            }
          }

          if (candidateOrders.length === 0) {
            if (isConditionStep) {
              return
            }

            if (activeCustomBodyOrders && !isEventInstruction) {
              const scopedFallbackOrder = this.getNextAllowedOrderAfter(
                lastOrder,
                candidateBlocks.length,
                (order) =>
                  !hatOrders.has(order) && activeCustomBodyOrders.has(order),
              )

              if (scopedFallbackOrder !== null) {
                const scopedFallbackId = idsByOrder.get(scopedFallbackOrder)
                if (scopedFallbackId) {
                  this.executionIndexToBlockId.set(index, scopedFallbackId)
                  lastOrder = scopedFallbackOrder
                  return
                }
              }

              if (
                expectedReturnOrder !== null &&
                !isCustomCallInstruction &&
                !isInsideRuntimeCustom
              ) {
                const returnId = idsByOrder.get(expectedReturnOrder)
                if (returnId) {
                  this.executionIndexToBlockId.set(index, returnId)
                  lastOrder = expectedReturnOrder
                  customBlockReturnOrders.pop()
                  customBlockBodyOrderStack.pop()
                  return
                }
              }
            }

            if (
              expectedReturnOrder !== null &&
              !isCustomCallInstruction &&
              !isEventInstruction &&
              !activeCustomBodyOrders &&
              !isInsideRuntimeCustom
            ) {
              const returnId = idsByOrder.get(expectedReturnOrder)
              if (returnId) {
                this.executionIndexToBlockId.set(index, returnId)
                lastOrder = expectedReturnOrder
                customBlockReturnOrders.pop()
                customBlockBodyOrderStack.pop()
                return
              }
            }

            const fallbackOrder = !isEventInstruction
              ? this.getNextAllowedOrderAfter(
                  lastOrder,
                  candidateBlocks.length,
                  (order) => {
                    if (hatOrders.has(order)) return false
                    if (activeCustomBodyOrders) {
                      return activeCustomBodyOrders.has(order)
                    }
                    return true
                  },
                )
              : this.getNextAllowedOrderAfter(
                  lastOrder,
                  candidateBlocks.length,
                  (order) => validEventOrders.has(order),
                )
            if (fallbackOrder === null) {
              return
            }
            const fallbackId = idsByOrder.get(fallbackOrder)
            if (fallbackId) {
              this.executionIndexToBlockId.set(index, fallbackId)
              lastOrder = fallbackOrder
              this.logMappingDebug('build/fallback', {
                instructionIndex: index,
                chosenOrder: fallbackOrder,
                chosenText: textByOrder.get(fallbackOrder) || '',
                chosenId: fallbackId,
              })
            }
            return
          }

          const chosenOrder = this.chooseNearestOrder(
            candidateOrders,
            lastOrder,
            candidateBlocks.length,
          )

          if (chosenOrder === null) {
            return
          }

          const blockId = idsByOrder.get(chosenOrder)
          if (!blockId) {
            return
          }

          this.executionIndexToBlockId.set(index, blockId)
          lastOrder = chosenOrder
          this.logMappingDebug('build/chosen', {
            instructionIndex: index,
            chosenOrder,
            chosenText: textByOrder.get(chosenOrder) || '',
            chosenId: blockId,
            candidateOrders,
            candidateTexts: candidateOrders.map(
              (order) => textByOrder.get(order) || '',
            ),
          })

          if (isCustomCallInstruction) {
            const callSignatureSource =
              instructionTextFromLabel || instructionText
            const callSignature =
              this.normalizeCustomBlockSignature(callSignatureSource)
            const signatureKey = this.findMatchingCustomSignatureKey(
              callSignature,
              this.customDefinitionEntryIdBySignature,
            )
            const entryId = signatureKey
              ? this.customDefinitionEntryIdBySignature.get(signatureKey)
              : undefined
            const entryOrder = entryId ? orderById.get(entryId) : undefined
            if (entryOrder !== undefined) {
              customBlockEntryOrders.push(entryOrder)
            }

            const bodyOrders = signatureKey
              ? customBodyOrdersBySignature.get(signatureKey)
              : undefined
            if (bodyOrders && bodyOrders.size > 0) {
              customBlockBodyOrderStack.push(bodyOrders)
              this.logMappingDebug('build/custom-enter', {
                instructionIndex: index,
                callSignature,
                signatureKey,
                scopeSize: bodyOrders.size,
              })
            }

            const returnOrder = this.getNextAllowedOrderAfter(
              chosenOrder,
              candidateBlocks.length,
              (order) => !hatOrders.has(order),
            )
            if (returnOrder !== null) {
              customBlockReturnOrders.push(returnOrder)
              this.logMappingDebug('build/custom-return-marker', {
                instructionIndex: index,
                returnOrder,
                returnText: textByOrder.get(returnOrder) || '',
              })
            }
          }
        },
        0,
        { skipWaitBlocks: true },
      )
    } finally {
      this.logMappedInstructionsSummary(
        idsByOrder,
        orderById,
        textByOrder,
        validEventOrders,
      )
    }
  }

  // Gestion de l'exécution animée du code Scratch
  private async runAnimatedSimulation(): Promise<void> {
    if (!this.interpreter || !this.canvas) return

    const runId = ++this.simulationRunId

    this.isRunning = true
    this.isPaused = false
    this.isHardStopped = false
    this.updateControls()

    // Assigner le callback de saisie utilisateur
    this.interpreter.onAskInput = async (prompt: string) => {
      return this.askForUserInput(prompt)
    }

    // Construire le mapping linéaire index d'exécution -> sélecteur SVG
    await this.buildExecutionIndexToSelectorMap()

    if (this.mappingWarningMessage && this.stepDiv) {
      this.stepDiv.textContent = this.mappingWarningMessage
    }

    if (!this.hasValidStartEventBlock() && this.stepDiv) {
      this.stepDiv.textContent =
        'Alerte : aucun bloc de démarrage détecté (type "quand ...").'
    }

    // Exécuter avec animation (callback extrait pour conserver le contexte this en debug)
    const onUpdateCallback = async (): Promise<void> => {
      if (runId !== this.simulationRunId) {
        return
      }

      // Attendre si en pause
      while (this.isPaused && runId === this.simulationRunId) {
        await new Promise<void>((resolve) => {
          this.pauseResolvers.push(resolve)
        })
      }

      if (runId !== this.simulationRunId) {
        return
      }

      const state = this.interpreter!.getCurrentState()
      requestAnimationFrame(() => {
        if (runId !== this.simulationRunId) {
          return
        }
        this.drawSimulation(state)
        this.displayInfo(state)
        this.displayInstruction(state)
        this.highlightCurrentInstruction(
          state.currentInstructionScratchHtml || '',
          state.currentInstruction || '',
          state.currentInstructionIndex,
          state.currentConditionText,
        )
      })
    }

    const simulatorCode = this.getSimulatorScratchCode()
    await this.interpreter.executeAnimated(
      simulatorCode,
      onUpdateCallback,
      this.delayMs,
    )

    if (runId !== this.simulationRunId) {
      return
    }

    // Affichage final
    const result = this.interpreter.getCurrentState()
    const finalDisplayState: ExecutionResult = {
      ...result,
      currentInstruction: '',
      currentInstructionScratchHtml: '',
      currentInstructionIndex: -1,
    }
    requestAnimationFrame(() => {
      if (runId !== this.simulationRunId) {
        return
      }
      this.drawSimulation(result)
      this.displayInfo(result)
      this.displayInstruction(finalDisplayState)
      this.highlightCurrentInstruction('', '', -1)
    })

    this.isRunning = false
    this.isPaused = false
    this.updateControls()
  }

  private getInitialExecutionState(): ExecutionResult {
    return {
      traces: [],
      finalX: 200,
      finalY: 200,
      finalAngle: 90,
      visible: true,
      variables: {},
      lists: {},
      messages: [],
      currentLookMessage: null,
      currentInstruction: '',
      currentInstructionScratchHtml: '',
      currentInstructionIndex: -1,
      currentConditionText: '',
      currentConditionResult: null,
      repeatIterations: [],
    }
  }

  private resetModalContent(): void {
    this.simulationRunId += 1
    this.isRunning = false
    this.isPaused = false
    this.isHardStopped = false
    this.delayMs = this.initialDelayMs
    const resolvers = this.pauseResolvers
    this.pauseResolvers = []
    resolvers.forEach((resolve) => resolve())
    this.interpreter = null
    this.mappingWarningMessage = null
    this.executionIndexToBlockId.clear()
    this.customDefinitionEntryIdBySignature.clear()
    this.customDefinitionBodyIdsBySignature.clear()

    if (this.codeBlocks.length > 0) {
      this.clearBlockHighlights(this.codeBlocks)
    }
    this.highlightedExecutionIndex = null
    this.highlightedBlockElement = null

    this.onlyDisplayCode()
    if (this.codeDiv) {
      renderScratchDiv(this.codeDiv)
      this.cacheRenderedBlocks()
    }

    if (this.stepDiv) {
      this.stepDiv.textContent = 'Prêt à exécuter (cliquez sur ▶)'
    }
    if (this.infoDiv) {
      this.infoDiv.innerHTML = ''
    }

    this.drawSimulation(this.getInitialExecutionState())
    this.updateControls()
  }

  private drawSimulation(result: ExecutionResult): void {
    if (!this.canvas) return
    if (this.canvasWrapper) {
      this.canvasWrapper.style.display = 'block'
    }

    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Fond blanc
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // AXES
    ctx.strokeStyle = '#d0d0d0'
    ctx.lineWidth = 1
    for (let i = 0; i < this.canvas.width; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, this.canvas.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(this.canvas.width, i)
      ctx.stroke()
    }

    // Lignes d'axes principaux
    ctx.strokeStyle = '#999999'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 200)
    ctx.lineTo(this.canvas.width, 200)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(200, 0)
    ctx.lineTo(200, this.canvas.height)
    ctx.stroke()

    // Traces
    result.traces.forEach((trace) => {
      ctx.strokeStyle = trace.color || '#0066cc'
      ctx.lineWidth = Math.max(1, trace.width || 3)
      ctx.beginPath()
      ctx.moveTo(trace.startX, trace.startY)
      ctx.lineTo(trace.endX, trace.endY)
      ctx.stroke()
    })

    if (result.visible) {
      // Lutin (tortue verte)
      ctx.save()
      ctx.translate(result.finalX, result.finalY)
      ctx.rotate(((result.finalAngle - 90) * Math.PI) / 180)

      const shellRadiusX = 10
      const shellRadiusY = 8
      const shellColor = '#2ecc71'
      const shellEdge = '#1f8f4a'
      const limbColor = '#27ae60'

      // Carapace
      ctx.fillStyle = shellColor
      ctx.strokeStyle = shellEdge
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(0, 0, shellRadiusX, shellRadiusY, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Tete
      ctx.fillStyle = limbColor
      ctx.beginPath()
      ctx.arc(shellRadiusX + 4, 0, 3, 0, Math.PI * 2)
      ctx.fill()

      // Pattes
      ctx.beginPath()
      ctx.arc(-4, -8, 3, 0, Math.PI * 2)
      ctx.arc(4, -8, 3, 0, Math.PI * 2)
      ctx.arc(-4, 8, 3, 0, Math.PI * 2)
      ctx.arc(4, 8, 3, 0, Math.PI * 2)
      ctx.fill()

      // Queue
      ctx.beginPath()
      ctx.moveTo(-shellRadiusX - 4, 0)
      ctx.lineTo(-shellRadiusX - 9, -2)
      ctx.lineTo(-shellRadiusX - 9, 2)
      ctx.closePath()
      ctx.fill()

      // Repere direction (petite fleche)
      ctx.fillStyle = shellEdge
      ctx.beginPath()
      ctx.moveTo(shellRadiusX + 10, 0)
      ctx.lineTo(shellRadiusX + 16, -3)
      ctx.lineTo(shellRadiusX + 16, 3)
      ctx.closePath()
      ctx.fill()

      ctx.restore()

      const currentLookMessage = result.currentLookMessage
      if (currentLookMessage?.text) {
        this.drawSpeechBubble(
          ctx,
          result.finalX,
          result.finalY,
          result.finalAngle,
          currentLookMessage.text,
          currentLookMessage.type,
        )
      }
    }

    const variablesColumnWidth = this.drawVariables(ctx, result.variables)
    this.drawLists(ctx, result.lists ?? {}, 5 + variablesColumnWidth + 8)
  }

  private drawSpeechBubble(
    ctx: CanvasRenderingContext2D,
    turtleX: number,
    turtleY: number,
    turtleAngle: number,
    message: string,
    bubbleType: ScratchLookMessageType = 'say',
  ): void {
    const text = String(message).trim()
    if (!text) return

    const paddingX = 10
    const paddingY = 8
    const tailWidth = 12
    const lineHeight = 16
    const maxBubbleWidth = 300

    ctx.save()
    ctx.font = '14px sans-serif'

    const maxTextWidth = maxBubbleWidth - paddingX * 2
    const wrapSegment = (segment: string): string[] => {
      if (!segment) {
        return ['']
      }

      const words = segment.split(/\s+/).filter((word) => word.length > 0)
      if (words.length === 0) {
        return ['']
      }

      const lines: string[] = []
      let currentLine = ''

      const pushLongWordParts = (word: string): void => {
        let remaining = word
        while (remaining.length > 0) {
          let cut = remaining.length
          while (
            cut > 1 &&
            ctx.measureText(remaining.slice(0, cut)).width > maxTextWidth
          ) {
            cut -= 1
          }
          lines.push(remaining.slice(0, cut))
          remaining = remaining.slice(cut)
        }
      }

      words.forEach((word) => {
        if (!currentLine) {
          if (ctx.measureText(word).width <= maxTextWidth) {
            currentLine = word
          } else {
            pushLongWordParts(word)
          }
          return
        }

        const candidate = `${currentLine} ${word}`
        if (ctx.measureText(candidate).width <= maxTextWidth) {
          currentLine = candidate
          return
        }

        lines.push(currentLine)
        if (ctx.measureText(word).width <= maxTextWidth) {
          currentLine = word
        } else {
          currentLine = ''
          pushLongWordParts(word)
        }
      })

      if (currentLine) {
        lines.push(currentLine)
      }

      return lines.length > 0 ? lines : ['']
    }

    const paragraphs = text.replace(/\r\n/g, '\n').split('\n')
    const bubbleLines = paragraphs.flatMap((paragraph) =>
      wrapSegment(paragraph),
    )
    const textLines = bubbleLines.length > 0 ? bubbleLines : ['']

    const textWidth = textLines.reduce(
      (max, line) =>
        Math.max(max, Math.min(ctx.measureText(line).width, maxTextWidth)),
      0,
    )
    const bubbleWidth = textWidth + paddingX * 2
    const bubbleHeight = textLines.length * lineHeight + paddingY * 2
    const tailHeight = bubbleType === 'think' ? 0 : 15

    const turtleAngleRad = (turtleAngle * Math.PI) / 180
    const verticalOffset = -Math.cos(turtleAngleRad) * 15

    const preferRightSide = turtleX <= ctx.canvas.width / 2
    let bubbleX = preferRightSide ? turtleX + 18 : turtleX - bubbleWidth - 18
    let bubbleY = turtleY - bubbleHeight - 24 + verticalOffset

    bubbleX = Math.max(6, Math.min(bubbleX, ctx.canvas.width - bubbleWidth - 6))
    bubbleY = Math.max(
      6,
      Math.min(bubbleY, ctx.canvas.height - bubbleHeight - tailHeight - 6),
    )

    const bubbleCenterX = bubbleX + bubbleWidth / 2
    const isBubbleOnRight = bubbleCenterX >= turtleX
    const tipDistanceFromCenter = 20
    const orientedTipX =
      turtleX + Math.sin(turtleAngleRad) * tipDistanceFromCenter
    const orientedTipY =
      turtleY - Math.cos(turtleAngleRad) * tipDistanceFromCenter
    const tailTipX = Math.max(6, Math.min(orientedTipX, ctx.canvas.width - 6))
    const tailTipY = Math.max(6, Math.min(orientedTipY, ctx.canvas.height - 6))
    const tailBaseCenterX = isBubbleOnRight
      ? bubbleX + Math.min(18, bubbleWidth / 2)
      : bubbleX + bubbleWidth - Math.min(18, bubbleWidth / 2)
    const cornerRadius = bubbleType === 'think' ? 18 : 10
    const minTailBaseX = bubbleX + cornerRadius + 2
    const maxTailBaseX = bubbleX + bubbleWidth - cornerRadius - 2
    const clampedTailBaseCenterX = Math.max(
      minTailBaseX + tailWidth / 2,
      Math.min(tailBaseCenterX, maxTailBaseX - tailWidth / 2),
    )
    const tailBaseLeftX = clampedTailBaseCenterX - tailWidth / 2
    const tailBaseRightX = clampedTailBaseCenterX + tailWidth / 2
    const thoughtAnchorX = isBubbleOnRight
      ? bubbleX + Math.min(18, bubbleWidth / 2)
      : bubbleX + bubbleWidth - Math.min(18, bubbleWidth / 2)
    const thoughtAnchorY = bubbleY + bubbleHeight - 2

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 1.5

    ctx.beginPath()
    const right = bubbleX + bubbleWidth
    const bottom = bubbleY + bubbleHeight
    const left = bubbleX
    const top = bubbleY

    ctx.moveTo(left + cornerRadius, top)
    ctx.lineTo(right - cornerRadius, top)
    ctx.arcTo(right, top, right, top + cornerRadius, cornerRadius)
    ctx.lineTo(right, bottom - cornerRadius)
    ctx.arcTo(right, bottom, right - cornerRadius, bottom, cornerRadius)
    if (bubbleType === 'say') {
      ctx.lineTo(tailBaseRightX, bottom)
      ctx.lineTo(tailTipX, tailTipY)
      ctx.lineTo(tailBaseLeftX, bottom)
    }
    ctx.lineTo(left + cornerRadius, bottom)
    ctx.arcTo(left, bottom, left, bottom - cornerRadius, cornerRadius)
    ctx.lineTo(left, top + cornerRadius)
    ctx.arcTo(left, top, left + cornerRadius, top, cornerRadius)
    ctx.closePath()

    ctx.fill()
    ctx.stroke()

    if (bubbleType === 'think') {
      const circles = [
        { ratio: 0.35, radius: 2.5 },
        { ratio: 0.62, radius: 3.5 },
      ]

      circles.forEach(({ ratio, radius }) => {
        const circleX = tailTipX + (thoughtAnchorX - tailTipX) * ratio
        const circleY = tailTipY + (thoughtAnchorY - tailTipY) * ratio
        ctx.beginPath()
        ctx.arc(circleX, circleY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      })
    }

    ctx.fillStyle = '#111827'
    ctx.textBaseline = 'top'
    textLines.forEach((line, index) => {
      ctx.fillText(
        line,
        bubbleX + paddingX,
        bubbleY + paddingY + index * lineHeight,
      )
    })
    ctx.restore()
  }

  private drawRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2))
    const maybeRoundRect = (
      ctx as CanvasRenderingContext2D & {
        roundRect?: (
          x: number,
          y: number,
          w: number,
          h: number,
          radii?: number | number[],
        ) => void
      }
    ).roundRect

    if (typeof maybeRoundRect === 'function') {
      maybeRoundRect.call(ctx, x, y, width, height, safeRadius)
      return
    }

    ctx.moveTo(x + safeRadius, y)
    ctx.lineTo(x + width - safeRadius, y)
    ctx.arcTo(x + width, y, x + width, y + safeRadius, safeRadius)
    ctx.lineTo(x + width, y + height - safeRadius)
    ctx.arcTo(
      x + width,
      y + height,
      x + width - safeRadius,
      y + height,
      safeRadius,
    )
    ctx.lineTo(x + safeRadius, y + height)
    ctx.arcTo(x, y + height, x, y + height - safeRadius, safeRadius)
    ctx.lineTo(x, y + safeRadius)
    ctx.arcTo(x, y, x + safeRadius, y, safeRadius)
    ctx.closePath()
  }

  private drawVariables(
    ctx: CanvasRenderingContext2D,
    variables: Record<string, number>,
  ): number {
    const entries = Object.entries(variables)
    if (entries.length === 0) return 0

    ctx.save()
    ctx.font = '10px sans-serif'

    const padding = 6
    const lineHeight = 16
    const borderRadius = 5
    const chipPaddingX = 6
    const chipMinWidth = 22
    const nameValueGap = 6
    const startX = 5
    let currentY = 5
    let maxBoxWidth = 0

    entries.forEach(([name, value]) => {
      const nameText = String(name)
      const valueText = String(value)
      const nameWidth = ctx.measureText(nameText).width
      const valueWidth = ctx.measureText(valueText).width
      const valueChipWidth = Math.max(
        chipMinWidth,
        valueWidth + chipPaddingX * 2,
      )
      const boxWidth = padding * 2 + nameWidth + nameValueGap + valueChipWidth
      const boxHeight = lineHeight
      maxBoxWidth = Math.max(maxBoxWidth, boxWidth)

      const containerColor = '#d2deef'
      const borderColor = '#9ab0cf'
      const chipColor = '#ff8c1a'
      const chipBorderColor = '#cf6b0e'

      ctx.fillStyle = containerColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1

      ctx.beginPath()
      this.drawRoundedRectPath(
        ctx,
        startX,
        currentY,
        boxWidth,
        boxHeight,
        borderRadius,
      )
      ctx.fill()
      ctx.stroke()

      const chipX = startX + padding + nameWidth + nameValueGap
      const chipHeight = boxHeight - 4
      const chipY = currentY + (boxHeight - chipHeight) / 2

      ctx.fillStyle = chipColor
      ctx.strokeStyle = chipBorderColor
      ctx.beginPath()
      this.drawRoundedRectPath(ctx, chipX, chipY, valueChipWidth, chipHeight, 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#000000'
      ctx.textBaseline = 'middle'
      ctx.fillText(nameText, startX + padding, currentY + boxHeight / 2 + 1)

      ctx.fillStyle = '#ffffff'
      ctx.fillText(
        valueText,
        chipX + chipPaddingX,
        currentY + boxHeight / 2 + 1,
      )

      currentY += boxHeight + 4
    })

    ctx.restore()
    return maxBoxWidth
  }

  private drawLists(
    ctx: CanvasRenderingContext2D,
    lists: Record<string, string[]>,
    startX: number,
  ): void {
    const entries = Object.entries(lists)
    if (entries.length === 0) return

    ctx.save()
    ctx.font = '10px sans-serif'

    const padding = 6
    const borderRadius = 5
    const headerHeight = 16
    const rowHeight = 16
    const footerHeight = 15
    const listGap = 8
    const maxWidth = Math.max(
      80,
      this.canvas ? this.canvas.width - startX - 5 : 180,
    )
    let currentY = 5

    entries.forEach(([name, values]) => {
      const headerText = this.truncateTextToWidth(
        ctx,
        name,
        Math.max(50, maxWidth - padding * 2),
      )
      const rowTexts = values
      const footerText = `longueur = ${values.length}`

      let maxIndexWidth = 0
      let maxRowValueWidth = 0
      rowTexts.forEach((value, index) => {
        maxIndexWidth = Math.max(
          maxIndexWidth,
          ctx.measureText(String(index + 1)).width,
        )
        maxRowValueWidth = Math.max(
          maxRowValueWidth,
          ctx.measureText(String(value)).width,
        )
      })

      const indexGap = rowTexts.length > 0 ? 5 : 0
      const chipPaddingX = 6
      const chipMinWidth = 24
      const bodyContentWidth =
        rowTexts.length > 0
          ? maxIndexWidth +
            indexGap +
            Math.max(chipMinWidth, maxRowValueWidth + chipPaddingX * 2)
          : 0

      const idealWidth = Math.max(
        95,
        ctx.measureText(headerText).width + padding * 2,
        bodyContentWidth + padding * 2,
        ctx.measureText(footerText).width + padding * 2,
      )
      const boxWidth = Math.min(maxWidth, idealWidth)
      const bodyHeight = rowTexts.length * rowHeight
      const boxHeight = headerHeight + bodyHeight + footerHeight

      const containerColor = '#d2deef'
      const whiteRowColor = '#ffffff'
      const borderColor = '#9ab0cf'
      const chipColor = '#ff661a'
      const chipBorderColor = '#d24f0f'

      ctx.fillStyle = containerColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1

      ctx.beginPath()
      this.drawRoundedRectPath(
        ctx,
        startX,
        currentY,
        boxWidth,
        boxHeight,
        borderRadius,
      )
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = whiteRowColor
      ctx.fillRect(startX + 1, currentY + 1, boxWidth - 2, headerHeight)

      const footerTop = currentY + headerHeight + rowTexts.length * rowHeight
      ctx.fillRect(startX + 1, footerTop, boxWidth - 2, footerHeight)

      ctx.strokeStyle = borderColor
      ctx.beginPath()
      ctx.moveTo(startX + 1, currentY + headerHeight + 1)
      ctx.lineTo(startX + boxWidth - 1, currentY + headerHeight + 1)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(startX + 1, footerTop)
      ctx.lineTo(startX + boxWidth - 1, footerTop)
      ctx.stroke()

      ctx.fillStyle = '#000000'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        headerText,
        startX + padding,
        currentY + headerHeight / 2 + 1,
      )

      rowTexts.forEach((value, index) => {
        const rowTop = currentY + headerHeight + index * rowHeight
        const indexText = String(index + 1)
        const rowText = this.truncateTextToWidth(
          ctx,
          String(value),
          Math.max(
            20,
            boxWidth -
              padding * 2 -
              maxIndexWidth -
              indexGap -
              chipPaddingX * 2,
          ),
        )

        const indexX = startX + padding
        const indexY = rowTop + rowHeight / 2 + 1
        ctx.fillStyle = '#000000'
        ctx.fillText(indexText, indexX, indexY)

        const chipX = indexX + maxIndexWidth + indexGap
        const chipAvailableWidth = Math.max(
          chipMinWidth,
          boxWidth - padding - (chipX - startX),
        )
        const chipTextWidth = ctx.measureText(rowText).width
        const chipWidth = Math.min(
          chipAvailableWidth,
          Math.max(chipMinWidth, chipTextWidth + chipPaddingX * 2),
        )
        const chipHeight = rowHeight - 4
        const chipY = rowTop + (rowHeight - chipHeight) / 2

        ctx.fillStyle = chipColor
        ctx.strokeStyle = chipBorderColor
        ctx.lineWidth = 1
        ctx.beginPath()
        this.drawRoundedRectPath(ctx, chipX, chipY, chipWidth, chipHeight, 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.fillText(rowText, chipX + chipPaddingX, indexY)
      })

      ctx.fillStyle = '#000000'
      ctx.fillText(footerText, startX + padding, footerTop + footerHeight / 2)

      currentY += boxHeight + listGap
    })

    ctx.restore()
  }

  private truncateTextToWidth(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string {
    if (ctx.measureText(text).width <= maxWidth) {
      return text
    }

    const ellipsis = '…'
    let truncated = text
    while (truncated.length > 0) {
      const candidate = `${truncated}${ellipsis}`
      if (ctx.measureText(candidate).width <= maxWidth) {
        return candidate
      }
      truncated = truncated.slice(0, -1)
    }

    return ellipsis
  }

  private displayInfo(result: ExecutionResult): void {
    if (!this.infoDiv) return

    let html = `<div class="space-y-2"><p><strong>Position&nbsp:</strong> x=${Math.round(result.finalX - 200)}, y=${Math.round(200 - result.finalY)}, <strong>Angle&nbsp:</strong> ${Math.round(result.finalAngle) % 360}°</p>`
    html += `<p><strong>Traces&nbsp:</strong> ${result.traces.length} ligne${result.traces.length > 1 ? 's' : ''}</p>`

    const iterations = result.repeatIterations ?? []
    if (iterations.length > 0) {
      html += '<div><strong>Itérations&nbsp;:</strong>'
      html += '<div style="margin-top:0.25rem;">'
      iterations.forEach((iteration) => {
        const label =
          iteration.mode === 'times'
            ? `${iteration.current}/${iteration.total ?? '?'}`
            : `${iteration.current}`
        const indentation = '&nbsp;'.repeat(
          Math.max(0, iteration.level - 1) * 3,
        )
        const nestedPrefix = iteration.level > 1 ? '↳ ' : ''
        html += `<div>${indentation}${nestedPrefix}<span style="font-weight:600;">boucle ${iteration.level}</span> : ${label}</div>`
      })
      html += '</div></div>'
    }

    html += '</div>'
    this.infoDiv.innerHTML = html
  }

  private displayInstruction(result: ExecutionResult): void {
    if (!this.stepDiv) return
    if (result.currentInstructionScratchHtml) {
      const indexLabel =
        typeof result.currentInstructionIndex === 'number'
          ? ` <span class="text-xs text-gray-500">(#${result.currentInstructionIndex < 0 ? '0' : String(result.currentInstructionIndex + 1)})</span>`
          : ''
      const conditionLabel = result.currentConditionText
        ? `{${result.currentConditionText}}`
        : ''
      const conditionResult =
        result.currentConditionText && result.currentConditionResult !== null
          ? ` <span style="font-weight:700;color:${orangeMathalea};">${result.currentConditionResult ? 'vrai' : 'faux'}</span>`
          : ''
      const conditionHtml = conditionLabel
        ? ` <span class="font-semibold">${conditionLabel}${conditionResult ? ` &nbsp;&rArr;&nbsp;${conditionResult}` : ''}</span>`
        : ''
      this.stepDiv.innerHTML =
        '<span class="font-semibold">Instruction :</span>' +
        indexLabel +
        conditionHtml +
        result.currentInstructionScratchHtml
      renderScratchDiv(this.stepDiv)
    } else {
      const mappedInstructionText = this.getMappedInstructionText(
        result.currentInstructionIndex,
      )
      const fallbackInstruction = result.currentInstruction
        ? this.normalizeText(result.currentInstruction)
        : ''
      const instructionText = fallbackInstruction || mappedInstructionText || ''
      this.stepDiv.textContent = instructionText
    }
  }

  private startProgram(): void {
    if (this.isHardStopped || this.isRunning) {
      return
    }
    this.logMappingDebug('run/startProgram', {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isHardStopped: this.isHardStopped,
      codeLength: this.scratchCode.length,
    })
    this.playPauseButton?.blur()
    this.interpreter = new ScratchInterpreter(200, 200, 90)
    this.interpreter.setExecutionDelay(this.delayMs)
    this.parseAndDisplayCode()
    this.runAnimatedSimulation().catch((error) => {
      this.logMappingDebug('run/error', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
      })
      if (this.stepDiv) {
        this.stepDiv.textContent =
          "Erreur au démarrage de l'exécution. Ouvrir la console pour les détails."
      }
      this.isRunning = false
      this.isPaused = false
      this.updateControls()
    })
  }

  private togglePlayPause(): void {
    if (this.isHardStopped) {
      return
    }

    if (!this.isRunning) {
      this.startProgram()
    } else if (this.isPaused) {
      this.isPaused = false
      const resolvers = this.pauseResolvers
      this.pauseResolvers = []
      resolvers.forEach((resolve) => resolve())
    } else {
      this.isPaused = true
    }
    this.updateControls()
  }

  private resetProgramToStart(): void {
    this.resetModalContent()
  }

  private runProgramToEnd(): void {
    if (this.isHardStopped) {
      return
    }

    this.delayMs = 0
    if (this.interpreter) {
      this.interpreter.setExecutionDelay(0)
    }

    if (!this.isRunning) {
      this.startProgram()
      return
    }

    if (this.isPaused) {
      this.isPaused = false
      const resolvers = this.pauseResolvers
      this.pauseResolvers = []
      resolvers.forEach((resolve) => resolve())
    }

    this.updateControls()
  }

  private speedUpExecution(): void {
    if (this.delayMs <= 0) {
      return
    }
    this.delayMs = Math.max(1, Math.floor(this.delayMs / 2))
    if (this.interpreter) {
      this.interpreter.setExecutionDelay(this.delayMs)
    }
    this.updateControls()
  }

  private slowDownExecution(): void {
    this.delayMs = Math.min(32000, this.delayMs * 2)
    if (this.interpreter) {
      this.interpreter.setExecutionDelay(this.delayMs)
    }
    this.updateControls()
  }

  private hardStopExecution(): void {
    if (!this.isRunning && this.isHardStopped) {
      return
    }

    this.simulationRunId += 1
    this.isRunning = false
    this.isPaused = false
    this.isHardStopped = true
    const resolvers = this.pauseResolvers
    this.pauseResolvers = []
    resolvers.forEach((resolve) => resolve())
    if (this.interpreter) {
      this.interpreter.stopExecution()
    }
    this.interpreter = null

    if (this.stepDiv) {
      this.stepDiv.textContent =
        'Exécution stoppée. Cliquez sur |<< pour réinitialiser.'
    }

    this.updateControls()
  }

  private updateControls(): void {
    if (!this.playPauseButton) return

    if (this.isRunning && !this.isPaused) {
      this.playPauseButton.textContent = '||'
      this.playPauseButton.className = 'btn btn-sm btn-outline btn-warning'
    } else if (this.isPaused) {
      this.playPauseButton.textContent = '▶'
      this.playPauseButton.className = 'btn btn-sm btn-outline btn-success'
    } else {
      this.playPauseButton.textContent = '▶'
      this.playPauseButton.className = 'btn btn-sm btn-outline'
    }

    if (this.playPauseButton) {
      this.playPauseButton.disabled = this.isHardStopped
    }
    if (this.greenFlagButton) {
      this.greenFlagButton.disabled = this.isHardStopped
    }
    if (this.runToEndButton) {
      this.runToEndButton.disabled = this.isHardStopped
    }
    if (this.speedUpButton) {
      this.speedUpButton.disabled = this.isHardStopped || this.delayMs <= 0
    }
    if (this.slowDownButton) {
      this.slowDownButton.disabled = this.isHardStopped
    }
  }

  private async askForUserInput(prompt: string): Promise<string> {
    return new Promise<string>((resolve) => {
      if (!this.modal) {
        resolve('')
        return
      }

      // Créer une couche d'overlay semi-transparente à l'intérieur de la modale
      const overlay = document.createElement('div')
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `

      // Créer la boîte d'input
      const inputBox = document.createElement('div')
      inputBox.style.cssText = `
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        padding: 2rem;
        width: 90%;
        max-width: 400px;
        position: relative;
        z-index: 1001;
      `

      const title = document.createElement('h3')
      title.style.cssText = `
        font-weight: bold;
        font-size: 1.125rem;
        margin-bottom: 1rem;
      `
      title.textContent = prompt || 'Entrez une valeur'

      const input = document.createElement('input')
      input.type = 'text'
      input.style.cssText = `
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        font-size: 1rem;
        box-sizing: border-box;
      `
      input.placeholder = 'Votre réponse'
      input.autofocus = true

      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = `
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      `

      const cancelButton = document.createElement('button')
      cancelButton.style.cssText = `
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 0.375rem;
        background: white;
        cursor: pointer;
        font-size: 1rem;
      `
      cancelButton.textContent = 'Annuler'
      cancelButton.addEventListener('click', () => {
        overlay.remove()
        resolve('')
      })

      const submitButton = document.createElement('button')
      submitButton.style.cssText = `
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        background: #3b82f6;
        color: white;
        cursor: pointer;
        font-size: 1rem;
      `
      submitButton.textContent = 'OK'
      submitButton.addEventListener('click', () => {
        overlay.remove()
        resolve(input.value)
      })

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          overlay.remove()
          resolve(input.value)
        } else if (e.key === 'Escape') {
          overlay.remove()
          resolve('')
        }
      })

      // Fermer aussi si on clique sur l'overlay
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove()
          resolve('')
        }
      })

      buttonContainer.appendChild(cancelButton)
      buttonContainer.appendChild(submitButton)

      inputBox.appendChild(title)
      inputBox.appendChild(input)
      inputBox.appendChild(buttonContainer)

      overlay.appendChild(inputBox)

      // Ajouter l'overlay à la modale (pas à document.body)
      this.modal!.appendChild(overlay)
    })
  }
}

// Enregistrer le Web Component (uniquement si pas déjà défini)
if (
  typeof customElements !== 'undefined' &&
  !customElements.get('scratch-simulator')
) {
  customElements.define('scratch-simulator', ScratchSimulator)
}

export function createScratchSimulatorElement(
  code: string,
  delayMs: number = 500,
  insertProgramme: boolean = true,
): string {
  if (!context.isHtml) return ''
  return `<scratch-simulator delay="${String(delayMs)}" code="${code}">${insertProgramme ? scratchblock(code) : ''}</scratch-simulator>
     `
}
