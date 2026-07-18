import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Hypatie d\'Alexandrie : médiatrices et hauteur du phare'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '1ed48'
export const refs = {
  'fr-fr': ['3G20-4', 'EgaliteFG3-4e-11', 'EgaliteFG4-3e-11'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG11 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Les travaux d'Hypatie d'Alexandrie traitaient de problèmes de géométrie.<br><br>" +
      '<b>Partie 1</b><br>Trace un triangle $ABC$ quelconque puis les médiatrices des segments $[AB]$, $[BC]$ et $[AC]$ (rappel : une médiatrice est une droite qui coupe un segment en son milieu et qui lui est perpendiculaire).<br><br>' +
      "<b>Partie 2</b><br>Hypatie d'Alexandrie veut connaître la hauteur du phare d'Alexandrie. Elle réalise un croquis à partir de mesures faites sur le terrain : les droites $(BT)$ et $(PA)$ sont parallèles, les points $O$, $B$, $A$ sont alignés, les points $O$, $T$, $P$ sont alignés, avec $OP=180\\text{ m}$, $BT=45\\text{ m}$ et $OT=60\\text{ m}$."
    this.nbQuestions = 3
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texte0 = 'Que peux-tu dire des trois médiatrices du triangle tracé ?'
    const correction0 =
      "Les trois médiatrices d'un triangle sont concourantes : elles se coupent en un même point, qui est le centre du cercle circonscrit au triangle (le cercle passant par les trois sommets), et qui est équidistant des trois sommets."

    let texte1 =
      "En utilisant le théorème de Thalès (les droites $(BT)$ et $(PA)$ sont parallèles, avec $O,B,A$ alignés et $O,T,P$ alignés), calculer la hauteur $PA$ du phare, en mètres."
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: 'm' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 135 } })
    const correction1 =
      "D'après le théorème de Thalès dans les triangles $OTB$ et $OPA$ : $\\dfrac{OT}{OP}=\\dfrac{BT}{PA}$, soit $\\dfrac{60}{180}=\\dfrac{45}{PA}$, d'où $PA=\\dfrac{45\\times 180}{60}=135\\text{ m}$."

    let texte2 =
      "Calculer la mesure de l'angle $\\widehat{BOT}$, en degrés (arrondie au dixième)."
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '°' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 36.9 } })
    const correction2 =
      "Le triangle $OTB$ est rectangle en $T$ (car $(BT)\\perp(OP)$, la tige d'Hypatie étant verticale comme le phare). On a alors $\\tan(\\widehat{BOT})=\\dfrac{BT}{OT}=\\dfrac{45}{60}=0{,}75$, donc $\\widehat{BOT}=\\tan^{-1}(0{,}75)\\approx 36{,}9\\text{°}$."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2

    listeQuestionsToContenu(this)
  }
}
