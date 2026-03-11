import ExternalApp from './_ExternalApp'

export const uuid = 'duduStatistix4e'
export const titre = 'Pratiquer les statistiques en 4e'

class duduStatistix4e extends ExternalApp {
  constructor() {
    super('https://mathix.org/statistix/4e/index.html?suivi=1&mathalea=1')
  }
}

export default duduStatistix4e
