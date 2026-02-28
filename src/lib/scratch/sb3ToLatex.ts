// ============================================================
// Fonction sb3ToLatex intégrée
// ============================================================
const OPCODE_TO_BLOCK = {
  event_whenflagclicked: (b: any, c: any) =>
    `\\blockinit{quand \\greenflag est cliqué}`,
  event_whenkeypressed: (b: any, c: any) =>
    `\\blockinit{quand la touche \\selectmenu{${field(b, 'KEY_OPTION')}} est pressée}`,
  event_whenthisspriteclicked: (b: any, c: any) =>
    `\\blockinit{quand ce sprite est cliqué}`,
  event_whenstageclicked: (b: any, c: any) =>
    `\\blockinit{quand la scène est cliquée}`,
  event_whenbackdropswitchesto: (b: any, c: any) =>
    `\\blockinit{quand l'arrière-plan bascule sur \\selectmenu{${field(b, 'BACKDROP')}}}`,
  event_whengreaterthan: (b: any, c: any) =>
    `\\blockinit{quand \\selectmenu{${field(b, 'WHENGREATERTHANMENU')}} > ${inputVal(b, 'VALUE', c)}}`,
  event_whenbroadcastreceived: (b: any, c: any) =>
    `\\blockinit{quand je reçois \\selectmenu{${field(b, 'BROADCAST_OPTION')}}}`,
  event_broadcast: (b: any, c: any) =>
    `\\blockevent{envoyer à tous ${inputVal(b, 'BROADCAST_INPUT', c)}}`,
  event_broadcastandwait: (b: any, c: any) =>
    `\\blockevent{envoyer à tous ${inputVal(b, 'BROADCAST_INPUT', c)} et attendre}`,
  motion_movesteps: (b: any, c: any) =>
    `\\blockmove{avancer de ${inputVal(b, 'STEPS', c)} pas}`,
  motion_turnright: (b: any, c: any) =>
    `\\blockmove{tourner \\turnright{} de ${inputVal(b, 'DEGREES', c)} degrés}`,
  motion_turnleft: (b: any, c: any) =>
    `\\blockmove{tourner \\turnleft{} de ${inputVal(b, 'DEGREES', c)} degrés}`,
  motion_goto: (b: any, c: any) =>
    `\\blockmove{aller à ${inputVal(b, 'TO', c)}}`,
  motion_gotoxy: (b: any, c: any) =>
    `\\blockmove{aller à x: ${inputVal(b, 'X', c)} y: ${inputVal(b, 'Y', c)}}`,
  motion_glideto: (b: any, c: any) =>
    `\\blockmove{glisser en ${inputVal(b, 'SECS', c)} s vers ${inputVal(b, 'TO', c)}}`,
  motion_glidesecstoxy: (b: any, c: any) =>
    `\\blockmove{glisser en ${inputVal(b, 'SECS', c)} s à x: ${inputVal(b, 'X', c)} y: ${inputVal(b, 'Y', c)}}`,
  motion_pointindirection: (b: any, c: any) =>
    `\\blockmove{s'orienter à ${inputVal(b, 'DIRECTION', c)} degrés}`,
  motion_pointtowards: (b: any, c: any) =>
    `\\blockmove{se diriger vers ${inputVal(b, 'TOWARDS', c)}}`,
  motion_changexby: (b: any, c: any) =>
    `\\blockmove{ajouter ${inputVal(b, 'DX', c)} à x}`,
  motion_setx: (b: any, c: any) =>
    `\\blockmove{mettre x à ${inputVal(b, 'X', c)}}`,
  motion_changeyby: (b: any, c: any) =>
    `\\blockmove{ajouter ${inputVal(b, 'DY', c)} à y}`,
  motion_sety: (b: any, c: any) =>
    `\\blockmove{mettre y à ${inputVal(b, 'Y', c)}}`,
  motion_ifonedgebounce: (b: any, c: any) =>
    `\\blockmove{rebondir si le bord est atteint}`,
  motion_setrotationstyle: (b: any, c: any) =>
    `\\blockmove{mettre le sens de rotation \\selectmenu{${field(b, 'STYLE')}}}`,
  motion_xposition: (b: any, c: any) => `\\ovalmove{abscisse x}`,
  motion_yposition: (b: any, c: any) => `\\ovalmove{ordonnée y}`,
  motion_direction: (b: any, c: any) => `\\ovalmove{direction}`,
  looks_sayforsecs: (b: any, c: any) =>
    `\\blocklook{dire ${inputVal(b, 'MESSAGE', c)} pendant ${inputVal(b, 'SECS', c)} secondes}`,
  looks_say: (b: any, c: any) =>
    `\\blocklook{dire ${inputVal(b, 'MESSAGE', c)}}`,
  looks_thinkforsecs: (b: any, c: any) =>
    `\\blocklook{penser à ${inputVal(b, 'MESSAGE', c)} pendant ${inputVal(b, 'SECS', c)} secondes}`,
  looks_think: (b: any, c: any) =>
    `\\blocklook{penser à ${inputVal(b, 'MESSAGE', c)}}`,
  looks_switchcostumeto: (b: any, c: any) =>
    `\\blocklook{basculer sur le costume ${inputVal(b, 'COSTUME', c)}}`,
  looks_nextcostume: (b: any, c: any) => `\\blocklook{costume suivant}`,
  looks_switchbackdropto: (b: any, c: any) =>
    `\\blocklook{basculer sur l'arrière-plan ${inputVal(b, 'BACKDROP', c)}}`,
  looks_nextbackdrop: (b: any, c: any) => `\\blocklook{arrière-plan suivant}`,
  looks_changesizeby: (b: any, c: any) =>
    `\\blocklook{ajouter ${inputVal(b, 'CHANGE', c)} à la taille}`,
  looks_setsizeto: (b: any, c: any) =>
    `\\blocklook{mettre la taille à ${inputVal(b, 'SIZE', c)} \\%}`,
  looks_changeeffectby: (b: any, c: any) =>
    `\\blocklook{ajouter ${inputVal(b, 'CHANGE', c)} à l'effet \\selectmenu{${field(b, 'EFFECT')}}}`,
  looks_seteffectto: (b: any, c: any) =>
    `\\blocklook{mettre l'effet \\selectmenu{${field(b, 'EFFECT')}} à ${inputVal(b, 'VALUE', c)}}`,
  looks_cleargraphiceffects: (b: any, c: any) =>
    `\\blocklook{annuler les effets graphiques}`,
  looks_show: (b: any, c: any) => `\\blocklook{montrer}`,
  looks_hide: (b: any, c: any) => `\\blocklook{cacher}`,
  looks_gotofrontback: (b: any, c: any) =>
    `\\blocklook{aller en \\selectmenu{${field(b, 'FRONT_BACK')}}}`,
  looks_goforwardbackwardlayers: (b: any, c: any) =>
    `\\blocklook{avancer de ${inputVal(b, 'NUM', c)} \\selectmenu{${field(b, 'FORWARD_BACKWARD')}}}`,
  looks_costumenumbername: (b: any, c: any) =>
    `\\ovallook{\\selectmenu{${field(b, 'NUMBER_NAME')}} du costume}`,
  looks_backdropnumbername: (b: any, c: any) =>
    `\\ovallook{\\selectmenu{${field(b, 'NUMBER_NAME')}} de l'arrière-plan}`,
  looks_size: (b: any, c: any) => `\\ovallook{taille}`,
  sound_playuntildone: (b: any, c: any) =>
    `\\blocksound{jouer le son ${inputVal(b, 'SOUND_MENU', c)} jusqu'au bout}`,
  sound_play: (b: any, c: any) =>
    `\\blocksound{lancer le son ${inputVal(b, 'SOUND_MENU', c)}}`,
  sound_stopallsounds: (b: any, c: any) =>
    `\\blocksound{arrêter tous les sons}`,
  sound_changeeffectby: (b: any, c: any) =>
    `\\blocksound{ajouter ${inputVal(b, 'VALUE', c)} à l'effet \\selectmenu{${field(b, 'EFFECT')}}}`,
  sound_seteffectto: (b: any, c: any) =>
    `\\blocksound{mettre l'effet \\selectmenu{${field(b, 'EFFECT')}} à ${inputVal(b, 'VALUE', c)}}`,
  sound_cleareffects: (b: any, c: any) =>
    `\\blocksound{annuler les effets sonores}`,
  sound_changevolumeby: (b: any, c: any) =>
    `\\blocksound{ajouter ${inputVal(b, 'VOLUME', c)} au volume}`,
  sound_setvolumeto: (b: any, c: any) =>
    `\\blocksound{mettre le volume à ${inputVal(b, 'VOLUME', c)} \\%}`,
  sound_volume: (b: any, c: any) => `\\ovalsound{volume}`,
  pen_clear: (b: any, c: any) => `\\blockpen{effacer tout}`,
  pen_stamp: (b: any, c: any) => `\\blockpen{tamponner}`,
  pen_penDown: (b: any, c: any) => `\\blockpen{stylo en position d'écriture}`,
  pen_penUp: (b: any, c: any) => `\\blockpen{relever le stylo}`,
  pen_setPenColorToColor: (b: any, c: any) =>
    `\\blockpen{mettre la couleur du stylo à ${inputVal(b, 'COLOR', c)}}`,
  pen_changePenColorParamBy: (b: any, c: any) =>
    `\\blockpen{ajouter ${inputVal(b, 'VALUE', c)} à \\selectmenu{${inputVal(b, 'COLOR_PARAM', c)}} du stylo}`,
  pen_setPenColorParamTo: (b: any, c: any) =>
    `\\blockpen{mettre \\selectmenu{${inputVal(b, 'COLOR_PARAM', c)}} du stylo à ${inputVal(b, 'VALUE', c)}}`,
  pen_changePenSizeBy: (b: any, c: any) =>
    `\\blockpen{ajouter ${inputVal(b, 'SIZE', c)} à la taille du stylo}`,
  pen_setPenSizeTo: (b: any, c: any) =>
    `\\blockpen{mettre la taille du stylo à ${inputVal(b, 'SIZE', c)}}`,
  control_wait: (b: any, c: any) =>
    `\\blockcontrol{attendre ${inputVal(b, 'DURATION', c)} secondes}`,
  control_wait_until: (b: any, c: any) =>
    `\\blockcontrol{attendre jusqu'à ${inputVal(b, 'CONDITION', c)}}`,
  control_stop: (b: any, c: any) =>
    `\\blockstop{stop \\selectmenu{${field(b, 'STOP_OPTION')}}}`,
  control_start_as_clone: (b: any, c: any) =>
    `\\blockinitclone{quand je commence comme un clone}`,
  control_create_clone_of: (b: any, c: any) =>
    `\\blockcontrol{créer un clone de ${inputVal(b, 'CLONE_OPTION', c)}}`,
  control_delete_this_clone: (b: any, c: any) =>
    `\\blockstop{supprimer ce clone}`,
  data_setvariableto: (b: any, c: any) =>
    `\\blockvariable{mettre \\selectmenu{${field(b, 'VARIABLE')}} à ${inputVal(b, 'VALUE', c)}}`,
  data_changevariableby: (b: any, c: any) =>
    `\\blockvariable{ajouter ${inputVal(b, 'VALUE', c)} à \\selectmenu{${field(b, 'VARIABLE')}}}`,
  data_showvariable: (b: any, c: any) =>
    `\\blockvariable{montrer la variable \\selectmenu{${field(b, 'VARIABLE')}}}`,
  data_hidevariable: (b: any, c: any) =>
    `\\blockvariable{cacher la variable \\selectmenu{${field(b, 'VARIABLE')}}}`,
  data_variable: (b: any, c: any) => `\\ovalvariable{${field(b, 'VARIABLE')}}`,
  data_addtolist: (b: any, c: any) =>
    `\\blocklist{ajouter ${inputVal(b, 'ITEM', c)} à \\selectmenu{${field(b, 'LIST')}}}`,
  data_deleteoflist: (b: any, c: any) =>
    `\\blocklist{supprimer l'élément ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}}}`,
  data_deletealloflist: (b: any, c: any) =>
    `\\blocklist{supprimer tous les éléments de \\selectmenu{${field(b, 'LIST')}}}`,
  data_insertatlist: (b: any, c: any) =>
    `\\blocklist{insérer ${inputVal(b, 'ITEM', c)} à la position ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}}}`,
  data_replaceitemoflist: (b: any, c: any) =>
    `\\blocklist{remplacer l'élément ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}} par ${inputVal(b, 'ITEM', c)}}`,
  data_itemoflist: (b: any, c: any) =>
    `\\ovallist{élément ${inputVal(b, 'INDEX', c)} de \\selectmenu{${field(b, 'LIST')}}}`,
  data_itemnumoflist: (b: any, c: any) =>
    `\\ovallist{numéro de ${inputVal(b, 'ITEM', c)} dans \\selectmenu{${field(b, 'LIST')}}}`,
  data_lengthoflist: (b: any, c: any) =>
    `\\ovallist{longueur de \\selectmenu{${field(b, 'LIST')}}}`,
  data_listcontainsitem: (b: any, c: any) =>
    `\\boollist{\\selectmenu{${field(b, 'LIST')}} contient ${inputVal(b, 'ITEM', c)}}`,
  data_showlist: (b: any, c: any) =>
    `\\blocklist{montrer la liste \\selectmenu{${field(b, 'LIST')}}}`,
  data_hidelist: (b: any, c: any) =>
    `\\blocklist{cacher la liste \\selectmenu{${field(b, 'LIST')}}}`,
  sensing_askandwait: (b: any, c: any) =>
    `\\blocksensing{demander ${inputVal(b, 'QUESTION', c)} et attendre}`,
  sensing_setdragmode: (b: any, c: any) =>
    `\\blocksensing{mettre le mode de glisser \\selectmenu{${field(b, 'DRAG_MODE')}}}`,
  sensing_resettimer: (b: any, c: any) =>
    `\\blocksensing{remettre le chronomètre à zéro}`,
  sensing_answer: (b: any, c: any) => `\\ovalsensing{réponse}`,
  sensing_timer: (b: any, c: any) => `\\ovalsensing{chronomètre}`,
  sensing_current: (b: any, c: any) =>
    `\\ovalsensing{\\selectmenu{${field(b, 'CURRENTMENU')}}}`,
  sensing_dayssince2000: (b: any, c: any) => `\\ovalsensing{jours depuis 2000}`,
  sensing_username: (b: any, c: any) => `\\ovalsensing{nom d'utilisateur}`,
  sensing_mousex: (b: any, c: any) => `\\ovalsensing{souris x}`,
  sensing_mousey: (b: any, c: any) => `\\ovalsensing{souris y}`,
  sensing_loudness: (b: any, c: any) => `\\ovalsensing{intensité sonore}`,
  sensing_touchingobject: (b: any, c: any) =>
    `\\boolsensing{\\selectmenu{${inputVal(b, 'TOUCHINGOBJECTMENU', c)}} touché ?}`,
  sensing_touchingcolor: (b: any, c: any) =>
    `\\boolsensing{couleur ${inputVal(b, 'COLOR', c)} touchée ?}`,
  sensing_coloristouchingcolor: (b: any, c: any) =>
    `\\boolsensing{couleur ${inputVal(b, 'COLOR', c)} touche ${inputVal(b, 'COLOR2', c)} ?}`,
  sensing_distanceto: (b: any, c: any) =>
    `\\ovalsensing{distance jusqu'à \\selectmenu{${inputVal(b, 'DISTANCETOMENU', c)}}}`,
  sensing_keypressed: (b: any, c: any) =>
    `\\boolsensing{touche \\selectmenu{${inputVal(b, 'KEY_OPTION', c)}} pressée ?}`,
  sensing_mousedown: (b: any, c: any) => `\\boolsensing{souris pressée ?}`,
  sensing_of: (b: any, c: any) =>
    `\\ovalsensing{\\selectmenu{${field(b, 'PROPERTY')}} de \\selectmenu{${inputVal(b, 'OBJECT', c)}}}`,
  operator_add: (b: any, c: any) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} + ${inputVal(b, 'NUM2', c)}}`,
  operator_subtract: (b: any, c: any) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} - ${inputVal(b, 'NUM2', c)}}`,
  operator_multiply: (b: any, c: any) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} * ${inputVal(b, 'NUM2', c)}}`,
  operator_divide: (b: any, c: any) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} / ${inputVal(b, 'NUM2', c)}}`,
  operator_random: (b: any, c: any) =>
    `\\ovaloperator{nombre aléatoire entre ${inputVal(b, 'FROM', c)} et ${inputVal(b, 'TO', c)}}`,
  operator_gt: (b: any, c: any) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} > ${inputVal(b, 'OPERAND2', c)}}`,
  operator_lt: (b: any, c: any) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} < ${inputVal(b, 'OPERAND2', c)}}`,
  operator_equals: (b: any, c: any) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} = ${inputVal(b, 'OPERAND2', c)}}`,
  operator_and: (b: any, c: any) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} et ${inputVal(b, 'OPERAND2', c)}}`,
  operator_or: (b: any, c: any) =>
    `\\booloperator{${inputVal(b, 'OPERAND1', c)} ou ${inputVal(b, 'OPERAND2', c)}}`,
  operator_not: (b: any, c: any) =>
    `\\booloperator{non ${inputVal(b, 'OPERAND', c)}}`,
  operator_join: (b: any, c: any) =>
    `\\ovaloperator{regrouper ${inputVal(b, 'STRING1', c)} et ${inputVal(b, 'STRING2', c)}}`,
  operator_letter_of: (b: any, c: any) =>
    `\\ovaloperator{lettre ${inputVal(b, 'LETTER', c)} de ${inputVal(b, 'STRING', c)}}`,
  operator_length: (b: any, c: any) =>
    `\\ovaloperator{longueur de ${inputVal(b, 'STRING', c)}}`,
  operator_contains: (b: any, c: any) =>
    `\\booloperator{${inputVal(b, 'STRING1', c)} contient ${inputVal(b, 'STRING2', c)}}`,
  operator_mod: (b: any, c: any) =>
    `\\ovaloperator{${inputVal(b, 'NUM1', c)} modulo ${inputVal(b, 'NUM2', c)}}`,
  operator_round: (b: any, c: any) =>
    `\\ovaloperator{arrondir ${inputVal(b, 'NUM', c)}}`,
  operator_mathop: (b: any, c: any) =>
    `\\ovaloperator{\\selectmenu{${field(b, 'OPERATOR')}} de ${inputVal(b, 'NUM', c)}}`,
  procedures_call: (b: { mutation: { proccode: string } }, c: any) => {
    const p = b.mutation?.proccode || 'mon bloc'
    return `\\blockmoreblocks{${escapeTex(p)}}`
  },
}

