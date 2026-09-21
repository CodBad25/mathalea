import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { MathaleaCouteauSuisseElement } from '../../src/lib/customElements/MathaleaCouteauSuisse'
import {
  addSchemaEnBarre,
  comparerSchemas,
  parseSchemaEnBarreState,
  SchemaEnBarreElement,
  schemaLatex,
  schemaTypst,
  nombreBienPlace,
  textesVides,
  TYPES_SCHEMA_EN_BARRE,
  type SchemaEnBarreAttendu,
  type SchemaEnBarreState,
} from '../../src/lib/customElements/SchemaEnBarreElement'
import {
  nbRectanglesPour,
  problemesSchemasEnBarre,
  texCalcul,
  texConclusion,
} from '../../src/lib/problems/problemesSchemasEnBarre'
import {
  context,
  setOutputHtml,
  setOutputLatex,
} from '../../src/modules/context'

function etat(partial: Partial<SchemaEnBarreState>): SchemaEnBarreState {
  return {
    type: null,
    textes: { ...textesVides(), ...partial.textes },
    nbRectangles: partial.nbRectangles ?? 3,
    ...(partial.type !== undefined ? { type: partial.type } : {}),
  }
}

describe('nombreBienPlace', () => {
  it("retrouve le nombre attendu quel que soit l'habillage du texte", () => {
    expect(nombreBienPlace('12', ' 12 km ')).toBe(true)
    expect(nombreBienPlace('Matin\n12 pages', 'Isabelle 12 timbres')).toBe(true)
    expect(nombreBienPlace('3,5', '3.5 €')).toBe(true)
    expect(nombreBienPlace('1 200', '1200')).toBe(true)
    expect(nombreBienPlace('12', '13')).toBe(false)
    expect(nombreBienPlace('12', '')).toBe(false)
  })
  it('ne vérifie pas les textes sans nombre (valeur cherchée, étiquette)', () => {
    expect(nombreBienPlace('?', '?')).toBe(true)
    expect(nombreBienPlace('Tulipes\n? fleurs', '30 timbres')).toBe(true)
    expect(nombreBienPlace('Léa', 'Tom')).toBe(true)
  })
})

describe('comparerSchemas', () => {
  const attendu: SchemaEnBarreAttendu = {
    type: 'additif-parties-tout',
    textes: { partieA: '12', partieB: '5', tout: '?' },
  }
  it('accepte le schéma attendu et les parties échangées', () => {
    const juste = comparerSchemas(
      attendu,
      etat({
        type: 'additif-parties-tout',
        textes: { partieA: '12', partieB: '5', tout: '?' },
      }),
    )
    expect(juste.isOk).toBe(true)
    expect(juste.echangeAB).toBe(false)
    const echange = comparerSchemas(
      attendu,
      etat({
        type: 'additif-parties-tout',
        textes: { partieA: '5 billes', partieB: '12', tout: '71' },
      }),
    )
    expect(echange.isOk).toBe(true)
    expect(echange.echangeAB).toBe(true)
  })
  it("n'échange pas les parties d'une comparaison", () => {
    const comparaison: SchemaEnBarreAttendu = {
      type: 'additif-comparaison',
      textes: { partieA: '12', partieB: '?', difference: '5' },
    }
    const resultat = comparerSchemas(
      comparaison,
      etat({
        type: 'additif-comparaison',
        textes: { partieA: '?', partieB: '12', difference: '5' },
      }),
    )
    expect(resultat.isOk).toBe(false)
    // Seul le nombre attendu (12 en A) est vérifié, pas le « ? » de B.
    expect(resultat.clesFausses).toEqual(['partieA'])
  })
  it('signale le mauvais type et les textes faux', () => {
    const resultat = comparerSchemas(
      attendu,
      etat({
        type: 'additif-comparaison',
        textes: { partieA: '12', partieB: '7', tout: '?' },
      }),
    )
    expect(resultat.typeOk).toBe(false)
    expect(resultat.clesFausses).toEqual(['partieB'])
    expect(resultat.isOk).toBe(false)
  })
  it('vérifie le nombre de rectangles seulement quand il est attendu', () => {
    const multiplicatif: SchemaEnBarreAttendu = {
      type: 'multiplicatif-parties-tout',
      textes: { part: '6', nombreDeParts: '4', tout: '?' },
      nbRectangles: 4,
    }
    const textes = { part: '6', nombreDeParts: '4', tout: '?' }
    expect(
      comparerSchemas(
        multiplicatif,
        etat({ type: 'multiplicatif-parties-tout', textes, nbRectangles: 4 }),
      ).isOk,
    ).toBe(true)
    expect(
      comparerSchemas(
        multiplicatif,
        etat({ type: 'multiplicatif-parties-tout', textes, nbRectangles: 3 }),
      ).nbRectanglesOk,
    ).toBe(false)
    expect(
      comparerSchemas(
        { ...multiplicatif, nbRectangles: undefined },
        etat({ type: 'multiplicatif-parties-tout', textes, nbRectangles: 2 }),
      ).isOk,
    ).toBe(true)
  })
  it("ne vérifie pas les textes vides de l'attendu", () => {
    const resultat = comparerSchemas(
      attendu,
      etat({
        type: 'additif-parties-tout',
        textes: { partieA: '12', partieB: '5', tout: '?', difference: 'x' },
      }),
    )
    expect(resultat.isOk).toBe(true)
  })
})

