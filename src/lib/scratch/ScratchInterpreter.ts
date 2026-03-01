/**
 * Interpréteur pour exécuter des programmes Scratch
 * @author Jean-Claude Lhote
 */

import { scratchblock } from '../../modules/scratchblock'

export type ScratchLookMessageType = 'say' | 'think'

export interface ScratchLookMessage {
  text: string
  type: ScratchLookMessageType
}

export interface ScratchTrace {
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  width: number
}

export interface ExecutionResult {
  traces: ScratchTrace[]
  finalX: number
  finalY: number
  finalAngle: number
  visible: boolean
  variables: Record<string, number>
  messages: string[]
  currentLookMessage?: ScratchLookMessage | null
  currentInstruction?: string
  currentInstructionScratchHtml?: string
  currentInstructionIndex?: number
  currentConditionText?: string
  currentConditionResult?: boolean | null
  repeatIterations?: Array<{
    level: number
    current: number
    total: number | null
    mode: 'times' | 'until'
  }>
}

export interface ExecuteAnimatedOptions {
  skipWaitBlocks?: boolean
}

export class ScratchInterpreter {
  private static readonly DEFAULT_PEN_COLOR = '#0066cc'
  private static readonly DEFAULT_PEN_WIDTH = 3

  private x: number
  private y: number
  private angle: number // en degrés Scratch, 0° = vers le haut, 90° = vers la droite
  private penDown: boolean = false
  private penColor: string = ScratchInterpreter.DEFAULT_PEN_COLOR
  private penWidth: number = ScratchInterpreter.DEFAULT_PEN_WIDTH
  private penColorValue: number | null = null
  private penSaturation: number = 100
  private penLightness: number = 50
  private penTransparency: number = 0
  private visible: boolean = true
  private stopped: boolean = false // Flag pour arrêter l'exécution
  private answer: string = '' // Variable réservée "réponse" pour stocker les inputs utilisateur
  private variables: Record<string, number> = {}
  private customBlocks: Record<string, string> = {} // Blocs personnalisés
  private traces: ScratchTrace[] = []

  private messages: string[] = []
  private currentLookMessage: ScratchLookMessage | null = null
  private currentInstruction: string = ''
  private currentInstructionScratchHtml: string = ''
  private currentInstructionIndex: number = -1
  private currentConditionText: string = ''
  private currentConditionResult: boolean | null = null
  private repeatIterations: Array<{
    mode: 'times' | 'until'
    current: number
    total: number | null
  }> = []

  private onUpdate?: () => void | Promise<void>
  private skipWaitBlocks: boolean = false
  private executionDelayMs: number = 500
  private greenFlagClicked: boolean = false
  private pressedEventKeys: Set<string> = new Set()
  private eventWaitResolvers: Array<() => void> = []
  public onAskInput?: (prompt: string) => Promise<string> // Callback pour demander un input utilisateur

  constructor(startX = 0, startY = 0, startAngle = 0) {
    this.x = startX
    this.y = startY
    this.angle = startAngle
  }

