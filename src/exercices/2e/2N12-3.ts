import { combinaisonListes, shuffle } from '../../lib/outils/arrayOutils'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { lettreDepuisChiffre } from '../../lib/outils/outilString'
export const titre =
  "Écrire un intervalle réel sous forme d'ensemble et vice-versa"
export const dateDePublication = '30/08/2024'

/**
 * Écrire un intervalle réel sous forme d\'ensemble et vice-versa
 * @author Nathan Scheinmann
 */

export const uuid = '67469'
export const refs = {
  'fr-fr': ['2N12-3'],
  'fr-ch': ['1mEI-1'],
}

export default class nomExercice extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 4
    this.besoinFormulaireNumerique = [
      'Notations',
      3,
      'Ensemble \n2 : Intervalle \n3 : Mélange',
    ]
    // this.besoinFormulaireCaseACocher = ['Type de coefficients', 3, 'Entiers\nFractionnaires\nMélange']
    // this.besoinFormulaire5Numerique = ['Nombre de termes', 5, '1\n2\n3\n4\n5']
    this.sup = 3
  }

  nouvelleVersion() {
    let typeQuestionsDisponibles: ('ensemble' | 'intervalle')[]
    if (this.sup === 1) {
      typeQuestionsDisponibles = ['ensemble']
    } else if (this.sup === 2) {
      typeQuestionsDisponibles = ['intervalle']
    } else {
      typeQuestionsDisponibles = shuffle([
        'ensemble',
        'intervalle',
        'ensemble',
        'intervalle',
      ])
    }
    const listeTypeDeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte, texteCorr: string
      let borneInf: number | string
      let borneSup: number | string
      borneInf = randint(-100, 90)
      borneSup = randint(borneInf + 1, 100)
      let semiOuvertGauche = false
      let semiOuvertDroite = false
      const r1 = randint(0, 3)
      const r2 = randint(0, 3)
      if (r1 === 0) {
        semiOuvertGauche = true
        borneInf = '-\\infty'
      } else if (r1 === 1) {
        semiOuvertGauche = true
      }
      if (r2 === 0) {
        semiOuvertDroite = true
        borneSup = '+\\infty'
      } else if (r2 === 1) {
        semiOuvertDroite = true
      }
      let intervalle: string
      if (context.isHtml) {
        intervalle = `${semiOuvertGauche ? ']' : '['}${borneInf}; ${borneSup}${semiOuvertDroite ? '[' : ']'}`
      } else {
        intervalle = '\\interval'
        if (semiOuvertDroite && semiOuvertGauche) {
          intervalle += '[open]'
        } else if (semiOuvertDroite) {
          intervalle += '[open right]'
        } else if (semiOuvertGauche) {
          intervalle += '[open left]'
        }
        intervalle += `{${borneInf}}{${borneSup}} `
      }
      let ensemble = `\\{ x \\in \\mathbb{R} \\, | \\, ${borneInf} ${semiOuvertGauche ? '<' : '\\leq'} x ${semiOuvertDroite ? '<' : '\\leq'} ${borneSup} \\}`
      if (borneInf === '-\\infty' && borneSup === '+\\infty') {
        ensemble = '\\mathbb{R}'
      } else if (borneInf === '-\\infty') {
        ensemble = `\\{ x \\in \\mathbb{R} \\, | \\, x ${semiOuvertDroite ? '<' : '\\leq'} ${borneSup} \\}`
      } else if (borneSup === '+\\infty') {
        ensemble = `\\{ x \\in \\mathbb{R} \\, | \\, ${borneInf} ${semiOuvertGauche ? '<' : '\\leq'} x \\}`
      }
      switch (listeTypeDeQuestions[i]) {
        case 'intervalle': {
          // writes an interval with the correct notation ] [ depending on the value of semiOuvertGauche and semiOuvertDroite

          texte = `Écrire l'intervalle $${lettreDepuisChiffre(i + 1)}=${intervalle}$ sous forme d'un ensemble.`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${miseEnEvidence(ensemble)}$`
          break
        }
        case 'ensemble': {
          // writes an interval with the correct notation ] [ depending on the value of semiOuvertGauche and semiOuvertDroite
          texte = `Écrire l'ensemble $${lettreDepuisChiffre(i + 1)}=${ensemble}$ sous forme d'un intervalle.`
          texteCorr = `$${lettreDepuisChiffre(i + 1)}=${miseEnEvidence(intervalle)}$`
          break
        }
      }
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
