import Decimal from 'decimal.js'
import {
  Equation,
  factor,
  Negative,
  Node,
  printMS,
  SIMPLIFICATION_FUNCTIONS,
  simplifyExpression,
  solveEquation,
  TreeSearch,
} from 'mathsteps'
import { choice } from '../lib/outils/arrayOutils'
import { obtenirListeFacteursPremiers } from '../lib/outils/primalite'
import { texNombre2 } from '../lib/outils/texNombre'
import { randint } from '../modules/outils'
import { getNewChangeNodes } from './Change'
import { context } from './context'
import {
  math,
  OperatorNode,
  ParenthesisNode,
  SymbolNode,
  type Fraction,
  type MathNode,
} from './MathjsInstance'

type ListeVariable =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'test'

export type Variables = Partial<
  Record<ListeVariable, string | number | boolean | Fraction | object>
>

function searchFirstNode(node: MathNode): MathNode {
  if (node.type === 'OperatorNode') {
    return searchFirstNode((node as OperatorNode).args[0])
  } else if (node.type === 'ParenthesisNode') {
    return searchFirstNode((node as ParenthesisNode).content)
  }
  return node
}

function searchLastNode(node: MathNode): MathNode {
  if (node.type === 'OperatorNode') {
    return searchLastNode(
      (node as OperatorNode).args[(node as OperatorNode).args.length - 1],
    )
  } else if (node.type === 'ParenthesisNode') {
    return searchLastNode((node as ParenthesisNode).content)
  } else {
    return node
  }
}

/**
 * Assignation de variables
 * @param {string} expression
 * @param {Object} variables
 * @returns {string}
 */
export function assignVariables(expression: string, variables: Variables) {
  let node = math.parse(expression)
  node = node.transform((node: MathNode) => {
    if (node.type === 'SymbolNode') {
      const nodeName = (node as SymbolNode).name
      const variable = variables[nodeName as keyof Variables]
      if (variable !== undefined) {
        return new math.ConstantNode(Number(variable))
      }
    }
    return node
  })
  return node?.toString({ parenthesis: 'keep' })
}

function transformNode(
  node: Node,
  parent: Node | undefined,
  oldNode: Node | undefined,
  params = { suppr1: true, suppr0: true, supprPlusMoins: true },
) {
  params = Object.assign(
    { suppr1: true, suppr0: true, supprPlusMoins: true },
    params,
  )
  if (parent === null && node.isParenthesisNode) node = node.content
  if (oldNode === undefined || node.toString() !== oldNode.toString()) {
    oldNode = node.clone()
    /*
     * Retirer les parenthèses au dividende et diviseur d'un quotient
     * (n1)/(n2) devient n1/n2
     */
    if (node.isOperatorNode && node.op === '/') {
      if (node.args[0].isParenthesisNode) {
        node.args[0] = node.args[0].content
      }
      if (node.args[1].isParenthesisNode) {
        node.args[1] = node.args[1].content
      }
    }
    /*
     * Transformer -2/n en -(2/n)
     * Ne touche pas à (-2)/(-n)
     */
    if (node.isOperatorNode && node.op === '/') {
      if (
        node.args[0].type === 'OperatorNode' &&
        node.args[0].fn === 'unaryMinus' &&
        (node.args[0].args[0].type === 'ConstantNode' ||
          node.args[0].args[0].type === 'SymbolNode') &&
        !(
          node.args[1].type === 'OperatorNode' &&
          node.args[1].fn === 'unaryMinus'
        )
      ) {
        let frac = Node.Creator.operator('/', [
          node.args[0].args[0],
          node.args[1],
        ])
        frac = Node.Creator.parenthesis(frac)
        node = math.parse('-' + frac.toString())
      }
    }
    /* (Flatten divisions comme dans Mathsteps)
     * Transformer (1/2*3)/4 en 1/2*(3/4)
     */
    if (node.isOperatorNode && node.op === '/') {
      if (node.args[0].isOperatorNode && node.args[0].op === '*') {
        if (
          node.args[0].args[0].isOperatorNode &&
          node.args[0].args[0].op === '/'
        ) {
          const frac1 = Node.Creator.operator('/', node.args[0].args[0].args)
          const frac2 = Node.Creator.operator('/', [
            node.args[0].args[1],
            node.args[1],
          ])
          node = Node.Creator.operator('*', [frac1, frac2])
        }
      }
    }
    /*
     * Transformer (n1)+(n2) en n1+n2
     * Utile si n1 et/ou n2 sont des unaryMinus ou des fractions
     */
    if (node.isOperatorNode && node.op === '+') {
      if (params.supprPlusMoins) {
        if (node.args[0].isParenthesisNode) node.args[0] = node.args[0].content
        if (node.args.length > 1 && node.args[1].isParenthesisNode) {
          node.args[1] = node.args[1].content
        }
      } else {
        if (
          node.args[0].isParenthesisNode &&
          node.args[0].content.toString()[0] !== '-' &&
          node.args[0].content.toString()[0] !== '+'
        ) {
          node.args[0] = node.args[0].content
        }
        if (
          node.args.length > 1 &&
          node.args[1].isParenthesisNode &&
          node.args[1].content.toString()[0] !== '-' &&
          node.args[1].content.toString()[0] !== '+'
        ) {
          node.args[1] = node.args[1].content
        }
      }
    }
    /*
     * Transformer n+0 en n
     */
    if (
      params.suppr0 &&
      node.isOperatorNode &&
      node.op === '+' &&
      node.fn !== 'unaryPlus'
    ) {
      if (node.args[1].toString() === '0') {
        node = node.args[0]
      }
    }
    /*
     * Transformer n1+0*n2 en n1
     */
    if (
      params.suppr0 &&
      node.isOperatorNode &&
      node.op === '+' &&
      node.fn !== 'unaryPlus'
    ) {
      if (
        node.args[1].isOperatorNode &&
        node.args[1].op === '*' &&
        node.args[1].args[0].toString() === '0'
      ) {
        node = node.args[0]
      }
    }
    /*
     * Transformer 1*n en n et -1*n en -n
     */
    if (
      params.suppr1 &&
      node.isOperatorNode &&
      node.op === '*' &&
      searchFirstNode(node.args[1]).type !== 'ConstantNode'
    ) {
      if (node.args[0].toString() === '1') {
        node = node.args[1]
      } else if (node.args[0].toString() === '-1') {
        node = math.parse('-' + node.args[1].toString())
      }
    }
    /*
     * Transformer n/1 en n et n/-1 en -n
     */
    if (params.suppr1 && node.type === 'OperatorNode' && node.op === '/') {
      if (node.args[1].toString() === '1') {
        node = node.args[0]
      } else if (node.args[1].toString() === '-1') {
        node = math.parse('-' + node.args[0].toString())
      }
    }
    /*
     * Transformer (n1)-n2 en n1-n2
     * Transformer --c en -(-c)
     * transformer n1-(n2/n3) en n1-n2/n3
     */
    if (node.isOperatorNode && node.op === '-') {
      // Enlève les parenthèses au premier terme d'une soustraction et au second sous condition d'une /
      if (node.args[0].isParenthesisNode) node.args[0] = node.args[0].content
      if (
        node.args.length === 1 &&
        node.args[0].isConstantNode &&
        node.args[0].value < 0
      ) {
        // Pour corriger --3 en -(-3)
        node.args[0] = Node.Creator.parenthesis(node.args[0])
      }
      if (
        node.args.length === 2 &&
        node.args[1].isConstantNode &&
        node.args[1].value < 0
      ) {
        // Pour corriger 7--3 en 7-(-3)
        node.args[1] = Node.Creator.parenthesis(node.args[1])
      }
      if (
        node.args.length === 2 &&
        node.args[1].isParenthesisNode &&
        node.args[1].content.toString()[0] !== '-'
      ) {
        node.args[1] = node.args[1].content
      }
      /*
       * Code à simplifier ?
       */
      if (
        node.fn !== 'unaryMinus' && // On vérifie si c'est une vraie soustraction (avec deux termes)
        node.args[1].isParenthesisNode && // On vérifie que le second terme possède une parenthèse
        node.args[1].content.isOperatorNode && // On vérifie que le second terme contient une opération
        (node.args[1].content.op === '/' || // On teste si cette opération est une division
          (node.args[1].content.op === '*' && // On teste si c'est une multiplication
            (!node.args[1].content.args[0].isOperatorNode || // Si le premier facteur n'est pas une opération
              (node.args[1].content.args[0].isOperatorNode && // Ou si c'est une opération
                node.args[1].content.args[0].fn !== 'unaryMinus')))) // mais que le premier argument n'est pas -blabla
      ) {
        node.args[1] = node.args[1].content
      }
    }
    if (node.isOperatorNode && node.op === '*') {
      // Enlève les parenthèses aux deux facteurs d'une multiplication
      if (
        node.args[0].isParenthesisNode && // On cherche à l'intérieur d'une parenthèse
        (!node.args[0].content.isOperatorNode || // Il ne faut pas d'opération
          (node.args[0].content.isOperatorNode &&
            node.args[0].content.op === '/') || // ou alors une divisions
          (node.args[0].content.isOperatorNode &&
            node.args[0].content.fn === 'unaryMinus' &&
            params.supprPlusMoins)) // ou alors un -n
      ) {
        // Si l'une des conditions est vérifiée alors :
        node.args[0] = node.args[0].content // on enlève la parenthèse
        node.implicit = false // on fait en sorte que la multiplication soit visible
      }
      if (
        node.args[1].isParenthesisNode &&
        (!node.args[1].content.isOperatorNode ||
          (node.args[1].content.isOperatorNode &&
            node.args[1].content.op === '/' &&
            !(
              node.args[1].content.args[0].type === 'OperatorNode' &&
              node.args[1].content.args[0].fn === 'unaryMinus' &&
              node.args[1].content.args[0].args[0].type === 'ConstantNode' &&
              !(
                node.args[1].content.args[1].type === 'OperatorNode' &&
                node.args[1].content.args[1].fn === 'unaryMinus'
              )
            )))
      ) {
        node.args[1] = node.args[1].content
        node.implicit = false
      }
    }
    if (node.type === 'OperatorNode' && node.op === '*') {
      // Corrige n*-c en n*(-c)
      if (node.args[1].toString()[0] === '-') {
        node.args[1] = Node.Creator.parenthesis(node.args[1])
      }
    }
    // Peut-être faut-il mettre à jour le mathjs de mathsteps car il semble que le code suivant ne fonctionne pas
    // dans mathsteps lorsqu'il est placé dans print de mathsteps
    // alors qu'il fonctionne avec la version mathjs de mathalea
    if (node.isOperatorNode && node.op === '*') {
      // Multiplication implicite 2*x devient 2x et 2*(x+3) devient 2(x+3)
      if (
        (node.args[1].type === 'ParenthesisNode' ||
          node.args[1].type === 'SymbolNode') &&
        !(searchLastNode(node.args[0]).type === 'SymbolNode')
      ) {
        node.implicit = true
      }
      if (
        node.args[1].isOperatorNode &&
        node.args[1].op === '^' &&
        node.args[1].args[0].isSymbolNode
      ) {
        node.implicit = true
      }
    }
    if (node.isOperatorNode && node.op === '*') {
      // Multiplication explicite x*2 ou x*2/3
      if (node.args[1].isConstantNode) node.implicit = false
      if (node.args[1].isOperatorNode && node.args[1].args[0].isConstantNode) {
        node.implicit = false
      }
      if (node.args[1].isOperatorNode && node.args[1].op === '/') {
        node.implicit = false
      }
      if (
        node.args[1].isOperatorNode &&
        node.args[1].args[0].isOperatorNode &&
        node.args[1].args[0].op === '/'
      ) {
        node.implicit = false
      }
      if (
        node.args[1].isParenthesisNode &&
        node.args[1].content.isOperatorNode &&
        node.args[1].content.fn === 'unaryMinus'
      ) {
        node.implicit = false
      }
    }
    if (
      node.isParenthesisNode &&
      node.content.isOperatorNode &&
      (node.content.op === '*' || node.content.op === '^') &&
      node.content.toString()[0] !== '-'
    ) {
      node = node.content
    }
    if (
      node.isParenthesisNode &&
      node.content.isOperatorNode &&
      node.content.op === '/'
    ) {
      node = node.content
    }
    if (
      node.isOperatorNode &&
      node.fn === 'unaryMinus' &&
      node.args[0].isParenthesisNode &&
      node.args[0].content.isOperatorNode &&
      node.args[0].content.op === '*'
    ) {
      node.args[0] = node.args[0].content
    }
    if (
      node.isOperatorNode &&
      node.fn === 'unaryMinus' &&
      node.args[0].isOperatorNode &&
      node.args[0].op === '*'
    ) {
      node = Node.Creator.operator('*', [
        Negative.negate(node.args[0].args[0]),
        node.args[0].args[1],
      ])
    }
    // n(c*n) = n*(c*n) Je ne sais plus pourquoi !
    if (node.isOperatorNode && node.op === '*') {
      const firstNode = searchFirstNode(node.args[1])
      if (firstNode.type === 'ConstantNode') {
        node.implicit = false
      }
    }
    return transformNode(node, parent, oldNode, params)
  } else {
    return node
  }
}

