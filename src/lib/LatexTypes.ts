// printPrettier pose problème avec begin{aligned}[t] en ajoutant un saut de ligne problématique
// import { printPrettier } from 'prettier-plugin-latex/standalone.js'
export interface Exo {
  content?: string
  serie?: string
  month?: string
  year?: string
  zone?: string
  title?: string
}

export interface picFile {
  name: string
  format: string
}

export interface LatexFileInfos {
  title: string
  reference: string
  subtitle: string
  dysTailleFontOption: number
  tailleFontOption: number
  durationCanOption: string
  titleOption: string
  style:
    | 'Coopmaths'
    | 'Classique'
    | 'ProfMaquette'
    | 'ProfMaquetteQrcode'
    | 'Can'
  nbVersions: number
  fontOption: 'StandardFont' | 'DysFont'
  correctionOption: 'AvecCorrection' | 'SansCorrection'
  qrcodeOption: 'AvecQrcode' | 'SansQrcode'
  typeFiche: 'Fiche' | 'Eval'
  exos?: {
    [key: string]: {
      labels?: string
      itemsep?: number
      cols?: number
      cols_corr?: number
      blocrep?: { nbligs: number; nbcols: number }
    }
  }
  exosGrouping?: string
  signal?: AbortSignal | undefined
}

export interface contentsType {
  preamble: string
  intro: string
  content: string
  contentCorr: string
}

export interface latexFileType {
  contents: contentsType
  latexWithoutPreamble: string
  latexWithPreamble: string
}
export interface ExoContent {
  content?: string
  contentCorr?: string
  serie?: string
  month?: string
  year?: string
  zone?: string
  title?: string
}
