import AutoQ11AGt2026 from '../EAMPremiere/EAM-AGTechno-2026-Q11'
export const uuid = 'aebb5'
export const refs = {
  'fr-fr': ['1A-S01-2', '2A-S1-2'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Interprêter un diagramme circulaire'
export const dateDePublication = '29/06/2026'
/**
 * @author Jean-Claude Lhote
 * Clone de EAM-AGTechno-2026-Q11 version exclusivement aléatoire.
 */
export default class QcmDiagrammeCirculaire extends AutoQ11AGt2026 {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.versionAleatoire()
  }
}
