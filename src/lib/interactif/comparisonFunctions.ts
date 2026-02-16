import {
  ComputeEngine,
  type BoxedExpression,
  type LatexDictionaryEntry,
  type ParseLatexOptions,
  type Parser,
} from '@cortex-js/compute-engine'
import { number } from 'mathjs'
import type { Expression } from 'mathlive'
import Grandeur from '../../modules/Grandeur'
import Hms from '../../modules/Hms'
import { areSameArray } from '../outils/arrayOutils'
import { texNombre } from '../outils/texNombre'
import type {
  CleaningOperation,
  OptionsComparaisonType,
  ResultType,
} from '../types'

const engine = new ComputeEngine()
export default engine

/**
 * Nettoie la saisie des \\dfrac en les remplaçant par des \frac comprises par ComputeEngine
 * @param {string} str
 */
function cleanFractions(str: string): string {
  return str.replaceAll(/dfrac/g, 'frac')
}

/**
 * Nettoie la saisie des \\frac pour mieux gérer les fractions négatives et que le moins soit toujours au dénominateur
 * Rajout des regex de MD pour gérer les fractions négatives (30/08/2024 : pas de solution directement par ComputeEngine mais ArnoG est sur le coup)
 * Cette fraction est amené à remplacer cleanFractions mais dans le doute (laissons-lui du temps pour vérifier qu'elle ne buggue pas), et pour vexer personne, je la mets en doublon.
 * @param {string} str
 * @author Eric Elter
 */
function cleanFractionsMemesNegatives(str: string): string {
  // EE :
  let modif: string
  modif = str.replaceAll(/dfrac/g, 'frac')

  // regex made by Mathieu Degrange
  modif = modif.replace(
    /^-\\frac(?:(\d)(\d)|{(-?\d+)}{(-?\d+)})$/i,
    (match, p1, p2, p3, p4) =>
      `\\frac{${(p1 || p3) * (p2 || p4) > 0 ? '-' : ''}${Math.abs(p1 || p3)}}{${Math.abs(p2 || p4)}}`,
  ) // Permet de transformer -\frac{13}{15} en \frac{-13}{15} et -\frac{-13}{15} en \frac{13}{15}

  modif = modif.replace(
    /^\\frac(?:(\d)(\d)|{(-?\d+)}{(-?\d+)})$/i,
    (match, p1, p2, p3, p4) =>
      `\\frac{${(p1 || p3) * (p2 || p4) < 0 ? '-' : ''}${Math.abs(p1 || p3)}}{${Math.abs(p2 || p4)}}`,
  ) // Permet de transformer \frac{-13}{-15} en \frac{13}{15}

  return modif
}

/**
 * Nettoie la saisie des \\div en les remplaçant par des / compris par ComputeEngine
 * @param {string} str
 */
function cleanDivisions(str: string): string {
  return str.replaceAll(/\\div/g, '/')
}

/**
 * Remplace les virgules non échappées par des points.
 * @param {string} str
 * @returns {string}
 */
function replaceUnescapedCommas(str: string): string {
  return str.replace(/,/g, (match, offset, string) => {
    // Vérifie si la virgule est précédée d'un antislash
    if (offset > 0 && string[offset - 1] === '\\') {
      return match // Ne remplace pas la virgule échappée
    }
    return '.'
  })
} /**
 * Remplace les espaces fins `\,` par une chaîne vide.
 * @param {string} str
 * @returns {string}
 */
function replaceThinSpaces(str: string): string {
  return str.replaceAll(/\\,/g, '')
}
/**
 *
 * Nettoie la saisie des virgules décimales en les remplaçant par des points.
 * @warning Attention ne fonctionne avec Safari que depuis 2023
 * @param {string} str
 */
function cleanComas(str: string): string {
  return replaceThinSpaces(replaceUnescapedCommas(str.replaceAll(/\{,}/g, '.')))
}

/** Ancien cleanSpaces
 * Nettoie la saisie des espaces
 * @param {string} str
 
function cleanSpaces(str: string): string {
  return str.replaceAll(/\s/g, '').replaceAll(/\\,/g, '')
}
*/

/**
 * Supprime tous les espaces "classiques" et les espaces LaTeX d'une chaîne.
 *
 * Espaces supprimés :
 * - Espaces standards (espace, tab, retour ligne, etc.)
 * - `~` (espace insécable LaTeX)
 * - `\,` (petit espace LaTeX)
 * - `\:` (espace moyen LaTeX)
 * - `\;` (espace large LaTeX)
 * - `\!` (espace négatif LaTeX)
 * - `\quad` (espace quad LaTeX)
 * - `\qquad` (espace double quad LaTeX)
 *
 * @param {string} str - La chaîne à nettoyer.
 * @returns {string} La chaîne sans aucun espace ni commande d'espacement LaTeX.
 *
 * @example
 * removeLatexSpaces("Hello ~ world\\, test \\: math \\quad fini");
 * // → "Helloworldtestmathfini"
 *
 * @author Eric Elter
 */
function cleanSpaces(str: string): string {
  const patterns = [
    /\s/g, // espaces normaux (tab, retour ligne…)
    /~/g, // espace insécable (~)
    /\\,/g, // petit espace \,
    /\\:/g, // espace moyen \:
    /\\;/g, // espace large \;
    /\\!/g, // espace négatif \!
    /\\quad/g, // espace quad
    /\\qquad/g, // espace double quad
  ]

  for (const regex of patterns) {
    str = str.replace(regex, '')
  }
  return str
}

/**
 * Réduit les espaces doubles ou triples à de simples espaces mais ne supprime pas les simples espaces
 * supprime aussi les espaces simples en début et fin de saisie
 */
function cleanDoubleSpaces(str: string): string {
  let s = str
  while (s.includes('  ')) {
    s = s.replace('  ', ' ')
  }
  if (s[0] === ' ') s = s.substring(1, s.length)
  if (s[s.length - 1] === ' ') s = s.substring(0, s.length - 1)
  return s
}

/**
 * Remplace les espaces Latex par des espaces normaux
 * @param {string} str
 */
function cleanEspaceNormal(str: string): string {
  return str.replaceAll(/\\,/g, ' ')
}

/**
 * Nettoie les parenthèses en remplaçant par celles supportées par le ComputeEngine
 * @param {string} str
 */
function cleanParentheses(str: string): string {
  return str
    .replaceAll(/\\lparen(\+?-?\d+,?\.?\d*)\\rparen/g, '($1)')
    .replaceAll(/\\left\((\+?-?\d+)\\right\)/g, '($1)')
    .replaceAll(/\\lparen(\+?-?\d+)\\rparen/g, '($1)')
    .replaceAll(/\\left\\{(.*?)\\right\\}/g, '\\{$1\\}')
    .replaceAll('\\lparen', '(')
    .replaceAll('\\rparen', ')')
    .replaceAll('\\left\\lbrack', '[')
    .replaceAll('\\right\\rbrack', ']')
    .replaceAll('\\right\\lbrack', '[')
    .replaceAll('\\left\\rbrack', ']')
    .replaceAll('\\left[', '[')
    .replaceAll('\\right]', ']')
    .replaceAll('\\right[', '[')
    .replaceAll('\\left]', ']')
    .replace(/\{\}/g, (match, offset, string) => {
      // Vérifie si les accolades sont précédées de ^ ou si elles sont seules dans la chaîne
      if (offset > 0 && string[offset - 1] === '^') {
        return match // Conserve les ^{}
      }
      if (string === '{}') {
        return match // Conserve les chaînes uniquement contenant {}
      }
      return '' // Remplace les autres occurrences de {}
    }) // Cela permet de supprimer les doubles accolades vierges sauf :
  // quand elles sont précédées de ^ (cette gestion est propre aux puissances)
  // et que la chaine ne contient que {} (qui serait le cas d'un ensemble vide)
}

function cleanMathRm(str: string): string {
  return str.replace(/\\mathrm\{(\w+)}/g, '$1')
}

function cleanImaginaire(str: string): string {
  return str.replace(/\\mathrm\{i\}|\{i\}/g, 'i')
}

