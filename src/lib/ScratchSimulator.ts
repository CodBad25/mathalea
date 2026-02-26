/**
 * Web Component pour simuler et exécuter des programmes Scratch
 * S'active automatiquement quand les éléments <scratch-simulator> sont ajoutés au DOM
 * @author Jean-Claude Lhote
 */

import { context } from '../modules/context'
import { scratchblock } from '../modules/scratchblock'
import { orangeMathalea } from './colors'
import { renderScratchDiv } from './renderScratch'
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
  private interpreter: ScratchInterpreter | null = null
  private scratchCode: string = ''
  private modal: HTMLDialogElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private canvasWrapper: HTMLDivElement | null = null
  private hasCanvasRelevantBlocks: boolean = false
  private stepDiv: HTMLDivElement | null = null
  private infoDiv: HTMLDivElement | null = null
  private codeDiv: HTMLDivElement | null = null
  private codeBlocks: CodeBlockNode[] = []
  private allRenderedBlocks: CodeBlockNode[] = []
  private highlightedExecutionIndex: number | null = null
  private highlightedBlockElement: SVGGElement | null = null
  private customBlockDefinitions: Record<string, CodeBlockNode[]> = {}
  private customDefinitionGroups: Set<SVGGElement> = new Set()
  private conditionBlockElements: Set<SVGGElement> = new Set()
  private blockCacheAttempts: number = 0
  private executionIndexToBlockId: Map<number, string> = new Map() // Map: currentInstructionIndex -> id du bloc SVG
  private delayMs: number = 2000
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

    this.interpreter.triggerKeyPress(event.key)
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
    document.addEventListener('keydown', this.handleModalKeydown)

    const button = document.createElement('button')
    button.textContent = '▶ Exécuter'
    button.className = 'btn btn-sm btn-primary mt-2'
    this.makePointerOnlyButton(button)
    button.addEventListener('click', () => this.openModal())

    this.appendChild(button)
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.handleModalKeydown)
  }

  // gestion du modal et de son contenu
  private openModal(): void {
    if (!this.modal) {
      this.createModal()
    }
    if (this.modal) {
      this.hasCanvasRelevantBlocks = this.codeHasCanvasBlocks(this.scratchCode)
      if (this.canvasWrapper) {
        this.canvasWrapper.style.display = this.hasCanvasRelevantBlocks
          ? 'block'
          : 'none'
      }
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
    canvasWrapper.style.display = this.hasCanvasRelevantBlocks
      ? 'block'
      : 'none'
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

    const scratchblockHtml = scratchblock(this.scratchCode)
    if (scratchblockHtml !== false) {
      this.codeDiv.innerHTML = scratchblockHtml
    } else {
      const pre = document.createElement('pre')
      pre.classList.add('blocks')
      pre.textContent = this.scratchCode
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

    const scratchblockHtml = scratchblock(this.scratchCode)
    if (scratchblockHtml !== false) {
      this.codeDiv.innerHTML = scratchblockHtml
    } else {
      const pre = document.createElement('pre')
      pre.classList.add('blocks')
      pre.textContent = this.scratchCode
      this.codeDiv.appendChild(pre)
    }

    // Rendre le scratchblock et mettre en cache les blocs
    requestAnimationFrame(() => {
      renderScratchDiv(this.codeDiv!)
      this.cacheRenderedBlocks()
    })
  }

  // Highlighting des blocs pendant l'exécution
  private highlightCurrentInstruction(
    currentInstructionHtml: string,
    currentInstructionIndex?: number,
    currentConditionText?: string,
  ): void {
    if (this.codeBlocks.length === 0) {
      this.cacheRenderedBlocks()
    }

    let targetBlock: CodeBlockNode | null = null
    let executionIndex: number | null = null
    let matchedElement: SVGGElement | null = null
    const normalizedInstruction = this.extractInstructionTextFromHtml(
      currentInstructionHtml,
    )
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
          const mappedText = this.getBlockOwnText(matchedElement)
          if (normalizedInstruction && mappedText !== normalizedInstruction) {
            resolveRuntimeMapping()
            const correctedBlockId = this.executionIndexToBlockId.get(
              currentInstructionIndex,
            )
            const correctedSelector = correctedBlockId
              ? this.getSelectorFromBlockId(correctedBlockId)
              : null
            matchedElement = correctedSelector
              ? this.codeDiv.querySelector<SVGGElement>(correctedSelector)
              : null
          }
        }

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

    const customDefinitions = this.extractCustomBlockDefinitions(svg)
    this.customBlockDefinitions = customDefinitions.definitions
    this.customDefinitionGroups = customDefinitions.definitionGroups
    this.allRenderedBlocks = groups
      .filter(
        (group) =>
          !this.customDefinitionGroups.has(group) &&
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

  // Trouver l'ancêtre bloc le plus proche d'un groupe donné parmi un ensemble de candidats
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

  // Identifier les définitions de blocs personnalisés dans le SVG rendu, en les associant à leur nom et à leurs blocs enfants pour pouvoir les exécuter lors de l'appel du bloc personnalisé
  private extractCustomBlockDefinitions(root: SVGElement): {
    definitions: Record<string, CodeBlockNode[]>
    definitionGroups: Set<SVGGElement>
  } {
    const definitions: Record<string, CodeBlockNode[]> = {}
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
      const customName = this.getCustomDefinitionName(headerGroup)
      if (!customName) return

      const bodyGroups = childGroups
        .slice(headerIndex + 1)
        .filter((group) => this.isBlockGroup(group))
      const bodyNodes = bodyGroups.map((group) => this.buildBlockTree(group))

      definitions[customName] = bodyNodes
      definitionGroups.add(headerGroup)
      bodyGroups.forEach((group) => definitionGroups.add(group))
    })

    return { definitions, definitionGroups }
  }

  // Extraire le nom d'une définition de bloc personnalisé à partir du texte de son groupe d'en-tête, en normalisant le texte pour gérer les variations d'espacement et de casse
  private getCustomDefinitionName(group: SVGGElement): string {
    const raw = this.getBlockOwnText(group)
    const normalized = this.normalizeText(raw)
    const withoutPrefix = normalized
      .replace(/^définir\s+/, '')
      .replace(/^definir\s+/, '')
    return withoutPrefix.trim()
  }

  // Extraire le texte d'un groupe de bloc en ne prenant que les éléments textuels qui lui appartiennent directement (en ignorant les textes des blocs imbriqués) pour éviter les confusions dans les mappings exécution <-> affichage
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

  // Trouver l'ancêtre bloc le plus proche d'un nœud de texte donné pour déterminer à quel bloc appartient un texte et éviter les confusions avec les textes des blocs imbriqués
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

  // Trouver l'ancêtre bloc le plus proche d'un groupe donné en remontant dans la hiérarchie DOM jusqu'à la racine SVG, pour déterminer la structure des blocs imbriqués et faire le lien entre rendu et logique d'exécution
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

  // Extraire les valeurs de translation X et Y d'un groupe de bloc pour les utiliser comme critère de fallback dans le tri des blocs lorsque les positions absolues ne sont pas fiables, afin de déterminer l'ordre d'exécution des blocs dans le code
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

  // Comparer la position de deux blocs pour les trier dans l'ordre d'exécution, en utilisant d'abord les positions absolues à l'écran, puis les translations comme critère de fallback lorsque les positions absolues ne sont pas fiables, afin de gérer les différentes manières dont les blocs peuvent être rendus dans le SVG
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

  // helpers pour analyser le code et faire le lien entre blocs rendus et instructions à exécuter
  private codeHasCanvasBlocks(code: string): boolean {
    return /\\block(?:move|pen|look)\b/.test(code)
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
    const text = this.normalizeText(this.getBlockOwnText(group))
    return text.includes('définir') || text.includes('definir')
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

  // Normaliser le texte d'un bloc pour faciliter les correspondances entre instructions à exécuter et blocs rendus, en gérant les variations d'espacement, de casse, les différentes manières de formuler une même instruction, et en retirant les éléments de texte qui ne sont pas pertinents pour l'identification de l'instruction (comme les crochets autour des nombres ou les parenthèses)
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

  // Attribution d'IDs uniques aux groupes de blocs rendus pour pouvoir les sélectionner de manière fiable lors du mapping entre exécution et affichage, en utilisant des UUID lorsque disponibles ou en générant des IDs basés sur le timestamp et un nombre aléatoire comme fallback
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

  // Recherche des blocks rendus à partir de l'index d'exécution en utilisant les IDs attribués pour faire le lien entre exécution et affichage de manière fiable, même lorsque les positions ou les textes des blocs ne permettent pas de faire le lien de manière déterministe
  private getSelectorFromBlockId(blockId: string): string {
    return `#${this.escapeCssIdentifier(blockId)}`
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

  private extractInstructionTextFromHtml(html: string): string {
    if (!html) return ''
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return this.normalizeText(tempDiv.textContent || '')
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

    candidateBlocks.forEach((block, order) => {
      const blockId = block.element.id || this.generateBlockId()
      if (!block.element.id) {
        block.element.id = blockId
        block.element.setAttribute('data-scratch-block-id', blockId)
      }
      idsByOrder.set(order, blockId)

      const normalizedText = this.normalizeText(block.text)
      allTexts.push({ order, text: normalizedText })

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
    this.executionIndexToBlockId.clear()
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
    const exactOrdersByText = new Map<string, number[]>()
    const allTexts: Array<{ order: number; text: string }> = []

    candidateBlocks.forEach((block, order) => {
      const blockId = block.element.id || this.generateBlockId()
      if (!block.element.id) {
        block.element.id = blockId
        block.element.setAttribute('data-scratch-block-id', blockId)
      }
      idsByOrder.set(order, blockId)

      const normalizedText = this.normalizeText(block.text)
      allTexts.push({ order, text: normalizedText })

      const bucket = exactOrdersByText.get(normalizedText) || []
      bucket.push(order)
      exactOrdersByText.set(normalizedText, bucket)
    })

    const dryInterpreter = new ScratchInterpreter(200, 200, 90)
    const seenInstructionIndexes = new Set<number>()
    let lastOrder = -1
    await dryInterpreter.executeAnimated(
      this.scratchCode,
      async () => {
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
        const instructionText = this.extractInstructionTextFromHtml(
          state.currentInstructionScratchHtml || '',
        )
        const isConditionStep = Boolean(state.currentConditionText)

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
              const superNormalizedText = text.replace(/\s+/g, '').toLowerCase()
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
          if (isConditionStep) {
            return
          }
          const fallbackOrder = this.getNextOrderAfter(
            lastOrder,
            candidateBlocks.length,
          )
          const fallbackId = idsByOrder.get(fallbackOrder)
          if (fallbackId) {
            this.executionIndexToBlockId.set(index, fallbackId)
            lastOrder = fallbackOrder
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
      },
      0,
      { skipWaitBlocks: true },
    )
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
          state.currentInstructionIndex,
          state.currentConditionText,
        )
      })
    }

    await this.interpreter.executeAnimated(
      this.scratchCode,
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
      this.highlightCurrentInstruction('', -1)
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
    this.executionIndexToBlockId.clear()

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

    const shouldShowCanvas =
      result.traces.length > 0 || this.hasCanvasRelevantBlocks
    if (this.canvasWrapper) {
      this.canvasWrapper.style.display = shouldShowCanvas ? 'block' : 'none'
    }
    if (!shouldShowCanvas) return

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
    ctx.strokeStyle = '#0066cc'
    ctx.lineWidth = 3
    result.traces.forEach((trace) => {
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

    // Variables style Scratch
    if (Object.keys(result.variables).length > 0) {
      this.drawVariables(ctx, result.variables)
    }
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
  ): void {
    const entries = Object.entries(variables)
    if (entries.length === 0) return

    ctx.save()
    ctx.font = '10px sans-serif'

    const padding = 6
    const lineHeight = 15
    const borderRadius = 5
    const startX = 5
    let currentY = 5

    entries.forEach(([name, value]) => {
      const displayText = `${name} = ${value}`
      const textWidth = ctx.measureText(displayText).width
      const boxWidth = textWidth + padding * 2
      const boxHeight = lineHeight

      // Fond orange style Scratch
      ctx.fillStyle = '#ff8c1a'
      ctx.strokeStyle = '#cf6b0e'
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

      // Texte blanc
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'middle'
      ctx.fillText(displayText, startX + padding, currentY + boxHeight / 2)

      currentY += boxHeight + 4
    })

    ctx.restore()
  }

  private displayInfo(result: ExecutionResult): void {
    if (!this.infoDiv) return

    let html = `<div class="space-y-2"><p><strong>Position&nbsp:</strong> x=${Math.round(result.finalX - 200)}, y=${Math.round(200 - result.finalY)}, <strong>Angle&nbsp:</strong> ${Math.round(result.finalAngle)}°</p>`
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
      this.stepDiv.textContent = '' // 'Instruction : -'
    }
  }

  private startProgram(): void {
    if (this.isHardStopped || this.isRunning) {
      return
    }
    this.playPauseButton?.blur()
    this.interpreter = new ScratchInterpreter(200, 200, 90)
    this.interpreter.setExecutionDelay(this.delayMs)
    this.parseAndDisplayCode()
    this.runAnimatedSimulation().catch(() => {
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
