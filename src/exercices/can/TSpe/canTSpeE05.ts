import type { MathfieldElement } from 'mathlive'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../../lib/interactif/questionMathLive'
import { ecritureAlgebriqueSauf1, rienSi1 } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'

export const titre = 'Déterminer un vecteur normal à un plan.'
export const dateDePublication = '28/01/2025'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 *
 * @author
 */

export const uuid = '0cd98'
export const refs = {
  'fr-fr': ['canTSpeE05'],
  'fr-ch': ['3mGeomVect-2'],
}

export default class MilieuSegment extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierFullOperations
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      const a = randint(-10, 10, 0)
      const b = randint(-10, 10, 0)
      const c = randint(-10, 10, 0)
      const d = randint(-10, 10)
      const callback = (exercice: Exercice, question: number) => {
        const mfe = document.querySelector(
          `#champTexteEx${exercice.numeroExercice}Q${question}`,
        ) as MathfieldElement
        if (mfe == null)
          return {
            isOk: false,
            feedback: '',
            score: { nbBonnesReponses: 0, nbReponses: 0 },
          }
        const aa = Number(mfe.getPromptValue('champ1') || 0)
        const bb = Number(mfe.getPromptValue('champ2') || 0)
        const cc = Number(mfe.getPromptValue('champ3') || 0)
        const isOk =
          aa !== 0 &&
          bb !== 0 &&
          cc !== 0 &&
          aa / a === bb / b &&
          bb / b === cc / c
        if (isOk) {
          mfe.setPromptState('champ1', 'correct', true)
          mfe.setPromptState('champ2', 'correct', true)
          mfe.setPromptState('champ3', 'correct', true)
        }
        const spanReponseLigne = document.querySelector(
          `#resultatCheckEx${exercice.numeroExercice}Q${question}`,
        )
        if (spanReponseLigne != null) {
          spanReponseLigne.innerHTML = isOk ? '😎' : '☹️'
        }
        return {
          isOk,
          feedback: '',
          score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
        }
      }

      texte = ` Dans un repère orthonormé de l'espace $\\big(O ; \\vec \\imath,\\vec \\jmath, \\vec k\\big)$, on donne une équation cartésienne d'un plan $\\mathcal{P}$ : <br> $\\mathcal{P}~:~${rienSi1(a)}x ${ecritureAlgebriqueSauf1(b)}y${ecritureAlgebriqueSauf1(c)}z${ecritureAlgebriqueSauf1(d)}=0$.<br>`
      texte += "<br>Donner les coordonnées d'un vecteur normal à $\\mathcal{P}$"

      if (this.interactif) {
        texte +=
          ': ' +
          remplisLesBlancs(
            this,
            i,
            '\\vec{n}(%{champ1}~;~%{champ2}~;~%{champ3}).',
          )
      } else texte += '.'
      handleAnswers(this, i, {
        champ1: { value: a },
        champ2: { value: b },
        champ3: { value: c },
        callback,
      })
      texteCorr =
        "On sait qu'un plan dont l'équation cartésienne est donnée par $ax+by+cz+d=0$,<br> (avec $a,b,c,d$ des réels)  admet le vecteur $\\vec{n}\\begin{pmatrix}a\\\\b\\\\c\\end{pmatrix}$ comme vecteur normal.<br>"
      texteCorr += `Il vient : $\\vec{n}\\begin{pmatrix}${miseEnEvidence(a)}\\\\${miseEnEvidence(b)}\\\\${miseEnEvidence(c)}\\end{pmatrix}$.<br>`
      texteCorr +=
        'Tout vecteur colinéaire à $\\vec{n}$ est aussi normal au plan $\\mathcal{P}$'
      if (this.questionJamaisPosee(i, texte)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