/**
 * Retourne le format Latex d'un node mathjs ou mathsteps ou d'une expression ascii
 * Supprime les parenthèses inutiles, les 1 et les 0 inutiles, transforme les +- en -
 * @param {string|Object} node // Chaine de caractères décrivant une expression mathématique, une équation, une inéquation ou bien node mathjs
 * @param {Object} params // Paramètres
 * @returns {string} // Format latex
 * @example
 * toTex('3/2+4*x') -> \dfrac{3}{2}+4x
 * toTex('1*x+-3=6*x+0') -> x-3=6x
 * toTex('-3/4') -> -\dfrac{3}{4}
 * toTex('OA/OM=OB/ON',{OA: 1.2, OM: 1.5, OB: 1.7}) -> \dfrac{1{.}2}{1{.}5}=\dfrac{1{.}7}{OB}
 */
export function toTex(
  node: MathNode | string,
  params: {
    suppr1?: boolean
    suppr0?: boolean
    supprPlusMoins?: boolean
    variables?: Variables
    removeImplicit?: boolean
    rearrangeCoefficient?: boolean
    removeMultiplicationByNegativeOne?: boolean
  } = {
    suppr1: true,
    suppr0: true,
    supprPlusMoins: true,
    variables: undefined,
    removeImplicit: true,
    rearrangeCoefficient: true,
    removeMultiplicationByNegativeOne: true,
  },
): string {
  params = Object.assign(
    { suppr1: true, suppr0: true, supprPlusMoins: true },
    params,
  )

  // On commence par convertir l'expression en arbre au format mathjs
  let comparator
  let sides: string[] = []
  const comparators = ['=', '<', '>', '<=', '>=']
  if (typeof node === 'string') {
    for (let i = 0; i < comparators.length; i++) {
      sides = node.split(comparators[i])
      if (sides.length > 1) {
        comparator = comparators[i]
      }
    }
    if (comparator !== undefined) {
      sides = node.split(comparator)
      if (sides.length > 1) {
        const members = []
        for (let i = 0; i < sides.length; i++) {
          members.push(toTex(sides[i], params))
        }
        return members.join(
          comparator
            ?.replaceAll('>=', '\\geqslant')
            .replaceAll('<=', '\\leqslant'),
        )
      }
    }
  }

  // On commence par convertir l'expression en arbre au format mathjs
  let nodeCopy: any
  if (typeof node === 'string') {
    nodeCopy = math.parse(node)
  } else {
    nodeCopy = node.cloneDeep()
  }
  if (params.variables) {
    nodeCopy = math.parse(
      assignVariables(printMS.ascii(nodeCopy, false, true), params.variables),
    )
  }

  // Look for basic step(s) to perform on a node. Returns a Node.Status object.
  function basics(node: MathNode) {
    const removeAdditionOfZero = SIMPLIFICATION_FUNCTIONS.removeAdditionOfZero
    const removeMultiplicationByOne =
      SIMPLIFICATION_FUNCTIONS.removeMultiplicationByOne
    const reduceMultiplicationByZero =
      SIMPLIFICATION_FUNCTIONS.reduceMultiplicationByZero
    const removeDivisionByOne = SIMPLIFICATION_FUNCTIONS.removeDivisionByOne
    const rearrangeCoefficient = SIMPLIFICATION_FUNCTIONS.rearrangeCoefficient
    const reduceZeroDividedByAnything =
      SIMPLIFICATION_FUNCTIONS.reduceZeroDividedByAnything
    const removeExponentByOne = SIMPLIFICATION_FUNCTIONS.removeExponentByOne
    const removeExponentBaseOne = SIMPLIFICATION_FUNCTIONS.removeExponentBaseOne
    const reduceExponentByZero = SIMPLIFICATION_FUNCTIONS.reduceExponentByZero
    const removeMultiplicationByNegativeOne =
      SIMPLIFICATION_FUNCTIONS.removeMultiplicationByNegativeOne
    const functionsToTest = [
      removeAdditionOfZero,
      removeMultiplicationByOne,
      removeDivisionByOne,
      params.rearrangeCoefficient ? rearrangeCoefficient : null,
      reduceZeroDividedByAnything,
      removeExponentByOne,
      removeExponentBaseOne,
      reduceExponentByZero,
      params.removeMultiplicationByNegativeOne
        ? removeMultiplicationByNegativeOne
        : null,
      reduceMultiplicationByZero,
    ]
    for (let i = 0; i < functionsToTest.length; i++) {
      if (functionsToTest[i] === null) continue
      const nodeStatus = functionsToTest[i](node)
      if (nodeStatus.hasChanged()) {
        return nodeStatus
      } else {
        node = nodeStatus.newNode
      }
    }
    return Node.Status.noChange(node)
  }

  const searchBasics = TreeSearch.preOrder(basics)

  let nodeClone: MathNode
  let iter = 0
  const MAX_STEP_COUNT = 20
  do {
    // À étudier, pour 79 et 85 et 50 cette boucle doit être maintenue
    nodeClone = nodeCopy.cloneDeep() // Vérifier le fonctionnement de .clone() et .cloneDeep() (peut-être y a-t-il un problème avec implicit avec cloneDeep())
    const result = searchBasics(nodeCopy)
    if (result.changeType !== 'NO_CHANGE') {
      nodeCopy = result.newNode
    }
    nodeCopy = SIMPLIFICATION_FUNCTIONS.removeUnnecessaryParens(nodeCopy, true)
    iter++
    if (iter++ === MAX_STEP_COUNT) {
      console.error(
        'Math error: Potential infinite loop for toTex: ' +
          node.toString() +
          ', returning no steps',
      )
      break
    }
  } while (nodeCopy.toString() !== nodeClone.toString())

  // le problème est due certains sympboles sont déclarer comme des unités et donc il réajoute mathrm
  const showPlusMinus = false
  const forceMultiplySign = params.removeImplicit === false || false
  const flattenUsed = true
  const forceAddParenthesis = true
  const resu = printMS
    .latex(
      nodeCopy,
      showPlusMinus,
      forceMultiplySign,
      flattenUsed,
      forceAddParenthesis,
      [],
    )
    .replaceAll('\\mathrm', '')
    .replaceAll(
      '\\times \\dfrac',
      `${forceMultiplySign ? '\\times \\dfrac' : '\\dfrac'}`,
    )
    .replace('undefined', '')

  return resu
}

