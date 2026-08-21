import { addMathaleaQcm } from '../../lib/customElements/MathaleaQcm'
import { ajouteSelecteurQuestionsDeCours } from '../../lib/customElements/QuestionsDeCoursSelecteur'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import {
  ajouteChampTexte,
  ajouteChampTexteMathLive,
} from '../../lib/interactif/questionMathLive'
import { shuffle } from '../../lib/outils/arrayOutils'
import {
  type QuestionDeCours,
  questionDeCoursParId,
  questionsDeCours,
} from '../../lib/questionsDeCours/banque'
import { globalOptions } from '../../lib/stores/globalOptions'
import type { OptionsComparaisonType } from '../../lib/types'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'
import { get } from 'svelte/store'

export const titre = 'Questions de cours'
export const dateDePublication = '20/08/2026'
export const interactifReady = true
export const uuid = 'afd39'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * Version native de l'app « Questions de cours » (jusqu'ici affichée dans une
 * iframe par `src/exercices/apps/questions-de-cours.ts`, qui reste en place).
 *
 * L'enseignant choisit des questions dans la banque
 * (`src/lib/questionsDeCours/banque.ts`) ; MathALÉA se charge du reste :
 * interactivité, corrections, barème, impression et export.
 *
 * @author Rémi Angot
 */
export default class QuestionsDeCours extends Exercice {
  constructor() {
    super()
    this.consigne = ''
    this.nbQuestions = 5
    this.nbCols = 1
    this.nbColsCorr = 1
    this.interactifReady = true
    this.besoinFormulaireTexte = [
      'Questions choisies',
      'Identifiants séparés par des virgules. Laisser vide pour tirer au hasard dans toute la banque.',
    ]
    this.sup = ''
  }

  nouvelleVersion() {
    const { choisies, questions, inconnus } = this.selectionDeQuestions()
    this.introduction = this.enTeteVueProf(choisies, inconnus)
    // On ne touche pas à `this.nbQuestions` : le réglage de l'enseignant doit
    // survivre à une sélection momentanément plus courte, sans quoi il resterait
    // bloqué sur la plus petite valeur rencontrée.
    const nombreDeQuestions = Math.min(this.nbQuestions, questions.length)
    const tirage = shuffle(questions).slice(0, nombreDeQuestions)

    for (let i = 0; i < tirage.length; i++) {
      const question = tirage[i]
      let texte = question.question
      let texteCorr = question.correction ?? correctionParDefaut(question)

      if (question.type === 'qcm') {
        const optionsQcm = { radio: true, ordered: true, vertical: false }
        handleAnswers(
          this,
          i,
          {
            qcm: {
              enonce: texte,
              correction: texteCorr,
              options: optionsQcm,
              propositions: question.propositions.map((proposition) => ({
                texte: proposition,
                statut: question.answers.includes(proposition),
              })),
            },
          },
          { formatInteractif: 'mathalea-qcm' },
        )
        if (context.isHtml) {
          texte += addMathaleaQcm(this, i, {
            ...optionsQcm,
            interactivityOn: this.interactif,
          })
        } else if (!context.isAmc) {
          const qcmLatex = propositionsQcm(this, i)
          texte += qcmLatex.texte
          texteCorr += qcmLatex.texteCorr
        }
      } else if (question.type === 'text') {
        handleAnswers(
          this,
          i,
          {
            reponse: {
              value: reponsesTexteAcceptees(question),
              options: { texteSansCasse: true },
            },
          },
          { formatInteractif: 'mathalea-textfield' },
        )
        texte += champDeSaisie(
          ajouteChampTexte(this, i, KeyboardType.alphanumeric),
        )
      } else {
        handleAnswers(this, i, {
          reponse: {
            value: question.answers,
            options: optionsDeComparaison(question),
          },
        })
        texte += champDeSaisie(
          ajouteChampTexteMathLive(
            this,
            i,
            KeyboardType.clavierPersonnalisable,
            { dataKeys: question.keys },
          ),
        )
      }

      this.listeQuestions[i] = texte
      this.listeCorrections[i] = texteCorr
    }
    listeQuestionsToContenu(this)
  }

