import type { Locator, Page } from 'playwright'
import { log } from '../../helpers/log'
import prefs from '../../helpers/prefs'
import { runTest } from '../../helpers/run'
import {
  type AMCVariation,
  type LatexVariation,
  type Variation,
  type View,
  getLatexFromPage,
  isAMCVariation,
  isLatexVariation,
  isStudentVariation,
  testAllViews,
} from '../../helpers/testAllViews'
import { clean } from '../../helpers/text'

type ExerciseType = 'classique' | 'simple'

type State = {
  url: string
  view: string
  numbers: string[]
  exerciseType: ExerciseType
}

const states: State[] = []
const questionsNb = 20

let exerciseType: ExerciseType = 'classique'

function logState() {
  states.forEach((state) => {
    console.log(state)
  })
}

async function test(page: Page) {
  await page.setDefaultTimeout(100000) // Set timeout to 100 seconds
  const classicExerciseParams =
    'uuid=0e6bd&id=6C10-1&n=10&d=10&s=2-3-4-5-6-7-8-9-10&s2=1&s3=true&uuid=0e6bd&id=6C10-1&n=10&d=10&s=2-3-4-5-6-7-8-9-10&s2=1&s3=true'
  exerciseType = 'classique'
  log('Testing classic exercise')
  await testAllViews(
    page,
    { params: classicExerciseParams, onlyOnce: true, isFullViews: true },
    callback,
  )
  logState()
  const simpleExerciseParams =
    'uuid=4ba86&id=canc3C04&n=10&d=10&cd=1&uuid=4ba86&id=canc3C04&n=10&d=10&cd=1'
  exerciseType = 'simple'
  log('Testing simple exercise')
  await testAllViews(
    page,
    { params: simpleExerciseParams, onlyOnce: true, isFullViews: true },
    callback,
  )
  logState()
  log('Check differences')
  return isConsistent()
}

const callback = async (
  page: Page,
  description: string,
  view: View,
  variation: Variation,
) => {
  log(`Testing ${view} ${variation} ${description}`)
  if (view === 'diaporama') {
    await diaporamaStatePush(page, view)
  } else if (view === 'LaTeX' || view === 'AMC') {
    if (!isLatexVariation(variation) && !isAMCVariation(variation))
      throw new Error('LaTeX or AMC callback called with invalid variation')
    if (view === 'LaTeX' && !isLatexVariation(variation))
      throw new Error('LaTeX invalid variation')
    // if (view === 'AMC' && !isAMCVariation(variation))
    //   throw new Error('AMC invalid variation')
    await LatexStatePush(page, view, variation)
  } else {
    if (view === 'eleve' && !isStudentVariation(variation))
      throw new Error('Student callback called with invalid view')
    await defaultViewStatePush(page, view, variation)
  }
}

async function diaporamaStatePush(page: Page, view: View) {
  const url = page.url()
  const numbers: string[] = []
  const maxQuestionsNb = await page.locator('#stepsContainer > button').count()
  // const maxQuestionsNb = 50
  for (let i = 0; i < maxQuestionsNb; i++) {
    numbers.push(await getSlideshowNumbers(page))
    await page.locator('.bx-skip-next').click()
  }
  states.push({
    url,
    view,
    numbers,
    exerciseType,
  })
}

async function getSlideshowNumbers(page: Page) {
  await page.waitForSelector('#question0')
  const locator = page.locator('#question0')
  const innerText = await locator.innerText()
  const number = clean(innerText, ['cr']).replace(/\D/g, '')
  return number
}

async function LatexStatePush(
  page: Page,
  view: 'LaTeX' | 'AMC',
  variation: LatexVariation | AMCVariation,
) {
  const url = page.url()
  const latex = await getLatexFromPage(page)
  const numbers = getLatexNumbers(latex, view, variation)
  states.push({
    url,
    view: view + ':' + variation,
    numbers,
    exerciseType,
  })
}

