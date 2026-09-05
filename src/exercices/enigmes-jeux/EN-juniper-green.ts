import {
  ajouteJuniperGreen,
  coupsPossibles,
  type ReglesJuniperGreen,
} from '../../lib/customElements/JuniperGreenElement'
import { choice } from '../../lib/outils/arrayOutils'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const dateDePublication = '04/09/2026'
export const titre = 'Jouer au Juniper Green'

export const uuid = 'cc308'
export const refs = {
  'fr-fr': ['EN-Juniper-Green'],
  'fr-ch': [],
}

/** Nombre de parties tirées au hasard avant de garder la plus longue. */
const NOMBRE_DE_TIRAGES = 20

/**
 * Le jeu du Juniper Green : on choisit tour à tour un nombre de la grille,
 * chaque nombre devant être un multiple ou un diviseur du précédent.
 *
 * L'exercice n'est pas interactif au sens de MathALÉA : il n'y a ni score ni
 * bouton « Vérifier les réponses », le jeu se joue entièrement dans le
 * custom element `juniper-green`. La correction ne donne donc pas une réponse
 * attendue mais une partie possible parmi beaucoup d'autres.
 *
 * @author Rémi Angot
 */
export default class JuniperGreen extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = ['Plus grand nombre de la grille', 100]
    this.besoinFormulaire2Numerique = [
      'Nombres par ligne',
      2,
      '1 : 5 nombres par ligne\n2 : 10 nombres par ligne',
    ]
    this.besoinFormulaire3CaseACocher = [
      'Interdire de commencer par un nombre premier',
    ]
    this.besoinFormulaire4CaseACocher = ['Rappeler les règles']
    this.sup = 40
    this.sup2 = 2
    this.sup3 = false
    this.sup4 = true
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.comment =
      'Interdire de commencer par un nombre premier évite que le premier joueur ' +
      'gagne à coup sûr en choisissant un nombre premier supérieur à la moitié du ' +
      'plus grand nombre de la grille : son adversaire ne pourrait alors répondre que 1.'
  }

  nouvelleVersion(): void {
    const regles: ReglesJuniperGreen = {
      max: Math.max(2, Number(this.sup) || 40),
      debutPremierInterdit: this.sup3 === true || this.sup3 === 'true',
    }
    const nombresParLigne = Number(this.sup2) === 1 ? 5 : 10

    // Règles masquées : la grille et le texte qu'elle écrit en dessous
    // suffisent quand les élèves connaissent déjà le jeu.
    const rappelDesRegles = this.sup4 === true || this.sup4 === 'true'
    this.consigne = !rappelDesRegles
      ? ''
      : 'À tour de rôle, chaque joueur choisit un nombre de la grille.<br>' +
        'Le premier nombre est libre, puis chaque nombre choisi doit être ' +
        'un multiple ou un diviseur du nombre précédent.<br>' +
        (regles.debutPremierInterdit
          ? 'Le premier nombre choisi ne doit pas être un nombre premier.<br>'
          : '') +
        'Un nombre déjà utilisé ne peut plus être choisi : ' +
        'le joueur qui ne peut plus jouer a perdu.'

    this.listeQuestions[0] = ajouteJuniperGreen(this, 0, {
      max: regles.max,
      nombresParLigne,
      debutPremierInterdit: regles.debutPremierInterdit,
    })

    const exemple = this.tirePartieLaPlusLongue(regles)
    const dernier = exemple.at(-1)
    this.listeCorrections[0] =
      'Les parties possibles sont très nombreuses. ' +
      `En voici une parmi beaucoup d’autres, avec ses ${exemple.length} nombre${exemple.length > 1 ? 's' : ''}.` +
      ajouteJuniperGreen(this, 0, {
        id: `juniper-greenEx${this.numeroExercice ?? 0}Q0Correction`,
        max: regles.max,
        nombresParLigne,
        debutPremierInterdit: regles.debutPremierInterdit,
        suite: exemple,
        animation: true,
        interactivityOn: false,
      }) +
      `<br>La partie s’arrête sur ${dernier} car aucun de ses multiples ni de ses diviseurs ` +
      'n’est encore disponible dans la grille.'

    listeQuestionsToContenu(this)
  }

  /**
   * Une partie jouée au hasard se bloque souvent très vite : on en tire
   * plusieurs et on garde la plus longue, plus parlante comme exemple.
   */
  private tirePartieLaPlusLongue(regles: ReglesJuniperGreen): number[] {
    let laPlusLongue: number[] = []
    for (let tirage = 0; tirage < NOMBRE_DE_TIRAGES; tirage++) {
      const suite: number[] = []
      let coups = coupsPossibles(suite, regles)
      while (coups.length > 0) {
        suite.push(choice(coups))
        coups = coupsPossibles(suite, regles)
      }
      if (suite.length > laPlusLongue.length) laPlusLongue = suite
    }
    return laPlusLongue
  }
}
