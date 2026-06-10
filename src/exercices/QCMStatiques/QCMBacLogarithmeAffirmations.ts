import { shuffle } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import Exercice from '../Exercice'

/**
 * @author Stéphane Guyon
 */
export const uuid = 'c7b07'
export const refs = {
  'fr-fr': ['TSA5-42'],
  'fr-ch': [],
}
export const titre = 'Répondre à des affirmations Bac sur le logarithme népérien'
export const dateDePublication = '09/06/2026'

type AffirmationItem = {
  enonce: string
  correction: string
}

function correctionAvecConclusion(correction: string): string {
  const estVraie = correction.startsWith('Vraie.<br>')
  const estFausse = correction.startsWith('Fausse.<br>')
  if (!estVraie && !estFausse) return correction

  const corps = correction.replace(/^(Vraie|Fausse)\.<br>/, '')
  const verdict = estVraie ? 'vraie' : 'fausse'
  return `${corps}<br><br>Conclusion : l’affirmation est ${texteEnCouleurEtGras(verdict)}.`
}

function enonceAvecConsigne(enonce: string): string {
  const consigne = 'Déterminer si l’affirmation suivante est vraie ou fausse : '
  const positionConsigne = enonce.indexOf(consigne)
  if (positionConsigne === -1) return enonce

  const contexte = enonce.slice(0, positionConsigne)
  const affirmation = enonce
    .slice(positionConsigne + consigne.length)
    .replace(/^([a-zàâäéèêëîïôöùûüç])/iu, (lettre) =>
      lettre.toLocaleUpperCase('fr-FR'),
    )

  return `${contexte}<br><br>${texteEnCouleurEtGras('Déterminer si l’affirmation suivante est vraie ou fausse :', 'black')}<br>${affirmation}`
}