export function toString(
  node: MathNode | string,
  params = {
    suppr1: true,
    suppr0: true,
    supprPlusMoins: true,
    variables: undefined,
  },
) {
  params = Object.assign(
    { suppr1: true, suppr0: true, supprPlusMoins: true },
    params,
  )
  // On commence par convertir l'expression en arbre au format mathjs
  let nodeCopy: MathNode
  if (typeof node === 'string') {
    nodeCopy = math.parse(node)
  } else {
    nodeCopy = node.cloneDeep()
  }

  if (params.variables) {
    nodeCopy = math.parse(aleaExpression(nodeCopy.toString(), params.variables))
  }
  printMS.ascii(nodeCopy)
  let nodeClone: MathNode
  do {
    // À étudier, pour 79 et 85 et 50 cette boucle doit être maintenue
    nodeClone = nodeCopy.cloneDeep() // Vérifier le fonctionnement de .clone() et .cloneDeep() (peut-être y a-t-il un problème avec implicit avec cloneDeep())
    nodeCopy = nodeCopy.transform(function (nodeTree, path, parent) {
      return transformNode(
        nodeTree as any,
        parent as any,
        undefined,
        params,
      ) as unknown as MathNode
    }) as MathNode
  } while (nodeCopy.toString() !== nodeClone.toString())

  // if (node.isConstantNode && node.value === undefined) nodeTex = ''
  return nodeCopy
    .toString({ implicit: 'show', parenthesis: 'keep' })
    .replace(/\s*?\+\s*?-\s*?/g, ' - ')
}

export function expressionLitterale(
  expression = '(a*x+b)*(c*x-d)',
  assignations: Variables = { a: 1, b: 2, c: 3, d: -6 },
  rules?: { l: string; r: string }[],
) {
  // Ne pas oublier le signe de la multiplication
  return math.simplify(
    expression,
    rules ?? [
      { l: '1*n', r: 'n' },
      { l: '-1*n', r: '-n' },
      { l: 'n/1', r: 'n' },
      { l: 'c/c', r: '1' },
      { l: '0*v', r: '0' },
      { l: '0+v', r: 'v' },
    ],
    assignations,
  )
}

/**
 * @deprecated // A cause de l'utilisation dépréciée de aleaVariables
 */
export function aleaExpression(
  expression: string = '(a*x+b)*(c*x-d)',
  assignations: Variables = { a: 1, b: 2, c: 3, d: -6 },
) {
  // const assignationsDecimales = Object.assign({}, assignations)
  const assignationsDecimales = Object.assign({}, aleaVariables(assignations))
  for (const [assignation, value] of Object.entries(assignationsDecimales)) {
    if (typeof value !== 'number') {
      assignationsDecimales[assignation as keyof Variables] = value.valueOf()
    }
  }
  return assignVariables(expression, assignationsDecimales)
}

/**
 * @deprecated // A cause de la génération d'une graine, cette fonction crée des différences entre la sortie HTML et la sortie PDF.
 * @description Retourne des valeurs aléatoires sous certaines contraintes données.
 * Les calculs se font si possible avec mathjs au format fraction
 * @param {Object} variables // Propriété réservée : test
 * @param {Object} params // valueOf à true pour avoir les valeurs décimales, format à true pour appliquer texNombre2
 * // type à 'decimal' et valueOf à true pour obtenir des instances de Decimal()
 * @returns {Object}
 * @see {@link https://mathjs.org/docs/expressions/syntax.html|Mathjs}
 * @see {@link https://coopmaths.fr/documentation/tutorial-Outils_Mathjs.html|Mathjs}
 * @example
 * aleaVariable({a: true}, {valueOf: true}) --> {a: -3} // Génère un entier non nul entre -10 et 10
 * aleaVariable({a: true, b: true}, {valueOf: true}) --> {a: 5, b: -7}
 * aleaVariable({a: false, b: false}, {valueOf: true}) --> {a: 4, b: 1} // false => entier entre 1 et 10
 * aleaVariable({a: true, b: true, test: 'a>b'}, {valueOf: true}) --> {a: 3, b: 1}
 * aleaVariable({a: true, b: true, test: 'a+b>2'}, {valueOf: true}) --> {a: 10, b: -6}
 * aleaVariables({a: true}) --> {a: Fraction} // Fraction est un objet de mathjs
 * @author Frédéric PIOU
 */
export function aleaVariables(
  variables: Variables = { a: true, b: true, c: true, d: true },
  params = { valueOf: true, format: false, type: 'number' },
): Variables {
  // Conservation de la graine aléatoire
  math.config({ randomSeed: context.graine })
  // Placer dans cet objet chacune des variables après calcul
  const assignations: Variables = {}
  // Un compteur pour vérifier que les contraintes ne sont pas excessives
  let cpt = 0
  // Le test pour vérifier que les contraintes sont respectées
  // Remarque : Il serait plus pratique de pouvoir écrire le test en plusieurs lignes
  let test = true
  do {
    // Une boucle tant que les contraintes ne sont pas vérifiées et tant qu'on ne dépasse pas 1000 essais.
    cpt++
    for (const v of Object.keys(variables)) {
      // On parcourt chaque variable
      switch (typeof variables[v as keyof Variables]) {
        case 'object':
          break
        case 'boolean': {
          // On génère un nombre aléatoire non nul entre 1 et 10 si false et entre -10 et 10 si true
          const n = variables[v as keyof Variables] ? 1 : 0

          // Choix aléatoire entre -1 et +1
          const sign = choice<number>([-1, 1])

          // Valeur de base (aléatoire entre 1 et 9 inclus)
          const value = randint(1, 10)

          // Si n = 0 -> pas de signe (car sign 1), sinon on garde le signe
          const result = (n === 0 ? 1 : sign) * value

          assignations[v as keyof Variables] = math.fraction(result)
          break
        }
        case 'number': // On ne fait que le convertir en fraction
          if (params.type === 'decimal') {
            assignations[v as keyof Variables] = math.bignumber(
              String(variables[v as keyof Variables]),
            )
          } else {
            assignations[v as keyof Variables] = math.fraction(
              Number(variables[v as keyof Variables]),
            )
          }
          break
        case 'string':
          // Parser l'expression
          // Parcourir le noeud et repérer les points sensibles (division, décimaux)
          try {
            // On tente les calculs exacts avec mathjs
            if (params.type === 'decimal') {
              math.config({ number: 'BigNumber' })
              assignations[v as keyof Variables] = math.evaluate(
                String(variables[v as keyof Variables]),
                assignations,
              )
              math.config({ number: 'number' })
            } else if (params.type === 'fraction') {
              math.config({ number: 'Fraction' })
              assignations[v as keyof Variables] = math.evaluate(
                String(variables[v as keyof Variables]),
                assignations,
              )
              math.config({ number: 'number' })
            } else {
              assignations[v as keyof Variables] = math.evaluate(
                String(variables[v as keyof Variables]),
                assignations,
              )
            }
          } catch {
            // Sinon on cherche à la transformer en fraction après coup
            try {
              if (params.type === 'decimal') {
                assignations[v as keyof Variables] = math.bignumber(
                  math.evaluate(
                    String(variables[v as keyof Variables]),
                    assignations,
                  ),
                )
              } else {
                assignations[v as keyof Variables] = math.fraction(
                  math.evaluate(
                    String(variables[v as keyof Variables]),
                    assignations,
                  ),
                )
              }
            } catch {
              // Sinon on fait sans mais on revient à des nombres de type 'number'
              const values = Object.assign({}, assignations)
              for (const v of Object.keys(values)) {
                values[v as keyof Variables] =
                  values[v as keyof Variables]?.valueOf()
              }
              if (params.type === 'decimal') {
                math.config({ number: 'BigNumber' })
                assignations[v as keyof Variables] = math.evaluate(
                  String(variables[v as keyof Variables]),
                  values,
                )
                math.config({ number: 'number' })
              } else {
                assignations[v as keyof Variables] = math.evaluate(
                  String(variables[v as keyof Variables]),
                  values,
                )
              }
            }
          }
          break
      }
    }
    // On teste maintenant si les contraintes sont vérifiées
    if (variables.test !== undefined) {
      test = math.evaluate(String(variables.test), assignations)
    }
  } while (!test && cpt < 1000)
  if (cpt === 1000) {
    window.notify(
      'Attention ! 1000 essais dépassés.\n Trop de contraintes.\n Le résultat ne vérifiera pas le test.',
      { test: variables.test },
    )
  }
  if (params.valueOf) {
    for (const v of Object.keys(assignations)) {
      if (typeof assignations[v as keyof Variables] !== 'number') {
        if (!(assignations[v as keyof Variables] instanceof Decimal)) {
          assignations[v as keyof Variables] =
            assignations[v as keyof Variables]?.valueOf()
        }
      }
    }
  }
  if (params.format) {
    for (const v of Object.keys(assignations)) {
      assignations[v as keyof Variables] = texNombre2(
        Number(assignations[v as keyof Variables]),
      )
    }
  }
  return assignations
}

/*
 * Objet mathsteps : Permet de traverser toutes les étapes et sous-étapes
 */
export function traverserEtapes<
  T extends { changeType: string; substeps: any[] },
>(
  steps: T[],

  changeType: string[] = [],
  result: T[] = [],
) {
  steps.forEach(function (step) {
    if (changeType.length === 0) {
      // on récupère toutes les substeps s'il y en a
      if (step.substeps.length === 0) {
        result.push(step)
      } else {
        traverserEtapes(step.substeps, changeType, result)
      }
    } else {
      if (
        changeType.some((x) =>
          step.substeps.some((substep) => substep.changeType === x),
        )
      ) {
        // si sous step contient un changement de type
        traverserEtapes(step.substeps, changeType, result)
      } else if (
        changeType.some((x) => step.changeType === x) &&
        step.substeps.length > 0
      ) {
        // si step contient un changement de type
        traverserEtapes(step.substeps, changeType, result)
      } else {
        result.push(step)
      }
    }
  })
  return result
}

/**
 * @description Retourne toutes les étapes de calculs d'une expression numérique ou de développement-réduction d'une expression littérale
 * @param {string} expression // Une expression à calculer ou à développer
 * @param {object} params // Les paramètres (commentaires visibles , sous-étapes visibles, fraction-solution au format MixedNumber)
 */
interface CalculerResult {
  result: any
  printResult: string
  netapes: number
  texteDebug: string
  texte: string
  texteCorr: string
  stepsLatex: string[]
  steps: any
  commentaires: any[]
  printExpression: string
  name: any
}