function getLatexNumbers(
  latex: string,
  view: 'LaTeX' | 'AMC',
  model: LatexVariation | AMCVariation,
) {
  const lineRegex: RegExp =
    view === 'LaTeX'
      ? model === 'Can'
        ? /\\CompteurTC\s+&[^\r\n]*/g
        : /\\item[^\r\n]*/g
      : /\$ [^\r\n]*/g
  const rawLines: string[] = latex.match(lineRegex) || []
  if (model === 'Can') {
    const rawNumbers = rawLines.map((line) => line.replace(/\D/g, ''))
    // const cleanNumbers = rawNumbers.map(number => number.slice(1))
    const cleanNumbers = rawNumbers
    return cleanNumbers.map((number) => number + number)
  } else {
    const numbersQuestionsAnswers = rawLines.map(
      (line) => line.replace(/\D/g, '') + line.replace(/\D/g, ''),
    )
    return removeAnswers(numbersQuestionsAnswers, view, model, rawLines.length)
  }
}

function removeAnswers(
  calculationsQuestionsAnswers: string[],
  view: 'LaTeX' | 'AMC',
  model: LatexVariation | AMCVariation,
  linesNumber: number,
): string[] {
  if (view === 'LaTeX') {
    if (model === 'ProfMaquette' || model === 'ProfMaquetteQrcode') {
      const firstExercise = calculationsQuestionsAnswers.slice(
        0,
        questionsNb / 2,
      )
      const secondExercise = calculationsQuestionsAnswers.slice(
        questionsNb,
        questionsNb + questionsNb / 2,
      )
      return [...firstExercise, ...secondExercise]
    } else {
      return calculationsQuestionsAnswers.slice(0, linesNumber / 2) // Supprime la deuxième moitié qui correspond aux réponses
    }
  } else {
    return calculationsQuestionsAnswers
  }
}

async function defaultViewStatePush(
  page: Page,
  view: View,
  variation: Variation,
) {
  const url = page.url()
  await page.waitForSelector('.katex')
  const locators = await page.locator('.katex').all()
  const numbers = await getNumbers(locators)
  if (
    view === 'eleve' &&
    (variation === 'Une page par exercice' ||
      variation === 'Course aux nombres' ||
      variation === 'Une page par question')
  ) {
    // Bizarrement, les nombres se répètent 3 fois à partir du deuxième exercice dans ces vues au lieu de 2 partout ailleurs
    // À modifier lorsque ce problème de duplication sera réglé
    const duplicationBeginningIndex =
      variation === 'Une page par exercice' ? numbers.length / 2 : 1
    for (let i = 0; i < numbers.length; i++) {
      if (i >= duplicationBeginningIndex) {
        numbers[i] = numbers[i].slice(
          0,
          Math.round((numbers[i].length * 2) / 3),
        )
      }
    }
  }
  states.push({
    url,
    view,
    numbers,
    exerciseType,
  })
}

async function getNumbers(locators: Locator[]) {
  const numbers: string[] = []
  for (const locator of locators) {
    const innerText = await locator.innerText()
    const number = clean(innerText, ['cr']).replace(/\D/g, '')
    numbers.push(number)
  }
  return numbers.filter((n) => n !== '')
}

function isConsistent() {
  const differenceIndexes = getDifferencesIndexes()
  if (differenceIndexes.length > 0) {
    for (const differenceIndex of differenceIndexes) {
      console.log(
        `Il y a une différence entre la vue ${states[differenceIndex - 1].view} et la vue ${states[differenceIndex].view} pour les exercices de type ${states[differenceIndex].exerciseType}`,
      )
      console.log(states[differenceIndex - 1], states[differenceIndex])
    }
    return false
  }
  return true
}

function getDifferencesIndexes() {
  const differenceIndexes: number[] = []
  for (let i = 1; i < states.length; i++) {
    for (let j = 0; j < states[i].numbers.length; j++) {
      if (
        states[i].exerciseType === states[i - 1].exerciseType &&
        states[i].numbers[j] !== states[i - 1].numbers[j] &&
        !(
          states[i].exerciseType === 'simple' &&
          (states[i].view.startsWith('AMC:') ||
            states[i - 1].view.startsWith('AMC:'))
        ) // Les exercices simples n'ont pas de sortie AMC
      ) {
        differenceIndexes.push(i)
        break
      }
    }
  }
  return differenceIndexes
}

if (process.env.CI) {
  // utiliser pour les tests d'intégration
  prefs.headless = true
  runTest(test, import.meta.url, { pauseOnError: false })
} else {
  prefs.slowMo = 0
  runTest(test, import.meta.url, { pauseOnError: true })
}
