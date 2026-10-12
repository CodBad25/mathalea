import { bleuMathalea } from '../../lib/colors'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { toutPourUnPoint } from '../../lib/interactif/fonctionsBaremes'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import {
  ajouteChampTexteMathLive,
  remplisLesBlancs,
} from '../../lib/interactif/questionMathLive'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../lib/outils/embellissements'
import { listeDesDiviseurs, pgcd } from '../../lib/outils/primalite'
import { texNombre } from '../../lib/outils/texNombre'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Résoudre un problème de répartition avec le plus grand diviseur commun'
export const interactifReady = true

export const dateDePublication = '12/10/2026'
export const uuid = '90bbe'
export const refs = {
  'fr-fr': ['3A10-8'],
  'fr-ch': ['10NO1A-8'],
}

/**
 * Répartir deux effectifs en groupes identiques : liste des diviseurs de chaque effectif,
 * plus grand diviseur commun, nombre maximal de groupes puis composition d'un groupe.
 * Les effectifs sont de la forme k×a et k×b avec a et b premiers entre eux et supérieurs à 5,
 * pour que le PGCD ne se lise pas directement sur les deux nombres.
 * @author Rémi Angot
 */

type Situation = {
  qui: string
  faitQuoi: string
  ou: string
  pourQui: string
  objet1: string
  objet2: string
  groupement: string
  groupements: string
  deGroupements: string
}

const situations: Situation[] = [
  {
    qui: 'professeur',
    faitQuoi: 'organise une sortie scolaire',
    ou: 'au Futuroscope',
    pourQui: 'pour ses élèves de 3e',
    objet1: 'garçons',
    objet2: 'filles',
    groupement: 'groupe',
    groupements: 'groupes',
    deGroupements: 'de groupes',
  },
  {
    qui: 'fleuriste',
    faitQuoi: 'assemble des fleurs',
    ou: 'dans son atelier',
    pourQui: 'pour une commande',
    objet1: 'roses',
    objet2: 'tulipes',
    groupement: 'bouquet',
    groupements: 'bouquets',
    deGroupements: 'de bouquets',
  },
  {
    qui: 'pâtissier',
    faitQuoi: 'prépare des gâteaux',
    ou: 'dans sa pâtisserie',
    pourQui: 'pour un mariage',
    objet1: 'gâteaux au chocolat',
    objet2: 'gâteaux à la vanille',
    groupement: 'plat',
    groupements: 'plats',
    deGroupements: 'de plats',
  },
  {
    qui: 'boulanger',
    faitQuoi: 'cuit des viennoiseries',
    ou: 'dans sa boulangerie',
    pourQui: 'pour ses clients',
    objet1: 'brioches',
    objet2: 'croissants',
    groupement: 'assortiment',
    groupements: 'assortiments',
    deGroupements: 'd’assortiments',
  },
  {
    qui: 'collectionneur',
    faitQuoi: 'organise sa collection',
    ou: 'dans un musée',
    pourQui: 'pour une exposition',
    objet1: 'soldats de plomb',
    objet2: 'figurines en plastique',
    groupement: 'vitrine',
    groupements: 'vitrines',
    deGroupements: 'de vitrines',
  },
  {
    qui: 'producteur',
    faitQuoi: 'plante des arbres',
    ou: 'dans son terrain',
    pourQui: 'pour son entreprise',
    objet1: 'pommiers',
    objet2: 'poiriers',
    groupement: 'allée',
    groupements: 'allées',
    deGroupements: 'd’allées',
  },
  {
    qui: 'maître-nageur',
    faitQuoi: 'organise des cours de natation',
    ou: 'à la piscine',
    pourQui: 'pour ses élèves',
    objet1: 'garçons',
    objet2: 'filles',
    groupement: 'groupe',
    groupements: 'groupes',
    deGroupements: 'de groupes',
  },
  {
    qui: 'cuisinier',
    faitQuoi: 'prépare des plats',
    ou: 'dans sa cuisine',
    pourQui: 'pour un banquet',
    objet1: 'portions de viande',
    objet2: 'portions de légume',
    groupement: 'plat',
    groupements: 'plats',
    deGroupements: 'de plats',
  },
  {
    qui: 'décorateur',
    faitQuoi: 'fait des compositions florales',
    ou: 'dans son atelier',
    pourQui: 'pour un mariage',
    objet1: 'fleurs rouges',
    objet2: 'fleurs blanches',
    groupement: 'bouquet',
    groupements: 'bouquets',
    deGroupements: 'de bouquets',
  },
]

