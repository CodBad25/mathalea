/**
 * Web Component pour simuler et exécuter des programmes Scratch
 * S'active automatiquement quand les éléments <scratch-simulator> sont ajoutés au DOM
 * @author Jean-Claude Lhote
 */

import { context } from '../modules/context'
import { scratchblock } from '../modules/scratchblock'
import { renderScratchDiv } from './renderScratch'

export interface ExecutionResult {
  traces: Array<{ startX: number; startY: number; endX: number; endY: number }>
  finalX: number
  finalY: number
  finalAngle: number
  variables: Record<string, number>
  messages: string[]
  currentInstruction?: string
  currentInstructionScratchHtml?: string
  currentInstructionIndex?: number
  repeatContexts?: string[]
}

type CodeBlockNode = {
  element: SVGGElement
  text: string
  children: CodeBlockNode[]
}

export class ScratchInterpreter {
  private x: number
  private y: number
  private angle: number // en degrés Scratch, 0° = vers le haut, 90° = vers la droite
  private penDown: boolean = false
  private variables: Record<string, number> = {}
  private customBlocks: Record<string, string> = {} // Blocs personnalisés
  private traces: Array<{
    startX: number
    startY: number
    endX: number
    endY: number
  }> = []

  private messages: string[] = []
  private currentInstruction: string = ''
  private currentInstructionScratchHtml: string = ''
  private currentInstructionIndex: number = -1
  private repeatContextStack: string[] = []
  private onUpdate?: () => void | Promise<void>

  constructor(startX = 0, startY = 0, startAngle = 0) {
    this.x = startX
    this.y = startY
    this.angle = startAngle
  }

  execute(scratchCode: string): ExecutionResult {
    this.traces = []
    this.messages = []
    this.variables = {}
    this.customBlocks = {}
    this.currentInstructionIndex = -1

    // D'abord, extraire les définitions de blocs personnalisés
    const codeWithoutDefinitions = this.parseCustomBlockDefinitions(scratchCode)

    // Parser LaTeX Scratch et exécution
    this.parseAndExecute(codeWithoutDefinitions)

    return {
      traces: this.traces,
      finalX: this.x,
      finalY: this.y,
      finalAngle: this.angle,
      variables: this.variables,
      messages: this.messages,
      currentInstruction: this.currentInstruction,
      currentInstructionScratchHtml: this.currentInstructionScratchHtml,
      currentInstructionIndex: this.currentInstructionIndex,
      repeatContexts: [...this.repeatContextStack],
    }
  }

  async executeAnimated(
    scratchCode: string,
    onUpdate: () => void | Promise<void>,
    delayMs: number = 500,
  ): Promise<ExecutionResult> {
    this.traces = []
    this.messages = []
    this.variables = {}
    this.customBlocks = {}
    this.onUpdate = onUpdate
    this.currentInstructionIndex = -1

    const codeWithoutDefinitions = this.parseCustomBlockDefinitions(scratchCode)

    await this.parseAndExecuteAnimated(codeWithoutDefinitions, delayMs)

    this.onUpdate = undefined

    return {
      traces: this.traces,
      finalX: this.x,
      finalY: this.y,
      finalAngle: this.angle,
      variables: this.variables,
      messages: this.messages,
      currentInstruction: this.currentInstruction,
      currentInstructionScratchHtml: this.currentInstructionScratchHtml,
      currentInstructionIndex: this.currentInstructionIndex,
      repeatContexts: [...this.repeatContextStack],
    }
  }

  getCurrentState(): ExecutionResult {
    return {
      traces: this.traces,
      finalX: this.x,
      finalY: this.y,
      finalAngle: this.angle,
      variables: this.variables,
      messages: this.messages,
      currentInstruction: this.currentInstruction,
      currentInstructionScratchHtml: this.currentInstructionScratchHtml,
      currentInstructionIndex: this.currentInstructionIndex,
      repeatContexts: [...this.repeatContextStack],
    }
  }

  private parseCustomBlockDefinitions(code: string): string {
    // Extraire les définitions de blocs personnalisés
    // Format: \initmoreblocks{définir \namemoreblocks{nom}}
    // suivi des instructions qui composent ce bloc

    const initRegex =
      /\\initmoreblocks\{définir\s+\\namemoreblocks\{([^}]+)\}\}/g
    let match
    let cleanedCode = code

