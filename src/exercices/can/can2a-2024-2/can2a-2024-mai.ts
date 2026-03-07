import { grille } from '../../../lib/2d/Grille'
import { point } from '../../../lib/2d/PointAbstrait'
import { repere } from '../../../lib/2d/reperes'
import {
  segment,
  segmentAvecExtremites,
} from '../../../lib/2d/segmentsVecteurs'
import { texteParPosition } from '../../../lib/2d/textes'
import { milieu } from '../../../lib/2d/utilitairesPoint'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../../lib/interactif/qcm'
import {
  ajouteChampTexteMathLive,
  remplisLesBlancs,
} from '../../../lib/interactif/questionMathLive'
import { spline } from '../../../lib/mathFonctions/Spline'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import { listeQuestionsToContenu } from '../../../modules/outils'
import Exercice from '../../Exercice'

export const titre = 'Course aux nombres - 2nde - Mai 2024'
export const dateDePublication = '7/5/2024'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'can2a-2024-2'

/**
 *
 * @author
 */

export default class nomExercice extends Exercice {
  constructor() {
    super()
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    let i = 0
    this.listeQuestions[i] =
      '$8 \\times 1,25 = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] = `$8 \\times 1,25 = ${miseEnEvidence('10')}$`
    handleAnswers(this, 0, { reponse: { value: '10' } })

    i = 1
    this.listeQuestions[i] =
      '$42 - 55 + 5 = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] = `$42 - 55 + 5 = ${miseEnEvidence('-8')}$`
    handleAnswers(this, i, { reponse: { value: '-8' } })

    i = 2
    this.listeQuestions[i] =
      "Développer et réduire l'expression suivante.<br><br>$(2x-5)^2= $" +
      ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets,
      )
    this.listeCorrections[i] =
      `$(2x-5)^2 = ${miseEnEvidence('4x^2 - 20x + 25')} $`
    handleAnswers(this, i, { reponse: { value: '4x^2 - 20x + 25' } })

    i = 3
    this.listeQuestions[i] =
      '$\\dfrac{1}{5} + \\dfrac{1}{7} = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBaseAvecFraction)
    this.listeCorrections[i] =
      `$\\dfrac{1}{5} + \\dfrac{1}{7} = ${miseEnEvidence('\\dfrac{12}{35}')} $`
    handleAnswers(this, i, { reponse: { value: '\\dfrac{12}{35}' } })

    i = 4
    this.listeQuestions[i] =
      '$30~\\%~\\text{de}~20 = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `$\\dfrac{30}{100} \\times 20 = 0,3 \\times 20 = ${miseEnEvidence('6')} $`
    handleAnswers(this, i, { reponse: { value: '6' } })

    i = 5
    this.listeQuestions[i] =
      '$0{,}2 \\times 0{,}4 = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `$0{,}2 \\times 0{,}4 = ${miseEnEvidence('0{,}08')} $`
    handleAnswers(this, i, { reponse: { value: '0.08' } })

    i = 6
    this.listeQuestions[i] =
      'Augmenter une quantité de $17~\\%$ revient à la multiplier par ' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `$1 + 17~\\% = \\dfrac{117}{100} = 1{,}17$ <br>  Augmenter une quantité de $17~\\%$ revient à la multiplier par $${miseEnEvidence('1{,}17')}$.`
    handleAnswers(this, i, { reponse: { value: '1.17' } })

