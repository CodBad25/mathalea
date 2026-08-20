import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

/**
 * Élément d'ancrage d'une question `custom` réhébergée par un méta-exercice.
 *
 * Un exercice `interactifType = 'custom'` corrige lui-même ses questions via
 * `correctionInteractive(i)` : il n'a pas de custom element pour le faire à sa
 * place. Quand `MetaExerciceCan` agrège un tel exercice comme une question
 * parmi d'autres, il faut pourtant que le moteur générique (barème, bouton
 * « Vérifier », vue CAN, question par page) sache la corriger comme n'importe
 * quelle autre.
 *
 * Cet élément est ce pont : il ne rend rien, il porte simplement l'identité de
 * la question et la `correctionInteractive` du sous-exercice, enregistrée en
 * callback dans un registre statique. `verifQuestion()` fait le reste, si bien
 * que le dispatch passe par `mathaleaCustomElementsRegistry` comme pour tous
 * les autres formats.
 */

export type MetaCustomEntry = {
  /** Le sous-exercice, gardé vivant par la fermeture qui appelle sa correction */
  exercice: IExercice
  /** Appelle `correctionInteractive` du sous-exercice avec le bon `this` */
  run: (i: number) => string | string[]
  /** Nombre de points que la question peut rapporter (barème) */
  pointsMax: number
}

export type MetaCustomOptions = {
  id?: string
  numeroExercice: number
  questionIndex: number
  callbackKey: string
  pointsMax?: number
}

export type VerifResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

export class MetaCustomElement extends MathaleaCustomElement {
  static readonly elementTag = 'meta-custom'

  private static readonly entries = new Map<string, MetaCustomEntry>()

  static registerCallback(key: string, entry: MetaCustomEntry): void {
    MetaCustomElement.entries.set(key, entry)
  }

  static unregisterCallback(key: string): void {
    MetaCustomElement.entries.delete(key)
  }

  /**
   * Oublie tous les callbacks dont la clé commence par `prefix`.
   * Utilisé par le méta-exercice à chaque nouvelle version pour ne pas garder
   * de référence sur les sous-exercices de la version précédente.
   */
  static unregisterCallbacksWithPrefix(prefix: string): void {
    for (const key of [...MetaCustomElement.entries.keys()]) {
      if (key.startsWith(prefix)) MetaCustomElement.entries.delete(key)
    }
  }

  static getEntry(key: string): MetaCustomEntry | undefined {
    return MetaCustomElement.entries.get(key)
  }

  static idFor(numeroExercice: number, questionIndex: number): string {
    return `${MetaCustomElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
  }

  /** Clé de callback canonique d'une question réhébergée */
  static keyFor(numeroExercice: number, questionIndex: number): string {
    return `${MetaCustomElement.elementTag}:${numeroExercice}:${questionIndex}`
  }

  static create({
    id,
    numeroExercice,
    questionIndex,
    callbackKey,
    pointsMax = 1,
  }: MetaCustomOptions): string {
    return super.create({
      id: id ?? MetaCustomElement.idFor(numeroExercice, questionIndex),
      numeroExercice,
      questionIndex,
      callbackKey,
      pointsMax,
    })
  }

  /**
   * Normalise le retour de `correctionInteractive` :
   * un tableau vaut un point par entrée, une chaîne vaut un point.
   */
  private static toScore(result: string | string[]): VerifResult {
    if (Array.isArray(result)) {
      const nbReponses = result.length
      const nbBonnesReponses = result.filter((r) => r === 'OK').length
      return {
        isOk: nbReponses > 0 && nbBonnesReponses === nbReponses,
        feedback: '',
        score: { nbBonnesReponses, nbReponses },
      }
    }
    const isOk = result === 'OK'
    return {
      isOk,
      feedback: '',
      score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
    }
  }

  private static entryFromDom(
    exercice: IExercice,
    questionIndex: number,
  ): MetaCustomEntry | undefined {
    const element = document.querySelector(
      `#${MetaCustomElement.idFor(exercice.numeroExercice ?? 0, questionIndex)}`,
    )
    const key =
      element?.getAttribute('callback-key') ??
      MetaCustomElement.keyFor(exercice.numeroExercice ?? 0, questionIndex)
    return MetaCustomElement.entries.get(key)
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): VerifResult {
    const entry = MetaCustomElement.entryFromDom(exercice, questionIndex)
    if (entry == null) {
      window.notify(
        `Aucune correction custom enregistrée pour la question ${questionIndex}`,
        { exercice: exercice.uuid, questionIndex },
      )
      return {
        isOk: false,
        feedback: '',
        score: { nbBonnesReponses: 0, nbReponses: 1 },
      }
    }
    const result = entry.run(questionIndex)
    // Les réponses de l'élève sont stockées par le sous-exercice : on les
    // remonte sur l'exercice affiché, seul connu des vues et du LMS.
    if (entry.exercice.answers != null) {
      exercice.answers = { ...exercice.answers, ...entry.exercice.answers }
    }
    return MetaCustomElement.toScore(result)
  }

  static pointsMaxQuestion(exercice: IExercice, questionIndex: number): number {
    const entry = MetaCustomElement.entryFromDom(exercice, questionIndex)
    return entry?.pointsMax ?? 1
  }

  /**
   * La question de la CAN est affichée telle quelle dans les corrections :
   * l'ancre n'a plus rien à y faire, elle pointerait vers un callback dont le
   * sous-exercice n'est plus monté.
   */
  static stripFromQuestionHtml(questionHtml: string): string {
    return questionHtml.replace(
      new RegExp(
        `<${MetaCustomElement.elementTag}\\b[^>]*>\\s*</${MetaCustomElement.elementTag}>`,
        'gi',
      ),
      '',
    )
  }
}

registerMathaleaCustomElement(MetaCustomElement)
