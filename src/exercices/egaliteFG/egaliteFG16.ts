import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Katherine Johnson : poids, masse et gravité'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'a0815'
export const refs = {
  'fr-fr': ['3G30-4', 'EgaliteFG4-3e-16'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG16 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Katherine Johnson (1918-2020) est une physicienne, mathématicienne et ingénieure spatiale américaine, qui a contribué aux programmes aéronautique et spatial de la NASA. Son histoire est racontée dans le film « Les figures de l'ombre ».<br>" +
      "Le poids d'un corps sur un astre dépend de sa masse et de l'accélération de la pesanteur : $P=mg$, où $P$ est le poids (en newtons), $m$ la masse (en kg) et $g$ l'accélération de la pesanteur de l'astre (en N/kg)."
    this.nbQuestions = 6
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      "Juste avant le décollage d'Apollo 11 (mission dont Katherine Johnson a calculé la trajectoire), Neil Armstrong pèse $72$ kg. Sachant que $g_T=9{,}8$ sur Terre, calculer son poids (en newtons)."
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: 'N' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 705.6 } })
    const correction0 = '$P=m\\times g_T=72\\times 9{,}8=705{,}6$ N.'

    const texteQ1 =
      "Sur la Lune, on mesure les couples masse-poids suivants : $(3\\text{ kg}\\,;\\,5{,}1\\text{ N})$, $(10\\,;\\,17)$, $(25\\,;\\,42{,}5)$, $(40\\,;\\,68)$, $(55\\,;\\,93{,}5)$, $(72\\,;\\,122{,}4)$. Ce tableau (masse, poids) est-il un tableau de proportionnalité ?"
    this.autoCorrection[1] = {
      enonce: texteQ1,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: true },
        { texte: 'Non', statut: false },
      ],
    }
    const monQcm1 = propositionsQcm(this, 1)
    let texte1 = texteQ1
    if (!context.isAmc) texte1 += monQcm1.texte
    const correction1 =
      "Dans chaque cas, $\\dfrac{\\text{poids}}{\\text{masse}}=1{,}7$ (par exemple $\\dfrac{5{,}1}{3}=1{,}7$ et $\\dfrac{122{,}4}{72}=1{,}7$) : le tableau est bien un tableau de proportionnalité, de coefficient $1{,}7$."

    let texte2 =
      "On note $g_L$ l'accélération de la pesanteur sur la Lune. Déterminer $g_L$."
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 1.7 } })
    const correction2 = 'Le coefficient de proportionnalité du tableau précédent est $g_L=1{,}7$.'

    const texteQ3 =
      "Est-il vrai que l'on pèse environ $6$ fois moins lourd sur la Lune que sur la Terre ?"
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Vrai', statut: true },
        { texte: 'Faux', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      "$\\dfrac{g_T}{g_L}=\\dfrac{9{,}8}{1{,}7}\\approx 5{,}76$, soit environ $6$ (arrondi à l'unité) : l'affirmation est donc vraie, au moins en ordre de grandeur."

    let texte4 =
      "Le triangle $BCD$ (un cratère de la Lune) est rectangle en $D$, avec $CD=29$ km et $\\widehat{BCD}=30°$. Calculer la distance $BC$, arrondie au dixième de km."
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4, '', { texteApres: 'km' }) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 33.5 } })
    const correction4 =
      "Dans le triangle $BCD$ rectangle en $D$ : $\\cos(\\widehat{BCD})=\\dfrac{CD}{BC}$, donc $BC=\\dfrac{CD}{\\cos(30°)}=\\dfrac{29}{\\cos(30°)}\\approx 33{,}5$ km."

    let texte5 =
      "En prenant $BC=34$ km pour cette question, calculer la profondeur $BD$ du cratère, arrondie à l'unité de km."
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5, '', { texteApres: 'km' }) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 17 } })
    const correction5 = "$BD=BC\\times \\sin(30°)=34\\times 0{,}5=17$ km."

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
