import { alphanumericLayouts } from '../../../src/components/keyboard/layouts/alphanumericRows'
import { keyboardBlocks } from '../../../src/components/keyboard/layouts/keysBlocks'
import { keys as touchesConnues } from '../../../src/components/keyboard/lib/keycaps'
import { isAnswerType, type IExercice } from '../../../src/lib/types'

export type ResultatClavier = {
  questionIndex: number
  reponse: string
  clavier: string
  symbolesManquants: string[]
  isOk: boolean
}

type Regle = {
  nom: string
  requiert: (latexNettoye: string, latexBrut: string) => boolean
  satisfaitPar: string[]
  /** Satisfait aussi si une touche disponible insère un texte correspondant
   * (ex : une touche d'unité qui insère déjà `cm^2`, exposant compris). */
  satisfaitSiInsertionContient?: RegExp
}

/**
 * Retire les séquences LaTeX (commandes, `\text{...}`) pour ne garder que les
 * lettres, chiffres, parenthèses et opérateurs réellement affichés, sans être
 * trompé par des lettres internes à une commande (le `x` de `\times` par
 * exemple).
 */
function nettoie(latex: string): string {
  return latex
    .replace(/\\text\{[^{}]*\}/g, ' ')
    .replace(
      /\\(mathbb|mathrm|operatorname|overline|underline|vec|widehat)\{[^{}]*\}/g,
      ' ',
    )
    .replace(/\\[a-zA-Z]+/g, ' ')
}

const VARIABLES = ['x', 'y', 'z', 'a', 'b', 'c', 'k', 'n', 'h']

const REGLES: Regle[] = [
  {
    nom: 'parenthèses',
    requiert: (nettoyee) => /[()]/.test(nettoyee),
    satisfaitPar: ['(', ')', 'PARENTHESES'],
  },
  ...VARIABLES.map((lettre) => ({
    nom: `variable ${lettre}`,
    requiert: (nettoyee: string) =>
      new RegExp(`(?<![a-zA-Z0-9])${lettre}(?![a-zA-Z0-9])`).test(nettoyee),
    // `HOUR` insère aussi un `h` (texte des durées), sans être une variable.
    satisfaitPar:
      lettre === 'h'
        ? [`${lettre}Math`, lettre, 'HOUR']
        : [`${lettre}Math`, lettre],
  })),
  {
    nom: 'addition',
    requiert: (nettoyee) => /\+/.test(nettoyee),
    // `PLUS_INFTY` insère directement `+\infty`, signe compris.
    satisfaitPar: ['ADD', 'PLUS_INFTY'],
  },
  {
    nom: 'soustraction',
    requiert: (nettoyee) => /-/.test(nettoyee),
    satisfaitPar: ['SUB', 'MINUS_INFTY'],
  },
  {
    nom: 'multiplication',
    requiert: (_nettoyee, brut) => /\\times|\*/.test(brut),
    satisfaitPar: ['MULT', 'AST'],
  },
  {
    nom: 'division',
    requiert: (_nettoyee, brut) => /\\div/.test(brut),
    satisfaitPar: ['DIV'],
  },
  {
    nom: 'puissance au carré',
    requiert: (_nettoyee, brut) => /\^2\b|\^\{2\}/.test(brut),
    // Les touches d'unités (aire, volume...) insèrent déjà l'exposant, ex :
    // `\operatorname{cm}^2`, sans passer par une touche `SQ`/`POW` dédiée.
    satisfaitPar: ['SQ', 'POW'],
    satisfaitSiInsertionContient: /\^2\b|\^\{2\}/,
  },
  {
    nom: 'fraction',
    requiert: (_nettoyee, brut) => /\\d?frac\{/.test(brut),
    satisfaitPar: ['FRAC'],
  },
  {
    nom: 'virgule',
    requiert: (nettoyee) => /,/.test(nettoyee),
    satisfaitPar: ['COMMA'],
  },
]

/**
 * Le bloc `alphanumeric` n'est pas dans `keyboardBlocks` : c'est un clavier
 * QWERTY complet (lettres, chiffres, opérateurs, parenthèses...) affiché par
 * `Alphanumeric.svelte` à partir de `alphanumericLayouts`.
 */
const clesAlphanumeric = new Set(
  Object.values(alphanumericLayouts)
    .flat(2)
    .map((cle) => String(cle)),
)

function clesDuClavier(dataKeyboard: string): Set<string> {
  const cles = new Set<string>()
  const blocs = keyboardBlocks as unknown as Record<
    string,
    { keycaps: { inline: unknown[]; block: unknown[] } }
  >
  for (const nomBloc of dataKeyboard.split(' ').filter(Boolean)) {
    if (nomBloc === 'alphanumeric') {
      for (const cle of clesAlphanumeric) cles.add(cle)
      continue
    }
    const bloc = blocs[nomBloc]
    if (!bloc) continue
    for (const cle of [...bloc.keycaps.inline, ...bloc.keycaps.block]) {
      cles.add(String(cle))
    }
  }
  return cles
}

/** Texte réellement inséré par une touche (repli sur son affichage). */
function insertionDe(nomCle: string): string {
  const touche = (
    touchesConnues as Record<string, { insert?: string; display?: string }>
  )[nomCle]
  return touche?.insert ?? touche?.display ?? ''
}

function extraireClaviers(html: string): string[] {
  const re = /<mathalea-mathfield\b[^>]*\bdata-keyboard="([^"]*)"[^>]*>/g
  return [...html.matchAll(re)].map((m) => m[1])
}

