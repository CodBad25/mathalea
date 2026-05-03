import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { compareNombres } from '../../lib/outils/nombres'
import { sp } from '../../lib/outils/outilString'
import { texFactorisation } from '../../lib/outils/primalite'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

import { KeyboardType } from '../../lib/interactif/claviers/keyboard'

export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCOpen'
export const titre = 'Décomposer en facteurs premiers'
export const dateDeModifImportante = '18//11/2024'

/**
 * Décomposer en produit de facteurs premiers un nombre (la décomposition aura 3, 4 ou 5 facteurs premiers)
 * @author Rémi Angot
 */
export const uuid = '7f50c'

export const refs = {
  'fr-fr': ['5A13'],
  'fr-ch': ['9NO4-10'],
}
export default class ExerciceDecomposerEnFacteursPremiers extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Niveau de difficulté',
      3,
      '1 : 3 facteurs\n2 : 4 facteurs\n3 : 5 facteurs',
    ]
    this.besoinFormulaire2CaseACocher = ['Grands nombres (une fois sur quatre)']

    this.spacing = 2
    this.nbQuestions = 6
    this.sup = 2 // 4 facteurs par défaut
    this.sup2 = false // pas de multiplication par 100
    this.sup3 = false // Que pour les 2ndes
    this.sup4 = false // Decomposition avec des puissances
    this.correctionDetailleeDisponible = true // booléen qui indique si une correction détaillée est disponible.
    this.correctionDetaillee = true // booléen indiquant si la correction détaillée doit être affiché par défaut (récupéré dans l'url avec le paramètre `,cd=`).
  }

  nouvelleVersion() {
    this.consigne =
      this.nbQuestions > 1
        ? "Écrire les nombres suivants sous la forme d'un produit de facteurs premiers."
        : "Écrire le nombre suivant sous la forme d'un produit de facteurs premiers."
    let grandNombres
    let listeFacteurs1, listeFacteurs2
    if (this.sup3) {
      listeFacteurs1 = [2, 3, 5, 7, 11]
      listeFacteurs2 = [2, 3, 7, 13, 17]
    } else {
      listeFacteurs1 = [2, 3, 5]
      listeFacteurs2 = [2, 5, 7, 11]
    }
    if (this.sup2 && this.sup3) {
      grandNombres = combinaisonListes(
        [true, true, false, true],
        this.nbQuestions,
      )
    } else if (this.sup2) {
      switch (this.nbQuestions) {
        case 1:
          grandNombres = [true]
          break
        case 2:
          grandNombres = combinaisonListes([true, false], this.nbQuestions)
          break
        case 3:
          grandNombres = combinaisonListes(
            [true, false, false],
            this.nbQuestions,
          )
          break
        default:
          grandNombres = combinaisonListes(
            [true, false, false, false],
            this.nbQuestions,
          )
      }
    } else {
      grandNombres = combinaisonListes(
        [false, false, false, false],
        this.nbQuestions,
      )
    }
    for (
      let i = 0,
        n,
        facteurs = [],
        nbFacteurs,
        texte,
        reponse,
        texteCorr,
        cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // On limite le nombre d'essais pour chercher des valeurs nouvelles
      facteurs = []
      nbFacteurs = this.sup + 2
      for (let k = 0; k < nbFacteurs; k++) {
        if (k < nbFacteurs - 1) {
          if (nbFacteurs > 3 && k === 0) {
            this.sup3 ? facteurs.push(choice([2, 3])) : facteurs.push(2)
          } else if (nbFacteurs > 4 && k === 1) {
            this.sup3 ? facteurs.push(choice([2, 3])) : facteurs.push(2)
          } else {
            this.sup3
              ? facteurs.push(choice(listeFacteurs1.concat(7)))
              : facteurs.push(choice(listeFacteurs1))
          }
        } else {
          this.sup3
            ? facteurs.push(choice(listeFacteurs2.concat([3, 13])))
            : facteurs.push(choice(listeFacteurs2))
        }
      }
      if (this.sup2 && grandNombres[i]) {
        // Une fois sur 4 on multilie le nombre par 100 (par 60 pour le niveau 2nde)
        this.sup3 ? facteurs.push(2, 2, 3, 5) : facteurs.push(2, 2, 5, 5)
      }
      n = 1
      for (let k = 0; k < facteurs.length; k++) {
        n = n * facteurs[k]
      }
      texte = '$ ' + texNombre(n) + '$'
      texteCorr = ''
      if (!this.correctionDetaillee)
        texteCorr += '$ ' + texNombre(n) + ' = $' + sp()

      reponse = ''
      facteurs.sort(compareNombres) // classe les facteurs dans l'ordre croissant
      const ensembleDeFacteursSet = new Set(facteurs)
      const ensembleDeFacteurs = [...ensembleDeFacteursSet] // tableau des facteurs sans répétition
      let produitAvecPuissances = ''
      for (let k = 0; k < ensembleDeFacteurs.length; k++) {
        const facteur = ensembleDeFacteurs[k]
        let puissance = 0
        for (let j = 0; j < facteurs.length; j++) {
          if (facteurs[j] === facteur) puissance++
        }
        if (puissance > 1) {
          produitAvecPuissances += `${facteur}^${puissance}`
        } else {
          produitAvecPuissances += `${facteur}`
        }
        if (k !== ensembleDeFacteurs.length - 1)
          produitAvecPuissances += ' \\times '
      }
      let produitRestant = 1
      let debutDecomposition = ''
      let decompositionFinale = ''
      for (let k = 0; k < facteurs.length - 1; k++) {
        if (!this.sup3 && !this.sup4) {
          if (!this.correctionDetaillee) {
            texteCorr += `$${miseEnEvidence(facteurs[k] + ' \\times ')}$`
          }
        }
        if (this.correctionDetaillee) {
          debutDecomposition += facteurs[k] + ' \\times  '
          for (let j = k + 1; j < facteurs.length; j++) {
            produitRestant = produitRestant * facteurs[j]
          }
          texteCorr +=
            '$' +
            texNombre(n) +
            ' = ' +
            debutDecomposition +
            produitRestant +
            '$<br>'
          decompositionFinale = sp() + debutDecomposition + produitRestant
          produitRestant = 1
        }
        reponse += facteurs[k] + '\\times'
      }

      if (!this.sup3 && !this.sup4) {
        if (!this.correctionDetaillee) {
          texteCorr += `$${miseEnEvidence(facteurs[facteurs.length - 1])}$`
        }
      } else {
        if (this.correctionDetaillee)
          texteCorr += '$ ' + texNombre(n) + ' =' + sp() + ' $'
        decompositionFinale = sp() + texFactorisation(n, true)
        texteCorr += `$${miseEnEvidence(decompositionFinale)}$`
        if (this.correctionDetaillee) texteCorr += '<br>'
      }
      if (this.correctionDetaillee) {
        texteCorr += `<br>Donc la décomposition en produit de facteurs premiers de $${miseEnEvidence(texNombre(n), 'black')}$ est $${miseEnEvidence(decompositionFinale)}$.`
      }
      reponse += facteurs[facteurs.length - 1]

      if (context.isAmc) {
        this.autoCorrectionAMC[i] = {
          enonce: texte + '\n',
          propositions: [
            {
              texte: texteCorr,
              statut: 5,
              sanscadre: false,
              pointilles: true,
              feedback: '',
            },
          ],
        }
      }
      texte += ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets,
        { texteAvant: ' $=$' },
      )
      /* if (!context.isAmc) {
        setReponse(this, i, [reponse, produitAvecPuissances])
      } */
      handleAnswers(this, i, {
        reponse: {
          value: [reponse, produitAvecPuissances],
          options: { exclusifFactorisation: true },
        },
      })

      if (this.questionJamaisPosee(i, ...facteurs)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr

        if (!context.isHtml) {
          this.canEnonce = `Décomposer $${texNombre(n)}$ en produit de facteurs premiers. `
          this.correction = this.listeCorrections[0]
          this.canReponseACompleter = `$${texNombre(n)}=\\ldots$`
          this.listeCanEnonces.push(this.canEnonce)
          this.listeCanReponsesACompleter.push(this.canReponseACompleter)
        }
        i++
      }

      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
