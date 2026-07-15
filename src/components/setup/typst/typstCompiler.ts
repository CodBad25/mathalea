import {
  $typst,
  FetchPackageRegistry,
  MemoryAccessModel,
  initOptions,
  preloadRemoteFonts,
} from '@myriaddreamin/typst.ts'
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url'

/**
 * Polices libres (OFL, Google Fonts) servies par MathALÉA et chargées dans
 * le compilateur pour que le choix de police fonctionne dans l'aperçu et le
 * PDF (le compilateur WASM n'embarque que Libertinus/New Computer Modern).
 * Les fichiers sont dans `public/fonts/typst/`.
 */
const TYPST_FONT_FILES = [
  'NotoSans.ttf',
  'NotoSerif.ttf',
  'Lora.ttf',
  'SourceSans3.ttf',
  'Luciole.ttf',
  'Ubuntu.ttf',
  'OpenDyslexic.otf',
  'NotoSansMath.ttf',
  'STIXTwoMath.ttf',
  'LibertinusMath.otf',
]
const TYPST_FONT_URLS = TYPST_FONT_FILES.map(
  (file) => `${import.meta.env.BASE_URL}fonts/typst/${file}`,
)

/**
 * Compilation Typst dans le navigateur via typst.ts (WASM).
 * Le compilateur (~27 Mo) et les polices (~7 Mo) sont chargés à la première
 * compilation puis réutilisés tout au long de la session.
 */

const MAIN_FILE = '/main.typ'
/**
 * Cache persistant (survit aux rechargements de page) des gros fichiers.
 * Le suffixe de version invalide le cache existant des utilisateurs quand le
 * contenu d'une URL déjà en cache change (ex : polices variables remplacées
 * par des instances statiques, non détecté sinon puisque l'URL est stable).
 */
const ASSET_CACHE = 'typst-assets-v2'

/**
 * Récupère un fichier depuis le Cache API (téléchargé une seule fois, même
 * après un rechargement de page), avec repli sur un fetch réseau simple.
 * Les URL du WASM sont hashées par Vite : changer de version invalide
 * naturellement l'entrée de cache.
 */
export async function cachedBytes(url: string): Promise<Uint8Array> {
  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(ASSET_CACHE)
      let response = await cache.match(url)
      if (response == null) {
        const network = await fetch(url)
        if (network.ok) await cache.put(url, network.clone())
        response = network
      }
      return new Uint8Array(await response.arrayBuffer())
    }
  } catch {
    // Cache API indisponible/pleine : on retombe sur un fetch normal
  }
  return new Uint8Array(await (await fetch(url)).arrayBuffer())
}

/**
 * Octets des images d'exercices statiques (annales scannées), par chemin
 * virtuel (`mapShadow`). Renseigné par `Typst.svelte` une fois les images
 * récupérées ; appliqué au compilateur juste avant chaque compilation, ce qui
 * couvre aussi bien l'aperçu (SVG) que l'export PDF.
 */
let staticImageBytes: Map<string, Uint8Array> = new Map()

/** Renseigne le registre des images d'exercices statiques (voir `staticImageBytes`) */
export function setStaticImageBytes(bytes: Map<string, Uint8Array>): void {
  staticImageBytes = bytes
}

/** Charge les images d'exercices statiques dans le système de fichiers virtuel du compilateur */
async function mapStaticImages(): Promise<void> {
  if (staticImageBytes.size === 0) return
  const compiler = await $typst.getCompiler()
  for (const [path, bytes] of staticImageBytes) {
    compiler.mapShadow(path, bytes)
  }
}

/** Initialisation unique par session (mémorisée par la promesse) */
let initPromise: Promise<void> | null = null

function ensureInitialized(): Promise<void> {
  if (initPromise != null) return initPromise
  initPromise = (async () => {
    // polices chargées depuis le cache ; une police manquante est ignorée
    // plutôt que de casser toute la compilation
    const fonts = (
      await Promise.all(
        TYPST_FONT_URLS.map((url) => cachedBytes(url).catch(() => null)),
      )
    ).filter((bytes): bytes is Uint8Array => bytes != null)

    $typst.setCompilerInitOptions({
      getModule: () => cachedBytes(compilerWasmUrl),
      beforeBuild: [preloadRemoteFonts(fonts)],
    })
    $typst.setRendererInitOptions({
      getModule: () => cachedBytes(rendererWasmUrl),
    })
    // Autorise l'import des paquets `@preview` (ex : taskize pour les QCM)
    // depuis packages.typst.org, mis en cache après le premier téléchargement.
    const accessModel = new MemoryAccessModel()
    $typst.use({
      key: 'package-registry$fetch',
      forRoles: ['compiler'],
      provides: [
        initOptions.withAccessModel(accessModel),
        initOptions.withPackageRegistry(new FetchPackageRegistry(accessModel)),
      ],
    })
  })()
  return initPromise
}

