import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { toutAUnPoint } from '../../lib/interactif/mathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { lettreDepuisChiffre } from '../../lib/outils/outilString'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
import { RedactionPythagore } from './_pythagore'

export const titre =
  'Calculer mentalement une longueur avec le théorème de Pythagore'
export const dateDePublication = '05/10/2024'
export const interactifReady = true
export const interactifType = 'multiMathfield'
export const uuid = '6dc46'
export const refs = {
  'fr-fr': ['4G20-8', 'BP2AutoR3'],
  'fr-ch': ['11GM1-9'],
}
/**
 * Calcul mental utilisant les carrés de 1 à 15 avec le théorème de Pythagore
 * @author Mireille Gain
 */

export default class CalculMentalPythagore extends Exercice {
  constructor() {
    super()
    this.consigne =
      'Calculer la longueur demandée sous forme de racine carrée, puis de la partie entière du résultat.'
    this.nbQuestions = 2 // Ligne obligatoire ? Indique le nombre de questions affiché à l'ouverture de l'exercice
    this.spacing = 1.5 // Indique l'espace entre les lignes dans un exercice. C'est 1 par défaut, si cette ligne est absente.
    this.spacingCorr = 1.5
  }

  nouvelleVersion() {
    // Triangle ABC rectangle en A
    const typeQuestionsDisponibles = ['hypotenuse', 'coteAngleDroit']
    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const AB = randint(2, 5)
      const BC = randint(10, 15)
      const AC = randint(6, 9)
      const choixA = randint(1, 26, [17, 15])
      const choixB = randint(1, 26, [17, 15, choixA])
      const choixC = randint(1, 26, [17, 15, choixA, choixB])
      const sommetA = lettreDepuisChiffre(choixA)
      const sommetB = lettreDepuisChiffre(choixB)
      const sommetC = lettreDepuisChiffre(choixC)

      let texte, reponse, texteCorr, reponse0
      switch (listeTypeQuestions[i]) {
        case 'coteAngleDroit':
          if (choice([true, false])) {
            texte = `On considère le triangle $${sommetA}${sommetB}${sommetC}$ rectangle en $${sommetA}$ tel que $${sommetA}${sommetB} = ${AB}\\text{ cm}$ et $${sommetB}${sommetC} = ${BC}\\text{ cm}$. Calculer $${sommetA}${sommetC}$.<br>`
            texte += addMultiMathfield(this, i, {
              dataTemplate: `$${sommetA}${sommetC}=$  %{champ1} $\\text{cm}$ (Racine carrée)
              $${sommetA}${sommetC} \\approx$ %{champ2} $\\text{cm}$ (Partie entière)`,
              dataOptions: {
                champ1: { keyboard: KeyboardType.clavierFullOperations },
                champ2: { keyboard: KeyboardType.clavierNumbers },
              },
            })
            reponse0 = `\\sqrt{${BC ** 2 - AB ** 2}}`
            reponse = Math.floor(Math.sqrt(BC ** 2 - AB ** 2))
            handleAnswers(
              this,
              i,
              {
                bareme: toutAUnPoint,
                champ1: { value: reponse0 },
                champ2: { value: String(reponse) },
              },
              { formatInteractif: 'multiMathfield' },
            )
            texteCorr = RedactionPythagore(
              `${sommetA}`,
              `${sommetC}`,
              `${sommetB}`,
              2,
              reponse,
              AB,
              BC,
            )[0]
          } else {
            texte = `On considère le triangle $${sommetA}${sommetB}${sommetC}$ rectangle en $${sommetA}$ tel que $${sommetA}${sommetC} = ${AC}\\text{ cm}$ et $${sommetB}${sommetC} = ${BC}\\text{ cm}$. Calculer $${sommetA}${sommetB}$.<br>`
            reponse0 = `\\sqrt{${BC ** 2 - AC ** 2}}`
            reponse = Math.floor(Math.sqrt(BC ** 2 - AC ** 2))
            texteCorr = RedactionPythagore(
              `${sommetA}`,
              `${sommetB}`,
              `${sommetC}`,
              2,
              reponse,
              AC,
              BC,
            )[0]
            texte += addMultiMathfield(this, i, {
              dataTemplate: `$${sommetA}${sommetB}=$  %{champ1} $\\text{cm}$ (Racine carrée)
              $${sommetA}${sommetB} \\approx$ %{champ2} $\\text{cm}$ (Partie entière)`,
              dataOptions: {
                champ1: { keyboard: KeyboardType.clavierFullOperations },
                champ2: { keyboard: KeyboardType.clavierNumbers },
              },
            })
            handleAnswers(
              this,
              i,
              {
                bareme: toutAUnPoint,
                champ1: { value: reponse0 },
                champ2: { value: String(reponse) },
              },
              { formatInteractif: 'multiMathfield' },
            )
          }
          break

        // case 'hypotenuse':
        default:
          texte = `On considère le triangle $${sommetA}${sommetB}${sommetC}$ rectangle en $${sommetA}$ tel que $${sommetA}${sommetB} = ${AB}\\text{ cm}$ et $${sommetA}${sommetC} = ${AC}\\text{ cm}$. Calculer $${sommetB}${sommetC}$.<br>`
          reponse0 = `\\sqrt{${AB ** 2 + AC ** 2}}`
          reponse = Math.floor(Math.sqrt(AB ** 2 + AC ** 2))
          texte += addMultiMathfield(this, i, {
            dataTemplate: `$${sommetB}${sommetC}=$  %{champ1} $\\text{cm}$ (Racine carrée)
            $${sommetB}${sommetC} \\approx$ %{champ2} $\\text{cm}$ (Partie entière)`,
            dataOptions: {
              champ1: { keyboard: KeyboardType.clavierFullOperations },
              champ2: { keyboard: KeyboardType.clavierNumbers },
            },
          })
          handleAnswers(
            this,
            i,
            {
              bareme: toutAUnPoint,
              champ1: { value: reponse0 },
              champ2: { value: String(reponse) },
            },
            { formatInteractif: 'multiMathfield' },
          )
          texteCorr = RedactionPythagore(
            `${sommetA}`,
            `${sommetB}`,
            `${sommetC}`,
            1,
            AB,
            AC,
            reponse,
          )[0]
          break
      }

      if (this.questionJamaisPosee(i, AB, BC, AC)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr !== undefined ? texteCorr : ''
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
