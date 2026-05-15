import { expect } from '@playwright/test'
import fs from 'fs/promises'
import JSZip from 'jszip'
import { spawn } from 'node:child_process'
import type { Page } from 'playwright'
import { describe, test } from 'vitest'
import { findStatic, findUuid } from '../../helpers/filter'
import { createIssue } from '../../helpers/issue'
import { getFileLogger, log as lg, logError as lgE } from '../../helpers/log'
import prefs from '../../helpers/prefs.js'
import { runSeveralTests } from '../../helpers/run'

const logPDF = getFileLogger('exportPDF', { append: true })
const logPackage = getFileLogger('exportPackage', { append: true })

function log(...args: unknown[]) {
  lg(args)
  logPDF(args)
}

function logError(...args: unknown[]) {
  lgE(args)
  logPDF(args)
}

const UPLOAD_FOLDER = 'updatefile'
const UPLOAD_SUBFOLDER = 'output'

// file parameter retrieved from an input type=file
async function readZip(
  file: fs.FileHandle,
): Promise<Map<string, string | ArrayBuffer>> {
  const buffer = await fs.readFile(file)
  const files: Map<string, string | ArrayBuffer> = new Map<
    string,
    string | ArrayBuffer
  >()
  const zipper = new JSZip()
  const unzippedFiles = await zipper.loadAsync(buffer)
  const entries = Object.keys(unzippedFiles.files)
  for (const _filename of entries) {
    if (_filename !== 'images/') {
      if (_filename.includes('eps')) {
        files.set(
          _filename.replace('images/', ''),
          await unzippedFiles.files[_filename].async('string'),
        )
      } else if (_filename.includes('png')) {
        files.set(
          _filename.replace('images/', ''),
          await unzippedFiles.files[_filename].async('arraybuffer'),
        )
      } else {
        files.set(
          _filename.replace('images/', ''),
          await unzippedFiles.files[_filename].async('string'),
        )
      }
    }
  }
  return files
}

function getFilenameWithoutExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, '')
}

async function getLatexFile(page: Page, urlExercice: string) {
  // Coopmaths
  // Classique
  // ProfMaquette
  // ProfMaquette avec QrCode

  page.setDefaultTimeout(150000)

  const retries = 3 // Nombre de tentatives en cas d'erreur
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log(urlExercice)
      await page.goto(urlExercice)
      await page.waitForLoadState('networkidle')

      // const resu0 = await getLatexFileStyle(page, urlExercice, 'Coopmaths')
      // if (resu0 === 'KO') {
      //   return 'KO'
      // }
      // const resu1 = await getLatexFileStyle(page, urlExercice, 'Classique')
      // if (resu1 === 'KO') {
      //   return 'KO'
      // }

      const resu2 = await getLatexFileStyle(page, urlExercice, 'ProfMaquette')
      if (resu2 === 'KO') {
        return 'KO'
      }
      const urlPage = page.url()
      if (
        urlPage.includes('dnb') ||
        urlPage.includes('crpe') ||
        urlPage.includes('sti2d') ||
        urlPage.includes('bac') ||
        urlPage.includes('e3c')
      ) {
        return 'OK'
      }
      const resu3 = await getLatexFileStyle(page, urlExercice, 'Can')
      if (resu3 === 'KO') {
        return 'KO'
      }
      return 'OK'
    } catch (error) {
      logError('Attempt ' + attempt + ' failed: ' + error)
      if (attempt === retries) {
        logError('All attempts failed.')
        return 'KO'
      }
      log('Retrying...')
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Attendre 2 secondes avant de réessayer
    }
  }
}