export function calculer(
  expression: string,
  params?: {
    comment?: boolean
    comments?: Record<string, string>
    substeps?: boolean
    mixed?: boolean
    name?: string
    suppr1?: boolean
    removeImplicit?: boolean
    removeMultiplicationByNegativeOne?: boolean
    variables?: Variables
    totex?: any
  },
): CalculerResult {
  params = Object.assign(
    {
      comment: false,
      comments: {},
      substeps: false,
      mixed: false,
      name: undefined,
      suppr1: true,
      removeImplicit: true,
    },
    params,
  )
  // La fonction simplifyExpression est une fonction mathsteps
  // Elle renvoie toutes les étapes d'un calcul numérique ou d'un développement-réduction
  // L'addition de deux fractions est classée dans les sous-étapes bizarrement
  // Les calculs se font de la gauche vers la droite et dès que c'est possible dans le respect des priorités
  // Les termes de même nature sont regroupés avant d'effectuer les calculs :
  // Les SymbolNode par exposant décroissant, puis Les constantes et enfin les fractions
  // Parfois les COLLECT LIKE TERMS ne donnent pas de changement ???
  // A faire : Virer l'étape précédent un REMOVE MULTIPLYING BY ONE et lui prendre son commentaire
  // A faire : Même chose pour REMOVE ADDING ZERO
  // La suite de CANCEL TERMS peut être applanie
  // Refaire la méthode transform() pour qu'elle ne modifie rien d'autre de notre noeud que ce qu'on souhaite
  // Si ça fonctionne on peut régler le problème des implicit qui disparaissent ? des (-3)² qui deviennent -3² ?
  // A faire : Ajouter un paramètre parenthesis à chaque noeud, ou il faudrait le faire dans Mathjs ?
  // BUG : http://localhost:8080/mathalea.html?ex=betaEquations,s=125
  if (params.variables !== undefined) {
    expression = aleaExpression(expression, params.variables)
  }
  const expressionPrint = toTex(expression, params)
  const steps: {
    oldNode: any
    newNode: any
    changeType: string
  }[] = params.substeps
    ? traverserEtapes(simplifyExpression(expression))
    : simplifyExpression(expression)
  const stepsExpression: string[] = []
  // const commentaires = []
  const comments: any[] = []
  steps.forEach(function (step, i: number) {
    const oldNode = step.oldNode !== null ? toTex(step.oldNode, params) : ''
    const newNode = toTex(step.newNode, params)
    if (newNode === oldNode) stepsExpression.pop()
    if (params.comment) {
      const comment = commentStep(step, params.comments)
      // const commentaire = `\\text{${step.changeType}}`.replaceAll('_', ' ')
      // commentaires.push(commentaire)
      comments.push(comment)
      if (stepsExpression.length === 0 || i === steps.length - 1) {
        if (params.name === undefined) {
          stepsExpression.push(`${expressionPrint}&=${newNode}&&${comment}`)
        } else {
          if (stepsExpression.length === 0) {
            stepsExpression.push(
              `${params.name}&=${expressionPrint}&&${comment}`,
            )
            stepsExpression.push(`&=${newNode}&&${comment}`)
          } else {
            stepsExpression.push(`${params.name}&=${newNode}&&${comment}`)
          }
        }
      } else {
        stepsExpression.push(`&=${newNode}&&${comment}`)
      }
    } else {
      if (stepsExpression.length === 0 || i === steps.length - 1) {
        if (params.name === undefined) {
          stepsExpression.push(`${expressionPrint}&=${newNode}`)
        } else {
          if (stepsExpression.length === 0) {
            stepsExpression.push(`${params.name}&=${expressionPrint}`)
            stepsExpression.push(`&=${newNode}`)
          } else {
            stepsExpression.push(`${params.name}&=${newNode}`)
          }
        }
      } else {
        stepsExpression.push(`&=${newNode}`)
      }
    }
  })
  if (
    params.mixed === true &&
    steps[steps.length - 1].newNode.type === 'OperatorNode' &&
    steps[steps.length - 1].newNode.op === '/' &&
    steps[steps.length - 1].newNode.args[0].type === 'ConstantNode' &&
    steps[steps.length - 1].newNode.args[1].type === 'ConstantNode' &&
    (Math.abs(steps[steps.length - 1].newNode.args[0].value) >
      steps[steps.length - 1].newNode.args[1].value ||
      steps[steps.length - 1].newNode.args[0].value < 0)
  ) {
    const plus = steps[steps.length - 1].newNode.args[0].value < 0 ? '-' : '+'
    stepsExpression.push(
      '&=' +
        toTex(
          math.parse(
            math
              .fraction(
                steps[steps.length - 1].newNode.args[0].value,
                steps[steps.length - 1].newNode.args[1].value,
              )
              .toFraction(true)
              .replace(' ', plus),
          ),
          params,
        ),
    )
  }
  const texte = `Calculer $${expressionPrint}$.`
  const texteCorr = `$\\begin{aligned}\n${stepsExpression.join('\\\\\n')}\n\\end{aligned}$`
  return {
    result:
      steps.length > 0
        ? steps[steps.length - 1].newNode.toString()
        : expressionPrint,
    printResult:
      steps.length > 0
        ? toTex(steps[steps.length - 1].newNode, params.totex)
        : expressionPrint,
    netapes: stepsExpression.length,
    texteDebug: texte + texteCorr,
    texte,
    texteCorr,
    stepsLatex: stepsExpression,
    steps,
    commentaires: comments,
    printExpression: expressionPrint,
    name: params.name,
  }
}

export function aleaEquation(
  equation = 'a*x+b=c*x-d',
  variables: Variables = {
    a: false,
    b: false,
    c: false,
    d: false,
    test: 'a>b or true',
  },
) {
  // Ne pas oublier le signe de la multiplication
  const comparators = ['<=', '>=', '=', '<', '>']
  const assignations = aleaVariables(variables)
  for (const v of Object.keys(assignations)) {
    assignations[v as keyof Variables] = math.number(
      String(assignations[v as keyof Variables]),
    )
  }

  if (Object.keys(assignations).length === 0) {
    // Si aucune assignation n'a été faite, on arrête le traitement
    return equation
  }
  let sides
  let comparator = null
  for (let i = 0; i < comparators.length; i++) {
    const comparatorSearch = comparators[i]
    sides = equation.split(comparatorSearch)
    if (sides.length === 2) {
      comparator = comparatorSearch
    }
  }
  if (comparator == null) throw Error('Une équation doit avoir un comparateur')
  sides = equation.split(comparator)
  const leftNode = expressionLitterale(sides[0], assignations).toString()
  const rightNode = expressionLitterale(sides[1], assignations).toString()
  return `${leftNode}${comparator}${rightNode}`
}

export function resoudreEquation(equation = '5(x-7)=3(x+1)', debug = false) {
  const comparators = ['<=', '>=', '=', '<', '>']
  let comparator
  let sides
  for (let i = 0; i < comparators.length; i++) {
    const comparatorSearch = comparators[i]
    sides = equation.split(comparatorSearch)
    if (sides.length === 2) {
      comparator = comparatorSearch
    }
  }
  if (comparator == null) throw Error('Une équation doit avoir un comparateur')
  sides = equation.split(comparator)
  let equationPrint
  const steps: {
    oldEquation: Equation
    newEquation: Equation
    changeType: string
  }[] = solveEquation(equation)
  if (debug) {
    console.log('* steps :')
    console.log(steps)
  }
  const stepsNewEquation: string[] = []
  let repetition = 0
  steps.forEach(function (step, i: number) {
    const changement = step.changeType
    if (step.oldEquation !== null) {
      if (
        step.oldEquation.leftNode.toString() ===
          step.newEquation.leftNode.toString() ||
        step.oldEquation.rightNode.toString() ===
          step.newEquation.rightNode.toString()
      ) {
        if (changement !== 'REMOVE_ADDING_ZEROS') {
          repetition = (repetition + 1) % 3
        }
      } else {
        repetition = 0
      }
    }
    const oldLeftNode =
      step.oldEquation !== null ? toTex(step.oldEquation.leftNode) : ''
    let newLeftNode = toTex(step.newEquation.leftNode)
    const oldRightNode =
      step.oldEquation !== null ? toTex(step.oldEquation.rightNode) : ''
    let newRightNode = toTex(step.newEquation.rightNode)

    if (debug) {
      console.log(changement)
      console.log(
        newLeftNode.toString() +
          step.newEquation.comparator +
          newRightNode.toString(),
      )
    }
    if (i === 0) {
      equationPrint = `${oldLeftNode}${step.newEquation.comparator}${oldRightNode}`
    }
    const color = repetition === 2 ? 'black' : 'red'
    newLeftNode = `{\\color{${color}}${newLeftNode.replace(oldLeftNode, `{\\color{black}${oldLeftNode}}`)}}`
    newRightNode = `{\\color{${color}}${newRightNode.replace(oldRightNode, `{\\color{black}${oldRightNode}}`)}}`
    if (debug) {
      console.log(newLeftNode + step.newEquation.comparator + newRightNode)
    }
    const stepChange =
      getNewChangeNodes(step).length > 0
        ? toTex(math.parse(getNewChangeNodes(step)[0].toString()))
        : ''
    let commentaires: { [key: string]: string } = {
      MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE: String.raw`\text{Multiplier les deux membres par }-1`,
      SUBTRACT_FROM_BOTH_SIDES: String.raw`\text{Soustraire }${stepChange}\text{ à chaque membre}`,
      ADD_TO_BOTH_SIDES: String.raw`\text{Ajouter }${stepChange}\text{ à chaque membre}`,
      MULTIPLY_TO_BOTH_SIDES: String.raw`\text{Multiplier chaque membre par }${stepChange}`,
      DIVIDE_FROM_BOTH_SIDES: String.raw`\text{Diviser chaque membre par }${stepChange}`,
      MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION: String.raw`\text{Multiplier chaque membre par }${stepChange}`,
    }
    if (debug) {
      commentaires = Object.assign(commentaires, {
        STATEMENT_IS_FALSE: String.raw`\text{L'égalité est fausse}`,
        STATEMENT_IS_TRUE: String.raw`\text{L'égalité est vraie}`,
        DISTRIBUTE: String.raw`\text{Distribution}`,
        SIMPLIFY_RIGHT_SIDE: String.raw`\text{Simplifier le membre de droite}`,
        SIMPLIFY_LEFT_SIDE: String.raw`\text{Simplifier le membre de gauche}`,
        COLLECT_AND_COMBINE_LIKE_TERMS: String.raw`\text{Regrouper et réduire les termes de même nature}`,
        SIMPLIFY_ARITHMETIC: String.raw`\text{Calcul arithmétique}`,
        SIMPLIFY_FRACTION: String.raw`\text{Simplifier une fraction}`,
        REMOVE_MULTIPLYING_BY_NEGATIVE_ONE: String.raw`\text{Calculer la multiplication par }-1`,
        REMOVE_ADDING_ZERO: String.raw`\text{Enlever des zéros}`,
        SWAP_SIDES: String.raw`\text{Echanger les deux membres}`,
        CANCEL_MINUSES: String.raw`\text{Annuler les signes moins}`,
        FIND_ROOTS: String.raw`\text{Trouver la (ou les) solution(s)}`,
        SIMPLIFY_SIGNS: String.raw`\text{Simplifier le signe}`,
        MULTIPLY_BY_ZERO: String.raw`\text{Multiplication par zéro}`,
        ADD_FRACTIONS: String.raw`\text{Additionner des fractions}`,
        BREAK_UP_FRACTION: String.raw`\text{Séparer une fraction}`,
        CANCEL_TERMS: String.raw`\text{Annuler les termes}`,
        REMOVE_MULTIPLYING_BY_ONE: String.raw`\text{Retirer la multiplication par } 1`,
      })
    }
    if (commentaires[changement] === undefined) commentaires[changement] = ''
    if (repetition === 2) {
      repetition = 0
      stepsNewEquation.pop()
      if (changement !== 'REMOVE_ADDING_ZERO') {
        stepsNewEquation.push(
          String.raw`${newLeftNode}&${step.newEquation.comparator}${newRightNode}&&${commentaires[changement]}`,
        )
      }
    } else {
      if (changement !== 'REMOVE_ADDING_ZERO') {
        stepsNewEquation.push(
          String.raw`${newLeftNode}&${step.newEquation.comparator}${newRightNode}&&${commentaires[changement]}`,
        )
      }
    }
    if (debug) console.log('changement', commentaires[changement])
  })
  let texte = String.raw`Résoudre $${equationPrint}$`
  const texteCorr = String.raw`
  $\begin{aligned}
  ${stepsNewEquation.join('\\\\')}
  \end{aligned}$
  `
  if (debug) texte = texteCorr
  return { texte, texteCorr, equation: equationPrint }
}

