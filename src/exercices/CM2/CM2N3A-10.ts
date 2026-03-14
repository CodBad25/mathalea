import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { setReponse } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import {
  choice,
  combinaisonListes,
  creerCouples,
} from '../../lib/outils/arrayOutils'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Connaître les tables de multiplication et de divisions'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Tables de multiplication et de divisions classiques, à trou ou un mélange des deux.
 *
 * Par défaut ce sont les tables de 2 à 9 mais on peut choisir les tables que l'on veut
 * @author Rémi Angot

 */
export const uuid = '9db38'

export const refs = {
  'fr-fr': ['CM2N3A-10'],
  'fr-2016': ['CM003'],
  'fr-ch': [],
}
export default class TablesMultiplicationsDivisions extends Exercice {
  constructor(tablesParDefaut = '2-3-4-5-6-7-8-9') {
    super()
    this.besoinFormulaireTexte = [
      'Choix des tables (10 pour aléatoire)',
      'Nombres séparés par des tirets :',
    ] // Texte, tooltip
    this.besoinFormulaire2Numerique = [
      'Style de questions',
      3,
      '1 : Classique\n2: À trous\n3: Mélangé',
    ]
    // Multiplier ou diviser deux nombres
    this.sup = tablesParDefaut
    this.sup2 = 1 // classique|a_trous|melange
    this.consigne = 'Calculer.'
    this.spacing = 2
  }

  nouvelleVersion() {
    if (!this.sup) {
      // Si aucune table n'est saisie
      this.sup = '2-3-4-5-6-7-8-9'
    }
    const tables = gestionnaireFormulaireTexte({
      nbQuestions: this.nbQuestions,
      saisie: this.sup,
      defaut: 9,
      max: 9,
      min: 2,
      enleveDoublons: true,
      melange: 10,
    })
    const couples = creerCouples(
      tables.map(Number),
      [2, 3, 4, 5, 6, 7, 8, 9, 10],
      this.nbQuestions,
    ) // Liste tous les couples possibles (2,3)≠(3,2)
    const listeTypeDeQuestions = combinaisonListes(
      ['classique', 'a_trous'],
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    const operation = combinaisonListes(['x', 'div'], this.nbQuestions) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    let typesDeQuestions
    for (let i = 0, a, b, texte, texteCorr; i < this.nbQuestions; i++) {
      a = couples[i][0]
      b = couples[i][1]
      if (parseInt(this.sup2) === 1) {
        typesDeQuestions = 'classique'
      } else if (parseInt(this.sup2) === 2) {
        typesDeQuestions = 'a_trous'
      } else {
        typesDeQuestions = listeTypeDeQuestions[i]
      }

      if (operation[i] === 'x') {
        if (typesDeQuestions === 'classique') {
          // classique
          texte = '$ ' + a + ' \\times ' + b + ' = $'
          setReponse(this, i, a * b)
          if (this.interactif)
            texte =
              `$${a} \\times ${b} = $` +
              ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
          texteCorr = '$ ' + a + ' \\times ' + b + ' = ' + a * b + ' $'
        } else {
          if (tables.length > 2) {
            // Si pour le premier facteur il y a plus de 2 posibilités on peut le chercher
            if (randint(1, 2) === 1) {
              texte = '$ ' + a + ' \\times \\ldots\\ldots = ' + a * b + ' $'
              if (this.interactif)
                texte =
                  `$ ${a} \\times $` +
                  ajouteChampTexteMathLive(
                    this,
                    i,
                    KeyboardType.clavierNumbers,
                  ) +
                  `$ = ${a * b} $`
            } else {
              texte =
                '$ \\ldots\\ldots' + ' \\times ' + b + ' = ' + a * b + ' $'
              if (this.interactif)
                texte =
                  ajouteChampTexteMathLive(
                    this,
                    i,
                    KeyboardType.clavierNumbers,
                  ) + `$ \\times ${b}  = ${a * b} $`
            }
            setReponse(this, i, a)
          } else {
            // Sinon on demande forcément le 2e facteur
            texte = '$ ' + a + ' \\times \\ldots\\ldots = ' + a * b + ' $'
            if (this.interactif)
              texte =
                ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers) +
                `$ \\times ${b}  = ${a * b} $`
            setReponse(this, i, b)
          }
          texteCorr = '$ ' + a + ' \\times ' + b + ' = ' + a * b + ' $'
        }
      } else {
        if (typesDeQuestions === 'classique') {
          // classique
          texte = '$ ' + a * b + ' \\div ' + b + ' =$'
          setReponse(this, i, a)
          if (this.interactif)
            texte =
              `$${a * b} \\div ${b} = $` +
              ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
        } else {
          // a trous
          if (choice([true, false])) {
            texte = `$ ${a * b} \\div \\ldots\\ldots = ${a}$`
            setReponse(this, i, b)
            if (this.interactif)
              texte =
                `$${a * b} \\div $` +
                ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers) +
                `$ = ${a}$`
          } else {
            texte = `$ \\ldots\\ldots \\div ${b}  = ${a}$`
            setReponse(this, i, a * b)
            if (this.interactif)
              texte =
                ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers) +
                `$\\div ${b} = ${a}$`
          }
        }
        texteCorr = `$ ${a * b} \\div ${b} = ${a}$`
      }
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
    }
    listeQuestionsToContenu(this)
  }
}
