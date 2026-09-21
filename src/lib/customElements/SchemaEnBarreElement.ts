import { context } from '../../modules/context'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

/**
 * Custom element « schéma en barre » : les quatre schémas de modélisation
 * des problèmes arithmétiques (additif ou multiplicatif, parties-tout ou
 * comparaison), dont tous les textes sont éditables.
 *
 * Trois rendus : HTML (interactif ou figé), LaTeX (TikZ) et Typst.
 * La recette côté exercice est dans `addSchemaEnBarre()` ; l'outil du
 * professeur est l'exercice `P030`.
 *
 * @author Rémi Angot
 */

export const TYPES_SCHEMA_EN_BARRE = [
  'additif-parties-tout',
  'additif-comparaison',
  'multiplicatif-parties-tout',
  'multiplicatif-comparaison',
] as const
export type SchemaEnBarreType = (typeof TYPES_SCHEMA_EN_BARRE)[number]

export const CLES_TEXTE_SCHEMA = [
  'tout',
  'partieA',
  'partieB',
  'difference',
  'part',
  'nombreDeParts',
  'etiquetteA',
  'etiquetteB',
  'nFois',
] as const
export type CleTexteSchema = (typeof CLES_TEXTE_SCHEMA)[number]

/** 2 à 5 rectangles dessinés, ou `'plus'` : trois rectangles puis des pointillés. */
export type NbRectangles = 2 | 3 | 4 | 5 | 'plus'
export const NB_RECTANGLES_CHOIX: NbRectangles[] = [2, 3, 4, 5, 'plus']

export type TextesSchema = Record<CleTexteSchema, string>

export type SchemaEnBarreState = {
  type: SchemaEnBarreType | null
  textes: TextesSchema
  nbRectangles: NbRectangles
  /**
   * Dans le schéma additif de comparaison, l'accolade « Tout » (A + B) n'est
   * affichée qu'à la demande : la plupart des problèmes n'en ont pas besoin.
   */
  toutVisible: boolean
}

/**
 * Schéma attendu par un exercice : seuls les textes renseignés (non vides)
 * sont vérifiés ; `nbRectangles` absent n'est pas vérifié (par exemple quand
 * le nombre de parts est l'inconnue du problème).
 */
export type SchemaEnBarreAttendu = {
  type: SchemaEnBarreType
  textes: Partial<TextesSchema>
  nbRectangles?: NbRectangles
  /**
   * Textes affichés dans le schéma de la correction mais non vérifiés
   * (par exemple les étiquettes A et B, que l'élève nomme comme il veut).
   */
  textesIndicatifs?: Partial<TextesSchema>
}

export const TITRES_SCHEMA: Record<SchemaEnBarreType, string> = {
  'additif-parties-tout': 'Additif de parties-tout',
  'additif-comparaison': 'Additif de comparaison',
  'multiplicatif-parties-tout': 'Multiplicatif de parties-tout',
  'multiplicatif-comparaison': 'Multiplicatif de comparaison',
}

/** Libellés génériques, affichés dans les vignettes du choix et en `aria-label` des champs. */
export const LIBELLES_TEXTE: TextesSchema = {
  tout: 'Tout',
  partieA: 'Partie A',
  partieB: 'Partie B',
  difference: 'Différence',
  part: 'Part',
  nombreDeParts: 'Nombre de parts',
  etiquetteA: 'A',
  etiquetteB: 'B',
  nFois: 'N fois',
}

/** Textes qui ont un sens dans chaque type de schéma. */
export const CLES_PAR_TYPE: Record<SchemaEnBarreType, CleTexteSchema[]> = {
  'additif-parties-tout': ['tout', 'partieA', 'partieB'],
  'additif-comparaison': ['partieA', 'partieB', 'difference', 'tout'],
  'multiplicatif-parties-tout': ['tout', 'part', 'nombreDeParts'],
  'multiplicatif-comparaison': [
    'etiquetteA',
    'etiquetteB',
    'part',
    'nFois',
    'tout',
  ],
}

const NB_RECTANGLES_PAR_DEFAUT: NbRectangles = 3

export function textesVides(): TextesSchema {
  return Object.fromEntries(
    CLES_TEXTE_SCHEMA.map((cle) => [cle, '']),
  ) as TextesSchema
}

function estTypeSchema(value: unknown): value is SchemaEnBarreType {
  return (
    typeof value === 'string' &&
    (TYPES_SCHEMA_EN_BARRE as readonly string[]).includes(value)
  )
}

function estNbRectangles(value: unknown): value is NbRectangles {
  return value === 'plus' || (NB_RECTANGLES_CHOIX as unknown[]).includes(value)
}

function normaliseTextes(value: unknown): TextesSchema {
  const textes = textesVides()
  if (value == null || typeof value !== 'object') return textes
  for (const cle of CLES_TEXTE_SCHEMA) {
    const texte = (value as Record<string, unknown>)[cle]
    if (typeof texte === 'string') textes[cle] = texte
    else if (typeof texte === 'number') textes[cle] = String(texte)
  }
  return textes
}