    while ((match = initRegex.exec(code)) !== null) {
      const blockName = match[1]
      const defStart = match.index + match[0].length

      // Trouver la fin de la définition : chercher le prochain bloc "principal"
      // (aller à, blockpen, ou blockrepeat au niveau racine)
      const mainBlockRegex =
        /\\blockmove\{aller à|\\blockpen\{|\\blockrepeat\{répéter/g
      mainBlockRegex.lastIndex = defStart

      const mainBlockMatch = mainBlockRegex.exec(code)
      const defEnd = mainBlockMatch ? mainBlockMatch.index : code.length

      // Extraire le code de la définition
      const blockCode = code.substring(defStart, defEnd).trim()
      this.customBlocks[blockName] = blockCode

      // Retirer cette définition du code à exécuter
      cleanedCode = cleanedCode.replace(code.substring(match.index, defEnd), '')
    }

    return cleanedCode
  }

  private parseAndExecute(code: string): void {
    let index = 0

    while (index < code.length) {
      // Chercher le premier blockrepeat
      const repeatStart = code.indexOf('\\blockrepeat{', index)

      if (repeatStart === -1) {
        // Pas de repeat trouvé, exécuter le reste
        if (index < code.length) {
          this.parseNonRepeatBlocks(code.substring(index))
        }
        break
      }

      // Exécuter ce qui précède le repeat
      if (repeatStart > index) {
        this.parseNonRepeatBlocks(code.substring(index, repeatStart))
      }

      // Trouver la fin de "répéter X fois}" pour localiser le début du bloc de contenu
      const foisEnd = code.indexOf('fois}', repeatStart)
      if (foisEnd === -1) break // Malformed

      // Le bloc de contenu commence juste après "fois}{"
      const contentStart = code.indexOf('{', foisEnd + 5)
      if (contentStart === -1) break // Malformed

      // Extraire le nombre de répétitions (entre \blockrepeat{ et fois})
      const repeatParamStart = repeatStart + 13 // Après "\blockrepeat{"
      const repeatParamEnd = foisEnd + 4 // Position de "}" dans "fois}"
      const repeatContent = code.substring(repeatParamStart, repeatParamEnd)
      const times = this.extractNumber(repeatContent)

      // Trouver la vraie fin du bloc (en comptant les accolades)
      let braceCount = 1
      let pos = contentStart + 1
      let innerCodeEnd = -1

      while (pos < code.length && braceCount > 0) {
        if (code[pos] === '{' && code[pos - 1] !== '\\') {
          braceCount++
        } else if (code[pos] === '}' && code[pos - 1] !== '\\') {
          braceCount--
          if (braceCount === 0) {
            innerCodeEnd = pos
          }
        }
        pos++
      }

      if (innerCodeEnd === -1) {
        window.notify('Erreur de syntaxe : bloc repeat mal formé', {
          code: code.slice(repeatStart, pos),
        })
        break
      }

      // Extraire le code intérieur (entre { et })
      const innerCode = code.substring(contentStart + 1, innerCodeEnd).trim()

      // Exécuter le bloc repeat
      for (let i = 0; i < times; i++) {
        this.parseAndExecute(innerCode)
      }

      index = innerCodeEnd + 1
    }
  }

  private async parseAndExecuteAnimated(
    code: string,
    delayMs: number,
  ): Promise<void> {
    let index = 0

    while (index < code.length) {
      const repeatStart = code.indexOf('\\blockrepeat{', index)

      if (repeatStart === -1) {
        if (index < code.length) {
          await this.parseNonRepeatBlocksAnimated(
            code.substring(index),
            delayMs,
          )
        }
        break
      }

      if (repeatStart > index) {
        await this.parseNonRepeatBlocksAnimated(
          code.substring(index, repeatStart),
          delayMs,
        )
      }

      const foisEnd = code.indexOf('fois}', repeatStart)
      if (foisEnd === -1) break

      const contentStart = code.indexOf('{', foisEnd + 5)
      if (contentStart === -1) break

      const repeatParamStart = repeatStart + 13
      const repeatParamEnd = foisEnd + 4
      const repeatContent = code.substring(repeatParamStart, repeatParamEnd)
      const times = this.extractNumber(repeatContent)

      let braceCount = 1
      let pos = contentStart + 1
      let innerCodeEnd = -1

      while (pos < code.length && braceCount > 0) {
        if (code[pos] === '{' && code[pos - 1] !== '\\\\') {
          braceCount++
        } else if (code[pos] === '}' && code[pos - 1] !== '\\\\') {
          braceCount--
          if (braceCount === 0) {
            innerCodeEnd = pos
          }
        }
        pos++
      }

      if (innerCodeEnd === -1) break

      const innerCode = code.substring(contentStart + 1, innerCodeEnd).trim()

      for (let i = 0; i < times; i++) {
        this.repeatContextStack.push(
          `Répéter ${times} fois (itération ${i + 1}/${times})`,
        )
        await this.parseAndExecuteAnimated(innerCode, delayMs)
        this.repeatContextStack.pop()
      }

      index = innerCodeEnd + 1
    }
  }

  private parseNonRepeatBlocks(code: string): void {
    // Identifier les zones des blockrepeat à ignorer
    const ignoreRanges: Array<{ start: number; end: number }> = []

    const repeatRegex = /\\blockrepeat\{([^}]+)\}\s*\{\s*([\s\S]*?)\n\s*\}/g
    let repeatMatch = repeatRegex.exec(code)
    while (repeatMatch !== null) {
      ignoreRanges.push({
        start: repeatMatch.index,
        end: repeatMatch.index + repeatMatch[0].length,
      })
      repeatMatch = repeatRegex.exec(code)
    }

    // Parser les blocs, en ignorant ceux qui sont dans les zones de blockrepeat
    const blockRegex = /\\block(\w+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
    let blockMatch = blockRegex.exec(code)

    while (blockMatch !== null) {
      const blockType = blockMatch[1].toLowerCase()
      const content = blockMatch[2]

      // Vérifier que ce bloc n'est pas à l'intérieur d'un blockrepeat
      const isInRepeatZone = ignoreRanges.some(
        (range) =>
          blockMatch !== null &&
          blockMatch.index >= range.start &&
          blockMatch.index + blockMatch[0].length <= range.end,
      )

      if (!isInRepeatZone && blockType !== 'repeat') {
        this.executeBlock(blockType, content, blockMatch[0])
      }

      blockMatch = blockRegex.exec(code)
    }
  }

  private async parseNonRepeatBlocksAnimated(
    code: string,
    delayMs: number,
  ): Promise<void> {
    // Identifier les zones des blockrepeat à ignorer
    const ignoreRanges: Array<{ start: number; end: number }> = []

    const repeatRegex = /\\blockrepeat\{([^}]+)\}\s*\{\s*([\s\S]*?)\n\s*\}/g
    let repeatMatch = repeatRegex.exec(code)
    while (repeatMatch !== null) {
      ignoreRanges.push({
        start: repeatMatch.index,
        end: repeatMatch.index + repeatMatch[0].length,
      })
      repeatMatch = repeatRegex.exec(code)
    }

    // Parser les blocs, en ignorant ceux qui sont dans les zones de blockrepeat
    const blockRegex = /\\block(\w+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
    let blockMatch = blockRegex.exec(code)

    while (blockMatch !== null) {
      const blockType = blockMatch[1].toLowerCase()
      const content = blockMatch[2]

      // Vérifier que ce bloc n'est pas à l'intérieur d'un blockrepeat
      const isInRepeatZone = ignoreRanges.some(
        (range) =>
          blockMatch !== null &&
          blockMatch.index >= range.start &&
          blockMatch.index + blockMatch[0].length <= range.end,
      )

      if (!isInRepeatZone && blockType !== 'repeat') {
        // Afficher l'instruction
        this.prepareBlockDisplay(blockType, content, blockMatch[0])
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }

        // Attendre le délai
        await new Promise((resolve) => setTimeout(resolve, delayMs / 2))

        // Exécuter l'action
        await this.executeBlockAction(blockType, content, delayMs)
        // Afficher les infos mises à jour
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
        // Attendre le délai
        await new Promise((resolve) => setTimeout(resolve, delayMs / 2))
      }

      blockMatch = blockRegex.exec(code)
    }
  }

  private prepareBlockDisplay(
    type: string,
    content: string,
    rawBlock?: string,
  ): void {
    this.currentInstructionIndex += 1
    this.currentInstruction = this.humanizeInstruction(type, content)
    this.currentInstructionScratchHtml = this.renderScratchBlock(
      type,
      content,
      rawBlock,
    )
  }

  private async executeBlockAction(
    type: string,
    content: string,
    delayMs: number = 0,
  ): Promise<void> {
    if (type === 'move' && this.isGoToInstruction(content)) {
      const target = this.extractGoToCoordinates(content)
      if (target) {
        this.goTo(target.x, target.y)
      }
    } else if (type === 'move' && content.includes('orienter')) {
      const angle = this.extractNumber(content)
      this.setOrientation(angle)
    } else if (type === 'move' && content.includes('avancer')) {
      const steps = this.extractNumber(content)
      this.moveForward(steps)
    } else if (type === 'move' && content.includes('tourner')) {
      const angle = this.extractNumber(content)
      if (content.includes('turnright')) {
        this.turn(angle)
      } else if (content.includes('turnleft')) {
        this.turn(-angle)
      }
    } else if (type === 'moreblocks') {
      const blockName = content.trim()
      if (this.customBlocks[blockName]) {
        await this.parseAndExecuteAnimated(
          this.customBlocks[blockName],
          delayMs,
        )
      }
    } else if (type === 'variable') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\selectmenu\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : 'compteur'
      this.variables[varName] = num
    } else if (type === 'change') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\ovalvariable\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : 'compteur'
      this.variables[varName] = (this.variables[varName] || 0) + num
    } else if (type === 'look') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\ovalvariable\{(\w+)\}/)
      if (varMatch) {
        const varName = varMatch[1]
        this.messages.push(
          String(
            this.variables[varName] !== undefined
              ? this.variables[varName]
              : num,
          ),
        )
      } else {
        this.messages.push(String(num))
      }
    } else if (type === 'pen') {
      if (content.includes('position') || content.includes('écriture')) {
        this.penDown = true
      } else if (content.includes('relever')) {
        this.penDown = false
      }
    }
  }

  private executeBlock(type: string, content: string, rawBlock?: string): void {
    this.prepareBlockDisplay(type, content, rawBlock)
    // Exécuter synchronement (pour parseNonRepeatBlocks non-animé)
    if (type === 'move' && this.isGoToInstruction(content)) {
      const target = this.extractGoToCoordinates(content)
      if (target) {
        this.goTo(target.x, target.y)
      }
    } else if (type === 'move' && content.includes('orienter')) {
      const angle = this.extractNumber(content)
      this.setOrientation(angle)
    } else if (type === 'move' && content.includes('avancer')) {
      const steps = this.extractNumber(content)
      this.moveForward(steps)
    } else if (type === 'move' && content.includes('tourner')) {
      const angle = this.extractNumber(content)
      if (content.includes('turnright')) {
        this.turn(angle)
      } else if (content.includes('turnleft')) {
        this.turn(-angle)
      }
    } else if (type === 'moreblocks') {
      const blockName = content.trim()
      if (this.customBlocks[blockName]) {
        this.parseAndExecute(this.customBlocks[blockName])
      }
    } else if (type === 'variable') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\selectmenu\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : 'compteur'
      this.variables[varName] = num
    } else if (type === 'change') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\ovalvariable\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : 'compteur'
      this.variables[varName] = (this.variables[varName] || 0) + num
    } else if (type === 'look') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\ovalvariable\{(\w+)\}/)
      if (varMatch) {
        const varName = varMatch[1]
        this.messages.push(
          String(
            this.variables[varName] !== undefined
              ? this.variables[varName]
              : num,
          ),
        )
      } else {
        this.messages.push(String(num))
      }
    } else if (type === 'pen') {
      if (content.includes('position') || content.includes('écriture')) {
        this.penDown = true
      } else if (content.includes('relever')) {
        this.penDown = false
      }
    }
  }

  private humanizeInstruction(type: string, content: string): string {
    if (type === 'move' && this.isGoToInstruction(content)) {
      const target = this.extractGoToCoordinates(content)
      if (target) {
        return `Aller a x:${target.x} y:${target.y}`
      }
      return 'Aller a x:? y:?'
    }

    if (type === 'move' && content.includes('orienter')) {
      return `S'orienter a ${this.extractNumber(content)} degres`
    }

    if (type === 'move' && content.includes('avancer')) {
      return `Avancer de ${this.extractNumber(content)} pas`
    }

    if (type === 'move' && content.includes('tourner')) {
      const angle = this.extractNumber(content)
      const direction = content.includes('turnright') ? 'droite' : 'gauche'
      return `Tourner a ${direction} de ${angle} degres`
    }

    if (type === 'moreblocks') {
      const blockName = content.trim()
      return `Bloc ${blockName}`
    }

    if (type === 'variable') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\selectmenu\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : 'compteur'
      return `Mettre ${varName} a ${num}`
    }

    if (type === 'change') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\ovalvariable\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : 'compteur'
      return `Ajouter ${num} a ${varName}`
    }

    if (type === 'look') {
      const num = this.extractNumber(content)
      const varMatch = content.match(/\\ovalvariable\{(\w+)\}/)
      const varName = varMatch ? varMatch[1] : ''
      return varName ? `Dire ${varName}` : `Dire ${num}`
    }

    if (type === 'pen') {
      if (content.includes('position') || content.includes('écriture')) {
        return "Stylo en position d'ecriture"
      } else if (content.includes('relever')) {
        return 'Relever le stylo'
      }
    }

    return 'Instruction en cours'
  }

  private renderScratchBlock(
    type: string,
    content: string,
    rawBlock?: string,
  ): string {
    const candidates = [
      rawBlock,
      `\\begin{scratch}[blocks]\n\\block${type}{${content}}\n\\end{scratch}`,
      `\\block${type}{${content}}`,
    ].filter((value): value is string => Boolean(value))

    for (const candidate of candidates) {
      const rendered = scratchblock(candidate)
      if (rendered !== false) {
        return rendered
      }
    }

    return ''
  }

  private extractNumber(str: string): number {
    const match = str.match(/\\ovalnum\{(-?\d+)\}/)
    if (match) return parseInt(match[1], 10)

    const numMatch = str.match(/-?\d+/)
    return numMatch ? parseInt(numMatch[0], 10) : 0
  }

  private isGoToInstruction(content: string): boolean {
    const result =
      /aller\s+[àa]\s*x\s*:/i.test(content) && /y\s*:/i.test(content)
    return result
  }

  private extractGoToCoordinates(
    content: string,
  ): { x: number; y: number } | null {
    const ovalMatch = content.match(
      /x\s*:\s*\\ovalnum\{(-?\d+)\}[\s\S]*?y\s*:\s*\\ovalnum\{(-?\d+)\}/i,
    )
    if (ovalMatch) {
      return {
        x: parseInt(ovalMatch[1], 10),
        y: parseInt(ovalMatch[2], 10),
      }
    }

    const plainMatch = content.match(/x\s*:\s*(-?\d+)[\s\S]*?y\s*:\s*(-?\d+)/i)
    if (plainMatch) {
      return {
        x: parseInt(plainMatch[1], 10),
        y: parseInt(plainMatch[2], 10),
      }
    }

    const allNumbers = [...content.matchAll(/-?\d+/g)]
    if (allNumbers.length >= 2) {
      return {
        x: parseInt(allNumbers[0][0], 10),
        y: parseInt(allNumbers[1][0], 10),
      }
    }

    return null
  }

  private setOrientation(angle: number): void {
    this.angle = angle
  }

  private moveForward(steps: number): void {
    const rad = (this.angle * Math.PI) / 180
    const newX = this.x + steps * Math.sin(rad)
    const newY = this.y - steps * Math.cos(rad)

    if (this.penDown) {
      this.traces.push({
        startX: this.x,
        startY: this.y,
        endX: newX,
        endY: newY,
      })
    }

    this.x = newX
    this.y = newY
  }

  private goTo(targetX: number, targetY: number): void {
    const newX = 200 + targetX
    const newY = 200 - targetY

    if (this.penDown) {
      this.traces.push({
        startX: this.x,
        startY: this.y,
        endX: newX,
        endY: newY,
      })
    }

    this.x = newX
    this.y = newY
  }

  private turn(degrees: number): void {
    this.angle += degrees
  }
}