function field(block: { fields: { [x: string]: any } }, name: string) {
  const f = block.fields?.[name]
  if (!f) return '?'
  return escapeTex(String(f[0] ?? '?'))
}

function escapeTex(str: string) {
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

function inputVal(
  block: { inputs: { [x: string]: any } },
  inputName: string,
  ctx: { blocks: { [x: string]: any } },
): string {
  const input = block.inputs?.[inputName]
  if (!input) return '\\ovalnum{?}'
  const inner = input[1]
  if (inner == null) return '\\ovalnum{?}'
  if (Array.isArray(inner)) {
    const [type, value] = inner
    if (type === 9)
      return `\\pencolor{[HTML]{${String(value).replace('#', '').toUpperCase()}}}`
    if (type === 12) return `\\ovalvariable{${escapeTex(value)}}`
    if (type === 13) return `\\ovallist{${escapeTex(value)}}`
    if (type === 11) return `\\selectmenu{${escapeTex(value)}}`
    return `\\ovalnum{${escapeTex(String(value ?? ''))}}`
  }
  if (typeof inner === 'string') {
    const subBlock = ctx.blocks[inner]
    if (!subBlock) return '\\ovalnum{?}'
    return renderBlock(subBlock, ctx)
  }
  return '\\ovalnum{?}'
}

// ── Unité d'indentation ──────────────────────────────────────
const INDENT = '  ' // 2 espaces par niveau

/**
 * Rend un bloc en tenant compte du niveau d'indentation courant.
 * `indent` = préfixe à appliquer à la ligne de ce bloc.
 * Les blocs structurels (boucles, conditions) gèrent eux-mêmes
 * l'indentation de leurs corps via renderStructured.
 */
function renderBlock(block: { opcode: string }, ctx: any, indent = '') {
  const op = block.opcode

  if (op === 'control_if') return renderIf(block as any, ctx, indent)
  if (op === 'control_if_else') return renderIfElse(block as any, ctx, indent)
  if (op === 'control_repeat') return renderRepeat(block as any, ctx, indent)
  if (op === 'control_repeat_until')
    return renderRepeatUntil(block as any, ctx, indent)
  if (op === 'control_forever') return renderForever(block as any, ctx, indent)
  if (op === 'procedures_definition') return indent + renderProcDef(block as any, ctx)

  if (isKnownOpcode(op)) {
    const fn: BlockRenderer = OPCODE_TO_BLOCK[op]
    const r = fn(block, ctx)
    return r != null ? indent + r : `${indent}% bloc inconnu: ${op}`
  }

  return `${indent}% non pris en charge: ${escapeTex(op)}`
}

/**
 * Formate un bloc structurel (boucle / condition) avec ses sous-stacks
 * proprement indentés.
 *
 * Résultat pour \blockif au niveau 0 :
 *   \blockif{…}
 *   {
 *     \blockmove{…}        ← indent + INDENT
 *     \blockrepeat{…}
 *     {
 *       \blockmove{…}      ← indent + INDENT + INDENT
 *     }
 *   }
 */
function renderStructured(
  macroLine: string,
  substacks: { content: any }[],
  indent: string,
) {
  const parts = [indent + macroLine]
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

function renderIf(b: any, ctx: any, indent: string): string {
  const cond = inputVal(b, 'CONDITION', ctx)
  const body = renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT)
  return renderStructured(
    `\\blockif{si ${cond} alors}`,
    [{ content: body }],
    indent,
  )
}

function renderIfElse(b: any, ctx: any, indent: string): string {
  const cond = inputVal(b, 'CONDITION', ctx)
  const body1 = renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT)
  const body2 = renderSubstack(b, 'SUBSTACK2', ctx, indent + INDENT)
  return renderStructured(
    `\\blockifelse{si ${cond} alors}`,
    [{ content: body1 }, { content: body2 }],
    indent,
  )
}

