/**
 * Test de stabilité des tirages aléatoires des exercices.
 *
 * Voir documentation/tests/stabilite-exercices.md
 *
 *   pnpm stability:check    vérifie les empreintes
 *   pnpm stability:update   régénère le fichier d'empreintes
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { IExercice } from '../../../../src/lib/types'
import {
  type DeclarationFormulaire,
  type EmpreinteExercice,
  NB_QUESTIONS_EMPREINTE,
  combinaisonsParametres,
  empreinteTirage,
  installeGardeDeBoucle,
  exercicesAControler,
  grainePourUuid,
  partieNombres,
  partieTexte,
  selectionComplete,
} from '../../helpers/empreinteExercice'
import { createSolidesThreeJsMock } from '../../mocks/solidesThreeJs.mock'

beforeAll(() => {
  const proto = SVGElement.prototype as any
  if (!proto.getBBox) {
    proto.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 })
  }
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  if (typeof window.notify !== 'function') {
    window.notify = vi.fn() as unknown as typeof window.notify
  }
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    }),
  })
})

vi.mock('../../../../src/lib/3d/3d_dynamique/Canvas3DElement', () => ({
  ajouteCanvas3d: vi.fn((args) => 'canvas3DElement-mock:' + args.length),
}))

vi.mock('../../../../src/lib/3d/3d_dynamique/solidesThreeJs', () =>
  createSolidesThreeJsMock(),
)

vi.mock('../../../../src/lib/components/version', () => ({
  fetchServerVersion: vi.fn(() => Promise.resolve('1.0.0')),
  checkForServerUpdate: vi.fn(() => Promise.resolve(false)),
}))

vi.mock('../../../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('apigeom', async (original) => {
  const real = await original()
  ;(globalThis as any).APP_VERSION = 'test'
  return real
})

const { mathaleaLoadExerciceFromUuid, mathaleaHandleExerciceSimple } =
  await import('../../../../src/lib/mathalea')

// Doit être installée avant toute génération : elle intercepte les
// réassignations de Math.random faites par seedrandom.
const garde = installeGardeDeBoucle()

const __dirname = dirname(fileURLToPath(import.meta.url))
const RACINE = resolve(__dirname, '../../../..')
const FICHIER_EMPREINTES = resolve(
  RACINE,
  'tests/e2e/tests/stability/empreintes-exercices.json',
)

type Registre = Record<string, EmpreinteExercice>

/** Catalogue uuid -> chemin, généré par `pnpm makeJson`. */
const uuidVersFichier: Record<string, string> = (() => {
  const fichier = resolve(RACINE, 'src/json/uuidsToUrlFR.json')
  try {
    return JSON.parse(readFileSync(fichier, 'utf8'))
  } catch {
    throw new Error(
      `${fichier} est absent ou illisible. Lancer \`pnpm makeJson\` avant le test de stabilité.`,
    )
  }
})()

function chargeRegistre(): Registre {
  try {
    return JSON.parse(readFileSync(FICHIER_EMPREINTES, 'utf8'))
  } catch {
    return {}
  }
}

/** Libellé lisible d'une combinaison : `paramètres par défaut` ou `s=2`. */
function libelle(cle: string): string {
  return cle === '' ? 'paramètres par défaut' : cle
}

/** Charge une instance neuve, prête à générer, ou lève si elle est inutilisable. */
async function chargeExercice(
  uuid: string,
  chemin: string,
): Promise<IExercice> {
  const exercice: IExercice = await mathaleaLoadExerciceFromUuid(uuid)
  if (
    exercice.titre?.startsWith('Erreur -') ||
    exercice.titre?.startsWith("L'exercice n'existe pas")
  ) {
    throw new Error(
      `Exercice ${uuid} (${chemin}) non chargeable dans cet environnement`,
    )
  }
  exercice.uuid = uuid
  exercice.interactif = false
  exercice.numeroExercice = 1
  exercice.nbQuestions =
    exercice.nbQuestionsModifiable === false ? 1 : NB_QUESTIONS_EMPREINTE
  return exercice
}

/** Ce que l'exercice déclare pour `sup`, `sup2` et `sup3`. */
function declarationsFormulaires(
  exercice: IExercice,
): (DeclarationFormulaire | undefined)[] {
  return [
    {
      numerique: exercice.besoinFormulaireNumerique,
      texte: exercice.besoinFormulaireTexte,
      caseACocher: exercice.besoinFormulaireCaseACocher,
    },
    {
      numerique: exercice.besoinFormulaire2Numerique,
      texte: exercice.besoinFormulaire2Texte,
      caseACocher: exercice.besoinFormulaire2CaseACocher,
    },
    {
      numerique: exercice.besoinFormulaire3Numerique,
      texte: exercice.besoinFormulaire3Texte,
      caseACocher: exercice.besoinFormulaire3CaseACocher,
    },
  ] as (DeclarationFormulaire | undefined)[]
}

