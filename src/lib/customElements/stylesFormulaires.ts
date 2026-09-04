/**
 * Styles partagés par les sélecteurs affichés dans un énoncé
 * (`QuestionsDeCoursSelecteur`, `SerieAleatoireSelecteur`).
 *
 * Ils sont repris des formulaires de réglages
 * (`presentationalComponents/FormulaireComplexe.svelte`) pour que ces
 * sélecteurs ne détonnent pas dans le reste du site, en thème clair comme en
 * thème sombre.
 */

export const STYLE_CHAMP =
  'px-2 py-1 h-10 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark ' +
  'text-coopmaths-corpus dark:text-coopmathsdark-corpus ' +
  'border border-coopmaths-action dark:border-coopmathsdark-action ' +
  'focus:outline-0 focus:ring-0'

/** `pr-10` laisse la place à la flèche, qui sinon recouvre le libellé. */
export const STYLE_SELECT = `${STYLE_CHAMP} pr-10 max-w-full`

export const STYLE_CASE =
  'w-4 h-4 rounded shrink-0 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark ' +
  'border-coopmaths-action dark:border-coopmathsdark-action cursor-pointer ' +
  'checked:bg-coopmaths-action dark:checked:bg-coopmathsdark-action ' +
  'focus:ring-3 focus:ring-coopmaths-action dark:focus:ring-coopmathsdark-action'

export const STYLE_BOUTON_TEXTE =
  'text-coopmaths-action hover:text-coopmaths-action-darkest ' +
  'dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-darkest underline'