function renderRepeat(b: any, ctx: any, indent: string): string {
  const times = inputVal(b, 'TIMES', ctx)
  const body = renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT)
  return renderStructured(
    `\\blockrepeat{répéter ${times} fois}`,
    [{ content: body }],
    indent,
  )
}

function renderRepeatUntil(b: any, ctx: any, indent: string): string {
  const cond = inputVal(b, 'CONDITION', ctx)
  const body = renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT)
  return renderStructured(
    `\\blockrepeat{répéter jusqu'à ${cond}}`,
    [{ content: body }],
    indent,
  )
}

function renderForever(b: any, ctx: any, indent: string): string {
  const body = renderSubstack(b, 'SUBSTACK', ctx, indent + INDENT)
  return renderStructured(
    `\\blockinfloop{répéter indéfiniment}`,
    [{ content: body }],
    indent,
  )
}

function renderProcDef(
  b: { inputs?: { [x: string]: any[] } },
  ctx: { blocks: { [x: string]: any } },
): string {
  const protoId = b.inputs?.['custom_block']?.[1]
  const proto = protoId ? ctx.blocks[protoId] : null
  const proccode = proto?.mutation?.proccode ?? 'mon bloc'
  return `\\initmoreblocks{définir \\namemoreblocks{${escapeTex(proccode)}}}`
}

