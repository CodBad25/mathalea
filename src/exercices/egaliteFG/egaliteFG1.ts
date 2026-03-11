import Exercice from '../Exercice'
import { listeQuestionsToContenu } from '../../modules/outils'
import { texteItalique } from '../../lib/outils/embellissements'
export const titre = "Réfléchir sur l'égalité filles-garçons"

export const dateDePublication = '28/08/2025' 

export const uuid = 'b38b2'
export const refs = {
  'fr-fr': [],
  'fr-ch': []
}

/**
 * @author Eve Chambon

*/
export default class EgaliteFG1 extends Exercice {
  constructor () {
    super()
    this.consigne = texteItalique('D\'après « Sur le chemin de l\'égalité en mathématiques pour tous les élèves » - Académie de Versailles')
    this.consigne += '<br><br>Julie et Paul, frère et sœur, doivent rentrer chez eux à 17h45 au plus tard, sinon ils vont rater leur émission préférée sur les mathématiques qui commence à cette heure-là. Mais ils ne sont pas d\'accord sur le meilleur hemin pour rentrer chez eux depuis leur collège. Ils sortent du collège à 17h03.<br>'

    this.consigne += 'Ayant chacun un itinéraire différent en tête, ils commencent à discuter pour décider quel chemin emprunter.<br><br> Julie pense qu\'il est plus rapide d’attendre le bus de 17h20. Le trajet en bus dure 14 minutes, puis il faut encore marcher 4 minutes pour arriver à la maison.<br> '

    this.consigne += 'Paul préfère marcher directement 15 minutes pour prendre le métro de 17h26. Le trajet en métro dure 10 minutes, et ensuite il faut encore marcher 2 minutes pour arriver à la maison. Ils doivent comparer chaque chemin et s\'assurer qu\'ils arrivent à temps pour leur émission tout en évitant de se perdre dans la discussion. Le temps presse, et ils doivent rapidement trouver un compromis.<br> Analyser leur stratégie.'

    this.nbQuestions = 2
    this.nbQuestionsModifiable = false
    
    this.comment = 'Pour débattre<br>Pourquoi penses-tu que Julie choisit le bus et Paul le métro ? Est-ce que cela reflète un stéréotype sur les choix des transports ou les rôles des filles et des garçons ?'
  }

  nouvelleVersion () {
    let question1 = 'À quelle heure Julie arrivera-t-elle à la maison si elle prend le bus ?'
    question1 += '<br>'
    let correction1 = 'Correction 1'
    correction1 += '<br>'

    let question2 = 'À quelle heure Paul arrivera-t-il à la maison en prenant le métro ?'
    question2 += '<br>'
    let correction2 = 'Correction 2'
    correction2 += '<br>'

    this.listeQuestions.push(question1, question2)
    this.listeCorrections.push(correction1, correction2)

    listeQuestionsToContenu(this)
  }
}
