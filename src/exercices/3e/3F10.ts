import { amcConvert } from '../../lib/amc/amcBuilders'
import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { toutAUnPoint } from '../../lib/interactif/mathLive'
import { choice, shuffle2tableaux } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { range } from '../../lib/outils/nombres'
import { numAlpha } from '../../lib/outils/outilString'
import { getLang } from '../../lib/stores/languagesStore'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Lire images et antécédents depuis un tableau de valeurs'
export const interactifReady = true
export const interactifType = 'multi-mathfield'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * @author Rémi Angot
 */
export const uuid = 'b92de'

export const refs = {
  'fr-fr': ['3F10', 'BP2AutoO1'],
  'fr-ch': ['10FA5-4', '1mF1-6'],
}
export default class ImageAntecedentDepuisTableauOuFleche extends Exercice {
  constructor() {
    super()
    this.comment = `Il existe une version CAN de cet exercice avec une seule question en « can3F16 ».`

    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const lang = getLang()
    for (
      let i = 0, texte, texteCorr, texteAMC, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      const voies = range(5).map(() => choice([true, false]))
      const a = randint(-20, 20)
      const b = randint(-20, 20, [a])
      const c = randint(-20, 20, [a, b])
      const d = randint(-20, 20, [a, b, c])
      const e = randint(-20, 20, [a, b, c, d])
      const f = randint(-20, 20, [a, b, c, d, e])
      const inversion = choice([true, false])
      // a->b ; c->d ; e->d ; d->a ; f->c
      const ligneX = [a, c, e, d, f]
      const ligneY = [b, d, d, a, c]
      shuffle2tableaux(ligneX, ligneY) // mélange les 2 lignes de la même manière
      texte = "Voici un tableau de valeurs d'une fonction $f$ : "
      texte += '<br><br>'
      texte += `$\\def\\arraystretch{1.5}\\begin{array}{|l|c|c|c|c|c|}
    \\hline
    x & ${ligneX[0]} & ${ligneX[1]} & ${ligneX[2]} & ${ligneX[3]} & ${ligneX[4]} \\\\
    \\hline
    f(x) & ${ligneY[0]} & ${ligneY[1]} & ${ligneY[2]} & ${ligneY[3]} & ${ligneY[4]} \\\\
    \\hline
    \\end{array}
    $<br><br>
    `
      if (this.interactif)
        texte +=
          "<br><br> <em>S'il y a plusieurs réponses, les séparer avec le point-virgule</em>.<br>"

      if (context.isAmc) {
        this.autoCorrectionAMC[i] = {
          enonce: texte,
          enonceAvant: true, // EE : ce champ est facultatif et permet (si false) de supprimer l'énoncé ci-dessus avant la numérotation de chaque question.
          enonceAvantUneFois: false, // EE : ce champ est facultatif et permet (si true) d'afficher l'énoncé ci-dessus une seule fois avant la numérotation de la première question de l'exercice. Ne fonctionne correctement que si l'option melange est à false.
          enonceCentre: true, // EE : ce champ est facultatif et permet (si true) de centrer le champ 'enonce' ci-dessus.}
          options: {
            multicols: true,
            barreseparation: true,
            numerotationEnonce: true,
          },
          propositions: [],
        }
        this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
      }
      const question3 = voies[2]
        ? lang === 'fr-CH'
          ? `Déterminer la préimage de $${a}$ par $f$. %{champ3}`
          : `Déterminer l'antécédent ou les antécédents de $${a}$ par la fonction $f$. %{champ3}`
        : `Déterminer le ou les nombres qui ont $${a}$ comme image par $f$. %{champ3}`
      const question4 = voies[3]
        ? lang === 'fr-CH'
          ? `Déterminer la préimage de $${d}$ par la fonction $f$. %{champ4}`
          : `Déterminer l'antécédent ou les antécédents de $${d}$ par la fonction $f$. %{champ4}`
        : `Déterminer le ou les nombres qui ont $${d}$ comme image par $f$. %{champ4}`
      texte += addMultiMathfield(this, i, {
        dataTemplate: `a) ${voies[0] ? `Quelle est l'image de $${a}$ par la fonction $f$ ? %{champ1}` : `Quel nombre $${a}$ a-t-il comme image ? %{champ1}`}
b) ${voies[1] ? `Quelle est l'image de $${c}$ par la fonction $f$ ? %{champ2}` : `Quel nombre $${c}$ a-t-il comme image ? %{champ2}`}
c) ${inversion ? question4 : question3}
d) ${inversion ? question3 : question4}
e) Compléter $f(${c})=$ %{champ5}
f) Compléter $f($%{champ6}$)=${c}$`,

        dataOptions: {
          champ1: { keyboard: KeyboardType.clavierDeBase },
          champ2: { keyboard: KeyboardType.clavierDeBase },
          champ3: {
            keyboard: inversion
              ? KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets
              : KeyboardType.clavierDeBase,
          },
          champ4: {
            keyboard: inversion
              ? KeyboardType.clavierDeBase
              : KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets,
          },
          champ5: {
            keyboard: KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets,
          },
          champ6: {
            keyboard: KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets,
          },
        },
      })
      texteAMC =
        numAlpha(0) +
        (voies[0]
          ? `Quelle est l'image de $${a}$ par la fonction $f$ ?`
          : `Quel nombre $${a}$ a-t-il comme image ?`)
      texteCorr =
        numAlpha(0) +
        (voies[0]
          ? `L'image de $${a}$ par la fonction $f$ est $${miseEnEvidence(b)}$, on note $f(${a})=${miseEnEvidence(b)}$.<br>`
          : `Le nombre $${a}$ a pour image $${miseEnEvidence(b)}$ par la fonction $f$, on note $f(${a})=${miseEnEvidence(b)}$.<br>`)
      if (context.isAmc) {
        this.autoCorrectionAMC[i].propositions?.push(
          ajouteProposition(texteAMC, b),
        )
      }

      texteAMC =
        numAlpha(1) +
        (voies[1]
          ? `Quelle est l'image de $${c}$ par la fonction $f$ ?`
          : `Quel nombre $${c}$ a-t-il comme image ?`)
      texteCorr +=
        numAlpha(1) +
        (voies[1]
          ? `L'image de $${c}$ par la fonction $f$ est $${miseEnEvidence(d)}$, on note $f(${c})=${miseEnEvidence(d)}$.`
          : `Le nombre $${c}$ a pour image $${miseEnEvidence(d)}$ par la fonction $f$, on note $f(${c})=${miseEnEvidence(d)}$.`)
      if (context.isAmc) {
        this.autoCorrectionAMC[i].propositions?.push(
          ajouteProposition(texteAMC, d),
        )
      }

      const texteCorr3 = voies[2]
        ? `$${a}$ a ${lang === 'fr-CH' ? 'un seul élément dans la préimage' : 'un seul antécédent'} par la fonction $f$ qui est $${miseEnEvidence(d)}$, on note $f(${miseEnEvidence(d)})=${a}$.`
        : `Le nombre $${miseEnEvidence(d)}$ a pour image $${a}$ par la fonction $f$, donc $f(${miseEnEvidence(d)})=${a}$.`
      if (context.isAmc) {
        this.autoCorrectionAMC[i].propositions?.push(
          ajouteProposition(
            numAlpha(2) +
              `Déterminer un antécédent de $${a}$ par la fonction $f$.`,
            d,
          ),
        )
      }

      const texteCorr4 = voies[3]
        ? lang === 'fr-CH'
          ? `$${d}$ a deux éléments dans la préimage : $${miseEnEvidence(c)}$ et $${miseEnEvidence(e)}$, on note $f(${miseEnEvidence(c)})=f(${miseEnEvidence(e)})=${d}$.`
          : `$${d}$ a deux antécédents : $${miseEnEvidence(c)}$ et $${miseEnEvidence(e)}$, on note $f(${miseEnEvidence(c)})=f(${miseEnEvidence(e)})=${d}$.`
        : `$${miseEnEvidence(c)}$ et $${miseEnEvidence(e)}$ ont pour image $${d}$ par la fonction $f$, on note $f(${miseEnEvidence(c)})=f(${miseEnEvidence(e)})=${d}$.`
      if (context.isAmc) {
        this.autoCorrectionAMC[i].propositions?.push(
          ajouteProposition(
            numAlpha(3) +
              `Déterminer un antécédent de $${d}$ par la fonction $f$.`,
            c,
          ),
        )
      }

      if (choice([true, false])) {
        // Une fois sur 2 on inverse les questions 3 et 4
        texteCorr +=
          '<br>' + numAlpha(2) + texteCorr3 + '<br>' + numAlpha(3) + texteCorr4
      } else {
        texteCorr +=
          '<br>' + numAlpha(2) + texteCorr4 + '<br>' + numAlpha(3) + texteCorr3
      }

      texteCorr += '<br>' + numAlpha(4) + `$f(${c})=${miseEnEvidence(d)}$`
      if (context.isAmc) {
        this.autoCorrectionAMC[i].propositions?.push(
          ajouteProposition(numAlpha(4) + `Compléter : $f(${c})=\\ldots$`, d),
        )
      }

      texteCorr += '<br>' + numAlpha(5) + `$f(${miseEnEvidence(f)})=${c}$`
      handleAnswers(
        this,
        i,
        {
          bareme: toutAUnPoint,
          champ1: { value: b },
          champ2: { value: d },
          champ3: inversion
            ? { value: `${e};${c}`, options: { suiteDeNombres: true } }
            : { value: d },
          champ4: inversion
            ? { value: d }
            : { value: `${e};${c}`, options: { suiteDeNombres: true } },
          champ5: { value: d },
          champ6: { value: f },
        },
        {
          formatInteractif: 'multi-mathfield',
        },
      )
      if (context.isAmc) {
        this.autoCorrectionAMC[i].propositions?.push(
          ajouteProposition(numAlpha(5) + `Compléter : $f(\\ldots)=${c}$`, f),
        )
      }

      if (this.questionJamaisPosee(i, [a, b, c, d, e, f].join(''))) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}

