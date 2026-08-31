import { htmlToTypst } from '../../components/setup/typst/latexToTypst'
import { minimalCorrection } from '../../components/setup/typst/minimalCorrection'
import type {
  OmrColonneNumerique,
  OmrExerciceSource,
  OmrQuestionSource,
} from './buildOmrDocument'

/**
 * Conversion des exercices MathALÉA en questions à lecture optique.
 *
 * On part du rendu **HTML** de l'exercice, et non de son rendu LaTeX pour AMC :
 * `htmlToTypst` sait déjà transformer ce HTML en Typst — c'est ce que fait la
 * vue « Impression » — alors qu'aucune passerelle LaTeX vers Typst n'existe
 * pour les énoncés. La structure des réponses, elle, vient de `autoCorrection`,
 * remplie par le moteur interactif.
 */

/** La forme minimale d'exercice dont cette conversion a besoin. */
export interface ExercicePourOmr {
  id?: string
  titre?: string
  amcType?: string
  listeQuestions: string[]
  listeCorrections?: string[]
  autoCorrection?: unknown[]
  /** Points par question ; à défaut, 1 point chacune */
  pointsParQuestion?: number
}

/** Une proposition telle que la remplit le moteur interactif. */
interface PropositionBrute {
  texte?: string
  statut?: boolean
}

/** Nombre de points d'une question. */
function points(exercice: ExercicePourOmr): number {
  const valeur = exercice.pointsParQuestion
  return Number.isFinite(valeur) && (valeur as number) > 0
    ? (valeur as number)
    : 1
}

/**
 * Colonnes de chiffres codant une réponse numérique.
 *
 * Le nombre de colonnes suit celui des chiffres attendus : une réponse à trois
 * chiffres n'a aucune raison d'occuper la place d'une réponse à six. Le signe
 * n'obtient sa colonne que si la réponse est négative.
 */
export function colonnesNumeriques(valeur: string): OmrColonneNumerique[] {
  const negatif = valeur.trim().startsWith('-')
  const chiffres = valeur.replace(/[^0-9]/g, '')
  const colonnes: OmrColonneNumerique[] = []
  if (negatif) {
    colonnes.push({ label: 'signe', attendu: '-', valeurs: ['+', '-'] })
  }
  const decimales = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  for (const chiffre of chiffres) {
    colonnes.push({ attendu: chiffre, valeurs: decimales })
  }
  return colonnes
}

/** Identifiant court et stable d'une question dans le document. */
export function identifiantQuestion(
  indexExercice: number,
  indexQuestion: number,
): string {
  return `e${indexExercice}q${indexQuestion}`
}

/**
 * Convertit une question d'un exercice.
 *
 * @returns `null` quand la question n'a pas de structure de réponse
 *   exploitable — elle est alors simplement ignorée, plutôt que d'imprimer une
 *   question sans case, que la lecture optique ne saurait pas noter
 */
export function questionDepuisAutoCorrection(
  exercice: ExercicePourOmr,
  indexExercice: number,
  indexQuestion: number,
  figures?: string[],
): OmrQuestionSource | null {
  const qid = identifiantQuestion(indexExercice, indexQuestion)
  const brut = (exercice.autoCorrection ?? [])[indexQuestion] as
    | {
        enonce?: string
        propositions?: PropositionBrute[]
        reponse?: { valeur?: unknown }
      }
    | undefined
  const enonceSource =
    brut?.enonce ?? exercice.listeQuestions[indexQuestion] ?? ''
  const enonce = htmlToTypst(enonceSource, figures)
  const pointsQuestion = points(exercice)
  // la correction est convertie ici, avec l'énoncé : elle n'est pas imprimée
  // sur la copie de l'élève mais dans le corrigé du professeur, quand il le
  // demande (`OmrDocumentOptions.corrige`)
  const correctionSource = exercice.listeCorrections?.[indexQuestion] ?? ''
  const correction =
    correctionSource === '' ? undefined : htmlToTypst(correctionSource, figures)
  // les deux versions sont converties d'avance : `minimalCorrection` travaille
  // sur le HTML, que `buildOmrDocument` ne connaît pas — c'est ce qui le garde
  // indépendant du moteur d'exercices
  const correctionMinimale =
    correctionSource === ''
      ? undefined
      : htmlToTypst(minimalCorrection(correctionSource), figures)

  const propositions = (brut?.propositions ?? []).filter(
    (proposition) => typeof proposition?.texte === 'string',
  )
  if (propositions.length > 0) {
    const converties = propositions.map((proposition) => ({
      texte: htmlToTypst(proposition.texte as string, figures),
      correct: proposition.statut === true,
    }))
    const nbCorrectes = converties.filter((p) => p.correct).length
    return {
      qid,
      type:
        exercice.amcType === 'qcmMult' || nbCorrectes > 1
          ? 'qcmMult'
          : 'qcmMono',
      enonce,
      correction,
      correctionMinimale,
      points: pointsQuestion,
      propositions: converties,
    }
  }

  const valeur = brut?.reponse?.valeur
  if (typeof valeur === 'string' || typeof valeur === 'number') {
    const colonnes = colonnesNumeriques(String(valeur))
    if (colonnes.length > 0) {
      return {
        qid,
        type: 'AMCNum',
        enonce,
        correction,
        correctionMinimale,
        points: pointsQuestion,
        colonnes,
      }
    }
  }

  if (exercice.amcType === 'AMCOpen') {
    return {
      qid,
      type: 'AMCOpen',
      enonce,
      correction,
      correctionMinimale,
      points: pointsQuestion,
    }
  }
  return null
}

/** Convertit toutes les questions d'un exercice. */
export function questionsDepuisExercice(
  exercice: ExercicePourOmr,
  indexExercice: number,
  figures?: string[],
): OmrQuestionSource[] {
  const questions: OmrQuestionSource[] = []
  for (let i = 0; i < exercice.listeQuestions.length; i++) {
    const question = questionDepuisAutoCorrection(
      exercice,
      indexExercice,
      i,
      figures,
    )
    if (question != null) questions.push(question)
  }
  return questions
}

/**
 * Convertit une liste d'exercices en gardant le groupement.
 *
 * L'exercice est l'unité que règle la palette de l'aperçu — colonnes,
 * espacement, insertion après lui : l'aplatir ferait perdre cette prise.
 * Un exercice dont aucune question ne se prête à la lecture optique est écarté
 * plutôt que d'imprimer un titre sans question dessous.
 */
export function exercicesDepuisExercices(
  exercices: readonly ExercicePourOmr[],
  figures?: string[],
): OmrExerciceSource[] {
  return exercices
    .map((exercice, index) => ({
      titre: exercice.titre,
      questions: questionsDepuisExercice(exercice, index, figures),
    }))
    .filter((exercice) => exercice.questions.length > 0)
}

/** Toutes les questions d'une liste d'exercices, exercices confondus. */
export function questionsDepuisExercices(
  exercices: readonly ExercicePourOmr[],
): OmrQuestionSource[] {
  return exercices.flatMap((exercice, index) =>
    questionsDepuisExercice(exercice, index),
  )
}
