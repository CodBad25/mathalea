import { Polynome } from '../../lib/mathFonctions/Polynome'
import {
  choice,
  combinaisonListes,
  shuffle,
} from '../../lib/outils/arrayOutils'
import { ecritureAlgebriqueSauf1, rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Déterminer les limites de suites'
export const dateDePublication = '28/09/2026'
export const uuid = '356e4'
export const refs = { 'fr-fr': ['TSA2-50'], 'fr-ch': [] }

type QuestionGeneree = { expression: string; correction: string }
type GenerateurQuestion = (nom: string) => QuestionGeneree
type DonneesRaison = {
  qTex: string
  qDescription: string
  limitePuissance: '0' | '+\\infty'
}

const raisonsContractantes: DonneesRaison[] = [
  {
    qTex: new FractionEtendue(1, 2).texFractionSimplifiee,
    qDescription: 'q\\in]-1\\,;\\,1[',
    limitePuissance: '0',
  },
  {
    qTex: new FractionEtendue(-1, 2).texFractionSimplifiee,
    qDescription: 'q\\in]-1\\,;\\,1[',
    limitePuissance: '0',
  },
  {
    qTex: new FractionEtendue(2, 3).texFractionSimplifiee,
    qDescription: 'q\\in]-1\\,;\\,1[',
    limitePuissance: '0',
  },
  {
    qTex: new FractionEtendue(-2, 3).texFractionSimplifiee,
    qDescription: 'q\\in]-1\\,;\\,1[',
    limitePuissance: '0',
  },
]

function fractionSignee(coefficient: number, denominateur: string): string {
  if (coefficient === 0) return ''
  return `${coefficient > 0 ? '+' : '-'}\\dfrac{${Math.abs(coefficient)}}{${denominateur}}`
}

function genereQuotientPolynomes(nom: string): QuestionGeneree {
  const a = randint(-5, 5, 0)
  const b = randint(-6, 6, 0)
  const c = randint(-8, 8, 0)
  const d = randint(-5, 5, 0)
  const e = randint(-8, 8, 0)
  const numerateur = new Polynome({
    coeffs: [c, 0, 0, b, a],
    letter: 'n',
  }).toString()
  const denominateur = new Polynome({
    coeffs: [e, 0, 0, d],
    letter: 'n',
  }).toString()
  const facteurNumerateur = `${a}${fractionSignee(b, 'n')}${fractionSignee(c, 'n^4')}`
  const facteurDenominateur = `${d}${fractionSignee(e, 'n^3')}`
  const limite = a * d > 0 ? '+\\infty' : '-\\infty'
  const limiteQuotient = new FractionEtendue(a, d).texFractionSimplifiee
  return {
    expression: `\\dfrac{${numerateur}}{${denominateur}}`,
    correction: `$${nom}_n=\\dfrac{${numerateur}}{${denominateur}}$.<br>
    On reconnaît une forme indéterminée du type « $\\dfrac{\\infty}{\\infty}$ ».<br>
    Soit $n\\in\\mathbb{N^{*}}$, on factorise par les termes de plus haut degré :<br>
    $\\begin{aligned}${nom}_n&=\\dfrac{n^4\\left(${facteurNumerateur}\\right)}{n^3\\left(${facteurDenominateur}\\right)}\\\\
    &=n\\times\\dfrac{${facteurNumerateur}}{${facteurDenominateur}}.\\end{aligned}$<br>
    Par somme puis par quotient, $\\displaystyle \\lim_{n\\to+\\infty}\\dfrac{${facteurNumerateur}}{${facteurDenominateur}}=${limiteQuotient}$.<br>
    Par produit, $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limite}`)}$.`,
  }
}

function genereQuotientTrigonometrique(nom: string): QuestionGeneree {
  const a = randint(-6, 6, 0)
  const b = randint(-5, 5, 0)
  const c = randint(1, 5)
  const d = randint(1, 6)
  const absB = Math.abs(b)
  const numerateur = `${rienSi1(a)}n${ecritureAlgebriqueSauf1(b)}\\cos(n)`
  const denominateur = new Polynome({
    coeffs: [d, c],
    letter: 'n',
  }).toString()
  const limite = new FractionEtendue(a, c).texFractionSimplifiee

  return {
    expression: `\\dfrac{${numerateur}}{${denominateur}}`,
    correction: `$${nom}_n=\\dfrac{${numerateur}}{${denominateur}}$.<br>
    Soit $n\\in\\mathbb{N}$, on a :<br>
    $\\begin{aligned}
    -1 &\\leqslant \\cos(n) \\leqslant 1  \\\\
    -${absB} &\\leqslant ${texNombre(b)}\\cos(n) \\leqslant ${absB}  \\\\
    ${a}n - ${absB} &\\leqslant ${numerateur} \\leqslant ${a}n + ${absB}  \\\\
    \\dfrac{${a}n - ${absB}}{${denominateur}} &\\leqslant ${nom}_n \\leqslant \\dfrac{${a}n + ${absB}}{${denominateur}} & & \\text{en divisant par } ${denominateur} > 0
    \\end{aligned}$<br>
    <br>
    De plus, par simplification par le terme de plus haut degré :<br>
    $\\displaystyle \\lim_{n\\to+\\infty} \\dfrac{${a}n - ${absB}}{${denominateur}} = ${limite} \\quad \\text{et} \\quad \\displaystyle \\lim_{n\\to+\\infty} \\dfrac{${a}n + ${absB}}{${denominateur}} = ${limite}$<br>
    <br>
    D'après le théorème des gendarmes, on conclut que :<br>
    $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limite}`)}$.`,
  }
}

