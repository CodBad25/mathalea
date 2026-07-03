import { expect } from '@playwright/test'
import type { Locator, Page } from 'playwright'
import { describe, test } from 'vitest'
import { shuffle } from '../../../../src/lib/outils/arrayOutils'
import { findStatic, findUuid } from '../../helpers/filter.js'
import { createIssue } from '../../helpers/issue.js'
import {
  getFileLogger,
  log,
  logError,
  logIfDebug,
  logIfVerbose,
} from '../../helpers/log.js'
import prefs from '../../helpers/prefs.js'
import { runSeveralTests } from '../../helpers/run.js'
import { checkEachCombinationOfParams } from '../../helpers/testAllViews.js'

const logConsole = getFileLogger('exportConsole', { append: true })

class ConsoleErrorsTestFailure extends Error {}

function formatFailureDetails(
  urlExercice: string,
  page: Page,
  messages: string[],
) {
  const details = messages.slice(0, 5).join('\n')
  const suffix =
    messages.length > 5
      ? `\n... ${messages.length - 5} autre(s) erreur(s) dans tests/e2e/logs/exportConsole.log`
      : ''
  return [
    `Console errors test failed.`,
    messages[0] == null ? '' : `First error: ${messages[0]}`,
    `Initial URL: ${urlExercice}`,
    `Current URL: ${page.url()}`,
    `Unique errors (${messages.length}):`,
    details,
    suffix,
    `Full logs: tests/e2e/logs/exportConsole.log`,
  ]
    .filter((line) => line !== '')
    .join('\n')
}

function compactBrowserMessage(message: string) {
  return message
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '')
    ?.replace(/\s+/g, ' ')
}

function addUniqueMessage(messages: string[], message: string | undefined) {
  if (message == null || message === '') return
  if (!messages.includes(message)) messages.push(message)
}

async function waitForExercicesAffiches(page: Page, buttonZoom: Locator) {
  const waitForEvent = page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const listener = () => {
        document.removeEventListener('exercicesAffiches', listener)
        resolve()
      }
      document.addEventListener('exercicesAffiches', listener)
    })
  })
  await buttonZoom.click()
  // Attendre que l'événement exercicesAffiches soit déclenché
  const eventDetected = await Promise.race([
    waitForEvent,
    new Promise((resolve, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Timeout: L'événement exercicesAffiches n'a pas été détecté",
            ),
          ),
        5000,
      ),
    ),
  ])
  if (eventDetected instanceof Error) {
    logError(eventDetected.message)
  } else {
    logIfDebug('Événement exercicesAffiches détecté')
  }
}

async function action(page: Page, description: string) {
  logIfVerbose(`Test avec les paramètres ${description}`)
  // clic sur nouvel énoncé 3 fois
  const buttonNewData = page.getByRole('button', { name: 'Nouvel énoncé' })
  logIfDebug('Actualier (nouvel énoncé)')
  await buttonNewData.click({ force: true })
  logIfDebug('fin Actualier (nouvel énoncé)')
  const buttonZoom = page.locator(
    '#setupButtonsBar > div > div:nth-child(2) > button',
  )
  const buttonZoomMoins = page.locator(
    '#setupButtonsBar > div > div:nth-child(1) > button',
  )
  const zParam = new URL(page.url()).searchParams.get('z')
  const z = zParam === null || zParam === '' ? 1 : Number(zParam)
  logIfVerbose('Zoom')
  if (z < 1.4) {
    // await buttonZoom.highlight()
    await waitForExercicesAffiches(page, buttonZoom)
  } else {
    // await buttonZoomMoins.highlight()
    await waitForExercicesAffiches(page, buttonZoomMoins)
  }
  logIfVerbose('Fin zoom')
  // Active le mode interactif
  const activateInteractivityButton = page.getByRole('button', {
    name: 'Rendre interactif',
  })
  if (await activateInteractivityButton.isVisible()) {
    await activateInteractivityButton.click()
    logIfVerbose('Active le mode interactif')
    // selectionne les questions
    const questionSelector = 'li[id^="exercice0Q"]'
    await page.waitForSelector(questionSelector)
    logIfVerbose('new URL (mode interactif): ' + page.url())
    const locators = await page.locator(questionSelector).all()
    logIfVerbose('nbre de questions:' + locators.length)
    // locators.forEach(async (locator, index) => {
    //   const text = await locator.innerText()
    //   log(`Question ${index + 1}: ${text}`)
    // })
    // => TODOS à poursuivre
    // Cliquer sur vérifier les données
    const buttonVerifier = page.locator('#verif0')
    logIfVerbose('Vérifier les réponses')
    await buttonVerifier.click()
    await page.waitForSelector('article + div')
    const buttonResult = await page.locator('article + div').innerText()
    logIfVerbose(buttonResult)
    logIfVerbose('Actualier (nouvel énoncé) 3 fois')
    await buttonNewData.click({ clickCount: 3 })
    logIfVerbose('fin Actualier (nouvel énoncé) 3 fois')
  } else {
    // MGu : obligé car parfois on rate l'exception car trop rapide
    // await new Promise((resolve) => setTimeout(resolve, 1000)) // GV : Si on attend 1 seconde après chaque cas, il va falloir 1 an si on veut tester toutes les possibilités
  }
}

