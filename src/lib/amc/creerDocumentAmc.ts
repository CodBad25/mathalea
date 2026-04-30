import { randint } from '../../modules/outils'
import { format as formatLatex } from '../Latex'
import { loadPackagesFromContent } from '../latex/preambuleTex'
import type { contentsType } from '../LatexTypes'
import { lettreDepuisChiffre } from '../outils/outilString'
import {
  AMCPreambleTemplate,
  renderAMCCopyContent,
  renderAMCDocumentStart,
  renderAMCGroupSection,
  renderAMCHeader,
  renderAMCPreamble,
} from './amcDocumentTemplates'
import { renderAMCHybride, renderElement } from './amcRender'
import type { IExerciceAMC } from './amcTypes'

type ExportQcmAmcResult = [string, string, number, string, boolean]

export type CreerDocumentAmcOptions = {
  exercices: IExerciceAMC[]
  nbQuestions?: number[]
  nbExemplaires?: number
  matiere?: string
  titre?: string
  typeEntete?: string
  format?: string
}

export type AMCGroupConsistencyReport = {
  declaredGroups: string[]
  restitutedGroups: string[]
  missingGroupDefinitions: string[]
  unusedGroupDefinitions: string[]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasPackageInLatex(latex: string, packageName: string): boolean {
  const escaped = escapeRegExp(packageName)
  const packageRegex = new RegExp(
    String.raw`\\usepackage(?:\[[^\]]*\])?\{[^}]*\b${escaped}\b[^}]*\}`,
  )
  return packageRegex.test(latex)
}

function parseUsepackageLine(line: string): {
  options: string | null
  packages: string[]
} | null {
  const match = line.match(/^\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}$/)
  if (!match) return null
  const options = match[1]?.trim() ? match[1].trim() : null
  const packages = match[2]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (packages.length === 0) return null
  return { options, packages }
}

function collectStaticAMCPackages(): Set<string> {
  const packages = new Set<string>()
  const regex = /\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(AMCPreambleTemplate)) !== null) {
    const names = match[1]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    for (const name of names) packages.add(name)
  }
  return packages
}

function normalizeDynamicPreambleLines(lines: string[]): string[] {
  const staticPackages = collectStaticAMCPackages()
  const dynamicPackages = new Map<string, string | null>()
  const packageOrder: string[] = []
  const otherLines: string[] = []
  const otherSeen = new Set<string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('%')) continue

    const packageDecl = parseUsepackageLine(trimmed)
    if (!packageDecl) {
      if (!otherSeen.has(trimmed)) {
        otherSeen.add(trimmed)
        otherLines.push(trimmed)
      }
      continue
    }

    for (const packageName of packageDecl.packages) {
      if (staticPackages.has(packageName)) continue

      if (!dynamicPackages.has(packageName)) {
        dynamicPackages.set(packageName, packageDecl.options)
        packageOrder.push(packageName)
        continue
      }

      const existingOptions = dynamicPackages.get(packageName)
      if (!existingOptions && packageDecl.options) {
        dynamicPackages.set(packageName, packageDecl.options)
      }
    }
  }

  const packageLines = packageOrder.map((packageName) => {
    const options = dynamicPackages.get(packageName)
    return options
      ? `\\usepackage[${options}]{${packageName}}`
      : `\\usepackage{${packageName}}`
  })

  return [...packageLines, ...otherLines]
}

