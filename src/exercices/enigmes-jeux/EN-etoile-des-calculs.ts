import { bleuMathalea } from '../../lib/colors'
import {
  ajouteEtoileCalculs,
  EtoileCalculsElement,
  operateurLatex,
  type BrancheEtoile,
  type OperationEtoile,
} from '../../lib/customElements/EtoileCalculsElement'
import { cleDeLaCase } from '../../lib/customElements/grilleDeChiffres'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence, texteEnCouleur } from '../../lib/outils/embellissements'
import type { Valeur } from '../../lib/types'
import { context } from '../../modules/context'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const dateDePublication = '10/09/2026'
export const titre = 'Compléter une étoile de calculs'
export const interactifReady = true

export const uuid = 'e7f3a'
export const refs = {
  'fr-fr': ['EN-EtoileCalculs'],
  'fr-ch': [],
}

/**
 * Les familles de calculs, dans l'ordre de l'aide du formulaire des poids : c'est
 * cet ordre, décrit en « `N :` », que `parseCasFormulaireTexte()` lit pour
 * transformer le champ texte en cases à cocher pondérées (voir `SupParameterGroup`).
 */
const TYPES_DE_CALCUL: OperationEtoile[] = [
  'ajout',
  'soustraction',
  'multiplication',
  'multiplicationCombinee',
]
/** Numéro du cas « Mélange » dans l'aide : juste après le dernier type réel. */
const MELANGE_TYPES_DE_CALCUL = TYPES_DE_CALCUL.length + 1

/** Le nombre de flèches, borné entre 4 et 12. */
function nbFlechesDepuisSup(valeur: unknown): number {
  const nombre = Math.round(Number(valeur))
  if (!Number.isFinite(nombre)) return 8
  return Math.min(12, Math.max(4, nombre))
}

/** Un centre composé, pour qu'une flèche « $\times a$ » soit toujours possible. */
function tireCentre(): number {
  return randint(3, 9) * randint(9, 14)
}

/** Les diviseurs de `centre` compris entre 2 et 9. */
function petitsDiviseurs(centre: number): number[] {
  return [2, 3, 4, 5, 6, 7, 8, 9].filter((diviseur) => centre % diviseur === 0)
}

/**
 * Tire une flèche de la famille demandée dont le nombre caché est un entier
 * positif. Les familles multiplicatives se rabattent l'une sur l'autre quand le
 * centre ne s'y prête pas.
 */
function tireBranche(centre: number, categorie: OperationEtoile): BrancheEtoile {
  if (categorie === 'ajout') {
    const terme = randint(2, Math.min(19, centre - 1))
    return {
      operation: 'ajout',
      facteur: 1,
      terme,
      signe: 1,
      reponse: centre - terme,
    }
  }
  if (categorie === 'soustraction') {
    const terme = randint(2, 19)
    return {
      operation: 'soustraction',
      facteur: 1,
      terme,
      signe: -1,
      reponse: centre + terme,
    }
  }
  if (categorie === 'multiplication') {
    const diviseurs = petitsDiviseurs(centre)
    if (diviseurs.length === 0) return tireBranche(centre, 'ajout')
    const facteur = choice(diviseurs)
    return {
      operation: 'multiplication',
      facteur,
      terme: 0,
      signe: 1,
      reponse: centre / facteur,
    }
  }
  // multiplicationCombinee : « $\times a + b$ » ou « $\times a - b$ ».
  const facteursPossibles = [2, 3, 4, 5, 6, 7, 8, 9].filter(
    (facteur) => centre % facteur !== 0 && centre >= facteur * 2,
  )
  if (facteursPossibles.length === 0) {
    return tireBranche(centre, 'multiplication')
  }
  const facteur = choice(facteursPossibles)
  const reste = centre % facteur
  const signe: 1 | -1 = choice([1, -1])
  if (signe === 1) {
    return {
      operation: 'multiplicationCombinee',
      facteur,
      terme: reste,
      signe: 1,
      reponse: (centre - reste) / facteur,
    }
  }
  const terme = facteur - reste
  return {
    operation: 'multiplicationCombinee',
    facteur,
    terme,
    signe: -1,
    reponse: (centre + terme) / facteur,
  }
}

/** Ce qui distingue deux flèches à l'affichage : évite les doublons évidents. */
function signature(branche: BrancheEtoile): string {
  return `${branche.operation}|${branche.facteur}|${branche.signe}|${branche.terme}`
}

/**
 * Un centre et ses flèches, sans doublon d'étiquette tant que c'est possible.
 *
 * `operations` donne la famille de chaque flèche, déjà tirée au poids voulu par
 * `gestionnaireFormulaireTexte()` : une retentative ne change donc que les nombres
 * de la flèche, jamais sa famille.
 */
function genereEtoile(operations: OperationEtoile[]): {
  centre: number
  branches: BrancheEtoile[]
} {
  const centre = tireCentre()
  const branches: BrancheEtoile[] = []
  const vues = new Set<string>()
  for (const categorie of operations) {
    let branche = tireBranche(centre, categorie)
    for (let essai = 0; essai < 8 && vues.has(signature(branche)); essai++) {
      branche = tireBranche(centre, categorie)
    }
    vues.add(signature(branche))
    branches.push(branche)
  }
  return { centre, branches }
}

