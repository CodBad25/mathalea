import ExternalApp from './_ExternalApp'

export const uuid = 'duduThpythagore'
export const titre = 'Appliquer le théorème de Pythagore'

class duduThpythagore extends ExternalApp {
  constructor() {
    super('https://mathix.org/thpythagore/index.html?suivi=1&mathalea=1')
  }
}

export default duduThpythagore
