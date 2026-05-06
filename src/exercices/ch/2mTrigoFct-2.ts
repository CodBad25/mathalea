import { addMultiMathfield } from '../../lib/interactif/MultiMathfield/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { fonctionComparaison } from '../../lib/interactif/comparisonFunctions'
import { propositionsQcm, verifQuestionQcm } from '../../lib/interactif/qcm'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
  rienSi1,
} from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import FractionEtendue from '../../modules/FractionEtendue'
import Exercice from '../Exercice'

export const titre = "Déterminer une mesure d'angle congrue dans $[0;2\\pi[$"
export const interactifReady = true
export const interactifType = 'custom'
export const dateDePublication = '04/05/2026'
export const uuid = 'f05d2'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['2mTrigoFct-2'],
}

export default class MesureAngleEntreZeroEtDeuxPi extends Exercice {
  private anglesReduits: string[] = []

  constructor() {
    super()
    this.nbQuestions = 3
    this.nbCols = 2
    this.nbColsCorr = 2
    this.sup = false
    this.exoCustomResultat = true
    this.besoinFormulaireCaseACocher = ['Avec question sur le cadran']
  }

  nouvelleVersion() {
    this.anglesReduits = []
    this.consigne =
      this.nbQuestions === 1
        ? "Déterminer la mesure d'angle dans $[0;2\\pi[$ qui repère le même point du cercle trigonométrique que la mesure donnée."
        : "Déterminer les mesures d'angles dans $[0;2\\pi[$ qui repèrent le même point du cercle trigonométrique que les mesures données."
    if (this.sup) {
      this.consigne +=
        this.nbQuestions === 1
          ? ' Déterminer aussi dans quel cadran se trouve cet angle.'
          : ' Déterminer aussi dans quel cadran se trouve chaque angle.'
    }

    const denominateurs = combinaisonListes(
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      this.nbQuestions,
    )

    for (
      let i = 0,
        numerateur,
        denominateur,
        reste,
        quotient,
        texte,
        texteCorr,
        cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      denominateur = denominateurs[i]
      let essais = 0
      do {
        numerateur = randint(-12 * denominateur, 12 * denominateur, [0])
        reste =
          ((numerateur % (2 * denominateur)) + 2 * denominateur) %
          (2 * denominateur)
        essais++
      } while (this.estSurUnAxe(reste, denominateur) && essais < 20)
      if (this.estSurUnAxe(reste, denominateur)) {
        cpt++
        continue
      }
      quotient = (numerateur - reste) / (2 * denominateur)

      const angle = this.texAngle(numerateur, denominateur)
      const angleReduit = this.texAngle(reste, denominateur)
      const cadran = this.cadran(reste, denominateur)

      texte = `$${angle}$`
      if (this.interactif) {
        this.autoCorrection[i] = { formatInteractif: 'custom' }
        texte +=
          '<br>' +
          addMultiMathfield(this, i, {
            dataTemplate: 'Mesure : %{champ1}',
            dataOptions: {
              champ1: { keyboard: KeyboardType.grecTrigo, minWidth: 120 },
            },
          })
        if (this.sup) {
          this.autoCorrection[i].enonce = texte
          this.autoCorrection[i].propositions = ['I', 'II', 'III', 'IV'].map(
            (roman) => ({
              texte: roman,
              statut: roman === cadran.roman,
            }),
          )
          this.autoCorrection[i].options = {
            ordered: true,
          }
          texte += propositionsQcm(this, i).texte
          this.autoCorrection[i].formatInteractif = 'custom'
        }
      }

      texteCorr = `Deux mesures qui diffèrent d'un multiple de $2\\pi$ repèrent le même point du cercle trigonométrique.<br>`
      texteCorr += `On cherche donc la mesure qui diffère d'un facteur $2\\pi$ et qui appartient à $[0;2\\pi[$. On enlève pour cela un multiple de $2\\pi$ à l'angle initial.<br>`
      texteCorr += `Ici, $2\\pi=\\dfrac{${2 * denominateur}\\pi}{${denominateur}}$.<br>`
      texteCorr += `On effectue la division euclidienne du numérateur par $${2 * denominateur}$ :<br>`
      texteCorr += `$${numerateur}=${2 * denominateur}\\times ${ecritureParentheseSiNegatif(quotient)}${ecritureAlgebrique(reste)}$.<br>`
      texteCorr += `Ainsi, $${angle}=${angleReduit}${this.texMultipleDeuxPi(quotient)}$.<br>`
      texteCorr += `La mesure dans $[0;2\\pi[$ qui repère le même point du cercle trigonométrique que $${angle}$ est donc $${miseEnEvidence(angleReduit)}$.`
      if (this.sup) {
        texteCorr += `<br>Le premier cadran repère les points dont les mesures d'angles sont dans $\\left]0;\\dfrac{\\pi}{2}\\right[$, le deuxième dans $\\left]\\dfrac{\\pi}{2};\\pi\\right[$, le troisième dans $\\left]\\pi;\\dfrac{3\\pi}{2}\\right[$ et le quatrième dans $\\left]\\dfrac{3\\pi}{2};2\\pi\\right[$.<br>`
        texteCorr += `Cette mesure se trouve donc dans le cadran $${miseEnEvidence(`\\mathrm{${cadran.roman}}`)}$.`
      }

      if (this.questionJamaisPosee(i, numerateur, denominateur, this.sup)) {
        this.anglesReduits[i] = angleReduit
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }

  correctionInteractive(i: number): string[] {
    const multi = document.getElementById(
      `multiMathfieldEx${this.numeroExercice}Q${i}`,
    ) as
      | (HTMLElement & {
          getValue: () => Record<string, string>
        })
      | null
    const mathfield = multi?.shadowRoot?.querySelector(
      `#multiMathfieldEx${this.numeroExercice}Q${i}-champ1`,
    ) as
      | (HTMLElement & {
          readOnly: boolean
          classList: DOMTokenList
        })
      | null
    const spanFeedback = multi?.shadowRoot?.querySelector(
      `#check-multiMathfieldEx${this.numeroExercice}Q${i}-champ1`,
    ) as HTMLSpanElement | null
    const saisie = multi?.getValue().champ1 ?? ''
    const resultatMesure = fonctionComparaison(
      saisie,
      this.anglesReduits[i],
    ).isOk
    if (mathfield != null) {
      mathfield.readOnly = true
      mathfield.classList.add('corrected')
    }
    if (spanFeedback != null) {
      spanFeedback.innerHTML = resultatMesure ? '😎' : '☹️'
    }
    if (this.answers == null) this.answers = {}
    this.answers[`multiMathfieldEx${this.numeroExercice}Q${i}`] = saisie

    if (!this.sup) return [resultatMesure ? 'OK' : 'KO']

    const resultatCadran = verifQuestionQcm(this, i) === 'OK'
    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    ) as HTMLDivElement | null
    if (spanResultat != null) {
      spanResultat.innerHTML = resultatMesure && resultatCadran ? '😎' : '☹️'
    }
    return [resultatMesure ? 'OK' : 'KO', resultatCadran ? 'OK' : 'KO']
  }

  private texAngle(numerateur: number, denominateur: number) {
    if (numerateur === 0) return '0'
    const f = new FractionEtendue(numerateur, denominateur)
    if (f.denIrred === 1) {
      return `${rienSi1(f.numIrred)}\\pi`
    }
    if (f.numIrred === 1) {
      return `\\dfrac{\\pi}{${f.denIrred}}`
    }
    if (f.numIrred === -1) {
      return `-\\dfrac{\\pi}{${f.denIrred}}`
    }
    return `\\dfrac{${f.numIrred}\\pi}{${f.denIrred}}`
  }

  private cadran(numerateur: number, denominateur: number) {
    const doubleNumerateur = 2 * numerateur
    if (doubleNumerateur < denominateur) {
      return {
        roman: 'I',
      }
    }
    if (doubleNumerateur < 2 * denominateur) {
      return {
        roman: 'II',
      }
    }
    if (doubleNumerateur < 3 * denominateur) {
      return {
        roman: 'III',
      }
    }
    return {
      roman: 'IV',
    }
  }

  private estSurUnAxe(numerateur: number, denominateur: number) {
    const doubleNumerateur = 2 * numerateur
    return (
      numerateur === 0 ||
      doubleNumerateur === denominateur ||
      numerateur === denominateur ||
      doubleNumerateur === 3 * denominateur
    )
  }

  private texMultipleDeuxPi(quotient: number) {
    if (quotient === 0) return ''
    return `${ecritureAlgebrique(quotient)}\\times 2\\pi`
  }
}

