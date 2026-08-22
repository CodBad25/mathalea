import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { droite, droiteParPointEtPente } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import RepereBuilder from '../../lib/2d/RepereBuilder'
import { latex2d } from '../../lib/2d/textes'
import { orangeMathalea, vertMathalea } from '../../lib/colors'
import {
  MathaleaCouteauSuisseElement,
  type MathaleaCouteauSuisseChild,
} from '../../lib/customElements/MathaleaCouteauSuisse'
import { MathaleaQcmElement } from '../../lib/customElements/MathaleaQcm'
import { MultiMathfieldElement } from '../../lib/customElements/MultiMathfield'
import { TableauSignesVariationsElement } from '../../lib/customElements/TableauSignesVariationsElement'
import {
  lireFormulaireComplexe,
  serialiseFormulaireComplexe,
  valeursParDefaut,
  type FormulaireComplexe,
} from '../../lib/formulaireComplexe'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import type { TableauSVConfig } from '../../lib/interactif/tableauSignesVariations/types'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { texteGras } from '../../lib/outils/embellissements'
import type { InteractivityType } from '../../lib/types'
import type FractionEtendue from '../../modules/FractionEtendue'
import { fraction } from '../../modules/fractions'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'

export const uuid = '99d4e'
export const interactifReady = true
export const interactifType = 'mathalea-couteau-suisse'
export const titre = 'Etudier une fonction affine à partir de son expression'

export const refs = {
  'fr-fr': ['2F21-11'],
  'fr-ch': [],
}
/**
 * @author Jean-Claude Lhote
 */