function ajouteProposition(texteProposition: string, nombre: number) {
  return {
    type: 'AMCNum', // on donne le type de la première question-réponse qcmMono, qcmMult, AMCNum, AMCOpen
    propositions: [
      // une ou plusieurs (Qcms) 'propositions'
      {
        texte: '', // Facultatif. la proposition de Qcm ou ce qui est affiché dans le corrigé pour cette question quand ce n'est pas un Qcm
        reponse: {
          // utilisé si type = 'AMCNum'
          texte: texteProposition, // facultatif
          valeur: nombre, // obligatoire (la réponse numérique à comparer à celle de l'élève). EE : Si une fraction est la réponse, mettre un tableau sous la forme [num,den]
          alignement: 'center', // EE : ce champ est facultatif et n'est fonctionnel que pour l'hybride. Il permet de choisir où les cases sont disposées sur la feuille. Par défaut, c'est comme le texte qui le précède. Pour mettre à gauche, au centre ou à droite, choisir parmi ('flushleft', 'center', 'flushright').
          param: {
            digits: 2, // obligatoire pour AMC (le nombre de chiffres dans le nombre, si digits est mis à 0, alors il sera déterminé pour coller au nombre décimal demandé)
            decimals: 0, // obligatoire pour AMC (le nombre de chiffres dans la partie décimale du nombre, si decimals est mis à 0, alors il sera déterminé pour coller au nombre décimal demandé)
            signe: true, // obligatoire pour AMC (présence d'une case + ou -)
            approx: 0, // (0 = valeur exacte attendue, sinon valeur de tolérance (voir explication détaillée dans type AMCNum))
          },
        },
      },
    ],
  }
}