function buildDynamicAMCPreamble(
  exercises: IExerciceAMC[],
  groupsContent: string,
): string {
  const dynamicContents: contentsType = {
    preamble: '',
    intro: '',
    content: groupsContent,
    contentCorr: '',
  }

  loadPackagesFromContent(dynamicContents)

  const detectedLines = dynamicContents.preamble
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('%'))

  const dynamicRawLines: string[] = [...detectedLines]

  const exercisePackages = new Set<string>()
  const exerciseCommands = new Set<string>()

  for (const exercise of exercises) {
    const maybePackages = (exercise as any).listePackages
    const packageList = Array.isArray(maybePackages)
      ? maybePackages
      : typeof maybePackages === 'string'
        ? [maybePackages]
        : []
    for (const entry of packageList) {
      if (typeof entry !== 'string') continue
      const trimmed = entry.trim()
      if (trimmed === '') continue
      if (trimmed.startsWith('cmd')) {
        exerciseCommands.add(trimmed.replace(/^cmd/, ''))
      } else {
        exercisePackages.add(trimmed)
      }
    }
  }

  for (const packageName of exercisePackages) {
    if (hasPackageInLatex(AMCPreambleTemplate, packageName)) continue
    if (packageName === 'bclogo') {
      dynamicRawLines.push('\\usepackage[tikz]{bclogo}')
    } else {
      dynamicRawLines.push(`\\usepackage{${packageName}}`)
    }
  }

  const additions = normalizeDynamicPreambleLines(dynamicRawLines)
  const seenLines = new Set(additions)

  for (const command of exerciseCommands) {
    const trimmed = command.trim()
    if (trimmed === '' || seenLines.has(trimmed)) continue
    additions.push(trimmed)
    seenLines.add(trimmed)
  }

  return additions.join('\n')
}

export function checkAMCGroupConsistency(
  latexCode: string,
): AMCGroupConsistencyReport {
  const declaredSet = new Set<string>()
  const restitutedSet = new Set<string>()

  const elementRegex = /\\element\{([^}]+)\}\{/g
  const restitueRegex = /\\restituegroupe(?:\[[^\]]*\])?\{([^}]+)\}/g

  let match: RegExpExecArray | null
  while ((match = elementRegex.exec(latexCode)) !== null) {
    declaredSet.add(match[1])
  }

  while ((match = restitueRegex.exec(latexCode)) !== null) {
    restitutedSet.add(match[1])
  }

  const declaredGroups = Array.from(declaredSet)
  const restitutedGroups = Array.from(restitutedSet)

  const missingGroupDefinitions = restitutedGroups.filter(
    (group) => !declaredSet.has(group),
  )
  const unusedGroupDefinitions = declaredGroups.filter(
    (group) => !restitutedSet.has(group),
  )

  return {
    declaredGroups,
    restitutedGroups,
    missingGroupDefinitions,
    unusedGroupDefinitions,
  }
}

/**
 * Exporte un exercice au format AMC (LaTeX) avec ses métadonnées de regroupement.
 * @param {IExerciceAMC} exercise Exercice à exporter.
 * @param {number} exerciseIndex Numéro unique pour gérer les noms des éléments d'un groupe de questions.
 * @returns {ExportQcmAmcResult} Tuple: [codeLatex, referenceGroupe, nombreQuestions, titre, melange].
 */

