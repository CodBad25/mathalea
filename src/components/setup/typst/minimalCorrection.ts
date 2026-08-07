import { orangeMathalea } from '../../../lib/colors'
import { occurrencesMiseEnEvidence } from '../diaporama/answersTable'

/**
 * Réglage « Correction minimale » de la vue Typst : ne garder d'une correction
 * que les réponses mises en évidence en orange, dans leur mise en forme
 * d'origine. Deux façons de mettre en évidence coexistent dans les exercices :
 *
 * - `miseEnEvidence()` — dans une formule, produit `{\color{#F15929}\boldsymbol{…}}` ;
 * - `texteEnCouleurEtGras()` — hors formule, produit en HTML un `<span>` orange
 *   et gras (les exercices à QCM s'en servent pour désigner la bonne réponse).
 *
 * Une correction qui n'en contient aucune — ou dont la mise en évidence utilise
 * une autre couleur, choisie justement pour ne pas désigner la réponse — est
 * renvoyée telle quelle.
 */

/** Séparateur entre plusieurs réponses d'une même correction (cadratin) */
const SEPARATEUR = '&emsp;'

/**
 * Repère de sous-question produit par `numAlpha` (`a)`, `b)`, `1)`…) : un span
 * orange et gras lui aussi, mais qui ne désigne aucune réponse.
 */
const REPERE_SOUS_QUESTION = /^\s*(?:[a-z]|\d{1,2})\)(?:&nbsp;|\s)*$/i

/** Balise ouvrante `<span …>`, avec ses attributs */
const OUVERTURE_SPAN = /<span([^>]*)>/gi

/** Une réponse repérée dans la correction, avec sa position de départ */
interface Reponse {
  index: number
  /** Fragment à réémettre tel quel (HTML ou formule LaTeX) */
  extrait: string
}

/** Balisage produit par `miseEnEvidence()` en orange autour de `contenu` */
function miseEnEvidenceOrange(contenu: string): string {
  return `{\\color{${orangeMathalea}}\\boldsymbol{${contenu}}}`
}

/** Le style de ce span est-il celui de `texteEnCouleurEtGras()` en orange ? */
function estOrangeEtGras(attributs: string): boolean {
  const style = attributs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
  const valeur = style?.[1] ?? style?.[2] ?? ''
  if (!/font-weight\s*:\s*(?:bold|[6-9]00)/i.test(valeur)) return false
  const couleur = valeur.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)
  return (
    couleur != null &&
    couleur[1].trim().toLowerCase() === orangeMathalea.toLowerCase()
  )
}

/**
 * Position de la balise `</span>` fermant le span ouvert juste avant
 * `debutContenu`, en tenant compte des spans imbriqués (`texteEnCouleurEtGras`
 * peut envelopper un contenu qui en contient d'autres).
 */
function fermetureDuSpan(
  texte: string,
  debutContenu: number,
): { debutFermeture: number; finFermeture: number } | undefined {
  const balises = /<(\/?)span\b[^>]*>/gi
  balises.lastIndex = debutContenu
  let profondeur = 0
  let balise: RegExpExecArray | null
  while ((balise = balises.exec(texte)) !== null) {
    if (balise[1] === '') {
      profondeur++
      continue
    }
    if (profondeur === 0) {
      return {
        debutFermeture: balise.index,
        finFermeture: balise.index + balise[0].length,
      }
    }
    profondeur--
  }
  return undefined
}

/** Occurrences de `texteEnCouleurEtGras()` en orange, hors repères de sous-question */
function occurrencesTexteEnCouleurEtGras(correction: string): Reponse[] {
  const occurrences: Reponse[] = []
  OUVERTURE_SPAN.lastIndex = 0
  let ouverture: RegExpExecArray | null
  while ((ouverture = OUVERTURE_SPAN.exec(correction)) !== null) {
    if (!estOrangeEtGras(ouverture[1])) continue
    const debutContenu = OUVERTURE_SPAN.lastIndex
    const fermeture = fermetureDuSpan(correction, debutContenu)
    if (fermeture === undefined) break
    const contenu = correction.slice(debutContenu, fermeture.debutFermeture)
    OUVERTURE_SPAN.lastIndex = fermeture.finFermeture
    if (contenu.trim() === '' || REPERE_SOUS_QUESTION.test(contenu)) continue
    occurrences.push({
      index: ouverture.index,
      extrait: correction.slice(ouverture.index, fermeture.finFermeture),
    })
  }
  return occurrences
}

/**
 * Correction réduite à ses réponses mises en évidence en orange, séparées par
 * un cadratin. Renvoie la correction inchangée quand elle n'en contient aucune.
 */
export function minimalCorrection(correction: string): string {
  const spans = occurrencesTexteEnCouleurEtGras(correction)
  const reponses: Reponse[] = [
    ...occurrencesMiseEnEvidence(correction)
      .filter(
        ({ index, contenu }) =>
          contenu !== '' &&
          // une formule mise en évidence à l'intérieur d'un span orange est
          // déjà reprise avec lui : ne pas la compter une seconde fois
          !spans.some(
            (span) =>
              index > span.index && index < span.index + span.extrait.length,
          ),
      )
      .map(({ index, contenu }) => ({
        index,
        extrait: `$${miseEnEvidenceOrange(contenu)}$`,
      })),
    ...spans,
  ]
  if (reponses.length === 0) return correction
  reponses.sort((a, b) => a.index - b.index)
  const vus = new Set<string>()
  const extraits: string[] = []
  for (const { extrait } of reponses) {
    if (vus.has(extrait)) continue
    vus.add(extrait)
    extraits.push(extrait)
  }
  return extraits.join(SEPARATEUR)
}
