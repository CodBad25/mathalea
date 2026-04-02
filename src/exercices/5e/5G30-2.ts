import { pickRandom } from 'mathjs'
import { arcPointPointAngle } from '../../lib/2d/Arc'
import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { point } from '../../lib/2d/PointAbstrait'
import { labelPoint } from '../../lib/2d/textes'
import { texteSurArc } from '../../lib/2d/TexteSurArc'
import { homothetie, rotation, translation } from '../../lib/2d/transformations'
import { vecteur } from '../../lib/2d/Vecteur'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
  texteGras,
} from '../../lib/outils/embellissements'
import { abs } from '../../lib/outils/nombres'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'
export const titre = 'Effectuer des liens entre angles et parallélisme'
export const dateDePublication = '15/01/2022'
export const dateDeModifImportante = '24/12/2025'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = 'qcm'

function aleaName(names = [], n = names.length, result = []) {
  const r = Math.floor(Math.random() * names.length)
  result.push(names[r])
  names.splice(r, 1)
  if (result.length === n) {
    return result
  } else {
    return aleaName(names, n, result)
  }
}

function anglesSecantes(A, rot = { O: 60, A: 0 }) {
  const s = rotation(translation(A, vecteur(1, 0)), A, rot.A)
  const S = rotation(translation(A, vecteur(3, 0)), A, rot.A)
  const t = rotation(s, A, 180)
  const T = rotation(S, A, 180)
  const x = rotation(translation(A, vecteur(1, 0)), A, rot.O)
  const X = rotation(translation(A, vecteur(3, 0)), A, rot.O)
  const Ox = rotation(x, A, 180)
  const OX = rotation(X, A, 180)
  return {
    a: arcPointPointAngle(s, x, rot.O - rot.A, true, 'blue'),
    b: arcPointPointAngle(x, t, 180 - (rot.O - rot.A), true, 'green'),
    c: arcPointPointAngle(t, Ox, rot.O - rot.A, true, 'red'),
    d: arcPointPointAngle(Ox, s, 180 - (rot.O - rot.A), true, 'gray'),
    s,
    S,
    t,
    T,
    x,
    X,
    Ox,
    OX,
    As: droite(A, s),
    Ax: droite(A, x),
    A,
    labela: texteSurArc(
      ((rot.O - rot.A) % 180) + '°',
      s,
      x,
      rot.O - rot.A,
      'black',
      0.7,
    ),
    labelb: texteSurArc(
      ((180 - (rot.O - rot.A)) % 180) + '°',
      x,
      t,
      180 - (rot.O - rot.A),
      'black',
      0.7,
    ),
    labelc: texteSurArc(
      ((rot.O - rot.A) % 180) + '°',
      t,
      Ox,
      rot.O - rot.A,
      'black',
      0.7,
    ),
    labeld: texteSurArc(
      ((180 - (rot.O - rot.A)) % 180) + '°',
      Ox,
      s,
      180 - (rot.O - rot.A),
      'black',
      0.7,
    ),
  }
}

/**
 * Effectuer des liens entre angles et parallélisme
 * @author Frédéric PIOU
 * rendu interactif par Guillaume Valmont le 21/01/2024
 */
export const uuid = '19812'

export const refs = {
  'fr-fr': ['5G30-2'],
  'fr-ch': ['11ES2-2', '1mG1-4'],
}
export default class ExercicesAnglesAIC extends Exercice {
  constructor() {
    super()

    const formulaire = [
      '1 : Angles marqués alternes-internes ou correspondants ?',
      '2 : Déterminer si des droites sont parallèles (angles marqués).',
      '3 : Déterminer si des droites sont parallèles (angles nommés).',
      "4 : Calculer la mesure d'un angle (angles marqués).",
      "5 : Calculer la mesure d'un angle (angles nommés).",
      '6 : Marquer un angle alterne-interne ou correspondant à un angle marqué.',
      '7 : Nommer un angle alterne-interne ou correspondant à un angle nommé.',
      '8 : Mélange',
    ]

    this.nbQuestions = 1
    this.besoinFormulaireTexte = [
      'Type de questions',
      'Nombres séparés par des tirets :\n' + formulaire.join('\n'),
    ]

    this.nbCols = 2
    this.nbColsCorr = 2

    context.isHtml ? (this.spacing = 1.75) : (this.spacing = 0)
    context.isHtml ? (this.spacingCorr = 1.75) : (this.spacingCorr = 0)
    this.sup = 8 // Type d'exercice
    this.nbQuestions = 3
  }

