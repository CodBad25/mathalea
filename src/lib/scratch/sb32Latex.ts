// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

/** Un bloc Scratch tel que stocké dans project.json */
export interface ScratchBlock {
  opcode: string
  next: string | null
  parent: string | null
  inputs: Record<string, ScratchInput>
  fields: Record<string, [string, string | null]>
  shadow: boolean
  topLevel: boolean
  mutation?: {
    proccode?: string
    argumentnames?: string
  }
}

/** Valeur brute d'une entrée Scratch */
export type ScratchInputPrimitive = [number, string | number]
export type ScratchInputValue = ScratchInputPrimitive | string
export type ScratchInput = [number, ScratchInputValue | null]

/** Contexte de rendu : dictionnaire de blocs d'une cible */
export interface RenderCtx {
  blocks: Record<string, ScratchBlock>
}

/** Une cible Scratch (scène ou sprite) */
export interface ScratchTarget {
  name: string
  isStage: boolean
  blocks: Record<string, ScratchBlock>
}

/** Structure minimale d'un project.json Scratch 3 */
export interface ScratchProject {
  targets?: ScratchTarget[]
}

// ════════════════════════════════════════════════════════════
// HELPERS  (déclarés avant la table d'opcodes pour éviter TS7022)
// ════════════════════════════════════════════════════════════

/** Échappe les caractères spéciaux LaTeX. */
export function escapeTex(str: string): string {
  return String(str)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/%/g, '\\%')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
}

function field(block: ScratchBlock, name: string): string {
  const f = block.fields?.[name]
  if (!f) return '?'
  return escapeTex(String(f[0] ?? '?'))
}

function inputVal(
  block: ScratchBlock,
  inputName: string,
  ctx: RenderCtx,
): string {
  const input = block.inputs?.[inputName]
  if (!input) return '\\ovalnum{?}'
  const inner = input[1]
  if (inner == null) return '\\ovalnum{?}'

  if (Array.isArray(inner)) {
    const [type, value] = inner as ScratchInputPrimitive
    if (type === 9)
      return `\\pencolor{[HTML]{${String(value).replace('#', '').toUpperCase()}}}`
    if (type === 12) return `\\ovalvariable{${escapeTex(String(value))}}`
    if (type === 13) return `\\ovallist{${escapeTex(String(value))}}`
    if (type === 11) return `\\selectmenu{${escapeTex(String(value))}}`
    return `\\ovalnum{${escapeTex(String(value ?? ''))}}`
  }

  if (typeof inner === 'string') {
    const sub = ctx.blocks[inner]
    if (!sub) return '\\ovalnum{?}'
    return renderBlock(sub, ctx)
  }

  return '\\ovalnum{?}'
}

// ════════════════════════════════════════════════════════════
// RENDU DES BLOCS  (déclarés avant la table pour les mêmes raisons)
// ════════════════════════════════════════════════════════════

const INDENT = '  '

interface Substack {
  content: string
}

function renderStructured(
  macroLine: string,
  substacks: Substack[],
  indent: string,
): string {
  const parts: string[] = [indent + macroLine]
  for (const { content } of substacks) {
    if (content.trim() === '') {
      parts.push(`${indent}{ }`)
    } else {
      parts.push(`${indent}{`)
      parts.push(content)
      parts.push(`${indent}}`)
    }
  }
  return parts.join('\n')
}

function renderSubstack(
  block: ScratchBlock,
  inputName: string,
  ctx: RenderCtx,
  childIndent: string,
): string {
  const input = block.inputs?.[inputName]
  if (!input || !input[1]) return ''
  return renderSequence(input[1] as string, ctx, childIndent)
}

function renderSequence(startId: string, ctx: RenderCtx, indent = ''): string {
  const lines: string[] = []
  let id: string | null = startId
  while (id) {
    const b: ScratchBlock | undefined = ctx.blocks[id]
    if (!b) break
    if (!b.shadow) {
      const r = renderBlock(b, ctx, indent)
      if (r) lines.push(r)
    }
    id = b.next
  }
  return lines.join('\n')
}

