/**
 * Store des banques d'exercices externes ajoutées par l'utilisateur.
 *
 * Une banque est soit une archive zip déposée depuis la machine, soit un dépôt
 * public de forge.apps.education.fr. Dans les deux cas elle contient un
 * `manifest.json` (voir `lib/types/banquesExternes.ts`) et des fichiers `.png`,
 * `.typ` et/ou `.tex`. Les banques installées sont rechargées à chaque démarrage :
 * - les descripteurs sont en localStorage ;
 * - les octets des archives zip sont en IndexedDB (`banquesExternesDb.ts`).
 *
 * @see documentation/utilisation/banques-externes.md
 */
import JSZip from 'jszip'
import { get, writable } from 'svelte/store'
import {
  construireReferentielBanque,
  ManifestInvalideError,
  urlFichierForge,
  uuidBanqueExterne,
  validerManifest,
} from '../components/banquesExternes'
import {
  cleSource,
  sourceDepuisCle,
  type BanqueExterneChargee,
  type BanqueExternePreambule,
  type BanqueExterneManifest,
  type BanqueExterneSource,
} from '../types/banquesExternes'
import type { JSONReferentielObject } from '../types/referentiels'
import {
  enregistrerArchive,
  lireArchive,
  supprimerArchive,
} from './banquesExternesDb'
import { isLocalStorageAvailable } from './storage'

/** Clé localStorage listant les banques installées */
const CLE_STOCKAGE = 'mathalea-banques-externes'

/** Taille maximale acceptée pour une archive déposée (50 Mo) */
const TAILLE_MAX_ZIP = 50 * 1024 * 1024

/** Banques actuellement chargées, dans l'ordre d'installation */
export const banquesExternes = writable<BanqueExterneChargee[]>([])

/**
 * Clés de banques réclamées par les paramètres `bq` de l'URL d'arrivée. Elles
 * sont mémorisées **avant** le chargement (qui est asynchrone) pour que la
 * réécriture de l'URL, déclenchée dès la lecture des exercices, ne fasse pas
 * disparaître du lien la banque dont ces exercices proviennent.
 */
const clesDemandeesParUrl = writable<string[]>([])

/** URLs `blob:` créées pour les banques zip, à révoquer à la désinstallation */
const blobsParBanque = new Map<string, string[]>()

/**
 * Types MIME donnés aux `blob:` extraits d'une archive : sans eux, un
 * navigateur peut refuser d'afficher l'image dans une balise `<img>`.
 */
const TYPES_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  typ: 'text/plain',
  tex: 'text/plain',
  json: 'application/json',
}

/**
 * Devine le type MIME d'un fichier de la banque d'après son extension.
 * @param {string} chemin chemin du fichier dans la banque
 * @returns {string} type MIME
 */
function typeMime(chemin: string): string {
  const extension = chemin.split('.').pop()?.toLowerCase() ?? ''
  return TYPES_MIME[extension] ?? 'application/octet-stream'
}

/**
 * Lit le contenu texte du préambule déclaré par un manifest (`preambule.tex`
 * et/ou `preambule.typ`), lu une bonne fois pour toutes au chargement de la
 * banque plutôt que retéléchargé à chaque export LaTeX/Typst.
 * @param {BanqueExterneManifest} manifest manifest de la banque
 * @param {(chemin: string) => Promise<string|null>} lireFichier lit le texte
 * d'un chemin relatif à la racine de la banque (`null` si absent/illisible)
 * @returns {Promise<BanqueExternePreambule|undefined>} préambule chargé, ou
 * `undefined` si le manifest n'en déclare pas
 */
async function chargerPreambule(
  manifest: BanqueExterneManifest,
  lireFichier: (chemin: string) => Promise<string | null>,
): Promise<BanqueExternePreambule | undefined> {
  if (manifest.preambule === undefined) return undefined
  const tex =
    manifest.preambule.tex !== undefined
      ? await lireFichier(manifest.preambule.tex)
      : null
  const typ =
    manifest.preambule.typ !== undefined
      ? await lireFichier(manifest.preambule.typ)
      : null
  if (tex === null && typ === null) return undefined
  return {
    tex: tex ?? undefined,
    typ: typ ?? undefined,
  }
}

// ===========================================================================
//
//    Persistance des descripteurs
//
// ===========================================================================

/**
 * Relit la liste des banques installées.
 * @returns {BanqueExterneSource[]} descripteurs enregistrés (vide si aucun)
 */