function cleanOperatorName(str: string): string {
  return str
    .replace(/\\operatorname\{\s*\}/g, ' ') // remplace les accolades vides
    .replace(/\\operatorname(?!\s*\{)/g, '') // supprime operatorname sans accolades
}

/**
 * Nettoie le latex \text{} mis pour séparer le nombre de l'unité en mode texte
 * @param {string} str
 */
function cleanUnity(str: string): string {
  return str
    .replaceAll('}}', '')
    .replaceAll('{\\text{', '')
    .replaceAll('{\\:\\text{', '')
    .replaceAll('}\\:}', '')
}

/**
 * Nettoie tout ce qui peut arriver à l'utilisation des puissances
 * @param {string} str
 */
function cleanPower(str: string): string {
  return str
    .replaceAll('²', '^2') // '²' c'est pas correct en latex !
    .replaceAll('³', '^3') // '³' non plus
    .replaceAll('^{}', '') // les exposants vides, il n'aime pas ça non plus
    .replaceAll('^{^', '^{') // EE : Pour supprimer les puissances de puissances malencontreuses
}

/**
 * transforme \text{truc} en truc utiliser cleanUnity si le \text{} est au milieu de la chaine.
 * @param str
 */
function cleanLatex(str: string): string {
  const text = str.match(/(\\text\{)(.*)}/)
  if (text && text?.length > 2) return text[2]
  return str
}

function cleanMultiplyByOne(str: string): string {
  if (!str.match(/(^|[^\d])1([a-z])/)) return str
  return str.replace(/(^|[^\d])1([a-z])/g, '$1$2')
}

export function generateCleaner(
  operations: CleaningOperation[],
): (str: string) => string {
  const cleaningFunctions = operations.map((operation) => {
    switch (operation) {
      case 'fractions':
        return cleanFractions
      case 'imaginaires':
        return cleanImaginaire
      case 'fractionsMemesNegatives':
        return cleanFractionsMemesNegatives
      case 'virgules':
        return cleanComas
      case 'espaces':
        return cleanSpaces
      case 'parentheses':
        return cleanParentheses
      case 'puissances':
        return cleanPower
      case 'mathrm':
        return cleanMathRm
      case 'operatorName':
        return cleanOperatorName
      case 'divisions':
        return cleanDivisions
      case 'latex':
        return cleanLatex
      case 'foisUn':
        return cleanMultiplyByOne
      case 'unites':
        return cleanUnity
      case 'doubleEspaces':
        return cleanDoubleSpaces
      case 'espaceNormal':
        return cleanEspaceNormal
      default:
        throw new Error(`Unsupported cleaning operation: ${operation}`)
    }
  })

  return (str: string) => {
    let cleaned = String(str)

    // Supprimer tous les '_{}' et tous les '^{}'
    cleaned = cleaned.replaceAll('_{}', '').replaceAll('^{}', '')

    // Appliquer les fonctions de nettoyage
    return cleaningFunctions.reduce(
      (result, cleaningFn) => cleaningFn(result),
      cleaned,
    )
  }
}

/**
 * fonction initialement dans mathlive.js, j'en ai besoin ici, et plus dans mathlive.js
 * @param {string} input la chaine qui contient le nombre avec son unité
 * @return {Grandeur|false} l'objet de type Grandeur qui contient la valeur et l'unité... ou false si c'est pas une grandeur.
 */
function inputToGrandeur(input: string): Grandeur | false {
  if (input.indexOf('°C') > 0) {
    const split = input.split('°C')
    return new Grandeur(Number.parseFloat(split[0].replace(',', '.')), '°C')
  }
  if (input.indexOf('°') > 0) {
    const split = input.split('°')
    return new Grandeur(Number.parseFloat(split[0].replace(',', '.')), '°')
  }
  if (input.split('operatorname').length !== 2) return false
  const split = input.split('\\operatorname{')
  const mesure = Number.parseFloat(split[0].replace(',', '.'))
  if (split[1]) {
    const split2 = split[1].split('}')
    const unite = split2[0] + split2[1]
    return new Grandeur(mesure, unite)
  }
  return false
}

/**
 * Transformation de toute sorte d'expressions factorisées (multiply, power, square) en une expression factorisée qu'avec multiply où les puissances et les carrés sont réécrits comme des produits explicites.
 * Cette fonction sert pour la fonction de comparaison d'expressions factorisées.
 * @param {BoxedExpression} expr
 * @return BoxedExpression
 */
export function flatten(expr: BoxedExpression): BoxedExpression {
  if (expr.operator === 'Multiply') {
    if (expr.ops == null) {
      window.notify(
        'flatten a rencontré un problème avec une multiplication sans opérandes',
        { expr },
      )
      return engine.parse(expr.latex) as BoxedExpression
    }
    return engine.box([
      'Multiply',
      ...(expr.ops as BoxedExpression[]).map((op) => flatten(op)),
    ]) as BoxedExpression
  }
  const base = ['Power', 'Square'].includes(expr.op1.operator)
    ? flatten(expr.op1)
    : expr.op1
  if (expr.operator === 'Square') {
    return engine.box(['Multiply', base, base], { canonical: true })
  }
  if (expr.operator === 'Power' && expr.op2.operator === 'Number') {
    const expo = Number(expr.op2.value)
    const exprs = []
    for (let i = 0; i < expo; i++) {
      exprs.push(base)
    }
    return engine.box(['Multiply', ...exprs], { canonical: true })
  }
  return expr
}

/**
 * Ici, on considère que les expressions ops1 et ops2 sont factorisées et leurs valeurs absolues sont équivalentes mathématiquement .
 * Cette fonction est un outil de vérification pour s’assurer que chaque facteur dans ops1 est bien dans ops2, avec prise en compte du bon signe.
 * Cette fonction sert pour la fonction de comparaison d'expressions factorisées.
 * @param {BoxedExpression[]} ops1
 * @param {BoxedExpression[]} ops2
 * @param {boolean} signe // Si true, alors les expresssions sont équivalentes mathématiquement. Si false, alors les expressions sont opposées.
 * @param {boolean} exclusifFactorisation // Si true, seuls les facteurs identiques (modulo l'ordre) sont considérés égaux.
 * @return ResultType
 */
function allFactorsMatch(
  ops1: readonly BoxedExpression[],
  ops2: readonly BoxedExpression[],
  signe: boolean,
  exclusifFactorisation = false,
): ResultType {
  let signeCurrent = signe
  let nbMatchOK = 0
  let nbNonAttendu = 0
  let allMatch = true
  for (const op of ops2) {
    // Les facteurs du second paramètre
    let match = false
    for (const op2 of ops1) {
      // Les facteurs du premier paramètre
      if (
        (exclusifFactorisation && op2.isSame(op)) ||
        (!exclusifFactorisation && op2.isEqual(op))
      ) {
        match = true
        nbMatchOK++
        break
      } else if (exclusifFactorisation && !op2.isSame(op) && op2.isEqual(op)) {
        nbNonAttendu++
        break
      }
      const newOp2 = engine.box(['Subtract', '0', op2.json], {
        canonical: true,
      }) // Pour tester avec l'opposé du facteur.
      if (
        (exclusifFactorisation && op.isSame(newOp2)) ||
        (!exclusifFactorisation && op.isEqual(newOp2))
      ) {
        signeCurrent = !signeCurrent
        match = true
        nbMatchOK++
        break
      } else if (
        exclusifFactorisation &&
        !op.isSame(newOp2) &&
        op.isEqual(newOp2)
      ) {
        nbNonAttendu++
        break
      }
    }
    allMatch &&= match
  }

  if (!allMatch) {
    if (nbMatchOK > 0)
      return {
        isOk: false,
        feedback:
          nbMatchOK > 1
            ? `Seulement $${nbMatchOK}$ facteurs sont corrects.`
            : `Seulement $${nbMatchOK}$ facteur est correct.`,
      }
    if (nbNonAttendu > 0)
      return {
        isOk: false,
        feedback:
          nbNonAttendu > 1
            ? `$${nbMatchOK}$ facteurs ne sont pas sous la forme attendue.`
            : `$${nbMatchOK}$ facteur n'est pas  sous la forme attendue..`,
      }
    return { isOk: false, feedback: "Aucun facteur n'est correct." }
  }
  return {
    isOk: signeCurrent,
    feedback: signeCurrent
      ? ''
      : "L'expression saisie est l'opposé de l'expression attendue.",
  }
}

/**
 * comparaison d'expressions factorisées'
 * @param {string} input
 * @param {string} goodAnswer
 * @param {Object} [options={}] - Options pour la comparaison.
 * @param {boolean} [options.exclusifFactorisation=false] // si true, seuls les facteurs (modulo l'ordre) égaux à ceux de goodAnswer seront considérés corrects.
 * @param {boolean} [options.nbFacteursIdentiquesFactorisation=false] // si true, input et goodAnswer sont considérés égaux que s'ils contiennent le même nombre de facteurs.
 * @param {boolean} [options.unSeulFacteurLitteral=false] // si true, input peut être factorisé et ne contenir qu'un seul facteur littéral (les autres sont des nombres)
 * @return ResultType
 * @author Jean-Claude Lhote
 */
function factorisationCompare(
  input: string,
  goodAnswer: string,
  {
    exclusifFactorisation = false,
    nbFacteursIdentiquesFactorisation = false,
    unSeulFacteurLitteral = false,
  } = {},
): ResultType {
  const clean = generateCleaner([
    'puissances',
    'virgules',
    'fractions',
    'parentheses',
  ])

  let signe = true
  const aCleaned = clean(input)
  if (
    input.includes('\\times1\\') ||
    input.endsWith('\\times1') ||
    input.startsWith('1\\times')
  ) {
    return { isOk: false, feedback: "Une factorisation par 1 a peu d'intérêt." }
  }
  const bCleaned = clean(goodAnswer)
  const saisieParsedInit = engine.parse(aCleaned, { canonical: true })
  const reponseParsedInit = engine.parse(bCleaned, { canonical: true })

  if (saisieParsedInit == null || reponseParsedInit == null) {
    window.notify(
      'factorisationCompare a rencontré un problème en analysant la réponse ou la saisie ',
      { saisie: input, reponse: goodAnswer },
    )
    return { isOk: false }
  }
  let saisieHead = saisieParsedInit.operator
  let answerHead = reponseParsedInit.operator
  let saisieParsed = saisieParsedInit
  let reponseParsed = reponseParsedInit
  if (saisieHead === 'Negate') {
    // on gère le cas où la saisie commence par le signe moins
    saisieParsed = saisieParsedInit.op1
    saisieHead = saisieParsed.operator
    signe = !signe
  }
  if (answerHead === 'Negate') {
    // on gère le cas où la réponse commence par le signe moins
    reponseParsed = reponseParsedInit.op1
    answerHead = reponseParsed.operator
    signe = !signe
  }

  // isOk1 atteste que le développement de la saisie et de la reponse attendue sont égales
  const saisieDev = engine
    .box(['ExpandAll', saisieParsed])
    .evaluate()
    .simplify().canonical
  const reponseDev = engine
    .box(['ExpandAll', reponseParsed])
    .evaluate()
    .simplify().canonical
  const isOk1 = saisieDev.isEqual(reponseDev)
  // const isOk1 = saisieParsedInit.isEqual(reponseParsedInit) // EE : Depuis la version 0.26 de cortexEngine, ce qui précède devrait être inutile sauf que (x+5)^2 différent de (x+5)(x+5)

  if (!['Multiply', 'Power', 'Square'].includes(saisieHead)) {
    let feedback = "L'expression saisie n'est pas factorisée"
    feedback += isOk1
      ? " bien qu'elle soit égale à l'expression attendue."
      : '.'
    return { isOk: false, feedback }
  }
  const reponseFactors = flatten(reponseParsed).ops
  const saisieFactors = flatten(saisieParsed).ops
  if (reponseFactors == null) {
    // EE : Y a aucune raison que ce soit null si l'exercice est bien codé et la réponse fournie dans handleAnswers est correct.
    window.notify(
      'factorisationCompare a rencontré un problème en analysant la réponse. ',
      { reponse: goodAnswer },
    )
    return {
      isOk: false,
      feedback: 'Un problème a eu lieu lors de la comparaison.',
    } // EE : Eviter ce genre de feedback car cela ne doit se produire.
  }
  if (saisieFactors == null) {
    // EE : Je ne vois pas quand saisieFactors peut-être null. Un exemple ?
    return {
      isOk: false,
      feedback: "L'expression saisie n'a pas le format attendu.",
    }
  }
  if (nbFacteursIdentiquesFactorisation) {
    if (saisieFactors.length > reponseFactors.length) {
      if (isOk1)
        return {
          isOk: false,
          feedback: "L'expression saisie est trop factorisée.",
        }
      return {
        isOk: false,
        feedback: "L'expression saisie a trop de facteurs.",
      }
    } else if (saisieFactors.length < reponseFactors.length) {
      if (isOk1)
        return {
          isOk: false,
          feedback: "L'expression saisie peut être davantage factorisée.",
        }
      return {
        isOk: false,
        feedback: "Il manque des facteurs à l'expression saisie.",
      }
    }
    const result = allFactorsMatch(
      saisieFactors,
      reponseFactors,
      signe,
      exclusifFactorisation,
    )
    if (!result.isOk) return { isOk: false, feedback: `${result.feedback}` }

    const result2 = allFactorsMatch(
      reponseFactors,
      saisieFactors,
      signe,
      exclusifFactorisation,
    )
    return { isOk: result2.isOk, feedback: `${result2.feedback ?? ''}` }
  }

  if (!isOk1 || exclusifFactorisation) {
    const result = allFactorsMatch(
      saisieFactors,
      reponseFactors,
      signe,
      exclusifFactorisation,
    )
    if (!result.isOk) return { isOk: false, feedback: `${result.feedback}` }

    const result2 = allFactorsMatch(
      reponseFactors,
      saisieFactors,
      signe,
      exclusifFactorisation,
    )
    return { isOk: result2.isOk, feedback: `${result2.feedback ?? ''}` }
  }
  if (isOk1 && unSeulFacteurLitteral) {
    let nbNumber = 0
    for (const op of saisieFactors) {
      if (!isNaN(Number(op.json))) nbNumber++
    }
    if (nbNumber === saisieFactors.length - 1)
      return {
        isOk: false,
        feedback: "L'expression saisie peut être davantage factorisée.",
      }
  }
  return { isOk: true }
}

/**
 * comparaison de durées
 * @param {string} input
 * @param {string} goodAnswer
 * @return ResultType
 * @author Jean-Claude Lhote
 */
function hmsCompare(input: string, goodAnswer: string): ResultType {
  const clean = generateCleaner(['unites'])
  const cleanInput = clean(input)
  const inputHms = Hms.fromString(cleanInput)
  const goodAnswerHms = Hms.fromString(goodAnswer)
  return { isOk: goodAnswerHms.isTheSame(inputHms) }
}

engine.latexDictionary = [
  ...engine.latexDictionary.filter((x) => x.name !== 'Subtract'),
  {
    ...(engine.latexDictionary.find(
      (x) => x.name === 'Subtract',
    ) as unknown as LatexDictionaryEntry),
    parse: (parser: Parser, lhs: Expression, terminator: ParseLatexOptions) => {
      // Reculer d'un jeton : nous allons analyser le '-' comme faisant partie du rhs afin de
      // pouvoir conserver l'expression en tant que 'Add'.
      const tocken = parser.nextToken()
      parser.index-- // On recule parce que nextTocken() fait avancer de un jeton.
      if (tocken == null) return lhs
      parser.index -= 1
      const rhs = parser.parseExpression({ ...terminator, minPrec: 275 + 3 })
      return ['Add', lhs, rhs]
    },
  } as unknown as LatexDictionaryEntry, // Conversion en 'unknown' puis en 'LatexDictionaryEntry'
]

// Pour éviter que G en Latex soit pris pour CatalanConstant
engine.latexDictionary = [
  ...engine.latexDictionary,
  { identifierTrigger: 'G', name: 'G' } as LatexDictionaryEntry,
]

/****************************************************************************************************
 *
 *                  C'est la fonction, ci-dessous, la future fonction couteauSuisse
 *                            qu'il faudra nommer fonctionComparaison ?
 *
 ****************************************************************************************************/
/**
 * comparaison générique : notre couteau suisse
 * @param {string} input
 * @param {string} goodAnswer
 /**
 * @param {{
 *   expressionsForcementReduites: boolean,
 *   avecSigneMultiplier: boolean,
 *   avecFractions: boolean,
 *   sansTrigo;boolean,
 *   fractionIrreductible: boolean,
 *   fractionSimplifiee: boolean,
 *   fractionReduite: boolean,
 *   fractionDecimale: boolean,
 *   fractionEgale: boolean,
 *   fractionIdentique : boolean,
 *   nombreDecimalSeulement: boolean,
 *   expressionNumerique: boolean,
 *   additionSeulementEtNonResultat: boolean,
 *   soustractionSeulementEtNonResultat:boolean,
 *   multiplicationSeulementEtNonResultat:boolean,
 *   divisionSeulementEtNonResultat:boolean,
 *   HMS: boolean,
 *   intervalle: boolean,
 *   estDansIntervalle: boolean,
 *   ecritureScientifique: boolean,
 *   unite: boolean,
 *   precisionUnite: number,
 *   ensembleDeNombres: boolean,
 *   kUplet: boolean,
 *   suiteDeNombres,
 *   suiteRangeeDeNombres,
 *   puissance: boolean,
 *   seulementCertainesPuissances: boolean,
 *   sansExposantUn: boolean,
 *   factorisation: boolean,
 *   exclusifFactorisation: boolean,
 *   nbFacteursIdentiquesFactorisation: boolean,
 *   unSeulFacteurLitteral,
 *   developpementEgal,
 *   texteAvecCasse: boolean,
 *   texteSansCasse: boolean
 * }} [options]
 * @author Eric Elter
 * @return ResultType
 */
export function fonctionComparaison(
  input: string,
  goodAnswer: string,
  {
    expressionsForcementReduites,
    avecSigneMultiplier,
    avecFractions,
    sansTrigo,
    fractionIrreductible, // Documenté
    fractionSimplifiee, // Documenté
    fractionReduite, // Documenté
    fractionDecimale, // Documenté
    fractionEgale, // Documenté
    fractionIdentique, // Documenté
    nombreDecimalSeulement, // Documenté
    expressionNumerique, // Documenté
    additionSeulementEtNonResultat, // Documenté
    soustractionSeulementEtNonResultat, // Documenté
    multiplicationSeulementEtNonResultat, // Documenté
    divisionSeulementEtNonResultat, // Documenté
    ensembleDeNombres, // Documenté
    fonction,
    kUplet, // Documenté
    suiteDeNombres, // Documenté
    suiteRangeeDeNombres, // Documenté
    puissance, // Documenté
    seulementCertainesPuissances, // Documenté
    sansExposantUn, // Documenté
    factorisation, // Documenté
    exclusifFactorisation, // Documenté
    nbFacteursIdentiquesFactorisation, // Documenté
    unSeulFacteurLitteral, // Documenté
    HMS, // Documenté
    developpementEgal,
    intervalle,
    estDansIntervalle,
    ecritureScientifique, // Documenté
    unite,
    precisionUnite,
    texteAvecCasse,
    texteSansCasse,
    nombreAvecEspace,
    egaliteExpression,
    calculFormel, // Documenté
    nonReponseAcceptee,
    variable,
    entier,
    domaine,
  }: OptionsComparaisonType = {
    expressionsForcementReduites: true,
    avecSigneMultiplier: true,
    avecFractions: true,
    sansTrigo: false,
    fractionIrreductible: false,
    fractionSimplifiee: false,
    fractionReduite: false,
    fractionDecimale: false,
    fractionEgale: false,
    fractionIdentique: false,
    nombreDecimalSeulement: false,
    expressionNumerique: false,
    additionSeulementEtNonResultat: false,
    soustractionSeulementEtNonResultat: false,
    multiplicationSeulementEtNonResultat: false,
    divisionSeulementEtNonResultat: false,
    ensembleDeNombres: false,
    fonction: false,
    kUplet: false,
    seulementCertainesPuissances: false,
    sansExposantUn: false,
    suiteDeNombres: false,
    suiteRangeeDeNombres: false,
    factorisation: false,
    exclusifFactorisation: false,
    nbFacteursIdentiquesFactorisation: false,
    unSeulFacteurLitteral: false,
    HMS: false,
    developpementEgal: false,
    intervalle: false,
    estDansIntervalle: false,
    ecritureScientifique: false,
    unite: false,
    precisionUnite: 0,
    puissance: false,
    texteAvecCasse: false,
    texteSansCasse: false,
    nombreAvecEspace: false,
    egaliteExpression: false,
    calculFormel: false,
    nonReponseAcceptee: false,
    variable: 'x',
    entier: false,
    domaine: [-100, 100],
  },
): ResultType {
  // nonReponseAcceptee = true permet d'avoir des champs vides (on pense aux fillInTheBlank qui peuvent être facultatifs, comme par exemple un facteur 1)
  // si false (valeur par défaut ou si non précisée) alors une réponse vide entraîne isOk = false et un feedback pour notifier l'absence de réponse
  if (nonReponseAcceptee) {
    if (input === '' && goodAnswer === '') return { isOk: true }
    return { isOk: false, feedback: 'Une réponse doit être saisie' }
  }
  if (input === '') {
    return { isOk: false, feedback: 'Une réponse doit être saisie' }
  }
  // ici, on met tous les tests particuliers (HMS, intervalle)
  // if (HMS) return comparaisonExpressions(input, goodAnswer)
  input = input.replaceAll('×', '\\times') // Indispensable pour ceux qui font du copier-coller
  if (HMS) return hmsCompare(input, goodAnswer)
  if (fonction)
    return functionCompare(input, goodAnswer, {
      variable: variable ?? 'x',
      domaine: domaine ?? [-100, 100],
      entier: entier ?? false,
    })
  if (intervalle) return intervalsCompare(input, goodAnswer)
  if (estDansIntervalle) return intervalCompare(input, goodAnswer)
  if (ecritureScientifique) return scientifiqueCompare(input, goodAnswer)
  if (unite) {
    return unitsCompare(input, goodAnswer, { precision: precisionUnite })
  }
  if (
    factorisation ||
    exclusifFactorisation ||
    nbFacteursIdentiquesFactorisation ||
    unSeulFacteurLitteral
  )
    return factorisationCompare(input, goodAnswer, {
      exclusifFactorisation,
      nbFacteursIdentiquesFactorisation,
      unSeulFacteurLitteral,
    })
  if (puissance || seulementCertainesPuissances || sansExposantUn)
    return comparaisonPuissances(input, goodAnswer, {
      seulementCertainesPuissances,
      sansExposantUn,
    })
  if (texteAvecCasse) return texteAvecCasseCompare(input, goodAnswer)
  if (texteSansCasse) return texteSansCasseCompare(input, goodAnswer)
  if (egaliteExpression) return egaliteCompare(input, goodAnswer)
  if (nombreAvecEspace) return numberWithSpaceCompare(input, goodAnswer)
  if (expressionNumerique) return expressionNumeriqueCompare(input, goodAnswer)
  if (ensembleDeNombres || kUplet)
    return ensembleNombres(input, goodAnswer, { kUplet }) // ensembleDeNombres est non trié alors que kUplet nécessite le tri
  if (suiteDeNombres || suiteRangeeDeNombres)
    return ensembleNombres(input, goodAnswer, {
      kUplet: suiteRangeeDeNombres,
      avecAccolades: false,
    })
  if (
    fractionSimplifiee ||
    fractionReduite ||
    fractionIrreductible ||
    fractionDecimale ||
    fractionEgale ||
    fractionIdentique
  )
    return comparaisonFraction(input, goodAnswer, {
      fractionReduite,
      fractionIrreductible,
      fractionDecimale,
      fractionEgale,
      fractionIdentique,
      nombreDecimalSeulement,
    }) // feedback OK
  if (developpementEgal) return ontDeveloppementsEgaux(input, goodAnswer)

  // Ici, c'est la comparaison par défaut qui fonctionne dans la très grande majorité des cas
  return expressionDeveloppeeEtReduiteCompare(input, goodAnswer, {
    expressionsForcementReduites,
    avecSigneMultiplier,
    avecFractions,
    sansTrigo,
    fractionIrreductible,
    additionSeulementEtNonResultat,
    soustractionSeulementEtNonResultat,
    multiplicationSeulementEtNonResultat,
    divisionSeulementEtNonResultat,
    nombreDecimalSeulement,
    calculFormel,
  })
}

/**
 * Cette fonction permet que ComputeEngine fasse un super job avec la réduction d'expression et avec des options supplémentaires
 * @param {BoxedExpression} expr
 * @param {{
 *   expressionsForcementReduites: boolean,
 *   fractionIrreducibleSeulement: boolean,
 *   nombreDecimalSeulement: boolean,
 * }} [options]
 * @author Eric Elter (aidé par ArnoG)
 * @return BoxedExpression
 */
function customCanonical(
  expr: BoxedExpression,
  {
    expressionsForcementReduites = true,
    fractionIrreductible = false, // SANS DOUTE INUTILE MAINTENANT. A VERIFIER
    nombreDecimalSeulement = false,
  } = {},
): BoxedExpression {
  let expression = expr
  if (nombreDecimalSeulement) {
    // Fonctionnement : On retourne le calcul
    return expression
  }
  // Fonctionnement par défaut : Tout est accepté si l'expression est un nombre
  // Ci-dessous, on accepte le résultat d'un calcul mais pas un autre enchaînement Ici, si 4+2 est attendu, alors 4+2=6 mais 4+2!=5+1. C'est la valeur par défaut
  // Note: depuis compute-engine v0.30, .value ne retourne plus un number directement.
  // On utilise .canonical.N().numericValue pour vérifier si l'expression est numérique.
  const numericVal = expression.canonical.N().numericValue
  if (numericVal !== null) {
    // L'expression est une expression numérique, les expressions littérales ne sont pas traitées ici
    if (fractionIrreductible) {
      if (
        (expression.operator === 'Divide' ||
          expression.operator === 'Rational') && // L'expression contient une division ou une fraction fractionIrreductible
        (expression.engine
          .box(['GCD', expression.op1, expression.op2])
          .evaluate().numericValue !== 1 ||
          expression.op2.numericValue === 1)
      )
        return expression

      if (expression.operator === 'Number') {
        // Ce cas est si un élève note 1.4 pour une fraction de 7/5 par exemple.
        return engine.parse(`\\frac{${Number(numericVal)}}{1}`, {
          canonical: false,
        })
      }
    }
    return expression.engine.number(Number(numericVal))
  }
  /* Supprimé depuis la création de expressionNumerique
  if (expressionsForcementReduites) {
    // Ici, le traitement n'est fait que pour des expressions forcément réduites
    // Ci-dessous, on accepte que l'enchaînement proposé et pas le résultat. Ici, si 4+2 est attendu, alors4+2!=6 et 4+2!=5+1
    if (
      (expression.operator === 'Divide' ||
        expression.operator === 'Rational') &&
      typeof expression.value === 'number'
    ) {
      if (fractionIrreductible) {
        if (
          expression.engine.box(['GCD', expression.op1, expression.op2])
            .value !== 1 ||
          expression.op2.value === 1
        ) {
          return expression
        }
      }
      return expression.engine.number(expression.value)
    }
  }
  */
  if (expression.operator === 'Divide' || expression.operator === 'Rational') {
    // Pour enlever les divisions éventuelles par 1
    if (expression.op2.numericValue === 1) expression = expression.op1
  }

  // Ne pas prendre en compte les indices comme c_{n} // Sans doute plus du tout utile depuis l'introduction de l'option calculFormel
  if (expression.operator !== 'Subscript')
    if (expression.ops) {
      // Pour ne pas accepter les +0, les \\times1, pour ne pas se soucier de l'ordre
      return expression.engine.box(
        [
          expression.operator,
          ...expression.ops.map((x) =>
            customCanonical(x, {
              expressionsForcementReduites,
              fractionIrreductible,
              nombreDecimalSeulement,
            }),
          ),
        ],
        { canonical: ['InvisibleOperator', 'Order', 'Flatten'] },
      )
    }
  return expression.canonical
}

/**
 * @param {string} input
 * @param {string} goodAnswer
 * @author Eric Elter
 * @return ResultType
 */

function comparaisonFraction(
  input: string,
  goodAnswer: string,
  {
    fractionReduite = false,
    fractionIrreductible = false,
    fractionDecimale = false,
    fractionEgale = false,
    fractionIdentique = false,
    nombreDecimalSeulement = false,
  } = {},
): ResultType {
  const clean = generateCleaner([
    'virgules',
    // 'fractions'
    'fractionsMemesNegatives',
  ])

  const cleanIput = clean(input)
  const cleanGoodAnswer = clean(goodAnswer)
  const saisieNativeParsed = engine.parse(cleanIput, { canonical: false })
  const reponseNativeParsed = engine.parse(cleanGoodAnswer, {
    canonical: false,
  })
  // if (nombreDecimalSeulement) { console.log(reponseNativeParsed.toLatex(), reponseNativeParsed.N().toString()) }
  if (nombreDecimalSeulement) {
    if (
      expressionDeveloppeeEtReduiteCompare(
        cleanIput,
        reponseNativeParsed.N().toString(),
        { nombreDecimalSeulement: true },
      ).isOk
    ) {
      return { isOk: true, feedback: '' }
    }
    // if (!(reponseNativeParsed.operator === 'Number' || (reponseNativeParsed.operator === 'Negate' && reponseNativeParsed.ops !== null && reponseNativeParsed.ops.length === 1))) return { isOk: false, feedback: 'Résultat incorrect car une valeur décimale (ou entière) est attendue.' }
  }

  // Note: depuis compute-engine v0.30, .value retourne undefined pour les fractions.
  // On utilise .canonical.N().numericValue pour obtenir la valeur numérique.
  const reponseParsed = reponseNativeParsed.engine.number(
    Number(reponseNativeParsed.canonical.N().numericValue),
  ) // Ici, c'est la valeur numérique (même approchée) de cleanGoodAnswer.
  // Note: depuis compute-engine v0.30, isEqual sur des expressions non-canoniques
  // compare la structure et non la valeur. On utilise .canonical pour comparer les valeurs.
  if (saisieNativeParsed.canonical.isEqual(reponseNativeParsed.canonical)) {
    if (fractionIdentique) {
      if (saisieNativeParsed.isSame(reponseNativeParsed))
        return { isOk: true, feedback: '' }
      return {
        isOk: false,
        feedback: 'Le résultat ne correspond pas à la fraction attendue.',
      }
    }
    if (saisieNativeParsed.operator === 'Number' && reponseParsed.isInteger) {
      // réponse est égale à un entier et saisie est un nombre entier (2) ou décimal (2.0).
      return { isOk: true }
    }
    if (fractionEgale) {
      if (
        saisieNativeParsed.operator === 'Divide' ||
        saisieNativeParsed.operator === 'Rational' ||
        (saisieNativeParsed.operator === 'Negate' &&
          (saisieNativeParsed.op1.operator === 'Divide' ||
            saisieNativeParsed.op1.operator === 'Rational'))
      ) {
        // saisie doit être une fraction (ou une division)
        // reponse doit avoir des numérateur/dénominateur multiples de ceux de saisie ou bien fractionReduite est true
        let num, den
        if (saisieNativeParsed.operator !== 'Negate') {
          // Traitement des cas si la fraction est négative ou pas.
          num = saisieNativeParsed.op1.canonical.evaluate().numericValue
          den = saisieNativeParsed.op2.canonical.evaluate().numericValue
        } else {
          num = saisieNativeParsed.op1.op1.canonical.evaluate().numericValue
          den = saisieNativeParsed.op1.op2.canonical.evaluate().numericValue
        }
        if (Number.isInteger(num) && Number.isInteger(den)) {
          return { isOk: true }
        }
        return {
          isOk: false,
          feedback:
            'Résultat incorrect car dénominateur et numérateur doivent être entiers.',
        }
      }
      return {
        isOk: false,
        feedback: 'Résultat incorrect car une fraction est attendue.',
      }
    }
    if (fractionDecimale) {
      if (
        (saisieNativeParsed.operator === 'Divide' ||
          saisieNativeParsed.operator === 'Rational') &&
        Number.isInteger(Math.log10(Number(saisieNativeParsed.op2.value))) &&
        Math.log10(Number(saisieNativeParsed.op2.value)) >= 0
      ) {
        if (!saisieNativeParsed.op1.isInteger)
          return {
            isOk: false,
            feedback: "Résultat incorrect car le numérateur n'est pas entier.",
          }
        return { isOk: true }
      }
      return {
        isOk: false,
        feedback: 'Résultat incorrect car une fraction décimale est attendue.',
      } // Sous-entendu : Et pas une autre fraction qu'irréductible
    }
    if (fractionIrreductible) {
      if (
        ((saisieNativeParsed.operator === 'Divide' ||
          saisieNativeParsed.operator === 'Rational') &&
          // Note: depuis compute-engine v0.30, .value retourne undefined pour les expressions.
          // On utilise .evaluate().numericValue pour obtenir la valeur du GCD.
          saisieNativeParsed.engine
            .box(['GCD', saisieNativeParsed.op1, saisieNativeParsed.op2])
            .evaluate().numericValue === 1) ||
        saisieNativeParsed.canonical.isInteger
      ) {
        return { isOk: true }
      }
      return {
        isOk: false,
        feedback:
          'Résultat incorrect car une fraction irréductible est attendue.',
      } // Sous-entendu : Et pas une autre fraction qu'irréductible
    }
    if (
      (saisieNativeParsed.operator === 'Divide' ||
        saisieNativeParsed.operator === 'Rational') && // saisie doit être une fraction (ou une division)
      Math.abs(Number(saisieNativeParsed.op1.value)) <
        Math.abs(Number(reponseNativeParsed.op1.value)) && // saisie doit avoir des numérateur/dénominateur plus petits que reponse. Les valeurs absolues gèrent le cas des fractions négatives.
      saisieNativeParsed.op1.isInteger &&
      saisieNativeParsed.op2.isInteger && // saisie doit avoir des numérateur/dénominateur entiers
      (fractionReduite ||
        Number(reponseNativeParsed.op1.value) %
          Number(saisieNativeParsed.op1.value) ===
          0)
    ) {
      // reponse doit avoir des numérateur/dénominateur multiples de ceux de saisie ou bien fractionReduite est true
      return { isOk: true }
      /// Ci-dessous : le traitement des feedback : les saisies sont égales aux réponses mais la saisie ne convient tout de même pas.
    }
    if (!saisieNativeParsed.op1.value && !reponseParsed.isInteger) {
      // Si pas de op1.value, c'est que saisie est un nombre alors que reponse n'est pas entier.
      return {
        isOk: false,
        feedback: 'Résultat incorrect car une fraction est attendue.',
      } // Sous-entendu : Et pas un nombre
    }
    if (
      saisieNativeParsed.operator === 'Divide' ||
      saisieNativeParsed.operator === 'Rational'
    ) {
      if (
        Math.abs(Number(saisieNativeParsed.op1.value)) >=
        Math.abs(Number(reponseNativeParsed.op1.value))
      ) {
        return {
          isOk: false,
          feedback:
            'Résultat incorrect car une fraction simplifiée est attendue.',
        } // Sous-entendu : Et pas numérateur/dénominateur plus grands ou égaux que reponse.  Les valeurs absolues gèrent le cas des fractions négatives.
      }
      if (
        !saisieNativeParsed.op1.isInteger ||
        !saisieNativeParsed.op2.isInteger
      ) {
        return {
          isOk: false,
          feedback:
            'Résultat incorrect car dénominateur et numérateur doivent être entiers.',
        } // Sous-entendu : Et pas numérateur/dénominateur décimaux pour au moins l'un d'entre eux
      }
      // if (reponseNativeParsed.op1.value % saisieNativeParsed.op1.value !== 0) {
      return {
        isOk: false,
        feedback: 'Résultat incorrect car une fraction réduite est attendue.',
      } // Sous-entendu : Et pas numérateur/dénominateur de reponse non multiples de ceux de saisie
    }
    return {
      isOk: false,
      feedback: 'Résultat incorrect car une fraction est attendue.',
    } // Sous-entendu : Et pas une opération autre qu'une division
  }
  return { isOk: false, feedback: 'Résultat incorrect.' }
}

// Définir le type pour les substitutions
type Substitutions = { [variable: string]: number }

/**
 * Comparaison d'expressions developpées ET REDUITES (multiplications acceptées, fractions acceptées... PAS ENCORE AVEC DES RACINES CARREES mais cela arrive.)
 * Comparaison aussi de tous les nombres (puisque c'est une expression réduite particulière)
 * On peut paramétrer si :
 * - on accepte ou pas les signes multiplier dans ces expressions,
 * - on accepte ou pas les fractions,
 * - on accepte ou pas les fractions irréductibles seulement (ou les entiers si den = 1),
 * - on n'accepte que l'enchaînement de calculs fourni en goodAnswer et non le résultat de cet enchaînement de calculs
 * @param {string} input
 * @param {string} goodAnswer
 * @param {{expressionsForcementReduites:boolean, avecSigneMultiplier:boolean, avecFractions:boolean, sansTrigo:boolean, fractionIrreducibleSeulement:boolean, nombreDecimalSeulement:boolean}} [options]
 * @author Eric Elter
 * @return ResultType
 */

function expressionDeveloppeeEtReduiteCompare(
  input: string,
  goodAnswer: string,
  {
    expressionsForcementReduites = true,
    avecSigneMultiplier = true,
    avecFractions = true,
    sansTrigo = false,
    fractionIrreductible = false,
    nombreDecimalSeulement = false,
    additionSeulementEtNonResultat = false,
    soustractionSeulementEtNonResultat = false,
    multiplicationSeulementEtNonResultat = false,
    divisionSeulementEtNonResultat = false,
    calculFormel = false,
  } = {},
): ResultType {
  let feedback = ''
  // Ces 2 lignes sont à améliorer... EE : Faut que je teste un truc... et rajouter les racines carrées aussi
  if (!avecSigneMultiplier && input.includes('times'))
    return { isOk: false, feedback: "Aucun signe $\\times$ n'est autorisé." }
  if (!avecFractions && input.includes('frac'))
    return { isOk: false, feedback: "Aucune fraction n'est autorisée." }
  if (
    sansTrigo &&
    (input.includes('cos') || input.includes('sin') || input.includes('tan'))
  )
    return {
      isOk: false,
      feedback: "Aucune fonction trigonométrique n'est autorisée.",
    }

  const clean = generateCleaner([
    'puissances',
    'virgules',
    // 'fractions',
    'fractionsMemesNegatives',
    'parentheses',
    'foisUn',
    'imaginaires',
  ])
  let localInput = clean(input)
  const localGoodAnswer = clean(goodAnswer)

  if (calculFormel)
    if (
      engine
        .parse(localInput, { canonical: false })
        .isEqual(engine.parse(localGoodAnswer, { canonical: false }))
    )
      return { isOk: true, feedback: '' }
    else
      return {
        isOk: false,
        feedback: 'La réponse fournie est incorrecte.',
      }

  if (nombreDecimalSeulement) {
    localInput = localInput
      .replace('(', '')
      .replace(')', '')
      .replace('\\lparen', '')
      .replace('\\rparen', '') // Utile pour 5R20
    const saisieParsed = engine.parse(localInput, { canonical: false })
    if (
      !(
        saisieParsed.operator === 'Number' ||
        (saisieParsed.operator === 'Negate' &&
          saisieParsed.ops !== null &&
          saisieParsed.ops.length === 1)
      )
    )
      return {
        isOk: false,
        feedback:
          'Résultat incorrect car une valeur décimale (ou entière) est attendue.',
      }
  }
  const saisieParsed = customCanonical(
    engine.parse(localInput, { canonical: false }),
    {},
  )

  const reponseParsed = customCanonical(
    engine.parse(localGoodAnswer, { canonical: false }),
    {},
  )

  /* console.info(
    JSON.stringify(engine.parse(localInput, { canonical: false }).json),
  )
  console.info(
    JSON.stringify(engine.parse(localGoodAnswer, { canonical: false }).json),
  )
*/
  /// Code JCL
  // Ci-dessous, si on a une comparaison fausse mais que l'expression donnée est mathématiquement correcte, on fait un feedback.
  const substitutions: Substitutions = { a: 2, b: 2, c: 2, x: 2, y: 2, z: 2 } // On peut ajouter d'autres variables si nécessaire

  if (
    additionSeulementEtNonResultat ||
    soustractionSeulementEtNonResultat ||
    multiplicationSeulementEtNonResultat ||
    divisionSeulementEtNonResultat
  ) {
    const parsedExpression = engine.parse(localInput, { canonical: false })
    if (
      parsedExpression.operator === 'Add' &&
      (parsedExpression.op1.is(0) || parsedExpression.op2.is(0))
    ) {
      feedback = 'Résultat incorrect car la somme par 0 est inutile.' // Sous-entendu : Pas de '+0'
      return { isOk: false, feedback }
    }
    if (input.includes('-0')) {
      feedback = 'Résultat incorrect car la différence par 0 est inutile.' // Sous-entendu : Pas de '-0'
      return { isOk: false, feedback }
    }
    if (
      parsedExpression.operator === 'Multiply' &&
      (parsedExpression.op1.is(1) || parsedExpression.op2.is(1))
    ) {
      feedback = 'Résultat incorrect car le produit par 1 est inutile.' // Sous-entendu : Pas de 'fois 1'
      return { isOk: false, feedback }
    }
    if (
      (parsedExpression.operator === 'Divide' ||
        parsedExpression.operator === 'Rational') &&
      parsedExpression.op2.is(0)
    ) {
      feedback = 'Résultat incorrect car la division par 1 est inutile.' // Sous-entendu : Pas de 'divisé par 1'
      return { isOk: false, feedback }
    }
  }

  if (
    saisieParsed.isEqual(reponseParsed) &&
    !saisieParsed.isSame(reponseParsed)
  ) {
    if (
      additionSeulementEtNonResultat ||
      soustractionSeulementEtNonResultat ||
      multiplicationSeulementEtNonResultat ||
      divisionSeulementEtNonResultat
    ) {
      const saisieCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible,
          nombreDecimalSeulement,
        },
      )
      const reponseCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible,
        },
      )
      if (saisieCalculeeParsed.isSame(reponseCalculeeParsed)) {
        if (additionSeulementEtNonResultat && saisieParsed.operator === 'Add')
          // Todo : On a, ici, un pb. Si on attend 3+2, alors 6-1 sera accepté. Et on ne peut pas exclure le '-' car 6+(-1) serait correct
          // 26/08/2025 : Pb dans les mains de @ArnoG qui ne sait pas encore commment le régler.
          return { isOk: true, feedback: '' }
        if (
          multiplicationSeulementEtNonResultat &&
          (saisieParsed.operator === 'Multiply' ||
            saisieParsed.operator === 'Power')
        )
          return { isOk: true, feedback: '' }
        if (
          divisionSeulementEtNonResultat &&
          (saisieParsed.operator === 'Divide' ||
            saisieParsed.operator === 'Power')
        )
          return { isOk: true, feedback: '' }

        // Ce code ci-dessous dans l'absolu devrait fonctionner sauf que parse transforme une soustraction en une addition : 6-3=6+(-3)
        // if (soustractionSeulementEtNonResultat && saisieParsed.operator === 'Substract') return { isOk: true, feedback: '' }

        // Donc par rapport à ce qui est au-dessus, il faut chercher l'absence d'un délimiter devant le -.
        // console.info(JSON.stringify(ce.parse('12+(-2)', { canonical: false }).json));
        // -> ["Add",12,["Delimiter",["Negate",2]]]
        // console.info(JSON.stringify(ce.parse('12-2', { canonical: false }).json));
        // -> ["Add",12,["Negate",2]]

        // Il faut en plus que le negate soit devant le Delimiter sinon 3+(-2) serait accepté comme soustraction pour 3-2.
        const saisieJSON = JSON.stringify(
          engine.parse(localInput, { canonical: false }).json,
        )
        function negateBeforeDelimiter(node: string): boolean {
          const iNeg = node.indexOf('Negate')
          const iDel = node.indexOf('Delimiter')
          return iNeg !== -1 && (iDel === -1 || iNeg < iDel)
        }

        // Todo : On a, ici, encore un pb. Si on attend 3-2, alors 3+-2 et 3-+2 seront acceptés.
        // 26/08/2025 : Pb dans les mains de @ArnoG qui ne sait pas encore commment le régler.

        if (
          soustractionSeulementEtNonResultat &&
          negateBeforeDelimiter(saisieJSON)
        ) {
          return { isOk: true, feedback: '' }
        }
      }
    }
  }
  if (!saisieParsed.isSame(reponseParsed)) {
    // On va essayer de traiter ici tous les feedbacks de façon exhaustive
    if (nombreDecimalSeulement) {
      // On veut un résultat numérique et pas un enchaînement de calculs
      const saisieCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible,
          nombreDecimalSeulement: false,
        },
      )

      if (saisieCalculeeParsed.isSame(reponseParsed))
        feedback = 'Résultat incorrect car une valeur numérique est attendue.' // Sous-entendu : Et pas une opération
      else feedback = 'Résultat incorrect.'
    } else if (
      additionSeulementEtNonResultat ||
      soustractionSeulementEtNonResultat ||
      multiplicationSeulementEtNonResultat ||
      divisionSeulementEtNonResultat
    ) {
      // On veut un enchaînement de calculs et pas un résultat numérique
      const saisieCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible,
          nombreDecimalSeulement,
        },
      )
      const reponseCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible,
        },
      )
      if (saisieCalculeeParsed.isSame(reponseCalculeeParsed)) {
        if (saisieParsed.operator === 'Number') {
          feedback = 'Résultat incorrect car un calcul est attendu.' // Sous-entendu : Et pas une valeur numérique
        } else {
          feedback = 'Résultat incorrect car '
          feedback += additionSeulementEtNonResultat
            ? "c'est une somme qui est attendue."
            : soustractionSeulementEtNonResultat
              ? "c'est une différence qui est attendue."
              : multiplicationSeulementEtNonResultat
                ? "c'est un produit qui est attendu."
                : divisionSeulementEtNonResultat
                  ? "c'est un quotient qui est attendu."
                  : "ce n'est pas ce calcul qui est attendu." // Sous-entendu : La bonne opération */
        }
      } else feedback = 'Résultat incorrect.'
    } else if (fractionIrreductible) {
      // On veut une fraction irréductible
      const saisieCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible: false,
        },
      )
      const reponseCalculeeParsed = customCanonical(
        engine.parse(localInput, { canonical: false }),
        {
          expressionsForcementReduites,
          fractionIrreductible: false,
        },
      )
      if (saisieCalculeeParsed.isSame(reponseCalculeeParsed)) {
        // Ci-dessous, ce n'est pas saisieParsed car saisieParsed n'est jamais un nombre à cause de customCanonical et fractionIrreductible.
        if (
          engine.parse(localInput, { canonical: false }).operator === 'Number'
        )
          feedback = 'Résultat incorrect car une fraction est attendue.' // Sous-entendu : Et pas une valeur numérique
        else
          feedback =
            'Résultat incorrect car une fraction irréductible est attendue.' // Sous-entendu : La bonne opération
      } else feedback = 'Résultat incorrect.'
    } else if (
      // Code JCL. ---> EE : Ce code renvoie un feebback incorrect si input = (-5)^n \\times (-8) et goodAnswer = -8 \\times (-5)^n. Dommage ! Je laisse ce code car s'il est là, c'est qu'il doit être utile à un moment. Pas encore compris lequel.
      !saisieParsed.isSame(reponseParsed) &&
      evaluateExpression(localGoodAnswer, substitutions) ===
        evaluateExpression(localInput, substitutions)
    ) {
      feedback = 'Incorrect'
      /* Ce feedback ne devrait fonctionner que si on a des expressions littérales mais actuellement, ce n'est pas le cas donc on l'enlève provisoirement
      // Ajout d'un test sur goodAnswer pour vérifier la présence de lettres (après avoir retiré les div, times, frac...)
  const adjectif =
    localGoodAnswer
      .replaceAll('div', '')
      .replaceAll('times', '')
      .replaceAll('frac', '')
      .replaceAll('log', '')
      .replaceAll('ln', '')
      .replaceAll('sin', '')
      .replaceAll('cos', '')
      .replaceAll('tan', '')
      .match(/[a-z]/) == null
      ? 'numérique'
      : 'littérale'
feedback = expressionsForcementReduites
        ? `L'expression ${adjectif} attendue devrait être développée et réduite or ce n'est pas le cas.`
        : `L'expression ${adjectif} attendue devrait être simplement développée or ce n'est pas le cas.`
      */
    }
  }
  return { isOk: saisieParsed.isSame(reponseParsed), feedback }
}

