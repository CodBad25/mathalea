import { bleuMathalea } from '../../lib/colors'
import { createList } from '../../lib/format/lists'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Déterminer des entiers à partir du quotient et du reste d’une division euclidienne'
export const dateDePublication = '23/09/2026'
export const uuid = '568c2'
export const interactifReady = true

export const refs = {
  'fr-fr': ['TEA1-15'],
  'fr-ch': [],
}

/**
 * Déterminer les entiers naturels dont le quotient est égal au reste dans une
 * division euclidienne par un entier aléatoire.
 * @author Stéphane Guyon
 */
export default class QuotientEgalAuReste extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion(): void {
    const diviseur = randint(3, 7)
    const restes = Array.from({ length: diviseur }, (_, reste) => reste)
    const solutions = restes.map((reste) => (diviseur + 1) * reste)
    const reponse = `\\{${solutions.join(';')}\\}`
    const cas = restes.map(
      (reste) =>
        `Si $r=${reste}$, alors $q=${reste}$ et $n=${diviseur}\\times ${reste}+${reste}=${(diviseur + 1) * reste}$.`,
    )

    this.listeQuestions[0] =
      `Déterminer tous les entiers naturels $n$ qui, dans la division euclidienne par $${diviseur}$, donnent un quotient égal au reste.<br>` +
      ajouteChampTexteMathLive(this, 0, KeyboardType.clavierEnsemble, {
        texteAvant: ' $S=$',
      })

    this.listeCorrections[0] = `${texteEnCouleur('Analyse.', bleuMathalea)}<br>
    Soit $n\\in\\mathbb N$. La division euclidienne de $n$ par $${diviseur}$ s’écrit $n=${diviseur}q+r$, avec $q\\in\\mathbb N$ et $r\\in\\{${restes.join(';')}\\}$.<br>
    Le quotient étant égal au reste, on a $q=r$. Il suffit donc d’examiner toutes les valeurs possibles de $r$ :<br>
    ${createList({ items: cas, style: 'fleches' })}<br>
    ${texteEnCouleur('Synthèse.', bleuMathalea)}<br>
    Réciproquement, pour chacune de ces valeurs, le reste est strictement inférieur à $${diviseur}$ et le quotient est égal au reste. Ces valeurs conviennent donc toutes.<br>
    Ainsi, l’ensemble des solutions est $S=${miseEnEvidence(reponse)}$.`

    handleAnswers(this, 0, {
      reponse: { value: reponse, options: { ensembleDeNombres: true } },
    })
    listeQuestionsToContenu(this)
  }
}
