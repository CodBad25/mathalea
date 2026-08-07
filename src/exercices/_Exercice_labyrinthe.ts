import { Labyrinthe } from 'labyrinthe'
import MathaleaLabyrintheElement from '../lib/customElements/MathaleaLabyrintheElement'
import { context } from '../modules/context'
import { listeQuestionsToContenu } from '../modules/outils'
import Exercice from './Exercice'
export const interactifReady = true
export const interactifType = 'custom'

/**
 * @author Rémi Angot
 */
export default class ExerciceLabyrinthe extends Exercice {
  consigneDeplacement =
    '<br>Dans ce labyrinthe, on peut se déplacer horizontalement, verticalement et en diagonale.'
  labyrinthe!: Labyrinthe
  labyrintheElement!: MathaleaLabyrintheElement
  cols = 6
  rows = 6
  orientation?: 'horizontal' | 'vertical'
  goodAnswers: string[] = []
  badAnswers: string[] = []

  constructor() {
    super()
    this.nbQuestions = 1
    this.interactifObligatoire = true
    this.nbQuestionsModifiable = false
    this.exoCustomResultat = true
  }

  init() {}

  nouvelleVersion() {
    this.goodAnswers = []
    this.badAnswers = []

    this.labyrinthe = new Labyrinthe({
      seed: this.seed,
      rows: this.rows,
      cols: this.cols,
      orientation: this.orientation,
    })
    this.init()
    this.labyrinthe.regenerate()

    const actualGoodCount = this.labyrinthe.numberOfGoodAnswers()
    const actualBadCount = this.labyrinthe.numberOfIncorrectAnswers()

    for (let i = 0; i < actualGoodCount; i++) {
      this.goodAnswers.push(String(this.generateGoodAnswers()))
    }
    for (let i = 0; i < actualBadCount; i++) {
      this.badAnswers.push(String(this.generateBadAnswers()))
    }

    let texte = ''
    let texteCorr = ''
    if (context.isHtml && !context.isTypst) {
      texte = `${MathaleaLabyrintheElement.create({
        id: `labyrintheEx${this.numeroExercice}Q0`,
        seed: this.seed ?? '',
        rows: this.rows,
        cols: this.cols,
        orientation: this.orientation,
        goodAnswers: this.goodAnswers,
        badAnswers: this.badAnswers,
        disabled: !this.interactif,
        numeroExercice: this.numeroExercice,
      })}
      <div id=${`feedbackEx${this.numeroExercice}Q${0}`}
        class="ml-2 py-2 text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest"
        >
      </div>`

      texteCorr = MathaleaLabyrintheElement.create({
        id: `labyrintheCorrectionExo${this.numeroExercice}Question0`,
        seed: this.seed ?? '',
        rows: this.rows,
        cols: this.cols,
        orientation: this.orientation,
        goodAnswers: this.goodAnswers,
        badAnswers: this.badAnswers,
        correction: true,
        disabled: true,
      })
    } else {
      if (context.isTypst) {
        // La conversion HTML→Typst ne traite le LaTeX que dans du texte
        // délimité par des `$...$` : le tableau du labyrinthe doit donc y
        // être enveloppé pour être reconnu et transformé en `#table(...)`.
        // Chaque cellule est remise en mode maths par ce convertisseur : les
        // réponses des sous-classes qui portent déjà leurs propres `$...$`
        // (ex. fractions) doivent en être retirées pour éviter un `$...$`
        // imbriqué.
        const stripMathDelimiters = (s: string): string => {
          const trimmed = s.trim()
          return trimmed.startsWith('$') &&
            trimmed.endsWith('$') &&
            trimmed.length > 1
            ? trimmed.slice(1, -1)
            : trimmed
        }
        this.labyrinthe.setValues(
          this.goodAnswers.map(stripMathDelimiters),
          this.badAnswers.map(stripMathDelimiters),
        )
        texte = `$${this.labyrinthe.generateLatex()}$`
        texteCorr = `$${this.labyrinthe.generateLatexCorrection()}$`
      } else {
        this.labyrinthe.setValues(this.goodAnswers, this.badAnswers)
        texte = `\n\n\\bigskip\n{\\renewcommand{\\arraystretch}{2}${this.labyrinthe.generateLatex()}}`
        texteCorr = `{\\renewcommand{\\arraystretch}{2}${this.labyrinthe.generateLatexCorrection()}}`
      }
    }

    this.listeQuestions[0] = texte
    this.listeCorrections[0] = texteCorr
    listeQuestionsToContenu(this)
  }

  generateGoodAnswers(): number | string {
    return 1
  }

  generateBadAnswers(): number | string {
    return 0
  }

  correctionInteractive = (i: number) => {
    if (this.answers == null) this.answers = {}
    const labyrintheElement = document.querySelector<MathaleaLabyrintheElement>(
      `#labyrintheEx${this.numeroExercice}Q0`,
    )
    if (labyrintheElement == null) {
      throw new Error('Labyrinthe not found')
    }
    this.labyrintheElement = labyrintheElement
    this.answers[`labyrintheEx${this.numeroExercice}Q0`] =
      this.labyrintheElement.state
    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    )
    const isValid = this.labyrintheElement.win
    if (divFeedback != null) {
      if (isValid) {
        divFeedback.innerHTML = 'Bravo !'
        return ['OK', 'OK', 'OK', 'OK']
      }
      const ratio =
        this.labyrintheElement.correctClicks / this.labyrintheElement.totalGood
      if (ratio <= 0.25) {
        return ['KO', 'KO', 'KO', 'KO']
      } else if (ratio <= 0.5) {
        return ['OK', 'KO', 'KO', 'KO']
      } else if (ratio <= 0.75) {
        return ['OK', 'OK', 'KO', 'KO']
      }
      return ['OK', 'OK', 'KO', 'KO']
    }
    throw new Error('Feedback not found')
  }
}
