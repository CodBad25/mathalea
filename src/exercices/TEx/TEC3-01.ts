import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { gestionnaireFormulaireTexte } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Travailler sur différentes écritures d'un nombre complexe"
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '9c8d5'
export const refs = {
  'fr-fr': ['TEC3-01'],
  'fr-ch': [],
}
export const dateDePublication = '20/08/2024'
// Les valeurs particulières des cosinus et des sinus

const listePourPiSur6 = [
  { a: '\\sqrt{3}', b: '1', a2: '\\sqrt{3}^2', b2: '1^2', A: '2' },
  { a: '2\\sqrt{3}', b: '2', a2: '(2\\sqrt{3})^2', b2: '2^2', A: '4' },
  { a: '3\\sqrt{3}', b: '3', a2: '(3\\sqrt{3})^2', b2: '3^2', A: '6' },
  {
    a: '1',
    b: '\\dfrac{\\sqrt{3}}{3}',
    a2: '1^2',
    b2: '\\left(\\dfrac{\\sqrt{3}}{3}\\right)^2',
    A: '2\\dfrac{\\sqrt{3}}{3}',
  },
  {
    a: '2',
    b: '\\dfrac{2\\sqrt{3}}{3}',
    a2: '2^2',
    b2: '\\left(2\\dfrac{\\sqrt{3}}{3}\\right)^2',
    A: '4\\dfrac{\\sqrt{3}}{3}',
  },
  { a: '3', b: '\\sqrt{3}', a2: '3^2', b2: '\\sqrt{3}^2', A: '2\\sqrt{3}' },
  {
    a: '\\sqrt{6}',
    b: '\\sqrt{2}',
    a2: '\\sqrt{6}^2',
    b2: '\\sqrt{2}^2',
    A: '2\\sqrt{2}',
  },
  {
    a: '\\sqrt{15}',
    b: '\\sqrt{5}',
    a2: '\\sqrt{15}^2',
    b2: '\\sqrt{15}^2',
    A: '2\\sqrt{5}',
  },
].map((el) =>
  Object.assign(el, {
    aSurA: '\\dfrac{\\sqrt{3}}{2}',
    bSurA: '\\dfrac{1}{2}',
    phi: '\\dfrac{\\pi}{6}',
  }),
)
const listePourPiSur4 = [
  {
    a: '\\sqrt{2}',
    b: '\\sqrt{2}',
    a2: '\\sqrt{2}^2',
    b2: '\\sqrt{2}^2',
    A: '2',
  },
  { a: '1', b: '1', a2: '1^2', b2: '1^2', A: '\\sqrt{2}' },
  { a: '2', b: '2', a2: '2^2', b2: '2^2', A: '2\\sqrt{2}' },
  {
    a: '\\sqrt{3}',
    b: '\\sqrt{3}',
    a2: '\\sqrt{3}^2',
    b2: '\\sqrt{3}^2',
    A: '\\sqrt{6}',
  },
  { a: '3', b: '3', a2: '3^2', b2: '3^2', A: '3\\sqrt{2}' },
  { a: '5', b: '5', a2: '5^2', b2: '5^2', A: '5\\sqrt{2}' },
  {
    a: '\\sqrt{6}',
    b: '\\sqrt{6}',
    a2: '\\sqrt{6}^2',
    b2: '\\sqrt{6}^2',
    A: '2\\sqrt{3}',
  },
  {
    a: '\\sqrt{5}',
    b: '\\sqrt{5}',
    a2: '\\sqrt{5}^2',
    b2: '\\sqrt{5}^2',
    A: '\\sqrt{10}',
  },
  { a: '6', b: '6', a2: '6^2', b2: '6^2', A: '6\\sqrt{2}' },
].map((el) =>
  Object.assign(el, {
    aSurA: '\\dfrac{\\sqrt{2}}{2}',
    bSurA: '\\dfrac{\\sqrt{2}}{2}',
    phi: '\\dfrac{\\pi}{4}',
  }),
)
const listePourPiSur3 = [
  { a: '1', b: '\\sqrt{3}', a2: '1^2', b2: '\\sqrt{3}^2', A: '2' },
  { a: '2', b: '2\\sqrt{3}', a2: '2^2', b2: '(2\\sqrt{3})^2', A: '4' },
  { a: '3', b: '3\\sqrt{3}', a2: '3^2', b2: '(3\\sqrt{3})^2', A: '6' },
  { a: '\\sqrt{3}', b: '3', a2: '\\sqrt{3}^2', b2: '3^2', A: '2\\sqrt{3}' },
  { a: '2\\sqrt{3}', b: '6', a2: '(2\\sqrt{3})^2', b2: '6^2', A: '4\\sqrt{3}' },
  { a: '3\\sqrt{3}', b: '9', a2: '(3\\sqrt{3})^2', b2: '9^2', A: '6\\sqrt{3}' },
  {
    a: '\\sqrt{2}',
    b: '\\sqrt{6}',
    a2: 'sqrt{2}^2',
    b2: '\\sqrt{6}^2',
    A: '2\\sqrt{2}',
  },
  {
    a: '\\sqrt{5}',
    b: '\\sqrt{15}',
    a2: '\\sqrt{5}^2',
    b2: '\\sqrt{15}^2',
    A: '2\\sqrt{5}',
  },
  {
    a: '\\dfrac{\\sqrt{3}}{3}',
    b: '1',
    a2: '\\left(\\dfrac{\\sqrt{3}}{3}\\right)^2',
    b2: '1^2',
    A: '2\\dfrac{\\sqrt{3}}{3}',
  },
  {
    a: '2\\dfrac{\\sqrt{3}}{3}',
    b: '2',
    a2: '\\left(2\\dfrac{\\sqrt{3}}{3}\\right)^2',
    b2: '2^2',
    A: '4\\dfrac{\\sqrt{3}}{3}',
  },
].map((el) =>
  Object.assign(el, {
    aSurA: '\\dfrac{1}{2}',
    bSurA: '\\dfrac{\\sqrt{3}}{2}',
    phi: '\\dfrac{\\pi}{3}',
  }),
)
const listePour3PiSur4 = listePourPiSur4.map((el) =>
  Object.assign(
    {},
    {
      a: `-${el.a}`,
      a2: el.a2,
      b2: el.b2,
      b: el.b,
      A: el.A,
      aSurA: `-${el.aSurA}`,
      bSurA: el.bSurA,
      phi: '\\dfrac{3\\pi}{4}',
    },
  ),
)
const listePour5PiSur6 = listePourPiSur6.map((el) =>
  Object.assign(
    {},
    {
      a: `-${el.a}`,
      b: el.b,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: `-${el.aSurA}`,
      bSurA: el.bSurA,
      phi: '\\dfrac{5\\pi}{6}',
    },
  ),
)
const listePour2PiSur3 = listePourPiSur3.map((el) =>
  Object.assign(
    {},
    {
      a: `-${el.a}`,
      b: el.b,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: `-${el.aSurA}`,
      bSurA: el.bSurA,
      phi: '\\dfrac{2\\pi}{3}',
    },
  ),
)
const listePourMoinsPiSur4 = listePourPiSur4.map((el) =>
  Object.assign(
    {},
    {
      a: el.a,
      b: `-${el.b}`,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: el.aSurA,
      bSurA: `-${el.bSurA}`,
      phi: '-\\dfrac{\\pi}{4}',
    },
  ),
)
const listePourMoinsPiSur6 = listePourPiSur6.map((el) =>
  Object.assign(
    {},
    {
      a: el.a,
      b: `-${el.b}`,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: el.aSurA,
      bSurA: `-${el.bSurA}`,
      phi: '-\\dfrac{\\pi}{6}',
    },
  ),
)
const listePourMoinsPiSur3 = listePourPiSur3.map((el) =>
  Object.assign(
    {},
    {
      a: el.a,
      b: `-${el.b}`,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: el.aSurA,
      bSurA: `-${el.bSurA}`,
      phi: '-\\dfrac{\\pi}{3}',
    },
  ),
)
const listePourMoins3PiSur4 = listePour3PiSur4.map((el) =>
  Object.assign(
    {},
    {
      a: el.a,
      b: `-${el.b}`,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: el.aSurA,
      bSurA: `-${el.bSurA}`,
      phi: '-\\dfrac{3\\pi}{4}',
    },
  ),
)
const listePourMoins5PiSur6 = listePour5PiSur6.map((el) =>
  Object.assign(
    {},
    {
      a: el.a,
      b: `-${el.b}`,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: el.aSurA,
      bSurA: `-${el.bSurA}`,
      phi: '-\\dfrac{5\\pi}{6}',
    },
  ),
)
const listePourMoins2PiSur3 = listePour2PiSur3.map((el) =>
  Object.assign(
    {},
    {
      a: el.a,
      b: `-${el.b}`,
      a2: el.a2,
      b2: el.b2,
      A: el.A,
      aSurA: el.aSurA,
      bSurA: `-${el.bSurA}`,
      phi: '-\\dfrac{2\\pi}{3}',
    },
  ),
)

