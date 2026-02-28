import type { MathfieldElement } from 'mathlive'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { checkLeCompteEstBon } from '../../lib/interactif/comparisonFunctions'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { sp } from '../../lib/outils/outilString'
import { prenom } from '../../lib/outils/Personne'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'
import TrouverSolutionMathador from './_TrouverSolutionMathador'
export const amcReady = true
export const amcType = 'AMCOpen'
export const interactifReady = true
export const interactifType = ['mathLive', 'custom']

export const titre = "Traduire une succession d'opérations par une expression"
export const dateDeModifImportante = '26/09/2024'

/**
 * Transformer un programme de calcul avec les 4 opérations dans un ordre aléatoire en un seul calcul.
 * @author Jean-Claude Lhote
 */
export const uuid = '3406a'

export const refs = {
  'fr-fr': ['5C11-2'],
  'fr-ch': ['9NO6-3'],
}
export default class ÉcrireUneExpressionMathador extends Exercice {
  tirage: number[][]
  cible: number[]
  constructor() {
    super()

    this.nbQuestions = 4
    this.spacing = 1.5
    this.besoinFormulaireCaseACocher = ['Calculs cachés', false]
    this.besoinFormulaire2CaseACocher = [
      '4 opérations différentes obligatoires',
      false,
    ]
    this.sup = false
    this.sup2 = false
    this.tirage = []
    this.cible = []
  }

  nouvelleVersion() {
    let expression, calculsSuccessifs, solutionMathador, quidam
    this.tirage = []
    this.cible = []
    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;

    ) {
      // traduire un calcul mathador
      solutionMathador = TrouverSolutionMathador(30, 90)
      this.tirage[i] = solutionMathador[0]
      this.cible[i] = solutionMathador[1]
      calculsSuccessifs = solutionMathador[2]
      expression = solutionMathador[3]
      quidam = prenom()
      texte = `${quidam} a trouvé une solution d'une variante du jeu « Le compte est bon » pour le tirage suivant $${this.tirage[i][0]}~;~${this.tirage[i][1]}~;~${this.tirage[i][2]}~;~${this.tirage[i][3]}~;~${this.tirage[i][4]}$ et pour la cible $${this.cible[i]}$.<br>`
      texte +=
        'Il faut utiliser, obligatoirement, tous les nombres du tirage, pour obtenir avec des opérations élémentaires, le nombre indiqué par la cible.<br>'
      texte +=
        this.sup && this.sup2
          ? "Pour que la solution soit gagnante, il faut que l'enchaînement de calculs possède chacune des quatre opérations élémentaires.<br>"
          : ''
      texte += this.sup ? '' : `Voici les calculs de ${quidam} :<br>`
      if (!this.sup) {
        for (let j = 0; j < 4; j++) {
          texte += `$${calculsSuccessifs[j]}$<br>`
        }
        this.interactifType = 'mathLive'
      } else this.interactifType = 'custom'

      texte +=
        "Écrire la succession d'opérations en une seule expression." +
        (this.interactif
          ? ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBaseAvecEgal,
              {
                texteAvant: sp(10) + '$E=$',
              },
            )
          : '')
      texteCorr = ''
      if (this.sup) {
        texteCorr += `${quidam} a proposé les calculs suivants :<br>`
        for (let j = 0; j < 4; j++) {
          texteCorr += `$${calculsSuccessifs[j]}$<br>`
        }
      }

      texteCorr += `L'expression correspondante au calcul de ${quidam} est :<br>$${miseEnEvidence(expression)}$ ou $${miseEnEvidence(solutionMathador[4])}$.`
      if (!this.sup) {
        handleAnswers(this, i, {
          reponse: {
            value: [...expression, ...solutionMathador[4]],
            options: { calculFormel: true },
          },
        })
      }
      if (context.isAmc) {
        this.autoCorrection[i] = {
          enonce: texte,
          propositions: [
            {
              texte: texteCorr,
              statut: 1, // OBLIGATOIRE (ici c'est le nombre de lignes du cadre pour la réponse de l'élève sur AMC)
              sanscadre: false, // EE : ce champ est facultatif et permet (si true) de cacher le cadre et les lignes acceptant la réponse de l'élève
              pointilles: false, // EE : ce champ est facultatif et permet (si false) d'enlever les pointillés sur chaque ligne.
            },
          ],
        }
      }

      if (
        this.questionJamaisPosee(
          i,
          solutionMathador,
          this.tirage[i].join(';'),
          this.cible[i],
        )
      ) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }

  // EE : Modele Correction Interactive
  correctionInteractive = (i: number) => {
    // Champ réponse : Son nom est en dur, ne rien changer
    const mf = document.querySelector(
      `math-field#champTexteEx${this.numeroExercice}Q${i}`,
    ) as MathfieldElement

    // Sauvegarde de la réponse pour Capytale
    if (this.answers == null) this.answers = {}
    this.answers[`Ex${this.numeroExercice}Q${i}`] = mf.getValue()

    // Saisie fournie par l'utilisateur qu'on va comparer éventuellement avec la réponse attendue.
    const input = mf.value

    // Partie test de la saisie de l'utilisateur
    const { isOk, feedback } = checkLeCompteEstBon(
      input,
      this.tirage[i],
      this.cible[i],
      this.sup2,
    )
    let reponse
    let smiley
    if (isOk) {
      smiley = '😎'
      reponse = 'OK'
    } else {
      smiley = '☹️'
      reponse = 'KO'
    }
    // Affichage du smiley final
    const spanResultat = document.querySelector(
      `span#resultatCheckEx${this.numeroExercice}Q${i}`,
    ) as HTMLSpanElement
    spanResultat.innerHTML = smiley

    // Affichage du feedback final qu'il fait penser à créer avec ajouteFeedback dans l'exercice
    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    ) as HTMLDivElement
    divFeedback.innerHTML = feedback ?? ''

    return reponse
  }
}
