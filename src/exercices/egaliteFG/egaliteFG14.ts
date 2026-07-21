import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Au pressing et à la table à repasser'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'bca94'
export const refs = {
  'fr-fr': ['3G21-1', '3P11-1', 'EgaliteFG4-3e-14'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG14 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Lisa et Matthieu, deux élèves de troisième, souhaitent intégrer une seconde professionnelle pour se former aux métiers de l'entretien des textiles.<br><br>" +
      "<b>Problème 1</b><br>Dans un pressing, Pauline et Lucas doivent gérer plusieurs machines de lavage. Chaque machine consomme $3{,}5$ kWh d'énergie par cycle. Le tarif de l'électricité est de $0{,}15$ € par kWh."
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour débattre.<br>Pourquoi associe-t-on encore certains métiers (entretien, soin, propreté) à un genre ? Les garçons sont-ils dissuadés d'entrer dans certaines filières ? Pourquoi ?"
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = "Quelle est la consommation totale d'énergie pour $15$ cycles de lavage dans une machine ?"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: 'kWh' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 52.5 } })
    const correction0 = '$3{,}5\\times 15=52{,}5$ kWh.'

    let texte1 = 'Combien cela coûterait-il pour $15$ cycles dans une machine ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 7.875 } })
    const correction1 = '$52{,}5\\times 0{,}15=7{,}875$ €.'

    let texte2 =
      "Si le pressing utilise $6$ machines effectuant chacune $15$ cycles, quelle sera la dépense totale pour l'énergie consommée ?"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 47.25 } })
    const correction2 = '$6\\times 7{,}875=47{,}25$ €.'

    let texte3 =
      "L'an prochain, le tarif de l'électricité augmentera de $10\\,\\%$. Combien cela coûtera-t-il pour $15$ cycles dans une machine après cette augmentation ?"
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 8.6625 } })
    const correction3 =
      "Nouveau tarif : $0{,}15\\times 1{,}1=0{,}165$ €/kWh. Coût pour $15$ cycles : $52{,}5\\times 0{,}165=8{,}6625$ €."

    // Problème 2 : les tables à repasser (QCM)
    const texteQ4 =
      "<b>Problème 2</b><br>Deux tables à repasser, posées sur un sol horizontal, ont chacune deux pieds qui se croisent en formant un « X ». Pour la table A, les distances entre le point de croisement et les quatre extrémités valent $21{,}6\\text{ cm}$ et $25\\text{ cm}$ (côté plateau), $52\\text{ cm}$ et $60\\text{ cm}$ (côté sol). Pour la table B, ces distances valent $18\\text{ cm}$ et $24\\text{ cm}$ (côté plateau), $48\\text{ cm}$ et $64\\text{ cm}$ (côté sol).<br>Lisa affirme que seul le plateau de la table A est parallèle au sol. Matthieu soutient que c'est le plateau de la table B qui est parfaitement horizontal. Qui a raison ?"
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Lisa', statut: false },
        { texte: 'Matthieu', statut: true },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "Pour la table A : $\\dfrac{21{,}6}{52}\\approx 0{,}4154$ et $\\dfrac{25}{60}\\approx 0{,}4167$ : les rapports ne sont pas égaux, donc, d'après la réciproque du théorème de Thalès, le plateau de la table A n'est pas parallèle au sol.<br>" +
      "Pour la table B : $\\dfrac{18}{48}=0{,}375$ et $\\dfrac{24}{64}=0{,}375$ : les rapports sont égaux, donc, d'après la réciproque du théorème de Thalès, le plateau de la table B est bien parallèle au sol (donc horizontal).<br>" +
      "C'est donc Matthieu qui a raison."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2
    this.listeQuestions[3] = texte3
    this.listeCorrections[3] = correction3
    this.listeQuestions[4] = texte4
    this.listeCorrections[4] = correction4

    listeQuestionsToContenu(this)
  }
}