export function commentStep(
  step: {
    changeType: string
    stepChange?: string
  },
  comments: Record<string, string> | undefined,
) {
  const changement = step.changeType
  const stepChange = step.stepChange

  const defaultComments = {
    CROSS_PRODUCT_EQUALITY: `Egalité des produits en croix si $${stepChange} \\neq 0$.`,
    MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE:
      'Multiplier les deux membres par $-1$.',
    SUBTRACT_FROM_BOTH_SIDES: `Soustraire $${stepChange}$ à chaque membre.`,
    ADD_TO_BOTH_SIDES: `Ajouter $${stepChange}$ à chaque membre`,
    MULTIPLY_TO_BOTH_SIDES: `Multiplier chaque membre par $${stepChange}$.`,
    DIVIDE_FROM_BOTH_SIDES: `Diviser chaque membre par $${stepChange}$.`,
    MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION: `Multiplier chaque membre par $${stepChange}$.`,
    SWAP_SIDES: 'Echanger les deux membres.',
    STATEMENT_IS_FALSE: "L'égalité est fausse.",
    STATEMENT_IS_TRUE: "L'égalité est vraie.",
    DISTRIBUTE: 'Distribution.',
    SIMPLIFY_RIGHT_SIDE: 'Simplifier le membre de droite.',
    SIMPLIFY_LEFT_SIDE: 'Simplifier le membre de gauche.',
    COLLECT_AND_COMBINE_LIKE_TERMS: 'Regrouper et réduire les termes.',
    SIMPLIFY_ARITHMETIC: 'Calcul arithmétique.',
    SIMPLIFY_TERMS: 'Simplifier les termes.',
    SIMPLIFY_FRACTION: 'Simplifier une fraction.',
    REMOVE_MULTIPLYING_BY_NEGATIVE_ONE: 'Calculer la multiplication par $-1$.',
    REMOVE_ADDING_ZERO: 'Enlever des zéros.',
    CANCEL_MINUSES: 'Annuler les signes moins.',
    FIND_ROOTS: 'Trouver la (ou les) solution(s).',
    SIMPLIFY_SIGNS: 'Simplifier le signe.',
    MULTIPLY_BY_ZERO: 'Multiplication par zéro.',
    ADD_FRACTIONS: 'Additionner des fractions.',
    BREAK_UP_FRACTION: 'Séparer une fraction.',
    CANCEL_TERMS: 'Annuler les termes.',
    REMOVE_MULTIPLYING_BY_ONE: 'Retirer la multiplication par $1$.',
    COLLECT_LIKE_TERMS: 'Regrouper les termes.',
    MULTIPLY_DENOMINATORS: 'Calculer les dénominateurs.',
    ADD_EXPONENT_OF_ONE: "Ajouter l'exposant 1.",
    COLLECT_POLYNOMIAL_EXPONENTS: "Ajouter l'exposant 1.",
    COMMON_DENOMINATOR: 'Obtenir le même dénominateur.',
    MULTIPLY_NUMERATORS: 'Calculer.',
    COMBINE_NUMERATORS: 'Combiner les numérateurs.',
    ADD_NUMERATORS: 'Additionner les numérateurs.',
    ADD_COEFFICIENT_OF_ONE: 'Ajouter le coefficient $1$',
    GROUP_COEFFICIENTS: 'Regrouper les coefficients.',
    FIND_GCD: 'Trouver le plus grand diviseur commun.',
    CANCEL_GCD: 'Simplifier par le PGCD.',
    MULTIPLY_FRACTIONS: 'Multiplier deux fractions.',
  }
  comments = Object.assign(defaultComments, comments)
  return comments[changement] !== undefined
    ? `\\text{${comments[changement].replaceAll('{stepChange}', `$${stepChange}$`)}}`
    : ''
}

/**
 * Check if x is a decimal number
 * @param {Object} x // Object type = Fraction (mathjs)
 * @returns {boolean}
 */
export function isDecimal(value: number | string | Fraction): boolean {
  let f: Fraction
  if (typeof value === 'number') {
    f = math.fraction(value)
  } else if (typeof value === 'string') {
    f = math.fraction(value.replaceAll(' ', ''))
  } else {
    f = value.clone()
  }
  const den: number = Number(f.d)
  return (
    den !== 1 &&
    !obtenirListeFacteursPremiers(den).some((x: number) => x !== 2 && x !== 5)
  )
}

/**
 * @description Retourne toutes les étapes de résolution d'une équation ou d'une inéquation
 * @param {Objet} params // Les paramètres (commentaires visibles)
 * @param {string} equation // Une équation ou une inéquation
 * @example
 * resoudre('2*x+4=4*x-5') --> Donne les étapes de la résolution de l'équation
 * resoudre('2*x+4=4*x-5'), {comment: true}) --> Ajoute les commentaires
 * resoudre('2*x+4=4*x-5', {color: blue}) -> Met en bleu les changements à chaque étape
 * resoudre('2*x+4=4*x-5', {substeps: true}) --> Ajoute les sous-étapes
 * resoudre('2*x+4=4*x-5', {produitsencroix: true}) --> Utilise les produits en croix lorsque l'inconnue est au dénominateur a/f(x)=b/c
 * resoudre('2*x+4=4*x-5', {verifications: true}) --> Ajoute les vérifications de la solution
 * resoudre('a*x+c=b*x+d', {variables: {a: true, b: true, c: true, d: true, test: 'a!=b'}}) --> a, b, c et d sont choisis au hasard voir la fonction aleaVariables()
 * resoudre('2*x+4=4*x-5', {comment: true, comments: commentairesPersonnalises}) --> commentairesPersonnalises est un tableau avec des commentaires personnalisés (voir fonction commentStep())
 */
