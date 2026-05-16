import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it, test, vi } from 'vitest'
import type { IExercice } from '../../../../src/lib/types'
import { findStatic, findUuid } from '../../helpers/filter.js'
import { getFileLogger, log as lg, logError as lgE } from '../../helpers/log'

beforeAll(() => {
  const proto = SVGElement.prototype as any
  if (!proto.getBBox) {
    proto.getBBox = function () {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
  }
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      }
    },
  })
})

vi.mock('../../../../src/lib/3d/3d_dynamique/Canvas3DElement', () => ({
  ajouteCanvas3d: vi.fn((args) => {
    return 'canvas3DElement-mock:' + args.length
  }),
}))

vi.mock('../../../../src/lib/3d/3d_dynamique/solidesThreeJs', () => ({
  sphericalToCartesian: vi.fn((args) => {
    return 'sphericalToCartesian-mock:' + args.length
  }),
}))

vi.mock('../../../../src/lib/components/version', () => ({
  fetchServerVersion: vi.fn(() => Promise.resolve('1.0.0')),
  checkForServerUpdate: vi.fn(() => Promise.resolve(false)),
}))

vi.mock('../../../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('apigeom', async (original) => {
  const real = await original()

  // On étend l'original en patchant APP_VERSION **dans** le module
  ;(globalThis as any).APP_VERSION = 'test'

  return real
})

const { mathaleaLoadExerciceFromUuid } =
  await import('../../../../src/lib/mathalea')

const logConsole = getFileLogger('exportConsole', { append: true })

function log(...args: unknown[]) {
  lg(args)
  logConsole(args)
}

function logError(...args: unknown[]) {
  lgE(args)
  logConsole(args)
}

function logDebug(...args: unknown[]) {
  log(args)
  if (
    process.env.CI &&
    process.env.DEBUG !== null &&
    process.env.DEBUG !== undefined
  ) {
    if ((process.env.DEBUG as string).replaceAll(' ', '') === 'DEBUG') {
      log(args)
    }
  }
}

function sampleSup<T extends Record<number, any>>(sup: T): number[] {
  const keys = Object.keys(sup)
    .map(Number)
    .sort((a, b) => a - b)
  const n = keys.length

  if (n <= 3) {
    // Tous les éléments
    return keys
  } else {
    // 5 éléments : première, dernière et 3 intermédiaires
    const first = keys[0]
    const last = keys[n - 1]

    // On prend 1au milieu
    const step = (n - 1) / 2
    const middle = keys[Math.round(step)]

    // Fusion et supprimer doublons si step arrondi coïncide avec first/last
    const sampled = Array.from(new Set([first, middle, last]))
    return sampled
  }
}

function sampleSupWithFallback<T extends Record<number, any>>(
  sup: T,
): Array<number | undefined> {
  const sampled = sampleSup(sup)
  return sampled.length > 0 ? sampled : [undefined]
}

/**
 * Extrait les couples { numéro : label } à partir
 * d’un texte de type :
 * "Nombres séparés par des tirets :
 * 1 : Lancers de dés
 * 2 : Notes
 * ..."
 */
