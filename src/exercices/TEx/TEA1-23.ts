import { tableauColonneLigne } from '../../lib/2d/tableau'
import { reduireAxPlusB } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Déterminer le quotient et le reste d’une division euclidienne selon un entier naturel'
export const dateDePublication = '07/10/2026'
export const uuid = 'ed53c'

export const refs = {
  'fr-fr': ['TEA1-23'],
  'fr-ch': [],
}

/** @author Stéphane Guyon */
export default class DivisionEuclidienneSelonEntier extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion(): void {
    const divisorCoefficient = randint(3, 6)
    const divisorConstant = randint(1, 3)
    const quotient = randint(2, 3)
    const remainderCoefficient = randint(1, divisorCoefficient - 1)
    const difference = divisorCoefficient - remainderCoefficient
    // Cette constante garantit que le reste convient exactement pour n > 1.
    const remainderConstant = divisorConstant + difference
    const dividendCoefficient =
      quotient * divisorCoefficient + remainderCoefficient
    const dividendConstant = quotient * divisorConstant + remainderConstant
    const divisor = reduireAxPlusB(divisorCoefficient, divisorConstant, 'n')
    const dividend = reduireAxPlusB(dividendCoefficient, dividendConstant, 'n')
    const remainder = reduireAxPlusB(
      remainderCoefficient,
      remainderConstant,
      'n',
    )
    const quotientAtZero = Math.floor(dividendConstant / divisorConstant)
    const remainderAtZero = dividendConstant % divisorConstant
    const dividendAtOne = dividendCoefficient + dividendConstant
    const divisorAtOne = divisorCoefficient + divisorConstant
    const quotientAtOne = quotient + 1
    const tableauCasParticuliers = tableauColonneLigne(
      [
        'n',
        `\\text{Dividende }${dividend}`,
        `\\text{Diviseur }${divisor}`,
        '\\text{Reste}',
      ],
      ['0', '1'],
      [
        `${dividendConstant}`,
        `${divisorConstant}`,
        miseEnEvidence(remainderAtZero),
        `${dividendAtOne}`,
        `${divisorAtOne}`,
        miseEnEvidence('0'),
      ],
      1.5,
      true,
    )

    this.listeQuestions[0] = `Soit $n$ un entier naturel. Déterminer, selon les valeurs de $n$, le quotient et le reste de la division euclidienne de $${dividend}$ par $${divisor}$.`

    this.listeCorrections[0] = `Soit $n\\in \\mathbb{N}$. <br>
    L'écriture de la division euclidienne est unique : Il existe un unique couple d'entiers naturels $(q,r)$ vérifiant $${dividend}=q(${divisor})+r$ et $0\\leqslant r<${divisor}$.<br>
    Si $q=${quotient}$, $${quotient}(${divisor})=${reduireAxPlusB(quotient * divisorCoefficient, quotient * divisorConstant, 'n')}$.<br>
    Si $q=${quotient + 1}$, $${quotient + 1}(${divisor})=${reduireAxPlusB((quotient + 1) * divisorCoefficient, (quotient + 1) * divisorConstant, 'n')}$.<br>
    On prend $q=${quotient}$. <br>
    $${dividend}=${quotient}(${divisor})+(${remainder})$.<br>
    Cette égalité traduit la division euclidienne de $${dividend}$ par $${divisor}$ si et seulement si $0\\leqslant ${remainder}<${divisor}$.<br>
    Comme $n$ est un entier naturel, $${remainder}$ est toujours positif. La condition équivaut donc à :<br>
    $${remainder}\\lt ${divisor}\\iff ${difference}\\lt ${reduireAxPlusB(difference, 0, 'n')}\\iff n>1$.<br>
    Ainsi, pour $n\\geqslant2$, on obtient bien la division euclidienne, avec $${miseEnEvidence(`q=${quotient}`)}$ et $${miseEnEvidence(`r=${remainder}`)}$.<br>
    Il reste à examiner séparément les cas $n=0$ et $n=1$, pour lesquels cette condition n'est pas vérifiée.<br><br>
    ${tableauCasParticuliers}<br>
    Pour $n=0$, $${dividendConstant}=${quotientAtZero}\\times${divisorConstant}+${remainderAtZero}$, donc $${miseEnEvidence(`q=${quotientAtZero}`)}$.<br>
    Pour $n=1$, $${dividendAtOne}=${quotientAtOne}\\times${divisorAtOne}+0$, donc $${miseEnEvidence(`q=${quotientAtOne}`)}$.`

    listeQuestionsToContenu(this)
  }
}