export function exportQcmAmc(
  exercise: IExerciceAMC,
  exerciseIndex: number,
): ExportQcmAmcResult {
  let ref = `${exercise.id}/${exercise.sup ? 'S:' + exercise.sup : ''}${exercise.sup2 ? 'S2:' + exercise.sup2 : ''}${exercise.sup3 ? 'S3:' + exercise.sup3 : ''}${exercise.sup4 ? 'S4:' + exercise.sup4 : ''}${exercise.sup5 ? 'S5:' + exercise.sup5 : ''}`
  if (ref[ref.length - 1] === '/') ref = ref.slice(0, -1)
  // Compatibilité transitoire : la structure historique AMCHybride est plus large que le typage strict actuel.
  const autoCorrection = exercise.autoCorrection as any[]
  const title = exercise.titre
  const type = exercise.amcType
  let texQr = ''
  let id = 0
  let isShuffled = true
  for (let j = 0; j < autoCorrection.length; j++) {
    if (autoCorrection[j] === undefined) {
      // Normalement, cela ne devrait jamais arriver.
      autoCorrection[j] = {}
    }
    switch (type) {
      case 'qcmMono': // question QCM à choix unique
      case 'qcmMult':
        texQr += renderElement(
          { type: 'qcm', data: autoCorrection[j] },
          {
            ref,
            id: `${ref}/${lettreDepuisChiffre(exerciseIndex + 1)}${id + 10}`,
            exercice: exercise,
            index: j,
          },
        )
        id++
        break
      case 'AMCOpen': // question ouverte AMCOpen corrigée par l'enseignant
        texQr += renderElement(
          { type: 'open', data: autoCorrection[j] },
          {
            ref,
            id: `${ref}/${lettreDepuisChiffre(exerciseIndex + 1)}${id + 10}`,
            exercice: exercise,
            index: j,
          },
        )
        id++
        break
      case 'AMCNum':
        texQr += renderElement(
          { type: 'num', data: autoCorrection[j] },
          {
            ref,
            id: `${ref}/${lettreDepuisChiffre(exerciseIndex + 1)}${id + 10}`,
            exercice: exercise,
            index: j,
          },
        )
        id++
        break
      default: {
        // Si on arrive ici, c'est que le type est AMCHybride.
        const hybrid = renderAMCHybride({
          type,
          autoCorrectionItem: autoCorrection[j],
          exercice: exercise,
          ref,
          idExo: exerciseIndex,
          questionIndex: j,
          currentId: id,
          melange: isShuffled,
        })
        texQr += hybrid.texQr
        id = hybrid.nextId
        isShuffled = hybrid.melange
        break
      }
    }
  }
  texQr = texQr.replaceAll(
    /(<br *\/?>[\n\t ]*)+<br *\/?>/gim,
    '\n\n\\medskip\n',
  )
  texQr = texQr.replaceAll('<br>', '\\\\\n')
  return [texQr, ref, exercise.nbQuestions, title, isShuffled]
}

/**
 * @author Jean-claude Lhote
 * Fonction qui crée un document pour AMC (pour le compiler, le package automultiplechoice.sty doit être présent)
 *
 * exercices est un tableau d'exercices TypeExercice[]
 *
 * nbQuestions est un tableau pour préciser le nombre de questions à prendre dans chaque groupe pour constituer une copie.
 * s'il est indéfini, toutes les questions du groupe seront posées.
 * nbExemplaires est le nombre de copies à générer.
 * matiere et titre se passent de commentaires : ils renseignent l'entête du sujet.
 * @param {{
 *   exercices: import('../types').IExercice[],
 *   nbQuestions?: number[],
 *   nbExemplaires?: number,
 *   matiere?: string,
 *   titre?: string,
 *   typeEntete?: string,
 *   format?: string
 * }} options
 */
