import { propositionsQcm } from '../../lib/interactif/qcm'
import { miseEnEvidence, texteItalique } from '../../lib/outils/embellissements'
import { ajouterLien } from '../../lib/outils/enrichissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Les femmes députées : proportions et taux d'évolution (QCM)"
export const dateDePublication = '15/07/2026'
export const interactifReady = true

export const uuid = 'cf328'
export const refs = {
  'fr-fr': ['EgaliteFG5-2de-2', 'EgaliteFG6-1e-2'],
  'fr-ch': [],
}

export const tags = ['égalité filles-garçons']

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee2 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après " +
        ajouterLien(
          'https://nuage03.apps.education.fr/index.php/s/NZgmoFpcSCW8Cag?dir=/&editing=false&openfile=true',
          "« Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
        ),
    )
    this.consigne +=
      '<br><br>Le tableau suivant donne pour la France le nombre de femmes députées et le nombre total de députés pour toutes les législatures de 1945 à 2007. Ces nombres sont ceux obtenus lors des élections générales et ne tiennent pas compte des modifications intervenues en cours de législatures (démissions, élections anticipées, etc.).<br>'
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0; font-size:0.9rem;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;">Régime</th><th style="border: 1px solid #888; padding: 4px 10px;">Législature</th><th style="border: 1px solid #888; padding: 4px 10px;">Date des élections</th><th style="border: 1px solid #888; padding: 4px 10px;">Femmes députées élues</th><th style="border: 1px solid #888; padding: 4px 10px;">Total de députés élus</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Gouvernement provisoire de la République Française</td><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> Assemblée Constituante</td><td style="border: 1px solid #888; padding: 4px 10px;">Octobre 1945</td><td style="border: 1px solid #888; padding: 4px 10px;">33</td><td style="border: 1px solid #888; padding: 4px 10px;">586</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Gouvernement provisoire de la République Française</td><td style="border: 1px solid #888; padding: 4px 10px;">2<sup>e</sup> Assemblée Constituante</td><td style="border: 1px solid #888; padding: 4px 10px;">Juin 1946</td><td style="border: 1px solid #888; padding: 4px 10px;">30</td><td style="border: 1px solid #888; padding: 4px 10px;">586</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">IV<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Novembre 1946</td><td style="border: 1px solid #888; padding: 4px 10px;">42</td><td style="border: 1px solid #888; padding: 4px 10px;">619</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">IV<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">2<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Juin 1951</td><td style="border: 1px solid #888; padding: 4px 10px;">22</td><td style="border: 1px solid #888; padding: 4px 10px;">627</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">IV<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">3<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Janvier 1956</td><td style="border: 1px solid #888; padding: 4px 10px;">19</td><td style="border: 1px solid #888; padding: 4px 10px;">627</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Novembre 1958</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td><td style="border: 1px solid #888; padding: 4px 10px;">579</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">2<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Novembre 1962</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td><td style="border: 1px solid #888; padding: 4px 10px;">482</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">3<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Mars 1967</td><td style="border: 1px solid #888; padding: 4px 10px;">11</td><td style="border: 1px solid #888; padding: 4px 10px;">487</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">4<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Juin 1968</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td><td style="border: 1px solid #888; padding: 4px 10px;">487</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">5<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Mars 1973</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td><td style="border: 1px solid #888; padding: 4px 10px;">490</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">6<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">Mars 1978</td><td style="border: 1px solid #888; padding: 4px 10px;">20</td><td style="border: 1px solid #888; padding: 4px 10px;">491</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">7<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">14 et 21 juin 1981</td><td style="border: 1px solid #888; padding: 4px 10px;">26</td><td style="border: 1px solid #888; padding: 4px 10px;">491</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">8<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">16 mars 1986</td><td style="border: 1px solid #888; padding: 4px 10px;">34</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">9<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">5 et 12 juin 1988</td><td style="border: 1px solid #888; padding: 4px 10px;">33</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">10<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">21 et 28 mars 1993</td><td style="border: 1px solid #888; padding: 4px 10px;">35</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">11<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">25 mai et 1<sup>er</sup> juin 1997</td><td style="border: 1px solid #888; padding: 4px 10px;">63</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">12<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">9 et 16 juin 2002</td><td style="border: 1px solid #888; padding: 4px 10px;">71</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">V<sup>e</sup> République</td><td style="border: 1px solid #888; padding: 4px 10px;">13<sup>e</sup> législature</td><td style="border: 1px solid #888; padding: 4px 10px;">10 et 17 juin 2007</td><td style="border: 1px solid #888; padding: 4px 10px;">117</td><td style="border: 1px solid #888; padding: 4px 10px;">577</td></tr>
      </table>`
    const tableauLatex =
      '\\begin{center}\\begin{tabular}{|l|l|l|c|c|}\n\\hline\n' +
      'Régime & Législature & Date des élections & Femmes députées élues & Total de députés élus \\\\\n\\hline\n' +
      'Gouvernement provisoire & 1re Assemblée Constituante & Octobre 1945 & 33 & 586 \\\\\n\\hline\n' +
      'Gouvernement provisoire & 2e Assemblée Constituante & Juin 1946 & 30 & 586 \\\\\n\\hline\n' +
      'IVe République & 1re législature & Novembre 1946 & 42 & 619 \\\\\n\\hline\n' +
      'IVe République & 2e législature & Juin 1951 & 22 & 627 \\\\\n\\hline\n' +
      'IVe République & 3e législature & Janvier 1956 & 19 & 627 \\\\\n\\hline\n' +
      'Ve République & 1re législature & Novembre 1958 & 8 & 579 \\\\\n\\hline\n' +
      'Ve République & 2e législature & Novembre 1962 & 8 & 482 \\\\\n\\hline\n' +
      'Ve République & 3e législature & Mars 1967 & 11 & 487 \\\\\n\\hline\n' +
      'Ve République & 4e législature & Juin 1968 & 8 & 487 \\\\\n\\hline\n' +
      'Ve République & 5e législature & Mars 1973 & 8 & 490 \\\\\n\\hline\n' +
      'Ve République & 6e législature & Mars 1978 & 20 & 491 \\\\\n\\hline\n' +
      'Ve République & 7e législature & 14 et 21 juin 1981 & 26 & 491 \\\\\n\\hline\n' +
      'Ve République & 8e législature & 16 mars 1986 & 34 & 577 \\\\\n\\hline\n' +
      'Ve République & 9e législature & 5 et 12 juin 1988 & 33 & 577 \\\\\n\\hline\n' +
      'Ve République & 10e législature & 21 et 28 mars 1993 & 35 & 577 \\\\\n\\hline\n' +
      'Ve République & 11e législature & 25 mai et 1er juin 1997 & 63 & 577 \\\\\n\\hline\n' +
      'Ve République & 12e législature & 9 et 16 juin 2002 & 71 & 577 \\\\\n\\hline\n' +
      'Ve République & 13e législature & 10 et 17 juin 2007 & 117 & 577 \\\\\n\\hline\n' +
      '\\end{tabular}\\end{center}\n'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.consigne +=
      "Pour chacune des questions suivantes, une seule réponse est correcte. L'indiquer en justifiant."
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
        { texte: 'la 1ère législature de la IVe République', statut: true },
        { texte: 'la 7ème législature de la Ve République', statut: false },
      ],
    }
    const monQcm0 = propositionsQcm(this, 0)
    let texte0 = texteQ0
    if (!context.isAmc) texte0 += monQcm0.texte
    const correction0 = `$\\dfrac{33}{586}\\approx 5{,}63\\,\\%$ ; $\\dfrac{42}{619}\\approx 6{,}79\\,\\%$ ; $\\dfrac{26}{491}\\approx 5{,}30\\,\\%$. $${miseEnEvidence('\\text{La plus grande proportion est donc obtenue lors de la 1ère législature de la IVe République}')}$.`

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
    const correction1 = `$\\dfrac{117-71}{71}\\times 100=\\dfrac{46}{71}\\times 100\\approx ${miseEnEvidence('64{,}79\\,\\%')}$.`

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
    const correction2 = `$\\dfrac{117-8}{8}\\times 100=\\dfrac{109}{8}\\times 100=${miseEnEvidence('1362{,}5\\,\\%')}$.`

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
    const correction3 = `$\\dfrac{8-117}{117}\\times 100\\approx ${miseEnEvidence('-93{,}2\\,\\%')}$.`

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
    const correction4 = `La proportion passe de $0{,}0164$ (4e législature) à $0{,}0163$ (5e législature) : elle diminue, donc $${miseEnEvidence("\\text{le taux d'évolution est strictement négatif}")}$.`

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
