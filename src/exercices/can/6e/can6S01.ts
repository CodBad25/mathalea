import { traceBarreHorizontale } from '../../../lib/2d/diagrammes'
import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { repere } from '../../../lib/2d/reperes'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { prenom } from '../../../lib/outils/Personne'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Lire un diagramme en barres'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '1957a'

export const refs = {
  'fr-fr': ['can6S01', 'auto6P1A-flash1'],
  'fr-ch': ['9FA1-9'],
}
export default class LectureDiagrammeBarre extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'

    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const objets = []
    const valeurs: [string, string, string[]][] = [
      ['nombre de fruits', 'une corbeille', ['bananes', 'oranges', 'pommes']],
      [
        'nombre de voitures',
        'un garage',
        ['berline', 'utilitaire', 'cross over'],
      ],
      ['nombre de vêtements', 'une armoire', ['chemises', 'T-shirts', 'pulls']],
    ]
    const quidam = prenom()
    const n = randint(0, 2)
    const a = randint(2, 10)
    const b = randint(2, 10, a)
    const c = randint(2, 10, [a, b])
    const r = repere({
      grilleX: 'pointilles',
      grilleY: false,
      yThickListe: false,
      yLabelListe: valeurs[n][2].map((v: string, index: number) =>
        Object.assign({}, { valeur: 1.5 * index + 1, texte: `\\text{${v}}` }),
      ),
      yLabelEcart: 2,
      xUnite: 1,
      xThickDistance: 1,
      yMax: 5,
      xMin: 0,
      xMax: 11,
      yMin: 0,
      axeYStyle: '',
      axeXStyle: '->',
      xLegende: `${valeurs[n][0]}`,
      xLegendePosition: [10.5, -0.5],
    })
    objets.push(r)
    objets.push(
      traceBarreHorizontale(a, 1, '', {
        epaisseur: 1,
        couleurDeRemplissage: 'blue',
        hachures: true,
      }),
      traceBarreHorizontale(b, 2.5, '', {
        epaisseur: 1,
        couleurDeRemplissage: 'red',
        hachures: true,
      }),
      traceBarreHorizontale(c, 4, '', {
        epaisseur: 1,
        couleurDeRemplissage: 'green',
        hachures: true,
      }),
    )
    this.reponse = a + b + c
    this.question = `${quidam} a compté les ${valeurs[n][0]} dans ${valeurs[n][1]}. Les effectifs sont représentés sur le diagramme ci-dessous.<br>
    `
    this.question += mathalea2d(
      Object.assign(
        { scale: 0.4, style: 'display: block' },
        fixeBordures(objets),
      ),
      objets,
    )
    this.question += ` Combien y a-t-il de ${valeurs[n][0]} en tout ?`
    this.correction = `Il y a $${a}+${b}+${c} = ${miseEnEvidence(this.reponse.toString())}$ ${valeurs[n][0]} en tout.`
  }
}
