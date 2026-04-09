import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import {
  combinaisonListes,
  combinaisonListesSansChangerOrdre,
} from '../../lib/outils/arrayOutils'
import { listeDeProblemesCompMulNbParts } from '../../lib/problems/problemeComparaisonMultiplicative/problemeCompMulNbParts'
import { listeDeProblemesCompMulGdeQuantite } from '../../lib/problems/problemeComparaisonMultiplicative/problemesCompMulGdeQuantite'
import { listeDeProblemesCompMulPteQuantite } from '../../lib/problems/problemeComparaisonMultiplicative/problemesCompMulPteQuantite'
import { listeDeProblemesCompMulTout } from '../../lib/problems/problemeComparaisonMultiplicative/problemesCompMulTout'
import { listeDeProblemesAdditifsPart } from '../../lib/problems/problemesAdditifs/problemesAdditifsPart'
import { listeDeProblemesAdditifsTout } from '../../lib/problems/problemesAdditifs/problemesAdditifsTout'
import { listeDeProblemesCompAddEcart } from '../../lib/problems/problemesComparaisonAdditive/problemesCompAddEcart'
import { listeDeProblemesCompAddGdeQuantite } from '../../lib/problems/problemesComparaisonAdditive/problemesCompAddGdeQuantite'
import { listeDeProblemesCompAddPteQuantite } from '../../lib/problems/problemesComparaisonAdditive/problemesCompAddPteQuantite'
import { listeDeProblemesMultiplicatifs } from '../../lib/problems/problemesMultiplicatifs/problemeMultiplicatifsTout'
import { listeDeProblemesMultiplicatifsNbParts } from '../../lib/problems/problemesMultiplicatifs/problemesMultiplicatifsNbParts'
import { listeDeProblemesMultiplicatifsParts } from '../../lib/problems/problemesMultiplicatifs/problemesMultiplicatifsPart'
import { listeDeProblemesTransfoApres } from '../../lib/problems/problemesTransformations/problemesTransfoApres'
import { listeDeProblemesTransfoAvant } from '../../lib/problems/problemesTransformations/problemesTransfoAvant'
import { listeDeProblemesTransfoTransfo } from '../../lib/problems/problemesTransformations/problemesTransfoTransfo'
import { gestionnaireFormulaireTexte } from '../../modules/outils'
import Exercice from '../Exercice'
// import { listeDeProblemesPartageAvecResteRetire } from '../../lib/problems/problemesMultiplicatifs/ProblemesPartageAvecResteRetire/promblemePartageAvecResteRetire'
// import { listeDeProblemesMultiplicatifsComplexes } from '../../lib/problems/problemesMultiplicatifs/problemesMultiplicatifsComplexes/problemesMultiplicatifsComplexes'

export const dateDePublication = '06/06/2025'
export const interactifType = 'mathLive'
export const interactifReady = true
export const amcType = 'AMCNum'
export const amcReady = true
export const uuid = 'b3aa4'
export const refs = {
  'fr-fr': ['6N5-10'],
  'fr-2016': ['6C32-0'],
  'fr-ch': [],
}
export const titre = 'Résoudre des problèmes variés'
/**
 * @author Jean-claude Lhote
 */
