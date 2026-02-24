/**
 * Interpréteur pour exécuter des programmes Scratch
 * @author Jean-Claude Lhote
 */

import { scratchblock } from '../modules/scratchblock'

export interface ExecutionResult {
  traces: Array<{ startX: number; startY: number; endX: number; endY: number }>
  finalX: number
  finalY: number
  finalAngle: number
  visible: boolean
  variables: Record<string, number>
  messages: string[]
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
  private x: number
  private y: number
  private angle: number // en degrés Scratch, 0° = vers le haut, 90° = vers la droite
  private penDown: boolean = false
  private visible: boolean = true
  private stopped: boolean = false // Flag pour arrêter l'exécution
  private answer: string = '' // Variable réservée "réponse" pour stocker les inputs utilisateur
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
  private currentConditionText: string = ''
  private currentConditionResult: boolean | null = null
  private repeatIterations: Array<{
    mode: 'times' | 'until'
    current: number
    total: number | null
  }> = []

  private onUpdate?: () => void | Promise<void>
  private skipWaitBlocks: boolean = false
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
    this.stopped = false
    this.answer = ''
    this.onUpdate = onUpdate
    this.skipWaitBlocks = options.skipWaitBlocks === true
    this.currentInstructionIndex = -1
    this.repeatIterations = []

    const codeWithoutDefinitions = this.parseCustomBlockDefinitions(scratchCode)

    await this.parseAndExecuteAnimated(codeWithoutDefinitions, delayMs)

    this.onUpdate = undefined
    this.skipWaitBlocks = false

    return this.getCurrentState()
  }

  private async wait(delayMs: number): Promise<void> {
    if (this.skipWaitBlocks || delayMs <= 0) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
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
        await this.wait(delayMs / 2)
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
        await this.wait(delayMs / 2)
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
        const times = this.extractNumber(repeatContent)

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
        await this.wait(delayMs / 2)

        // Exécuter l'action
        await this.executeBlockAction(block.type, block.content, delayMs)
        // Afficher les infos mises à jour
        if (this.onUpdate) {
          await Promise.resolve(this.onUpdate())
        }
        // Attendre le délai
        await this.wait(delayMs / 2)
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
    if (type === 'look') {
      if (this.isDireInstruction(content)) {
        const sayInstruction = this.parseSayInstruction(content)
        if (!sayInstruction) {
          return
        }

        this.messages.push(sayInstruction.spokenValue)

        if (sayInstruction.durationSeconds !== null) {
          const durationMs = Math.max(0, sayInstruction.durationSeconds * 1000)
          if (durationMs > 0) {
            await this.wait(durationMs)
          }
        }
      }
      if (this.isCacherInstruction(content)) {
        this.visible = false
        return
      }
      if (this.isMontrerInstruction(content)) {
        this.visible = true
        return
      }
      // TODO: implémenter 'cacher', 'montrer', etc.
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
      const normalized = content
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      if (normalized.includes('position') || normalized.includes('ecriture')) {
        this.penDown = true
      } else if (normalized.includes('relever')) {
        this.penDown = false
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
      // Le bloc sensing sera géré de manière asynchrone dans executeBlockAction
      // En mode synchrone, on ne peut pas vraiment attendre l'utilisateur
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

      if (this.isChangeYInstruction(content)) {
        return `Ajouter ${this.extractNumericValue(content)} a y`
      }

      if (this.isSetXInstruction(content)) {
        return `Mettre x a ${this.extractNumericValue(content)}`
      }

      if (this.isSetYInstruction(content)) {
        return `Mettre y a ${this.extractNumericValue(content)}`
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

    if (type === 'ifelse') {
      // Extraire juste le début de la condition pour l'affichage
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
      const rendered = scratchblock(candidate)
      if (rendered !== false) {
        return rendered
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
    if (!/\bdire\b/i.test(content)) {
      return null
    }

    const saySegments = content.split(/\bpendant\b/i)
    const payload = saySegments[0].replace(/^.*?\bdire\b/i, '').trim()

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

  private extractNumericValue(content: string): number {
    const operatorValue = this.evaluateOvalOperator(content)
    if (operatorValue !== null) {
      return operatorValue
    }

    const directNumber = this.extractNumber(content)
    if (/\\ovalnum\{|-?\d+(?:[.,]\d+)?/.test(content)) {
      return directNumber
    }

    const varName =
      this.extractOvalVariableName(content) ||
      this.extractOvalSensingName(content) ||
      this.extractOvalMoveName(content)
    if (varName) {
      return this.getVariableValue(varName)
    }

    return directNumber
  }

  private extractValue(content: string): string | number {
    // Essayer d'abord d'évaluer comme ovaloperator (peut retourner string ou number)
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
    const expression = this.extractCommandContent(content, '\\ovaloperator')
    if (!expression) return null
    return this.evaluateArithmeticExpression(expression)
  }

  private evaluateOvalOperatorOrString(
    content: string,
  ): string | number | null {
    const expression = this.extractCommandContent(content, '\\ovaloperator')
    if (!expression) return null

    // Détecter "regrouper ... et ..." pour concaténation de strings
    if (/\bregrouper\b/i.test(expression)) {
      return this.evaluateStringConcatenation(expression)
    }

    // Sinon, évaluation arithmétique
    return this.evaluateArithmeticExpression(expression)
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

    // Parser "regrouper X et Y"
    const match = result.match(/regrouper\s+(.+?)\s+et\s+(.+?)$/i)
    if (!match) {
      // Si pas de pattern trouvé, retourner l'expression telle quelle
      return this.materializeExpressionForString(result)
    }

    const leftPart = match[1].trim()
    const rightPart = match[2].trim()

    // Matérialiser chaque partie (remplacer \ovalnum, \ovalvariable, etc.)
    const leftValue = this.materializeExpressionForString(leftPart)
    const rightValue = this.materializeExpressionForString(rightPart)

    return leftValue + rightValue
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
        // Si c'est une string, la garder telle quelle
        const replacement = typeof value === 'number' ? `(${value})` : value
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

  private changeYBy(deltaY: number): void {
    const newY = this.y - deltaY

    if (this.penDown) {
      this.traces.push({
        startX: this.x,
        startY: this.y,
        endX: this.x,
        endY: newY,
      })
    }

    this.y = newY
  }

  private setXTo(targetX: number): void {
    const newX = 200 + targetX

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

  private setYTo(targetY: number): void {
    const newY = 200 - targetY

    if (this.penDown) {
      this.traces.push({
        startX: this.x,
        startY: this.y,
        endX: this.x,
        endY: newY,
      })
    }

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
