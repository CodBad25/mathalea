import { ObjetMathalea2D } from '../lib/2d/ObjetMathalea2D'
import { context } from './context'

/**
 * Traducteur scratch3 (Latex) -> scratchblocks
 * On lui passe une chaine de caractères contenant une série de commande Latex du package Latex Scratch3
 * Elle retourne une chaine de caractères contenant l'équivalent en langage scratchblocks si le contexte est isHtml !
 * Si le contexte est !isHtml alors elle retourne la chaine passée en argument.
 * http://mirrors.ctan.org/macros/latex/contrib/scratch3/scratch3-fr.pdf
 * https://scratchblocks.github.io
 * https://github.com/iremlp/c2it-article-scratchblocks/blob/master/res/scratchblocks.txt
 * @author Jean-Claude Lhote.
 */

export function scratchblock(
  stringLatex: string,
  style = 'block',
  useHighContrast = false,
): string | false {
  const regex1 = /[\\{}]/
  const regex4 = /[{ ]/
  const litcommande = function (souschaine: string) {
    let extrait
    if (souschaine[0] === '}') {
      return '}'
    } else {
      extrait = souschaine.split(regex4)[0]
      return extrait
    }
  }

  /*****************************************************/
  /** ********* La fonction d'analyse récursive *********/
  /*****************************************************/
  const translatex = function (
    chaine: string,
    index: number,
    compteAccolades: number,
  ): [string, number, number] {
    const LOOP_GUARD_LIMIT = Math.max(chaine.length * 2, 200)

    if (index < 0) {
      return ['', 0, Math.max(0, compteAccolades)]
    }
    if (index >= chaine.length) {
      return ['', chaine.length, Math.max(0, compteAccolades)]
    }
    if (compteAccolades < 0) {
      compteAccolades = 0
    }

    let resultat = []
    let texte = []
    let texte2 = []
    let texte3 = []
    let taille
    let string
    let fleche
    let compteur, debut // pour les boucles et les if
    let guard = 0
    const souschaine = chaine.substring(index)
    const commande = litcommande(souschaine)
    switch (commande.substring(0, 5)) {
      case '\\bloc':
        string = commande.split('{')[0]
        taille = string.length
        string = string.substring(6)
        compteAccolades++
        switch (string) {
          case 'stop':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            resultat = [`${texte[0]} ${texte2[0]} `, texte2[1], texte2[2]]
            break
          case 'look':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0], texte[1], texte[2]]
            break
          case 'move':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0], texte[1], texte[2]]
            break
          case 'variable':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0], texte[1], texte[2]]
            break
          case 'control':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0], texte[1], texte[2]]
            break
          case 'moreblocks': {
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            let moreBlocksText = texte[0]
            let moreBlocksIndex = Number(texte[1])
            let moreBlocksDepth = Number(texte[2])
            guard = 0
            while (
              chaine.charAt(moreBlocksIndex) !== '}' &&
              guard < LOOP_GUARD_LIMIT
            ) {
              const previousIndex = moreBlocksIndex
              texte = translatex(chaine, moreBlocksIndex, moreBlocksDepth)
              moreBlocksText += texte[0]
              moreBlocksIndex = Number(texte[1])
              moreBlocksDepth = Number(texte[2])
              if (moreBlocksIndex <= previousIndex) {
                break
              }
              guard++
            }
            resultat = [
              `${moreBlocksText} :: custom`,
              moreBlocksIndex + 1,
              moreBlocksDepth - 1,
            ]
            break
          }
          case 'pen': {
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            let penText = texte[0]
            let penIndex = Number(texte[1])
            let penDepth = Number(texte[2])
            guard = 0
            while (
              chaine.charAt(penIndex) !== '}' &&
              guard < LOOP_GUARD_LIMIT
            ) {
              const previousIndex = penIndex
              texte = translatex(chaine, penIndex, penDepth)
              penText += texte[0]
              penIndex = Number(texte[1])
              penDepth = Number(texte[2])
              if (penIndex <= previousIndex) {
                break
              }
              guard++
            }
            resultat = [penText + ' :: pen', penIndex + 1, penDepth - 1]
            break
          }
          case 'list':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0] + ' :: list', texte[1], texte[2]]
            break
          case 'init':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0], texte[1], texte[2]]
            break
          case 'space\n':
            compteAccolades--
            resultat = ['\n', 11 + index, compteAccolades]
            break
          case 'if':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            texte3 = translatex(chaine, texte2[1], texte2[2])
            resultat = [
              `${texte[0]} ${texte2[0]} ${texte3[0]}`,
              texte3[1] + 1,
              texte3[2] - 1,
            ] as [string, number, number]
            compteAccolades = resultat[2]
            compteur = compteAccolades + 1
            debut = chaine.substring(resultat[1]).indexOf('{') + resultat[1]
            resultat[1] = debut + 1
            resultat[0] += '\n'
            guard = 0
            while (compteur > compteAccolades && guard < LOOP_GUARD_LIMIT) {
              const previousIndex = resultat[1]
              texte = translatex(chaine, resultat[1], compteur)
              resultat[0] += ' ' + texte[0]
              resultat[1] = texte[1]
              compteur = texte[2]
              if (resultat[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' fin'
            break

          case 'ifelse':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            texte3 = translatex(chaine, texte2[1], texte2[2])
            resultat = [
              `${texte[0]} ${texte2[0]} ${texte3[0]}`,
              texte3[1] + 1,
              texte3[2] - 1,
            ] as [string, number, number]
            compteAccolades = resultat[2]
            compteur = compteAccolades + 1
            debut = chaine.substring(resultat[1]).indexOf('{') + resultat[1]
            resultat[1] = debut + 1
            resultat[0] += '\n'
            guard = 0
            while (compteur > compteAccolades && guard < LOOP_GUARD_LIMIT) {
              const previousIndex = resultat[1]
              texte = translatex(chaine, resultat[1], compteur)
              resultat[0] += ' ' + texte[0]
              resultat[1] = texte[1]
              compteur = texte[2]
              if (resultat[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' sinon'
            compteur = compteAccolades + 1
            debut = chaine.substring(resultat[1]).indexOf('{') + resultat[1]
            resultat[1] = debut + 1
            resultat[0] += '\n'
            guard = 0
            while (compteur > compteAccolades && guard < LOOP_GUARD_LIMIT) {
              const previousIndex = resultat[1]
              texte = translatex(chaine, resultat[1], compteur)
              resultat[0] += ' ' + texte[0]
              resultat[1] = texte[1]
              compteur = texte[2]
              if (resultat[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' fin'
            break
          case 'repeat':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            if (texte[0].split(' ')[1] !== 'indéfiniment') {
              if (texte[0].split(' ')[1] !== "jusqu'à") {
                texte2 = translatex(chaine, texte[1], texte[2])
                texte3 = translatex(chaine, texte2[1], texte2[2])
                resultat = [
                  `${texte[0]} ${texte2[0]} ${texte3[0]}`,
                  texte3[1] + 1,
                  texte3[2] - 1,
                ] as [string, number, number]
                compteAccolades = resultat[2]
              } else {
                texte2 = translatex(chaine, texte[1], texte[2])
                resultat = [
                  `${texte[0]} ${texte2[0]} `,
                  texte2[1] + 1,
                  texte2[2] - 1,
                ] as [string, number, number]
                compteAccolades = resultat[2]
              }
            } else {
              resultat = [`${texte[0]} `, texte[1] + 1, texte[2] - 1] as [
                string,
                number,
                number,
              ]
              compteAccolades = resultat[2]
            }
            compteur = compteAccolades + 1
            debut = chaine.substring(resultat[1]).indexOf('{') + resultat[1]
            resultat[1] = debut + 1
            resultat[0] += '\n'
            guard = 0
            while (compteur > compteAccolades && guard < LOOP_GUARD_LIMIT) {
              const previousIndex = resultat[1]
              texte = translatex(chaine, resultat[1], compteur)
              resultat[0] += ' ' + texte[0]
              resultat[1] = texte[1]
              compteur = texte[2]
              if (resultat[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' fin'
            break
          default:
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [texte[0], texte[1], texte[2]]
            break
        }

        break
      case '\\oval':
        string = commande.split('{')[0]
        taille = string.length
        string = string.substring(5)
        compteAccolades++
        if (string.charAt(string.length - 1) === '*') {
          fleche = true
          string = string.substring(0, string.length - 1)
        } else fleche = false
        switch (string) {
          case 'num':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [`[${texte[0]}]`, texte[1] + 1, texte[2] - 1] // Indispensable pour 3L14DNB-1
            /*
            if (Number.isNaN(texte[0]) && texte[0].indexOf(regex3.source)) {
              resultat = [`[${texte[0]}]`, texte[1] + 1, texte[2] - 1]
            } else {
              resultat = [`(${texte[0]})`, texte[1] + 1, texte[2] - 1]
            }
            */
            break
          case 'moreblocks':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            if (fleche) {
              resultat = [
                `(${texte[0]} v :: custom-arg)`,
                texte[1] + 1,
                texte[2] - 1,
              ]
            } else {
              resultat = [
                `(${texte[0]} :: custom-arg)`,
                texte[1] + 1,
                texte[2] - 1,
              ]
            }
            break
          case 'variable':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            if (fleche) {
              resultat = [`(${texte[0]} v)`, texte[1] + 1, texte[2] - 1]
            } else {
              resultat = [`(${texte[0]})`, texte[1] + 1, texte[2] - 1]
            }
            break
          case 'sound':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            if (fleche) {
              resultat = [
                `(${texte[0]} v :: sound)`,
                texte[1] + 1,
                texte[2] - 1,
              ]
            } else {
              resultat = [`(${texte[0]} :: sound)`, texte[1] + 1, texte[2] - 1]
            }
            break
          case 'sensing':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            if (fleche) {
              resultat = [
                `(${texte[0]} v :: sensing)`,
                texte[1] + 1,
                texte[2] - 1,
              ]
            } else {
              resultat = [
                `(${texte[0]} :: sensing)`,
                texte[1] + 1,
                texte[2] - 1,
              ]
            }
            break
          case 'operator':
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            resultat = [`(${texte[0]} ${texte2[0]}`, texte2[1], texte2[2]]
            guard = 0
            while (
              chaine.charAt(texte2[1]) !== '}' &&
              guard < LOOP_GUARD_LIMIT
            ) {
              const previousIndex = texte2[1]
              texte2 = translatex(chaine, texte2[1], texte2[2])
              resultat[0] += ' ' + texte2[0]
              if (texte2[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ')'
            resultat[1] = texte2[1] + 1
            resultat[2] = texte2[2] - 1
            break

          default:
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            if (fleche) {
              resultat = [`(${texte[0]} v)`, texte[1] + 1, texte[2] - 1]
            } else {
              resultat = [`(${texte[0]})`, texte[1] + 1, texte[2] - 1]
            }
            break
        }

        break
      case '\\bool':
        string = commande.split(/\{ /)[0]
        taille = string.length
        string = string.substring(5, 9)
        switch (string) {
          case 'more':
            compteAccolades++
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [
              `<${texte[0]} :: custom-arg>`,
              texte[1] + 1,
              texte[2] - 1,
            ]
            break
          case 'oper':
            compteAccolades++
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            resultat = [`<${texte[0]} ${texte2[0]}`, texte2[1], texte2[2]]
            guard = 0
            while (
              chaine.charAt(texte2[1]) !== '}' &&
              guard < LOOP_GUARD_LIMIT
            ) {
              const previousIndex = texte2[1]
              texte2 = translatex(chaine, texte2[1], texte2[2])
              resultat[0] += ' ' + texte2[0]
              if (texte2[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' :: operators boolean>'
            resultat[1] = texte2[1] + 1
            resultat[2] = texte2[2] - 1
            break
          case 'empt':
            resultat = [
              '< vide :: operators boolean>',
              index + taille + 1,
              compteAccolades,
            ]
            break
          case 'sens':
            compteAccolades++
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            resultat = [`<${texte[0]} ${texte2[0]}`, texte2[1], texte2[2]]
            guard = 0
            while (
              chaine.charAt(texte2[1]) !== '}' &&
              guard < LOOP_GUARD_LIMIT
            ) {
              const previousIndex = texte2[1]
              texte2 = translatex(chaine, texte2[1], texte2[2])
              resultat[0] += ' ' + texte2[0]
              if (texte2[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' :: sensing>'
            resultat[1] = texte2[1] + 1
            resultat[2] = texte2[2] - 1
            break
          case 'list':
            compteAccolades++
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            texte2 = translatex(chaine, texte[1], texte[2])
            resultat = [`<${texte[0]} ${texte2[0]}`, texte2[1], texte2[2]]
            guard = 0
            while (
              chaine.charAt(texte2[1]) !== '}' &&
              guard < LOOP_GUARD_LIMIT
            ) {
              const previousIndex = texte2[1]
              texte2 = translatex(chaine, texte2[1], texte2[2])
              resultat[0] += ' ' + texte2[0]
              if (texte2[1] <= previousIndex) {
                break
              }
              guard++
            }
            resultat[0] += ' :: list>'
            resultat[1] = texte2[1] + 1
            resultat[2] = texte2[2] - 1
            break
          default:
            texte = translatex(chaine, index + taille + 1, compteAccolades)
            resultat = [`<${texte[0]}>`, texte[1], texte[2]]
            break
        }
        break
      case '\\init':
        string = commande.split('{')[0]
        taille = string.length
        compteAccolades++
        texte = translatex(chaine, index + taille + 1, compteAccolades)
        texte2 = translatex(chaine, texte[1], texte[2])
        resultat = [`${texte[0]} ${texte2[0]} `, texte2[1], texte2[2]]
        break
      case '\\name':
        string = commande.split('{')[0]
        taille = string.length
        compteAccolades++
        texte = translatex(chaine, index + taille + 1, compteAccolades)
        texte2 = translatex(chaine, texte[1], texte[2])
        resultat = [`${texte[0]} ${texte2[0]}`, texte2[1], texte2[2]]
        guard = 0
        while (chaine.charAt(texte2[1]) !== '}' && guard < LOOP_GUARD_LIMIT) {
          const previousIndex = texte2[1]
          texte2 = translatex(chaine, texte2[1], texte2[2])
          resultat[0] += ' ' + texte2[0]
          if (texte2[1] <= previousIndex) {
            break
          }
          guard++
        }
        resultat[1] = texte2[1] + 1
        resultat[2] = texte2[2] - 1
        break
      default:
        switch (commande) {
          case '\\_':
            resultat = ['_', index + 2, compteAccolades]
            break
          case '}':
            compteAccolades--
            resultat = [' ', 1 + index, compteAccolades]
            break
          case '\\begin': {
            compteAccolades++
            if (chaine.substring(15 + index)[0] === '[') {
              index = chaine.substring(15 + index).indexOf(']') + 16 + index
            } else {
              index += 15
            }
            resultat = [' <!-- Code Scratch -->', index, compteAccolades]
            break
          }
          case '\\end':
            compteAccolades--
            resultat = [
              ' <!-- Fin du Code Scratch  -->\n',
              13 + index,
              compteAccolades,
            ]
            break
          case '\\turnleft':
            resultat = ['gauche ', 11 + index, compteAccolades]
            break
          case '\\turnright':
            resultat = ['droite ', 12 + index, compteAccolades]
            break
          case '\\greenflag':
            resultat = [' @greenFlag ', 10 + index, compteAccolades]
            break
          case '\\selectmenu':
            compteAccolades++
            texte = translatex(chaine, 12 + index, compteAccolades)
            resultat = [`[${texte[0]} v]`, texte[1] + 1, texte[2] - 1]
            break
          case '\\selectmenu*':
            compteAccolades++
            texte = translatex(chaine, 13 + index, compteAccolades)
            resultat = [`[${texte[0]} v] `, texte[1] + 1, texte[2] - 1]
            break
          case '\\pencolor': {
            const remaining = chaine.substring(index)
            const htmlColorMatch = remaining.match(
              /^\\pencolor\{\[HTML\]\{([0-9a-fA-F]{6})\}\}/,
            )
            if (htmlColorMatch) {
              resultat = [
                `[#${htmlColorMatch[1].toUpperCase()}]`,
                index + htmlColorMatch[0].length,
                compteAccolades,
              ]
              break
            }

            compteAccolades++
            texte = translatex(chaine, 10 + index, compteAccolades)
            resultat = [`[${texte[0]}]`, texte[1] + 1, texte[2] - 1]
            break
          }
          default:
            if (commande.startsWith('\\_')) {
              resultat = ['_', index + 2, compteAccolades]
              break
            }
            string = chaine.substring(index).split(regex1)[0]
            resultat = [string, string.length + index, compteAccolades]
            break
        }
        break
    }
    return resultat as [string, number, number]
  }
  /*********************************************/
  /** *********** Fin de translatex *************/
  /*********************************************/

  // boucle pricipale de scratchblock2
  let codeScratch = ''
  let fin
  let result = []
  let index
  let compteur = 0
  if (
    !(
      (stringLatex.match(/\{/g) || []).length ===
      (stringLatex.match(/\}/g) || []).length
    )
  ) {
    // console.log("Il n'y a pas le même nombre de { que de }. Je préfère m'arrêter.")
    return false
  }
  if (!context.isHtml) {
    codeScratch = stringLatex
  } else {
    const regex = /scale=([\d.]+)/
    const matches = stringLatex.match(regex)
    const inlineStyle =
      style !== 'block'
        ? ' style="display:inline-block; vertical-align:middle";'
        : ''
    const highContrastClass = useHighContrast
      ? ' scratchblocks-style-scratch3-high-contrast'
      : ''
    if (matches) {
      const scale = matches[0]
      codeScratch = `<pre class="blocks2${highContrastClass}" ${inlineStyle} ${scale}>`
    } else {
      codeScratch = `<pre class="blocks${highContrastClass}" ${inlineStyle}>`
    }
    index = 0
    fin = false
    let k = 0
    const MAIN_LOOP_GUARD_LIMIT = Math.max(stringLatex.length * 2, 600)
    let previousIndex = -1
    while (!fin && k < MAIN_LOOP_GUARD_LIMIT) {
      result = translatex(stringLatex, index, compteur)
      codeScratch += result[0]
      index = result[1]
      compteur = result[2]

      if (index <= previousIndex || index >= stringLatex.length) {
        fin = true
      }

      previousIndex = index
      k++ // MGu pour éviter la boucle infinie
    }
    if (!fin)
      window.notify(
        'Il y a un problème avec le scratchblock, une commande certainement non gérée : ',
        { stringLatex },
      )
    codeScratch += '</pre>\n'
  }
  return codeScratch
}

/**
 * Représente une boussole pour les 4 orientations possible dans Scratch
 * Il n'y a pas d'arguments, c'est un objet statique qui a sa méthode svg() et sa méthode tikz()
 * Il est difficile de modifier la taille de l'objet à cause du texte des blocks
 * @class
 * @author Jean-Claude Lhote, Sylvain Chambon, Sébastien Lozano
 * @return {RoseDesVents}
 */
export class RoseDesVents extends ObjetMathalea2D {
  constructor() {
    super()
    this.bordures = [-6, -6, 6, 6]
  }

  svg(coeff: number) {
    function cadran() {
      let group = '<g>\n'
      for (let alpha = 0; alpha < 360; alpha += 15) {
        group += `<line x1="${115 + Math.round(45 * Math.cos((alpha * Math.PI) / 180))}" y1="${115 + Math.round(45 * Math.sin((alpha * Math.PI) / 180))}" x2="${115 + Math.round(35 * Math.cos((alpha * Math.PI) / 180))}" y2="${115 + Math.round(35 * Math.sin((alpha * Math.PI) / 180))}" stroke="white" />\n`
      }
      return group + '</g>\n'
    }

    function sorientera(angle: number) {
      return `<g id="sorientera${angle}" style="transform: scale(0.675)">
<g transform="translate(0 0)">
<g transform="translate(2 1)">
<path class="sb3-motion" d="M 0 4
      A 4 4 0 0 1 4 0
      H 12 c 2 0 3 1 4 2
      l 4 4
      c 1 1 2 2 4 2
      h 12
      c 2 0 3 -1 4 -2
      l 4 -4
      c 1 -1 2 -2 4 -2
      L 139 0
      a 4 4 0 0 1 4 4 L 143 44 a 4 4 0 0 1 -4 4 L 48 48 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 48 a 4 4 0 0 1 -4 -4 Z"></path>
      <text class="sb3-label sb3-" x="0" y="13" transform="translate(8 17)">s'orienter</text>
      <text class="sb3-label sb3-" x="0" y="13" transform="translate(78 17)">à</text>
      <g transform="translate(95 8)">
      <rect rx="16" ry="16" x="0" y="0" width="40" height="32" class="sb3-motion sb3-input sb3-input-number"></rect>
      <text class="sb3-label sb3-literal-number" x="0" y="13" transform="translate(11 9)">${angle}</text>
      </g>
      </g>
      </g>
      </g>`
    }

    const code = `<g class="roseDesVents" id=roseDesVents${this.id} transform="translate(-115 -115) scale(${coeff / 20})">
<rect x="50" y="50" rx="4" ry="4" width="130" height="130" fill="#4c97ff" stroke="#3373cc"/>
<circle r="50" cx="115" cy="115" fill="#3373cc" stroke="#3373cc"/>
${cadran()}
<clipPath id="monClip">
    <rect x="115" y="50" width="50" height="65"></rect>
  </clipPath>
  <circle r="50" cx="115" cy="115" id="quartDeCercle" fill-opacity="0.3" fill="white" clip-path="url(#monClip)"/>
  <defs>
  <g id="direction" x="0" y="0">
  <circle r="10" cx="0" cy="0" fill="white"/>
  <path d="M -6 3 h 7 v 3 l 5 -6 l -5 -6 v 3 h -7 v 6 z" fill="#4c97ff" />
  </g>
 </defs>
 <use href="#direction" x="165" y="115" />
 <use href="#direction" transform="rotate(-90 115 65)" x="115" y="65" />
 <use href="#direction" transform="rotate(-180 65 115)" x="65" y="115" />
 <use href="#direction" transform="rotate(90 115 165)" x="115" y="165" />
  <g transform="translate(65 0)">${sorientera(0)}</g>
<g transform="translate(230 65) rotate(90)">${sorientera(90)}</g>
<g transform="translate(165 230) rotate(180)">${sorientera(180)}</g>
<g transform="translate(0 165) rotate(-90)">${sorientera(-90)}</g>
</g>
`
    return code
  }

  tikz() {
    const code = `\\node (centre) {
    \\begin{tikzpicture}[baseline, scale=0.5]
              \\definecolor{scratchBlue}{RGB}{76, 151, 255}
               \\definecolor{scratchBlue2}{RGB}{51, 115, 204}
                \\pgfmathsetmacro{\\rayon}{1.5}
                \\coordinate (O) at (2,2);
                \\draw[scratchBlue2,thin,fill=scratchBlue,rounded corners] (0,0) rectangle (4,4);
                \\fill[scratchBlue2] (O) circle (\\rayon);
                \\fill[white,opacity=0.3] (O) -- ++(\\rayon,0) arc [start angle=0, end angle=90, radius=\\rayon cm] -- (O);
                \\draw[white,thick] ($(O)+(0,\\rayon)$) -- (O) -- ($(O)+(\\rayon,0)$) coordinate (dir90);
                \\fill[white] (O) circle (2pt);
                \\foreach \\angle in {0,15,...,345} {
      \\coordinate (A) at ($(O)+(\\angle:1.3)$);
                    \\draw[white,thin] ($(O)!0.8!(A)$) -- (A);
      }
                \\fill[white] (dir90) circle (10pt);
                \\node[scratchBlue,fill=scratchBlue,single arrow,scale=0.2] at (dir90) {aa};
                \\coordinate (N) at (2,\\rayon+2);
                \\fill[white] (N) circle (10pt);
                 \\node[scratchBlue,fill=scratchBlue,single arrow,scale=0.2, rotate=90] at (N) {aa};
                   \\coordinate (S) at (2,2-\\rayon);
                   \\fill[white] (S) circle (10pt);
                 \\node[scratchBlue,fill=scratchBlue,single arrow,scale=0.2, rotate=-90] at (S) {aa};
                   \\coordinate (W) at (2-\\rayon,2);
                   \\fill[white] (W) circle (10pt);
                 \\node[scratchBlue,fill=scratchBlue,single arrow,scale=0.2, rotate=180] at (W) {aa};
                 
            \\end{tikzpicture}
    };
        \\node[above] at (centre.north){
    \\begin{scratch}[scale=0.5]
                \\blockmove{s'orienter à \\ovalnum{$0$}}
            \\end{scratch}
      };
        \\node[above,rotate=-90] at (centre.east) {
      \\begin{scratch}[scale=0.5]
                \\blockmove{s'orienter à \\ovalnum{$90$}}
            \\end{scratch}
        };
        \\node[above, rotate=180] at (centre.south){
        \\begin{scratch}[scale=0.5]
                \\blockmove{s'orienter à \\ovalnum{$180$}}
            \\end{scratch}
          };
        \\node[above,rotate=90] at (centre.west){
          \\begin{scratch}[scale=0.5]
                \\blockmove{s'orienter à \\ovalnum{$-90$}}
            \\end{scratch}
            };`
    return code
  }
}

/**
 * Crée une instance de RoseDesVents (une boussole Scratch)
 * Il n'y a pas d'arguments, c'est un objet statique qui a sa méthode svg() et sa méthode tikz()
 * Il est difficile de modifier la taille de l'objet à cause du texte des blocks
 * @returns {RoseDesVents}
 */
export function roseDesVents() {
  return new RoseDesVents()
}
