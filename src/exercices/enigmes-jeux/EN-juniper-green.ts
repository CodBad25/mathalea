import {
  ajouteJuniperGreen,
  coupsPossibles,
  JuniperGreenElement,
  NOMBRE_DE_CASES_POUR_UN_POINT,
  nombresNonPremiers,
  type ModeDepart,
  type ModeErreur,
  type ReglesJuniperGreen,
} from '../../lib/customElements/JuniperGreenElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice } from '../../lib/outils/arrayOutils'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const dateDePublication = '04/09/2026'
export const titre = 'Jouer au Juniper Green'
export const interactifReady = true

export const uuid = 'cc308'
export const refs = {
  'fr-fr': ['EN-Juniper-Green'],
  'fr-ch': [],
}

/** Nombre de parties tirées au hasard avant de garder la plus longue. */
const NOMBRE_DE_TIRAGES = 20

function modeDepartDepuisSup(valeur: unknown): ModeDepart {
  const nombre = Number(valeur)
  if (nombre === 2) return 'libreSansPremier'
  if (nombre === 3) return 'aleatoireSansPremier'
  return 'libre'
}

/**
 * Le jeu du Juniper Green : on choisit tour à tour un nombre de la grille,
 * chaque nombre devant être un multiple ou un diviseur du précédent.
 *
 * L'exercice est interactif au sens de MathALÉA : le score (sur 2) est
 * attribué par `JuniperGreenElement.verifQuestion()`, qui fige la partie
 * telle qu'elle a été jouée (voir `JuniperGreenElement.finalise()`). Il n'y a
 * donc pas de réponse attendue unique : `listeCorrections` ne sert qu'à
 * illustrer une partie possible parmi beaucoup d'autres (utile en PDF, où il
 * n'y a pas de partie jouée à figer).
 *
 * @author Rémi Angot
 */
export default class JuniperGreen extends Exercice {
  constructor() {
    super()
    this.interactifObligatoire = true
    this.besoinFormulaireNumerique = ['Plus grand nombre de la grille', 100]
    this.besoinFormulaire2Numerique = [
      'Nombres par ligne',
      2,
      '1 : 5 nombres par ligne\n2 : 10 nombres par ligne',
    ]
    this.besoinFormulaire3Numerique = [
      'Mode de départ',
      3,
      '1 : départ libre\n' +
        '2 : départ libre, mais pas sur un nombre premier\n' +
        '3 : départ aléatoire sur un nombre non premier',
    ]
    this.besoinFormulaire4CaseACocher = ['Rappeler les règles']
    this.besoinFormulaire5CaseACocher = ['Arrêter la partie en cas d’erreur']
    this.sup = 40
    this.sup2 = 2
    this.sup3 = 1
    this.sup4 = true
    this.sup5 = false
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.comment =
      'Le mode de départ « départ libre, mais pas sur un nombre premier » évite que le ' +
      'premier joueur gagne à coup sûr en choisissant un nombre premier supérieur à la ' +
      'moitié du plus grand nombre de la grille : son adversaire ne pourrait alors répondre ' +
      'que 1. Le mode « départ aléatoire sur un nombre non premier » impose ce même premier ' +
      'nombre, tiré au hasard, sans laisser le premier joueur le choisir. ' +
      'Score : 2/2 si la partie va jusqu’à son terme (plus aucun coup possible), sinon 1/2 ' +
      `à partir de ${NOMBRE_DE_CASES_POUR_UN_POINT} nombres choisis et 0/2 en dessous.`
  }

  nouvelleVersion(): void {
    const modeDepart = modeDepartDepuisSup(this.sup3)
    const modeErreur: ModeErreur =
      this.sup5 === true || this.sup5 === 'true' ? 'arret' : 'indication'
    const regles: ReglesJuniperGreen = {
      max: Math.max(2, Number(this.sup) || 40),
      modeDepart,
    }
    const nombresParLigne = Number(this.sup2) === 1 ? 5 : 10

    const suiteInitiale: number[] =
      modeDepart === 'aleatoireSansPremier'
        ? [choice(nombresNonPremiers(regles.max))]
        : []

    // Règles masquées : la grille et le texte qu'elle écrit en dessous
    // suffisent quand les élèves connaissent déjà le jeu.
    const rappelDesRegles = this.sup4 === true || this.sup4 === 'true'
    this.consigne = !rappelDesRegles
      ? ''
      : this.texteRegles(regles, modeErreur)

    this.listeQuestions[0] = ajouteJuniperGreen(this, 0, {
      max: regles.max,
      nombresParLigne,
      modeDepart: regles.modeDepart,
      modeErreur,
      suite: suiteInitiale,
      interactivityOn: this.interactif,
    })

    handleAnswers(
      this,
      0,
      { reponse: { value: '' } },
      { formatInteractif: JuniperGreenElement.elementTag },
    )

    const exemple = this.tirePartieLaPlusLongue(regles, suiteInitiale)
    const dernier = exemple.at(-1)
    this.listeCorrections[0] =
      'Les parties possibles sont très nombreuses. ' +
      `En voici une parmi beaucoup d’autres, avec ses ${exemple.length} nombre${exemple.length > 1 ? 's' : ''}.` +
      ajouteJuniperGreen(this, 0, {
        id: `juniper-greenEx${this.numeroExercice ?? 0}Q0Correction`,
        max: regles.max,
        nombresParLigne,
        modeDepart: regles.modeDepart,
        suite: exemple,
        animation: true,
        interactivityOn: false,
      }) +
      `<br>La partie s’arrête sur ${dernier} car aucun de ses multiples ni de ses diviseurs ` +
      'n’est encore disponible dans la grille.'

    listeQuestionsToContenu(this)
  }

  /** Rappel des règles du jeu, affiché en consigne : à tour de rôle, jouer un multiple ou un diviseur du dernier nombre choisi. */
  private texteRegles(
    regles: ReglesJuniperGreen,
    modeErreur: ModeErreur,
  ): string {
    const regleDepart =
      regles.modeDepart === 'libre'
        ? 'Choisir librement le premier nombre.'
        : regles.modeDepart === 'libreSansPremier'
          ? 'Choisir librement le premier nombre, sans choisir un nombre premier.'
          : 'Le premier nombre, non premier, est déjà tiré au hasard : continuer à partir de lui.'
    const regleErreur =
      modeErreur === 'arret'
        ? 'Un choix invalide arrête la partie.'
        : 'Un choix invalide affiche une indication et n’arrête pas la partie.'
    return (
      'Choisir un nombre de la grille à tour de rôle.<br>' +
      `${regleDepart}<br>` +
      'Choisir ensuite un multiple ou un diviseur du nombre précédemment choisi.<br>' +
      'Ne pas choisir un nombre déjà utilisé : le joueur qui ne peut plus jouer a perdu.<br>' +
      `${regleErreur}<br>` +
      'Cliquer sur « Vérifier les réponses » arrête la partie en cours et affiche le score.'
    )
  }

  /**
   * Une partie jouée au hasard se bloque souvent très vite : on en tire
   * plusieurs et on garde la plus longue, plus parlante comme exemple.
   */
  private tirePartieLaPlusLongue(
    regles: ReglesJuniperGreen,
    suiteInitiale: number[] = [],
  ): number[] {
    let laPlusLongue: number[] = []
    for (let tirage = 0; tirage < NOMBRE_DE_TIRAGES; tirage++) {
      const suite: number[] = [...suiteInitiale]
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