function renderProcDef(b: ScratchBlock, ctx: RenderCtx): string {
  const protoId = b.inputs?.['custom_block']?.[1]
  const proto = typeof protoId === 'string' ? ctx.blocks[protoId] : null
  const name = proto?.mutation?.proccode ?? 'mon bloc'
  return `\\initmoreblocks{définir \\namemoreblocks{${escapeTex(name)}}}`
}

function renderIf(b: ScratchBlock, ctx: RenderCtx, indent: string): string {
  return renderStructured(
    `\\blockif{si ${inputVal(b, 'CONDITION', ctx)} alors}`,
    [{ content: renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT) }],
    indent,
  )
}

function renderIfElse(b: ScratchBlock, ctx: RenderCtx, indent: string): string {
  return renderStructured(
    `\\blockifelse{si ${inputVal(b, 'CONDITION', ctx)} alors}`,
    [
      { content: renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT) },
      { content: renderSubstack(b, 'SUBSTACK2', ctx, indent + INDENT) },
    ],
    indent,
  )
}

function renderRepeat(b: ScratchBlock, ctx: RenderCtx, indent: string): string {
  return renderStructured(
    `\\blockrepeat{répéter ${inputVal(b, 'TIMES', ctx)} fois}`,
    [{ content: renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT) }],
    indent,
  )
}

function renderRepeatUntil(
  b: ScratchBlock,
  ctx: RenderCtx,
  indent: string,
): string {
  return renderStructured(
    `\\blockrepeat{répéter jusqu'à ${inputVal(b, 'CONDITION', ctx)}}`,
    [{ content: renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT) }],
    indent,
  )
}

function renderForever(
  b: ScratchBlock,
  ctx: RenderCtx,
  indent: string,
): string {
  return renderStructured(
    `\\blockinfloop{répéter indéfiniment}`,
    [{ content: renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT) }],
    indent,
  )
}

function renderBlock(block: ScratchBlock, ctx: RenderCtx, indent = ''): string {
  const op = block.opcode
  if (op === 'control_if') return renderIf(block, ctx, indent)
  if (op === 'control_if_else') return renderIfElse(block, ctx, indent)
  if (op === 'control_repeat') return renderRepeat(block, ctx, indent)
  if (op === 'control_repeat_until')
    return renderRepeatUntil(block, ctx, indent)
  if (op === 'control_forever') return renderForever(block, ctx, indent)
  if (op === 'procedures_definition') return indent + renderProcDef(block, ctx)

  const fn = OPCODE_TO_BLOCK[op]
  if (fn) return indent + fn(block, ctx)
  return `${indent}% non pris en charge: ${escapeTex(op)}`
}

// ════════════════════════════════════════════════════════════
// TABLE DE CORRESPONDANCE OPCODE → LATEX
// (après les helpers pour éviter les références circulaires TS7022)
// ════════════════════════════════════════════════════════════

type BlockRenderer = (block: ScratchBlock, ctx: RenderCtx) => string

