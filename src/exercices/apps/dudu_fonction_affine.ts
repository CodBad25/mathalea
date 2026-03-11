import ExternalApp from './_ExternalApp'

export const uuid = 'duduAffine'
export const titre = 'Étudier les fonctions affines'

class duduAffine extends ExternalApp {
  constructor() {
    super(
      'https://mathix.org/exerciseur_fonction_affine_suivi/index.html?suivi=1&mathalea=1',
    )
  }
}

export default duduAffine
