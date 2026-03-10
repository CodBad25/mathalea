import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice, shuffle } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { fraction } from '../../../modules/fractions'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer une probabilité'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

*/
export const uuid = '47142'

export const refs = {
  'fr-fr': ['can3S01', 'BP2FLUC15', '3AutoP01-2'],
  'fr-ch': ['3mP-5'],
}
export default class CalculProbaSimple extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.versionQcmDisponible = true
  }

  nouvelleVersion() {
    const parfums = [
      'au citron',
      'à la fraise',
      'à la menthe',
      "à l'orange",
      'à la cerise',
      'à la framboise',
      'au cassis',
    ]

    const situations = [
      {
        key: 'bonbons',
        start: 'Un sachet de bonbons contient',
        itemSing: 'bonbon',
        itemPlur: 'bonbons',
        type: 'flavour',
        labels: parfums,
      },
      {
        key: 'eleves',
        start: 'On choisit au hasard un élève dans un groupe composé de',
        itemSing: 'élève',
        itemPlur: 'élèves',
        type: 'fixed',
        lab1Sing: 'fille',
        lab1Plur: 'filles',
        lab2Sing: 'garçon',
        lab2Plur: 'garçons',
      },
      {
        key: 'livres',
        start: 'On choisit un livre au hasard sur un étal présentant',
        itemSing: 'un livre',
        itemPlur: '',
        type: 'fixed',
        lab1Sing: 'roman historique',
        lab1Plur: 'romans historiques',
        lab2Sing: 'thriller',
        lab2Plur: 'thrillers',
        lab3Sing: 'romance',
        lab3Plur: 'romances',
        lab4Sing: "roman d'anticipation",
        lab4Plur: "romans d'anticipation",
        lab5Sing: 'roman de fantasy',
        lab5Plur: 'romans de fantasy',
        lab6Sing: 'polar',
        lab6Plur: 'polars',
      },
      {
        key: 'films',
        start: "On choisit un film au hasard parmi ceux à l'affiche proposant",
        itemSing: 'un film',
        itemPlur: '',
        type: 'fixed',
        lab1Sing: 'comédie',
        lab1Plur: 'comédies',
        lab2Sing: 'drame',
        lab2Plur: 'drames',
        lab3Sing: "film d'action",
        lab3Plur: "films d'actions",
        lab4Sing: 'film de science-fiction',
        lab4Plur: 'films de science-fictions',
        lab5Sing: 'thriller',
        lab5Plur: 'thrillers',
      },
      {
        key: 'urne',
        start: 'On tire une boule au hasard dans une urne contenant',
        itemSing: 'boule',
        itemPlur: 'boules',
        type: 'fixed',
        lab1Sing: 'noire',
        lab1Plur: 'noires',
        lab2Sing: 'blanche',
        lab2Plur: 'blanches',
      },
      {
        key: 'cartes',
        start: 'On tire une carte au hasard dans un paquet contenant',
        itemSing: 'carte',
        itemPlur: 'cartes',
        type: 'fixed',
        lab1Sing: 'rouge',
        lab1Plur: 'rouges',
        lab2Sing: 'verte',
        lab2Plur: 'vertes',
      },
      {
        key: 'tickets',
        start: 'On choisit un ticket au hasard parmi',
        itemSing: 'ticket',
        itemPlur: 'tickets',
        type: 'fixed',
        lab1Sing: 'gagnant',
        lab1Plur: 'gagnants',
        lab2Sing: 'perdant',
        lab2Plur: 'perdants',
      },
      {
        key: 'billes',
        start: 'On prend au hasard une bille dans un sac contenant',
        itemSing: 'bille',
        itemPlur: 'billes',
        type: 'fixed',
        lab1Sing: 'claire',
        lab1Plur: 'claires',
        lab2Sing: 'foncée',
        lab2Plur: 'foncées',
      },
    ]

    const situ = choice(situations)
    const a = randint(3, 10)
    const k = choice([3, 4, 9])

    let label1Sing: string,
      label2Sing: string,
      label1Plur: string,
      label2Plur: string
    let displayLabel1: string, displayLabel2: string

    if (situ.type === 'flavour' && Array.isArray((situ as any).labels)) {
      // cas bonbons / livres / films : choisir deux étiquettes distinctes
      const labels = (situ as any).labels as string[]
      displayLabel1 = choice(labels)
      do {
        displayLabel2 = choice(labels)
      } while (displayLabel2 === displayLabel1)
      label1Sing = displayLabel1
      label2Sing = displayLabel2
      label1Plur = displayLabel1
      label2Plur = displayLabel2
    } else {
      label1Sing = situ.lab1Sing ?? ''
      label2Sing = situ.lab2Sing ?? ''
      label1Plur = situ.lab1Plur ?? ''
      label2Plur = situ.lab2Plur ?? ''
      displayLabel1 = situ.lab1Sing ?? ''
      displayLabel2 = situ.lab2Sing ?? ''
    }

    // choisir aléatoirement si la question porte sur la première ou la seconde étiquette
    const ciblePremiere = choice([true, false])
    const cibleLabelSing = ciblePremiere ? label1Sing : label2Sing

    // construction d'une phrase naturelle pour la cible (heuristique)
    const construitPhraseCible = (
      situ: any,
      itemSing: string,
      labelSing: string,
    ) => {
      if (!labelSing) return ''
      // si l'étiquette contient déjà un article ou une préposition appropriée -> l'utiliser telle quelle
      if (/^(un |une |au |à |aux )/i.test(labelSing)) return labelSing
      // pour les situations "personnes" ou types (élèves, livres, films) : préférer "un/une + label"
      if (
        ['eleves', 'livres', 'films', 'cartes', 'tickets'].includes(situ.key)
      ) {
        // heuristique simple pour l'article : mot finissant par 'e' ou commençant par voyelle => 'une' sinon 'un'
        const article =
          /^[aeiouàéèùyâêîôûh]/i.test(labelSing) || /e$/i.test(labelSing)
            ? 'une'
            : 'un'
        return `${article} ${labelSing}`
      }
      // sinon : utiliser "un/une itemSing label" (utile pour 'bille claire', 'bonbon au citron' ...)
      const articleItem = /e$/.test(itemSing) ? 'une' : 'un'
      return `${articleItem} ${itemSing} ${labelSing}`
    }

    const ciblePhrase = construitPhraseCible(
      situ,
      situ.itemSing,
      cibleLabelSing,
    )

    // déterminer la bonne réponse selon que la cible soit la 1ère ou la 2ème étiquette
    const numCorrect = ciblePremiere ? a : k * a
    const denomTotal = a + k * a
    const correctTexSimpl = fraction(
      numCorrect,
      denomTotal,
    ).texFractionSimplifiee
    this.reponse = `$${fraction(numCorrect, denomTotal).texFraction}$`

    // Construction de l'énoncé en utilisant les formes plurielles pour les quantités
    this.question = `${situ.start} $${a}$ ${situ.itemPlur} ${label1Plur} et $${k * a}$ ${situ.itemPlur} ${label2Plur}.<br>
     On choisit ${situ.itemSing} au hasard. <br>
Quelle est la probabilité de choisir ${ciblePhrase} ?`

    this.correction = this.versionQcm
      ? `Il y a en tout : $${a} + ${k * a} = ${denomTotal}$ ${situ.itemPlur}.<br>La probabilité de choisir ${ciblePhrase} est de $${miseEnEvidence(`\\dfrac{${numCorrect}}{${denomTotal}}`)}$.`
      : `Il y a en tout : $${a} + ${k * a} = ${denomTotal}$ ${situ.itemPlur}.<br>La probabilité de choisir ${ciblePhrase} est de $${miseEnEvidence(`\\dfrac{${numCorrect}}{${denomTotal}}`)}$ ou $${miseEnEvidence(correctTexSimpl)}$.`

    // Version QCM : distracteurs plausibles
    if (this.versionQcm) {
      const correctTex = correctTexSimpl
      const candidates: string[] = []

      // erreurs/alternatives courantes adaptées à la cible
      // erreur plausible : confondre a*(k+1) avec a + k
      candidates.push(fraction((k - 1) * a, k * a).texFraction)
      // complémentaire (1 - p)
      candidates.push(
        fraction(denomTotal - (ciblePremiere ? k * a : a), k * a).texFraction,
      )
      // oublier le facteur k (si cible = 2ème étiquette on peut confondre num / a)
      const otherNum = ciblePremiere ? k * a : a
      candidates.push(fraction(otherNum, denomTotal).texFraction) // confondre les deux catégories
      // erreurs arithmétiques courantes
      /*  if (numCorrect > 1)
        candidates.push(
          fraction(numCorrect - 1, denomTotal).texFractionSimplifiee,
        )
      candidates.push(
        fraction(numCorrect + 1, denomTotal).texFractionSimplifiee,
      )
*/
      // filtrer, dédupliquer et retirer la bonne réponse, puis choisir 3 distracteurs
      const uniq = Array.from(
        new Set(candidates.filter((s) => s && s !== correctTex)),
      )
      const picked = shuffle(uniq).slice(0, 3)
      this.distracteurs = picked.map((s) => `$${s}$`)
    }
  }
}
