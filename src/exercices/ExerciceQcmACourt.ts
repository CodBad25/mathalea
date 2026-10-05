import { addTableauSignesVariations } from '../lib/customElements/TableauSignesVariationsElement'
import { handleAnswers } from '../lib/interactif/gestionInteractif'
import {
  ajouteChampTexteMathLive,
  type OptionsChamp,
} from '../lib/interactif/questionMathLive'
import { KeyboardType } from '../lib/interactif/claviers/keyboard'
import type { TableauSVConfig } from '../lib/interactif/tableauSignesVariations/types'
import type { CompareFunction } from '../lib/types'
import ExerciceQcmA from './ExerciceQcmA'

type ExerciceAvecSaisie = ExerciceQcmA & {
  reponseCourte?: () => string
  enonceCourt?: () => string
  correctionCourte?: () => string
  clavierReponseCourte?: string
  optionsChampReponseCourte?: OptionsChamp
  compareReponseCourte?: CompareFunction
}

export function genereReponsesCourtes(exercice: ExerciceAvecSaisie) {
  exercice.consigne = ''
  for (let i = 0, cpt = 0; i < exercice.nbQuestions && cpt < 30; cpt++) {
    if (exercice.sup && exercice.versionOriginale != null)
      exercice.versionOriginale()
    else exercice.versionAleatoire()

    const reponse =
      exercice.reponseCourte?.() ??
      exercice.reponses[0]
        .replace(/^\$|\$$/g, '')
        .replace(/\\(?:text|mathrm)\{[^}]*\}/g, '')
        .replace(/\\,|\\ /g, '')
        .trim()
    const enonce = exercice.enonceCourt?.() ?? exercice.enonce
    if (exercice.questionJamaisPosee(i, enonce, reponse)) {
      exercice.listeQuestions[i] =
        enonce +
        (exercice.interactif
          ? `<br>${ajouteChampTexteMathLive(exercice, i, exercice.clavierReponseCourte ?? KeyboardType.clavierDeBase, exercice.optionsChampReponseCourte)}`
          : '')
      exercice.listeCorrections[i] =
        exercice.correctionCourte?.() ?? exercice.correction ?? ''
      handleAnswers(
        exercice,
        i,
        {
          reponse: {
            value: reponse,
            ...(exercice.compareReponseCourte
              ? { compare: exercice.compareReponseCourte }
              : {}),
          },
        },
        { formatInteractif: 'mathalea-mathfield' },
      )
      i++
    }
    if (exercice.sup) break
  }
}

/**
 * Version sans QCM où l'élève complète un tableau de signes (en interactif).
 * Les tirages sont ceux de `genereReponsesCourtes` : mêmes appels à
 * `versionOriginale`/`versionAleatoire`, dans le même ordre.
 */
export function genereTableauxDeSignes(
  exercice: ExerciceQcmA & {
    enonceCourt?: () => string
    configTableauSignes: () => TableauSVConfig
  },
) {
  exercice.consigne = ''
  for (let i = 0, cpt = 0; i < exercice.nbQuestions && cpt < 30; cpt++) {
    if (exercice.sup && exercice.versionOriginale != null)
      exercice.versionOriginale()
    else exercice.versionAleatoire()

    const enonce = exercice.enonceCourt?.() ?? exercice.enonce
    if (exercice.questionJamaisPosee(i, enonce)) {
      exercice.listeQuestions[i] =
        enonce +
        (exercice.interactif
          ? `<br>${addTableauSignesVariations(exercice, i, {
              config: exercice.configTableauSignes(),
              bareme: 1,
            })}`
          : '')
      exercice.listeCorrections[i] = exercice.correction ?? ''
      i++
    }
    if (exercice.sup) break
  }
}

/** Conserve les tirages du QCM et propose une saisie par défaut. */
export default class ExerciceQcmACourt extends ExerciceQcmA {
  reponseCourte?: () => string
  enonceCourt?: () => string
  correctionCourte?: () => string
  clavierReponseCourte?: string
  optionsChampReponseCourte?: OptionsChamp
  compareReponseCourte?: CompareFunction

  constructor() {
    super()
    this.sup3 = false
    this.besoinFormulaire3CaseACocher = ['Version QCM', false]
  }

  nouvelleVersion() {
    if (this.sup3) {
      super.nouvelleVersion()
      return
    }

    genereReponsesCourtes(this)
  }
}
