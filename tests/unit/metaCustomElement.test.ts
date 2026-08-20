import Figure from 'apigeom'
import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import ExerciceSimple from '../../src/exercices/ExerciceSimple'
import MetaExercice from '../../src/exercices/MetaExerciceCan'
import figureApigeom from '../../src/lib/figureApigeom'
import { MetaCustomElement } from '../../src/lib/customElements/MetaCustomElement'
import { pointsMaxExercice } from '../../src/lib/interactif/baremeExercice'
import {
  exerciceInteractif,
  handleAnswers,
} from '../../src/lib/interactif/gestionInteractif'
import { setOutputHtml } from '../../src/modules/context'
import '../../src/lib/customElements/MathaleaMathfield'

/** Sous-exercice apiGeom sur le modèle de `modèlesExos/20_exercice_classique_apigeom.ts` */
class SousExerciceApigeom extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.consigne = 'Tracer un carré.'
    this.exoCustomResultat = true
  }

  nouvelleVersion(): void {
    this.figuresApiGeom = []
    for (let i = 0; i < this.nbQuestions; i++) {
      const figure = new Figure({ xMin: 0, yMin: 0, width: 100, height: 100 })
      this.figuresApiGeom[i] = figure
      this.listeQuestions[i] = figureApigeom({ exercice: this, i, figure })
      this.listeCorrections[i] = 'correction'
    }
  }

  correctionInteractive = (i: number) => {
    if (this.answers == null) this.answers = {}
    this.answers[this.figuresApiGeom![i].id] = `figure de la question ${i}`
    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    )
    if (divFeedback != null) divFeedback.innerHTML = `vérifiée en ${i}`
    return ['OK', 'KO']
  }
}
SousExerciceApigeom.interactifTypeModule = 'custom'

/** Exercice simple custom dont la correction est une méthode de prototype (cf. `3AutoG12-0`) */
class SousExerciceSimpleCustom extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatInteractif = 'custom'
    this.reponse = ''
  }

  nouvelleVersion(): void {
    this.question = 'Compléter : $\\dfrac{%{champ1}}{2}$'
    this.correction = 'correction'
  }

  correctionInteractive(i: number): string | string[] {
    // Sans fermeture sur l'instance, `this` serait perdu et `numeroExercice`
    // vaudrait `undefined`.
    return this.numeroExercice === 7 && i === 0 ? 'OK' : 'KO'
  }
}

class SousExerciceMathlive extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.reponse = '4'
  }

  nouvelleVersion(): void {
    this.question = 'Combien font $2+2$ ?'
    this.correction = '$4$'
  }
}

/** Exercice qui délègue à un customElement tout en gardant `interactifType = 'custom'` */
class SousExerciceHybride extends Exercice {
  nouvelleVersion(): void {
    handleAnswers(this, 0, { reponse: { value: '4' } })
    this.listeQuestions[0] = 'Combien font $2+2$ ?'
    this.listeCorrections[0] = '$4$'
  }

  correctionInteractive = () => 'OK'
}
SousExerciceHybride.interactifTypeModule = 'custom'

function construitMeta(classes: (typeof Exercice)[], nbQuestions: number) {
  const meta = new MetaExercice(classes)
  meta.numeroExercice = 7
  meta.interactif = true
  meta.sup2 = Array.from({ length: nbQuestions }, (_, i) => i + 1).join('-')
  meta.nouvelleVersion()
  return meta
}