/** L'égalité vérifiée par une flèche, réponse mise en évidence. */
function egalite(branche: BrancheEtoile, centre: number): string {
  const reponse = miseEnEvidence(branche.reponse)
  switch (branche.operation) {
    case 'ajout':
      return `${reponse} + ${branche.terme} = ${centre}`
    case 'soustraction':
      return `${reponse} - ${branche.terme} = ${centre}`
    case 'multiplication':
      return `${reponse} \\times ${branche.facteur} = ${centre}`
    case 'multiplicationCombinee':
      return `${reponse} \\times ${branche.facteur} ${branche.signe > 0 ? '+' : '-'} ${branche.terme} = ${centre}`
  }
}

/** La correction : le rappel de la méthode, une ligne par flèche, puis l'étoile. */
function texteCorrection(centre: number, branches: BrancheEtoile[]): string {
  const intro = texteEnCouleur(
    `Pour retrouver un nombre caché, effectuer l’opération inverse à partir de $${centre}$.`,
    bleuMathalea,
  )
  const lignes = branches.map((branche) =>
    texteEnCouleur(
      `Flèche « $${operateurLatex(branche)}$ » : $${egalite(branche, centre)}$.`,
      bleuMathalea,
    ),
  )
  if (context.isHtml) {
    return `${intro}<ul>${lignes.map((ligne) => `<li>${ligne}</li>`).join('')}</ul>`
  }
  return `${intro}\\begin{itemize}${lignes.map((ligne) => `\\item ${ligne}`).join('')}\\end{itemize}`
}

/**
 * L'étoile de calculs : un nombre entier au centre, entouré de flèches qui
 * portent chacune une opération à appliquer à un nombre caché pour retomber sur
 * le centre. Tous les nombres à trouver sont des entiers positifs.
 *
 * Le score est d'un point par flèche correctement complétée : il est attribué
 * par `EtoileCalculsElement.verifQuestion()`, qui compare chaque saisie à la
 * réponse transmise par `handleAnswers()`.
 *
 * @author Rémi Angot
 */
export default class EtoileDesCalculs extends Exercice {
  constructor() {
    super()
    // Un numéro par ligne, reconnu par `parseCasFormulaireTexte()` : le
    // formulaire affiche donc une case à cocher par type de calcul, avec un
    // réglage de poids d'apparition à côté — voir `SupParameterGroup.svelte`,
    // à la manière de `3L11` (« Forme de développement »).
    this.besoinFormulaireTexte = [
      'Fréquence de chaque calcul',
      'Nombres séparés par des tirets :\n' +
        '1 : addition\n' +
        '2 : soustraction\n' +
        '3 : multiplication\n' +
        '4 : multiplication puis addition ou soustraction\n' +
        `${MELANGE_TYPES_DE_CALCUL} : Mélange`,
    ]
    this.besoinFormulaire2Numerique = ['Nombre de flèches par étoile', 12]
    this.sup = MELANGE_TYPES_DE_CALCUL
    this.sup2 = 8
    this.nbQuestions = 1
    this.comment =
      'Chaque flèche indique une opération à appliquer à un nombre caché pour ' +
      'obtenir le nombre inscrit au centre de l’étoile : il faut donc effectuer ' +
      'l’opération inverse. Tous les nombres à trouver sont des entiers ' +
      'positifs. Le premier paramètre choisit les types de calcul à faire ' +
      'apparaître et leur poids respectif, le second le nombre de flèches ' +
      '(de 4 à 12). Score : un point par flèche correctement complétée.'
  }

  nouvelleVersion(): void {
    const nbFleches = nbFlechesDepuisSup(this.sup2)
    // Une seule pioche pondérée pour toutes les flèches de toutes les étoiles :
    // `gestionnaireFormulaireTexte()` respecte alors le poids de chaque type sur
    // l'ensemble de l'exercice, pas étoile par étoile.
    const operations = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: TYPES_DE_CALCUL.length,
      defaut: MELANGE_TYPES_DE_CALCUL,
      listeOfCase: TYPES_DE_CALCUL,
      nbQuestions: this.nbQuestions * nbFleches,
      melange: MELANGE_TYPES_DE_CALCUL,
    }) as OperationEtoile[]

    this.consigne =
      'Compléter les pointillés de manière à obtenir le résultat figurant au ' +
      'milieu de l’étoile.<br>Tous les nombres à trouver sont des entiers.'

    for (let question = 0; question < this.nbQuestions; question++) {
      const operationsEtoile = Array.from(
        { length: nbFleches },
        (_, index) =>
          operations[(question * nbFleches + index) % operations.length],
      )
      const { centre, branches } = genereEtoile(operationsEtoile)

      this.listeQuestions[question] = ajouteEtoileCalculs(this, question, {
        centre,
        branches,
        interactivityOn: this.interactif,
      })

      // Le type `Valeur` ne déclare les clés `LxCy` que jusqu'à `L3C5` : les
      // flèches (jusqu'à douze) sont donc ajoutées une à une, comme dans
      // `EN-gratte-ciel`.
      let reponses: Valeur = {}
      branches.forEach((branche, index) => {
        reponses = Object.assign(
          reponses,
          Object.fromEntries([
            [cleDeLaCase(0, index), { value: String(branche.reponse) }],
          ]),
        )
      })
      handleAnswers(this, question, reponses, {
        formatInteractif: EtoileCalculsElement.elementTag,
      })

      this.listeCorrections[question] =
        texteCorrection(centre, branches) +
        ajouteEtoileCalculs(this, question, {
          id: `${EtoileCalculsElement.elementTag}Ex${this.numeroExercice ?? 0}Q${question}Correction`,
          centre,
          branches,
          montreSolution: true,
          interactivityOn: false,
        })
    }

    listeQuestionsToContenu(this)
  }
}