/**
 * Fonction pour évaluer une expression avec des substitutions dynamiques (quelle que soit la lettre utilisée dans substitutions)
 * @param {string} input
 * @param {string} goodAnswer
 * @author Eric Elter
 * @return {boolean}
 */

export function ontDeveloppementsEgaux(
  input: string,
  goodAnswer: string,
): ResultType {
  const clean = generateCleaner([
    'puissances',
    'virgules',
    'parentheses',
    'foisUn',
  ])
  const localInput = clean(input)
  const localGoodAnswer = clean(goodAnswer)
  const expr1 = engine.parse(localInput, { canonical: true })
  const expr2 = engine.parse(localGoodAnswer, { canonical: true })

  if (!expr1.ops || !expr2.ops)
    return { isOk: false, feedback: "Cette expression n'est pas développée." }
  if (expr1.operator !== expr2.operator)
    return { isOk: false, feedback: "Cette expression n'est pas développée." }

  // On va tenter de réduire expr1
  let expr1Reduite = engine.parse('0')
  for (const item1 of expr1.ops) {
    expr1Reduite = expr1Reduite.add(item1)
  }

  // On va tenter de réduire expr2
  let expr2Reduite = engine.parse('0')
  for (const item2 of expr2.ops) {
    expr2Reduite = expr2Reduite.add(item2)
  }

  return {
    isOk: expr1Reduite.isSame(expr2Reduite),
    feedback: expr1Reduite.isSame(expr2Reduite)
      ? ''
      : expr1Reduite.isEqual(expr2Reduite)
        ? "Cette expression n'est pas assez développée."
        : 'Incorrect',
  }
}