  /**
   * Les questions retenues par l'enseignant, dans l'ordre de la banque. Une
   * sélection vide vaut « toute la banque » : l'exercice reste utilisable avant
   * tout réglage.
   */
  private selectionDeQuestions(): {
    choisies: QuestionDeCours[]
    questions: QuestionDeCours[]
    inconnus: string[]
  } {
    const ids = String(this.sup ?? '')
      .split(/[,;\s]+/)
      .filter((id) => id !== '')
    const choisies: QuestionDeCours[] = []
    const inconnus: string[] = []
    for (const id of ids) {
      const question = questionDeCoursParId(id)
      // Une sélection partagée peut contenir l'id d'une question retirée de la
      // banque : on l'ignore plutôt que de casser tout l'exercice.
      if (question === undefined) inconnus.push(id)
      else if (!choisies.includes(question)) choisies.push(question)
    }
    return {
      choisies,
      questions: choisies.length > 0 ? choisies : questionsDeCours,
      inconnus,
    }
  }

  /**
   * En vue enseignante uniquement : le sélecteur de questions, suivi le cas
   * échéant d'un avertissement sur les identifiants inconnus. L'élève et les
   * exports n'en voient rien.
   */
  private enTeteVueProf(
    choisies: QuestionDeCours[],
    inconnus: string[],
  ): string {
    const vue = get(globalOptions).v
    const estVueProf = vue === undefined || vue === ''
    if (!context.isHtml || context.isTypst || context.isAmc || !estVueProf) {
      return ''
    }
    const selecteur = ajouteSelecteurQuestionsDeCours({
      numeroExercice: this.numeroExercice ?? 0,
      selection: choisies.map((question) => question.id),
      nbQuestions: this.nbQuestions,
    })
    if (inconnus.length === 0) return selecteur
    const pluriel = inconnus.length > 1 ? 's' : ''
    return (
      selecteur +
      `<span class="text-sm italic">Identifiant${pluriel} inconnu${pluriel} et ignoré${pluriel} : ${inconnus.join(', ')}.</span>`
    )
  }
}

/**
 * Ce qui suit l'énoncé d'une question à saisie : le champ interactif quand il
 * existe, et sinon des pointillés à compléter dans les sorties imprimables.
 */
function champDeSaisie(champ: string): string {
  if (champ !== '') return '<br>' + champ
  // `context.isHtml` reste vrai pendant la régénération pour Typst : les
  // pointillés doivent y apparaître comme dans la sortie LaTeX.
  return context.isHtml && !context.isTypst ? '' : ' \\dotfill'
}

/** Traduction des modes de comparaison de la banque en options MathALÉA. */
function optionsDeComparaison(
  question: QuestionDeCours,
): OptionsComparaisonType {
  switch (question.comparison) {
    case 'expressionsForcementReduites':
      return { expressionsForcementReduites: true }
    // `isSame` exigeait dans l'app l'écriture exacte attendue ; la seule
    // question concernée demande une factorisation, ce que MathALÉA sait
    // vérifier explicitement.
    case 'isSame':
      return { factorisation: true }
    default:
      return {}
  }
}

/** La correction affichée quand le JSON n'en fournit pas. */
function correctionParDefaut(question: QuestionDeCours): string {
  if (question.type === 'math') return `$${question.answers[0]}$`
  return question.answers[0]
}

function sansAccents(texte: string): string {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/**
 * La comparaison de textes de MathALÉA ignore la casse mais pas les accents :
 * on accepte donc explicitement les variantes sans accents.
 */
function reponsesTexteAcceptees(question: QuestionDeCours): string[] {
  const reponses = new Set<string>()
  for (const answer of question.answers) {
    reponses.add(answer)
    reponses.add(sansAccents(answer))
  }
  return [...reponses]
}