function genereTermeAlterne(nom: string): QuestionGeneree {
  const a = randint(-6, 6, 0)
  const b = randint(-7, 7, 0)
  const absB = Math.abs(b)
  const termeAffine = new Polynome({ coeffs: [0, a], letter: 'n' }).toString()
  const expression = `${termeAffine}${ecritureAlgebriqueSauf1(b)}(-1)^n`
  const limite = a > 0 ? '+\\infty' : '-\\infty'
  const suiteComparaison =
    a > 0
      ? new Polynome({ coeffs: [-absB, a], letter: 'n' }).toString()
      : new Polynome({ coeffs: [absB, a], letter: 'n' }).toString()

  const ligneMinMaj =
    a > 0
      ? `${suiteComparaison} &\\leqslant ${nom}_n`
      : `${nom}_n &\\leqslant ${suiteComparaison}`

  return {
    expression,
    correction: `$${nom}_n=${expression}$.<br>
    Soit $n\\in\\mathbb{N}$, on a :<br>
    $\\begin{aligned}
    -1 &\\leqslant (-1)^n \\leqslant 1 \\\\
     -${absB} &\\leqslant ${b}(-1)^n \\leqslant ${absB} \\\\
    ${termeAffine} - ${absB} &\\leqslant ${expression} \\leqslant ${termeAffine} + ${absB} \\\\
    \\text{donc, pour tout entier naturel } n, \\quad ${ligneMinMaj}
    \\end{aligned}$<br>
    <br>
    Comme $\\displaystyle \\lim_{n\\to+\\infty}\\left(${suiteComparaison}\\right)=${limite}$, d'après le théorème de comparaison, $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limite}`)}$.`,
  }
}

function genereQuotientPuissances(nom: string): QuestionGeneree {
  const baseNum = randint(3, 6)
  const choixDenom = [baseNum - 1, baseNum, baseNum + 1].filter(x => x >= 2 && x <= 6)
  const baseDenom = choixDenom[randint(0, choixDenom.length - 1)]

  const a = randint(1, baseNum - 1)
  const b = randint(1, baseDenom - 1)

  let limiteTex = ""
  let explicationLimite = ""

  if (baseNum > baseDenom) {
    limiteTex = "-\\infty"
    explicationLimite = `car \\dfrac{${baseNum}}{${baseDenom}} > 1 \\text{ donc } \\displaystyle \\lim_{n\\to+\\infty}\\left(\\dfrac{${baseNum}}{${baseDenom}}\\right)^n = +\\infty`
  } else if (baseNum < baseDenom) {
    limiteTex = "0"
    explicationLimite = `car 0 \\leqslant \\dfrac{${baseNum}}{${baseDenom}} < 1 \\text{ donc } \\displaystyle \\lim_{n\\to+\\infty}\\left(\\dfrac{${baseNum}}{${baseDenom}}\\right)^n = 0`
  } else {
    limiteTex = "-1"
    explicationLimite = `car \\dfrac{${baseNum}}{${baseNum}} = 1 \\text{ donc } \\left(\\dfrac{${baseNum}}{${baseNum}}\\right)^n = 1`
  }

  return {
    expression: `\\dfrac{${a}^n-${baseNum}^n}{${baseDenom}^n-${b}^n}`,
    correction: `$${nom}_n=\\dfrac{${a}^n-${baseNum}^n}{${baseDenom}^n-${b}^n}$.<br>
    On reconnaît une forme indéterminée du type « $\\dfrac{\\infty}{\\infty}$ ».<br>
    <br>
    Détaillons la factorisation par les termes dominants ($${baseNum}^n$ au numérateur et $${baseDenom}^n$ au dénominateur) :<br>
    $\\begin{aligned}
    ${nom}_n &= \\dfrac{${a}^n - ${baseNum}^n}{${baseDenom}^n - ${b}^n}  \\\\
    &= \\dfrac{${baseNum}^n \\left( \\dfrac{${a}^n}{${baseNum}^n} - \\dfrac{${baseNum}^n}{${baseNum}^n} \\right)}{${baseDenom}^n \\left( \\dfrac{${baseDenom}^n}{${baseDenom}^n} - \\dfrac{${b}^n}{${baseDenom}^n} \\right)}  \\\\
    &= \\dfrac{${baseNum}^n \\left[ \\left(\\dfrac{${a}}{${baseNum}}\\right)^n - 1 \\right]}{${baseDenom}^n \\left[ 1 - \\left(\\dfrac{${b}}{${baseDenom}}\\right)^n \\right]}\\\\
    &= \\left(\\dfrac{${baseNum}}{${baseDenom}}\\right)^n \\times \\dfrac{\\left(\\dfrac{${a}}{${baseNum}}\\right)^n - 1}{1 - \\left(\\dfrac{${b}}{${baseDenom}}\\right)^n} 
    \\end{aligned}$<br>
    <br>
    Étude des limites des différents blocs :<br>
    $\\begin{aligned}
    \\displaystyle \\lim_{n\\to+\\infty} \\left(\\dfrac{${a}}{${baseNum}}\\right)^n &= 0 & & \\text{car } 0 \\leqslant \\dfrac{${a}}{${baseNum}} < 1 \\\
    \\displaystyle \\lim_{n\\to+\\infty} \\left(\\dfrac{${b}}{${baseDenom}}\\right)^n &= 0 & & \\text{car } 0 \\leqslant \\dfrac{${b}}{${baseDenom}} < 1 \\\
    \\displaystyle \\lim_{n\\to+\\infty} \\left(\\dfrac{${baseNum}}{${baseDenom}}\\right)^n &= ${baseNum > baseDenom ? "+\\infty" : baseNum < baseDenom ? "0" : "1"} & & ${explicationLimite}
    \\end{aligned}$<br>
    <br>
    Par produit et par quotient, on en déduit que :<br>
    $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limiteTex}`)}$.`,
  }
}