describe('parseSchemaEnBarreState', () => {
  it('tolère les champs manquants et rejette les valeurs invalides', () => {
    expect(parseSchemaEnBarreState('')).toBeNull()
    expect(parseSchemaEnBarreState('pas du json')).toBeNull()
    const state = parseSchemaEnBarreState(
      JSON.stringify({
        type: 'inconnu',
        textes: { tout: 12 },
        nbRectangles: 9,
      }),
    )
    expect(state).toEqual({
      type: null,
      textes: { ...textesVides(), tout: '12' },
      nbRectangles: 3,
      toutVisible: false,
    })
  })
})

describe('rendus imprimés', () => {
  const textes = { ...textesVides(), part: '3', tout: '?', partieA: '5 €' }
  it('produisent du TikZ et du Typst pour chaque type et chaque nombre de rectangles', () => {
    for (const type of TYPES_SCHEMA_EN_BARRE) {
      for (const nb of [2, 5, 'plus'] as const) {
        const latex = schemaLatex(type, textes, nb)
        expect(latex).toContain('\\begin{tikzpicture}')
        expect(latex).toContain('decoration={brace')
        const typst = schemaTypst(type, textes, nb)
        expect(typst).toMatch(/mathalea-schema-span|stretch\(brace\.r/)
      }
    }
    expect(schemaLatex('multiplicatif-parties-tout', textes, 'plus')).toContain(
      '\\cdots',
    )
    expect(schemaLatex(null, textes, 3)).toBe('')
    expect(schemaTypst(null, textes, 3)).toBe('')
  })
  it('protègent les caractères spéciaux des textes saisis', () => {
    const special = { ...textesVides(), partieA: '50 % & #1', partieB: '$x_1$' }
    const latex = schemaLatex('additif-parties-tout', special, 3)
    expect(latex).toContain('50 \\% \\& \\#1')
    expect(latex).toContain('\\$x\\_1\\$')
    const typst = schemaTypst('additif-parties-tout', special, 3)
    expect(typst).toContain('\\$x\\_1\\$')
  })
})

describe('SchemaEnBarreElement', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  function monteElement(options: Parameters<typeof addSchemaEnBarre>[2] = {}): {
    exercice: Exercice
    element: SchemaEnBarreElement
  } {
    const exercice = new Exercice()
    exercice.numeroExercice = 0
    document.body.innerHTML = addSchemaEnBarre(exercice, 0, options)
    const element = document.querySelector(
      'schema-en-barre',
    ) as SchemaEnBarreElement
    return { exercice, element }
  }

  function clique(element: SchemaEnBarreElement, selecteur: string) {
    element.querySelector<HTMLButtonElement>(selecteur)!.click()
  }

  function saisit(element: SchemaEnBarreElement, cle: string, texte: string) {
    const champ = element.querySelector<HTMLTextAreaElement>(
      `textarea[data-cle="${cle}"]`,
    )!
    champ.value = texte
    champ.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('propose les quatre schémas puis rend éditables les textes du schéma choisi', () => {
    const { element } = monteElement()
    const choix = element.querySelector<HTMLElement>('.schema-en-barre__choix')!
    const zone = element.querySelector<HTMLElement>('.schema-en-barre__zone')!
    expect(choix.querySelectorAll('.schema-en-barre__vignette')).toHaveLength(4)
    expect(choix.hidden).toBe(false)
    expect(zone.hidden).toBe(true)
    expect(element.querySelector('textarea')).toBeNull()
    clique(element, '[data-type="multiplicatif-parties-tout"]')
    // Le choix et le schéma ne sont jamais visibles ensemble.
    expect(choix.hidden).toBe(true)
    expect(zone.hidden).toBe(false)
    expect(
      element.querySelector('textarea')!.getAttribute('placeholder'),
    ).toBeNull()
    expect(element.querySelectorAll('textarea[data-cle="part"]')).toHaveLength(
      3,
    )
    clique(element, '[data-nb="plus"]')
    expect(element.querySelectorAll('textarea[data-cle="part"]')).toHaveLength(
      4,
    )
    expect(element.querySelector('.schema-en-barre__pointilles')).not.toBeNull()
    saisit(element, 'part', '6')
    const parts = [
      ...element.querySelectorAll<HTMLTextAreaElement>(
        'textarea[data-cle="part"]',
      ),
    ]
    expect(parts.every((champ) => champ.value === '6')).toBe(true)
    const state = parseSchemaEnBarreState(element.value)!
    expect(state.type).toBe('multiplicatif-parties-tout')
    expect(state.nbRectangles).toBe('plus')
    expect(state.textes.part).toBe('6')
    clique(element, '.schema-en-barre__changer')
    expect(choix.hidden).toBe(false)
    expect(zone.hidden).toBe(true)
    clique(element, '[data-type="multiplicatif-parties-tout"]')
    expect(zone.hidden).toBe(false)
    expect(parseSchemaEnBarreState(element.value)!.textes.part).toBe('6')
  })

  it("affiche l'accolade « Tout » de la comparaison additive à la demande", () => {
    const { element } = monteElement({ typeImpose: 'additif-comparaison' })
    expect(element.querySelector('[data-cle="tout"]')).toBeNull()
    const bouton = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Afficher le tout'),
    )!
    bouton.click()
    expect(element.querySelector('textarea[data-cle="tout"]')).not.toBeNull()
    saisit(element, 'tout', '110')
    expect(JSON.parse(element.value).toutVisible).toBe(true)
    bouton.click()
    expect(element.querySelector('[data-cle="tout"]')).toBeNull()
    expect(JSON.parse(element.value).textes.tout).toBe('')
    // Figé : l'accolade n'apparaît que si le tout porte un texte.
    element.value = JSON.stringify({
      type: 'additif-comparaison',
      textes: { partieA: '5', partieB: '3', tout: '8' },
    })
    element.interactivityOn = false
    expect(element.querySelector('[data-cle="tout"]')!.textContent).toBe('8')
  })

  it('impose le type quand il est donné', () => {
    const { element } = monteElement({ typeImpose: 'additif-comparaison' })
    expect(element.querySelector('.schema-en-barre__vignette')).toBeNull()
    expect(
      element.querySelector('textarea[data-cle="difference"]'),
    ).not.toBeNull()
    expect(
      element.querySelector<HTMLElement>('.schema-en-barre__nb-rectangles')!
        .hidden,
    ).toBe(true)
  })

  it('restaure un état par value et le fige sans interactivité', () => {
    const { element } = monteElement()
    element.value = JSON.stringify({
      type: 'additif-parties-tout',
      textes: { partieA: '12', partieB: '5', tout: '?' },
    })
    expect(
      element.querySelector<HTMLTextAreaElement>(
        'textarea[data-cle="partieA"]',
      )!.value,
    ).toBe('12')
    element.interactivityOn = false
    expect(element.querySelector('textarea')).toBeNull()
    expect(element.querySelector('.schema-en-barre__vignette')).toBeNull()
    expect(element.querySelector('[data-cle="tout"]')!.textContent).toBe('?')
    expect(JSON.parse(element.value).textes.partieB).toBe('5')
  })

  it('corrige la question avec verifQuestion', () => {
    const attendu: SchemaEnBarreAttendu = {
      type: 'additif-parties-tout',
      textes: { partieA: '12', partieB: '5', tout: '?' },
    }
    const { exercice, element } = monteElement({ attendu })
    expect(exercice.autoCorrection[0].formatInteractif).toBe('schema-en-barre')
    clique(element, '[data-type="additif-parties-tout"]')
    saisit(element, 'partieA', '5')
    saisit(element, 'partieB', '12 pages')
    saisit(element, 'tout', '?')
    const resultat = SchemaEnBarreElement.verifQuestion(exercice, 0)
    expect(resultat.isOk).toBe(true)
    expect(resultat.score).toEqual({ nbBonnesReponses: 1, nbReponses: 1 })
    expect(exercice.answers?.['schema-en-barreEx0Q0']).toBe(element.value)
    expect(element.interactivityOn).toBe(false)
    expect(document.querySelector('#resultatCheckEx0Q0')!.innerHTML).toBe('😎')
  })

  it('explique le mauvais type et marque les textes faux', () => {
    const attendu: SchemaEnBarreAttendu = {
      type: 'additif-comparaison',
      textes: { partieA: '12', partieB: '?', difference: '5' },
    }
    const { exercice, element } = monteElement({ attendu })
    clique(element, '[data-type="additif-comparaison"]')
    saisit(element, 'partieA', '7')
    saisit(element, 'partieB', '12')
    saisit(element, 'difference', '5')
    const resultat = SchemaEnBarreElement.verifQuestion(exercice, 0)
    expect(resultat.isOk).toBe(false)
    expect(resultat.feedback).toContain("un nombre n'est pas à la bonne place")
    expect(
      element
        .querySelector('[data-cle="partieA"]')!
        .classList.contains('is-faux'),
    ).toBe(true)
    expect(
      element
        .querySelector('[data-cle="difference"]')!
        .classList.contains('is-faux'),
    ).toBe(false)
  })

  it('résume la réponse pour les corrections de la CAN', () => {
    expect(
      SchemaEnBarreElement.formatStudentAnswer(
        JSON.stringify({
          type: 'additif-parties-tout',
          textes: { partieA: '12', partieB: '5', tout: '?' },
        }),
      ),
    ).toBe('Additif de parties-tout ; Tout : ? ; Partie A : 12 ; Partie B : 5')
  })

  it("en LaTeX, n'imprime le gabarit que si le type est imposé, et le schéma complet en correction", () => {
    setOutputLatex()
    try {
      const exercice = new Exercice()
      exercice.numeroExercice = 0
      expect(addSchemaEnBarre(exercice, 0, {})).toBe('')
      expect(
        addSchemaEnBarre(exercice, 0, { typeImpose: 'additif-parties-tout' }),
      ).toContain('tikzpicture')
      expect(
        addSchemaEnBarre(exercice, 0, {
          initialState: {
            type: 'additif-parties-tout',
            textes: { ...textesVides(), partieA: '12' },
          },
          interactivityOn: false,
        }),
      ).toContain('{12}')
    } finally {
      setOutputHtml()
      expect(context.isHtml).toBe(true)
    }
  })
})

