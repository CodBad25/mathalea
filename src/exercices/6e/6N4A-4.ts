import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { Price, randCoin } from '../../lib/outils/Price'
import { randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Résoudre des systèmes simples'
export const dateDePublication = '10/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Résoudre des problèmes de système simple
 * @author 

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
      | 'pattes et tetes' | 'jouets et roues' | 'polygones' | 'pattes et bosses' | 'fleurs' | 'monnaie'
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
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      const obj1 = { name: '', count: randint(2, 10), value: 0 }
      const obj2 = { name: '', count: randint(2, 10), value: 0 }
      const count1 = { name: '', value: 0 }
      const count2 = { name: '', value: 0 }
      switch (listeTypeQuestions[i]) {
        case 'pattes et tetes':
          obj1['name'] = "lapins"
          obj2['name'] = "poules" 
          count1['name'] = "têtes"
          count2['name'] = "pattes"
          obj1['value'] = 4;
          obj2['value'] = 2;
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] = obj1['value']*obj1['count'] + obj2['value']*obj2['count']

          texte = `Des ${obj1['name']} et des ${obj2['name']} courent dans le jardin. `
          texte += `Je compte ${count1['value']} ${count1['name']} et ${count2['value']} ${count2['name']}.<br>`
          texte += `Combien y a-t-il de ${obj1['name']} et de ${obj2['name']} dans le jardin ?` 
          break
        case 'jouets et roues':
          obj1['name'] = "avions"
          obj2['name'] = "voitures"
          count1['name'] = "jouets"
          count2['name'] = "roues"
          obj1['value'] = 3;
          obj2['value'] = 4;
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] = obj1['value']*obj1['count'] + obj2['value']*obj2['count']

          texte = `Dans un bac, Lily a des ${obj1['name']} et des ${obj2['name']}. `
          texte += `Les ${obj1['name']} ont trois roues, les ${obj2['name']} ont quatre roues.<br>`
          texte += `Elle a $${count1['value']}$ ${count1['name']} en tout et si elle compte toutes `
          texte += `les ${count2['name']}, elle trouve $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien a-t-elle d'${obj1['name']} et de ${obj2['name']} ?`
          break
        case 'polygones':
          obj1['name'] = "triangles"
          obj2['name'] = "quadrilatères"
          count1['name'] = "polygones"
          count2['name'] = "côtés"
          obj1['value'] = 3;
          obj2['value'] = 4;
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] = obj1['value']*obj1['count'] + obj2['value']*obj2['count']

          texte = `Léo a dessiné des ${obj1['name']} et des ${obj2['name']}. `
          texte += `Sur sa feuille, il y a en tout $${count1['value']}$ ${count1['name']}. `
          texte += `Quand il compte tous les ${count2['name']}, il trouve $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien a-t-elle de ${obj1['name']} et de ${obj2['name']} ?`
          break
        case 'pattes et bosses':
          obj1['name'] = "dromadaires"
          obj2['name'] = "chameaux" 
          count1['name'] = "pattes"
          count2['name'] = "bosses"
          obj1['value'] = 1;
          obj2['value'] = 2;
          count1['value'] = 4*(obj1['count'] + obj2['count'])
          count2['value'] = obj1['value']*obj1['count'] + obj2['value']*obj2['count']

          texte = `Dans le désert, il y a des ${obj1['name']} et des ${obj2['name']}. `
          texte += `Je compte $${count1['value']}$ ${count1['name']} et $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien y a-t-il de ${obj1['name']} et de ${obj2['name']} ?`
          break
        case 'fleurs':
          obj1['name'] = "rose"
          obj2['name'] = "oeillet"
          count1['name'] = "fleurs"
          count2['name'] = "pétales"
          // double variation: le nombre de pétales
          obj1['value'] = randint(2, 10);
          obj2['value'] = randint(2, 10, obj1['value']);
          count1['value'] = obj1['count'] + obj2['count']
          count2['value'] = obj1['value']*obj1['count'] + obj2['value']*obj2['count']

          texte = `Sam utilise deux tampons pour faire un dessin. `
          texte += `Le premier tampon représente une ${obj1['name']} à $${obj1['value']}$ ${count2['name']}, `
          texte += `le second un ${obj2['name']} à $${obj2['value']}$ ${count2['name']}.<br>`
          texte += `Il a imprimé $${count1['value']}$ ${count1['name']} en tout et s’il compte `
          texte += `tous les ${count2['name']}, il trouve $${count2['value']}$ ${count2['name']}.<br>`
          texte += `Combien y a-t-il de ${obj1['name']}s et d'${obj2['name']}s imprimés ?`
          break
        case 'monnaie':
          count1['name'] = "pièces"
          count2['name'] = "€"
          // double variation: la valeur de la pièce
          const coin1 = randCoin(0.01, 2);
          obj1['value'] = coin1.value
          obj1['name'] = `${coin1}`
          const coin2 = randCoin(0.01, 2, [obj1['value']]);
          obj2['value'] = coin2.value
          obj2['name'] = `${coin2}`
          count1['value'] = obj1['count'] + obj2['count']
          const price = new Price(obj1['value']*obj1['count'] + obj2['value']*obj2['count'])
          count2['value'] = price.value

          texte = `Dans sa tirelire Max a des ${count1['name']} de $${obj1['name']}$ et de $${obj2['name']}$. `
          texte += `Il a $${price}$ en tout et quand il compte ses ${count1['name']}, il en trouve $${count1['value']}$.<br>`
          texte += `Combien y a-t-il de ${count1['name']} de $${obj1['name']}$ et de $${obj2['name']}$ ?`
          break
      }

      texteCorr = `Il y a $${obj1['count']}$ ${obj1['name']} et $${obj2['count']}$ ${obj2['name']}:<br>`
      texteCorr += `$${obj1['count']}$ ${count1['name']} $+ ${obj2['count']}$ ${count1['name']} $= ${count1['value']}$ ${count1['name']}<br>`
      texteCorr += `$${obj1['count']} \\times ${obj1['value']}$ ${count2['name']} $+ ${obj2['count']} \\times ${obj2['value']}$ ${count2['name']} = $${count2['value']}$ ${count2['name']}<br>`

      switch (listeTypeQuestions[i]) {
        case 'pattes et bosses':
          texteCorr = `Il y a $${obj1['count']}$ ${obj1['name']} et $${obj2['count']}$ ${obj2['name']}:<br>`
          // variation from generic correction
          texteCorr += `$${obj1['count']} \\times 4$ ${count1['name']} $ + ${obj2['count']} \\times 4$ ${count1['name']} $ = ${count1['value']}$ ${count1['name']}<br>`
          texteCorr += `$${obj1['count']}$ ${count2['name']} $ + ${obj2['count']} \\times 2 $ ${count2['name']} = $${count2['value']}$ ${count2['name']}<br>`
          break
        case 'monnaie':
          // variation from generic correction
          texteCorr = `Il y a $${obj1['count']}$ pièces de ${obj1['name']} et $${obj2['count']}$ pièces de ${obj2['name']}:<br>`
          texteCorr += `$${obj1['count']}$ ${count1['name']} $+ ${obj2['count']}$ ${count1['name']} $= ${count1['value']}$ ${count1['name']}<br>`
          texteCorr += `$${obj1['count']} \\times ${obj1['value']}$ ${count2['name']} $+ ${obj2['count']} \\times ${obj2['value']}$ ${count2['name']} $= ${count2['value']}$ ${count2['name']}<br>`
          break
      }

      if (this.interactif) {
        texte +=
          '<br>' + remplisLesBlancs(this, i, obj1['name']+' = %{champ1}; '+obj2['name']+' = %{champ2}')
        handleAnswers(
          this,
          i,
          {
            bareme: (listePoints: number[]) => [
              Math.min(listePoints[0], listePoints[1]),
              1,
            ],
            champ1: { value: obj1['count'] },
            champ2: { value: obj2['count'] },
          },
          { formatInteractif: 'fillInTheBlank' },
        )
      }
      if (this.questionJamaisPosee(i, obj1['count'], obj2['count'] )) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
  }
}

export default SystemSimple