/**
 * Web Component pour afficher et exécuter une simulation Scratch
 */
export class ScratchSimulator extends HTMLElement {
  private interpreter: ScratchInterpreter | null = null
  private scratchCode: string = ''
  private modal: HTMLDialogElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private stepDiv: HTMLDivElement | null = null
  private infoDiv: HTMLDivElement | null = null
  private repeatDiv: HTMLDivElement | null = null
  private codeDiv: HTMLDivElement | null = null
  private codeBlocks: CodeBlockNode[] = []
  private executionBlocks: CodeBlockNode[] = []
  private customBlockDefinitions: Record<string, CodeBlockNode[]> = {}
  private customDefinitionGroups: Set<SVGGElement> = new Set()
  private blockCacheAttempts: number = 0
  private delayMs: number = 2000

  connectedCallback(): void {
    this.scratchCode = this.getAttribute('code') || ''
    this.delayMs = parseInt(this.getAttribute('delay') || '500', 10)

    const button = document.createElement('button')
    button.textContent = '▶ Exécuter'
    button.className = 'btn btn-sm btn-primary mt-2'
    button.addEventListener('click', () => this.openModal())

    this.appendChild(button)
  }

  private openModal(): void {
    if (!this.modal) {
      this.createModal()
    }
    if (this.modal) {
      this.runSimulation()
      if (this.modal.showModal) {
        this.modal.showModal()
      } else {
        this.modal.style.display = 'flex'
      }
    }
  }