/**
 * Compare, pour chaque champ MathLive d'un exercice déjà généré (nouvelleVersion
 * exécutée avec `interactif = true` et `context.isHtml = true`), les symboles
 * requis par la réponse attendue aux touches réellement fournies par le
 * clavier assigné à la question. Permet de repérer les exercices où le
 * clavier ne permet pas de saisir sa propre réponse (ex : `x` ou les
 * parenthèses manquants).
 */
export function verifyKeyboardCoverage(exercice: IExercice): ResultatClavier[] {
  const results: ResultatClavier[] = []
  for (let i = 0; i < exercice.autoCorrection.length; i++) {
    const ac = exercice.autoCorrection[i]
    const format = ac?.formatInteractif ?? 'mathlive'
    if (format !== 'mathlive') continue
    const valeur = ac?.valeur
    if (!valeur) continue
    // Une vérification par callback (voir `verifier-comparison.ts`) accepte
    // n'importe quelle notation équivalente : la valeur de référence n'est
    // pas ce que l'élève doit reproduire caractère pour caractère.
    if (typeof (valeur as { callback?: unknown }).callback === 'function') {
      continue
    }

    const html = exercice.listeQuestions?.[i] ?? ''
    // `multi-mathfield` compose son propre clavier par champ (JSON encodé
    // dans `data-options`) : un `<mathalea-mathfield>` isolé peut traîner
    // ailleurs dans le même HTML sans rapport avec ces champs. On ne sait pas
    // encore l'analyser correctement, donc on ne se prononce pas dessus.
    if (/<multi-mathfield\b/.test(html)) continue
    const claviers = extraireClaviers(html)
    if (claviers.length === 0) continue

    const clesDisponibles = new Set<string>()
    for (const clavier of claviers) {
      for (const cle of clesDuClavier(clavier)) clesDisponibles.add(cle)
    }

    for (const [key, answer] of Object.entries(valeur)) {
      if (key === 'bareme' || key === 'feedback') continue
      if (typeof answer === 'function') continue
      if (!isAnswerType(answer)) continue
      // Une vérification par callback (voir `verifier-comparison.ts`) accepte
      // n'importe quelle notation équivalente : la valeur de référence n'est
      // pas ce que l'élève doit reproduire caractère pour caractère.
      if (typeof (answer as { callback?: unknown }).callback === 'function') {
        continue
      }
      // Ces réponses ne se saisissent pas comme un unique champ MathLive :
      // intervalle, n-uplet, suite... (voir aussi `verifier-comparison.ts`).
      const options = answer.options ?? {}
      if (
        options.ensembleDeNombres ||
        options.suiteDeNombres ||
        options.kUplet ||
        options.suiteRangeeDeNombres
      ) {
        continue
      }
      const reponseBrute = Array.isArray(answer.value)
        ? String(answer.value[0])
        : String(answer.value)
      const nettoyee = nettoie(reponseBrute)
      const manquants: string[] = []
      for (const regle of REGLES) {
        if (!regle.requiert(nettoyee, reponseBrute)) continue
        // `handleFraction` accepte l'écriture décimale avant de juger la
        // fraction : la touche FRAC n'est alors pas indispensable.
        if (regle.nom === 'fraction' && options.nombreDecimalSeulement) {
          continue
        }
        const satisfait =
          regle.satisfaitPar.some((cle) => clesDisponibles.has(cle)) ||
          (regle.satisfaitSiInsertionContient != null &&
            [...clesDisponibles].some((cle) =>
              regle.satisfaitSiInsertionContient!.test(insertionDe(cle)),
            ))
        if (!satisfait) manquants.push(regle.nom)
      }
      results.push({
        questionIndex: i,
        reponse: reponseBrute,
        clavier: claviers.join(' '),
        symbolesManquants: manquants,
        isOk: manquants.length === 0,
      })
    }
  }
  return results
}
