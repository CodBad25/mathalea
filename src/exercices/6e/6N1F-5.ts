import { fraction } from '../../modules/fractions'
import Exercice from '../Exercice'

import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice, combinaisonListes2 } from '../../lib/outils/arrayOutils'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { gestionnaireFormulaireTexte, randint } from '../../modules/outils'

export const titre =
  "Associer et utiliser différentes écritures d'un nombre décimal : écriture à virgule, fraction, nombre mixte, pourcentage"
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '09/08/2026'
/**
 * Associer et utiliser différentes écritures d'un nombre décimal : écriture à virgule, fraction, nombre mixte, pourcentage
 * *
 * @author Mireille Gain, à partir de 6N1F

 */

export const uuid = '67f4a'

export const refs = {
  'fr-fr': ['6N1F-5'],
  'fr-ch': [''],
}
export default class AssocierDifferentesEcrituresNombreDecimal extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.besoinFormulaireTexte = [
      'Forme initiale donnée',
      "Nombres séparés par des tirets :\n1 : Somme d'un entier et d'une fraction décimale\n2 : Fraction décimale\n3 : Nombre décimal\n4 : Pourcentage\n5 : Mélange",
    ]
    this.sup = 5
    this.spacingCorr = 3
    this.consigne =
      "Écrire chacun des nombres suivants sous les trois formes manquantes parmi : <br> Nombre mixte (somme d'un entier et d'une fraction décimale strictement inférieure à 1), nombre décimal, fraction décimale, pourcentage."
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      max: 4,
      defaut: 5, // Mélange par défaut
      melange: 5,
      nbQuestions: this.nbQuestions,
      saisie: this.sup,
    })

    const listeTypeDeQuestions = combinaisonListes2(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (
      let i = 0,
        texte,
        texteCorr,
        formeDeci,
        formeMixte,
        formeFrac,
        formePourc,
        entier,
        deci,
        centi,
        milli,
        nbChiffres,
        partieDecimale,
        fracG,
        fracGNS,
        fracD,
        fracDNS,
        cpt = 0;
      i < this.nbQuestions && cpt < 50;
      cpt++
    ) {
      entier = randint(1, 20)
      deci = randint(1, 9)
      centi = randint(1, 9) * 10 + randint(1, 9)
      milli = randint(1, 9) * 100 + randint(1, 9) * 10 + randint(1, 9)
      nbChiffres = choice([1, 2, 3])
      if (nbChiffres === 1) {
        partieDecimale = deci
        fracG = fraction(entier * 10 + deci, 10)
        fracD = fraction(deci, 10)
        formePourc = entier * 100 + deci * 10
      } else {
        if (nbChiffres === 2) {
          partieDecimale = centi
          fracG = fraction(entier * 100 + centi, 100)
          fracD = fraction(centi, 100)
          formePourc = entier * 100 + centi
        } else {
          partieDecimale = milli
          fracG = fraction(entier * 1000 + milli, 1000)
          fracD = fraction(milli, 1000)
          formePourc = entier * 100 + milli / 10
        }
      }
      formeDeci = `$${texNombre(arrondi(entier + partieDecimale / Math.pow(10, nbChiffres)), nbChiffres)}$`
      formeFrac = `$${fracG.texFraction}$`
      formeMixte = `$${entier} + ${fracD.texFraction}$`

      switch (listeTypeDeQuestions[i]) {
        case 1: // Nombre mixte (Somme d'un entier et d'une fraction décimale)
          {
            texte = `$${entier} + ${fracD.texFraction}$`
            texteCorr = `
            ${texte} peut s'écrire sous forme de :<br>
           Nombre décimal : ${formeDeci} <br>
           Fraction décimale : ${formeFrac} <br>
           Pourcentage : $${texNombre(formePourc)}~\\%$ 
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
            ${texte} peut s'écrire sous forme de :<br>
           Nombre décimal : %{champ1} <br>
           Fraction décimale : %{champ2} <br>
           Pourcentage : %{champ3} %
            `,
                dataOptions: {
                  champ1: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                  champ2: {
                    keyboard: KeyboardType.clavierDeBaseAvecFraction,
                  },
                  champ3: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                },
              })
            }
            handleAnswers(
              this,
              i,
              {
                champ1: {
                  value: entier + partieDecimale / Math.pow(10, nbChiffres),
                },
                champ2: { value: fracG },
                champ3: { value: formePourc },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break

        case 2: // Fraction décimale
          {
            texte = `$${fracG.texFraction}$`
            texteCorr = `
            ${texte} peut s'écrire sous forme de :<br>
           Nombre mixte : ${formeMixte} <br>
           Nombre décimal : ${formeDeci} <br>
           Pourcentage : $${texNombre(formePourc)}~\\%$
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
            ${texte} peut s'écrire sous forme de :<br>
           Nombre mixte : %{champ1} (partie entière) + %{champ2} (fraction décimale) <br>
           Nombre décimal : %{champ3} <br>
           Pourcentage : %{champ4} %
            `,
                dataOptions: {
                  champ1: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                  champ2: {
                    keyboard: KeyboardType.clavierDeBaseAvecFraction,
                  },
                  champ3: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                  champ4: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                },
              })
            }
            handleAnswers(
              this,
              i,
              {
                champ1: { value: entier },
                champ2: { value: fracD },
                champ3: {
                  value: entier + partieDecimale / Math.pow(10, nbChiffres),
                },
                champ4: { value: formePourc },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break

        case 3: // Nombre décimal
          {
            texte = `$${texNombre(arrondi(entier + partieDecimale / Math.pow(10, nbChiffres)), nbChiffres)}$`
            texteCorr = `
            ${texte} peut s'écrire sous forme de :<br>
           Nombre mixte : ${formeMixte} <br>
           Fraction décimale : ${formeFrac} <br>           
           Pourcentage : $${texNombre(formePourc)}~\\%$
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
            ${texte} peut s'écrire sous forme de :<br>
           Nombre mixte : %{champ1} (partie entière) + %{champ2} (fraction décimale) <br>
           Fraction décimale : %{champ3} <br>
           Pourcentage : %{champ4} %
            `,
                dataOptions: {
                  champ1: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                  champ2: {
                    keyboard: KeyboardType.clavierDeBaseAvecFraction,
                  },
                  champ3: {
                    keyboard: KeyboardType.clavierDeBaseAvecFraction,
                  },
                  champ4: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                },
              })
            }
            handleAnswers(
              this,
              i,
              {
                champ1: { value: entier },
                champ2: { value: fracD },
                champ3: { value: fracG },
                champ4: { value: formePourc },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break

        case 4: // Pourcentage
        default:
          {
            texte = `$${texNombre(formePourc)}~\\%$`
            if (nbChiffres === 1) {
              fracGNS = fraction(entier * 100 + deci * 10, 100)
              formeFrac += ` (ou $${fracGNS.texFraction}$)`
              formeDeci += ` (ou $${entier},${partieDecimale * 10}$)`
            }

            texteCorr = `
            ${texte} peut s'écrire sous forme de :<br>
           Fraction décimale : ${formeFrac} <br>   
           Nombre décimal : ${formeDeci} <br>
           Nombre mixte : ${formeMixte}
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
            ${texte} peut s'écrire sous forme de :<br>
           Fraction décimale : %{champ1} <br>
           Nombre décimal : %{champ2} <br>
           Nombre mixte : %{champ3} (partie entière) + %{champ4} (fraction décimale) <br>
            `,
                dataOptions: {
                  champ1: {
                    keyboard: KeyboardType.clavierDeBaseAvecFraction,
                  },
                  champ2: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                  champ3: {
                    keyboard: KeyboardType.clavierDeBase,
                  },
                  champ4: {
                    keyboard: KeyboardType.clavierDeBaseAvecFraction,
                  },
                },
              })
            }
            handleAnswers(
              this,
              i,
              {
                champ1: { value: fracG },
                champ2: {
                  value: entier + partieDecimale / Math.pow(10, nbChiffres),
                },
                champ3: { value: entier },
                champ4: { value: fracD },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break
      }

      // Ajouter la question et la correction si la question n'a jamais été posée
      if (this.questionJamaisPosee(i, entier, deci, centi, milli, nbChiffres)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
  }
}