export default class ProblemesVaries extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.besoinFormulaireTexte = [
      'Types de problèmes',
      `Nombres séparés par des tirets :\n
1 : Additif recherche du tout (fait)\n
2 : Additif recherche d'une partie (à compléter)\n
3 : Transformation recherche avant \n
4 : Transformation recherche après\n 
5 : Transformation recherche transformation \n
6 : Comparaison additive recherche grande quantité\n
7 : Comparaison additive recherche petite quantité\n
8 : Comparaison additive recherche écart\n
9 : Multiplicatif recherche du tout (fait)\n
10 : Multiplicatif recherche de la valeur d'une part (fait)\n
11 : Multiplicatif recherche du nombre de part\n
12 : Comparaison multiplicative recherche grande quantité\n
13 : Comparaison multiplicative recherche petite quantité\n
14 : Comparaison multiplicative recherche du tout\n
15 : Comparaison multiplicative recherche du nombre de fois\n
16  : Mélange`,
    ]
    this.besoinFormulaire2CaseACocher = [
      'Avec des nombres décimaux si possible',
      false,
    ]
    this.sup2 = false // pour l'instant pas de décimaux quasiment dans les problèmes
    this.sup = '16'
    this.sup3 = false // Ce paramètre permet de changer les problèmes choisis par type. Le mettre à true dans l'url pour avoir des problèmes qui ne changent pas d'ordre dans la liste (CDV)
  }

  nouvelleVersion() {
    const fonctionCombinaison = this.sup3
      ? combinaisonListesSansChangerOrdre
      : combinaisonListes
    const typesDeProblemes = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 15,
      defaut: 16,
      melange: 16,
      nbQuestions: this.nbQuestions,
    }).map(Number)
    const problemesAdditifsTout = fonctionCombinaison(
      listeDeProblemesAdditifsTout,
      this.nbQuestions,
    )
    const problemesAdditifsPart = fonctionCombinaison(
      listeDeProblemesAdditifsPart,
      this.nbQuestions,
    )
    const problemesMultiplicatifs = fonctionCombinaison(
      listeDeProblemesMultiplicatifsParts,
      this.nbQuestions,
    )
    const problemesPartageSimple = fonctionCombinaison(
      listeDeProblemesMultiplicatifsParts,
      this.nbQuestions,
    )
    // const problemesPartageAvecResteRetire = fonctionCombinaison(listeDeProblemesPartageAvecResteRetire, this.nbQuestions)
    //  const problemesComplexes = fonctionCombinaison(listeDeProblemesMultiplicatifsComplexes, this.nbQuestions)
    const problemesCompAddEcart = fonctionCombinaison(
      listeDeProblemesCompAddEcart,
      this.nbQuestions,
    )
    const problemesCompAddGdeQuantite = fonctionCombinaison(
      listeDeProblemesCompAddGdeQuantite,
      this.nbQuestions,
    )
    const problemesCompAddPteQuantite = fonctionCombinaison(
      listeDeProblemesCompAddPteQuantite,
      this.nbQuestions,
    )
    const problemesTransoApres = fonctionCombinaison(
      listeDeProblemesTransfoApres,
      this.nbQuestions,
    )
    const problemesTransfoTransfo = fonctionCombinaison(
      listeDeProblemesTransfoTransfo,
      this.nbQuestions,
    )
    const problemesTransoAvant = fonctionCombinaison(
      listeDeProblemesTransfoAvant,
      this.nbQuestions,
    )
    const problemesMultiplicatifsNbParts = fonctionCombinaison(
      listeDeProblemesMultiplicatifsNbParts,
      this.nbQuestions,
    )
    const problemesCompMulTout = fonctionCombinaison(
      listeDeProblemesCompMulTout,
      this.nbQuestions,
    )
    const problemesCompMulNbParts = fonctionCombinaison(
      listeDeProblemesCompMulNbParts,
      this.nbQuestions,
    )
    const problemesCompMulGdeQuantite = fonctionCombinaison(
      listeDeProblemesCompMulGdeQuantite,
      this.nbQuestions,
    )
    const problemesCompMulPteQuantite = fonctionCombinaison(
      listeDeProblemesCompMulPteQuantite,
      this.nbQuestions,
    )
    const fonctionsProblemes = []
    let indexP1 = 0
    let indexP2 = 0
    let indexP3 = 0
    let indexP4 = 0
    let indexP5 = 0
    let indexP6 = 0
    let indexP7 = 0
    let indexP8 = 0
    let indexP9 = 0
    let indexP10 = 0
    let indexP11 = 0
    let indexP12 = 0
    let indexP13 = 0
    let indexP14 = 0
    let indexP15 = 0

    for (let i = 0; i < this.nbQuestions; i++) {
      switch (typesDeProblemes[i]) {
        case 1:
          fonctionsProblemes.push(
            problemesAdditifsTout[
              indexP1 % listeDeProblemesAdditifsTout.length
            ],
          )
          indexP1++
          break
        case 2:
          fonctionsProblemes.push(
            problemesAdditifsPart[
              indexP2 % listeDeProblemesAdditifsPart.length
            ],
          )
          indexP2++
          break
        case 3:
          fonctionsProblemes.push(
            problemesTransoAvant[indexP3 % listeDeProblemesTransfoAvant.length],
          )
          indexP3++
          break
        case 4:
          fonctionsProblemes.push(
            problemesTransoApres[indexP4 % listeDeProblemesTransfoApres.length],
          )
          indexP4++
          break
        case 5:
          fonctionsProblemes.push(
            problemesTransfoTransfo[
              indexP5 % listeDeProblemesTransfoTransfo.length
            ],
          )
          indexP5++
          break
        case 6:
          fonctionsProblemes.push(
            problemesCompAddGdeQuantite[
              indexP6 % listeDeProblemesCompAddGdeQuantite.length
            ],
          )
          indexP6++
          break
        case 7:
          fonctionsProblemes.push(
            problemesCompAddPteQuantite[
              indexP7 % listeDeProblemesCompAddPteQuantite.length
            ],
          )
          indexP7++
          break
        case 8:
          fonctionsProblemes.push(
            problemesCompAddEcart[
              indexP8 % listeDeProblemesCompAddEcart.length
            ],
          )
          indexP8++
          break
        case 9:
          fonctionsProblemes.push(
            problemesMultiplicatifs[
              indexP9 % listeDeProblemesMultiplicatifs.length
            ],
          )
          indexP9++
          break
        case 10:
          fonctionsProblemes.push(
            problemesPartageSimple[
              indexP10 % listeDeProblemesMultiplicatifsParts.length
            ],
          )
          indexP10++
          break
        case 11:
          fonctionsProblemes.push(
            problemesMultiplicatifsNbParts[
              indexP11 % listeDeProblemesMultiplicatifsNbParts.length
            ],
          )
          indexP11++
          break
        case 12:
          fonctionsProblemes.push(
            problemesCompMulGdeQuantite[
              indexP12 % listeDeProblemesCompMulGdeQuantite.length
            ],
          )
          indexP12++
          break
        case 13:
          fonctionsProblemes.push(
            problemesCompMulPteQuantite[
              indexP13 % listeDeProblemesCompMulPteQuantite.length
            ],
          )
          indexP13++
          break
        case 14:
          fonctionsProblemes.push(
            problemesCompMulTout[indexP14 % listeDeProblemesCompMulTout.length],
          )
          indexP14++
          break
        case 15:
        default:
          fonctionsProblemes.push(
            problemesCompMulNbParts[
              indexP15 % listeDeProblemesCompMulNbParts.length
            ],
          )
          indexP15++
          break
      }
    }
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 100; ) {
      const probleme = fonctionsProblemes[i](this.sup2 ?? false)
      const question = this.interactif
        ? `${probleme.enonce}<br>${ajouteChampTexteMathLive(this, i, probleme.styleChampTexteMathlive ?? KeyboardType.clavierNumbers, probleme.optionsChampTexteMathlive)}`
        : probleme.enonce
      if (this.interactif) {
        handleAnswers(this, i, {
          reponse: {
            value: probleme.reponse,
            options: probleme.optionsComparaison ?? {},
          },
        })
      }
      if (
        this.questionJamaisPosee(
          i,
          probleme.enonce,
          JSON.stringify(probleme.data),
        )
      ) {
        this.listeQuestions.push(question)
        this.listeCorrections.push(
          probleme.correction + '<br><br>' + probleme.schema.display(1),
        )
        i++
      }
      cpt++
    }
  }
}
