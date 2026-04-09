import { bleuMathalea } from '../../lib/colors'
import {
  combinaisonListesSansChangerOrdre,
  shuffle,
  shuffle2tableaux,
} from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { listeDesDiviseurs } from '../../lib/outils/primalite'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import {
  contraindreValeur,
  egal,
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Comprendre le vocabulaire : division euclidienne, diviseurs, multiples'
export const dateDeModifImportante = '08/10/2025'

/**
 * Division Euclidienne; diviseurs, multiples, critères de divisibilité
 * @author Sébastien Lozano (refactorisé par Éric Elter)
 * Rajout de plusieurs paramètres par Éric Elter le 08/10/2025 et donc changement d'uuid
 */
export const uuid = '42d20'

export const refs = {
  'fr-fr': ['3A10'],
  'fr-ch': ['9NO4-1'],
}
export default class DivisionEuclidienneMultiplesDiviseursCriteres extends Exercice {
  constructor() {
    super()
    this.besoinFormulaire3Numerique = [
      "Nombres de chiffres de l'entier de la question sur la liste de diviseurs",
      5,
    ]
    this.besoinFormulaire4Numerique = [
      "Nombre maximum de diviseurs de l'entier de la question sur la liste de diviseurs",
      20,
    ]
    this.besoinFormulaireTexte = [
      'Type de questions',
      [
        'Nombres séparés par des tirets  :',
        '1 : Vocabulaire dans division euclidienne',
        '2 : Quotient et reste',
        '3 : Égalité et diviseurs',
        '4 : Diviseurs ou multiples',
        '5 : Liste de diviseurs',
        '6 : Mélange',
      ].join('\n'),
    ]
    this.besoinFormulaire2Texte = [
      'Choix dans question sur le vocabulaire dans division euclidienne',
      [
        'Nombres séparés par des tirets  :',
        '1 : Reste',
        '2 : Dividende',
        '3 : Quotient',
        '4 : Diviseur',
        '5 : Mélange',
      ].join('\n'),
    ]
    context.isHtml ? (this.spacing = 1) : (this.spacing = 2)
    context.isHtml ? (this.spacingCorr = 2) : (this.spacingCorr = 2)
    this.nbQuestions = 5

    this.sup3 = 3
    this.sup4 = 10
    this.sup = '6'
    this.sup2 = '5'
    this.correctionDetailleeDisponible = true
    this.correctionDetaillee = false
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      max: 5,
      melange: 6,
      defaut: 6,
      nbQuestions: this.nbQuestions,
      shuffle: false,
    })
    const listeTypeDeQuestions = combinaisonListesSansChangerOrdre(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )

    const VocabulaireDisponible = gestionnaireFormulaireTexte({
      saisie: this.sup2,
      max: 4,
      melange: 5,
      defaut: 5,
      nbQuestions: this.nbQuestions,
    })
    const vocabulaire = combinaisonListesSansChangerOrdre(
      VocabulaireDisponible,
      this.nbQuestions,
    ).map(Number)

    const nbChiffresMax = contraindreValeur(1, 5, this.sup3, 2)
    const nbDiviseursMax = Math.max(this.sup4, 2)
    let compteurVocabulaire = 0
    for (
      let i = 0,
        M,
        listeDiviseursM,
        nbDiviseursM,
        n1,
        n2,
        p1,
        p2,
        rgDiviseur,
        typeDeQuestion,
        multiples,
        textes,
        textesCorr,
        candidatsDiviseurs,
        dividende,
        diviseur,
        quotient,
        reste,
        quotients,
        texte,
        texteCorr,
        cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      typeDeQuestion = listeTypeDeQuestions[i]
      texte = ''
      texteCorr = ''
      switch (typeDeQuestion) {
        case 1: {
          // plus grand reste dans une division euclidienne
          diviseur = randint(2, 99)
          const myTexte = {
            vocabulaire: ['reste', 'dividende', 'quotient', 'diviseur'],
            correction: [
              `il ne peut pas rester plus de $${miseEnEvidence(diviseur - 1)}$, sinon c'est qu'on peut encore ajouter au moins une fois $${diviseur}$ dans le dividende et donc $1$ au quotient.`,
              `le dividende peut être ${texteEnCouleurEtGras('quelconque')}, donc on peut le choisir aussi grand que l'on veut.`,
              `le quotient peut être ${texteEnCouleurEtGras('quelconque')}, il dépendra du dividende, donc il sera d'autant plus grand que le dividende l'est.`,
              `c'est que le diviseur est fixé, donc le plus grand, c'est lui-même, $${miseEnEvidence(diviseur)}$.`,
            ],
          }
          // const myChoice = randint(0, 3)
          const myChoice = vocabulaire[compteurVocabulaire] - 1
          compteurVocabulaire++
          texte = `Quel est le plus grand ${myTexte.vocabulaire[myChoice]} possible dans une division euclidienne par $${diviseur}$ ?`
          texteCorr = `Si on divise par $${diviseur}$, `
          texteCorr += myTexte.correction[myChoice]

          break
        }
        case 2: // quotient et reste d'une division euclidienne donnée
          diviseur = randint(2, 99)
          dividende = randint(1001, 99999)
          quotient = Math.trunc(dividende / diviseur)
          reste = dividende % diviseur

          texte = `On a $${texNombre(dividende)}=${diviseur}\\times${texNombre(quotient)} + ${reste}$`
          texte += '<br>'
          texte += `En déduire le quotient et le reste de la division euclidienne de $${texNombre(dividende)}$ par $${diviseur}$.`
          texteCorr = `Dans la division euclidienne de $${texNombre(dividende)}$ par $${diviseur}$, le quotient vaut $${miseEnEvidence(texNombre(quotient))}$ et le reste $${miseEnEvidence(reste)}$.`
          break
        case 3: // caractérisation des multiples et diviseurs par le reste de la division euclidienne
          dividende = randint(101, 9999)
          if (listeDesDiviseurs(dividende).length % 2 === 0) {
            // si il y a un nombre pair de diviseurs on prend le (n/2+1) eme
            rgDiviseur = listeDesDiviseurs(dividende).length / 2 + 1 // rang du diviseur choisi
          } else {
            // il y a nbre impair de diviseurs on prend le ((n-1)/2 +1) eme
            rgDiviseur = (listeDesDiviseurs(dividende).length - 1) / 2 + 1
          }
          diviseur = listeDesDiviseurs(dividende)[rgDiviseur - 1] // on choisit le diviseur central de dividende, ATTENTION rang des tableaux commence à 0
          candidatsDiviseurs = [diviseur - 1, diviseur, diviseur + 1] // on prend l'entier précédent et le successeur de ce diviseur

          // Faut-il que je conditionne pour éviter le diviseur 1 ?
          candidatsDiviseurs = shuffle(candidatsDiviseurs) // on mélange le tableau
          texte =
            'Les trois égalités suivantes sont respectivement issues de trois divisions euclidiennes différentes : <br>'
          texte += `$${texNombre(dividende)} = ${texNombre(candidatsDiviseurs[0])}\\times${texNombre(Math.trunc(dividende / candidatsDiviseurs[0]))} + ${texNombre(dividende % candidatsDiviseurs[0])}$`
          texte += '<br>'
          texte += `$${texNombre(dividende)} = ${texNombre(candidatsDiviseurs[1])}\\times${texNombre(Math.trunc(dividende / candidatsDiviseurs[1]))} + ${texNombre(dividende % candidatsDiviseurs[1])}$`
          texte += '<br>'
          texte += `$${texNombre(dividende)} = ${texNombre(candidatsDiviseurs[2])}\\times${texNombre(Math.trunc(dividende / candidatsDiviseurs[2]))} + ${texNombre(dividende % candidatsDiviseurs[2])}$`
          texte += '<br>'
          texte += `Sans calculer, dire si les nombres $${texNombre(candidatsDiviseurs[0])}$ ; $${texNombre(candidatsDiviseurs[1])}$ ; $${texNombre(candidatsDiviseurs[2])}$ sont des diviseurs de $${texNombre(dividende)}$. Justifier.`
          texteCorr = ''
          if (egal(dividende % candidatsDiviseurs[0], 0)) {
            // egal() est une fonction de JC pour éviter les problèmes de virgule flottante
            texteCorr += `Le reste de la division euclidienne de $${texNombre(dividende)}$ par $${texNombre(candidatsDiviseurs[0])}$ vaut $0$ donc $${texNombre(candidatsDiviseurs[0])}$ ${texteEnCouleurEtGras('est un diviseur de')} $${texNombre(dividende)}$.`
          } else {
            texteCorr += `Le reste de la division euclidienne de $${texNombre(dividende)}$ par $${texNombre(candidatsDiviseurs[0])}$ ne vaut pas $0$ donc $${texNombre(candidatsDiviseurs[0])}$ ${texteEnCouleurEtGras("n'est pas un diviseur de")} $${texNombre(dividende)}$.`
          }
          texteCorr += '<br>'
          if (egal(dividende % candidatsDiviseurs[1], 0)) {
            // egal() est une fonction de JC pour éviter les problèmes de virgule flottante
            texteCorr += `Le reste de la division euclidienne de $${texNombre(dividende)}$ par $${texNombre(candidatsDiviseurs[1])}$ vaut $0$ donc $${texNombre(candidatsDiviseurs[1])}$ ${texteEnCouleurEtGras('divise')} $${texNombre(dividende)}$.`
          } else {
            texteCorr += `Le reste de la division euclidienne de $${texNombre(dividende)}$ par $${texNombre(candidatsDiviseurs[1])}$ ne vaut pas $0$ donc $${texNombre(candidatsDiviseurs[1])}$ ${texteEnCouleurEtGras('ne divise pas')} $${texNombre(dividende)}$.`
          }
          texteCorr += '<br>'
          if (egal(dividende % candidatsDiviseurs[2], 0)) {
            // egal() est une fonction de JC pour éviter les problèmes de virgule flottante
            texteCorr += `Le reste de la division euclidienne de $${texNombre(dividende)}$ par $${texNombre(candidatsDiviseurs[2])}$ vaut $0$ donc $${texNombre(dividende)}$ ${texteEnCouleurEtGras('est divisible par')} $${texNombre(candidatsDiviseurs[2])}$.`
          } else {
            texteCorr += `Le reste de la division euclidienne de $${texNombre(dividende)}$ par $${texNombre(candidatsDiviseurs[2])}$ ne vaut pas $0$ donc $${texNombre(dividende)}$ ${texteEnCouleurEtGras("n'est pas divisible par")} $${texNombre(candidatsDiviseurs[2])}$.`
          }
          texteCorr += '<br>'
          break

        case 4: {
          // on déclare des tableaux utiles // vocabulaire diviseurs et multiples
          textes = []
          textesCorr = []
          // on tire au hasard 4 diviseurs différents entre 2 et 999 et 4 multiplicateurs différents entre 2 et 9
          let diviseurs: number[] = []
          let multiplicateurs: number[] = []
          diviseurs = [
            randint(2, 999),
            randint(2, 999, [diviseurs[0]]),
            randint(2, 999, [diviseurs[0], diviseurs[1]]),
            randint(2, 999, [diviseurs[0], diviseurs[1], diviseurs[2]]),
          ]
          multiplicateurs = [
            randint(2, 9),
            randint(2, 9, [multiplicateurs[0]]),
            randint(2, 9, [multiplicateurs[0], multiplicateurs[1]]),
            randint(2, 9, [
              multiplicateurs[0],
              multiplicateurs[1],
              multiplicateurs[2],
            ]),
          ]
          // on calcule les multiples
          const texteDiviseurs: string[] = []
          const texteMultiples: string[] = []
          const texteQuotients: string[] = []
          multiples = []
          quotients = []
          for (let j = 0; j < 4; j++) {
            multiples[j] = diviseurs[j] * multiplicateurs[j]
            quotients[j] = multiples[j] / diviseurs[j]
            texteDiviseurs[j] = texNombre(diviseurs[j])
            texteMultiples[j] = texNombre(multiples[j])
            texteQuotients[j] = texNombre(quotients[j])
          }
          // on crée les phrases
          textes[0] = `$${texteDiviseurs[0]} \\dotfill ${texteMultiples[0]}$`
          textesCorr[0] = `$${texteDiviseurs[0]}$ est ${texteEnCouleurEtGras('un diviseur')} de $${texteMultiples[0]}$ car $${texteMultiples[0]}=${diviseurs[0]}\\times${texteQuotients[0]}$.`
          textes[1] = `$${texteDiviseurs[1]} \\dotfill ${texteMultiples[1]}$`
          textesCorr[1] = `$${texteDiviseurs[1]}$ est ${texteEnCouleurEtGras('un diviseur')} de $${texteMultiples[1]}$ car $${texteMultiples[1]}=${diviseurs[1]}\\times${texteQuotients[1]}$.`
          textes[2] = `$${texteMultiples[2]} \\dotfill ${texteDiviseurs[2]}$`
          textesCorr[2] = `$${texteMultiples[2]}$ est ${texteEnCouleurEtGras('un multiple')} de $${texteDiviseurs[2]}$ car $${texteMultiples[2]}=${diviseurs[2]}\\times${texteQuotients[2]}$.`
          textes[3] = `$${texteMultiples[3]} \\dotfill ${texteDiviseurs[3]}$`
          textesCorr[3] = `$${texteMultiples[3]}$ est ${texteEnCouleurEtGras('un multiple')} de $${texteDiviseurs[3]}$ car $${texteMultiples[3]}=${diviseurs[3]}\\times${texteQuotients[3]}$.`
          // on ajoute deux cas ni multiple ni diviseur
          // on choisit deux nombres
          n1 = randint(2, 999, [
            diviseurs[0],
            diviseurs[1],
            diviseurs[2],
            diviseurs[3],
          ])
          const texteN1 = texNombre(n1)
          p1 = randint(2, 999, [
            diviseurs[0],
            diviseurs[1],
            diviseurs[2],
            diviseurs[3],
            n1,
          ])
          const texteP1 = texNombre(p1)
          // on choisit un autre qui n'est pas dans la liste des diviseurs de n1
          n2 = randint(2, 999, listeDesDiviseurs(n1))
          const texteN2 = texNombre(n2)
          p2 = randint(2, 999, listeDesDiviseurs(p1))
          const texteP2 = texNombre(p2)

          textes[4] = `$${texteN1} \\dotfill ${texteN2}$`
          textesCorr[4] = `$${texteN1}$ n'est  ${texteEnCouleurEtGras('ni un multiple, ni un diviseur')}  de $${texteN2}$ car $${texteN1}=${texteN2}\\times${Math.trunc(n1 / n2)}+${miseEnEvidence(n1 % n2, bleuMathalea)}$ et $${texteN2}=${texteN1}\\times${Math.trunc(n2 / n1)}+${miseEnEvidence(n2 % n1, bleuMathalea)}$.`
          textes[5] = `$${texteP2} \\dotfill ${texteP1}$`
          textesCorr[5] = `$${texteP2}$ n'est  ${texteEnCouleurEtGras('ni un multiple, ni un diviseur')}  de $${texteP1}$ car $${texteP1}=${texteP2}\\times${Math.trunc(p1 / p2)}+${miseEnEvidence(p1 % p2, bleuMathalea)}$ et $${texteP2}=${texteP1}\\times${Math.trunc(p2 / p1)}+${miseEnEvidence(p2 % p1, bleuMathalea)}$.`
          // on mélange pour que l'ordre change!
          shuffle2tableaux(textes, textesCorr)
          texte =
            'Après avoir testé avec la calculatrice, compléter chaque phrase avec "est un diviseur de" ou "est un multiple de" ou "n\'est ni un diviseur, ni un multiple de".'
          texte += '<br>'
          texteCorr = ''
          for (let j = 0; j < 5; j++) {
            texte += textes[j]
            texte += '<br>'
            texteCorr += textesCorr[j]
            texteCorr += '<br>'
          }
          texte += textes[5]
          // texte +=`<br>`;
          texteCorr += textesCorr[5]
          texteCorr += '<br>'
          break
        }
        case 5:
        default:
          /* if (nbDiviseursMax > 10) { // les nombres de 2 chiffres ayant plus de 10 diviseurs étant peu nombreux, on force au moins 3 chiffres.
            nbChiffresMax = Math.max(nbChiffresMax, 3)
          } */
          do {
            M = randint(10 ** (nbChiffresMax - 1), 10 ** nbChiffresMax - 1)
            listeDiviseursM = listeDesDiviseurs(M)
            nbDiviseursM = listeDiviseursM.length
            // } while (nbDiviseursM < Math.max(2, nbDiviseursMax - 3) || nbDiviseursM > nbDiviseursMax)
          } while (nbDiviseursM > nbDiviseursMax)
          texte = `Écrire la liste de tous les diviseurs de $${M}$.`
          texteCorr = `Pour trouver la liste des diviseurs de $${M}$, on cherche tous les produits de deux facteurs qui donnent $${M}$, en écrivant toujours le plus petit facteur en premier.<br>`
          texteCorr += `Il est suffisant de chercher des diviseurs inférieurs au plus grand nombre dont le carré est inférieur à $${M}$, par exemple ici, $${Math.trunc(Math.sqrt(M))}\\times${Math.trunc(Math.sqrt(M))} = ${Math.trunc(Math.sqrt(M)) * Math.trunc(Math.sqrt(M))}<${M}$`
          texteCorr += ` et $${Math.trunc(Math.sqrt(M)) + 1}\\times${Math.trunc(Math.sqrt(M)) + 1} = ${(Math.trunc(Math.sqrt(M)) + 1) * (Math.trunc(Math.sqrt(M)) + 1)}>${M}$ donc il suffit d'arrêter la recherche de facteurs à $${Math.trunc(Math.sqrt(M))}$.`
          if (this.correctionDetaillee) {
            context.isHtml
              ? (texteCorr += '<hr>')
              : (texteCorr += '\\par \\hrulefill \\par')
            texteCorr += `$\\textbf{Preuve du propos précédent}$ <br>
            Supposons que $${M}$ soit le produit de deux entiers $p \\times q$ avec $p < q$ :`
            if (context.isHtml) {
              texteCorr += `<br>- si $ p\\times p > ${M}$, c'est que $q \\times q < ${M}$, sinon $p \\times q$ ne peut être égal à $${M}$.<br>
              - mais, dans ce cas, $p$ serait supérieur à $q$ sinon $p \\times q$ serait inférieur à $${M}$ ce qui ne doit pas être le cas.<br>`
            } else {
              texteCorr += `\\begin{itemize}
              \\item si $p \\times p > ${M}$, c'est que $q \\times q < ${M}$, sinon $p \\times q$ ne peut être égal à $${M}$.
              \\item mais, dans ce cas, $p$ serait supérieur à $q$ sinon $p \\times q$ serait inférieur à $${M}$ ce qui ne doit pas être le cas.
              \\end{itemize}`
            }
            texteCorr += `Donc il est bien suffisant d'arrêter la recherche lorsque le carré de $p$ dépasse $${M}$.`
            context.isHtml
              ? (texteCorr += '<hr>')
              : (texteCorr += '\\par \\hrulefill \\par')
          }
          context.isHtml ? (texteCorr += '<br>') : (texteCorr += '\\par')
          if (listeDiviseursM.length % 2 === 0) {
            // si il y a un nombre pair de diviseurs
            for (let m = 0; m < listeDiviseursM.length / 2; m++) {
              texteCorr +=
                '$' +
                listeDiviseursM[m] +
                '\\times' +
                listeDiviseursM[listeDiviseursM.length - m - 1] +
                ` = ${M}$<br>`
            }
          } else {
            for (let m = 0; m < (listeDiviseursM.length - 1) / 2; m++) {
              texteCorr +=
                '$' +
                listeDiviseursM[m] +
                '\\times' +
                listeDiviseursM[listeDiviseursM.length - m - 1] +
                ` = ${M}$<br>`
            }
            texteCorr +=
              '$' +
              listeDiviseursM[(listeDiviseursM.length - 1) / 2] +
              '\\times' +
              listeDiviseursM[(listeDiviseursM.length - 1) / 2] +
              ` = ${M}$<br>`
          }
          texteCorr += `Chacun des facteurs de la liste ci-dessus est un diviseur de $${M}$.<br>`
          texteCorr += `Les diviseurs de $${M}$ sont donc `
          texteCorr += `$${miseEnEvidence('1')}$`
          for (let w = 1; w < listeDiviseursM.length - 1; w++) {
            texteCorr += ` ; $${miseEnEvidence(listeDiviseursM[w])}$ `
          }

          texteCorr += ` et $${miseEnEvidence(listeDiviseursM[listeDiviseursM.length - 1])}$.`
          break
      }

      if (this.questionJamaisPosee(i, typeDeQuestion, texte)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
  }
}