function genereInverseTrigonometrique(nom: string): QuestionGeneree {
  const a = randint(-6, 6, 0)
  const b = randint(1, 5)
  const encadrementInverse = a > 0
    ? `\\dfrac{${a}}{n + ${b}} \\leqslant ${nom}_n \\leqslant \\dfrac{${a}}{n - ${b}}`
    : `\\dfrac{${a}}{n - ${b}} \\leqslant ${nom}_n \\leqslant \\dfrac{${a}}{n + ${b}}`

  return {
    expression: `\\dfrac{${a}}{n+${b}\\cos(n)}`,
    correction: `$${nom}_n=\\dfrac{${a}}{n+${b}\\cos(n)}$.<br>
    Pour $n>${b}$, on a $n+${b}\\cos(n)\\geqslant n-${b}>0$.<br>
    Soit $n\\in\\mathbb{N}$ avec $n>${b}$, en partant de l'encadrement du cosinus :<br>
    $\\begin{aligned}
    -1 &\\leqslant \\cos(n) \\leqslant 1 \\\\
    -${b} &\\leqslant ${b}\\cos(n) \\leqslant ${b} \\\\
    n - ${b} &\\leqslant n + ${b}\\cos(n) \\leqslant n + ${b} \\\\
    \\dfrac{1}{n + ${b}} &\\leqslant \\dfrac{1}{n + ${b}\\cos(n)} \\leqslant \\dfrac{1}{n - ${b}} & & \\text{en passant à l'inverse} \\\\
    ${encadrementInverse} & & & \\text{en multipliant par } ${a} ${a > 0 ? "(> 0)" : "(< 0)"}
    \\end{aligned}$<br>
    <br>
    Comme $\\displaystyle \\lim_{n\\to+\\infty} \\dfrac{${a}}{n - ${b}} = 0$ et $\\displaystyle \\lim_{n\\to+\\infty} \\dfrac{${a}}{n + ${b}} = 0$, d'après le théorème des gendarmes :<br>
    $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=0`)}$.`,
  }
}

function genereArithmeticoGeometrique(nom: string): QuestionGeneree {
  const expansion = choice([true, false])
  
  let qTex: string
  let qDescription: string
  let limitePuissance: string

  if (expansion) {
    const val = randint(11, 30)
    qTex = `${Math.floor(val / 10)},${val % 10}`
    qDescription = 'q > 1'
    limitePuissance = '+\\infty'
  } else {
    const num = randint(1, 4)
    const den = randint(num + 1, 6)
    const qFraction = new FractionEtendue(num, den)
    qTex = qFraction.texFractionSimplifiee
    qDescription = '0 \\leqslant q < 1'
    limitePuissance = '0'
  }

  const a = randint(-6, 6, 0)
  const b = randint(-5, 5, 0)
  const expression = `${a}${ecritureAlgebriqueSauf1(b)}\\times\\left(${qTex}\\right)^n`
  const limite = expansion ? (b > 0 ? '+\\infty' : '-\\infty') : String(a)
  const comportement = expansion
    ? `Comme $${b}${b > 0 ? '>0' : '<0'}$, $\\displaystyle \\lim_{n\\to+\\infty}${b}\\left(${qTex}\\right)^n=${limite}$.`
    : `$\\displaystyle \\lim_{n\\to+\\infty}${b}\\left(${qTex}\\right)^n=0$.`

  return {
    expression,
    correction: `$${nom}_n=${expression}$.<br>
    On sait que si $${qDescription}$ alors $\\displaystyle \\lim_{n\\to+\\infty}q^n=${limitePuissance}$.<br>
    donc $\\displaystyle \\lim_{n\\to+\\infty}\\left(${qTex}\\right)^n=${limitePuissance}$ et ${comportement}<br>
    Par somme, $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limite}`)}$.`,
  }
}

