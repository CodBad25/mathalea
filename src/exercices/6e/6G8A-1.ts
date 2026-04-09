import { combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  contraindreValeur,
  listeQuestionsToContenu,
} from '../../modules/outils'
import Exercice from '../Exercice'

import {
  canvasEnonceCorrection,
  empilementCubes,
} from '../../lib/3d/3d_dynamique/empilementsCube'
import { createCubesProjections } from '../../lib/3d/3dProjectionMathalea2d/CubeIso'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'

export const dateDePublication = '03/03/2021'
export const dateDeModificationImportante = '15/07/2025'
export const titre = 'Compter les cubes manquants ou pas'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcType = 'AMCNum'
export const amcReady = true

/**
 * Compter des cubes dans un empilement de cubes
 * @author Erwan DUPLESSY
 * Source : http://cache.media.education.gouv.fr/file/Geometrie_et_espace/47/1/RA16_C4_MATH_geo_espace_flash_567471.pdf
 * Ajout de la 3D dynamique par Jean-claude Lhote
 */

export const uuid = '5f115'

export const refs = {
  'fr-fr': ['6G8A-1'],
  'fr-2016': ['6G43'],
  'fr-ch': ['9ES7-6'],
}
export default class DenombrerCubes extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Type de questions',
      3,
      '1 : Compter les cubes\n2 : Compter les cubes manquants\n3 : Mélange',
    ]
    this.besoinFormulaire4Numerique = [
      'Volume',
      2,
      '1 : Volume en cubes\n2 : Volume en cm³',
    ]
    this.besoinFormulaire2Numerique = [
      "Taille de l'empilement",
      5,
      'De taille 3\nDe taille 4\nDe taille 5\nDe taille 6\nDe taille 7',
    ]
    this.besoinFormulaire3CaseACocher = ['3D dynamique', false]
    this.sup3 = false
    this.nbQuestions = 3 // Ici le nombre de questions
    this.sup4 = 1
    this.sup = 1 // A décommenter : valeur par défaut d'un premier paramètre
    this.sup2 = 1 // A décommenter : valeur par défaut d'un deuxième paramètre
    // c'est ici que commence le code de l'exercice cette fonction crée une copie de l'exercice
  }

  nouvelleVersion() {
    this.sup = contraindreValeur(1, 3, this.sup, 1) // taille de l'empilement
    this.sup2 = contraindreValeur(1, 5, this.sup2, 1) // type de questions
    let typesDeQuestionsDisponibles: number[] = [] // tableau à compléter par valeurs possibles des types de questions
    switch (this.sup) {
      case 1:
        typesDeQuestionsDisponibles = [1]
        break
      case 2:
        typesDeQuestionsDisponibles = [2]
        break
      case 3:
        typesDeQuestionsDisponibles = [1, 2]
        break
    }
    const unitesCubes = this.sup4 === 1

    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    const longueur = 2 + parseInt(this.sup2) // longueur de l'empilement
    const largeur = longueur // largeur de l'empilement
    const hauteur = longueur // hauteur de l'empilement

    for (
      let q = 0, texte, texteCorr, cpt = 0;
      q < this.nbQuestions && cpt < 50;
    ) {
      let figure, figureCorrection
      const L = empilementCubes(longueur, largeur, hauteur) // crée un empilement aléatoire
      texteCorr = '' // Idem pour le texte de la correction.

      if (!this.sup3 || !context.isHtml) {
        // 3d Iso avec Mathalea2d
        texte =
          'Un empilement de cubes est représenté ci-dessous sous deux angles différents. <br>' // Nous utilisons souvent cette variable pour construire le texte de la question.
        ;({ figure, figureCorrection } = createCubesProjections(
          L,
          largeur,
          longueur,
          hauteur,
        ))
      } else {
        // 3d dynamique avec Canvas3DElement
        texte =
          "Un empilement de cubes est représenté ci-dessous (on peut faire tourner l'empilement en plein écran). <br>" // Nous utilisons souvent cette variable pour construire le texte de la question.
        ;({ canvasEnonce: figure, canvasCorrection: figureCorrection } =
          canvasEnonceCorrection(L, `scene3dEx${this.numeroExercice}Q${q}`))
      }
      // début de l'exercice
      texte += unitesCubes
        ? "L'unité de volume étant le cube, "
        : 'Les cubes ayant des arêtes de $1\\text{ cm}$ de longueur, '
      switch (listeTypeDeQuestions[q]) {
        case 1:
          texte += unitesCubes
            ? 'combien de petits cubes contient cet empilement de cubes ?' +
              ajouteChampTexteMathLive(this, q, KeyboardType.clavierNumbers)
            : 'quel est le volume en $\\text{cm}^3$ de cet empilement de cubes ?' +
              ajouteChampTexteMathLive(this, q, KeyboardType.volume)
          texte += '<br>' + figure
          // correction :
          texteCorr += "On peut représenter l'empilement par tranches : <br>"
          texteCorr += figureCorrection + '<br>'
          texteCorr += `Il y a au total $${miseEnEvidence(L.length)}$ cubes.`
          handleAnswers(this, q, {
            reponse: {
              value: L.length,
            },
          })
          break
        case 2:
          texte += unitesCubes
            ? `combien de petits cubes manque-t-il pour reconstruire un grand cube constitué de $${longueur}$ cubes sur chaque arête ?` +
              ajouteChampTexteMathLive(this, q, KeyboardType.clavierNumbers)
            : `quel volume en $\\text{cm}^3$ manque-t-il pour reconstruire un cube de $${longueur}\\text{ cm}$ d'arête ?` +
              ajouteChampTexteMathLive(this, q, KeyboardType.volume)
          texte += '<br>' + figure
          // correction :
          texteCorr +=
            "On peut, par exemple, représenter l'empilement par tranches : <br>"
          texteCorr += figureCorrection + '<br>'
          texteCorr += unitesCubes
            ? `Il y a au total $${L.length}$ cubes. On en veut $${longueur}\\times ${largeur} \\times ${hauteur} = ${longueur * largeur * hauteur}$. <br>`
            : `Il y a au total $${L.length}$ $\\text{cm}^3$. On en veut $${longueur}\\text{cm} \\times ${largeur}\\text{cm} \\times ${hauteur}\\text{cm} = ${longueur * largeur * hauteur}\\text{cm}^3$. <br>`
          texteCorr += `Il manque $${miseEnEvidence(longueur * largeur * hauteur - L.length)}$ `
          texteCorr += unitesCubes ? `cubes.` : `$\\text{cm}^3$.`
          handleAnswers(this, q, {
            reponse: {
              value: longueur * largeur * hauteur - L.length,
            },
          })
          break
      }
      if (this.questionJamaisPosee(q, JSON.stringify(L))) {
        this.listeQuestions[q] = texte
        this.listeCorrections[q] = texteCorr
        q++
      }
      cpt++
    }

    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
