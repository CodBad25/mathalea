import { handleAnswers } from '../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../lib/interactif/questionMathLive'
import { KeyboardType } from '../lib/interactif/claviers/keyboard'
import ExerciceQcmA from './ExerciceQcmA'

type ExerciceAvecSaisie = ExerciceQcmA & {
  reponseCourte?: () => string
  enonceCourt?: () => string
  correctionCourte?: () => string
  clavierReponseCourte?: string
}

export function genereReponsesCourtes(exercice: ExerciceAvecSaisie) {
  exercice.consigne = ''
  for (let i = 0, cpt = 0; i < exercice.nbQuestions && cpt < 30; cpt++) {
    if (exercice.sup && exercice.versionOriginale != null) exercice.versionOriginale()
    else exercice.versionAleatoire()

    const reponse = exercice.reponseCourte?.() ?? exercice.reponses[0]
      .replace(/^\$|\$$/g, '')
      .replace(/\\(?:text|mathrm)\{[^}]*\}/g, '')
      .replace(/\\,|\\ /g, '')
      .trim()
    const enonce = exercice.enonceCourt?.() ?? exercice.enonce
    if (exercice.questionJamaisPosee(i, enonce, reponse)) {
      exercice.listeQuestions[i] = enonce + (exercice.interactif
        ? `<br>${ajouteChampTexteMathLive(exercice, i, exercice.clavierReponseCourte ?? KeyboardType.clavierDeBase)}`
        : '')
      exercice.listeCorrections[i] = exercice.correctionCourte?.() ?? exercice.correction ?? ''
      handleAnswers(exercice, i, { reponse: { value: reponse } }, { formatInteractif: 'mathalea-mathfield' })
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

  constructor() {
    super()
    this.sup3 = false
    this.besoinFormulaire3CaseACocher = ['Mode QCM', false]
  }

  nouvelleVersion() {
    if (this.sup3) {
      super.nouvelleVersion()
      return
    }

    genereReponsesCourtes(this)
  }
}