/**
 * Fonction pour évaluer une expression avec des substitutions dynamiques (quelle que soit la lettre utilisée dans substitutions)
 * @param {BoxedExpression} expr
 * @param {Substitutions} substitutions
 * @example evaluateExpression('3x+5', { x: 2}) -> 11
 * @example evaluateExpression('3x+5', { y: 2}) -> NAN
 * @example evaluateExpression('3x+5', { c: 2, x: 2, y: 2}) -> 5
 * @author Eric Elter
 * @return {integer||string}
 */
function evaluateExpression(
  expr: string,
  substitutions: Substitutions,
): number | string {
  // Définir l'expression
  const expression = engine.parse(expr)

  // Faire les substitutions
  let substituted = expression
  for (const [variable, value] of Object.entries(substitutions)) {
    substituted = substituted.subs({ [variable]: value })
  }

  // Évaluer l'expression substituée
  const result = substituted.evaluate().value

  // Convertir le résultat en nombre ou 'NAN' si ce n'est pas un nombre
  if (typeof result === 'number') {
    return result
  }
  return 'NAN'
}
/**
 * comparaison d'expressions developpées NON REDUITES
 * @param {string} input
 * @param {string} goodAnswer
 * @author Eric Elter
 * @return ResultType
 */
export function expressionDeveloppeeEtNonReduiteCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  return expressionDeveloppeeEtReduiteCompare(input, goodAnswer, {
    expressionsForcementReduites: false,
  })
}