/**
 * Calcule les empreintes d'un exercice : une graine, une combinaison de
 * paramètres à la fois, nombre de questions imposé, mode non interactif.
 */
async function empreinteDeLExercice(
  uuid: string,
  chemin: string,
): Promise<{ empreinte: EmpreinteExercice; combinaisonsEnEchec: string[] }> {
  const graine = grainePourUuid(uuid)
  const modele = await chargeExercice(uuid, chemin)
  const combinaisons = combinaisonsParametres(declarationsFormulaires(modele), [
    modele.sup,
    modele.sup2,
    modele.sup3,
  ])
  modele.destroy?.()

  const v: Record<string, string> = {}
  const combinaisonsEnEchec: string[] = []
  for (const { cle, valeurs } of combinaisons) {
    // instance neuve à chaque combinaison : aucun état ne fuit d'un tirage à
    // l'autre, exactement comme quand un utilisateur ouvre un lien
    const exercice = await chargeExercice(uuid, chemin)
    exercice.seed = graine
    if (valeurs[0] !== undefined) exercice.sup = valeurs[0]
    if (valeurs[1] !== undefined) exercice.sup2 = valeurs[1]
    if (valeurs[2] !== undefined) exercice.sup3 = valeurs[2]
    garde.demarre()
    try {
      if (exercice.typeExercice === 'simple') {
        mathaleaHandleExerciceSimple(exercice, false)
      } else {
        exercice.nouvelleVersionWrapper()
      }
      v[cle] = empreinteTirage(
        [...(exercice.listeQuestions ?? [])].map(String),
        [...(exercice.listeCorrections ?? [])].map(String),
      )
    } catch (e) {
      // Une combinaison qui plante ne doit pas priver l'exercice de la
      // protection acquise sur les autres : on la laisse de côté et on la
      // signale.
      combinaisonsEnEchec.push(
        `${chemin} (${uuid}) : ${libelle(cle)} : ${(e as Error).message}`,
      )
    } finally {
      garde.arrete()
      exercice.destroy?.()
    }
  }
  return { empreinte: { ex: chemin, v }, combinaisonsEnEchec }
}

const enMiseAJour = process.env.STABILITY_UPDATE === '1'
const registre = chargeRegistre()
const cibles = exercicesAControler(
  Object.entries(uuidVersFichier) as [string, string][],
  process.env,
)
// Une mise à jour complète repart de zéro (les exercices supprimés
// disparaissent du registre) ; une mise à jour filtrée complète l'existant.
const nouveauRegistre: Registre =
  enMiseAJour && !selectionComplete(process.env) ? { ...registre } : {}
const derives: string[] = []
const textesModifies: string[] = []
const nonControles: string[] = []
const combinaisonsDisparues: string[] = []
const combinaisonsEnEchec: string[] = []

/** Empreinte d'un tirage qui n'a produit aucun énoncé. */
const VIDE = empreinteTirage([], [])

describe(`Stabilité des tirages (${cibles.length} exercice(s))`, () => {
  if (cibles.length === 0) {
    it('aucun exercice à contrôler', () => {
      expect(true).toBe(true)
    })
  }
  // Un exercice absent du registre est simplement ignoré, pour ne pas bloquer
  // sur les nouveautés. Sans ce garde-fou, un registre entièrement absent
  // rendrait donc la suite verte tout en ne protégeant plus rien.
  if (!enMiseAJour && cibles.length > 0 && Object.keys(registre).length === 0) {
    it("le fichier d'empreintes est présent", () => {
      expect(
        Object.keys(registre).length,
        `${FICHIER_EMPREINTES} est vide ou absent : le test ne compare rien et ` +
          "ne protège rien.\nLe régénérer avec `pnpm stability:update` et l'ajouter au commit.",
      ).toBeGreaterThan(0)
    })
  }
  for (const [uuid, chemin] of cibles) {
    it(`${chemin} (${uuid})`, async () => {
      let empreinte: EmpreinteExercice
      try {
        const resultat = await empreinteDeLExercice(uuid, chemin)
        empreinte = resultat.empreinte
        combinaisonsEnEchec.push(...resultat.combinaisonsEnEchec)
      } catch (e) {
        // Un exercice qui plante est déjà signalé par les autres suites
        // (console_errors, all_exercises) : on ne le contrôle pas ici, mais on
        // le liste pour ne pas croire à tort qu'il est protégé.
        nonControles.push(`${chemin} (${uuid}) : ${(e as Error).message}`)
        return
      }
      const attendue = registre[uuid]
      const aProduitUnEnonce = Object.values(empreinte.v).some(
        (e) => e !== VIDE,
      )
      if (!aProduitUnEnonce && attendue === undefined) {
        // Ni énoncé produit, ni empreinte de référence : rien à contrôler.
        // Ce sont les « exercices » qui n'en sont pas (apps, ressources).
        nonControles.push(`${chemin} (${uuid}) : aucun énoncé produit`)
        return
      }
      if (enMiseAJour) {
        if (!aProduitUnEnonce) {
          nonControles.push(`${chemin} (${uuid}) : aucun énoncé produit`)
        } else {
          nouveauRegistre[uuid] = empreinte
        }
        return
      }
      if (attendue === undefined) {
        // Nouvel exercice : rien à comparer, il sera ajouté au registre à la
        // prochaine régénération.
        return
      }

      const nombresAttendus: Record<string, string> = {}
      const nombresObtenus: Record<string, string> = {}
      for (const [cle, reference] of Object.entries(attendue.v)) {
        const obtenue = empreinte.v[cle]
        if (obtenue === undefined) {
          // Le paramètre n'existe plus : les liens qui l'utilisaient ne
          // pointent plus sur la même chose, mais il n'y a rien à comparer.
          combinaisonsDisparues.push(`${chemin} (${uuid}) : ${libelle(cle)}`)
          continue
        }
        if (
          partieTexte(obtenue) !== partieTexte(reference) &&
          partieNombres(obtenue) === partieNombres(reference)
        ) {
          textesModifies.push(`${chemin} (${uuid}) : ${libelle(cle)}`)
        }
        if (partieNombres(obtenue) !== partieNombres(reference)) {
          derives.push(`${chemin} (${uuid}) : ${libelle(cle)}`)
        }
        nombresAttendus[cle] = partieNombres(reference)
        nombresObtenus[cle] = partieNombres(obtenue)
      }
      expect(
        nombresObtenus,
        `Les valeurs numériques de l'énoncé de ${chemin} (uuid ${uuid}) ont changé.\n` +
          "Les corrigés déjà partagés par les utilisateurs ne correspondent plus à l'énoncé.\n" +
          'Voir documentation/tests/stabilite-exercices.md',
      ).toEqual(nombresAttendus)
    })
  }
})

