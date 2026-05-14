import type * as BlocklyType from 'blockly/core'
import type { javascriptGenerator as JsGen } from 'blockly/javascript'
import { context } from '../../modules/context'
import { runAStar } from '../../modules/findPath'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
import { bleuMathalea } from '../../lib/colors'
import { loadBlockly } from '../../lib/blockly/loader'

// Variables locales alimentées par loadBlockly()
let Blockly!: typeof BlocklyType
let javascriptGenerator!: typeof JsGen

export const titre = "Programmer le déplacement d'un bus"
export const dateDePublication = '15/07/2025'

export const interactifReady = true
export const interactifType = 'custom'

declare module 'blockly/core' {
  interface Workspace {
    idkey?: string
  }
}

/**
 * Programmer la construction d’un chemin simple : New programme de 6eme 2025
 * @author Mickael Guironnet
 */

export const uuid = 'f320c'

export const refs = {
  'fr-fr': ['6I1D'],
  'fr-2016': ['6I15'],
  'fr-ch': [],
}
export default class ExerciceLabyrintheChemin extends Exercice {
  destroyers: (() => void)[] = []

  constructor() {
    super()
    this.nbQuestions = 2
    this.besoinFormulaireNumerique = [
      'Nombre de lignes du labyrinthe (entre 2 et 8 ou bien 1 si vous laissez le hasard décider)',
      8,
    ]
    this.besoinFormulaire2Numerique = [
      'Nombre de colonnes du labyrinthe (entre 2 et 8 ou bien 1 si vous laissez le hasard décider)',
      8,
    ]
    this.sup = 5
    this.sup2 = 4
  }

  destroy() {
    // MGu quan l'exercice est supprimé par svelte : bouton supprimé
    this.destroyers.forEach((destroy) => destroy())
    this.destroyers.length = 0
  }

  nouvelleVersion(): void {
    // MGu quand l'exercice est modifié, on détruit les anciens listeners
    this.destroyers.forEach((destroy) => destroy())
    this.destroyers.length = 0
    for (
      let q = 0, cpt = 0, texte, texteCorr: string;
      q < this.nbQuestions && cpt < 50;
      cpt++
    ) {
      const nbL =
        this.sup === 1 ? randint(2, 5) : Math.min(Math.max(2, this.sup), 5)
      const nbC =
        this.sup === 1 ? randint(3, 5) : Math.min(Math.max(3, this.sup2), 5)
      const startCol = randint(0, nbC - 1)
      const endCol = randint(0, nbC - 1, [startCol])
      const parcours = this.generatePath(nbC, nbL, 0, startCol, nbL - 1, endCol)
      const villeDepart =
        parcours.villeParCoord[startCol][0] || 'Ville de départ'
      const villeArrivee =
        parcours.villeParCoord[endCol][nbL - 1] || "Ville d'arrivée"
      texte = `Retrouver les instructions pour représenter le parcours d'un bus entre ${villeDepart} et ${villeArrivee}.<br>`

      if (context.isHtml) {
        texte += this.generateGrapheSVG(
          `${this.numeroExercice}_${q}`,
          nbC,
          nbL,
          0,
          startCol,
          nbL - 1,
          endCol,
          parcours,
        )
      } else {
        texte += this.generateGrapheTikz(
          `${this.numeroExercice}_${q}`,
          nbC,
          nbL,
          0,
          startCol,
          nbL - 1,
          endCol,
          parcours,
        )
      }
      texteCorr =
        'Le bus part du lieu : ' +
        parcours.villeParCoord[startCol][0] +
        ' et arrive au lieu : ' +
        parcours.villeParCoord[endCol][nbL - 1] +
        '.<br>'
      texteCorr += 'Le bus suit le chemin suivant :<br>'
      texteCorr +=
        parcours.path
          .map((p) => `${parcours.villeParCoord[p[0]][p[1]]}`)
          .join(' → ') + '<br>'
      texteCorr +=
        'Voici une solution possible des instructions pour le trajet du bus :<br>'
      createSolutionStr(parcours.edges).forEach((instruction, index) => {
        const parts = instruction.split('-')
        const lieu = parts.length > 1 ? parts[1].trim() : instruction.trim()
        texteCorr += `${index + 1} - ${lieu}<br>`
      })
      if (this.interactif) {
        texte += `<div class="ml-2 py-2" id="resultatCheckEx${this.numeroExercice}Q${q}"></div>`
      }

      /****************************************************/
      if (this.questionJamaisPosee(q, texte)) {
        this.listeQuestions[q] = texte
        this.listeCorrections[q] = texteCorr
        q++
      }
      listeQuestionsToContenu(this)
    }
  }

