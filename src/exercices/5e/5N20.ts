import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { sp } from '../../lib/outils/outilString'
import { pgcd } from '../../lib/outils/primalite'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
export const dateDeModifImportante = '04/12/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = ['qcm', 'mathLive']
export const titre =
  'Additionner ou soustraire deux fractions positives (dénominateurs multiples)'
/**
 * Effectuer l'addition ou la soustraction de deux fractions dont un dénominateur est un multiple de l'autre.
 * Les numérateurs peuvent être positifs ou négatifs.
 *
 * Le coefficient est paramétrable, par défaut il est inférieur à 11.
 *
 * On peut paramétrer de n'avoir que des soustractions.
 * @author Rémi Angot, modifié par Eric Elter
 * Modif : Rajout des numérateurs négatifs par Eric Elter
 */
export const uuid = 'd5ee3'
export const refs = {
  'fr-fr': ['5N20', 'BP2AutoH22'],
  'fr-ch': ['9NO13-6'],
}
export default class ExerciceAdditionnerSoustraireFractions5ebis extends Exercice {
  level: number
  constructor() {
    super()
    this.sup = 11 // Correspond au facteur commun
    this.sup2 = 3 // Si 1 alors il n'y aura pas de soustraction
    this.sup3 = true // Si false alors le résultat n'est pas en fraction simplifiée
    this.sup4 = true // QCM pour l'interactif
    this.sup5 = 0 // Pourcentage de fractions avec numérateur négatif
    this.spacing = 2
    this.spacingCorr = 2
    this.nbQuestions = 5
    this.besoinFormulaireNumerique = [
      'Valeur maximale du coefficient multiplicateur',
      99999,
    ]
    this.besoinFormulaire2Numerique = [
      'Type de calculs',
      3,
      '1 : Additions\n2 : Soustractions\n3 : Mélange',
    ]
    this.besoinFormulaire3CaseACocher = [
      "Avec l'écriture simplifiée de la fraction résultat",
    ]
    this.besoinFormulaire4CaseACocher = ["QCM pour l'interactif"]
    this.besoinFormulaire5Numerique = [
      'Pourcentage de fractions avec numérateur négatif',
      100,
    ]
    this.level = 5
  }

