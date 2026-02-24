import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
export const titre = 'Calculer la valeur affichée par un algorithme'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '00ni3'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class Can1a2026Q28 extends ExerciceCan {
  enonce(uInit?: number, borneMax?: number, coeff?: number): void {
    if (uInit == null || borneMax == null || coeff == null) {
      uInit = randint(1, 5)
      borneMax = 2
      coeff = choice([2, 3, 4, 5, 6])
    }

    // Simulation de l'algorithme :
    // u prend la valeur uInit
    // Pour k allant de 1 à borneMax :
    //   u prend la valeur u + coeff * k
    // Fin Pour
    let u = uInit
    let detailCalcul = `Initialisation : $u=${uInit}$.<br>`
    for (let k = 1; k <= borneMax; k++) {
      const ancienU = u
      u = u + coeff * k
      detailCalcul += `$k=${k}$ : $u=${ancienU}+${coeff}\\times ${k}=${ancienU}+${coeff * k}=${u}$<br>`
    }

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.reponse = String(u)
    this.question = `Quelle est la valeur de $u$ affichée ?<br>`
    if (context.isHtml) {
      this.question += '$\\begin{array}{|l|}\n'
      this.question += '\\hline\n'
      this.question += `\\\n \\text{u prend la valeur ${uInit}} \\\\\n `
      this.question += `\\\n \\text{Pour k allant de 1 à ${borneMax} :}\\\n `
      this.question += `\\\\\n${sp(9)}  \\text{u prend la valeur u+${coeff}k} \\\\\n`
      this.question += `\\\n \\text{Fin Pour} \\\\\n `
      this.question += `\\\n \\text{Afficher u} \\\\\n`
      this.question += '\\hline\n'
      this.question += '\\end{array}\n$'
    } else {
      this.question += '\\medskip'
      this.question += '\\hspace*{10mm}\\fbox{'
      this.question += '\\parbox{0.5\\linewidth}{'
      this.question += '\\setlength{\\parskip}{.5cm}'
      this.question += `  u prend la valeur ${uInit}\\newline`
      this.question += `  Pour $k$ allant de $1$ à $${borneMax}$ :\\newline`
      this.question += ` \\hspace*{7mm}$u$ prend la valeur $u+${coeff}k$\\newline`
      this.question += `  Fin Pour\\newline`
      this.question += `  Afficher $u$`
      this.question += '}'
      this.question += '}\\newline'
      this.question += '\\medskip'
    }

    if (this.interactif) {
      this.question += '<br><br>$u=$'
    } else {
      this.question += context.isHtml ? '<br><br>$u=\\ldots$' : ''
    }

    this.correction = `On exécute l'algorithme pas à pas :<br>${detailCalcul}
    La valeur affichée est $u=${miseEnEvidence(String(u))}$.`

    this.canEnonce = this.question
    this.canReponseACompleter = '$u=\\ldots$'
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(1, 2, 4) : this.enonce()
  }
}