function lireSourcesInstallees(): BanqueExterneSource[] {
  if (!isLocalStorageAvailable()) return []
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE)
    if (brut === null) return []
    const sources = JSON.parse(brut)
    if (!Array.isArray(sources)) return []
    return sources.filter(
      (source): source is BanqueExterneSource =>
        source !== null &&
        typeof source === 'object' &&
        (source.type === 'zip' || source.type === 'forge') &&
        typeof source.cle === 'string',
    )
  } catch {
    return []
  }
}

/**
 * Enregistre la liste des banques installées.
 * @param {BanqueExterneSource[]} sources descripteurs à conserver
 */
function ecrireSourcesInstallees(sources: BanqueExterneSource[]): void {
  if (!isLocalStorageAvailable()) return
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(sources))
  } catch {
    // quota dépassé : la banque reste utilisable pour cette session
  }
}

// ===========================================================================
//
//    Chargement d'une banque
//
// ===========================================================================

/**
 * Décompresse une archive et en construit une banque chargée. Le descripteur
 * n'est pas connu avant d'avoir lu le manifest (la clé d'une banque zip dérive
 * de l'id déclaré) : c'est l'appelant qui l'assemble à partir du manifest rendu.
 * @param {ArrayBuffer} octets contenu du zip
 * @param {string} nomFichier nom de l'archive, pour l'affichage
 * @returns {Promise<BanqueExterneChargee>} banque prête à être affichée
 * @throws {ManifestInvalideError} si l'archive ne contient pas de manifest valide
 */
async function chargerDepuisZip(
  octets: ArrayBuffer,
  nomFichier?: string,
): Promise<BanqueExterneChargee> {
  let archive: JSZip
  try {
    archive = await JSZip.loadAsync(octets)
  } catch {
    throw new ManifestInvalideError(
      "Le fichier déposé n'est pas une archive zip lisible.",
    )
  }
  // le manifest peut être à la racine du zip ou dans un unique dossier de tête
  // (cas d'une archive téléchargée depuis une forge) : on prend le moins profond
  const cheminsManifest = Object.keys(archive.files).filter(
    (chemin) => chemin === 'manifest.json' || chemin.endsWith('/manifest.json'),
  )
  cheminsManifest.sort((a, b) => a.split('/').length - b.split('/').length)
  if (cheminsManifest.length === 0) {
    throw new ManifestInvalideError(
      "L'archive ne contient pas de fichier `manifest.json`.",
    )
  }
  const cheminManifest = cheminsManifest[0]
  const racine = cheminManifest.slice(
    0,
    cheminManifest.length - 'manifest.json'.length,
  )
  const texteManifest = await archive.files[cheminManifest].async('string')
  let brut: unknown
  try {
    brut = JSON.parse(texteManifest)
  } catch {
    throw new ManifestInvalideError(
      'Le fichier `manifest.json` de la banque n’est pas un JSON valide.',
    )
  }
  const manifest = validerManifest(brut)

  const assets = new Map<string, string>()
  const cheminsUtiles = new Set<string>()
  for (const exercice of manifest.exercices) {
    for (const chemin of [
      exercice.png,
      exercice.pngCor,
      exercice.typ,
      exercice.typCor,
      exercice.tex,
      exercice.texCor,
    ]) {
      if (chemin !== undefined) cheminsUtiles.add(chemin)
    }
  }
  for (const chemin of cheminsUtiles) {
    const entree = archive.files[`${racine}${chemin}`]
    if (entree === undefined || entree.dir) continue
    const contenu = await entree.async('blob')
    assets.set(
      chemin,
      URL.createObjectURL(new Blob([contenu], { type: typeMime(chemin) })),
    )
  }
  const preambuleTexte = await chargerPreambule(manifest, async (chemin) => {
    const entree = archive.files[`${racine}${chemin}`]
    if (entree === undefined || entree.dir) return null
    return await entree.async('string')
  })
  const source: BanqueExterneSource = {
    type: 'zip',
    cle: `zip:${manifest.id}`,
    nomFichier,
  }
  return { source, manifest, assets, preambuleTexte }
}

/**
 * Sous-dossier essayé en repli quand `manifest.json` est absent de la racine
 * déclarée du dépôt : c'est là qu'atterrissent typiquement les fichiers
 * publiés par un dépôt de sources (build généré par une CI, par exemple).
 */
const RACINE_REPLI = 'dist'

/**
 * Ajoute un sous-dossier à la racine (éventuellement vide) d'une source.
 * @param {string|undefined} racine racine actuelle, vide si à la racine du dépôt
 * @param {string} sousDossier sous-dossier à ajouter
 * @returns {string} racine composée
 */
