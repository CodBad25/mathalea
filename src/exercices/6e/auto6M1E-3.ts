import ExercicePerimetresEtAires from './_Exercice_perimetres_et_aires'
export const titre = 'Calculer le périmètre de polygones usuels'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

export const dateDePublication = '28/07/2025'

/**
 * @author Eric Elter
 */
export const uuid = '9ff3c'

export const refs = {
  'fr-fr': ['auto6M1E-3'],
  'fr-2016': ['6M10a'],
  'fr-ch': [''],
}

export default class Reglages6M10a extends ExercicePerimetresEtAires {
  constructor() {
    super()
    this.sup = '1-2-3'
    this.exo = 'NoDisk'
    this.besoinFormulaire4CaseACocher = false
    this.besoinFormulaireTexte = [
      'Type de figures',
      'Nombres séparés par des tirets :\n1 : Carré\n2 : Rectangle\n3 : Triangle rectangle\n4 : Mélange',
    ]
    this.sup5 = 1
    this.besoinFormulaire5Numerique = false
  }
}
