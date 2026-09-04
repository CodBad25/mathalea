/**
 * Archive la version publiée d'un exercice avant une modification qui change
 * ses tirages aléatoires.
 *
 *   pnpm archive 6N1E
 *   pnpm archive src/exercices/6e/6N1E.ts
 *
 * Les liens partagés par les utilisateurs (sujets et corrigés) contiennent
 * l'uuid de l'exercice et la graine du tirage. Si une modification décale les
 * tirages, ces liens n'affichent plus le même énoncé et les corrigés déjà
 * distribués deviennent faux.
 *
 * Ce script applique la règle du dépôt :
 *   - la version publiée (celle de HEAD) est recopiée dans `<exercice>-old.ts`
 *     (`-old2.ts`, `-old3.ts`… si une archive existe déjà), avec son uuid
 *     d'origine et sans référence dans les menus : les anciens liens
 *     continuent de fonctionner ;
 *   - le fichier de travail garde ses références et reçoit un uuid tout neuf :
 *     les nouveaux utilisateurs voient la version corrigée.
 *
 * À lancer avant de committer la modification, puis `pnpm makeJson` et
 * `pnpm stability:update`.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const argument = process.argv[2]

if (!argument) {
  console.error(
    "Usage : pnpm archive <code ou chemin de l'exercice>\n" +
      'Exemples : pnpm archive 6N1E\n' +
      '           pnpm archive src/exercices/6e/6N1E.ts',
  )
  process.exit(1)
}

/**
 * Retrouve le fichier d'un exercice à partir de son code (ex. `6N1E`) en
 * parcourant `src/exercices/`. Le nom de fichier doit correspondre exactement
 * au code : `6N1E.ts` mais pas `6N1E-2.ts` ni `6N1E-old.ts`.
 */
function chercheParCode(code) {
  const trouves = []
  const parcours = (dossier) => {
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      const complet = path.join(dossier, entree.name)
      if (entree.isDirectory()) parcours(complet)
      else if (entree.name === `${code}.ts` || entree.name === `${code}.js`) {
        trouves.push(complet.replace(/\\/g, '/'))
      }
    }
  }
  parcours('src/exercices')
  return trouves
}

let chemin = argument.replace(/\\/g, '/')

if (!chemin.includes('/')) {
  const trouves = chercheParCode(chemin)
  if (trouves.length === 0) {
    console.error(
      `Aucun exercice nommé « ${chemin} » sous src/exercices/.\n` +
        'Passez le chemin complet du fichier si besoin.',
    )
    process.exit(1)
  }
  if (trouves.length > 1) {
    console.error(
      `Plusieurs fichiers correspondent à « ${chemin} » :\n` +
        trouves.map((f) => `  ${f}`).join('\n') +
        '\nRelancez avec le chemin complet.',
    )
    process.exit(1)
  }
  chemin = trouves[0]
  console.log(`Exercice trouvé : ${chemin}\n`)
}

if (!/^src\/exercices\/.+\.(ts|js)$/.test(chemin)) {
  console.error(`Chemin inattendu : ${chemin}`)
  console.error("Il faut un fichier d'exercice, sous src/exercices/.")
  process.exit(1)
}

if (/-old\d*\.(ts|js)$/i.test(chemin)) {
  console.error(`${chemin} est déjà une version archivée.`)
  process.exit(1)
}

const extension = path.extname(chemin)
const racineChemin = chemin.replace(new RegExp(`${extension}$`), '')

// Première archive : `<exercice>-old.ts`. Si elle existe déjà (exercice
// ré-archivé après une nouvelle dérive), on incrémente : `-old2`, `-old3`…
let numeroArchive = 1
let cheminArchive = `${racineChemin}-old${extension}`
while (fs.existsSync(cheminArchive)) {
  numeroArchive++
  cheminArchive = `${racineChemin}-old${numeroArchive}${extension}`
}
const suffixeClasse = numeroArchive === 1 ? 'Old' : `Old${numeroArchive}`

/** Contenu du fichier tel qu'il est publié, c'est-à-dire celui de HEAD. */
let contenuPublie
try {
  contenuPublie = execFileSync('git', ['show', `HEAD:${chemin}`], {
    encoding: 'utf8',
  })
} catch {
  console.error(
    `Impossible de lire ${chemin} dans HEAD : l'exercice n'a jamais été publié, ` +
      "il n'y a donc pas de lien à préserver.",
  )
  process.exit(1)
}

