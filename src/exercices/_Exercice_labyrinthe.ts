import { Labyrinthe } from 'labyrinthe'
import type LabyrintheElement from 'labyrinthe/src/LabyrintheElement'
import { context } from '../modules/context'
import { listeQuestionsToContenu } from '../modules/outils'
import Exercice from './Exercice'

/**
 * @author Rémi Angot
 */
export default class ExerciceLabyrinthe extends Exercice {
  consigneDeplacement =
    '<br>Dans ce labyrinthe, on peut se déplacer horizontalement, verticalement et en diagonale.'
  labyrinthe!: Labyrinthe
  labyrintheElement!: LabyrintheElement
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

    if (this.labyrintheElement) {
      this.labyrintheElement.remove()
    }

    let texte = ''
    let texteCorr = ''
    if (context.isHtml && !context.isTypst) {
      texte = `<div
        id="containerLabyrintheEx${this.numeroExercice}Q${0}">
      </div>
      <div id=${`feedbackEx${this.numeroExercice}Q${0}`}
        class="ml-2 py-2 text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest"
        >
      </div>`

      texteCorr = `<div
        id="containerLabyrintheCorrectionEx${this.numeroExercice}Q${0}">
      </div>`
      document.addEventListener('exercicesAffiches', async () => {
        const container = document.querySelector(
          `#containerLabyrintheEx${this.numeroExercice}Q${0}`,
        )
        const containerCorrection = document.querySelector(
          `#containerLabyrintheCorrectionEx${this.numeroExercice}Q${0}`,
        )
        if (container) {
          if (!this.labyrintheElement?.isConnected) {
            container.innerHTML = ''
            // Modèle temporaire
            this.labyrinthe = new Labyrinthe({
              seed: this.seed,
              rows: this.rows,
              cols: this.cols,
              orientation: this.orientation,
            })
            this.init()
            if (!customElements.get('labyrinthe-grid')) {
              const { default: LabyrintheElement } =
                await import('labyrinthe/src/LabyrintheElement')
              try {
                customElements.define(
                  'labyrinthe-grid',
                  LabyrintheElement as any,
                )
              } catch {}
            }
            const el = document.createElement(
              'labyrinthe-grid',
            ) as LabyrintheElement
            el.seed = this.seed ?? ''
            el.rows = this.rows
            el.cols = this.cols
            if (this.orientation) {
              el.orientation = this.orientation
            }
            container.innerHTML = ''
            // Cela lance connectedCallback qui regénère le chemin
            container.appendChild(el)
            await new Promise<void>((resolve) => {
              const checkReady = () => {
                if (el.ready) {
                  resolve()
                } else {
                  setTimeout(checkReady, 30)
                }
              }
              checkReady()
            })

            this.labyrintheElement = el
            const actualGoodCount =
              this.labyrintheElement.numberOfGoodAnswers ?? 0
            const actualBadCount =
              this.labyrintheElement.numberOfIncorrectAnswers ?? 0

            // Nouveau labyrinthe avec le même seed
            this.labyrinthe = new Labyrinthe({
              seed: this.seed,
              rows: this.rows,
              cols: this.cols,
              orientation: this.orientation,
            })
            this.labyrinthe.regenerate()

            // Generate values using our labyrinthe's RNG
            this.goodAnswers = []
            this.badAnswers = []
            for (let i = 0; i < actualGoodCount; i++) {
              this.goodAnswers.push(String(this.generateGoodAnswers()))
            }
            for (let i = 0; i < actualBadCount; i++) {
              this.badAnswers.push(String(this.generateBadAnswers()))
            }
            this.labyrintheElement.setValues(this.goodAnswers, this.badAnswers)
            this.labyrintheElement.addEventListener(
              'labyrinthe:gameend',
              (e: Event) => {
                const btnScore = document.querySelector(
                  `#buttonScoreEx${this.numeroExercice}`,
                )
                ;(btnScore as HTMLButtonElement)?.click()
              },
            )
          }
          this.labyrintheElement.id = `labyrintheEx${this.numeroExercice}`
          if (!this.interactif) {
            this.labyrintheElement.disabled = true
          }
        }
        if (containerCorrection) {
          containerCorrection.innerHTML = ''
          const elCorrection = document.createElement(
            'labyrinthe-grid',
          ) as LabyrintheElement
          elCorrection.seed = this.seed ?? ''
          elCorrection.rows = this.rows
          elCorrection.cols = this.cols
          if (this.orientation) {
            elCorrection.orientation = this.orientation
          }

          containerCorrection.appendChild(elCorrection)

          await new Promise<void>((resolve) => {
            const checkReady = () => {
              if (elCorrection.ready) {
                resolve()
              } else {
                setTimeout(checkReady, 30)
              }
            }
            checkReady()
          })

          elCorrection.setValues(this.goodAnswers, this.badAnswers)
          elCorrection.showCorrection()
        }
      })

      setTimeout(() => {
        // Gestion particulière du bouton score
        const btnScore = document.querySelector(
          `#buttonScoreEx${this.numeroExercice}`,
        )
        if (btnScore) {
          ;(btnScore as HTMLButtonElement).style.display = 'none'
        }
      }, 500)
    } else {
      this.labyrinthe = new Labyrinthe({
        seed: this.seed,
        rows: this.rows,
        cols: this.cols,
        orientation: this.orientation,
      })
      this.init()
      this.labyrinthe.regenerate()
      let actualGoodCount = 0
      let actualBadCount = 0
      const grid = (this.labyrinthe as any).grid
      if (grid && Array.isArray(grid)) {
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const cell = grid[r]?.[c]
            if (cell?.isGood === true) {
              actualGoodCount++
            } else if (cell?.isGood === false) {
              actualBadCount++
            }
          }
        }
      }

      this.goodAnswers = []
      this.badAnswers = []
      for (let i = 0; i < actualGoodCount; i++) {
        this.goodAnswers.push(String(this.generateGoodAnswers()))
      }
      for (let i = 0; i < actualBadCount; i++) {
        this.badAnswers.push(String(this.generateBadAnswers()))
      }

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
        texte = `\n\n\\bigskip\n${this.labyrinthe.generateLatex()}`
        texteCorr = this.labyrinthe.generateLatexCorrection()
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
    this.answers[`labyrintheEx${this.numeroExercice}`] =
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