/** Relit un état (objet ou JSON), en tolérant les champs manquants. */
export function parseSchemaEnBarreState(
  value: unknown,
): SchemaEnBarreState | null {
  if (typeof value === 'string') {
    if (value.trim() === '') return null
    try {
      return parseSchemaEnBarreState(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (value == null || typeof value !== 'object') return null
  const candidate = value as Partial<SchemaEnBarreState>
  return {
    type: estTypeSchema(candidate.type) ? candidate.type : null,
    textes: normaliseTextes(candidate.textes),
    nbRectangles: estNbRectangles(candidate.nbRectangles)
      ? candidate.nbRectangles
      : NB_RECTANGLES_PAR_DEFAUT,
    toutVisible: candidate.toutVisible === true,
  }
}

function parseSchemaAttendu(value: unknown): SchemaEnBarreAttendu | null {
  if (typeof value === 'string') {
    try {
      return parseSchemaAttendu(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (value == null || typeof value !== 'object') return null
  const candidate = value as Partial<SchemaEnBarreAttendu>
  if (!estTypeSchema(candidate.type)) return null
  const textes: Partial<TextesSchema> = {}
  const source = candidate.textes ?? {}
  for (const cle of CLES_TEXTE_SCHEMA) {
    const texte = (source as Record<string, unknown>)[cle]
    if (typeof texte === 'string' && texte.trim() !== '') textes[cle] = texte
    else if (typeof texte === 'number') textes[cle] = String(texte)
  }
  return {
    type: candidate.type,
    textes,
    nbRectangles: estNbRectangles(candidate.nbRectangles)
      ? candidate.nbRectangles
      : undefined,
  }
}

/* -------------------------------------------------------------------------- */
/*                         Comparaison de deux schémas                         */
/* -------------------------------------------------------------------------- */

/** Les nombres contenus dans un texte (`3 €`, `Matin\n1 200,5 km`). */
function nombresDans(texte: string): number[] {
  const nombres = texte
    .replace(/[\u00a0\u202f]/g, ' ')
    .match(/-?\d+(?: \d{3})*(?:[.,]\d+)?/g)
  if (nombres == null) return []
  return nombres.map((nombre) =>
    Number(nombre.replace(/ /g, '').replace(',', '.')),
  )
}

/**
 * Un nombre est bien placé si le texte de l'élève contient le nombre du
 * texte attendu. Les textes eux-mêmes (grandeur, unité, `?`) ne sont pas
 * vérifiés : un texte attendu sans nombre est toujours accepté.
 */
export function nombreBienPlace(attendu: string, donne: string): boolean {
  const nombresAttendus = nombresDans(attendu)
  if (nombresAttendus.length !== 1) return true
  return nombresDans(donne).some(
    (nombre) => Math.abs(nombre - nombresAttendus[0]) < 1e-9,
  )
}

export type ResultatComparaisonSchema = {
  isOk: boolean
  typeOk: boolean
  nbRectanglesOk: boolean
  /** Textes dont le nombre attendu n'est pas retrouvé (après l'éventuel échange A/B). */
  clesFausses: CleTexteSchema[]
  /** `true` si le schéma est accepté avec les parties A et B échangées. */
  echangeAB: boolean
}

function clesFaussesPour(
  attendu: SchemaEnBarreAttendu,
  textes: TextesSchema,
): CleTexteSchema[] {
  return (Object.keys(attendu.textes) as CleTexteSchema[]).filter(
    (cle) => !nombreBienPlace(attendu.textes[cle] ?? '', textes[cle]),
  )
}

/**
 * Compare le schéma d'un élève au schéma attendu : le type, le nombre de
 * rectangles s'il est attendu, et la place des nombres. Dans un schéma additif
 * parties-tout, les deux parties jouent le même rôle : leur échange est
 * accepté.
 */
export function comparerSchemas(
  attendu: SchemaEnBarreAttendu,
  donne: SchemaEnBarreState,
): ResultatComparaisonSchema {
  const typeOk = donne.type === attendu.type
  const nbRectanglesOk =
    !attendu.type.startsWith('multiplicatif') ||
    attendu.nbRectangles == null ||
    attendu.nbRectangles === donne.nbRectangles
  let clesFausses = clesFaussesPour(attendu, donne.textes)
  let echangeAB = false
  if (attendu.type === 'additif-parties-tout' && clesFausses.length > 0) {
    const echange: TextesSchema = {
      ...donne.textes,
      partieA: donne.textes.partieB,
      partieB: donne.textes.partieA,
    }
    const clesFaussesEchange = clesFaussesPour(attendu, echange)
    if (clesFaussesEchange.length < clesFausses.length) {
      clesFausses = clesFaussesEchange
      echangeAB = true
    }
  }
  return {
    isOk: typeOk && nbRectanglesOk && clesFausses.length === 0,
    typeOk,
    nbRectanglesOk,
    clesFausses,
    echangeAB,
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Géométrie                                  */
/* -------------------------------------------------------------------------- */

/**
 * Dimensions communes aux trois rendus, en `em` pour le HTML (ce qui permet
 * les vignettes réduites par un simple `font-size`), converties en cm pour
 * LaTeX et en pt pour Typst.
 */
const GEO = {
  hauteurRect: 2.2,
  hauteurRectDeuxLignes: 3.4,
  largeurA: 7,
  largeurB: 8,
  largeurGrandeComparaison: 12,
  largeurPetiteComparaison: 6,
  largeurPart: 5,
  ecartParts: 0.25,
  largeurPointilles: 2.5,
}

/** Nombre de rectangles réellement dessinés et présence des pointillés. */
function dispositionParts(
  type: SchemaEnBarreType,
  nbRectangles: NbRectangles,
): { avant: number; pointilles: boolean; apres: number } {
  if (nbRectangles !== 'plus')
    return { avant: nbRectangles, pointilles: false, apres: 0 }
  // parties-tout : le dernier rectangle ferme la barre ; comparaison : non.
  return {
    avant: 3,
    pointilles: true,
    apres: type === 'multiplicatif-parties-tout' ? 1 : 0,
  }
}

function largeurLigneParts(
  type: SchemaEnBarreType,
  nbRectangles: NbRectangles,
): number {
  const { avant, pointilles, apres } = dispositionParts(type, nbRectangles)
  const nbRect = avant + apres
  const nbEcarts = nbRect - 1 + (pointilles ? 1 : 0)
  return (
    nbRect * GEO.largeurPart +
    nbEcarts * GEO.ecartParts +
    (pointilles ? GEO.largeurPointilles : 0)
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Rendu HTML                                  */
/* -------------------------------------------------------------------------- */

function echappeHtml(texte: string): string {
  return texte
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const SVG_ACCOLADE_HAUT =
  '<svg class="schema-en-barre__svg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0,12 C0,7 3,6 8,6 L44,6 C48,6 50,3 50,0 C50,3 52,6 56,6 L92,6 C97,6 100,7 100,12" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'
const SVG_ACCOLADE_DROITE =
  '<svg class="schema-en-barre__svg" viewBox="0 0 12 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0,0 C5,0 6,3 6,8 L6,44 C6,48 9,50 12,50 C9,50 6,52 6,56 L6,92 C6,97 5,100 0,100" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'

/** Le champ grandit avec son contenu (une ligne, puis deux). */
function ajusteHauteur(champ: HTMLTextAreaElement): void {
  champ.style.height = 'auto'
  if (champ.scrollHeight > 0) champ.style.height = `${champ.scrollHeight}px`
}

type OptionsRenduHtml = {
  editable: boolean
  /** Textes affichés quand le texte est vide (vignettes du choix). */
  placeholdersVisibles?: boolean
  /** Accolade « Tout » du schéma additif de comparaison (en édition). */
  toutVisible?: boolean
}

function em(valeur: number): string {
  return `${Number(valeur.toFixed(3))}em`
}

function champHtml(
  cle: CleTexteSchema,
  textes: TextesSchema,
  options: OptionsRenduHtml,
  classe = '',
): string {
  const libelle = LIBELLES_TEXTE[cle]
  const texte = textes[cle]
  if (options.editable) {
    // Un textarea plutôt qu'un input : un texte long passe sur deux lignes.
    return `<textarea class="schema-en-barre__champ ${classe}" rows="1" data-cle="${cle}" aria-label="${echappeHtml(libelle)}" autocomplete="off" spellcheck="false">${echappeHtml(texte)}</textarea>`
  }
  const affiche =
    texte === '' && options.placeholdersVisibles === true ? libelle : texte
  return `<span class="schema-en-barre__texte ${classe}" data-cle="${cle}">${echappeHtml(affiche).replaceAll('\n', '<br>')}</span>`
}

function rectHtml(
  cle: CleTexteSchema,
  largeur: number,
  variante: 'a' | 'b',
  textes: TextesSchema,
  options: OptionsRenduHtml,
  style = '',
): string {
  return `<div class="schema-en-barre__rect schema-en-barre__rect--${variante}" style="width:${em(largeur)};${style}">${champHtml(cle, textes, options)}</div>`
}

function accoladeHautHtml(
  cle: CleTexteSchema,
  largeur: number,
  textes: TextesSchema,
  options: OptionsRenduHtml,
  style = '',
): string {
  return `<div class="schema-en-barre__accolade schema-en-barre__accolade--haut" style="width:${em(largeur)};${style}"><div class="schema-en-barre__etiquette">${champHtml(cle, textes, options)}</div>${SVG_ACCOLADE_HAUT}</div>`
}

function ligneParts(
  type: SchemaEnBarreType,
  nbRectangles: NbRectangles,
  textes: TextesSchema,
  options: OptionsRenduHtml,
  style = '',
): string {
  const { avant, pointilles, apres } = dispositionParts(type, nbRectangles)
  const rect = () => rectHtml('part', GEO.largeurPart, 'a', textes, options)
  const morceaux = [
    ...Array.from({ length: avant }, rect),
    ...(pointilles
      ? [
          `<span class="schema-en-barre__pointilles" style="width:${em(GEO.largeurPointilles)}" aria-hidden="true">········</span>`,
        ]
      : []),
    ...Array.from({ length: apres }, rect),
  ]
  return `<div class="schema-en-barre__ligne schema-en-barre__ligne--parts" style="${style}">${morceaux.join('')}</div>`
}

/** Le HTML d'un schéma seul, sans le choix du type ni les réglages. */
export function schemaHtml(
  type: SchemaEnBarreType,
  textes: TextesSchema,
  nbRectangles: NbRectangles,
  options: OptionsRenduHtml,
): string {
  const classe = `schema-en-barre__schema schema-en-barre__schema--${type}`
  switch (type) {
    case 'additif-parties-tout': {
      const largeur = GEO.largeurA + GEO.largeurB
      return `<div class="${classe}"><div class="schema-en-barre__colonne">${accoladeHautHtml('tout', largeur, textes, options)}<div class="schema-en-barre__ligne">${rectHtml('partieA', GEO.largeurA, 'a', textes, options)}${rectHtml('partieB', GEO.largeurB, 'b', textes, options)}</div></div></div>`
    }
    case 'additif-comparaison': {
      const petite = GEO.largeurPetiteComparaison
      const grande = GEO.largeurGrandeComparaison
      // Figé : l'accolade « Tout » n'apparaît que si elle porte un texte.
      const avecTout = options.editable
        ? options.toutVisible === true
        : textes.tout !== ''
      const tout = avecTout
        ? `<div class="schema-en-barre__accolade schema-en-barre__accolade--droite" style="grid-column:3;grid-row:1/3">${SVG_ACCOLADE_DROITE}</div><div class="schema-en-barre__etiquette schema-en-barre__etiquette--cote" style="grid-column:4;grid-row:1/3">${champHtml('tout', textes, options)}</div>`
        : ''
      return `<div class="${classe}"><div class="schema-en-barre__grille" style="grid-template-columns:${em(petite)} ${em(grande - petite)} auto auto">${rectHtml('partieA', grande, 'a', textes, options, 'grid-column:1/3;grid-row:1')}${rectHtml('partieB', petite, 'b', textes, options, 'grid-column:1;grid-row:2')}<div class="schema-en-barre__difference" style="grid-column:2;grid-row:2"><div class="schema-en-barre__fleche"></div></div><div class="schema-en-barre__etiquette schema-en-barre__etiquette--sous" style="grid-column:2;grid-row:3">${champHtml('difference', textes, options)}</div>${tout}</div></div>`
    }
    case 'multiplicatif-parties-tout': {
      const largeur = largeurLigneParts(type, nbRectangles)
      return `<div class="${classe}"><div class="schema-en-barre__colonne">${accoladeHautHtml('tout', largeur, textes, options)}${ligneParts(type, nbRectangles, textes, options)}<div class="schema-en-barre__fleche" style="width:${em(largeur)}"></div><div class="schema-en-barre__etiquette schema-en-barre__etiquette--sous">${champHtml('nombreDeParts', textes, options)}</div></div></div>`
    }
    case 'multiplicatif-comparaison': {
      const largeur = largeurLigneParts(type, nbRectangles)
      return `<div class="${classe}"><div class="schema-en-barre__grille" style="grid-template-columns:auto auto auto auto"><div class="schema-en-barre__etiquette schema-en-barre__etiquette--rangee" style="grid-column:1;grid-row:1">${champHtml('etiquetteA', textes, options)}</div><div class="schema-en-barre__ligne" style="grid-column:2;grid-row:1">${rectHtml('part', GEO.largeurPart, 'a', textes, options)}</div><div class="schema-en-barre__etiquette schema-en-barre__etiquette--rangee" style="grid-column:1;grid-row:2">${champHtml('etiquetteB', textes, options)}</div>${ligneParts(type, nbRectangles, textes, options, 'grid-column:2;grid-row:2')}<div class="schema-en-barre__fleche" style="grid-column:2;grid-row:3;width:${em(largeur)}"></div><div class="schema-en-barre__etiquette schema-en-barre__etiquette--sous" style="grid-column:2;grid-row:4">${champHtml('nFois', textes, options)}</div><div class="schema-en-barre__accolade schema-en-barre__accolade--droite" style="grid-column:3;grid-row:1/3">${SVG_ACCOLADE_DROITE}</div><div class="schema-en-barre__etiquette schema-en-barre__etiquette--cote" style="grid-column:4;grid-row:1/3">${champHtml('tout', textes, options)}</div></div></div>`
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Rendu LaTeX                                 */
/* -------------------------------------------------------------------------- */

/** 1 em du rendu HTML vaut 0,45 cm sur le papier. */
const CM_PAR_EM = 0.45
const COULEUR_A_TIKZ = '{rgb,255:red,33;green,109;blue,154}'
const COULEUR_B_TIKZ = '{rgb,255:red,95;green,174;blue,221}'

function cm(valeur: number): string {
  return Number((valeur * CM_PAR_EM).toFixed(3)).toString()
}

/** Texte saisi (chiffres, unités, prénoms) protégé pour LaTeX. */
export function echappeLatex(texte: string): string {
  return texte
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([%$&#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

/** Un texte de rectangle peut tenir sur deux lignes (`Roses\n6 fleurs`). */
function texteRectLatex(texte: string): string {
  return texte.split('\n').map(echappeLatex).join('\\\\')
}

/** Hauteur des rectangles : plus haute si un texte occupe deux lignes. */
function hauteurRect(textes: TextesSchema): number {
  return CLES_TEXTE_SCHEMA.some((cle) => textes[cle].includes('\n'))
    ? GEO.hauteurRectDeuxLignes
    : GEO.hauteurRect
}

function rectTikz(
  x: number,
  y: number,
  largeur: number,
  h: number,
  couleur: string,
  texte: string,
): string {
  return `\\filldraw[fill=${couleur}, draw=white, line width=0.8pt] (${cm(x)},${cm(y)}) rectangle (${cm(x + largeur)},${cm(y + h)}) node[midway, white, font=\\bfseries, align=center] {${texteRectLatex(texte)}};`
}

function accoladeHautTikz(
  x1: number,
  x2: number,
  y: number,
  texte: string,
): string {
  return `\\draw[decorate, decoration={brace, amplitude=5pt}, color=${COULEUR_A_TIKZ}, line width=0.8pt] (${cm(x1)},${cm(y)}) -- (${cm(x2)},${cm(y)}) node[midway, above=6pt, color=${COULEUR_A_TIKZ}] {${echappeLatex(texte)}};`
}

function accoladeDroiteTikz(
  x: number,
  y1: number,
  y2: number,
  texte: string,
): string {
  return `\\draw[decorate, decoration={brace, amplitude=5pt}, color=${COULEUR_A_TIKZ}, line width=0.8pt] (${cm(x)},${cm(y2)}) -- (${cm(x)},${cm(y1)}) node[midway, right=6pt, color=${COULEUR_A_TIKZ}] {${echappeLatex(texte)}};`
}

function flecheTikz(
  x1: number,
  x2: number,
  y: number,
  texte: string,
  position: 'below' | 'above' = 'below',
): string {
  return `\\draw[<->, >=stealth, color=${COULEUR_A_TIKZ}, line width=0.8pt] (${cm(x1)},${cm(y)}) -- (${cm(x2)},${cm(y)}) node[midway, ${position}=2pt, color=${COULEUR_A_TIKZ}] {${echappeLatex(texte)}};`
}

function partsTikz(
  type: SchemaEnBarreType,
  nbRectangles: NbRectangles,
  y: number,
  h: number,
  texte: string,
): string[] {
  const { avant, pointilles, apres } = dispositionParts(type, nbRectangles)
  const lignes: string[] = []
  let x = 0
  for (let i = 0; i < avant; i++) {
    lignes.push(rectTikz(x, y, GEO.largeurPart, h, COULEUR_A_TIKZ, texte))
    x += GEO.largeurPart + GEO.ecartParts
  }
  if (pointilles) {
    lignes.push(
      `\\node[color=${COULEUR_A_TIKZ}] at (${cm(x + GEO.largeurPointilles / 2)},${cm(y + h / 2)}) {$\\cdots$};`,
    )
    x += GEO.largeurPointilles + GEO.ecartParts
  }
  for (let i = 0; i < apres; i++) {
    lignes.push(rectTikz(x, y, GEO.largeurPart, h, COULEUR_A_TIKZ, texte))
    x += GEO.largeurPart + GEO.ecartParts
  }
  return lignes
}

/** Le code TikZ d'un schéma, ou une chaîne vide si aucun type n'est choisi. */
export function schemaLatex(
  type: SchemaEnBarreType | null,
  textes: TextesSchema,
  nbRectangles: NbRectangles,
): string {
  if (type == null) return ''
  const h = hauteurRect(textes)
  const interligne = 0.6
  const lignes: string[] = []
  switch (type) {
    case 'additif-parties-tout': {
      lignes.push(
        rectTikz(0, 0, GEO.largeurA, h, COULEUR_A_TIKZ, textes.partieA),
      )
      lignes.push(
        rectTikz(
          GEO.largeurA,
          0,
          GEO.largeurB,
          h,
          COULEUR_B_TIKZ,
          textes.partieB,
        ),
      )
      lignes.push(
        accoladeHautTikz(0, GEO.largeurA + GEO.largeurB, h + 0.3, textes.tout),
      )
      break
    }
    case 'additif-comparaison': {
      const grande = GEO.largeurGrandeComparaison
      const petite = GEO.largeurPetiteComparaison
      const yA = h + interligne
      lignes.push(rectTikz(0, yA, grande, h, COULEUR_A_TIKZ, textes.partieA))
      lignes.push(rectTikz(0, 0, petite, h, COULEUR_B_TIKZ, textes.partieB))
      lignes.push(
        `\\draw[dashed, color=${COULEUR_A_TIKZ}] (${cm(grande)},${cm(yA)}) -- (${cm(grande)},${cm(0)});`,
      )
      lignes.push(flecheTikz(petite, grande, h / 2, textes.difference))
      if (textes.tout !== '')
        lignes.push(accoladeDroiteTikz(grande + 0.4, 0, yA + h, textes.tout))
      break
    }
    case 'multiplicatif-parties-tout': {
      const largeur = largeurLigneParts(type, nbRectangles)
      lignes.push(...partsTikz(type, nbRectangles, 0, h, textes.part))
      lignes.push(accoladeHautTikz(0, largeur, h + 0.3, textes.tout))
      lignes.push(flecheTikz(0, largeur, -0.5, textes.nombreDeParts))
      break
    }
    case 'multiplicatif-comparaison': {
      const largeur = largeurLigneParts(type, nbRectangles)
      const yA = h + interligne
      lignes.push(
        rectTikz(0, yA, GEO.largeurPart, h, COULEUR_A_TIKZ, textes.part),
      )
      lignes.push(
        `\\node[anchor=east, color=${COULEUR_A_TIKZ}] at (${cm(-0.4)},${cm(yA + h / 2)}) {${echappeLatex(textes.etiquetteA)}};`,
      )
      lignes.push(...partsTikz(type, nbRectangles, 0, h, textes.part))
      lignes.push(
        `\\node[anchor=east, color=${COULEUR_A_TIKZ}] at (${cm(-0.4)},${cm(h / 2)}) {${echappeLatex(textes.etiquetteB)}};`,
      )
      lignes.push(flecheTikz(0, largeur, -0.5, textes.nFois))
      lignes.push(
        accoladeDroiteTikz(
          Math.max(largeur, GEO.largeurPart) + 0.4,
          0,
          yA + h,
          textes.tout,
        ),
      )
      break
    }
  }
  return `\\begin{center}\n\\begin{tikzpicture}[baseline]\n${lignes.join('\n')}\n\\end{tikzpicture}\n\\end{center}`
}

/* -------------------------------------------------------------------------- */
/*                                 Rendu Typst                                 */
/* -------------------------------------------------------------------------- */

/** Texte saisi protégé pour le balisage Typst. */
export function echappeTypst(texte: string): string {
  return texte.replace(/[\\#$[\]*_`<>@~]/g, (caractere) => `\\${caractere}`)
}

const COULEUR_A_TYPST = 'rgb("#216d9a")'
const COULEUR_B_TYPST = 'rgb("#5faedd")'

function texteRectTypst(texte: string): string {
  return texte.split('\n').map(echappeTypst).join(' #linebreak() ')
}

function rectTypst(
  largeur: number,
  h: number,
  couleur: string,
  texte: string,
): string {
  return `box(width: ${em(largeur)}, height: ${em(h)}, fill: ${couleur}, stroke: 0.8pt + white, align(center + horizon, text(fill: white, weight: "bold")[${texteRectTypst(texte)}]))`
}

function etiquetteTypst(texte: string): string {
  return `text(fill: ${COULEUR_A_TYPST})[${echappeTypst(texte)}]`
}

function accoladeHautTypst(largeur: number, texte: string): string {
  return `box(width: ${em(largeur)}, mathalea-schema-span(${etiquetteTypst(texte)}, color: ${COULEUR_A_TYPST}))`
}

function flecheTypst(largeur: number, texte: string): string {
  return `box(width: ${em(largeur)}, mathalea-schema-span(${etiquetteTypst(texte)}, kind: "arrow", flip: true, color: ${COULEUR_A_TYPST}))`
}

/**
 * Accolade verticale à droite de `contenu`, étiquetée `texte`. La hauteur de
 * l'accolade est celle de `contenuMesure` (les barres seules, sans la flèche
 * du dessous), mesurée à la composition.
 */
function accoladeDroiteTypst(
  contenu: string,
  contenuMesure: string,
  texte: string,
): string {
  return `context {
  let taille = measure(${contenuMesure})
  stack(dir: ltr, spacing: 4pt, ${contenu}, box(height: taille.height, align(horizon, text(fill: ${COULEUR_A_TYPST}, size: 0.9em)[$ stretch(brace.r, size: #taille.height) $])), box(height: taille.height, align(horizon, ${etiquetteTypst(texte)})))
}`
}

function partsTypst(
  type: SchemaEnBarreType,
  nbRectangles: NbRectangles,
  h: number,
  texte: string,
): string {
  const { avant, pointilles, apres } = dispositionParts(type, nbRectangles)
  const rect = () => rectTypst(GEO.largeurPart, h, COULEUR_A_TYPST, texte)
  const morceaux = [
    ...Array.from({ length: avant }, rect),
    ...(pointilles
      ? [
          `box(width: ${em(GEO.largeurPointilles)}, height: ${em(h)}, align(center + horizon, text(fill: ${COULEUR_A_TYPST})[$ dots.c $]))`,
        ]
      : []),
    ...Array.from({ length: apres }, rect),
  ]
  return `stack(dir: ltr, spacing: ${em(GEO.ecartParts)}, ${morceaux.join(', ')})`
}

/** Le code Typst d'un schéma, ou une chaîne vide si aucun type n'est choisi. */
export function schemaTypst(
  type: SchemaEnBarreType | null,
  textes: TextesSchema,
  nbRectangles: NbRectangles,
): string {
  if (type == null) return ''
  const h = hauteurRect(textes)
  let corps = ''
  switch (type) {
    case 'additif-parties-tout': {
      const largeur = GEO.largeurA + GEO.largeurB
      corps = `stack(dir: ttb, spacing: 2pt, ${accoladeHautTypst(largeur, textes.tout)}, stack(dir: ltr, ${rectTypst(GEO.largeurA, h, COULEUR_A_TYPST, textes.partieA)}, ${rectTypst(GEO.largeurB, h, COULEUR_B_TYPST, textes.partieB)}))`
      break
    }
    case 'additif-comparaison': {
      const grande = GEO.largeurGrandeComparaison
      const petite = GEO.largeurPetiteComparaison
      const barres = `stack(dir: ttb, spacing: ${em(0.6)}, ${rectTypst(grande, h, COULEUR_A_TYPST, textes.partieA)}, stack(dir: ltr, ${rectTypst(petite, h, COULEUR_B_TYPST, textes.partieB)}, box(width: ${em(grande - petite)}, height: ${em(h)}, stroke: (right: (paint: ${COULEUR_A_TYPST}, dash: "dashed", thickness: 0.8pt)), align(center + horizon, text(fill: ${COULEUR_A_TYPST}, size: 0.9em)[$ stretch(<->, size: #${em(grande - petite - 0.4)}) $]))))`
      const avecDifference = `stack(dir: ttb, spacing: 2pt, ${barres}, stack(dir: ltr, box(width: ${em(petite)}), box(width: ${em(grande - petite)}, align(center, ${etiquetteTypst(textes.difference)}))))`
      corps =
        textes.tout === ''
          ? avecDifference
          : accoladeDroiteTypst(avecDifference, barres, textes.tout)
      break
    }
    case 'multiplicatif-parties-tout': {
      const largeur = largeurLigneParts(type, nbRectangles)
      corps = `stack(dir: ttb, spacing: 2pt, ${accoladeHautTypst(largeur, textes.tout)}, ${partsTypst(type, nbRectangles, h, textes.part)}, ${flecheTypst(largeur, textes.nombreDeParts)})`
      break
    }
    case 'multiplicatif-comparaison': {
      const largeur = largeurLigneParts(type, nbRectangles)
      const largeurEtiquette = 2
      const rangee = (etiquette: string, contenu: string) =>
        `stack(dir: ltr, spacing: 4pt, box(width: ${em(largeurEtiquette)}, align(right + horizon, ${etiquetteTypst(etiquette)})), ${contenu})`
      const barres = `stack(dir: ttb, spacing: ${em(0.6)}, ${rangee(textes.etiquetteA, rectTypst(GEO.largeurPart, h, COULEUR_A_TYPST, textes.part))}, ${rangee(textes.etiquetteB, partsTypst(type, nbRectangles, h, textes.part))})`
      const avecFleche = `stack(dir: ttb, spacing: 2pt, ${barres}, ${rangee('', flecheTypst(largeur, textes.nFois))})`
      corps = accoladeDroiteTypst(avecFleche, barres, textes.tout)
      break
    }
  }
  // `align(left)` : sans lui, les rangées de largeurs différentes seraient
  // centrées les unes par rapport aux autres par le `align(center)` extérieur.
  return `#align(center, block(breakable: false, align(left, ${corps})))`
}

/* -------------------------------------------------------------------------- */
/*                               Le custom element                             */
/* -------------------------------------------------------------------------- */

export type SchemaEnBarreCreateOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  /** Impose le type : le choix entre les quatre schémas n'est pas proposé. */
  typeImpose?: SchemaEnBarreType
  /** État initial (type déjà choisi, textes, nombre de rectangles). */
  initialState?: Partial<SchemaEnBarreState>
  interactivityOn?: boolean
}

export class SchemaEnBarreElement extends MathaleaCustomElement {
  static readonly elementTag = 'schema-en-barre'

  private state: SchemaEnBarreState = {
    type: null,
    textes: textesVides(),
    nbRectangles: NB_RECTANGLES_PAR_DEFAUT,
    toutVisible: false,
  }
  private boutonTout: HTMLButtonElement | null = null
  private typeImpose: SchemaEnBarreType | null = null
  private zoneSchema: HTMLElement | null = null
  private zoneChoix: HTMLElement | null = null
  private boutonChangerDeSchema: HTMLButtonElement | null = null
  /** Le choix du type et le schéma ne sont jamais affichés en même temps. */
  private choixVisible = false
  private zoneNbRectangles: HTMLElement | null = null
  private erreurs: { type: boolean; cles: Set<CleTexteSchema> } = {
    type: false,
    cles: new Set(),
  }

  static create({
    id,
    numeroExercice = 0,
    questionIndex = 0,
    typeImpose,
    initialState,
    interactivityOn = true,
  }: SchemaEnBarreCreateOptions = {}): string {
    const state = parseSchemaEnBarreState({
      ...initialState,
      type: initialState?.type ?? typeImpose ?? null,
    }) as SchemaEnBarreState
    if (context.isTypst) {
      return `<mathalea-typst>${schemaTypst(state.type, state.textes, state.nbRectangles)}</mathalea-typst>`
    }
    if (!context.isHtml) {
      // À l'impression, l'élève dessine lui-même le schéma s'il doit le choisir.
      if (interactivityOn && typeImpose == null) return ''
      return schemaLatex(state.type, state.textes, state.nbRectangles)
    }
    const elementId =
      id ?? `${this.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const html = super.create({
      id: elementId,
      typeImpose,
      initialState: state,
      interactivityOn,
    })
    if (!interactivityOn) return html
    return `${html}<span id="resultatCheckEx${numeroExercice}Q${questionIndex}"></span><div id="feedbackEx${numeroExercice}Q${questionIndex}" style="display: none"></div>`
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    const elementId = `${this.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`
    const element = document.getElementById(
      elementId,
    ) as SchemaEnBarreElement | null
    const attendu = parseSchemaAttendu(
      exercice.autoCorrection?.[questionIndex]?.valeur?.reponse?.value,
    )
    exercice.answers ??= {}
    if (element != null) exercice.answers[elementId] = element.value

    let isOk = false
    let feedback = ''
    if (element == null) {
      feedback = 'Le schéma est introuvable.'
    } else if (attendu == null) {
      feedback = 'Aucun schéma attendu pour cette question.'
    } else {
      const resultat = comparerSchemas(attendu, element.state)
      isOk = resultat.isOk
      element.marquerErreurs(resultat)
      if (element.state.type == null) {
        feedback = "Aucun schéma n'a été choisi."
      } else if (!resultat.typeOk) {
        feedback = `Ce n'est pas le bon type de schéma : il fallait un schéma ${TITRES_SCHEMA[attendu.type].toLowerCase()}.`
      } else if (!resultat.nbRectanglesOk) {
        feedback = 'Le nombre de rectangles ne correspond pas au problème.'
      } else if (resultat.clesFausses.length > 0) {
        feedback = `Le schéma est du bon type mais ${resultat.clesFausses.length > 1 ? 'certains nombres ne sont pas à la bonne place' : "un nombre n'est pas à la bonne place"}.`
      }
      element.interactivityOn = false
    }

    const resultatCheck = document.querySelector(
      `#resultatCheckEx${exercice.numeroExercice}Q${questionIndex}`,
    )
    if (resultatCheck != null) resultatCheck.innerHTML = isOk ? '😎' : '☹️'
    const zoneFeedback = document.querySelector(
      `#feedbackEx${exercice.numeroExercice}Q${questionIndex}`,
    ) as HTMLElement | null
    if (zoneFeedback != null) {
      zoneFeedback.textContent = feedback
      zoneFeedback.style.display = feedback === '' ? 'none' : 'block'
    }
    return {
      isOk,
      feedback,
      score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
    }
  }

  static formatStudentAnswer(rawAnswer: string): string {
    const state = parseSchemaEnBarreState(rawAnswer)
    if (state == null) return rawAnswer
    if (state.type == null) return 'aucun schéma choisi'
    const textes = CLES_PAR_TYPE[state.type]
      .filter((cle) => state.textes[cle] !== '')
      .map((cle) => `${LIBELLES_TEXTE[cle]} : ${state.textes[cle]}`)
    return [TITRES_SCHEMA[state.type], ...textes].join(' ; ')
  }

  connectedCallback(): void {
    this.hydrateCommonAttributes()
    const typeImpose = this.getAttribute('type-impose')
    this.typeImpose = estTypeSchema(typeImpose) ? typeImpose : null
    const initial = parseSchemaEnBarreState(this.getAttribute('initial-state'))
    if (initial != null) this.state = initial
    if (this.typeImpose != null) this.state.type = this.typeImpose
    this.render()
    if (!this.interactivityOn) this.renderReadOnlyMath()
  }

  disconnectedCallback(): void {
    this.innerHTML = ''
  }

  render(): string | void {
    if (context.isTypst) return this.renderTypst()
    if (!context.isHtml) return this.renderLatex()
    this.className = 'schema-en-barre'
    this.innerHTML = ''
    this.zoneChoix = null
    this.boutonChangerDeSchema = null
    this.boutonTout = null
    this.zoneNbRectangles = null
    if (this.interactivityOn && this.typeImpose == null) {
      this.choixVisible = this.state.type == null
      this.zoneChoix = document.createElement('div')
      this.zoneChoix.className = 'schema-en-barre__choix'
      this.zoneChoix.setAttribute('role', 'radiogroup')
      this.zoneChoix.setAttribute('aria-label', 'Type de schéma')
      this.zoneChoix.innerHTML = TYPES_SCHEMA_EN_BARRE.map(
        (type) =>
          `<button type="button" class="schema-en-barre__vignette" data-type="${type}" role="radio" aria-checked="false"><span class="schema-en-barre__vignette-schema" aria-hidden="true">${schemaHtml(type, LIBELLES_TEXTE, NB_RECTANGLES_PAR_DEFAUT, { editable: false })}</span><span class="schema-en-barre__vignette-titre">${TITRES_SCHEMA[type]}</span></button>`,
      ).join('')
      this.zoneChoix
        .querySelectorAll<HTMLButtonElement>('[data-type]')
        .forEach((bouton) =>
          bouton.addEventListener('click', () => {
            const type = bouton.dataset.type
            if (estTypeSchema(type)) this.choisirType(type)
          }),
        )
      this.appendChild(this.zoneChoix)
    }
    this.zoneSchema = document.createElement('div')
    this.zoneSchema.className = 'schema-en-barre__zone'
    this.appendChild(this.zoneSchema)
    if (this.zoneChoix != null) {
      this.boutonChangerDeSchema = document.createElement('button')
      this.boutonChangerDeSchema.type = 'button'
      this.boutonChangerDeSchema.className = 'schema-en-barre__changer'
      this.boutonChangerDeSchema.textContent = 'Changer de schéma'
      this.boutonChangerDeSchema.addEventListener('click', () => {
        this.choixVisible = true
        this.dessinerSchema()
      })
    }
    if (this.interactivityOn) {
      this.zoneNbRectangles = document.createElement('div')
      this.zoneNbRectangles.className = 'schema-en-barre__nb-rectangles'
      this.zoneNbRectangles.innerHTML = `<span>Nombre de rectangles :</span>${NB_RECTANGLES_CHOIX.map(
        (nb) =>
          `<button type="button" data-nb="${nb}" aria-pressed="false" aria-label="${nb === 'plus' ? 'Plus de 5 rectangles' : `${nb} rectangle${nb > 1 ? 's' : ''}`}">${nb === 'plus' ? '+' : nb}</button>`,
      ).join('')}`
      this.zoneNbRectangles
        .querySelectorAll<HTMLButtonElement>('[data-nb]')
        .forEach((bouton) =>
          bouton.addEventListener('click', () => {
            const nb =
              bouton.dataset.nb === 'plus' ? 'plus' : Number(bouton.dataset.nb)
            if (estNbRectangles(nb)) this.choisirNbRectangles(nb)
          }),
        )
      this.appendChild(this.zoneNbRectangles)
      this.boutonTout = document.createElement('button')
      this.boutonTout.type = 'button'
      this.boutonTout.className = 'schema-en-barre__tout'
      this.boutonTout.addEventListener('click', () => this.basculerTout())
      this.appendChild(this.boutonTout)
    }
    if (this.boutonChangerDeSchema != null)
      this.appendChild(this.boutonChangerDeSchema)
    this.dessinerSchema()
  }

  protected renderLatex(): string {
    return schemaLatex(
      this.state.type,
      this.state.textes,
      this.state.nbRectangles,
    )
  }

  protected renderTypst(): string {
    return schemaTypst(
      this.state.type,
      this.state.textes,
      this.state.nbRectangles,
    )
  }

  get value(): string {
    return JSON.stringify(this.state)
  }

  set value(nextValue: string) {
    this.update(nextValue)
  }

  update(nextValue: string | Partial<SchemaEnBarreState>): void {
    const parsed = parseSchemaEnBarreState(nextValue)
    if (parsed == null) return
    this.state = parsed
    if (this.typeImpose != null) this.state.type = this.typeImpose
    this.erreurs = { type: false, cles: new Set() }
    if (this.isConnected) this.render()
  }

  protected onInteractivityChanged(): void {
    if (this.isConnected) this.render()
  }

  /** Colore les éléments faux après la vérification. */
  marquerErreurs(resultat: ResultatComparaisonSchema): void {
    this.erreurs = {
      type: !resultat.typeOk,
      cles: new Set(resultat.clesFausses),
    }
  }

  private choisirType(type: SchemaEnBarreType): void {
    this.choixVisible = false
    if (this.state.type !== type) {
      this.state.type = type
      this.signalerChangement()
    }
    this.dessinerSchema()
  }

  /** Affiche ou masque l'accolade « Tout » de la comparaison additive. */
  private basculerTout(): void {
    this.state.toutVisible = !this.state.toutVisible
    // Un texte masqué ne doit pas rester dans la réponse.
    if (!this.state.toutVisible) this.state.textes.tout = ''
    this.dessinerSchema()
    this.signalerChangement()
  }

  private choisirNbRectangles(nb: NbRectangles): void {
    if (this.state.nbRectangles === nb) return
    this.state.nbRectangles = nb
    this.dessinerSchema()
    this.signalerChangement()
  }

  private dessinerSchema(): void {
    if (this.zoneSchema == null) return
    const { type, textes, nbRectangles, toutVisible } = this.state
    if (this.boutonTout != null) {
      this.boutonTout.hidden =
        this.choixVisible || type !== 'additif-comparaison'
      this.boutonTout.textContent = toutVisible
        ? 'Masquer le tout'
        : 'Afficher le tout'
    }
    if (this.zoneChoix != null) {
      this.zoneChoix.hidden = !this.choixVisible
      this.zoneSchema.hidden = this.choixVisible
      if (this.boutonChangerDeSchema != null)
        this.boutonChangerDeSchema.hidden = this.choixVisible
      this.zoneChoix
        .querySelectorAll<HTMLButtonElement>('[data-type]')
        .forEach((bouton) => {
          const choisi = bouton.dataset.type === type
          bouton.classList.toggle('is-choisi', choisi)
          bouton.setAttribute('aria-checked', choisi ? 'true' : 'false')
          bouton.classList.toggle('is-faux', choisi && this.erreurs.type)
        })
    }
    if (this.zoneNbRectangles != null) {
      this.zoneNbRectangles.hidden =
        this.choixVisible || type == null || !type.startsWith('multiplicatif')
      this.zoneNbRectangles
        .querySelectorAll<HTMLButtonElement>('[data-nb]')
        .forEach((bouton) => {
          const actif = bouton.dataset.nb === String(nbRectangles)
          bouton.classList.toggle('is-actif', actif)
          bouton.setAttribute('aria-pressed', actif ? 'true' : 'false')
        })
    }
    if (type == null) {
      this.zoneSchema.innerHTML = ''
      return
    }
    this.zoneSchema.innerHTML = schemaHtml(type, textes, nbRectangles, {
      editable: this.interactivityOn,
      toutVisible,
    })
    this.zoneSchema
      .querySelectorAll<HTMLElement>('[data-cle]')
      .forEach((champ) => {
        const cle = champ.dataset.cle as CleTexteSchema
        champ.classList.toggle('is-faux', this.erreurs.cles.has(cle))
        if (champ instanceof HTMLTextAreaElement) {
          champ.addEventListener('input', () => this.saisir(cle, champ))
          ajusteHauteur(champ)
        }
      })
  }

  private saisir(cle: CleTexteSchema, champ: HTMLTextAreaElement): void {
    this.state.textes[cle] = champ.value
    ajusteHauteur(champ)
    // Les parts d'un schéma multiplicatif partagent le même texte.
    this.zoneSchema
      ?.querySelectorAll<HTMLTextAreaElement>(`textarea[data-cle="${cle}"]`)
      .forEach((autre) => {
        if (autre !== champ && autre.value !== champ.value) {
          autre.value = champ.value
          ajusteHauteur(autre)
        }
      })
    this.signalerChangement()
  }

  private signalerChangement(): void {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }
}

export type SchemaEnBarreOptions = Omit<
  SchemaEnBarreCreateOptions,
  'numeroExercice' | 'questionIndex'
> & {
  /** Schéma attendu pour la correction interactive. */
  attendu?: SchemaEnBarreAttendu
}

/**
 * Insère un schéma en barre dans une question. Avec `attendu`, la question
 * devient corrigeable : `verifQuestion()` compare le schéma de l'élève au
 * schéma attendu.
 */
export function addSchemaEnBarre(
  exercice: IExercice,
  questionIndex: number,
  { attendu, ...options }: SchemaEnBarreOptions = {},
): string {
  if (attendu != null) {
    exercice.autoCorrection[questionIndex] ??= {}
    exercice.autoCorrection[questionIndex].formatInteractif =
      SchemaEnBarreElement.elementTag
    exercice.autoCorrection[questionIndex].valeur = {
      reponse: { value: JSON.stringify(attendu) },
    }
  }
  return SchemaEnBarreElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
  })
}

registerMathaleaCustomElement(SchemaEnBarreElement)
