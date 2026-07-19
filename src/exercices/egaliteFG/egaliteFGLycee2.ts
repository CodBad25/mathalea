import { propositionsQcm } from '../../lib/interactif/qcm'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Les femmes députées : proportions et taux d\'évolution (QCM)'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'cf328'
export const refs = {
  'fr-fr': ['2A-R2-8', 'EgaliteFG5-2de-2', 'EgaliteFG6-1e-2'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee2 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      '<br><br>Voici, pour quelques législatures françaises, le nombre de femmes députées élues et le nombre total de députés élus :<br>'
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;">Législature</th><th style="border: 1px solid #888; padding: 4px 10px;">Femmes</th><th style="border: 1px solid #888; padding: 4px 10px;">Total</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> Assemblée Constituante (1945)</td><td style="border: 1px solid #888; padding: 4px 10px;">33</td><td style="border: 1px solid #888; padding: 4px 10px;">586</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> législature IV<sup>e</sup> République (1946)</td><td style="border: 1px solid #888; padding: 4px 10px;">42</td><td style="border: 1px solid #888; padding: 4px 10px;">619</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">4<sup>e</sup> législature V<sup>e</sup> République (1968)</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td><td style="border: 1px solid #888; padding: 4px 10px;">487</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">5<sup>e</sup> législature V<sup>e</sup> République (1973)</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td><td style="border: 1px solid #888; padding: 4px 10px;">490</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">7<sup>e</sup> législature V<sup>e</sup> République (1981)</td><td style="border: 1px solid #888; padding: 4px 10px;">26</td><td style="border: 1px solid #888; padding: 4px 10px;">491</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">12<sup>e</sup> législature V<sup>e</sup> République (2002)</td><td style="border: 1px solid #888; padding: 4px 10px;">71</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">13<sup>e</sup> législature V<sup>e</sup> République (2007)</td><td style="border: 1px solid #888; padding: 4px 10px;">117</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      </table>
      <p>Le plus petit nombre de femmes élues députées parmi toutes les législatures depuis 1945 est $8$, et le plus grand est $117$ (obtenu en 2007).</p>`
    const tableauLatex =
      '1re Assemblée Constituante (1945) : 33 femmes / 586. 1re législature IVe République (1946) : 42/619. 4e législature Ve République (1968) : 8/487. 5e législature (1973) : 8/490. 7e législature (1981) : 26/491. 12e législature (2002) : 71/577. 13e législature (2007) : 117/577.<br>'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.consigne += 'Pour chacune des questions suivantes, une seule réponse est correcte.'
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texteQ0 =
      'La proportion de femmes députées parmi le nombre total de députés élus est la plus grande lors de :'
    this.autoCorrection[0] = {
      enonce: texteQ0,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'la 1ère Assemblée Constituante', statut: false },
        { texte: "la 1ère législature de la IVe République", statut: true },
        { texte: "la 7ème législature de la Ve République", statut: false },
      ],
    }
    const monQcm0 = propositionsQcm(this, 0)
    let texte0 = texteQ0
    if (!context.isAmc) texte0 += monQcm0.texte
    const correction0 =
      "$\\dfrac{33}{586}\\approx 5{,}63\\,\\%$ ; $\\dfrac{42}{619}\\approx 6{,}79\\,\\%$ ; $\\dfrac{26}{491}\\approx 5{,}30\\,\\%$. La plus grande proportion est donc obtenue lors de la 1ère législature de la IVe République."

    const texteQ1 =
      "Le taux d'évolution du nombre de femmes députées, arrondi à $0{,}01\\,\\%$ près, de la 12e à la 13e législature de la Ve République est :"
    this.autoCorrection[1] = {
      enonce: texteQ1,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$39{,}32\\,\\%$', statut: false },
        { texte: '$64{,}79\\,\\%$', statut: true },
        { texte: '$46\\,\\%$', statut: false },
      ],
    }
    const monQcm1 = propositionsQcm(this, 1)
    let texte1 = texteQ1
    if (!context.isAmc) texte1 += monQcm1.texte
    const correction1 = "$\\dfrac{117-71}{71}\\times 100=\\dfrac{46}{71}\\times 100\\approx 64{,}79\\,\\%$."

    const texteQ2 =
      "Le taux d'évolution, arrondi à $0{,}1\\,\\%$ près, du plus petit au plus grand nombre de femmes élues députées est :"
    this.autoCorrection[2] = {
      enonce: texteQ2,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$1362{,}5\\,\\%$', statut: true },
        { texte: '$93{,}2\\,\\%$', statut: false },
        { texte: '$109\\,\\%$', statut: false },
      ],
    }
    const monQcm2 = propositionsQcm(this, 2)
    let texte2 = texteQ2
    if (!context.isAmc) texte2 += monQcm2.texte
    const correction2 = "$\\dfrac{117-8}{8}\\times 100=\\dfrac{109}{8}\\times 100=1362{,}5\\,\\%$."

    const texteQ3 =
      "Le taux d'évolution, arrondi à $0{,}1\\,\\%$ près, du plus grand au plus petit nombre de femmes élues députées est :"
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$-1362{,}5\\,\\%$', statut: false },
        { texte: '$-93{,}2\\,\\%$', statut: true },
        { texte: '$-109\\,\\%$', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 = "$\\dfrac{8-117}{117}\\times 100\\approx -93{,}2\\,\\%$."

    const texteQ4 =
      "$\\dfrac{8}{487}\\approx 0{,}0164$ et $\\dfrac{8}{490}\\approx 0{,}0163$ : donc le taux d'évolution de la proportion de femmes parmi les députés de la 4e à la 5e législature de la Ve République est :"
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Égal à $0$', statut: false },
        { texte: 'Strictement positif', statut: false },
        { texte: 'Strictement négatif', statut: true },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "La proportion passe de $0{,}0164$ (4e législature) à $0{,}0163$ (5e législature) : elle diminue, donc le taux d'évolution est strictement négatif."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2
    this.listeQuestions[3] = texte3
    this.listeCorrections[3] = correction3
    this.listeQuestions[4] = texte4
    this.listeCorrections[4] = correction4

    listeQuestionsToContenu(this)
  }
}