/**
 * Vérifie si une chaîne est en notation scientifique LaTeX valide.
 * Gère les formes "a\\times10^{b}" et "10^{b}\\timesa".
 * Retourne un objet avec isOk et feedback.
 * @author Eric Elter
 */
/**
 * Vérifie si une chaîne est en notation scientifique LaTeX valide.
 * Gère les formes "a\\times10^b" et "10^b\\timesa" avec ou sans accolades.
 * Retourne un objet avec isOk et feedback.
 * @author Eric Elter
 */
function isScientific(str: string): { isOk: boolean; feedback: string } {
  // Regex 1 : a\times10^b ou a\times10^{b}
  const regex1 = /^(-?\d+(?:\.\d+)?)\\times10\^{?(-?\d+)}?$/
  // Regex 2 : 10^b\timesa ou 10^{b}\timesa
  const regex2 = /^10\^{?(-?\d+)}?\\times(-?\d+(?:\.\d+)?)$/

  let base: number | null = null
  let exponent: number | null = null

  if (regex1.test(str)) {
    const match = str.match(regex1)!
    base = Number(match[1])
    exponent = Number(match[2])
  } else if (regex2.test(str)) {
    const match = str.match(regex2)!
    exponent = Number(match[1])
    base = Number(match[2])
  } else {
    return {
      isOk: false,
      feedback: 'Format incorrect : utilisez a\\times10^b ou 10^b\\timesa.',
    }
  }

  if (isNaN(base) || isNaN(exponent)) {
    return {
      isOk: false,
      feedback: "La mantisse ou l'exposant n'est pas un nombre valide.",
    }
  }

  if (Math.abs(base) < 1) {
    return { isOk: false, feedback: 'La mantisse doit être ≥ 1.' }
  }

  if (Math.abs(base) >= 10) {
    return { isOk: false, feedback: 'La mantisse doit être < 10.' }
  }

  return { isOk: true, feedback: 'La notation est correcte.' }
}

/**
 * Comparaison de nombres en notation scientifique
 * @param {string} input
 * @param {string} goodAnswer
 * @return ResultType
 * @author Eric Elter
 */
function scientifiqueCompare(input: string, goodAnswer: string): ResultType {
  const clean = generateCleaner([
    'virgules',
    'espaces',
    'parentheses',
    'puissances',
  ])
  const saisieClean = clean(input)
  const reponseClean = clean(goodAnswer)

  let saisieCleanFormattee = saisieClean
    .replace(/\s+/g, '') // Supprimer tous les espaces
    .replace(/\\times/g, '\\cdot') // Remplacer \times par \cdot
    .replace(/\^(\d+)/g, '^{$1}') // Ajouter des accolades autour des exposants
    .replace(/\{\+(\d+)\}/g, '{$1}') // Remplacer {+a} par {a}

  // Si la puissance est 0, on accepte mais computeEngine ne met pas en notation scientitique et donc la comparaison entre notation scientifique n'est pas possible.
  // Donc il faut ces trois lignes pour comparer les nombres décimaux, dans ce cas précis.
  const match = saisieCleanFormattee.match(/\^{(-?\d+)}$/) // Recherche des nombres entre accolades
  const puissance = match ? number(match[match.length - 1]) : null
  if (puissance === 0)
    saisieCleanFormattee = engine
      .parse(saisieClean)
      .toLatex({ notation: 'scientific', avoidExponentsInRange: [0, 0] })

  // Ce code ci-dessous sera à supprimer après correction de l'issue 223 de computeEngine 0.27.0
  const regex = /(?:\{(-?\d+(?:\.\d+)?)\}|(-?\d+(?:\.\d+)?))\\cdot(.+)/ // Expression régulière pour capturer le nombre avant et ce qui suit \cdot
  const decoupageSaisie = saisieCleanFormattee.match(regex)

  let mantisseSaisie: string | null = null
  if (decoupageSaisie) {
    mantisseSaisie = decoupageSaisie[1] || decoupageSaisie[2] || null
    if (mantisseSaisie === '1' && decoupageSaisie[3])
      saisieCleanFormattee = decoupageSaisie[3].trim()
  }
  // Ce code ci-dessus sera à supprimer après correction de l'issue 223 de computeEngine 0.27.0

  const reponseCleanFormattee = engine
    .parse(reponseClean)
    .toLatex({ notation: 'scientific', avoidExponentsInRange: [0, 0] })

  saisieCleanFormattee = saisieCleanFormattee.replace(
    /(\d+\.?\d*?)0*(?=\\cdot)/,
    '$1',
  ) // Pour corriger 9.040\\cdot10^{4} en 9.04\\cdot10^{4}

  if (saisieCleanFormattee === reponseCleanFormattee) return { isOk: true }
  if (engine.parse(saisieClean).isEqual(engine.parse(reponseClean)))
    return {
      isOk: false,
      feedback:
        "La réponse fournie est bien égale à celle attendue mais la réponse fournie n'est pas en notation scientifique.",
    }
  if (isScientific(saisieClean).isOk)
    return {
      isOk: false,
      feedback:
        "La réponse fournie est bien en notation scientifique mais la réponse fournie n'est pas égale à celle attendue.",
    }
  return {
    isOk: false,
    feedback: "La réponse fournie n'est pas égale à celle attendue.",
  }
}

/**
 * comparaison de textes... ben parce qu'il en faut une
 * @param {string} input
 * @param {string} goodAnswer
 * @author Jean-Claude Lhote
 * @return ResultType
 */
function texteAvecCasseCompare(input: string, goodAnswer: string): ResultType {
  const cleaner = generateCleaner([
    'parentheses',
    'mathrm',
    'fractions',
    'virgules',
  ])

  // Ligne ci-dessous utile si la réponse est (B,F) comme dans 2S30-5
  input = input.replace(
    /\\lparen\s*([^{}]+)\s*\{,\}\s*([^{}]+)\s*\\rparen/g,
    '($1,$2)',
  )

  // Ligne ci-dessous utile si la réponse est P(A\cap B) comme dans 1P10-1
  input = input.replace(/\\lparen\s*/g, '(').replace(/\\rparen/g, ')')

  goodAnswer = goodAnswer.replace(/\\lparen\s*/g, '(').replace(/\\rparen/g, ')')

  let localInput = cleaner(input)
  const localGoodAnswer = cleaner(goodAnswer)
  const clean = generateCleaner(['espaceNormal', 'doubleEspaces'])
  localInput = clean(localInput)

  // Cette commande ci-dessous est mauvaise Je la laisse pour expliquer pourquoi elle est mauvaise.
  // Autant, elle serait utile pour comparer 'aucun' et 'Aucun'
  // mais elle ne le serait plus pour comparer [AB] et [ab] ce qui serait dommage.
  // return { isOk: input.toLowerCase() === goodAnswer.toLowerCase() }
  return { isOk: localGoodAnswer === localInput }
}

/**
 * comparaison de textes avec espaces comme son nom l'indique : avec un nettoyage adapté à la situation
 * Utilise String.localeCompare() pour les spécificités du langage local utilisé.
 * @param {string} input
 * @param {string} goodAnswer
 * @return ResultType
 * @author Jean-Claude Lhote
 */
export function textWithSpacesCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  const clean = generateCleaner([
    'virgules',
    'parentheses',
    'latex',
    'doubleEspaces',
  ])
  const localGoodAnswer = clean(goodAnswer)
  const localInput = clean(input)
  const result = localInput.localeCompare(localGoodAnswer)
  return { isOk: result === 0 }
}
/* Cette fonction n'a pas lieu d'exister car elle ne fait pas ce pour quoi elle est prévue.
Une autre fonction fait ce qu'il faut en dessous.
/**
 * comparaison de textes sans s'occuper de la casse.
 * @param {string} input
 * @param {string} goodAnswer
 * @author Jean-Claude Lhote
 * @return ResultType

////////////  -> Mettre etoile /
export function upperCaseCompare (input: string, goodAnswer: string): ResultType {

  // @ToDo supprimer toutes les traces de LaTeX (gestion du - typographique...)
  input = input.replaceAll('\\lparen', '(').replaceAll('\\rparen', ')')
  return { isOk: input.toUpperCase() === goodAnswer.toUpperCase() }
}
*/

/**
 * comparaison de textes sans s'occuper de la casse.
 * @param {string} input
 * @param {string} goodAnswer
 * @author Eric Elter
 * @return ResultType
 */
export function texteSansCasseCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  const localInput = input.toLowerCase()
  const localGoodAnswer = goodAnswer.toLowerCase()
  return texteAvecCasseCompare(localInput, localGoodAnswer)
}

export function expressionNumeriqueCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  const cleaner = generateCleaner(['fractions'])
  const localGoodAnswer = cleaner(goodAnswer)
  const goodAnswerParsed = engine.parse(localGoodAnswer, { canonical: true }) // Important ce canonical à true
  const inputParsed = engine.parse(input, { canonical: true })
  // console.log(input, localGoodAnswer, goodAnswerParsed.json)
  if (goodAnswerParsed.isSame(inputParsed)) return { isOk: true }
  if (goodAnswerParsed.isEqual(inputParsed))
    if (inputParsed.isNumber) {
      return {
        isOk: false,
        feedback:
          'Ce résultat pourrait être correct mais un calcul est attendu.',
      }
    } else
      return {
        isOk: false,
        feedback:
          "Ce résultat pourrait être correct mais ce n'est pas ce calcul qui est attendu.",
      }
  return {
    isOk: false,
    feedback:
      "Ce résultat pourrait être correct mais ce n'est pas ce calcul qui est attendu.",
  }
}

/**
 * comparaison de fraction simplifiée
 * @param {string} input
 * @param {string} goodAnswer
 * @return ResultType
 * @author Jean-Claude Lhote
 */
