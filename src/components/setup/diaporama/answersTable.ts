import { orangeMathalea } from '../../../lib/colors'
import { lettreDepuisChiffre } from '../../../lib/outils/outilString'
import type { IExercice } from '../../../lib/types'

/**
 * Motif produit par `miseEnEvidence()` en HTML : `{\color{#F15929}\boldsymbol{…}}`.
 * On accepte aussi la variante LaTeX `\color[HTML]{F15929}` et la casse
 * indifférente du code hexadécimal.
 */
const hexOrange = orangeMathalea.replace('#', '')
const regexpMiseEnEvidence = new RegExp(
  `\\\\color(?:\\[HTML\\])?\\{#?${hexOrange}\\}\\s*\\\\boldsymbol\\s*\\{`,
  'gi',
)

/**
 * Renvoie le contenu de l'accolade ouverte à `indexOuvrante`, en tenant compte
 * des accolades imbriquées et des accolades échappées.
 */
function contenuAccolade(
  texte: string,
  indexOuvrante: number,
): { contenu: string; indexFermante: number } | undefined {
  if (texte[indexOuvrante] !== '{') return undefined
  let profondeur = 0
  for (let i = indexOuvrante; i < texte.length; i++) {
    const caractere = texte[i]
    if (caractere === '\\') {
      i++ // on saute le caractère échappé (\{ , \} , \\ …)
      continue
    }
    if (caractere === '{') profondeur++
    else if (caractere === '}') {
      profondeur--
      if (profondeur === 0) {
        return { contenu: texte.slice(indexOuvrante + 1, i), indexFermante: i }
      }
    }
  }
  return undefined
}

/**
 * Occurrences de `miseEnEvidence()` en orange dans une correction, avec leur
 * position de départ dans le texte (pour pouvoir les remettre dans l'ordre
 * avec d'autres mises en évidence, voir `minimalCorrection` côté Typst).
 * Le contenu est renvoyé brut, sans dédoublonnage.
 */
export function occurrencesMiseEnEvidence(
  correction: string,
): { index: number; contenu: string }[] {
  const occurrences: { index: number; contenu: string }[] = []
  regexpMiseEnEvidence.lastIndex = 0
  let correspondance: RegExpExecArray | null
  while ((correspondance = regexpMiseEnEvidence.exec(correction)) !== null) {
    const indexOuvrante =
      correspondance.index + correspondance[0].length - 1 /* l'accolade */
    const accolade = contenuAccolade(correction, indexOuvrante)
    if (accolade === undefined) break
    occurrences.push({
      index: correspondance.index,
      contenu: accolade.contenu.trim(),
    })
    regexpMiseEnEvidence.lastIndex = accolade.indexFermante + 1
  }
  return occurrences
}

/**
 * Extrait d'une correction les réponses courtes mises en évidence en orange,
 * c'est-à-dire les contenus passés à `miseEnEvidence()` avec la couleur par
 * défaut. Les doublons sont supprimés, l'ordre d'apparition est conservé.
 */
export function extraitReponsesCourtes(correction: string): string[] {
  const reponses: string[] = []
  for (const { contenu } of occurrencesMiseEnEvidence(correction)) {
    if (contenu !== '' && !reponses.includes(contenu)) reponses.push(contenu)
  }
  return reponses
}

/**
 * Réécrit une réponse courte extraite sous forme de formule LaTeX autonome.
 * La couleur d'origine n'est volontairement pas reprise : dans le tableau des
 * réponses, seule la lettre du QCM est mise en orange.
 */
export function formuleReponseCourte(reponse: string): string {
  return `$\\boldsymbol{${reponse}}$`
}

/**
 * Renvoie les lettres des bonnes réponses du QCM de la question `questionIndex`
 * (tableau vide si la question n'est pas un QCM).
 *
 * L'ordre des propositions est celui déjà mélangé par `propositionsQcm()`, donc
 * les lettres correspondent à ce qui a été affiché pendant le diaporama.
 */
export function extraitLettresQcm(
  exercice: IExercice,
  questionIndex: number,
): string[] {
  const propositions = exercice.autoCorrection?.[questionIndex]?.propositions
  if (propositions === undefined || propositions.length < 2) return []
  const lettres: string[] = []
  propositions.forEach((proposition, index) => {
    if (proposition.statut) lettres.push(lettreDepuisChiffre(index + 1))
  })
  return lettres
}

/**
 * Largeurs (en pixels) sous lesquelles on affiche respectivement 2 ou 3
 * mini-tableaux côte à côte. Au-delà, on en affiche 4. Pensé pour un
 * vidéoprojecteur de classe : on privilégie l'occupation de la largeur plutôt
 * qu'un unique tableau tout en hauteur.
 */
const LARGEUR_SEUIL_2_COLONNES = 900
const LARGEUR_SEUIL_3_COLONNES = 1400

/**
 * Détermine le nombre de mini-tableaux à afficher côte à côte en fonction de
 * la largeur disponible, sans jamais dépasser le nombre de questions (pour ne
 * pas produire de tableaux vides).
 */
export function calculeNombreDeColonnes(
  largeurDisponible: number,
  nombreDeQuestions: number,
): number {
  const colonnesSouhaitees =
    largeurDisponible < LARGEUR_SEUIL_2_COLONNES
      ? 2
      : largeurDisponible < LARGEUR_SEUIL_3_COLONNES
        ? 3
        : 4
  return Math.max(1, Math.min(colonnesSouhaitees, nombreDeQuestions))
}

export type ColonneDeReponses = {
  /** Index (dans `order`, donc numéro de question - 1) de la première ligne de la colonne. */
  indexDeDepart: number
  /** Sous-ensemble de `order` affiché dans cette colonne. */
  lignes: number[]
}

/**
 * Répartit les questions en `nombreDeColonnes` mini-tableaux de tailles aussi
 * égales que possible (comme un multi-colonnage équilibré), la première
 * colonne recevant les premières questions, de gauche à droite.
 */
export function repartisEnColonnes(
  order: number[],
  nombreDeColonnes: number,
): ColonneDeReponses[] {
  const total = order.length
  if (total === 0 || nombreDeColonnes <= 0) return []
  const tailleDeBase = Math.floor(total / nombreDeColonnes)
  const reste = total % nombreDeColonnes
  const colonnes: ColonneDeReponses[] = []
  let indexDeDepart = 0
  for (let colonne = 0; colonne < nombreDeColonnes; colonne++) {
    const taille = tailleDeBase + (colonne < reste ? 1 : 0)
    if (taille === 0) break
    colonnes.push({
      indexDeDepart,
      lignes: order.slice(indexDeDepart, indexDeDepart + taille),
    })
    indexDeDepart += taille
  }
  return colonnes
}