const leSuperFormulaire: FormulaireComplexe = {
  champs: [
    {
      type: 'listePonderee',
      nom: 'typeCoefDir',
      label: 'Types de coefficients directeurs',
      items: [
        {
          nom: '1',
          label: 'Entier relatif',
          poids: 1,
        },
        {
          nom: '2',
          label: 'rationnel',
          poids: 1,
        },
      ],
    },
    {
      type: 'listePonderee',
      nom: 'typeAntecedent',
      label: "Types d'antécédents",
      items: [
        { nom: '1', label: 'Entier relatif' },
        { nom: '2', label: 'Rationnel' },
      ],
    },
    {
      type: 'case',
      nom: 'withSignTab',
      label: 'Avec tableau de signes',
      defaut: true,
    },
  ],
}
export default class ExoCompletAffine extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireComplexe = leSuperFormulaire
    this.sup = serialiseFormulaireComplexe(
      leSuperFormulaire,
      valeursParDefaut(leSuperFormulaire),
    )
  }
  genereCoefDir(type: string): FractionEtendue {
    if (type === '1') {
      return fraction(randint(-2, 2, 0), 1)
    } else {
      return fraction(randint(-4, 4, 0), choice([2, 3, 4, 5]))
    }
  }
  genereAntecedents(type: string): [FractionEtendue, FractionEtendue] {
    if (type === '1') {
      const a = randint(-5, 5, 0)
      const x0 = fraction(a, 1)
      const x1 = fraction(randint(-5, 5, a), 1)
      const result = [x0, x1].sort((x, y) => x.num / x.den - y.num / y.den)
      return result as [FractionEtendue, FractionEtendue]
    } else {
      const a = randint(-10, 10, 0)
      const b = randint(-10, 10, a)
      const x0 = fraction(a, choice([2, 3, 4, 5]))
      const x1 = fraction(b, choice([2, 3, 4, 5]))
      const result = [x0, x1].sort((x, y) => x.num / x.den - y.num / y.den)
      return result as [FractionEtendue, FractionEtendue]
    }
  }
  genereImages(type: string): [FractionEtendue, FractionEtendue] {
    if (type === '1') {
      const a = randint(-5, 5, 0)
      const y2 = fraction(a, 1)
      const y3 = fraction(randint(-5, 5, a), 1)
      const result = [y2, y3].sort((x, y) => x.num / x.den - y.num / y.den)
      return result as [FractionEtendue, FractionEtendue]
    } else {
      const a = randint(-10, 10, 0)
      const b = randint(-10, 10, a)
      const y2 = fraction(a, choice([2, 3, 4, 5]))
      const y3 = fraction(b, choice([2, 3, 4, 5]))
      const result = [y2, y3].sort((x, y) => x.num / x.den - y.num / y.den)
      return result as [FractionEtendue, FractionEtendue]
    }
  }

  image(a: FractionEtendue, b: FractionEtendue, x: FractionEtendue) {
    return a.produitFraction(x).sommeFraction(b).simplifie()
  }

  antecedent(a: FractionEtendue, b: FractionEtendue, y: FractionEtendue) {
    return y.differenceFraction(b).diviseFraction(a).simplifie()
  }

  signeSurIntervalle(a: FractionEtendue, estAvantZero: boolean) {
    const signeA = a.valeurDecimale > 0 ? 1 : -1
    return signeA * (estAvantZero ? -1 : 1) > 0 ? '+' : '-'
  }

  configTableauSignes(a: FractionEtendue, b: FractionEtendue): TableauSVConfig {
    const zero = b.oppose().diviseFraction(a).simplifie().texFSD
    return {
      variableName: 'x',
      colonnes: [
        { valeur: '-\\infty' },
        { valeur: '', editable: true, expected: zero },
        { valeur: '+\\infty' },
      ],
      lignes: [
        {
          type: 'signe',
          label: 'g(x)',
          cellules: [
            { symbole: '' },
            {
              symbole: '',
              editable: true,
              expected: this.signeSurIntervalle(a, true),
            },
            { symbole: '|0' },
            {
              symbole: '',
              editable: true,
              expected: this.signeSurIntervalle(a, false),
            },
            { symbole: '' },
          ],
        },
      ],
    }
  }

  genereGraphique(
    a: FractionEtendue,
    b: FractionEtendue,
  ): { graphique: string; bonneDroite: number } {
    const couleursDiscernables = [orangeMathalea, vertMathalea, 'gray', 'brown']
    const indices = shuffle([1, 2, 3, 4])
    const objets: NestedObjetMathalea2dArray = []
    const d1 = droiteParPointEtPente(
      pointAbstrait(0, b.num / b.den),
      a.num / a.den,
    )
    d1.pente = a.num / a.den
    d1.ordonneeOrigine = b.num / b.den
    const d2 = droiteParPointEtPente(
      pointAbstrait(0, b.num / b.den),
      -a.num / a.den,
    )
    d2.pente = -a.num / a.den
    d2.ordonneeOrigine = b.num / b.den
    const d3 = droiteParPointEtPente(
      pointAbstrait(0, a.num / a.den),
      b.num / b.den,
    )
    d3.pente = b.num / b.den
    d3.ordonneeOrigine = a.num / a.den
    const d4 = droite(
      pointAbstrait(0, a.num / a.den),
      pointAbstrait(b.num / b.den, 0),
    )
    d4.pente = -a.num / a.den / (b.num / b.den)
    d4.ordonneeOrigine = a.num / a.den
    for (let i = 0; i < 4; i++) {
      const d = [d1, d2, d3, d4][i]
      d.epaisseur = 2
      d.color = colorToLatexOrHTML(couleursDiscernables[i])
      objets.push(d)
      const a = Number(d.pente)
      const b = Number(d.ordonneeOrigine)
      const nomLatex = `d_${indices[i]}`

      if (a > 1.5 || a < -1.5) {
        objets.push(
          latex2d(nomLatex, (5 - b) / a + 0.5, 5, {
            color: couleursDiscernables[i],
            letterSize: 'small',
          }),
        )
      } else {
        if (a > 0) {
          objets.push(
            latex2d(nomLatex, 5, 5 * a + b + 0.5, {
              color: couleursDiscernables[i],
              letterSize: 'small',
            }),
          )
        } else {
          objets.push(
            latex2d(nomLatex, -5, -5 * a + b + 0.5, {
              color: couleursDiscernables[i],
              letterSize: 'small',
            }),
          )
        }
      }
    }

    const rep = new RepereBuilder({
      xMin: -5,
      xMax: 6,
      yMin: -2,
      yMax: 6,
    })
      .setThickX({ xMin: -5, xMax: 6, dx: 1 })
      .setThickY({ yMin: -2, yMax: 6, dy: 1 })
      .setLabelX({ xMin: 0, xMax: 1, dx: 1 })
      .setLabelY({ yMin: 0, yMax: 1, dy: 1 })
      .setGrille({
        grilleX: { xMin: -5, xMax: 6, dx: 1 },
        grilleY: { yMin: -2, yMax: 6, dy: 1 },
      })
      .buildStandard()
    objets.push(rep)
    return {
      graphique: mathalea2d(
        Object.assign({ pixelsParCm: 30, scale: 0.8 }, fixeBordures(objets)),
        objets,
      ),
      bonneDroite: indices[0],
    }
  }

  expressionFonction(a: FractionEtendue, b: FractionEtendue): string {
    return `g(x)=${a.texFractionSaufUn}x${b.texFractionSignee}`
  }

  nouvelleVersion() {
    const params = lireFormulaireComplexe(leSuperFormulaire, this.sup)
    const typesCoefDir = params.repartition('typeCoefDir', this.nbQuestions)
    const typesAntecedents = params.repartition(
      'typeAntecedent',
      this.nbQuestions,
    )
    const withSignTab = params.case('withSignTab')

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50;) {
      const typeCoefDir = typesCoefDir[i]
      const typeAntecedent = typesAntecedents[i]
      const a = this.genereCoefDir(typeCoefDir)
      const b = fraction(randint(-4, 4, 0), 2)
      const [x0, x1] = this.genereAntecedents(typeAntecedent)
      const [y2, y3] = this.genereImages(
        String(Math.max(Number(typeCoefDir), Number(typeAntecedent))),
      )
      const gx0 = this.image(a, b, x0)
      const gx1 = this.image(a, b, x1)
      const antecedentY2 = this.antecedent(a, b, y2)
      const antecedentY3 = this.antecedent(a, b, y3)
      const { graphique, bonneDroite } = this.genereGraphique(a, b)
      const tableauSignes = this.configTableauSignes(a, b)
      const zero = b.oppose().diviseFraction(a).simplifie().texFSD
      const propositionsDroites = [1, 2, 3, 4].map((indice) => ({
        texte: `$d_${indice}$`,
        statut: indice === bonneDroite,
      }))
      const elements: MathaleaCouteauSuisseChild[] = [
        {
          formatInteractif: MultiMathfieldElement.elementTag,
          autoCorrection: {
            valeur: {
              champ1: { value: gx0.texFSD },
              champ2: { value: gx1.texFSD },
              champ3: { value: antecedentY2.texFSD },
              champ4: { value: antecedentY3.texFSD },
            },
          },
        },
        ...(withSignTab
          ? [
              {
                formatInteractif:
                  TableauSignesVariationsElement.elementTag as InteractivityType,
                autoCorrection: {
                  valeur: {
                    reponse: {
                      value: JSON.stringify({
                        L0C1: zero,
                        L1C1: this.signeSurIntervalle(a, true),
                        L1C3: this.signeSurIntervalle(a, false),
                      }),
                    },
                    bareme: (listePoints: number[]) => [
                      listePoints.every((point) => point > 0) ? 1 : 0,
                      1,
                    ],
                  },
                },
              },
            ]
          : []),
        {
          formatInteractif: MathaleaQcmElement.elementTag as InteractivityType,
          autoCorrection: {
            propositions: propositionsDroites,
            options: { radio: true },
          },
        },
      ]

      this.autoCorrection[i] = {
        formatInteractif: MathaleaCouteauSuisseElement.elementTag,
        elements,
      }

      const champsCalculs = MultiMathfieldElement.create({
        numeroExercice: this.numeroExercice,
        questionIndex: i,
        dataTemplate: [
          `a) Calculer les images de $${x0.texFSD}$ et $${x1.texFSD}$ par $g$ :`,
          `$g(${x0.texFSD})=$%{champ1} et $g(${x1.texFSD})=$%{champ2}.`,
          `b) Calculer les antécédents de $${y2.texFSD}$ et $${y3.texFSD}$ par $g$ :`,
          `$g(x)=${y2.texFSD}$ pour $x=$%{champ3} et $g(x)=${y3.texFSD}$ pour $x=$%{champ4}.`,
        ].join('<br>'),
        dataOptions: {
          champ1: { keyboard: KeyboardType.clavierDeBaseAvecFraction },
          champ2: { keyboard: KeyboardType.clavierDeBaseAvecFraction },
          champ3: { keyboard: KeyboardType.clavierDeBaseAvecFraction },
          champ4: { keyboard: KeyboardType.clavierDeBaseAvecFraction },
        },
      })
      const champTableau = withSignTab
        ? [
            `<br>${texteGras('3.')} Dresser le tableau de signes de $g$.<br>`,
            TableauSignesVariationsElement.create({
              numeroExercice: this.numeroExercice,
              questionIndex: i,
              config: tableauSignes,
            }),
          ].join('')
        : ''
      const numeroQcm = withSignTab ? 4 : 3
      const champQcm = [
        `<br>${texteGras(`${numeroQcm}.`)} Parmi les quatre droites tracées ci-dessous, laquelle représente la fonction $g$ ?`,
        graphique,
        MathaleaQcmElement.create({
          numeroExercice: this.numeroExercice ?? 0,
          questionIndex: i,
          propositions: propositionsDroites,
          radio: true,
          vertical: false,
        }),
      ].join('<br>')

      this.listeQuestions[i] = [
        `La fonction affine $g$ est définie par $${this.expressionFonction(a, b)}$.`,
        MathaleaCouteauSuisseElement.create({
          numeroExercice: this.numeroExercice ?? 0,
          questionIndex: i,
          elements,
          contenu: [champsCalculs, champTableau, champQcm].join(''),
        }),
      ].join('<br>')
      this.listeCorrections[i] = [
        `$g(${x0.texFSD})=${gx0.texFSD}$ et $g(${x1.texFSD})=${gx1.texFSD}$.`,
        `Les antécédents de $${y2.texFSD}$ et $${y3.texFSD}$ sont respectivement $${antecedentY2.texFSD}$ et $${antecedentY3.texFSD}$.`,
        withSignTab ? `Le zéro de $g$ est $${zero}$.` : '',
        `La droite représentative de $g$ est $d_${bonneDroite}$.`,
      ]
        .filter(Boolean)
        .join('<br>')
      i++
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
