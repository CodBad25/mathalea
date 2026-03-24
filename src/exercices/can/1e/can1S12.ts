import { propositionsQcm } from '../../../lib/interactif/qcm'
import { choice } from '../../../lib/outils/arrayOutils'
import { texFractionFromString } from '../../../lib/outils/deprecatedFractions'
import { ecritureAlgebrique } from '../../../lib/outils/ecritures'
import { arrondi } from '../../../lib/outils/nombres'
import { texNombre } from '../../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'
export const titre = 'Donner la nature d’une suite (formule de récurrence)*'
export const interactifReady = true
export const interactifType = 'qcm'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '16/02/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModifImportante = '17/04/2024'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export const uuid = 'e7e0c'

export const refs = {
  'fr-fr': ['can1S12'],
  'fr-ch': [],
}
export default class NatureSuiteRec extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1

    this.spacing = 1.5
  }

  nouvelleVersion() {
    let texte, texteCorr, a, b, u, listeFractions1, fraction1, n1, d1, props
    const nomSuite = ['u', 'v', 'w']
    const s = choice(nomSuite)
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      switch (
        choice([1, 2, 3, 4, 5]) //
      ) {
        case 1: // suite arith u_{n+1}-u_n=r
          a = randint(1, 10) * choice([-1, 1])
          u = randint(1, 10) * choice([-1, 1])

          texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1}  -${s}_n =${a}$.<br>
          Alors, $(${s}_n)$ est une suite ...`
          this.autoCorrection[i] = {
            enonce: texte,

            propositions: [
              {
                texte: `arithmétique de raison $${a}$`,
                statut: true,
              },
              {
                texte: `arithmétique de raison $${-a}$`,
                statut: false,
              },
              {
                texte: `géométrique de raison $${a}$`,
                statut: false,
              },
            ],
          }
          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1}  -${s}_n =${a}$.<br>
         
            Quelle est la nature de cette suite ?<br>
            
            Donner sa raison.`
          }

          texteCorr = `La formule de récurrence est de la forme $${s}_{n+1}=${s}_n+r$ avec $r=${a}$.<br>
        On en déduit que $(${s}_n)$ est une suite arithmétique de raison $${a}$ et de premier terme $${s}_0=${u}$.`

          break
        case 2: // suite arith u_n=u_{n+1}-r
          a = randint(1, 10) * choice([-1, 1])
          u = randint(1, 10) * choice([-1, 1])

          texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_n=${s}_{n+1}  ${ecritureAlgebrique(a)} $.<br>
          Alors, $(${s}_n)$ est une suite ...`
          this.autoCorrection[i] = {
            enonce: texte,

            propositions: [
              {
                texte: `arithmétique de raison $${-a}$`,
                statut: true,
              },
              {
                texte: `arithmétique de raison $${a}$`,
                statut: false,
              },
              {
                texte: `géométrique de raison $${-a}$`,
                statut: false,
              },
            ],
          }
          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_n=${s}_{n+1}  ${ecritureAlgebrique(a)} $.<br>
          
            Quelle est la nature de cette suite ?<br>
            
            Donner sa raison.`
          }

          texteCorr = `La formule de récurrence est de la forme $${s}_{n+1}=${s}_n+r$ avec $r=${-a}$.<br>
        On en déduit que $(${s}_n)$ est une suite arithmétique de raison $${-a}$ et de premier terme $${s}_0=${u}$.`

          break
        case 3: // suite arith u_{n+1}=(au_n+a*r)/a
          a = randint(1, 10) * choice([-1, 1])
          u = randint(1, 10) * choice([-1, 1])
          b = randint(1, 10) * choice([-1, 1])
          texte = `Soit $(u_n)$ une suite définie par $${s}_0=${u}$ et pour tout  
            $n\\in\\mathbb{N}$ par $${s}_{n+1}  =\\dfrac{${b} ${s}_n${ecritureAlgebrique(b * a)}}{${b}}$.<br>
          Alors, $(${s}_n)$ est une suite ...`
          this.autoCorrection[i] = {
            enonce: texte,

            propositions: [
              {
                texte: `arithmétique de raison $${a}$`,
                statut: true,
              },
              {
                texte: `arithmétique de raison $${-a}$`,
                statut: false,
              },
              {
                texte: `géométrique de raison $${a}$`,
                statut: false,
              },
            ],
          }
          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par
             $${s}_{n+1}  =\\dfrac{${b} ${s}_n${ecritureAlgebrique(b * a)}}{${b}}$.<br>
          
            Quelle est la nature de cette suite ? <br>
            
            Donner sa raison.`
          }

          texteCorr = `Comme $${s}_{n+1}  =\\dfrac{${b} ${s}_n${ecritureAlgebrique(b * a)}}{${b}}=\\dfrac{${b} ${s}_n}{${b}}+\\dfrac{${b * a}}{${b}}= ${s}_n${ecritureAlgebrique(a)}$, alors
        la formule de récurrence est de la forme $${s}_{n+1}=${s}_n+r$ avec $r=${a}$.<br>
        On en déduit que $(${s}_n)$ est une suite arithmétique de raison $${a}$ et de premier terme $${s}_0=${u}$.`

          break

        case 4: // suite géo u_{n+1}-u_n=au_n
          a = arrondi(randint(2, 99) * choice([-1, 1])) / 100
          u = randint(1, 10) * choice([-1, 1])

          texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1} -${s}_{n}= ${texNombre(a)}${s}_n $.<br>
          Alors, $(${s}_n)$ est une suite ...`
          this.autoCorrection[i] = {
            enonce: texte,

            propositions: [
              {
                texte: `géométrique de raison $${texNombre(1 + a)}$`,
                statut: true,
              },
              {
                texte: `géométrique de raison $${texNombre(a)}$`,
                statut: false,
              },
              {
                texte: `arithmétique de raison $${texNombre(a)}$`,
                statut: false,
              },
            ],
          }
          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1} -${s}_{n}= ${texNombre(a)}${s}_n $.<br>
          
            Quelle est la nature de cette suite ? <br>
            
            Donner sa raison.`
          }

          texteCorr = `$${s}_{n+1} -${s}_{n}= ${texNombre(a)}${s}_n$ s'écrit : $${s}_{n+1} = ${texNombre(a)}${s}_n+${s}_{n}=${texNombre(1 + a)}${s}_n$.<br>
           La formule de récurrence est de la forme $${s}_{n+1}=q\\times ${s}_n$ avec $q=${texNombre(1 + a)}$.<br>
        On en déduit que $(${s}_n)$ est une suite géométrique de raison $${texNombre(1 + a)}$ et de premier terme $${s}_0=${u}$.`

          break
        case 5: // suite géo avec raison fraction
        default:
          listeFractions1 = [
            [1, 2],
            [2, 3],
            [3, 4],
            [2, 5],
            [4, 5],
            [5, 6],
            [2, 7],
            [4, 7],
            [6, 7],
            [3, 8],
            [7, 8],
            [2, 9],
            [5, 9],
            [8, 9],
            [1, 10],
            [3, 10],
            [7, 10],
            [9, 10],
          ]
          fraction1 = choice(listeFractions1)
          n1 = fraction1[0]
          d1 = fraction1[1]
          a = randint(2, 10)
          u = randint(1, 10) * choice([-1, 1])
          b = choice([-1, 1])
          if (b < 0) {
            texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1} =${s}_{n} -${texFractionFromString(n1, d1)}${s}_{n}$.<br>
          Alors, $(${s}_n)$ est une suite ...`
            this.autoCorrection[i] = {
              enonce: texte,

              propositions: [
                {
                  texte: `géométrique de raison $${texFractionFromString(d1 - n1, d1)}$`,
                  statut: true,
                },
                {
                  texte: `géométrique de raison $${texFractionFromString(n1, d1)}$`,
                  statut: false,
                },
                {
                  texte: `arithmétique de raison $-${texFractionFromString(n1, d1)}$`,
                  statut: false,
                },
              ],
            }
            props = propositionsQcm(this, i)
            if (this.interactif) texte += props.texte
            else {
              texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1} =${s}_{n} -${texFractionFromString(n1, d1)}${s}_{n}$.<br>
              
              Quelle est la nature de cette suite ? <br>
              
              Donner sa raison.`
            }
            texteCorr = `$${s}_{n+1} =${s}_{n} -${texFractionFromString(n1, d1)}${s}_{n}=\\left(1-${texFractionFromString(n1, d1)}\\right)${s}_{n}=${texFractionFromString(d1 - n1, d1)}${s}_{n}$.<br>
                        La formule de récurrence est de la forme $${s}_{n+1}=q\\times ${s}_n$ avec $q=${texFractionFromString(d1 - n1, d1)}$.<br>
        On en déduit que $(${s}_n)$ est une suite géométrique de raison $${texFractionFromString(d1 - n1, d1)}$ et de premier terme $${s}_0=${u}$.`
          } else {
            texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1} =${s}_{n} +${texFractionFromString(n1, d1)}${s}_{n}$.<br>
          Alors, $(${s}_n)$ est une suite ...`
            this.autoCorrection[i] = {
              enonce: texte,

              propositions: [
                {
                  texte: `géométrique de raison $${texFractionFromString(d1 + n1, d1)}$`,
                  statut: true,
                },
                {
                  texte: `géométrique de raison $${texFractionFromString(n1, d1)}$`,
                  statut: false,
                },
                {
                  texte: `arithmétique de raison $${texFractionFromString(n1, d1)}$`,
                  statut: false,
                },
              ],
            }
            props = propositionsQcm(this, i)
            if (this.interactif) texte += props.texte
            else {
              texte = `Soit $(${s}_n)$ une suite définie par $${s}_0=${u}$ et pour tout  $n\\in\\mathbb{N}$ par $${s}_{n+1} =${s}_{n} +${texFractionFromString(n1, d1)}${s}_{n}$.<br>
             
              Quelle est la nature de cette suite ?<br>
              
              Donner sa raison.`
            }
            texteCorr = `$${s}_{n+1} =${s}_{n} +${texFractionFromString(n1, d1)}${s}_{n}=\\left(1+${texFractionFromString(n1, d1)}\\right)${s}_{n}=${texFractionFromString(d1 + n1, d1)}${s}_{n}$.<br>
            La formule de récurrence est de la forme $${s}_{n+1}=q\\times ${s}_n$ avec $q=${texFractionFromString(d1 + n1, d1)}$.<br>
On en déduit que $(${s}_n)$ est une suite géométrique de raison $${texFractionFromString(d1 + n1, d1)}$ et de premier terme $${s}_0=${u}$.`
          }

          break
      }

      if (this.questionJamaisPosee(i, u, a)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr

        this.canEnonce = texte
        this.canReponseACompleter = `Nature de la suite : $\\ldots$\\\\
         Raison $=\\ldots$`
        this.listeCanEnonces.push(this.canEnonce)
        this.listeCanReponsesACompleter.push(this.canReponseACompleter)
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