export function creerDocumentAmc(options: CreerDocumentAmcOptions): string {
  const {
    exercices: exercises,
    nbQuestions = [] as number[],
    nbExemplaires: copiesCount = 1,
    matiere: subject = 'Mathématiques',
    titre: title = 'Evaluation',
    typeEntete: headerType = 'AMCcodeGrid',
    format = 'A4',
  } = options
  // Attention exercises est maintenant un tableau de tous les exercices.
  // Dans cette partie, la fonction récupère tous les exercices et les trie pour les rassembler par groupe.
  // Toutes les questions d'un même exercice seront regroupées.
  let exerciseIndex = 0
  let groupIndex
  const areGroupQuestionCountsImplicit: boolean[] = []
  const seed = randint(1, 100000)
  const groupRefs: string[] = []
  const groupTexBlocks: string[] = ['']
  const groupTitles: string[] = []
  const groupShuffleFlags: boolean[] = []
  const amcExerciseCount = exercises.filter((el) => el.amcReady).length
  if (amcExerciseCount === 0) return ''
  for (const exercise of exercises) {
    if (!exercise.amcReady) continue

    const [
      exerciseTex,
      groupRef,
      exerciseQuestionCount,
      exerciseTitle,
      exerciseIsShuffled,
    ] = exportQcmAmc(exercise, exerciseIndex)
    exerciseIndex++
    groupIndex = groupRefs.indexOf(groupRef)
    if (groupIndex === -1) {
      // Le groupe n'existe pas encore.
      groupRefs.push(groupRef)
      groupIndex = groupRefs.length - 1
      groupTexBlocks[groupIndex] = formatLatex(exerciseTex)

      // Si le nombre de questions du groupe n'est pas défini, on prend toutes les questions de l'exercice.
      if (typeof nbQuestions[groupIndex] === 'undefined') {
        areGroupQuestionCountsImplicit[groupIndex] = true
        nbQuestions[groupIndex] = exerciseQuestionCount
      } else {
        // Le nombre de questions à restituer pour ce groupe a été fixé par l'utilisateur.
        areGroupQuestionCountsImplicit[groupIndex] = false
      }
      groupTitles[groupIndex] = exerciseTitle
      groupShuffleFlags[groupIndex] = exerciseIsShuffled
    } else {
      // Le groupe existe déjà : on ajoute seulement si ce bloc n'est pas déjà présent.
      if (groupTexBlocks[groupIndex].indexOf(exerciseTex) === -1) {
        groupTexBlocks[groupIndex] += exerciseTex
        // Si le nombre de questions était implicite, on cumule avec les questions de l'exercice ajouté.
        if (areGroupQuestionCountsImplicit[groupIndex]) {
          nbQuestions[groupIndex] += exerciseQuestionCount
        }
      }
    }
  }
  // Fin de la préparation des groupes.

  let isDuplexPrinting = false
  const duplexPrintingCheckbox = document.getElementById(
    'impression_recto_verso',
  ) as HTMLInputElement | null
  if (duplexPrintingCheckbox !== null)
    isDuplexPrinting = duplexPrintingCheckbox.checked
  let latexCode = ''

  const documentClassOptions = [
    isDuplexPrinting ? 'twoside' : null,
    '10pt',
    format === 'A3' ? 'a3paper' : 'a4paper',
    format === 'A3' ? 'landscape' : null,
    'french',
    'svgnames',
  ]
    .filter(Boolean)
    .join(',')

  const activeGroupIndexes: number[] = []
  for (let i = 0; i < groupRefs.length; i++) {
    if (groupTexBlocks[i].includes('\\element{')) {
      activeGroupIndexes.push(i)
    }
  }

  let groupsContent = ''
  for (const i of activeGroupIndexes) {
    groupsContent += groupTexBlocks[i]
  }

  const preambule = renderAMCPreamble({
    documentClassOptions,
    dynamicPreamble: buildDynamicAMCPreamble(exercises, groupsContent),
  })

  const documentStart = renderAMCDocumentStart({
    seed,
    groupsContent,
  })

  const copyHeader = renderAMCHeader({
    isA3: format === 'A3',
    isAssociation: headerType === 'AMCassociation',
    isCodeGrid: headerType === 'AMCcodeGrid',
    matiere: subject,
    titre: title,
    nbExemplaires: copiesCount,
  })

  let groupsSections = ''
  for (const i of activeGroupIndexes) {
    const groupName = groupRefs[i]
    groupsSections += renderAMCGroupSection({
      groupTitle: groupTitles[i],
      groupName,
      isMixed: groupShuffleFlags[i],
      questionsToRestore: nbQuestions[i],
    })
  }
  const copyContent = renderAMCCopyContent({
    isCodeGrid: headerType === 'AMCcodeGrid',
    groupsSections,
    isA3: format === 'A3',
    isAssociation: headerType === 'AMCassociation',
  })

  latexCode = preambule + '\n' + documentStart + '\n' + copyHeader + copyContent
  if (headerType === 'AMCassociation') {
    latexCode +=
      '\n \n \\csvreader[head to column names]{liste.csv}{}{\\sujet}\n'
  }
  latexCode += '\\end{document}\n'

  const consistencyReport = checkAMCGroupConsistency(latexCode)
  if (consistencyReport.missingGroupDefinitions.length > 0) {
    console.warn(
      '[AMC] Group consistency issue: groups restituted without element definitions',
      consistencyReport,
    )
  }

  return latexCode
}