function joindreRacine(
  racine: string | undefined,
  sousDossier: string,
): string {
  return racine ? `${racine.replace(/\/$/, '')}/${sousDossier}` : sousDossier
}

/**
 * Télécharge `manifest.json` à la racine indiquée par la source.
 * @param {BanqueExterneSource} source descripteur de la banque (avec sa racine à essayer)
 * @returns {Promise<string|null>} le texte du fichier, ou `null` s'il est absent à cet endroit (404)
 * @throws {ManifestInvalideError} en cas d'erreur réseau ou de réponse ni 200 ni 404
 */
async function telechargerManifest(
  source: BanqueExterneSource,
): Promise<string | null> {
  const urlManifest = urlFichierForge(source, 'manifest.json')
  let reponse: Response
  try {
    reponse = await window.fetch(urlManifest)
  } catch {
    throw new ManifestInvalideError(
      'Impossible de joindre la forge. Vérifiez votre connexion et l’adresse du dépôt.',
    )
  }
  if (reponse.status === 404) return null
  if (!reponse.ok) {
    throw new ManifestInvalideError(
      `La forge a répondu ${reponse.status} pour ${source.projet}.`,
    )
  }
  return await reponse.text()
}

/**
 * Télécharge le manifest d'un dépôt de la forge et construit la banque. Les
 * fichiers eux-mêmes ne sont pas téléchargés : leurs URLs d'API sont calculées
 * à la volée, le navigateur les récupère au moment de l'affichage.
 *
 * `manifest.json` est cherché à la racine déclarée par `source` puis, s'il y
 * est absent, dans son sous-dossier `dist/` (voir `RACINE_REPLI`) : les
 * assets de la banque sont alors résolus à partir de cette racine effective,
 * mais le descripteur persisté (`source`, donc sa `cle`) garde la racine
 * telle qu'indiquée par l'utilisateur, la détection étant refaite à chaque
 * rechargement.
 * @param {BanqueExterneSource} source descripteur de la banque
 * @returns {Promise<BanqueExterneChargee>} banque prête à être affichée
 * @throws {ManifestInvalideError} si le dépôt est inaccessible ou son manifest invalide
 */
async function chargerDepuisForge(
  source: BanqueExterneSource,
): Promise<BanqueExterneChargee> {
  let sourceEffective = source
  let texteManifest = await telechargerManifest(sourceEffective)
  if (texteManifest === null) {
    sourceEffective = {
      ...source,
      racine: joindreRacine(source.racine, RACINE_REPLI),
    }
    texteManifest = await telechargerManifest(sourceEffective)
  }
  if (texteManifest === null) {
    throw new ManifestInvalideError(
      `Aucun fichier \`manifest.json\` trouvé dans ${source.projet} (branche ${source.ref}), ni à la racine ni dans \`${sourceEffective.racine}\`. Le dépôt doit être public.`,
    )
  }
  let brut: unknown
  try {
    brut = JSON.parse(texteManifest)
  } catch {
    throw new ManifestInvalideError(
      'Le fichier `manifest.json` du dépôt n’est pas un JSON valide.',
    )
  }
  const manifest = validerManifest(brut)
  const assets = new Map<string, string>()
  for (const exercice of manifest.exercices) {
    for (const chemin of [
      exercice.png,
      exercice.pngCor,
      exercice.typ,
      exercice.typCor,
      exercice.tex,
      exercice.texCor,
    ]) {
      if (chemin !== undefined && !assets.has(chemin)) {
        assets.set(chemin, urlFichierForge(sourceEffective, chemin))
      }
    }
  }
  const preambuleTexte = await chargerPreambule(manifest, async (chemin) => {
    try {
      const reponse = await window.fetch(
        urlFichierForge(sourceEffective, chemin),
      )
      if (!reponse.ok) return null
      return await reponse.text()
    } catch {
      return null
    }
  })
  return { source, manifest, assets, preambuleTexte }
}

/**
 * Remplace ou ajoute une banque dans le store, en révoquant au passage les
 * `blob:` d'une éventuelle version précédente de la même banque (réinstallation
 * d'une archive mise à jour) : sans cela, ces URLs resteraient allouées jusqu'à
 * la fermeture de l'onglet.
 * @param {BanqueExterneChargee} banque banque à publier
 */