/**
 * Sérialise le registre avec une ligne par exercice : une dérive apparaît alors
 * comme une seule ligne modifiée dans le diff de la merge request.
 */
function serialiseRegistre(registreASerialiser: Registre): string {
  const lignes = Object.keys(registreASerialiser)
    .sort((a, b) => a.localeCompare(b))
    .map(
      (uuid) =>
        ` ${JSON.stringify(uuid)}: ${JSON.stringify(registreASerialiser[uuid])}`,
    )
  return `{\n${lignes.join(',\n')}\n}\n`
}

afterAll(() => {
  if (enMiseAJour) {
    writeFileSync(FICHIER_EMPREINTES, serialiseRegistre(nouveauRegistre))
    const nbCombinaisons = Object.values(nouveauRegistre).reduce(
      (total, e) => total + Object.keys(e.v).length,
      0,
    )
    console.log(
      `Empreintes écrites : ${Object.keys(nouveauRegistre).length} exercice(s), ` +
        `${nbCombinaisons} combinaison(s) dans ${FICHIER_EMPREINTES}`,
    )
    // On ne sort pas : les rapports ci-dessous valent aussi — et surtout — pour
    // une régénération, puisqu'ils disent ce qui n'a pas pu être empreinté.
  }
  if (combinaisonsEnEchec.length > 0) {
    console.log(
      `\n⚠️  ${combinaisonsEnEchec.length} combinaison(s) de paramètres n'ont pas pu être générées :\n` +
        `  - ${combinaisonsEnEchec.join('\n  - ')}\n` +
        'Ces réglages sont proposés aux utilisateurs : une génération qui\n' +
        "n'aboutit pas est un bug de l'exercice, à corriger à part.\n",
    )
  }
  if (combinaisonsDisparues.length > 0) {
    console.log(
      `\n⚠️  ${combinaisonsDisparues.length} combinaison(s) de paramètres ont disparu :\n` +
        `  - ${combinaisonsDisparues.join('\n  - ')}\n` +
        "Les liens qui les utilisaient n'affichent plus la même chose.\n",
    )
  }
  if (derives.length > 0) {
    console.log(
      `\n❌ ${derives.length} exercice(s) ne rendent plus les mêmes valeurs :\n` +
        `  - ${derives.join('\n  - ')}\n\n` +
        'Si la dérive est involontaire, remettre les tirages dans leur ordre\n' +
        "d'origine. Si elle est assumée, archiver la version publiée :\n" +
        "  node tasks/archive-exercice.js <chemin de l'exercice>\n" +
        'Détail : documentation/tests/stabilite-exercices.md\n',
    )
  }
  if (textesModifies.length > 0) {
    console.log(
      `\n⚠️  Texte modifié à valeurs numériques constantes (autorisé) :\n  - ${textesModifies.join('\n  - ')}\n`,
    )
  }
  if (nonControles.length > 0) {
    console.log(
      `\nℹ️  ${nonControles.length} exercice(s) non contrôlé(s) :\n  - ${nonControles.join('\n  - ')}\n`,
    )
  }
})