async function getConsoleTest(page: Page, urlExercice: string) {
  logIfVerbose(urlExercice)
  page.setDefaultTimeout(1_500_000)

  const retries = 3 // Nombre de tentatives en cas d'erreur
  for (let attempt = 1; attempt <= retries; attempt++) {
    const messages: string[] = []
    try {
      page.on('pageerror', (msg) => {
        if (msg.message !== 'Erreur de chargement de Mathgraph') {
          // mtgLoad : 3G22
          addUniqueMessage(messages, `pageerror:${page.url()} ${msg.message}`)
          logError(msg)
        }
      })
      page.on('crash', (msg) => {
        addUniqueMessage(messages, 'crash:' + page.url() + ' ' + msg)
        logError(msg)
      })
      // Listen for all console events and handle errors
      page.on('console', (msg) => {
        // if (msg.type() === 'error') {
        if (
          !msg.text().includes('[vite]') &&
          !msg.text().includes('[bugsnag] Loaded!') &&
          !msg.text().includes('No character metrics for') && // katex
          !msg.text().includes('LaTeX-incompatible input') && // katex
          !msg.text().includes('mtgLoad') && // mtgLoad : 3G22
          !msg.text().includes('MG32div0') && // MG32div0 : 3G22
          !msg.text().includes('Figure destroyed successfully') && // apigeom
          !msg
            .text()
            .includes('UserFriendlyError: Le chargement de mathgraph') &&
          !msg.text().includes("Invalid 'X-Frame-Options' header") &&
          !msg
            .text()
            .includes(
              'Blockly.Workspace.getAllVariables was deprecated in v12',
            ) &&
          !msg.text().includes('A-Frame Version:') &&
          !msg
            .text()
            .includes(
              'THREE Version (https://github.com/supermedium/three.js)',
            ) &&
          !msg
            .text()
            .includes(
              'WARNING: Too many active WebGL contexts. Oldest context will be lost.',
            ) &&
          !msg.text().includes('GPU stall due to ReadPixels') &&
          !msg.text().includes(': le motif contient plus') &&
          !msg
            .text()
            .includes(
              'The column width is less than 0, need to adjust page width to make',
            ) &&
          !msg.location().url.includes('mathgraph32') &&
          !msg.text().includes('placeholderMetrics 0.7 0.2') &&
          !msg.text().includes('Compilation fallback for')
        ) {
          if (!msg.text().includes('<HeaderExercice>')) {
            addUniqueMessage(
              messages,
              `console:${page.url()} ${compactBrowserMessage(msg.text())}`,
            )
          }
        }
        // }
      })

      logIfVerbose('On charge la page')
      await page.goto(urlExercice)
      await page.waitForLoadState('networkidle')
      logIfVerbose('fin : On charge la page')

      // Correction
      // On cherche les questions
      logIfVerbose('On cherche les questions')
      await page.waitForSelector('div.mb-5>ul>div#consigne0-0')
      logIfVerbose('fin : On cherche les questions')
      // Pour chaque combinaison de paramètres, on clique sur nouvel énoncé 3 fois, active le mode interactif et reclique sur nouvel énoncé 3 fois
      await checkEachCombinationOfParams(page, action, { isFullViews: true })
      // Paramètres ça va les refermer puisqu'ils sont ouverts par défaut
      const buttonParam = page.getByRole('button', {
        name: "Changer les paramètres de l'",
      })
      logIfVerbose('Ferme les paramètres ')
      if (await buttonParam.isVisible()) {
        await buttonParam.click()
      }
      if (messages.length > 0) {
        logError(messages)
        logError(`Il y a ${messages.length} erreurs : ${messages.join('\n')}`)
        log('url:' + page.url())
        await createIssue(urlExercice, messages, ['console'], log)
        throw new ConsoleErrorsTestFailure(
          formatFailureDetails(urlExercice, page, messages),
        )
      } else {
        return 'OK'
      }
    } catch (error) {
      if (error instanceof ConsoleErrorsTestFailure) throw error
      // si une exception comme timeout: on récupère la requete
      let message = 'Unknown Error'
      if (error instanceof Error) message = error.message
      addUniqueMessage(messages, 'exception:' + page.url() + ': ' + message)
      log('url:' + page.url())
      logError(messages)
      logError(`Il y a ${messages.length} erreurs : ${messages.join('\n')}`)
      if (attempt === retries) {
        if (!message.includes('net::ERR_CONNECTION_REFUSED')) {
          // le serveur ne répond pas... si net::ERR_CONNECTION_REFUSED
          await createIssue(urlExercice, messages, ['console'], log)
        }
        throw new ConsoleErrorsTestFailure(
          formatFailureDetails(urlExercice, page, messages),
        )
      }
    }
  }
}