describe('problemesSchemasEnBarre', () => {
  it('fournit des problèmes cohérents avec leur schéma attendu', () => {
    for (const type of TYPES_SCHEMA_EN_BARRE) {
      for (const fabrique of problemesSchemasEnBarre[type]) {
        const probleme = fabrique()
        expect(probleme.attendu.type).toBe(type)
        expect(
          Object.values(probleme.attendu.textes).some((texte) =>
            texte.includes('?'),
          ),
        ).toBe(true)
        expect(probleme.enonce.length).toBeGreaterThan(20)
        expect(probleme.calculs.length).toBeGreaterThan(0)
        expect(probleme.conclusion.unite).not.toBe('')
      }
    }
    const calcul = {
      termes: [
        { valeur: 12, unite: 'tulipes' },
        { valeur: 6, unite: 'tulipes' },
      ],
      operateur: '-' as const,
      resultat: { valeur: 6, unite: 'tulipes' },
    }
    expect(texCalcul(calcul, false, false)).toBe('$12-6=6$')
    expect(texCalcul(calcul, true, false)).toBe(
      '$12\\text{ tulipes}-6\\text{ tulipes}=6\\text{ tulipes}$',
    )
    expect(texCalcul(calcul, false, true)).toContain('\\color')
    expect(
      texConclusion({
        avant: 'Il y a',
        reponse: 6,
        unite: 'tulipes',
        apres: 'dans ce bouquet.',
      }),
    ).toMatch(/^Il y a \$.*6.*\$ tulipes dans ce bouquet\.$/)
    expect(nbRectanglesPour(4)).toBe(4)
    expect(nbRectanglesPour(12)).toBe('plus')
    expect(nbRectanglesPour(1)).toBe('plus')
  })
})

