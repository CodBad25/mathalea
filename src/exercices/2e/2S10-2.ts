import { amcConvert } from '../../lib/amc/amcBuilders'
import { texPrix } from '../../lib/format/style'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import {
  handleAnswers,
  setReponse,
} from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Calculer une proportion ou appliquer un pourcentage'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '9/12/2021'
export const dateDeModifImportante = '28/04/2023' // ajout du cas entreprise
/**
 * Problèmes de proportions
 *
 * * Situations variées : spectacle, cadeau, réserve, entreprise
 *
 * * Déterminer l'effectif de la sous population
 * * Calculer une proportion
 * * Retrouver l'effectif de la population totale'
 * * Mélange des 3 types de problèmes
 * @author Florence Tapiero
 * * ajout de lignes pour l'export AMC par Jean-claude Lhote
 * 2S10-1
 * ajout du cas entreprise par Gilles Mora
 */
export const uuid = '612a5'

export const refs = {
  'fr-fr': ['2S10-2', 'BP2SP8'],
  'fr-ch': ['9NO14-8'],
}
export default class Proportions extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Niveau de difficulté',
      4,
      "1 : Déterminer l'effectif d'une sous-population \n2 : Calculer une proportion en pourcentage\n3 : Calculer l'effectif de la population totale \n4 : Mélange",
    ]

    this.nbQuestions = 2

    this.sup = 4 // type de questions mettre 4

    this.spacingCorr = 2
  }

  nouvelleVersion() {
    let typesDeQuestionsDisponibles: (
      | 'sous-population'
      | 'proportion'
      | 'population-totale'
    )[] = []
    if (this.sup === 1) {
      typesDeQuestionsDisponibles = ['sous-population']
    }
    if (this.sup === 2) {
      typesDeQuestionsDisponibles = ['proportion']
    }
    if (this.sup === 3) {
      typesDeQuestionsDisponibles = ['population-totale']
    }
    if (this.sup === 4) {
      typesDeQuestionsDisponibles = [
        'sous-population',
        'proportion',
        'population-totale',
      ]
    }
    if (typesDeQuestionsDisponibles.length === 0) {
      typesDeQuestionsDisponibles = [
        'sous-population',
        'proportion',
        'population-totale',
      ]
    }
    const situationsDisponibles = [
      'spectacle',
      'cadeau',
      'réserve',
      'entreprise',
    ] //
    // const situationsDisponibles = ['cadeau'] pour test de chaque situation
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    const typesDeSituations = combinaisonListes(
      situationsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    let prénom, espèces
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let totale: number
      let taux: number
      let p: number
      let sous: number
      let sous2: number
      let texte = ''
      let texteCorr = ''
      let reponse: number = 0
      let paramAMC
      switch (typesDeSituations[i]) {
        case 'spectacle':
          // Le nombre de spectateurs doit être entier
          // Multiple de 50 et multiple de 2%
          // Multiple de 20 et multiple de 5%
          // Multiple de 100 et n%
          switch (randint(1, 3)) {
            case 1:
              totale = 50 * randint(2, 60)
              taux = 2 * randint(3, 30)
              break
            case 2:
              totale = 20 * randint(5, 150)
              taux = 5 * randint(1, 16)
              break
            case 3:
            default:
              totale = 100 * randint(1, 30)
              taux = randint(10, 80)
              break
          }
          p = taux / 100
          sous = p * totale
          sous2 = totale - sous
          switch (listeTypeDeQuestions[i]) {
            case 'sous-population':
              switch (randint(1, 2)) {
                case 1:
                  texte = `$${texNombre(totale, 0)}$ personnes assistent à un concert. $${taux}~\\%$ ont moins de $18$ ans. <br>Calculer le nombre de personnes mineures dans le public.`
                  texteCorr = `Pour appliquer une proportion à une valeur, on multiplie celle-ci par la proportion $p$. <br>Comme $${taux}~\\%$ des $${texNombre(totale, 0)}$ personnes sont mineures, le nombre de personnes mineures est donné par :`
                  texteCorr += `<br>$\\dfrac{${taux}}{100} \\times ${texNombre(totale, 0)} = ${texNombre(p, 2)} \\times ${texNombre(totale, 0)}=${texNombre(sous, 2)}$`
                  texteCorr += `<br>Il y a donc $${miseEnEvidence(texNombre(sous))}$ personnes mineures dans le public.`
                  reponse = arrondi(sous)
                  break
                case 2:
                  texte = `$${texNombre(totale, 0)}$ personnes assistent à un concert. $${taux}~\\%$ ont moins de $18$ ans. <br>Calculer le nombre de personnes majeures dans le public.`
                  texteCorr = `On commence par déterminer la proportion de personnes majeures avec ce calcul : <br> $100-${taux}=${100 - taux}$.<br>`
                  texteCorr +=
                    'Pour appliquer une proportion à une valeur, on multiplie celle-ci par la proportion $p$.'
                  texteCorr += `<br>Comme $${100 - taux}~\\%$ des $${texNombre(totale, 0)}$ personnes sont majeures, le nombre de personnes majeures est donné par :`
                  texteCorr += `<br>$\\dfrac{${100 - taux}}{100} \\times ${texNombre(totale, 0)} = ${texNombre(1 - p, 4)} \\times ${texNombre(totale, 0)} = ${texNombre(sous2, 2)}$`
                  texteCorr += `<br>Il y a donc $${miseEnEvidence(texNombre(sous2, 2))}$ personnes majeures dans le public.`
                  reponse = arrondi(sous2)
                  break
              }
              paramAMC = { digits: 4, decimals: 0, signe: false, approx: 0 } // on mets 4 chiffres même si la plupart des réponses n'en ont que 3 pour ne pas contraindre les réponses
              break
            case 'population-totale':
              texte = `Lors d'un concert, il y a $${texNombre(sous, 2)}$ spectateurs de plus de $60$ ans, ce qui représente $${taux}~\\%$ du public. <br>Combien de spectateurs ont assisté au concert ?`
              texteCorr = `Soit $x$ le nombre total de spectateur. <br> Comme $${taux}~\\%$ de $x$ est égal à $${texNombre(sous, 2)}$, on a :`
              texteCorr += `<br>$\\begin{aligned}
              \\dfrac{${taux}}{100} \\times x &= ${texNombre(sous, 2)} \\\\\\
              ${texNombre(p, 2)} \\times x &= ${texNombre(sous, 2)} \\\\
              x &= \\dfrac{${texNombre(sous, 2)}}{${texNombre(p, 2)}} \\\\
              x &= ${texNombre(totale, 0)}
              \\end{aligned}$`
              texteCorr += `<br>Il y avait donc $${miseEnEvidence(texNombre(totale, 0))}$ spectateurs.`
              reponse = arrondi(totale)
              paramAMC = { digits: 4, decimals: 0, signe: false, approx: 0 } // Le nombre attendu a bien 4 chiffres maxi
              break
            case 'proportion':
            default:
              texte = `Parmi les $${texNombre(totale, 0)}$ spectateurs d'un concert, $${texNombre(sous, 2)}$ ont moins de $18$ ans. <br>Calculer la proportion des personnes mineures dans le public en pourcentage.`
              texteCorr = `La proportion $p$ est donnée par le quotient : $\\dfrac{${texNombre(sous, 2)}}{${texNombre(totale, 0)}} = ${texNombre(p, 2)}$.`
              texteCorr += `<br>$${texNombre(p, 2)}=\\dfrac{${texNombre(taux, 0)}}{100}$. Il y a donc $${miseEnEvidence(taux)}~\\%$ de personnes mineures dans le public.`
              reponse = arrondi(taux)
              paramAMC = { digits: 2, decimals: 0, signe: false, approx: 0 } // Le taux est ici inférieur à 100%
              break
          }
          break
        case 'cadeau':
          switch (randint(1, 3)) {
            case 1:
              totale = 50 * randint(1, 3, 2)
              taux = 2 * randint(3, 17)
              break
            case 2:
              totale = 20 * randint(2, 8, 5)
              taux = 5 * randint(2, 7)
              break
            case 3:
            default:
              totale = 10 * randint(1, 15)
              taux = 10 * randint(1, 3)
              break
          }
          p = taux / 100
          sous = p * totale
          sous2 = totale - sous
          prénom = choice([
            'Frédéric',
            'Brice',
            'Marion',
            'Christelle',
            'Léo',
            'Gabriel',
            'Maël',
            'Louise',
            'Lina',
            'Mia',
            'Rose',
            'Mohamed',
            'Mehdi',
            'Rayan',
            'Karim',
            'Yasmine',
            'Noûr',
            'Kaïs',
            'Louna',
            'Nora',
            'Fatima',
            'Nora',
            'Nadia',
            'Sohan',
            'Timothée',
            'Jamal',
          ])
          switch (listeTypeDeQuestions[i]) {
            case 'sous-population':
              texte = `Le cadeau commun que nous souhaitons faire à ${prénom} coûte $${texPrix(totale)}$ €. Je participe à hauteur de $${taux}~\\%$ du prix total. <br>Combien ai-je donné pour le cadeau de ${prénom} ?`
              texteCorr = `Pour appliquer une proportion à une valeur, on multiplie celle-ci par la proportion $p$. <br>Comme ma participation représente $${taux}~\\%$ de $${texPrix(totale)}$, j'ai donné :`
              texteCorr += `<br>$\\dfrac{${taux}}{100} \\times ${texNombre(totale, 0)} = ${texNombre(p, 2)} \\times ${texNombre(totale, 0)}=${texNombre(sous, 2)}$`
              texteCorr += `<br>Ma participation au cadeau est de $${miseEnEvidence(texPrix(sous))}$ €.`
              reponse = arrondi(sous)
              paramAMC = { digits: 3, decimals: 0, signe: false, approx: 0 } // la participation n'a que 2 chiffres mais on ne contraint pas la réponse
              break
            case 'population-totale':
              texte = `Pour le cadeau de ${prénom}, j'ai donné $${texPrix(sous)}$ €. Cela représente $${taux}~\\%$ du prix total du cadeau. <br>Quel est le montant du cadeau ?`
              texteCorr = `Soit $x$ le montant du cadeau. <br> Comme $${taux}~\\%$ de $x$ est égal à $${texPrix(sous)}$, on a :`
              texteCorr += `<br>$\\begin{aligned}
              \\dfrac{${taux}}{100} \\times x &= ${texNombre(sous)} \\\\\\
              ${texNombre(p, 2)} \\times x &= ${texNombre(sous)} \\\\
              x &= \\dfrac{${texNombre(sous)}}{${texNombre(p, 2)}} \\\\
              x &= ${texPrix(totale)}
              \\end{aligned}$`
              texteCorr += `<br>Le cadeau coûte $${miseEnEvidence(texPrix(totale))}$ €.`
              reponse = arrondi(totale)
              paramAMC = { digits: 3, decimals: 0, signe: false, approx: 0 }
              break
            case 'proportion':
            default:
              texte = `Le cadeau commun que nous souhaitons faire à ${prénom} coûte $${texPrix(totale)}$ €. Je participe à hauteur de $${texPrix(sous)}$ €. <br>Calculer la proportion en pourcentage de ma participation sur le prix total du cadeau.`
              texteCorr = `La proportion $p$ est donnée par le quotient : $\\dfrac{${texPrix(sous)}}{${texPrix(totale)}} = ${texNombre(p, 2)}$.`
              texteCorr += `<br>$${texNombre(p, 2)}=\\dfrac{${texNombre(taux, 0)}}{100}$. J'ai donc donné $${miseEnEvidence(taux)}~\\%$ du montant total du cadeau.`
              reponse = arrondi(taux)
              paramAMC = { digits: 2, decimals: 0, signe: false, approx: 0 } // Le taux est ici inférieur à 100%
              break
          }
          break
        case 'réserve':
          switch (randint(1, 3)) {
            case 1:
              totale = 50 * randint(10, 60)
              taux = 2 * randint(3, 20)
              break
            case 2:
              totale = 20 * randint(25, 150)
              taux = 5 * randint(1, 9)
              break
            case 3:
            default:
              totale = 100 * randint(5, 30)
              taux = randint(8, 40)
              break
          }
          p = taux / 100
          sous = p * totale
          sous2 = totale - sous
          // espèce = choice(['pic noir', 'pipit farlouse', 'bruant des roseaux']) au singulier, inutile à priori
          espèces = choice([
            'pics noirs',
            'pipits farlouse',
            'bruants des roseaux',
          ])
          switch (listeTypeDeQuestions[i]) {
            case 'sous-population':
              texte = `Une réserve de protection d'oiseaux contient $${texNombre(totale, 0)}$ individus d'oiseaux. On dénombre $${taux}~\\%$ de ${espèces}.<br>Quel est le nombre de ${espèces} ?`
              texteCorr = `Pour appliquer une proportion à une valeur, on multiplie celle-ci par la proportion $p$. <br>Comme les ${espèces} représentent $${taux}~\\%$ de $${texNombre(totale, 0)}$, leur nombre est donné par :`
              texteCorr += `<br>$\\dfrac{${taux}}{100} \\times ${texNombre(totale, 0)} = ${texNombre(p, 2)} \\times ${texNombre(totale, 0)}=${texNombre(sous, 2)}$`
              texteCorr += `<br>Il y a $${miseEnEvidence(texNombre(sous, 2))}$ ${espèces} dans la réserve.`
              reponse = arrondi(sous)
              paramAMC = { digits: 4, decimals: 0, signe: false, approx: 0 } // on mets 4 chiffres même si la plupart des réponses n'en ont que 3 pour ne pas contraindre les réponses

              break
            case 'population-totale':
              texte = `Dans une réserve de protection d'oiseaux, il y a $${texNombre(sous, 2)}$ ${espèces}, ce qui représente $${taux}~\\%$ du nombre total d'oiseaux. <br>Quel est le nombre d'oiseaux de cette réserve ?`
              texteCorr = `Soit $x$ le nombre d'oiseaux. <br> Comme $${taux}~\\%$ de $x$ est égal à $${texNombre(sous, 2)}$, on a :`
              texteCorr += `<br>$\\begin{aligned}
                \\dfrac{${taux}}{100} \\times x &= ${texNombre(sous, 2)} \\\\\\
                ${texNombre(p, 2)} \\times x &= ${texNombre(sous, 2)} \\\\
                x &= \\dfrac{${texNombre(sous, 2)}}{${texNombre(p, 2)}} \\\\
                x &= ${texNombre(totale, 0)}
                \\end{aligned}$`
              texteCorr += `<br>Il y a $${miseEnEvidence(texNombre(totale, 0))}$ oiseaux dans la réserve.`
              reponse = arrondi(totale)
              paramAMC = { digits: 4, decimals: 0, signe: false, approx: 0 } // population à 4 chiffres (souvent)

              break
            case 'proportion':
            default:
              texte = `Une réserve de protection d'oiseaux contient $${texNombre(totale, 0)}$ individus d'oiseaux. On dénombre $${texNombre(sous, 2)}$ ${espèces}. <br>Calculer la proportion en pourcentage de ${espèces} dans la réserve.`
              texteCorr = `La proportion $p$ est donnée par le quotient : $\\dfrac{${texNombre(sous, 2)}}{${texNombre(totale, 0)}} = ${texNombre(p, 2)}$.`
              texteCorr += `<br>$${texNombre(p, 2)}=\\dfrac{${texNombre(taux, 0)}}{100}$. Le pourcentage de ${espèces} dans la réserve est donc de $${miseEnEvidence(taux)}~\\%$.`
              reponse = arrondi(taux)
              paramAMC = { digits: 2, decimals: 0, signe: false, approx: 0 } // Le taux est ici inférieur à 100%
              break
          }
          break

        case 'entreprise':
        default:
          switch (randint(1, 3)) {
            case 1:
              totale = 50 * randint(1, 9, 2)
              taux = 2 * randint(3, 17)
              break
            case 2:
              totale = 50 * randint(1, 9, 2)
              taux = 2 * randint(3, 29)
              break
            case 3:
            default:
              totale = 10 * randint(3, 25)
              taux = 10 * randint(1, 4)
              break
          }
          p = taux / 100
          sous = p * totale
          sous2 = totale - sous
          switch (listeTypeDeQuestions[i]) {
            case 'sous-population':
              texte = `Dans une entreprise de $${texNombre(totale, 0)}$ salariés, il y a  $${taux}\\,\\%$ de cadres. <br>Combien y a-t-il de cadres dans cette entreprise ?`
              texteCorr = `Pour appliquer une proportion à une valeur, on multiplie celle-ci par la proportion $p$. <br>Comme il y a  $${taux}\\,\\%$ des $${texNombre(totale, 0)}$ salariés qui sont cadres, le nombre de cadres est donné par :`
              texteCorr += `<br>$\\dfrac{${taux}}{100} \\times ${texNombre(totale, 0)} = ${texNombre(p, 2)} \\times ${texNombre(totale, 0)}=${texNombre(sous, 2)}$`
              texteCorr += `<br>Il y a donc  $${miseEnEvidence(texNombre(sous))}$  cadres dans cette entreprise.`
              reponse = arrondi(sous)
              paramAMC = { digits: 3, decimals: 0, signe: false, approx: 0 } // la participation n'a que 2 chiffres mais on ne contraint pas la réponse
              break
            case 'population-totale':
              texte = `Dans un entreprise, il y a  $${texNombre(sous)}$ cadres. Ils  représentent $${taux}\\,\\%$ du nombre total de salariés. <br>Quel est le nombre total de salariés dans cette entreprise ?`
              texteCorr = `Soit $n$ le nombre total de salariés dans l'entreprise. <br> Comme $${taux}\\,\\%$ de $n$ est égal à $${texNombre(sous)}$, on a :`
              texteCorr += `<br>$\\begin{aligned}
                \\dfrac{${taux}}{100} \\times n &= ${texNombre(sous)} \\\\\\
                ${texNombre(p, 2)} \\times n &= ${texNombre(sous)} \\\\
                n &= \\dfrac{${texNombre(sous, 2)}}{${texNombre(p, 2)}} \\\\
                n &= ${texNombre(totale, 2)}
                \\end{aligned}$`
              texteCorr += `<br>Le nombre total de salariés dans l'entreprise est $${miseEnEvidence(texNombre(totale))}$.`
              reponse = arrondi(totale)
              paramAMC = { digits: 3, decimals: 0, signe: false, approx: 0 }
              break
            case 'proportion':
            default:
              texte = `Dans une entreprise, il y a $${texNombre(totale)}$ salariés au total. Parmi eux, on dénombre  $${texNombre(sous)}$ cadres. <br>Calculer la proportion en pourcentage de cadres dans cette entreprise.`
              texteCorr = `La proportion $p$ est donnée par le quotient : $\\dfrac{${texNombre(sous)}}{${texNombre(totale)}} = ${texNombre(p, 2)}$.`
              texteCorr += `<br>$${texNombre(p, 2)}=\\dfrac{${texNombre(taux, 0)}}{100}$. Il y a donc $${miseEnEvidence(taux)}\\,\\%$ de cadres dans cette entreprise.`
              reponse = arrondi(taux)
              paramAMC = { digits: 2, decimals: 0, signe: false, approx: 0 }
              break
          }
          break
      }
      if (context.isAmc) {
        setReponse(this, i, reponse, paramAMC)
        const exerciseAny = this as any
        if (!Array.isArray(exerciseAny.autoCorrectionAMC)) {
          exerciseAny.autoCorrectionAMC = []
        }
        const interactiveEntry = this.autoCorrectionAMC[i] ?? {}
        const interactiveReponse = interactiveEntry.reponse ?? {}
        exerciseAny.autoCorrectionAMC[i] = {
          ...interactiveEntry,
          reponse: {
            ...interactiveReponse,
          },
        }
        exerciseAny.questionsAMC[i] = amcConvert(
          exerciseAny.autoCorrectionAMC[i],
        )
      } else {
        handleAnswers(this, i, { reponse: { value: reponse.toString() } })
      }
      if (listeTypeDeQuestions[i] === 'proportion') {
        if (context.isAmc) {
          const exerciseAny = this as any
          if (!Array.isArray(exerciseAny.autoCorrectionAMC)) {
            exerciseAny.autoCorrectionAMC = []
          }
          if (exerciseAny.autoCorrectionAMC[i] == null) {
            exerciseAny.autoCorrectionAMC[i] = {}
          }
          if (exerciseAny.autoCorrectionAMC[i].reponse == null) {
            exerciseAny.autoCorrectionAMC[i].reponse = {}
          }
          exerciseAny.autoCorrectionAMC[i].reponse.display = {
            labelPosition: 'left',
            label: '\\\\En \\% : ',
          }
          exerciseAny.questionsAMC[i] = amcConvert(
            exerciseAny.autoCorrectionAMC[i],
          )
        }
      }

      texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers, {
        texteApres:
          listeTypeDeQuestions[i] === 'proportion'
            ? ' %'
            : typesDeSituations[i] === 'cadeau' &&
                listeTypeDeQuestions[i] !== 'proportion'
              ? '€'
              : '',
      })

      if (this.questionJamaisPosee(i, taux, totale, sous)) {
        // on utilise donc cette fonction basée sur les variables aléatoires pour éviter les doublons
        this.listeQuestions.push(texte)
        this.listeCorrections.push(texteCorr)
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
