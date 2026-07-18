import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Étudiantes en école d'ingénieurs : une suite récurrente"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '86049'
export const refs = {
  'fr-fr': ['TSA1-2-1', 'TermComplem-1', 'EgaliteFG7-Tle-19'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee19 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>En 2015, une école d'ingénieurs en informatique compte $650$ étudiants et $150$ étudiantes. La direction observe chaque année une diminution de $16\\,\\%$ du nombre d'étudiantes ; des mesures d'inclusivité permettent l'inscription de $20$ nouvelles étudiantes supplémentaires chaque année.<br>" +
      "Pour tout entier $n$, on note $U_n$ le nombre d'étudiantes en $2015+n$, avec $U_0=150$."
    this.nbQuestions = 7
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Calculer $U_1$ et interpréter le résultat.'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 146 } })
    const correction0 =
      "$U_1=0{,}84\\times 150+20=126+20=146$ : en 2016, l'école compte $146$ étudiantes (une diminution malgré les mesures d'inclusivité)."

    const texte1 =
      "Justifier que, pour tout entier $n$ : $U_{n+1}=0{,}84\\,U_n+20$, puis démontrer par récurrence que la suite $(U_n)$ est décroissante."
    const correction1 =
      "Une diminution de $16\\,\\%$ correspond à un coefficient multiplicateur de $1-0{,}16=0{,}84$ ; en ajoutant les $20$ nouvelles inscriptions, on obtient $U_{n+1}=0{,}84\\,U_n+20$.<br>Pour la récurrence : au rang $0$, $U_1=146\\leqslant 150=U_0$. En supposant $U_{n+1}\\leqslant U_n$ à un rang $n$, on a $0{,}84\\,U_{n+1}\\leqslant 0{,}84\\,U_n$ (car $0{,}84>0$), donc $U_{n+2}=0{,}84\\,U_{n+1}+20\\leqslant 0{,}84\\,U_n+20=U_{n+1}$ : la propriété est donc vraie à tous les rangs, la suite $(U_n)$ est décroissante."

    const texteQ2 = 'La suite $(U_n)$ est-elle convergente ?'
    this.autoCorrection[2] = {
      enonce: texteQ2,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui, car elle est décroissante et minorée (par exemple par $0$)', statut: true },
        { texte: 'Non', statut: false },
      ],
    }
    const monQcm2 = propositionsQcm(this, 2)
    let texte2 = texteQ2
    if (!context.isAmc) texte2 += monQcm2.texte
    const correction2 =
      "La suite $(U_n)$ est décroissante (question précédente) et minorée par $0$ (un effectif ne peut pas être négatif) : elle est donc convergente, d'après le théorème de la limite monotone."

    let texte3 =
      "On pose $V_n=U_n-125$ pour tout entier $n$. Montrer que $(V_n)$ est géométrique et donner sa raison."
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 0.84 } })
    const correction3 =
      "$V_{n+1}=U_{n+1}-125=0{,}84\\,U_n+20-125=0{,}84\\,U_n-105=0{,}84\\,(U_n-125)+0{,}84\\times 125-105=0{,}84\\,V_n+105-105=0{,}84\\,V_n$ (car $0{,}84\\times 125=105$) : $(V_n)$ est donc géométrique de raison $0{,}84$."

    let texte4 = "En déduire que, pour tout entier $n$, $U_n=25\\times 0{,}84^n+125$. Quel est le premier terme $V_0$ de la suite $(V_n)$ ?"
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 25 } })
    const correction4 =
      "$V_0=U_0-125=150-125=25$, donc $V_n=25\\times 0{,}84^n$ (suite géométrique), d'où $U_n=V_n+125=25\\times 0{,}84^n+125$."

    let texte5 = 'Déterminer la limite de $(U_n)$ quand $n$ tend vers $+\\infty$.'
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 125 } })
    const correction5 =
      "Comme $0<0{,}84<1$, on a $0{,}84^n\\to 0$ quand $n\\to +\\infty$, donc $U_n=25\\times 0{,}84^n+125\\to 125$."

    const texteQ6 = "Les mesures d'inclusivité de l'école d'ingénieurs ont-elles été efficaces ?"
    this.autoCorrection[6] = {
      enonce: texteQ6,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: "Totalement : le nombre d'étudiantes a fini par augmenter au-delà de 150", statut: false },
        {
          texte:
            "Partiellement : elles stabilisent le nombre d'étudiantes à 125 au lieu de le laisser tendre vers 0, mais n'inversent pas la baisse initiale",
          statut: true,
        },
        { texte: "Pas du tout : le nombre d'étudiantes continue de diminuer indéfiniment", statut: false },
      ],
    }
    const monQcm6 = propositionsQcm(this, 6)
    let texte6 = texteQ6
    if (!context.isAmc) texte6 += monQcm6.texte
    const correction6 =
      "Sans les $20$ inscriptions annuelles, la suite serait $150\\times 0{,}84^n$, qui tend vers $0$ (disparition progressive des étudiantes). Grâce aux mesures d'inclusivité, le nombre d'étudiantes se stabilise à $125$ au lieu de tendre vers $0$ : les mesures sont donc efficaces pour stopper le déclin, mais insuffisantes pour inverser la baisse initiale (de $150$ à $125$) ou pour revenir à la parité."

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

    listeQuestionsToContenu(this)
  }
}
