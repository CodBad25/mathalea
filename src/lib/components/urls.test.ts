import { describe, expect, it } from 'vitest'
import { buildSingleExerciseURL, encrypt } from './urls'

const seriesUrl =
  'https://coopmaths.fr/alea/?uuid=aaa&id=3L11&n=4&s=2&alea=Xy12&i=1' +
  '&uuid=bbb&id=6N1E&n=5&s=1&s2=3&alea=Ab34&cd=1' +
  '&v=eleve&es=0211001&title=Test&select=0-1&order=1-0&answers=zzz&done=1&z=1.2'

describe('buildSingleExerciseURL', () => {
  const url = buildSingleExerciseURL(new URL(seriesUrl), {
    uuid: 'bbb',
    id: '6N1E',
    nbQuestions: 5,
    sup: '1',
    sup2: '3',
    alea: 'Ab34',
    cd: '1',
  })

  it('ne conserve que l’exercice fourni avec sa graine et ses options', () => {
    expect(url.searchParams.getAll('uuid')).toEqual(['bbb'])
    expect(url.searchParams.getAll('alea')).toEqual(['Ab34'])
    expect(url.searchParams.get('n')).toBe('5')
    expect(url.searchParams.get('s')).toBe('1')
    expect(url.searchParams.get('s2')).toBe('3')
    expect(url.searchParams.get('cd')).toBe('1')
    expect(url.searchParams.has('i')).toBe(false)
  })

  it('place l’exercice en tête et garde les réglages globaux', () => {
    expect([...url.searchParams.keys()][0]).toBe('uuid')
    expect(url.searchParams.get('v')).toBe('eleve')
    expect(url.searchParams.get('es')).toBe('0211001')
    expect(url.searchParams.get('z')).toBe('1.2')
    expect(url.searchParams.get('title')).toBe('Test')
  })

  it('retire les paramètres liés à la série complète', () => {
    for (const param of ['select', 'order', 'answers', 'done']) {
      expect(url.searchParams.has(param)).toBe(false)
    }
  })

  it('décrypte une URL cryptée', () => {
    const fromCrypted = buildSingleExerciseURL(new URL(encrypt(seriesUrl)), {
      uuid: 'aaa',
      alea: 'Xy12',
    })
    expect(fromCrypted.searchParams.getAll('uuid')).toEqual(['aaa'])
    expect(fromCrypted.searchParams.get('v')).toBe('eleve')
  })
})
