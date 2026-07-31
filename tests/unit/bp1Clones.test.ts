import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))
vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

type Exo = {
  nouvelleVersion: () => void
  listeQuestions: string[]
  listeCorrections: string[]
  nbQuestions: number
}

async function genere(chemin: string, nbQuestions = 12) {
  const mod = (await import(chemin)) as { default: new () => Exo }
  const exo = new mod.default()
  exo.nbQuestions = nbQuestions
  exo.nouvelleVersion()
  return exo
}

describe('restrictions appliquées par les clones BP1', () => {
  it('BP1AUTO087 ne propose que des différences de carrés', async () => {
    const exo = await genere('../../src/exercices/bp1/BP1AUTO087', 9)
    for (const q of exo.listeQuestions) {
      expect(q).toMatch(/\$x\^2-\d+\$/)
    }
  })

  it('BP1GEO07 ne propose plus de prismes', async () => {
    const exo = await genere('../../src/exercices/bp1/BP1GEO07', 12)
    expect(exo.listeCorrections.join(' ')).not.toMatch(/prisme/i)
  })

  it('BP1GEO06 ne propose plus de prismes', async () => {
    const exo = await genere('../../src/exercices/bp1/BP1GEO06', 4)
    expect(exo.listeCorrections.join(' ')).not.toMatch(/prisme/i)
  })

  it('BP1GEO01 propose pi parmi les angles', async () => {
    let trouve = false
    for (let i = 0; i < 20 && !trouve; i++) {
      const exo = await genere('../../src/exercices/bp1/BP1GEO01', 10)
      if (exo.listeQuestions.some((q) => /\\left\(\\pi\\right\)/.test(q))) {
        trouve = true
      }
    }
    expect(trouve).toBe(true)
  })

  it('BP1F2D06 ne parle plus de coefficient dominant', async () => {
    const exo = await genere('../../src/exercices/bp1/BP1F2D06', 10)
    const tout = exo.listeQuestions.join(' ') + exo.listeCorrections.join(' ')
    expect(tout).not.toMatch(/coefficient dominant/)
  })

  for (const code of ['BP1AUTO091', 'BP1AUTO094', 'BP1AUTO095', 'BP1AUTO096']) {
    it(`${code} ne propose que cube, pavé droit et cylindre`, async () => {
      const exo = await genere(`../../src/exercices/bp1/${code}`, 9)
      const tout = exo.listeQuestions.join(' ') + exo.listeCorrections.join(' ')
      expect(tout).not.toMatch(/prisme|pyramide|cône|boule|sphère/i)
    })
  }
})

describe('les parents modifiés gardent leur comportement par défaut', () => {
  it('2N41-7 propose toujours les trois identités', async () => {
    let trouve = false
    for (let i = 0; i < 10 && !trouve; i++) {
      const exo = await genere('../../src/exercices/2e/2N41-7', 12)
      if (/\$x\^2\+\d+x\+\d+\$/.test(exo.listeQuestions.join(' '))) {
        trouve = true
      }
    }
    expect(trouve).toBe(true)
  })

  it('1AL23-50 parle toujours de coefficient dominant', async () => {
    let trouve = false
    for (let i = 0; i < 10 && !trouve; i++) {
      const exo = await genere('../../src/exercices/1e/1AL23-50', 10)
      if (/coefficient dominant/.test(exo.listeQuestions.join(' '))) {
        trouve = true
      }
    }
    expect(trouve).toBe(true)
  })

  it('1AN40 ne propose pas pi au niveau 1 par défaut', async () => {
    const mod = (await import('../../src/exercices/1e/1AN40')) as {
      default: new () => Exo
    }
    for (let i = 0; i < 10; i++) {
      const exo = new mod.default()
      exo.nbQuestions = 10
      exo.nouvelleVersion()
      expect(exo.listeQuestions.join(' ')).not.toMatch(/\\left\(\\pi\\right\)/)
    }
  })

  it('5G2A-1 propose toujours des prismes', async () => {
    let trouve = false
    for (let i = 0; i < 10 && !trouve; i++) {
      const exo = await genere('../../src/exercices/5e/5G2A-1', 6)
      if (/prisme/i.test(exo.listeCorrections.join(' '))) trouve = true
    }
    expect(trouve).toBe(true)
  })

  it('3G43 garde son paramétrage par défaut', async () => {
    const exo = await genere('../../src/exercices/3e/3G43', 4)
    expect(exo.listeQuestions.length).toBe(4)
  })
})
