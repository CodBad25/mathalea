import { expect } from '@playwright/test'
import { writeFileSync } from 'fs'
import path from 'path'
import type { Page } from 'playwright'
import { fileURLToPath } from 'url'
import prefs from '../../helpers/prefs.js'
import { runTest } from '../../helpers/run'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
      path: path.resolve(
        __dirname,
        '../../mock/mock.capytale.save.can.module.js',
      ),
    })
  })

  // Go to the page
  page.setDefaultTimeout(60000) // Set timeout to 60 seconds
  await page.goto(parentUrl)

  await expect(page.locator('body')).toContainText('bonjour')
  await page.waitForSelector('#iframe')
  await page.waitForTimeout(3000) // attendre 3000 ms de plus pour assurer le rendu
  if (page.frames().length > 0) {
    await Promise.all(
      page.frames().map((frame) => frame.waitForLoadState('networkidle')),
    )
  }
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: ' Démarrer' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('#time-display-1')
    .waitFor({ state: 'visible' })
  // question 1
  const box = await page
    .locator('#iframe')
    .contentFrame()
    .locator('.minute-hand')
    .boundingBox()
  const box2 = await page
    .locator('#iframe')
    .contentFrame()
    .locator('#clockEx0Q0 > div > div > svg > text:nth-child(5)')
    .boundingBox()
  if (box !== null && box2 !== null) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2)
    await page.mouse.up()
  } else {
    console.log('Box/Box2 is null')
  }
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 2
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('checkbox')
    .first()
    .check()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 3
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: '6' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: '0' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: '0' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
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
    .getByRole('img', { name: 'Déplacer les points' })
    .click()
  const box3 = await page
    .locator('#iframe')
    .contentFrame()
    .locator('#divFigure line')
    .nth(1)
    .boundingBox()
  if (box3 !== null) {
    await page.mouse.click(box3.x + box3.width / 2, box3.y + box3.height / 2)
  } else {
    console.log('Box3 is null')
  }
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()
  // question 5
  await page.locator('#iframe').contentFrame().getByText('Q R').nth(2).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 6
  await page.locator('#iframe').contentFrame().getByText('P Q').nth(1).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 7
  const liste0 = page
    .locator('#iframe')
    .contentFrame()
    .locator('liste-deroulante#ex5Q0')
  await liste0.click()
  await liste0.locator('li', { hasText: 'une différence' }).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 8
  const liste1 = page
    .locator('#iframe')
    .contentFrame()
    .locator('liste-deroulante#ex5Q1')
  await liste1.click()
  await liste1.locator('li', { hasText: 'une différence' }).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 9
  const liste2 = page
    .locator('#iframe')
    .contentFrame()
    .locator('liste-deroulante#ex5Q2')
  await liste2.click()
  await liste2.locator('li', { hasText: 'une différence' }).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 10
  const liste3 = page
    .locator('#iframe')
    .contentFrame()
    .locator('liste-deroulante#ex5Q3')
  await liste3.click()
  await liste3.locator('li', { hasText: 'une différence' }).click()
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  // question 11
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('#etiquetteEx6Q0I20')
    .dragTo(page.locator('#iframe').contentFrame().locator('#rectangleEx6Q0R1'))
  await page
    .locator('#iframe')
    .contentFrame()
    .locator('.bxs-chevron-right')
    .click()

  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Rendre la copie' })
    .click()
  await page.waitForTimeout(500)
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Terminer' })
    .click()
  await page
    .locator('#iframe')
    .contentFrame()
    .getByRole('button', { name: 'Accéder aux solutions' })
    .click()

  await page.waitForTimeout(2000) // attendre 2000 ms de plus pour assurer la sauvegarde
  const valueString = await page.evaluate(() =>
    localStorage.getItem('saveStudentAssignment'),
  )
  const value = JSON.parse(valueString ?? '')
  expect(value).not.toBe(null)
  expect(value.studentAssignment.length).toEqual(11)
  const responses = [
    { clockEx0Q0: '12h15' },
    {
      Ex1Q0R0: '1',
      Ex1Q0R1: '0',
      Ex1Q0R2: '0',
      Ex1Q0R3: '0',
      Ex1Q0R4: '0',
      Ex1Q0: '$20\\,000\\,000\\,000$',
    },
    { Ex2Q0: '600' },
    {
      apigeomEx3F06GXX0:
        '{\n  "apiGeomVersion": "3.0.20230508",\n  "options": {\n    "autoPositionLabels": false,\n    "animationStepInterval": 3000,\n    "automaticUserMessage": true,\n    "borderSize": 0.2,\n    "color": "currentColor",\n    "colorPointPolygon": "none",\n    "changeColorChangeActionToSetOptions": true,\n    "discFillOpacity": 0.2,\n    "decimalSeparator": "auto",\n    "displayDigits": 1,\n    "displayDigitsAngle": 0,\n    "displayGrid": false,\n    "distanceWithoutNewPoint": 0.2,\n    "figureHasBorder": true,\n    "fillColor": "none",\n    "fillColorAndBorderColorAreSame": true,\n    "fillOpacity": 0.2,\n    "gridWithTwoPointsOnSamePosition": true,\n    "fontSize": "1em",\n    "isHandDrawn": false,\n    "isDashed": false,\n    "labelAutomaticForPoints": false,\n    "labelPointAfterCreation": false,\n    "labelDxInPixels": 15,\n    "labelDyInPixels": 15,\n    "latexHeight": 12,\n    "labelIsVisible": true,\n    "latexWidth": 18,\n    "limitNumberOfElement": {},\n    "mark": "||",\n    "segmentShape": "",\n    "moveTextGrid": 15,\n    "pointDescriptionWithCoordinates": true,\n    "showCoordsInContextMenu": false,\n    "pointSize": 5,\n    "thickness": 1,\n    "shape": "x",\n    "shapeForPolygon": "x",\n    "thicknessForPoint": 2,\n    "tmpColor": "gray",\n    "tmpFillColor": "rgba(241, 89, 41, 0.5)",\n    "tmpFillOpacity": 0.2,\n    "tmpIsDashed": true,\n    "tmpThickness": 1,\n    "tmpShape": "x",\n    "trace": false,\n    "visibleButtons": [\n      "DRAG",\n      "HIDE",\n      "REMOVE",\n      "POINT",\n      "POINT_ON",\n      "POINT_INTERSECTION",\n      "MIDDLE",\n      "SEGMENT",\n      "LINE",\n      "RAY",\n      "POLYGON",\n      "LINE_PARALLEL",\n      "LINE_PERPENDICULAR",\n      "DRAW_ANGLE",\n      "PERPENDICULAR_BISECTOR",\n      "BISECTOR_BY_POINTS",\n      "CIRCLE_CENTER_POINT",\n      "CIRCLE_RADIUS",\n      "REFLECTION_OVER_LINE",\n      "REFLECTION",\n      "ROTATE",\n      "TRANSLATION",\n      "DILATE",\n      "VECTOR",\n      "CURSOR",\n      "GRID",\n      "GRAPH",\n      "SUB_REPERE",\n      "SET_OPTIONS",\n      "FILL",\n      "ARC_BY_THREE_POINTS",\n      "MARK_BETWEEN_POINTS",\n      "MESURE_SEGMENT",\n      "MESURE_ANGLE",\n      "MESURE_AREA",\n      "NAME_POINT",\n      "EDIT",\n      "IMAGE",\n      "TEXT_TEMPLATE",\n      "SHAKE",\n      "MOVE_LABEL",\n      "DRAG_ALL",\n      "ZOOM_OUT",\n      "ZOOM_IN",\n      "SAVE",\n      "OPEN",\n      "UNDO",\n      "REDO",\n      "DOWNLOAD_LATEX_SVG",\n      "DESCRIPTION",\n      "OPTIONS"\n    ]\n  },\n  "xMin": -5.5,\n  "yMin": -5.5,\n  "scale": 1,\n  "pixelsPerUnit": 30,\n  "xScale": 1,\n  "yScale": 1,\n  "zoomLevel": 1,\n  "snapGrid": false,\n  "point1": {\n    "color": "currentColor",\n    "id": "point1",\n    "isDashed": false,\n    "isHidden": false,\n    "isVisible": true,\n    "isSelectable": true,\n    "isDeletable": false,\n    "opacity": 1,\n    "thickness": 2,\n    "type": "Point",\n    "colorLabel": "currentColor",\n    "label": "B",\n    "labelDxInPixels": 10,\n    "labelDyInPixels": 20,\n    "labelIsVisible": true,\n    "shape": "x",\n    "sizeInPixels": 5,\n    "x": 1,\n    "y": 2\n  },\n  "point2": {\n    "color": "currentColor",\n    "id": "point2",\n    "isDashed": false,\n    "isHidden": false,\n    "isVisible": true,\n    "isSelectable": true,\n    "isDeletable": false,\n    "opacity": 1,\n    "thickness": 2,\n    "type": "Point",\n    "colorLabel": "currentColor",\n    "label": "S",\n    "labelDxInPixels": 10,\n    "labelDyInPixels": 20,\n    "labelIsVisible": true,\n    "shape": "x",\n    "sizeInPixels": 5,\n    "x": -3,\n    "y": 2\n  },\n  "element0": {\n    "color": "currentColor",\n    "id": "element0",\n    "isDashed": false,\n    "isHidden": false,\n    "isVisible": true,\n    "isSelectable": true,\n    "isDeletable": true,\n    "opacity": 1,\n    "thickness": 1,\n    "type": "Circle",\n    "fillColor": "currentColor",\n    "fillOpacity": 0.2,\n    "idCenter": "point1",\n    "radius": 5\n  }\n}',
    },
    { cliquefigure2Ex4Q0: '1' },
    { cliquefigure0Ex4Q1: '1' },
    { ex5Q0: 'différence' },
    { ex5Q1: 'différence' },
    { ex5Q2: 'différence' },
    { ex5Q3: 'différence' },
    {
      rectangleDNDEx6Q0R1: 'etiquetteEx6Q0I20-clone-1741033348514',
      texteDNDEx6Q0R1: 'deux',
      Ex6Q0: 'deux',
    },
  ]
  console.log(value.studentAssignment)
  // await page.pause()
  const apigeomCaptures: Record<string, string> = {}
  value.studentAssignment.forEach((assignment: any, i: number) => {
    const keys = Object.keys(assignment.answers)
    const keysRep = Object.keys(responses[i])
    expect(keys.length).toEqual(keysRep.length)
    keys.forEach((key: string, j: number) => {
      console.log('Question:', i)
      console.log('Response:', j)
      console.log('Key:', assignment.answers[key])
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
      } /* else if (key.includes('apigeom')) {
        const json = assignment.answers[key]
        const figure = JSON.parse(json)
        const figureRep = JSON.parse((responses[i] as any)[key])
        expect(figure.xMin).toEqual(figureRep.xMin)
        expect(figure.yMin).toEqual(figureRep.yMin)
        expect(figure.pixelsPerUnit).toEqual(figureRep.pixelsPerUnit)
        expect(figure.point1.x).toEqual(figureRep.point1.x)
        expect(figure.point1.y).toEqual(figureRep.point1.y)
        expect(figure.point2.x).toEqual(figureRep.point2.x)
        expect(figure.point2.y).toEqual(figureRep.point2.y)
        expect(figure.element0.radius).toEqual(figureRep.element0.radius)
        expect(figure.element0.idCenter).toEqual(figureRep.element0.idCenter)
        expect(figure.element0.type).toEqual(figureRep.element0.type)
        expect(figure.element0.fillColor).toEqual(figureRep.element0.fillColor)
        expect(figure.element0.fillOpacity).toEqual(
          figureRep.element0.fillOpacity,
        )
        expect(figure.element0.thickness).toEqual(figureRep.element0.thickness)
      } */ else {
        expect(assignment.answers[key]).toEqual((responses[i] as any)[key])
      }
    })
  })
  if (
    process.env.UPDATE_APIGEOM_SNAPSHOTS &&
    Object.keys(apigeomCaptures).length > 0
  ) {
    writeFileSync(
      '/tmp/mathalea-apigeom-save-can.json',
      JSON.stringify(apigeomCaptures, null, 2),
    )
    console.log(
      '📸 Snapshots apigeom capturés dans /tmp/mathalea-apigeom-save-can.json',
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

// pnpm vitest --config tests/e2e/vitest.config.view.js --run tests\e2e\tests\view\view.capytale.save.can.test.ts
