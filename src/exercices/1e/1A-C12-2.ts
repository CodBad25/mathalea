import AutoQ4AGt2026 from '../EAMPremiere/EAM-AGTechno-2026-Q4'

export const uuid = '1c981'
export const refs = {
  'fr-fr': ['1A-C12-2', '2A-C5-2'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Convertir des degrés Celsius en degrés Fahrenheit'
export const dateDePublication = '06/08/2026'

/**
 * @author Jean-Claude Lhote, clone de Stéphane Guyon
 * Clone de EAM-AGTechno-2026-Q4 en version exclusivement aléatoire.
 */
export default class ConvertirCelsiusEnFahrenheit extends AutoQ4AGt2026 {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.versionAleatoire()
  }
}
