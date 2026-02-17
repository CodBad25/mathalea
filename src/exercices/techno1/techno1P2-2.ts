import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { texNombre } from '../../lib/outils/texNombre'
import Exercice from '../Exercice'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { arrondi } from '../../lib/outils/nombres'
export const titre = "Proportion d'une sous-population"

export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '25/06/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModifImportante = '' // Une date de modification importante au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 *
 * @author Stéphane Guyon

*/
export const uuid = '86f71'

export const refs = {
  'fr-fr': ['techno1P2-2'],
  'fr-ch': [],
}
export default class nomExercice extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1 // Nombre de questions par défaut
    this.nbCols = 2 // Uniquement pour la sortie LaTeX
    this.nbColsCorr = 2 // Uniquement pour la sortie LaTeX
  }

  nouvelleVersion() {
    const typeQuestionsDisponibles = ['Basket', 'STMG']

    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posés mais l'ordre diffère à chaque "cycle"
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let N: number
      let n: number
      let texte = ''
      let texteCorr = ''
      switch (
        listeTypeQuestions[i]
      ) {
        case 'Basket':
          N = randint(200, 1500) * 2
          n = randint(50, N / 2)
          texte = `Parmi les $${N}$ spectateurs d’un match de basket-ball, $${n}$ ont moins de $20$ ans. Calculer la proportion de spectateurs
          ayant moins de $20$ ans.<br>Exprimer le résultat sous la forme d'un pourcentage arrondi à l'unité près.`
          if (this.interactif) {
            texte += '<br><br>'
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBase,
              { texteApres: '%' },
            )
            handleAnswers(this, i, {
              reponse: { value: arrondi((100 * n) / N, 0) },
            })
          }
          texteCorr = `La population de référence est celle des spectateurs du match.<br>
           On note $N=${N}$ son effectif.<br>
          La sous-population étudiée est celle des spectateurs de moins de $20$ ans.<br>
           On note $n=${n}$ son effectif.<br>
          D'après le cours, on sait que la proportion d'une sous-population dans une population est :<br>
          <br>$p=\\dfrac{\\text{Effectif de la sous population}}{\\text{Effectif de la population de référence}}=\\dfrac{n}{N}=\\dfrac{${n}}{${N}}\\approx${texNombre(n / N, 2)}$<br>
          <br>La proportion de moins de $20$ ans parmi les spectateurs est $p\\approx${texNombre((n * 100) / N, 0)}\\%$`
          break
        case 'STMG':
        default:
          N = randint(12, 18) * 2
          n = randint(18, N / 2)
          texte = `L’an passé, parmi les $${N}$ élèves de terminale STMG, $${n}$ ont obtenu une place en BTS ou en IUT.<br>
            Calculer la proportion d'élèves de cette classe qui ont obtenu une place en BTS ou en IUT.<br>Exprimer le résultat sous la forme d'un pourcentage arrondi à l'unité près.
            `
          if (this.interactif) {
            texte += '<br><br>'
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBase,
              { texteApres: '%' },
            )
            handleAnswers(this, i, {
              reponse: { value: arrondi((100 * n) / N, 0) },
            })
          }
          texteCorr = `La population de référence est celle des élèves de Terminale STMG.<br>
             On note $N=${N}$ son effectif.<br>
            La sous-population étudiée est celle des bacheliers de cette classe qui ont obtenu une place en BTS ou en IUT.<br>
             On note $n=${n}$ son effectif.<br>
            D'après le cours, on sait que la proportion d'une sous-population dans une population est :<br>
            <br>$p=\\dfrac{\\text{Effectif de la sous population}}{\\text{Effectif de la population de référence}}=\\dfrac{n}{N}=\\dfrac{${n}}{${N}}\\approx${texNombre(n / N, 2)}$<br>
            <br>La proportion d'élèves qui ont obtenu une place en BTS ou en IUT dans cette classe est $p\\approx${texNombre((n * 100) / N, 0)}\\%$`
          break
      }
      // Si la question n'a jamais été posée, on l'enregistre
      if (this.questionJamaisPosee(i, N, n)) {
        // <- laisser le i et ajouter toutes les variables qui rendent les exercices différents (par exemple a, b, c et d)
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
