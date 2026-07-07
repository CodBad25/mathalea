import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureNombreRelatif,
} from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '18/01/2024'
export const titre =
  "Écrire sous la forme d'une expression algébrique sans parenthèses puis calculer"

/**
 * Simplifier l'écriture d'une somme de 2 relatifs et calculer
 *
 * On peut paramétrer les distances à zéro qui sont par défaut inférieures à 20
 * @author Rémi Angot
 * Rendu les différentes situations équiprobables le 16/10/2021 par Guillaume Valmont
 */
export const uuid = '070b5'

export const refs = {
  'fr-fr': [],
  'fr-ch': ['9NO9-16'],
}
export default class ExerciceSimplificationSommeAlgebrique extends Exercice {
  constructor(max = 20) {
    super()
    this.besoinFormulaireNumerique = ['Valeur maximale', 99999]
    this.besoinFormulaire2Numerique = [
      'Type de calculs',
      3,
      '1 : Que des additions\n2 : Que des soustractions\n3 : Mélange',
    ]
    this.besoinFormulaire3CaseACocher = ['Avec des nombres décimaux']
    this.sup = max
    this.sup2 = 3
    this.sup3 = false
    this.nbCols = 3
    this.nbColsCorr = 2
    this.nbQuestions = 9 // pour équilibrer les colonnes
  }

  nouvelleVersion() {
    this.consigne =
      "Écrire sous la forme d'une expression algébrique sans parenthèses puis calculer."
    let liste = [
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, -1],
      [-1, 1, 1],
      [1, -1, -1],
      [1, -1, 1],
      [1, 1, -1],
      [1, 1, 1],
    ]
    liste = combinaisonListes(liste, this.nbQuestions)
    for (
      let i = 0, s, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // On limite le nombre d'essais pour chercher des valeurs nouvelles
      const CoefDecimales = this.sup3 ? 10 : 1
      let a =
        (randint(1, this.sup * CoefDecimales) / CoefDecimales) * choice([-1, 1])
      let b =
        (randint(1, this.sup * CoefDecimales) / CoefDecimales) * choice([-1, 1])
      a *= liste[i][0]
      b *= liste[i][1]
      switch (this.sup2) {
        case 1:
          s = 1 // +
          break
        case 2:
          s = -1 // -
          break
        default:
          s = liste[i][2] // + ou -
          break
      }
      texte = context.isAmc ? 'Calculer : ' : ''
      b *= s
      if (s === 1) {
        texte += remplisLesBlancs(
          this,
          i,
          `${ecritureNombreRelatif(a)} + ${ecritureNombreRelatif(b)}=%{champ1}=%{champ2}`,
        )
        texteCorr = `$${ecritureNombreRelatif(a)} + ${ecritureNombreRelatif(b)} = ${texNombre(a, 1)}${ecritureAlgebrique(
          b,
        )} = ${miseEnEvidence(texNombre(a + b, 1))}$`
        handleAnswers(this, i, {
          champ1: {
            value: `${texNombre(a)}${ecritureAlgebrique(b)}`,
            options:
              b < 0
                ? { soustractionSeulementEtNonResultat: true }
                : { additionSeulementEtNonResultat: true },
          },
          champ2: { value: texNombre(a + b, 1) },
        })
      } else {
        texte += remplisLesBlancs(
          this,
          i,
          `${ecritureNombreRelatif(a)} - ${ecritureNombreRelatif(b)}=%{champ1}=%{champ2}`,
        )
        texteCorr = `$${ecritureNombreRelatif(a)} - ${ecritureNombreRelatif(b)} = ${texNombre(a, 1)}${ecritureAlgebrique(
          -b,
        )} = ${miseEnEvidence(texNombre(a - b, 1))}$`
        handleAnswers(this, i, {
          champ1: {
            value: `${texNombre(a)}${ecritureAlgebrique(-b)}`,
            options:
              -b < 0
                ? { soustractionSeulementEtNonResultat: true }
                : { additionSeulementEtNonResultat: true },
          },
          champ2: { value: texNombre(a - b, 1) },
        })
      }

      if (this.questionJamaisPosee(i, texte)) {
        // <- laisser le i et ajouter toutes les variables qui rendent les exercices différents (par exemple a, b, c et d)
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