  generatePath(
    cols: number,
    rows: number,
    rowsStart: number,
    colsStart: number,
    rowsEnd: number,
    colsEnd: number,
  ): {
    path: number[][]
    edges: { from: number[]; to: number[] }[]
    villeParCoord: string[][]
  } {
    const start: [number, number] = [colsStart, rowsStart]
    const end: [number, number] = [colsEnd, rowsEnd]

    const cityList = [
      'le stade',
      'la boulangerie',
      'la patisserie',
      "l'école",
      'la poste',
      'la mairie',
      'le fleuriste',
      'le garagiste',
      'la gare',
      'la piscine',
      'la pharmacie',
      "l'hôpital",
      'la banque',
      'la librairie',
      'le cinéma',
      'le musée',
      'les pompiers',
      'le marché',
      'le restaurant',
      "l'hôtel",
      'la laverie',
      'le parking',
      'la caserne',
      'la station-service',
      'le Bar',
    ]

    const getCityName = (() => {
      const used = new Set()
      return () => {
        let name
        do {
          name = cityList[randint(0, cityList.length - 1)]
        } while (used.has(name))
        used.add(name)
        return name
      }
    })()

    function generateSimplePath(
      start: [number, number],
      end: [number, number],
    ) {
      let [x, y] = start
      const [targetX, targetY] = end
      const result = [[x, y]]

      // Calcule les déplacements nécessaires
      const dx = targetX - x
      const dy = targetY - y

      // Liste de mouvements à effectuer (pas à pas)
      const steps: Array<[number, number]> = []

      for (let i = 0; i < Math.abs(dx); i++) {
        steps.push([Math.sign(dx), 0])
      }
      for (let i = 0; i < Math.abs(dy); i++) {
        steps.push([0, Math.sign(dy)])
      }

      // Mélange aléatoire de l'ordre des pas
      for (let i = steps.length - 1; i > 0; i--) {
        const j = randint(0, i)
        const temp = steps[i]
        steps[i] = steps[j]
        steps[j] = temp
      }

      // Applique les mouvements
      for (const [dx, dy] of steps) {
        x += dx
        y += dy
        result.push([x, y])
      }

      return result
    }

    let path: number[][]
    const paths2 = runAStar(rows, cols, rowsStart, colsStart, rowsEnd, colsEnd)
    if (paths2) {
      paths2.sort((a, b) => b.length - a.length) // On trie les chemins du plus court au plus long...
      path = paths2[randint(0, paths2.length - 1)].map((node) => [
        node.x,
        node.y,
      ])
    } else {
      path = generateSimplePath(start, end)
    }

    const edges: { from: number[]; to: number[] }[] = []
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]
      const to = path[i + 1]
      edges.push({ from, to })
    }

    const villeParCoord: string[][] = []
    for (let x = 0; x < cols; x++) {
      villeParCoord[x] = []
      for (let y = 0; y < rows; y++) {
        villeParCoord[x][y] = getCityName()
      }
    }

    return {
      path,
      edges,
      villeParCoord,
    }
  }

  generateGrapheTikz(
    id: string,
    cols: number,
    rows: number,
    rowsStart: number,
    colsStart: number,
    rowsEnd: number,
    colsEnd: number,
    parcours: {
      path: number[][]
      edges: { from: number[]; to: number[] }[]
      villeParCoord: string[][]
    },
  ): string {
    const flattenByRows = function (): string[] {
      const result: string[] = []
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          result.push(removeFirstWord(parcours.villeParCoord[x][y]))
        }
      }
      return result
    }

    const pathsString = parcours.path.map((p) => `${p[0]}/${p[1]}`).join(', ')

    return `
    \\begingroup
\\begin{tikzpicture}[
    >=Stealth,
    every node/.style={
        draw, ellipse, minimum height=10mm, text width=14mm, align=center, font=\\sffamily\\footnotesize
    }
]

  % Définir variables locales pour les dimensions
  \\pgfmathsetmacro{\\rows}{${rows}}
  \\pgfmathsetmacro{\\cols}{${cols}}

  % Liste des villes (au moins rows × cols)
  \\def\\citylist{{${flattenByRows()
    .map((v) => `"${v}"`)
    .join(', ')}}}

  % Chemin donné par une suite de coordonnées (x,y)
  \\def\\pathcoords{${pathsString}}

  % Extraction du premier et dernier élément
  \\def\\firstcoord{}
  \\def\\lastcoord{}
  \\foreach \\x/\\y [count=\\i] in \\pathcoords {
    \\edef\\coord{\\x/\\y}
    \\ifnum\\i=1
      \\xdef\\firstcoord{\\coord}
    \\fi
    \\xdef\\lastcoord{\\coord}
  }

  % Placement des nœuds
  \\foreach \\j in {0,...,\\numexpr\\rows-1} {
    \\foreach \\i in {0,...,\\numexpr\\cols-1} {
      \\pgfmathtruncatemacro{\\index}{\\j * \\cols + \\i}
      \\pgfmathsetmacro{\\x}{\\i * 3} % horizontal spacing
      \\pgfmathsetmacro{\\y}{(\\rows - 1 - \\j) * 2} % vertical spacing
      \\edef\\coord{\\i/\\j}
      \\ifx\\coord\\firstcoord
        \\node[fill=gray!20] (C\\i\\j) at (\\x,\\y) {\\pgfmathparse{\\citylist[\\index]}\\pgfmathresult};
      \\else\\ifx\\coord\\lastcoord
        \\node[fill=gray!20] (C\\i\\j) at (\\x,\\y) {\\pgfmathparse{\\citylist[\\index]}\\pgfmathresult};
      \\else
        \\node (C\\i\\j) at (\\x,\\y) {\\pgfmathparse{\\citylist[\\index]}\\pgfmathresult};
      \\fi\\fi
    }
  }

  % Arêtes par défaut (grises)
  \\foreach \\j in {0,...,\\numexpr\\rows-1} {
    \\foreach \\i in {0,...,\\numexpr\\cols-2} {
      \\draw[->,gray] (C\\i\\j) -- (C\\the\\numexpr\\i+1\\relax\\j);
    }
  }

  \\foreach \\j in {0,...,\\numexpr\\rows-2} {
    \\foreach \\i in {0,...,\\numexpr\\cols-1} {
      \\draw[->,gray] (C\\i\\j) -- (C\\i\\the\\numexpr\\j+1\\relax);
    }
  }

  % Chemin rouge
   \\foreach \\xA/\\yA [count=\\i] in \\pathcoords {
    \\ifnum\\i>1
      \\pgfmathsetmacro{\\xprev}{\\xA}
      \\pgfmathsetmacro{\\yprev}{\\yA}
      \\draw[->, red] (C\\prevx\\prevy) -- (C\\xA\\yA);
    \\fi
    \\xdef\\prevx{\\xA}
    \\xdef\\prevy{\\yA}
  }

  % Macros d'extraction
  \\def\\getx#1/#2\\relax{#1} % Prend la partie avant le /
  \\def\\gety#1/#2\\relax{#2} % Prend la partie après le /

  % Extraction effective
  \\edef\\fx{\\expandafter\\getx\\firstcoord\\relax}
  \\edef\\fy{\\expandafter\\gety\\firstcoord\\relax}

  % Convertir en coordonnées TikZ
  \\pgfmathsetmacro\\xstart{\\fx * 3}
  \\pgfmathsetmacro\\ystart{(\\rows - 1 - \\fy) * 2}

  % Robot : une flèche en triangle
  \\begin{scope}[shift={(\\xstart,\\ystart)}, rotate=0, scale=1,opacity=0.3]
    \\filldraw[fill=gray, draw=black]
      (-0.8,-0.3) -- (0.2,-0.3) -- (0.2,-0.5) -- (1,0) -- (0.2,0.5) -- (0.2,0.3) -- (-0.8,0.3) -- cycle;
  \\end{scope}

\\end{tikzpicture}
\\endgroup\\\\

Les instructions à utiliser sont les suivantes :

\\setscratch{scale=0.8,line width=1pt}
\\begin{scratch}
\\blockmove{Avancer}
\\end{scratch}
ou
\\begin{scratch}
\\blockmove{Tourner à gauche}
\\end{scratch}
ou
\\begin{scratch}
\\blockmove{Tourner à droite}
\\end{scratch}.
 `
  }

  generateGrapheSVG(
    id: string,
    cols: number,
    rows: number,
    rowsStart: number,
    colsStart: number,
    rowsEnd: number,
    colsEnd: number,
    parcours: {
      path: number[][]
      edges: { from: number[]; to: number[] }[]
      villeParCoord: string[][]
    },
  ): string {
    const svgWidth = cols * 100
    const svgHeight = rows * 100
    const start: [number, number] = [colsStart, rowsStart]
    const orientation = { angle: 0 }
    const end: [number, number] = [colsEnd, rowsEnd]
    const pos = { x: start[0], y: start[1] }
    const edges = parcours.edges
    const path = parcours.path
    const villeParCoord = parcours.villeParCoord

    function resizeBlockly(event: Event) {
      if (event instanceof CustomEvent && event.detail.uuid !== uuid) {
        return
      }
      const workspace = retrieveWorkspace(`blocklyDiv${id}`)
      if (workspace) {
        const blocklyDiv = document.getElementById(`blocklyDiv${id}`)
        if (blocklyDiv) {
          if (blocklyDiv.offsetParent !== null) {
            Blockly.svgResize(workspace as BlocklyType.WorkspaceSvg)
          }
        }
      }
    }

    function destroyerListener() {
      document.removeEventListener('questionDisplay', resizeBlockly)
    }
    this.destroyers.push(destroyerListener)

    function drawArrow(
      svg: SVGSVGElement,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) {
      const rx = 40
      const ry = 20
      const dx = x2 - x1
      const dy = y2 - y1
      const angle = Math.atan2(dy, dx)
      const startX = x1 + rx * Math.cos(angle)
      const startY = y1 + ry * Math.sin(angle)
      const endX = x2 - rx * Math.cos(angle)
      const endY = y2 - ry * Math.sin(angle)

      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      line.setAttribute('x1', String(startX))
      line.setAttribute('y1', String(startY))
      line.setAttribute('x2', String(endX))
      line.setAttribute('y2', String(endY))
      line.setAttribute('stroke', 'red')
      line.setAttribute('stroke-width', '2')
      line.setAttribute('marker-end', `url(#arrowhead${id})`)
      svg.appendChild(line)
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', `${svgWidth}`)
    svg.setAttribute('height', `${svgHeight}`)
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    svg.style.border = '1px solid black'

    const positions: { [key: string]: [number, number] } = {}
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const cx = x * 100 + 50
        const cy = y * 100 + 50
        positions[`${x},${y}`] = [cx, cy]
      }
    }

    // Lignes entre voisins sans flèches
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const [cx, cy] = positions[`${x},${y}`]
        const directions = [
          [1, 0],
          [0, 1],
        ]
        for (const [dx, dy] of directions) {
          const nx = x + dx
          const ny = y + dy
          if (nx < cols && ny < rows) {
            const [ncx, ncy] = positions[`${nx},${ny}`]
            const line = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'line',
            )
            line.setAttribute('x1', `${cx}`)
            line.setAttribute('y1', `${cy}`)
            line.setAttribute('x2', `${ncx}`)
            line.setAttribute('y2', `${ncy}`)
            line.setAttribute('stroke', 'black')
            line.setAttribute('stroke-width', '1')
            svg.appendChild(line)
          }
        }
      }
    }

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // cercle gris pour voisins
        const [cx, cy] = positions[`${x},${y}`]
        const ellipse = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'ellipse',
        )
        ellipse.setAttribute('cx', `${cx}`)
        ellipse.setAttribute('cy', `${cy}`)
        ellipse.setAttribute('rx', '40')
        ellipse.setAttribute('ry', '20')
        if (x === start[0] && y === start[1]) {
          ellipse.setAttribute('fill', 'green')
        } else if (x === end[0] && y === end[1]) {
          ellipse.setAttribute('fill', bleuMathalea)
        } else {
          ellipse.setAttribute('fill', '#ccc')
        }
        svg.appendChild(ellipse)

        const name = villeParCoord[x][y] || 'Ville inconnue'
        const text = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        )
        text.setAttribute('x', `${cx}`)
        text.setAttribute('y', `${cy + 5}`)
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('font-size', '12')
        text.textContent = removeFirstWord(name)
        svg.appendChild(text)
      }
    }

    // Robot
    const robot = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    // Points d’un petit triangle (flèche) centré sur (0, 0)
    robot.setAttribute('d', 'M -8,-2 L 4,-2 L 4,-6 L 12,0 L 4,6 L 4,2 L -8,2 Z')
    robot.setAttribute('fill', 'grey')
    robot.setAttribute('stroke', 'red')
    robot.setAttribute('id', 'robot')
    // Positionner à la case de départ
    const [px, py] = positions[`${start[0]},${start[1]}`]
    const scale = 1.2
    robot.setAttribute(
      'transform',
      `translate(${px}, ${py}) rotate(${orientation.angle}) scale(${scale})`,
    )
    svg.appendChild(robot)

    function moveDir(dx: number, dy: number): boolean {
      const target = [pos.x + dx, pos.y + dy]
      const exists = edges.find(
        (edge) =>
          edge.from[0] === pos.x &&
          edge.from[1] === pos.y &&
          edge.to[0] === target[0] &&
          edge.to[1] === target[1],
      )
      if (exists) {
        pos.x += dx
        pos.y += dy
        const [cx, cy] = positions[`${pos.x},${pos.y}`]
        const btn = document.getElementById(id)
        btn
          ?.querySelector('#robot')
          ?.setAttribute(
            'transform',
            `translate(${cx}, ${cy}) rotate(${orientation.angle}) scale(${scale})`,
          )
        return true
      }
      return false
    }

    function avancer() {
      const debug = 0
      if (orientation.angle === 0) {
        const bg = moveDir(1, 0) // droite
        if (bg && debug) ajouterBlocALaSuite('move_forward')
      } else if (orientation.angle === 90) {
        const bg = moveDir(0, 1) // bas
        if (bg && debug) ajouterBlocALaSuite('move_forward')
      } else if (orientation.angle === 180) {
        const bg = moveDir(-1, 0) // gauche
        if (bg && debug) ajouterBlocALaSuite('move_forward')
      } else if (orientation.angle === 270) {
        const bg = moveDir(0, -1) // haut
        if (bg && debug) ajouterBlocALaSuite('move_forward')
      }
    }

    function tourner(num: number) {
      const debug = 0
      // num = 1 → droite, -1 → gauche
      if (num === 1) {
        orientation.angle = (orientation.angle + 90) % 360
        if (debug) ajouterBlocALaSuite('turn_right')
      } else {
        orientation.angle = (orientation.angle - 90) % 360
        if (orientation.angle < 0) {
          orientation.angle += 360 // Assurer que l'angle reste positif
        }
        if (debug) ajouterBlocALaSuite('turn_left')
      }
      rotate(orientation.angle)
    }

    function rotate(angle: number) {
      // 0 → droite
      // 90 → bas
      // 180 → gauche
      // 270 → haut
      const btn = document.getElementById(id)
      if (btn) {
        const robotElem = btn.querySelector('#robot') as SVGPathElement
        const transform = robotElem.getAttribute('transform') || ''
        const updated = transform.replace(/rotate\(\d+\)/, `rotate(${angle})`)
        robotElem.setAttribute('transform', updated)
      }
    }

    let workspace: BlocklyType.Workspace

    async function createBlockLy() {
      ;({ Blockly, javascriptGenerator } = await loadBlockly())
      Blockly.Msg['CONTROLS_REPEAT_TITLE'] = 'répéter %1 fois'
      Blockly.Msg['CONTROLS_REPEAT_INPUT_DO'] = 'faire'
      if (!Blockly.Blocks['start']) {
        Blockly.defineBlocksWithJsonArray([
          {
            type: 'start',
            message0: 'Démarrer',
            nextStatement: null,
            colour: 20,
            hat: 'true',
          },
          {
            type: 'move_forward',
            message0: 'avancer',
            previousStatement: null,
            nextStatement: null,
            colour: 160,
          },
          {
            type: 'turn_left',
            message0: 'tourner à gauche',
            previousStatement: null,
            nextStatement: null,
            colour: 210,
          },
          {
            type: 'turn_right',
            message0: 'tourner à droite',
            previousStatement: null,
            nextStatement: null,
            colour: 210,
          },
        ])
      }

      javascriptGenerator.forBlock['start'] = function (
        block: BlocklyType.Block,
      ) {
        const next = javascriptGenerator.statementToCode(block, '')
        return next
      }
      javascriptGenerator.forBlock['move_forward'] = function (
        _block: BlocklyType.Block,
        _generator: unknown,
      ) {
        return 'avancer();\n'
      }

      javascriptGenerator.forBlock['turn_left'] = function (
        _block: BlocklyType.Block,
        _generator: unknown,
      ) {
        return 'tourner(-1);\n'
      }

      javascriptGenerator.forBlock['turn_right'] = function (
        _block: BlocklyType.Block,
        _generator: unknown,
      ) {
        return 'tourner(1);\n'
      }

      const startXml = `
      <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="start" deletable="false" movable="false" x="10" y="5"></block>
      </xml>`

      const toolboxElement = document.getElementById('toolbox')
      if (!toolboxElement) {
        throw new Error("Toolbox element with id 'toolbox' not found.")
      }

      const ws = retrieveWorkspace(`blocklyDiv${id}`)
      if (ws) {
        ws.dispose() // Dispose the existing workspace if it exists
      }

      const mediaPath = `${import.meta.env.BASE_URL}blockly/media/`

      workspace = Blockly.inject(`blocklyDiv${id}`, {
        media: mediaPath,
        toolbox: toolboxElement,
        sounds: false,
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.8,
          maxScale: 2.5,
          minScale: 0.3,
          scaleSpeed: 1.2,
          pinch: false,
        },
      })
      // Après injection, on masque le bouton "reset"
      const zoomControls = document.querySelector(
        `#blocklyDiv${id} .blocklyZoomReset`,
      )
      if (zoomControls) {
        ;(zoomControls as HTMLElement).style.display = 'none'
      }
      workspace.idkey = `blocklyDiv${id}` // Set the id for later retrieval

      // Charger le bloc de démarrage
      Blockly.Xml.domToWorkspace(
        Blockly.utils.xml.textToDom(startXml),
        workspace,
      )
      // window.Blockly = Blockly // Expose Blockly globally for debugging
      Blockly.ContextMenuRegistry.registry.reset() // supprime le menu contextuel

      document.addEventListener('questionDisplay', resizeBlockly)
    }

    function ajouterBlocALaSuite(type: string) {
      // const workspace = Blockly.getMainWorkspace()
      const workspace = retrieveWorkspace(`blocklyDiv${id}`)
      if (!workspace) {
        return
      }
      const topBlocks = workspace.getTopBlocks(true)
      if (topBlocks.length === 0) {
        console.warn('Aucun bloc de départ trouvé.')
        return
      }

      // Trouver le dernier bloc de la chaîne
      let lastBlock = topBlocks[0]
      while (lastBlock.getNextBlock()) {
        const next = lastBlock.getNextBlock()
        if (!next) break
        lastBlock = next
      }

      // Créer le nouveau bloc
      const childBlock = Blockly.serialization.blocks.append(
        {
          type,
        },
        workspace,
      )

      // Connecter à la suite
      if (lastBlock.nextConnection && childBlock.previousConnection) {
        lastBlock.nextConnection.connect(childBlock.previousConnection)
      }
    }

    function resetRobot() {
      // Positionner à la case de départ
      const btn = document.getElementById(id)
      if (btn) {
        const [px, py] = positions[`${start[0]},${start[1]}`]
        pos.x = start[0]
        pos.y = start[1]
        orientation.angle = 0 // Réinitialiser l'orientation
        btn
          ?.querySelector('#robot')
          ?.setAttribute(
            'transform',
            `translate(${px}, ${py}) rotate(${orientation.angle}) scale(${scale})`,
          )
      }
      const btn2 = document
        .getElementById(id)
        ?.querySelector('#message-correct')
      if (btn2) {
        ;(btn2 as HTMLElement).style.display = 'none'
      }
      const btn3 = document.getElementById(id)?.querySelector('#message-faux')
      if (btn3) {
        ;(btn3 as HTMLElement).style.display = 'none'
      }
    }

    // Reset workspace (supprime tous les blocs)
    function resetWorkspace() {
      const workspace = retrieveWorkspace(`blocklyDiv${id}`)
      if (workspace) {
        workspace.clear()
        // Facultatif : remettre un bloc "start" par défaut
        const xmlText =
          '<xml><block type="start" deletable="false" movable="false" x="20" y="20"></block></xml>'
        const dom = Blockly.utils.xml.textToDom(xmlText)
        Blockly.Xml.domToWorkspace(dom, workspace)
      }
    }

    function runCode() {
      const workspace = retrieveWorkspace(`blocklyDiv${id}`)
      if (!workspace) {
        return
      }

      // Important : initialiser le générateur
      javascriptGenerator.init(workspace)
      const blocks = workspace.getTopBlocks(true)
      const startBlock = blocks.find((b) => b.type === 'start')
      if (!startBlock) {
        alert('Ajoutez un bloc "Démarrer"')
        return
      }
      let code = javascriptGenerator.blockToCode(startBlock)
      if (Array.isArray(code)) {
        code = code[0]
      }
      try {
        // eslint-disable-next-line no-eval
        eval(code) // nécessaire : le code Blockly accède aux fonctions de la closure locale
      } catch (e) {
        console.error(e)
      }
      const btn = document.getElementById(id)?.querySelector('#message-encours')
      if (btn) {
        ;(btn as HTMLElement).style.display = 'none'
      }
      if (checkIfSolution()) {
        const btn = document
          .getElementById(id)
          ?.querySelector('#message-correct')
        if (btn) {
          ;(btn as HTMLElement).style.display = 'block'
        }
      } else {
        const btn = document.getElementById(id)?.querySelector('#message-faux')
        if (btn) {
          ;(btn as HTMLElement).style.display = 'block'
        }
      }
    }

    async function runCodeWithDelay() {
      const workspace = retrieveWorkspace(`blocklyDiv${id}`)
      if (!workspace) {
        return
      }

      // Important : initialiser le générateur
      javascriptGenerator.init(workspace)
      const blocks = workspace.getTopBlocks(true)
      const startBlock = blocks.find((b) => b.type === 'start')
      if (!startBlock) {
        alert('Ajoutez un bloc "Démarrer"')
        return
      }
      let code = javascriptGenerator.blockToCode(startBlock)
      if (Array.isArray(code)) {
        code = code[0]
      }
      const btnCorrect = document
        .getElementById(id)
        ?.querySelector<HTMLElement>('#message-correct')
      if (btnCorrect) {
        btnCorrect.style.display = 'none'
      }
      const btnFaux = document
        .getElementById(id)
        ?.querySelector<HTMLElement>('#message-faux')
      if (btnFaux) {
        btnFaux.style.display = 'none'
      }
      const btnEncours = document
        .getElementById(id)
        ?.querySelector<HTMLElement>('#message-encours')
      if (btnEncours) {
        btnEncours.style.display = 'block'
      }
      try {
        const delayMs = 1000 // délai en millisecondes entre chaque ligne

        // Découpe du code ligne par ligne et insertion d'un sleep
        const lines = code.split('\n').filter((line) => line.trim() !== '')
        const delayedCode = lines
          .map((line) => `  ${line}\n  await sleep(${delayMs});`)
          .join('\n')

        const asyncWrapper = `(async () => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        ${delayedCode}
        })()`

        // console.info('Exécution du code :', asyncWrapper)

        // eslint-disable-next-line no-eval
        await eval(asyncWrapper) // nécessaire : le code Blockly accède aux fonctions de la closure locale
      } catch (e) {
        console.error(e)
      }
      if (btnEncours) {
        btnEncours.style.display = 'none'
      }
      if (checkIfSolution()) {
        if (btnCorrect) btnCorrect.style.display = 'block'
      } else {
        if (btnFaux) btnFaux.style.display = 'block'
      }
    }

    function checkIfSolution() {
      const lastEdge = edges.at(-1)
      if (!lastEdge) {
        return false
      }
      const { to } = lastEdge
      const dx = pos.y - to[1]
      const dy = pos.x - to[0]
      if (dx === 0 && dy === 0) {
        // Le robot est à la fin du parcours
        return true
      }
      return false
    }

    function createSolution() {
      resetRobot()
      resetWorkspace()
      for (const edge of edges) {
        const from = edge.from
        const to = edge.to
        const dx = to[0] - from[0]
        const dy = to[1] - from[1]
        if (dx === 1 && dy === 0) {
          // à droite
          if (orientation.angle === 0) {
            ajouterBlocALaSuite('move_forward') // Avancer
          } else if (orientation.angle === 270) {
            ajouterBlocALaSuite('turn_right') // Tourner à droite
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 0
          } else if (orientation.angle === 180) {
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 0
          } else if (orientation.angle === 90) {
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 0
          }
        } else if (dx === -1 && dy === 0) {
          // à gauche
          if (orientation.angle === 180) {
            ajouterBlocALaSuite('move_forward') // Avancer
          } else if (orientation.angle === 0) {
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 180
          } else if (orientation.angle === 90) {
            ajouterBlocALaSuite('turn_right') // Tourner à droite
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 180
          } else if (orientation.angle === 270) {
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 180
          }
        } else if (dx === 0 && dy === 1) {
          // en bas
          if (orientation.angle === 90) {
            ajouterBlocALaSuite('move_forward') // Avancer
          } else if (orientation.angle === 0) {
            ajouterBlocALaSuite('turn_right') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 90
          } else if (orientation.angle === 180) {
            ajouterBlocALaSuite('turn_left') // Tourner à droite
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 90
          } else if (orientation.angle === 270) {
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
          }
        } else if (dx === 0 && dy === -1) {
          // en haut
          if (orientation.angle === 270) {
            ajouterBlocALaSuite('move_forward') // Avancer
          } else if (orientation.angle === 0) {
            ajouterBlocALaSuite('turn_left') // Tourner à droite
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 270
          } else if (orientation.angle === 90) {
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('turn_left') // Tourner à gauche
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 270
          } else if (orientation.angle === 180) {
            ajouterBlocALaSuite('turn_right') // Tourner à droite
            ajouterBlocALaSuite('move_forward') // Avancer
            orientation.angle = 270
          }
        }
      }
      orientation.angle = 0
    }

    const listener = async function () {
      const btn = document.getElementById(id) as HTMLElement & {
        _eventsBound?: boolean
      }
      if (btn && !btn._eventsBound) {
        btn.querySelector('#btn-av')?.addEventListener('click', () => avancer())
        btn
          .querySelector('#btn-left')
          ?.addEventListener('click', () => tourner(-1))
        btn
          .querySelector('#btn-right')
          ?.addEventListener('click', () => tourner(1))
        btn.querySelector('#resetRobot')?.addEventListener('click', resetRobot)
        btn
          .querySelector('#resetWorkspace')
          ?.addEventListener('click', resetWorkspace)
        btn
          .querySelector('#showSolution')
          ?.addEventListener('click', createSolution)
        btn.querySelector('#runCode')?.addEventListener('click', runCode)
        btn
          .querySelector('#runCodeWithDelay')
          ?.addEventListener('click', runCodeWithDelay)
        await createBlockLy()
        btn._eventsBound = true // marquer comme attaché
      }
      document.removeEventListener('exercicesAffiches', listener) // On retire l'écouteur pour éviter les doublons
    }
    document.addEventListener('exercicesAffiches', listener)

    // Tracé du chemin avec flèches rouges
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = positions[`${path[i][0]},${path[i][1]}`]
      const [x2, y2] = positions[`${path[i + 1][0]},${path[i + 1][1]}`]
      drawArrow(svg, x1, y1, x2, y2)
    }

    // Ajout du marqueur de flèche
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = `
     <marker id="arrowhead${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth" viewBox="0 0 6 6">
  <path d="M 0 0 L 6 3 L 0 6 L 2 3 Z" fill="red" />
</marker>
    `
    svg.insertBefore(defs, svg.firstChild)
    svg.setAttribute('class', 'mathalea2d')
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    svg.setAttribute('style', 'display: inline-block')

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg) // svgElement est ton <svg>

    return `<div id=${id}>
    <div class="svgContainer" style="display: inline-block">
    ${svgString}<br>

  <!-- <button id="btn-av">⇒</button>
  <button id="btn-left" class="px-6 py-2.5 ml-6">↪</button>
  <button id="btn-right" class="px-6 py-2.5 ml-6">↩</button>
  <button id="generate" class="px-6 py-2.5 ml-6">🔁 Recommencer</button> -->
  </div>
  <xml id="toolbox" style="display: none">
  <category name="Déplacement">
    <block type="move_forward"></block>
    <block type="turn_left"></block>
    <block type="turn_right"></block>
  </category>
  <category name="Contrôle">
  <block type="start"></block>
    <block type="controls_repeat_ext">
      <value name="TIMES"><shadow type="math_number"><field name="NUM">2</field></shadow></value>
    </block>
  </category>
  </xml>

  <div>
  <button id="runCode" class="px-6 py-2.5" style="display:none">▶️ Exécuter</button>
  <button id="runCodeWithDelay" class="px-6 py-2.5" ${this.interactif ? 'style="display:none"' : ''}>▶️ Exécuter (pas à pas) </button>
  <button id="resetWorkspace" class="px-6 py-2.5" ${this.interactif ? 'style="display:none"' : ''}>♻️ Reinit programme</button>
  <button id="resetRobot" class="px-6 py-2.5" ${this.interactif ? 'style="display:none"' : ''}>🔁 Reinit bus</button>
  <button id="showSolution" class="px-6 py-2.5" style="display:none">💡 Show solution</button>
  <div id="message-correct" style="display: none; margin: 10px 10px 10px 10px; font-weight: bold; color: green; font-size: 1.2em;">
  🎉 Bravo, le bus est bien arrivé !
  </div>
  <div id="message-faux" style="display: none; margin: 10px 10px 10px 10px; font-weight: bold; color: red; font-size: 1.2em;">
   ❌ Attention, le bus n'est pas arrivé à sa destination finale!
  </div>
  <style>
  @keyframes blink {
    50% { opacity: 0; }
  }
  </style>
  <div id="message-encours" style="animation: blink 1s step-start infinite;display: none; margin: 10px 10px 10px 10px; font-weight: bold; font-size: 1.2em;">
  En cours d'exécution...
  </div>
  <div id="blocklyDiv${id}" style="height:300px;width:100%"></div>
  </div>
  </div>
`
  }

  correctionInteractive = (i: number) => {
    if (i === undefined) return ''
    if (this.answers === undefined) this.answers = {}
    let result = 'KO'
    const id: string = `${this.numeroExercice}_${i}`
    const ws = retrieveWorkspace(`blocklyDiv${id}`)
    if (ws) {
      const jsonStr = exportBlocklyJSONUltraLight(ws)
      this.answers[`blocklyDiv${id}`] = jsonStr
      // const json = JSON.parse(jsonStr)
      // Blockly.serialization.workspaces.load(json, ws)
    }

    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    )
    const divFeedback = document.querySelector<HTMLElement>(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    )
    if (spanResultat) spanResultat.innerHTML = ''

    const btn = document.getElementById(id)
    if (btn) {
      btn.querySelector<HTMLElement>('#runCode')?.click()
      const message = btn.querySelector<HTMLElement>('#message-correct')
      if (message?.style.display !== 'none') {
        result = 'OK'
        if (spanResultat) spanResultat.innerHTML = '😎'
      } else {
        if (spanResultat) spanResultat.innerHTML = '☹️'
        if (divFeedback) {
          divFeedback.innerHTML = "Le bus n'est pas arrivé à destination"
          divFeedback.style.display = 'block'
        }
      }
    }
    return result
  }
}

