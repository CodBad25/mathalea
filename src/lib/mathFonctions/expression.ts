export type Operator = '+' | '-' | '\\times' | '\\div' | '^'

export type ArithmeticOperation = 'plus' | 'moins' | 'multi' | 'divise'

export type ArithmeticAst =
  | {
      type: 'number'
      value: number
    }
  | {
      type: 'operation'
      op: ArithmeticOperation
      left: ArithmeticAst
      right: ArithmeticAst
    }

export interface GenerateArithmeticAstOptions {
  negativeAllowed?: boolean
  strictInteger?: boolean
  maxAttempts?: number
  operationCount?: 1 | 2 | 3
  requireParentheses?: boolean
}

type JsonRecord = Record<string, unknown>

export interface ExpressionNode {
  operator: Operator
  left: ExpressionNode | number | string
  right: ExpressionNode | number | string
}

export type Expression = ExpressionNode | number | string

function getArithmeticPrecedence(op: ArithmeticOperation): number {
  if (op === 'plus' || op === 'moins') return 1
  return 2
}

function arithmeticLatexOperator(op: ArithmeticOperation): string {
  if (op === 'plus') return '+'
  if (op === 'moins') return '-'
  if (op === 'multi') return '\\times'
  return '\\div'
}

export function arithmeticAstToLatex(
  node: ArithmeticAst,
  preferDivToFrac: boolean,
  parentPrecedence = 0,
  isRightChild = false,
): string {
  if (node.type === 'number') return String(node.value)

  if (node.op === 'divise' && !preferDivToFrac) {
    return `\\dfrac{${arithmeticAstToLatex(node.left, preferDivToFrac)}}{${arithmeticAstToLatex(node.right, preferDivToFrac)}}`
  }

  const precedence = getArithmeticPrecedence(node.op)
  const left = arithmeticAstToLatex(
    node.left,
    preferDivToFrac,
    precedence,
    false,
  )
  const right = arithmeticAstToLatex(
    node.right,
    preferDivToFrac,
    precedence,
    true,
  )
  const expr = `${left} ${arithmeticLatexOperator(node.op)} ${right}`

  const samePriorityNeedsWrap =
    isRightChild && precedence === parentPrecedence && node.op !== 'plus'
  const lowerPriorityNeedsWrap = precedence < parentPrecedence

  return samePriorityNeedsWrap || lowerPriorityNeedsWrap ? `(${expr})` : expr
}

