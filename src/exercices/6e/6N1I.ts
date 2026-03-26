import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { sp } from '../../lib/outils/outilString'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
export const titre = 'Comparer des nombres décimaux'
export const amcReady = true
export const amcType = 'AMCOpen'
export const interactifType = 'qcm'
export const interactifReady = true

/**
 * Comparer deux nombres décimaux
 *
 * Les types de comparaisons sont :
 * * ab ? ba
 * * aa,bb ? aa,cc
 * * a,b  a,cc avec b>c
 * * 0,ab 0,ba
 * * 0,a0b 0,b0a
 * * a,b a,b0
 * * 0,0ab 0,0a0b
 * * a,bb  a,ccc avec b>c
 * * a+1,bb  a,cccc avec cccc>bb
 *
 * aa, bb, cc correspondent à des nombres à 2 chiffres (ces 2 chiffres pouvant être distincts)
 * @author Rémi Angot
 * 6N31
 * Ajout AMC : Janvier 2022 par EE
 * Ajout interactivité : 1/12/2024 par Jean-Claude Lhote
 */
export const uuid = 'be1e4'

export const refs = {
  'fr-fr': ['6N1I', 'BP2AutoG4'],
  'fr-2016': ['6N31', 'BP2AutoG4'],
  'fr-ch': ['9NO7-4'],
}
export default class ComparerDecimaux extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 8
    this.nbCols = 2
    this.nbColsCorr = 2
  }

  nouvelleVersion() {
    this.consigne = this.interactif
      ? 'Choisir la bonne égalité ou inégalité.'
      : 'Compléter avec le signe <, > ou =.'
    const typesDeQuestionsDisponibles = [choice([1, 4, 5]), 2, 2, 3, 6, 7, 8, 9] // une seule question du type inversion de chiffres (1,4,5)
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"

    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      let x
      let y
      let a
      let b
      let c
      let zeroInutile = false

      switch (listeTypeDeQuestions[i]) {
        case 1: // ab ba
          a = randint(1, 9)
          b = randint(1, 9, a)
          x = a * 10 + b
          y = b * 10 + a
          break
        case 2: // aa,bb aa,cc
          a = randint(1, 99)
          b = randint(11, 99)
          c = randint(11, 99)
          x = a + b / 100
          y = a + c / 100
          break
        case 3: // a,b  a,cc avec b>c
          a = randint(1, 99)
          b = randint(1, 8)
          c = randint(1, b * 10)
          x = a + b / 10
          y = a + c / 100
          break
        case 4: // 0,ab 0,ba
          a = randint(1, 9)
          b = randint(1, 9, a)
          x = (a * 10 + b) / 100
          y = (b * 10 + a) / 100
          break
        case 5: // 0,a0b 0,b0a
          a = randint(1, 9)
          b = randint(1, 9, a)
          x = (a * 100 + b) / 1000
          y = (b * 100 + a) / 1000
          break
        case 6: // a,b a,b0
          a = randint(11, 999)
          while (a % 10 === 0) {
            // pas de nombre divisible par 10
            a = randint(11, 999)
          }
          x = a / 10
          y = x
          zeroInutile = true
          break
        case 7: // 0,0ab 0,0a0b
          a = randint(1, 9)
          b = randint(1, 9)
          x = a / 100 + b / 1000
          y = a / 100 + b / 10000
          break
        case 8: // a,bb  a,ccc avec b>c
          a = randint(11, 99)
          b = randint(11, 99)
          c = randint(100, b * 10)
          x = a + b / 100
          y = a + c / 1000
          if (randint(1, 2) === 1) {
            ;[x, y] = [y, x]
          }
          break
        case 9: // a+1,bb  a,cccc avec cccc>bb
        default:
          a = randint(11, 98)
          b = randint(11, 99)
          c = randint(b * 100, 10000)
          x = a + 1 + b / 100
          y = a + c / 10000
          if (randint(1, 2) === 1) {
            ;[x, y] = [y, x]
          }
          break
      }
      let signe = '>'
      let prop1, prop2, prop3
      texte = `$${texNombre(x, 6)}${sp(3)}\\ldots\\ldots${sp(3)}${texNombre(y, 6)}$`
      prop1 = `$${texNombre(x, 6)} > ${texNombre(y, 6)}$`
      prop2 = `$${texNombre(x, 6)} < ${texNombre(y, 6)}$`
      prop3 = `$${texNombre(x, 6)} = ${texNombre(y, 6)}$`
      if (x > y) {
        texteCorr = `$${texNombre(x, 6)} > ${texNombre(y, 6)}$`
      } else if (x < y) {
        signe = '<'
        texteCorr = `$${texNombre(x, 6)} < ${texNombre(y, 6)}$`
      } else {
        signe = '='
        texteCorr = `$${texNombre(x, 6)} = ${texNombre(y, 6)}$`
      }

      if (zeroInutile) {
        if (randint(1, 2) === 1) {
          texte = `$${texNombre(x, 2, true)}${sp(3)}\\ldots\\ldots${sp(3)}${texNombre(y, 6)}$`
          prop1 = `$${texNombre(x, 2, true)} > ${texNombre(y, 6)}$`
          prop2 = `$${texNombre(x, 2, true)} < ${texNombre(y, 6)}$`
          prop3 = `$${texNombre(x, 2, true)} = ${texNombre(y, 6)}$`
          if (x > y) {
            texteCorr = `$${texNombre(x, 2, true)} > ${texNombre(y, 6)}$`
          } else if (x < y) {
            signe = '<'
            texteCorr = `$${texNombre(x, 2, true)} < ${texNombre(y, 6)}$`
          } else {
            signe = '='
            texteCorr = `$${texNombre(x, 2, true)} = ${texNombre(y, 6)}$`
          }
        } else {
          texte = `$${texNombre(x, 6)}${sp(3)}\\ldots\\ldots${sp(3)}${texNombre(y, 2, true)}$`
          prop1 = `$${texNombre(x, 6)} > ${texNombre(y, 2, true)}$`
          prop2 = `$${texNombre(x, 6)} < ${texNombre(y, 2, true)}$`
          prop3 = `$${texNombre(x, 6)} = ${texNombre(y, 2, true)}$`
          if (x > y) {
            texteCorr = `$${texNombre(x, 6)} > ${texNombre(y, 2, true)}$`
          } else if (x < y) {
            texteCorr = `$${texNombre(x, 6)} < ${texNombre(y, 2, true)}$`
            signe = '<'
          } else {
            texteCorr = `$${texNombre(x, 6)} = ${texNombre(y, 2, true)}$`
            signe = '='
          }
        }
      }
      if (context.isAmc) {
        this.autoCorrection[i] = {
          enonce: texte,
          propositions: [
            { texte: texteCorr, statut: 3, feedback: '', sanscadre: true },
          ],
        }
      } else if (this.interactif) {
        this.autoCorrection[i] = {
          enonce: texte,
          propositions: [
            {
              texte: prop1,
              statut: signe === '>',
            },
            {
              texte: prop2,
              statut: signe === '<',
            },
            {
              texte: prop3,
              statut: signe === '=',
            },
          ],
          options: {
            ordered: true,
          },
        }
        const monQcm = propositionsQcm(this, i)
        texte += monQcm.texte
        texteCorr += monQcm.texteCorr
      }
      if (this.questionJamaisPosee(i, x, y)) {
        // Si la question n'a jamais été posée, on en crée une autre

        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
