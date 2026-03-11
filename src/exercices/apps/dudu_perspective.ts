import ExternalApp from './_ExternalApp'

export const uuid = 'duduPerspective'
export const titre = 'Représenter des solides en perspective'

class duduPerspective extends ExternalApp {
  constructor() {
    super(
      'https://mathix.org/exerciseur-perspective/index.html?suivi=1&mathalea=1',
    )
  }
}

export default duduPerspective