export function arithmeticAstToBlocklyValue(
  node: ArithmeticAst,
): Record<string, unknown> {
  if (node.type === 'number') {
    return {
      type: 'textinput',
      fields: {
        NUM: String(node.value),
      },
    }
  }

  return {
    type: 'operation',
    fields: {
      op: node.op,
    },
    inputs: {
      op1: {
        block: arithmeticAstToBlocklyValue(node.left),
      },
      op2: {
        block: arithmeticAstToBlocklyValue(node.right),
      },
    },
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === 'object'
    ? (value as JsonRecord)
    : null
}

function readInputBlock(
  block: JsonRecord,
  inputName: string,
): JsonRecord | null {
  const inputs = asRecord(block.inputs)
  if (!inputs) return null
  const input = asRecord(inputs[inputName])
  if (!input) return null
  return asRecord(input.block)
}

function parseNumberBlock(block: JsonRecord): ArithmeticAst | null {
  const fields = asRecord(block.fields)
  const rawNum = fields?.NUM
  if (typeof rawNum !== 'string' && typeof rawNum !== 'number') return null
  const value = Number(rawNum)
  if (!Number.isFinite(value)) return null
  return { type: 'number', value }
}

function normalizeBlocklyOp(op: string): ArithmeticOperation | null {
  if (op === 'plus' || op === 'moins' || op === 'multi' || op === 'divise') {
    return op
  }
  if (op === 'fraction') return 'divise'
  return null
}

export function blocklyValueToArithmeticAst(
  block: unknown,
): ArithmeticAst | null {
  const record = asRecord(block)
  if (!record) return null

  const type = record.type
  if (type === 'textinput') return parseNumberBlock(record)
  if (type !== 'operation') return null

  const fields = asRecord(record.fields)
  const rawOp = fields?.op
  if (typeof rawOp !== 'string') return null
  const op = normalizeBlocklyOp(rawOp)
  if (!op) return null

  const leftBlock = readInputBlock(record, 'op1')
  const rightBlock = readInputBlock(record, 'op2')
  if (!leftBlock || !rightBlock) return null

  const left = blocklyValueToArithmeticAst(leftBlock)
  const right = blocklyValueToArithmeticAst(rightBlock)
  if (!left || !right) return null

  return {
    type: 'operation',
    op,
    left,
    right,
  }
}

function findMessageValueBlockInStatement(
  block: JsonRecord,
): JsonRecord | null {
  const type = block.type

  if (type === 'dire_2s') {
    return readInputBlock(block, 'MESSAGE')
  }

  const next = asRecord(block.next)
  const nextBlock = asRecord(next?.block)
  if (!nextBlock) return null
  return findMessageValueBlockInStatement(nextBlock)
}

export function blocklyWorkspaceToArithmeticAst(
  workspaceJson: unknown,
): ArithmeticAst | null {
  const workspace = asRecord(workspaceJson)
  if (!workspace) return null

  const blocksRoot = asRecord(workspace.blocks)
  const topBlocks = blocksRoot?.blocks
  if (!Array.isArray(topBlocks)) return null

  for (const topBlock of topBlocks) {
    const record = asRecord(topBlock)
    if (!record) continue
    const valueBlock = findMessageValueBlockInStatement(record)
    if (!valueBlock) continue
    const ast = blocklyValueToArithmeticAst(valueBlock)
    if (ast) return ast
  }

  return null
}

export function areArithmeticAstsEquivalent(
  left: ArithmeticAst,
  right: ArithmeticAst,
): boolean {
  const collectAdditiveTerms = (
    node: ArithmeticAst,
    sign: 1 | -1,
    acc: string[],
    signature: (inner: ArithmeticAst) => string,
  ): void => {
    if (node.type === 'operation' && node.op === 'plus') {
      collectAdditiveTerms(node.left, sign, acc, signature)
      collectAdditiveTerms(node.right, sign, acc, signature)
      return
    }

    if (node.type === 'operation' && node.op === 'moins') {
      collectAdditiveTerms(node.left, sign, acc, signature)
      collectAdditiveTerms(node.right, sign === 1 ? -1 : 1, acc, signature)
      return
    }

    const signedPrefix = sign === 1 ? '+' : '-'
    acc.push(`${signedPrefix}${signature(node)}`)
  }

  const collectMultiplicativeTerms = (
    node: ArithmeticAst,
    acc: string[],
    signature: (inner: ArithmeticAst) => string,
  ): void => {
    if (node.type === 'operation' && node.op === 'multi') {
      collectMultiplicativeTerms(node.left, acc, signature)
      collectMultiplicativeTerms(node.right, acc, signature)
      return
    }
    acc.push(signature(node))
  }

  const signature = (node: ArithmeticAst): string => {
    if (node.type === 'number') return `n:${String(node.value)}`

    if (node.op === 'plus' || node.op === 'moins') {
      const additiveTerms: string[] = []
      collectAdditiveTerms(node, 1, additiveTerms, signature)
      additiveTerms.sort()
      return `add(${additiveTerms.join(',')})`
    }

    if (node.op === 'multi') {
      const multiplicativeTerms: string[] = []
      collectMultiplicativeTerms(node, multiplicativeTerms, signature)
      multiplicativeTerms.sort()
      return `mul(${multiplicativeTerms.join(',')})`
    }

    return `op:${node.op}(${signature(node.left)}|${signature(node.right)})`
  }

  return signature(left) === signature(right)
}

export function buildBlocklySaySolutionBlocks(
  ast: ArithmeticAst,
): Record<string, unknown> {
  return {
    blocks: {
      blocks: [
        {
          type: 'demarrer',
          next: {
            block: {
              type: 'dire_2s',
              inputs: {
                MESSAGE: {
                  block: arithmeticAstToBlocklyValue(ast),
                },
              },
            },
          },
        },
      ],
    },
  }
}

export function evaluateArithmeticAst(node: ArithmeticAst): number {
  if (node.type === 'number') return node.value

  const left = evaluateArithmeticAst(node.left)
  const right = evaluateArithmeticAst(node.right)

  if (node.op === 'plus') return left + right
  if (node.op === 'moins') return left - right
  if (node.op === 'multi') return left * right
  return left / right
}

export function hasAtLeastTwoOperationOccurrences(
  node: ArithmeticAst,
  operation: ArithmeticOperation,
): boolean {
  let count = 0

  const walk = (current: ArithmeticAst): void => {
    if (count >= 2) return
    if (current.type === 'number') return

    if (current.op === operation) count++
    walk(current.left)
    walk(current.right)
  }

  walk(node)
  return count >= 2
}

export function hasAtLeastTwoPlusOrMulti(node: ArithmeticAst): boolean {
  return (
    hasAtLeastTwoOperationOccurrences(node, 'plus') ||
    hasAtLeastTwoOperationOccurrences(node, 'multi')
  )
}

function validateArithmeticAst(
  node: ArithmeticAst,
  options: Required<
    Pick<GenerateArithmeticAstOptions, 'negativeAllowed' | 'strictInteger'>
  >,
): { ok: boolean; value: number } {
  if (node.type === 'number') {
    return {
      ok: options.negativeAllowed || node.value >= 0,
      value: node.value,
    }
  }

  const left = validateArithmeticAst(node.left, options)
  if (!left.ok) return { ok: false, value: 0 }

  const right = validateArithmeticAst(node.right, options)
  if (!right.ok) return { ok: false, value: 0 }

  if (
    (node.op === 'divise' && right.value === 0) ||
    !Number.isFinite(right.value)
  ) {
    return { ok: false, value: 0 }
  }

  let value = 0
  if (node.op === 'plus') value = left.value + right.value
  else if (node.op === 'moins') value = left.value - right.value
  else if (node.op === 'multi') value = left.value * right.value
  else value = left.value / right.value

  if (!Number.isFinite(value)) return { ok: false, value: 0 }
  if (!options.negativeAllowed && value < 0) return { ok: false, value }
  if (options.strictInteger && !Number.isInteger(value)) {
    return { ok: false, value }
  }

  return { ok: true, value }
}

function randomOperation(
  allowed: ArithmeticOperation[],
  randInt: (min: number, max: number) => number,
): ArithmeticOperation {
  return allowed[randInt(0, allowed.length - 1)]
}

function randomNumberForOp(
  op: ArithmeticOperation,
  randInt: (min: number, max: number) => number,
): number {
  return op === 'divise' ? randInt(2, 10) : randInt(2, 30)
}

export function generateArithmeticAst(
  level: number,
  randInt: (min: number, max: number) => number,
  options: GenerateArithmeticAstOptions = {},
): ArithmeticAst {
  const normalizedOptions: Required<
    Pick<
      GenerateArithmeticAstOptions,
      'negativeAllowed' | 'strictInteger' | 'maxAttempts'
    >
  > = {
    negativeAllowed: options.negativeAllowed ?? true,
    strictInteger: options.strictInteger ?? false,
    maxAttempts: options.maxAttempts ?? 300,
  }

  const allOps: ArithmeticOperation[] = ['plus', 'moins', 'multi', 'divise']
  const lowOps: ArithmeticOperation[] = ['plus', 'moins']
  const highOps: ArithmeticOperation[] = ['multi', 'divise']

  const operationCount: 1 | 2 | 3 =
    options.operationCount ?? (level <= 1 ? 1 : level === 2 ? 2 : 3)
  const requireParentheses: boolean = options.requireParentheses ?? level === 3

  const buildCandidate = (): ArithmeticAst => {
    if (operationCount === 1) {
      const op = randomOperation(allOps, randInt)
      return {
        type: 'operation',
        op,
        left: { type: 'number', value: randInt(2, 30) },
        right: { type: 'number', value: randomNumberForOp(op, randInt) },
      }
    }

    if (operationCount === 2) {
      const parentOp = randomOperation(lowOps, randInt)
      const childOp = randomOperation(highOps, randInt)
      const childOnLeft = randInt(0, 1) === 0
      const childAst: ArithmeticAst = {
        type: 'operation',
        op: childOp,
        left: { type: 'number', value: randInt(2, 12) },
        right: { type: 'number', value: randomNumberForOp(childOp, randInt) },
      }

      return {
        type: 'operation',
        op: parentOp,
        left: childOnLeft
          ? childAst
          : { type: 'number', value: randInt(2, 20) },
        right: childOnLeft
          ? { type: 'number', value: randInt(2, 20) }
          : childAst,
      }
    }

    if (requireParentheses) {
      // Avec parenthèses obligatoires: on force un produit de deux sous-expressions additives.
      // Exemple: (a + b) × (c - d)
      const leftOp = randomOperation(lowOps, randInt)
      const rightOp = randomOperation(lowOps, randInt)
      return {
        type: 'operation',
        op: 'multi',
        left: {
          type: 'operation',
          op: leftOp,
          left: { type: 'number', value: randInt(2, 15) },
          right: {
            type: 'number',
            value: randomNumberForOp(leftOp, randInt),
          },
        },
        right: {
          type: 'operation',
          op: rightOp,
          left: { type: 'number', value: randInt(2, 15) },
          right: {
            type: 'number',
            value: randomNumberForOp(rightOp, randInt),
          },
        },
      }
    }

    // Sans parenthèses explicites: chaîne gauche de 3 opérations.
    // Exemple: a - b + c × d
    const op1 = randomOperation(allOps, randInt)
    const op2 = randomOperation(allOps, randInt)
    const op3 = randomOperation(allOps, randInt)
    return {
      type: 'operation',
      op: op3,
      left: {
        type: 'operation',
        op: op2,
        left: {
          type: 'operation',
          op: op1,
          left: { type: 'number', value: randInt(2, 20) },
          right: { type: 'number', value: randomNumberForOp(op1, randInt) },
        },
        right: { type: 'number', value: randomNumberForOp(op2, randInt) },
      },
      right: { type: 'number', value: randomNumberForOp(op3, randInt) },
    }
  }

  for (let attempt = 0; attempt < normalizedOptions.maxAttempts; attempt++) {
    const candidate = buildCandidate()
    if (
      validateArithmeticAst(candidate, normalizedOptions).ok &&
      !hasAtLeastTwoPlusOrMulti(candidate)
    ) {
      return candidate
    }
  }

  // Fallback garanti pour éviter un échec en cas de contraintes trop strictes.
  const safeValue = randInt(2, 20)
  return {
    type: 'operation',
    op: 'plus',
    left: { type: 'number', value: safeValue },
    right: { type: 'number', value: randInt(2, 20) },
  }
}

/**
 * Analyse un arbre de calculs avec priorité et fournit une string avec uniquement les parenthèses utiles
  const example: Expression = {
    operator: '+',
    left: {
        operator: '*',
        left: 'a',
        right: 'b'
    },
    right: {
        operator: '^',
        left: 'c',
        right: 'd'
    }
  }
  parseExpression(example, 0)
  resultat :
  a * b + c^d
 * @param expression
 * @param parentPrecedence
 * @param position branche du parent est à gauche ou à droite
 * @returns
 */
export function parseExpression(
  expression: Expression,
  parentPrecedence = 0,
  position: 'g' | 'd' | '' = '',
): string {
  if (typeof expression === 'number' || typeof expression === 'string') {
    // Si c'est un nombre ou une variable, retournez-le directement
    return expression.toString()
  }

  if ('operator' in expression) {
    const precedence = getOperatorPrecedence(expression.operator)
    const left = parseExpression(expression.left, precedence, 'g')
    const right = parseExpression(expression.right, precedence, 'd') // Associativité à gauche pour la plupart des opérateurs

    // Ajout de parenthèses si la priorité du parent est plus élevée que celle de l'opérateur actuel
    let shouldWrap = false
    if (position === 'd' && precedence === parentPrecedence) shouldWrap = true
    if (position === 'g' && precedence === parentPrecedence) shouldWrap = false
    if (precedence < parentPrecedence) shouldWrap = true
    const expressionString = `${left} ${expression.operator} ${right}`
    return shouldWrap ? `(${expressionString})` : expressionString
  }
  throw new Error('Expression invalide')
}

function getOperatorPrecedence(operator: Operator | ''): number {
  switch (operator) {
    case '^':
      return 3
    case '\\times':
    case '\\div':
      return 2
    case '+':
    case '-':
      return 1
    default:
      return 0 // Pas d'opérateur
  }
}