const affirmationsLogarithme: AffirmationItem[] = [
  {
    enonce:
      'Soit la fonction $f$ définie sur $\\mathbb{R}$ par $f(x)=\\ln\\left(x^2+2x+2\\right)$.Déterminer si l’affirmation suivante est vraie ou fausse : la fonction $f$ est convexe sur l’intervalle $[-3~;~1]$.',
    correction:
      'Fausse.<br>Pour étudier la convexité de $f$, on détermine le signe de sa dérivée seconde.<br>La fonction $f$ est dérivable sur $\\mathbb{R}$ comme composée de fonctions dérivables, car $x^2+2x+2=(x+1)^2+1>0$ pour tout réel $x$.<br>Pour tout réel $x$, $f\\prime(x)=\\dfrac{2x+2}{x^2+2x+2}$.<br>En dérivant cette expression, on obtient $f\\prime\\prime(x)=\\dfrac{2(x^2+2x+2)-(2x+2)^2}{(x^2+2x+2)^2}=\\dfrac{-2x(x+2)}{(x^2+2x+2)^2}$.<br>Le dénominateur est strictement positif, donc $f\\prime\\prime(x)$ est du signe de $-2x(x+2)$. Ainsi $f\\prime\\prime$ est négative sur $]-\\infty~;~-2]$, positive sur $[-2~;~0]$, puis négative sur $[0~;~+\\infty[$.<br>La fonction $f$ n’est donc pas convexe sur tout l’intervalle $[-3~;~1]$.',
  },
  {
    enonce:
      'Déterminer si l’affirmation suivante est vraie ou fausse : $\\displaystyle\\lim_{x\\to +\\infty}\\dfrac{\\ln(x)-x^2+2}{3x^2}=-\\dfrac{1}{3}$.',
    correction:
      'Vraie.<br>Pour $x>0$, on écrit $\\dfrac{\\ln(x)-x^2+2}{3x^2}=\\dfrac{1}{3}\\left(\\dfrac{\\ln(x)}{x^2}-1+\\dfrac{2}{x^2}\\right)$.<br>Or $\\displaystyle\\lim_{x\\to +\\infty}\\dfrac{\\ln(x)}{x^2}=0$ par croissance comparée, et $\\displaystyle\\lim_{x\\to +\\infty}\\dfrac{2}{x^2}=0$.<br>Donc $\\displaystyle\\lim_{x\\to +\\infty}\\dfrac{\\ln(x)-x^2+2}{3x^2}=\\dfrac{1}{3}(0-1+0)=-\\dfrac{1}{3}$.',
  },
  {
    enonce:
      'Déterminer si l’affirmation suivante est vraie ou fausse : l’équation $x\\ln(x)=1$ admet exactement deux solutions sur l’intervalle $]0~;~+\\infty[$.',
    correction:
      'Fausse.<br>On considère la fonction $f$ définie sur $]0~;~+\\infty[$ par $f(x)=x\\ln(x)-1$.<br>Alors $f\\prime(x)=\\ln(x)+1$. Donc $f\\prime(x)<0$ sur $]0~;~\\mathrm{e}^{-1}[$ et $f\\prime(x)>0$ sur $]\\mathrm{e}^{-1}~;~+\\infty[$.<br>De plus, $\\displaystyle\\lim_{x\\to 0^+}x\\ln(x)=0$, donc $\\displaystyle\\lim_{x\\to 0^+}f(x)=-1$, et $f(\\mathrm{e}^{-1})=-\\mathrm{e}^{-1}-1<0$.<br>Enfin, $\\displaystyle\\lim_{x\\to +\\infty}x\\ln(x)=+\\infty$, donc $\\displaystyle\\lim_{x\\to +\\infty}f(x)=+\\infty$.<br>Sur $]\\mathrm{e}^{-1}~;~+\\infty[$, la fonction $f$ est continue, strictement croissante, et passe d’une valeur négative à $+\\infty$. L’équation $f(x)=0$ admet donc une unique solution sur $]0~;~+\\infty[$.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $]0~;~+\\infty[$ par $f(x)=x\\ln(x)$.Déterminer si l’affirmation suivante est vraie ou fausse : la fonction $f$ est une solution sur $]0~;~+\\infty[$ de l’équation différentielle $xy\\prime-y=x$.',
    correction:
      'Vraie.<br>La fonction $f$ est dérivable sur $]0~;~+\\infty[$ comme produit de fonctions dérivables sur cet intervalle.<br>Pour tout réel $x>0$, on a $f\\prime(x)=\\ln(x)+1$.<br>Alors $xf\\prime(x)-f(x)=x(\\ln(x)+1)-x\\ln(x)=x$.<br>La fonction $f$ vérifie donc l’équation différentielle $xy\\prime-y=x$ sur $]0~;~+\\infty[$.',
  },
  {
    enonce:
      'Soit $a$ un réel et soit $f$ la fonction définie sur $]0~;~+\\infty[$ par $f(x)=a\\ln(x)-2x$. On note $\\mathcal{C}$ la courbe représentative de $f$ dans un repère.Déterminer si l’affirmation suivante est vraie ou fausse : il existe une valeur de $a$ pour laquelle la tangente à $\\mathcal{C}$ au point d’abscisse $1$ est parallèle à l’axe des abscisses.',
    correction:
      'Vraie.<br>Quel que soit le réel $a$, la fonction $f$ est dérivable sur $]0~;~+\\infty[$ et, pour tout réel $x>0$, $f\\prime(x)=\\dfrac{a}{x}-2$.<br>La tangente à $\\mathcal{C}$ au point d’abscisse $1$ est parallèle à l’axe des abscisses si et seulement si $f\\prime(1)=0$.<br>Or $f\\prime(1)=a-2$. On obtient donc $f\\prime(1)=0$ pour $a=2$.<br>Il existe donc bien une valeur de $a$ qui convient.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur l’intervalle $]0~;~+\\infty[$ par $f(x)=\\ln(x)-x^2$.Déterminer si l’affirmation suivante est vraie ou fausse : $\\displaystyle\\lim_{x\\to +\\infty} f(x)=-\\infty$.',
    correction:
      'Vraie.<br>Pour $x>0$, on peut écrire $f(x)=x^2\\left(\\dfrac{\\ln(x)}{x^2}-1\\right)$.<br>Par croissance comparée, $\\displaystyle\\lim_{x\\to +\\infty}\\dfrac{\\ln(x)}{x^2}=0$. Donc $\\displaystyle\\lim_{x\\to +\\infty}\\left(\\dfrac{\\ln(x)}{x^2}-1\\right)=-1$.<br>Comme $\\displaystyle\\lim_{x\\to +\\infty}x^2=+\\infty$, on obtient par produit $\\displaystyle\\lim_{x\\to +\\infty}f(x)=-\\infty$.',
  },
  {
    enonce:
      'On considère la fonction $g$ définie sur l’intervalle $]0~;~+\\infty[$ par $g(x)=\\ln(3x+1)+8$. On considère la suite $(u_n)$ définie par $u_0=25$ et, pour tout entier naturel $n$, $u_{n+1}=g(u_n)$. On admet que la suite $(u_n)$ est strictement positive.Déterminer si l’affirmation suivante est vraie ou fausse : la suite $(u_n)$ est décroissante.',
    correction:
      'Vraie.<br>On a $u_0=25$ et $u_1=\\ln(3\\times25+1)+8=\\ln(76)+8\\approx 12,33<25$, donc $u_1<u_0$.<br>Montrons par récurrence que, pour tout entier naturel $n$, $u_{n+1}<u_n$.<br>L’initialisation vient d’être établie.<br>Supposons que $u_{n+1}<u_n$ pour un entier naturel $n$. Comme les termes sont strictement positifs, on a $3u_{n+1}+1<3u_n+1$. La fonction logarithme étant strictement croissante sur $]0~;~+\\infty[$, on obtient $\\ln(3u_{n+1}+1)<\\ln(3u_n+1)$, puis $\\ln(3u_{n+1}+1)+8<\\ln(3u_n+1)+8$, c’est-à-dire $u_{n+2}<u_{n+1}$.<br>La propriété est donc héréditaire. La suite $(u_n)$ est décroissante.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $]0~;~+\\infty[$ par $f(x)=x\\ln(x)$.Déterminer si l’affirmation suivante est vraie ou fausse : $\\displaystyle\\int_1^{\\mathrm{e}} f(x)\\mathrm{d}x=\\dfrac{\\mathrm{e}^2+1}{4}$.',
    correction:
      'Vraie.<br>On calcule $\\displaystyle\\int_1^{\\mathrm{e}}x\\ln(x)\\mathrm{d}x$ par intégration par parties.<br>On pose $u\\prime(x)=x$ et $v(x)=\\ln(x)$, donc $u(x)=\\dfrac{x^2}{2}$ et $v\\prime(x)=\\dfrac{1}{x}$.<br>Alors $\\displaystyle\\int_1^{\\mathrm{e}}x\\ln(x)\\mathrm{d}x=\\left[\\dfrac{x^2}{2}\\ln(x)\\right]_1^{\\mathrm{e}}-\\int_1^{\\mathrm{e}}\\dfrac{x}{2}\\mathrm{d}x$.<br>Donc $\\displaystyle\\int_1^{\\mathrm{e}}x\\ln(x)\\mathrm{d}x=\\dfrac{\\mathrm{e}^2}{2}-\\left[\\dfrac{x^2}{4}\\right]_1^{\\mathrm{e}}=\\dfrac{\\mathrm{e}^2}{2}-\\dfrac{\\mathrm{e}^2}{4}+\\dfrac{1}{4}=\\dfrac{\\mathrm{e}^2+1}{4}$.',
  },
  {
    enonce:
      'Déterminer si l’affirmation suivante est vraie ou fausse : pour tout réel $x>0$, $\\ln(x)-x+1\\leqslant 0$.',
    correction:
      'Vraie.<br>On considère la fonction $h$ définie sur $]0~;~+\\infty[$ par $h(x)=\\ln(x)-x+1$.<br>Cette fonction est dérivable sur $]0~;~+\\infty[$ et $h\\prime(x)=\\dfrac{1}{x}-1=\\dfrac{1-x}{x}$.<br>Comme $x>0$, $h\\prime(x)>0$ sur $]0~;~1[$, $h\\prime(1)=0$ et $h\\prime(x)<0$ sur $]1~;~+\\infty[$.<br>La fonction $h$ atteint donc son maximum en $1$, et $h(1)=\\ln(1)-1+1=0$.<br>Ainsi, pour tout réel $x>0$, $h(x)\\leqslant 0$, c’est-à-dire $\\ln(x)-x+1\\leqslant 0$.',
  },
  {
    enonce:
      'On considère l’intégrale $J=\\displaystyle\\int_1^2 x\\ln(x)\\mathrm{d}x$.Déterminer si l’affirmation suivante est vraie ou fausse : une intégration par parties permet d’obtenir $J=\\dfrac{7}{11}$.',
    correction:
      'Fausse.<br>On calcule $J$ par intégration par parties en posant $u\\prime(x)=x$ et $v(x)=\\ln(x)$, donc $u(x)=\\dfrac{x^2}{2}$ et $v\\prime(x)=\\dfrac{1}{x}$.<br>Alors $J=\\left[\\dfrac{x^2}{2}\\ln(x)\\right]_1^2-\\int_1^2\\dfrac{x}{2}\\mathrm{d}x$.<br>Donc $J=2\\ln(2)-\\left[\\dfrac{x^2}{4}\\right]_1^2=2\\ln(2)-\\dfrac{3}{4}$.<br>Or $2\\ln(2)-\\dfrac{3}{4}\\approx 0,63629$ tandis que $\\dfrac{7}{11}\\approx 0,63636$. Les deux nombres ne sont pas égaux.',
  },
]

/**
 * Série statique d'affirmations de Bac sur le logarithme.
 *
 * @author Stéphane Guyon
 */
export default class QcmLogarithmeAffirmations extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
    this.nbQuestionsModifiable = true
    this.spacing = 2
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const nbQuestions = Math.min(
      this.nbQuestions,
      affirmationsLogarithme.length,
    )
    const questions = shuffle(affirmationsLogarithme).slice(0, nbQuestions)

    for (const [index, affirmation] of questions.entries()) {
      this.listeQuestions[index] = enonceAvecConsigne(affirmation.enonce)
      this.listeCorrections[index] = correctionAvecConclusion(
        affirmation.correction,
      )
    }
  }
}