async function testRunAllLots(filter: string) {
  const uuids =
    filter.includes('dnb') || filter.includes('bac') || filter.includes('e3c')
      ? await findStatic(filter)
      : await findUuid(filter)

  // Exclure les exercices contenant "test" ou "beta" dans leur nom
  const filteredUuids = shuffle(
    uuids.filter(([uuid, name]) => {
      const nameLower = name.toLowerCase()
      return !nameLower.includes('test') && !nameLower.includes('beta')
    }),
  ).slice(0, prefs.nbExosParLot) // Limiter le nombre d'exercices à tester pour éviter de surcharger le serveur

  logIfVerbose(filteredUuids)
  if (filteredUuids.length === 0) {
    log(`Aucun uuid trouvé pour le filtre '${filter}'`)
    describe('no-parameter-warning', () => {
      test.skip(`Aucun uuid trouvé pour le filtre '${filter}'`, () => {
        // This test is skipped to show a warning instead of pass/fail
      })
    })
  }
  for (let i = 0; i < filteredUuids.length && i < prefs.nbExosParLot; i += 20) {
    const ff: ((page: Page) => Promise<boolean>)[] = []
    for (let k = i; k < i + 20 && k < filteredUuids.length; k++) {
      const myName = filteredUuids[k][1]
      const f = async function (page: Page) {
        // Listen for all console logs
        page.on('console', (msg) => {
          logConsole(msg.text())
        })
        logIfVerbose(filter)
        const hostname = local
          ? `http://localhost:${process.env.PLAYWRIGHT_SERVER_PORT ?? (process.env.CI ? '80' : '5173')}/alea/`
          : 'https://coopmaths.fr/alea/'
        logIfVerbose(
          `uuid=${filteredUuids[k][0]} exo=${filteredUuids[k][1]} i=${k} / ${filteredUuids.length}`,
        )
        const resultReq = await getConsoleTest(
          page,
          `${hostname}?uuid=${filteredUuids[k][0]}&id=${filteredUuids[k][1].substring(0, filteredUuids[k][1].lastIndexOf('.')) || filteredUuids[k][1]}&alea=${alea}&testCI`,
        )
        if (resultReq !== 'OK') {
          logError(
            `Erreur pour uuid=${filteredUuids[k][0]} exo=${filteredUuids[k][1]} i=${k} / ${filteredUuids.length}`,
          )
        } else {
          logIfVerbose(
            `Succès pour uuid=${filteredUuids[k][0]} exo=${filteredUuids[k][1]} i=${k} / ${filteredUuids.length}`,
          )
        }
        return resultReq === 'OK'
      }
      Object.defineProperty(f, 'name', { value: myName, writable: false })
      ff.push(f)
    }
    runSeveralTests(ff, import.meta.url, {
      pauseOnError: false,
      silent: false,
      debug: false,
      headless: prefs.headless,
    })
  }
}