  nouvelleVersion() {
    const nquestion = gestionnaireFormulaireTexte({
      saisie: this.sup,
      max: 7,
      defaut: 8,
      melange: 8,
      nbQuestions: this.nbQuestions,
      shuffle: true,
    })

    for (let i = 0, exercice, cpt = 0; i < this.nbQuestions && cpt < 100; ) {
      // Boucle principale où i+1 correspond au numéro de la question
      const propositions = []
      let options = { ordered: true }
      switch (
        nquestion[i] // Chaque question peut être d'un type différent, ici 4 cas sont prévus...
      ) {
        case 1: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          let param
          do {
            const createVariables = (O, A, B) => ({
              O,
              A,
              B,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(
              randint(0, 90),
              randint(-90, 0),
              randint(-90, 0),
            )
          } while (
            !(
              abs(param.O - abs(param.A)) > 30 &&
              abs(param.O - abs(param.B)) > 30
            )
          )
          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.7
            anglesB[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesB[i].opaciteDeRemplissage = 0.7
          }
          const ab = choice([
            choice(['aa', 'bb', 'cc', 'dd']),
            choice(['ca', 'db']),
            choice(['a', 'b', 'c', 'd']) + choice(['a', 'b', 'c', 'd']),
          ])
          const a = ab[0]
          const b = ab[1]
          objetsEnonce.push(
            anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB[b],
            anglesB.As,
            anglesB.Ax,
            anglesA['label' + a],
            anglesB['label' + b],
          )

          const paramsEnonce = fixeBordures([
            ...Object.keys(anglesA).map((key) => {
              return anglesA[key]
            }),
            ...Object.keys(anglesB).map((key) => {
              return anglesB[key]
            }),
          ])
          // On copie tout le contenu de objetsEnonce dans objetsCorrection
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })
          // ici sont créés les texte, tex_corr, objets mathalea2d divers entrant dans le contenu de l'exercice
          let texte =
            "Les angles marqués sont-ils alternes-internes, correspondants ou ni l'un, ni l'autre ?<br>"
          let reponse
          let reponseCorrecte
          if (a === b) {
            reponse = `sont ${texteEnCouleurEtGras('correspondants')}`
            reponseCorrecte = 'correspondants'
          } else if (a + b === 'ca' || a + b === 'db') {
            reponse = `sont ${texteEnCouleurEtGras('alternes-internes')}`
            reponseCorrecte = 'alternes-internes'
          } else {
            reponse = `ne sont ${texteEnCouleurEtGras('ni alternes-internes')}, ${texteEnCouleurEtGras('ni correspondants')}`
            reponseCorrecte = "ni l'un ni l'autre"
          }
          const texteCorr = `Par définition, les angles marqués ${reponse}.`
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          propositions.push({
            texte: 'alternes-internes',
            statut: reponseCorrecte === 'alternes-internes',
          })
          propositions.push({
            texte: 'correspondants',
            statut: reponseCorrecte === 'correspondants',
          })
          propositions.push({
            texte: "ni l'un ni l'autre",
            statut: reponseCorrecte === "ni l'un ni l'autre",
          })
          break
        }
        case 2: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          /* const param = aleaVariables(
            {
              O: 'randomInt(0,90)',
              A: 'randomInt(-90,90)',
              B: 'A',
              r1: 'pickRandom([1.5,2])',
              r2: 'pickRandom([1.5,2])',
              test: '70>O-A>30 and 70>O-B>30 and abs(A-B)<45'
            }
          ) */
          let param
          do {
            const createVariables = (O, A) => ({
              O,
              A,
              B: A,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(randint(0, 90), randint(-90, 90))
          } while (!(param.O - param.A < 70 && param.O - param.A > 30))

          /* const ab = aleaVariables(
            {
              a: 'randomInt(0,3)',
              b: 'randomInt(0,3)',
              test: 'a!=b and (a!=2 or b!=0) and (a!=3 or b!=1)'
            }
          ) */
          let ab
          do {
            const createVariables = (a, b) => ({
              a,
              b,
            })

            ab = createVariables(randint(0, 3), randint(0, 3))
          } while (
            !(
              ab.a !== ab.b &&
              (ab.a !== 2 || ab.b !== 0) &&
              (ab.a !== 3 || ab.b !== 1)
            )
          )

          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.7
            anglesB[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesB[i].opaciteDeRemplissage = 0.7
          }
          anglesA.As.color = colorToLatexOrHTML('red')
          anglesB.As.color = colorToLatexOrHTML('red')
          const a = ['a', 'b', 'c', 'd'][parseInt(ab.a)]
          const b = ['a', 'b', 'c', 'd'][parseInt(ab.b)]
          const epsilon = choice([pickRandom([-2, -1, 1, 2]), 0])
          anglesA.labela = texteSurArc(
            ((param.O - param.A) % 180) + epsilon + '°',
            anglesA.s,
            anglesA.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labelb = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.x,
            anglesA.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesA.labelc = texteSurArc(
            ((param.O - param.A + epsilon) % 180) + '°',
            anglesA.t,
            anglesA.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labeld = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.Ox,
            anglesA.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labela = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.s,
            anglesB.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labelb = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.x,
            anglesB.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labelc = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.t,
            anglesB.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labeld = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.Ox,
            anglesB.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          objetsEnonce.push(
            anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB[b],
            anglesB.As,
            anglesB.Ax,
            anglesA['label' + a],
            anglesB['label' + b],
          )
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })
          let angles, calculs
          anglesA[a].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML('red')
          anglesA.labela.color = 'red'
          anglesA.labelb.color = 'red'
          anglesA.labelc.color = 'red'
          anglesA.labeld.color = 'red'
          anglesB.labela.color = 'blue'
          anglesB.labelb.color = 'blue'
          anglesB.labelc.color = 'blue'
          anglesB.labeld.color = 'blue'

          switch (a + b) {
            case 'ab':
            case 'ad':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              break
            case 'ac':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              break
            case 'ba':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              break
            case 'bc':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelc.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              break
            case 'bd':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              break
            case 'cb':
            case 'cd':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              break
            case 'da':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              break
            case 'dc':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              calculs = `$180°-${miseEnEvidence(anglesB.labelc.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              angles = 'alternes-internes'
              break
          }
          const paramsEnonce = fixeBordures([
            ...Object.keys(anglesA).map((key) => {
              return anglesA[key]
            }),
            ...Object.keys(anglesB).map((key) => {
              return anglesB[key]
            }),
          ])
          let texte = 'Les droites rouges sont-elles parallèles ?<br>'
          let sont, coord
          if (epsilon !== 0) {
            coord = 'mais pas'
            sont = 'ne sont pas'
          } else {
            coord = 'et'
            sont = 'sont'
          }
          const texteCorr =
            mathalea2d(
              Object.assign({ scale: 0.4 }, paramsEnonce),
              objetsCorrection,
            ) +
            `
          ${calculs !== undefined ? calculs : 'Les angles bleu et vert sont opposés par le sommet donc ils sont de même mesure.<br>'}
          Les angles rouge et vert sont ${angles} ${texteGras(coord + ' de même mesure')}.<br>
          Donc les droites rouges ${texteEnCouleurEtGras(sont + ' parallèles')}.`
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          propositions.push({
            texte: 'Oui',
            statut: epsilon === 0,
          })
          propositions.push({
            texte: 'Non',
            statut: epsilon !== 0,
          })
          break
        }
        case 4: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          /* const param = aleaVariables(
            {
              O: 'randomInt(0,90)',
              A: 'randomInt(-90,90)',
              B: 'A',
              r1: 'pickRandom([1.5,2])',
              r2: 'pickRandom([1.5,2])',
              test: '70>O-A>30 and 70>O-B>30 and abs(A-B)<45'
            }
          ) */
          let param
          do {
            const createVariables = (O, A) => ({
              O,
              A,
              B: A,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(randint(0, 90), randint(-90, 90))
          } while (!(param.O - param.A < 70 && param.O - param.A > 30))
          /* const ab = aleaVariables(
            {
              a: 'randomInt(0,3)',
              b: 'randomInt(0,3)',
              test: 'a!=b and (a!=2 or b!=0) and (a!=3 or b!=1)'
            }
          ) */
          let ab
          do {
            const createVariables = (a, b) => ({
              a,
              b,
            })

            ab = createVariables(randint(0, 3), randint(0, 3))
          } while (
            !(
              ab.a !== ab.b &&
              (ab.a !== 2 || ab.b !== 0) &&
              (ab.a !== 3 || ab.b !== 1)
            )
          )

          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesB[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.7
            anglesB[i].opaciteDeRemplissage = 0.7
          }
          const a = ['a', 'b', 'c', 'd'][parseInt(ab.a)]
          const b = ['a', 'b', 'c', 'd'][parseInt(ab.b)]
          anglesA.As.color = colorToLatexOrHTML('red')
          anglesB.As.color = colorToLatexOrHTML('red')
          const epsilon = 0
          anglesA.labela = texteSurArc(
            ((param.O - param.A) % 180) + epsilon + '°',
            anglesA.s,
            anglesA.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labelb = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.x,
            anglesA.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesA.labelc = texteSurArc(
            ((param.O - param.A + epsilon) % 180) + '°',
            anglesA.t,
            anglesA.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labeld = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.Ox,
            anglesA.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labela = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.s,
            anglesB.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labelb = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.x,
            anglesB.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labelc = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.t,
            anglesB.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labeld = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.Ox,
            anglesB.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          objetsEnonce.push(
            anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB[b],
            anglesB.As,
            anglesB.Ax,
            anglesA['label' + a],
          )
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })
          objetsCorrection.push(anglesB['label' + b])
          let angles, calculs, mesure
          anglesA[a].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML('red')
          anglesA.labela.color = 'red'
          anglesA.labelb.color = 'red'
          anglesA.labelc.color = 'red'
          anglesA.labeld.color = 'red'
          anglesB.labela.color = 'blue'
          anglesB.labelb.color = 'blue'
          anglesB.labelc.color = 'blue'
          anglesB.labeld.color = 'blue'

          switch (a + b) {
            case 'ab':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              mesure = anglesB.labelb.texte
              break
            case 'ac':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              mesure = anglesB.labela.texte
              break
            case 'ad':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              mesure = anglesB.labeld.texte
              break
            case 'ba':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              mesure = anglesB.labela.texte
              break
            case 'bc':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labelc.texte, 'green')}$`
              mesure = anglesB.labelc.texte
              break
            case 'bd':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              mesure = anglesB.labelb.texte
              break
            case 'cb':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              mesure = anglesB.labelb.texte
              break
            case 'cd':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labeld.texte, 'green')}$`
              mesure = anglesB.labeld.texte
              break
            case 'da':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              mesure = anglesB.labela.texte
              break
            case 'dc':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labelc.texte, 'green')}$`
              angles = 'alternes-internes'
              mesure = anglesB.labelc.texte
              break
          }
          const paramsEnonce = fixeBordures([
            ...Object.keys(anglesA).map((key) => {
              return anglesA[key]
            }),
            ...Object.keys(anglesB).map((key) => {
              return anglesB[key]
            }),
          ])
          let texte =
            "Sachant que les droites rouges sont parallèles, en déduire la mesure de l'angle bleu."
          texte += this.interactif ? '<br>' : ' Justifier.<br>'
          const texteCorr =
            mathalea2d(
              Object.assign({ scale: 0.4 }, paramsEnonce),
              objetsCorrection,
            ) +
            `Les angles rouge et vert sont ${texteGras(angles)} et formés par des droites ${texteGras('parallèles')}.<br>
          Donc ils sont ${texteGras('de même mesure')}.<br>De plus,
          ${calculs !== undefined ? calculs : ' les angles bleu et vert sont opposés par le sommet donc ils sont de même mesure.'}<br>
          L'angle bleu mesure donc $${miseEnEvidence(mesure)}$.`
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          const valMesure = Number(mesure.slice(0, mesure.length - 1))
          const valSupplementaireMesure = 180 - valMesure
          const valMesureDizaines = Math.floor(valMesure / 10)
          const valMesuresUnites = valMesure % 10
          const valDistracteur =
            valMesure % 10 === 5
              ? valMesure + choice([-1, 1]) * randint(1, 4)
              : valMesureDizaines * 10 + (10 - valMesuresUnites)
          const supplementaireDistracteur = 180 - valDistracteur
          propositions.push({
            texte: mesure,
            statut: true,
          })
          propositions.push({
            texte: valSupplementaireMesure.toString() + '°',
            statut: false,
          })
          propositions.push({
            texte: valDistracteur.toString() + '°',
            statut: false,
          })
          propositions.push({
            texte: supplementaireDistracteur.toString() + '°',
            statut: false,
          })
          options = { ordered: false }
          break
        }
        case 6: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          /* const param = aleaVariables(
            {
              O: 'randomInt(0,90)',
              A: 'randomInt(-90,90)',
              B: 'randomInt(-90,90)',
              r1: 'pickRandom([1.5,2])',
              r2: 'pickRandom([1.5,2])',
              test: '40<O-A<140 and 40<O-B<140 and abs(B-A)<20'
            }
          ) */
          let param
          do {
            const createVariables = (O, A, B) => ({
              O,
              A,
              B,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(
              randint(0, 90),
              randint(-90, 90),
              randint(-90, 90),
            )
          } while (
            !(
              param.O - param.A > 40 &&
              param.O - param.A < 140 &&
              param.O - param.B > 30 &&
              param.O - param.B < 140 &&
              abs(param.B - param.A) < 20
            )
          )

          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          const nomsPoints = aleaName(['A', 'B', 'C', 'D', 'E', 'F'], 2)
          anglesA.A.nom = nomsPoints[0]
          anglesB.A.nom = nomsPoints[1]
          const nomsDirections = aleaName(['s', 't', 'u', 'v', 'x', 'y'], 6)
          anglesA.S.nom = nomsDirections[0]
          anglesA.T.nom = nomsDirections[1]
          anglesA.X.nom = nomsDirections[2]
          anglesA.OX.nom = anglesB.A.nom
          anglesB.S.nom = nomsDirections[3]
          anglesB.T.nom = nomsDirections[4]
          anglesB.OX.nom = nomsDirections[5]
          anglesB.X.nom = anglesA.A.nom
          const nameAngles = [
            'S A X'.split(' '),
            'X A T'.split(' '),
            'T A OX'.split(' '),
            'OX A S'.split(' '),
          ]
          nameAngles.forEach(function (n, i) {
            anglesA[['a', 'b', 'c', 'd'][i]].nom = ''
            anglesB[['a', 'b', 'c', 'd'][i]].nom = ''
            for (let j = 0; j < 3; j++) {
              anglesA[['a', 'b', 'c', 'd'][i]].nom += anglesA[n[j]].nom
              anglesB[['a', 'b', 'c', 'd'][i]].nom += anglesB[n[j]].nom
            }
          })
          if (Math.abs(param.A) > 70) {
            anglesA.S.positionLabel = 'left'
            anglesA.T.positionLabel = 'left'
          }
          if (Math.abs(param.B) > 70) {
            anglesB.S.positionLabel = 'left'
            anglesB.T.positionLabel = 'left'
          }
          if (Math.abs(param.O) > 70) {
            anglesA.X.positionLabel = 'left'
            anglesB.OX.positionLabel = 'left'
          }
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.4
            anglesB[i].opaciteDeRemplissage = 0.7
          }
          const ab = choice([
            choice(['aa', 'bb', 'cc', 'dd']),
            choice(['ca', 'db']),
          ])
          const a = ab[0]
          const b = ab[1]
          objetsEnonce.push(
            anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB.As,
            anglesB.Ax /*,
            labelPoint(anglesA.S),
            labelPoint(anglesA.T),
            labelPoint(anglesA.X),
            labelPoint(anglesB.S),
            labelPoint(anglesB.T),
            labelPoint(anglesB.OX),
            labelPoint(anglesA.A),
            labelPoint(anglesB.A) */,
          )
          const paramsEnonce = fixeBordures(
            [
              ...Object.keys(anglesA).map((key) => {
                return anglesA[key]
              }),
              ...Object.keys(anglesB).map((key) => {
                return anglesB[key]
              }),
            ],
            { rzoom: 1.5 },
          )
          // On copie tout le contenu de objetsEnonce dans objetsCorrection
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })
          const angleCorrection = anglesB[b]
          angleCorrection.couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML('#f15929')
          objetsCorrection.push(angleCorrection)
          const couleurAngles = shuffle(['green', 'red', 'blue', 'gray'])
          anglesB['a'].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML(couleurAngles[0])
          anglesB['b'].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML(couleurAngles[1])
          anglesB['c'].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML(couleurAngles[2])
          anglesB['d'].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML(couleurAngles[3])
          // ici sont créés les texte, tex_corr, objets mathalea2d divers entrant dans le contenu de l'exercice
          let reponse
          if (a === b) {
            reponse = 'correspondant'
          } else if (a + b === 'ca' || a + b === 'db') {
            reponse = 'alterne-interne'
          }
          let texte
          if (this.interactif) {
            texte = `Quel est l'angle ${reponse} à l'angle marqué en bleu ?<br>`
            for (const i of ['a', 'b', 'c', 'd']) {
              objetsEnonce.push(anglesB[i])
            }
            objetsEnonce.push(
              texteSurArc(
                '1',
                anglesB.s,
                anglesB.x,
                param.O - param.A,
                'black',
                0.4,
              ),
            )
            objetsEnonce.push(
              texteSurArc(
                '2',
                anglesB.x,
                anglesB.t,
                180 - (param.O - param.A),
                'black',
                0.4,
              ),
            )
            objetsEnonce.push(
              texteSurArc(
                '3',
                anglesB.t,
                anglesB.Ox,
                param.O - param.A,
                'black',
                0.4,
              ),
            )
            objetsEnonce.push(
              texteSurArc(
                '4',
                anglesB.Ox,
                anglesB.s,
                180 - (param.O - param.A),
                'black',
                0.4,
              ),
            )
          } else {
            texte = `Marquer, en une autre couleur ou une autre teinte, l'angle ${reponse} à l'angle marqué en bleu.<br>`
          }
          const texteCorr = mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsCorrection,
          )
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          propositions.push({
            texte: 1,
            statut: b === 'a',
          })
          propositions.push({
            texte: 2,
            statut: b === 'b',
          })
          propositions.push({
            texte: 3,
            statut: b === 'c',
          })
          propositions.push({
            texte: 4,
            statut: b === 'd',
          })
          break
        }
        case 7: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          /* const param = aleaVariables(
            {
              O: 'randomInt(0,90)',
              A: 'randomInt(-90,90)',
              B: 'randomInt(-90,90)',
              r1: 'pickRandom([1.5,2])',
              r2: 'pickRandom([1.5,2])',
              test: '40<O-A<140 and 40<O-B<140 and abs(B-A)<20'
            }
          ) */
          let param
          do {
            const createVariables = (O, A, B) => ({
              O,
              A,
              B,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(
              randint(0, 90),
              randint(-90, 90),
              randint(-90, 90),
            )
          } while (
            !(
              param.O - param.A > 40 &&
              param.O - param.A < 140 &&
              param.O - param.B > 30 &&
              param.O - param.B < 140 &&
              abs(param.B - param.A) < 20
            )
          )

          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          const nomsPoints = aleaName(['A', 'B', 'C', 'D', 'E', 'F'], 2)
          anglesA.A.nom = nomsPoints[0]
          anglesB.A.nom = nomsPoints[1]
          const nomsDirections = aleaName(['s', 't', 'u', 'v', 'x', 'y'], 6)
          anglesA.S.nom = nomsDirections[0]
          anglesA.T.nom = nomsDirections[1]
          anglesA.X.nom = nomsDirections[2]
          anglesA.OX.nom = anglesB.A.nom
          anglesB.S.nom = nomsDirections[3]
          anglesB.T.nom = nomsDirections[4]
          anglesB.OX.nom = nomsDirections[5]
          anglesB.X.nom = anglesA.A.nom
          const nameAngles = [
            'S A X'.split(' '),
            'X A T'.split(' '),
            'T A OX'.split(' '),
            'OX A S'.split(' '),
          ]
          nameAngles.forEach(function (n, i) {
            anglesA[['a', 'b', 'c', 'd'][i]].nom = ''
            anglesB[['a', 'b', 'c', 'd'][i]].nom = ''
            for (let j = 0; j < 3; j++) {
              anglesA[['a', 'b', 'c', 'd'][i]].nom += anglesA[n[j]].nom
              anglesB[['a', 'b', 'c', 'd'][i]].nom += anglesB[n[j]].nom
            }
          })
          if (Math.abs(param.A) > 70) {
            anglesA.S.positionLabel = 'left'
            anglesA.T.positionLabel = 'left'
          }
          if (Math.abs(param.B) > 70) {
            anglesB.S.positionLabel = 'left'
            anglesB.T.positionLabel = 'left'
          }
          if (Math.abs(param.O) > 70) {
            anglesA.X.positionLabel = 'left'
            anglesB.OX.positionLabel = 'left'
          }
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.7
            anglesB[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesB[i].opaciteDeRemplissage = 0.7
          }
          const ab = choice([
            choice(['aa', 'bb', 'cc', 'dd']),
            choice(['ca', 'db']),
          ])
          const a = ab[0]
          const b = ab[1]
          objetsEnonce.push(
            // anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB.As,
            anglesB.Ax,
            labelPoint(anglesA.S),
            labelPoint(anglesA.T),
            labelPoint(anglesA.X),
            labelPoint(anglesB.S),
            labelPoint(anglesB.T),
            labelPoint(anglesB.OX),
            labelPoint(anglesA.A),
            labelPoint(anglesB.A),
          )
          const paramsEnonce = fixeBordures(
            [
              ...Object.keys(anglesA).map((key) => {
                return anglesA[key]
              }),
              ...Object.keys(anglesB).map((key) => {
                return anglesB[key]
              }),
            ],
            { rzoom: 1.5 },
          )
          // On copie tout le contenu de objetsEnonce dans objetsCorrection
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })

          anglesB[b].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML('#f15929')
          objetsCorrection.push(anglesB[b])
          objetsCorrection.push(anglesA[a])

          // ici sont créés les texte, tex_corr, objets mathalea2d divers entrant dans le contenu de l'exercice
          let reponse
          if (a === b) {
            reponse = 'correspondant'
          } else if (a + b === 'ca' || a + b === 'db') {
            reponse = 'alterne-interne'
          }
          let texte = `Quel est l'angle ${reponse} à l'angle $\\widehat{${anglesA[a].nom}}$ ?<br>`
          let texteCorr = mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsCorrection,
          )
          texteCorr += `L'angle ${reponse} à l'angle $${miseEnEvidence('\\widehat{' + anglesA[a].nom + '}', 'blue')}$ est $${miseEnEvidence('\\widehat{' + anglesB[b].nom + '}')}$.`
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          propositions.push({
            texte: `$\\widehat{${anglesB.a.nom}}$`,
            statut: anglesB[b].nom === anglesB.a.nom,
          })
          propositions.push({
            texte: `$\\widehat{${anglesB.b.nom}}$`,
            statut: anglesB[b].nom === anglesB.b.nom,
          })
          propositions.push({
            texte: `$\\widehat{${anglesB.c.nom}}$`,
            statut: anglesB[b].nom === anglesB.c.nom,
          })
          propositions.push({
            texte: `$\\widehat{${anglesB.d.nom}}$`,
            statut: anglesB[b].nom === anglesB.d.nom,
          })
          break
        }
        case 3: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          /* const param = aleaVariables(
            {
              O: 'randomInt(0,90)',
              A: 'randomInt(-90,90)',
              B: 'A',
              r1: 'pickRandom([1.5,2])',
              r2: 'pickRandom([1.5,2])',
              test: '70>O-A>30 and 70>O-B>30 and abs(A-B)<45'
            }
          ) */
          let param
          do {
            const createVariables = (O, A) => ({
              O,
              A,
              B: A,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(randint(0, 90), randint(-90, 90))
          } while (!(param.O - param.A < 70 && param.O - param.A > 30))
          /* const ab = aleaVariables(
            {
              a: 'randomInt(0,3)',
              b: 'randomInt(0,3)',
              test: 'a!=b and (a!=2 or b!=0) and (a!=3 or b!=1)'
            }
          ) */
          let ab
          do {
            const createVariables = (a, b) => ({
              a,
              b,
            })

            ab = createVariables(randint(0, 3), randint(0, 3))
          } while (
            !(
              ab.a !== ab.b &&
              (ab.a !== 2 || ab.b !== 0) &&
              (ab.a !== 3 || ab.b !== 1)
            )
          )

          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          const nomsPoints = aleaName(['A', 'B', 'C', 'D', 'E', 'F'], 2)
          anglesA.A.nom = nomsPoints[0]
          anglesB.A.nom = nomsPoints[1]
          const nomsDirections = aleaName(['s', 't', 'u', 'v', 'x', 'y'], 6)
          anglesA.S.nom = nomsDirections[0]
          anglesA.T.nom = nomsDirections[1]
          anglesA.X.nom = nomsDirections[2]
          anglesA.OX.nom = anglesB.A.nom
          anglesB.S.nom = nomsDirections[3]
          anglesB.T.nom = nomsDirections[4]
          anglesB.OX.nom = nomsDirections[5]
          anglesB.X.nom = anglesA.A.nom
          const nameAngles = [
            'S A X'.split(' '),
            'X A T'.split(' '),
            'T A OX'.split(' '),
            'OX A S'.split(' '),
          ]
          nameAngles.forEach(function (n, i) {
            anglesA[['a', 'b', 'c', 'd'][i]].nom = ''
            anglesB[['a', 'b', 'c', 'd'][i]].nom = ''
            for (let j = 0; j < 3; j++) {
              anglesA[['a', 'b', 'c', 'd'][i]].nom += anglesA[n[j]].nom
              anglesB[['a', 'b', 'c', 'd'][i]].nom += anglesB[n[j]].nom
            }
          })
          if (Math.abs(param.A) > 70) {
            anglesA.S.positionLabel = 'left'
            anglesA.T.positionLabel = 'left'
          }
          if (Math.abs(param.B) > 70) {
            anglesB.S.positionLabel = 'left'
            anglesB.T.positionLabel = 'left'
          }
          if (Math.abs(param.O) > 70) {
            anglesA.X.positionLabel = 'left'
            anglesB.OX.positionLabel = 'left'
          }
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.4
            anglesB[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesB[i].opaciteDeRemplissage = 0.4
          }
          const a = ['a', 'b', 'c', 'd'][parseInt(ab.a)]
          const b = ['a', 'b', 'c', 'd'][parseInt(ab.b)]
          const epsilon = choice([pickRandom([-2, -1, 1, 2]), 0])
          anglesA.labela = texteSurArc(
            ((param.O - param.A) % 180) + epsilon + '°',
            anglesA.s,
            anglesA.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labelb = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.x,
            anglesA.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesA.labelc = texteSurArc(
            ((param.O - param.A + epsilon) % 180) + '°',
            anglesA.t,
            anglesA.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labeld = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.Ox,
            anglesA.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labela = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.s,
            anglesB.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labelb = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.x,
            anglesB.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labelc = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.t,
            anglesB.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labeld = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.Ox,
            anglesB.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          objetsEnonce.push(
            anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB[b],
            anglesB.As,
            anglesB.Ax,
            anglesA['label' + a],
            anglesB['label' + b],
            labelPoint(anglesA.S),
            labelPoint(anglesA.T),
            labelPoint(anglesA.X),
            labelPoint(anglesB.S),
            labelPoint(anglesB.T),
            labelPoint(anglesB.OX),
            labelPoint(anglesA.A),
            labelPoint(anglesB.A),
          )
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })
          let angles, calculs
          anglesA[a].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML('red')
          anglesA.labela.color = 'red'
          anglesA.labelb.color = 'red'
          anglesA.labelc.color = 'red'
          anglesA.labeld.color = 'red'
          anglesB.labela.color = 'blue'
          anglesB.labelb.color = 'blue'
          anglesB.labelc.color = 'blue'
          anglesB.labeld.color = 'blue'
          switch (a + b) {
            case 'ab':
            case 'ad':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              break
            case 'ac':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              break
            case 'ba':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              break
            case 'bc':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelc.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              break
            case 'bd':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              break
            case 'cb':
            case 'cd':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              break
            case 'da':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              break
            case 'dc':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              calculs = `$180°-${miseEnEvidence(anglesB.labelc.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              angles = 'alternes-internes'
              break
          }

          const paramsEnonce = fixeBordures([
            ...Object.keys(anglesA).map((key) => {
              return anglesA[key]
            }),
            ...Object.keys(anglesB).map((key) => {
              return anglesB[key]
            }),
          ])
          let texte = `Les droites $(${anglesA.S.nom}${anglesA.T.nom})$ et $(${anglesB.S.nom}${anglesB.T.nom})$ sont-elles parallèles ?<br>`
          let sont, coord
          if (epsilon !== 0) {
            coord = 'mais pas'
            sont = 'ne sont pas'
          } else {
            coord = 'et'
            sont = 'sont'
          }
          const nomAngleSolution =
            angles !== 'alternes-internes'
              ? anglesB[a].nom
              : a === 'c'
                ? anglesB.a.nom
                : anglesB.b.nom
          const texteCorr =
            mathalea2d(
              Object.assign({ scale: 0.4 }, paramsEnonce),
              objetsCorrection,
            ) +
            `${calculs !== undefined ? calculs : `Les angles $\\widehat{${anglesB[a].nom}}$ et $\\widehat{${anglesB[b].nom}}$ sont opposés par le sommet, donc ils sont de même mesure.`}<br>
          Donc les angles $${miseEnEvidence('\\widehat{' + anglesA[a].nom + '}', 'red')}$ et $${miseEnEvidence('\\widehat{' + nomAngleSolution + '}', 'green')}$ sont ${angles} ${texteGras(coord + ' de même mesure')}.<br>
          Donc les droites $(${anglesA.S.nom}${anglesA.T.nom})$ et $(${anglesB.S.nom}${anglesB.T.nom})$ ${texteEnCouleurEtGras(sont + ' parallèles')}.`
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          propositions.push({
            texte: 'Oui',
            statut: epsilon === 0,
          })
          propositions.push({
            texte: 'Non',
            statut: epsilon !== 0,
          })
          break
        }
        case 5: {
          const objetsEnonce = [] // on initialise le tableau des objets Mathalea2d de l'enoncé
          const objetsCorrection = [] // Idem pour la correction
          /* const param = aleaVariables(
            {
              O: 'randomInt(0,90)',
              A: 'randomInt(-90,90)',
              B: 'A',
              r1: 'pickRandom([1.5,2])',
              r2: 'pickRandom([1.5,2])',
              test: '70>O-A>30 and 70>O-B>30 and abs(A-B)<45'
            }
          ) */
          let param
          do {
            const createVariables = (O, A) => ({
              O,
              A,
              B: A,
              r1: choice([1.5, 2]),
              r2: choice([1.5, 2]),
            })

            param = createVariables(randint(0, 90), randint(-90, 90))
          } while (!(param.O - param.A < 70 && param.O - param.A > 30))
          /* const ab = aleaVariables(
            {
              a: 'randomInt(0,3)',
              b: 'randomInt(0,3)',
              test: 'a!=b and (a!=2 or b!=0) and (a!=3 or b!=1)'
            }
          ) */
          let ab
          do {
            const createVariables = (a, b) => ({
              a,
              b,
            })

            ab = createVariables(randint(0, 3), randint(0, 3))
          } while (
            !(
              ab.a !== ab.b &&
              (ab.a !== 2 || ab.b !== 0) &&
              (ab.a !== 3 || ab.b !== 1)
            )
          )

          const O = point(0, 0)
          const anglesA = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O), O, param.r1),
            { O: param.O, A: param.A },
          )
          const anglesB = anglesSecantes(
            homothetie(rotation(point(1, 0), O, param.O + 180), O, param.r2),
            { O: param.O, A: param.B },
          )
          const nomsPoints = aleaName(['A', 'B', 'C', 'D', 'E', 'F'], 2)
          anglesA.A.nom = nomsPoints[0]
          anglesB.A.nom = nomsPoints[1]
          const nomsDirections = aleaName(['s', 't', 'u', 'v', 'x', 'y'], 6)
          anglesA.S.nom = nomsDirections[0]
          anglesA.T.nom = nomsDirections[1]
          anglesA.X.nom = nomsDirections[2]
          anglesA.OX.nom = anglesB.A.nom
          anglesB.S.nom = nomsDirections[3]
          anglesB.T.nom = nomsDirections[4]
          anglesB.OX.nom = nomsDirections[5]
          anglesB.X.nom = anglesA.A.nom
          const nameAngles = [
            'S A X'.split(' '),
            'X A T'.split(' '),
            'T A OX'.split(' '),
            'OX A S'.split(' '),
          ]
          nameAngles.forEach(function (n, i) {
            anglesA[['a', 'b', 'c', 'd'][i]].nom = ''
            anglesB[['a', 'b', 'c', 'd'][i]].nom = ''
            for (let j = 0; j < 3; j++) {
              anglesA[['a', 'b', 'c', 'd'][i]].nom += anglesA[n[j]].nom
              anglesB[['a', 'b', 'c', 'd'][i]].nom += anglesB[n[j]].nom
            }
          })
          if (Math.abs(param.A) > 70) {
            anglesA.S.positionLabel = 'left'
            anglesA.T.positionLabel = 'left'
          }
          if (Math.abs(param.B) > 70) {
            anglesB.S.positionLabel = 'left'
            anglesB.T.positionLabel = 'left'
          }
          if (Math.abs(param.O) > 70) {
            anglesA.X.positionLabel = 'left'
            anglesB.OX.positionLabel = 'left'
          }
          for (const i of ['a', 'b', 'c', 'd']) {
            anglesA[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesA[i].opaciteDeRemplissage = 0.4
            anglesB[i].couleurDeRemplissage = context.isAmc
              ? ''
              : colorToLatexOrHTML('blue')
            anglesB[i].opaciteDeRemplissage = 0.4
          }
          const a = ['a', 'b', 'c', 'd'][parseInt(ab.a)]
          const b = ['a', 'b', 'c', 'd'][parseInt(ab.b)]
          const epsilon = 0
          anglesA.labela = texteSurArc(
            ((param.O - param.A) % 180) + epsilon + '°',
            anglesA.s,
            anglesA.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labelb = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.x,
            anglesA.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesA.labelc = texteSurArc(
            ((param.O - param.A + epsilon) % 180) + '°',
            anglesA.t,
            anglesA.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesA.labeld = texteSurArc(
            ((180 - (param.O - param.A) + epsilon) % 180) + '°',
            anglesA.Ox,
            anglesA.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labela = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.s,
            anglesB.x,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labelb = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.x,
            anglesB.t,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          anglesB.labelc = texteSurArc(
            ((param.O - param.A) % 180) + '°',
            anglesB.t,
            anglesB.Ox,
            param.O - param.A,
            'black',
            0.7,
          )
          anglesB.labeld = texteSurArc(
            ((180 - (param.O - param.A)) % 180) + '°',
            anglesB.Ox,
            anglesB.s,
            180 - (param.O - param.A),
            'black',
            0.7,
          )
          objetsEnonce.push(
            anglesA[a],
            anglesA.As,
            anglesA.Ax,
            anglesB.As,
            anglesB.Ax,
            anglesA['label' + a],
            labelPoint(anglesA.S),
            labelPoint(anglesA.T),
            labelPoint(anglesA.X),
            labelPoint(anglesB.S),
            labelPoint(anglesB.T),
            labelPoint(anglesB.OX),
            labelPoint(anglesA.A),
            labelPoint(anglesB.A),
            // anglesB['label' + b]
          )
          objetsEnonce.forEach((objet) => {
            objetsCorrection.push(objet)
          })
          objetsCorrection.push(anglesB['label' + b])
          objetsCorrection.push(anglesB[b])
          let angles, calculs, mesure
          anglesA[a].couleurDeRemplissage = context.isAmc
            ? ''
            : colorToLatexOrHTML('red')
          anglesA.labela.color = 'red'
          anglesA.labelb.color = 'red'
          anglesA.labelc.color = 'red'
          anglesA.labeld.color = 'red'
          anglesB.labela.color = 'blue'
          anglesB.labelb.color = 'blue'
          anglesB.labelc.color = 'blue'
          anglesB.labeld.color = 'blue'

          switch (a + b) {
            case 'ab':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              mesure = anglesB.labelb.texte
              break
            case 'ac':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              mesure = anglesB.labela.texte
              break
            case 'ad':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              mesure = anglesB.labeld.texte
              break
            case 'ba':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              mesure = anglesB.labela.texte
              break
            case 'bc':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labelc.texte, 'green')}$`
              mesure = anglesB.labelc.texte
              break
            case 'bd':
              anglesB[a].couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'correspondants'
              mesure = anglesB.labelb.texte
              break
            case 'cb':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labelb.texte, 'green')}$`
              mesure = anglesB.labelb.texte
              break
            case 'cd':
              anglesB.a.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'a'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'a'], anglesB.a)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labela.texte, 'blue')} = ${miseEnEvidence(anglesB.labeld.texte, 'green')}$`
              mesure = anglesB.labeld.texte
              break
            case 'da':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              angles = 'alternes-internes'
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labela.texte, 'green')}$`
              mesure = anglesB.labela.texte
              break
            case 'dc':
              anglesB.b.couleurDeRemplissage = context.isAmc
                ? ''
                : colorToLatexOrHTML('green')
              anglesB['label' + 'b'].color = 'green'
              objetsCorrection.push(anglesB['label' + 'b'], anglesB.b)
              calculs = `$180°-${miseEnEvidence(anglesB.labelb.texte, 'blue')} = ${miseEnEvidence(anglesB.labelc.texte, 'green')}$`
              angles = 'alternes-internes'
              mesure = anglesB.labelc.texte
              break
          }
          const paramsEnonce = fixeBordures([
            ...Object.keys(anglesA).map((key) => {
              return anglesA[key]
            }),
            ...Object.keys(anglesB).map((key) => {
              return anglesB[key]
            }),
          ])
          let texte = `Sachant que les droites $(${anglesA.S.nom}${anglesA.T.nom})$ et $(${anglesB.S.nom}${anglesB.T.nom})$ sont parallèles, en déduire la mesure de l'angle $\\widehat{${anglesB[b].nom}}$.<br>`
          const nomAngleSolution =
            angles !== 'alternes-internes'
              ? anglesB[a].nom
              : a === 'c'
                ? anglesB.a.nom
                : anglesB.b.nom
          let texteCorr = mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsCorrection,
          )
          texteCorr += `Les angles $${miseEnEvidence('\\widehat{' + anglesA[a].nom + '}', 'red')}$ et $${miseEnEvidence('\\widehat{' + nomAngleSolution + '}', 'green')}$ sont ${texteGras(angles)} et formés par des droites ${texteGras('parallèles')}.
          Donc ils sont ${texteGras('de même mesure')}.<br>
          De plus,${calculs !== undefined ? calculs : ` les angles $\\widehat{${anglesB[a].nom}}$ et $\\widehat{${anglesB[b].nom}}$ et vert sont opposés par le sommet.<br> Donc ils sont de même mesure.`}<br>
          Donc l'angle $${miseEnEvidence('\\widehat{' + anglesB[b].nom + '}', 'blue')}$ mesure $${miseEnEvidence(mesure)}$.`
          texte += mathalea2d(
            Object.assign({ scale: 0.4 }, paramsEnonce),
            objetsEnonce,
          )
          exercice = { texte, texteCorr }
          const valMesure = Number(mesure.slice(0, mesure.length - 1))
          const valSupplementaireMesure = 180 - valMesure
          const valMesureDizaines = Math.floor(valMesure / 10)
          const valMesuresUnites = valMesure % 10
          const valDistracteur =
            valMesure % 10 === 5
              ? valMesure + choice([-1, 1]) * randint(1, 4)
              : valMesureDizaines * 10 + (10 - valMesuresUnites)
          const supplementaireDistracteur = 180 - valDistracteur
          propositions.push({
            texte: mesure,
            statut: true,
          })
          propositions.push({
            texte: valSupplementaireMesure.toString() + '°',
            statut: false,
          })
          propositions.push({
            texte: valDistracteur.toString() + '°',
            statut: false,
          })
          propositions.push({
            texte: supplementaireDistracteur.toString() + '°',
            statut: false,
          })
          options = { ordered: false }
          break
        }
      }
      // Les lignes ci-dessous permettent d'avoir un affichage aux dimensions optimisées
      if (this.questionJamaisPosee(i, exercice.texte)) {
        if (context.isAmc) {
          this.autoCorrection[i] = {
            enonce: '',
            options: { barreseparation: true, numerotationEnonce: true }, // facultatif.
            propositions: [
              {
                type: 'AMCOpen',
                propositions: [
                  {
                    texte: '',
                    numQuestionVisible: false,
                    statut: nquestion[i] < 6 && nquestion[i] > 1 ? 3 : 1, // (ici c'est le nombre de lignes du cadre pour la réponse de l'élève sur AMC)
                    feedback: '',
                    //    enonce: figure[3][0] + mathalea2d(figure[1], figure[0]) + '<br>' + figure[3][1] + ' Justifier la réponse.' // EE : ce champ est facultatif et fonctionnel qu'en mode hybride (en mode normal, il n'y a pas d'intérêt)
                    enonce: exercice.texte, // EE : ce champ est facultatif et fonctionnel qu'en mode hybride (en mode normal, il n'y a pas d'intérêt)
                  },
                ],
              },
            ],
          }
        } else {
          this.autoCorrection[i] = {
            enonce: exercice.texte,
            propositions,
            options,
          }
        }
        const monQcm = propositionsQcm(this, i)
        if (this.interactif) {
          exercice.texte = exercice.texte + monQcm.texte
        }
        this.listeQuestions[i] = exercice.texte
        this.listeCorrections[i] = exercice.texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
