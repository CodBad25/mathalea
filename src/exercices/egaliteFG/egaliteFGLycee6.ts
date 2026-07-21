import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Une politique de rattrapage salarial"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'd5005'
export const refs = {
  'fr-fr': ['2A-R2-9', 'EgaliteFG5-2de-6'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee6 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Dans une entreprise de $1\\,000$ salariés, il y a $600$ hommes et $400$ femmes. Le salaire moyen des hommes est de $2\\,500$ € par mois, celui des femmes de $2\\,200$ € par mois."
    this.nbQuestions = 12
    this.nbQuestionsModifiable = false
    this.comment =
      'Pour débattre.<br>Au bout de deux ans, malgré une augmentation plus forte pour les femmes, l\'écart de salaire en euros a-t-il diminué ou augmenté ? Que cela nous enseigne-t-il sur la difficulté de résorber les inégalités quand les salaires de départ sont très différents ?'
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = "Quel est l'écart salarial moyen mensuel entre les hommes et les femmes dans cette entreprise ?"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 300 } })
    const correction0 = '$2\\,500-2\\,200=300$ €.'

    let texte1 =
      "Quelle est cette différence salariale en pourcentage (par rapport au salaire des hommes) ?"
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 12 } })
    const correction1 = '$\\dfrac{300}{2\\,500}\\times 100=12\\,\\%$.'

    let texte2 =
      "Pour que les femmes aient un salaire moyen égal à celui des hommes, quel taux d'évolution faudrait-il appliquer à leur salaire (arrondi au dixième) ?"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 13.6 } })
    const correction2 = '$\\dfrac{2\\,500-2\\,200}{2\\,200}\\times 100\\approx 13{,}6\\,\\%$.'

    let texte3 =
      "Quel budget mensuel supplémentaire l'entreprise devrait-elle prévoir pour augmenter toutes les femmes de $300$ € afin d'atteindre l'équité salariale ?"
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 120000 } })
    const correction3 = '$300\\times 400=120\\,000$ €.'

    let texte4 =
      "L'entreprise augmente les salaires de $3\\,\\%$ pour les hommes et $4\\,\\%$ pour les femmes la première année. Calculer le nouveau salaire moyen des hommes."
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 2575 } })
    const correction4 = '$2\\,500\\times 1{,}03=2\\,575$ €.'

    let texte5 = 'Même question pour les femmes.'
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 2288 } })
    const correction5 = '$2\\,200\\times 1{,}04=2\\,288$ €.'

    let texte6 =
      "Quel est le pourcentage d'écart salarial entre les hommes et les femmes après cette première année (arrondi au dixième) ?"
    if (this.interactif) texte6 += ajouteChampTexteMathLive(this, 6, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 6, { reponse: { value: 11.1 } })
    const correction6 = '$\\dfrac{2\\,575-2\\,288}{2\\,575}\\times 100\\approx 11{,}1\\,\\%$.'

    let texte7 =
      "La deuxième année, les salaires des hommes augmentent encore de $3\\,\\%$ et ceux des femmes de $5\\,\\%$. Calculer le salaire moyen des hommes à la fin de la deuxième année."
    if (this.interactif) texte7 += ajouteChampTexteMathLive(this, 7, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 7, { reponse: { value: 2652.25 } })
    const correction7 = '$2\\,575\\times 1{,}03=2\\,652{,}25$ €.'

    let texte8 = 'Même question pour les femmes.'
    if (this.interactif) texte8 += ajouteChampTexteMathLive(this, 8, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 8, { reponse: { value: 2402.4 } })
    const correction8 = '$2\\,288\\times 1{,}05=2\\,402{,}4$ €.'

    let texte9 =
      "Quel est le pourcentage d'écart salarial après ces deux années, arrondi au dixième ?"
    if (this.interactif) texte9 += ajouteChampTexteMathLive(this, 9, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 9, { reponse: { value: 9.4 } })
    const correction9 =
      "$\\dfrac{2\\,652{,}25-2\\,402{,}4}{2\\,652{,}25}\\times 100\\approx 9{,}4\\,\\%$. L'écart relatif diminue lentement ($12\\,\\%\\to 11{,}1\\,\\%\\to 9{,}4\\,\\%$), mais l'écart en euros, lui, ne diminue presque pas ($2\\,652{,}25-2\\,402{,}4=249{,}85$ € contre $300$ € au départ)."

    const texte10 =
      "L'entreprise décide de conserver, chaque année suivante, les taux de la deuxième année ($+3\\,\\%$ pour les hommes, $+5\\,\\%$ pour les femmes), à partir d'un tableur : quelles formules faut-il saisir dans les cellules B3 (salaire des femmes) et C3 (salaire des hommes) de l'année suivante, si B2 et C2 contiennent les salaires de l'année précédente ?"
    const correction10 =
      "En B3 : <code>=B2*1,05</code> (ou <code>=B2*1.05</code>) ; en C3 : <code>=C2*1,03</code>. On recopie ensuite ces formules vers le bas (B4, C4, etc.) pour les années suivantes."

    let texte11 =
      "En maintenant ces taux ($+5\\,\\%$ par an pour les femmes, $+3\\,\\%$ par an pour les hommes) à partir de l'état atteint à la fin de la deuxième année, au bout de combien d'années supplémentaires le salaire moyen des femmes dépassera-t-il celui des hommes ?"
    if (this.interactif) texte11 += ajouteChampTexteMathLive(this, 11, '', { texteApres: 'ans' }) + '<br>'
    handleAnswers(this, 11, { reponse: { value: 6 } })
    const correction11 =
      "On calcule $F_n=2\\,402{,}4\\times 1{,}05^n$ et $H_n=2\\,652{,}25\\times 1{,}03^n$ à la calculatrice ou au tableur : pour $n=5$, $F_5\\approx 3\\,066{,}35$ € $< H_5\\approx 3\\,075{,}03$ € ; pour $n=6$, $F_6\\approx 3\\,219{,}75$ € $> H_6\\approx 3\\,167{,}05$ €. C'est donc au bout de $6$ années supplémentaires (soit $8$ ans après le début du plan) que le salaire moyen des femmes dépasse celui des hommes."

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
    this.listeQuestions[6] = texte6
    this.listeCorrections[6] = correction6
    this.listeQuestions[7] = texte7
    this.listeCorrections[7] = correction7
    this.listeQuestions[8] = texte8
    this.listeCorrections[8] = correction8
    this.listeQuestions[9] = texte9
    this.listeCorrections[9] = correction9
    this.listeQuestions[10] = texte10
    this.listeCorrections[10] = correction10
    this.listeQuestions[11] = texte11
    this.listeCorrections[11] = correction11

    listeQuestionsToContenu(this)
  }
}
