import { beforeAll, describe, expect, it } from 'vitest'

// L'import des customElements les enregistre dans mathaleaCustomElementsRegistry
// (comme le fait le chargement d'un exercice qui les utilise).
import handleInteractiveClock from '../../src/lib/customElements/InteractiveClock'
import '../../src/lib/customElements/BlocklyEditor'
import '../../src/lib/customElements/demi_droite_interactive'
import '../../src/lib/customElements/GuideAne'
import '../../src/lib/customElements/ListeDeroulanteElement'
import '../../src/lib/customElements/MultiMathfield'
import '../../src/lib/customElements/MySpreadSheet'
import '../../src/lib/customElements/ScratchEditor'
import '../../src/lib/customElements/SvgSelectionElement'
import '../../src/lib/customElements/TableauSignesVariationsElement'
import '../../src/lib/customElements/TrigoCircleSelectionElement'

import {
  cleanFillInTheBlanks,
  formatStudentAnswer,
  stripInteractiveWidgets,
} from '../../src/lib/components/canSolutions'
import {
  listOfCustomElements,
  mathaleaCustomElementsRegistry,
} from '../../src/lib/customElements/MathaleaCustomElement'

beforeAll(() => {
  handleInteractiveClock()
})

describe('mathaleaCustomElementsRegistry', () => {
  it('contient tous les customElements de listOfCustomElements', () => {
    for (const tag of listOfCustomElements) {
      expect(mathaleaCustomElementsRegistry.has(tag), tag).toBe(true)
    }
  })
})

describe('formatStudentAnswer', () => {
  it("affiche « aucune » si l'élève n'a pas répondu", () => {
    expect(formatStudentAnswer('<math-field></math-field>', '')).toBe('aucune')
  })

  it('affiche la réponse brute pour un QCM', () => {
    const question = '<input type="checkbox" id="checkEx0Q0R0">'
    expect(formatStudentAnswer(question, '50 g ; 500 g')).toBe('50 g ; 500 g')
  })

  it('entoure de dollars la réponse LaTeX sans dollars pour un QCM', () => {
    const question = '<input type="checkbox" id="checkEx0Q0R0">'
    expect(formatStudentAnswer(question, '\\dfrac{1}{2}')).toBe(
      '$\\dfrac{1}{2}$',
    )
  })

  it("formate la réponse JSON d'une horloge interactive", () => {
    const question =
      '<interactive-clock id="interactive-clockEx0Q0" hour="3"/>'
    expect(
      formatStudentAnswer(question, '{"hour":5,"minute":30,"second":0}'),
    ).toBe('$5$ h $30$')
  })

  it("affiche la réponse brute d'une liste déroulante", () => {
    const question = '<liste-deroulante id="liste-deroulanteEx0Q0"></liste-deroulante>'
    expect(formatStudentAnswer(question, 'une infinité de solutions')).toBe(
      'une infinité de solutions',
    )
  })

  it("formate la réponse %{champ:\"valeur\"} d'un multi-mathfield", () => {
    const question = '<multi-mathfield id="multi-mathfieldEx0Q0"></multi-mathfield>'
    expect(formatStudentAnswer(question, 'a) %{rep1:"3"} b) %{rep2:"x+1"}')).toBe(
      'a) $3$ b) $x+1$',
    )
  })

  it("affiche la réponse brute d'un champ texte", () => {
    const question = '<input id="champTexteEx0Q0">'
    expect(formatStudentAnswer(question, 'douze')).toBe('douze')
  })

  it("énumère les valeurs d'un MetaInteractif2d", () => {
    const question = '<div class="metaInteractif2d"></div>'
    expect(
      formatStudentAnswer(question, '{"champ1":"5","champ2":"7"}'),
    ).toBe('$5$ et $7$')
  })

  it('entoure de dollars la réponse mathfield par défaut', () => {
    expect(formatStudentAnswer('<math-field></math-field>', '45')).toBe('$45$')
  })

  it('matérialise les trous vides des fillInTheBlanks', () => {
    expect(
      formatStudentAnswer(
        '<math-field></math-field>',
        '2+\\placeholder[champ1]{}',
      ),
    ).toBe('$2+{...}$')
  })
})

describe('stripInteractiveWidgets', () => {
  it("retire l'horloge interactive de la question", () => {
    const question =
      'Quelle heure est-il ? <interactive-clock id="interactive-clockEx0Q0" hour="3"/>'
    expect(stripInteractiveWidgets(question)).toBe('Quelle heure est-il ? ')
  })

  it('laisse la liste déroulante affichée mais désactivée dans la question', () => {
    const question =
      'Cette équation <liste-deroulante id="liste-deroulanteEx0Q0"></liste-deroulante>'
    expect(stripInteractiveWidgets(question)).toBe(
      'Cette équation <liste-deroulante id="liste-deroulanteEx0Q0" interactivity-on="false"></liste-deroulante>',
    )
  })

  it('retire les <select> historiques', () => {
    const question =
      'Choisir <select id="ex0Q0"><option>a</option></select> puis valider'
    expect(stripInteractiveWidgets(question)).toBe('Choisir  puis valider')
  })

  it('remplace les mathfields par des pointillés', () => {
    const question =
      'La moitié de 90 est <math-field id="champTexteEx0Q0"></math-field>.'
    expect(stripInteractiveWidgets(question)).toBe(
      'La moitié de 90 est  ... .',
    )
  })

  it('conserve le mathfield des fillInTheBlanks en nettoyant les placeholders', () => {
    const question =
      'Compléter <math-field readonly>2+\\placeholder[champ1]{}</math-field>'
    expect(stripInteractiveWidgets(question)).toBe(
      'Compléter <math-field readonly>2+{...}</math-field>',
    )
  })
})

describe('cleanFillInTheBlanks', () => {
  it('retire les commandes \\placeholder et matérialise les trous vides', () => {
    expect(cleanFillInTheBlanks('\\placeholder[champ1]{}+1')).toBe('{...}+1')
  })
})
