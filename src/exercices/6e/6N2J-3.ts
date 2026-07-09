import { choixDeroulant } from '../../lib/interactif/questionListeDeroulante'
import { ajouteFeedback } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import operation from '../../modules/operations'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Trouver des phrases avec les mots : divisible, diviseur et multiple'
export const interactifReady = true
export const interactifType = 'custom'

/**
 * Compléter des phrases avec les mots divisible, divieur et multiple
 * @author Rémi Angot

 */
export const uuid = 'f894a'

export const refs = {
  'fr-fr': ['6N2J-3,5N1I'],
  'fr-2016': ['6N43-4'],
  'fr-ch': ['9NO4-3'],
}
type ReponseType = [string, string]
type ReponseTypeArray = ReponseType[]
export default class DivisibleDiviseurMultiple extends Exercice {
  setReponse: (i: number, listeBonnesReponses: ReponseTypeArray) => void
  listeReponses: ReponseTypeArray[]
  constructor() {
    super()

    this.nbQuestions = 6 // 6 questions au maximum
    this.nbCols = 2 // Uniquement pour la sortie LaTeX
    this.nbColsCorr = 2 // Uniquement pour la sortie LaTeX
    this.listeReponses = []

    this.setReponse = function (
      i: number,
      listeBonnesReponses: ReponseTypeArray,
    ) {
      this.autoCorrection[i] = {}
      this.listeReponses[i] = listeBonnesReponses
    }
  }

