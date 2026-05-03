import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { setReponse } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import {
  contraindreValeur,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Effectuer additions et soustractions'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * Additions et/ou soustractions classique et/ou à trou.
 *
 * Par défaut c'est un mélange d'additions, soustractions avec et sans trou avec des nombres jusqu'à 20.
 * @author Rémi Angot

 */
export const uuid = '6d698'

export const refs = {
  'fr-fr': ['CM2N3A-7'],
  'fr-2016': ['CM000'],
  'fr-ch': [],
}
export default class TablesAdditionsSoustractions extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = ['Valeur maximale', 9999] // Texte, tooltip
    this.besoinFormulaire2Numerique = [
      'Style de questions',
      6,
      '1 : Additions\n2: Additions à trous\n3: Soustractions\n4 : Soustractions à trous\n5 : Additions et soustractions \n6 : Additions et soustractions avec ou sans trous',
    ]
    this.sup = 20
    this.sup2 = 6 // additions|additions à trous|soustractions|soustractions à trous|mélange sans trou|mélange avec trou
    this.consigne = 'Calculer.'
    this.spacing = 2
  }

  nouvelleVersion() {
    this.sup = contraindreValeur(5, 9999, this.sup, 6)
    let listeTypeDeQuestions: string[] = []
    if (this.sup2 === 1) {
      listeTypeDeQuestions = combinaisonListes(['addition'], this.nbQuestions)
    } else if (this.sup2 === 2) {
      listeTypeDeQuestions = combinaisonListes(
        ['addition_a_trou'],
        this.nbQuestions,
      )
    } else if (this.sup2 === 3) {
      listeTypeDeQuestions = combinaisonListes(
        ['soustraction'],
        this.nbQuestions,
      )
    } else if (this.sup2 === 4) {
      listeTypeDeQuestions = combinaisonListes(
        ['soustraction_a_trou'],
        this.nbQuestions,
      )
    } else if (this.sup2 === 5) {
      listeTypeDeQuestions = combinaisonListes(
        ['addition', 'soustraction'],
        this.nbQuestions,
      )
    } else {
      listeTypeDeQuestions = combinaisonListes(
        ['addition', 'addition_a_trou', 'soustraction', 'soustraction_a_trou'],
        this.nbQuestions,
      )
    }
    for (let i = 0, a, b, texte, texteCorr; i < this.nbQuestions; i++) {
      a = randint(2, this.sup)
      b = randint(2, this.sup)
      this.autoCorrection[i] = {}
      switch (listeTypeDeQuestions[i]) {
        case 'addition':
          texte = `$${a} + ${b} =$`
          if (this.interactif && context.isHtml) {
            texte = ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
              {
                texteAvant: `$${a} + ${b} = $`,
              },
            )
          }
          texteCorr = `$${a} + ${b} = ${a + b}$`
          setReponse(this, i, a + b, { formatInteractif: 'calcul' })
          break
        case 'addition_a_trou':
          texte = `$${a} + \\ldots\\ldots = ${a + b}$`
          if (this.interactif && context.isHtml) {
            texte = ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
              {
                texteAvant: `$${a}~+ $`,
                texteApres: `$= ${a + b}$`,
              },
            )
          }
          texteCorr = `$${a} + ${miseEnEvidence(b)} = ${a + b}$`
          setReponse(this, i, b, { formatInteractif: 'calcul' })
          break
        case 'soustraction':
          if (a === b) {
            a = randint(2, this.sup, b)
          }
          if (a < b) {
            b = [a, (a = b)][0] // échange les variables a et b
          }
          texte = `$${a} - ${b} =$`
          if (this.interactif && context.isHtml) {
            texte = ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
              {
                texteAvant: `$${a} - ${b} = $`,
              },
            )
          }
          texteCorr = `$${a} - ${b} = ${a - b}$`
          setReponse(this, i, a - b, { formatInteractif: 'calcul' })
          break
        case 'soustraction_a_trou':
        default:
          if (a === b) {
            a = randint(2, this.sup, b)
          }
          if (a < b) {
            b = [a, (a = b)][0] // échange les variables a et b
          }
          texte = `$${a} - \\ldots\\ldots = ${a - b}$`
          if (this.interactif && context.isHtml) {
            texte = ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierNumbers,
              {
                texteAvant: `$${a}~- $`,
                texteApres: `$= ${a - b}$`,
              },
            )
          }
          texteCorr = `$${a} - ${miseEnEvidence(b)} = ${a - b}$`
          setReponse(this, i, b, { formatInteractif: 'calcul' })
          break
      }

      this.autoCorrection[i].enonce = texte
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
    }
    listeQuestionsToContenu(this)
  }
}
