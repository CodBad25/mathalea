import Decimal from 'decimal.js'
import { droiteGraduee } from '../../../lib/2d/DroiteGraduee'
import { bleuMathalea } from '../../../lib/colors'
import { texPrix } from '../../../lib/format/style'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import {
  handleAnswers,
  setReponse,
} from '../../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../../lib/interactif/questionMathLive'
import { choice, shuffle } from '../../../lib/outils/arrayOutils'
import { arrondi } from '../../../lib/outils/nombres'
import { sp } from '../../../lib/outils/outilString'
import { pgcd } from '../../../lib/outils/primalite'
import { texNombre } from '../../../lib/outils/texNombre'
import FractionEtendue from '../../../modules/FractionEtendue'
import Grandeur from '../../../modules/Grandeur'
import Hms from '../../../modules/Hms'
import { mathalea2d } from '../../../modules/mathalea2d'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../../modules/outils'
import Exercice from '../../Exercice'

export const dateDeModifImportante = '11/09/2024'
export const dateDePublication = '5/08/2021'
export const titre = 'Course aux nombres fin de 6e'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * Course aux nombres avec 30 questions pour fin de 6e
 * @author Jean-claude Lhote
 */

export const uuid = '3a526'

export const refs = {
  'fr-fr': ['can6a-CoopMaths'],
  'fr-ch': [],
}
export default class CourseAuxNombres6e extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
      'Choix des questions',
      ` Nombres séparés par des tirets :\n1 : Moitié et double
2 : Quotient de a par b
3 : Somme astucieuse de 4 nombres entiers
4 : Somme de deux décimaux avec retenue
5 : Double ou triple d'un nombre entier
6 : Double ou triple d'un nombre décimal
7 : Recomposition d'un entier
8 : Tables de multiplication
9 : Soustraire un nombre se finissant par 9
10 :  Le quart ou le tiers d'un nombre
11 :  Recomposer un nombre à partir d'un nombre de centaines et d'un nombre d'unités
12 :  Recomposer une nombre avec chevauchement
13 :  Conversion heures et minutes
14 :  Reste de la division par 3
15 :  Une division par 9 qui tombe juste
16 :  Ajouter un nombre de la forme 10n+9
17 :  Multiplie astucieusment
18 :  Addition à trou
19 :  Nombre pair de 2 chiffres par 5
20 :  Proportionnalité simple
21 :  Ordre de grandeur
22 :  Conversion cm -> m
23 :  Fraction 1/n d'une quantité de L
24 :  Reste de la division euclidienne
25 :  Ordre de grandeur : hauteurs
26 :  Appliquer un pourcentage
27 :  Calcul de distance à vitesse constante
28 :  Comparaison de périmètre
29 :  Repérage fraction
30 :  Proportionnalité par linéarité
31 :  Mélange`,
    ]
    this.nbQuestions = 30
    this.nbCols = 2 // Uniquement pour la sortie LaTeX
    this.nbColsCorr = 2 // Uniquement pour la sortie LaTeX
    this.sup = '31'
  }

  nouvelleVersion() {
    let a, b, c, d, resultat, propositions

    let listeIndex
    // Si la saisie contient des numéros spécifiques (pas 31 = toutes les questions),
    // chaque question ne doit apparaître qu'une seule fois.
    const saisie =
      typeof this.sup === 'string' && this.sup !== '' ? this.sup : '31'
    const valeurs = String(saisie)
      .split('-')
      .map((v) => parseInt(v.trim()))
      .filter((v) => !isNaN(v))
    if (valeurs.length >= 1 && !valeurs.includes(31)) {
      // Sélection manuelle : chaque question une seule fois
      listeIndex = Array.from(new Set(valeurs))
        .map((n) => n > 0 && n < 31)
        .map((n) => n - 1)
      this.nbQuestions = listeIndex.length
    } else {
      // 31 = toutes les questions (comportement par défaut)
      listeIndex = gestionnaireFormulaireTexte({
        saisie: this.sup,
        max: 30,
        melange: 31,
        defaut: 31,
        nbQuestions: this.nbQuestions,
        shuffle: false,
      }).map((index) => Number(index) - 1)
    }
    const fruits = [
      ['pêches', 4, 10, 30],
      ['noix', 5, 4, 13],
      ['cerises', 6, 11, 20],
      ['pommes', 2, 20, 40],
      ['framboises', 15, 1, 5],
      ['fraises', 7, 5, 10],
      ['citrons', 1.5, 15, 30],
      ['bananes', 1.5, 15, 25],
    ]
    const hauteurs = [
      ['chaise', 75, 115, 'cm'],
      ['grue', 120, 250, 'dm'],
      ['tour', 50, 180, 'm'],
      ['girafe', 40, 50, 'dm'],
      ['coline', 75, 150, 'm'],
    ]
    const typeQuestionsDisponibles = [
      'q1', // On donne le double d'un nombre et on demande sa moitié
      'q2', // On demande le nombre qui, multiplié par a donne b (3 type de réponses acceptés : décimale, fractionnaire ou a+b/c)
      'q3', // Somme astucieuse de 4 nombres entiers
      'q4', // Somme de deux décimaux avec retenue
      'q5', // Double ou triple d'un nombre entier de 2 chiffres
      'q6', // Double ou triple d'un nombre décimal
      'q7', // Recomposition d'un entier
      'q8', // tables de multiplication
      'q9', // soustraire un nombre se finissant par 9
      'q10', // Le quart ou le tiers d'un nombre.
      'q11', // Recomposer un nombre à partir d'un nombre de centaines et d'un nombre d'unités
      'q12', // Recomposer une nombre avec chevauchement.
      'q13', // conversion heures et minutes
      'q14', // Reste de la division par 3
      'q15', // Une division par 9 qui tombe juste
      'q16', // ajouter un nombre de la forme 10n+9
      'q17', // multiplier astucieusement
      'q18', // addition à trou
      'q19', // Nombre pair de 2 chiffres × 2
      'q20', // Proportionnalité simple
      'q21', // Ordre de grandeur
      'q22', // Conversion cm -> m
      'q23', // Fraction 1/n d'une quantité de L
      'q24', // Reste de la division euclidienne
      'q25', // Ordre de grandeur : hauteurs
      'q26', // Appliquer un pourcentage
      'q27', // Calcul de distance à vitesse constante
      'q28', // Comparaison de périmètre
      'q29', // Repérage fraction
      'q30', // Proportionnalité par linéarité
    ] // On créé 3 types de questions
    for (
      let i = 0, q = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // Boucle principale où i+1 correspond au numéro de la question
      switch (
        typeQuestionsDisponibles[listeIndex[i]] // Suivant le type de question, le contenu sera différent
      ) {
        case 'q1':
          a = randint(1, 25)
          texte = `Le double d'un nombre vaut ${2 * a}, combien vaut sa moitié ?`
          texteCorr = `Le nombre est ${a}, sa moitié est $${texNombre(a / 2)}$.`
          setReponse(this, q, a / 2)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q2':
          a = randint(2, 25)
          b = randint(2, 25, a)
          a = a / pgcd(a, b)
          b = b / pgcd(a, b)
          c = new FractionEtendue(a, b)
          resultat = a / b
          texte = `Quel est le nombre qui, multiplié par ${b} donne ${a} ?`
          texteCorr = `C'est $${c.texFraction}$ car $${c.texFraction}\\times ${b} = ${a}$`
          if (!c.valeurDecimale) {
            setReponse(this, q, [
              c.texFraction,
              `${Math.floor(a / b)}+\\dfrac{${a % b}}{${b}}`,
            ])
          } else {
            setReponse(this, q, [
              c.texFraction,
              resultat,
              `${Math.floor(a / b)}+\\dfrac{${a % b}}{${b}}`,
            ])
          }
          texte += ajouteChampTexteMathLive(
            this,
            q,
            KeyboardType.clavierDeBaseAvecFraction,
          )
          break
        case 'q3':
          a = randint(1, 9)
          b = randint(1, 9, a)
          c = randint(3, 7) * 10
          d = randint(10, 15) * 10 - c
          resultat = 2 * (c + d)
          texte = `$${c - a} + ${d + b} + ${c + a} + ${d - b}$`
          texteCorr = `$${c - a} + ${c + a} + ${d + b}  + ${d - b} = ${2 * c} + ${2 * d}= ${2 * (c + d)}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q4':
          a = randint(1, 9)
          b = randint(1, 9, a)
          c = randint(1, 9, [a, b])
          d = randint(1, 9, [a, b, c])
          resultat = arrondi(10 + (b + d) * 0.1 + c * 0.01)
          texte = `$${texNombre(a + b * 0.1 + c * 0.01)}+${texNombre(10 - a + d * 0.1)}$`
          texteCorr = `$${texNombre(a + b * 0.1 + c * 0.01)}+${texNombre(10 - a + d * 0.1)}=${texNombre(10 + (b + d) * 0.1 + c * 0.01)}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q5':
          a = randint(1, 3)
          b = randint(1, 9, a)
          c = a * 10 + b
          if (choice([true, false])) {
            resultat = 3 * c
            texte = `Quel est le triple de $${texNombre(c)}$ ?`
            texteCorr = `Le triple de $${texNombre(c)}$ est $3 \\times ${texNombre(c)}=${texNombre(3 * c)}$.`
          } else {
            resultat = 2 * c
            texte = `Quel est le double de $${texNombre(c)}$ ?`
            texteCorr = `Le double de $${texNombre(c)}$ est $2 \\times ${texNombre(c)}=${texNombre(2 * c)}$.`
          }
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q6':
          a = randint(1, 3)
          b = randint(1, 9, a)
          d = randint(1, 9)
          c = a * 10 + b + d * 0.1
          if (choice([true, false])) {
            resultat = 3 * c
            texte = `Quel est le triple de $${texNombre(c)}$ ?`
            texteCorr = `Le triple de $${texNombre(c)}$ est $3 \\times ${texNombre(c)}=${texNombre(3 * c)}$.`
          } else {
            resultat = 2 * c
            texte = `Quel est le double de $${texNombre(c)}$ ?`
            texteCorr = `Le double de $${texNombre(c)}$ est $2 \\times ${texNombre(c)}=${texNombre(2 * c)}$.`
          }
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q7':
          a = randint(1, 3)
          b = randint(1, 9, a)
          c = randint(1, 9, [a, b])
          resultat = a * 1000 + b * 10 + c * 100
          texte = `$${texNombre(a)}\\times 1000 + ${texNombre(b)}\\times 10 + ${texNombre(c)}\\times 100$`
          texteCorr = `$${texNombre(a)}\\times 1000 + ${texNombre(b)}\\times 10 + ${texNombre(c)}\\times 100 =${texNombre(resultat)}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q8':
          a = randint(5, 9)
          b = randint(5, 9)
          resultat = a * b
          texte = `$${a} \\times ${b}$`
          texteCorr = `$${a} \\times ${b}=${a * b}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q9':
          a = randint(5, 9)
          b = randint(2, 8)
          c = randint(1, 3)
          resultat = a * 10 + b - c * 10 - 9
          texte = `$${a * 10 + b} - ${c * 10 + 9}$`
          texteCorr = `$${a * 10 + b} - ${c * 10 + 9}=${a * 10 + b}-${(c + 1) * 10} + 1 = ${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q10':
          a = randint(5, 15)
          if (choice([true, false])) {
            b = a * 8
            resultat = a * 2
            texte = `Quel est le quart de $${b}$ ?`
            texteCorr = `Le quart de $${b}$ est $${a * 2}$.`
            setReponse(this, q, resultat)
          } else {
            b = a * 6
            resultat = a * 2
            texte = `Quel est le tiers de $${b}$ ?`
            texteCorr = `Le tiers de $${b}$ est $${a * 2}$.`
            setReponse(this, q, resultat)
          }
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q11':
          a = randint(20, 70)
          b = randint(20, 70, a)
          resultat = a * 100 + b
          texte = `$${a}$ centaines et $${b}$ unités = `
          texteCorr = `$${a} \\times 100 + ${b} = ${a * 100 + b}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q12':
          a = randint(20, 70)
          b = randint(20, 70, a)
          resultat = a * 100 + b * 10
          texte = `$${a}$ centaines et $${b}$ dizaines = `
          texteCorr = `$${a} \\times 100 + ${b} \\times 10 = ${a * 100 + b * 10}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q13':
          a = randint(2, 4)
          b = randint(10, 59)
          d = a * 60 + b
          texte = `Convertir $${d}$ minutes en heures et minutes (format : ... h ...min)`
          texteCorr = `$${d} = ${a} \\times 60 + ${b}$ donc $${d}$ minutes = $${a}$h $${b}$min`
          resultat = new Hms({ hour: a, minute: b })
          handleAnswers(this, q, {
            reponse: { value: resultat.toString(), options: { HMS: true } },
          })
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierHms)
          break
        case 'q14':
          b = randint(1, 9)
          c = randint(0, 9)
          d = randint(0, 9, [b, c])
          a = b * 100 + c * 10 + d
          resultat = a % 3
          texte = `Quel est le reste de la division de $${a}$ par $3$ ?`
          texteCorr = `Le reste de la division de $${a}$ par $3$ est $${a % 3}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q15':
          b = randint(5, 9)
          a = b * 90 + 9
          resultat = b * 10 + 1
          texte = `$${a}\\div 9$`
          texteCorr = `$${a}\\div 9 = ${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q16':
          a = randint(5, 9)
          b = randint(2, 8)
          c = randint(1, 3)
          resultat = a * 10 + b + c * 10 + 9
          texte = `$${a * 10 + b} + ${c * 10 + 9}$`
          texteCorr = `$${a * 10 + b} + ${c * 10 + 9}=${a * 10 + b}+${(c + 1) * 10} - 1 = ${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q17': {
          a = randint(1, 9)
          b = randint(1, 9, a)
          const bDiv10 = new Decimal(b).div(10)
          c = randint(1, 9, [a, b])
          const cDiv100 = new Decimal(c).div(100)
          d = new Decimal(a).add(bDiv10).add(cDiv100)

          resultat = new Decimal(d).mul(100)
          switch (choice([1, 2, 3, 4])) {
            case 1:
              texte = `$4 \\times ${texNombre(d)}\\times 25$`
              texteCorr = `$4 \\times ${texNombre(d)}\\times 25 = 100 \\times ${texNombre(d)} = ${resultat}$`
              break
            case 2:
              texte = `$2 \\times ${texNombre(d)}\\times 50$`
              texteCorr = `$2 \\times ${texNombre(d)}\\times 50 = 100 \\times ${texNombre(d)} = ${resultat}$`
              break
            case 3:
              texte = `$25 \\times ${texNombre(d)}\\times 4$`
              texteCorr = `$25 \\times ${texNombre(d)}\\times 4 = 100 \\times ${texNombre(d)} = ${resultat}$`
              break
            case 4:
              texte = `$50 \\times ${texNombre(d)}\\times 2$`
              texteCorr = `$50 \\times ${texNombre(d)}\\times 2 = 100 \\times ${texNombre(d)} = ${resultat}$`
              break
          }
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        }
        case 'q18':
          a = randint(5, 9)
          b = randint(6, 9)
          c = randint(1, 5)
          d = randint(1, 4)
          resultat = d * 10 + b
          texte = `$${c * 10 + a} + \\dots = ${(c + d) * 10 + b + a}$`
          texteCorr = `$${(c + d) * 10 + b + a} - ${c * 10 + a} = ${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q19':
          a = randint(11, 24) * 2
          resultat = a * 5
          texte = `$${a}\\times 5$`
          texteCorr = `$${a}\\times 5 = ${a} \\div 2 \\times 10 = ${a / 2}\\times 10 =${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q20':
          a = randint(0, 7)
          b = fruits[a][1]
          c = randint(fruits[a][2], fruits[a][3])
          resultat = arrondi((c / 5) * b)
          texte = `$${texNombre(c / 10)}$ kg de ${fruits[a][0]} coûtent $${texNombre((c / 10) * b)}$ €, combien coûtent $${texNombre(c / 5)}$ kg de ${fruits[a][0]} ?`
          texteCorr = `$${texNombre((c / 10) * b)} \\times 2 = ${texNombre(resultat)}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, '', { texteApres: '€' })
          break
        case 'q21':
          a = randint(3, 7)
          b = randint(2, 9)
          c = randint(1, 9)
          d = randint(5, 9)
          resultat = (a * 100 + b * 10 + c) * d
          texte = `$${texNombre(a * 100 + b * 10 + c)}\\times ${d}$<br> Choisis la bonne réponse sans effectuer précisément le calcul<br>`
          propositions = shuffle([
            `$${texNombre(resultat)}$`,
            `$${texNombre(d * 1000 + a * 100 + b * 10 + c)}$`,
            `$${texNombre((a * 1000 + b * 100 + c) * d)}$`,
          ])
          texte += `${propositions[0]} ${sp(4)} ${propositions[1]} ${sp(4)} ${propositions[2]}`
          texteCorr = `$${texNombre(a * 100 + b * 10 + c)} \\times ${d} = ${texNombre(resultat)}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q22':
          a = randint(11, 24) * 10 + randint(0, 9)
          resultat = arrondi(a / 100)
          texte = `$${a}\\text{ cm}$ font combien de mètres ?`
          texteCorr = `$${a}\\text{ cm} = ${texNombre(resultat)}\\text{ m}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(
            this,
            q,
            KeyboardType.clavierDeBase,
            { texteApres: '$\\text{ m}$' },
          )
          break
        case 'q23':
          a = randint(3, 5)
          resultat = randint(2, 9) * 10
          b = resultat * a
          texte = `$\\dfrac{1}{${a}} \\text{ de } ${b} \\text{ L} = \\dots \\text{ L}$`
          texteCorr = `$\\dfrac{1}{${a}}$ de $${b}$ L = ${resultat} L`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q24':
          a = randint(7, 9)
          b = randint(1, a - 1)
          d = randint(5, 9)
          c = d * a + b
          resultat = c % a
          texte = `Je possède ${c} bonbons et je fabrique des sacs de ${a} bonbons. Une fois mes sacs complétés, combien me restera-t-il de bonbons ?`
          texteCorr = `$${c}=${d}\\times ${a} + ${b}$, donc il me restera $${b}$ bonbons.`
          setReponse(this, q, b)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q25':
          a = randint(0, 4)
          b = randint(hauteurs[a][1], hauteurs[a][2])
          propositions = shuffle([
            `$${b}\\text{ m}$`,
            `$${b}\\text{ dm}$`,
            `$${b}\\text{ cm}$`,
          ])
          texte = `Choisis parmi les propositions suivantes la hauteur d'une ${hauteurs[a][0]} (nombre et unité)<br>`
          texte += `${propositions[0]} ${sp(4)} ${propositions[1]} ${sp(4)} ${propositions[2]}`
          texteCorr = `La hauteur d'une ${hauteurs[a][0]} est ${b} ${hauteurs[a][3]}`
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.longueur)
          setReponse(this, q, new Grandeur(b, hauteurs[a][3]), {
            formatInteractif: 'unites',
          })
          break
        case 'q26':
          a = randint(2, 9) * 10
          b = randint(2, 9, a) * 10
          resultat = (a * b) / 100
          texte = `$${a}\\%$ de $${b}$`
          texteCorr = `$${a}\\%$ de $${b} = ${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(this, q, KeyboardType.clavierDeBase)
          break
        case 'q27':
          a = randint(3, 6) * 20
          b = randint(1, 3)
          resultat = a * (b + 0.5)
          texte = `Une voiture roule à une vitesse constante de ${a} km/h. Combien de kilomètres parcourt-elle en $${b}$ h et 30 min ?`
          texteCorr = `$${a}\\times ${texNombre(b + 0.5)} = ${resultat}$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(
            this,
            q,
            KeyboardType.clavierDeBase,
            { texteApres: '$\\text{ km}$' },
          )
          break
        case 'q28':
          a = randint(3, 9)
          b = randint(0, 1)
          texte = `Est-il vrai qu'un carré de côté $${a}$ cm a le même périmètre qu'un rectangle de largeur $${a - b}$ cm et de longueur $${a + 1}$ cm ? (V ou F)`
          if (b === 0) {
            texteCorr = `Faux car $4\\times ${a}\\text{ cm}$ $\\neq 2\\times ${a}\\text{ cm}$ $+ 2\\times ${a + 1}\\text{ cm}$.`
            setReponse(this, q, 'F', { formatInteractif: 'ignorerCasse' })
          } else {
            texteCorr = `Vrai car $4\\times ${a}\\text{ cm}$ $= 2\\times ${a - 1}\\text{ cm}$ $+ 2\\times ${a + 1}\\text{ cm}$ $= ${4 * a}\\text{ cm}$.`
            setReponse(this, q, 'V', { formatInteractif: 'ignorerCasse' })
          }
          texte += ajouteChampTexteMathLive(
            this,
            q,
            KeyboardType.clavierDeBaseAvecVariable,
          )
          break
        case 'q29':
          a = randint(3, 5) // dénominateur
          b = randint(2, a * 4 - 1) // numérateur
          c = new FractionEtendue(b, a)
          resultat = b / a

          texte =
            "Déterminer l'abscisse du point A situé ci-dessous :<br>" +
            mathalea2d(
              {
                xmin: -1,
                ymin: -1,
                xmax: 14,
                ymax: 1.5,
                scale: 0.5,
              },
              droiteGraduee({
                Unite: 3,
                Min: 0,
                Max: 4.2,
                x: 0,
                y: 0,
                thickSecDist: 1 / a,
                thickSec: true,
                thickoffset: 0,
                axeStyle: '|->',
                pointListe: [[b / a, 'A']],
                pointCouleur: bleuMathalea,
                pointStyle: 'x',
                labelsPrincipaux: true,
                step1: 1,
                step2: 1,
              }),
            )
          texteCorr = `L'abscisse du point A est $\\dfrac{${b}}{${a}}$`
          if (a === 3) {
            setReponse(this, q, [
              c.texFraction,
              `${Math.floor(a / b)}+\\dfrac{${a % b}}{${b}}`,
            ])
          } else {
            setReponse(this, q, [
              c.texFraction,
              resultat,
              `${Math.floor(a / b)}+\\dfrac{${a % b}}{${b}}`,
            ])
          }
          texte += ajouteChampTexteMathLive(
            this,
            q,
            KeyboardType.clavierDeBaseAvecFraction,
          )
          break
        case 'q30':
          a = randint(1, 7) // index du fruit
          b = fruits[a][1] * (1 + choice([-1, 1]) * randint(1, 3) * 0.1) // prix au kg
          c = Math.ceil(randint(fruits[a][2], fruits[a][3]) / 10) // nombre de kg première valeur
          d = randint(3, 6) // nombre de kg supplémentaires
          resultat = d * b
          texte = `$${c}$ kg de ${fruits[a][0]} coûtent $${texPrix(c * b)}$ €.<br> $${c + d}$ kg de ces mêmes ${fruits[a][0]} coûtent $${texPrix((c + d) * b)}$ €.<br>Combien coûtent ${d} kg de ces ${fruits[a][0]} ?`
          texteCorr = `$${texPrix((c + d) * b)} € - ${texPrix(c * b)} € =${texPrix(resultat)} €$`
          setReponse(this, q, resultat)
          texte += ajouteChampTexteMathLive(
            this,
            q,
            KeyboardType.clavierDeBase,
            { texteApres: '€' },
          )
          break
      }

      if (this.questionJamaisPosee(i, a, b, c, listeIndex[i])) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        q++
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
