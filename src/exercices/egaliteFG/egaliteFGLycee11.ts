import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Évolution des salaires : rattraper l'écart ?"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '6f897'
export const refs = {
  'fr-fr': ['1Tec-S2-2', 'EgaliteFG6-1e-11'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee11 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>En 2020, le salaire moyen des femmes dans une entreprise était de $2\\,000$ € par mois, celui des hommes de $2\\,300$ €. Pour réduire l'écart, les ressources humaines décident d'une augmentation salariale moyenne de $2\\,\\%$ par an pour les femmes et de $1{,}5\\,\\%$ par an pour les hommes.<br>" +
      "On modélise ces salaires par les suites $(F_n)$ et $(H_n)$, avec $F_0=2\\,000$ et $H_0=2\\,300$, $n$ désignant le nombre d'années après 2020."
    this.nbQuestions = 4
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Calculer $F_1$ et interpréter ce résultat.'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 2040 } })
    const correction0 = '$F_1=2\\,000\\times 1{,}02=2\\,040$ € : le salaire moyen des femmes en 2021.'

    let texte1 = 'Calculer $H_1$ et interpréter ce résultat.'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 2334.5 } })
    const correction1 = '$H_1=2\\,300\\times 1{,}015=2\\,334{,}5$ € : le salaire moyen des hommes en 2021.'

    const texte2 =
      'Quelle est la nature des suites $(F_n)$ et $(H_n)$ ? Justifier en donnant leurs éléments caractéristiques.'
    const correction2 =
      "$(F_n)$ est géométrique de raison $1{,}02$ et de premier terme $2\\,000$ (donc $F_n=2\\,000\\times 1{,}02^n$). $(H_n)$ est géométrique de raison $1{,}015$ et de premier terme $2\\,300$ (donc $H_n=2\\,300\\times 1{,}015^n$)."

    let texte3 = 'Au bout de combien d\'années le salaire moyen des femmes dépassera-t-il celui des hommes ?'
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: 'ans' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 29 } })
    const correction3 =
      "On cherche le plus petit $n$ tel que $2\\,000\\times 1{,}02^n>2\\,300\\times 1{,}015^n$, soit $\\left(\\dfrac{1{,}02}{1{,}015}\\right)^n>1{,}15$. À la calculatrice, pour $n=28$ le rapport vaut environ $1{,}147<1{,}15$, et pour $n=29$ il vaut environ $1{,}153>1{,}15$ : c'est donc au bout de $29$ ans que le salaire moyen des femmes dépasse celui des hommes. Une telle durée montre les limites d'une politique d'augmentation différenciée trop modeste face à un écart de salaire de départ important."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2
    this.listeQuestions[3] = texte3
    this.listeCorrections[3] = correction3

    listeQuestionsToContenu(this)
  }
}
