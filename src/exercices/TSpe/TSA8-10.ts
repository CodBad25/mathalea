import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const uuid = 'd4595'
export const refs = {
  'fr-fr': ['TSA8-10'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Connaître le cours sur le calcul intégral'
export const dateDePublication = '4/4/2025'

/*
 * @author Stéphane Guyon
 */
export default class VraiFauxSuites extends ExerciceVraiFaux {
  constructor() {
    super()
    this.nbQuestions = 4
    this.affirmations = [
      {
        texte:
          'Pour toute fonction $f$ continue sur $[a,b]$, $\\displaystyle\\int_a^b f(x) \\mathrm{d}x = -\\displaystyle\\int_b^a f(x) \\mathrm{d}x$.',
        statut: true,
        correction:
          "C'est une propriété de l'intégrale liée à l'orientation de l'intervalle.", // 1
      },
      {
        texte:
          'Si $\\displaystyle\\int_{1}^3 f(x)\\mathrm{d}x \\leqslant 0$ alors pour tout $x\\in[1;3], f(x)\\leqslant 0$.',
        statut: false,
        correction:
          "Si pour tout $x\\in[1;3], f(x)\\leqslant 0$ alors $\\displaystyle\\int_{1}^3 f(x)\\mathrm{d}x \\leqslant 0$ mais la réciproque est fausse en général.<br>En effet, soit $f$ la fonction définie sur  définie sur $[1;3]$ par $f(x)=x-2,5$. On peut facilement montrer que $\\displaystyle\\int_{1}^3 f(x)\\mathrm{d}x=-1<0$  mais $f$ n'est pas négative sur $[1;3]$",
      },
      {
        texte:
          "La valeur moyenne d'une fonction $f$ continue sur $[a,b]$ est donnée par $\\dfrac{1}{b-a}\\displaystyle\\int_a^b f(x) \\mathrm{d}x$.",
        statut: true,
        correction:
          "C'est la définition de la valeur moyenne d'une fonction sur un intervalle.", // 3
      },
      {
        texte:
          'Si $F$ est une primitive de $f$ sur $[a,b]$, alors $\\displaystyle\\int_a^b f(t) dt = F(a) - F(b)$.',
        statut: false,
        correction: "C'est $\\displaystyle\\int_a^b f(t) dt = F(b) - F(a)$.",
      },
      {
        texte:
          'Pour toutes fonctions $f$ et $g$ continues sur $[a,b]$, $\\displaystyle\\int_a^b (f(x) + g(x)) \\mathrm{d}x = \\displaystyle\\int_a^b f(x) \\mathrm{d}x + \\displaystyle\\int_a^b g(x) \\mathrm{d}x$.',
        statut: true,
        correction: "C'est la linéarité de l'intégrale.",
      },
      {
        texte:
          "L'aire entre la courbe d'une fonction $f$ et l'axe des abscisses sur $[a,b]$ est donnée par $\\displaystyle\\int_a^b f(x) \\mathrm{d}x$.",
        statut: false,
        correction:
          "Ce n'est vrai que si on vérifie que $f$ est une fonction positive.",
      },
      {
        texte:
          "On peut schématiser l'intégration par parties ainsi :  $\\displaystyle\\int u'v=[uv']-\\displaystyle\\int uv$.",
        statut: false,
        correction: "$\\displaystyle\\int u'v=[uv]-\\displaystyle\\int u'v$.", // 7
      },
      {
        texte:
          "On sait qu'une fonction $f$ continue sur $[1;4]$, vérifie sur cet intervalle : $2\\leqslant f(x)\\leqslant 5$.<br>  On peut en déduire que $6\\leqslant\\displaystyle\\int_1^4 f(x) \\mathrm{d}x\\leqslant15$.",
        statut: true,
        correction:
          'Si une fonction continue admet un minimum $m$ et un maximum $M$ sur $[a;b]$, alors $m(b-a)\\leqslant\\displaystyle\\int_a^b f(x) \\mathrm{d}x\\leqslant M(b-a)$.',
      },
      {
        texte:
          'La fonction $F$ définie sur $[0;+\\infty]$ par $F(x)=\\displaystyle\\int_0^x \\mathrm{e}^{t^2} \\mathrm{d}t$ change de sens de variation.',
        statut: false,
        correction:
          "$F'(x)=\\mathrm{e}^{x^2}>0$ donc $F$ est croissante sur $[0;+\\infty]$.",
      },
      {
        texte:
          'Soit $f$ une fonction continue sur $[2;5]$. $\\displaystyle\\int_2^5 (f(t) + 3 )\\mathrm{d}t=\\displaystyle\\int_2^5 f(t) \\mathrm{d}t + 3 $.',
        statut: false,
        correction:
          '$\\displaystyle\\int_2^5 f(t) + 3 \\mathrm{d}t=\\displaystyle\\int_2^5 f(t) \\mathrm{d}t + \\displaystyle\\int_2^5 3 \\mathrm{d}t =\\displaystyle\\int_2^5 f(t) \\mathrm{d}t + 9$.',
      },
      {
        texte: '$\\displaystyle\\int_2^5 2 \\mathrm{d}t=3 $.',
        statut: false,
        correction:
          '$\\displaystyle\\int_2^5 2 \\mathrm{d}t=[2t]_2^5=2\\times 5-2 \\times 2 = 6 $.',
      },
      {
        texte:
          'La valeur moyenne de la fonction $f$ définie sur $[-1;1]$ par $f(x)=x^2$ est $\\dfrac{1}{2}$.',
        statut: false,
        correction:
          'On a $\\displaystyle\\int_{-1}^1 x^2 \\mathrm{d}x=\\dfrac{2}{3}$ donc la valeur moyenne est $\\dfrac{1}{2} \\times \\dfrac{2}{3} = \\dfrac{1}{3}$.',
      },
      {
        texte: '$\\displaystyle\\int_{-\\pi}^{\\pi} \\cos(t) \\mathrm{d}t=0 $.',
        statut: true,
        correction:
          '$\\displaystyle\\int_{-\\pi}^{\\pi} \\cos(t) \\mathrm{d}t= [\\sin(t)]_{-\\pi}^{\\pi}=\\sin(\\pi)-\\sin(-\\pi) =0-0=0$.',
      },
      {
        texte: '$\\displaystyle\\int_{-2}^2 t \\mathrm{d}t=0 $.',
        statut: true,
        correction:
          '$\\displaystyle\\int_{-2}^2 t \\mathrm{d}t=[\\dfrac{t^2}{2}]_{-2}^{2}=0 $.', // 13
      },
    ]
  }
}
