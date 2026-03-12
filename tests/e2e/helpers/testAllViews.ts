import type { BrowserContext, Locator, Page } from 'playwright'
import prefs from './prefs'

export const ViewValidKeys = <const>[
  'start',
  'diaporama',
  'apercu',
  'eleve',
  'LaTeX',
  'AMC',
]
type ViewValidKeysType = typeof ViewValidKeys
export type View = ViewValidKeysType[number]
export function isView(obj: unknown): obj is View {
  if (obj == null || typeof obj !== 'string') return false
  return ViewValidKeys.includes(obj as View)
}

export const StudentVariationValidKeys = <const>[
  'Tous les exercices sur une page',
  'Une page par exercice',
  'Une page par question',
  'Course aux nombres',
]
type StudentVariationValidKeysType = typeof StudentVariationValidKeys
export type StudentVariation = StudentVariationValidKeysType[number]
export function isStudentVariation(obj: unknown): obj is StudentVariation {
  if (obj == null || typeof obj !== 'string') return false
  return StudentVariationValidKeys.includes(obj as StudentVariation)
}

export const LatexVariationValidKeys = <const>[
  'Coopmaths',
  'Classique',
  'ProfMaquette',
  'ProfMaquetteQrcode',
  'Can',
]
type LatexVariationValidKeysType = typeof LatexVariationValidKeys
export type LatexVariation = LatexVariationValidKeysType[number]
export function isLatexVariation(obj: unknown): obj is LatexVariation {
  if (obj == null || typeof obj !== 'string') return false
  return LatexVariationValidKeys.includes(obj as LatexVariation)
}

export const AMCVariationValidKeys = <const>[
  'AMCcodeGrid',
  'AMCassociation',
  'manuscrits',
]
type AMCVariationValidKeysType = typeof AMCVariationValidKeys
export type AMCVariation = AMCVariationValidKeysType[number]
export function isAMCVariation(obj: unknown): obj is AMCVariation {
  if (obj == null || typeof obj !== 'string') return false
  return AMCVariationValidKeys.includes(obj as AMCVariation)
}

export type Variation = '' | StudentVariation | LatexVariation | AMCVariation

export type CallbackType = (
  page: Page,
  description: string,
  view: View,
  variation: Variation,
) => Promise<void>

type Form = {
  description: string
  locator: Locator
  type: 'check' | 'num' | 'text' | 'select'
  values: string[] | number[] | boolean[]
}

const local = true

export async function testAllViews(
  page: Page,
  options: { params: string; onlyOnce?: boolean; isFullViews?: boolean },
  callback: CallbackType,
) {
  const browser = prefs.browserInstance
  if (browser === null) throw Error("can't test a null browser")
  const [context] = browser.contexts()
  const hostname = local
    ? `http://localhost:${process.env.CI ? '80' : '5173'}/alea/?`
    : 'https://coopmaths.fr/alea/?'
  await page.goto(hostname + options.params)
  await page.waitForLoadState('networkidle')
  await checkEachCombinationOfParams(
    page,
    async (page, description, isFullViews) => {
      await callback(page, description, 'start', '')
      await checkSlideshow(page, description, callback, isFullViews)
      await callback(page, description, 'start', '')
      if (isFullViews) await checkStudent(page, description, context, callback)
      if (isFullViews) await callback(page, description, 'start', '')
      await checkLatex(page, description, callback, isFullViews)
      if (isFullViews) await callback(page, description, 'start', '')
      if (isFullViews) await checkAmc(page, description, callback)
    },
    { onlyOnce: options.onlyOnce, isFullViews: options.isFullViews },
  )
  await callback(page, '', 'start', '')
}

async function checkSlideshow(
  page: Page,
  description: string,
  callback: CallbackType,
  isFullViews: boolean,
) {
  await page.locator('div[data-tip="Diaporama"]').click()
  await page.waitForURL((url) => url.searchParams.get('v') === 'diaporama')
  if (isFullViews) await checkSlideshowPlay(page, description, callback)
  await checkSlideshowPreview(page, description, callback)
  await page.locator('.bx-x').first().click()
}

async function checkSlideshowPlay(
  page: Page,
  description: string,
  callback: CallbackType,
) {
  await page.locator('#diaporama-play-button').click()
  await callback(page, description, 'diaporama', '')
}

async function checkSlideshowPreview(
  page: Page,
  description: string,
  callback: CallbackType,
) {
  await page.locator('.bx-detail').click()
  await callback(page, description, 'apercu', '')
  await page.locator('.bx-arrow-back').click()
}

