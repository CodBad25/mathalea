import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "À la conquête de l'espace : grandeurs, notation scientifique et volumes"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '42693'
export const refs = {
  'fr-fr': ['3C1-1', 'EgaliteFG4-3e-12'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG12 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Cette séquence se décline en plusieurs parties : le visionnage de la bande-annonce (et/ou du film) <i>Les figures de l'ombre</i>, de Theodore Melfi (2016), puis des exercices pratiques sur les grandeurs et les unités de mesure, la conversion d'unités et la notation scientifique, et enfin le calcul du volume et de la circonférence de la Terre, ainsi que la distance parcourue par un satellite géostationnaire."
    this.nbQuestions = 12
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texte0 =
      "Phase d'exploration. La vitesse, la durée, la distance et la masse sont des grandeurs. Cite cinq autres grandeurs, puis donne pour chacune deux unités de mesure possibles (par exemple : la vitesse, en km/h et m/s)."
    const correction0 =
      "Réponse possible parmi de nombreuses grandeurs : la température (°C, K), l'énergie (J, kWh), la force (N), l'aire (m², ha), le volume (m³, L), l'intensité électrique (A), la concentration (mol/L)... Après avoir visionné la bande-annonce du film, exprime aussi la durée qui y est évoquée en minutes, puis en jours et heures, puis en jours sous forme décimale."

    let texte1 =
      "La distance moyenne entre la Terre et la Lune est de $384\\,400$ km. Exprime cette distance en mètres (écriture décimale)."
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: 'm' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 384400000 } })
    const correction1 =
      "$384\\,400\\text{ km}=384\\,400\\,000\\text{ m}$, soit en notation scientifique $3{,}844\\times 10^{8}\\text{ m}$."

    let texte2 =
      "La masse de la Terre est $5{,}974\\times 10^{24}$ kg. En sachant qu'une tonne vaut $1\\,000$ kg, exprime cette masse en tonnes sous la forme $5{,}974\\times 10^{n}$ : quelle est la valeur de l'entier $n$ ?"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 21 } })
    const correction2 =
      "$5{,}974\\times 10^{24}\\text{ kg}\\div 1\\,000=5{,}974\\times 10^{24}\\div 10^{3}=5{,}974\\times 10^{21}$ tonnes, donc $n=21$."

    let texte3 =
      "La vitesse de la lumière dans le vide est de $299\\,792\\,458$ m/s. Arrondis cette valeur au millier (en m/s)."
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: 'm/s' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 299792000 } })
    const correction3 = "$299\\,792\\,458\\approx 299\\,792\\,000$ m/s (arrondi au millier)."

    let texte4 =
      "En partant de cette valeur arrondie, exprime la vitesse de la lumière en km/h."
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4, '', { texteApres: 'km/h' }) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 1079251200 } })
    const correction4 =
      "$299\\,792\\,000\\text{ m/s}=299\\,792{,}000\\text{ km/s}$. Une heure comptant $3\\,600$ secondes : $299\\,792\\times 3\\,600=1\\,079\\,251\\,200$ km/h (on multiplie par $3{,}6$ pour passer de m/s à km/h)."

    let texte5 =
      "Quel est le volume d'une boule de rayon $50$ cm ? (on prendra $\\pi\\approx 3$ ; rappel : $V=\\dfrac{4}{3}\\pi r^3$)"
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5, '', { texteApres: 'cm³' }) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 500000 } })
    const correction5 = "$V=\\dfrac{4}{3}\\times 3\\times 50^3=4\\times 125\\,000=500\\,000\\text{ cm}^3$."

    let texte6 = 'Réécris ce volume en m³.'
    if (this.interactif) texte6 += ajouteChampTexteMathLive(this, 6, '', { texteApres: 'm³' }) + '<br>'
    handleAnswers(this, 6, { reponse: { value: 0.5 } })
    const correction6 = "$500\\,000\\text{ cm}^3=0{,}5\\text{ m}^3$ (puisque $1\\text{ m}^3=1\\,000\\,000\\text{ cm}^3$)."

    let texte7 =
      "Le rayon de la Terre mesure $6\\,371{,}03$ km. Arrondis ce rayon à la centaine de km."
    if (this.interactif) texte7 += ajouteChampTexteMathLive(this, 7, '', { texteApres: 'km' }) + '<br>'
    handleAnswers(this, 7, { reponse: { value: 6400 } })
    const correction7 = "$6\\,371{,}03\\approx 6\\,400$ km (arrondi à la centaine)."

    let texte8 =
      "En considérant la Terre comme une boule parfaite de rayon $6\\,400$ km (avec $\\pi\\approx 3$), calcule son volume, en km³."
    if (this.interactif) texte8 += ajouteChampTexteMathLive(this, 8, '', { texteApres: 'km³' }) + '<br>'
    handleAnswers(this, 8, { reponse: { value: 1048576000000 } })
    const correction8 =
      "$V=\\dfrac{4}{3}\\times 3\\times 6\\,400^3=4\\times 262\\,144\\,000\\,000=1\\,048\\,576\\,000\\,000\\text{ km}^3$, soit environ $1{,}048576\\times 10^{12}\\text{ km}^3$."

    let texte9 =
      "Exprime ce volume en m³, sous la forme $1{,}048576\\times 10^{n}$ : quelle est la valeur de l'entier $n$ ?"
    if (this.interactif) texte9 += ajouteChampTexteMathLive(this, 9) + '<br>'
    handleAnswers(this, 9, { reponse: { value: 21 } })
    const correction9 =
      "$1\\text{ km}^3=10^{9}\\text{ m}^3$, donc $1{,}048576\\times 10^{12}\\text{ km}^3=1{,}048576\\times 10^{21}\\text{ m}^3$ : $n=21$."

    const texte10 =
      "Calcule la circonférence de la Terre (avec le rayon exact $6\\,371{,}03$ km et la valeur de $\\pi$ donnée par la calculatrice), arrondie au centième de km, puis au millier de km."
    const correction10 =
      "$C=2\\pi r\\approx 2\\times \\pi \\times 6\\,371{,}03\\approx 40\\,030{,}36$ km (arrondi au centième), soit environ $40\\,000$ km (arrondi au millier)."

    const texte11 =
      "Le satellite Telstar 1 est à une altitude d'environ $36\\,000$ km. Calcule la circonférence du cercle qu'il décrit en orbite autour de la Terre, arrondie au centième de km, puis au millier de km."
    const correction11 =
      "Le rayon de l'orbite est $6\\,371{,}03+36\\,000=42\\,371{,}03$ km. $C=2\\pi\\times 42\\,371{,}03\\approx 266\\,225{,}03$ km (arrondi au centième), soit environ $266\\,000$ km (arrondi au millier)."

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