function retrieveWorkspace(name: string) {
  const workspacesAll = Blockly.Workspace.getAll()
  for (let k = 0; k < workspacesAll.length; k++) {
    const ws = workspacesAll[k]
    if (ws.idkey === name) {
      return ws
    }
  }
  return null
}

function exportBlocklyJSONUltraLight(workspace: BlocklyType.Workspace): string {
  const fullJson = Blockly.serialization.workspaces.save(workspace)

  // Liste noire des clés à supprimer
  const keysToRemove = new Set([
    'id',
    'x',
    'y',
    'collapsed',
    'deletable',
    'movable',
    'editable',
    'enabled',
    'inline',
    'inputsInline',
    'data',
    'extraState',
    'isShadow',
    'disabled',
  ])

  // Fonction récursive pour nettoyer l'objet
  function clean(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(clean)
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {}
      for (const key in obj) {
        if (!keysToRemove.has(key)) {
          newObj[key] = clean(obj[key])
        }
      }
      return newObj
    }
    return obj
  }

  const cleanedJson = clean(fullJson)
  return JSON.stringify(cleanedJson, null, 2)
}

function removeFirstWord(city: string) {
  const town = city.replace(/^(les|la|le|l’|l')\s*/i, '').trim()
  return town.charAt(0).toUpperCase() + town.slice(1).toLowerCase()
}

function createSolutionStr(
  edges: { from: number[]; to: number[] }[],
): string[] {
  const orientation = { angle: 0 }
  const result: string[] = []
  for (const edge of edges) {
    const from = edge.from
    const to = edge.to
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    if (dx === 1 && dy === 0) {
      // à droite
      if (orientation.angle === 0) {
        result.push('move_forward-Avancer') // Avancer
      } else if (orientation.angle === 270) {
        result.push('turn_right-Tourner à droite') // Tourner à droite
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 0
      } else if (orientation.angle === 180) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 0
      } else if (orientation.angle === 90) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 0
      }
    } else if (dx === -1 && dy === 0) {
      // à gauche
      if (orientation.angle === 180) {
        result.push('move_forward-Avancer') // Avancer
      } else if (orientation.angle === 0) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 180
      } else if (orientation.angle === 90) {
        result.push('turn_right-Tourner à droite') // Tourner à droite
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 180
      } else if (orientation.angle === 270) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 180
      }
    } else if (dx === 0 && dy === 1) {
      // en bas
      if (orientation.angle === 90) {
        result.push('move_forward-Avancer') // Avancer
      } else if (orientation.angle === 0) {
        result.push('turn_right-Tourner à droite') // Tourner à droite
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 90
      } else if (orientation.angle === 180) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 90
      } else if (orientation.angle === 270) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
      }
    } else if (dx === 0 && dy === -1) {
      // en haut
      if (orientation.angle === 270) {
        result.push('move_forward-Avancer') // Avancer
      } else if (orientation.angle === 0) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 270
      } else if (orientation.angle === 90) {
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('turn_left-Tourner à gauche') // Tourner à gauche
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 270
      } else if (orientation.angle === 180) {
        result.push('turn_right-Tourner à droite') // Tourner à droite
        result.push('move_forward-Avancer') // Avancer
        orientation.angle = 270
      }
    }
  }
  orientation.angle = 0
  return result
}
