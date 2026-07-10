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
  'NotoSansMath.ttf',
  'STIXTwoMath.ttf',
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
/** Cache persistant (survit aux rechargements de page) des gros fichiers */
const ASSET_CACHE = 'typst-assets-v1'

/**
 * Récupère un fichier depuis le Cache API (téléchargé une seule fois, même
 * après un rechargement de page), avec repli sur un fetch réseau simple.
 * Les URL du WASM sont hashées par Vite : changer de version invalide
 * naturellement l'entrée de cache.
 */
async function cachedBytes(url: string): Promise<Uint8Array> {
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

export interface TypstCompileResult {
  /** Document rendu (toutes les pages) en SVG, si la compilation a abouti */
  svg?: string
  /** Diagnostics (erreurs et avertissements) au format `fichier:ligne:col: message` */
  diagnostics: string[]
}

/** Compile la source et rend le document en SVG pour l'aperçu */
export async function compileTypstToSvg(
  source: string,
): Promise<TypstCompileResult> {
  await ensureInitialized()
  const compiler = await $typst.getCompiler()
  await compiler.addSource(MAIN_FILE, source)
  const compiled = await compiler.compile({
    mainFilePath: MAIN_FILE,
    diagnostics: 'unix',
  })
  const diagnostics: string[] = (compiled?.diagnostics ?? []).map(
    (diagnostic: unknown) => String(diagnostic),
  )
  if (compiled?.result == null) return { diagnostics }
  const svg = await $typst.svg({ vectorData: compiled.result })
  return { svg, diagnostics }
}

/** Compile la source en PDF (octets du fichier) */
export async function compileTypstToPdf(
  source: string,
): Promise<Uint8Array | undefined> {
  await ensureInitialized()
  return await $typst.pdf({ mainContent: source })
}
