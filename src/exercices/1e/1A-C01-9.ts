import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Déduire une comparaison du signe d'une différence"
export const dateDePublication = '17/07/2026'
export const uuid = '8541f'

export const refs = {
  'fr-fr': ['1A-C01-9', '2A-N1-9'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

type Signe = '>' | '<' | '\\geqslant' | '\\leqslant'

/**
 * Déduire une comparaison de deux réels à partir du signe de leur différence.
 * @author Stéphane Guyon
 */
export default class ComparerAvecLeSigneDUneDifference extends ExerciceQcmA {
  private appliquerLesValeurs(
    premier: string,
    second: string,
    signe: Signe,
    zeroAGauche: boolean,
  ): void {
    const comparaison = `${premier} ${signe} ${second}`
    const sensSuperieur = signe === '>' || signe === '\\geqslant'
    const signeStrictInverse = sensSuperieur ? '>' : '<'
    const signeLargeInverse = sensSuperieur ? '\\leqslant' : '\\geqslant'
    const signeInverse: Signe =
      signe === '>'
        ? '<'
        : signe === '<'
          ? '>'
          : signe === '\\geqslant'
            ? '\\leqslant'
            : '\\geqslant'
    const inegalite = zeroAGauche
      ? `0 ${signeInverse} ${premier}-${second}`
      : `${premier}-${second} ${signe} 0`
    const calcul = zeroAGauche
      ? `0+${second} ${signeInverse} ${premier}-${second}+${second}`
      : `${premier}-${second}+${second} ${signe} 0+${second}`

    this.enonce = `$${premier}$ et $${second}$ sont des réels.<br>
      On sait que $${inegalite}$. On peut en déduire que :`

    this.reponses = [
      `$${comparaison}$`,
      `$${premier} = ${second}$`,
      `$${second} ${signeStrictInverse} ${premier}$`,
      `$${premier} ${signeLargeInverse} ${second}$`,
    ]

    this.correction = `On ajoute $${second}$ aux deux membres de l'inégalité, ce qui ne change pas son sens :<br>
      $${calcul}$,<br>
      donc $${miseEnEvidence(comparaison)}$.`
  }

  versionAleatoire = (): void => {
    const [lettre1, lettre2] = choice([
      ['x', 'y'],
      ['a', 'b'],
      ['u', 'v'],
      ['m', 'n'],
    ] as const)
    const [premier, second] = choice([
      [lettre1, lettre2],
      [lettre2, lettre1],
    ] as const)
    const signe = choice([
      '>',
      '<',
      '\\geqslant',
      '\\leqslant',
    ] as const)
    this.appliquerLesValeurs(premier, second, signe, choice([true, false]))
  }

  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.options = { vertical: false, ordered: false }
    this.tip = `
      <p style="margin: 0;">
        On peut ajouter un même nombre aux deux membres d'une inégalité sans changer son sens.
      </p>
    `
    this.versionAleatoire()
  }
}
