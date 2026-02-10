import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const interactifReady = true
export const interactifType = 'qcm'
export const titre =
  'Différencier événements contraires, non contraires, compatibles, incompatibles (jeu de cartes)'
export const dateDePublication = '30/07/2024' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModificationImportante = '27/10/2025'
export const uuid = '00bb0'
export const refs = {
  'fr-fr': ['4S20-3'],
  'fr-ch': [],
}

/**
 *  Différencier événéments compatibles, incompatibles, contraires.
 * @author Mireille Gain

*/
export default class ExerciceProba extends Exercice {
  constructor() {
    super()
    this.consigne =
      "Classer les événéments selon qu'ils sont contraires ou non contraires.<br>On tire une carte dans un jeu de 32 cartes."
    this.nbQuestions = 5
    this.besoinFormulaireNumerique = [
      'Notions testées',
      2,
      '1 : Contraires-Non contraires\n2 : Compatibles-Incompatibles-Contraires',
    ]
    this.sup = 1
    this.besoinFormulaire2CaseACocher = ['Afficher un jeu de 32 cartes']
    this.sup2 = false
    this.spacing = 1.2
    this.spacingCorr = 1.2
  }

  nouvelleVersion() {
    this.consigne =
      this.sup === 1
        ? "Classer les événéments selon qu'ils sont contraires ou non contraires.<br>On tire une carte dans un jeu de 32 cartes."
        : "Classer les événéments selon qu'ils sont compatibles, incompatibles, ou contraires.<br>On tire une carte dans un jeu de 32 cartes."
    if (context.isHtml && this.sup2) {
      const imageCartes =
        '<img src="/alea/images/jeu32cartes.png" alt="Jeu de 32 cartes" class="max-w-lg my-4">'
      this.consigne += imageCartes
    }
    // const typeDeQuestionsDisponibles = this.sup === 2 ? ['type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7'] : ['type6', 'type7', 'type8', 'type9', 'type10', 'type11', 'type12']
    const typeDeQuestionsDisponibles =
      this.sup === 2
        ? ['type1', 'type2', 'type3', 'type4', 'type5', 'type6']
        : ['type6', 'type8', 'type9', 'type10', 'type11', 'type12']
    const listeTypeDeQuestions = combinaisonListes(
      typeDeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (
      let i = 0, texte, texteCorr, k, cpt = 0;
      i < this.nbQuestions && cpt < 50;

    ) {
      let bonneReponse
      const figure = choice(['un Valet', 'une Dame', 'un Roi'])
      const famille = choice(['Carreau', 'Coeur', 'Pique', 'Trèfle'])
      const couleur = choice(['Rouge', 'Noire'])
      const nombre = choice(['As', 'Sept', 'Huit', 'Neuf', 'Dix'])
      const valeur = choice([
        'un As',
        'un Sept',
        'un Huit',
        'un Neuf',
        'un Dix',
        'un Valet',
        'une Dame',
        'un Roi',
      ])
      const trefleOuPique = choice(['Trèfle', 'Pique'])
      const carreauOuCoeur = choice(['Carreau', 'Coeur'])

      k = choice([1, 2])
      switch (
        listeTypeDeQuestions[i] // Suivant le type de question, le contenu sera différent
      ) {
        case 'type1':
          if (k === 1) {
            texte = `Les événements « Obtenir ${figure} » et « Obtenir un ${nombre} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir ${figure} » et « Obtenir un ${nombre} » sont  ` +
              texteEnCouleurEtGras('incompatibles') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir un ${nombre} » et « Obtenir ${figure} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${nombre} » et « Obtenir ${figure} » sont ` +
              texteEnCouleurEtGras('incompatibles') +
              '.<br>'
          }
          bonneReponse = 'incompatibles'
          break
        case 'type2':
          if (k === 1) {
            texte = `Les événements « Obtenir un ${valeur} » et « Obtenir un ${famille} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${valeur} » et « Obtenir un ${famille} » sont ` +
              texteEnCouleurEtGras('compatibles') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir un ${famille} » et « Obtenir un ${valeur} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${famille} » et « Obtenir un ${valeur} » sont ` +
              texteEnCouleurEtGras('compatibles') +
              '.<br>'
          }
          bonneReponse = 'compatibles'
          break
        case 'type3':
          if (k === 1) {
            texte =
              'Les événements « Obtenir une carte de couleur Noire » et « Obtenir une carte de couleur Rouge » sont...<br>'
            texteCorr =
              'Les événements « Obtenir une carte de couleur Noire » et « Obtenir une carte de couleur Rouge » sont ' +
              texteEnCouleurEtGras('contraires') +
              '. (et donc ' +
              texteEnCouleurEtGras('incompatibles') +
              ')<br>'
          } else {
            texte =
              'Les événements « Obtenir une carte de couleur Rouge » et « Obtenir une carte de couleur Noire » sont...<br>'
            texteCorr =
              'Les événements « Obtenir une carte de couleur Rouge » et « Obtenir une carte de couleur Noire » sont ' +
              texteEnCouleurEtGras('contraires') +
              '. (et donc ' +
              texteEnCouleurEtGras('incompatibles') +
              ')<br>'
          }
          bonneReponse = 'contraires'
          break
        case 'type4':
          if (k === 2) {
            texte = `Les événements « Obtenir ${figure} » et « Obtenir une carte de couleur ${couleur} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir ${figure} » et « Obtenir une carte de couleur ${couleur} » sont ` +
              texteEnCouleurEtGras('compatibles') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir une carte de couleur ${couleur} » et « Obtenir ${figure} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir une carte de couleur ${couleur} » et « Obtenir ${figure} » sont ` +
              texteEnCouleurEtGras('compatibles') +
              '.<br>'
          }
          bonneReponse = 'compatibles'
          break
        case 'type5':
          if (k === 2) {
            texte = `Les événements « Obtenir un ${trefleOuPique} » et « Obtenir une carte de couleur Noire » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${trefleOuPique} » et « Obtenir une carte de couleur Noire » sont ` +
              texteEnCouleurEtGras('compatibles') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir un ${carreauOuCoeur} » et « Obtenir une carte de couleur Rouge » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${carreauOuCoeur} » et « Obtenir une carte de couleur Rouge » sont ` +
              texteEnCouleurEtGras('compatibles') +
              '.<br>'
          }
          bonneReponse = 'compatibles'
          break
        case 'type6':
          if (k === 1) {
            texte =
              'Les événements « Obtenir un Carreau ou un Coeur » et « Obtenir une carte de couleur Noire » sont...<br>'
            texteCorr =
              'Les événements « Obtenir un Carreau ou un Coeur » et « Obtenir une carte de couleur Noire » sont ' +
              texteEnCouleurEtGras('contraires')
            if (this.sup === 2) {
              texteCorr +=
                ' (et donc ' + texteEnCouleurEtGras('incompatibles') + ')'
            }
            texteCorr += '.<br>'
          } else {
            texte =
              'Les événements « Obtenir un Trèfle ou un Pique » et « Obtenir une carte de couleur Rouge » sont...<br>'
            texteCorr =
              'Les événements « Obtenir un Trèfle ou un Pique » et « Obtenir une carte de couleur Rouge » sont ' +
              texteEnCouleurEtGras('contraires')
            if (this.sup === 2) {
              texteCorr +=
                ' (et donc ' + texteEnCouleurEtGras('incompatibles') + ')'
            }
            texteCorr += '.<br>'
          }
          bonneReponse = 'contraires'
          break
        // ToFix ces évènements ne sont pas contraires
        // case 'type7':
        //   if (k === 1) {
        //     texte = 'Les événements « Obtenir une figure autre qu\'un Roi » et « Obtenir une Dame ou un Valet » sont...<br>'
        //     texteCorr = 'Les événements « Obtenir une figure autre qu\'un Roi » et « Obtenir une Dame ou un Valet » sont ' + texteEnCouleurEtGras('contraires')
        //     if (this.sup === 2) { texteCorr += ' (et donc ' + texteEnCouleurEtGras('incompatibles') + ')' }
        //     texteCorr += '.<br>'
        //   } else {
        //     texte = 'Les événements « Obtenir une figure autre qu\'une Dame » et « Obtenir un Valet ou un Roi » sont...<br>'
        //     texteCorr = 'Les événements « Obtenir une figure autre qu\'une Dame » et « Obtenir un Valet ou un Roi » sont ' + texteEnCouleurEtGras('contraires') + '.<br>'
        //     if (this.sup === 2) { texteCorr += ' (et donc ' + texteEnCouleurEtGras('incompatibles') + ')' }
        //     texteCorr += '.<br>'
        //   }
        //   bonneReponse = 'contraires'
        //   break
        case 'type8':
          if (k === 2) {
            texte =
              "Les événements « Obtenir une carte autre qu'un Roi » et « Obtenir une Dame ou un Valet » sont...<br>"
            texteCorr =
              "Les événements « Obtenir une carte autre qu'un Roi » et « Obtenir une Dame ou un Valet » sont " +
              texteEnCouleurEtGras('non contraires') +
              '.<br>'
          } else {
            texte =
              "Les événements « Obtenir une carte autre qu'une Dame » et « Obtenir un Valet ou un Roi » sont...<br>"
            texteCorr =
              "Les événements « Obtenir une carte autre qu'une Dame » et « Obtenir un Valet ou un Roi » sont " +
              texteEnCouleurEtGras('non contraires') +
              '.<br>'
          }
          bonneReponse = 'non contraires'
          break
        case 'type9':
          if (k === 1) {
            texte = `Les événements « Obtenir une carte autre qu' ${figure} » et « Obtenir ${figure} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir ${figure} » et « Obtenir une carte autre qu' ${figure} » sont ` +
              texteEnCouleurEtGras('contraires') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir une carte autre qu'un ${nombre} » et « Obtenir un ${nombre} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir une carte autre qu'un ${nombre}  » et « Obtenir un ${nombre} » sont ` +
              texteEnCouleurEtGras('contraires') +
              '.<br>'
          }
          bonneReponse = 'contraires'
          break
        case 'type10':
          if (k === 2) {
            texte = `Les événements « Ne pas obtenir ${valeur} » et « Obtenir ${valeur} » sont...<br>`
            texteCorr =
              `Les événements « Ne pas obtenir ${valeur} » et « Obtenir ${valeur} » sont ` +
              texteEnCouleurEtGras('contraires') +
              ' (et donc ' +
              texteEnCouleurEtGras('incompatibles') +
              ').<br>'
          } else {
            texte = `Les événements « Obtenir ${valeur} » et « Ne pas obtenir ${valeur} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir ${valeur} » et « Ne pas obtenir ${valeur} » sont ` +
              texteEnCouleurEtGras('contraires') +
              ' (et donc ' +
              texteEnCouleurEtGras('incompatibles') +
              ').<br>'
          }
          bonneReponse = 'contraires'
          break
        case 'type11':
          if (k === 2) {
            texte = `Les événements « Ne pas obtenir une carte de couleur ${couleur} » et « Obtenir un ${trefleOuPique} » sont...<br>`
            texteCorr =
              `Les événements « Ne pas obtenir une carte de couleur ${couleur} » et « Obtenir un ${trefleOuPique} » sont ` +
              texteEnCouleurEtGras('non contraires') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir un ${trefleOuPique} » et « Ne pas obtenir une carte de couleur ${couleur} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${trefleOuPique} » et « Ne pas obtenir une carte de couleur ${couleur} » sont ` +
              texteEnCouleurEtGras('non contraires') +
              '.<br>'
          }
          bonneReponse = 'non contraires'
          break
        case 'type12':
        default:
          if (k === 1) {
            texte = `Les événements « Ne pas obtenir une carte de couleur ${couleur} » et « Obtenir un ${carreauOuCoeur} » sont...<br>`
            texteCorr =
              `Les événements « Ne pas obtenir une carte de couleur ${couleur} » et « Obtenir un ${carreauOuCoeur} » sont ` +
              texteEnCouleurEtGras('non contraires') +
              '.<br>'
          } else {
            texte = `Les événements « Obtenir un ${carreauOuCoeur} » et « Ne pas obtenir une carte de couleur ${couleur} » sont...<br>`
            texteCorr =
              `Les événements « Obtenir un ${carreauOuCoeur} » et « Ne pas obtenir une carte de couleur ${couleur} » sont ` +
              texteEnCouleurEtGras('non contraires') +
              '.<br>'
          }
          bonneReponse = 'non contraires'
          break
      }
      this.autoCorrection[i] = {}
      this.autoCorrection[i].options = { ordered: true }
      this.autoCorrection[i].enonce = `${texte}\n`
      if (this.sup === 2) {
        this.autoCorrection[i].propositions = [
          {
            texte: 'compatibles',
            statut: bonneReponse === 'compatibles',
          },
          {
            texte: 'incompatibles',
            statut:
              bonneReponse === 'incompatibles' || bonneReponse === 'contraires',
          },
          {
            texte: 'contraires',
            statut: bonneReponse === 'contraires',
          },
        ]
      } else {
        this.autoCorrection[i].propositions = [
          {
            texte: 'contraires',
            statut: bonneReponse === 'contraires',
          },
          {
            texte: 'non contraires',
            statut: bonneReponse === 'non contraires',
          },
        ]
      }

      const props = propositionsQcm(this, i)
      if (this.interactif) {
        texte += props.texte
      }
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
      i++
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
