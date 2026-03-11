import ExternalApp from './_ExternalApp'

export const uuid = 'duduArrondi'
export const titre = 'Trouver un arrondi'

class duduArrondi extends ExternalApp {
  constructor() {
    super('https://mathix.org/arrondi/index.html?suivi=1&mathalea=1')
  }
}

export default duduArrondi
