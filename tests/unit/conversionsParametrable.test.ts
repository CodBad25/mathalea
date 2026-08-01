import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))
vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

import ExerciceConversionsParametrable, {
  supParDefaut,
} from '../../src/exercices/6e/_Exercice_conversions_parametrable'

function genere(sup: string, nbQuestions = 12) {
  const exo = new ExerciceConversionsParametrable()
  exo.sup = sup
  exo.nbQuestions = nbQuestions
  exo.nouvelleVersion()
  return exo
}

// Les valeurs de `sup` suivent l'ordre de déclaration des champs dans
// `formulaireConversions` : operations * unites (ordre_poids) * decimaux * fractions.
// Un changement de cet ordre change le format de `sup` — voir la régression testée
// dans `formulaireComplexe.test.ts` (ne jamais indexer `champs` par position).

describe('exercice de conversions paramétrable', () => {
  it('utilise par défaut les longueurs, contenances et masses en multipliant', () => {
    expect(supParDefaut).toBe('mult*0_0.1-1.1-2.1-3.0-4.0*0*0')
    const exo = genere(supParDefaut)
    expect(exo.listeQuestions).toHaveLength(12)
    const enonces = exo.listeQuestions.join(' ')
    expect(enonces).not.toMatch(/€/)
    expect(enonces).not.toMatch(/Mo|Go|To/)
    expect(exo.listeCorrections.join(' ')).not.toMatch(/\\div/)
  })

  it('ne propose que l’unité cochée', () => {
    // Seules les masses sont actives, avec des divisions.
    const exo = genere('div*0_0.0-1.0-2.1-3.0-4.0*0*0')
    for (const question of exo.listeQuestions) {
      expect(question).toMatch(/\\text\{[dcm]g\}/)
    }
    expect(exo.listeCorrections.join(' ')).toMatch(/\\div/)
    expect(exo.listeCorrections.join(' ')).not.toMatch(/\\times/)
  })

  it('regroupe les unités par blocs quand la case d’ordre est cochée', () => {
    // Masses puis longueurs, la masse comptant double : 4 masses puis 2 longueurs.
    const exo = genere('mult*1_2.2-0.1-1.0-3.0-4.0*0*0', 6)
    const unites = exo.listeQuestions.map(
      (question) => /\\text\{[a-zA-Z]*(g|m)\}/.exec(question)?.[1],
    )
    expect(unites).toEqual(['g', 'g', 'g', 'g', 'm', 'm'])
  })

  it('répartit équitablement des unités de même poids, dans l’ordre choisi', () => {
    // Cas signalé : 5 questions pour 3 unités de poids 1 → 2 + 2 + 1.
    const exo = genere('mult*1_0.1-1.1-2.1-3.0-4.0*0*0', 5)
    const unites = exo.listeQuestions.map(
      (question) => /\\text\{[a-zA-Z]*(m|L|g)\}/.exec(question)?.[1],
    )
    expect(unites).toEqual(['m', 'm', 'L', 'L', 'g'])
  })

  it('mélange les unités quand la case d’ordre est décochée', () => {
    // Mêmes poids, mais sans ordre imposé : les proportions tiennent, pas la séquence.
    const exo = genere('mult*0_2.2-0.1-1.0-3.0-4.0*0*0', 6)
    const unites = exo.listeQuestions.map(
      (question) => /\\text\{[a-zA-Z]*(g|m)\}/.exec(question)?.[1],
    )
    expect(unites.filter((u) => u === 'g')).toHaveLength(4)
    expect(unites.filter((u) => u === 'm')).toHaveLength(2)
  })

  it('produit des nombres décimaux quand l’option est cochée', () => {
    const exo = genere('mult*0_0.1-1.0-2.0-3.0-4.0*1*0', 20)
    expect(exo.listeQuestions.join(' ')).toMatch(/\d,\d/)
  })

  it('n’utilise les fractions dans la correction que si l’option est cochée', () => {
    const sansFractions = genere('div*0_0.1-1.0-2.0-3.0-4.0*0*0', 12)
    expect(sansFractions.listeCorrections.join(' ')).not.toMatch(/\\dfrac/)
    const avecFractions = genere('div*0_0.1-1.0-2.0-3.0-4.0*0*1', 12)
    expect(avecFractions.listeCorrections.join(' ')).toMatch(/\\dfrac/)
  })

  it('gère les unités de stockage informatique', () => {
    const exo = genere('both*0_0.0-1.0-2.0-3.0-4.1*0*0', 12)
    for (const question of exo.listeQuestions) {
      expect(question).toMatch(/\\text\{(o|ko|Mo|Go|To)\}/)
    }
  })

  it('écarte l’euro quand seules les divisions sont demandées', () => {
    // L'euro est la seule unité cochée mais n'a pas de sous-multiple usuel.
    const exo = genere('div*0_0.0-1.0-2.0-3.1-4.0*0*0', 8)
    expect(exo.listeQuestions).toHaveLength(8)
    expect(exo.listeQuestions.join(' ')).not.toMatch(/€/)
  })

  it('reste valide avec un sup vide ou hérité d’une ancienne URL', () => {
    for (const sup of ['', 'n’importe quoi', '1']) {
      const exo = genere(sup, 5)
      expect(exo.listeQuestions).toHaveLength(5)
      expect(exo.listeCorrections.every((c) => c.length > 0)).toBe(true)
    }
  })

  it('reste valide si l’ordre des champs du formulaire change', () => {
    // Régression : le code de l'exercice indexait `formulaireConversions.champs[0]`
    // en supposant que « unites » était le premier champ déclaré. Un réordonnancement
    // du formulaire (ex. « operations » en premier) faisait planter `nouvelleVersion()`
    // avec `TypeError: undefined is not an object (evaluating 'champUnites.items.filter')`.
    const exo = genere(supParDefaut, 5)
    expect(exo.listeQuestions).toHaveLength(5)
  })
})