async function checkStudent(
  page: Page,
  description: string,
  context: BrowserContext,
  callback: CallbackType,
) {
  await page.locator('.bx-link').click()
  await checkStudentVariation(
    'Tous les exercices sur une page',
    page,
    description,
    context,
    callback,
  )
  if (getExercisesCount(page) > 1)
    await checkStudentVariation(
      'Une page par exercice',
      page,
      description,
      context,
      callback,
    )
  await checkStudentVariation(
    'Une page par question',
    page,
    description,
    context,
    callback,
  )
  await checkStudentVariation(
    'Course aux nombres',
    page,
    description,
    context,
    callback,
  )
  await page.locator('.bx-x').first().click()
}

async function checkStudentVariation(
  variation: Variation,
  page: Page,
  description: string,
  browserContext: BrowserContext,
  callback: CallbackType,
) {
  await page.click('text=Présentation classique')
  await page.click("text=Pas d'interactivité") // Parce qu'il devient automatiquement "Tout interactif" de temps en temps
  await page.click(`text=${variation}`)
  page.click('text=Visualiser') // Si on await ici, on risque de manquer le context.waitForEvent('page') qui suit
  const newPage = await browserContext.waitForEvent('page')
  await newPage.waitForLoadState('networkidle')

  if (variation === 'Course aux nombres') {
    await newPage.click('text=Démarrer')
    await newPage.waitForTimeout(6000)
  }
  await callback(newPage, description, 'eleve', variation)
  await newPage.close()
}

export function getExercisesCount(page: Page): number {
  const regex = /uuid=/g
  const matches = page.url().match(regex)
  return matches ? matches.length : 0
}

async function checkLatex(
  page: Page,
  description: string,
  callback: CallbackType,
  isFullViews: boolean,
) {
  await checkLatexVariation(page, description, 'LaTeX', 'Coopmaths', callback)
  if (isFullViews) {
    await checkLatexVariation(page, description, 'LaTeX', 'Classique', callback)
    await checkLatexVariation(
      page,
      description,
      'LaTeX',
      'ProfMaquette',
      callback,
    )

    await checkLatexVariation(page, description, 'LaTeX', 'Can', callback)
  }
}

async function openAmcFromMoreExports(page: Page) {
  await page.locator('[data-tip="Plus d\'exports"] button').click()
  await page.getByRole('dialog').locator('button:has(p:text-is("AMC"))').click()
}

async function checkLatexVariation(
  page: Page,
  description: string,
  view: 'LaTeX' | 'AMC',
  variation: LatexVariation | AMCVariation,
  callback: CallbackType,
) {
  if (view === 'AMC') {
    await openAmcFromMoreExports(page)
  } else {
    await page.locator('button[data-tip="PDF via LaTeX"]').click()
  }
  await page.click(`input[type="radio"][value="${variation}"]`)
  await waitForLatex(page, variation)
  await callback(page, description, view, variation)
  await page.locator('.bx-x').first().click()
}

async function waitForLatex(page: Page, model: LatexVariation | AMCVariation) {
  switch (model) {
    case 'Coopmaths':
      await page.waitForFunction(() => {
        const preElement = document.querySelector('main > section > pre')
        if (preElement && preElement.textContent) {
          return preElement.textContent.includes('\\begin{EXO}{')
        }
        return false
      })
      break
    case 'Classique':
      await page.waitForFunction(() => {
        const preElement = document.querySelector('main > section > pre')
        if (preElement && preElement.textContent) {
          return preElement.textContent.includes('\\begin{EXO}{')
        }
        return false
      })
      break
    case 'ProfMaquette':
      await page.waitForFunction(() => {
        const preElement = document.querySelector('main > section > pre')
        if (preElement && preElement.textContent) {
          return preElement.textContent.includes('\\begin{Maquette}[Fiche')
        }
        return false
      })
      break

    default:
      break
  }
}

async function checkAmc(
  page: Page,
  description: string,
  callback: CallbackType,
) {
  if (!(await isAmcAvailable(page))) return
  await checkLatexVariation(page, description, 'AMC', 'AMCcodeGrid', callback)
  await checkLatexVariation(
    page,
    description,
    'AMC',
    'AMCassociation',
    callback,
  )
  await checkLatexVariation(page, description, 'AMC', 'manuscrits', callback)
}

async function isAmcAvailable(page: Page): Promise<boolean> {
  await openAmcFromMoreExports(page)
  await page.waitForTimeout(1000)
  const AmcErrorLocator = await page
    .getByRole('dialog')
    .locator('.bxs-error')
    .all()
  if (AmcErrorLocator.length > 0) {
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '' })
      .locator('.bx-x')
      .click()
    await page.locator('.bx-x').first().click()
    return false
  }
  await page.locator('.bx-x').first().click()
  return true
}

export async function getLatexFromPage(page: Page) {
  const questionSelector = 'pre.w-full'
  const locator = page.locator(questionSelector)
  return await locator.innerText()
}

