/**
 * Ce script permet de mettre à jour les fichiers :
 * - src/json/exercices.json
 * - src/json/exercicesNonInteractifs.json
 * - src/json/uuidsToUrl.json
 * - src/json/referentiel2022.json
 * - src/json/refToUuid.json
 *
 * Il permet aussi de générer un uuid pour un nouvel exercice
 * Il faut lancer ce script après avoir créé un nouvel exercice
 * Ce script s'appuie sur emptyRef2022.json qui contient les niveaux et les catégories
 * Les titres des niveaux, thèmes et sous-thèmes sont gérés dans src/json/levelsThemesList.json
 *
 * Pour ajouter un nouveau chapitre, il faut donc l'écrire dans emptyRef2022.json puis éventuellement
 * mettre à jour src/levelsThemesList.json ou src/codeToLevelList.json
 *
 * ToDo : arrêter l'utilisation de referentielRessources.json
 *
 * Remarque : nouveau fonctionnement au 13 aout 2023 en remplacement de makJson.js
 */

import { readFileSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

async function readInfos(
  dirPath,
  uuidMap,
  exercicesNonInteractifs,
  refToUuid,
  exercicesShuffled,
  codePays,
  exercicesNonClasses = {},
  refMap = new Map(),
) {
  const files = await fs.readdir(dirPath)
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.posix.join(dirPath, file)
      const stat = await fs.stat(filePath)

      if (stat.isDirectory()) {
        await readInfos(
          filePath,
          uuidMap,
          exercicesNonInteractifs,
          refToUuid,
          exercicesShuffled,
          codePays,
          exercicesNonClasses,
          refMap,
        )
      } else if (stat.isFile()) {
        // Check if it's a .js or .ts file, and exclude certain files
        if (
          file.match(/\.jsx?|\.ts$/) &&
          !file.startsWith('_') &&
          !file.endsWith('.test.ts') &&
          file !== 'deprecatedExercice.js' &&
          file !== 'MetaExerciceCan.ts' &&
          !file.startsWith('Exercice') &&
          file !== 'exerciseMethods.ts'
        ) {
          const infos = {}
          const data = await fs.readFile(filePath, 'utf8')
          if (data.includes('console.log(')) {
            console.error(
              '\x1b[34m%s\x1b[0m',
              `console.log trouvé dans ${filePath}`,
            )
          }
          // const matchUuid = data.match(/export const uuid = '(.*)'/) // EE : Cet ancien code ne gérait pas si un commentaire avec apostrophe suivant uuid.
          const matchUuid = data.match(/export const uuid\s*=\s*'([^']*)'/)
          infos.url = filePath.replace('src/exercices/', '')
          infos.tags = []
          if (matchUuid) {
            if (uuidMap.has(matchUuid[1])) {
              console.error(
                '\x1b[31m%s\x1b[0m',
                `${codePays}: uuid ${matchUuid[1]} en doublon  dans ${filePath} et ${uuidMap.get(matchUuid[1])}`,
              )
            }
            uuidMap.set(matchUuid[1], filePath.replace('src/exercices/', ''))
            infos.uuid = matchUuid[1]
          } else {
            // Pas d'erreur pour les fichiers beta
            if (!filePath.includes('/beta/')) {
              console.error(
                '\x1b[31m%s\x1b[0m',
                `${codePays}: uuid non trouvé dans ${filePath}`,
              )
            }
          }
          // const matchRefFR = data.match(/export const ref = '(.*)'/)
          // if (matchRefFR) {
          //   infos.idFR = matchRefFR[1]
          // } else {{2}
          //   if (!filePath.includes('beta') &{2}
          //     !filePath.includes('/apps/' {2}&&
          //     !filePath.includes('/ressources/')
          //   ) {
          //     console.error('\x1b[31m%s\x1b[0m', `ref non trouvé dans ${filePath}`)
          //   }
          // }
          // Extract refs if present
          const matchRef = data.match(
            new RegExp(
              `export const refs = {[^]*'${codePays}': \\[([^\\]]*)\\]`,
            ),
          )
          if (matchRef) {
            const refsArray = matchRef[1]
              .split(',')
              .map((ref) => ref.trim().replace(/'/g, ''))
              .filter((ref) => ref !== '')

            // Skip exercises marked as NR (non relevant) for CH
            if (
              codePays === 'fr-ch' &&
              refsArray.length === 1 &&
              refsArray[0] === 'NR'
            ) {
              // Do nothing - completely ignore this exercise
              return
            }

            if (refsArray.length === 0) {
              // Empty refs array: add to exercicesNonClasses for CH
              // Only add if UUID is non-empty string
              if (codePays === 'fr-ch' && infos.uuid && infos.uuid !== '') {
                // Process the exercise to extract all metadata
                const dataWithoutComments = data.replace(
                  /\/\/.*|\/\*[\s\S]*?\*\//g,
                  '',
                )
                const matchTitre =
                  dataWithoutComments.match(
                    /^export\s+(?:const|let)\s*titre\s*=\s*'((?:[^\\]\\'|[^'])*)'\s*$/ims,
                  ) ||
                  dataWithoutComments.match(
                    /^export\s+(?:const|let)\s*titre\s*=\s*"((?:[^\\]\\"|[^"])*)"\s*$/ims,
                  ) ||
                  dataWithoutComments.match(
                    /^export\s+(?:const|let)\s*titre\s*=\s*`((?:[^\\]\\`|[^`])*)`\s*$/ims,
                  )
                if (matchTitre) {
                  infos.titre = matchTitre[1]
                    .replaceAll("\\'", "'")
                    .replaceAll('\\\\', '\\')
                }
                const matchDate = data.match(
                  /export const dateDePublication = '([^']*)'/,
                )
                if (matchDate) {
                  infos.datePublication = matchDate[1]
                }
                const matchDateModif = data.match(
                  /export const dateDeModifImportante = '([^']*)'/,
                )
                if (matchDateModif) {
                  infos.dateModification = matchDateModif[1]
                }
                const matchEgaliteFillesGarcons = data.match(
                  /export const egaliteFillesGarcons = (.*)/,
                )
                if (
                  matchEgaliteFillesGarcons &&
                  matchEgaliteFillesGarcons[1].trim() === 'true'
                ) {
                  infos.egaliteFillesGarcons = true
                }
                infos.features = {}
                const matchInteractif = data.match(
                  /export const interactifReady = (.*)/,
                )
                const matchInteractifType = data.match(
                  /export const interactifType = (.*)/,
                )
                if (matchInteractif && matchInteractif[1] === 'true') {
                  infos.features.interactif = {
                    isActive: true,
                    type: matchInteractifType?.[1] || '',
                  }
                } else {
                  infos.features.interactif = {
                    isActive: false,
                    type: '',
                  }
                  exercicesNonInteractifs.push(filePath)
                }
                const matchAleatoire = data.match(
                  /this\.pasDeVersionAleatoire\s*=\s*true/,
                )
                infos.features.aleatoire = {
                  isActive: !matchAleatoire,
                  type: '',
                }
                const matchAmcType = data.match(/export const amcType = '(.*)'/)
                if (matchAmcType) {
                  infos.features.amc = {
                    isActive: true,
                    type: matchAmcType[1] || '',
                  }
                } else {
                  infos.features.amc = {
                    isActive: false,
                    type: '',
                  }
                }
                infos.typeExercice = 'alea'
                infos.id = infos.uuid
                // Add to the non-classified exercises
                exercicesNonClasses[infos.uuid] = { ...infos }
                exercicesShuffled[infos.uuid] = { ...infos }
                refToUuid[infos.uuid] = infos.uuid
              }
            } else {
              refsArray.forEach((ref) => {
                // const newInfos = { ...infos, id: ref }
                if (matchRef) {
                  infos.id = ref // matchRef[1]
                }
                /*
                  On essaye de trouver le titre par regex.
                  Cela ne fonctionnera pas dans les cas suivants :
                  - si le titre utilise ` ET ${}
                  - si le titre somme des strings (ex : 'Titre' + 'suite')
                */
                // EE : Rajout de la ligne suivante pour permettre de mettre des commentaires sur la ligne de titre sans gêner la gestion du menu.
                const dataWithoutComments = data.replace(
                  /\/\/.*|\/\*[\s\S]*?\*\//g,
                  '',
                )
                const matchTitre =
                  dataWithoutComments.match(
                    /^export\s+(?:const|let)\s*titre\s*=\s*'((?:[^\\]\\'|[^'])*)'\s*$/ims,
                  ) ||
                  dataWithoutComments.match(
                    /^export\s+(?:const|let)\s*titre\s*=\s*"((?:[^\\]\\"|[^"])*)"\s*$/ims,
                  ) ||
                  dataWithoutComments.match(
                    /^export\s+(?:const|let)\s*titre\s*=\s*`((?:[^\\]\\`|[^`])*)`\s*$/ims,
                  )
                if (matchTitre) {
                  // ToDo : Est-ce qu'il y a d'autres caractères spéciaux à gérer que l'apostrophe ?
                  infos.titre = matchTitre[1]
                    .replaceAll("\\'", "'")
                    .replaceAll('\\\\', '\\')
                } else {
                  console.error(
                    '\x1b[31m%s\x1b[0m',
                    `${codePays}: titre non trouvé dans ${filePath}`,
                  )
                }
                const matchDate = data.match(
                  /export const dateDePublication = '([^']*)'/,
                )
                if (matchDate) {
                  infos.datePublication = matchDate[1]
                }
                const matchDateModif = data.match(
                  /export const dateDeModifImportante = '([^']*)'/,
                )
                if (matchDateModif) {
                  infos.dateModification = matchDateModif[1]
                }
                const matchEgaliteFillesGarcons = data.match(
                  /export const egaliteFillesGarcons = (.*)/,
                )
                if (
                  matchEgaliteFillesGarcons &&
                  matchEgaliteFillesGarcons[1].trim() === 'true'
                ) {
                  infos.egaliteFillesGarcons = true
                }
                infos.features = {}
                const matchInteractif = data.match(
                  /export const interactifReady = (.*)/,
                )
                const matchInteractifType = data.match(
                  /export const interactifType = (.*)/,
                )
                if (matchInteractif && matchInteractif[1] === 'true') {
                  infos.features.interactif = {
                    isActive: true,
                    type: matchInteractifType?.[1] || '',
                  }
                } else {
                  infos.features.interactif = {
                    isActive: false,
                    type: '',
                  }
                  exercicesNonInteractifs.push(filePath)
                }
                const matchAleatoire = data.match(
                  /this\.pasDeVersionAleatoire\s*=\s*true/,
                )
                infos.features.aleatoire = {
                  isActive: !matchAleatoire,
                  type: '',
                }
                const matchAmcType = data.match(/export const amcType = '(.*)'/)
                if (matchAmcType) {
                  infos.features.amc = {
                    isActive: true,
                    type: matchAmcType[1] || '',
                  }
                } else {
                  infos.features.amc = {
                    isActive: false,
                    type: '',
                  }
                }
                const matchQcm = data.match(
                  /(= propositionsQcm\()|(extends ExerciceQcm)/,
                )
                if (matchQcm) {
                  if (matchQcm[0] === 'extends ExerciceQcm') {
                    infos.features.qcm = {
                      isActive: true,
                      type: '',
                    }
                    // Regex pour capturer le contenu de this.reponses
                    const arrayRegex =
                      /this\.reponses\s*=\s*\[\s*((["'`][^"'`]*["'`]|[^,\s]+)(\s*,\s*(["'`][^"'`]*["'`]|[^,\s]+))*(\s*\/\/[^\n]*)?\s*)\]/s
                    const arrayMatch = arrayRegex.exec(data)

                    if (arrayMatch) {
                      const arrayContent = arrayMatch[1]
                      // Regex pour compter les éléments dans l'array
                      const elementRegex =
                        /(["'`][^"'`]*["'`]|[^,\s]+)(\s*\/\/[^\n]*)?/g
                      const elements = arrayContent.match(elementRegex)
                      const count = elements ? elements.length : 0
                      if (count < 5 && count > 1) {
                        infos.features.qcmcam = {
                          isActive: true,
                          type: '',
                        }
                      }
                    }
                  } else {
                    const objectRegex =
                      /this\.autoCorrection\[\w+\]\s*=\s*\{[^}]*propositions\s*:\s*\[([^\]]*)\][^}]*\}/g
                    const objectMatch = objectRegex.exec(data)

                    if (objectMatch) {
                      infos.features.qcm = {
                        isActive: true,
                        type: '',
                      }
                      const propositionsContent = objectMatch[1]
                      // Regex pour compter les éléments de propositions à l'intérieur de l'objet capturé
                      const propositionRegex =
                        /\{\s*texte:\s*.*?,\s*statut:\s*.*?\s*\}/g
                      const matchPropositions =
                        propositionsContent.match(propositionRegex)
                      const count = matchPropositions
                        ? matchPropositions.length
                        : 0
                      if (count < 5 && count > 1) {
                        infos.features.qcmcam = {
                          isActive: true,
                          type: '',
                        }
                      }
                    }
                  }
                }
                const versionQcmRegex = /versionQcm(Disponible)*\s*=\s*true/
                const versionQcmMatch = versionQcmRegex.exec(data)
                if (versionQcmMatch) {
                  infos.features.qcm = {
                    isActive: true,
                    type: '',
                  }
                }
                infos.typeExercice = 'alea'
                if (infos.id !== undefined) {
                  if (refMap.has(infos.id)) {
                    console.error(
                      '\x1b[31m%s\x1b[0m',
                      `${codePays}: ref ${infos.id} en doublon dans ${filePath} et ${refMap.get(infos.id)}`,
                    )
                  }
                  refMap.set(infos.id, filePath.replace('src/exercices/', ''))
                  exercicesShuffled[infos.id] = { ...infos }
                  refToUuid[infos.id] = infos.uuid
                }
              })
            }
          } else {
            if (
              !filePath.includes('beta') &&
              !filePath.includes('/apps/') &&
              !filePath.includes('a-2024') &&
              !filePath.includes('/ressources/')
            ) {
              console.error(
                '\x1b[31m%s\x1b[0m',
                `${codePays}: ref non trouvé dans ${filePath}`,
              )
            }
          }
        }
      }
    }),
  )
}

// ToDo : automatiser la lecture de exercicesInteractifs
function handleExerciceSvelte(uuidToUrl) {
  uuidToUrl.spline = 'OutilSpline.svelte'
  uuidToUrl.clavier = 'ClavierTest.svelte'
  uuidToUrl.version = 'Version.svelte'
  uuidToUrl.equation = 'EquationSolve.svelte'
  uuidToUrl.outilScratch = 'OutilScratch.svelte'
  return uuidToUrl
}

const createFiles = (
  referentiel,
  uuidMap,
  exercicesShuffled,
  exercicesNonInteractifs,
  refToUuid,
  codePays,
  exercicesNonClasses = {},
) => {
  function findThemes(obj, path) {
    for (const key in obj) {
      const subObj = obj[key]
      const subPath = path.concat(key)
      if (Object.keys(subObj).length === 0) {
        themesPath.push(subPath.join('.'))
      } else {
        findThemes(subObj, subPath)
      }
    }
  }
  const themesPath = []
  findThemes(referentiel, [])
  let uuidToUrl = Array.from(uuidMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .reduce((obj, [uuid, filePath]) => {
      obj[uuid] = filePath
      return obj
    }, {})
  // Sort exercices by keys
  const exercices = Object.keys(exercicesShuffled)
    .sort()
    .reduce((obj, key) => {
      obj[key] = exercicesShuffled[key]
      return obj
    }, {})
  fs.writeFile(
    'src/json/exercices' + codePays + '.json',
    JSON.stringify(exercices, null, 2),
  )
  fs.writeFile(
    'src/json/exercicesNonInteractifs' + codePays + '.json',
    JSON.stringify(exercicesNonInteractifs.sort(), null, 2),
  )
  uuidToUrl = handleExerciceSvelte(uuidToUrl)
  fs.writeFile(
    'src/json/uuidsToUrl' + codePays + '.json',
    JSON.stringify(uuidToUrl, null, 2),
  )
  fs.writeFile(
    'src/json/refToUuid' + codePays + '.json',
    JSON.stringify(refToUuid, null, 2),
  )
  for (const themePath of themesPath) {
    const theme = themePath.split('.').pop()
    for (const key in exercices) {
      if (key.startsWith(theme)) {
        const keys = themePath.split('.')
        let currentObj = referentiel
        for (let i = 0; i < keys.length; i++) {
          if (i < keys.length - 1) {
            if (currentObj[keys[i]] === undefined) {
              currentObj[keys[i]] = {}
            }
            currentObj = currentObj[keys[i]]
          } else {
            currentObj[keys[i]][key] = exercices[key]
          }
        }
      }
    }
  }
  // Exercices placés directement sous leur niveau parent (sans conteneur intermédiaire), en premier
  if (codePays === 'FR' && referentiel['1e']?.['1A'] && exercices['1A']) {
    referentiel['1e']['1A'] = {
      '1A': exercices['1A'],
      ...referentiel['1e']['1A'],
    }
  }
  if (codePays === 'FR' && referentiel['3e']?.['3Auto'] && exercices['3A']) {
    referentiel['3e']['3Auto'] = {
      '3A': exercices['3A'],
      ...referentiel['3e']['3Auto'],
    }
  }
  if (codePays === 'FR') {
    fs.writeFile(
      'src/json/referentielGeometrieDynamique.json',
      JSON.stringify(referentiel['Géométrie dynamique'], null, 2),
    )
    delete referentiel['Géométrie dynamique']
  }
  // Add non-classified exercises for CH
  if (codePays === 'CH' && Object.keys(exercicesNonClasses).length > 0) {
    if (!referentiel['Non classés']) {
      referentiel['Non classés'] = {}
    }
    if (!referentiel['Non classés']['divers']) {
      referentiel['Non classés']['divers'] = {}
    }
    referentiel['Non classés']['divers'] = exercicesNonClasses
  }
  sortQcmInReferentiel(referentiel, codePays)
  fs.writeFile(
    'src/json/referentiel2022' + codePays + '.json',
    JSON.stringify(referentiel, null, 2).replaceAll('"c3"', '"CM1/CM2"'),
  )
}

function sortQcmInReferentiel(referentiel, codePays) {
  /**
   * Seulement pour le référentiel français
   * On suppose que le référentiel est de la forme level > theme > exercice ou levelFamily > level > theme > exercice
   * On ne gère donc pas le référentiel CAN
   * Si un exercice a un id qui contient 'QCM', on le déplace dans le sous-thème QCM
   */
  if (codePays !== 'FR') {
    return
  }
  for (const level in referentiel) {
    if (level === 'CAN') continue
    for (const theme in referentiel[level]) {
      for (const exercice in referentiel[level][theme]) {
        if (
          referentiel[level][theme][exercice]?.id &&
          referentiel[level][theme][exercice]?.id.includes('QCM')
        ) {
          const exerciceQcm = referentiel[level][theme][exercice]
          if (referentiel[level][theme].QCM === undefined) {
            referentiel[level][theme].QCM = {}
          }
          referentiel[level][theme].QCM[exerciceQcm.id] = { ...exerciceQcm }
          delete referentiel[level][theme][exercice]
        }
      }
    }
  }
  for (const levelFamily in referentiel) {
    if (levelFamily !== 'Terminale') continue
    for (const level in referentiel[levelFamily]) {
      for (const theme in referentiel[levelFamily][level]) {
        for (const exercice in referentiel[levelFamily][level][theme]) {
          if (
            referentiel[levelFamily][level][theme][exercice]?.id &&
            referentiel[levelFamily][level][theme][exercice]?.id.includes('QCM')
          ) {
            const exerciceQcm = referentiel[levelFamily][level][theme][exercice]
            if (referentiel[levelFamily][level][theme].QCM === undefined) {
              referentiel[levelFamily][level][theme].QCM = {}
            }
            referentiel[levelFamily][level][theme].QCM[exerciceQcm.id] = {
              ...exerciceQcm,
            }
            delete referentiel[levelFamily][level][theme][exercice]
          }
        }
      }
    }
  }
}

/**
 * Début du programme principal
 */

/**
 * On utilise emptyRef2022 pour initialiser referentiel2022 avec les niveaux et les catégories
 * En cas de création de niveau ou de chapitre, il faudra mettre à jour ce fichier
 */
const emptyRefCH = readFileSync('tasks/emptyRefCH.json')
const referentielCH = JSON.parse(emptyRefCH)

const emptyRef2022 = readFileSync('tasks/emptyRef2022.json')
const referentiel2022 = JSON.parse(emptyRef2022)

const exercicesDir = './src/exercices'

const uuidMapCH = new Map()
const exercicesNonInteractifsCH = []
const exercicesShuffledCH = {}
const refToUuidCH = {}
const exercicesNonClassesCH = {}
readInfos(
  exercicesDir,
  uuidMapCH,
  exercicesNonInteractifsCH,
  refToUuidCH,
  exercicesShuffledCH,
  'fr-ch',
  exercicesNonClassesCH,
)
  .then(() => {
    createFiles(
      referentielCH,
      uuidMapCH,
      exercicesShuffledCH,
      exercicesNonInteractifsCH,
      refToUuidCH,
      'CH',
      exercicesNonClassesCH,
    )
  })
  .then(() => {
    console.log('CH: uuidsToUrl et referentiel ont été mis à jour')
  })
  .catch((err) => {
    console.error(err)
  })

const uuidMapFR = new Map()
const exercicesNonInteractifsFR = []
const exercicesShuffledFR = {}
const refToUuidFR = {}

readInfos(
  exercicesDir,
  uuidMapFR,
  exercicesNonInteractifsFR,
  refToUuidFR,
  exercicesShuffledFR,
  'fr-fr',
)
  .then(() => {
    createFiles(
      referentiel2022,
      uuidMapFR,
      exercicesShuffledFR,
      exercicesNonInteractifsFR,
      refToUuidFR,
      'FR',
    )
  })
  .then(() => {
    console.log(
      'FR: uuidsToUrl, referentiel et referentielGeometrieDynamique ont été mis à jour',
    )
  })
  .catch((err) => {
    console.error(err)
  })
/**
 * Crée une Uuid de 5 caractères hexadécimaux (1M de possibilités)
 * @returns {string}
 */
function createUuid() {
  let dt = new Date().getTime()
  const uuid = 'xxxxx'.replace(/[xy]/g, (c) => {
    const r = ((dt + Math.random() * 16) % 16) | 0
    dt = Math.floor(dt / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}
// On choisit comme point de comparaison la liste de UUID francais
let uuid = createUuid()
while (uuidMapFR.has(uuid)) {
  uuid = createUuid()
}
console.log('Le nouvel uuid généré est :', uuid)
console.log(
  'Vous pouvez maintenant ajouter la ligne suivante au nouvel exercice :',
)
console.log(`export const uuid = '${uuid}'`)
