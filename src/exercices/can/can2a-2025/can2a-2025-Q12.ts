import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = "Trouver le résultat d'un programme Python"
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'ca805'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class PythonCalcul extends ExerciceSimple {
  constructor() {
    super()

    this.canOfficielle = true
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
  }

  nouvelleVersion() {
    if (this.canOfficielle) {
      this.question = '$\\begin{array}{|l|}\n'
      this.question += '\\hline\n'
      this.question += '\\\n \\texttt{def mystere(a) :}  \\\n '
      this.question += `\\\\\n${sp(9)}\\texttt{b=2*a*a} \\\n`
      this.question += `\\\\\n${sp(9)}\\texttt{b=b+5} \\\n`
      this.question += `\\\\\n${sp(9)} \\texttt{return b} \\\\\n`
      this.question += '\\hline\n'
      this.question += '\\end{array}\n$'
      this.question += '<br>Que renvoie  $\\texttt{mystere(10)}$ ?'
      this.reponse = 205
      this.correction = `L'algorithme retourne $(2\\times 10\\times 10)+5=${miseEnEvidence('205')}$. `
      this.canEnonce = '\\medskip'
      this.canEnonce += '\\hspace*{10mm}\\fbox{'
      this.canEnonce += '\\parbox{0.5\\linewidth}{'
      this.canEnonce += '\\setlength{\\parskip}{.5cm}'
      this.canEnonce += ' \\texttt{def mystere(a) :}\\newline'
      this.canEnonce += ' \\hspace*{7mm}\\texttt{b=2*a*a}\\newline'
      this.canEnonce += ' \\hspace*{7mm}\\texttt{b=b+5}\\newline'
      this.canEnonce += ' \\hspace*{7mm}\\texttt{return b}'
      this.canEnonce += '}'
      this.canEnonce += '}\\newline'
      this.canEnonce += '\\medskip'
      this.canEnonce += '<br>Que renvoie  $\\texttt{mystere(10)}$ ?'
      this.canReponseACompleter += '$\\ldots$'
    } else {
      const a = randint(1, 7)
      const choix = choice([true, false])
      const coeff = randint(2, 3, a)

      if (context.isHtml) {
        this.question = '$\\begin{array}{|l|}\n'
        this.question += '\\hline\n'
        this.question += '\\\n \\texttt{def mystere(a) :}  \\\n '
        this.question += `\\\\\n${sp(9)} ${choix ? `\\texttt{b=${coeff}*a*a}` : `\\texttt{b=${coeff}+a}`} \\\n`
        this.question += `\\\\\n${sp(9)} ${choix ? '\\texttt{b=b+a}' : '\\texttt{b=b*a}'} \\\n`
        this.question += `\\\\\n${sp(9)} \\texttt{return b} \\\\\n`
        this.question += '\\hline\n'
        this.question += '\\end{array}\n$'
        this.question += `<br>Que renvoie  $\\texttt{mystere(${a})}$ ?`
      } else {
        this.question = '\\medskip'
        this.question += '\\hspace*{10mm}\\fbox{'
        this.question += '\\parbox{0.5\\linewidth}{'
        this.question += '\\setlength{\\parskip}{.5cm}'
        this.question += ' \\texttt{def mystere(a) :}\\newline'
        this.question += ` \\hspace*{7mm}${choix ? `\\texttt{b=${coeff}*a*a}` : `\\texttt{b=${coeff}+a}`}\\newline`
        this.question += ` \\hspace*{7mm}${choix ? '\\texttt{b=b+a}' : '\\texttt{b=b*a}'}\\newline`
        this.question += ' \\hspace*{7mm}\\texttt{return b}'
        this.question += '}'
        this.question += '}\\newline'
        this.question += '\\medskip'
        this.question += `<br>Que renvoie  $\\texttt{mystere(${a})}$ ?`
      }
      this.reponse = choix ? `${coeff * a * a + a}` : `${(coeff + a) * a}`
      this.correction = ` L'algorithme retourne ${choix ? `$(${coeff}\\times${a}\\times${a})+${a}=${miseEnEvidence(this.reponse)}$.` : `$(${coeff}+${a})\\times ${a}=${miseEnEvidence(this.reponse)}$.`} `

      this.canEnonce = '\\medskip'
      this.canEnonce += '\\hspace*{10mm}\\fbox{'
      this.canEnonce += '\\parbox{0.6\\linewidth}{'
      this.canEnonce += '\\setlength{\\parskip}{.5cm}'
      this.canEnonce += ' \\texttt{def mystere(a) :}\\newline'
      this.canEnonce += ` \\hspace*{7mm}${choix ? `\\texttt{b=${coeff}*a*a}` : `\\texttt{b=${coeff}+a}`}\\newline`
      this.canEnonce += ` \\hspace*{7mm}${choix ? '\\texttt{b=b+a}' : '\\texttt{b=b*a}'}\\newline`
      this.canEnonce += ' \\hspace*{7mm}\\texttt{return b}'
      this.canEnonce += '}'
      this.canEnonce += '}'
      this.canEnonce += `<br>Que renvoie  $\\texttt{mystere(${a})}$ ?`
    }
    if (this.interactif) {
      this.question += '<br>'
    }
  }
}
