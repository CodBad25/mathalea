import { $typst } from '@myriaddreamin/typst.ts'
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url'

/**
 * Compilation Typst dans le navigateur via typst.ts (WASM).
 * Le compilateur (~27 Mo, polices incluses) est chargé à la première
 * compilation puis réutilisé.
 */

const MAIN_FILE = '/main.typ'
let initialized = false

function ensureInitialized() {
  if (initialized) return
  initialized = true
  $typst.setCompilerInitOptions({ getModule: () => compilerWasmUrl })
  $typst.setRendererInitOptions({ getModule: () => rendererWasmUrl })
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
  ensureInitialized()
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
  ensureInitialized()
  return await $typst.pdf({ mainContent: source })
}