/**
 * Indique si le compilateur est déjà en cache (donc chargé sans nouveau
 * téléchargement). Sert à adapter le message d'attente.
 */
export async function isCompilerCached(): Promise<boolean> {
  try {
    if (typeof caches === 'undefined') return false
    const cache = await caches.open(ASSET_CACHE)
    return (await cache.match(compilerWasmUrl)) != null
  } catch {
    return false
  }
}

/**
 * Repère de la palette de mise en page : position (en pt, depuis le coin
 * haut-gauche de sa page) d'un point d'intérêt du document, publiée par le
 * helper Typst `mathalea-anchor` de `buildTypstDocument`.
 */
export interface TypstAnchor {
  /**
   * `tasks`/`tasks-corr` : liste de questions réglable (énoncé/correction) ;
   * `exo` : début d'un exercice (nombre de questions, suppression) ;
   * `gap` : espace après un exercice ; `header` : bloc de titre de la fiche ;
   * `figure` : figure mathalea2d embarquée (zoom) ;
   * `carte-recto`/`carte-verso` : carte de la vue Flash-cards (taille du texte)
   */
  kind:
    | 'tasks'
    | 'tasks-corr'
    | 'exo'
    | 'gap'
    | 'header'
    | 'figure'
    | 'carte-recto'
    | 'carte-verso'
  /** Numéro de l'exercice concerné (0 = avant le premier exercice), ou de la figure */
  num: number
  page: number
  x: number
  y: number
}

const ANCHOR_KINDS = new Set([
  'tasks',
  'tasks-corr',
  'exo',
  'gap',
  'header',
  'figure',
  'carte-recto',
  'carte-verso',
])

/** Valide et filtre les métadonnées renvoyées par `query(<mathalea-anchor>)` */
function parseAnchors(values: unknown): TypstAnchor[] {
  if (!Array.isArray(values)) return []
  const anchors: TypstAnchor[] = []
  for (const value of values) {
    if (value == null || typeof value !== 'object') continue
    const { kind, num, page, x, y } = value as Record<string, unknown>
    if (
      typeof kind === 'string' &&
      ANCHOR_KINDS.has(kind) &&
      typeof num === 'number' &&
      typeof page === 'number' &&
      typeof x === 'number' &&
      typeof y === 'number'
    ) {
      anchors.push({ kind: kind as TypstAnchor['kind'], num, page, x, y })
    }
  }
  return anchors
}

export interface TypstCompileResult {
  /** Document rendu (toutes les pages) en SVG, si la compilation a abouti */
  svg?: string
  /** Diagnostics (erreurs et avertissements) au format `fichier:ligne:col: message` */
  diagnostics: string[]
  /** Repères de la palette de mise en page (vide si le code n'en émet pas) */
  anchors?: TypstAnchor[]
}

/** Compile la source et rend le document en SVG pour l'aperçu */
export async function compileTypstToSvg(
  source: string,
): Promise<TypstCompileResult> {
  await ensureInitialized()
  await mapStaticImages()
  const compiler = await $typst.getCompiler()
  await compiler.addSource(MAIN_FILE, source)
  // un seul « monde » de compilation : l'artefact SVG et la requête des
  // repères de mise en page partagent le même document compilé
  return await compiler.runWithWorld(
    { mainFilePath: MAIN_FILE },
    async (world) => {
      const compiled = await world.vector({ diagnostics: 'unix' })
      const diagnostics: string[] = (compiled?.diagnostics ?? []).map(
        (diagnostic: unknown) => String(diagnostic),
      )
      if (compiled?.result == null) return { diagnostics }
      const svg = await $typst.svg({ vectorData: compiled.result })
      let anchors: TypstAnchor[] = []
      try {
        anchors = parseAnchors(
          await world.query({ selector: '<mathalea-anchor>', field: 'value' }),
        )
      } catch {
        // document sans repère (code réécrit à la main) : pas de palette
      }
      return { svg, diagnostics, anchors }
    },
  )
}

/** Compile la source en PDF (octets du fichier) */
export async function compileTypstToPdf(
  source: string,
): Promise<Uint8Array | undefined> {
  await ensureInitialized()
  await mapStaticImages()
  return await $typst.pdf({ mainContent: source })
}
