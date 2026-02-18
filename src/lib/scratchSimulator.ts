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
        await this.parseAndExecuteAnimated(innerCode, delayMs)
      }

      index = innerCodeEnd + 1
    }
  }

  private parseNonRepeatBlocks(code: string): void {
    const blocks = this.extractBlocksWithBalancedBraces(code)
    for (const block of blocks) {
      if (block.type !== 'repeat') {
        this.executeBlock(block.type, block.content, block.raw)
      }
    }
  }

  private async parseNonRepeatBlocksAnimated(
    code: string,
    delayMs: number,
  ): Promise<void> {
    const blocks = this.extractBlocksWithBalancedBraces(code)

    for (const block of blocks) {
      if (block.type !== 'repeat') {
        // Afficher l'instruction
        this.prepareBlockDisplay(block.type, block.content, block.raw)
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }

        // Attendre le délai
        await new Promise((resolve) => setTimeout(resolve, delayMs / 2))

        // Exécuter l'action
        await this.executeBlockAction(block.type, block.content, delayMs)
        // Afficher les infos mises à jour
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
        // Attendre le délai
        await new Promise((resolve) => setTimeout(resolve, delayMs / 2))
      }
    }
  }

  private extractBlocksWithBalancedBraces(
    code: string,
  ): Array<{ type: string; content: string; raw: string }> {
    const blocks: Array<{ type: string; content: string; raw: string }> = []
    let index = 0

    while (index < code.length) {
      const blockStart = code.indexOf('\\block', index)
      if (blockStart === -1) break

      let typeStart = blockStart + 6
      while (typeStart < code.length && /\s/.test(code[typeStart])) {
        typeStart += 1
      }

      let typeEnd = typeStart
      while (typeEnd < code.length && /[A-Za-z]/.test(code[typeEnd])) {
        typeEnd += 1
      }

      const type = code.slice(typeStart, typeEnd).toLowerCase()
      const contentStart = code.indexOf('{', typeEnd)
      if (!type || contentStart === -1) {
        index = blockStart + 6
        continue
      }

      let braceCount = 1
      let pos = contentStart + 1
      while (pos < code.length && braceCount > 0) {
        if (code[pos] === '{' && code[pos - 1] !== '\\') {
          braceCount += 1
        } else if (code[pos] === '}' && code[pos - 1] !== '\\') {
          braceCount -= 1
        }
        pos += 1
      }

      if (braceCount !== 0) break

      const blockRaw = code.slice(blockStart, pos)
      const content = code.slice(contentStart + 1, pos - 1)
      blocks.push({ type, content, raw: blockRaw })
      index = pos
    }

    return blocks
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
    if (type === 'look') {
      const sayInstruction = this.parseSayInstruction(content)
      if (!sayInstruction) {
        return
      }

      this.messages.push(sayInstruction.spokenValue)

      if (sayInstruction.durationSeconds !== null) {
        const durationMs = Math.max(0, sayInstruction.durationSeconds * 1000)
        if (durationMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, durationMs))
        }
      }
      return
    }

    if (this.executeStandardBlockAction(type, content)) {
      return
    }

    if (type === 'moreblocks') {
      const blockName = content.trim()
      if (this.customBlocks[blockName]) {
        await this.parseAndExecuteAnimated(
          this.customBlocks[blockName],
          delayMs,
        )
      }
    }
  }

  private executeBlock(type: string, content: string, rawBlock?: string): void {
    this.prepareBlockDisplay(type, content, rawBlock)

    if (type === 'look') {
      const sayInstruction = this.parseSayInstruction(content)
      if (sayInstruction) {
        this.messages.push(sayInstruction.spokenValue)
      }
      return
    }

    if (this.executeStandardBlockAction(type, content)) {
      return
    }

    // Exécuter synchronement (pour parseNonRepeatBlocks non-animé)
    if (type === 'moreblocks') {
      const blockName = content.trim()
      if (this.customBlocks[blockName]) {
        this.parseAndExecute(this.customBlocks[blockName])
      }
    }
  }

  private executeStandardBlockAction(type: string, content: string): boolean {
    if (type === 'move') {
      if (this.isGoToInstruction(content)) {
        const target = this.extractGoToCoordinates(content)
        if (target) {
          this.goTo(target.x, target.y)
        }
        return true
      }

      if (this.isChangeXInstruction(content)) {
        const deltaX = this.extractNumericValue(content)
        this.changeXBy(deltaX)
        return true
      }

      if (content.includes('orienter')) {
        const angle = this.extractNumber(content)
        this.setOrientation(angle)
        return true
      }

      if (content.includes('avancer')) {
        const steps = this.extractNumber(content)
        this.moveForward(steps)
        return true
      }

      if (content.includes('tourner')) {
        const angle = this.extractNumber(content)
        if (content.includes('turnright')) {
          this.turn(angle)
        } else if (content.includes('turnleft')) {
          this.turn(-angle)
        }
        return true
      }

      return false
    }

    if (type === 'variable') {
      const varName = this.extractVariableName(content)
      const value = this.extractNumericValue(content)
      if (content.toLowerCase().includes('ajouter')) {
        this.addToVariable(varName, value)
      } else {
        this.setVariableValue(varName, value)
      }
      return true
    }

    if (type === 'change') {
      const value = this.extractNumericValue(content)
      const varName = this.extractVariableName(content)
      this.addToVariable(varName, value)
      return true
    }

    if (type === 'pen') {
      if (content.includes('position') || content.includes('écriture')) {
        this.penDown = true
      } else if (content.includes('relever')) {
        this.penDown = false
      }
      return true
    }

    return false
  }

  private humanizeInstruction(type: string, content: string): string {
    if (type === 'move') {
      if (this.isGoToInstruction(content)) {
        const target = this.extractGoToCoordinates(content)
        if (target) {
          return `Aller a x:${target.x} y:${target.y}`
        }
        return 'Aller a x:? y:?'
      }

      if (this.isChangeXInstruction(content)) {
        return `Ajouter ${this.extractNumericValue(content)} a x`
      }

      if (content.includes('orienter')) {
        return `S'orienter a ${this.extractNumber(content)} degres`
      }

      if (content.includes('avancer')) {
        return `Avancer de ${this.extractNumber(content)} pas`
      }

      if (content.includes('tourner')) {
        const angle = this.extractNumber(content)
        const direction = content.includes('turnright') ? 'droite' : 'gauche'
        return `Tourner a ${direction} de ${angle} degres`
      }
    }

    if (type === 'moreblocks') {
      const blockName = content.trim()
      return `Bloc ${blockName}`
    }

    if (type === 'variable') {
      const value = this.extractNumericValue(content)
      const varName = this.extractVariableName(content)
      if (content.toLowerCase().includes('ajouter')) {
        return `Ajouter ${value} a ${varName}`
      }
      return `Mettre ${varName} a ${value}`
    }

    if (type === 'change') {
      const value = this.extractNumericValue(content)
      const varName = this.extractVariableName(content)
      return `Ajouter ${value} a ${varName}`
    }

    if (type === 'look') {
      const sayInstruction = this.parseSayInstruction(content)
      if (!sayInstruction) {
        return 'Instruction en cours'
      }

      if (sayInstruction.durationSeconds !== null) {
        return `Dire ${sayInstruction.displayValue} pendant ${sayInstruction.durationSeconds} secondes`
      }

      return `Dire ${sayInstruction.displayValue}`
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
    const match = str.match(/\\ovalnum\{(-?\d+(?:[.,]\d+)?)\}/)
    if (match) return Number.parseFloat(match[1].replace(',', '.'))

    const numMatch = str.match(/-?\d+(?:[.,]\d+)?/)
    return numMatch ? Number.parseFloat(numMatch[0].replace(',', '.')) : 0
  }

  private extractSelectMenuVariableName(content: string): string | null {
    const match = content.match(/\\selectmenu\*?\{([^}]+)\}/)
    return match ? match[1].trim() : null
  }

  private extractOvalVariableName(content: string): string | null {
    const match = content.match(/\\ovalvariabl(?:e)?\{([^}]+)\}/)
    return match ? match[1].trim() : null
  }

  private extractVariableName(content: string): string {
    return (
      this.extractSelectMenuVariableName(content) ||
      this.extractOvalVariableName(content) ||
      'compteur'
    )
  }

  private parseSayInstruction(content: string): {
    spokenValue: string
    displayValue: string
    durationSeconds: number | null
  } | null {
    if (!/\bdire\b/i.test(content)) {
      return null
    }

    const saySegments = content.split(/\bpendant\b/i)
    const payload = saySegments[0].replace(/^.*?\bdire\b/i, '').trim()

    const payloadVariableName = this.extractOvalVariableName(payload)

    let spokenValue: string
    let displayValue: string

    if (payloadVariableName) {
      spokenValue = String(this.getVariableValue(payloadVariableName))
      displayValue = payloadVariableName
    } else if (/\\ovalnum\{/.test(payload)) {
      const value = this.extractNumber(payload)
      spokenValue = String(value)
      displayValue = String(value)
    } else {
      const plainText = payload
        .replace(/\\[a-zA-Z*]+(?:\{[^{}]*\})?/g, ' ')
        .replace(/[{}]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (plainText) {
        spokenValue = plainText
        displayValue = plainText
      } else {
        const fallbackValue = this.extractNumericValue(payload)
        spokenValue = String(fallbackValue)
        displayValue = String(fallbackValue)
      }
    }

    let durationSeconds: number | null = null
    const durationPart =
      saySegments.length > 1 ? saySegments.slice(1).join(' ') : ''
    if (/\bseconde/i.test(durationPart) && /\\ovalnum\{/.test(durationPart)) {
      durationSeconds = this.extractNumber(durationPart)
    }

    return {
      spokenValue,
      displayValue,
      durationSeconds,
    }
  }

  private getVariableValue(varName: string): number {
    return this.variables[varName] ?? 0
  }

  private setVariableValue(varName: string, value: number): void {
    this.variables[varName] = value
  }

  private addToVariable(varName: string, delta: number): void {
    this.variables[varName] = this.getVariableValue(varName) + delta
  }

  private extractNumericValue(content: string): number {
    const operatorValue = this.evaluateOvalOperator(content)
    if (operatorValue !== null) {
      return operatorValue
    }

    const directNumber = this.extractNumber(content)
    if (/\\ovalnum\{|-?\d+(?:[.,]\d+)?/.test(content)) {
      return directNumber
    }

    const varName = this.extractOvalVariableName(content)
    if (varName) {
      return this.getVariableValue(varName)
    }

    return directNumber
  }

  private extractCommandContent(
    content: string,
    command: string,
  ): string | null {
    const start = content.indexOf(`${command}{`)
    if (start === -1) return null

    let braceCount = 1
    let pos = start + command.length + 1
    const begin = pos

    while (pos < content.length && braceCount > 0) {
      if (content[pos] === '{' && content[pos - 1] !== '\\') {
        braceCount += 1
      } else if (content[pos] === '}' && content[pos - 1] !== '\\') {
        braceCount -= 1
        if (braceCount === 0) {
          return content.slice(begin, pos)
        }
      }
      pos += 1
    }

    return null
  }

  private evaluateOvalOperator(content: string): number | null {
    const expression = this.extractCommandContent(content, '\\ovaloperator')
    if (!expression) return null
    return this.evaluateArithmeticExpression(expression)
  }

  private evaluateArithmeticExpression(expression: string): number | null {
    const sanitized = this.materializeExpression(expression)
    if (!sanitized) return null

    let index = 0

    const skipSpaces = (): void => {
      while (index < sanitized.length && /\s/.test(sanitized[index])) {
        index += 1
      }
    }

    const parseNumberToken = (): number | null => {
      skipSpaces()
      const numberMatch = sanitized.slice(index).match(/^\d+(?:\.\d+)?|^\.\d+/)
      if (!numberMatch) return null
      index += numberMatch[0].length
      return Number.parseFloat(numberMatch[0])
    }

    const parseFactor = (): number | null => {
      skipSpaces()
      if (sanitized[index] === '+') {
        index += 1
        return parseFactor()
      }
      if (sanitized[index] === '-') {
        index += 1
        const value = parseFactor()
        return value === null ? null : -value
      }
      if (sanitized[index] === '(') {
        index += 1
        const value = parseExpression()
        skipSpaces()
        if (sanitized[index] !== ')') return null
        index += 1
        return value
      }
      return parseNumberToken()
    }

    const parseTerm = (): number | null => {
      let value = parseFactor()
      if (value === null) return null

      while (true) {
        skipSpaces()
        const operator = sanitized[index]
        if (operator !== '*' && operator !== '/') break
        index += 1
        const rhs = parseFactor()
        if (rhs === null) return null
        if (operator === '*') {
          value *= rhs
        } else {
          value /= rhs
        }
      }

      return value
    }

    const parseExpression = (): number | null => {
      let value = parseTerm()
      if (value === null) return null

      while (true) {
        skipSpaces()
        const operator = sanitized[index]
        if (operator !== '+' && operator !== '-') break
        index += 1
        const rhs = parseTerm()
        if (rhs === null) return null
        if (operator === '+') {
          value += rhs
        } else {
          value -= rhs
        }
      }

      return value
    }

    const result = parseExpression()
    skipSpaces()
    if (result === null || index !== sanitized.length || Number.isNaN(result)) {
      return null
    }
    return result
  }

  private materializeExpression(expression: string): string {
    let result = expression

    const replaceNestedOperators = (): void => {
      while (result.includes('\\ovaloperator{')) {
        const inner = this.extractCommandContent(result, '\\ovaloperator')
        if (!inner) break
        const value = this.evaluateArithmeticExpression(inner)
        if (value === null) break
        result = result.replace(`\\ovaloperator{${inner}}`, `(${value})`)
      }
    }

    replaceNestedOperators()

    result = result.replace(/\\ovalnum\{(-?\d+(?:[.,]\d+)?)\}/g, (_, num) =>
      String(Number.parseFloat(String(num).replace(',', '.'))),
    )

    result = result.replace(/\\ovalvariabl(?:e)?\{([^}]+)\}/g, (_, name) =>
      String(this.getVariableValue(String(name).trim())),
    )

    return result
  }

  private isGoToInstruction(content: string): boolean {
    return /aller\s+[àa]\s*x\s*:/i.test(content) && /y\s*:/i.test(content)
  }

  private isChangeXInstruction(content: string): boolean {
    return /ajouter/i.test(content) && /[àa]\s*x\b/i.test(content)
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

  private changeXBy(deltaX: number): void {
    const newX = this.x + deltaX

    if (this.penDown) {
      this.traces.push({
        startX: this.x,
        startY: this.y,
        endX: newX,
        endY: this.y,
      })
    }

    this.x = newX
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
  private codeDiv: HTMLDivElement | null = null
  private codeBlocks: CodeBlockNode[] = []
  private executionBlocks: CodeBlockNode[] = []
  private highlightedExecutionIndex: number | null = null
  private highlightedBlockElement: SVGGElement | null = null
  private customBlockDefinitions: Record<string, CodeBlockNode[]> = {}
  private customDefinitionGroups: Set<SVGGElement> = new Set()
  private blockCacheAttempts: number = 0
  private delayMs: number = 2000
  private isRunning: boolean = false
  private isPaused: boolean = false
  private pauseResolvers: Array<() => void> = []
  private controlButton: HTMLButtonElement | null = null

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
    contentWrapper.className = 'grid grid-cols-2 gap-4 mb-4'

    // Colonne gauche: canvas avec bouton de contrôle
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

    // Bouton de contrôle play/pause
    this.controlButton = document.createElement('button')
    this.controlButton.className =
      'btn btn-circle btn-lg bg-blue-500 hover:bg-blue-600 text-white text-2xl w-16 h-16 flex items-center justify-center'
    this.controlButton.textContent = '▶'
    this.controlButton.addEventListener('click', () => this.togglePlayPause())

    const stepAndControlDiv = document.createElement('div')
    stepAndControlDiv.className = 'flex items-end gap-3 mb-4'
    stepAndControlDiv.appendChild(this.controlButton)
    stepAndControlDiv.appendChild(this.stepDiv)

    rightColumn.appendChild(stepAndControlDiv)

    this.infoDiv = document.createElement('div')
    this.infoDiv.className = 'text-sm text-gray-600 flex-1'
    this.infoDiv.id = 'execution-info'

    rightColumn.appendChild(this.infoDiv)

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

  private parseAndDisplayCode(): void {
    if (!this.codeDiv) return

    this.codeBlocks = []
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

  private highlightCurrentInstruction(
    currentInstructionHtml: string,
    currentInstructionIndex?: number,
  ): void {
    if (this.codeBlocks.length === 0) {
      this.cacheRenderedBlocks()
    }

    let targetBlock: CodeBlockNode | null = null
    let executionIndex: number | null = null

    if (
      currentInstructionIndex !== undefined &&
      currentInstructionIndex >= 0 &&
      this.executionBlocks.length > 0
    ) {
      executionIndex = currentInstructionIndex
      const stableIndex = Math.min(
        currentInstructionIndex,
        this.executionBlocks.length - 1,
      )
      targetBlock = this.executionBlocks[stableIndex] ?? null
    } else if (currentInstructionHtml) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = currentInstructionHtml
      const instructionText = this.normalizeText(tempDiv.textContent || '')
      if (instructionText) {
        targetBlock = this.findBlockByText(this.codeBlocks, instructionText)
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

    this.clearBlockHighlights(this.codeBlocks)
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
    this.isRunning = false
    this.isPaused = false
    this.parseAndDisplayCode()
    this.updateControlButton()
  }

  private async runAnimatedSimulation(): Promise<void> {
    if (!this.interpreter || !this.canvas) return

    this.isRunning = true
    this.isPaused = false
    this.updateControlButton()

    // Exécuter avec animation
    await this.interpreter.executeAnimated(
      this.scratchCode,
      async () => {
        // Attendre si en pause
        while (this.isPaused) {
          await new Promise<void>((resolve) => {
            this.pauseResolvers.push(resolve)
          })
        }

        const state = this.interpreter!.getCurrentState()
        requestAnimationFrame(() => {
          this.drawSimulation(state)
          this.displayInfo(state)
          this.displayInstruction(state)
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
    const finalDisplayState: ExecutionResult = {
      ...result,
      currentInstruction: '',
      currentInstructionScratchHtml: '',
      currentInstructionIndex: -1,
    }
    requestAnimationFrame(() => {
      this.drawSimulation(result)
      this.displayInfo(result)
      this.displayInstruction(finalDisplayState)
      this.highlightCurrentInstruction('', -1)
    })

    this.isRunning = false
    this.isPaused = false
    this.updateControlButton()
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

    let html = `<div class="space-y-2"><p><strong>Position&nbsp:</strong> x=${Math.round(result.finalX - 200)}, y=${Math.round(200 - result.finalY)}.</p>`
    html += `<p><strong>Angle&nbsp:</strong> ${Math.round(result.finalAngle)}°.</p><p><strong>Traces&nbsp:</strong> ${result.traces.length} ligne(s).</p>`

    if (Object.keys(result.variables).length > 0) {
      html += '<p><strong>Variables&nbsp:</strong><br/>'
      for (const [name, val] of Object.entries(result.variables)) {
        html += `${name}&nbsp=&nbsp${val}, `
      }
      html = html.slice(0, -2) + '</p>'
    }

    if (result.messages.length > 0) {
      html += `<p><strong>Messages&nbsp:</strong> ${result.messages.join(', ')}</p>`
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
      this.stepDiv.textContent = 'Instruction : -'
    }
  }

  private togglePlayPause(): void {
    if (!this.isRunning) {
      // Si pas en cours, relancer depuis le début
      this.isRunning = true
      this.isPaused = false
      this.interpreter = new ScratchInterpreter(200, 200, 90)
      this.parseAndDisplayCode()
      this.runAnimatedSimulation()
    } else if (this.isPaused) {
      // Si en pause, reprendre
      this.isPaused = false
      const resolvers = this.pauseResolvers
      this.pauseResolvers = []
      resolvers.forEach((resolve) => resolve())
    } else {
      // Si en cours, mettre en pause
      this.isPaused = true
    }
    this.updateControlButton()
  }

  private updateControlButton(): void {
    if (!this.controlButton) return

    const baseClasses =
      'btn btn-circle btn-lg text-white text-2xl w-16 h-16 flex items-center justify-center'

    if (this.isRunning && !this.isPaused) {
      // En cours d'exécution: afficher stop (⏹)
      this.controlButton.textContent = '⏹'
      this.controlButton.className = `${baseClasses} bg-red-500 hover:bg-red-600`
    } else if (this.isPaused) {
      // En pause: afficher play (▶)
      this.controlButton.textContent = '▶'
      this.controlButton.className = `${baseClasses} bg-green-500 hover:bg-green-600`
    } else {
      // Pas en cours: afficher play (▶)
      this.controlButton.textContent = '▶'
      this.controlButton.className = `${baseClasses} bg-blue-500 hover:bg-blue-600`
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