const OPCODE_TO_BLOCK: Record<string, BlockRenderer> = {
  // ── Événements ───────────────────────────────────────────
  event_whenflagclicked: () => `\\blockinit{quand \\greenflag est cliqué}`,
  event_whenkeypressed: (b) =>
    `\\blockinit{quand la touche \\selectmenu{${field(b, 'KEY_OPTION')}} est pressée}`,
  event_whenthisspriteclicked: () => `\\blockinit{quand ce sprite est cliqué}`,
  event_whenstageclicked: () => `\\blockinit{quand la scène est cliquée}`,
  event_whenbackdropswitchesto: (b) =>
    `\\blockinit{quand l'arrière-plan bascule sur \\selectmenu{${field(b, 'BACKDROP')}}}`,
  event_whengreaterthan: (b, c) =>
    `\\blockinit{quand \\selectmenu{${field(b, 'WHENGREATERTHANMENU')}} > ${inputVal(b, 'VALUE', c)}}`,
  event_whenbroadcastreceived: (b) =>
    `\\blockinit{quand je reçois \\selectmenu{${field(b, 'BROADCAST_OPTION')}}}`,
  event_broadcast: (b, c) =>
    `\\blockevent{envoyer à tous ${inputVal(b, 'BROADCAST_INPUT', c)}}`,
  event_broadcastandwait: (b, c) =>
    `\\blockevent{envoyer à tous ${inputVal(b, 'BROADCAST_INPUT', c)} et attendre}`,
  // ── Mouvement ────────────────────────────────────────────
  motion_movesteps: (b, c) =>
    `\\blockmove{avancer de ${inputVal(b, 'STEPS', c)} pas}`,
  motion_turnright: (b, c) =>
    `\\blockmove{tourner \\turnright{} de ${inputVal(b, 'DEGREES', c)} degrés}`,
  motion_turnleft: (b, c) =>
    `\\blockmove{tourner \\turnleft{} de ${inputVal(b, 'DEGREES', c)} degrés}`,
  motion_goto: (b, c) => `\\blockmove{aller à ${inputVal(b, 'TO', c)}}`,
  motion_gotoxy: (b, c) =>
    `\\blockmove{aller à x: ${inputVal(b, 'X', c)} y: ${inputVal(b, 'Y', c)}}`,
  motion_glideto: (b, c) =>
    `\\blockmove{glisser en ${inputVal(b, 'SECS', c)} s vers ${inputVal(b, 'TO', c)}}`,
  motion_glidesecstoxy: (b, c) =>
    `\\blockmove{glisser en ${inputVal(b, 'SECS', c)} s à x: ${inputVal(b, 'X', c)} y: ${inputVal(b, 'Y', c)}}`,
  motion_pointindirection: (b, c) =>
    `\\blockmove{s'orienter à ${inputVal(b, 'DIRECTION', c)} degrés}`,
  motion_pointtowards: (b, c) =>
    `\\blockmove{se diriger vers ${inputVal(b, 'TOWARDS', c)}}`,
  motion_changexby: (b, c) =>
    `\\blockmove{ajouter ${inputVal(b, 'DX', c)} à x}`,
  motion_setx: (b, c) => `\\blockmove{mettre x à ${inputVal(b, 'X', c)}}`,
  motion_changeyby: (b, c) =>
    `\\blockmove{ajouter ${inputVal(b, 'DY', c)} à y}`,
  motion_sety: (b, c) => `\\blockmove{mettre y à ${inputVal(b, 'Y', c)}}`,
  motion_ifonedgebounce: () => `\\blockmove{rebondir si le bord est atteint}`,
  motion_setrotationstyle: (b) =>
    `\\blockmove{mettre le sens de rotation \\selectmenu{${field(b, 'STYLE')}}}`,
  motion_xposition: () => `\\ovalmove{abscisse x}`,
  motion_yposition: () => `\\ovalmove{ordonnée y}`,
  motion_direction: () => `\\ovalmove{direction}`,
  // ── Apparence ────────────────────────────────────────────
  looks_sayforsecs: (b, c) =>
    `\\blocklook{dire ${inputVal(b, 'MESSAGE', c)} pendant ${inputVal(b, 'SECS', c)} secondes}`,
  looks_say: (b, c) => `\\blocklook{dire ${inputVal(b, 'MESSAGE', c)}}`,
  looks_thinkforsecs: (b, c) =>
    `\\blocklook{penser à ${inputVal(b, 'MESSAGE', c)} pendant ${inputVal(b, 'SECS', c)} secondes}`,
  looks_think: (b, c) => `\\blocklook{penser à ${inputVal(b, 'MESSAGE', c)}}`,
  looks_switchcostumeto: (b, c) =>
    `\\blocklook{basculer sur le costume ${inputVal(b, 'COSTUME', c)}}`,
  looks_nextcostume: () => `\\blocklook{costume suivant}`,
  looks_switchbackdropto: (b, c) =>
    `\\blocklook{basculer sur l'arrière-plan ${inputVal(b, 'BACKDROP', c)}}`,
  looks_nextbackdrop: () => `\\blocklook{arrière-plan suivant}`,
  looks_changesizeby: (b, c) =>
    `\\blocklook{ajouter ${inputVal(b, 'CHANGE', c)} à la taille}`,
  looks_setsizeto: (b, c) =>
    `\\blocklook{mettre la taille à ${inputVal(b, 'SIZE', c)} \\%}`,
  looks_changeeffectby: (b, c) =>
    `\\blocklook{ajouter ${inputVal(b, 'CHANGE', c)} à l'effet \\selectmenu{${field(b, 'EFFECT')}}}`,
  looks_seteffectto: (b, c) =>
    `\\blocklook{mettre l'effet \\selectmenu{${field(b, 'EFFECT')}} à ${inputVal(b, 'VALUE', c)}}`,
  looks_cleargraphiceffects: () => `\\blocklook{annuler les effets graphiques}`,
  looks_show: () => `\\blocklook{montrer}`,
  looks_hide: () => `\\blocklook{cacher}`,
  looks_gotofrontback: (b) =>
    `\\blocklook{aller en \\selectmenu{${field(b, 'FRONT_BACK')}}}`,
  looks_goforwardbackwardlayers: (b, c) =>
    `\\blocklook{avancer de ${inputVal(b, 'NUM', c)} \\selectmenu{${field(b, 'FORWARD_BACKWARD')}}}`,
  looks_costumenumbername: (b) =>
    `\\ovallook{\\selectmenu{${field(b, 'NUMBER_NAME')}} du costume}`,
  looks_backdropnumbername: (b) =>
    `\\ovallook{\\selectmenu{${field(b, 'NUMBER_NAME')}} de l'arrière-plan}`,
  looks_size: () => `\\ovallook{taille}`,
  // ── Son ──────────────────────────────────────────────────
  sound_playuntildone: (b, c) =>
    `\\blocksound{jouer le son ${inputVal(b, 'SOUND_MENU', c)} jusqu'au bout}`,
  sound_play: (b, c) =>
    `\\blocksound{lancer le son ${inputVal(b, 'SOUND_MENU', c)}}`,
  sound_stopallsounds: () => `\\blocksound{arrêter tous les sons}`,
  sound_changeeffectby: (b, c) =>
    `\\blocksound{ajouter ${inputVal(b, 'VALUE', c)} à l'effet \\selectmenu{${field(b, 'EFFECT')}}}`,
  sound_seteffectto: (b, c) =>
    `\\blocksound{mettre l'effet \\selectmenu{${field(b, 'EFFECT')}} à ${inputVal(b, 'VALUE', c)}}`,
  sound_cleareffects: () => `\\blocksound{annuler les effets sonores}`,
  sound_changevolumeby: (b, c) =>
    `\\blocksound{ajouter ${inputVal(b, 'VOLUME', c)} au volume}`,
  sound_setvolumeto: (b, c) =>
    `\\blocksound{mettre le volume à ${inputVal(b, 'VOLUME', c)} \\%}`,
  sound_volume: () => `\\ovalsound{volume}`,
  // ── Stylo ────────────────────────────────────────────────
  pen_clear: () => `\\blockpen{effacer tout}`,
  pen_stamp: () => `\\blockpen{tamponner}`,
  pen_penDown: () => `\\blockpen{stylo en position d'écriture}`,
  pen_penUp: () => `\\blockpen{relever le stylo}`,
  pen_setPenColorToColor: (b, c) =>
    `\\blockpen{mettre la couleur du stylo à ${inputVal(b, 'COLOR', c)}}`,
  pen_changePenColorParamBy: (b, c) =>
    `\\blockpen{ajouter ${inputVal(b, 'VALUE', c)} à \\selectmenu{${inputVal(b, 'COLOR_PARAM', c)}} du stylo}`,
  pen_setPenColorParamTo: (b, c) =>
    `\\blockpen{mettre \\selectmenu{${inputVal(b, 'COLOR_PARAM', c)}} du stylo à ${inputVal(b, 'VALUE', c)}}`,
  pen_changePenSizeBy: (b, c) =>
    `\\blockpen{ajouter ${inputVal(b, 'SIZE', c)} à la taille du stylo}`,
  pen_setPenSizeTo: (b, c) =>
    `\\blockpen{mettre la taille du stylo à ${inputVal(b, 'SIZE', c)}}`,
  // ── Contrôle ─────────────────────────────────────────────
  control_wait: (b, c) =>
    `\\blockcontrol{attendre ${inputVal(b, 'DURATION', c)} secondes}`,
  control_wait_until: (b, c) =>
    `\\blockcontrol{attendre jusqu'à ${inputVal(b, 'CONDITION', c)}}`,
  control_stop: (b) =>
    `\\blockstop{stop \\selectmenu{${field(b, 'STOP_OPTION')}}}`,
  control_start_as_clone: () =>
    `\\blockinitclone{quand je commence comme un clone}`,
  control_create_clone_of: (b, c) =>
    `\\blockcontrol{créer un clone de ${inputVal(b, 'CLONE_OPTION', c)}}`,
  control_delete_this_clone: () => `\\blockstop{supprimer ce clone}`,
  // ── Variables ─────────────────────────────────────────────
  data_setvariableto: (b, c) =>
    `\\blockvariable{mettre \\selectmenu{${field(b, 'VARIABLE')}} à ${inputVal(b, 'VALUE', c)}}`,
  data_changevariableby: (b, c) =>
    `\\blockvariable{ajouter ${inputVal(b, 'VALUE', c)} à \\selectmenu{${field(b, 'VARIABLE')}}}`,
  data_showvariable: (b) =>
    `\\blockvariable{montrer la variable \\selectmenu{${field(b, 'VARIABLE')}}}`,
  data_hidevariable: (b) =>
    `\\blockvariable{cacher la variable \\selectmenu{${field(b, 'VARIABLE')}}}`,
  data_variable: (b) => `\\ovalvariable{${field(b, 'VARIABLE')}}`,
  // ── Listes ───────────────────────────────────────────────
  data_addtolist: (b, c) =>
    `\\blocklist{ajouter ${inputVal(b, 'ITEM', c)} à \\selectmenu{${field(b, 'LIST')}}}`,
  data_deleteoflist: (b, c) =>
    `\\blocklist{supprimer l'élément ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}}}`,
  data_deletealloflist: (b) =>
    `\\blocklist{supprimer tous les éléments de \\selectmenu{${field(b, 'LIST')}}}`,
  data_insertatlist: (b, c) =>
    `\\blocklist{insérer ${inputVal(b, 'ITEM', c)} à la position ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}}}`,
  data_replaceitemoflist: (b, c) =>
    `\\blocklist{remplacer l'élément ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}} par ${inputVal(b, 'ITEM', c)}}`,
  data_itemoflist: (b, c) =>
    `\\ovallist{élément ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}}}`,
  data_itemnumoflist: (b, c) =>
    `\\ovallist{numéro de ${inputVal(b, 'ITEM', c)} dans \\selectmenu{${field(b, 'LIST')}}}`,
  data_lengthoflist: (b) =>
    `\\ovallist{longueur de \\selectmenu{${field(b, 'LIST')}}}`,
  data_listcontainsitem: (b, c) =>
    `\\boollist{\\selectmenu{${field(b, 'LIST')}} contient ${inputVal(b, 'ITEM', c)}}`,
  data_showlist: (b) =>
    `\\blocklist{montrer la liste \\selectmenu{${field(b, 'LIST')}}}`,
  data_hidelist: (b) =>
    `\\blocklist{cacher la liste \\selectmenu{${field(b, 'LIST')}}}`,
  // ── Capteurs ─────────────────────────────────────────────
  sensing_askandwait: (b, c) =>
    `\\blocksensing{demander ${inputVal(b, 'QUESTION', c)} et attendre}`,
  sensing_setdragmode: (b) =>
    `\\blocksensing{mettre le mode de glisser \\selectmenu{${field(b, 'DRAG_MODE')}}}`,
  sensing_resettimer: () => `\\blocksensing{remettre le chronomètre à zéro}`,
  sensing_answer: () => `\\ovalsensing{réponse}`,
  sensing_timer: () => `\\ovalsensing{chronomètre}`,
  sensing_current: (b) =>
    `\\ovalsensing{\\selectmenu{${field(b, 'CURRENTMENU')}}}`,
  sensing_dayssince2000: () => `\\ovalsensing{jours depuis 2000}`,
  sensing_username: () => `\\ovalsensing{nom d'utilisateur}`,
  sensing_mousex: () => `\\ovalsensing{souris x}`,
  sensing_mousey: () => `\\ovalsensing{souris y}`,
  sensing_loudness: () => `\\ovalsensing{intensité sonore}`,
  sensing_touchingobject: (b, c) =>
    `\\boolsensing{\\selectmenu{${inputVal(b, 'TOUCHINGOBJECTMENU', c)}} touché ?}`,
  sensing_touchingcolor: (b, c) =>
    `\\boolsensing{couleur ${inputVal(b, 'COLOR', c)} touchée ?}`,
  sensing_coloristouchingcolor: (b, c) =>
    `\\boolsensing{couleur ${inputVal(b, 'COLOR', c)} touche ${inputVal(b, 'COLOR2', c)} ?}`,
  sensing_distanceto: (b, c) =>
    `\\ovalsensing{distance jusqu'à \\selectmenu{${inputVal(b, 'DISTANCETOMENU', c)}}}`,
  sensing_keypressed: (b, c) =>
    `\\boolsensing{touche \\selectmenu{${inputVal(b, 'KEY_OPTION', c)}} pressée ?}`,
  sensing_mousedown: () => `\\boolsensing{souris pressée ?}`,
  sensing_of: (b, c) =>
    `\\ovalsensing{\\selectmenu{${field(b, 'PROPERTY')}} de \\selectmenu{${inputVal(b, 'OBJECT', c)}}}`,
  // ── Opérateurs ───────────────────────────────────────────
  operator_add: (b, c) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} + ${inputVal(b, 'NUM2', c)}}`,
  operator_subtract: (b, c) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} - ${inputVal(b, 'NUM2', c)}}`,
  operator_multiply: (b, c) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} * ${inputVal(b, 'NUM2', c)}}`,
  operator_divide: (b, c) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} / ${inputVal(b, 'NUM2', c)}}`,
  operator_random: (b, c) =>
    `\\ovaloperator{nombre aléatoire entre ${inputVal(b, 'FROM', c)} et ${inputVal(b, 'TO', c)}}`,
  operator_gt: (b, c) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} > ${inputVal(b, 'OPERAND2', c)}}`,
  operator_lt: (b, c) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} < ${inputVal(b, 'OPERAND2', c)}}`,
  operator_equals: (b, c) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} = ${inputVal(b, 'OPERAND2', c)}}`,
  operator_and: (b, c) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} et ${inputVal(b, 'OPERAND2', c)}}`,
  operator_or: (b, c) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} ou ${inputVal(b, 'OPERAND2', c)}}`,
  operator_not: (b, c) => `\\booloperator{non ${inputVal(b, 'OPERAND', c)}}`,
  operator_join: (b, c) =>
    `\\ovaloperator{regrouper ${inputVal(b, 'STRING1', c)} et ${inputVal(b, 'STRING2', c)}}`,
  operator_letter_of: (b, c) =>
    `\\ovaloperator{lettre ${inputVal(b, 'LETTER', c)} de ${inputVal(b, 'STRING', c)}}`,
  operator_length: (b, c) =>
    `\\ovaloperator{longueur de ${inputVal(b, 'STRING', c)}}`,
  operator_contains: (b, c) =>
    `\\booloperator{${inputVal(b, 'STRING1', c)} contient ${inputVal(b, 'STRING2', c)}}`,
  operator_mod: (b, c) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} modulo ${inputVal(b, 'NUM2', c)}}`,
  operator_round: (b, c) => `\\ovaloperator{arrondir ${inputVal(b, 'NUM', c)}}`,
  operator_mathop: (b, c) =>
    `\\ovaloperator{\\selectmenu{${field(b, 'OPERATOR')}} de ${inputVal(b, 'NUM', c)}}`,
  // ── Mes blocs ────────────────────────────────────────────
  procedures_call: (b) => {
    const p = b.mutation?.proccode ?? 'mon bloc'
    return `\\blockmoreblocks{${escapeTex(p)}}`
  },
}