function genereSommeGeometriqueConvergente(nom: string): QuestionGeneree {
  const denominateur = randint(3, 10)
  const numerateur = randint(1, denominateur - 1)
  const raison = new FractionEtendue(numerateur, denominateur)
    .texFractionSimplifiee
  const coefficient = randint(1, 5)
  const limite = new FractionEtendue(
    coefficient * denominateur,
    denominateur - numerateur,
  ).texFractionSimplifiee
  const expression = `${coefficient === 1 ? '' : `${coefficient}\\times`}\\dfrac{1-\\left(${raison}\\right)^n}{1-${raison}}`
  return {
    expression,
    correction: `$${nom}_n=${expression}$.<br>
    Comme $0<${raison}<1$, $\\displaystyle \\lim_{n\\to+\\infty}\\left(${raison}\\right)^n=0$.<br>
    Par quotient puis par produit, $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limite}`)}$.`,
  }
}

function genereSommeGeometriqueDivergente(nom: string): QuestionGeneree {
  const entierSousRacine = choice([2, 3, 5])
  const coefficient = randint(1, 4)
  const constante = randint(1, 4)
  const expression = `${constante}${coefficient === 1 ? '+' : `+${coefficient}\\times`}\\dfrac{1-\\left(\\sqrt{${entierSousRacine}}\\right)^n}{1-\\sqrt{${entierSousRacine}}}`
  return {
    expression,
    correction: `$${nom}_n=${expression}$.<br>
    Comme $\\sqrt{${entierSousRacine}}>1$, $\\displaystyle \\lim_{n\\to+\\infty}\\left(\\sqrt{${entierSousRacine}}\\right)^n=+\\infty$, donc $\\displaystyle \\lim_{n\\to+\\infty}\\left(1-\\left(\\sqrt{${entierSousRacine}}\\right)^n\\right)=-\\infty$.<br>
    Comme $1-\\sqrt{${entierSousRacine}}<0$, par quotient, produit puis somme, $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=+\\infty`)}$.`,
  }
}

