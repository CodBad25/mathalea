import ExternalApp from './_ExternalApp'

export const uuid = 'duduLabydiv'
export const titre = 'Résoudre un labyrinthe de multiples'

class duduLabydiv extends ExternalApp {
  constructor() {
    super('https://mathix.org/labydiv2/index.html?suivi=1&mathalea=1')
  }
}

export default duduLabydiv