export function resoudre(
  equation: string,
  params?: {
    comment?: boolean
    color?: string
    comments?: Record<string, string>
    reduceSteps?: boolean
    formatSolution?: number | 'decimal' | 'fraction'
    substeps?: boolean
    changeType?: string[]
    produitsencroix?: boolean
    verifications?: boolean
    variables?: Variables
  },
): {
  solution: {
    printDecimal: string
    decimal: number
    exact: string
    print: string
  }
  texte: string
  texteCorr: string
  equation: string
  verifLeftSide?: ReturnType<typeof calculer>
  verifRightSide?: ReturnType<typeof calculer>
  steps: {
    oldEquation: Equation
    newEquation: Equation
    changeType: string
    stepChange?: string
  }[]
  printSteps: string[]
} {
  /*
    formatSolution
      2 (défaut) : décimal si la solution a 2 chiffres ou moins après la virgule, fraction sinon
      n : décimal si la solution a n chiffres ou moins après la virgule, fraction sinon
      'decimal' : decimal lorsque c'est possible, sinon fraction
      'fraction' : fraction (ou entier lorsque c'est possible)
  */
  params = Object.assign(
    {
      comment: false,
      color: 'blue',
      comments: {},
      reduceSteps: true,
      formatSolution: 2,
      substeps: false,
      changeType: [],
      produitsencroix: false,
      verifications: false,
    },
    params,
  )
  if (params.variables !== undefined) {
    equation = aleaEquation(equation, params.variables)
  }
  let printEquation: string = ''
  const steps: {
    oldEquation: Equation
    newEquation: Equation
    changeType: string
    stepChange?: string
    substeps?: any[]
  }[] = params.substeps
    ? traverserEtapes(solveEquation(equation), params.changeType)
    : solveEquation(equation)

  // steps.forEach(logSteps)

  // Si l'équation est déjà resolue...
  if (steps.length === 0 && equation.includes('=')) {
    const left = math.parse(equation.split('=')[0])
    const right = math.parse(equation.split('=')[1])
    if (
      left.type === 'SymbolNode' &&
      Node.Type.isConstantOrConstantFraction(right)
    ) {
      // Si l'équation est déjà resolue...
      steps.push({
        oldEquation: new Equation(left, right, '='),
        newEquation: new Equation(left, right, '='),
        changeType: 'EQUALITY',
      })
    }
  }

  // supprime des étapes redondantes
  const stepsNewEquation: string[] = []
  let repetition = 0
  steps.forEach(function (step, i) {
    const detect = getNewChangeNodes(step)
    step.stepChange =
      detect?.length > 0 ? toTex(math.parse(detect[0].toString())) : ''
    if (step.oldEquation !== null) {
      if (
        params.reduceSteps &&
        (step.oldEquation.leftNode.toString() ===
          step.newEquation.leftNode.toString() ||
          step.oldEquation.rightNode.toString() ===
            step.newEquation.rightNode.toString())
      ) {
        if (step.changeType !== 'REMOVE_ADDING_ZEROS') {
          repetition = (repetition + 1) % 3
        }
      } else {
        repetition = 0
      }
    }
    const oldLeftNode =
      step.oldEquation !== null ? toTex(step.oldEquation.leftNode, params) : ''
    let newLeftNode = toTex(step.newEquation.leftNode, params)
    const oldRightNode =
      step.oldEquation !== null ? toTex(step.oldEquation.rightNode, params) : ''
    let newRightNode = toTex(step.newEquation.rightNode, params)
    const newEquationComparator = toTex(step.newEquation.comparator)
    if (i === 0) {
      printEquation = `${toTex(step.oldEquation.ascii())}`
      stepsNewEquation.push(
        String.raw`${oldLeftNode}&${toTex(step.oldEquation.comparator)}${oldRightNode}`,
      )
    }
    if (params.color !== 'black') {
      const color = repetition === 2 ? 'black' : params.color
      newLeftNode = `{\\color{${color}}${newLeftNode.replace(oldLeftNode, `{\\color{black}${oldLeftNode}}`)}}`
      newRightNode = `{\\color{${color}}${newRightNode.replace(oldRightNode, `{\\color{black}${oldRightNode}}`)}}`
    }
    const comment = commentStep(step, params.comments)
    if (repetition === 2 || step.changeType === 'EQUALITY') {
      repetition = 0
      stepsNewEquation.pop()
      stepsNewEquation.push(
        `${newLeftNode}&${newEquationComparator}${newRightNode}${params.comment ? `&&${comment}` : ''}`,
      )
    } else {
      stepsNewEquation.push(
        `${newLeftNode}&${newEquationComparator}${newRightNode}${params.comment ? `&&${comment}` : ''}`,
      )
    }
  })

  // calculer de la solution sous différents formats
  const lastEquation = steps[steps.length - 1].newEquation
  let answer = lastEquation.rightNode
  if (params.formatSolution !== 'fraction' && !answer.isConstantNode) {
    try {
      // On ve tenter d'obtenir le résultat sous forme de fraction, si ce n'est pas possible on quitte le try
      math.config({ number: 'Fraction' })
      answer = math.evaluate(answer.toString())
      math.config({ number: 'number' })
      // On regarde si le résultat a un nombre fini de chiffres après la virgule et n'est pas un entier
      if (isDecimal(answer)) {
        answer = math.round(answer.valueOf(), 15) // convertit la fraction en nombre décimal en évitant les problèmes de float
        if (
          params.formatSolution === 'decimal' ||
          (typeof params.formatSolution === 'number' &&
            answer.toString().split('.')[1].length <= params.formatSolution)
        ) {
          // On rajoute une étape de conversion de la fraction en nombre décimal
          stepsNewEquation.push(
            `${toTex(lastEquation.leftNode, params)}&${toTex(lastEquation.comparator + answer.toString())}`,
          )
        }
      }
    } catch (e) {}
  }

  const texte = `Résoudre $${printEquation}$.`
  let texteCorr = `$\\begin{aligned}\n${stepsNewEquation.join('\\\\\n')}\n\\end{aligned}$`
  const solution = {
    printDecimal: texNombre2(
      math.evaluate(
        steps[steps.length - 1].newEquation
          .ascii()
          .split(steps[steps.length - 1].newEquation.comparator)[1],
      ),
    ),
    decimal: math.evaluate(
      steps[steps.length - 1].newEquation
        .ascii()
        .split(steps[steps.length - 1].newEquation.comparator)[1],
    ),
    exact: steps[steps.length - 1].newEquation
      .ascii()
      .split(steps[steps.length - 1].newEquation.comparator)[1],
    print: toTex(steps[steps.length - 1].newEquation.ascii()),
  }
  let calculateLeftSide: ReturnType<typeof calculer> | undefined
  let calculateRightSide: ReturnType<typeof calculer> | undefined
  if (steps[steps.length - 1].newEquation.leftNode.isSymbolNode) {
    const sides = equation.split(steps[0].oldEquation.comparator)
    const SymbolNode = steps[steps.length - 1].newEquation.leftNode.toString()
    const thesolution = steps[steps.length - 1].newEquation.rightNode.toString()
    calculateLeftSide = calculer(
      sides[0].replaceAll(SymbolNode, `(${thesolution})`),
    )
    calculateRightSide = calculer(
      sides[1].replaceAll(SymbolNode, `(${thesolution})`),
    )
  }
  if (params.verifications) {
    texteCorr = `${context.isHtml ? '<br>' : ''}
          ${texteCorr}<br>
          La solution est $${solution.print}$.
          <br>
          $\\textit{Vérification :}$
          <br>
          $\\bullet$ D'une part : $${calculateLeftSide?.printExpression}=${calculateLeftSide?.printResult}$
          <br>
          $\\bullet$ D'autre part : $${calculateRightSide?.printExpression}=${calculateRightSide?.printResult}$
          `
  }
  return {
    solution,
    texte,
    texteCorr,
    equation: printEquation,
    verifLeftSide: calculateLeftSide,
    verifRightSide: calculateRightSide,
    steps,
    printSteps: stepsNewEquation,
  }
}

