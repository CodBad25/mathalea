import ExternalApp from './_ExternalApp'

export const uuid = 'challengeRelatif'
export const titre = 'Relever le challenge des nombres relatifs'

class challengeRelatif extends ExternalApp {
  constructor() {
    super('https://coopmaths.fr/challenge/?mathalea')
  }
}

export default challengeRelatif
