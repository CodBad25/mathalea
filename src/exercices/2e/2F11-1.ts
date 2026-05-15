import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import {
  handleAnswers,
  setReponse,
} from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { texFractionFromString } from '../../lib/outils/deprecatedFractions'
import { ecritureParentheseSiNegatif } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Déterminer l'image d'un nombre par une fonction de référence"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '18/01/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
// export const dateDeModifImportante = '24/10/2021' // Une date de modification importante au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 *
 * @author Degrange Mathieu
 *
 */
export const uuid = 'b6cc0'

export const refs = {
  'fr-fr': ['2F11-1'],
  'fr-ch': [],
}
export default class ImageFonctionsRefs extends Exercice {
  can: boolean
  constructor() {
    super()

    this.nbQuestions = 8

    this.besoinFormulaireCaseACocher = ['Fonction carré']
    this.besoinFormulaire2CaseACocher = ['Fonction cube']
    this.besoinFormulaire3CaseACocher = ['Fonction racine carrée']
    this.besoinFormulaire4CaseACocher = ['Fonction inverse']
    this.sup = true
    this.sup2 = true
    this.sup3 = true
    this.sup4 = true
    this.can = false // course aux nombres, si true les calculs pourront être fait de tête

    this.nbCols = 2
    this.nbColsCorr = 2
  }

  nouvelleVersion() {
    const typeQuestionsDisponibles = []
    this.sup && typeQuestionsDisponibles.push('carré')
    this.sup2 && typeQuestionsDisponibles.push('cube')
    this.sup3 && typeQuestionsDisponibles.push('racine carrée')
    this.sup4 && typeQuestionsDisponibles.push('inverse')

    if (typeQuestionsDisponibles.length === 0) {
      typeQuestionsDisponibles.push('carré')
    }

    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )

    const listeTypeQuestionsDansLOrdre = typeQuestionsDisponibles.filter((x) =>
      listeTypeQuestions.includes(x),
    )

    this.consigne =
      (typeQuestionsDisponibles.length >= 2 ? 'Soient ' : 'Soit ') +
      listeTypeQuestionsDansLOrdre
        .map((x, i) => '$' + ['f', 'g', 'h', 'i'][i] + '$ la fonction ' + x)
        .join(', ')
        .replace(/,([^,]*$)/, ' et$1') +
      '.'

    const listePhrases = combinaisonListes([0, 1], this.nbQuestions)
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      const nom = ['f', 'g', 'h', 'i'][
        listeTypeQuestionsDansLOrdre.indexOf(listeTypeQuestions[i])
      ]
      let nombre: number
      let solution: FractionEtendue
      let calcul: number
      switch (listeTypeQuestions[i]) {
        case 'carré':
          nombre = randint(-10, 10, [0, 1])
          calcul = nombre * nombre
          solution = new FractionEtendue(calcul, 1)
          texteCorr = `$${nom}(${nombre}) = ${ecritureParentheseSiNegatif(nombre)}^2 = ${ecritureParentheseSiNegatif(nombre)} \\times ${ecritureParentheseSiNegatif(nombre)} = ${miseEnEvidence(texNombre(nombre * nombre, 0))}$`
          break
        case 'cube':
          nombre = randint(-5, 5, [0, 1])
          calcul = nombre * nombre * nombre
          solution = new FractionEtendue(calcul, 1)
          texteCorr = `$${nom}(${nombre}) = ${ecritureParentheseSiNegatif(nombre)}^3 = ${ecritureParentheseSiNegatif(nombre)} \\times ${ecritureParentheseSiNegatif(nombre)} \\times ${ecritureParentheseSiNegatif(nombre)} = ${ecritureParentheseSiNegatif(nombre * nombre)} \\times ${ecritureParentheseSiNegatif(nombre)} = ${miseEnEvidence(texNombre(nombre ** 3, 0))}$`
          break
        case 'racine carrée':
          calcul = randint(1, 10)
          solution = new FractionEtendue(calcul, 1)
          nombre = calcul * calcul
          texteCorr = `$${nom}(${nombre}) = ${miseEnEvidence(`\\sqrt{${nombre}}`)} = ${miseEnEvidence(solution.texFraction)} $ car $ ${ecritureParentheseSiNegatif(solution.valeurDecimale)}^2 = ${texNombre(nombre, 0)}$.`
          break
        case 'inverse':
        default:
          if (this.can) {
            nombre = choice([2, 4, 5, 10])
          } else {
            const expo1 = randint(0, 5)
            nombre = this.can
              ? choice([2, 4, 5, 10])
              : Math.pow(2, expo1) *
                Math.pow(5, expo1 === 0 ? randint(1, 5) : randint(0, 5))
          }
          Math.random() < 0.25 && (nombre = arrondi(1 / nombre, 6))
          Math.random() < 0.5 && (nombre *= -1)
          solution = new FractionEtendue(1, nombre)
          texteCorr = `$${nom}(${texNombre(nombre, 0)}) = ${miseEnEvidence(texFractionFromString(1, nombre))} = ${miseEnEvidence(solution.valeurDecimale)}$`
          break
      }
      const phrase = listePhrases[i]
        ? `$${nom}(${texNombre(nombre, 6)})$`
        : `l'image de $${texNombre(nombre, 6)}$ par la fonction $${nom}$`
      listePhrases[i] &&
        (texteCorr += `<br>L'image de $${texNombre(nombre, 0)}$ par la fonction $${nom}$ est donc $${miseEnEvidence(solution.texFractionSimplifiee)}$.`)
      texte = `Calculer ${phrase}.`
      texte += ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierDeBaseAvecFraction,
      )

      // Si la question n'a jamais été posée, on l'enregistre
      if (this.questionJamaisPosee(i, listeTypeQuestions[i], nombre)) {
        // <- laisser le i et ajouter toutes les variables qui rendent les exercices différents (par exemple a, b, c et d)
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr

        if (context.isAmc)
          setReponse(this, i, solution, {
            digits: 6,
            decimals: listeTypeQuestions[i] === 'inverse' ? 6 : 0,
            signe: true,
          })
        else
          handleAnswers(this, i, { reponse: { value: solution.texFraction } })
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
    if (!context.isHtml) {
      this.canEnonce = this.listeQuestions[0]
      this.correction = this.listeCorrections[0]
    }
  }
}