async function getLatexFileStyle(
  page: Page,
  urlExercice: string,
  style: string,
) {
  log('style=' + style)
  let styleLocator = ''
  switch (style) {
    case 'Classique':
      styleLocator = 'input#Style0'
      break
    case 'ProfMaquette':
      styleLocator = 'input#Style1'
      break
    case 'Coopmaths':
      styleLocator = 'input#Style2'
      break
    case 'Can':
      styleLocator = 'input#Style3'
      break
    default:
      styleLocator = 'input#Style2'
  }
  await page.click(styleLocator)

  // await page.click('input#Style2') // style maquette

  await new Promise((resolve) => setTimeout(resolve, 200))

  const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
  page.click('button#downloadFullArchive')

  const download = await downloadPromise

  const downloadError = await download.failure()
  if (downloadError !== null) {
    logError('Error happened on download:', downloadError)
    throw new Error(downloadError)
  }

  log(download.suggestedFilename())

  const uuid = new URL(urlExercice).searchParams.get('uuid')

  let idPath = new URL(urlExercice).searchParams.get('id')
  idPath = idPath?.substring(0, idPath?.lastIndexOf('.')) || idPath
  const id = idPath?.split('/').reverse()[0]
  const startedPath = idPath?.split('/')[0].split('_')[0] || 'test'
  // console.log(uuid)

  try {
    await fs.access(UPLOAD_FOLDER)
  } catch (err) {
    await fs.mkdir(UPLOAD_FOLDER)
  }

  try {
    await fs.access(UPLOAD_FOLDER + '/' + UPLOAD_SUBFOLDER)
  } catch (err) {
    await fs.mkdir(UPLOAD_FOLDER + '/' + UPLOAD_SUBFOLDER)
  }

  try {
    await fs.access(UPLOAD_FOLDER + '/' + UPLOAD_SUBFOLDER + '/' + startedPath)
  } catch (err) {
    await fs.mkdir(UPLOAD_FOLDER + '/' + UPLOAD_SUBFOLDER + '/' + startedPath)
  }

  const downloadedFilePath =
    UPLOAD_FOLDER +
    '/' +
    UPLOAD_SUBFOLDER +
    '/' +
    startedPath +
    '/' +
    id +
    style +
    (id === uuid ? '_' : '_' + uuid + '_') +
    download.suggestedFilename()

  const folder =
    UPLOAD_FOLDER +
    '/' +
    UPLOAD_SUBFOLDER +
    '/' +
    startedPath +
    '/' +
    id +
    style +
    (id === uuid ? '_' : '_' + uuid + '_') +
    Date.now() +
    '-' +
    Math.round(Math.random() * 1e9)
  await fs.mkdir(folder)

  await download.saveAs(downloadedFilePath)

  let file: string | undefined
  if (download.suggestedFilename().endsWith('.tex')) {
    file = download.suggestedFilename()
    await fs.copyFile(downloadedFilePath, folder + '/' + file)
  } else {
    const zip = await fs.open(downloadedFilePath)
    const unzipfiles: Map<string, string | ArrayBuffer> = await readZip(zip)
    await zip.close()

    const filesPromise: Promise<unknown>[] = []
    unzipfiles.forEach((value, key) => {
      if (value instanceof ArrayBuffer) {
        const buffer = Buffer.from(value)
        filesPromise.push(fs.writeFile(folder + '/' + key, buffer))
      } else {
        filesPromise.push(fs.writeFile(folder + '/' + key, value))
      }
    })
    await Promise.all(filesPromise)

    file = Array.from(unzipfiles.keys()).find(
      (ele) => ele === 'main.tex' || ele === 'test.tex',
    )
  }

  await fs.rm(downloadedFilePath, { recursive: true, force: true })

  const controller = new AbortController()
  const signal = controller.signal

  const trace: string[] = []
  const launch = new Promise((resolve, reject) => {
    log(folder + '/' + file)
    const xelatex = spawn('lualatex', ['--halt-on-error', '' + file], {
      cwd: folder + '/',
      signal,
    })
    const timer = setTimeout(
      () => {
        controller.abort()
      },
      5 * 60 * 1000,
    )
    xelatex.stdout.on('data', function (result) {
      const out = Buffer.from(result, 'utf-8').toString()
      trace.push(out.replaceAll('\r\n', ''))
      if (trace.length > 30) {
        trace.shift() // supprime le premier élément
        // console.log(trace.join(' '))
      }
    })
    xelatex.stderr.on('data', function (result) {
      const out = Buffer.from(result, 'utf-8').toString()
      log(out)
    })
    xelatex.on('error', function (err) {
      reject(err)
    })
    xelatex.on('close', (code: number) => {
      clearTimeout(timer)
      if (code !== 0) {
        log(code)
        reject(code)
      } else {
        resolve(code)
      }
    })
  })

  const code = await launch.catch((err) => {
    log(err)
    return -1
  })
  log('code:' + code)
  if (code === 0) {
    await fs.copyFile(
      folder + '/' + getFilenameWithoutExtension('' + file) + '.pdf',
      UPLOAD_FOLDER +
        '/' +
        UPLOAD_SUBFOLDER +
        '/' +
        startedPath +
        '/' +
        id +
        style +
        (id === uuid ? '_' : '_' + uuid + '_') +
        getFilenameWithoutExtension(download.suggestedFilename()) +
        '.pdf',
    )
    await fs.rm(folder + '/', { recursive: true, force: true })
    return 'OK'
  } else {
    log(trace.join('\n'))
    await createIssue(urlExercice, trace, ['pdfexport'], log)
    return 'KO'
  }
  // const formData = new FormData()
  // unzipfiles.forEach((value, key) => {
  //   // console.log(`m[${key}] = ${value}`);
  //   formData.append('name', key)
  //   formData.append('originalname', key)
  //   formData.append('file', new Blob(new Array(value)), key)
  // })

  // let resultReq = ''

  // await fetch('http://192.168.1.11:3000/generate', {
  //   method: 'POST',
  //   body: formData,
  //   signal: AbortSignal.timeout(60 * 1000)
  // }).then((res : Response) => {
  //   log('response.status =' + res.status)
  //   if (res.status === 200) {
  //     resultReq = 'OK'
  //   } else {
  //     resultReq = 'KO'
  //   }
  //   return res.blob()
  // }).then(blob => {
  //   log(resultReq)
  //   return blob.arrayBuffer()
  // }).then(buffer => {
  //   fs.writeFile(UPLOAD_FOLDER + '/' + id + '_' + uuid + (resultReq === 'OK' ? '.pdf' : '.log'), new Uint8Array(buffer))
  // }).catch((err) => {
  //   logError('Error occured' + err)
  //   logError(err.name)
  //   resultReq = 'KO'
  //   logError(resultReq)
  // })
}

