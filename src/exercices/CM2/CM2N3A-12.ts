import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { setReponse } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Ajouter 11'
export const amcReady = true
export const interactifReady = true

export const amcType = 'AMCNum'

/**
 * Un nombre à 2 chiffres non multiple de 10 + 11
 * @author Rémi Angot

 */
export const uuid = '9fe43'

export const refs = {
  'fr-fr': ['CM2N3A-12'],
  'fr-2016': ['CM007'],
  'fr-ch': [],
}
export default class Ajouter11 extends Exercice {
  constructor() {
    super()

    this.consigne = 'Calculer.'

    this.nbCols = 2
    this.nbColsCorr = 2
  }

  nouvelleVersion() {
    for (
      let i = 0, texte, texteCorr, a, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      a = randint(0, 9) * 10 + randint(1, 9)
      texte = `$${a}+11 = $`
      texteCorr = `$${a}+11=${a + 11}$`
      setReponse(this, i, a + 11)
      if (this.interactif)
        texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)

      if (this.listeQuestions.indexOf(texte) === -1) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
  // this.besoinFormulaireNumerique = ['Niveau de difficulté',3];
}
