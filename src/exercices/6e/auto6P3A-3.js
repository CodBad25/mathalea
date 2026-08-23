import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { setReponse } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { range1 } from '../../lib/outils/nombres'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Trouver double, moitié, tiers, triple'
export const amcReady = true
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcType = 'AMCNum'

/**
 * Calculer le double ou le triple d'un nombre, calculer la moitié d'un nombre pair ou le tiers d'un multiple de 3
 * @author Rémi Angot

 */
export const uuid = '9d994'

export const refs = {
  'fr-fr': ['auto6P3A-3', '6AutoP1-2'],
  'fr-2016': ['CM014'],
  'fr-ch': [],
}
export default class DoubleMoitieTiersTriple extends Exercice {
  constructor() {
    super()

    this.consigne = 'Calculer.'

    this.nbCols = 2
    this.nbColsCorr = 2
    this.sup = 1 // niveau de difficulté
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = range1(4)
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    for (
      let i = 0, texte, texteCorr, a, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      switch (listeTypeDeQuestions[i]) {
        case 1: // Double
          a = randint(2, 9)
          texte = `$\\text{Le double de }${a}$`
          texteCorr = `$\\text{Le double de }${a} \\text{ est } ${miseEnEvidence(a * 2)}$`
          setReponse(this, i, a * 2)
          if (this.interactif)
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
            )
          break
        case 2: // Moitié
          a = randint(2, 9) * 2
          texte = `$\\text{La moitié de }${a * 2}$`
          texteCorr = `$\\text{La moitié de }${a * 2} \\text{ est } ${miseEnEvidence(a)}$`
          setReponse(this, i, a)
          if (this.interactif)
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
            )
          break
        case 3: // Triple
          a = randint(2, 9)
          texte = `$\\text{Le triple de }${a}$`
          texteCorr = `$\\text{Le triple de }${a} \\text{ est } ${miseEnEvidence(a * 3)}$`
          setReponse(this, i, a * 3)
          if (this.interactif)
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
            )
          break
        case 4: // Tiers
          a = randint(2, 9)
          texte = `$\\text{Le tiers de }${a * 3}$`
          texteCorr = `$\\text{Le tiers de }${a * 3} \\text{ est } ${miseEnEvidence(a)}$`
          setReponse(this, i, a)
          if (this.interactif)
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
            )
          break
      }

      if (this.listeQuestions.indexOf(texte) === -1) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr + '.'
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
  // this.besoinFormulaireNumerique = ['Niveau de difficulté',3];
}
