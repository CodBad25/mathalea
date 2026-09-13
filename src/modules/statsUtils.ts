import type TypeExercice from '../exercices/Exercice'

window.logDebug = window.logDebug || 0

const url = new URL(window.location.href)
const debug =
  url.searchParams.get('log') === '3' || window.logDebug !== 0 ? 1 : 0

export function log(message?: any, ...optionalParams: any[]) {
  if (debug) {
    console.info(message, ...optionalParams)
  }
}

export function logDebug(message?: any, ...optionalParams: any[]) {
  if (debug > 1 || window.logDebug > 1)
    log('DEBUG:', message, ...optionalParams)
}

export function statsTracker(
  exercise: TypeExercice,
  recorder: string,
  vue: string,
  isreview: 'review' | '',
) {
  logDebug('Tracking stats...')
  if (window._paq && isreview === '') {
    window._paq.push([
      'trackEvent',
      'CheckExo',
      vue + '-' + exercise.uuid + (recorder ? '-' + recorder : ''),
    ])
  }
  log(
    'CheckExo',
    vue +
      '-' +
      exercise.uuid +
      (recorder ? '-' + recorder : '') +
      (isreview ? '-review' : ''),
  )
}

/**
 * Séries (listes d'exercices) déjà comptées comme export PDF Typst, pour ne
 * pas recompter un export répété de la même série (même liste d'exercices,
 * indépendamment de l'ordre). Réinitialisé à chaque rechargement de page.
 */
const trackedTypstPdfSeries = new Set<string>()

/**
 * Signale un export PDF réussi, vue Typst ou Tex. Pour Typst, `uuids` est la
 * liste des uuid des exercices de la série exportée : un export répété de la
 * même série (mêmes exercices, ordre indifférent) n'est compté qu'une fois.
 * Pour Tex, chaque export compte (pas de déduplication demandée).
 */
export function statsPdfCreatedTracker(vue: 'typst' | 'tex', uuids: string[] = []) {
  if (vue === 'typst') {
    const key = [...new Set(uuids)].sort().join(',')
    if (trackedTypstPdfSeries.has(key)) return
    trackedTypstPdfSeries.add(key)
  }
  if (window._paq) window._paq.push(['trackEvent', 'PdfCree', vue === 'typst' ? 'Typst' : 'Tex'])
  log('PdfCree', vue)
}

/**
 * Calculatrices déjà comptées comme ouvertes en vue TBI, pour ne pas
 * recompter une réouverture sur la même session (réinitialisé au
 * rechargement de la page).
 */
const openedTbiCalculators = new Set<'college' | 'lycee'>()

/** Signale l'ouverture d'une calculatrice en vue TBI (une fois par session). */
export function statsTbiCalculatorTracker(kind: 'college' | 'lycee') {
  if (openedTbiCalculators.has(kind)) return
  openedTbiCalculators.add(kind)
  if (window._paq)
    window._paq.push([
      'trackEvent',
      'CalculatriceTbi',
      kind === 'college' ? 'College' : 'Lycee',
    ])
  log('CalculatriceTbi', kind)
}

let oldUrl = ''

export function statsPageTracker() {
  logDebug('Tracking pages...')
  // Informer Matomo
  if (window.location.href !== oldUrl) {
    if (window._paq)
      window._paq.push([
        'trackEvent',
        'PageTracking',
        'VisitedURL',
        window.location.href,
      ])
    oldUrl = window.location.href
    log('statsPageTracker called with URL:', window.location.href)
  }
}

/*
// Exemple
const list1 = ['A', 'B', 'B', 'C', 'C', 'D']
const list2 = ['A', 'A', 'D', 'C', 'D', 'D', 'B']

console.log(getIntrus(list1, list2))
🔎 Résultat :
js
Copier
Modifier
[
  { value: 'A', difference: -1 }, // 1 de trop dans list2
  { value: 'B', difference: 0 },  // OK
  { value: 'C', difference: 1 },  // 1 de trop dans list1
  { value: 'D', difference: -2 }  // 2 de trop dans list2
]
  */

export function getIntrus(list1: string[], list2: string[]) {
  interface CountMap {
    [key: string]: number
  }

  const count = (arr: string[]): CountMap =>
    arr.reduce((acc: CountMap, val: string) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {})

  const count1 = count(list1)
  const count2 = count(list2)

  const allKeys = new Set([...Object.keys(count1), ...Object.keys(count2)])
  const intrus = []

  for (const key of allKeys) {
    const diff = (count1[key] || 0) - (count2[key] || 0)
    if (diff !== 0) {
      intrus.push({ value: key, difference: diff })
    }
  }

  return intrus
}
