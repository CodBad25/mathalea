import ExternalApp from './_ExternalApp'

export const uuid = 'parallelogramme'
export const titre = 'Étudier les propriétés du parallélogramme'

class parallelogramme extends ExternalApp {
  constructor() {
    super('https://degrangem.forge.apps.education.fr/Parallelogramme')
  }
}

export default parallelogramme
