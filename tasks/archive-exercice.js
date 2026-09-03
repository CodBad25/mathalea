/**
 * Archive la version publiée d'un exercice avant une modification qui change
 * ses tirages aléatoires.
 *
 *   node tasks/archive-exercice.js src/exercices/6e/6N1E.ts
 *
 * Les liens partagés par les utilisateurs (sujets et corrigés) contiennent
 * l'uuid de l'exercice et la graine du tirage. Si une modification décale les
 * tirages, ces liens n'affichent plus le même énoncé et les corrigés déjà
 * distribués deviennent faux.
 *
 * Ce script applique la règle du dépôt :
 *   - la version publiée (celle de HEAD) est recopiée dans `<exercice>-old.ts`,
 *     avec son uuid d'origine et sans référence dans les menus : les anciens
 *     liens continuent de fonctionner ;
 *   - le fichier de travail garde ses références et reçoit un uuid tout neuf :
 *     les nouveaux utilisateurs voient la version corrigée.
 *
 * À lancer avant de committer la modification, puis `pnpm makeJson` et
 * `pnpm stability:update`.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const cheminRelatif = process.argv[2]

if (!cheminRelatif) {
  console.error(
    "Usage : node tasks/archive-exercice.js <chemin de l'exercice>\n" +
      'Exemple : node tasks/archive-exercice.js src/exercices/6e/6N1E.ts',
  )
  process.exit(1)
}

const chemin = cheminRelatif.replace(/\\/g, '/')

if (!/^src\/exercices\/.+\.(ts|js)$/.test(chemin)) {
  console.error(`Chemin inattendu : ${chemin}`)
  console.error("Il faut un fichier d'exercice, sous src/exercices/.")
  process.exit(1)
}

if (/-old\.(ts|js)$/i.test(chemin)) {
  console.error(`${chemin} est déjà une version archivée.`)
  process.exit(1)
}

const extension = path.extname(chemin)
const cheminArchive = chemin.replace(
  new RegExp(`${extension}$`),
  `-old${extension}`,
)

if (fs.existsSync(cheminArchive)) {
  console.error(
    `${cheminArchive} existe déjà. Choisissez un autre suffixe à la main.`,
  )
  process.exit(1)
}

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

/** Suffixe `Old` sur la classe exportée, pour la distinguer dans les traces. */
function renommeClasse(contenu) {
  return contenu.replace(/export default class (\w+)/, (ligne, nom) =>
    nom.endsWith('Old') ? ligne : `export default class ${nom}Old`,
  )
}

const enTete =
  '// Version archivée : conservée pour que les liens (sujets et corrigés)\n' +
  `// déjà partagés avec l'uuid ${uuidPublie} continuent d'afficher les mêmes\n` +
  '// valeurs. Ne plus la modifier : toute correction va dans la version courante.\n'

fs.writeFileSync(
  cheminArchive,
  enTete + renommeClasse(dereference(contenuPublie)),
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
console.log('  3. relire le diff avant de committer')