  async executeAnimated(
    scratchCode: string,
    onUpdate: () => void | Promise<void>,
    delayMs: number = 500,
    options: ExecuteAnimatedOptions = {},
  ): Promise<ExecutionResult> {
    this.traces = []
    this.messages = []
    this.variables = {}
    this.customBlocks = {}
    this.penDown = false
    this.penColor = ScratchInterpreter.DEFAULT_PEN_COLOR
    this.penWidth = ScratchInterpreter.DEFAULT_PEN_WIDTH
    this.penColorValue = null
    this.penSaturation = 100
    this.penLightness = 50
    this.penTransparency = 0
    this.stopped = false
    this.answer = ''
    this.onUpdate = onUpdate
    this.skipWaitBlocks = options.skipWaitBlocks === true
    this.executionDelayMs = Math.max(0, delayMs)
    this.currentInstructionIndex = -1
    this.repeatIterations = []
    this.currentLookMessage = null
    this.greenFlagClicked = false
    this.pressedEventKeys.clear()
    this.eventWaitResolvers = []

    const normalizedScratchCode = scratchCode.replace(
      /\\ovaloperaror\{/g,
      '\\ovaloperator{',
    )

    const codeWithoutDefinitions = this.parseCustomBlockDefinitions(
      normalizedScratchCode,
    )

    await this.parseAndExecuteAnimated(codeWithoutDefinitions, delayMs)

    this.onUpdate = undefined
    this.skipWaitBlocks = false

    return this.getCurrentState()
  }

  private async wait(delayMs: number): Promise<void> {
    const effectiveDelay = Math.max(0, delayMs)
    if (this.skipWaitBlocks || effectiveDelay <= 0) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, effectiveDelay))
  }

  private async waitStepDelay(): Promise<void> {
    await this.wait(this.executionDelayMs / 2)
  }

  public setExecutionDelay(delayMs: number): void {
    this.executionDelayMs = Math.max(0, delayMs)
  }

  public stopExecution(): void {
    this.stopped = true
    this.resolveEventWaiters()
  }

  public triggerGreenFlagClick(): void {
    this.greenFlagClicked = true
    this.resolveEventWaiters()
  }

  public triggerKeyPress(rawKey: string): void {
    const normalizedKey = this.normalizeEventKey(rawKey)
    if (!normalizedKey) {
      return
    }

    this.pressedEventKeys.add(normalizedKey)
    this.resolveEventWaiters()
  }

  getCurrentState(): ExecutionResult {
    return {
      traces: this.traces,
      finalX: this.x,
      finalY: this.y,
      finalAngle: this.angle,
      variables: this.variables,
      visible: this.visible,
      messages: this.messages,
      currentLookMessage: this.currentLookMessage,
      currentInstruction: this.currentInstruction,
      currentInstructionScratchHtml: this.currentInstructionScratchHtml,
      currentInstructionIndex: this.currentInstructionIndex,
      currentConditionText: this.currentConditionText,
      currentConditionResult: this.currentConditionResult,
      repeatIterations: this.getRepeatIterationsState(),
    }
  }

  private getRepeatIterationsState(): Array<{
    level: number
    current: number
    total: number | null
    mode: 'times' | 'until'
  }> {
    return this.repeatIterations.map((entry, index) => ({
      level: index + 1,
      current: entry.current,
      total: entry.total,
      mode: entry.mode,
    }))
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

      // Trouver la fin de la définition : prochain "hat block"
      // (nouvelle définition ou événement principal).
      const nextDefinitionOrEventRegex =
        /\\initmoreblocks\{|\\blockinit\{|\\blockevent\{/g
      nextDefinitionOrEventRegex.lastIndex = defStart

      const nextDefinitionOrEventMatch = nextDefinitionOrEventRegex.exec(code)
      const defEnd = nextDefinitionOrEventMatch
        ? nextDefinitionOrEventMatch.index
        : code.length

      // Extraire le code de la définition
      const blockCode = code.substring(defStart, defEnd).trim()
      this.customBlocks[blockName] = blockCode

      // Retirer cette définition du code à exécuter
      cleanedCode = cleanedCode.replace(code.substring(match.index, defEnd), '')
    }

    return cleanedCode
  }

  private async parseAndExecuteAnimated(
    code: string,
    delayMs: number,
  ): Promise<void> {
    let index = 0

    while (index < code.length && !this.stopped) {
      // Chercher blockrepeat, blockifelse et blockif
      const repeatStart = code.indexOf('\\blockrepeat{', index)
      const ifelseStart = code.indexOf('\\blockifelse{', index)
      const ifStart = code.indexOf('\\blockif{', index)

      // Déterminer lequel vient en premier
      let nextBlockStart = -1
      let nextBlockType: 'repeat' | 'ifelse' | 'if' | null = null

      if (repeatStart === -1 && ifelseStart === -1 && ifStart === -1) {
        if (index < code.length) {
          await this.parseNonRepeatBlocksAnimated(
            code.substring(index),
            delayMs,
          )
        }
        break
      } else {
        const candidates = [
          { type: 'repeat' as const, start: repeatStart },
          { type: 'ifelse' as const, start: ifelseStart },
          { type: 'if' as const, start: ifStart },
        ].filter((candidate) => candidate.start !== -1)

        if (candidates.length === 0) {
          break
        }

        candidates.sort((a, b) => a.start - b.start)
        nextBlockStart = candidates[0].start
        nextBlockType = candidates[0].type
      }

      if (nextBlockStart > index) {
        await this.parseNonRepeatBlocksAnimated(
          code.substring(index, nextBlockStart),
          delayMs,
        )
      }

      if (nextBlockType === 'ifelse') {
        // Traiter blockifelse{si \booloperator{...} alors}{bloc then}{bloc else}
        // Trouver la fin de l'en-tête
        let headerEnd = ifelseStart + 13
        let headerBraceCount = 1
        while (headerEnd < code.length && headerBraceCount > 0) {
          if (code[headerEnd] === '{' && code[headerEnd - 1] !== '\\') {
            headerBraceCount++
          } else if (code[headerEnd] === '}' && code[headerEnd - 1] !== '\\') {
            headerBraceCount--
          }
          headerEnd++
        }

        if (headerBraceCount !== 0) break

        const conditionHeader = code.substring(ifelseStart + 13, headerEnd - 1)

        // Extraire le bloc then
        const thenStart = code.indexOf('{', headerEnd - 1)
        if (thenStart === -1) break

        let braceCount = 1
        let pos = thenStart + 1
        let thenEnd = -1

        while (pos < code.length && braceCount > 0) {
          if (code[pos] === '{' && code[pos - 1] !== '\\') {
            braceCount++
          } else if (code[pos] === '}' && code[pos - 1] !== '\\') {
            braceCount--
            if (braceCount === 0) {
              thenEnd = pos
            }
          }
          pos++
        }

        if (thenEnd === -1) break

        const thenCode = code.substring(thenStart + 1, thenEnd).trim()

        // Extraire le bloc else
        const elseStart = code.indexOf('{', thenEnd)
        if (elseStart === -1) break

        braceCount = 1
        pos = elseStart + 1
        let elseEnd = -1

        while (pos < code.length && braceCount > 0) {
          if (code[pos] === '{' && code[pos - 1] !== '\\') {
            braceCount++
          } else if (code[pos] === '}' && code[pos - 1] !== '\\') {
            braceCount--
            if (braceCount === 0) {
              elseEnd = pos
            }
          }
          pos++
        }

        if (elseEnd === -1) break

        const elseCode = code.substring(elseStart + 1, elseEnd).trim()

        // Évaluer la condition d'abord
        const conditionMet = this.evaluateBoolOperator(conditionHeader)
        this.currentConditionResult = conditionMet

        // Afficher le bloc ifelse avec le résultat de la condition
        const ifelseBlock = code.substring(ifelseStart, elseEnd + 1)
        this.prepareBlockDisplay('ifelse', conditionHeader, ifelseBlock)
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
        await this.waitStepDelay()
        if (conditionMet === true) {
          await this.parseAndExecuteAnimated(thenCode, delayMs)
        } else {
          await this.parseAndExecuteAnimated(elseCode, delayMs)
        }

        index = elseEnd + 1
        continue
      }

      if (nextBlockType === 'if') {
        // Traiter blockif{si \booloperator{...} alors}{bloc then}
        let headerEnd = ifStart + 9
        let headerBraceCount = 1
        while (headerEnd < code.length && headerBraceCount > 0) {
          if (code[headerEnd] === '{' && code[headerEnd - 1] !== '\\') {
            headerBraceCount++
          } else if (code[headerEnd] === '}' && code[headerEnd - 1] !== '\\') {
            headerBraceCount--
          }
          headerEnd++
        }

        if (headerBraceCount !== 0) break

        const conditionHeader = code.substring(ifStart + 9, headerEnd - 1)

        const thenStart = code.indexOf('{', headerEnd - 1)
        if (thenStart === -1) break

        let braceCount = 1
        let pos = thenStart + 1
        let thenEnd = -1

        while (pos < code.length && braceCount > 0) {
          if (code[pos] === '{' && code[pos - 1] !== '\\') {
            braceCount++
          } else if (code[pos] === '}' && code[pos - 1] !== '\\') {
            braceCount--
            if (braceCount === 0) {
              thenEnd = pos
            }
          }
          pos++
        }

        if (thenEnd === -1) break

        const thenCode = code.substring(thenStart + 1, thenEnd).trim()

        // Évaluer la condition d'abord
        const conditionMet = this.evaluateBoolOperator(conditionHeader)
        this.currentConditionResult = conditionMet

        const ifBlock = code.substring(ifStart, thenEnd + 1)
        this.prepareBlockDisplay('if', conditionHeader, ifBlock)
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
        await this.waitStepDelay()
        if (conditionMet === true) {
          await this.parseAndExecuteAnimated(thenCode, delayMs)
        }

        index = thenEnd + 1
        continue
      }

      // Traiter blockrepeat (code existant)
      // Détecter le type de blockrepeat
      const isRepeatUntil = code
        .substring(repeatStart, repeatStart + 100)
        .includes("jusqu'à ce que")

      if (isRepeatUntil) {
        // Cas "répéter jusqu'à ce que \booloperator{...}"
        // Trouver la fin de l'en-tête (premier } après \blockrepeat{)
        let headerEnd = repeatStart + 13
        let headerBraceCount = 1
        while (headerEnd < code.length && headerBraceCount > 0) {
          if (code[headerEnd] === '{' && code[headerEnd - 1] !== '\\') {
            headerBraceCount++
          } else if (code[headerEnd] === '}' && code[headerEnd - 1] !== '\\') {
            headerBraceCount--
          }
          headerEnd++
        }

        if (headerBraceCount !== 0) break // En-tête mal formé

        // Extraire le contenu de l'en-tête
        const repeatHeader = code.substring(repeatStart + 13, headerEnd - 1)
        const boolCondition = repeatHeader.trim()

        // Trouver le bloc de contenu après l'en-tête
        const bodyStart = code.indexOf('{', headerEnd - 1)
        if (bodyStart === -1) break

        let braceCount = 1
        let pos = bodyStart + 1
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

        if (innerCodeEnd === -1) break

        const innerCode = code.substring(bodyStart + 1, innerCodeEnd).trim()

        let iterationCount = 0
        const maxIterations = 10000

        this.repeatIterations.push({
          mode: 'until',
          current: 0,
          total: null,
        })

        while (iterationCount < maxIterations && !this.stopped) {
          const conditionMet = this.evaluateBoolOperator(boolCondition)
          if (conditionMet === true) {
            break
          }
          const loopLevel = this.repeatIterations.length - 1
          if (loopLevel >= 0) {
            this.repeatIterations[loopLevel].current = iterationCount + 1
          }
          await this.parseAndExecuteAnimated(innerCode, delayMs)
          iterationCount++
        }

        this.repeatIterations.pop()

        index = innerCodeEnd + 1
      } else {
        // Cas "répéter X fois"
        const foisEnd = code.indexOf('fois}', repeatStart)
        if (foisEnd === -1) break

        const contentStart = code.indexOf('{', foisEnd + 5)
        if (contentStart === -1) break

        const repeatParamStart = repeatStart + 13
        const repeatParamEnd = foisEnd + 4
        const repeatContent = code.substring(repeatParamStart, repeatParamEnd)
        const times = this.extractNumericValue(repeatContent)

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

        if (innerCodeEnd === -1) break

        const innerCode = code.substring(contentStart + 1, innerCodeEnd).trim()

        this.repeatIterations.push({
          mode: 'times',
          current: 0,
          total: times,
        })

        for (let i = 0; i < times && !this.stopped; i++) {
          const loopLevel = this.repeatIterations.length - 1
          if (loopLevel >= 0) {
            this.repeatIterations[loopLevel].current = i + 1
          }
          await this.parseAndExecuteAnimated(innerCode, delayMs)
        }

        this.repeatIterations.pop()

        index = innerCodeEnd + 1
      }
    }
  }

  private async parseNonRepeatBlocksAnimated(
    code: string,
    delayMs: number,
  ): Promise<void> {
    const blocks = this.extractBlocksWithBalancedBraces(code)

    for (const block of blocks) {
      if (this.stopped) break
      if (block.type !== 'repeat') {
        // Afficher l'instruction
        this.prepareBlockDisplay(block.type, block.content, block.raw)
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }

        // Attendre le délai
        await this.waitStepDelay()

        // Exécuter l'action
        await this.executeBlockAction(block.type, block.content, delayMs)
        // Afficher les infos mises à jour
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
        // Attendre le délai
        await this.waitStepDelay()
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
    if (type === 'if' || type === 'ifelse') {
      this.currentConditionText = this.normalizeConditionText(content)
      // Ne pas réinitialiser currentConditionResult si elle est déjà définie
      // (elle a été évaluée juste avant l'appel à prepareBlockDisplay)
    } else {
      this.currentConditionText = ''
      this.currentConditionResult = null
    }
  }

  private normalizeConditionText(content: string): string {
    const normalized = this.unwrapCommandsWithBalancedBraces(content)
      .replace(/[{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return normalized || content
  }

  private unwrapCommandsWithBalancedBraces(content: string): string {
    let result = ''
    let index = 0

    while (index < content.length) {
      if (content[index] !== '\\') {
        result += content[index]
        index += 1
        continue
      }

      let commandEnd = index + 1
      while (
        commandEnd < content.length &&
        /[A-Za-z*]/.test(content[commandEnd])
      ) {
        commandEnd += 1
      }

      if (commandEnd === index + 1) {
        result += content[index]
        index += 1
        continue
      }

      const braceContent = this.extractBalancedBraceContent(content, commandEnd)
      if (!braceContent) {
        result += ' '
        index = commandEnd
        continue
      }

      const unwrappedInner = this.unwrapCommandsWithBalancedBraces(
        braceContent.content,
      )
      result += ` ${unwrappedInner} `
      index = braceContent.nextIndex
    }

    return result
  }

  private extractBalancedBraceContent(
    content: string,
    openBraceIndex: number,
  ): { content: string; nextIndex: number } | null {
    if (openBraceIndex >= content.length || content[openBraceIndex] !== '{') {
      return null
    }

    let braceCount = 1
    let cursor = openBraceIndex + 1
    const innerStart = cursor

    while (cursor < content.length && braceCount > 0) {
      if (content[cursor] === '{' && content[cursor - 1] !== '\\') {
        braceCount += 1
      } else if (content[cursor] === '}' && content[cursor - 1] !== '\\') {
        braceCount -= 1
        if (braceCount === 0) {
          return {
            content: content.slice(innerStart, cursor),
            nextIndex: cursor + 1,
          }
        }
      }
      cursor += 1
    }

    return null
  }

  private async executeBlockAction(
    type: string,
    content: string,
    delayMs: number = 0,
  ): Promise<void> {
    if (type === 'event' || type === 'init') {
      await this.handleEventBlock(content)
      return
    }

    if (type === 'look') {
      if (this.isDireInstruction(content)) {
        const sayInstruction = this.parseSayInstruction(content)
        if (!sayInstruction) {
          return
        }

        const lookMessage: ScratchLookMessage = {
          text: sayInstruction.spokenValue,
          type: 'say',
        }
        this.messages.push(lookMessage.text)
        this.currentLookMessage = lookMessage
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }

        if (sayInstruction.durationSeconds !== null) {
          const durationMs = Math.max(0, sayInstruction.durationSeconds * 1000)
          if (durationMs > 0) {
            await this.wait(durationMs)
          }

          const latestMessage = this.messages[this.messages.length - 1]
          if (latestMessage === lookMessage.text) {
            this.currentLookMessage = null
            if (this.onUpdate) {
              await Promise.resolve(this.onUpdate())
            }
          }
        }
        return
      }

      if (this.isPenserInstruction(content)) {
        const thinkInstruction = this.parseThinkInstruction(content)
        if (!thinkInstruction) {
          return
        }

        const lookMessage: ScratchLookMessage = {
          text: thinkInstruction.spokenValue,
          type: 'think',
        }
        this.messages.push(lookMessage.text)
        this.currentLookMessage = lookMessage
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }

        if (thinkInstruction.durationSeconds !== null) {
          const durationMs = Math.max(
            0,
            thinkInstruction.durationSeconds * 1000,
          )
          if (durationMs > 0) {
            await this.wait(durationMs)
          }

          const latestMessage = this.messages[this.messages.length - 1]
          if (latestMessage === lookMessage.text) {
            this.currentLookMessage = null
            if (this.onUpdate) {
              await Promise.resolve(this.onUpdate())
            }
          }
        }
        return
      }
      if (this.isCacherInstruction(content)) {
        this.visible = false
        return
      }
      if (this.isMontrerInstruction(content)) {
        this.visible = true
        return
      }
      return
    }

    if (type === 'sensing') {
      // Gérer "demander ... et attendre"
      if (content.includes('demander') && content.includes('attendre')) {
        const prompt = this.extractPromptFromSensing(content)
        if (this.onAskInput) {
          this.answer = await this.onAskInput(prompt)
        } else {
          // Si pas de callback, utiliser une valeur par défaut
          this.answer = '42'
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

      if (this.isChangeYInstruction(content)) {
        const deltaY = this.extractNumericValue(content)
        this.changeYBy(deltaY)
        return true
      }

      if (this.isSetXInstruction(content)) {
        const targetX = this.extractNumericValue(content)
        this.setXTo(targetX)
        return true
      }

      if (this.isSetYInstruction(content)) {
        const targetY = this.extractNumericValue(content)
        this.setYTo(targetY)
        return true
      }

      if (content.includes('orienter')) {
        const angle = this.extractNumericValue(content)
        this.setOrientation(angle)
        return true
      }

      if (content.includes('avancer')) {
        const steps = this.extractNumericValue(content)
        this.moveForward(steps)
        return true
      }

      if (content.includes('tourner')) {
        const angle = this.extractNumericValue(content)
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
      const normalized = content
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      if (normalized.includes('position') || normalized.includes('ecriture')) {
        this.penDown = true
      } else if (normalized.includes('relever')) {
        this.penDown = false
      } else if (
        normalized.includes('taille') ||
        normalized.includes('epaisseur') ||
        normalized.includes('largeur')
      ) {
        const widthValue = this.extractNumericValue(content)
        if (normalized.includes('ajouter')) {
          this.penWidth = Math.max(1, this.penWidth + widthValue)
        } else {
          this.penWidth = Math.max(1, widthValue)
        }
      } else {
        const penParameter = this.extractPenParameter(content, normalized)
        if (penParameter) {
          this.applyPenParameterChange(
            penParameter,
            this.extractNumericValue(content),
            normalized.includes('ajouter'),
            content,
          )
        }
      }
      return true
    }

    if (type === 'control') {
      if (content.includes('stop') && content.includes('tout')) {
        this.stopped = true
      }
      return true
    }

    if (type === 'sensing') {
      return true
    }

    return false
  }

  private extractPenParameter(
    content: string,
    normalizedContent: string,
  ): 'couleur' | 'saturation' | 'luminosite' | 'transparence' | null {
    const menuRaw =
      this.extractCommandContent(content, '\\selectmenu') ||
      this.extractCommandContent(content, '\\selectmenu*')

    if (menuRaw) {
      const normalizedMenu = menuRaw
        .replace(/\\_/g, '_')
        .replace(/%.*/g, ' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_ ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!normalizedMenu) {
        return 'couleur'
      }

      if (
        normalizedMenu.includes('transparence') ||
        normalizedMenu.includes('transparency')
      ) {
        return 'transparence'
      }
      if (
        normalizedMenu.includes('luminosite') ||
        normalizedMenu.includes('brightness')
      ) {
        return 'luminosite'
      }
      if (normalizedMenu.includes('saturation')) {
        return 'saturation'
      }
      if (
        normalizedMenu.includes('couleur') ||
        normalizedMenu.includes('color') ||
        normalizedMenu.includes('pen_menu_colorparam')
      ) {
        return 'couleur'
      }
    }

    if (normalizedContent.includes('transparence')) {
      return 'transparence'
    }
    if (normalizedContent.includes('luminosite')) {
      return 'luminosite'
    }
    if (normalizedContent.includes('saturation')) {
      return 'saturation'
    }
    if (normalizedContent.includes('couleur')) {
      return 'couleur'
    }

    return null
  }

  private applyPenParameterChange(
    parameter: 'couleur' | 'saturation' | 'luminosite' | 'transparence',
    numericValue: number,
    isAddOperation: boolean,
    content: string,
  ): void {
    if (parameter === 'couleur') {
      const selectedColor = this.extractPenColor(content)
      if (selectedColor) {
        this.penColor = selectedColor
        this.penColorValue = null
        return
      }

      if (isAddOperation) {
        this.addToPenColor(numericValue)
      } else {
        this.setPenColorFromValue(numericValue)
      }
      return
    }

    this.applyDefaultPenParamsFromCssColorIfNeeded()

    if (parameter === 'saturation') {
      this.penSaturation = isAddOperation
        ? this.clampPenPercent(this.penSaturation + numericValue)
        : this.clampPenPercent(numericValue)
      this.updatePenColorFromParams()
      return
    }

    if (parameter === 'luminosite') {
      this.penLightness = isAddOperation
        ? this.clampPenPercent(this.penLightness + numericValue)
        : this.clampPenPercent(numericValue)
      this.updatePenColorFromParams()
      return
    }

    this.penTransparency = isAddOperation
      ? this.clampPenPercent(this.penTransparency + numericValue)
      : this.clampPenPercent(numericValue)
    this.updatePenColorFromParams()
  }

  private clampPenPercent(value: number): number {
    return Math.max(0, Math.min(100, value))
  }

  private updatePenColorFromParams(): void {
    const hue = this.penColorValueToHue(this.penColorValue ?? 0)
    const alpha = Math.max(0, Math.min(1, 1 - this.penTransparency / 100))
    this.penColor = `hsla(${hue}, ${this.penSaturation}%, ${this.penLightness}%, ${alpha})`
  }

  private penColorValueToHue(value: number): number {
    const normalized = this.normalizePenColorValue(value)
    return Math.round(normalized * 1.8 * 100) / 100
  }

  private applyDefaultPenParamsFromCssColorIfNeeded(): void {
    if (this.penColorValue !== null) {
      return
    }
    this.penColorValue = 0
    this.penSaturation = 100
    this.penLightness = 50
    this.penTransparency = 0
  }

  private async handleEventBlock(content: string): Promise<void> {
    if (this.skipWaitBlocks) {
      return
    }

    if (this.isGreenFlagEvent(content)) {
      await this.waitForEventCondition(() => this.greenFlagClicked)
      return
    }

    const expectedKey = this.extractEventKey(content)
    if (expectedKey) {
      await this.waitForEventCondition(() =>
        this.consumePressedEventKey(expectedKey),
      )
    }
  }

  private async waitForEventCondition(condition: () => boolean): Promise<void> {
    while (!this.stopped && !condition()) {
      await new Promise<void>((resolve) => {
        this.eventWaitResolvers.push(resolve)
      })
    }
  }

  private resolveEventWaiters(): void {
    if (this.eventWaitResolvers.length === 0) {
      return
    }

    const resolvers = this.eventWaitResolvers
    this.eventWaitResolvers = []
    resolvers.forEach((resolve) => resolve())
  }

  private normalizeEventKey(rawKey: string): string {
    if (rawKey === ' ') {
      return 'espace'
    }

    const normalized = rawKey
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

    if (!normalized) {
      return ''
    }

    return normalized
  }

  private consumePressedEventKey(expectedKey: string): boolean {
    if (!this.pressedEventKeys.has(expectedKey)) {
      return false
    }

    this.pressedEventKeys.delete(expectedKey)
    return true
  }

  private isGreenFlagEvent(content: string): boolean {
    const normalized = content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return normalized.includes('greenflag') || normalized.includes('drapeau')
  }

  private extractEventKey(content: string): string | null {
    const normalized = content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const keyMatch = normalized.match(/touche\s+([^\s{}\\]+)/i)
    if (!keyMatch) {
      return null
    }

    return keyMatch[1].trim()
  }

  private humanizeInstruction(type: string, content: string): string {
    if (type === 'move') {
      if (this.isChangeXInstruction(content)) {
        return `Ajouter ${this.extractNumericValue(content)} a x`
      }

      if (this.isChangeYInstruction(content)) {
        return `Ajouter ${this.extractNumericValue(content)} a y`
      }

      if (this.isSetXInstruction(content)) {
        return `Mettre x a ${this.extractNumericValue(content)}`
      }

      if (this.isSetYInstruction(content)) {
        return `Mettre y a ${this.extractNumericValue(content)}`
      }

      if (content.includes('avancer')) {
        return `Avancer de ${this.extractNumericValue(content)} pas`
      }

      if (content.includes('tourner')) {
        const angle = this.extractNumericValue(content)
        const direction = content.includes('turnright') ? 'droite' : 'gauche'
        return `Tourner a ${direction} de ${angle} degres`
      }

      if (this.isGoToInstruction(content)) {
        const target = this.extractGoToCoordinates(content)
        if (target) {
          return `Aller a x:${target.x} y:${target.y}`
        }
        return 'Aller a une position'
      }

      if (content.includes('orienter')) {
        return `Orienter a ${this.extractNumericValue(content)} degres`
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
      if (sayInstruction) {
        if (sayInstruction.durationSeconds !== null) {
          return `Dire ${sayInstruction.displayValue} pendant ${sayInstruction.durationSeconds} secondes`
        }

        return `Dire ${sayInstruction.displayValue}`
      }

      const thinkInstruction = this.parseThinkInstruction(content)
      if (thinkInstruction) {
        if (thinkInstruction.durationSeconds !== null) {
          return `Penser à ${thinkInstruction.displayValue} pendant ${thinkInstruction.durationSeconds} secondes`
        }

        return `Penser à ${thinkInstruction.displayValue}`
      }

      return 'Instruction en cours'
    }

    if (type === 'event') {
      if (this.isGreenFlagEvent(content)) {
        return 'Attente du clic sur le drapeau vert'
      }

      const expectedKey = this.extractEventKey(content)
      if (expectedKey) {
        return `Attente de la touche ${expectedKey}`
      }

      return "Attente d'un événement"
    }

    if (type === 'pen') {
      if (content.includes('position') || content.includes('écriture')) {
        return "Stylo en position d'ecriture"
      } else if (content.includes('relever')) {
        return 'Relever le stylo'
      }
    }

    if (type === 'ifelse') {
      const conditionMatch = content.match(/si\s+.*?\s+alors/i)
      if (conditionMatch) {
        return `Evaluation condition: ${conditionMatch[0]}`
      }
      return 'Si ... alors'
    }

    if (type === 'if') {
      const conditionMatch = content.match(/si\s+.*?\s+alors/i)
      if (conditionMatch) {
        return `Evaluation condition: ${conditionMatch[0]}`
      }
      return 'Si ... alors'
    }

    return 'Instruction en cours'
  }

  private renderScratchBlock(
    type: string,
    content: string,
    rawBlock?: string,
  ): string {
    // Importer scratchblock de manière dynamique pour éviter les dépendances circulaires

    const candidates = [
      rawBlock,
      `\\begin{scratch}[blocks]\n\\block${type}{${content}}\n\\end{scratch}`,
      `\\block${type}{${content}}`,
    ].filter((value): value is string => Boolean(value))

    for (const candidate of candidates) {
      try {
        const rendered = scratchblock(candidate)
        if (rendered !== false) {
          return rendered
        }
      } catch {
        continue
      }
    }

    return ''
  }

  private extractNumber(str: string): number
  private extractNumber(str: string, allowTextFallback: false): number
  private extractNumber(str: string, allowTextFallback: true): number | string
  private extractNumber(
    str: string,
    allowTextFallback: boolean = false,
  ): number | string {
    const ovalnumMatch = str.match(/\\ovalnum\{([^}]+)\}/)
    if (ovalnumMatch) {
      const rawValue = ovalnumMatch[1].trim()
      const numericValue = rawValue.replace(',', '.')
      if (/^-?\d+(?:\.\d+)?$/.test(numericValue)) {
        return Number.parseFloat(numericValue)
      }
      if (allowTextFallback) {
        return rawValue
      }
    }

    const numMatch = str.match(/-?\d+(?:[.,]\d+)?/)
    return numMatch ? Number.parseFloat(numMatch[0].replace(',', '.')) : 0
  }

  private extractPromptFromSensing(content: string): string {
    // Chercher le texte dans \ovalnum{...}
    const match = content.match(/\\ovalnum\{([^}]+)\}/)
    if (match) {
      return match[1].trim()
    }

    // Si pas de \ovalnum, extraire le texte brut après "demander"
    const afterDemander = content.replace(/^.*?demander\s*/i, '').trim()
    const cleaned = afterDemander
      .replace(/\\[a-zA-Z*]+(?:\{[^{}]*\})?/g, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/et\s+attendre\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()

    return cleaned || 'Entrez une valeur'
  }

  private extractSelectMenuVariableName(content: string): string | null {
    const match = content.match(/\\selectmenu\*?\{([^}]+)\}/)
    return match ? match[1].trim() : null
  }

  private extractOvalVariableName(content: string): string | null {
    const match = content.match(/\\ovalvariabl(?:e)?\{([^}]+)\}/)
    return match ? match[1].trim() : null
  }

  private extractOvalSensingName(content: string): string | null {
    const match = content.match(/\\ovalsensing\{([^}]+)\}/)
    return match ? match[1].trim() : null
  }

  private extractOvalMoveName(content: string): string | null {
    const match = content.match(/\\ovalmove\{([^}]+)\}/)
    return match ? match[1].trim() : null
  }

  private extractVariableName(content: string): string {
    return (
      this.extractSelectMenuVariableName(content) ||
      this.extractOvalVariableName(content) ||
      this.extractOvalSensingName(content) ||
      this.extractOvalMoveName(content) ||
      'compteur'
    )
  }

  private parseSayInstruction(content: string): {
    spokenValue: string
    displayValue: string
    durationSeconds: number | null
  } | null {
    return this.parseLookInstruction(content, /\bdire\b/i, /^.*?\bdire\b/i)
  }

  private parseThinkInstruction(content: string): {
    spokenValue: string
    displayValue: string
    durationSeconds: number | null
  } | null {
    return this.parseLookInstruction(
      content,
      /\bpenser\b/i,
      /^.*?\bpenser(?:\s+[àa])?\b/i,
    )
  }

  private parseLookInstruction(
    content: string,
    instructionRegex: RegExp,
    payloadPrefixRegex: RegExp,
  ): {
    spokenValue: string
    displayValue: string
    durationSeconds: number | null
  } | null {
    if (!instructionRegex.test(content)) {
      return null
    }

    const saySegments = content.split(/\bpendant\b/i)
    const payload = saySegments[0].replace(payloadPrefixRegex, '').trim()

    const payloadVariableName =
      this.extractOvalVariableName(payload) ||
      this.extractOvalSensingName(payload) ||
      this.extractOvalMoveName(payload)

    let spokenValue: string
    let displayValue: string

    // Vérifier ovaloperator en premier
    if (/\\ovaloperator\{/.test(payload)) {
      const value = this.extractValue(payload)
      spokenValue = String(value)
      displayValue = String(value)
    } else if (payloadVariableName) {
      spokenValue = String(this.getVariableValue(payloadVariableName))
      displayValue = payloadVariableName
    } else if (/\\ovalnum\{/.test(payload)) {
      const value = this.extractNumber(payload, true)
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
        const fallbackValue = this.extractValue(payload)
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

  private getReservedVariableKind(
    varName: string,
  ): 'abscisse-x' | 'ordonnee-y' | 'direction' | 'reponse' | null {
    const normalized = varName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

    if (normalized === 'abscisse x') {
      return 'abscisse-x'
    }

    if (normalized === 'ordonnee y') {
      return 'ordonnee-y'
    }

    if (normalized === 'direction') {
      return 'direction'
    }

    if (normalized === 'reponse') {
      return 'reponse'
    }

    return null
  }

  private getVariableValue(varName: string): number {
    const reservedKind = this.getReservedVariableKind(varName)
    if (reservedKind === 'abscisse-x') {
      return this.x - 200
    }

    if (reservedKind === 'ordonnee-y') {
      return 200 - this.y
    }

    if (reservedKind === 'direction') {
      return this.angle
    }

    if (reservedKind === 'reponse') {
      // Tenter de convertir la réponse en nombre
      const num = parseFloat(this.answer)
      return isNaN(num) ? 0 : num
    }

    return this.variables[varName] ?? 0
  }

  private setVariableValue(varName: string, value: number): void {
    const reservedKind = this.getReservedVariableKind(varName)
    if (reservedKind === 'abscisse-x') {
      this.setXTo(value)
      return
    }

    if (reservedKind === 'ordonnee-y') {
      this.setYTo(value)
      return
    }

    if (reservedKind === 'direction') {
      this.setOrientation(value)
      return
    }

    this.variables[varName] = value
  }

  private addToVariable(varName: string, delta: number): void {
    const reservedKind = this.getReservedVariableKind(varName)
    if (reservedKind === 'abscisse-x') {
      this.changeXBy(delta)
      return
    }

    if (reservedKind === 'ordonnee-y') {
      this.changeYBy(delta)
      return
    }

    if (reservedKind === 'direction') {
      this.turn(delta)
      return
    }

    this.variables[varName] = this.getVariableValue(varName) + delta
  }

  private extractNumericPayload(content: string): string {
    const trimmed = content.trim()

    const ajouterMatch = content.match(/\bajouter\b/i)
    if (ajouterMatch && ajouterMatch.index !== undefined) {
      const afterAjouter = content
        .slice(ajouterMatch.index + ajouterMatch[0].length)
        .trim()
      const separatorMatch = afterAjouter.match(/\s+[àa]\s+/i)
      if (separatorMatch && separatorMatch.index !== undefined) {
        const payload = afterAjouter.slice(0, separatorMatch.index).trim()
        if (payload) return payload
      }
    }

    const mettreMatch = content.match(/\bmettre\b/i)
    if (mettreMatch && mettreMatch.index !== undefined) {
      const afterMettre = content
        .slice(mettreMatch.index + mettreMatch[0].length)
        .trim()
      const separatorMatch = afterMettre.match(/\s+[àa]\s+/i)
      if (separatorMatch && separatorMatch.index !== undefined) {
        const payload = afterMettre
          .slice(separatorMatch.index + separatorMatch[0].length)
          .trim()
        if (payload) return payload
      }
    }

    return trimmed
  }

  private extractNumericValue(content: string): number {
    const payload = this.extractNumericPayload(content)

    const operatorValue = this.evaluateOvalOperator(payload)
    if (operatorValue !== null) {
      return operatorValue
    }

    const directNumber = this.extractNumber(payload)
    if (/\\ovalnum\{|-?\d+(?:[.,]\d+)?/.test(payload)) {
      return directNumber
    }

    // Chercher ensuite les variables, sensing et move
    const varName =
      this.extractOvalVariableName(payload) ||
      this.extractOvalSensingName(payload) ||
      this.extractOvalMoveName(payload)
    if (varName) {
      return this.getVariableValue(varName)
    }

    return directNumber
  }

  private extractValue(content: string): string | number | boolean {
    // Essayer d'abord d'évaluer comme ovaloperator (peut retourner string, number ou boolean)
    const operatorValue = this.evaluateOvalOperatorOrString(content)
    if (operatorValue !== null) {
      return operatorValue
    }

    // Essayer d'extraire un nombre
    const directNumber = this.extractNumber(content)
    if (/\\ovalnum\{|-?\d+(?:[.,]\d+)?/.test(content)) {
      return directNumber
    }

    // Essayer d'extraire une variable
    const varName =
      this.extractOvalVariableName(content) ||
      this.extractOvalSensingName(content) ||
      this.extractOvalMoveName(content)
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
    const operatorValue = this.evaluateOvalOperatorOrString(content)
    return typeof operatorValue === 'number' ? operatorValue : null
  }

  private evaluateOvalOperatorOrString(
    content: string,
  ): string | number | boolean | null {
    const expression = this.extractOvalOperatorExpression(content)
    if (!expression) return null

    const roundedValue = this.evaluateRoundOperator(expression)
    if (roundedValue !== null) {
      return roundedValue
    }

    const containsValue = this.evaluateContainsOperator(expression)
    if (containsValue !== null) {
      return containsValue
    }

    const lengthValue = this.evaluateLengthOfOperator(expression)
    if (lengthValue !== null) {
      return lengthValue
    }

    const randomValue = this.evaluateRandomBetweenOperator(expression)
    if (randomValue !== null) {
      return randomValue
    }

    const letterValue = this.evaluateLetterOfOperator(expression)
    if (letterValue !== null) {
      return letterValue
    }

    // Détecter "regrouper ... et ..." pour concaténation de strings
    if (/\bregrouper\b/i.test(expression)) {
      return this.evaluateStringConcatenation(expression)
    }

    // Sinon, évaluation arithmétique
    return this.evaluateArithmeticExpression(expression)
  }

  private evaluateRoundOperator(expression: string): number | null {
    const roundMatch = expression.match(/^\s*arrondi\s+de\s+/i)
    if (!roundMatch) {
      return null
    }

    const operandExpression = expression.slice(roundMatch[0].length).trim()
    if (!operandExpression) {
      return null
    }

    const operandValue = this.evaluateArithmeticExpression(operandExpression)
    if (operandValue === null) {
      return null
    }

    return Math.round(operandValue)
  }

  private evaluateLengthOfOperator(expression: string): number | null {
    const longueurMatch = expression.match(/\blongueur\s+de\b/i)
    if (!longueurMatch || longueurMatch.index === undefined) {
      return null
    }

    const sourceExpression = expression
      .slice(longueurMatch.index + longueurMatch[0].length)
      .trim()
    const sourceText = this.materializeExpressionForString(sourceExpression)
    return Array.from(sourceText).length
  }

  private evaluateContainsOperator(expression: string): boolean | null {
    const normalized = expression
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const containsMatch = normalized.match(/\bcontient\b|\bcontains\b/)
    if (!containsMatch || containsMatch.index === undefined) {
      return null
    }

    const keyword = containsMatch[0]
    const leftExpression = expression.slice(0, containsMatch.index).trim()
    const rightExpression = expression
      .slice(containsMatch.index + keyword.length)
      .trim()

    if (!leftExpression || !rightExpression) {
      return null
    }

    const sourceText = this.materializeExpressionForString(leftExpression)
    const searchText = this.materializeExpressionForString(rightExpression)

    return sourceText.includes(searchText)
  }

  private extractOvalOperatorExpression(content: string): string | null {
    return (
      this.extractCommandContent(content, '\\ovaloperator') ||
      this.extractCommandContent(content, '\\ovaloperaror')
    )
  }

  private evaluateLetterOfOperator(expression: string): string | null {
    const lettreMatch = expression.match(/\blettre\b/i)
    if (!lettreMatch || lettreMatch.index === undefined) {
      return null
    }

    const afterLettre = expression
      .slice(lettreMatch.index + lettreMatch[0].length)
      .trim()
    const parts = afterLettre.split(/\bde\b/i)
    if (parts.length < 2) {
      return null
    }

    const indexExpression = parts[0].trim()
    const sourceExpression = parts.slice(1).join('de').trim()

    const letterIndex = this.evaluateArithmeticExpression(indexExpression)
    if (letterIndex === null) {
      return null
    }

    const sourceText = this.materializeExpressionForString(sourceExpression)
    const graphemes = Array.from(sourceText)
    const zeroBasedIndex = Math.floor(letterIndex) - 1

    if (zeroBasedIndex < 0 || zeroBasedIndex >= graphemes.length) {
      return ''
    }

    return graphemes[zeroBasedIndex]
  }

  private evaluateRandomBetweenOperator(expression: string): number | null {
    const normalized = expression
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const randomPattern =
      /\bnombre\s+aleatoire\s+entre\b|\bpick\s+random\s+between\b/
    if (!randomPattern.test(normalized)) {
      return null
    }

    const entreMatch = expression.match(/\bentre\b/i)
    if (!entreMatch || entreMatch.index === undefined) {
      return null
    }

    const afterEntre = expression
      .slice(entreMatch.index + entreMatch[0].length)
      .trim()
    const bounds = this.splitArgsByEtAtRoot(afterEntre)
    if (bounds.length !== 2) {
      return null
    }

    const leftBound = this.evaluateArithmeticExpression(bounds[0].trim())
    const rightBound = this.evaluateArithmeticExpression(bounds[1].trim())
    if (leftBound === null || rightBound === null) {
      return null
    }

    const minBound = Math.min(leftBound, rightBound)
    const maxBound = Math.max(leftBound, rightBound)

    if (Number.isInteger(leftBound) && Number.isInteger(rightBound)) {
      const span = maxBound - minBound + 1
      return minBound + Math.floor(Math.random() * span)
    }

    return minBound + Math.random() * (maxBound - minBound)
  }

  private evaluateStringConcatenation(expression: string): string {
    // Traiter récursivement les ovaloperator imbriqués d'abord
    let result = expression

    while (result.includes('\\ovaloperator{')) {
      const inner = this.extractCommandContent(result, '\\ovaloperator')
      if (!inner) break
      const value = this.evaluateOvalOperatorOrString(
        `\\ovaloperator{${inner}}`,
      )
      if (value === null) break
      // Remplacer par la valeur évaluée (number ou string)
      result = result.replace(`\\ovaloperator{${inner}}`, String(value))
    }

    // Parser "regrouper X et Y" respectant les accolades
    const regroupMatch = result.match(/regrouper\s+/i)
    if (!regroupMatch) {
      return this.materializeExpressionForString(result)
    }

    const afterRegrouper = result.slice(
      regroupMatch.index! + regroupMatch[0].length,
    )
    const parts = this.splitArgsByEtAtRoot(afterRegrouper)

    if (parts.length !== 2) {
      return this.materializeExpressionForString(result)
    }

    // Matérialiser chaque partie (remplacer \ovalnum, \ovalvariable, etc.)
    const leftValue = this.materializeExpressionForString(parts[0].trim())
    const rightValue = this.materializeExpressionForString(parts[1].trim())

    return leftValue + rightValue
  }

  private splitArgsByEtAtRoot(content: string): string[] {
    return this.splitArgsBySeparatorAtRoot(content, 'et')
  }

  private splitArgsByOuAtRoot(content: string): string[] {
    return this.splitArgsBySeparatorAtRoot(content, 'ou')
  }

  private splitArgsBySeparatorAtRoot(
    content: string,
    separator: 'et' | 'ou',
  ): string[] {
    let braceDepth = 0
    let currentPart = ''
    const parts: string[] = []
    let i = 0
    const separatorToken = ` ${separator} `

    while (i < content.length) {
      const char = content[i]

      // Vérifier si on a un backslash (début de commande LaTeX)
      if (char === '\\' && i + 1 < content.length) {
        currentPart += char
        i++

        // Lire le nom de la commande (lettres)
        while (i < content.length && /[A-Za-z*]/.test(content[i])) {
          currentPart += content[i]
          i++
        }

        // Si la commande est suivie de `{`, gérer l'équilibre des accolades
        if (content[i] === '{') {
          let cmdBraceDepth = 1
          currentPart += content[i]
          i++

          while (i < content.length && cmdBraceDepth > 0) {
            if (content[i] === '\\') {
              currentPart += content[i]
              if (i + 1 < content.length) {
                i++
                currentPart += content[i]
              }
            } else if (content[i] === '{') {
              cmdBraceDepth++
              currentPart += content[i]
            } else if (content[i] === '}') {
              cmdBraceDepth--
              currentPart += content[i]
            } else {
              currentPart += content[i]
            }
            i++
          }
        }
      } else if (char === '{' || (char === '}' && braceDepth > 0)) {
        // Gérer les accolades non-LaTeX
        if (char === '{') {
          braceDepth++
        } else if (char === '}') {
          braceDepth--
        }
        currentPart += char
        i++
      } else if (
        braceDepth === 0 &&
        i + separatorToken.length <= content.length &&
        content.slice(i, i + separatorToken.length).toLowerCase() ===
          separatorToken
      ) {
        // On a trouvé le séparateur booléen au niveau de profondeur 0
        parts.push(currentPart)
        currentPart = ''
        i += separatorToken.length
      } else {
        currentPart += char
        i++
      }
    }

    if (currentPart) {
      parts.push(currentPart)
    }

    return parts
  }

  private materializeExpressionForString(expression: string): string {
    let result = expression

    // Remplacer \ovalnum par sa valeur
    result = result.replace(/\\ovalnum\{([^}]+)\}/g, (_, content) => {
      // Si c'est un nombre, le parser, sinon retourner la string
      const num = content.match(/^-?\d+(?:[.,]\d+)?$/)
      if (num) {
        return String(Number.parseFloat(content.replace(',', '.')))
      }
      return content
    })

    // Remplacer \ovalvariable par sa valeur
    result = result.replace(/\\ovalvariabl(?:e)?\{([^}]+)\}/g, (_, name) =>
      String(this.getVariableValue(name.trim())),
    )

    // Remplacer \ovalsensing par sa valeur
    result = result.replace(/\\ovalsensing\{([^}]+)\}/g, (_, name) => {
      const varName = name.trim()
      if (
        varName.toLowerCase() === 'réponse' ||
        varName.toLowerCase() === 'reponse'
      ) {
        return this.answer // Retourner la string directement
      }
      return String(this.getVariableValue(varName))
    })

    result = result.replace(/\\ovalmove\{([^}]+)\}/g, (_, name) =>
      String(this.getVariableValue(name.trim())),
    )

    return result
  }

  private evaluateBoolOperator(content: string): boolean | null {
    const expression = this.extractCommandContent(content, '\\booloperator')
    if (!expression) return null
    return this.evaluateBooleanExpression(expression)
  }

  private evaluateBooleanExpression(expression: string): boolean | null {
    const rawExpression = expression.trim()
    if (!rawExpression) return null

    const directOvalOperatorValue =
      this.evaluateOvalOperatorOrString(rawExpression)
    if (typeof directOvalOperatorValue === 'boolean') {
      return directOvalOperatorValue
    }

    const notMatch = rawExpression.match(/^non\b/i)
    if (notMatch) {
      const operand = rawExpression.slice(notMatch[0].length).trim()
      const operandValue = this.evaluateBooleanOperand(operand)
      return operandValue === null ? null : !operandValue
    }

    const orParts = this.splitArgsByOuAtRoot(rawExpression)
    if (orParts.length > 1) {
      let hasNull = false
      for (const part of orParts) {
        const value = this.evaluateBooleanOperand(part.trim())
        if (value === true) {
          return true
        }
        if (value === null) {
          hasNull = true
        }
      }
      return hasNull ? null : false
    }

    const andParts = this.splitArgsByEtAtRoot(rawExpression)
    if (andParts.length > 1) {
      let hasNull = false
      for (const part of andParts) {
        const value = this.evaluateBooleanOperand(part.trim())
        if (value === false) {
          return false
        }
        if (value === null) {
          hasNull = true
        }
      }
      return hasNull ? null : true
    }

    const comparisonMatch = rawExpression.match(/(<=|>=|=|<|>)/)
    if (!comparisonMatch || comparisonMatch.index === undefined) {
      return null
    }

    const operator = comparisonMatch[0]
    const leftExpr = rawExpression.slice(0, comparisonMatch.index).trim()
    const rightExpr = rawExpression
      .slice(comparisonMatch.index + operator.length)
      .trim()

    const leftValue = this.evaluateArithmeticExpression(leftExpr)
    const rightValue = this.evaluateArithmeticExpression(rightExpr)

    if (leftValue !== null && rightValue !== null) {
      switch (operator) {
        case '<=':
          return leftValue <= rightValue
        case '>=':
          return leftValue >= rightValue
        case '<':
          return leftValue < rightValue
        case '>':
          return leftValue > rightValue
        case '=':
          return leftValue === rightValue
      }
    }

    if (operator === '=') {
      const leftText = this.materializeExpressionForString(leftExpr).trim()
      const rightText = this.materializeExpressionForString(rightExpr).trim()
      return leftText === rightText
    }

    return null
  }

  private evaluateBooleanOperand(operand: string): boolean | null {
    if (!operand) {
      return null
    }

    if (operand.includes('\\booloperator{')) {
      return this.evaluateBoolOperator(operand)
    }

    return this.evaluateBooleanExpression(operand)
  }

  private parseScratchMathFunctionAt(
    expression: string,
    startIndex: number,
  ): { functionName: string; nextIndex: number } | null {
    const slice = expression.slice(startIndex)
    const selectMenuMatch = slice.match(/^\\?selectmenu\{([^}]+)\}/i)
    if (selectMenuMatch) {
      return {
        functionName: selectMenuMatch[1].trim().toLowerCase(),
        nextIndex: startIndex + selectMenuMatch[0].length,
      }
    }

    const plainMatch = slice.match(
      /^(10\^|e\^|abs|plancher|plafond|floor|ceil|racine|sqrt|sin|cos|tan|asin|acos|atan|ln|log|arrondi)(?=\s|$|\()/i,
    )
    if (!plainMatch) {
      return null
    }

    return {
      functionName: plainMatch[1].trim().toLowerCase(),
      nextIndex: startIndex + plainMatch[0].length,
    }
  }

  private applyScratchMathFunction(
    functionName: string,
    operand: number,
  ): number | null {
    const normalizedFunctionName = functionName.trim().toLowerCase()
    let value: number

    switch (normalizedFunctionName) {
      case 'abs':
        value = Math.abs(operand)
        break
      case 'plancher':
      case 'floor':
        value = Math.floor(operand)
        break
      case 'plafond':
      case 'ceil':
        value = Math.ceil(operand)
        break
      case 'racine':
      case 'sqrt':
        if (operand < 0) return null
        value = Math.sqrt(operand)
        break
      case 'sin':
        value = Math.sin((operand * Math.PI) / 180)
        break
      case 'cos':
        value = Math.cos((operand * Math.PI) / 180)
        break
      case 'tan':
        value = Math.tan((operand * Math.PI) / 180)
        break
      case 'asin':
        if (operand < -1 || operand > 1) return null
        value = (Math.asin(operand) * 180) / Math.PI
        break
      case 'acos':
        if (operand < -1 || operand > 1) return null
        value = (Math.acos(operand) * 180) / Math.PI
        break
      case 'atan':
        value = (Math.atan(operand) * 180) / Math.PI
        break
      case 'ln':
        if (operand <= 0) return null
        value = Math.log(operand)
        break
      case 'log':
        if (operand <= 0) return null
        value = Math.log10(operand)
        break
      case 'e^':
        value = Math.exp(operand)
        break
      case '10^':
        value = 10 ** operand
        break
      case 'arrondi':
        value = Math.round(operand)
        break
      default:
        return null
    }

    return Number.isFinite(value) ? value : null
  }

  private evaluateArithmeticExpression(expression: string): number | null {
    const sanitized = this.materializeExpression(expression).replace(
      /\bmod(?:ulo)?\b/gi,
      '%',
    )
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

      const mathFunction = this.parseScratchMathFunctionAt(sanitized, index)
      if (mathFunction) {
        index = mathFunction.nextIndex
        skipSpaces()

        if (sanitized.slice(index).match(/^de\b/i)) {
          index += 2
        }

        const operand = parseFactor()
        if (operand === null) return null
        return this.applyScratchMathFunction(mathFunction.functionName, operand)
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
        if (operator !== '*' && operator !== '/' && operator !== '%') break
        index += 1
        const rhs = parseFactor()
        if (rhs === null) return null
        if (operator === '*') {
          value *= rhs
        } else if (operator === '/') {
          value /= rhs
        } else {
          value %= rhs
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

        // Détecter si c'est une concaténation de strings ou une opération arithmétique
        const value = this.evaluateOvalOperatorOrString(
          `\\ovaloperator{${inner}}`,
        )
        if (value === null) break

        // Si c'est un nombre, l'entourer de parenthèses pour les calculs
        // Si c'est une string ou un booléen, convertir en chaîne
        const replacement =
          typeof value === 'number' ? `(${value})` : String(value)
        result = result.replace(`\\ovaloperator{${inner}}`, replacement)
      }
    }

    replaceNestedOperators()

    result = result.replace(/\\ovalnum\{(-?\d+(?:[.,]\d+)?)\}/g, (_, num) =>
      String(Number.parseFloat(String(num).replace(',', '.'))),
    )

    result = result.replace(/\\ovalvariabl(?:e)?\{([^}]+)\}/g, (_, name) =>
      String(this.getVariableValue(String(name).trim())),
    )

    result = result.replace(/\\ovalsensing\{([^}]+)\}/g, (_, name) =>
      String(this.getVariableValue(String(name).trim())),
    )

    result = result.replace(/\\ovalmove\{([^}]+)\}/g, (_, name) =>
      String(this.getVariableValue(String(name).trim())),
    )

    return result
  }

  private isGoToInstruction(content: string): boolean {
    return /aller\s+[àa]\s*x\s*:/i.test(content) && /y\s*:/i.test(content)
  }

  private isChangeXInstruction(content: string): boolean {
    const normalized = content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (!normalized.includes('ajouter')) return false

    return (
      /\\selectmenu\{\s*x\s*\}/i.test(normalized) ||
      /\\ovalvariable\{\s*x\s*\}/i.test(normalized) ||
      /\\ovalmove\{\s*abscisse x\s*\}/i.test(normalized) ||
      /a\s*x\b/i.test(normalized)
    )
  }

  private isChangeYInstruction(content: string): boolean {
    const normalized = content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (!normalized.includes('ajouter')) return false

    return (
      /\\selectmenu\{\s*y\s*\}/i.test(normalized) ||
      /\\ovalvariable\{\s*y\s*\}/i.test(normalized) ||
      /\\ovalmove\{\s*ordonnee y\s*\}/i.test(normalized) ||
      /a\s*y\b/i.test(normalized)
    )
  }

  private isSetXInstruction(content: string): boolean {
    const normalized = content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      /mettre\s*x\s*a/i.test(normalized) ||
      /mettre\s*\\selectmenu\{\s*x\s*\}\s*a/i.test(normalized) ||
      /mettre\s*\\ovalvariable\{\s*x\s*\}\s*a/i.test(normalized) ||
      /mettre\s*\\ovalmove\{\s*abscisse x\s*\}\s*a/i.test(normalized)
    )
  }

  private isSetYInstruction(content: string): boolean {
    const normalized = content
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      /mettre\s*y\s*a/i.test(normalized) ||
      /mettre\s*\\selectmenu\{\s*y\s*\}\s*a/i.test(normalized) ||
      /mettre\s*\\ovalvariable\{\s*y\s*\}\s*a/i.test(normalized) ||
      /mettre\s*\\ovalmove\{\s*ordonnee y\s*\}\s*a/i.test(normalized)
    )
  }

  private isDireInstruction(content: string): boolean {
    return /\bdire\b/i.test(content)
  }

  private isPenserInstruction(content: string): boolean {
    return /\bpenser\b/i.test(content)
  }

  private isCacherInstruction(content: string): boolean {
    return /\bcacher\b/i.test(content)
  }

  private isMontrerInstruction(content: string): boolean {
    return /\bmontrer\b/i.test(content)
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
    this.angle = this.normalizeAngle(angle)
  }

  private normalizeAngle(angle: number): number {
    const normalized = ((((angle + 180) % 360) + 360) % 360) - 180
    return normalized === -180 ? 180 : normalized
  }

  private addTraceSegment(endX: number, endY: number): void {
    if (!this.penDown) {
      return
    }

    this.traces.push({
      startX: this.x,
      startY: this.y,
      endX,
      endY,
      color: this.penColor,
      width: this.penWidth,
    })
  }

  private moveForward(steps: number): void {
    const rad = (this.angle * Math.PI) / 180
    const newX = this.x + steps * Math.sin(rad)
    const newY = this.y - steps * Math.cos(rad)

    this.addTraceSegment(newX, newY)

    this.x = newX
    this.y = newY
  }

  private changeXBy(deltaX: number): void {
    const newX = this.x + deltaX

    this.addTraceSegment(newX, this.y)

    this.x = newX
  }

  private changeYBy(deltaY: number): void {
    const newY = this.y - deltaY

    this.addTraceSegment(this.x, newY)

    this.y = newY
  }

  private setXTo(targetX: number): void {
    const newX = 200 + targetX

    this.addTraceSegment(newX, this.y)

    this.x = newX
  }

  private setYTo(targetY: number): void {
    const newY = 200 - targetY

    this.addTraceSegment(this.x, newY)

    this.y = newY
  }

  private goTo(targetX: number, targetY: number): void {
    const newX = 200 + targetX
    const newY = 200 - targetY

    this.addTraceSegment(newX, newY)

    this.x = newX
    this.y = newY
  }

  private extractPenColor(content: string): string | null {
    const rawColor = this.extractCommandContent(content, '\\pencolor')
    if (!rawColor) {
      return null
    }

    const color = rawColor.trim()
    if (!color) {
      return null
    }

    const htmlMatch = color.match(/^\[HTML\]\{([0-9a-fA-F]{6})\}$/)
    if (htmlMatch) {
      return `#${htmlMatch[1]}`
    }

    return color
  }

  private normalizePenColorValue(value: number): number {
    const modulo = 200
    return ((value % modulo) + modulo) % modulo
  }

  private setPenColorFromValue(value: number): void {
    this.penColorValue = value
    this.updatePenColorFromParams()
  }

  private addToPenColor(delta: number): void {
    const baseValue = this.penColorValue ?? 0
    const nextValue = baseValue + delta
    this.penColorValue = nextValue
    this.updatePenColorFromParams()
  }

  private turn(degrees: number): void {
    this.angle += degrees
    this.angle = this.normalizeAngle(this.angle)
  }
}
