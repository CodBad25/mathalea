import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Shakuntala Devi : le café qui coule (notion de fonction)'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '5b75c'
export const refs = {
  'fr-fr': ['3F12-5', 'EgaliteFG4-3e-20'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG20 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Shakuntala Devi (1929-2013), surnommée « l'ordinateur humain », est une prodige indienne du calcul mental, capable de résoudre les multiplications les plus compliquées sans aucun appareil technologique.<br>" +
      "Une machine expresso transfère le café de son réservoir vers une tasse, après un temps de préchauffage de $25$ secondes. La tasse est vide au départ, et on considère qu'elle est pleine lorsqu'elle contient $80$ mL de café. On modélise le volume de café dans la tasse, en fonction du temps $x$ (en secondes) écoulé depuis la mise en marche de la machine, par la fonction $f$ définie (une fois le préchauffage terminé) par $f(x)=4(x-25)$."
    this.nbQuestions = 6
    this.nbQuestionsModifiable = false
    this.comment =
      'Pour débattre.<br>Shakuntala Devi fut souvent présentée comme une « exception féminine ». Est-il plus difficile pour une femme d\'être reconnue comme « experte » ? Y a-t-il aujourd\'hui encore des domaines (mathématiques, calcul, logique...) où les filles doivent « prouver plus » ?'
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Au bout de $30$ secondes, quel est le volume de café dans la tasse ?'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: 'mL' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 20 } })
    const correction0 = '$f(30)=4\\times(30-25)=4\\times 5=20$ mL.'

    let texte1 = 'Au bout de combien de temps la tasse contient-elle $60$ mL de café ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 40 } })
    const correction1 =
      'On cherche $x$ tel que $4(x-25)=60$, soit $x-25=15$, donc $x=40$ : au bout de $40$ secondes.'

    let texte2 = 'Quel est le temps de préchauffage de la machine ?'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 25 } })
    const correction2 = "Le café ne commence à couler qu'à partir de $x=25$ s : le temps de préchauffage est donc de $25$ secondes."

    let texte3 =
      'En combien de temps la tasse est-elle pleine ($80$ mL), sans compter le temps de préchauffage ?'
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 20 } })
    const correction3 =
      "On cherche $x$ tel que $4(x-25)=80$, soit $x-25=20$, donc $x=45$ : la tasse est pleine au bout de $45$ secondes depuis le départ, soit $45-25=20$ secondes après la fin du préchauffage."

    let texte4 =
      "Calculer l'image de $38$ par la fonction $f$. Interpréter ce résultat."
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4, '', { texteApres: 'mL' }) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 52 } })
    const correction4 =
      '$f(38)=4\\times(38-25)=4\\times 13=52$ : au bout de $38$ secondes, la tasse contient $52$ mL de café.'

    let texte5 =
      'La tasse déborde au bout de $50$ secondes. Quel est le volume de cette dernière ?'
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5, '', { texteApres: 'mL' }) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 100 } })
    const correction5 =
      '$f(50)=4\\times(50-25)=4\\times 25=100$ : la tasse a donc un volume de $100$ mL.'

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
    this.listeQuestions[5] = texte5
    this.listeCorrections[5] = correction5

    listeQuestionsToContenu(this)
  }
}
