import { fraction } from '../../modules/fractions'
import Exercice from '../Exercice'

import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice, combinaisonListes2 } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
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
  'fr-ch': ['9NO3C-21'],
}
export default class AssocierDifferentesEcrituresNombreDecimal extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.besoinFormulaireTexte = [
      'Forme initiale donnée',
      'Nombres séparés par des tirets :\n1 : Nombre mixte\n2 : Fraction décimale\n3 : Nombre décimal\n4 : Pourcentage\n5 : Mélange',
    ]
    this.sup = 5
    this.besoinFormulaire2CaseACocher = [
      "Avec rappel de la définition d'un nombre mixte",
    ]
    this.sup2 = false
    this.spacingCorr = 3

  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      max: 4,
      defaut: 5, // Mélange par défaut
      melange: 5,
      nbQuestions: this.nbQuestions,
      saisie: this.sup,
    })
    this.consigne =
      'Écrire chacun des nombres suivants sous les trois formes manquantes parmi : <br>Nombre décimal, fraction décimale, pourcentage, nombre mixte'
    if (this.sup2) {
      this.consigne +=
        " (somme d'un entier et d'une fraction décimale strictement inférieure à 1)."
    } else {
      this.consigne += '.'
    }
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
        formeMixteEnEvidence,
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
      formeDeci = texNombre(
        entier + partieDecimale / 10 ** nbChiffres,
        nbChiffres,
      )
      formeFrac = `$${fracG.texFraction}$`
      formeMixte = `$${entier} + ${fracD.texFraction}$`
      formeMixteEnEvidence = `$${miseEnEvidence(entier)}$ $${miseEnEvidence('+')}$ $${miseEnEvidence(fracD.texFraction)}$`

      switch (listeTypeDeQuestions[i]) {
        case 1: // Nombre mixte (Somme d'un entier et d'une fraction décimale)
          {
            texte = formeMixte
            texteCorr = `
            ${texte} peut aussi s'écrire sous forme de :<br>
           Nombre décimal : $${miseEnEvidence(formeDeci)}$ <br>
           Fraction décimale : $${miseEnEvidence(fracG)}$ <br>
           Pourcentage : $${miseEnEvidence(texNombre(formePourc, 1))}~\\%$
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
           Ce nombre peut aussi sous forme de :<br>
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
                  value: formeDeci,
                  options: { nombreDecimalSeulement: true },
                },
                champ2: {
                  value: fracG.texFraction,
                  options: { fractionDecimale: true },
                },
                champ3: {
                  value: formePourc,
                  options: { nombreDecimalSeulement: true },
                },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break

        case 2: // Fraction décimale
          {
            texte = formeFrac
            texteCorr = `
            ${texte} peut aussi s'écrire sous forme de :<br>
           Nombre mixte : ${formeMixteEnEvidence} <br>
           Nombre décimal : $${miseEnEvidence(formeDeci)}$ <br>
           Pourcentage : $${miseEnEvidence(formePourc)}~\\%$
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
           Ce nombre peut aussi sous forme de :<br>
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
                champ1: {
                  value: entier,
                  options: { nombreDecimalSeulement: true },
                },
                champ2: {
                  value: fracD.texFraction,
                  options: { fractionDecimale: true },
                },
                champ3: {
                  value: formeDeci,
                  options: { nombreDecimalSeulement: true },
                },
                champ4: {
                  value: formePourc,
                  options: { nombreDecimalSeulement: true },
                },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break

        case 3: // Nombre décimal
          {
            texte = formeDeci
            texteCorr = `
            ${texte} peut aussi s'écrire sous forme de :<br>
           Nombre mixte : ${formeMixteEnEvidence} <br>
           Fraction décimale : $${miseEnEvidence(fracG)}$ <br>           
           Pourcentage : $${miseEnEvidence(texNombre(formePourc))}~\\%$
            `
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
           Ce nombre peut aussi sous forme de :<br>
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
                champ1: {
                  value: entier,
                  options: { nombreDecimalSeulement: true },
                },
                champ2: {
                  value: fracD.texFraction,
                  options: { fractionDecimale: true },
                },
                champ3: {
                  value: fracG.texFraction,
                  options: { fractionDecimale: true },
                },
                champ4: {
                  value: formePourc,
                  options: { nombreDecimalSeulement: true },
                },
              },
              { formatInteractif: 'multi-mathfield' },
            )
          }
          break

        case 4: // Pourcentage
        default:
          {
            texte = `$${texNombre(formePourc, 1)}~\\%$`
            if (nbChiffres === 1) {
              fracGNS = fraction(entier * 100 + deci * 10, 100)
              texteCorr = `
              ${texte} peut aussi s'écrire sous forme de :<br>
             Fraction décimale : $${miseEnEvidence(fracG)}$ (ou $${fracGNS.texFraction}$) <br>   
             Nombre décimal : $${miseEnEvidence(formeDeci)}$ (ou $${entier},${partieDecimale * 10}$) <br>
             Nombre mixte : ${formeMixteEnEvidence}
              `
            } else {
              texteCorr = `
            ${texte} peut aussi s'écrire sous forme de :<br>
           Fraction décimale : $${miseEnEvidence(fracG)}$ <br>   
           Nombre décimal : $${miseEnEvidence(formeDeci)}$ <br>
           Nombre mixte : ${formeMixteEnEvidence}
            `
            }
            if (this.interactif) {
              texte += addMultiMathfield(this, i, {
                dataTemplate: `
          Ce nombre peut aussi s'écrire sous forme de :<br>
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
                champ1: {
                  value: fracG.texFraction,
                  options: { fractionDecimale: true },
                },
                champ2: {
                  value: formeDeci,
                  options: { nombreDecimalSeulement: true },
                },
                champ3: {
                  value: entier,
                  options: { nombreDecimalSeulement: true },
                },
                champ4: {
                  value: fracD.texFraction,
                  options: { fractionDecimale: true },
                },
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
