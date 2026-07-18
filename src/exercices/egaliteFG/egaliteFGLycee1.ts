import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Records du 100 mètres : un modèle affine'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '97035'
export const refs = {
  'fr-fr': ['2F21-2', 'EgaliteFG5-2de-1', 'EgaliteFG6-1e-1'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee1 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>On considère les records du monde du 100 mètres en athlétisme. En 1912, le premier record masculin enregistré était de $10{,}6$ secondes (Don Lippincott, USA). En 1922, le premier record féminin enregistré était de $13{,}6$ secondes (Marie Mejzlikova, Tchécoslovaquie). En 2024, les records sont : masculin $9{,}58$ s (Usain Bolt, 2009), féminin $10{,}49$ s (Florence Griffith-Joyner, 1988).<br>" +
      "On note $t$ le nombre d'années à partir de $1980$. On modélise les performances (en secondes) par $f(t)=11-0{,}015t$ pour les femmes et $h(t)=10-0{,}02t$ pour les hommes, définies sur $\\mathbb{R}^+$."
    this.nbQuestions = 7
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour approfondir à l'oral.<br>Pourquoi, selon vous, le premier record féminin date de 1922 et celui des hommes de 1912 ? (Cela peut permettre un point historique sur la Française Alice Milliat, organisatrice des premiers Jeux mondiaux féminins en 1922 et grande défenseuse du sport féminin.)<br>Mise en garde : un débat sur les différences de performance entre hommes et femmes demande une maîtrise du sujet ; on peut s'appuyer sur des ressources sérieuses (podcasts, articles) pour l'aborder."
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      "Calculer le pourcentage d'évolution du record du monde du 100 m chez les femmes, entre 1922 (date du premier record recensé) et 2024 (arrondi au centième)."
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: -22.87 } })
    const correction0 =
      "$\\dfrac{10{,}49-13{,}6}{13{,}6}\\times 100\\approx -22{,}87\\,\\%$ : le record féminin a diminué d'environ $22{,}87\\,\\%$ (on part de 1922, date du premier record féminin recensé — aucun record féminin n'existait en 1912)."

    let texte1 =
      "Même question chez les hommes, entre 1912 et 2024 (arrondi au centième)."
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: -9.62 } })
    const correction1 = "$\\dfrac{9{,}58-10{,}6}{10{,}6}\\times 100\\approx -9{,}62\\,\\%$."

    let texte2 = "Quelle était la performance théorique des femmes en 1980 ($t=0$), selon le modèle $f$ ?"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 11 } })
    const correction2 = '$f(0)=11-0{,}015\\times 0=11$ s.'

    let texte3 = 'Même question pour les hommes, selon le modèle $h$.'
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 10 } })
    const correction3 = '$h(0)=10-0{,}02\\times 0=10$ s.'

    let texte4 =
      "Selon ces modèles, dix ans plus tard ($t=10$), quelle était la performance théorique des femmes ?"
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 10.85 } })
    const correction4 = '$f(10)=11-0{,}015\\times 10=10{,}85$ s.'

    let texte5 = 'Même question pour les hommes.'
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5, '', { texteApres: 's' }) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 9.8 } })
    const correction5 = '$h(10)=10-0{,}02\\times 10=9{,}8$ s.'

    const texteQ6 =
      "En résolvant $f(t)=h(t)$, on trouve $t=-200$ (soit l'année $1780$). Peut-on en conclure que ce modèle prévoit une égalité des performances féminines et masculines après 1980 ?"
    this.autoCorrection[6] = {
      enonce: texteQ6,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: false },
        { texte: 'Non', statut: true },
      ],
    }
    const monQcm6 = propositionsQcm(this, 6)
    let texte6 = texteQ6
    if (!context.isAmc) texte6 += monQcm6.texte
    const correction6 =
      "$f(t)=h(t) \\iff 11-0{,}015t=10-0{,}02t \\iff 0{,}005t=-1 \\iff t=-200$, ce qui correspond à l'année $1780$ : une solution antérieure à 1980, donc sans réalité physique dans le cadre de l'étude. Comme le coefficient directeur de $h$ ($-0{,}02$) est plus grand en valeur absolue que celui de $f$ ($-0{,}015$), l'écart $f(t)-h(t)=1+0{,}005t$ ne fait qu'augmenter pour $t>0$ : le modèle affine prévoit donc, de façon irréaliste, que l'écart entre les deux performances ne cessera de se creuser, ce qui n'est pas cohérent avec les progrès observés dans le sport féminin. Ce modèle affine, valable seulement sur une plage limitée d'années, ne peut pas être extrapolé indéfiniment (les performances humaines ne peuvent pas décroître linéairement sans limite)."

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
