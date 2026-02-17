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
  repeatContexts?: string[]
}

export class ScratchInterpreter {
  private x: number
  private y: number
  private angle: number // en degrés, 0° = vers la droite
  private penDown: boolean = true
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
        await new Promise((resolve) => setTimeout(resolve, (2 * delayMs) / 3))

        // Exécuter l'action
        await this.executeBlockAction(blockType, content, delayMs)

        // Attendre le délai
        await new Promise((resolve) => setTimeout(resolve, delayMs / 3))

        // Afficher les infos mises à jour
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
      }

      blockMatch = blockRegex.exec(code)
    }
  }

  private prepareBlockDisplay(
    type: string,
    content: string,
    rawBlock?: string,
  ): void {
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
    if (type === 'move' && content.includes('avancer')) {
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
    }
  }

  private executeBlock(type: string, content: string, rawBlock?: string): void {
    this.prepareBlockDisplay(type, content, rawBlock)
    // Exécuter synchronement (pour parseNonRepeatBlocks non-animé)
    if (type === 'move' && content.includes('avancer')) {
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
    }
  }

  private humanizeInstruction(type: string, content: string): string {
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
    const match = str.match(/\\ovalnum\{(\d+)\}/)
    if (match) return parseInt(match[1], 10)

    const numMatch = str.match(/\d+/)
    return numMatch ? parseInt(numMatch[0], 10) : 0
  }

  private moveForward(steps: number): void {
    const rad = (this.angle * Math.PI) / 180
    const newX = this.x + steps * Math.cos(rad)
    const newY = this.y + steps * Math.sin(rad)

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
    this.angle = (this.angle + degrees) % 360
    if (this.angle < 0) this.angle += 360
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
  private delayMs: number = 500

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
    box.className = 'modal-box max-w-2xl'

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

    this.stepDiv = document.createElement('div')
    this.stepDiv.className = 'text-sm text-gray-600 mb-2'
    this.stepDiv.id = 'execution-step'
    this.stepDiv.textContent = 'Instruction: -'

    this.repeatDiv = document.createElement('div')
    this.repeatDiv.className = 'text-xs text-gray-500 mb-3'
    this.repeatDiv.id = 'execution-repeat'
    this.repeatDiv.textContent = ''

    this.canvas = document.createElement('canvas')
    this.canvas.width = 500
    this.canvas.height = 500
    this.canvas.className = 'border-2 border-gray-300 bg-white my-4 w-full'

    this.infoDiv = document.createElement('div')
    this.infoDiv.className = 'text-sm text-gray-600 flex-1'
    this.infoDiv.id = 'execution-info'

    const instructionContainer = document.createElement('div')
    instructionContainer.className = 'flex-1 pl-4'
    instructionContainer.appendChild(this.stepDiv)
    instructionContainer.appendChild(this.repeatDiv)

    const bottomContainer = document.createElement('div')
    bottomContainer.className = 'flex gap-4'
    bottomContainer.appendChild(instructionContainer)
    bottomContainer.appendChild(this.infoDiv)

    box.appendChild(closeButton)
    box.appendChild(title)
    box.appendChild(this.canvas)
    box.appendChild(bottomContainer)

    this.modal.appendChild(box)
    document.body.appendChild(this.modal)
  }

  private runSimulation(): void {
    if (!this.canvas) return

    this.interpreter = new ScratchInterpreter(240, 240, 0)

    // Lancer l'exécution animée
    this.runAnimatedSimulation()
  }

  private async runAnimatedSimulation(): Promise<void> {
    if (!this.interpreter || !this.canvas) return

    const code = this.getAttribute('code') || ''

    // Exécuter avec animation
    await this.interpreter.executeAnimated(
      code,
      () => {
        const state = this.interpreter!.getCurrentState()
        if (state.currentInstructionScratchHtml !== '') {
          requestAnimationFrame(() => {
            this.drawSimulation(state)
            this.displayInfo(state)
            this.displayInstruction(state)
            this.displayRepeatContext(state)
          })
        }
      },
      this.delayMs,
    )

    // Affichage final
    const result = this.interpreter.getCurrentState()
    if (result.currentInstructionScratchHtml !== '') {
      requestAnimationFrame(() => {
        this.drawSimulation(result)
        this.displayInfo(result)
        this.displayInstruction(result)
        this.displayRepeatContext(result)
      })
    }
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
    ctx.moveTo(0, 240)
    ctx.lineTo(this.canvas.width, 240)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(240, 0)
    ctx.lineTo(240, this.canvas.height)
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
    ctx.rotate((result.finalAngle * Math.PI) / 180)

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

    let html = `<div class="space-y-2"><p><strong>Position:</strong> x=${Math.round(result.finalX - 240)}, y=${Math.round(result.finalY - 240)}</p>`
    html += `<p><strong>Angle:</strong> ${Math.round(result.finalAngle)}°</p><p><strong>Traces:</strong> ${result.traces.length} ligne(s)</p>`

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
      this.stepDiv.innerHTML =
        '<span class="font-semibold">Instruction :</span> ' +
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
