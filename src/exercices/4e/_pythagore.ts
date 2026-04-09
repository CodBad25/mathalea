import { orangeMathalea } from '../../lib/colors'
import { egalOuApprox } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'

/**
 * Crée une rédaction du théorème de Pythagore adaptée à la recherche de l'hypoténuse ou d'un côté de l'angle droit
 * @param {string} [A = 'A'] Nom du sommet de l'angle droit
 * @param {string} [B = 'B'] Nom d'une extrémité de l'hypoténuse (AB étant éventuellement la longueur du côté droit à chercher)
 * @param {string} [C = 'C'] Nom de l'autre extrémité de l'hypoténuse
 * @param {number} [rechercheHypotenuse = 1] Si 1, la rédaction concerne la recherche de l'hypoténuse. Si 2, la rédaction concerne la rédaction d'un côté de l'angle droit. Si autre chose, la rédaction s'arrête à la première égalité.
 * @param {number} [AB = 3] Longueur AB
 * @param {number} [AC = 4] Longueur AC
 * @param {number} [BC = 5] Longueur BC
 * @param {string}  [unite = 'cm'] Unité de la longueur recherchée
 * @param {string} [couleurReponse = '#f15929'] Couleur de la réponse : du type 'blue' ou du type '#f15929'
 * @example RedactionPythagore()
 * // Crée la rédaction du théorème de Pythagore dans un triangle ABC rectangle en A de dimensions 3-4-5 cm dont on recherche la longueur de l'hypoténuse.
 * @example RedactionPythagore('M','N','P',2,reponse,5,13,'dm')
 * // Crée la rédaction du théorème de Pythagore dans un triangle MNP rectangle en M de dimensions reponse-5-13 dm dont on recherche la longueur de MN.
 * // reponse doit être fournie à la fonction, elle n'est pas calculée par la fonction.
 * @author Éric Elter
 * @return {[string, string]} // Le premier élément du tableau est la rédaction complète, le second élément du tableau est le signe égal (ou arrondi) qui peut être utilisé si besoin pour introduire l'interactif.
 */
export function RedactionPythagore(
  A = 'A',
  B = 'B',
  C = 'C',
  rechercheHypotenuse = 1,
  AB = 3,
  AC = 4,
  BC = 5,
  unite = 'cm',
  couleurReponse = orangeMathalea,
) {
  let texte = ``
  let signeEgal = ``
  texte = `Le triangle $${A + B + C}$ est rectangle en $${A}$.`
  texte += `<br> D'après le théorème de Pythagore, on a : <br> <br>`

  if (rechercheHypotenuse === 1 || rechercheHypotenuse === 2) {
    texte += `$\\begin{aligned} ${B + C}^2&=${A + B}^2+${A + C}^2\\\\`
  } else {
    texte += `$ ${miseEnEvidence(`${B + C}^2=${A + B}^2+${A + C}^2`, couleurReponse)}\\\\$`
  }
  if (rechercheHypotenuse === 1) {
    texte += `${B + C}^2&=${texNombre(AB, 2)}^2+${texNombre(AC, 2)}^2\\\\`
    texte += `${B + C}^2&=${texNombre(AB ** 2)}+${texNombre(AC ** 2)}\\\\`
    texte += `${B + C}^2&=${texNombre(AB ** 2 + AC ** 2, 2)}\\\\`
    texte += `\\text{Donc :}\\\\`
    texte += `${B + C}&=\\sqrt{${texNombre(
      AB ** 2 + AC ** 2,
      2,
    )}}\\text{ ${unite}}\\\\`
    signeEgal = egalOuApprox(Math.sqrt(AB ** 2 + AC ** 2), 2)
    texte += `${B + C} &${signeEgal} ${miseEnEvidence(
      texNombre(BC, 2),
      couleurReponse,
    )}${miseEnEvidence(`\\text{ ${unite}}`, couleurReponse)}\\\\`
    texte += `\\end{aligned}$ `
  } else if (rechercheHypotenuse === 2) {
    texte += `${texNombre(BC, 2)}^2&=${A + B}^2+${texNombre(AC)}^2\\\\`
    texte += `${texNombre(BC ** 2)}&=${A + B}^2+${texNombre(AC ** 2)}\\\\`
    texte += `${A + B}^2&=${texNombre(BC ** 2)} - ${texNombre(AC ** 2)}\\\\`
    texte += `${A + B}^2&=${texNombre(BC ** 2 - AC ** 2, 2)}\\\\`
    texte += `\\text{Donc : }\\\\`
    texte += `${A + B}&=\\sqrt{${texNombre(
      BC ** 2 - AC ** 2,
      2,
    )}}\\text{ ${unite}}\\\\`
    signeEgal = egalOuApprox(Math.sqrt(BC ** 2 - AC ** 2), 2)
    texte += `${A + B} &${signeEgal} ${miseEnEvidence(
      texNombre(AB, 2),
      couleurReponse,
    )}${miseEnEvidence(`\\text{ ${unite}}`, couleurReponse)}\\\\`
    texte += `\\end{aligned}$ `
  }
  return [texte, signeEgal]
}