export function simplerFractionCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  const cleaner = generateCleaner(['fractions', 'espaces'])
  const localGoodAnswer = cleaner(goodAnswer)
  const goodAnswerParsed = engine.parse(localGoodAnswer, { canonical: false })
  const inputParsed = engine.parse(input, { canonical: false })
  if (
    inputParsed.operator === 'Divide' &&
    goodAnswerParsed.operator === 'Divide'
  ) {
    const num = (inputParsed.json as [string, number, number])[1] as number
    const numGoodAnswer = (
      goodAnswerParsed.json as [string, number, number]
    )[1] as number
    if (numGoodAnswer == null) {
      throw Error(
        `problème avec ${localGoodAnswer} dans simplerFractionCompare : fReponse.op1.numericValue est nul`,
      )
    }
    if (
      inputParsed.isEqual(goodAnswerParsed) &&
      num &&
      num < numGoodAnswer &&
      Number.isInteger(num)
    ) {
      return { isOk: true }
    }
  }
  return { isOk: false }
}

/**
 * Comparaison de fraction en acceptant toute valeur (y compris la valeur décimale) mais n'acceptant de racine carrée au dénominateur
 * @param {string} input
 * @param {string} goodAnswer
 * @author Eric Elter
 * @return ResultType
 */
export function equalFractionCompareSansRadical(
  input: string,
  goodAnswer: string,
): ResultType {
  const cleaner = generateCleaner(['fractions'])
  const localInput = cleaner(input)
  const localGoodAnswer = cleaner(goodAnswer)

  // Utilisation d'une expression régulière pour extraire le contenu de la deuxième accolade
  const contenuDeuxiemeAccolade: string | null =
    localInput.match(/\\frac{[^}]*}{(\\sqrt[^}]*)/)?.[1] || null

  // if (contenuDeuxiemeAccolade === null) return { isOk: equalFractionCompare(input, goodAnswer).isOk }
  // else if (!contenuDeuxiemeAccolade.includes('sqrt')) return { isOk: equalFractionCompare(input, goodAnswer).isOk }
  if (contenuDeuxiemeAccolade === null) {
    return { isOk: fonctionComparaison(localInput, localGoodAnswer).isOk }
  }
  if (!contenuDeuxiemeAccolade.includes('sqrt')) {
    return { isOk: fonctionComparaison(localInput, localGoodAnswer).isOk }
  }
  return { isOk: false }
}

/**
 * Comparaison de puissances
 * @param {string} input
 * @param {string} goodAnswer
 * @param {Object} [options={}] - Options pour la comparaison.
 * @param {boolean} [options.seulementCertainesPuissances=false] - Si false, toutes les formes de puissances seront acceptées.
 * @param {boolean} [options.sansExposantUn=false] - Si false, l'exposant 1 sera accepté comme valide.
 * @return ResultType
 * @author Eric Elter
 */
function comparaisonPuissances(
  input: string,
  goodAnswer: string,
  { seulementCertainesPuissances = false, sansExposantUn = false } = {},
): ResultType {
  const clean = generateCleaner(['virgules', 'puissances'])
  const nombreSaisi = clean(input).split('^')
  const goodAnswerSplit = clean(goodAnswer).split('^')

  // input n'est pas une puissance (mais cas possiblement correct si exposant de goodAnswer est 1 ou 0)
  if (nombreSaisi.length === 1) {
    const exposantGoodAnswer = isNaN(
      Number(goodAnswerSplit[1].replace(/[{}]/g, '')),
    )
      ? 1
      : goodAnswerSplit[1].replace(/[{}]/g, '')
    if (
      (Number(exposantGoodAnswer) === 1 || Number(exposantGoodAnswer) === 0) &&
      engine.parse(clean(input)).isEqual(engine.parse(clean(goodAnswer)))
    )
      return { isOk: true }
    return { isOk: false, feedback: 'Une puissance est attendue.' }
  }
  // input n'est pas une puissance de puissance
  if (seulementCertainesPuissances && nombreSaisi.length > 2)
    return { isOk: false, feedback: 'Un seul exposant est attendu.' }

  let mantisseSaisie = nombreSaisi[0]
  mantisseSaisie = mantisseSaisie.replace(/\\lparen|\\rparen|\(|\)/g, '') // Pour enlever les parenthèses afin que (-4)^2 soit acceptée
  mantisseSaisie = mantisseSaisie.replace(/--/g, '') // Pour accepter les deux - consécutifs.

  // La mantisse saisie est-elle un nombre ?
  if (Number.isNaN(mantisseSaisie))
    return {
      isOk: false,
      feedback: "Avant l'exposant, on attend un nombre unique.",
    } // Pour éviter 1\times4^2

  let exposantSaisi = nombreSaisi[1]
  exposantSaisi = exposantSaisi.replace(/\\lparen|\\rparen|\(|\)/g, '') // Pour enlever les parenthèses
  exposantSaisi = exposantSaisi.replace(/--/g, '') // Pour accepter les deux - consécutifs.
  exposantSaisi = exposantSaisi.replace(/[{}]/g, '') // Pour enlever les accolades (possible si exposant décimal ou négatif)
  const exposantSaisiNumber = Number(exposantSaisi)
  // L'exposnat saisi est-il un nombre ?
  if (Number.isNaN(exposantSaisiNumber))
    return {
      isOk: false,
      feedback: 'On attend un nombre unique comme exposant.',
    } // Pour éviter 4^{1+1}

  // goodAnswer n'est pas une puissance donc toute puissance égale à goodAnswer est correcte (modulo sansExposantUn)
  if (goodAnswerSplit.length === 1) {
    if (sansExposantUn && exposantSaisiNumber === 1)
      return { isOk: false, feedback: 'On attend un exposant différent de 1.' }
    const isOk = engine
      .parse(clean(input))
      .isEqual(engine.parse(clean(goodAnswer)))
    return {
      isOk: !!isOk,
      feedback: isOk ? '' : "La puissance n'est pas égale au résultat attendu.",
    }
  }

  // goodAnswer et input sont des puissances alors deux cas se présentent.
  if (sansExposantUn) {
    // On accepte un input avec un exposant de 1 que si goodAnswer en a un aussi.
    let exposantGoodAnswer = goodAnswerSplit[1]
    exposantGoodAnswer = exposantGoodAnswer.replace(
      /\\lparen|\\rparen|\(|\)/g,
      '',
    ) // Pour enlever les parenthèses
    exposantGoodAnswer = exposantGoodAnswer.replace(/--/g, '') // Pour accepter les deux - consécutifs.
    const exposantGoodAnswerNumber = Number(exposantGoodAnswer)
    if (exposantSaisiNumber === 1) {
      if (exposantGoodAnswerNumber !== 1)
        return {
          isOk: false,
          feedback: 'On attend un exposant différent de 1.',
        } // Très important car parfois, par le calcul, on attend 4^1
    }
  }
  // Ou bien on n'accepte que si goodAnswer et input sont parfaitement identiques : seulementCertainesPuissances = true
  // Ou bien on n'accepte toute égalité entre goodAnswer et input : seulementCertainesPuissances = false
  const isOk = !seulementCertainesPuissances
    ? engine.parse(clean(input)).isEqual(engine.parse(clean(goodAnswer)))
    : engine.parse(clean(input)).isSame(engine.parse(clean(goodAnswer)))
  if (!isOk) {
    if (engine.parse(clean(input)).isEqual(engine.parse(clean(goodAnswer))))
      return {
        isOk: false,
        feedback:
          "La puissance est égale au résultat attendu mais ne correspond pas à l'énoncé.",
      }
    return {
      isOk: false,
      feedback: "La puissance n'est pas égale au résultat attendu.",
    }
  }
  return { isOk: true }
}

/**
 * Comparaison d'ensembles de solutions séparés par des ; dans des {} comme {-5;4;10}
 * Si kUplet = true, alors les nombres de l'usager devront être rangés par ordre croissant. Sinon non importance de l'ordre des nombres
 * Mise en place de feedback
 * @param {string} input
 * @param {string} goodAnswer
 * @return ResultType
 * @author Eric Elter
 */
export function ensembleNombres(
  input: string,
  goodAnswer: string,
  { kUplet = false, avecAccolades = true } = {},
): ResultType {
  const clean = generateCleaner([
    'virgules',
    'fractions',
    'parentheses',
    'espaces',
    'espaceNormal',
    'doubleEspaces',
  ])
  const cleanInput = clean(input)
    .replaceAll('∅', '\\emptyset')
    .replaceAll('\\lbrace', '\\{')
    .replaceAll('\\rbrace', '\\}')
  goodAnswer = clean(goodAnswer)

  if (goodAnswer === '\\emptyset' && cleanInput === goodAnswer)
    return { isOk: true }
  if (goodAnswer === '\\emptyset' && cleanInput.includes('\\emptyset'))
    return {
      isOk: false,
      feedback: 'Résultat incorrect car $\\emptyset doit être écrit seul.',
    }
  let splitInput: string[]
  let splitGoodAnswer: string[]
  if (avecAccolades) {
    if (cleanInput[1] !== '{')
      return {
        isOk: false,
        feedback:
          "Résultat incorrect car cet ensemble doit commencer par une accolade ou bien être l'ensemble vide.",
      }
    if (cleanInput[cleanInput.length - 1] !== '}')
      return {
        isOk: false,
        feedback:
          "Résultat incorrect car cet ensemble doit se terminer par une accolade ou bien être l'ensemble vide.",
      }
    splitInput = cleanInput
      .replaceAll('\\{', '')
      .replaceAll('\\}', '')
      .split(';')
    splitGoodAnswer = clean(goodAnswer)
      .replaceAll('\\{', '')
      .replaceAll('\\}', '')
      .split(';')
  } else {
    if (cleanInput.endsWith(';'))
      return {
        isOk: false,
        feedback:
          'Une suite de nombres ne doit pas se terminer par un point-virgule.',
      }

    if (!/^-?\d+(?:\.\d+)?(?:;-?\d+(?:\.\d+)?)*$/.test(cleanInput))
      // Pour vérifier que le séparateur est bien un point-virgule.
      return {
        isOk: false,
        feedback: 'Les nombres doivent tous être séparés par un point-virgule.',
      }
    splitInput = cleanInput.split(';')
    splitGoodAnswer = clean(goodAnswer).split(';')
  }

  // Pour vérifier la présence de doublons
  if (new Set(splitInput).size !== splitInput.length)
    return {
      isOk: false,
      feedback:
        'Résultat incorrect car cet ensemble contient des valeurs redondantes.',
    }

  // Pour vérifier si les tableaux sont de la même taille
  if (splitInput.length > splitGoodAnswer.length) {
    return {
      isOk: false,
      feedback: 'Résultat incorrect car cet ensemble contient trop de nombres.',
    }
  }
  if (splitInput.length < splitGoodAnswer.length) {
    return {
      isOk: false,
      feedback:
        'Résultat incorrect car cet ensemble ne contient pas assez de nombres (les nombres doivent être séparés par un ; et non par une virgule).',
    }
  }

  const inputSorted = splitInput
  const goodAnswerSorted = splitGoodAnswer

  const AllExist = inputSorted.every((value) => {
    for (let index = 0; index < goodAnswerSorted.length; index++) {
      if (engine.parse(value).isEqual(engine.parse(goodAnswerSorted[index]))) {
        // Laisser isEqual car avec certaines fractions, on a des misères
        return true // L'élément est trouvé
      }
    }
    return false // L'élément n'est pas trouvé
  })

  if (!AllExist) {
    if (splitGoodAnswer.length === 1)
      return {
        isOk: false,
        feedback:
          "Résultat incorrect car cet ensemble n'a pas la valeur attendue.",
      }
    else
      return {
        isOk: false,
        feedback:
          "Résultat incorrect car cet ensemble n'a pas toutes les valeurs attendues.",
      }
  }
  if (
    kUplet &&
    !splitInput.every((value, index) =>
      engine.parse(value).isSame(engine.parse(goodAnswerSorted[index])),
    )
  ) {
    return {
      isOk: false,
      feedback:
        'Résultat incorrect car les nombres ne sont pas rangés dans le bon ordre.',
    }
  }
  return { isOk: true }
}

/**
 * La fonction de comparaison des intervalles pour l'interactif
 * @param {string} input
 * @param {string} goodAnswer
 * @author Jean-Claude Lhote
 */
function intervalsCompare(input: string, goodAnswer: string) {
  const clean = generateCleaner(['virgules', 'parentheses', 'espaces'])
  const replaceTable = [
    // Indispensable pour gérer les copier-coller
    ['∅', '\\emptyset'],
    ['∪', '\\cup'],
    ['⋃', '\\cup'],
    ['∩', '\\cap'],
    ['⋂', '\\cap'],
    ['ℕ', '\\mathbb{N}'],
    ['ℤ', '\\mathbb{Z}'],
    ['𝔻', '\\mathbb{D}'],
    ['ℚ', '\\mathbb{Q}'],
    ['ℝ', '\\mathbb{R}'],
    ['ℂ', '\\mathbb{C}'],
  ]
  const localInput = replaceTable.reduce((currentInput, replacement) => {
    return currentInput.replaceAll(replacement[0], replacement[1])
  }, clean(input))
  const localGoodAnswer = clean(goodAnswer)
  if (localGoodAnswer === '\\emptyset') {
    if (localInput === '\\emptyset' || localInput === '\\{\\}')
      return { isOk: true, feedback: '' }
    return {
      isOk: false,
      feedback: "la bonne réponse était l'ensemble vide : $\\emptyset$",
    }
  } else {
    const match = localGoodAnswer.match(/\\mathbb\{([A-Za-z])\}/)
    if (match && typeof match[1] === 'string') {
      if (localGoodAnswer === localInput) return { isOk: true, feedback: '' }
      else {
        const lettre = match[1]
        if (localInput === lettre)
          return {
            isOk: false,
            feedback: `La bonne réponse était $\\mathbb{${lettre}}$ et non ${lettre}.`,
          }
        else
          return {
            isOk: false,
            feedback: `La bonne réponse était cet ensemble : $\\mathbb{${lettre}}$.`,
          }
      }
    }
  }
  let isOk1 = true
  let isOk2 = true
  let feedback = ''
  const extractBornesAndOp = /[^[\];]+/g
  const extractCrochets = /[[\]]/g
  const borneAndOpSaisie = localInput.match(extractBornesAndOp)
  const borneAndOpReponse = localGoodAnswer.match(extractBornesAndOp)
  const crochetsSaisie = localInput.match(extractCrochets)
  const crochetsReponse = localGoodAnswer.match(extractCrochets)
  // console.log(localInput, localGoodAnswer, borneAndOpSaisie, borneAndOpReponse)
  if (
    borneAndOpSaisie != null &&
    borneAndOpReponse != null &&
    crochetsSaisie != null &&
    crochetsReponse != null
  ) {
    if (borneAndOpSaisie.length !== borneAndOpReponse.length) {
      return { isOk: false }
    }
    // On teste les bornes et les opérateurs
    let i: number
    isOk1 = true
    for (i = 0; i < borneAndOpSaisie.length; i++) {
      isOk1 &&= fonctionComparaison(
        borneAndOpSaisie[i],
        borneAndOpReponse[i],
      ).isOk
      if (!isOk1) {
        feedback += ['\\cup', '\\cap'].includes(borneAndOpSaisie[i])
          ? `Il y a une erreur avec l'opérateur : $${borneAndOpSaisie[i]}$.<br>`
          : `Il y a une erreur avec la valeur : $${borneAndOpSaisie[i]}$.<br>`
      }
    }
    // on teste maintenant les crochets
    isOk2 = crochetsSaisie.length === crochetsReponse.length
    if (!isOk2) {
      feedback += 'Il y a une erreur avec les crochets.'
    }
    if (isOk2) {
      for (i = 0; i < crochetsSaisie.length; i++) {
        isOk2 = crochetsSaisie[i] === crochetsReponse[i] && isOk2
        if (crochetsSaisie[i] !== crochetsReponse[i]) {
          feedback += `Le crochet placé en position ${i + 1} est mal orienté.<br>`
        }
      }
    }
    return { isOk: isOk1 && isOk2, feedback }
  }
  return {
    isOk: false,
    feedback: "Il faut donner un intervalle ou une réunion d'intervalles",
  }
}