const couplesPremiersEntreEux = [
  [5, 6],
  [5, 7],
  [5, 8],
  [5, 9],
  [6, 7],
  [7, 8],
  [7, 9],
  [7, 11],
  [8, 9],
]

/**
 * Tire deux effectifs k×a et k×b de 400 au plus, ayant chacun entre 8 et 20 diviseurs,
 * avec un PGCD k supérieur ou égal à 8.
 */
function tirerEffectifs() {
  for (let cpt = 0; cpt < 200; cpt++) {
    const [a, b] = choice(couplesPremiersEntreEux)
    const k = choice([2, 3, 5]) * choice([2, 3]) * choice([2, 3, 5])
    const effectifs = [k * a, k * b]
    if (
      k >= 8 &&
      effectifs.every((n) => {
        const nbDiviseurs = listeDesDiviseurs(n).length
        return n <= 400 && nbDiviseurs >= 8 && nbDiviseurs <= 20
      })
    ) {
      return shuffle(effectifs)
    }
  }
  return [60, 84]
}

/**
 * Justifie que n n'est pas divisible par d, sans passer par la décomposition en facteurs premiers.
 */
function raisonNonDivisible(n: number, d: number): string {
  const chiffres = String(n).split('')
  const somme = chiffres.reduce((acc, c) => acc + Number(c), 0)
  const texSomme = `$${chiffres.join('+')}=${somme}$`
  switch (d) {
    case 2:
      return 'car il est impair'
    case 3:
      return `car la somme de ses chiffres, ${texSomme}, n’est pas divisible par $3$`
    case 5:
      return 'car son chiffre des unités n’est ni $0$ ni $5$'
    case 4:
      if (n % 2 !== 0) return 'car il n’est pas divisible par $2$'
      return `car le nombre formé par ses deux derniers chiffres, $${n % 100}$, n’est pas divisible par $4$`
    case 9:
      if (n % 3 !== 0) return 'car il n’est pas divisible par $3$'
      return `car la somme de ses chiffres, ${texSomme}, n’est pas divisible par $9$`
  }
  for (let e = d - 1; e > 1; e--) {
    if (d % e === 0 && n % e !== 0) {
      return `car il n’est pas divisible par $${e}$`
    }
  }
  const q = Math.floor(n / d)
  return `car $${d}\\times ${q}=${d * q}$ et $${d}\\times ${q + 1}=${d * (q + 1)}$`
}

/**
 * Recherche des diviseurs de n en testant les entiers dans l'ordre croissant,
 * jusqu'à ce que le carré de l'entier testé dépasse n.
 */
function texRechercheDesDiviseurs(n: number) {
  const texN = texNombre(n, 0)
  const lignes: string[] = []
  let d = 1
  for (; d * d <= n; d++) {
    lignes.push(
      n % d === 0
        ? `$${texN}=${d}\\times ${texNombre(n / d, 0)}$`
        : `$${texN}$ n’est pas divisible par $${d}$ ${raisonNonDivisible(n, d)}.`,
    )
  }
  const debut = texteEnCouleur(
    'On teste les entiers dans l’ordre croissant à partir de $1$ :',
    bleuMathalea,
  )
  const fin = texteEnCouleur(
    `$${d}\\times ${d}=${texNombre(d * d, 0)}$ et $${texNombre(d * d, 0)}>${texN}$, donc on peut s’arrêter : les produits suivants seraient les mêmes que ceux déjà trouvés.`,
    bleuMathalea,
  )
  return `${debut}<br>${lignes.join('<br>')}<br>${fin}`
}

const texListe = (nombres: number[]) =>
  nombres.map((x) => texNombre(x, 0)).join('\\text{ ; }')