async function testRunAllLots(filter: string) {
  // return testAll(page, '6e/6G23')
  const uuids =
    filter.includes('dnb') ||
    filter.includes('crpe') ||
    filter.includes('sti2d') ||
    filter.includes('bac') ||
    filter.includes('e3c')
      ? await findStatic(filter)
      : await findUuid(filter)
  for (let i = 0; i < uuids.length && i < 300; i += 20) {
    const ff: ((page: Page) => Promise<boolean>)[] = []
    for (let k = i; k < i + 20 && k < uuids.length; k++) {
      const myName = 'test' + uuids[k][1]
      const f = async function (page: Page) {
        // Listen for all console logs
        if (k === i) {
          // seulement sur la première page Web, les autres c'est la même en faite
          page.on('console', (msg) => {
            logPDF(msg.text())
            if (msg.text().includes('PACKAGETEST:')) {
              logPackage(msg.text())
            }
          })
        }
        const hostname = local
          ? `http://localhost:${process.env.CI ? '80' : '5173'}/alea/`
          : 'https://coopmaths.fr/alea/'
        log(`uuid=${uuids[k][0]} exo=${uuids[k][1]} i=${k} / ${uuids.length}`)
        const resultReq = await getLatexFile(
          page,
          `${hostname}?uuid=${uuids[k][0]}&id=${uuids[k][1].substring(0, uuids[k][1].lastIndexOf('.')) || uuids[k][1]}&alea=${alea}&v=latex&testCI`,
        )
        log(`Resu: ${resultReq} uuid=${uuids[i][0]} exo=${uuids[k][1]}`)
        return resultReq === 'OK'
      }
      Object.defineProperty(f, 'name', { value: myName, writable: false })
      ff.push(f)
    }
    runSeveralTests(ff, import.meta.url, {
      pauseOnError: false,
      silent: false,
      debug: false,
    })
  }
}
/**
 * Attention, il faut le compilateur lualatex installé sur l'ordinateur
 * pour ensuite les compiler avec lualatex...
 */

const alea = 'e906e'
const local = true

if (process.env.NIV !== null && process.env.NIV !== undefined) {
  // utiliser pour les tests d'intégration
  const filter = (process.env.NIV as string).replaceAll(' ', '')
  prefs.headless = true
  log(filter)
  testRunAllLots(filter)
} else if (
  process.env.CHANGED_FILES !== null &&
  process.env.CHANGED_FILES !== undefined
) {
  const changedFiles = process.env.CHANGED_FILES?.split('\n') ?? []
  log(changedFiles)
  prefs.headless = true
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
  log(filtered)
  if (filtered.length === 0) {
    // aucun fichier concerné.. on sort
    describe('dummy', () => {
      test('should pass', () => {
        expect(true).toBe(true)
      })
    })
  } else {
    filtered.forEach((file) => {
      const filter = file.replaceAll(' ', '')
      testRunAllLots(filter)
    })
  }
} else {
  // testRunAllLots('dnb')
  // testRunAllLots('c3')
  testRunAllLots('can')
  testRunAllLots('3e')
  testRunAllLots('4e')
  testRunAllLots('5e')
  testRunAllLots('6e')
  testRunAllLots('2e')
  testRunAllLots('1e')
  // testRunAllLots('bac')
  // testRunAllLots('6e/6G10')
}