describe('6N4A-5', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('associe le schéma et le champ de conclusion dans un couteau suisse à deux points', async () => {
    const { default: Exercice6N4A5 } =
      await import('../../src/exercices/6e/6N4A-5')
    const exercice = new Exercice6N4A5()
    exercice.numeroExercice = 0
    exercice.interactif = true
    exercice.nouvelleVersion()
    expect(exercice.listeQuestions).toHaveLength(4)
    expect(exercice.autoCorrection[0].formatInteractif).toBe(
      'mathalea-couteau-suisse',
    )
    // Le champ MathLive n'est pas monté dans jsdom : on lit le HTML produit.
    const html = exercice.listeQuestions[0]
    expect(html).toContain('id="schema-en-barreEx0Q0"')
    expect(html).toContain('mathfield-id="champTexteEx0Q100"')
    expect(html.match(/id="resultatCheckEx0Q0"/g)).toHaveLength(1)
    expect(MathaleaCouteauSuisseElement.pointsMaxQuestion(exercice, 0)).toBe(2)
    // La correction montre le schéma attendu figé, sans champ.
    expect(exercice.listeCorrections[0]).toContain('interactivity-on="false"')
    expect(exercice.listeCorrections[0]).not.toContain('resultatCheck')
  })

  it("écrit les calculs avec les unités quand l'option est cochée", async () => {
    const { default: Exercice6N4A5 } =
      await import('../../src/exercices/6e/6N4A-5')
    const exercice = new Exercice6N4A5()
    exercice.numeroExercice = 0
    exercice.sup = '1'
    exercice.sup3 = true
    exercice.nouvelleVersion()
    expect(exercice.listeCorrections[0]).toContain('\\text{ ')
    exercice.sup3 = false
    exercice.nouvelleVersion()
    expect(exercice.listeCorrections[0]).not.toContain('\\text{ ')
  })
})