  private createModal(): void {
    this.modal = document.createElement('dialog')
    this.modal.className = 'modal'

    const box = document.createElement('div')
    box.className = 'modal-box max-w-6xl'

    const closeButton = document.createElement('button')
    closeButton.className =
      'btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
    closeButton.textContent = '✕'
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
      .scratch-current-block {
        filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.95))
          drop-shadow(0 0 3px rgba(250, 204, 21, 0.9));
      }
      .scratch-current-block path,
      .scratch-current-block rect,
      .scratch-current-block polygon {
        stroke: #fae015;
        stroke-width: 5;
      }
    `

    this.repeatDiv = document.createElement('div')
    this.repeatDiv.className = 'text-xs text-gray-500 mb-3'
    this.repeatDiv.id = 'execution-repeat'
    this.repeatDiv.textContent = ''

    // Conteneur pour canvas et code côte à côte
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'grid grid-cols-2 gap-4 mb-4'

    // Colonne gauche: canvas
    const canvasWrapper = document.createElement('div')
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
      'border-2 border-gray-300 bg-white p-3 overflow-y-auto max-h-96 font-mono text-sm'
    this.codeDiv.id = 'code-display'

    rightColumn.appendChild(this.codeDiv)

    contentWrapper.appendChild(canvasWrapper)
    contentWrapper.appendChild(rightColumn)

    // Parser le code scratchblock complet
    this.parseAndDisplayCode()

    this.stepDiv = document.createElement('div')
    this.stepDiv.className = 'text-sm text-gray-600 mb-2'
    this.stepDiv.id = 'execution-step'
    this.stepDiv.textContent = 'Instruction: -'

    this.infoDiv = document.createElement('div')
    this.infoDiv.className = 'text-sm text-gray-600 flex-1'
    this.infoDiv.id = 'execution-info'

    const contextDiv = document.createElement('div')
    contextDiv.className = 'grid grid-cols-1 md:grid-cols-2 gap-4'
    contextDiv.id = 'contextDiv'
    contextDiv.appendChild(this.stepDiv)
    contextDiv.appendChild(this.infoDiv)

    rightColumn.appendChild(contextDiv)

    box.appendChild(closeButton)
    box.appendChild(title)
    box.appendChild(highlightStyle)
    box.appendChild(this.repeatDiv)
    box.appendChild(contentWrapper)

    this.modal.appendChild(box)
    document.body.appendChild(this.modal)

    if (this.codeDiv) {
      renderScratchDiv(this.codeDiv)
      this.cacheRenderedBlocks()
    }
  }

  private parseAndDisplayCode(): void {
    if (!this.codeDiv) return

    this.codeBlocks = []
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

  private highlightCurrentInstruction(
    currentInstructionHtml: string,
    currentInstructionIndex?: number,
  ): void {
    if (this.codeBlocks.length === 0) {
      this.cacheRenderedBlocks()
    }

    this.clearBlockHighlights(this.codeBlocks)

    if (
      currentInstructionIndex !== undefined &&
      this.executionBlocks.length > 0
    ) {
      const index = Math.max(0, currentInstructionIndex)
      const block =
        this.executionBlocks[Math.min(index, this.executionBlocks.length - 1)]
      if (block) {
        block.element.classList.add('scratch-current-block')
        block.element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        return
      }
    }

    if (!currentInstructionHtml) return

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentInstructionHtml
    const instructionText = this.normalizeText(tempDiv.textContent || '')
    if (!instructionText) return

    const matchingBlock = this.findBlockByText(this.codeBlocks, instructionText)

    if (matchingBlock) {
      matchingBlock.element.classList.add('scratch-current-block')
      matchingBlock.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

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

    const topLevelGroups = groups.filter(
      (group) => !this.getNearestBlockAncestor(group, svg),
    )

    if (topLevelGroups.length === 0) {
      this.retryCacheRenderedBlocks()
      return
    }

    this.codeBlocks = topLevelGroups.map((group) => this.buildBlockTree(group))
    const customDefinitions = this.extractCustomBlockDefinitions(svg)
    this.customBlockDefinitions = customDefinitions.definitions
    this.customDefinitionGroups = customDefinitions.definitionGroups
    this.executionBlocks = this.buildExecutionBlocks(this.codeBlocks)
    this.blockCacheAttempts = 0
  }

  private buildBlockTree(group: SVGGElement): CodeBlockNode {
    const node: CodeBlockNode = {
      element: group,
      text: this.getBlockOwnText(group),
      children: [],
    }

    const nestedGroups = this.extractNestedBlockGroups(group)
    if (nestedGroups.length > 0) {
      node.children = nestedGroups.map((child) => this.buildBlockTree(child))
    }

    return node
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

  private getCustomDefinitionName(group: SVGGElement): string {
    const raw = this.getBlockOwnText(group)
    const normalized = this.normalizeText(raw)
    const withoutPrefix = normalized
      .replace(/^définir\s+/, '')
      .replace(/^definir\s+/, '')
    return withoutPrefix.trim()
  }

  private extractNestedBlockGroups(group: SVGGElement): SVGGElement[] {
    const children = Array.from(group.children)
    const loopArrowIndex = children.findIndex((child) => {
      if (child.tagName.toLowerCase() !== 'use') return false
      const href =
        child.getAttribute('href') || child.getAttribute('xlink:href') || ''
      return href.includes('#sb3-loopArrow')
    })

    if (loopArrowIndex === -1) return []

    const container = children
      .slice(loopArrowIndex + 1)
      .find(
        (child): child is SVGGElement => child.tagName.toLowerCase() === 'g',
      )

    if (!container) return []

    const rowGroups = Array.from(container.children).filter(
      (child): child is SVGGElement => child.tagName.toLowerCase() === 'g',
    )

    const nested = rowGroups
      .map((rowGroup) => ({
        rowGroup,
        blockGroup: this.findFirstBlockGroup(rowGroup),
      }))
      .filter(
        (
          entry,
        ): entry is {
          rowGroup: SVGGElement
          blockGroup: SVGGElement
        } => Boolean(entry.blockGroup),
      )

    nested.sort(
      (a, b) => this.getTranslateY(a.rowGroup) - this.getTranslateY(b.rowGroup),
    )

    return nested.map((entry) => entry.blockGroup)
  }

  private getBlockOwnText(group: SVGGElement): string {
    const children = Array.from(group.children)
    const loopArrowIndex = children.findIndex((child) => {
      if (child.tagName.toLowerCase() !== 'use') return false
      const href =
        child.getAttribute('href') || child.getAttribute('xlink:href') || ''
      return href.includes('#sb3-loopArrow')
    })

    const relevantChildren =
      loopArrowIndex === -1 ? children : children.slice(0, loopArrowIndex)

    const parts: string[] = []
    relevantChildren.forEach((child) => {
      if (child.tagName.toLowerCase() === 'text') {
        parts.push(child.textContent || '')
        return
      }

      const texts = Array.from(child.querySelectorAll('text'))
      texts.forEach((textEl) => parts.push(textEl.textContent || ''))
    })

    const raw = parts.join(' ').trim()
    return this.normalizeText(raw || group.textContent || '')
  }

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

  private findFirstBlockGroup(root: Element): SVGGElement | null {
    if (this.isBlockGroup(root)) return root
    const groups = Array.from(root.querySelectorAll<SVGGElement>('g')).filter(
      (group) => this.isBlockGroup(group),
    )
    return groups.length > 0 ? groups[0] : null
  }

  private getTranslateY(group: SVGGElement): number {
    const transform = group.getAttribute('transform') || ''
    const match = transform.match(/translate\(([-\d.]+)(?:[ ,]([-\d.]+))?\)/)
    if (!match) return 0
    const y = match[2] ? parseFloat(match[2]) : 0
    return Number.isNaN(y) ? 0 : y
  }

  private clearBlockHighlights(blocks: CodeBlockNode[]): void {
    blocks.forEach((block) => {
      block.element.classList.remove('scratch-current-block')
      if (block.children.length > 0) {
        this.clearBlockHighlights(block.children)
      }
    })
  }

  private findBlockByText(
    blocks: CodeBlockNode[],
    instructionText: string,
  ): CodeBlockNode | null {
    for (const block of blocks) {
      if (block.text.includes(instructionText)) {
        return block
      }

      const childMatch = this.findBlockByText(block.children, instructionText)
      if (childMatch) {
        return childMatch
      }
    }

    return null
  }

  private buildExecutionBlocks(
    nodes: CodeBlockNode[],
    includeDefinitionNodes: boolean = false,
  ): CodeBlockNode[] {
    const ordered: CodeBlockNode[] = []

    nodes.forEach((node) => {
      if (
        !includeDefinitionNodes &&
        this.customDefinitionGroups.has(node.element)
      ) {
        return
      }

      const customDefinition = this.customBlockDefinitions[node.text]
      if (customDefinition) {
        // Afficher le bloc personnalisé puis dérouler son contenu
        ordered.push(node)
        const expanded = this.buildExecutionBlocks(customDefinition, true)
        ordered.push(...expanded)
        return
      }

      if (this.isRepeatBlock(node)) {
        const times = this.extractRepeatCount(node.text)
        const children = this.buildExecutionBlocks(
          node.children,
          includeDefinitionNodes,
        )
        const iterations = Math.max(0, times)
        for (let i = 0; i < iterations; i += 1) {
          ordered.push(...children)
        }
      } else {
        ordered.push(node)
      }
    })

    return ordered
  }

  private isRepeatBlock(node: CodeBlockNode): boolean {
    return node.text.includes('répéter')
  }

  private extractRepeatCount(text: string): number {
    const match = text.match(/\b(\d+)\b/)
    if (!match) return 1
    const count = parseInt(match[1], 10)
    return Number.isNaN(count) ? 0 : count
  }

  private retryCacheRenderedBlocks(): void {
    if (this.blockCacheAttempts >= 6) return
    this.blockCacheAttempts += 1
    requestAnimationFrame(() => this.cacheRenderedBlocks())
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim().toLowerCase()
  }

  private runSimulation(): void {
    if (!this.canvas) return

    this.interpreter = new ScratchInterpreter(200, 200, 90)

    // Lancer l'exécution animée
    this.runAnimatedSimulation()
  }

  private async runAnimatedSimulation(): Promise<void> {
    if (!this.interpreter || !this.canvas) return

    // Exécuter avec animation
    await this.interpreter.executeAnimated(
      this.scratchCode,
      () => {
        const state = this.interpreter!.getCurrentState()
        requestAnimationFrame(() => {
          this.drawSimulation(state)
          this.displayInfo(state)
          this.displayInstruction(state)
          this.displayRepeatContext(state)
          this.highlightCurrentInstruction(
            state.currentInstructionScratchHtml || '',
            state.currentInstructionIndex,
          )
        })
      },
      this.delayMs,
    )

    // Affichage final
    const result = this.interpreter.getCurrentState()
    requestAnimationFrame(() => {
      this.drawSimulation(result)
      this.displayInfo(result)
      this.displayInstruction(result)
      this.displayRepeatContext(result)
      this.highlightCurrentInstruction(
        result.currentInstructionScratchHtml || '',
        result.currentInstructionIndex,
      )
    })
  }

  private drawSimulation(result: ExecutionResult): void {
    if (!this.canvas) return

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
  }

  private displayInfo(result: ExecutionResult): void {
    if (!this.infoDiv) return

    let html = `<div class="space-y-2"><p><strong>Position:</strong> x=${Math.round(result.finalX - 200)}, y=${Math.round(200 - result.finalY)}.</p>`
    html += `<p><strong>Angle:</strong> ${Math.round(result.finalAngle)}°.</p><p><strong>Traces:</strong> ${result.traces.length} ligne(s).</p>`

    if (Object.keys(result.variables).length > 0) {
      html += '<p><strong>Variables:</strong><br/>'
      for (const [name, val] of Object.entries(result.variables)) {
        html += `${name}=${val}, `
      }
      html = html.slice(0, -2) + '</p>'
    }

    if (result.messages.length > 0) {
      html += `<p><strong>Messages:</strong> ${result.messages.join(', ')}</p>`
    }

    html += '</div>'
    this.infoDiv.innerHTML = html
  }

  private displayInstruction(result: ExecutionResult): void {
    if (!this.stepDiv) return
    if (result.currentInstructionScratchHtml) {
      const indexLabel =
        typeof result.currentInstructionIndex === 'number'
          ? ` <span class="text-xs text-gray-500">(#${result.currentInstructionIndex})</span>`
          : ''
      this.stepDiv.innerHTML =
        '<span class="font-semibold">Instruction :</span>' +
        indexLabel +
        result.currentInstructionScratchHtml
      renderScratchDiv(this.stepDiv)
    } else {
      this.stepDiv.textContent = 'Instruction: -'
    }
  }

  private displayRepeatContext(result: ExecutionResult): void {
    if (!this.repeatDiv) return
    if (result.repeatContexts && result.repeatContexts.length > 0) {
      const contexts = result.repeatContexts
        .map((ctx, idx) => `${'  '.repeat(idx)}🔄 ${ctx}`)
        .join('\n')
      this.repeatDiv.textContent = contexts
    } else {
      this.repeatDiv.textContent = ''
    }
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
): string {
  if (!context.isHtml) return ''
  return `<scratch-simulator delay="${String(delayMs)}" code="${code}">${scratchblock(code)}</scratch-simulator>
     `
}