describe('questions custom réhébergées par MetaExerciceCan', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('génère des identifiants apiGeom distincts par question', () => {
    const meta = construitMeta(
      [SousExerciceApigeom, SousExerciceApigeom],
      2,
    )

    expect(meta.listeQuestions[0]).toContain('id="apigeomEx7F0"')
    expect(meta.listeQuestions[1]).toContain('id="apigeomEx7F1"')
    expect(meta.listeQuestions[1]).toContain('id="feedbackEx7Q1"')
    expect(meta.listeQuestions.join('')).not.toContain('apigeomEx7F0"></div>\n')
  })

  it('laisse intacte la clé du callback de montage de la figure', () => {
    const meta = construitMeta(
      [SousExerciceApigeom, SousExerciceApigeom],
      2,
    )

    // L'attribut `action` est la clé du registre statique de
    // `DomReadyActionElement` : la réécrire empêcherait le montage de la figure.
    expect(meta.listeQuestions[1]).toContain(
      'action="figureApigeom:setup:apigeomEx7F1"',
    )
    expect(meta.listeQuestions[1]).toContain('id="apigeomEx7F1-setup"')
  })

  it('déclare le format meta-custom et compte les questions au barème', () => {
    const meta = construitMeta(
      [SousExerciceApigeom, SousExerciceApigeom],
      2,
    )

    expect(meta.autoCorrection[0].formatInteractif).toBe('meta-custom')
    expect(meta.autoCorrection[1].formatInteractif).toBe('meta-custom')
    expect(pointsMaxExercice(meta)).toBe(2)
  })

  it('corrige la bonne question et remonte les réponses de l’élève', () => {
    const meta = construitMeta(
      [SousExerciceApigeom, SousExerciceApigeom],
      2,
    )
    document.body.innerHTML = meta.listeQuestions.join('')

    const resultat = MetaCustomElement.verifQuestion(meta, 1)

    expect(resultat.score).toEqual({ nbBonnesReponses: 1, nbReponses: 2 })
    expect(resultat.isOk).toBe(false)
    expect(document.querySelector('#feedbackEx7Q1')?.innerHTML).toBe(
      'vérifiée en 1',
    )
    expect(meta.answers).toEqual({
      apigeomEx7F1: 'figure de la question 1',
    })
  })

  it('appelle la correction avec le sous-exercice pour `this`', () => {
    const meta = construitMeta([SousExerciceSimpleCustom], 1)

    // `correctionInteractive` est une méthode de prototype qui lit
    // `this.numeroExercice` : sans fermeture, elle renverrait 'KO'.
    expect(MetaCustomElement.verifQuestion(meta, 0).isOk).toBe(true)
    expect(meta.correctionInteractive(0)).toBe('OK')
  })

  it('pose les champs d’un énoncé custom à trous', () => {
    const meta = construitMeta([SousExerciceSimpleCustom], 1)

    expect(meta.listeQuestions[0]).toContain('champTexteEx7Q0')
    expect(meta.listeQuestions[0]).toContain('meta-customEx7Q0')
  })

  it('vérifie une question custom depuis le pipeline générique', () => {
    const meta = construitMeta([SousExerciceApigeom], 1)
    document.body.innerHTML = `<div id="exercice7"></div>${meta.listeQuestions.join('')}`
    const divScore = document.createElement('div') as HTMLDivElement
    const buttonScore = document.createElement('button') as HTMLButtonElement

    const resultat = exerciceInteractif(meta, divScore, buttonScore)

    expect(resultat.numberOfPoints).toBe(1)
    expect(resultat.numberOfQuestions).toBe(2)
    expect(resultat.perQuestionIsOk).toEqual([false])
  })

  it('laisse un exercice qui délègue à un customElement hors du chemin custom', () => {
    const meta = construitMeta([SousExerciceHybride], 1)

    expect(meta.autoCorrection[0].formatInteractif).not.toBe('meta-custom')
    expect(meta.listeQuestions[0]).not.toContain('meta-custom')
  })

  it('ne change rien aux questions non custom', () => {
    const meta = construitMeta(
      [SousExerciceMathlive, SousExerciceMathlive],
      2,
    )

    expect(meta.listeQuestions.join('')).not.toContain('meta-custom')
    expect(meta.autoCorrection[0].formatInteractif).toBe('mathalea-mathfield')
    expect(meta.listeQuestions[1]).toContain('champTexteEx7Q1')
  })
})