export default class RepartirEnGroupesIdentiques extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    const s = choice(situations)
    const effectifs = tirerEffectifs()
    const [nb1, nb2] = effectifs
    const [texNb1, texNb2] = effectifs.map((n) => texNombre(n, 0))
    const diviseurs = effectifs.map((n) => listeDesDiviseurs(n))
    const communs = diviseurs[0].filter((d) => diviseurs[1].includes(d))
    const leGcd = pgcd(nb1, nb2)
    const texGcd = texNombre(leGcd, 0)

    this.introduction = `Un ${s.qui} ${s.faitQuoi} ${s.ou} ${s.pourQui}.<br>
      Il souhaite répartir la totalité des $${texNb1}$ ${s.objet1} et des $${texNb2}$ ${s.objet2} dans des ${s.groupements}.<br>
      Chaque ${s.groupement} doit comporter le même nombre de ${s.objet1} et le même nombre de ${s.objet2}.`

    // Questions 1 et 2 : liste des diviseurs de chaque effectif
    effectifs.forEach((n, i) => {
      const texN = texNombre(n, 0)
      let texte = `Trouver tous les entiers positifs qui divisent $${texN}$.`
      if (this.interactif) {
        texte += ` Écrire la liste de ces diviseurs en les séparant par des points-virgules.<br>${ajouteChampTexteMathLive(
          this,
          i,
          KeyboardType.clavierEnsemble,
          {
            texteAvant: `La liste des diviseurs de $${texN}$ est `,
            texteApres: '.',
          },
        )}`
      }
      handleAnswers(this, i, {
        reponse: {
          value: diviseurs[i].join(';'),
          options: { suiteDeNombres: true },
        },
      })
      this.listeQuestions.push(texte)
      this.listeCorrections.push(
        `${texRechercheDesDiviseurs(n)}<br><br>Les diviseurs de $${texN}$ sont : $${miseEnEvidence(texListe(diviseurs[i]))}$.`,
      )
    })

    // Question 3 : plus grand diviseur commun
    let texte3 = `En déduire le plus grand diviseur commun à $${texNb1}$ et $${texNb2}$.`
    if (this.interactif) {
      texte3 += `<br>${ajouteChampTexteMathLive(
        this,
        2,
        KeyboardType.clavierNumbers,
        {
          texteAvant: `Le plus grand diviseur commun à $${texNb1}$ et $${texNb2}$ est `,
          texteApres: '.',
        },
      )}`
    }
    handleAnswers(this, 2, { reponse: { value: leGcd } })
    const texteCorr3 = `${texteEnCouleur(
      `Les diviseurs communs à $${texNb1}$ et $${texNb2}$ sont les nombres qui apparaissent dans les deux listes : $${texListe(communs)}$.`,
      bleuMathalea,
    )}<br>Le plus grand diviseur commun à $${texNb1}$ et $${texNb2}$ est donc $${miseEnEvidence(texGcd)}$.`

    // Question 4 : nombre maximal de groupes
    let texte4 = `Quel est le plus grand nombre ${s.deGroupements} que le ${s.qui} pourra constituer ?`
    if (this.interactif) {
      texte4 += `<br>${ajouteChampTexteMathLive(
        this,
        3,
        KeyboardType.clavierNumbers,
        {
          texteAvant: 'Il pourra constituer au maximum ',
          texteApres: ` ${s.groupements}.`,
        },
      )}`
    }
    handleAnswers(this, 3, { reponse: { value: leGcd } })
    const texteCorr4 = `${texteEnCouleur(
      `Chaque ${s.groupement} contient le même nombre de ${s.objet1} et la totalité des ${s.objet1} est répartie : le nombre de ${s.groupements} divise donc $${texNb1}$. Pour la même raison, il divise $${texNb2}$, c’est donc un diviseur commun à $${texNb1}$ et $${texNb2}$.<br>
      Pour en constituer le plus possible, on prend le plus grand diviseur commun à $${texNb1}$ et $${texNb2}$, qui vaut $${texGcd}$ d’après la question précédente.`,
      bleuMathalea,
    )}<br>Le ${s.qui} pourra constituer au maximum $${miseEnEvidence(texGcd)}$ ${s.groupements}.`

    // Question 5 : composition d'un groupe
    let texte5 = `Combien de ${s.objet1} et de ${s.objet2} y aura-t-il dans chaque ${s.groupement} ?`
    if (this.interactif) {
      texte5 += `<br>${remplisLesBlancs(
        this,
        4,
        `\\text{Il y aura }%{champ1}\\text{ ${s.objet1} et }%{champ2}\\text{ ${s.objet2}.}`,
        KeyboardType.clavierNumbers,
      )}`
    }
    handleAnswers(this, 4, {
      bareme: toutPourUnPoint,
      champ1: { value: String(nb1 / leGcd) },
      champ2: { value: String(nb2 / leGcd) },
    })
    const texteCorr5 = `${texteEnCouleur(
      `Il y a $${texNb1}$ ${s.objet1} et $${texNb2}$ ${s.objet2} à répartir dans $${texGcd}$ ${s.groupements}.`,
      bleuMathalea,
    )}<br>$${texNb1}\\div ${texGcd}=${miseEnEvidence(texNombre(nb1 / leGcd, 0))}$ ${s.objet1}
      et $${texNb2}\\div ${texGcd}=${miseEnEvidence(texNombre(nb2 / leGcd, 0))}$ ${s.objet2} dans chaque ${s.groupement}.`

    this.listeQuestions.push(texte3, texte4, texte5)
    this.listeCorrections.push(texteCorr3, texteCorr4, texteCorr5)
    listeQuestionsToContenu(this)
  }
}