function genereCombinaisonGeometrique(nom: string): QuestionGeneree {
  const denominateur = randint(3, 10)
  const numerateur = randint(1, denominateur - 1)
  const raison = new FractionEtendue(numerateur, denominateur)
    .texFractionSimplifiee
  const coefficientGeometrique = randint(-5, -1)
  const denominateur2 = randint(3, 10)
  const numerateur2 = randint(1, denominateur2 - 1)
  const raison2 = new FractionEtendue(numerateur2, denominateur2)
    .texFractionSimplifiee
  const coefficientSomme = randint(1, 5)
  
  const denominateurSoustraction = new FractionEtendue(
    denominateur - numerateur,
    denominateur,
  ).texFractionSimplifiee

  const limite = new FractionEtendue(
    coefficientSomme * denominateur,
    denominateur - numerateur,
  ).texFractionSimplifiee
  const expression = `${coefficientGeometrique}\\times\\left(${raison2}\\right)^n+${coefficientSomme === 1 ? '' : `${coefficientSomme}\\times`}\\dfrac{1-\\left(${raison}\\right)^n}{1-${raison}}`
  
  const etapeCoefficient = coefficientSomme === 1 
    ? '' 
    : `<br>$\\begin{aligned}\\displaystyle \\lim_{n\\to+\\infty} ${coefficientSomme}\\times\\dfrac{1-\\left(${raison}\\right)^n}{1-${raison}} &= ${coefficientSomme} \\times \\dfrac{1}{${denominateurSoustraction}} \\\\ &= ${limite}\\end{aligned}$<br>`

  return {
    expression,
    correction: `$${nom}_n=${expression}$.<br>
    Étudions la limite de chaque terme séparément :<br>
    <br>
    <b>1. Premier terme :</b><br>
    $\\begin{aligned}
    \\displaystyle \\lim_{n\\to+\\infty} \\left(${raison2}\\right)^n &= 0 & & \\text{car } 0 < ${raison2} < 1 \\\
    \\displaystyle \\lim_{n\\to+\\infty} ${coefficientGeometrique}\\times\\left(${raison2}\\right)^n &= 0 & & \\text{par produit}
    \\end{aligned}$<br>
    <br>
    <b>2. Second terme (somme géométrique) :</b><br>
    $\\begin{aligned}
    1 - ${raison} &= ${denominateurSoustraction} \\\
    \\displaystyle \\lim_{n\\to+\\infty} \\left(${raison}\\right)^n &= 0 & & \\text{car } 0 < ${raison} < 1 \\\
    \\displaystyle \\lim_{n\\to+\\infty} \\left(1 - \\left(${raison}\\right)^n\\right) &= 1 - 0 = 1 & & \\text{par somme} \\\
    \\displaystyle \\lim_{n\\to+\\infty} \\dfrac{1-\\left(${raison}\\right)^n}{1-${raison}} &= \\dfrac{1}{${denominateurSoustraction}} & & \\text{par quotient}
    \\end{aligned}$<br>
    ${etapeCoefficient}
    <br>
    <b>Conclusion par addition des limites :</b><br>
    $${miseEnEvidence(`\\displaystyle \\lim_{n\\to+\\infty}${nom}_n=${limite}`)}$.`,
  }
}

const exercicesDisponibles: GenerateurQuestion[] = [
  genereQuotientPolynomes,
  genereQuotientTrigonometrique,
  genereTermeAlterne,
  genereQuotientPuissances,
  genereInverseTrigonometrique,
  genereArithmeticoGeometrique,
  genereSommeGeometriqueConvergente,
  genereSommeGeometriqueDivergente,
  genereCombinaisonGeometrique,
]

/** @author Stéphane Guyon */
export default class LimitesDeSuites extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 5
    this.nbQuestionsModifiable = true
    this.nbCols = 2
    this.nbColsCorr = 1
  }

  nouvelleVersion(): void {
    this.listeQuestions = []
    this.listeCorrections = []
    const noms = ['u', 'v', 'w', 'x', 'y', 'z', 'a', 'b', 'c', 'd']
    const nbQuestions = Math.min(this.nbQuestions, exercicesDisponibles.length)
    const generateursChoisis = shuffle(exercicesDisponibles).slice(
      0,
      nbQuestions,
    )
    this.consigne =
      nbQuestions > 1
        ? 'Déterminer les limites des suites suivantes lorsque $n$ tend vers $+\\infty$.'
        : 'Déterminer la limite de la suite suivante lorsque $n$ tend vers $+\\infty$.'

    for (const [i, generateur] of generateursChoisis.entries()) {
      const question = generateur(noms[i])
      this.listeQuestions[i] = `$${noms[i]}_n=${question.expression}$`
      this.listeCorrections[i] = question.correction
    }
    listeQuestionsToContenu(this)
  }
}
