import { propositionsQcm } from '../../../lib/interactif/qcm'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'
export const titre =
  'Déterminer un nombre à partir de son nombre de dixièmes, centièmes, millièmes (QCM)'
export const interactifReady = true

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '05/03/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export const uuid = 'dcf22'

export const refs = {
  'fr-fr': ['can6N14', '6N1B-flash1', '6AutoN3-3'],
  'fr-ch': [],
}
export default class DeterminerLeNombre extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1

    this.spacing = 2
  }

  nouvelleVersion() {
    let texte, texteCorr, a, monQcm

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50;) {
      switch (
        choice([1, 2, 3]) // 1
      ) {
        case 1:
          a = choice([
            randint(10, 99),
            randint(100, 999),
            randint(1000, 2000),
            randint(1, 9),
          ])
          texte = `Quel est le nombre égal à $${a}$ dixièmes ?
          `
          this.canEnonce = texte
          this.autoCorrection[i] = {
            enonce: texte,
            propositions: [
              {
                texte: `$${texNombre(a / 10)}$`,
                statut: true,
              },
              {
                texte: `$${texNombre(a * 10)}$`,
                statut: false,
              },
              {
                texte: `$${texNombre(a / 100)}$`,
                statut: false,
              },
              {
                texte: `$${texNombre(a / 1000)}$`,
                statut: false,
              },
            ],
          }
          monQcm = propositionsQcm(this, i)
          texte += monQcm.texte
          texteCorr = ` $1$ dixième est égal à $0,1$. <br>
          Ainsi, $${a}$ dixièmes $=${a}\\times 0,1=${miseEnEvidence(texNombre(a / 10))}$. `

          break
        case 2:
          a = choice([
            randint(10, 99),
            randint(100, 999),
            randint(1000, 2000),
            randint(1, 9),
          ])
          texte = `Quel est le nombre égal à $${a}$ centièmes ?
          `
          this.canEnonce = texte
          this.autoCorrection[i] = {
            enonce: texte,
            propositions: [
              {
                texte: `$${texNombre(a / 100)}$`,
                statut: true,
              },
              {
                texte: `$${texNombre(a * 100)}$`,
                statut: false,
              },
              {
                texte: `$${texNombre(a / 1000)}$`,
                statut: false,
              },
              {
                texte: `$${texNombre(a / 10000)}$`,
                statut: false,
              },
            ],
          }
          monQcm = propositionsQcm(this, i)
          texte += monQcm.texte
          texteCorr = ` $1$ centième est égal à $0,01$. <br>
          Ainsi, $${a}$ centièmes $=${a}\\times 0,01=${miseEnEvidence(texNombre(a / 100))}$. `
          break

        case 3:
        default:
          a = choice([
            randint(10, 99),
            randint(100, 999),
            randint(1000, 2000),
            randint(1, 9),
          ])
          texte = `Quel est le nombre égal à $${a}$ millièmes ?
          `
          this.canEnonce = texte

          this.autoCorrection[i] = {
            enonce: texte,
            propositions: [
              {
                texte: `$${texNombre(a / 1000)}$`,
                statut: true,
              },
              {
                texte: `$${texNombre(a / 10000)}$`,
                statut: false,
              },
              {
                texte: `$${texNombre(a / 100)}$`,
                statut: false,
              },
              {
                texte: `$${texNombre(a / 10)}$`,
                statut: false,
              },
            ],
          }
          monQcm = propositionsQcm(this, i)
          texte += monQcm.texte
          texteCorr = ` $1$ millième est égal à $0,001$. <br>
          Ainsi, $${a}$ millièmes $=${a}\\times 0,001=${miseEnEvidence(texNombre(a / 1000))}$. `
          break
      }

      if (this.questionJamaisPosee(i, a)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      this.canReponseACompleter = monQcm.texte
      this.listeCanEnonces.push(this.canEnonce)
      this.listeCanReponsesACompleter.push(this.canReponseACompleter)
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
