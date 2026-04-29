import { randint } from '../../modules/outils'
import { format as formatLatex } from '../Latex'
import { lettreDepuisChiffre } from '../outils/outilString'
import {
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

  const preambule = renderAMCPreamble({
    documentClassOptions,
  })

  let groupsContent = ''
  for (let i = 0; i < groupRefs.length; i++) {
    groupsContent += groupTexBlocks[i]
  }

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
  for (let i = 0; i < groupRefs.length; i++) {
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
  return latexCode
}