/**
 * Comparaison de chaînes (principalement des noms de classes
 * @param {string} input ce que saisit l'élève
 * @param {{pluriels: boolean}} [options]
 * @param {{value: string, nombre:boolean}} goodAnswer value est ce qui est attendu, si nombre est true, on compte faux l'absence de s quand il en faut un et la présence de s quand il n'y en a pas besoin
 * si pluriels est false, on compte juste une réponse au pluriel ou au singulier quelque soit la réponse attendue, mais on met un feedback si le pluriel ou le singulier n'est pas respecté
 * @author Jean-Claude Lhote
 */
export function numerationCompare(
  input: string,
  goodAnswer: string,
  { pluriels = true } = {},
): ResultType {
  // normalement, il n'y a rien à nettoyer au niveau de l'input ou de goodAnswer
  const clean = generateCleaner(['latex'])
  const saisie: string[] = clean(input).toLowerCase().split(' ')
  const answer: string[] = goodAnswer.toLowerCase().split(' ')
  let result: boolean
  let feedback = ''
  if (pluriels) {
    result = true
    for (let i = 0; i < answer.length; i++) {
      result = result && saisie[i] === answer[i]
      if (!result) {
        if (saisie[i].endsWith('s') && !answer[i].endsWith('s')) {
          if (saisie[i].substring(0, saisie[i].length - 1) === answer[i]) {
            feedback = `${saisie[i]} est au pluriel alors qu'il faut le mettre au singulier.<br>`
          }
        } else if (!saisie[i].endsWith('s') && answer[i].endsWith('s')) {
          if (saisie[i] === answer[i].substring(0, answer[i].length - 1)) {
            feedback = `${saisie[i]} est au singulier alors qu'il faut le mettre au pluriel.<br>`
          }
        }
      }
      if (!result) break
    }
  } else {
    // ici on tolère singulier ou pluriel
    // On regarde quand même si le singulier/pluriel est respecté pour le feedback
    result = true
    for (let i = 0; i < answer.length; i++) {
      if (saisie[i].endsWith('s') && !answer[i].endsWith('s')) {
        if (saisie[i].substring(0, saisie[i].length - 1) === answer[i]) {
          feedback = `${saisie[i]} est au pluriel alors qu'il faut le mettre au singulier.<br>`
        }
      } else if (!saisie[i].endsWith('s') && answer[i].endsWith('s')) {
        if (saisie[i] === answer[i].substring(0, answer[i].length - 1)) {
          feedback = `${saisie[i]} est au singulier alors qu'il faut le mettre au pluriel.<br>`
        }
      }
      // on vire le 's' final éventuel
      if (saisie[i].endsWith('s')) {
        saisie[i] = saisie[i].substring(0, saisie[i].length - 1)
      }
      if (answer[i].endsWith('s')) {
        answer[i] = answer[i].substring(0, answer[i].length - 1)
      }
      result = result && saisie[i] === answer[i]
    }
    if (!result) feedback = '' // c'est pas bon, on se fout du feedback
  }
  return { isOk: result, feedback }
}

/**
 * comparaison de grandeurs avec une unité
 * @param {string} input
 * @param {string} goodAnswer
 * @param {{precision: number }} [options]
 * @return ResultType
 * @author Jean-Claude Lhote
 */
function unitsCompare(
  input: string,
  goodAnswer: string,
  { precision = 1 } = {},
): {
  isOk: boolean
  feedback?: string
} {
  const localInput = input.replace('^\\circ', '°').replace('\\degree', '°')
  const cleaner = generateCleaner([
    'virgules',
    'espaces',
    'fractions',
    'parentheses',
    'mathrm',
    'operatorName',
  ])
  const inputGrandeur = inputToGrandeur(cleaner(localInput))
  const goodAnswerGrandeur = Grandeur.fromString(
    cleaner(goodAnswer).replace('^\\circ', '°').replace('\\degree', '°'),
  )

  if (inputGrandeur) {
    if (
      inputGrandeur.uniteDeReference !== goodAnswerGrandeur.uniteDeReference
    ) {
      return {
        isOk: false,
        feedback: `Il faut donner la réponse en $${goodAnswerGrandeur.latexUnit}$.`,
      }
    }
    if (precision !== undefined) {
      const okPrecision1: boolean = inputGrandeur.estUneApproximation(
        goodAnswerGrandeur,
        precision,
      )
      const okPrecision2: boolean = goodAnswerGrandeur.estUneApproximation(
        inputGrandeur,
        precision / 10,
      )
      if (okPrecision1 && okPrecision2) {
        return { isOk: true }
      } else {
        if (okPrecision1) {
          return {
            isOk: false,
            feedback: `La réponse n'est pas arrondie à $${texNombre(10 ** -precision, precision)}$ près.`,
          }
        }
      }
      return { isOk: false }
    }
    if (inputGrandeur.estEgal(goodAnswerGrandeur)) {
      return { isOk: true }
    }
    return { isOk: false }
  }
  // Oubli de l'unité ?
  const inputNumber = Number(engine.parse(cleaner(input)))
  const inputWithAddedUnit = new Grandeur(inputNumber, goodAnswerGrandeur.unite)
  if (inputWithAddedUnit.estEgal(goodAnswerGrandeur)) {
    return {
      isOk: false,
      feedback: "La réponse est correcte mais l'unité n'a pas été précisée.",
    }
  }
  if (inputNumber !== 0) {
    return {
      isOk: false,
      feedback: "La réponse est fausse et il faut saisir l'unité.",
    }
  }
  return { isOk: false }
}

/**
 * vérifie qu'une valeur saisie est dans un intervalle strict
 * @param {string} input
 * @param {string} goodAnswer Un intervalle par exemple ]-5.5;2]
 * @return ResultType
 * @author Jean-Claude Lhote
 */
function intervalCompare(
  input: string,
  goodAnswer: string,
): {
  isOk: boolean
  feedback?: string
} {
  let strictGauche = true
  let strictDroit = true
  if (goodAnswer.startsWith('[')) strictGauche = false
  if (goodAnswer.endsWith(']')) strictDroit = false
  const bornes = goodAnswer.match(/[[\]](.+);(.+)[[\]]/)
  if (bornes == null) {
    window.notify("Il faut revoir la définition de l'intervalle ", {
      goodAnswer,
    })
    return { isOk: false, feedback: 'Un problème avec goodAnswer !' }
  }
  const clean = generateCleaner(['virgules', 'fractions', 'espaces'])
  const borneInf = Number(engine.parse(clean(bornes[1])).N())
  const borneSup = Number(engine.parse(clean(bornes[2])).N())
  const inputNumber = Number(engine.parse(clean(input)).N())
  // @todo vérifier que l'élève a bien saisi un nombre
  if (Number.isNaN(inputNumber)) return { isOk: false }
  const okGauche = strictGauche
    ? inputNumber > borneInf
    : inputNumber >= borneInf
  const okDroit = strictDroit ? inputNumber < borneSup : inputNumber <= borneSup
  return { isOk: okGauche && okDroit }
}

/**
 * comparaison de nombres entiers consécutifs
 * Cette fonction sert essentiellement pour le feedback dans des exercices de comparaison car elle prend pour l'instant un encadrement sous la forme a<b<c ou a>b>c
 * Exercices d'exemple : 6N20-1 et 6N20-3
 * Peut-être en faire une variation pour vérifier des inégalités ?
 * @param {string} input
 * @param {string} goodAnswer
 * @author Jean-Claude Lhote
 * @return ResultType
 */
export function consecutiveCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  let feedback = ''
  const [entierInf, valeurInter, entierSup] = input.includes('<')
    ? input.split('<').map((el) => Number(engine.parse(el).numericValue))
    : input
        .split('>')
        .map((el) => Number(engine.parse(el).numericValue))
        .sort((a: number, b: number) => a - b)
  if (
    !(
      Number.isInteger(Number(entierSup)) && Number.isInteger(Number(entierInf))
    )
  ) {
    feedback = 'On attend comme réponse deux nombres entiers.'
    return { isOk: false, feedback }
  }
  const [goodAnswerEntierInf, , goodAnswerEntierSup] = goodAnswer.includes('<')
    ? goodAnswer.split('<').map((el) => Number(engine.parse(el).numericValue))
    : goodAnswer
        .split('>')
        .map((el) => Number(engine.parse(el).numericValue))
        .sort((a: number, b: number) => a - b)
  const diff = Number(
    engine.box(['Subtract', String(entierSup), String(entierInf)]).N()
      .numericValue,
  )
  if (diff === -1) {
    feedback =
      "Les nombres sont bien deux entiers consécutifs, mais ils sont donnés dans l'ordre inverse."
    return { isOk: false, feedback }
  }
  if (diff !== 1) {
    return {
      isOk: false,
      feedback: 'Les deux nombres entiers donnés ne sont pas consécutifs.',
    }
  }
  if (valeurInter != null) {
    const diff1 = Number(
      engine.box(['Subtract', String(entierSup), String(valeurInter)]).N()
        .numericValue,
    )
    const diff2 = Number(
      engine.box(['Subtract', String(valeurInter), String(entierInf)]).N()
        .numericValue,
    )
    if (
      !(
        diff1 != null &&
        diff2 != null &&
        diff1 < 1 &&
        diff1 >= 0 &&
        diff2 < 1 &&
        diff2 >= 0
      )
    ) {
      return {
        isOk: false,
        feedback: `Les deux nombres entiers sont biens consécutifs mais n'encadrent pas la valeur ${valeurInter}`,
      }
    }
  }
  const isOk1 = true
  const isOk2 =
    expressionDeveloppeeEtReduiteCompare(
      String(entierInf),
      String(goodAnswerEntierInf),
    ).isOk &&
    expressionDeveloppeeEtReduiteCompare(
      String(entierSup),
      String(goodAnswerEntierSup),
    ).isOk
  return { isOk: isOk1 && isOk2, feedback: '' }
}

/**
 * Compare deux nombres avec une certaine tolérance
 * Exercice exemple : 5N11-4
 * @param {string} input
 * @param { string} goodAnswer
 * @param {{tolerance: number}} [options]
 * @author Jean-Claude Lhote
 */
export function approximatelyCompare(
  input: string,
  goodAnswer: string,
  { tolerance = 0.1 } = {},
) {
  const cleaner = generateCleaner([
    'virgules',
    'fractions',
    'espaces',
    'parentheses',
    'puissances',
  ])
  const saisieClean = Number(engine.parse(cleaner(input)).numericValue)
  const answerClean = Number(engine.parse(cleaner(goodAnswer)).numericValue)
  return { isOk: Math.abs(saisieClean - answerClean) <= tolerance }
}

/**
 * Comparaison de fonction f(x)
 * @param {string} input
 * @param {{ variable: string, domaine: [number, number]}} [options]
 * @param {string} goodAnswer
 * @author Jean-Claude Lhote
 */
export function functionCompare(
  input: string,
  goodAnswer: string,
  { variable = 'x', domaine = [-100, 100], entier = false } = {},
): ResultType {
  const clean = generateCleaner([
    'virgules',
    'parentheses',
    'fractions',
    'divisions',
  ])
  const cleanInput = clean(input)
  const inputParsed = engine.parse(cleanInput)
  const inputFn = inputParsed.compile()
  const cleanAnswer = clean(goodAnswer)
  const goodAnswerFn = engine.parse(cleanAnswer).compile()
  const min = domaine[0]
  const max = domaine[1]
  const range = max - min
  const valAlea = () => min + range * Math.random()
  if (inputFn == null || goodAnswerFn == null) {
    throw Error(
      `functionCompare : La saisie ou la bonne réponse ne sont pas des fonctions (saisie : ${input} et réponse attendue : ${goodAnswer}`,
    )
  }
  let a: number
  let b: number
  let c: number
  let variablea: Record<string, number>
  let variableb: Record<string, number>
  let variablec: Record<string, number>
  let cpt = 0
  do {
    ;[a, b, c] = entier
      ? [valAlea(), valAlea(), valAlea()].map(Math.round)
      : [valAlea(), valAlea(), valAlea()]
    variablea = Object.fromEntries([[variable ?? 'x', a]])
    variableb = Object.fromEntries([[variable ?? 'x', b]])
    variablec = Object.fromEntries([[variable ?? 'x', c]])
    cpt++
  } while (
    cpt < 1000 &&
    (Number.isNaN(goodAnswerFn(variablea) as number) ||
      Number.isNaN(goodAnswerFn(variableb) as number) ||
      Number.isNaN(goodAnswerFn(variablec) as number))
  )
  if (cpt === 1000) {
    window.notify(
      "functionCompare n'a pas réussi à trouver 3 valeurs dans le domaine qui donnent une image par la fonction goodAnswer !",
      { fonction: goodAnswer, domaine },
    )
    return { isOk: false, feedback: 'erreur dans le programme' }
  }
  let isOk = true
  for (const x of [a, b, c]) {
    const vars = Object.fromEntries([[variable ?? 'x', x]])
    const y1 = Number(inputFn(vars))
    const y2 = Number(goodAnswerFn(vars))
    isOk = isOk && Math.abs(y1 - y2) < 1e-10
  }
  return { isOk }
}