    i = 7
    this.listeQuestions[i] =
      'Médiane de la série ;<br>$15\\;;\\;2\\;;\\;12\\;;\\;10\\;;\\;7$ :<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `Série ordonnée : $2\\;;\\;7\\;;\\;10\\;;\\;12\\;;\\;15$<br>L'effectif total est 5 donc la médiane est la 3e valeur : $${miseEnEvidence('10')}$.`
    handleAnswers(this, i, { reponse: { value: '10' } })

    i = 8
    this.listeQuestions[i] =
      '$\\sqrt{0{,}36} = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] = `$\\sqrt{0{,}36} = ${miseEnEvidence('0{,}6')} $`
    handleAnswers(this, i, { reponse: { value: '0.6' } })

    i = 9
    this.listeQuestions[i] = 'Soit le script Python :<br> '
    if (context.isHtml) {
      this.listeQuestions[i] += '$\\begin{array}{|l|}\n'
      this.listeQuestions[i] += '\\hline\n'
      this.listeQuestions[i] += '\\\\\n \\texttt{def mystere(a) :}  \\\\\n '
      this.listeQuestions[i] += `\\\\\n ${sp(6)} \\texttt{if a>0 :}\\\\\n `
      this.listeQuestions[i] += `\\\\\n ${sp(12)} \\texttt{return 2*a}\\\\\n `
      this.listeQuestions[i] += `\\\\\n ${sp(6)} \\texttt{else :}\\\\\n `
      this.listeQuestions[i] += `\\\\\n ${sp(12)} \\texttt{return 3*a}\\\\\n `
      this.listeQuestions[i] += '\\hline\n'
      this.listeQuestions[i] += '\\end{array}\n$'
    } else {
      this.listeQuestions[i] += '\\medskip'
      this.listeQuestions[i] += '\\fbox{'
      this.listeQuestions[i] += '\\parbox{0.7\\linewidth}{'
      this.listeQuestions[i] += '\\setlength{\\parskip}{.5cm}'
      this.listeQuestions[i] += ' \\texttt{def mystere(a) :}\\newline'
      this.listeQuestions[i] += ' \\hspace*{3mm}\\texttt{if a>0 :}\\newline'
      this.listeQuestions[i] += ' \\hspace*{8mm}\\texttt{return 2*a}\\newline'
      this.listeQuestions[i] += ' \\hspace*{3mm}\\texttt{else :}\\newline'
      this.listeQuestions[i] += ' \\hspace*{8mm}\\texttt{return 3*a}\\newline'
      this.listeQuestions[i] += '}'
      this.listeQuestions[i] += '}\\newline'
      this.listeQuestions[i] += '\\medskip'
    }
    this.listeQuestions[i] +=
      '<br><br>Que renvoie $\\texttt{mystere(-5)}$ ?' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `$-5 < 0 $ donc le script renvoie $-5 \\times 3 = ${miseEnEvidence('-15')}$.`
    handleAnswers(this, i, { reponse: { value: '-15' } })

    i = 10
    this.listeQuestions[i] =
      'Si je parcours $1{,}5\\text{ km}$ en $10~\\text{min}$, quelle est ma vitesse moyenne en $\\text{km/h}$ ?<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `$1{,}5\\text{ km}$ en $10~\\text{min}$ donc $1{,}5\\text{ km} \\times 6 = 9\\text{ km}$ en une heure.<br>Ma vitesse moyenne est donc de $${miseEnEvidence('9')}~\\text{km/h}$.`
    handleAnswers(this, i, { reponse: { value: '9' } })

    i = 11
    this.listeQuestions[i] =
      'Simplifier.<br> $\\Big(2\\sqrt{3}\\Big)^2 = $' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
    this.listeCorrections[i] =
      `$\\Big(2\\sqrt{3}\\Big)^2 = 4 \\times 3 =  ${miseEnEvidence('12')} $`
    handleAnswers(this, i, { reponse: { value: '12' } })

    i = 12
    this.listeQuestions[i] = 'Comparer $0,7$ et $0,7^2$.<br>'
    this.listeQuestions[i] +=
      '$0,7$' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierCompare + ' ') +
      '$0,7^2$'
    this.listeCorrections[i] =
      `$0,7 < 1$ donc $0{,}7~${miseEnEvidence('>')}~0{,}7^2 $`
    handleAnswers(this, i, {
      reponse: { value: '>', options: { texteSansCasse: true } },
    })

    i = 13
    this.listeQuestions[i] =
      "Quel est le périmètre d'un carré de $49\\text{ cm}^2$ ?<br>"
    if (this.interactif) {
      this.listeQuestions[i] += ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierNumbers,
        { texteApres: '\\text{ cm}$' },
      )
    }
    this.listeCorrections[i] =
      `L'aire est de $49\\text{ cm}^2$ donc c'est un carré de $7\\text{ cm}$ de côté.<br> Son périmètre est : $4 \\times 7\\text{ cm} =  ${miseEnEvidence('28')}\\text{ cm}$`
    handleAnswers(this, i, { reponse: { value: '28' } })

    i = 14
    this.listeQuestions[i] =
      "Quel est l'intervalle de l'ensemble des solutions de l'équation $\\rvert x-1 \\rvert < 2$ ?<br>" +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierEnsemble)
    this.listeCorrections[i] = `$S=${miseEnEvidence(']-1\\;;\\;3[')}$`
    handleAnswers(this, i, {
      reponse: {
        value: ']-1;3[',
        options: { intervalle: true },
      },
    })

    i = 15
    this.listeQuestions[i] =
      'Soient $A(5\\;;\\;9)$ et $B(7\\;;\\;3)$ dans un repère orthonormé.<br>Déterminer les coordonnées du vecteur $\\overrightarrow{AB}$.<br>'
    this.listeCorrections[i] =
      `$\\overrightarrow{AB}(x_B - x_A \\;;\\; y_B - y_A) \\iff \\overrightarrow{AB}(7-5 \\;;\\; 3-9)  \\iff\\overrightarrow{AB}${miseEnEvidence('(2 \\;;\\; -6 )')}$`
    if (this.interactif) {
      this.listeQuestions[i] += remplisLesBlancs(
        this,
        i,
        '\\overrightarrow{AB}\\Big(%{champ1} \\;;\\; %{champ2}\\Big)',
        KeyboardType.clavierNumbers,
      )
    }
    handleAnswers(this, i, {
      bareme: (listePoints) => [Math.min(listePoints[0], listePoints[1]), 1],
      champ1: { value: '2' },
      champ2: { value: '-6' },
    })

    i = 16
    this.listeQuestions[i] =
      'Soient $A(5\\;;\\;9)$ et $B(7\\;;\\;3)$ dans un repère orthonormé.<br>Déterminer la longueur $AB$.<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierFullOperations)
    this.listeCorrections[i] =
      `$AB = \\sqrt{{x_{\\overrightarrow{AB}}}^2 + {y_{\\overrightarrow{AB}}}^2}=\\sqrt{2^2 + 6^2} =   ${miseEnEvidence('\\sqrt{40}')}$`
    handleAnswers(this, i, {
      reponse: { value: '\\sqrt{40}', options: { fonction: true } },
    })

    i = 17
    this.listeQuestions[i] =
      'Écriture scientifique de $0{,}0314$ :<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierFullOperations) +
      '.'
    this.listeCorrections[i] =
      `$0{,}0314 =   ${miseEnEvidence('3{,}14\\times10^{-2}')}$`
    handleAnswers(this, i, {
      reponse: {
        value: '3{,}14\\times10^{-2}',
        options: { ecritureScientifique: true },
      },
    })

    i = 18
    this.listeQuestions[i] = 'Solutions de $x(x-3)=0$ :<br>'
    this.listeQuestions[i] += ajouteChampTexteMathLive(
      this,
      i,
      KeyboardType.clavierNumbers,
    )
    this.listeCorrections[i] =
      `Un produit est nul si et seulement si l'un au moins de ses facteurs est nul.<br>$S=${miseEnEvidence('\\{0\\;;\\;3\\}')}$`
    handleAnswers(this, i, {
      reponse: { value: '0;3', options: { suiteDeNombres: true } },
    })

