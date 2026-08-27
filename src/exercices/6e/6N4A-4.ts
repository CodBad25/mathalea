import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { Price, randCoin } from '../../lib/outils/Price'
import { texPrix } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Résoudre des systèmes simples'
export const dateDePublication = '10/07/2026'
export const interactifReady = true

/**
 * Résoudre des problèmes de système simple
 * @author Claire Stephan

 */
export const uuid = 'd6fbd'

export const refs = {
  'fr-fr': ['6N4A-4'],
  'fr-2016': [],
  'fr-ch': [],
}

class SystemSimple extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.spacingCorr = 2
  }

  nouvelleVersion(): void {
    type Flavors =
      | 'pattes et tetes'
      | 'jouets et roues'
      | 'polygones'
      | 'pattes et bosses'
      | 'fleurs'
      | 'monnaie'
    const typeQuestionsDisponibles = [
      'pattes et tetes',
      'jouets et roues',
      'polygones',
      'pattes et bosses',
      'fleurs',
      'monnaie',
    ] as Flavors[]

    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    ) as Flavors[]
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50;) {
      let texte = ''
      let question = ''
      let texteCorr = ''
      const obj1 = { name: '', count: randint(2, 10), value: 0 }
      const obj2 = { name: '', count: randint(2, 10), value: 0 }
      const count1 = { name: '', value: 0 }
      const count2 = { name: '', value: 0 }
      switch (listeTypeQuestions[i]) {
        case 'pattes et tetes':
          obj1['name'] = 'lapins'
          obj2['name'] = 'poules'
          count1['name'] = 'têtes'
          count2['name'] = 'pattes'
          obj1['value'] = 4
          obj2['value'] = 2
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] =
            obj1['value'] * obj1['count'] + obj2['value'] * obj2['count']

          texte = `Des ${obj1['name']} et des ${obj2['name']} courent dans le jardin. `
          texte += `Je compte ${count1['value']} ${count1['name']} et ${count2['value']} ${count2['name']}.<br>`
          texte += `Combien y a-t-il de ${obj1['name']} et de ${obj2['name']} dans le jardin ?<br>`
          break
        case 'jouets et roues':
          obj1['name'] = 'avions'
          obj2['name'] = 'voitures'
          count1['name'] = 'jouets'
          count2['name'] = 'roues'
          obj1['value'] = 3
          obj2['value'] = 4
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] =
            obj1['value'] * obj1['count'] + obj2['value'] * obj2['count']

          texte = `Dans un bac, Lily a des ${obj1['name']} et des ${obj2['name']}. `
          texte += `Les ${obj1['name']} ont trois roues, les ${obj2['name']} ont quatre roues.<br>`
          texte += `Elle a $${count1['value']}$ ${count1['name']} en tout et si elle compte toutes `
          texte += `les ${count2['name']}, elle trouve $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien a-t-elle d'${obj1['name']} et de ${obj2['name']} ?<br>`
          break
        case 'polygones':
          obj1['name'] = 'triangles'
          obj2['name'] = 'quadrilatères'
          count1['name'] = 'polygones'
          count2['name'] = 'côtés'
          obj1['value'] = 3
          obj2['value'] = 4
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] =
            obj1['value'] * obj1['count'] + obj2['value'] * obj2['count']

          texte = `Léo a dessiné des ${obj1['name']} et des ${obj2['name']}. `
          texte += `Sur sa feuille, il y a en tout $${count1['value']}$ ${count1['name']}. `
          texte += `Quand il compte tous les ${count2['name']}, il trouve $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien a-t-elle de ${obj1['name']} et de ${obj2['name']} ?<br>`
          break
        case 'pattes et bosses':
          obj1['name'] = 'dromadaires'
          obj2['name'] = 'chameaux'
          count1['name'] = 'pattes'
          count2['name'] = 'bosses'
          obj1['value'] = 1
          obj2['value'] = 2
          count1['value'] = 4 * (obj1['count'] + obj2['count'])
          count2['value'] =
            obj1['value'] * obj1['count'] + obj2['value'] * obj2['count']

          texte = `Dans le désert, il y a des ${obj1['name']} et des ${obj2['name']}. `
          texte += `Je compte $${count1['value']}$ ${count1['name']} et $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien y a-t-il de ${obj1['name']} et de ${obj2['name']} ?<br>`
          break
        case 'fleurs':
          obj1['name'] = 'roses'
          obj2['name'] = 'oeillets'
          count1['name'] = 'fleurs'
          count2['name'] = 'pétales'
          // double variation: le nombre de pétales
          obj1['value'] = randint(2, 10)
          obj2['value'] = randint(2, 10, obj1['value'])
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] =
            obj1['value'] * obj1['count'] + obj2['value'] * obj2['count']

          texte = `Sam utilise deux tampons pour faire un dessin. `
          texte += `Le premier tampon représente une ${obj1['name'].slice(0, -1)} à $${obj1['value']}$ ${count2['name']}, `
          texte += `le second un ${obj2['name'].slice(0, -1)} à $${obj2['value']}$ ${count2['name']}.<br>`
          texte += `Il a imprimé $${count1['value']}$ ${count1['name']} en tout et s’il compte `
          texte += `tous les ${count2['name']}, il trouve $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien y a-t-il de ${obj1['name']} et d'${obj2['name']} imprimés ?<br>`
          break
        case 'monnaie':
          count1['name'] = 'pièces'
          count2['name'] = '€'
          // double variation: la valeur de la pièce
          const coin1 = randCoin(0.01, 2)
          obj1['value'] = coin1.value
          obj1['name'] = `${coin1}`
          const coin2 = randCoin(0.01, 2, [obj1['value']])
          obj2['value'] = coin2.value
          obj2['name'] = `${coin2}`
          count1['value'] = obj1['count'] + obj2['count']
          const price = new Price(
            obj1['value'] * obj1['count'] + obj2['value'] * obj2['count'],
          )
          count2['value'] = price.value

          texte = `Dans sa tirelire Max a des ${count1['name']} de ${obj1['name']} et de ${obj2['name']}. `
          texte += `Il a ${price} en tout et quand il compte ses ${count1['name']}, il en trouve ${count1['value']}.<br>`
          texte += `Combien y a-t-il de ${count1['name']} de ${obj1['name']} et de ${obj2['name']} ?<br>`
          break
      }

      question =
        obj1['name'] + ' : %{champ1} \n ' + obj2['name'] + ' : %{champ2}'

      let test1 = obj1['value'] + obj2['value'] * (count1['value'] - 1)
      texteCorr = `Il y a $${miseEnEvidence(obj1['count'])}$ ${obj1['name']} et $${miseEnEvidence(obj2['count'])}$ ${obj2['name']}.<br>`
      texteCorr += `On peut commencer par tester avec $1$ ${obj1['name'].slice(0, -1)} et $${count1['value'] - 1}$ ${obj2['name']}. `
      texteCorr += `Ce qui nous donne $1 \\times ${obj1['value']} + ${count1['value'] - 1} \\times ${obj2['value']}= ${test1}$, `
      texteCorr += `il y a donc $${test1}$ ${count2['name']}.<br>`
      texteCorr += test1 < count2['value'] ? "Ce n'est pas assez" : "C'est trop"
      texteCorr += `, on va donc essayer avec $2$ ${obj1['name']} et $${count1['value'] - 2}$ ${obj2['name']}.<br>`
      if (obj1['count'] != 2) {
        texteCorr += `Et ainsi de suite jusqu'à trouver $${obj1['count']}$ ${obj1['name']} et $${obj2['count']}$ ${obj2['name']}.<br>`
      }
      texteCorr += `$${obj1['count']} \\text{ ${count1['name']}} + ${obj2['count']} \\text{ ${count1['name']}} = ${count1['value']} \\text{ ${count1['name']}}$<br>`
      texteCorr += `$${obj1['count']} \\times ${obj1['value']} \\text{ ${count2['name']}} + ${obj2['count']} \\times ${obj2['value']} \\text{ ${count2['name']}} = ${count2['value']} \\text{ ${count2['name']}}$<br>`

      switch (listeTypeQuestions[i]) {
        case 'pattes et bosses':
          texteCorr = `Il y a $${miseEnEvidence(obj1['count'])}$ ${obj1['name']} et $${miseEnEvidence(obj2['count'])}$ ${obj2['name']}.<br>`
          // variation from generic correction: count1['value']/4
          texteCorr += `Comme il y a $${count1['value']}$ ${count1['name']} on a en tout $${count1['value'] / 4}$ animaux.<br>`
          texteCorr += `On peut commencer par tester avec $1$ ${obj1['name'].slice(0, -1)} et $${count1['value'] / 4 - 1}$ ${obj2['name']}.<br>`
          test1 = obj1['value'] + obj2['value'] * (count1['value'] / 4 - 1)
          texteCorr += `Ce qui nous donne $1 \\times ${obj1['value']} + ${count1['value'] / 4 - 1} \\times ${obj2['value']} = ${test1}$, `
          texteCorr += `il y a donc $${test1}$ ${count2['name']}.<br>`
          texteCorr +=
            test1 < count2['value'] ? "Ce n'est pas assez" : "C'est trop"
          texteCorr += `, on va donc essayer avec $2$ ${obj1['name']} et $${count1['value'] / 4 - 2}$ ${obj2['name']}.<br>`
          if (obj1['count'] != 2) {
            texteCorr += `Et ainsi de suite jusqu'à trouver $${obj1['count']}$ ${obj1['name']} et $${obj2['count']}$ ${obj2['name']}.<br>`
          }
          // variation from generic correction: add \\times 4
          texteCorr += `$${obj1['count']} \\times 4 \\text{ ${count1['name']}} + ${obj2['count']} \\times 4 \\text{ ${count1['name']}} = ${count1['value']} \\text{ ${count1['name']}}$<br>`
          texteCorr += `$${obj1['count']} \\text{ ${count2['name']}} + ${obj2['count']} \\times 2 \\text{ ${count2['name']}} = ${count2['value']} \\text{ ${count2['name']}}$<br>`
          break
        case 'monnaie':
          // variation from generic correction: add "pièces de", remove slice() and format with texPrix
          texteCorr = `Il y a $${miseEnEvidence(obj1['count'])}$ pièces de ${obj1['name']} et $${miseEnEvidence(obj2['count'])}$ pièces de ${obj2['name']}.<br>`
          texteCorr += `On peut commencer par tester avec $1$ pièce de ${obj1['name']} et $${count1['value'] - 1}$ pièces de ${obj2['name']}. `
          texteCorr += `Ce qui nous donne $1 \\times ${texPrix(obj1['value'])} + ${count1['value'] - 1} \\times ${texPrix(obj2['value'])} = ${texPrix(test1)}$ , `
          texteCorr += `il y a donc $${texPrix(test1)}$ ${count2['name']}.<br>`
          texteCorr +=
            test1 < count2['value'] ? "Ce n'est pas assez" : "C'est trop"
          texteCorr += `, on va donc essayer avec $2$ pièces de ${obj1['name']} et $${count1['value'] - 2}$ pièces de ${obj2['name']}.<br>`
          if (obj1['count'] != 2) {
            texteCorr += `Et ainsi de suite jusqu'à trouver $${obj1['count']}$ pièce de ${obj1['name']} et $${obj2['count']}$ pièce de ${obj2['name']}.<br>`
          }
          texteCorr += `$${obj1['count']} \\text{ ${count1['name']}} + ${obj2['count']} \\text{ ${count1['name']}} = ${count1['value']} \\text{ ${count1['name']}}$<br>`
          texteCorr += `$${obj1['count']} \\times ${texPrix(obj1['value'])} + ${obj2['count']} \\times ${texPrix(obj2['value'])} = ${texPrix(count2['value'])}$ €<br>`
          break
      }

      if (this.interactif) {
        texte += `${addMultiMathfield(this, i, {
          dataTemplate: question,
          dataOptions: {
            champ1: { keyboard: KeyboardType.clavierNumbers },
            champ2: { keyboard: KeyboardType.clavierNumbers },
          },
        })}`
        handleAnswers(
          this,
          i,
          {
            champ1: { value: obj1['count'] },
            champ2: { value: obj2['count'] },
          },
          { formatInteractif: 'multi-mathfield' },
        )
      }
      if (this.questionJamaisPosee(i, obj1['count'], obj2['count'])) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
  }
}

export default SystemSimple
