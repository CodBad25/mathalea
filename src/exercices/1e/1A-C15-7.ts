import { compteLesReponsesDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { prenomM } from '../../lib/outils/Personne'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '9823a'
export const refs = {
  'fr-fr': ['1A-C15-7'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Écrire l'équation modélisant un problème"
export const dateDePublication = '15/12/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC15g extends ExerciceQcmA {
  // Cas 1 : nombre de viennoiseries × prix unitaire
  private cas1(
    prenom: string,
    nbViennoiseries: number,
    prixTotal: number,
  ): void {
    this.enonce = `Pour le petit déjeuner, ${prenom} a acheté $${nbViennoiseries}$ viennoiseries.<br>
Il a payé $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le prix d'une viennoiserie.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Le prix total est égal au nombre de viennoiseries multiplié par le prix unitaire.<br>
On a donc : $${nbViennoiseries} \\times x = ${texNombre(prixTotal)}$<br>
L'équation qui modélise la situation est $${miseEnEvidence(`${nbViennoiseries}x=${texNombre(prixTotal)}`)}$.`

    this.reponses = [
      `$${nbViennoiseries}x=${texNombre(prixTotal)}$`,
      `$${texNombre(prixTotal)}x=${nbViennoiseries}$`,
      `$x+${nbViennoiseries}=${texNombre(prixTotal)}$`,
      `$x=${texNombre(prixTotal)}+${nbViennoiseries}$`,
    ]
  }

  // Cas 2 : brioches (prix inconnu) + croissants (prix connu) même nombre
  private cas2(
    choix: boolean,
    prenom: string,
    nbBrioches: number,
    nbCroissants: number,
    prixCroissant: number,
    prixTotal: number,
  ): void {
    this.enonce = `Pour le petit déjeuner, ${prenom} a acheté $${nbBrioches}$ brioches et $${nbCroissants}$ croissants.<br>
Le prix d'un croissant est $${texNombre(prixCroissant)}$ € et il a payé au total $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le prix d'une brioche.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Le prix total est égal au prix des brioches plus le prix des croissants.<br>
Prix des brioches : $${nbBrioches}x$<br>
Prix des croissants : $${nbCroissants} \\times ${texNombre(prixCroissant)} = 
 ${choix ? `` : `${texNombre(nbCroissants * prixCroissant)}`}$<br>
${choix ? `Comme le nombre de brioches est égal au nombre de croissants, on a donc : $${nbBrioches}(x+${texNombre(prixCroissant)})=${texNombre(prixTotal)}$<br>` : ``}
L'équation qui modélise la situation est ${choix ? `$${miseEnEvidence(`${nbBrioches}(x+${texNombre(prixCroissant)})=${texNombre(prixTotal)}`)}$` : `$${miseEnEvidence(`${nbBrioches}x+${texNombre(nbCroissants * prixCroissant)}=${texNombre(prixTotal)}`)}$`}.`

    this.reponses = [
      choix
        ? `$${nbBrioches}(x+${texNombre(prixCroissant)})=${texNombre(prixTotal)}$`
        : `$${nbBrioches}x+${texNombre(nbCroissants * prixCroissant)}=${texNombre(prixTotal)}$`,
      `$${texNombre(prixCroissant)}x+${texNombre(nbCroissants)}=${texNombre(prixTotal)}$`,
      `$${nbBrioches}x+${texNombre(prixCroissant)}=${texNombre(prixTotal)}$`,
      `$x+${texNombre(nbCroissants * prixCroissant)}=${texNombre(prixTotal)}$`,
    ]
  }

  // Cas 3 : 1 brioche (prix inconnu) + croissants (prix connu)
  private cas3(
    nbCroissants: number,
    prixCroissant: number,
    prixTotal: number,
  ): void {
    this.enonce = `Pour le petit déjeuner, Yassine a acheté $1$ brioche et $${nbCroissants}$ croissants.<br>
Le prix d'un croissant est $${texNombre(prixCroissant)}$ € et il a payé au total $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le prix d'une brioche.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Le prix total est égal au prix de la brioche plus le prix des croissants.<br>
Prix de la brioche : $x$<br>
Prix des croissants : $${nbCroissants} \\times ${texNombre(prixCroissant)} = ${texNombre(nbCroissants * prixCroissant)}$<br>
On a donc : $x + ${texNombre(nbCroissants * prixCroissant)} = ${texNombre(prixTotal)}$<br>
L'équation qui modélise la situation est $${miseEnEvidence(`x+${texNombre(nbCroissants * prixCroissant)}=${texNombre(prixTotal)}`)}$.`

    this.reponses = [
      `$x+${texNombre(nbCroissants * prixCroissant)}=${texNombre(prixTotal)}$`,
      `$${nbCroissants}(x+${texNombre(prixCroissant)})=${texNombre(prixTotal)}$`,
      `$x+${texNombre(prixCroissant)}=${texNombre(prixTotal)}$`,
      `$x \\times ${texNombre(prixCroissant)}=${texNombre(prixTotal)}$`,
    ]
  }

  // Cas 4 : x brioches + multiplicateur × x croissants
  private cas4(
    prenom: string,
    multiplicateur: number,
    prixCroissant: number,
    prixBrioche: number,
    prixTotal: number,
  ): void {
    const texteMultiplicateur = multiplicateur === 2 ? '$2$ fois' : '$3$ fois'

    this.enonce = `Pour le petit déjeuner, ${prenom} a acheté des brioches et des croissants.<br>
Il a acheté ${texteMultiplicateur} plus de croissants que de brioches.<br>
Le prix d'un croissant est $${texNombre(prixCroissant)}$ € et celui d'une brioche est $${texNombre(prixBrioche)}$ €.<br>
Il a payé au total $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le nombre de brioches achetées.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Nombre de brioches : $x$<br>
Nombre de croissants : $${multiplicateur}x$<br>
Prix des brioches : $x \\times ${texNombre(prixBrioche)} = ${texNombre(prixBrioche)}x$<br>
Prix des croissants : $${multiplicateur}x \\times ${texNombre(prixCroissant)} = ${texNombre(multiplicateur * prixCroissant)}x$<br>
L'équation qui modélise la situation est $${miseEnEvidence(`${texNombre(prixBrioche)}x+${texNombre(multiplicateur * prixCroissant)}x=${texNombre(prixTotal)}`)}$.`

    this.reponses = [
      `$${texNombre(prixBrioche)}x+${texNombre(multiplicateur * prixCroissant)}x=${texNombre(prixTotal)}$`,
      `$${multiplicateur}x+x=${texNombre(prixTotal)}$`,
      `$${multiplicateur}x \\times ${texNombre(prixCroissant)} + ${texNombre(prixBrioche)}=${texNombre(prixTotal)}$`,
      `$x+${texNombre(multiplicateur * prixCroissant)}=${texNombre(prixTotal)}$`,
    ]
  }

  // Cas 5 : brioche plus chère que croissant de x centimes
  private cas5(
    prenom: string,
    nbBrioches: number,
    nbCroissants: number,
    supplementBrioche: number,
    prixTotal: number,
  ): void {
    const centimes = Math.round(supplementBrioche * 100)

    this.enonce = `Pour le petit déjeuner, ${prenom} a acheté $${nbBrioches}$ brioches et $${nbCroissants}$ croissants.<br>
Le prix d'une brioche est $${centimes}$ centimes plus cher que celui d'un croissant.<br>
Il a payé au total $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le prix d'un croissant.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Prix d'un croissant : $x$<br>
Prix d'une brioche : $x + ${texNombre(supplementBrioche)}$<br>
Prix des croissants : $${nbCroissants}x$<br>
Prix des brioches : $${nbBrioches}(x + ${texNombre(supplementBrioche)}) = ${nbBrioches}x + ${texNombre(nbBrioches * supplementBrioche)}$<br>
L'équation qui modélise la situation est $${miseEnEvidence(`${nbCroissants + nbBrioches}x+${texNombre(nbBrioches * supplementBrioche)}=${texNombre(prixTotal)}`)}$.`

    this.reponses = [
      `$${nbCroissants + nbBrioches}x+${texNombre(nbBrioches * supplementBrioche)}=${texNombre(prixTotal)}$`,
      `$${nbBrioches}(x+${texNombre(supplementBrioche)})+${nbCroissants}=${texNombre(prixTotal)}$`,
      `$${nbBrioches}x+${nbCroissants}(x+${texNombre(supplementBrioche)})=${texNombre(prixTotal)}$`,
      `$${nbBrioches + nbCroissants}x+${texNombre(supplementBrioche)}=${texNombre(prixTotal)}$`,
    ]
  }

  // Cas 6 : nombre total de viennoiseries, x = nombre de croissants
  private cas6(
    prenom: string,
    nbTotal: number,
    prixCroissant: number,
    prixBrioche: number,
    prixTotal: number,
  ): void {
    this.enonce = `Pour le petit déjeuner, ${prenom} a acheté $${nbTotal}$ viennoiseries (croissants et brioches).<br>
Le prix d'un croissant est $${texNombre(prixCroissant)}$ € et celui d'une brioche est $${texNombre(prixBrioche)}$ €.<br>
Il a payé au total $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le nombre de croissants achetés.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Nombre de croissants : $x$<br>
Nombre de brioches : $${nbTotal} - x$<br>
Prix des croissants : $${texNombre(prixCroissant)}x$<br>
Prix des brioches : $${texNombre(prixBrioche)}(${nbTotal} - x)$<br>
L'équation qui modélise la situation est $${miseEnEvidence(`${texNombre(prixCroissant)}x+${texNombre(prixBrioche)}(${nbTotal}-x)=${texNombre(prixTotal)}`)}$.`

    this.reponses = [
      `$${texNombre(prixCroissant)}x+${texNombre(prixBrioche)}(${nbTotal}-x)=${texNombre(prixTotal)}$`,
      `$${texNombre(prixCroissant)}x+${texNombre(prixBrioche)}x=${texNombre(prixTotal)}$`,
      `$(${texNombre(prixCroissant)}+${texNombre(prixBrioche)})x=${texNombre(prixTotal)}$`,
      `$${texNombre(prixCroissant)}(${nbTotal}-x)+${texNombre(prixBrioche)}x=${texNombre(prixTotal)}$`,
    ]
  }

  // Cas 7 : réduction sur le prix total
  private cas7(
    prenom: string,
    nbCroissants: number,
    reduction: number,
    prixTotal: number,
  ): void {
    this.enonce = `Pour le petit déjeuner, ${prenom} achète $${nbCroissants}$ croissants.<br>
Il bénéficie d'une réduction de $${texNombre(reduction)}$ € sur le prix total.<br>
Il paie (réduction déduite) $${texNombre(prixTotal)}$ €.<br>
On désigne par $x$ le prix d'un croissant.<br>
Parmi les équations suivantes, une seule modélise la situation. Laquelle ?`

    this.correction = `Prix sans réduction : $${nbCroissants}x$<br>
Réduction : $${texNombre(reduction)}$ €<br>
Prix payé : $${nbCroissants}x - ${texNombre(reduction)} = ${texNombre(prixTotal)}$<br>
L'équation qui modélise la situation est $${miseEnEvidence(`${nbCroissants}x-${texNombre(reduction)}=${texNombre(prixTotal)}`)}$.`

    this.reponses = [
      `$${nbCroissants}x-${texNombre(reduction)}=${texNombre(prixTotal)}$`,
      `$${nbCroissants}x+${texNombre(reduction)}=${texNombre(prixTotal)}$`,
      `$${nbCroissants}(x-${texNombre(reduction)})=${texNombre(prixTotal)}$`,
      `$${nbCroissants}x=${texNombre(prixTotal)}-${texNombre(reduction)}$`,
    ]
  }

  versionOriginale: () => void = () => {
    const prenom = 'Yassine'
    const nbViennoiseries = 6
    const prixTotal = 5.7
    this.cas1(prenom, nbViennoiseries, prixTotal)
  }

  versionAleatoire: () => void = () => {
    let compteur = 0
    do {
      const prenom = prenomM() as string
      const typeCas = randint(1, 7)

      switch (typeCas) {
        case 1: {
          const nbViennoiseries = randint(5, 9)
          const prixTotal = (randint(8, 15) * nbViennoiseries) / 10
          this.cas1(prenom, nbViennoiseries, prixTotal)
          break
        }

        case 2: {
          const choix = choice([true, false])
          const nbBrioches = randint(4, 8)
          const nbCroissants = nbBrioches
          const prixCroissant = randint(11, 14) / 10
          const prixTotal =
            (randint(20, 30) * nbBrioches) / 10 + nbCroissants * prixCroissant
          this.cas2(
            choix,
            prenom,
            nbBrioches,
            nbCroissants,
            prixCroissant,
            prixTotal,
          )
          break
        }

        case 3: {
          const nbCroissants = randint(5, 9)
          const prixCroissant = randint(11, 14) / 10
          const prixTotal = randint(15, 25) / 10 + nbCroissants * prixCroissant
          this.cas3(nbCroissants, prixCroissant, prixTotal)
          break
        }

        case 4: {
          const multiplicateur = randint(2, 3)
          const prixCroissant = randint(11, 14) / 10
          const prixBrioche = randint(21, 39) / 10
          const nbBrioches = randint(2, 5)
          const prixTotal =
            nbBrioches * prixBrioche +
            multiplicateur * nbBrioches * prixCroissant
          this.cas4(
            prenom,
            multiplicateur,
            prixCroissant,
            prixBrioche,
            prixTotal,
          )
          break
        }

        case 5: {
          const nbBrioches = randint(3, 6)
          const nbCroissants = randint(4, 7, nbBrioches)
          const supplementBrioche = choice([0.3, 0.4, 0.5, 0.6, 0.7])
          const prixCroissant = randint(11, 14) / 10
          const prixBrioche = prixCroissant + supplementBrioche
          const prixTotal =
            nbBrioches * prixBrioche + nbCroissants * prixCroissant
          this.cas5(
            prenom,
            nbBrioches,
            nbCroissants,
            supplementBrioche,
            prixTotal,
          )
          break
        }

        case 6: {
          const nbTotal = randint(8, 12)
          const prixCroissant = randint(11, 14) / 10
          const prixBrioche = randint(21, 29) / 10
          const nbCroissantsReel = randint(3, nbTotal - 3)
          const prixTotal =
            nbCroissantsReel * prixCroissant +
            (nbTotal - nbCroissantsReel) * prixBrioche
          this.cas6(prenom, nbTotal, prixCroissant, prixBrioche, prixTotal)
          break
        }

        case 7: {
          const nbCroissants = randint(5, 8)
          const reduction = choice([1, 1.5, 2, 2.5])
          const prixCroissant = randint(11, 14) / 10
          const prixSansReduction = nbCroissants * prixCroissant
          const prixTotal = prixSansReduction - reduction
          this.cas7(prenom, nbCroissants, reduction, prixTotal)
          break
        }
      }
      compteur++
    } while (
      compteur < 100 &&
      !compteLesReponsesDifferentes(this, 4, true, { egaliteExpression: true })
    ) // On s'assure d'avoir 4 réponses différentes, sinon on régénère
  }

  constructor() {
    super()
    this.versionAleatoire()
    this.spacing = 1.5
  }
}