export function programmeCalcul(
  stepProg = [
    '+',
    '-',
    '*',
    '/',
    '^2',
    '2*x',
    '3*x',
    '-2*x',
    '-3*x',
    'x^2',
    '-x^2',
    'x',
    '-x',
    '*x',
    '/x',
  ],
  nombreChoisi: number,
) {
  const rules = math.simplify.rules
  rules[13] = { l: 'n', r: 'n' } // Pour éviter la factorisation
  rules[14] = { l: 'n', r: 'n' } // Pour éviter la factorisation
  // rules.push({ l: 'n1+-n2', r: 'n1-n2' }) // Peut être utile pour des nombres négatifs
  const variables: {
    symbolsOp: string[]
    namesOp: nameOps[]
    debutsPhrase: string[]
    debutsPhraseInv: string[]
    op: Operator[]
  } = {
    symbolsOp: Object.values(stepProg),
    namesOp: [],
    debutsPhrase: [],
    debutsPhraseInv: [],
    op: [],
  }
  const symbolsOp = [
    '+',
    '-',
    '*',
    '/',
    '^2',
    '2*x',
    '3*x',
    '-2*x',
    '-3*x',
    'x^2',
    '-x^2',
    'x',
    '-x',
    '*x',
    '/x',
  ]
  const op = [
    '+',
    '-',
    '*',
    '/',
    '^',
    '+',
    '+',
    '-',
    '-',
    '+',
    '-',
    '+',
    '-',
    '*',
    '/',
  ] as const
  type Operator = (typeof op)[number]

  const namesOp = [
    'add',
    'subtract',
    'multiply',
    'divide',
    'pow',
    'add',
    'add',
    'subtract',
    'subtract',
    'add',
    'subtract',
    'add',
    'subtract',
    'multiply',
    'divide',
  ] as const
  type nameOps = (typeof namesOp)[number]

  // 👇 on définit un sous-type
  type InvertibleOps = Extract<
    nameOps,
    'add' | 'subtract' | 'multiply' | 'divide'
  >

  const namesOpInv: Record<InvertibleOps, InvertibleOps> = {
    add: 'subtract',
    subtract: 'add',
    multiply: 'divide',
    divide: 'multiply',
  }
  const symbolsOpInv: Record<InvertibleOps, Operator> = {
    add: '-',
    subtract: '+',
    multiply: '/',
    divide: '*',
  }
  const debutsPhrase = [
    'Ajouter ',
    'Soustraire ',
    'Multiplier par ',
    'Diviser par ',
    'Elever au carré',
    'Ajouter le double du nombre choisi',
    'Ajouter le triple du nombre choisi',
    'Soustraire le double du nombre choisi',
    'Soustraire le triple du nombre choisi',
    'Ajouter le carré du nombre choisi',
    'Soustraire le carré du nombre choisi',
    'Ajouter le nombre choisi',
    'Soustraire le nombre choisi',
    'Multiplier par le nombre choisi',
    'Diviser par le nombre choisi',
  ]
  const debutsPhraseInv = [
    'Soustraire ',
    'Ajouter ',
    'Diviser par ',
    'Multiplier par ',
    'Prendre la racine carré',
    'Soustraire le double du nombre choisi',
    'Soustraire le triple du nombre choisi',
    'Ajouter le double du nombre choisi',
    'Ajouter le triple du nombre choisi',
    'Soustraire le carré du nombre choisi',
    'Ajouter le carré du nombre choisi',
    'Soustraire le nombre choisi',
    'Ajouter le nombre choisi',
    'Diviser par le nombre choisi',
    'Multiplier par le nombre choisi',
  ]
  const nombresAutorises1 = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const nombresAutorises2 = [2, 3, 4, 5, 6, 7, 8, 9]

  variables.symbolsOp.forEach(function (n, i) {
    variables.namesOp[i] = namesOp[symbolsOp.indexOf(n)]
    variables.debutsPhrase[i] = debutsPhrase[symbolsOp.indexOf(n)]
    variables.debutsPhraseInv[i] = debutsPhraseInv[symbolsOp.indexOf(n)]
    variables.op[i] = op[symbolsOp.indexOf(n)]
  })

  const nodes: MathNode[] = [new math.SymbolNode('x')]
  const phrases = ['Choisir un nombre.']
  const steps = ['x']
  const stepsNode: MathNode[] = [new math.SymbolNode('x')]
  const stepsSimplified = ['x']
  const stepsInv = ['x']
  const stepsSimplifiedInv = ['x']
  const phrasesInv = ['On retrouve le nombre choisi à partir du résultat.']
  const nombreChoisiNode = math.simplify(math.format(nombreChoisi))
  const resultatIntermediaire: MathNode[] = [nombreChoisiNode]
  const calculIntermediaire: MathNode[] = [nombreChoisiNode]
  let step
  const longueur = variables.symbolsOp.length + 1
  for (let i = 1; i < longueur; i++) {
    const choix = i - 1
    let symbolOp = variables.symbolsOp[choix]
    const nameOp = variables.namesOp[choix]
    const debutPhrase = variables.debutsPhrase[choix]
    const op = variables.op[choix]
    let stepPrint = ''
    switch (symbolOp) {
      case '/':
        step = new math.ConstantNode(choice(nombresAutorises2))
        break
      case '*':
        step = new math.ConstantNode(choice(nombresAutorises2))
        break
      case '^2':
        step = new math.ConstantNode(2)
        break
      case '-':
        step = new math.ConstantNode(choice(nombresAutorises1))
        break
      case '+':
        step = new math.ConstantNode(choice(nombresAutorises2))
        break
      default:
        if (symbolOp[0] === '-') symbolOp = symbolOp.replace('-', '')
        step = math.parse(symbolOp)
    }
    stepsNode.push(step)
    if (step.type === 'ConstantNode' && symbolOp !== '^2') {
      stepPrint = `$${step.toString()}$`
    }
    let nodeSimplifie = math.simplify(
      nodes[i - 1].toString({ parenthesis: 'keep' }),
      rules,
    )
    nodes.push(
      new math.OperatorNode(op, nameOp, [
        new math.ParenthesisNode(nodeSimplifie),
        step,
      ]),
    )
    steps.push(toTex(nodes[i], { suppr1: false }))
    nodeSimplifie = math.simplify(
      nodes[i].toString({ parenthesis: 'auto' }),
      rules,
    )
    stepsSimplified.push(toTex(nodeSimplifie, { suppr1: false }))
    phrases.push(debutPhrase + stepPrint)
    if (i > 0) {
      calculIntermediaire.push(
        new math.OperatorNode(variables.op[choix], nameOp, [
          resultatIntermediaire[i - 1],
          math.simplify(step, [{ l: 'n', r: 'n' }], { x: nombreChoisi }),
        ]),
      )
      resultatIntermediaire.push(
        math.simplify(calculIntermediaire[i], { x: nombreChoisi }),
      )
    }
  }
  // Programme en sens inverse si c'est possible
  const resultatIntermediaireInv = [resultatIntermediaire[longueur - 1]]
  const calculIntermediaireInv = [resultatIntermediaire[longueur - 1]]
  const nodesInv: MathNode[] = [new math.SymbolNode('x')]
  for (let i = 1; i < longueur; i++) {
    const choix = i - 1
    const nameOp = variables.namesOp[longueur - 2 - choix]
    if (nameOp === 'pow') {
      break
    }
    if (symbolsOpInv[nameOp]) {
      const node: MathNode = new math.OperatorNode(
        symbolsOpInv[nameOp] as '+' | '-' | '*' | '/',
        namesOpInv[nameOp],
        [new math.ParenthesisNode(nodesInv[i - 1]), stepsNode[longueur - i]],
      )
      nodesInv.push(node)
      stepsInv.push(toTex(node, { suppr1: false }))
      const nodeSimplifieInv = math.parse(
        nodesInv[i - 1].toString({ parenthesis: 'auto' }),
      )
      stepsSimplifiedInv.push(toTex(nodeSimplifieInv, { suppr1: false }))
      const debutPhraseInv = variables.debutsPhraseInv[choix]
      phrasesInv.push(
        debutPhraseInv + `$${stepsNode[longueur - i].toString()}$`,
      )
      calculIntermediaireInv.push(
        new math.OperatorNode(
          symbolsOpInv[nameOp] as '+' | '-' | '*' | '/',
          namesOpInv[nameOp],
          [
            resultatIntermediaireInv[i - 1],
            math.simplify(stepsNode[longueur - i], [{ l: 'n', r: 'n' }], {
              x: nombreChoisi,
            }),
          ],
        ),
      )
      resultatIntermediaireInv.push(
        math.simplify(calculIntermediaireInv[i], { x: nombreChoisi }),
      )
    }
  }
  return {
    phrases,
    steps,
    stepsSimplified,
    stepsInv,
    stepsSimplifiedInv,
    phrasesInv,
    nodes,
    stepProg,
    calculIntermediaire,
    resultatIntermediaire,
    calculIntermediaireInv,
    resultatIntermediaireInv,
  }
}

export function traduireProgrammeCalcul(
  stepProg = [
    '+',
    '-',
    '*',
    '/',
    '^2',
    '2*x',
    '3*x',
    '-2*x',
    '-3*x',
    'x^2',
    '-x^2',
    'x',
    '-x',
    '*x',
    '/x',
  ],
  nombreChoisi: number,
  debug = false,
) {
  const programme = programmeCalcul(stepProg, nombreChoisi)
  const stepsSolutionDetaillee = Object.values(programme.phrases) // Clone de phrases pour ne pas être touchée par les modifications
  stepsSolutionDetaillee.forEach(function (step, i) {
    stepsSolutionDetaillee[i] =
      '&\\bullet~\\text{' + programme.phrases[i] + '}&'
    programme.phrases[i] = '&\\bullet~\\text{' + programme.phrases[i] + '}'
    stepsSolutionDetaillee[i] += '&' + programme.steps[i]
    if (programme.steps[i] !== programme.stepsSimplified[i]) {
      stepsSolutionDetaillee[i] += '&=' + programme.stepsSimplified[i]
    }
  })
  let texte = String.raw` Voici un programme de calcul.
          <br>
          $\begin{aligned}
          ${programme.phrases.join('\\\\')}
          \end{aligned}$
          <br>
          Notons $x$ le nombre choisi.
          <br>
          Écrire le résultat du programme de calcul en fonction de $x$.
          `
  const texteCorr = String.raw`Solution détaillée
          <br>
          $\begin{aligned}
          ${stepsSolutionDetaillee.join('\\\\')}
          \end{aligned}$`
  if (debug) texte = `${texte}<br>${texteCorr}`
  return { texte, texteCorr }
}

export function ecrireProgrammeCalcul(
  stepProg = [
    '+',
    '-',
    '*',
    '/',
    '^2',
    '2*x',
    '3*x',
    '-2*x',
    '-3*x',
    'x^2',
    '-x^2',
    'x',
    '-x',
    '*x',
    '/x',
  ],
  nombreChoisi: number,
  debug = false,
) {
  const programme = programmeCalcul(stepProg, nombreChoisi)
  const stepsSolutionDetaillee = Object.values(programme.phrases) // Clone de phrases pour ne pas être touchée par les modifications
  stepsSolutionDetaillee.forEach(function (step, i) {
    stepsSolutionDetaillee[i] =
      '&\\bullet~\\text{' + programme.phrases[i] + '}&'
    programme.phrases[i] = '&\\bullet~\\text{' + programme.phrases[i] + '}'
    stepsSolutionDetaillee[i] += '&' + programme.steps[i]
    if (programme.steps[i] !== programme.stepsSimplified[i]) {
      stepsSolutionDetaillee[i] += '&=' + programme.stepsSimplified[i]
    }
  })
  let texte = String.raw`Voici une expression. Écrire le programme de calcul correspondant.
          <br>
          $${programme.stepsSimplified[programme.stepsSimplified.length - 1]}$
          `
  const texteCorr = String.raw`Solution détaillée
          <br>
          $\begin{aligned}
          ${stepsSolutionDetaillee.join('\\\\')}
          \end{aligned}$`
  if (debug) texte = `${texte}<br>${texteCorr}`
  return { texte, texteCorr }
}

export function remonterProgrammeCalcul(
  stepProg = [
    '+',
    '-',
    '*',
    '/',
    '^2',
    '2*x',
    '3*x',
    '-2*x',
    '-3*x',
    'x^2',
    '-x^2',
    'x',
    '-x',
    '*x',
    '/x',
  ],
  nombreChoisi: number,
  debug = false,
) {
  const programme = programmeCalcul(stepProg, nombreChoisi)
  const stepsSolutionDetaillee = Object.values(programme.phrases) // Clone de phrases pour ne pas être touchée par les modifications
  const stepsSolutionDetailleeInv = Object.values(programme.phrases) // Clone de phrases pour ne pas être touchée par les modifications
  const longueur = stepsSolutionDetaillee.length
  stepsSolutionDetaillee.forEach(function (step, i) {
    stepsSolutionDetaillee[i] =
      '&\\bullet~\\text{' + programme.phrases[i] + '}&'
    programme.phrases[i] = '&\\bullet~\\text{' + programme.phrases[i] + '}'
    stepsSolutionDetaillee[i] += '&' + programme.steps[i]
    stepsSolutionDetailleeInv[i] =
      '&\\bullet~\\text{' + programme.phrasesInv[i] + '}&'
    programme.phrasesInv[i] =
      '&\\bullet~\\text{' + programme.phrasesInv[i] + '}'
    if (i === 0) {
      stepsSolutionDetailleeInv[i] +=
        '&' + toTex(programme.resultatIntermediaireInv[longueur - 2])
    } else if (i < stepsSolutionDetaillee.length - 1) {
      stepsSolutionDetailleeInv[i] +=
        '&' +
        toTex(programme.calculIntermediaireInv[longueur - 1 - i]) +
        '&&=' +
        toTex(programme.resultatIntermediaireInv[longueur - 1 - i])
    } else {
      stepsSolutionDetailleeInv[i] +=
        '&' + toTex(programme.resultatIntermediaireInv[0])
    }
  })
  const nombreChoisiNode = math.simplify(math.format(nombreChoisi))
  let texte = String.raw`On obtient le nombre $${toTex(programme.resultatIntermediaireInv[0])}$ avec le programme suivant.
          <br>
          $\begin{aligned}
          ${programme.phrases.join('\\\\')}
          \end{aligned}$
          <br>
          Quel était le nombre choisi ?
          `
  const texteCorr = String.raw`Solution détaillée
          <br>
          $\begin{aligned}
          ${stepsSolutionDetailleeInv.reverse().join('\\\\')}
          \end{aligned}$
          <br>
          Le nombre choisi était donc $${toTex(nombreChoisiNode)}$.
          `
  if (debug) texte = `${texte}<br>${texteCorr}`
  return { texte, texteCorr }
}

