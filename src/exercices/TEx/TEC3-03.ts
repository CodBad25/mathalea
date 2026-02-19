import Exercice from '../Exercice'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { randint } from '../../modules/outils'
import { rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'

export const titre =
  'Utiliser $\\cos(\\theta+\\theta^\\prime)=\\cos(\\theta)\\cos(\\theta^\\prime)-\\sin(\\theta)\\sin(\\theta^\\prime)$'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '91bbd'
export const refs = {
  'fr-fr': ['TEC3-03'],
  'fr-ch': [],
}
export const dateDePublication = '18/08/2024'
// Les triplets a, b, A utilisés dans g(t)=acos(wt)+bsin(wt)=A.cos(wt+phi)
const listePourPiSur6 = [
  { a: '\\sqrt{3}', b: '1', A: '2' },
  { a: '1', b: '\\dfrac{\\sqrt{3}}{3}', A: '2\\dfrac{\\sqrt{3}}{3}' },
  { a: '3', b: '\\sqrt{3}', A: '2\\sqrt{3}' },
  { a: '\\sqrt{6}', b: '\\sqrt{2}', A: '2\\sqrt{2}' },
  { a: '\\sqrt{15}', b: '\\sqrt{5}', A: '2\\sqrt{5}' },
].map((el) =>
  Object.assign(el, {
    aSurA: '\\dfrac{\\sqrt{3}}{2}',
    moinsBSurA: '-\\dfrac{1}{2}',
    phi: '\\dfrac{\\pi}{6}',
  }),
)
const listePourPiSur4 = [
  { a: '\\sqrt{2}', b: '\\sqrt{2}', A: '2' },
  { a: '1', b: '1', A: '\\sqrt{2}' },
  { a: '2', b: '2', A: '2\\sqrt{2}' },
  { a: '\\sqrt{3}', b: '\\sqrt{3}', A: '\\sqrt{6}' },
  { a: '3', b: '3', A: '3\\sqrt{2}' },
].map((el) =>
  Object.assign(el, {
    aSurA: '\\dfrac{\\sqrt{2}}{2}',
    moinsBSurA: '-\\dfrac{\\sqrt{2}}{2}',
    phi: '\\dfrac{\\pi}{4}',
  }),
)
const listePourPiSur3 = [
  { a: '1', b: '\\sqrt{3}', A: '2' },
  { a: '\\sqrt{3}', b: '3', A: '2\\sqrt{3}' },
  { a: '\\sqrt{2}', b: '\\sqrt{6}', A: '2\\sqrt{2}' },
  { a: '\\sqrt{5}', b: '\\sqrt{15}', A: '2\\sqrt{5}' },
  { a: '\\dfrac{\\sqrt{3}}{3}', b: '1', A: '2\\dfrac{\\sqrt{3}}{3}' },
].map((el) =>
  Object.assign(el, {
    aSurA: '\\dfrac{1}{2}',
    moinsBSurA: '-\\dfrac{\\sqrt{3}}{2}',
    phi: '\\dfrac{\\pi}{3}',
  }),
)
const listePour3PiSur4 = listePourPiSur4.map((el) =>
  Object.assign(
    {},
    {
      a: `-${el.a}`,
      b: el.b,
      A: el.A,
      aSurA: `-${el.aSurA}`,
      moinsBSurA: el.moinsBSurA,
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
      A: el.A,
      aSurA: `-${el.aSurA}`,
      moinsBSurA: el.moinsBSurA,
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
      A: el.A,
      aSurA: `-${el.aSurA}`,
      moinsBSurA: el.moinsBSurA,
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
      A: el.A,
      aSurA: el.aSurA,
      moinsBSurA: `-(${el.moinsBSurA})`,
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
      A: el.A,
      aSurA: el.aSurA,
      moinsBSurA: `-(${el.moinsBSurA})`,
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
      A: el.A,
      aSurA: el.aSurA,
      moinsBSurA: `-(${el.moinsBSurA})`,
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
      A: el.A,
      aSurA: el.aSurA,
      moinsBSurA: `-(${el.moinsBSurA})`,
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
      A: el.A,
      aSurA: el.aSurA,
      moinsBSurA: `-(${el.moinsBSurA})`,
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
      A: el.A,
      aSurA: el.aSurA,
      moinsBSurA: `-(${el.moinsBSurA})`,
      phi: '-\\dfrac{2\\pi}{3}',
    },
  ),
)

/**
 * Transformer acos(wt)+bsin(wt) en A.cos(wt+phi)
 * @author Jean-Claude Lhote
 */

export default class AcosOmegaTPlusBSinOmegaT extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 5
    this.spacingCorr = 3
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

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 100; ) {
      const { a, b, A, aSurA, moinsBSurA, phi } = listeDeValeurs[i]
      const w = randint(1, 5) * choice([-1, 1])
      const moinsB =
        b === '1'
          ? '-'
          : b === '-1'
            ? '+'
            : b.startsWith('-')
              ? `+${b.substring(1)}`
              : `-${b}`
      let texte = `Soit la fonction $f(t)=${a === '1' ? '' : a === '-1' ? '-' : a}\\cos(${rienSi1(w)}t)${moinsB}\\sin(${rienSi1(w)}t)$.<br>`
      texte += `Exprimer $f(t)$ sous la forme $Acos(${rienSi1(w)}t+\\phi)$.`
      let texteCorr = `Nous devons exprimer la fonction $f(t)=${a === '1' ? '' : a === '-1' ? '-' : a}\\cos(${rienSi1(w)}t)${moinsB}\\sin(${rienSi1(w)}t)$ sous la forme $Acos(${rienSi1(w)}t+\\phi)$.<br>`
      texteCorr +=
        'Nous allons utiliser la formule $\\cos(\\theta+\\theta^\\prime)=\\cos(\\theta)\\cos(\\theta^\\prime)-\\sin(\\theta)\\sin(\\theta^\\prime)$ :<br>'
      texteCorr += `Posons $f(t)=a\\cos(${rienSi1(w)}t)-b\\sin(${rienSi1(w)}t)$ : soit, $a=${a}$ et $b=${b}$.<br>`
      texteCorr += `Calculons $A=\\sqrt{a^2+b^2}=\\sqrt{${a.startsWith('-') ? `(${a})` : a}^2+${b.startsWith('-') ? `(${b})` : b}^2}=${A}$.<br>`
      texteCorr += `Ainsi, $\\dfrac{a}{A}=\\dfrac{${a}}{${A}}${aSurA.includes(`{${A}}`) ? '' : `=${aSurA}`}$ et $-\\dfrac{b}{A}=-\\dfrac{${b}}{${A}}${moinsBSurA.includes(`${A}`) ? '' : `=${moinsBSurA}`}$.<br>`
      texteCorr += `D'où, $\\dfrac{f(t)}{${A}}=${aSurA}\\cos(${rienSi1(w)}t)${moinsBSurA}\\sin(${rienSi1(w)}t)$.<br>`
      texteCorr += `On reconnait ici : $\\cos(${phi})=${aSurA}$ et $\\sin(${phi})=${moinsBSurA.startsWith('-(') ? moinsBSurA.substring(2, moinsBSurA.length - 1) : moinsBSurA.substring(1)}$.<br>`
      texteCorr += `On a donc bien une expression de la forme $Acos(${rienSi1(w)}t+\\phi)$ avec $\\phi=${phi}$.<br>`

      const value = `${A}\\cos(${rienSi1(w)}t${phi.startsWith('-') ? phi : `+${phi}`})`
      texteCorr += `Donc, $f(t)=${miseEnEvidence(value)}$.`

      if (this.questionJamaisPosee(i, a, b, w)) {
        this.listeQuestions[i] =
          texte +
          ajouteChampTexteMathLive(this, i, `  ${KeyboardType.grecTrigo}`, {
            texteAvant: '<br>$f(t)=$',
          })

        this.listeCorrections[i] = texteCorr
        handleAnswers(this, i, { reponse: { value } })
        i++
      }
      cpt++
    }
  }
}
