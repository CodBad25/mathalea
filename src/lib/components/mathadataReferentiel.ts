import { dictionnaireMathadata } from '../../json/dictionnaireMathadata'
import type { JSONReferentielObject } from '../types/referentiels'

type DictionnaireMathadata = Record<
  string,
  {
    title: string
    exercices: Record<string, { title: string }>
  }
>

// Utilisé pour les <img> (png) : une URL absolue fonctionne sans CORS pour l'affichage.
const MATHADATA_PNG_BASE = 'https://coopmaths.fr/alea/static/mathadata/tex'
// Utilisé pour récupérer le code LaTeX via `fetch()` : coopmaths.fr n'envoie pas
// d'en-têtes CORS, il faut donc un chemin relatif (même origine en prod, proxifié en dev).
const MATHADATA_TEX_BASE = 'static/mathadata/tex'
export const MATHADATA_TITLE =
  'MathAdata : les maths en résolvant des défis d’IA'

/**
 * Construit le référentiel des exercices statiques MathAdata (chapitre > exercice)
 * à partir de `dictionnaireMathadata.js`, sur le modèle des référentiels d'annales
 * statiques (`tasks/dictionnaireToReferentiel.js`).
 */
function buildReferentielMathadata(): JSONReferentielObject {
  const dictionnaire = dictionnaireMathadata as DictionnaireMathadata
  const chapitres: JSONReferentielObject = {}
  for (const chapKey in dictionnaire) {
    const chapitre = dictionnaire[chapKey]
    const exercices: JSONReferentielObject = {}
    for (const uuid in chapitre.exercices) {
      const exercice = chapitre.exercices[uuid]
      exercices[uuid] = {
        uuid,
        tags: [],
        typeExercice: 'static',
        titre: exercice.title,
        png: `${MATHADATA_PNG_BASE}/png/${uuid}.png`,
        pngCor: `${MATHADATA_PNG_BASE}/png/${uuid}_cor.png`,
        tex: `${MATHADATA_TEX_BASE}/${uuid}.tex`,
        texCor: `${MATHADATA_TEX_BASE}/${uuid}_cor.tex`,
        url: `${MATHADATA_TEX_BASE}/${uuid}.tex`,
        urlcor: `${MATHADATA_TEX_BASE}/${uuid}_cor.tex`,
      }
    }
    chapitres[chapitre.title] = exercices
  }
  return { [MATHADATA_TITLE]: chapitres }
}

export const referentielMathadata: JSONReferentielObject =
  buildReferentielMathadata()

export function isMathadataUuid(uuid: string | undefined): boolean {
  return uuid !== undefined && uuid.startsWith('md-')
}
