import { JSDOM } from 'jsdom'
import { pathToFileURL } from 'url'
import seedrandom from 'seedrandom'
import { spawnSync } from 'child_process'
import { writeFileSync } from 'fs'

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true, url: 'http://localhost:5173/',
})
const { window: w } = dom
for (const [key, value] of [
  ['window', w], ['document', w.document], ['navigator', w.navigator],
  ['location', w.location], ['history', w.history],
  ['localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} }],
  ['sessionStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} }],
  ['MutationObserver', w.MutationObserver],
  ['ResizeObserver', w.ResizeObserver ?? class { observe() {} disconnect() {} }],
  ['XMLHttpRequest', w.XMLHttpRequest], ['Node', w.Node], ['Element', w.Element],
  ['HTMLElement', w.HTMLElement], ['HTMLButtonElement', w.HTMLButtonElement],
  ['HTMLInputElement', w.HTMLInputElement], ['HTMLSelectElement', w.HTMLSelectElement],
  ['HTMLTextAreaElement', w.HTMLTextAreaElement], ['HTMLDivElement', w.HTMLDivElement],
  ['HTMLSpanElement', w.HTMLSpanElement], ['SVGElement', w.SVGElement],
  ['XMLSerializer', w.XMLSerializer], ['Event', w.Event], ['CustomEvent', w.CustomEvent],
  ['requestAnimationFrame', (fn) => setTimeout(fn, 16)], ['cancelAnimationFrame', clearTimeout],
  ['matchMedia', () => ({ matches: false, media: '', onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })],
  ['customElements', w.customElements ?? { define: () => {}, get: () => undefined, whenDefined: () => Promise.resolve(), upgrade: () => {} }],
]) {
  if (!(key in globalThis) || key === 'window') {
    try { Object.defineProperty(globalThis, key, { value, writable: true, configurable: true }) } catch {}
  }
}
try { Object.defineProperty(w, 'matchMedia', { value: () => ({ matches: false, media: '', onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }), writable: true, configurable: true }) } catch {}
if (w.SVGElement?.prototype) Object.defineProperty(w.SVGElement.prototype, 'getBBox', { configurable: true, value: () => ({ x: 0, y: 0, width: 100, height: 100 }) })
globalThis.APP_VERSION = 'test'

const { context } = await import(pathToFileURL('./src/modules/context.ts').href)
const { mathaleaFormatExercice, mathaleaHandleExerciceSimple } = await import(pathToFileURL('./src/lib/mathalea.ts').href)
const { buildTypstDocument } = await import(pathToFileURL('./src/components/setup/typst/buildTypstDocument.ts').href)

async function testExercise(filePath, supParams, label) {
  const mod = await import(pathToFileURL(filePath).href)
  const ExerciceClass = mod.default
  const exercice = new ExerciceClass()
  
  for (const [k, v] of Object.entries(supParams)) {
    exercice[k] = v
  }
  
  context.isHtml = true; context.isAmc = false
  seedrandom('typst-check', { global: true })
  exercice.numeroExercice = 0
  if (typeof exercice.applyNewSeed === 'function') exercice.applyNewSeed()
  seedrandom(exercice.seed ?? 'typst-check', { global: true })
  
  if (exercice.typeExercice === 'simple') {
    mathaleaHandleExerciceSimple(exercice, false, 0)
  } else if (typeof exercice.nouvelleVersion === 'function') {
    await Promise.resolve(exercice.nouvelleVersion())
  } else if (typeof exercice.nouvelleVersionWrapper === 'function') {
    exercice.nouvelleVersionWrapper(0)
  }
  
  const fmt = (text) => mathaleaFormatExercice(text).replaceAll('{zoomFactor}', '1')
  const questions = (exercice.listeQuestions ?? []).map(fmt)
  const corrections = (exercice.listeCorrections ?? []).map(fmt)
  
  const typstSource = buildTypstDocument([{ ref: label, intro: '', questions, corrections, introCorrection: '', numbered: questions.length > 1 }])
  const outFile = `/tmp/debug-${label}.typ`
  writeFileSync(outFile, typstSource)
  
  const r = spawnSync('typst', ['compile', outFile, '--format', 'pdf', '/dev/null'], { timeout: 30000, encoding: 'utf8' })
  const stderr = ((r.stderr ?? '') + (r.stdout ?? '')).replace(/error: could not infer.*\n?/, '')
  console.log(`\n=== ${label} ===`)
  if (r.status === 0) {
    console.log('✅ OK')
  } else {
    console.log('❌', stderr.split('\n').filter(l => l.trim()).slice(0, 3).join('\n'))
    // Show error line
    const lines = typstSource.split('\n')
    const m = stderr.match(/:(\d+):\d+:/)
    if (m) {
      const ln = parseInt(m[1]) - 1
      for (let i = Math.max(0, ln-1); i <= Math.min(lines.length-1, ln+2); i++) {
        console.log(`  ${i+1}: ${lines[i]}`)
      }
    }
  }
}

// Test each failing exercise with its known-failing parameters
await testExercise('./src/exercices/2e/2N40-7.ts', { sup: 1, sup2: 1, sup3: 1, sup4: true }, '2N40-7')
await testExercise('./src/exercices/2e/2N51-2.ts', {}, '2N51-2')
await testExercise('./src/exercices/2e/2N61-2.ts', { sup: 3, sup2: true }, '2N61-2')
await testExercise('./src/exercices/2e/2N61-2Old.ts', { sup: 3 }, '2N61-2Old')
await testExercise('./src/exercices/2e/2S12-2.ts', { sup: 2 }, '2S12-2')
await testExercise('./src/exercices/3e/3C10-5.ts', { sup: 0 }, '3C10-5')

