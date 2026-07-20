import { propositionsQcm } from '../../lib/interactif/qcm'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Sophie Germain : un QCM mystère'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = '26077'
export const refs = {
  'fr-fr': ['3L1-4', '3G22-2', 'EgaliteFG4-3e-19'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG19 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Sophie Germain (1776-1831), mathématicienne autodidacte, a dû apprendre les mathématiques seule et se faire passer pour un homme pour avoir accès aux travaux scientifiques de son époque. Ses travaux sur l'élasticité et la résistance des surfaces ont contribué, bien des années après sa mort, aux théories mathématiques utilisées pour construire un monument célèbre.<br>" +
      'Pour chaque question du QCM suivant, une seule réponse est exacte.'
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texteQ0 = 'Le résultat de $2+\\dfrac{4}{3}$ est :'
    this.autoCorrection[0] = {
      enonce: texteQ0,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$\\dfrac{10}{3}$', statut: true },
        { texte: '$\\dfrac{6}{3}$', statut: false },
        { texte: '$3{,}333$', statut: false },
      ],
    }
    const monQcm0 = propositionsQcm(this, 0)
    let texte0 = texteQ0
    if (!context.isAmc) texte0 += monQcm0.texte
    const correction0 = "$2+\\dfrac{4}{3}=\\dfrac{6}{3}+\\dfrac{4}{3}=\\dfrac{10}{3}$ : la réponse exacte est $\\dfrac{10}{3}$ (réponse A)."

    const texteQ1 = "L'expression factorisée de $(2x-1)(3x-4)-(3x-4)^2$ est :"
    this.autoCorrection[1] = {
      enonce: texteQ1,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$(3x-4)(-x+3)$', statut: true },
        { texte: '$(3x-4)(5x-5)$', statut: false },
        { texte: '$(3x-4)(x-3)$', statut: false },
      ],
    }
    const monQcm1 = propositionsQcm(this, 1)
    let texte1 = texteQ1
    if (!context.isAmc) texte1 += monQcm1.texte
    const correction1 =
      "$(2x-1)(3x-4)-(3x-4)^2=(3x-4)\\big[(2x-1)-(3x-4)\\big]=(3x-4)(-x+3)$ (réponse A)."

    const texteQ2 =
      'Pour cette desserte en bois, les points $B$, $O$, $C$, ainsi que les points $A$, $O$, $D$, sont alignés, avec $AB=76$ cm, $OB=45$ cm, $OC=50$ cm et $CD=100$ cm. Alors, on peut dire que :'
    this.autoCorrection[2] = {
      enonce: texteQ2,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$(AB)\\ \\text{//}\\ (CD)$', statut: false },
        { texte: '$(AB)$ et $(CD)$ ne sont pas parallèles', statut: false },
        { texte: 'On ne peut rien dire', statut: true },
      ],
    }
    const monQcm2 = propositionsQcm(this, 2)
    let texte2 = texteQ2
    if (!context.isAmc) texte2 += monQcm2.texte
    const correction2 =
      "Pour appliquer la réciproque du théorème de Thalès dans la configuration où $(BOC)$ et $(AOD)$ sont deux droites sécantes en $O$, il faudrait connaître les longueurs $OA$ et $OD$ (et non les longueurs externes $AB$ et $CD$). Faute de connaître $OA$ et $OD$, on ne peut donc rien conclure sur le parallélisme de $(AB)$ et $(CD)$ avec les seules informations données (réponse C)."

    const texteQ3 =
      'Dans un triangle $RST$ tel que $RS=8$ cm, $RT=4{,}5$ cm et $ST=9{,}2$ cm, on peut dire que :'
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$RST$ est un triangle rectangle', statut: false },
        { texte: 'On ne peut rien dire', statut: false },
        { texte: "$RST$ n'est pas un triangle rectangle", statut: true },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      "Le plus grand côté est $[ST]$ : $ST^2=9{,}2^2=84{,}64$. Or $RS^2+RT^2=8^2+4{,}5^2=64+20{,}25=84{,}25$. Comme $84{,}64\\neq 84{,}25$, le triangle $RST$ n'est pas rectangle (réponse C)."

    const texteQ4 =
      'En comptant le nombre de réponses A obtenues aux quatre questions précédentes, quelle construction célèbre a été rendue possible grâce aux travaux de Sophie Germain ?'
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'La Sagrada Familia (Barcelone)', statut: false },
        { texte: 'La tour Eiffel (Paris)', statut: true },
        { texte: 'La tour Perret (Grenoble)', statut: false },
        { texte: 'La statue de la Liberté (New York)', statut: false },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "Les réponses A sont obtenues aux questions $1$ et $2$ (soit $2$ réponses A) : c'est donc la tour Eiffel, comme l'indique le texte introductif sur les travaux de Sophie Germain sur l'élasticité et la résistance des surfaces."

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