function parseMappingFromText(text: string): Record<number, string> {
  const lines = text.split('\n')
  const mapping: Record<number, string> = {}

  for (const line of lines) {
    const match = line.trim().match(/^(\d+)\s*:\s*(.+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      const label = match[2].trim()
      mapping[num] = label
    }
  }

  return mapping
}

function mockConsole() {
  const logs: Record<string, string[][]> = { log: [], warn: [], error: [] }

  const logSpy = vi
    .spyOn(console, 'log')
    .mockImplementation((...args) => logs.log.push(args))
  const warnSpy = vi
    .spyOn(console, 'warn')
    .mockImplementation((...args) => logs.warn.push(args))
  const errSpy = vi
    .spyOn(console, 'error')
    .mockImplementation((...args) => logs.error.push(args))

  return {
    logs,
    restore: () => {
      logSpy.mockRestore()
      warnSpy.mockRestore()
      errSpy.mockRestore()
    },
  }
}

export function createURL(ex: IExercice) {
  const url = new URL('https://coopmaths.fr/alea')
  url.searchParams.append('uuid', ex.uuid)
  if (ex.id != null) url.searchParams.append('id', ex.id)
  if (ex.nbQuestions !== undefined)
    url.searchParams.append('n', ex.nbQuestions.toString())
  if (ex.duration != null) url.searchParams.append('d', ex.duration.toString())
  if (ex.sup != null) url.searchParams.append('s', ex.sup)
  if (ex.sup2 != null) url.searchParams.append('s2', ex.sup2)
  if (ex.sup3 != null) url.searchParams.append('s3', ex.sup3)
  if (ex.sup4 != null) url.searchParams.append('s4', ex.sup4)
  if (ex.sup5 != null) url.searchParams.append('s5', ex.sup5)
  if ((ex as any).versionQcm != null)
    url.searchParams.append('qcm', String((ex as any).versionQcm))
  if (ex.interactif) url.searchParams.append('i', '1')
  if (ex.correctionDetaillee) url.searchParams.append('cd', '1')
  if (ex.nbCols && ex.nbCols > 1)
    url.searchParams.append('cols', ex.nbCols.toString())
  if (ex.seed != null) url.searchParams.append('alea', ex.seed)
  return url.toString()
}

const alea = 'e906e'

async function getConsoleTest(uuid: string, urlExercice: string) {
  log(urlExercice)

  const exercice = await mathaleaLoadExerciceFromUuid(uuid)
  // exercice may be null/undefined or contain an error message in its titre; guard safely
  if (
    !exercice ||
    (exercice as any)?.titre?.includes('Veuillez actualiser la page')
  ) {
    logError(`Exercice introuvable pour l'uuid: ${uuid}`)
    return 'KO'
  }
  exercice.uuid = uuid
  exercice.seed = alea
  exercice.interactif = true
  exercice.numeroExercice = 1
  exercice.nbQuestions = 10

  logDebug(`Chargement de ${uuid}, ${urlExercice}`)
  // sup
  const sup: Record<number, string | boolean | number> = {}
  if (
    Array.isArray(exercice.besoinFormulaireTexte) &&
    exercice.besoinFormulaireTexte.length >= 2
  ) {
    // merge the parsed mapping into the sup record
    const values = parseMappingFromText(exercice.besoinFormulaireTexte[1])
    // 👉 { 1: 'Lancers de dés', 2: 'Notes', 3: 'Températures', ... }
    Object.keys(values).forEach((key) => {
      sup[parseInt(key, 10)] = parseInt(key, 10)
    })
  } else if (
    Array.isArray(exercice.besoinFormulaireNumerique) &&
    exercice.besoinFormulaireNumerique.length > 0
  ) {
    let max =
      typeof exercice.besoinFormulaireNumerique[1] === 'number'
        ? exercice.besoinFormulaireNumerique[1]
        : parseInt(exercice.besoinFormulaireNumerique[1])
    if (isNaN(max)) {
      window.notify(
        `Exercice ${exercice.uuid} : besoinFormulaireNumerique[1] is NaN`,
        { formulaire: exercice.besoinFormulaireNumerique },
      )
    }
    max = isNaN(max) ? 2 : max
    for (let i = 0; i < max; i++) {
      sup[i] = i + 1
    }
  } else if (exercice.besoinFormulaireCaseACocher) {
    sup[0] = true
    sup[1] = false
  }
  // log('sup=' + JSON.stringify(sup))

  // sup2
  const sup2: Record<number, string | boolean | number> = {}
  if (
    Array.isArray(exercice.besoinFormulaire2Texte) &&
    exercice.besoinFormulaire2Texte.length >= 2
  ) {
    // merge the parsed mapping into the sup record
    const values = parseMappingFromText(exercice.besoinFormulaire2Texte[1])
    // 👉 { 1: 'Lancers de dés', 2: 'Notes', 3: 'Températures', ... }
    Object.keys(values).forEach((key) => {
      sup2[parseInt(key, 10)] = parseInt(key, 10)
    })
  } else if (
    Array.isArray(exercice.besoinFormulaire2Numerique) &&
    exercice.besoinFormulaire2Numerique.length > 0
  ) {
    let max =
      typeof exercice.besoinFormulaire2Numerique[1] === 'number'
        ? exercice.besoinFormulaire2Numerique[1]
        : parseInt(exercice.besoinFormulaire2Numerique[1])
    if (isNaN(max)) {
      window.notify(
        `Exercice ${exercice.uuid} : besoinFormulaire2Numerique[1] is NaN`,
        { formulaire: exercice.besoinFormulaire2Numerique },
      )
    }
    max = isNaN(max) ? 2 : max
    for (let i = 0; i < max; i++) {
      sup2[i] = i + 1
    }
  } else if (exercice.besoinFormulaire2CaseACocher) {
    sup2[0] = true
    sup2[1] = false
  }
  // log('sup2=' + JSON.stringify(sup2))

  // sup3
  const sup3: Record<number, string | boolean | number> = {}
  if (
    Array.isArray(exercice.besoinFormulaire3Texte) &&
    exercice.besoinFormulaire3Texte.length >= 2
  ) {
    // merge the parsed mapping into the sup record
    const values = parseMappingFromText(exercice.besoinFormulaire3Texte[1])
    // 👉 { 1: 'Lancers de dés', 2: 'Notes', 3: 'Températures', ... }
    Object.keys(values).forEach((key) => {
      sup3[parseInt(key, 10)] = parseInt(key, 10)
    })
  } else if (
    Array.isArray(exercice.besoinFormulaire3Numerique) &&
    exercice.besoinFormulaire3Numerique.length > 0
  ) {
    let max =
      typeof exercice.besoinFormulaire3Numerique[1] === 'number'
        ? exercice.besoinFormulaire3Numerique[1]
        : parseInt(exercice.besoinFormulaire3Numerique[1])
    if (isNaN(max)) {
      window.notify(
        `Exercice ${exercice.uuid} : besoinFormulaire3Numerique[1] is NaN`,
        { formulaire: exercice.besoinFormulaire3Numerique },
      )
    }
    max = isNaN(max) ? 2 : max
    for (let i = 0; i <= max; i++) {
      sup3[i] = i + 1
    }
  } else if (exercice.besoinFormulaire3CaseACocher) {
    sup3[0] = true
    sup3[1] = false
  }
  // log('sup3=' + JSON.stringify(sup3))

  for (let k = 0; k < 2; k++) {
    exercice.interactif = k === 0
    log('interactif=' + exercice.interactif)
    for (const i of [1, 10]) {
      exercice.nbQuestions = i
      log('nbQuestions=' + exercice.nbQuestions)
      const keysToUse = sampleSupWithFallback(sup)
      for (const keySup of keysToUse) {
        if (keySup === undefined) {
          exercice.sup = undefined
        } else {
          exercice.sup = sup[keySup]
        }
        log('sup=' + exercice.sup)
        for (const keySup2 of sampleSupWithFallback(sup2)) {
          if (keySup2 === undefined) {
            exercice.sup2 = undefined
          } else {
            exercice.sup2 = sup2[keySup2]
          }
          for (const keySup3 of sampleSupWithFallback(sup3)) {
            if (keySup3 === undefined) {
              exercice.sup3 = undefined
            } else {
              exercice.sup3 = sup3[keySup3]
            }
            const signature = [
              'uuuid:' + exercice.uuid,
              'ssed:' + exercice.seed,
              'sup:' + exercice.sup,
              'sup2:' + exercice.sup2,
              'sup3:' + exercice.sup3,
              'sup4:' + exercice.sup4,
              'sup5:' + exercice.sup5,
              'cd:' + exercice.correctionDetaillee,
              'i:' + exercice.interactif,
              'nbQs:' + exercice.nbQuestions,
              'numeroEx:' + exercice.numeroExercice,
            ]
              .map(String)
              .join(':')
            // log('sig:' + signature)
            const c = mockConsole()
            try {
              exercice.nouvelleVersionWrapper()
            } catch (e) {
              logError(
                `Exception levée pour exercice ${exercice.uuid} avec signature ${signature}:`,
                e,
              )
              throw e
            }
            c.restore()
            if (c.logs.error.length > 0) {
              logError(
                `Errors for exercice ${exercice.uuid} with signature ${signature}:`,
                c.logs.error,
              )
              logError(
                `URL: for exercice ${exercice.uuid} with signature ${signature}:`,
                createURL(exercice),
              )
            }
            if (c.logs.log.length > 0) {
              const filtered = c.logs.log.filter(
                (msg) =>
                  !msg.filter((item) =>
                    String(item)
                      .toLowerCase()
                      .includes('figure destroyed successfully'),
                  ),
              )
              c.logs.log = filtered
              if (filtered.length > 0) {
                logError(
                  `logs for exercice ${exercice.uuid} with signature ${signature}:`,
                  filtered,
                )
                logError(
                  `URL: for exercice ${exercice.uuid} with signature ${signature}:`,
                  createURL(exercice),
                )
              }
            }
            if (c.logs.warn.length > 0) {
              logError(
                `warns for exercice ${exercice.uuid} with signature ${signature}:`,
                c.logs.warn,
              )
              logError(
                `URL: for exercice ${exercice.uuid} with signature ${signature}:`,
                createURL(exercice),
              )
            }
            if (exercice.listeQuestions.length !== i) {
              logError(
                `Waring : number of questions for exercice ${exercice.uuid} with signature ${signature}: expected ${i}, got ${exercice.listeQuestions.length}`,
              )
              logError(
                `URL: for exercice ${exercice.uuid} with signature ${signature}:`,
                createURL(exercice),
              )
            }
            expect(c.logs.error.length, signature).toBe(0)
            expect(c.logs.log.length, signature).toBe(0)
            expect(c.logs.warn.length, signature).toBe(0)
            exercice.reinit()
            // expect(exercice.listeQuestions.length).toBe(i)
          }
        }
      }
    }
  }
  return 'OK'
}

export function runSeveralTests(
  tests: (() => Promise<boolean>)[],
  metaUrl: string,
) {
  const filename = fileURLToPath(metaUrl)
  const testsSuiteDescription = '' // Ajoute une description intermédiaire dans le stdout si besoin

  describe(testsSuiteDescription, async () => {
    let result: boolean
    const stop = false

    for (const test of tests) {
      it(`${test.name} works`, async ({ skip }) => {
        if (stop) return skip()
        result = false
        const promise = test()
        if (!(promise instanceof Promise))
          throw Error(
            `${filename} ne contient pas de fonction test qui prend une page et retourne une promesse`,
          )
        result = await promise
        expect(result).toBe(true) // si le résultat n'est pas bon, ça lève une exception
      })
    }
  })
}

async function testRunAllLots(filter: string) {
  log(filter)
  const uuids = filter.includes('dnb')
    ? await findStatic(filter)
    : await findUuid(filter)

  // Exclure les exercices contenant "test" ou "beta" dans leur nom
  const filteredUuids = uuids.filter(([uuid, name]) => {
    const nameLower = name.toLowerCase()
    return !nameLower.includes('test') && !nameLower.includes('beta')
  })

  log(filteredUuids)
  if (filteredUuids.length === 0) {
    log(`Aucun uuid trouvé pour le filtre '${filter}'`)
    describe('no-parameter-warning', () => {
      test.skip(`Aucun uuid trouvé pour le filtre '${filter}'`, () => {
        // This test is skipped to show a warning instead of pass/fail
      })
    })
  }
  for (let i = 0; i < filteredUuids.length && i < 300; i += 20) {
    const ff: (() => Promise<boolean>)[] = []
    for (let k = i; k < i + 20 && k < filteredUuids.length; k++) {
      const myName = filteredUuids[k][1]
      const f = async function () {
        log(filter)
        log(
          `uuid=${filteredUuids[k][0]} exo=${filteredUuids[k][1]} i=${k} / ${filteredUuids.length}`,
        )
        try {
          const resultReq = await getConsoleTest(
            filteredUuids[k][0],
            `uuid=${filteredUuids[k][0]}&id=${filteredUuids[k][1].substring(0, filteredUuids[k][1].lastIndexOf('.')) || filteredUuids[k][1]}&alea=${alea}&testCI`,
          )
          log(
            `Resu: ${resultReq} uuid=${filteredUuids[k][0]} exo=${filteredUuids[k][1]}`,
          )
          return resultReq === 'OK'
        } catch (e) {
          log(e)
          log(`Resu: KO uuid=${filteredUuids[k][0]} exo=${filteredUuids[k][1]}`)
          throw e
        }
      }
      Object.defineProperty(f, 'name', { value: myName, writable: false })
      ff.push(f)
    }
    runSeveralTests(ff, import.meta.url)
  }
}

if (process.env.NIV !== null && process.env.NIV !== undefined) {
  // utiliser pour les tests d'intégration
  const filter = (process.env.NIV as string).replaceAll(' ', '')
  log(filter)
  testRunAllLots(filter)
} else if (
  process.env.CI &&
  process.env.CHANGED_FILES !== null &&
  process.env.CHANGED_FILES !== undefined
) {
  const changedFiles =
    process.env.CHANGED_FILES?.split('\n')
      .map((f) => f.split(' '))
      .flat() ?? []
  log(changedFiles)
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
    filtered.forEach((file, index) => {
      const filter = file.replaceAll(' ', '')
      console.log(
        'launching test for:',
        filter + `,  ${index + 1}/${filtered.length}`,
      )
      testRunAllLots(filter)
    })
  }
} else {
  // testRunAllLots('2e/2F22-1')
  testRunAllLots('1e/1AN14-3')
  // testRunAllLots('4e/4G52')

  // testRunAllLots('techno1')
  // testRunAllLots('QCMBac')
  // testRunAllLots('QCMBrevet')
  // testRunAllLots('QCMStatiques')

  // pour faire un test sur un exercice particulier:
  // testRunAllLots('6e/6I16')
}

// pnpm vitest --test-timeout=60000 --environment=jsdom --run tests\e2e\tests\all_exercises\all_exercises.test.ts