function publierBanque(banque: BanqueExterneChargee): void {
  const cle = banque.source.cle
  const nouveauxBlobs = [...banque.assets.values()].filter((url) =>
    url.startsWith('blob:'),
  )
  for (const url of blobsParBanque.get(cle) ?? []) {
    if (!nouveauxBlobs.includes(url)) URL.revokeObjectURL(url)
  }
  if (nouveauxBlobs.length > 0) blobsParBanque.set(cle, nouveauxBlobs)
  else blobsParBanque.delete(cle)
  banquesExternes.update((liste) => {
    const index = liste.findIndex((b) => b.source.cle === banque.source.cle)
    if (index === -1) return [...liste, banque]
    const remplacee = [...liste]
    remplacee[index] = banque
    return remplacee
  })
}

// ===========================================================================
//
//    API publique
//
// ===========================================================================

/**
 * Installe une banque à partir d'une archive zip choisie par l'utilisateur.
 * L'archive est conservée en IndexedDB pour être rechargée automatiquement
 * lors des visites suivantes.
 * @param {File} fichier archive déposée
 * @returns {Promise<BanqueExterneChargee>} la banque installée
 * @throws {ManifestInvalideError} si l'archive est inexploitable
 */
export async function ajouterBanqueZip(
  fichier: File,
): Promise<BanqueExterneChargee> {
  if (fichier.size > TAILLE_MAX_ZIP) {
    throw new ManifestInvalideError(
      `L'archive dépasse ${Math.round(TAILLE_MAX_ZIP / (1024 * 1024))} Mo.`,
    )
  }
  const octets = await fichier.arrayBuffer()
  // la clé d'une banque zip dérive de l'id déclaré dans son manifest : une
  // réinstallation de la même banque remplace donc la version précédente
  const banque = await chargerDepuisZip(octets, fichier.name)
  await enregistrerArchive(banque.source.cle, octets)
  const sources = lireSourcesInstallees().filter(
    (s) => s.cle !== banque.source.cle,
  )
  ecrireSourcesInstallees([...sources, banque.source])
  publierBanque(banque)
  return banque
}

/**
 * Installe une banque hébergée sur un dépôt public de la forge.
 * @param {BanqueExterneSource} source source de type `forge`
 * @param {boolean} persister `false` pour une banque venue d'une URL partagée,
 * que l'on ne veut pas ajouter durablement aux banques de l'utilisateur
 * @returns {Promise<BanqueExterneChargee>} la banque installée
 * @throws {ManifestInvalideError} si le dépôt est inaccessible ou son manifest invalide
 */
export async function ajouterBanqueForge(
  source: BanqueExterneSource,
  persister = true,
): Promise<BanqueExterneChargee> {
  const complete: BanqueExterneSource = { ...source, cle: cleSource(source) }
  const banque = await chargerDepuisForge(complete)
  if (persister) {
    const sources = lireSourcesInstallees().filter(
      (s) => s.cle !== complete.cle,
    )
    ecrireSourcesInstallees([...sources, complete])
  }
  publierBanque(banque)
  return banque
}

/**
 * Désinstalle une banque : elle disparaît du menu, de la liste enregistrée et,
 * pour une banque zip, l'archive est effacée d'IndexedDB.
 * @param {string} cle clé de la banque à retirer
 */
export async function supprimerBanque(cle: string): Promise<void> {
  banquesExternes.update((liste) => liste.filter((b) => b.source.cle !== cle))
  for (const url of blobsParBanque.get(cle) ?? []) URL.revokeObjectURL(url)
  blobsParBanque.delete(cle)
  ecrireSourcesInstallees(lireSourcesInstallees().filter((s) => s.cle !== cle))
  if (cle.startsWith('zip:')) {
    try {
      await supprimerArchive(cle)
    } catch {
      // base indisponible : le descripteur a déjà été retiré
    }
  }
}

/**
 * Recharge toutes les banques installées. Une banque devenue illisible (dépôt
 * supprimé, archive effacée du navigateur) est ignorée sans bloquer les autres.
 * @returns {Promise<string[]>} les messages des banques qui n'ont pas pu être rechargées
 */
export async function chargerBanquesInstallees(): Promise<string[]> {
  const erreurs: string[] = []
  for (const source of lireSourcesInstallees()) {
    try {
      if (source.type === 'zip') {
        const octets = await lireArchive(source.cle)
        if (octets === undefined) {
          erreurs.push(
            `L'archive de la banque « ${source.nomFichier ?? source.cle} » n'est plus disponible dans ce navigateur.`,
          )
          continue
        }
        publierBanque(await chargerDepuisZip(octets, source.nomFichier))
      } else {
        publierBanque(await chargerDepuisForge(source))
      }
    } catch (erreur) {
      erreurs.push(erreur instanceof Error ? erreur.message : String(erreur))
    }
  }
  return erreurs
}

