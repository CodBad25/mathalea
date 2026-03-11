import ExternalApp from './_ExternalApp'

export const uuid = 'duduTrigo'
export const titre = 'Utiliser la trigonométrie'

class duduTrigo extends ExternalApp {
  constructor() {
    super('https://mathix.org/trigo/index.html?suivi=1&mathalea=1')
  }
}

export default duduTrigo