  nouvelleVersion() {
    if (this.sup3 && !context.isAmc) {
      this.consigne = 'Calculer'
      this.consigne += this.interactif
        ? ' au brouillon et indiquer seulement le résultat final simplifié au maximum.'
        : ' et simplifier au maximum le résultat.'
    } else {
      if (context.isAmc) {
        this.consigne =
          'Calculer et choisir parmi les réponses proposées la bonne réponse.'
      } else {
        this.consigne = 'Calculer'
        this.consigne += this.interactif
          ? ' au brouillon et indiquer seulement le résultat final.'
          : '.'
      }
    }

    let listeTypeDeQuestions

    if (this.sup2 === 1) {
      listeTypeDeQuestions = combinaisonListes(['+'], this.nbQuestions)
    } else if (this.sup2 === 2) {
      listeTypeDeQuestions = combinaisonListes(['-'], this.nbQuestions)
    } else {
      listeTypeDeQuestions = combinaisonListes(['+', '-'], this.nbQuestions)
    }

    this.interactifType = this.sup4 ? 'qcm' : 'mathLive'

    for (
      let i = 0, a, b, c, d, k, s, ordreDesFractions, texte, texteCorr;
      i < this.nbQuestions;
    ) {
      this.autoCorrection[i] = {}
      texte = ''
      texteCorr = ''

      // Décision si les numérateurs seront négatifs ou non
      const aNegatif = randint(1, 100) <= this.sup5
      const cNegatif = randint(1, 100) <= this.sup5

      // Les numérateurs (positifs ou négatifs selon décision précédente)
      a = randint(1, 9) * (aNegatif ? -1 : 1)

      // Les dénominateurs (toujours positifs)
      b = randint(2, 9, Math.abs(a))

      if (this.sup > 1) {
        k = randint(2, this.sup)
      } else k = 1

      d = b * k

      if (listeTypeDeQuestions[i] === '-') {
        c =
          choice([randint(1, b * k), randint(b * k, 9 * k)]) *
          (cNegatif ? -1 : 1)
      } else {
        c = randint(1, 19, d) * (cNegatif ? -1 : 1)
      }

      let f1 = new FractionEtendue(a, b)
      let f2 = new FractionEtendue(c, d)

      if (listeTypeDeQuestions[i] === '+') {
        // une addition
        if (
          !context.isAmc ||
          (this.interactif && this.interactifType === 'qcm')
        ) {
          /** ***************** Choix des réponses du QCM ***********************************/
          this.autoCorrection[i].propositions = [
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a * k + c, d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a * k + c, d).texFraction}$`,
              statut: true,
            },
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a + c, d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a + c, d).texFraction}$`,
              statut: false,
            },
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a + c, b + d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a + c, b + d).texFraction}$`,
              statut: false,
            },
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a * c, d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a * c, d).texFraction}$`,
              statut: false,
            },
          ]
          this.autoCorrection[i].options = {
            ordered: false,
            lastChoice: 5,
          }
          if (this.level === 6) {
            // En 6e, pas de fraction simplifiée
            // Les fractions ont le même dénominateur (b=d)
            // @ts-expect-error
            this.autoCorrection[i].propositions[0].texte =
              `$${new FractionEtendue(a + c, b).texFraction}$`
          }
          /*************************************************************************/
        }

        ordreDesFractions = randint(1, 2)

        if (ordreDesFractions === 1) {
          texte = `$${f1.texFraction}+${f2.texFraction}$`
          /** ****************** AMC question/questionmult ********************************/
          this.autoCorrection[i].enonce = `${texte}\n`
          /*******************************************************************************/
        } else {
          texte = `$${f2.texFraction}+${f1.texFraction}$`
          /** ****************** AMC question/questionmult ******************************/
          this.autoCorrection[i].enonce = `${texte}\n`
          /*******************************************************************************/
        }

        if (ordreDesFractions === 1) {
          texteCorr = `$${f1.texFraction}+${f2.texFraction}=`
          texte = `$${f1.texFraction}+${f2.texFraction}$`
          if (this.level !== 6 && this.sup !== 1) {
            texteCorr += `\\dfrac{${a}${miseEnEvidence('\\times ' + k, 'blue')}}{${b}${miseEnEvidence('\\times ' + k, 'blue')}}+${f2.texFraction}=${new FractionEtendue(a * k, b * k).texFraction}+${f2.texFraction}=`
          }
          texteCorr += `\\dfrac{${a * k}+${ecritureParentheseSiNegatif(c)}}{${d}}=${new FractionEtendue(a * k + c, d).texFraction}`
        } else {
          texteCorr = `$${f2.texFraction}+${f1.texFraction}=`
          texte = `$${f2.texFraction}+${f1.texFraction}$`
          if (this.level !== 6 && this.sup !== 1) {
            texteCorr += `${f2.texFraction}+\\dfrac{${a}${miseEnEvidence('\\times ' + k, 'blue')}}{${b}${miseEnEvidence('\\times ' + k, 'blue')}}=${f2.texFraction}+${new FractionEtendue(a * k, b * k).texFraction}=`
          }

          texteCorr += `\\dfrac{${c}+${ecritureParentheseSiNegatif(a * k)}}{${d}}=${new FractionEtendue(a * k + c, d).texFraction}`
        }
        texteCorr +=
          a * k + c < 0 ? `=${new FractionEtendue(a * k + c, d).texFSD}$` : '$'

        // Est-ce que le résultat est simplifiable ?
        if (this.sup3) {
          s = pgcd(Math.abs(a * k + c), d)
          if (s !== 1) {
            if (a * k + c < 0) {
              texteCorr += `$=-\\dfrac{${Math.abs(a * k + c) / s}${miseEnEvidence('\\times ' + s, 'blue')}}{${d / s}${miseEnEvidence('\\times ' + s, 'blue')}}=${new FractionEtendue((a * k + c) / s, d / s).texFractionSimplifiee}$`
            } else {
              texteCorr += `$=\\dfrac{${(a * k + c) / s}${miseEnEvidence('\\times ' + s, 'blue')}}{${d / s}${miseEnEvidence('\\times ' + s, 'blue')}}=${new FractionEtendue((a * k + c) / s, d / s).texFractionSimplifiee}$`
            }
          }
        }

        if (!context.isAmc) {
          if (this.interactif && this.interactifType === 'qcm') {
            const props = propositionsQcm(this, i)
            texte += '<br>' + props.texte
          } else if (this.interactifType === 'mathLive') {
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBaseAvecFraction,
              { texteAvant: sp() + '$=$' },
            )
            handleAnswers(this, i, {
              reponse: {
                value: new FractionEtendue(a * k + c, d).toLatex(),
                options: {
                  fractionIrreductible: this.sup3,
                  fractionEgale: !this.sup3,
                },
              },
            })
          }
        }
      } else {
        // une soustraction
        /** ***************** Choix des réponses du QCM ***********************************/
        if (
          !context.isAmc ||
          (this.interactif && this.interactifType === 'qcm')
        ) {
          this.autoCorrection[i].propositions = [
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a * k - c, d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a * k - c, d).texFraction}$`,
              statut: true,
            },
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a - c, b + d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a - c, b + d).texFraction}$`,
              statut: false,
            },
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a - c, d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a - c, d).texFraction}$`,
              statut: false,
            },
            {
              texte: this.sup3
                ? `$${new FractionEtendue(a * c, d).texFractionSimplifiee}$`
                : `$${new FractionEtendue(a * c, d).texFraction}$`,
              statut: false,
            },
          ]
          this.autoCorrection[i].options = {
            ordered: false,
            lastChoice: 5,
          }
          if (this.level === 6) {
            // En 6e, pas de fraction simplifiée
            // Les fractions ont le même dénominateur (b=d)
            // @ts-expect-error
            this.autoCorrection[i].propositions[0].texte =
              `$${new FractionEtendue(a - c, b).texFraction}$`
          }
          /*********************************************************************************/
        }

        // S'il y a 0% de numérateur négatifs alors on
        // interchange f1 et f2 pour s'assurer que le résultat sera positif
        const f2PlusGdQuef1 = this.sup5 === 0 && f2.superieurstrict(f1)
        if (f2PlusGdQuef1) {
          ;[f2, f1] = [f1, f2]
          ;[a, b, c, d] = [c, d, a, b]
        }

        texte = `$${f1.texFraction}-${f2.texFraction}$`
        const reponse = new FractionEtendue(
          f2PlusGdQuef1 ? a - c * k : a * k - c,
          f2PlusGdQuef1 ? b : d,
        ).toLatex()

        texteCorr = `$${f1.texFraction}-${f2.texFraction}=`
        if (this.level !== 6 && this.sup !== 1) {
          texteCorr += f2PlusGdQuef1
            ? `${f1.texFraction}-\\dfrac{${c}${miseEnEvidence('\\times ' + k, 'blue')}}{${d}${miseEnEvidence('\\times ' + k, 'blue')}}=${f1.texFraction}-${new FractionEtendue(c * k, b).texFraction}=`
            : `\\dfrac{${a}${miseEnEvidence('\\times ' + k, 'blue')}}{${b}${miseEnEvidence('\\times ' + k, 'blue')}}-${f2.texFraction}=${new FractionEtendue(a * k, b * k).texFraction}-${f2.texFraction}=`
        }
        texteCorr += f2PlusGdQuef1
          ? `\\dfrac{${a}-${ecritureParentheseSiNegatif(c * k)}}{${d * k}}=${new FractionEtendue(a - c * k, b).texFraction}`
          : `\\dfrac{${a * k}-${ecritureParentheseSiNegatif(c)}}{${d}}=${new FractionEtendue(a * k - c, d).texFraction}`
        texteCorr += f2PlusGdQuef1
          ? a - c * k < 0
            ? `=${new FractionEtendue(a - c * k, b).texFSD}$`
            : '$'
          : a * k - c < 0
            ? `=${new FractionEtendue(a * k - c, d).texFSD}$`
            : '$'

        // Est-ce que le résultat est simplifiable ?
        if (this.sup3) {
          const numerateur = f2PlusGdQuef1 ? a - c * k : a * k - c
          const denominateur = f2PlusGdQuef1 ? b : d
          s = pgcd(Math.abs(numerateur), denominateur)
          if (Math.abs(numerateur) % denominateur === 0) {
            // Si la fraction peut être un nombre entier
            texteCorr += `$=${texNombre(numerateur / denominateur, 0)}$`
          } else if (s !== 1) {
            if (numerateur < 0) {
              texteCorr += `$=-\\dfrac{${Math.abs(numerateur) / s}${miseEnEvidence('\\times ' + s, 'blue')}}{${denominateur / s}${miseEnEvidence('\\times ' + s, 'blue')}}=${new FractionEtendue(numerateur / s, denominateur / s).texFractionSimplifiee}$`
            } else {
              texteCorr += `$=\\dfrac{${numerateur / s}${miseEnEvidence('\\times ' + s, 'blue')}}{${denominateur / s}${miseEnEvidence('\\times ' + s, 'blue')}}=${new FractionEtendue(numerateur / s, denominateur / s).texFractionSimplifiee}$`
            }
          }
        }

        if (!context.isAmc) {
          if (this.interactif && this.interactifType === 'qcm') {
            const props = propositionsQcm(this, i)
            texte += '<br>' + props.texte
          } else if (this.interactifType === 'mathLive') {
            texte += ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBaseAvecFraction,
              { texteAvant: sp() + '$=$' },
            )
            handleAnswers(this, i, {
              reponse: {
                value: reponse,
                options: {
                  fractionIrreductible: this.sup3,
                  fractionEgale: !this.sup3,
                },
              },
            })
          }
        }
      }

      texte = texte.replaceAll('$$', ' ')
      texteCorr = texteCorr.replaceAll('$$', ' ')

      if (context.isAmc) {
        this.autoCorrection[i].enonce = texte
      }

      // Uniformisation : Mise en place de la réponse attendue en interactif en orange et gras
      const textCorrSplit = texteCorr.split('=')
      let aRemplacer = textCorrSplit[textCorrSplit.length - 1]
      aRemplacer = aRemplacer.replace('$', '').replace('<br>', '')
      texteCorr = ''
      for (let ee = 0; ee < textCorrSplit.length - 1; ee++) {
        texteCorr += textCorrSplit[ee] + '='
      }
      texteCorr += `$ $${miseEnEvidence(aRemplacer)}$`
      // Fin de cette uniformisation

      if (this.questionJamaisPosee(i, a, k, b, c)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
    }

    listeQuestionsToContenu(this) // Espacement de 2 em entre chaque questions.
  }
}