export function appliquerProgrammeCalcul(
  stepProg = [
    '+',
    '-',
    '*',
    '/',
    '^2',
    '2*x',
    '3*x',
    '-2*x',
    '-3*x',
    'x^2',
    '-x^2',
    'x',
    '-x',
    '*x',
    '/x',
  ],
  nombreChoisi: number,
  debug = false,
) {
  const programme = programmeCalcul(stepProg, nombreChoisi)
  const stepsSolutionDetaillee = Object.values(programme.phrases) // Clone de phrases pour ne pas être touchée par les modifications
  stepsSolutionDetaillee.forEach(function (step, i) {
    stepsSolutionDetaillee[i] =
      '&\\bullet~\\text{' + programme.phrases[i] + '}&'
    programme.phrases[i] = '&\\bullet~\\text{' + programme.phrases[i] + '}'
    // stepsSolutionDetaillee[i] += '&' + programme.steps[i]
    if (i === 0) {
      stepsSolutionDetaillee[i] +=
        '&' + toTex(programme.resultatIntermediaire[0])
    } else if (i < stepsSolutionDetaillee.length - 1) {
      stepsSolutionDetaillee[i] +=
        '&' +
        toTex(programme.calculIntermediaire[i]) +
        '&&=' +
        toTex(programme.resultatIntermediaire[i])
    } else {
      stepsSolutionDetaillee[i] +=
        '&' + toTex(programme.resultatIntermediaire[i - 1])
    }
  })
  const nombreChoisiNode = math.simplify(math.format(nombreChoisi))
  let texte = String.raw`Choisir le nombre $${toTex(nombreChoisiNode)}$ et effectuer le programme de calcul suivant.
          <br>
          $\begin{aligned}
          ${programme.phrases.join('\\\\')}
          \end{aligned}$
          <br>
          `
  const texteCorr = String.raw`Solution détaillée
          <br>
          $\begin{aligned}
          ${stepsSolutionDetaillee.join('\\\\')}
          \end{aligned}$`
  if (debug) texte = `${texte}<br>${texteCorr}`
  return { texte, texteCorr }
}

export function calculExpression2(
  expression = '4/3+5/6',
  factoriser = false,
  debug = false,
) {
  const steps: {
    oldNode: Node
    newNode: Node
    changeType: string
    substeps: any[]
  }[] = factoriser
    ? traverserEtapes(factor(expression))
    : traverserEtapes(simplifyExpression(expression))
  if (debug) {
    console.log('* steps :')
    console.log(steps)
  }
  let repetition = 0
  const stepsExpression: string[] = []
  let expressionPrint = ''
  steps.forEach(function (step, i) {
    const changement = step.changeType
    if (step.oldNode !== null) {
      if (step.oldNode.toString() === step.newNode.toString()) {
        if (changement !== 'REMOVE_ADDING_ZEROS') {
          repetition = (repetition + 1) % 2
        }
      } else {
        repetition = 0
      }
    }
    if (debug) {
      console.log(changement)
      console.log(step.newNode.toString())
    }
    const oldNode =
      step.oldNode !== null ? toTex(step.oldNode as any, { suppr1: true }) : ''
    const newNode = toTex(step.newNode as any, { suppr1: true })
    if (debug) {
      console.log(newNode.toString())
    }
    if (i === 0) {
      expressionPrint = `${oldNode}`
    }
    if (debug) console.log(newNode)
    const commentairesExclus: { [key: string]: string } = {
      REMOVE_ADDING_ZERO: String.raw`\text{Enlever des zéros}`,
      EXPAND_EXPONENT: String.raw`\text{Signification des exposants}`,
      MULTIPLY_COEFFICIENTS: String.raw`\text{Multiplier les coefficients}`,
      COLLECT_LIKE_TERMS: String.raw`\text{Regrouper les termes}`,
      MULTIPLY_DENOMINATORS: String.raw`\text{Calculer les dénominateurs}`,
      ADD_EXPONENT_OF_ONE: String.raw`\text{Ajouter l'exposant 1}`,
      COLLECT_POLYNOMIAL_EXPONENTS: String.raw`\text{Ajouter l'exposant 1}`,
      DISTRIBUTE: String.raw`\text{Distribution}`,
      ADD_COEFFICIENT_OF_ONE: String.raw`\text{Ajouter le coefficient }1`,
      GROUP_COEFFICIENTS: String.raw`\text{Regrouper les coefficients}`,
      REMOVE_MULTIPLYING_BY_ONE: String.raw`\text{Retirer la multiplication par } 1`,
    }
    let commentaires: { [key: string]: string } = {
      COMMON_DENOMINATOR: String.raw`\text{Obtenir le même dénominateur}`,
      MULTIPLY_NUMERATORS: String.raw`\text{Calculer}`,
      COMBINE_NUMERATORS: String.raw`\text{Combiner les numérateurs}`,
      ADD_NUMERATORS: String.raw`\text{Additionner les numérateurs}`,
      FIND_GCD: String.raw`\text{Trouver le plus grand diviseur commun.}`,
      CANCEL_GCD: String.raw`\text{Simplifier par le PGCD.}`,
    }
    if (debug) {
      commentaires = Object.assign(commentaires, {
        STATEMENT_IS_FALSE: String.raw`\text{L'égalité est fausse}`,
        STATEMENT_IS_TRUE: String.raw`\text{L'égalité est vraie}`,
        SIMPLIFY_RIGHT_SIDE: String.raw`\text{Simplifier le membre de droite}`,
        SIMPLIFY_LEFT_SIDE: String.raw`\text{Simplifier le membre de gauche}`,
        COLLECT_AND_COMBINE_LIKE_TERMS: String.raw`\text{Regrouper et réduire les termes de même nature}`,
        SIMPLIFY_ARITHMETIC: String.raw`\text{Calcul arithmétique}`,
        SIMPLIFY_FRACTION: String.raw`\text{Simplifier une fraction}`,
        REMOVE_MULTIPLYING_BY_NEGATIVE_ONE: String.raw`\text{Calculer la multiplication par }-1`,
        REMOVE_ADDING_ZERO: String.raw`\text{Enlever des zéros}`,
        SWAP_SIDES: String.raw`\text{Echanger les deux membres}`,
        CANCEL_MINUSES: String.raw`\text{Annuler les signes moins}`,
        FIND_ROOTS: String.raw`\text{Trouver la (ou les) solution(s)}`,
        SIMPLIFY_SIGNS: String.raw`\text{Simplifier le signe}`,
        MULTIPLY_BY_ZERO: String.raw`\text{Multiplication par zéro}`,
        ADD_FRACTIONS: String.raw`\text{Additionner des fractions}`,
        BREAK_UP_FRACTION: String.raw`\text{Séparer une fraction}`,
        CANCEL_TERMS: String.raw`\text{Annuler les termes}`,
      })
    }
    if (commentaires[changement] === undefined) commentaires[changement] = ''
    if (commentairesExclus[changement] === undefined) {
      stepsExpression.push(String.raw`&=${newNode}`)
    }
    if (debug) console.log('changement', commentaires[changement])
  })
  let texte = String.raw`Développer et réduire $${expressionPrint}$.`
  const texteCorr = String.raw`Simplifier $${expressionPrint}$.
  <br>
  $\begin{aligned}
  ${expressionPrint}${stepsExpression.slice(stepsExpression.length - 4, stepsExpression.length).join('\\\\')}
  \end{aligned}$
  `
  if (debug) texte = texteCorr
  return { texte, texteCorr }
}

/**
 * Retourne des noms de points (ou des objets) dans un ordre aléatoire.
 * @param {string|Array} names // Liste des lettres sous format string ou array
 * @param {number} n // Nombre de lettres à retourner
 * @param {string|Array} result // S'il n'y a qu'un seul nom en sortie c'est un string sinon c'est un array
 * @remarque // Les lettres Q,W,X,Y,Z ont été exclues par défaut
 * @example
 * aleaName() --> 'F'
 * aleaName(3) --> ['G', 'J', 'K']
 * aleaName('ABC') --> ['B','A','C']
 * aleaName(['chat','chien','poisson']) --> ['chien','poisson','chat']
 * aleaName(['chat','chien','poisson'],2) --> ['poisson','chat']
 * aleaName([Objet1,Objet2,Objet3]) --> [Objet2,Objet1,Objet3] où Objet peut être un Object, un Array etc.
 * @returns {Array}
 */
export function aleaName(
  names: string | string[] | number,
  n: number = 1,
  result: string[] = [],
) {
  if (typeof names === 'string') {
    names = names.split('')
    n = names.length
  } else if (typeof names === 'number') {
    n = names
    names = 'ABCDEFGHIJKLMNOPRSTUV'.split('')
  } else if (Array.isArray(names) && names.length === 0) {
    n = 1
    names = 'ABCDEFGHIJKLMNOPRSTUV'.split('')
  }
  result.push(names.splice(Math.floor(Math.random() * names.length), 1)[0])
  if (result.length === n) {
    return result
  } else {
    return aleaName(names, n, result)
  }
}