/**
 * Rend un sous-stack (corps d'un bloc structurel).
 * `childIndent` = l'indentation à appliquer à chaque ligne enfant.
 */
function renderSubstack(
  block: { inputs: { [x: string]: any } },
  inputName: string,
  ctx: any,
  childIndent: string | undefined,
) {
  const input = block.inputs?.[inputName]
  if (!input || !input[1]) return ''
  return renderSequence(input[1], ctx, childIndent)
}

/**
 * Parcourt une chaîne de blocs (liés par .next) et les rend ligne par ligne.
 * `indent` est le préfixe appliqué à chaque bloc de ce niveau.
 */
function renderSequence(startId: string, ctx: { blocks: any }, indent = '') {
  const lines = []
  let id = startId
  while (id) {
    const b = ctx.blocks[id]
    if (!b) break
    if (!b.shadow) {
      // On passe `indent` à renderBlock : pour un bloc simple il
      // l'ignore (le préfixage se fait ici) ; pour un bloc structurel
      // il s'en sert pour indenter ses accolades et ses enfants.
      const r = renderBlock(b, ctx, indent)
      if (r) lines.push(r)
    }
    id = b.next
  }
  return lines.join('\n')
}

export function sb3ToLatex(projectJson: string): string {
  const project =
    typeof projectJson === 'string' ? JSON.parse(projectJson) : projectJson
  const parts = []
  parts.push(`\\documentclass[a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usepackage{scratch3}

\\begin{document}
`)
  for (const target of project.targets ?? []) {
    const name = target.name ?? '?'
    parts.push(`\\section*{Sprite : ${escapeTex(name)}}\n`)
    const ctx = { blocks: target.blocks ?? {} }
    const topBlocks = Object.entries(ctx.blocks)
      .filter(([, b]) => (b as any).topLevel && !(b as any).shadow)
      .map(([id]) => id)
    if (topBlocks.length === 0) {
      parts.push(`% Aucun script\n`)
      continue
    }
    for (const rootId of topBlocks) {
      const seq = renderSequence(rootId, ctx)
      if (seq.trim()) parts.push(`\\begin{scratch}\n${seq}\n\\end{scratch}\n`)
    }
  }
  parts.push(`\\end{document}`)
  return parts.join('\n')
}

type BlockRenderer = (b: any, c: any) => string | null | undefined
type KnownOpcode = keyof typeof OPCODE_TO_BLOCK

function isKnownOpcode(op: string): op is KnownOpcode {
  return op in OPCODE_TO_BLOCK
}
