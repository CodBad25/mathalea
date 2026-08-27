import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'

import Decimal from 'decimal.js'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../../lib/interactif/questionMathLive'
import { choice } from '../../../lib/outils/arrayOutils'
export const titre = 'Décomposer un nombre décimal'
export const interactifReady = true

export const dateDePublication = '02/11/2024'
/**
 * @author Gilles Mora
 */
export const uuid = '3a8f8'

export const refs = {
  'fr-fr': ['can6N19', '6N1B-flash2'],
  'fr-ch': [],
}
export default class decomposerDecimal extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.spacing = 1.5
    this.spacingCorr = 1.5

    this.formatChampTexte = KeyboardType.clavierDeBase
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50;) {
      let texte = ''
      let texteCorr = ''
      const u = randint(1, 9)
      const d = randint(0, 4)
      const c = randint(1, 9, d)
      const dd = new Decimal(d).div(10)
      const cc = new Decimal(c).div(100)
      const nbre = dd.add(cc).add(u)
      switch (randint(1, 3)) {
        case 1:
          if (choice([true, false])) {
            texte = 'Compléter : <br>'
            if (this.interactif) {
              texte += remplisLesBlancs(
                this,
                i,
                `${texNombre(nbre, 2)}= \\, %{champ1}  \\text{ unité(s) }  \\, %{champ2}\\, \\text{ dixième(s)}\\, %{champ3}\\, \\text{ centième(s)}`,
                KeyboardType.clavierDeBase,
              )
              handleAnswers(this, i, {
                bareme: (listePoints) => [
                  Math.min(listePoints[0], listePoints[1], listePoints[2]),
                  1,
                ],
                champ1: { value: texNombre(u, 0) },
                champ2: { value: texNombre(d, 0) },
                champ3: { value: texNombre(c, 0) },
              })
            } else {
              texte += `$${texNombre(nbre, 2)}=\\ldots$ unité(s)  $\\ldots$ dixième(s) $\\ldots$ centième(s)`
            }
            texteCorr = `Comme $1$ dixième $=0,1$ et $1$ centième $=0,01$ :<br>
         $\\begin{aligned}
         ${texNombre(nbre, 2)}&=${texNombre(u, 0)} ${d === 0 ? '' : `+ ${texNombre(dd, 1)}`} +${texNombre(cc, 2)}\\\\
         &=(${texNombre(u, 0)}\\times 1) + (${texNombre(d, 1)}\\times 0,1) +(${texNombre(c, 2)}\\times 0,01)\\\\
         &=${miseEnEvidence(texNombre(u, 0))} \\text{${u === 1 ? ' unité' : ' unités'} } + ${miseEnEvidence(texNombre(d, 0))}\\text{${d === 1 || d === 0 ? ' dixième' : ' dixièmes'} }+ ${miseEnEvidence(texNombre(c, 0))}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }
\\end{aligned}$`
            this.canEnonce = 'Compléter.'
            this.canReponseACompleter = `$${texNombre(nbre, 2)}=\\ldots$ unité(s)  $\\ldots$ dixième(s) $\\ldots$ centième(s)`
          } else {
            texte = 'Compléter avec un nombre décimal : <br>'
            if (this.interactif) {
              if (d === 0) {
                texte += remplisLesBlancs(
                  this,
                  i,
                  `${texNombre(u, 0)} \\text{${u === 1 ? ' unité ' : ' unités '} }+ ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }= \\, %{champ1} `,
                  KeyboardType.clavierDeBase,
                )
              } else {
                texte += remplisLesBlancs(
                  this,
                  i,
                  `${texNombre(u, 0)} \\text{${u === 1 ? ' unité ' : ' unités '} } + ${texNombre(d, 0)}\\text{${d === 1 ? ' dixième ' : ' dixièmes '} }+ ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }= \\, %{champ1} `,
                  KeyboardType.clavierDeBase,
                )
              }
              handleAnswers(this, i, {
                champ1: { value: texNombre(nbre, 2) },
              })
            } else {
              if (d === 0) {
                texte += `$${texNombre(u, 0)} \\text{${u === 1 ? ' unité ' : ' unités '} } + ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }=\\ldots$ `
              } else {
                texte += `$${texNombre(u, 0)} \\text{${u === 1 ? ' unité ' : ' unités '} } + ${texNombre(d, 0)}\\text{${d === 1 ? ' dixième ' : ' dixièmes '} }+ ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }=\\ldots$ `
              }
            }
            texteCorr = `Comme $1$ dixième $=0,1$ et $1$ centième $=0,01$ :<br>
           $\\begin{aligned}
           ${texNombre(u, 0)} \\text{${u === 1 ? ' unité ' : ' unités '} }  ${d === 0 ? '' : `+ ${texNombre(d, 0)} \\text{${d === 1 ? ' dixième ' : ' dixièmes '} }`}
          + ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }&=(${texNombre(u, 0)}\\times 1) + (${texNombre(d, 1)}\\times 0,1)+(${texNombre(c, 2)}\\times 0,01)\\\\
           &=${miseEnEvidence(texNombre(nbre, 2))} 
  \\end{aligned}$`
            this.canEnonce = 'Compléter avec un nombre décimal.'
            this.canReponseACompleter = `$${texNombre(u, 0)} \\text{${u === 1 ? ' unité ' : ' unités '} } + ${texNombre(d, 0)}\\text{${d === 1 || d === 0 ? ' dixième ' : ' dixièmes '} }+ ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }=\\ldots$`
          }
          this.listeCanEnonces.push(this.canEnonce)
          this.listeCanReponsesACompleter.push(this.canReponseACompleter)
          break

        case 2:
          if (choice([true, false])) {
            texte = 'Compléter : <br>'
            if (this.interactif) {
              texte += remplisLesBlancs(
                this,
                i,
                `${texNombre(nbre, 2)}=   \\, %{champ1}\\, \\text{ dixième(s)}\\, %{champ2}\\, \\text{ centième(s)}`,
                KeyboardType.clavierDeBase,
              )
              handleAnswers(this, i, {
                bareme: (listePoints) => [
                  Math.min(listePoints[0], listePoints[1]),
                  1,
                ],
                champ1: { value: texNombre(u * 10 + d, 0) },
                champ2: { value: texNombre(c, 0) },
              })
            } else {
              texte += `$${texNombre(nbre, 2)}= \\ldots$ dixième(s) $\\ldots$ centième(s)`
            }
            texteCorr = `Comme $1$ dixième $=0,1$ et $1$ centième $=0,01$ :<br>
         $\\begin{aligned}
         ${texNombre(nbre, 2)}&=${texNombre(u, 0)}${d === 0 ? '' : `+ ${texNombre(dd, 1)}`}+${texNombre(cc, 2)}\\\\
         &=(${texNombre(u * 10, 0)} \\times 0,1) ${d === 0 ? '' : `+ (${texNombre(d, 1)}\\times 0,1)`}+(${texNombre(c, 2)}\\times 0,01)\\\\
         &=${miseEnEvidence(texNombre(u * 10 + d, 0))} \\text{ dixièmes } + ${miseEnEvidence(texNombre(c, 0))}\\text{${c === 1 ? ' centième' : ' centièmes'} }
\\end{aligned}$`
            this.canEnonce = 'Compléter.'
            this.canReponseACompleter = `$${texNombre(nbre, 2)}=\\ldots$ dixième(s) $\\ldots$ centième(s)`
          } else {
            texte = 'Compléter avec un nombre décimal : <br>'
            if (this.interactif) {
              texte += remplisLesBlancs(
                this,
                i,
                `${texNombre(u * 10 + d, 0)} \\text{ dixièmes } + ${texNombre(c, 0)}\\text{${c === 1 || c === 0 ? ' centième' : ' centièmes'} }= \\, %{champ1} `,
                KeyboardType.clavierDeBase,
              )
              handleAnswers(this, i, {
                champ1: { value: texNombre(nbre, 2) },
              })
            } else {
              texte += `$${texNombre(u * 10 + d, 0)} \\text{ dixièmes } + ${texNombre(c, 0)}\\text{${c === 1 ? ' centième' : ' centièmes'} }=\\ldots$ `
            }

            texteCorr = `Comme $1$ dixième $=0,1$ et $1$ centième $=0,01$ :<br>
           $\\begin{aligned}
           ${texNombre(u * 10 + d, 0)} \\text{ dixièmes } + ${texNombre(c, 0)}\\text{${c === 1 ? ' centième' : ' centièmes'} }&=(${texNombre(10 * u + d, 0)}\\times 0,1)+ (${texNombre(c, 0)}\\times 0,01)\\\\
           &=${miseEnEvidence(texNombre(nbre, 2))} 
  \\end{aligned}$`
            this.canEnonce = 'Compléter avec un nombre décimal.'
            this.canReponseACompleter = `$${texNombre(u * 10 + d, 0)}\\text{ dixièmes } + ${texNombre(c, 0)}\\text{${c === 1 ? ' centième' : ' centièmes'} }=\\ldots$`
          }
          this.listeCanEnonces.push(this.canEnonce)
          this.listeCanReponsesACompleter.push(this.canReponseACompleter)
          break

        case 3:
          if (choice([true, false])) {
            texte = 'Compléter : <br>'
            if (this.interactif) {
              texte += remplisLesBlancs(
                this,
                i,
                `${texNombre(nbre, 2)}=   \\, %{champ1}\\, \\text{ centième(s)}`,
                KeyboardType.clavierDeBase,
              )
              handleAnswers(this, i, {
                champ1: { value: texNombre(u * 100 + d * 10 + c, 0) },
              })
            } else {
              texte += `$${texNombre(nbre, 2)}= \\ldots$ centièmes(s) `
            }
            texteCorr = `Comme $1$ centième $=0,01$ :<br>
         $\\begin{aligned}
         ${texNombre(nbre, 2)}&=${texNombre(u, 0)}${d === 0 ? '' : `+ ${texNombre(dd, 1)}`}+${texNombre(cc, 2)}\\\\
         &=(${texNombre(u * 100, 0)} \\times 0,01) ${d === 0 ? '' : `+ (${texNombre(d * 10, 0)}\\times 0,01)`}+(${texNombre(c, 0)}\\times 0,01)\\\\
         &=${miseEnEvidence(texNombre(u * 100 + d * 10 + c, 0))} \\text{ centièmes }
\\end{aligned}$`
            this.canEnonce = 'Compléter.'
            this.canReponseACompleter = `$${texNombre(nbre, 2)}=\\ldots$ centième(s)`
          } else {
            texte = 'Compléter avec un nombre décimal : <br>'
            if (this.interactif) {
              texte += remplisLesBlancs(
                this,
                i,
                `${texNombre(u * 100 + d * 10 + c, 0)} \\text{ centièmes } = \\, %{champ1} `,
                KeyboardType.clavierDeBase,
              )
              handleAnswers(this, i, {
                champ1: { value: texNombre(nbre, 2) },
              })
            } else {
              texte += `$${texNombre(u * 100 + d * 10 + c, 0)} \\text{ centièmes } =\\ldots$ `
            }

            texteCorr = `Comme  $1$ centième $=0,01$ :<br>
           $\\begin{aligned}
           ${texNombre(u * 100 + d * 10 + c, 0)} \\text{ centièmes } &=${texNombre(100 * u + d * 10 + c, 0)}\\times 0,01\\\\
           &=${miseEnEvidence(texNombre(nbre, 2))} 
  \\end{aligned}$`
            this.canEnonce = 'Compléter avec un nombre décimal.'
            this.canReponseACompleter = `$${texNombre(u * 100 + d * 10 + c, 0)} \\text{ centièmes }=\\ldots$`
          }
          this.listeCanEnonces.push(this.canEnonce)
          this.listeCanReponsesACompleter.push(this.canReponseACompleter)
          break
      }
      if (this.questionJamaisPosee(i, texte)) {
        this.listeCorrections[i] = texteCorr
        this.listeQuestions[i] = texte

        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
