import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
export const titre =
  'Multiplications de deux entiers relatifs dans un tableau à double entrée'

/**
 * Effectuer des multiplications de relatifs dans un tableau à double entrée
 *
 * @author Rémi Angot
 * 4C10-5
 */
export const uuid = 'c8f4b'

export const refs = {
  'fr-fr': ['4C10-5'],
  'fr-ch': ['9NO2C-7'],
}
export default class ExerciceTableauMultiplicationsRelatifs extends Exercice {
  constructor() {
    super()

    this.sup = false

    this.consigne = 'Calculer.'

    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    const listeSignes1 = combinaisonListes([-1, 1], 4)
    let a1 = randint(2, 9)
    let a2 = randint(2, 9, a1)
    let a3 = randint(2, 9, [a1, a2])
    let a4 = randint(2, 9, [a1, a2, a3])
    let b1 = randint(2, 9)
    let b2 = randint(2, 9, b1)
    let b3 = randint(2, 9, [b1, b2])
    let b4 = randint(2, 9, [b1, b2, b3])
    a1 *= listeSignes1[0]
    a2 *= listeSignes1[1]
    a3 *= listeSignes1[2]
    a4 *= listeSignes1[3]
    b1 *= listeSignes1[0]
    b2 *= listeSignes1[1]
    b3 *= listeSignes1[2]
    b4 *= listeSignes1[3]

    const texte = `$\\def\\arraystretch{1.5}\\begin{array}{|c|c|c|c|c|}
    \\hline
    \\times & ${ecritureAlgebrique(a1)} & ${ecritureAlgebrique(a2)} & ${ecritureAlgebrique(a3)} & ${ecritureAlgebrique(a4)} \\\\
    \\hline
    ${ecritureAlgebrique(b1)} &  &  & &  \\\\
    \\hline
    ${ecritureAlgebrique(b2)} & & & & \\\\
    \\hline
    ${ecritureAlgebrique(b3)} & & & & \\\\
    \\hline
    ${ecritureAlgebrique(b4)} & & & & \\\\
    \\hline
    \\end{array}$`

    const texteCorr = `$\\def\\arraystretch{1.5}\\begin{array}{|c|c|c|c|c|}
    \\hline
    \\times & ${ecritureAlgebrique(a1)} & ${ecritureAlgebrique(a2)} & ${ecritureAlgebrique(a3)} & ${ecritureAlgebrique(a4)} \\\\
    \\hline
    ${ecritureAlgebrique(b1)} & ${ecritureAlgebrique(a1 * b1)} & ${ecritureAlgebrique(a2 * b1)} & ${ecritureAlgebrique(a3 * b1)} & ${ecritureAlgebrique(a4 * b1)} \\\\
    \\hline
    ${ecritureAlgebrique(b2)} & ${ecritureAlgebrique(a1 * b2)} & ${ecritureAlgebrique(a2 * b2)} & ${ecritureAlgebrique(a3 * b2)} & ${ecritureAlgebrique(a4 * b2)} \\\\
    \\hline
    ${ecritureAlgebrique(b3)} & ${ecritureAlgebrique(a1 * b3)} & ${ecritureAlgebrique(a2 * b3)} & ${ecritureAlgebrique(a3 * b3)} & ${ecritureAlgebrique(a4 * b3)} \\\\
    \\hline
    ${ecritureAlgebrique(b4)} & ${ecritureAlgebrique(a1 * b4)} & ${ecritureAlgebrique(a2 * b4)} & ${ecritureAlgebrique(a3 * b4)} & ${ecritureAlgebrique(a4 * b4)} \\\\
    \\hline
    \\end{array}$`
    this.listeQuestions.push(texte)
    this.listeCorrections.push(texteCorr)
    listeQuestionsToContenu(this)
  }
}
