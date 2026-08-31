import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence, texteCode } from '../../lib/outils/embellissements'
import { scriptPython } from '../../lib/outils/scriptPython'
import { texNombre } from '../../lib/outils/texNombre'
import { tableauColonneLigne } from '../../lib/2d/tableau'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'

export const titre = 'Déterminer la valeur renvoyée par un algorithme de seuil'
export const dateDePublication = '29/08/2026'
export const uuid = '87fb7'
export const refs = {
  'fr-fr': ['TSA1-44'],
  'fr-ch': [],
}
export const interactifReady = true

/**
 * Exécuter une boucle Python de recherche de seuil et identifier la valeur
 * renvoyée.
 *
 * @author Stéphane Guyon
 */
export default class ValeurRenvoyeeAlgorithmeSeuil extends ExerciceSimple {
  nouvelleVersion(): void {
    const lettre = choice(['u', 'v', 'w'])
    const nomFonction = choice(['seuil', 'rangSeuil', 'premierRang'])
    const u0 = randint(2, 10)
    const coefficient = choice([2, 3])
    const termeConstant = randint(2, 10)
    const seuil = choice([500, 1000, 2000, 5000])
    const coefficientTex = texNombre(coefficient)
    const coefficientPython = String(coefficient)

    const valeurs = [u0]
    while (valeurs.at(-1)! <= seuil && valeurs.length < 100) {
      valeurs.push(coefficient * valeurs.at(-1)! + termeConstant)
    }
    const rang = valeurs.length - 1
    const valeurAvantSeuil = valeurs[rang - 1]
    const valeurAuSeuil = valeurs[rang]

    const programme = `def ${nomFonction}():
    n = 0
    ${lettre} = ${u0}
    while ${lettre} <= ${seuil}:
        n = n + 1
        ${lettre} = ${coefficientPython}*${lettre} + ${termeConstant}
    return n`

    this.question = `On considère la suite $(${lettre}_n)$ définie sur $\\mathbb N$ par $${lettre}_0=${u0}$ et, pour tout entier naturel $n$, par :<br>
$${lettre}_{n+1}=${coefficientTex}${lettre}_n+${termeConstant}$.<br><br>
On définit la fonction Python suivante :<br>
${scriptPython(programme, 6)}<br><br>
On exécute cette fonction avec l'appel ${texteCode(`${nomFonction}()`)}.<br>
Quelle valeur cet appel renvoie-t-il ?`

    this.reponse = this.versionQcm ? `$${rang}$` : rang
    this.distracteurs = [`$${rang - 1}$`, `$${rang + 1}$`, `$${rang + 2}$`]
    this.versionQcmOptions = {
      radio: true,
      vertical: false,
      dontKnow: this.sup4,
    }

    const rangs = valeurs.map((_, indice) => indice)
    const tableauVariables = tableauColonneLigne(
      [],
      ['n', lettre],
      [
        ...rangs.map((valeur) => texNombre(valeur)),
        ...valeurs.map((valeur) => texNombre(valeur)),
      ],
      1.2,
    )

    this.correction = `Les variables ${texteCode('n')} et ${texteCode(lettre)} sont initialisées avec le rang $0$ et le terme $${lettre}_0=${u0}$.<br><br>
Les valeurs de $${lettre}$ sont calculées avec la relation de récurrence :<br>
$${lettre}_1=${coefficientTex}\\times ${lettre}_0+${termeConstant}=${coefficientTex}\\times ${u0}+${termeConstant}=${valeurs[1]}$,<br>
$${lettre}_2=${coefficientTex}\\times ${lettre}_1+${termeConstant}=${coefficientTex}\\times ${valeurs[1]}+${termeConstant}=${valeurs[2]}$.<br>
Et ainsi de suite.<br><br>
Le tableau d'exécution donne les valeurs exactes des variables à chaque test de la condition du ${texteCode('while')} :<br><br>
${tableauVariables}<br><br>
Au rang $${rang - 1}$, on a $${lettre}_{${rang - 1}}=${texNombre(valeurAvantSeuil)}\\leqslant ${seuil}$ : la boucle continue.<br>
Au rang $${rang}$, on a $${lettre}_{${rang}}=${texNombre(valeurAuSeuil)}>${seuil}$ : la condition du ${texteCode('while')} devient fausse et la boucle s'arrête.<br>
La fonction exécute alors ${texteCode('return n')} et renvoie donc $${miseEnEvidence(String(rang))}$.`
  }

  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaire4CaseACocher = ['Ajout de « Je ne sais pas »', false]
    this.sup4 = false
    this.nbQuestionsModifiable = true
    this.versionQcmDisponible = true
    this.versionQcm = true
    this.formatChampTexte = KeyboardType.clavierNumbers
  }
}