/**
 * Écrire un complexe sous différentes formes
 * @author Jean-Claude Lhote
 */

export default class AcosOmegaTPlusBSinOmegaT extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
    this.spacingCorr = 3
    this.sup = '1'
    this.besoinFormulaireTexte = [
      'Type de questions',
      ' Nombres séparés par des tirets :\n1 : algébrique vers trigonométrique\n2 : trigonométrique vers algébrique\n3 : algébrique vers $ke^{i\\theta}$\n4 : $ke^{i\\theta}$ vers algébrique\n5 : Mélange',
    ]
  }

  nouvelleVersion() {
    const listeDeValeurs = combinaisonListes(
      [
        ...listePourPiSur3,
        ...listePourPiSur4,
        ...listePourPiSur6,
        ...listePour2PiSur3,
        ...listePour3PiSur4,
        ...listePour5PiSur6,
        ...listePourMoinsPiSur3,
        ...listePourMoinsPiSur4,
        ...listePourMoinsPiSur6,
        ...listePourMoins2PiSur3,
        ...listePourMoins3PiSur4,
        ...listePourMoins5PiSur6,
      ],
      this.nbQuestions,
    )

    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      nbQuestions: this.nbQuestions,
      min: 1,
      max: 4,
      defaut: 5,
      melange: 5,
    })
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 100; ) {
      const { a, b, a2, b2, A, aSurA, bSurA, phi } = listeDeValeurs[i]
      let texte = 'Soit le nombre complexe '
      let texteCorr: string
      let value: string

      switch (Number(listeTypeDeQuestions[i])) {
        case 1: // algébrique vers trigo
          texte += `$z=${a}${b === '1' ? '+' : b === '-1' ? '-' : b.startsWith('-') ? b : `+${b}`}\\mathrm{i}$.<br>`
          texte += "Donner l'écriture trigonométrique de $z$."
          texteCorr = `$z=${a}${b === '1' ? '+' : b === '-1' ? '-' : b.startsWith('-') ? b : `+${b}`}\\mathrm{i}$ est de la forme $a+b\\mathrm{i}$ avec $a=${a}$ et $b=${b}$.<br>`
          texteCorr += `Calculons le module de $z$ : $|z|=\\sqrt{${a2}+${b2}}=${A}$.<br>`
          texteCorr += `Factorisons $|z|$ : $z=${A}\\left(${aSurA}${bSurA.startsWith('-') ? `${bSurA}` : `+${bSurA}`}\\mathrm{i}\\right)$.<br>`
          texteCorr += `Nous reconnaissons ici :<br>d'une part $\\cos(${phi})=${aSurA}$<br>d'autre part $\\sin(${phi})=${bSurA}$.<br>`
          value = `${A}\\left(\\cos(${phi})+\\mathrm{i}\\sin(${phi})\\right)`
          break
        case 2: // trigo vers algébrique
          texte += `$z=${A}\\left(\\cos(${phi})+\\mathrm{i}\\sin(${phi})\\right)$.<br>`
          texte += "Donner l'écriture algébrique de $z$"
          texteCorr = `Nous savons que $\\cos(${phi})=${aSurA}$ et $\\sin(${phi})=${bSurA}$, donc en substituant dans l'expression de $z$, nous obtenons :<br>`
          texteCorr += `$z=${A}\\left(${aSurA}${bSurA.startsWith('-') ? `${bSurA}` : `+${bSurA}`}\\mathrm{i}\\right)$.<br>`
          texteCorr += `En développant : $z=${A}\\times ${aSurA.startsWith('-') ? `\\left(${aSurA}\\right)` : aSurA}${bSurA.startsWith('-') ? `-${A}\\times ${bSurA.substring(1)}` : `+${A}\\times ${bSurA}`}\\mathrm{i}$.<br>`
          value = `${a}${b.startsWith('-') ? `${b}` : `+${b}`}\\mathrm{i}`

          break
        case 3:
          texte += `$z=${a}${b === '1' ? '+' : b === '-1' ? '-' : b.startsWith('-') ? b : `+${b}`}\\mathrm{i}$.<br>`
          texte += "Donner l'écriture de $z$ sous la forme $ke^{i\\theta}$."
          texteCorr = `$z=${a}${b === '1' ? '+' : b === '-1' ? '-' : b.startsWith('-') ? b : `+${b}`}\\mathrm{i}$ est de la forme $a+b\\mathrm{i}$ avec $a=${a}$ et $b=${b}$.<br>`
          texteCorr += `Calculons le module de $z$ : $|z|=\\sqrt{${a2}+${b2}}=${A}$.<br>`
          texteCorr += `Factorisons $|z|$ : $z=${A}\\left(${aSurA}${bSurA.startsWith('-') ? `${bSurA}` : `+${bSurA}`}\\mathrm{i}\\right)$.<br>`
          texteCorr += `Nous reconnaissons ici :<br>d'une part $\\cos(${phi})=${aSurA}$<br>d'autre part $\\sin(${phi})=${bSurA}$.<br>`
          value = `${A}e^{${phi.replace('\\dfrac', '\\mathrm{i}\\frac')}}`

          break
        default: // k.e^{i\\theta} vers écriture algébrique
          texte += `$z=${A}e^{${phi.replace('\\dfrac', '\\mathrm{i}\\frac')}}$.<br>`
          texte += "Donner l'écriture algébrique de $z$."
          texteCorr = `Nous savons que $e^{${phi.replace('\\dfrac', '\\mathrm{i}\\frac')}}=\\cos(${phi})+\\mathrm{i}\\sin(${phi})=${aSurA}${bSurA.startsWith('-') ? `${bSurA}` : `+${bSurA}`}\\mathrm{i}$.<br>`
          texteCorr += `Donc $z=${A}\\left(${aSurA}${bSurA.startsWith('-') ? `${bSurA}` : `+${bSurA}`}\\mathrm{i}\\right)$.<br>`
          texteCorr += `Developpons : $z=${A}\\times ${aSurA.startsWith('-') ? `\\left(${aSurA}\\right)` : aSurA}${bSurA.startsWith('-') ? `-${A}\\times ${bSurA.substring(1)}` : `+${A}\\times ${bSurA}`}\\mathrm{i}$.<br>`
          value = `${a}${b.startsWith('-') ? `${b}` : `+${b}`}\\mathrm{i}`
      }
      texteCorr += `Par conséquent, $z=${miseEnEvidence(value)}$.`

      if (this.questionJamaisPosee(i, a, b)) {
        this.listeQuestions[i] =
          texte +
          ajouteChampTexteMathLive(this, i, KeyboardType.complexes, {
            texteAvant: '<br>$z=$',
          })

        this.listeCorrections[i] = texteCorr
        handleAnswers(this, i, {
          reponse: { value, options: { calculFormel: true } },
        })
        i++
      }
      cpt++
    }
  }
}
