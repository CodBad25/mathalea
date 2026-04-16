import Figure from 'apigeom/src/Figure'
import handleApigeomFigureElement from '../../lib/apigeom/apigeom-figure'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'
import { context } from '../../modules/context'
import FractionEtendue from '../../modules/FractionEtendue'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'
import { bleuMathalea } from '../../lib/colors'

export const titre =
  'Décomposer une fraction (partie entière + fraction inférieure à 1)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '24/11/2024'

/**
 * Amélioration d'un exercice de Rémi Angot
 * @author Guillaume Valmont
 */
export const uuid = '6c8a1'
export const refs = {
  'fr-fr': ['auto6N2B-6'],
  'fr-2016': ['6N20'],
  'fr-ch': ['9NO10-9'],
}
export default class ExerciceFractionsDecomposer extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 5
    this.consigne =
      "Écrire sous la forme de la somme d'un nombre entier et d'une fraction inférieure à 1."
    this.spacing = 2
    this.spacingCorr = 2
    this.nbCols = 2
    this.nbColsCorr = 2
    this.sup = '2-3-4-5-6-7-8-9-10-11'
    this.sup2 = '1-2-3'
    this.sup3 = true
    this.besoinFormulaireTexte = [
      'Dénominateurs',
      'Nombres séparés par des tirets :\n(de 2 à 11 par défaut)',
    ]
    this.besoinFormulaire2Texte = [
      'Parties entières',
      'Nombres séparés par des tirets :\n(de 1 à 3 par défaut)',
    ]
    this.besoinFormulaire3CaseACocher = ['Brouillon interactif']
  }

  nouvelleVersion() {
    if (this.sup3 && context.isHtml) {
      const figure = new Figure({
        xMin: -0.5,
        yMin: -2,
        width: 800,
        height: 120,
      })
      figure.options.automaticUserMessage = false
      figure.options.color = bleuMathalea
      figure.create('RectangleFractionDiagram', {
        denominator: 2,
        numberOfRectangles: 5,
      })
      handleApigeomFigureElement()
      this.introduction = `<apigeom-figure interactive default-action='FILL' x-min=${figure.xMin} y-min=${figure.yMin} width=${figure.width} height=${figure.height} numero-exercice=${this.numeroExercice} index=0 auto-index><script type="application/json">${figure.json}</script></apigeom-figure>`
    } else {
      this.introduction = ''
    }
    const listeDenominateurs = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 2,
      max: 1000,
      defaut: 1000,
      melange: 0,
      shuffle: true,
      nbQuestions: this.nbQuestions,
    }).map((element) => Number(element))
    const listePartiesEntieres = gestionnaireFormulaireTexte({
      saisie: this.sup2,
      min: 1,
      max: 1000,
      defaut: 1000,
      melange: 0,
      shuffle: true,
      nbQuestions: this.nbQuestions,
    }).map((element) => Number(element))
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const denominateur =
        listeDenominateurs[cpt % this.nbQuestions] === 1000
          ? randint(2, 11)
          : listeDenominateurs[cpt % this.nbQuestions]
      const partieFractionnaire = randint(1, denominateur - 1)
      const partieEntiere =
        listePartiesEntieres[cpt % this.nbQuestions] === 1000
          ? randint(1, 3)
          : listePartiesEntieres[cpt % this.nbQuestions]
      const total = partieEntiere * denominateur + partieFractionnaire

      const fraction = new FractionEtendue(total, denominateur).toLatex()
      const fractionReste = new FractionEtendue(
        partieFractionnaire,
        denominateur,
      ).toLatex()

      const texte = remplisLesBlancs(
        this,
        i,
        `\\dfrac{${total}}{${denominateur}}~=~%{champ1} + \\dfrac{%{champ2}}{%{champ3}}`,
      )
      const texteCorr = `$${fraction} = ${partieEntiere} + ${fractionReste} $`
      handleAnswers(
        this,
        i,
        {
          champ1: { value: String(partieEntiere) },
          champ2: { value: String(partieFractionnaire) },
          champ3: { value: String(denominateur) },
        },
        { formatInteractif: 'fillInTheBlank' },
      )
      if (this.questionJamaisPosee(i, total, denominateur)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