    i = 19
    this.listeQuestions[i] =
      'Valeur de $5x - 8$ pour $x=\\dfrac{4}{5}$ :<br>' +
      ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierDeBaseAvecFraction,
      ) +
      '.'
    this.listeCorrections[i] =
      `$5\\times\\dfrac{4}{5} - 8 = 4 - 8 =   ${miseEnEvidence('-4')}$`
    handleAnswers(this, i, { reponse: { value: '-4' } })

    i = 20
    const objets = []
    objets.push(grille(-1, 0, 7, 4, 'gray', 1, 1))
    const A = point(0, 3)
    const B = point(0, 1)
    const C = point(2, 1)
    const D = point(2, 3)
    const E = point(4, 3)
    const F = point(4, 1)
    const J = point(5, 1)
    const K = point(5, 2)
    const G = point(0, 4) // unite
    const H = point(4, 4) // unite
    const s1 = segmentAvecExtremites(G, H)
    s1.epaisseur = 3
    const s2 = segment(A, B, 'blue')
    s2.epaisseur = 3
    const s3 = segment(B, C, 'blue')
    s3.epaisseur = 3
    const s4 = segment(C, D, 'blue')
    s4.epaisseur = 3
    const s5 = segment(D, E, 'blue')
    s5.epaisseur = 3
    const s6 = segment(E, F, 'blue')
    s6.epaisseur = 3
    const s7 = segment(F, J, 'blue')
    s7.epaisseur = 3
    const s8 = segment(J, K, 'blue')
    s8.epaisseur = 3
    const xmin = -1
    const ymin = 0
    const xmax = 7
    const ymax = 5
    objets.push(
      texteParPosition(
        '1 u.l.',
        milieu(G, H).x,
        milieu(G, H).y + 0.7,
        0.5,
        'black',
        context.isHtml ? 1 : 0.7,
      ),
      s1,
      s2,
      s3,
      s4,
      s5,
      s6,
      s7,
      s8,
    )
    this.listeQuestions[i] =
      mathalea2d(
        {
          xmin,
          ymin,
          xmax,
          ymax,
          pixelsParCm: 20,
          mainlevee: false,
          amplitude: 0.5,
          scale: 0.5,
          style: 'margin: auto',
        },
        objets,
      ) +
      'Longueur de la ligne brisée en unités de longueur (u.l) :<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBaseAvecFraction)
    handleAnswers(this, i, { reponse: { value: '3' } })
    this.listeCorrections[i] = `$L = ${miseEnEvidence('3')}$ u.l.`

    i = 21
    this.listeQuestions[i] =
      "Un sac contient $15$ jetons identiques numérotés de $1$ à $15$. On tire un jeton au hasard.<br>Quelle est la probabilité qu'il porte un nombre premier ?<br>"
    this.listeQuestions[i] += ajouteChampTexteMathLive(
      this,
      i,
      KeyboardType.clavierDeBaseAvecFraction,
    )
    this.listeCorrections[i] =
      'Les nombres premiers inférieurs ou égaux à $15$ sont : $2\\;;\\;3\\;;\\;5\\;;\\;7\\;;\\;11\\;;\\;13$.'
    this.listeCorrections[i] +=
      `<br>La probabilité de tirer un nombre premier est donc : $${miseEnEvidence('\\dfrac{6}{15}')}$.`
    handleAnswers(this, i, { reponse: { value: '\\dfrac{6}{15}' } })

    i = 22
    this.listeQuestions[i] =
      'La décomposition en produit de facteurs premiers de 30 est : <br>'
    this.listeQuestions[i] += ajouteChampTexteMathLive(
      this,
      i,
      KeyboardType.clavierDeBase,
    )
    this.listeCorrections[i] = `$30 = ${miseEnEvidence('2\\times3\\times5')}$`
    handleAnswers(this, i, {
      reponse: {
        value: '2\\times3\\times5',
        options: { exclusifFactorisation: true },
      },
    })

    i = 23
    this.listeQuestions[i] =
      'Soient $A(4\\;;\\;9)$ et $B(2\\;;\\;4)$.<br>Déterminer le coefficient directeur de la droite $(AB)$.<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBaseAvecFraction)
    this.listeCorrections[i] =
      `$m=\\dfrac{y_B - y_A}{x_B - x_A} = \\dfrac{4 - 9}{2 - 4} = ${miseEnEvidence('\\dfrac{5}{2}')}$`
    handleAnswers(this, i, { reponse: { value: '\\dfrac{5}{2}' } })

    i = 24
    this.listeQuestions[i] =
      'Coordonnées du point $M$, milieu du segment $[AB]$ où : $A(-2\\;;\\;3)$ et $B(2\\;;\\;7)$ :<br>'
    if (this.interactif) {
      this.listeQuestions[i] += remplisLesBlancs(
        this,
        i,
        'M\\Big(%{champ1} \\;;\\; %{champ2}\\Big)\\text{.}',
        KeyboardType.clavierNumbers,
      )
    }
    this.listeCorrections[i] =
      `$M\\Big( \\dfrac{x_A + x_B}{2}  \\;;\\;  \\dfrac{y_A + y_B}{2}\\Big) \\iff M\\Big( \\dfrac{-2 + 2}{2}  \\;;\\;  \\dfrac{3 + 7}{2}\\Big) \\iff M\\Big(${miseEnEvidence('0\\;;\\;5')}\\Big)$`
    handleAnswers(this, i, {
      bareme: (listePoints) => [Math.min(listePoints[0], listePoints[1]), 1],
      champ1: { value: '0' },
      champ2: { value: '5' },
    })

    i = 25
    this.listeQuestions[i] =
      'Les vecteurs $\\vec{u}\\begin{pmatrix}2 \\\\-5\\end{pmatrix}$ et $\\vec{v}\\begin{pmatrix}-4 \\\\10\\end{pmatrix}$ sont-ils colinéaires ?<br>'
    this.listeCorrections[i] =
      `$\\vec{v} = -2\\times\\vec{u}$, donc $${miseEnEvidence('\\text{oui}')}$ les vecteurs sont colinéaires.`
    this.autoCorrection[i] = {
      options: { ordered: false },
      enonce: '',
      propositions: [
        {
          texte: 'oui',
          statut: true,
        },
        {
          texte: 'non',
          statut: false,
        },
      ],
    }
    const qcm = propositionsQcm(this, i)
    this.listeQuestions[i] += qcm.texte

    i = 26
    this.listeQuestions[i] =
      'Factoriser $x^2-25$.<br>' +
      ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBaseAvecX)
    this.listeCorrections[i] =
      `On utilise l'identité remarquable $a^2-b^2=(a+b)(a-b)$ pour obtenir : $x^2 - 25 = x^2 - 5^2 = ${miseEnEvidence('(x+5)(x-5)')} $`
    handleAnswers(this, i, {
      reponse: { value: '(x+5)(x-5)', options: { factorisation: true } },
    })

    i = 27
    const noeuds = [
      { x: -6, y: -2.5, deriveeGauche: 0, deriveeDroit: 0, isVisible: false },
      { x: -3, y: 0, deriveeGauche: 0.5, deriveeDroit: 0.75, isVisible: false },
      { x: -2, y: 3, deriveeGauche: 1.5, deriveeDroit: -1, isVisible: false },
      { x: 0, y: 1, deriveeGauche: -1, deriveeDroit: -1, isVisible: false },
      { x: 1, y: 0, deriveeGauche: -1, deriveeDroit: -3, isVisible: false },
      { x: 2, y: -2, deriveeGauche: -1, deriveeDroit: -1, isVisible: false },
      {
        x: 4,
        y: -3,
        deriveeGauche: -0.25,
        deriveeDroit: -0.25,
        isVisible: false,
      },
      {
        x: 6,
        y: -4,
        deriveeGauche: -0.25,
        deriveeDroit: -0.25,
        isVisible: false,
      },
    ]

    const textO = texteParPosition('O', -0.3, -0.3, 0.5, 'black', 1)
    const theSpline = spline(noeuds)
    const repere1 = repere({
      xMin: -6.5,
      xMax: 6.5,
      yMin: -5.5,
      yMax: 4.5,
      grilleX: false,
      grilleY: false,
      grilleSecondaire: true,
      grilleSecondaireYDistance: 1,
      grilleSecondaireXDistance: 1,
      grilleSecondaireYMin: -7,
      grilleSecondaireYMax: 7,
      grilleSecondaireXMin: -6,
      grilleSecondaireXMax: 6,
    })
    const courbe1 = theSpline.courbe({
      epaisseur: 1.5,
      ajouteNoeuds: true,
      optionsNoeuds: { color: 'blue', taille: 2, style: 'x', epaisseur: 2 },
      color: 'blue',
    })
    const objetsEnonce = [repere1, courbe1, textO]
    this.listeQuestions[i] = 'On donne le graphique d’une fonction $f$ : <br>'
    this.listeQuestions[i] += mathalea2d(
      Object.assign(
        { pixelsParCm: 30, scale: 0.55, style: 'margin: auto' },
        { xmin: -6, ymin: -5, xmax: 6, ymax: 4 },
      ),
      objetsEnonce,
    )
    this.listeQuestions[i] += 'Quels sont les antécédents de $0$ par $f$ ?<br>'
    this.listeQuestions[i] += '(Les séparer avec un point-virgule.)<br>'
    this.listeQuestions[i] += ajouteChampTexteMathLive(
      this,
      i,
      KeyboardType.clavierEnsemble,
    )
    this.listeCorrections[i] =
      `Les antécédents de $0$ par $f$ sont $${miseEnEvidence('-3\\;;\\;1')}$.`
    handleAnswers(this, i, {
      reponse: { value: '-3;1', options: { suiteDeNombres: true } },
    })

    i = 28
    this.listeQuestions[i] = 'On donne le graphique d’une fonction $f$ : <br>'
    this.listeQuestions[i] += mathalea2d(
      Object.assign(
        { pixelsParCm: 30, scale: 0.55, style: 'margin: auto' },
        { xmin: -6, ymin: -5, xmax: 6, ymax: 4 },
      ),
      objetsEnonce,
    )
    this.listeQuestions[i] +=
      "Quelle est l'image de $0$ par la fonction $f$ ?<br>"
    this.listeQuestions[i] += ajouteChampTexteMathLive(
      this,
      i,
      KeyboardType.clavierNumbers,
    )
    this.listeCorrections[i] =
      `L'image de $0$ par la fonction $f$ est $${miseEnEvidence('1')}$.`
    handleAnswers(this, i, { reponse: { value: '1' } })

    i = 29
    this.listeQuestions[i] = 'On donne le graphique d’une fonction $f$ : <br>'
    this.listeQuestions[i] += mathalea2d(
      Object.assign(
        { pixelsParCm: 30, scale: 0.55, style: 'margin: auto' },
        { xmin: -6, ymin: -5, xmax: 6, ymax: 4 },
      ),
      objetsEnonce,
    )
    this.listeQuestions[i] +=
      'Sur quel intervalle, $f$ est-elle positive ou nulle ?<br>'
    this.listeQuestions[i] += ajouteChampTexteMathLive(
      this,
      i,
      KeyboardType.clavierEnsemble,
    )
    this.listeCorrections[i] =
      `La fonction $f$ est positive ou nulle sur $${miseEnEvidence('[-3;1]')}$.`
    handleAnswers(this, i, {
      reponse: {
        value: '[-3;1]',
        options: { intervalle: true },
      },
    })

    listeQuestionsToContenu(this)
  }
}