// ════════════════════════════════════════════════════════════
// API PUBLIQUE
// ════════════════════════════════════════════════════════════

/**
 * Convertit un project.json Scratch 3 en code LaTeX (package scratch3).
 *
 * @param projectJson - Chaîne JSON brute ou objet déjà parsé.
 * @returns Code LaTeX complet, prêt à compiler avec pdflatex.
 *
 * @example
 * import { sb3ToLatex } from "./sb3ToLatex";
 * const latex = sb3ToLatex(fs.readFileSync("project.json", "utf8"));
 */
export function sb3ToLatex(projectJson: string | ScratchProject): string {
  const project: ScratchProject =
    typeof projectJson === 'string' ? JSON.parse(projectJson) : projectJson

  const parts: string[] = []
  parts.push(
    `\\documentclass[a4paper]{article}\n` +
      `\\usepackage[utf8]{inputenc}\n` +
      `\\usepackage[T1]{fontenc}\n` +
      `\\usepackage[french]{babel}\n` +
      `\\usepackage{scratch3}\n\n` +
      `\\begin{document}\n`,
  )

  for (const target of project.targets ?? []) {
    const ctx: RenderCtx = { blocks: target.blocks ?? {} }
    const topBlocks = Object.entries(ctx.blocks)
      .filter(([, b]) => b.topLevel && !b.shadow)
      .map(([id]) => id)
    const orderedTopBlocks = [
      ...topBlocks.filter(
        (id) => ctx.blocks[id]?.opcode === 'procedures_definition',
      ),
      ...topBlocks.filter(
        (id) => ctx.blocks[id]?.opcode !== 'procedures_definition',
      ),
    ]

    if (target.isStage && !topBlocks.length) continue

    const sectionTitle = target.isStage
      ? `Scène : ${escapeTex(target.name)}`
      : `Script Scratch : généré par l'application Scratch \\textrightarrow{} LaTeX`
    parts.push(`\\section*{${sectionTitle}}\n`)

    if (!topBlocks.length) {
      parts.push(`% Aucun script\n`)
      continue
    }

    const sequences = orderedTopBlocks
      .map((rootId) => renderSequence(rootId, ctx))
      .filter((seq) => seq.trim())

    if (sequences.length) {
      parts.push(
        `\\begin{scratch}\n${sequences.join('\n\n')}\n\\end{scratch}\n`,
      )
    }
  }

  parts.push(`\\end{document}`)
  return parts.join('\n')
}

export {}
