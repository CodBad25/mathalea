import ExternalApp from './_ExternalApp'

export const uuid = 'duduStatistix3e'
export const titre = 'Pratiquer les statistiques en 3e'

class duduStatistix3e extends ExternalApp {
  constructor() {
    super('https://mathix.org/statistix/3e/index.html?suivi=1&mathalea=1')
  }
}

export default duduStatistix3e
