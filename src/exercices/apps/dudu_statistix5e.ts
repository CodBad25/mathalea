import ExternalApp from './_ExternalApp'

export const uuid = 'duduStatistix5e'
export const titre = 'Pratiquer les statistiques (5e)'

class duduStatistix5e extends ExternalApp {
  constructor() {
    super('https://mathix.org/statistix/5e/index.html?suivi=1&mathalea=1')
  }
}

export default duduStatistix5e
