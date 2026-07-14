import { expect } from '@playwright/test'
import { writeFileSync } from 'fs'
import path from 'path'
import type { Locator, Page } from 'playwright'
import { fileURLToPath } from 'url'
import { logDiffContext } from '../../helpers/compareStrings'
import { logIfVerbose } from '../../helpers/log'
import prefs from '../../helpers/prefs.js'
import { runTest } from '../../helpers/run'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function clickRobust(locator: Locator) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await expect(locator).toBeVisible()
      await expect(locator).toBeEnabled()
      await locator.click({ trial: true, timeout: 10_000 })
      await locator.click({ timeout: 10_000 })
      return
    } catch (error) {
      if (attempt === 2) throw error
      await locator.page().waitForTimeout(300)
    }
  }
}

async function testV(page: Page) {
  const port =
    process.env.PLAYWRIGHT_SERVER_PORT ?? (process.env.CI ? '80' : '5173')
  const basePath = process.env.CI ? '/alea' : ''
  const origin = `http://localhost:${port}`
  const parentRoutePattern = '**/parent*'
  const parentUrl = `${origin}${basePath}/parent`
  const moduleMockRoutePattern = '**/modulemock.js*'
  const moduleMockScriptUrl = '/modulemock.js'
  const iframeUrl = `${origin}${basePath}/?recorder=capytale`

  // Mock the api call before navigating
  await page.route(parentRoutePattern, async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: `<html>
      <body>
      bonjour
      <div style='height: 90%;'>
      <iframe id='iframe' width="100%" height="100%" allowfullscreen="" src='${iframeUrl}'></iframe>
      </div>
      <script src='${moduleMockScriptUrl}' type='module'></script>
      </body></html>`,
    })
  })
  await page.route(moduleMockRoutePattern, async (route) => {
    await route.fulfill({
      contentType: 'text/javascript',
      path: path.resolve(__dirname, '../../mock/mock.capytale.save.module.js'),
    })
  })

  // Go to the page
  await page.setDefaultTimeout(1_500_000) // Set timeout to 1_500_000 seconds
  await page.goto(parentUrl)

  await expect(page.locator('body')).toContainText('bonjour')

  // await page.locator('#iframe').contentFrame().getByRole('button', { name: 'Exercice 1' }).click()
  // const box = await page.locator('#iframe').contentFrame().locator('.minute-hand').boundingBox()
  // if (box !== null) {
  //   await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  //   await page.mouse.down()
  //   await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 10)
  //   await page.mouse.up()
  // }

  await page.waitForSelector('#iframe')
  await page.waitForTimeout(3_000) // attendre 3_000 ms de plus pour assurer le rendu
  if (page.frames().length > 0) {
    await Promise.all(
      page.frames().map((frame) => frame.waitForLoadState('networkidle')),
    )
  }

  const box = await page
    .locator('#iframe')
    .contentFrame()
    .locator('.minute-hand')
    .boundingBox()
  const box2 = await page
    .locator('#iframe')
    .contentFrame()
    .locator('#interactive-clockEx0Q0 > div > div > svg > text:nth-child(5)')
    .boundingBox()
  logIfVerbose('box', box)
  logIfVerbose('box2', box2)
  if (box !== null && box2 !== null) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2)
    await page.mouse.up()
  } else {
    logIfVerbose('Box/Box2 is null', box, box2)
  }
  // const start = await page.locator('#iframe').contentFrame().locator('.minute-hand')
  // console.log(start)
  // const end = await page.locator('#iframe').contentFrame().locator('#clockEx0Q0 > div > div > svg > text:nth-child(5)')
  // console.log(end)
  // await start.dragTo(end)
  // await page.pause()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Exercice 2' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('checkbox')
    .first()
    .check()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Exercice 3' })
    .click()
  await page.locator('#iframe').contentFrame().locator('.ML__content').click()
  await clickRobust(
    page
      .locator('#iframe')
      .contentFrame()
      .getByRole('button', { name: '6', exact: true }),
  )
  await clickRobust(
    page
      .locator('#iframe')
      .contentFrame()
      .getByRole('button', { name: '0', exact: true }),
  )
  await clickRobust(
    page
      .locator('#iframe')
      .contentFrame()
      .getByRole('button', { name: '0', exact: true }),
  )
  await clickRobust(
    page
      .locator('#iframe')
      .contentFrame()
      .getByRole('button', { name: '0', exact: true }),
  )
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Exercice 4' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('img', { name: 'Disque centre-rayon' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('#divFigure line')
    .nth(1)
    .click()
  await page.locator('#iframe').contentFrame().getByRole('textbox').fill('5')
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Valider' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Exercice 5' })
    .click()
  await page.locator('#iframe').contentFrame().getByText('Q R').first().click()
  await page.locator('#iframe').contentFrame().getByText('P Q').nth(1).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Exercice 6' })
    .click()
  const listeToClick = page
    .locator('#iframe')
    .contentFrame()
    .locator('#liste-deroulanteEx5Q0')
  await listeToClick.click()
  await listeToClick.locator('li', { hasText: 'somme' }).click()
  const listeEx5Q2 = page
    .locator('#iframe')
    .contentFrame()
    .locator('#liste-deroulanteEx5Q2')
  await listeEx5Q2.click()
  await listeEx5Q2.locator('li', { hasText: 'différence' }).click()

  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Exercice 7' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('#etiquetteEx6Q0I20')
    .dragTo(page.locator('#iframe').contentFrame().locator('#rectangleEx6Q0R1'))
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Vérifier la réponse' })
    .click()

  await page.waitForTimeout(2000) // attendre 2000 ms de plus pour assurer la sauvegarde

  const valueString = await page.evaluate(() =>
    localStorage.getItem('saveStudentAssignment'),
  )

  const value = JSON.parse(valueString ?? '')
  expect(value).not.toBe(null)
  expect(value.studentAssignment.length).toEqual(7)
  const responses = [
    { 'interactive-clockEx0Q0': '{"hour":12,"minute":15,"second":0}' },
    { Ex1Q0R0: '1', Ex1Q0R1: '0', Ex1Q0R2: '0', Ex1Q0R3: '0', Ex1Q0R4: '0' },
    { Ex2Q0: '6000' },
    {
      apigeomEx3F06GXX0:
        '{"apiGeomVersion":"3.0.20230508","xMin":-5.5,"yMin":-5.5,"scale":1,"pixelsPerUnit":30,"xScale":1,"yScale":1,"zoomLevel":1,"snapGrid":false,"point1":{"color":"currentColor","id":"point1","isDashed":false,"isHidden":false,"isVisible":true,"isSelectable":true,"isDeletable":false,"opacity":1,"thickness":2,"type":"Point","colorLabel":"currentColor","label":"B","labelDxInPixels":10,"labelDyInPixels":20,"labelIsVisible":true,"shape":"x","sizeInPixels":5,"x":1,"y":2},"point2":{"color":"currentColor","id":"point2","isDashed":false,"isHidden":false,"isVisible":true,"isSelectable":true,"isDeletable":false,"opacity":1,"thickness":2,"type":"Point","colorLabel":"currentColor","label":"S","labelDxInPixels":10,"labelDyInPixels":20,"labelIsVisible":true,"shape":"x","sizeInPixels":5,"x":-3,"y":2},"element0":{"color":"currentColor","id":"element0","isDashed":false,"isHidden":false,"isVisible":true,"isSelectable":true,"isDeletable":true,"opacity":1,"thickness":1,"type":"Circle","fillColor":"currentColor","fillOpacity":0.2,"idCenter":"point1","radius":5}}',
    },
    { cliquefigure1Ex4Q0: '1', cliquefigure0Ex4Q1: '1' },
    {
      'liste-deroulanteEx5Q0': 'somme',
      'liste-deroulanteEx5Q1': '',
      'liste-deroulanteEx5Q2': 'différence',
      'liste-deroulanteEx5Q3': '',
    },
    {
      rectangleDNDEx6Q0R1: 'etiquetteEx6Q0I20-clone-1740844199069',
      texteDNDEx6Q0R1: 'deux',
    },
  ]
  const apigeomCaptures: Record<string, string> = {}
  value.studentAssignment.forEach((assignment: any, i: number) => {
    const keys = Object.keys(assignment.answers)
    const keysRep = Object.keys(responses[i])
    expect(keys.length).toEqual(keysRep.length)
    keys.forEach((key: string, j: number) => {
      logIfVerbose('Question:', i)
      logIfVerbose('Response:', j)
      logIfVerbose('Key:', assignment.answers[key])
      expect(keysRep[j]).toEqual(key)
      if (key.includes('rectangleDND')) {
        expect(assignment.answers[key].split('-')[0]).toEqual(
          (responses[i] as any)[key].split('-')[0],
        )
      } else if (
        key.includes('apigeom') &&
        process.env.UPDATE_APIGEOM_SNAPSHOTS
      ) {
        apigeomCaptures[key] = assignment.answers[key]
      } else {
        logDiffContext(assignment.answers[key], (responses[i] as any)[key])
        expect(assignment.answers[key]).toEqual((responses[i] as any)[key])
      }
    })
  })
  if (
    process.env.UPDATE_APIGEOM_SNAPSHOTS &&
    Object.keys(apigeomCaptures).length > 0
  ) {
    writeFileSync(
      '/tmp/mathalea-apigeom-save.json',
      JSON.stringify(apigeomCaptures, null, 2),
    )
    logIfVerbose(
      '📸 Snapshots apigeom capturés dans /tmp/mathalea-apigeom-save.json',
    )
  }
  return true
}

if (process.env.CI) {
  // utiliser pour les tests d'intégration
  prefs.headless = true
  runTest(testV, import.meta.url, { pauseOnError: false })
} else {
  prefs.headless = false
  runTest(testV, import.meta.url, { pauseOnError: true })
}

// pnpm vitest --config tests/e2e/vitest.config.view.js --run tests\e2e\tests\view\view.capytale.save.test.ts
