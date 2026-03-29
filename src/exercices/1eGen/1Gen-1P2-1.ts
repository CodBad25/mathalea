import { choice } from '../../lib/outils/arrayOutils'
import { tableauColonneLigne } from '../../lib/2d/tableau'
import { Arbre } from '../../modules/arbres'
import { fixeBordures } from '../../lib/2d/fixeBordures'

import { pgcd } from '../../lib/outils/primalite'
import Exercice from '../Exercice'
import { mathalea2d } from '../../modules/mathalea2d'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import { fraction } from '../../modules/fractions'
import { texNombre } from '../../lib/outils/texNombre'
import { AddTabDbleEntryMathlive } from '../../lib/interactif/tableaux/AjouteTableauMathlive'
export const interactifReady = false

export const titre = "Loi de probabilité d'une variable aléatoire discrète"
export const dateDePublication = '28/03/2026'
/**
 *
 * @author Arnaud Meistermann

*/
export const uuid = '5c031'

export const refs = {
  'fr-fr': ['1P2-1'],
  'fr-ch': [],
}
export default class LoiDeProba extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireTexte = [
      'Choix des questions',
      '1 : Jeu de carte \n2 : Loterie \n3 : Sport \n4 : Mélange des cas précédents',
    ]
    this.sup = '4'

    this.spacing = 1.5 // Interligne des questions
    this.spacingCorr = 1.5 // Interligne des réponses
  }

  nouvelleVersion() {
    const listeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 3,
      melange: 4,
      defaut: 4,
      nbQuestions: this.nbQuestions,
    })
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      let reponse = ''
      // Boucle principale où i+1 correspond au numéro de la question
      switch (listeDeQuestions[i]) {
        case 1: // jeu de cartes
          {
            const a = randint(2, 10) //
            const b = 10 * randint(3, 5) //
            const c = randint(a + 5, a + 10)
            const d = randint(14, 19) / 100
            const nom = choice(['Vincent', 'Amal', 'Franck', 'Julien'])
          
            texte = `On propose à ${nom} de faire un pari avec un jeu de 32 cartes.<br>
              Il mise $${a} $ €. S'il obtient un as , il gagne $${b}€ $. S'il obtient un roi, une dame ou un valet, il gagne $${c}$ €. Dans tous les autres cas, il ne gagne rien.<br>
              On note $X$ la variable aléatoire qui donne le gain de ${nom}. Déterminer la loi de probabilité de $X$.`
            texteCorr =
              `Les valeurs possibles pour $X$ sont $${b - a}$, $${c - a}$ et $${-a}$. Donc on obtient :<br> ` +
              tableauColonneLigne(
                ['x_i', `${b - a}`, `${c - a}`, `${-a}`],
                ['P(X=x_i)'],
                [
                  `\\dfrac{ 4 } { 32 } `,
                  `\\dfrac{ 12 } { 32 } `,
                  `\\dfrac{16 } {32}`,
                ],
              )
          }
          break

        case 2: // jeu de loterie
          {
            const nb = 100 * randint(20, 50)
            const lot = 1000 * randint(1, 5)
            const nb1 = randint(5, 10) //
            const lot1 = 100 * randint(5, 10)
            const nb2 = 10 * randint(5, 10)
            const lot2 = 10 * randint(5, 10) //

            texte = `Une association décide d'organiser une loterie.<br>
              Sur les $${nb}$ tickets mis en vente, un seul rapporte $${lot}$ €. $${nb1}$ billets font gagner $${lot1}$ €, $${nb2}$ rapportent $${lot2}$ € et les autres sont des billets perdants.<br>
             On note $X$ la variable aléatoire égale à la valeur en euro d'un ticket. Déterminer la loi de $X$. `
            texteCorr =
              `Les valeurs possibles pour $X$ sont : $${lot}$, $${lot1}$, $${lot2}$ et $0$. Donc on obtient :<br> ` +
              tableauColonneLigne(
                ['x_i', `${texNombre(lot)}`, `${texNombre(lot1)}`, `${lot2}`, '0'],
                ['P(X=x_i)'],
                [
                  `\\dfrac{ 1 } { ${nb} } `,
                  `\\dfrac{  ${nb1} } { ${nb} } `,
                  `\\dfrac{ ${nb2} } { ${nb}}`,
                  `\\dfrac{ ${nb - nb1 - nb2 - 1}}{ ${nb}}`,
                ],
              )
          }
          break
        case 3: // jeu avec sport
          {
            const nom = choice(['Rose', 'Lou', 'Lina', 'Aya'])
            const sport = choice(['football', 'handball', 'hockey'])
            let nb1 = randint(2, 8)
            let nb2 = nb1 + randint(1, 4)
            const p = pgcd(nb1, nb2)
            nb1 = nb1 / p
            nb2 = nb2 / p
            const rationnel = true
            const omega = new Arbre({
              racine: true,
              rationnel,
              nom: '',
              proba: 1,
              visible: true,
              alter: '',
              enfants: [
                new Arbre({
                  rationnel,
                  nom: 'M',
                  proba: fraction(nb1, nb2),
                  visible: true,
                  enfants: [
                    new Arbre({
                      rationnel,
                      nom: 'M',
                      proba: fraction(nb1, nb2),
                      visible: true,
                      alter: 'X=2',
                    }),
                    new Arbre({
                      rationnel,
                      nom: '\\bar M',
                      proba: fraction(nb2 - nb1, nb2),
                      visible: true,
                      alter: 'X=1',
                    }),
                  ],
                }),
                new Arbre({
                  rationnel,
                  nom: '\\bar M',
                  proba: fraction(nb2 - nb1, nb2),
                  enfants: [
                    new Arbre({
                      rationnel,
                      nom: 'M',
                      proba: fraction(nb1, nb2),
                      visible: true,
                      alter: 'X=1',
                    }),
                    new Arbre({
                      rationnel,
                      nom: '\\bar M',
                      proba: fraction(nb2 - nb1, nb2),
                      visible: true,
                      alter: 'X=0',
                    }),
                  ],
                }),
              ],
            })

            omega.setTailles() // On calcule les tailles des arbres.
            const objets = omega.represente(0, 6, 0, 4, true, 1, 8)

            texte = `${nom} joue au ${sport} et elle a remarqué que lorsqu'elle tirait au but, elle avait ${nb1} chances sur  ${nb2} de marquer. <br>
              On note $X$ la variable aléatoire égale au nombre de buts marqués au cours de 2 tirs successifs. Déterminer la loi de probabilité de $X$.`
            texteCorr = `On considère l'arbre suivant où $M$ est l'évènement : " ${nom} marque un but "<br>
              `
            texteCorr +=
              mathalea2d(
                Object.assign({ style: 'inline' }, fixeBordures(objets)),
                objets,
              ) +' <br> '
              +`Les valeurs possibles pour $X$ sont $0$, $1$, et $2$.<br>
            $P(X = 2) =\\dfrac{ ${nb1} } { ${nb2} } \\times \\dfrac{ ${nb1} } { ${nb2} }= \\dfrac{ ${nb1 * nb1} } { ${nb2 * nb2} } $<br>
            $P(X = 1)=\\dfrac{ ${nb1} }{ ${nb2} } \\times \\dfrac{ ${nb2 - nb1}} { ${nb2} }+\\dfrac{ ${nb2 - nb1} }{ ${nb2} } \\times \\dfrac{ ${nb1}} { ${nb2} }=\\dfrac{  ${2 * nb1 * (nb2 - nb1)} } { ${nb2 * nb2} }$<br>
$P(X=0)=\\dfrac{ ${nb2 - nb1} }{ ${nb2} } \\times \\dfrac{ ${nb2 - nb1}} { ${nb2} }=  \\dfrac{ ${(nb2 - nb1) * (nb2 - nb1)} } { ${nb2 * nb2}}$
                  Ainsi on obtient : <br>` +
              tableauColonneLigne(
                ['x_i', `${0}`, `${1}`, `${2}`],
                ['P(X=x_i)'],
                [
                  `\\dfrac{ ${nb1 * nb1} } { ${nb2 * nb2} } `,
                  ` \\dfrac{  ${2 * nb1 * (nb2 - nb1)} } { ${nb2 * nb2} } `,
                  `   \\dfrac{ ${(nb2 - nb1) * (nb2 - nb1)} } { ${nb2 * nb2}}`,
                ],
              )
          }
          break
      }

      if (this.questionJamaisPosee(i, texte)) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
