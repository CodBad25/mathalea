import ExternalApp from './_ExternalApp'

export const uuid = 'duduLigneBrisee'
export const titre = 'Étudier une ligne brisée'

class duduLigneBrisee extends ExternalApp {
  constructor() {
    super('https://mathix.org/ligne_brisee/index.html?suivi=1&mathalea=1')
  }
}

export default duduLigneBrisee