/*
 * Comparaison de fonction f(x,y) (ou tout autre variable) x et y étant les lettres par défaut
 * @param {string} input
 * @param {string} goodAnswer
 * @param {{variables: string[]}} [options]
 * @author Jean-Claude Lhote
 *
export function functionXyCompare (input: string, goodAnswer: string, { variables = ['x', 'y'] } = { }): ResultType {
  const clean = generateCleaner(['espaces', 'virgules', 'parentheses', 'fractions', 'divisions'])
  // Pour l'instant les fonctions trigo saisies au clavier ne sont pas les fonction trigo latex.
  const cleanInput = clean(input)
  const inputParsed = engine.parse(cleanInput)

  const inputFn = inputParsed.compile()
  const cleanAnswer = clean(goodAnswer)
  const goodAnswerFn = engine.parse(cleanAnswer).compile()

  let isOk = true
  if (inputFn == null || goodAnswerFn == null) throw Error(`functionCompare : La saisie ou la bonne réponse ne sont pas des fonctions (saisie : ${input} et réponse attendue : ${goodAnswer}`)
  const [a, b, c] = [Math.random(), Math.random(), Math.random()]
  const [A, B, C] = [Math.random(), Math.random(), Math.random()]
  for (const x of [a, b, c]) {
    for (const y of [A, B, C]) {
      const vars = Object.fromEntries([[variables[0], x], [variables[1], y]])
      isOk = isOk && Math.abs(inputFn(vars) - goodAnswerFn(vars)) < 1e-10
    }
  }
  return { isOk }
} */

/*
 * Comparaison d'égalités (pour l'instant strictement égal, il est prévu d'implémenter l'équivalence d'égalités)
 * @param {string} input
 * @param {string} goodAnswer
 * @param {{membre1Variable?: string, membre2Variable?: string, strict?: boolean, domaine: [number, number]}} [options]
 * @author Jean-Claude Lhote
 *
export function equalityCompare (input: string, goodAnswer: string, { membre1Variable = 'x', membre2Variable = 'x', strict = true, domaine = [-100, 100] } = {}):ResultType {
  const [m1, m2] = input.split('=')
  const [goodAnswerMb1, goodAnswerMb2] = goodAnswer.split('=')
  if (m1 == null || m2 == null) return { isOk: false, feedback: 'Une égalité est attendue' }
  if (strict) {
    const { isOk: isOk1 } = functionCompare(m1, goodAnswerMb1, { variable: membre1Variable ?? 'x', domaine })
    const { isOk: isOk2 } = functionCompare(m2, goodAnswerMb2, { variable: membre2Variable ?? 'x', domaine })
    return { isOk: isOk1 && isOk2 }
  } else {
    // @todo à implémenter : permettre de saisir une égalité et de vérifier l'équivalence avec celle proposée comme bonne réponse.
    // En attendant, je recopie le code de strict = true
    const { isOk: isOk1 } = functionCompare(m1, goodAnswerMb1, { variable: membre1Variable ?? 'x', domaine })
    const { isOk: isOk2 } = functionCompare(m2, goodAnswerMb2, { variable: membre2Variable ?? 'x', domaine })
    return {
      isOk: isOk1 && isOk2,
      feedback: ''
    }
  }
} */

/**
 * Comparaison d'égalités (pour les équations de droites ou d'autres égalités comme dans can2L11 ou can1a-2024-Q14)
 * @param {string} input
 * @param {string} goodAnswer
 * @author Eric Elter
 */
export function egaliteCompare(input: string, goodAnswer: string): ResultType {
  const [m1, m2] = input.split('=')
  const [goodAnswerMb1, goodAnswerMb2] = goodAnswer.split('=')
  if (m1 == null || m2 == null) {
    return { isOk: false, feedback: 'Une égalité est attendue' }
  }

  const { isOk: isOk1 } = fonctionComparaison(m2, goodAnswerMb1)
  const { isOk: isOk2 } = fonctionComparaison(m1, goodAnswerMb1)
  const { isOk: isOk3 } = fonctionComparaison(m2, goodAnswerMb2)
  const { isOk: isOk4 } = fonctionComparaison(m1, goodAnswerMb2)
  return { isOk: (isOk1 && isOk4) || (isOk3 && isOk2) }
}

/**
 * Format des nombres avec les espaces adéquats
 * @param {string} nombre // Un nombre sans espace sous forme d'une chaîne de caractères
 * @author Eric Elter (aide par ChatGPT)
 * @example formatNumberWithSpaces('1234567') renvoie '1 234 567'
 * @example formatNumberWithSpaces('1239,4567') renvoie '1 239,456 7'
 * @returns {string}
 */
function formatNumberWithSpaces(nombre: string): string {
  return nombre.replace(/\b\d+(?:[.,]\d+)?\b/g, (match) => {
    // Détection du séparateur utilisé
    const separator = match.includes(',') ? ',' : '.'

    // Séparer la partie entière et la partie décimale
    const [entier, decimal] = match.split(separator)

    // Formater la partie entière : espace tous les 3 chiffres de gauche à droite
    const entierFormate = entier.replace(/(\d)(?=(\d{3})+$)/g, '$1 ')

    if (decimal) {
      // Formater la partie décimale : espace tous les 3 chiffres de droite à gauche
      const decimalFormate = decimal.replace(/(\d{3})(?=\d)/g, '$1 ')
      return `${entierFormate}${separator}${decimalFormate.trim()}`
    }

    return entierFormate // Retourne uniquement la partie entière si pas de décimale
  })
}

/**
 * Comparaison de nombres avec les espaces exigés
 * @param {string} input
 * @param {string} goodAnswer
 * @author Rémi Angot
 */
export function numberWithSpaceCompare(
  input: string,
  goodAnswer: string,
): ResultType {
  let inputCleanFirst = input.replaceAll(/(\s{2,})(?=\d{3})/g, ' ').trim() // EE : l'élève peut avoir un saisi un espace avant ou après le nombre et avoir saisi des doubles espaces sans qu'on lui en tienne rigueur tant qu'ils séparent bien les classes, évidemment.
  inputCleanFirst = inputCleanFirst.replaceAll(/\\,/g, ' ') // EE : Permet à input que les espaces ressemblent uniquement à ' ' et non à '\,'.
  const clean = generateCleaner(['espaces'])
  const inputClean = clean(input)
  const goodAnswerClean = clean(goodAnswer)
  let goodAnswerNew = goodAnswerClean.replace(/\s+/g, '') // EE : On enlève tous les espaces s'il y en a.

  // Gestion pénible de la virgule ci-dessous dans le cas de plus de 3 chiffres dans la partie décimale.
  goodAnswerNew = goodAnswerNew.replace('{,}', ',') // EE : On enlève toutes les virgules sous la forme {,} s'il y en a.
  goodAnswerNew = formatNumberWithSpaces(goodAnswerNew) // EE : On rajoute tous les espaces adéquats.
  goodAnswerNew = goodAnswerNew.replace(',', '{,}') // EE : On rajoute toutes les virgules sous la forme {,} s'il y en a.

  let feedback = ''
  if (inputCleanFirst !== goodAnswerNew && inputClean === goodAnswerClean) {
    feedback = 'Le nombre est mal écrit, il faut faire attention aux espaces. '
  }
  return { isOk: inputCleanFirst === goodAnswerNew, feedback }
}

export function exprCompare(
  input: string,
  goodAnswer: string,
  { noUselessParen = false },
): ResultType {
  const clean = generateCleaner([
    'virgules',
    'parentheses',
    'divisions',
    'fractions',
    'puissances',
    'fractions',
    'mathrm',
  ])
  const inputClean = clean(input) ?? ''
  const answerClean = clean(goodAnswer) ?? ''
  let feedback = ''
  let isOk = true
  const nbParenInput = inputClean.match(/([[()\]])/g)?.length
  const nbParenAnswer = answerClean.match(/([[()\]])/g)?.length
  const numbersInput = inputClean
    .match(/\d+/g)
    ?.sort((a, b) => Number(a) - Number(b))
  const numbersAnswer = answerClean
    .match(/\d+/g)
    ?.sort((a, b) => Number(a) - Number(b))
  const opsInput = inputClean
    .match(/[+\-/*]|(times)|(div)|(frac)/g)
    ?.sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
  const opsAnswer = answerClean
    .match(/[+\-/*]|(times)|(div)|(frac)/g)
    ?.sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
  const isOk1 = nbParenAnswer === nbParenInput // doit être true si noUselessParen est true
  const isOk2 =
    numbersInput != null &&
    numbersAnswer != null &&
    areSameArray(numbersInput, numbersAnswer) // doit être obligatoirement true
  const isOk3 =
    opsInput != null && opsAnswer != null && areSameArray(opsInput, opsAnswer) // doit obligatoirement être true
  const isOk4 = engine
    .parse(inputClean)
    .isEqual(engine.parse(clean(goodAnswer))) // doit obligatoirement être true
  if (noUselessParen && inputClean != null && answerClean !== null) {
    isOk = (isOk1 && isOk2 && isOk3 && isOk4) ?? false
    if (!isOk1 && isOk4) {
      feedback =
        "L'expression donne le bon résultat mais n'a pas la forme attendue."
    }
  } else {
    isOk = (isOk2 && isOk3 && isOk4) ?? false
    if (!isOk) {
      if (!isOk4) {
        feedback = "L'expression ne donne pas le bon résultat."
      } else if (!isOk3) {
        feedback = "L'expression ne contient pas les bonnes opérations."
      } else {
        feedback = "L'expression ne contient pas les bons nombres."
      }
    }
  }
  return { isOk, feedback }
}

export function checkLeCompteEstBon( // Ne fonctionne que si numbers est un tableau de nombres POSITIFS.
  input: string,
  numbers: number[],
  target: number,
  quatreOperationsObligatoires: boolean,
): ResultType {
  const clean = generateCleaner([
    'virgules',
    'parentheses',
    'fractions',
    'divisions',
  ])
  const inputClean = clean(input)

  // At first, check that the value of the expression is correct
  const answer = engine.parse(inputClean, {
    canonical: false,
  }) as BoxedExpression
  const value = answer.value
  if (value === undefined || Number(value) !== target) {
    return {
      isOk: false,
      feedback: `L'expression vaut ${value} et non ${target}.`,
    }
  }

  // Count each operator
  let addCount = 0
  let multiplyCount = 0
  let divideCount = 0
  let subtractCount = 0

  let tropDeNombres = false
  let nombresEnDoublon = false
  let mauvaisNombre = false
  let symboleNonAutorise = false
  let operationNonAutorisee = false

  const listeNombresEnonce = [...numbers]
  const visit: (node: BoxedExpression) => void = (node) => {
    if (node.numericValue !== null) {
      if (listeNombresEnonce.length === 0) {
        if (numbers.includes(Math.abs(Number(node.value)))) {
          // abs obligatoire car sinon, pour 5-3, il tente de chercher -3.
          nombresEnDoublon = true
          return 'Au moins un nombre en doublon'
        }
        tropDeNombres = true
        return 'Au moins un nombre en trop'
      }
      if (listeNombresEnonce.includes(Math.abs(Number(node.value)))) {
        // J'enlève cet élément de la liste
        listeNombresEnonce.splice(
          listeNombresEnonce.indexOf(Math.abs(Number(node.value))),
          1,
        )
      } else {
        mauvaisNombre = true
        return 'Au moins un mauvais nombre parmi ceux proposés'
      }
    }

    if (node.symbol) {
      symboleNonAutorise = true
      return "L'expression contient un symbole non autorisé."
    }
    if (node.operator) {
      if (node.operator !== 'Number' && node.operator !== 'Delimiter') {
        switch (node.operator) {
          case 'Add':
            addCount++
            break
          case 'Multiply':
            multiplyCount++
            break
          case 'Divide':
            divideCount++
            break
          case 'Subtract':
          case 'Negate':
            subtractCount++
            break
          default:
            operationNonAutorisee = true
        }
      }
      if (node.ops !== null) {
        for (const op of node.ops) {
          visit(op)
        }
      } else return 'OK'
    }
  }

  visit(answer)
  if (tropDeNombres)
    return {
      isOk: false,
      feedback: "L'expression utilise plus de nombres que demandés.",
    }
  if (nombresEnDoublon)
    return {
      isOk: false,
      feedback:
        "L'expression utilise plusieurs fois un même nombre parmi ceux proposés.",
    }
  if (mauvaisNombre)
    return {
      isOk: false,
      feedback: "L'expression utilise au moins un nombre non autorisé.",
    }
  if (symboleNonAutorise)
    return {
      isOk: false,
      feedback: "L'expression contient un symbole non autorisé.",
    }
  if (operationNonAutorisee)
    return {
      isOk: false,
      feedback:
        "L'expression doit contenir que des additions, des soustractions, des multiplications, des divisions ou des parenthèses.",
    }
  if (
    quatreOperationsObligatoires &&
    !(
      addCount === 1 &&
      divideCount === 1 &&
      subtractCount === 1 &&
      multiplyCount === 1
    )
  )
    return {
      isOk: false,
      feedback:
        "L'expression doit contenir une addition, une soustraction, une multiplication et une division.",
    }

  return { isOk: true, feedback: '' } // L'expression est correcte.
}
