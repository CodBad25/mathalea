import { createList } from '../../lib/format/lists'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'
import { Complexe } from '../../lib/mathFonctions/Complexe'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  reduireAxPlusByPlusC,
} from '../../lib/outils/ecritures'
import { pgcd } from '../../lib/outils/primalite'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Étudier la réalité d'un quotient de complexes"
export const interactifReady = true
export const dateDePublication = '01/09/2026'
export const uuid = 'df2d2'

export const refs = {
  'fr-fr': ['TEC1-51'],
  'fr-ch': [],
}

/**
 * Exprimer le conjugué d'un quotient dépendant de z, puis déterminer les
 * valeurs de z pour lesquelles ce quotient est réel.
 *
 * @author Stéphane Guyon
 */
export default class RealiteQuotientComplexes extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
    this.nbQuestionsModifiable = true
    this.spacing = 1.5
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const typeConstantes = randint(1, 3)
      const premiereConstante = randint(-5, 5, 0)
      const secondeConstante = randint(
        -5,
        5,
        typeConstantes === 3 ? [0, premiereConstante] : 0,
      )
      const a = typeConstantes === 2 ? premiereConstante : 0
      const b = typeConstantes === 2 ? 0 : premiereConstante
      const c = typeConstantes === 1 ? secondeConstante : 0
      const d = typeConstantes === 1 ? 0 : secondeConstante
      const constanteNumerateur = new Complexe(a, b)
      const constanteDenominateur = new Complexe(c, d)

      const conjugueNumerateur = constanteNumerateur.conjugue()
      const conjugueDenominateur = constanteDenominateur.conjugue()
      const valeurInterdite = constanteDenominateur.negate()
      const coefficientXBrut = b - d
      const coefficientYBrut = c - a
      const constanteEquationBrute = b * c - a * d
      const diviseurCommun = pgcd(
        Math.abs(coefficientXBrut),
        Math.abs(coefficientYBrut),
        Math.abs(constanteEquationBrute),
      )
      const coefficientXApresPgcd = coefficientXBrut / diviseurCommun
      const coefficientYApresPgcd = coefficientYBrut / diviseurCommun
      const constanteApresPgcd = constanteEquationBrute / diviseurCommun
      const premierCoefficientNonNul = [
        coefficientXApresPgcd,
        coefficientYApresPgcd,
        constanteApresPgcd,
      ].find((coefficient) => coefficient !== 0)!
      const changementDeSigne = premierCoefficientNonNul < 0
      const coefficientX = changementDeSigne
        ? -coefficientXApresPgcd
        : coefficientXApresPgcd
      const coefficientY = changementDeSigne
        ? -coefficientYApresPgcd
        : coefficientYApresPgcd
      const constanteEquation = changementDeSigne
        ? -constanteApresPgcd
        : constanteApresPgcd
      const equationBrute = reduireAxPlusByPlusC(
        coefficientXBrut,
        coefficientYBrut,
        constanteEquationBrute,
      )
      const equationApresPgcd = reduireAxPlusByPlusC(
        coefficientXApresPgcd,
        coefficientYApresPgcd,
        constanteApresPgcd,
      )
      const equationDroite = reduireAxPlusByPlusC(
        coefficientX,
        coefficientY,
        constanteEquation,
      )
      const explicationSimplification = `${
        diviseurCommun > 1
          ? `Le PGCD des coefficients de cette expression vaut $${diviseurCommun}$. En divisant l’équation $${equationBrute}=0$ par $${diviseurCommun}$, on obtient l’équation équivalente $${equationApresPgcd}=0$.<br>`
          : ''
      }${
        changementDeSigne
          ? `${diviseurCommun > 1 ? 'En multipliant cette dernière équation' : `En multipliant l’équation $${equationBrute}=0$`} par $-1$, on retient l’écriture $${equationDroite}=0$.<br>`
          : ''
      }`
      const quotient = `\\dfrac{z${constanteNumerateur.tex(true)}}{z${constanteDenominateur.tex(true)}}`
      const quotientConjugue = `\\dfrac{\\overline{z}${conjugueNumerateur.tex(true)}}{\\overline{z}${conjugueDenominateur.tex(true)}}`
      let developpementNumerateur: string

      if (typeConstantes === 1) {
        const yPlusPremiere = `y${ecritureAlgebrique(premiereConstante)}`
        const xPlusSeconde = `x${ecritureAlgebrique(secondeConstante)}`
        developpementNumerateur = `$\\begin{aligned}
        &\\left(z${constanteNumerateur.tex(true)}\\right)
        \\left(\\overline{z}${conjugueDenominateur.tex(true)}\\right)\\\\
        ={}&\\left[x+i\\left(${yPlusPremiere}\\right)\\right]
        \\left[${xPlusSeconde}-iy\\right]\\\\
        ={}&x\\left(${xPlusSeconde}\\right)-ixy
        +i\\left(${yPlusPremiere}\\right)\\left(${xPlusSeconde}\\right)
        -i^2y\\left(${yPlusPremiere}\\right)\\\\
        ={}&\\left[x\\left(${xPlusSeconde}\\right)+y\\left(${yPlusPremiere}\\right)\\right]\\\\
        &+i\\left[\\left(${yPlusPremiere}\\right)\\left(${xPlusSeconde}\\right)-xy\\right].
        \\end{aligned}$<br>
        On développe maintenant l’expression qui multiplie $i$ :<br>
        $\\begin{aligned}
        \\left(${yPlusPremiere}\\right)\\left(${xPlusSeconde}\\right)-xy
        &=xy${ecritureAlgebriqueSauf1(secondeConstante)}y${ecritureAlgebriqueSauf1(premiereConstante)}x${ecritureAlgebrique(premiereConstante * secondeConstante)}-xy\\\\
        &=${equationBrute}.
        \\end{aligned}$<br>`
      } else if (typeConstantes === 2) {
        const xPlusPremiere = `x${ecritureAlgebrique(premiereConstante)}`
        const yPlusSeconde = `y${ecritureAlgebrique(secondeConstante)}`
        developpementNumerateur = `$\\begin{aligned}
        &\\left(z${constanteNumerateur.tex(true)}\\right)
        \\left(\\overline{z}${conjugueDenominateur.tex(true)}\\right)\\\\
        ={}&\\left[${xPlusPremiere}+iy\\right]
        \\left[x-i\\left(${yPlusSeconde}\\right)\\right]\\\\
        ={}&x\\left(${xPlusPremiere}\\right)
        -i\\left(${xPlusPremiere}\\right)\\left(${yPlusSeconde}\\right)
        +ixy-i^2y\\left(${yPlusSeconde}\\right)\\\\
        ={}&\\left[x\\left(${xPlusPremiere}\\right)+y\\left(${yPlusSeconde}\\right)\\right]\\\\
        &+i\\left[xy-\\left(${xPlusPremiere}\\right)\\left(${yPlusSeconde}\\right)\\right].
        \\end{aligned}$<br>
        On développe maintenant l’expression qui multiplie $i$ :<br>
        $\\begin{aligned}
        xy-\\left(${xPlusPremiere}\\right)\\left(${yPlusSeconde}\\right)
        &=xy-xy${ecritureAlgebriqueSauf1(-secondeConstante)}x${ecritureAlgebriqueSauf1(-premiereConstante)}y${ecritureAlgebrique(-premiereConstante * secondeConstante)}\\\\
        &=${equationBrute}.
        \\end{aligned}$<br>`
      } else {
        const yPlusPremiere = `y${ecritureAlgebrique(premiereConstante)}`
        const yPlusSeconde = `y${ecritureAlgebrique(secondeConstante)}`
        developpementNumerateur = `$\\begin{aligned}
        &\\left(z${constanteNumerateur.tex(true)}\\right)
        \\left(\\overline{z}${conjugueDenominateur.tex(true)}\\right)\\\\
        ={}&\\left[x+i\\left(${yPlusPremiere}\\right)\\right]
        \\left[x-i\\left(${yPlusSeconde}\\right)\\right]\\\\
        ={}&x^2-ix\\left(${yPlusSeconde}\\right)
        +ix\\left(${yPlusPremiere}\\right)
        -i^2\\left(${yPlusPremiere}\\right)\\left(${yPlusSeconde}\\right)\\\\
        ={}&\\left[x^2+\\left(${yPlusPremiere}\\right)\\left(${yPlusSeconde}\\right)\\right]\\\\
        &+i\\left[x\\left(${yPlusPremiere}\\right)-x\\left(${yPlusSeconde}\\right)\\right].
        \\end{aligned}$<br>
        On développe maintenant l’expression qui multiplie $i$ :<br>
        $\\begin{aligned}
        x\\left(${yPlusPremiere}\\right)-x\\left(${yPlusSeconde}\\right)
        &=xy${ecritureAlgebriqueSauf1(premiereConstante)}x-xy${ecritureAlgebriqueSauf1(-secondeConstante)}x\\\\
        &=${equationBrute}.
        \\end{aligned}$<br>`
      }
      let formatReponsePartie2: string
      let reponsePartie2: string
      let conclusionContrainte: string

      if (coefficientY === 0) {
        const abscisse = new FractionEtendue(
          -constanteEquation,
          coefficientX,
        ).simplifie()
        const abscisseTex = abscisse.texFractionSimplifiee
        const formeComplexe = abscisseTex === '0' ? 'iy' : `${abscisseTex}+iy`
        formatReponsePartie2 =
          abscisseTex === '0'
            ? `x&=%{champ2},\\quad z=iy,\\quad y\\in\\mathbb{R}`
            : `z&=%{champ2}+iy,\\quad y\\in\\mathbb{R}`
        reponsePartie2 = abscisseTex
        conclusionContrainte = `$${equationDroite}=0\\iff x=${abscisseTex}$.<br>
      Ainsi, les solutions sont les nombres complexes de la forme $z=${formeComplexe}$, avec $y\\in\\mathbb{R}$, à l’exception de la valeur interdite.<br>
      $${miseEnEvidence(`S=\\left\\{${formeComplexe}\\mid y\\in\\mathbb{R}\\right\\}\\setminus\\left\\{${valeurInterdite.tex()}\\right\\}`)}$.`
      } else if (coefficientX === 0) {
        const ordonnee = new FractionEtendue(
          -constanteEquation,
          coefficientY,
        ).simplifie()
        const ordonneeTex = ordonnee.texFractionSimplifiee
        const formeComplexe =
          ordonneeTex === '0' ? 'x' : `x+i\\left(${ordonneeTex}\\right)`
        formatReponsePartie2 =
          ordonneeTex === '0'
            ? `y&=%{champ2},\\quad z=x,\\quad x\\in\\mathbb{R}`
            : `z&=x+i\\left(%{champ2}\\right),\\quad x\\in\\mathbb{R}`
        reponsePartie2 = ordonneeTex
        conclusionContrainte = `$${equationDroite}=0\\iff y=${ordonneeTex}$.<br>
      Ainsi, les solutions sont les nombres complexes de la forme $z=${formeComplexe}$, avec $x\\in\\mathbb{R}$, à l’exception de la valeur interdite.<br>
      $${miseEnEvidence(`S=\\left\\{${formeComplexe}\\mid x\\in\\mathbb{R}\\right\\}\\setminus\\left\\{${valeurInterdite.tex()}\\right\\}`)}$.`
      } else {
        formatReponsePartie2 = `\\text{Équation cartésienne : }%{champ2}&=0`
        reponsePartie2 = equationDroite
        conclusionContrainte = `$${miseEnEvidence(`S=\\left\\{x+iy\\in\\mathbb{C}\\mid ${equationDroite}=0\\right\\}\\setminus\\left\\{${valeurInterdite.tex()}\\right\\}`)}$.`
      }

      const questions = createList({
        items: [
          'Exprimer $\\overline{Z}$ en fonction de $\\overline{z}$.',
          'Déterminer l’ensemble des nombres complexes $z$ tels que $Z\\in\\mathbb{R}$.',
        ],
        style: 'nombres',
      })
      let texte = `On considère le nombre complexe :<br>
    $Z=${quotient}$, avec $z\\neq ${valeurInterdite.tex()}$.<br>
    ${questions}`

      if (this.interactif) {
        texte += `<br>${remplisLesBlancs(
          this,
          i,
          `\\begin{aligned}
        \\overline{Z}&=%{champ1}\\\\
        ${formatReponsePartie2},\\quad z\\neq %{champ3}.
        \\end{aligned}`,
          `${KeyboardType.clavierDeBase} ${KeyboardType.complexes} ${KeyboardType.clavierDeBaseAvecVariable}`,
        )}`
      }

      const correctionPartie1 = `Pour tous nombres complexes $u$ et $v$, avec $v\\neq 0$, on a :
    $\\overline{\\left(\\dfrac{u}{v}\\right)}=\\dfrac{\\overline{u}}{\\overline{v}}$.<br>
    De plus, le conjugué d’une somme est la somme des conjugués. Ainsi :<br>
    $\\begin{aligned}
    \\overline{Z}
    &=\\dfrac{\\overline{z${constanteNumerateur.tex(true)}}}{\\overline{z${constanteDenominateur.tex(true)}}}\\\\
    &=${miseEnEvidence(quotientConjugue)}.
    \\end{aligned}$`

      const correctionPartie2 = `On multiplie le numérateur et le dénominateur par la quantité conjuguée du dénominateur, pour le rendre réel :<br>
    $Z=\\dfrac{\\left(z${constanteNumerateur.tex(true)}\\right)\\left(\\overline{z}${conjugueDenominateur.tex(true)}\\right)}{\\left(z${constanteDenominateur.tex(true)}\\right)\\left(\\overline{z}${conjugueDenominateur.tex(true)}\\right)}$.<br>
    Le dénominateur $\\left(z${constanteDenominateur.tex(true)}\\right)\\left(\\overline{z}${conjugueDenominateur.tex(true)}\\right)$ est le produit de deux nombres complexes conjugués. Comme $z\\neq ${valeurInterdite.tex()}$, ce produit est un réel strictement positif. Ainsi, $Z$ est réel si et seulement si le numérateur est réel.<br>
    Posons $z=x+iy$, avec $x$ et $y$ réels. Alors $\\overline{z}=x-iy$. On commence par effectuer ces substitutions dans le numérateur, puis on développe en utilisant $i^2=-1$ :<br>
    ${developpementNumerateur}
    ${explicationSimplification}Par conséquent, pour $z=x+iy$, on a $Z\\in\\mathbb{R}$ si et seulement si $${equationDroite}=0$, sans oublier la valeur interdite $z=${valeurInterdite.tex()}$.<br>
    ${conclusionContrainte}`

      const texteCorr = createList({
        items: [correctionPartie1, correctionPartie2],
        style: 'nombres',
      })

      handleAnswers(
        this,
        i,
        {
          champ1: { value: quotientConjugue },
          champ2: { value: reponsePartie2 },
          champ3: { value: valeurInterdite.tex() },
        },
        { formatInteractif: 'fill-in-the-blank' },
      )

      if (
        this.questionJamaisPosee(
          i,
          typeConstantes,
          premiereConstante,
          secondeConstante,
        )
      ) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
    }
    listeQuestionsToContenu(this)
  }
}