const alea = 'e906e'
const local = true
process.env.NIV = 'EAMPremiere/EAM-PolynesieSpe-2026-Q4.ts'
if (process.env.NIV !== null && process.env.NIV !== undefined) {
  const filter = (process.env.NIV as string).replaceAll(' ', '')
  prefs.headless = true
  prefs.nbExosParLot = process.env.NB_EXOS_PAR_LOT
    ? parseInt(process.env.NB_EXOS_PAR_LOT)
    : 75
  logIfVerbose(filter)
  testRunAllLots(filter)
} else if (
  process.env.CHANGED_FILES !== null &&
  process.env.CHANGED_FILES !== undefined
) {
  const changedFiles = process.env.CHANGED_FILES?.split('\n') ?? []
  logIfVerbose(changedFiles)
  prefs.headless = true
  prefs.nbExosParLot = process.env.NB_EXOS_PAR_LOT
    ? parseInt(process.env.NB_EXOS_PAR_LOT)
    : 75
  const filtered = changedFiles
    .filter(
      (file) =>
        file.startsWith('src/exercices/') &&
        !file.includes('ressources') &&
        !file.includes('apps') &&
        file.replace('src/exercices/', '').split('/').length >= 2,
    )
    .map((file) =>
      file
        .replace(/^src\/exercices\//, '')
        .replace(/\.ts$/, '.')
        .replace(/\.js$/, '.'),
    )
  logIfVerbose(filtered)
  if (filtered.length === 0) {
    // aucun fichier concerné.. on sort
    describe('dummy', () => {
      test('should pass', () => {
        expect(true).toBe(true)
      })
    })
  } else {
    const cfiltered = filtered.slice(0, prefs.nbExosParLot) // limiter à 300 exercices pour éviter de surcharger le serveur
    cfiltered.forEach((file, index) => {
      const filter = file.replaceAll(' ', '')
      logIfVerbose(
        'launching test for:',
        filter + `,  ${index + 1}/${cfiltered.length}`,
      )
      testRunAllLots(filter)
    })
  }
} else {
  log('⚠️  ATTENTION : Le test a été lancé sans paramètre')
  log('Exemples :')
  log('Pour le lancer sur le niveau 4e :')
  log('Sur Windows (cmd) : set NIV=4e && pnpm test:e2e:console_errors')
  log('Sur Winows (PowerShell) : $env:NIV="4e"; pnpm test:e2e:console_errors')
  log('Sur Linux/MacOS : NIV=4e pnpm test:e2e:console_errors')
  log("Pour le lancer sur l'exercice 6e/6G2A :")
  log('Sur Windows (cmd) : set NIV=6e/6G2A.ts && pnpm test:e2e:console_errors')
  log('Sur Linux/MacOS : NIV=6e/6G2A.ts pnpm test:e2e:console_errors')
  describe('no-parameter-warning', () => {
    test.skip('test requires NIV parameter - see logs for usage', () => {
      // This test is skipped to show a warning instead of pass/fail
    })
  })
}