  nouvelleVersion() {
    let b = randint(6, 17, [9, 10])
    let q = randint(11, 99)
    let r = randint(1, b - 1)
    let a = b * q
    let a1 = b * q + r
    while (q % b === 0 || q % r === 0 || b % r === 0 || a1 % r === 0) {
      b = randint(6, 17, [9, 10])
      q = randint(11, 99)
      r = randint(1, b - 1)
      a = b * q
      a1 = b * q + r
    }
    this.introduction = `À l'aide des calculs suivants, compléter les phrases suivantes avec les nombres $${texNombre(a1)}$, $${texNombre(a)}$, $${texNombre(b)}$ ou $${texNombre(q)}$.<br><br>`
    if (randint(0, 1) === 0) {
      this.introduction += operation({
        operande1: a,
        operande2: b,
        type: 'divisionE',
      })
      if (!context.isHtml) this.introduction += '\\qquad'
      this.introduction += operation({
        operande1: a1,
        operande2: b,
        type: 'divisionE',
      })
    } else {
      this.introduction += operation({
        operande1: a1,
        operande2: b,
        type: 'divisionE',
      })
      if (!context.isHtml) this.introduction += '\\qquad'
      this.introduction += operation({
        operande1: a,
        operande2: b,
        type: 'divisionE',
      })
    }

    const typesDeQuestionsDisponibles = [1, 2, 3, 4, 5, 6] // On créé 3 types de questions
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posés mais l'ordre diffère à chaque "cycle"
    for (let i = 0, texte, texteCorr; i < this.nbQuestions; i++) {
      // Boucle principale où i+1 correspond au numéro de la question
      if (listeTypeDeQuestions[i] === 1) {
        texte = '... est divisible par ...'
        if (this.interactif) {
          texte =
            choixDeroulant(this, 2 * i, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ]) +
            'est divisible par' +
            choixDeroulant(this, 2 * i + 1, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ])
        }
        texteCorr = `$${miseEnEvidence(texNombre(a, 0))}$ est divisible par $${miseEnEvidence(texNombre(b, 0))}$ ou $${miseEnEvidence(texNombre(a, 0))}$ est divisible par $${miseEnEvidence(texNombre(q, 0))}$
        car le reste de la division euclidienne de ${texNombre(a, 0)} par $${texNombre(b, 0)}$ est $0$ et le quotient est $${texNombre(q, 0)}$.`
        this.setReponse(i, [
          [String(a), String(b)],
          [String(a), String(q)],
        ])
      } else if (listeTypeDeQuestions[i] === 2) {
        texte = '... est un diviseur de ...'
        if (this.interactif) {
          texte =
            choixDeroulant(this, 2 * i, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ]) +
            'est un diviseur de' +
            choixDeroulant(this, 2 * i + 1, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ])
        }
        texteCorr = `$${miseEnEvidence(texNombre(b, 0))}$ est un diviseur de $${miseEnEvidence(texNombre(a, 0))}$ ou $${miseEnEvidence(texNombre(q, 0))}$ est un diviseur de $${miseEnEvidence(texNombre(a, 0))}$
        car le reste de la division euclidienne de ${texNombre(a, 0)} par $${texNombre(b, 0)}$ est $0$ et le quotient est $${texNombre(q, 0)}$.`
        this.setReponse(i, [
          [String(b), String(a)],
          [String(q), String(a)],
        ])
      } else if (listeTypeDeQuestions[i] === 3) {
        texte = '... est un multiple de ...'
        if (this.interactif) {
          texte =
            choixDeroulant(this, 2 * i, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ]) +
            'est un multiple de' +
            choixDeroulant(this, 2 * i + 1, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ])
        }
        texteCorr = `$${miseEnEvidence(texNombre(a, 0))}$ est un multiple de $${miseEnEvidence(texNombre(b, 0))}$ ou $${miseEnEvidence(texNombre(a, 0))}$ est un multiple de $${miseEnEvidence(texNombre(q, 0))}$
        car le reste de la division euclidienne de ${texNombre(a, 0)} par $${texNombre(b, 0)}$ est $0$ et le quotient est $${texNombre(q, 0)}$.`
        this.setReponse(i, [
          [String(a), String(b)],
          [String(a), String(q)],
        ])
      } else if (listeTypeDeQuestions[i] === 4) {
        texte = "... n'est pas divisible par ..."
        if (this.interactif) {
          texte =
            choixDeroulant(this, 2 * i, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ]) +
            "n'est pas divisible par" +
            choixDeroulant(this, 2 * i + 1, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ])
        }
        texteCorr = `$${miseEnEvidence(texNombre(a1, 0))}$ n'est pas divisible par $${miseEnEvidence(texNombre(b, 0))}$ ou $${miseEnEvidence(texNombre(a1, 0))}$ n'est pas divisible par $${miseEnEvidence(texNombre(q, 0))}$
        car le reste de la division euclidienne de ${texNombre(a1, 0)} par $${texNombre(b, 0)}$ n'est pas $0$.`
        this.setReponse(i, [
          [String(a1), String(b)],
          [String(a1), String(q)],
          [String(b), String(a1)], // réponses absurdes mais vraies !
          [String(q), String(a1)],
          [String(b), String(a)], // réponses absurdes mais vraies !
          [String(q), String(a)],
        ])
      } else if (listeTypeDeQuestions[i] === 5) {
        texte = "... n'est pas un diviseur de ..."
        if (this.interactif) {
          texte =
            choixDeroulant(this, 2 * i, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ]) +
            "n'est pas un diviseur de" +
            choixDeroulant(this, 2 * i + 1, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ])
        }
        texteCorr = `$${miseEnEvidence(texNombre(b, 0))}$ n'est pas un diviseur de $${miseEnEvidence(texNombre(a1, 0))}$ ou $${miseEnEvidence(texNombre(q, 0))}$ n'est pas un diviseur de $${miseEnEvidence(texNombre(a1, 0))}$
        car le reste de la division euclidienne de ${texNombre(a1, 0)} par $${texNombre(b, 0)}$ n'est pas $0$.`
        this.setReponse(i, [
          [String(b), String(a1)],
          [String(q), String(a1)],
          [String(a1), String(b)],
          [String(a1), String(q)],
          [String(a), String(b)],
          [String(a), String(q)], // réponses absurdes mais vraies
        ])
      } else {
        texte = "... n'est pas un multiple de ..."
        if (this.interactif) {
          texte =
            choixDeroulant(this, 2 * i, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ]) +
            "n'est pas un multiple de" +
            choixDeroulant(this, 2 * i + 1, [
              { label: 'Choisir un nombre', value: '' },
              { latex: texNombre(a1, 0), value: String(a1) },
              { latex: texNombre(a, 0), value: String(a) },
              { latex: texNombre(b, 0), value: String(b) },
              { latex: texNombre(q, 0), value: String(q) },
            ])
        }
        texteCorr = `$${miseEnEvidence(texNombre(a1, 0))}$ n'est pas un multiple de $${miseEnEvidence(texNombre(b, 0))}$ ou $${miseEnEvidence(texNombre(a1, 0))}$ est n'est pas un multiple de $${miseEnEvidence(texNombre(q, 0))}$
        car le reste de la division euclidienne de ${texNombre(a1, 0)} par $${texNombre(b, 0)}$ n'est pas $0$.`
        this.setReponse(i, [
          [String(a1), String(b)],
          [String(a1), String(q)],
          [String(b), String(a1)], // réponses absurdes mais vraies !
          [String(q), String(a1)],
          [String(b), String(a)], // réponses absurdes mais vraies !
          [String(q), String(a)],
        ])
      }
      texte += ajouteFeedback(this, 2 * i + 1)
      // Si la question n'a jamais été posée, on en crée une autre
      // texte = '<div class="ui form>' + texte + '</div>'
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
    }
    listeQuestionsToContenu(this)
  }

  correctionInteractive = (i: number) => {
    const select1 = document.querySelector(
      `#ex${this.numeroExercice}Q${2 * i}`,
    ) as HTMLSelectElement
    const select2 = document.querySelector(
      `#ex${this.numeroExercice}Q${2 * i + 1}`,
    ) as HTMLSelectElement
    if (this.answers === undefined) {
      this.answers = {}
    }
    if (select1) {
      this.answers[select1.id] = select1.value
    }
    if (select2) {
      this.answers[select2.id] = select2.value
    }
    let isOk = false
    let feedback = ''
    if (select1?.value != null && select2.value != null) {
      const choix1 = select1.value
      const choix2 = select2.value
      for (let possibilites = 0; possibilites < 2; possibilites++) {
        if (
          choix1 === this.listeReponses[i][possibilites][0] &&
          choix2 === this.listeReponses[i][possibilites][1]
        ) {
          isOk = true
          break
        }
      }
      if (!isOk && this.listeReponses[i].length > 2) {
        for (
          let possibilites = 2;
          possibilites < this.listeReponses[i].length;
          possibilites++
        ) {
          if (
            choix1 === this.listeReponses[i][possibilites][0] &&
            choix2 === this.listeReponses[i][possibilites][1]
          ) {
            isOk = false
            feedback =
              "C'est vrai, mais c'est sans rapport avec une des divisions posées."
            break
          }
        }
      }
    } else {
      isOk = false
    }
    const spanReponseLigne = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${2 * i + 1}`,
    )
    if (spanReponseLigne == null)
      window.notify('Pas trouvé le spanReponseLigne dans 6N43-4', {})
    if (spanReponseLigne) {
      if (isOk) {
        spanReponseLigne.innerHTML = '😎'
      } else {
        spanReponseLigne.innerHTML = '☹️'
      }
    }

    if (feedback !== '') {
      const divFeedback = document.querySelector(
        `div#feedbackEx${this.numeroExercice}Q${2 * i + 1}`,
      ) as HTMLDivElement
      divFeedback.innerHTML = feedback
      divFeedback.style.display = 'block'
    }
    return isOk ? 'OK' : 'KO'
  }
}