/**
 * Relève les paramètres `bq` d'une URL et les mémorise. Synchrone : à appeler
 * au tout début du démarrage, avant que la lecture des exercices ne déclenche
 * la réécriture de l'URL (voir `clesBanquesPartageables`).
 * @param {string} urlString URL à analyser (celle de la page par défaut)
 * @returns {string[]} les clés de banques réclamées par l'URL
 */
function memoriserBanquesDemandees(urlString = window.location.href): string[] {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return []
  }
  const cles = url.searchParams.getAll('bq')
  clesDemandeesParUrl.set(cles)
  return cles
}

/**
 * Charge les banques distantes désignées par les paramètres `bq` d'une URL
 * partagée, sans les ajouter à la liste des banques de l'utilisateur : le
 * destinataire du lien voit les exercices, mais sa propre liste de banques
 * reste inchangée. Une banque déjà installée n'est pas rechargée.
 * @param {string} urlString URL à analyser (celle de la page par défaut)
 * @returns {Promise<string[]>} les messages des banques qui n'ont pas pu être chargées
 */
export async function chargerBanquesDepuisUrl(
  urlString = window.location.href,
): Promise<string[]> {
  const erreurs: string[] = []
  const dejaChargees = new Set(
    get(banquesExternes).map((banque) => banque.source.cle),
  )
  for (const valeur of memoriserBanquesDemandees(urlString)) {
    if (dejaChargees.has(valeur)) continue
    const source = sourceDepuisCle(valeur)
    if (source === null) {
      erreurs.push(
        `Référence de banque non reconnue dans le lien : « ${valeur} ».`,
      )
      continue
    }
    try {
      await ajouterBanqueForge(source, false)
    } catch (erreur) {
      erreurs.push(erreur instanceof Error ? erreur.message : String(erreur))
    }
  }
  return erreurs
}

/**
 * Assemble les référentiels de toutes les banques chargées, pour fusion dans
 * « Ressources partenaires » et pour la résolution des uuid `bq-…`.
 * @returns {JSONReferentielObject} référentiel des banques externes (vide si aucune)
 */
export function referentielBanquesExternes(): JSONReferentielObject {
  const referentiel: JSONReferentielObject = {}
  for (const banque of get(banquesExternes)) {
    Object.assign(
      referentiel,
      construireReferentielBanque(banque.manifest, (chemin) =>
        banque.assets.get(chemin),
      ),
    )
  }
  return referentiel
}

/**
 * Donne le préambule (code LaTeX/Typst) déclaré par une banque externe
 * chargée, pour l'insérer dans le document généré quand un de ses exercices
 * est utilisé.
 * @param {string} idBanque id de la banque (`manifest.id`)
 * @returns {BanqueExternePreambule|undefined} préambule chargé, ou `undefined`
 * si la banque n'est pas chargée ou n'en déclare pas
 */
export function preambuleBanque(
  idBanque: string,
): BanqueExternePreambule | undefined {
  return get(banquesExternes).find((banque) => banque.manifest.id === idBanque)
    ?.preambuleTexte
}

/**
 * Liste les clés de banques distantes à faire figurer dans l'URL pour que les
 * uuid donnés y soient résolubles : celles des banques de forge chargées qui
 * fournissent l'un de ces uuid, plus celles réclamées par l'URL d'arrivée dont
 * le chargement est encore en cours ou a échoué. Une banque zip est locale à la
 * machine, elle n'est jamais référençable dans un lien.
 * @param {string[]} uuids uuid des exercices sélectionnés
 * @returns {string[]} clés à placer dans les paramètres `bq` de l'URL
 */
export function clesBanquesPartageables(uuids: string[]): string[] {
  const recherches = new Set(uuids)
  const cles: string[] = []
  for (const banque of get(banquesExternes)) {
    if (banque.source.type !== 'forge') continue
    const fournitUnExercice = banque.manifest.exercices.some((exercice) =>
      recherches.has(uuidBanqueExterne(banque.manifest.id, exercice.id)),
    )
    if (fournitUnExercice) cles.push(banque.source.cle)
  }
  // une banque annoncée par le lien mais pas (encore) chargée doit rester dans
  // l'URL : sans cela, le lien perdrait la provenance de ses propres exercices
  for (const cle of get(clesDemandeesParUrl)) {
    if (!cles.includes(cle)) cles.push(cle)
  }
  return cles
}