export async function checkEachCombinationOfParams(
  page: Page,
  action: (
    page: Page,
    description: string,
    isFullViews: boolean,
  ) => Promise<void>,
  options?: {
    onlyOnce?: boolean
    isFullCombinations?: boolean
    isFullViews?: boolean
  },
) {
  const { formChecks, formNums, formNumSelects, formTexts } =
    await getForms(page)
  // On range par ordre décroissant pour facilement exclure les formulaires vides dans le fullTest
  // C'est important de garder les formTexts en premier pour avoir tous les types de question pour le simpleTest et les formCheck ensuite pour les corrections détaillées
  const allForms = [
    ...formTexts,
    ...formChecks,
    ...formNums,
    ...formNumSelects,
  ].filter((form) => form.values.length > 0)
  const form1 = allForms[0]
  const form2 = allForms[1]
  const form3 = allForms[2]
  const form4 = allForms[3]
  const form5 = allForms[4]

  if (!form1 || options?.onlyOnce) {
    console.log('No form to test')
    await action(page, '', options?.isFullViews || false)
    return
  }
  if (options?.isFullCombinations) {
    await fullTest(
      page,
      form1,
      form2,
      form3,
      form4,
      form5,
      action,
      options?.isFullViews || false,
    )
    console.log(page.url())
  } else {
    console.log('Testing simpleTest')
    await simpleTest(
      page,
      form1,
      form2,
      form3,
      form4,
      form5,
      action,
      options?.isFullViews || false,
    )
  }
}

async function fullTest(
  page: Page,
  form1: Form,
  form2: Form,
  form3: Form,
  form4: Form,
  form5: Form,
  action: (
    page: Page,
    description: string,
    isFullViews: boolean,
  ) => Promise<void>,
  isFullViews: boolean,
) {
  for (const value1 of form1.values) {
    console.log('Testing', form1.description, value1)
    await setParam(page, form1, value1)
    if (!form2) {
      await action(page, `${form1.description}_${value1}`, isFullViews)
      continue
    }
    for (const value2 of form2.values) {
      console.log('Testing', form2.description, value2)
      await setParam(page, form2, value2)
      if (!form3) {
        await action(
          page,
          `${form1.description}_${value1}-${form2.description}_${value2}`,
          isFullViews,
        )
        continue
      }
      for (const value3 of form3.values) {
        console.log('Testing', form3.description, value3)
        await setParam(page, form3, value3)
        if (!form4) {
          await action(
            page,
            `${form1.description}_${value1}-${form2.description}_${value2}-${form3.description}_${value3}`,
            isFullViews,
          )
          continue
        }
        for (const value4 of form4.values) {
          console.log('Testing', form4.description, value4)
          await setParam(page, form4, value4)
          if (!form5) {
            await action(
              page,
              `${form1.description}_${value1}-${form2.description}_${value2}-${form3.description}_${value3}-${form4.description}_${value4}`,
              isFullViews,
            )
            continue
          }
          for (const value5 of form5.values) {
            console.log('Testing', form5.description, value5)
            await setParam(page, form5, value5)
            await action(
              page,
              `${form1.description}_${value1}-${form2.description}_${value2}-${form3.description}_${value3}-${form4.description}_${value4}-${form5.description}_${value5}`,
              isFullViews,
            )
          }
        }
      }
    }
  }
}

async function simpleTest(
  page: Page,
  form1: Form,
  form2: Form,
  form3: Form,
  form4: Form,
  form5: Form,
  action: (
    page: Page,
    description: string,
    isFullViews: boolean,
  ) => Promise<void>,
  isFullViews: boolean,
) {
  for (const value1 of form1.values) {
    console.log('Testing', form1.description, value1)
    await setParam(page, form1, value1)
    console.log(page.url())
    await action(page, `${form1.description}_${value1}`, isFullViews)
  }
  if (!form2) return
  for (const value2 of form2.values) {
    console.log('Testing', form2.description, value2)
    await setParam(page, form2, value2)
    console.log(page.url())
    await action(page, `${form2.description}_${value2}`, isFullViews)
  }
  if (!form3) return
  for (const value3 of form3.values) {
    console.log('Testing', form3.description, value3)
    await setParam(page, form3, value3)
    console.log(page.url())
    await action(page, `${form3.description}_${value3}`, isFullViews)
  }
  if (!form4) return
  for (const value4 of form4.values) {
    console.log('Testing', form4.description, value4)
    await setParam(page, form4, value4)
    console.log(page.url())
    await action(page, `${form4.description}_${value4}`, isFullViews)
  }
  if (!form5) return
  for (const value5 of form5.values) {
    console.log('Testing', form5.description, value5)
    await setParam(page, form5, value5)
    console.log(page.url())
    await action(page, `${form5.description}_${value5}`, isFullViews)
  }
}

