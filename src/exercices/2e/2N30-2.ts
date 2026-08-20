import {
  lireFormulaireComplexe,
  serialiseFormulaireComplexe,
  valeursParDefaut,
  type FormulaireComplexe,
} from '../../lib/formulaireComplexe'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { shuffle } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureParentheseSiMoins,
} from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { lettreDepuisChiffre } from '../../lib/outils/outilString'
import { ppcm, ppcmListe } from '../../lib/outils/primalite'
import type FractionEtendue from '../../modules/FractionEtendue'
import { fraction } from '../../modules/fractions'
import { randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Sommes algébriques de fractions'
export const dateDePublication = '18/08/2026'
export const interactifReady = true
export const uuid = 'b51bd'
export const refs = {
  'fr-fr': ['2N30-2', 'BP2AutoH1'],
  'fr-ch': ['NR'],
}

/**
 * @author Jean-Claude Lhote
 */

const leSuperFormulaire: FormulaireComplexe = {
  champs: [
    {
      type: 'listePonderee',
      nom: 'typeDeQuestion',
      label: 'Types de calculs',
      items: [
        {
          nom: '1',
          label: 'Somme ou différence de deux fractions',
          poids: 1,
        },
        {
          nom: '2',
          label: "Somme u différence d'un entier et d'une fraction",
          poids: 1,
        },
        {
          nom: '3',
          label: 'Somme algébrique de trois fractions',
          poids: 1,
        },
        {
          nom: '4',
          label: 'Somme algébrique de quatre fractions',
          poids: 1,
        },
      ],
    },
    {
      type: 'liste',
      nom: 'denominateurs',
      label: 'dénominateurs',
      items: [
        { nom: '1', label: '2, 4, 8' },
        { nom: '2', label: '3, 6, 12' },
        { nom: '3', label: '5, 10, 20' },
        { nom: '4', label: 'Quelconque inférieur à 10' },
      ],
    },
    {
      type: 'case',
      nom: 'simplifier',
      label: 'Fraction irreductible attendue',
      defaut: true,
    },
  ],
}
const calculeSomme3Fractions = (
  f1: FractionEtendue,
  f2: FractionEtendue,
  f3: FractionEtendue,
  resultatFinal: FractionEtendue,
  simplifier: boolean,
) => {
  const cm = ppcmListe([f1.den, f2.den, f3.den])
  const calcul = `\\dfrac{${f1.num}${ecritureAlgebrique(f2.num)}${ecritureAlgebrique(f3.num)}}{${cm}}\\\\
        ${
          resultatFinal.estIrreductible
            ? `&=${miseEnEvidence(resultatFinal.texFSD)}`
            : simplifier
              ? `&=${resultatFinal.texFSD}\\\\\n
              &=${miseEnEvidence(resultatFinal.simplifie().texFSD)}`
              : `&=${miseEnEvidence(resultatFinal.texFSD)}`
        }
        \\end{aligned}`
  return calcul
}
const calculeSomme = (
  f1: FractionEtendue,
  f2: FractionEtendue,
  resultat: FractionEtendue,
  simplifier: boolean,
) => {
  let calcul = ''
  if (f1.den === f2.den) {
    calcul += `\\dfrac{${f1.num}${ecritureAlgebrique(f2.num)}}{${f1.den}}\\\\
        ${
          resultat.estIrreductible
            ? `&=${miseEnEvidence(resultat.texFSD)}`
            : simplifier
              ? `&=${resultat.texFSD}\\\\\n
              &=${miseEnEvidence(resultat.simplifie().texFSD)}`
              : `&=${miseEnEvidence(resultat.texFSD)}`
        }
        \\end{aligned}`
  } else {
    const cm = ppcm(f1.den, f2.den)
    calcul += `${f1.reduire(cm / f1.den).texFSD}+${f2.reduire(cm / f2.den).texFraction}\\\\\n`
    calcul += `&=\\dfrac{${f1.num * (cm / f1.den)}${ecritureAlgebrique(f2.num * (cm / f2.den))}}{${cm}}\\\\\n`
    calcul += `${
      resultat.estIrreductible
        ? `&=${miseEnEvidence(resultat.texFSD)}`
        : simplifier
          ? `&=${resultat.texFSD}\\\\
        &=${miseEnEvidence(resultat.simplifie().texFSD)}`
          : `&=${miseEnEvidence(resultat.texFSD)}`
    }
        \\end{aligned}`
  }
  return calcul
}
export default class ExerciceSommesAlgebriquesDeFractions2nde extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.listeAvecNumerotation = false
    this.besoinFormulaireComplexe = leSuperFormulaire
    this.sup = serialiseFormulaireComplexe(
      leSuperFormulaire,
      valeursParDefaut(leSuperFormulaire),
    )
  }

  choixDenominateurs(choix: string) {
    switch (choix) {
      case '1':
        return shuffle([2, 4, 8, 2, 4, 8])
      case '2':
        return shuffle([3, 6, 12, 3, 6, 12])
      case '3':
        return shuffle([5, 10, 20, 5, 10, 20])
      case '4':
      default:
        return [randint(2, 9), randint(2, 9), randint(2, 9), randint(2, 9)]
    }
  }

  calculSommeOuDifferenceDeDeuxFractions(
    f1: FractionEtendue,
    f2: FractionEtendue,
    signe: string,
    simplifier: boolean,
    lettre: string,
  ): { texteCorr: string; resultat: FractionEtendue } {
    let resultat: FractionEtendue
    let calcul = `\\begin{aligned}${lettre}&=${f1.texFSD} ${signe} ${f2.texFraction}\\\\\n&=`
    if (signe === '+') {
      resultat = f1.sommeFraction(f2)
    } else {
      resultat = f1.differenceFraction(f2)
    }
    if (signe === '+') {
      calcul += calculeSomme(f1, f2, resultat, simplifier)
    } else {
      calcul += `${f1.texFSD}+${f2.oppose().texFraction}\\\\
      &=${calculeSomme(f1, f2.oppose(), resultat, simplifier)}`
    }
    return {
      texteCorr: `$${calcul}$`,
      resultat,
    }
  }

  uneSommeOuDifferenceDeDeuxFractions(
    choixDenominateurs: string,
    simplifier: boolean,
    lettre: string,
  ) {
    const denominateurs = this.choixDenominateurs(choixDenominateurs)
    const a = randint(1, 9) * randint(-1, 1, 0)
    const b = randint(1, 9) * randint(-1, 1, 0)
    const signe = ['+', '-'][randint(0, 1)]
    const f1 = fraction(a, denominateurs[0])
    const f2 = fraction(b, denominateurs[1])

    const texte = `$${lettre}=${f1.texFSD} ${signe} ${f2.texFraction}$`
    const { texteCorr, resultat } = this.calculSommeOuDifferenceDeDeuxFractions(
      f1,
      f2,
      signe,
      simplifier,
      lettre,
    )
    const correctionAlternative =
      f1.estEntiere && f2.estEntiere
        ? `<br>On peut remarquer que $${f1.texFraction}=${f1.texFractionSimplifiee}$ et $${f2.texFraction}=${f2.texFractionSimplifiee}$, donc on peut aussi écrire :<br>
$${f1.texFractionSimplifiee} ${signe} ${ecritureParentheseSiMoins(f2.texFractionSimplifiee)}=${resultat.texFractionSimplifiee}$`
        : ''
    return { texte, texteCorr: texteCorr + correctionAlternative, resultat }
  }
  uneSommeOuDifferenceDUnEntierEtDUneFraction(
    choixDenominateurs: string,
    simplifier: boolean,
    lettre: string,
  ) {
    const denominateurs = this.choixDenominateurs(choixDenominateurs)
    const a = randint(1, 9) * randint(-1, 1, 0)
    const b = randint(1, 9) * randint(-1, 1, 0)
    const signe = ['+', '-'][randint(0, 1)]
    const f1 = fraction(a, 1)
    const f2 = fraction(b, denominateurs[0])

    const texte = `$${lettre}=${f1.texFSD} ${signe} ${f2.texFraction}$`
    const { texteCorr, resultat } = this.calculSommeOuDifferenceDeDeuxFractions(
      f1,
      f2,
      signe,
      simplifier,
      lettre,
    )
    return { texte, texteCorr, resultat }
  }

  calculSommeTroisFractions(
    f1: FractionEtendue,
    f2: FractionEtendue,
    f3: FractionEtendue,
    signe1: string,
    signe2: string,
    simplifier: boolean,
    lettre: string,
  ): { texteCorr: string; resultat: FractionEtendue } {
    const resultat1 =
      signe1 === '+' ? f1.sommeFraction(f2) : f1.differenceFraction(f2)
    const resultatFinal =
      signe2 === '+'
        ? resultat1.sommeFraction(f3)
        : resultat1.differenceFraction(f3)

    let calcul = `\\begin{aligned}${lettre}&=${f1.texFSD} ${signe1} ${f2.texFraction} ${signe2} ${f3.texFraction}\\\\\n&=`
    const cm = ppcmListe([f1.den, f2.den, f3.den])
    if (cm === f1.den && cm === f2.den && cm === f3.den) {
      if ([signe1, signe2].every((s) => s === '+')) {
        calcul += calculeSomme3Fractions(f1, f2, f3, resultatFinal, simplifier)
      } else if ([signe1, signe2].every((s) => s === '-')) {
        calcul += `${f1.texFSD}+${f2.oppose().texFraction}+${f3.oppose().texFraction}\\\\
        &=${calculeSomme3Fractions(f1, f2.oppose(), f3.oppose(), resultatFinal, simplifier)}`
      }
    } else {
      calcul += `${f1.reduire(cm / f1.den).texFSD}${signe1}${
        f2.reduire(cm / f2.den).texFraction
      }${signe2}${f3.reduire(cm / f3.den).texFraction}\\\\\n`
      calcul += `&=\\dfrac{${f1.num * (cm / f1.den)}${ecritureAlgebrique(
        signe1 === '+' ? f2.num * (cm / f2.den) : -f2.num * (cm / f2.den),
      )}${ecritureAlgebrique(
        signe2 === '+' ? f3.num * (cm / f3.den) : -f3.num * (cm / f3.den),
      )}}{${cm}}\\\\\n`
      calcul += `${
        resultatFinal.estIrreductible
          ? `&=${miseEnEvidence(resultatFinal.texFSD)}`
          : simplifier
            ? `&=${resultatFinal.texFSD}\\\\
        &=${miseEnEvidence(resultatFinal.simplifie().texFSD)}`
            : `&=${miseEnEvidence(resultatFinal.texFSD)}`
      }
        \\end{aligned}`
    }
    return {
      texteCorr: `$${calcul}$`,
      resultat: resultatFinal,
    }
  }
  uneSommeOuDifferenceDeTroisFractions(
    choixDenominateurs: string,
    simplifier: boolean,
    lettre: string,
  ) {
    const denominateurs = this.choixDenominateurs(choixDenominateurs)
    const a = randint(1, 9) * randint(-1, 1, 0)
    const b = randint(1, 9) * randint(-1, 1, 0)
    const c = randint(1, 9) * randint(-1, 1, 0)
    const signe1 = ['+', '-'][randint(0, 1)]
    const signe2 = ['+', '-'][randint(0, 1)]
    const f1 = fraction(a, denominateurs[0])
    const f2 = fraction(b, denominateurs[1])
    const f3 = fraction(c, denominateurs[2])

    const texte = `$${lettre}=${f1.texFSD} ${signe1} ${f2.texFraction} ${signe2} ${f3.texFraction}$`
    const { texteCorr, resultat } = this.calculSommeTroisFractions(
      f1,
      f2,
      f3,
      signe1,
      signe2,
      simplifier,
      lettre,
    )
    return { texte, texteCorr, resultat }
  }

  uneSommeOuDifferenceDeQuatreFractions(
    choixDenominateurs: string,
    simplifier: boolean,
    lettre: string,
  ) {
    const denominateurs = this.choixDenominateurs(choixDenominateurs)
    const a = randint(1, 9, denominateurs[0]) * randint(-1, 1, 0)
    const b = randint(1, 9, denominateurs[1]) * randint(-1, 1, 0)
    const c = randint(1, 9, denominateurs[2]) * randint(-1, 1, 0)
    const d = randint(1, 9, denominateurs[3]) * randint(-1, 1, 0)
    const signe1 = ['+', '-'][randint(0, 1)]
    const signe2 = ['+', '-'][randint(0, 1)]
    const signe3 = ['+', '-'][randint(0, 1)]
    const f1 = fraction(a, denominateurs[0]).simplifie()
    const f2 = fraction(b, denominateurs[1]).simplifie()
    const f3 = fraction(c, denominateurs[2]).simplifie()
    const f4 = fraction(d, denominateurs[3]).simplifie()

    const texte = `$${lettre}=${f1.texFSD} ${signe1} ${ecritureParentheseSiMoins(f2.texFraction)} ${signe2} ${ecritureParentheseSiMoins(f3.texFraction)} ${signe3} ${ecritureParentheseSiMoins(f4.texFraction)}$`
    const cm = ppcmListe([f1.den, f2.den, f3.den, f4.den])
    const resultat1 =
      signe1 === '+' ? f1.sommeFraction(f2) : f1.differenceFraction(f2)
    const resultat2 =
      signe2 === '+'
        ? resultat1.sommeFraction(f3)
        : resultat1.differenceFraction(f3)
    const resultatFinal =
      signe3 === '+'
        ? resultat2.sommeFraction(f4)
        : resultat2.differenceFraction(f4)

    let calcul = `\\begin{aligned}${lettre}&=${f1.texFSD} ${signe1} ${ecritureParentheseSiMoins(f2.texFraction)} ${signe2} ${ecritureParentheseSiMoins(f3.texFraction)} ${signe3} ${ecritureParentheseSiMoins(f4.texFraction)}\\\\\n&=`
    calcul += `${f1.reduire(cm / f1.den).texFSD}${signe1}${ecritureParentheseSiMoins(
      f2.reduire(cm / f2.den).texFraction,
    )}${signe2}${ecritureParentheseSiMoins(f3.reduire(cm / f3.den).texFraction)}${signe3}${ecritureParentheseSiMoins(f4.reduire(cm / f4.den).texFraction)}\\\\\n`
    calcul += `&=\\dfrac{${f1.num * (cm / f1.den)}${ecritureAlgebrique(
      signe1 === '+' ? f2.num * (cm / f2.den) : -f2.num * (cm / f2.den),
    )}${ecritureAlgebrique(
      signe2 === '+' ? f3.num * (cm / f3.den) : -f3.num * (cm / f3.den),
    )}${ecritureAlgebrique(
      signe3 === '+' ? f4.num * (cm / f4.den) : -f4.num * (cm / f4.den),
    )}}{${cm}}\\\\\n`
    calcul += `${
      resultatFinal.estIrreductible
        ? `&=${miseEnEvidence(resultatFinal.texFSD)}`
        : simplifier
          ? `&=${resultatFinal.texFSD}\\\\
        &=${miseEnEvidence(resultatFinal.simplifie().texFSD)}`
          : `&=${miseEnEvidence(resultatFinal.texFSD)}`
    }
        \\end{aligned}`
    const texteCorr = `$${calcul}$`

    return {
      texte,
      texteCorr,
      resultat: resultatFinal,
    }
  }
  nouvelleVersion() {
    const params = lireFormulaireComplexe(leSuperFormulaire, this.sup)
    const choixDenominateurs = params.repartition(
      'denominateurs',
      this.nbQuestions,
    )
    const choixTypeDeQuestion = params.repartition(
      'typeDeQuestion',
      this.nbQuestions,
    )
    const simplifier = params.case('simplifier')

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 100;) {
      let texte = ''
      let texteCorr = ''
      let resultat: FractionEtendue | null = null
      const lettre = lettreDepuisChiffre(i + 1)
      switch (choixTypeDeQuestion[i]) {
        case '1':
          ;({ texte, texteCorr, resultat } =
            this.uneSommeOuDifferenceDeDeuxFractions(
              choixDenominateurs[i],
              simplifier,
              lettre,
            ))
          break
        case '2':
          ;({ texte, texteCorr, resultat } =
            this.uneSommeOuDifferenceDUnEntierEtDUneFraction(
              choixDenominateurs[i],
              simplifier,
              lettre,
            ))
          break
        case '3':
          ;({ texte, texteCorr, resultat } =
            this.uneSommeOuDifferenceDeTroisFractions(
              choixDenominateurs[i],
              simplifier,
              lettre,
            ))
          break
        case '4':
        default:
          ;({ texte, texteCorr, resultat } =
            this.uneSommeOuDifferenceDeQuatreFractions(
              choixDenominateurs[i],
              simplifier,
              lettre,
            ))
          break
      }
      texte += ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierDeBaseAvecFraction,
        { texteAvant: '<br><br>' },
      )
      if (this.questionJamaisPosee(i, texteCorr)) {
        handleAnswers(this, i, {
          reponse: {
            value: simplifier
              ? resultat.texFractionSimplifiee
              : resultat.texFraction,
            options: simplifier
              ? { fractionReduite: true }
              : { fractionEgale: true },
          },
        })
        this.listeQuestions.push(texte)
        this.listeCorrections.push(texteCorr)
        i++
      }
      cpt++
    }
  }
}