const contenuTravail = fs.readFileSync(chemin, 'utf8')

if (contenuTravail === contenuPublie) {
  console.warn(
    `⚠️  ${chemin} est identique à sa version publiée : l'archive en sera une ` +
      'copie conforme. À faire seulement si la modification est encore à venir.',
  )
}

const uuidPublie = contenuPublie.match(/export const uuid = '([^']+)'/)?.[1]
if (!uuidPublie) {
  console.error(`Aucun \`export const uuid\` trouvé dans ${chemin}.`)
  process.exit(1)
}

/** Vide les références d'un fichier pour le sortir des menus. */
function dereference(contenu) {
  const bloc = contenu.match(/export const refs = \{[^}]*\}/)
  if (!bloc) {
    console.warn(
      `⚠️  Aucun \`export const refs\` dans ${chemin} : à déréférencer à la main.`,
    )
    return contenu
  }
  const nouveauBloc = bloc[0].replace(
    /'([\w-]+)':\s*\[[^\]]*\]/g,
    // 'NR' fait totalement ignorer l'exercice côté CH, alors qu'un tableau
    // vide le renverrait dans les exercices non classés (cf tasks/updateMenuInternational.js).
    (_, locale) => (locale === 'fr-ch' ? "'fr-ch': ['NR']" : `'${locale}': []`),
  )
  return contenu.replace(bloc[0], nouveauBloc)
}

/** Suffixe `Old` (ou `Old2`, `Old3`…) sur la classe exportée, pour la
 * distinguer dans les traces sans collision entre archives successives. */
function renommeClasse(contenu, suffixe) {
  return contenu.replace(
    /export default class (\w+)/,
    (_, nom) => `export default class ${nom.replace(/Old\d*$/, '')}${suffixe}`,
  )
}

const enTete =
  '// Version archivée : conservée pour que les liens (sujets et corrigés)\n' +
  `// déjà partagés avec l'uuid ${uuidPublie} continuent d'afficher les mêmes\n` +
  '// valeurs. Ne plus la modifier : toute correction va dans la version courante.\n'

fs.writeFileSync(
  cheminArchive,
  enTete + renommeClasse(dereference(contenuPublie), suffixeClasse),
)

/** Génère un uuid de 5 caractères hexadécimaux absent du dépôt. */
function nouvelUuid() {
  const dejaPris = new Set()
  const parcours = (dossier) => {
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      const complet = path.join(dossier, entree.name)
      if (entree.isDirectory()) parcours(complet)
      else if (/\.(ts|js)$/.test(entree.name)) {
        const m = fs
          .readFileSync(complet, 'utf8')
          .match(/export const uuid = '([^']+)'/)
        if (m) dejaPris.add(m[1])
      }
    }
  }
  parcours('src/exercices')
  let candidat
  do {
    let dt = Date.now()
    candidat = 'xxxxx'.replace(/x/g, () => {
      const r = ((dt + Math.random() * 16) % 16) | 0
      dt = Math.floor(dt / 16)
      return r.toString(16)
    })
  } while (dejaPris.has(candidat))
  return candidat
}

const uuidNeuf = nouvelUuid()
const aujourdhui = new Date().toLocaleDateString('fr-FR')

let contenuMisAJour = contenuTravail.replace(
  /export const uuid = '[^']+'/,
  `export const uuid = '${uuidNeuf}'`,
)
contenuMisAJour = contenuMisAJour.includes('export const dateDeModifImportante')
  ? contenuMisAJour.replace(
      /export const dateDeModifImportante = '[^']*'/,
      `export const dateDeModifImportante = '${aujourdhui}'`,
    )
  : contenuMisAJour.replace(
      /export const uuid = '[^']+'/,
      `export const dateDeModifImportante = '${aujourdhui}'\n\nexport const uuid = '${uuidNeuf}'`,
    )

fs.writeFileSync(chemin, contenuMisAJour)

console.log(`✅ ${cheminArchive} créé (uuid ${uuidPublie}, déréférencé)`)
console.log(`✅ ${chemin} a désormais l'uuid ${uuidNeuf}`)
console.log('')
console.log('Étapes suivantes :')
console.log('  1. pnpm makeJson')
console.log('  2. pnpm stability:update')
console.log('  3. pnpm review:archives (vérifier version courante vs archive)')
console.log('  4. relire le diff avant de committer')