async function setParam(
  page: Page,
  form: Form,
  value: string | number | boolean,
) {
  if (form.type === 'check') {
    if (value) {
      await form.locator.check()
    } else {
      await form.locator.uncheck()
    }
  }
  if (form.type === 'num') {
    await form.locator.fill(value.toString())
  }
  if (form.type === 'select') {
    await form.locator.selectOption({ value: value.toString() })
  }
  if (form.type === 'text') {
    const locator = page.locator('#settings-nb-questions-0')
    if ((await locator.count()) > 0) {
      // L'élément existe, effectuer une action
      await locator.fill(value.toString().split('-').length.toString())
      console.log("L'élément #settings-nb-questions-0 a été trouvé et rempli.")
    } else {
      // L'élément n'existe pas, gérer le cas
      console.log("L'élément #settings-nb-questions-0 n'existe pas.")
    }
    await form.locator.fill(value.toString())
  }
}

async function getForms(page: Page) {
  const settingsLocator = page.locator('#settings0')
  const formChecks: Form[] = []
  for (let i = 0; i < 5; i++) {
    const formCheck = settingsLocator.locator(`#settings-check${i + 1}-0`)
    if (await formCheck.isVisible()) {
      const label = formCheck.locator('xpath=following-sibling::label')
      formChecks.push({
        description: sanitizeFilename(await label.innerHTML()),
        locator: formCheck,
        type: 'check',
        values: [false, true],
      })
    }
  }
  const formCorrectionDetaillee = settingsLocator.locator(
    '#settings-correction-detaillee-0',
  )
  if (await formCorrectionDetaillee.isVisible()) {
    formChecks.push({
      description: sanitizeFilename('Correction détaillée'),
      locator: formCorrectionDetaillee,
      type: 'check',
      values: [false, true], // Pour que les corrections détaillées restent en simpleTest
    })
  }
  const formNums: Form[] = []
  const formNumSelects: Form[] = []
  for (let i = 0; i < 5; i++) {
    const formNum = settingsLocator.locator(`#settings-formNum${i + 1}-0`)

    if (await formNum.isVisible()) {
      const elementHandle = await formNum.elementHandle()
      if (!elementHandle) throw new Error('Element not found')
      const label = settingsLocator.locator(
        `label[for="settings-formNum${i + 1}-0"]`,
      )
      const tagName = await elementHandle.evaluate((node) =>
        node.tagName.toLowerCase(),
      )

      if (tagName === 'select') {
        const options = await formNum.locator('option').all()
        const allValues = await Promise.all(
          options.map((option) => option.getAttribute('value')),
        )
        const values = allValues.filter((value) => value !== null)
        formNumSelects.push({
          description: sanitizeFilename(await label.innerText()),
          locator: formNum,
          type: 'select',
          values,
        })
      } else if (tagName === 'input') {
        const min = Number(await formNum.getAttribute('min'))
        const max = Number(await formNum.getAttribute('max'))
        if (max < min) {
          console.error(
            'Max should be greater than min',
            'url',
            page.url(),
            'formulaire:',
            `#settings-formNum${i + 1}-0`,
            'label:',
            label,
            'min:',
            min,
            'max:',
            max,
          )
          throw new Error('Max should be greater than min')
        }
        formNums.push({
          description: sanitizeFilename(await label.innerText()),
          locator: formNum,
          type: 'num',
          values: [min, min + 1, max],
        })
      } else {
        console.error(
          'Unknown formNum type',
          'url',
          page.url(),
          'formulaire:',
          `#settings-formNum${i + 1}-0`,
          'label:',
          label,
          'tagName:',
          tagName,
        )
        throw new Error('Unknown formNum type')
      }
    }
  }
  const formTexts: Form[] = []
  for (let i = 0; i < 5; i++) {
    const formText = settingsLocator.locator(`#settings-formText${i + 1}-0`)
    if (await formText.isVisible()) {
      const titleDiv = formText.locator(
        'xpath=../preceding-sibling::div/div[1]',
      )
      const labelText = await titleDiv.innerText()
      const allNumbers = getAllNumbersFromString(labelText || '')
      const uniqueNumbers = Array.from(new Set(allNumbers))
      formTexts.push({
        description: sanitizeFilename(labelText),
        locator: formText,
        type: 'text',
        values: [uniqueNumbers.map((num) => num.toString()).join('-')],
      })
    }
  }
  return { formTexts, formChecks, formNums, formNumSelects }
}

function getAllNumbersFromString(inputString: string) {
  const regex = /\d+/g // Regex pattern to match one or more digits
  const matches = inputString.match(regex)
  return matches ? matches.map(Number) : []
}

function sanitizeFilename(filename: string): string {
  const forbiddenChars = /[\\/:*?"<>|]/g
  return filename.replace(forbiddenChars, '').trim().replace(/\s+/g, '_')
}
