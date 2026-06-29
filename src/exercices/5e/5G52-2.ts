import { fixeBordures } from '../../lib/2d/fixeBordures'
import { MetaInteractif2d } from '../../lib/2d/interactif2d'
import type { ObjetMathalea2D } from '../../lib/2d/ObjetMathalea2D'
import { placeLatexSurSegment } from '../../lib/2d/placeLatexSurSegment'
import type { PointAbstrait } from '../../lib/2d/PointAbstrait'
import { toutPourUnPoint } from '../../lib/interactif/fonctionsBaremes'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import {
  Arrete,
  FacePrisme,
  patronEnS,
  patronEnT,
  patronHasard,
  type ArreteDuPatron,
} from '../../modules/PatronsPrismes'
import Exercice from '../Exercice'
export const interactifReady = true
export const interactifType = 'MetaInteractif2d'

export const titre = 'Report de longueur sur un patron de pavé droit'

export const dateDePublication = '25/06/2026'

export const uuid = '75a8c'
export const refs = {
  'fr-fr': ['5G52-2'],
  'fr-ch': [],
}
/**
 * report de longueur sur un patron de pavé droit
 * @author Olivier Mimeau
 */
export default class longueurPatronPaveDroit extends Exercice {
  constructor() {
    super()

    this.besoinFormulaireTexte = [
      'Type de patrons',
      [
        'Nombres séparés par des tirets  :',
        '0 : Mélange',
        '1 : Patrons simples',
        '2 : Patrons moins Simples',
      ].join('\n'),
    ]
    this.sup = '0'
    this.besoinFormulaire2Texte = [
      'Type de longueur à chercher',
      [
        'Nombres séparés par des tirets  :',
        '0 : Mélange',
        '1 : Arrete directe',
        '2 : Arrete indirecte',
      ].join('\n'),
    ]
    this.sup2 = '0'
    this.besoinFormulaire3Texte = [
      'Nombre de longueurs à chercher',
      ['Nombres entre 1 et 3 séparés par des tirets  :', '0 : Mélange'].join(
        '\n',
      ),
    ]
    this.sup3 = '0'
    this.consigne = `Les patrons ci-dessous sont des patrons de pavé droit. Compléter les longueurs manquantes.`
    this.nbQuestions = 3
  }

  nouvelleVersion() {
    if (this.nbQuestions === 1) {
      this.consigne = `Le patron ci-dessous est celui d'un pavé droit. Compléter les longueurs manquantes.`
    }
    const typeQuestionsDisponibles = ['TouS', 'AuPif'] //, 'type2', 'type3']
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 2,
      melange: 0,
      defaut: 0,
      listeOfCase: typeQuestionsDisponibles,
      nbQuestions: this.nbQuestions,
    })
    const listeTypeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    const typeDemandeDisponibles = ['Directe', 'Indirecte'] //, 'type2', 'type3']
    const typeDeDemandeDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup2,
      min: 1,
      max: 2,
      melange: 0,
      defaut: 0,
      listeOfCase: typeDemandeDisponibles,
      nbQuestions: this.nbQuestions * 3,
    })
    const listeTypeDeDemande = combinaisonListes(
      typeDeDemandeDisponibles,
      this.nbQuestions * 3,
    )
    const nbLongueursDisponibles = ['1', '2', '3'] //, 'type2', 'type3']
    const nbdeLongueursDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup3,
      min: 1,
      max: 3,
      melange: 0,
      defaut: 0,
      listeOfCase: nbLongueursDisponibles,
      nbQuestions: this.nbQuestions,
    })
    const nbLongueurs = combinaisonListes(
      nbdeLongueursDisponibles,
      this.nbQuestions,
    )
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      const numerotationFaces: 'sans' | 'standard' | 'hasard' = 'standard' //'hasard'
      const nbLongueursDemandee: number = +nbLongueurs[i]
      const dimensions: number[] = []
      dimensions[0] = randint(2, 5) //hauteurPrisme
      dimensions[1] = randint(2, 5, [dimensions[0]]) //largeur
      dimensions[2] = randint(dimensions[1] + 1, dimensions[1] + 5, [
        dimensions[0],
      ]) //longueur
      const nbSommetBase = 4
      const listeCotesBase = [dimensions[2], dimensions[1], dimensions[2]]
      const listeAnglesBase = [90, 90]
      let base1: FacePrisme = new FacePrisme(
        1,
        4,
        listeCotesBase,
        listeAnglesBase,
        true,
      )
      switch (listeTypeQuestions[i]) {
        case 'TouS':
          {
            const genrePatron = choice(['EnT', 'EnS'])
            switch (genrePatron) {
              case 'EnT':
                {
                  base1 = patronEnT(
                    nbSommetBase,
                    dimensions[0],
                    listeCotesBase,
                    listeAnglesBase,
                    {
                      angleDeDepart: 0,
                      horizontal: 'horizontal',
                      tNumerotation: numerotationFaces,
                    },
                  )
                }
                break
              case 'EnS':
                {
                  base1 = patronEnS(
                    nbSommetBase,
                    dimensions[0],
                    listeCotesBase,
                    listeAnglesBase,
                    {
                      angleDeDepart: 0,
                      horizontal: 'horizontal',
                      tNumerotation: numerotationFaces,
                    },
                  )
                }
                break
            }
          }
          break
        case 'AuPif':
          {
            let enLigne = true
            let k = 0
            while (enLigne && k < 50) {
              base1 = patronHasard(
                nbSommetBase,
                dimensions[0],
                listeCotesBase,
                listeAnglesBase,
                {
                  angleDeDepart: 0,
                  horizontal: 'horizontal',
                  enT: false,
                  enS: false,
                  tNumerotation: numerotationFaces,
                },
              )
              enLigne = quatreEnLigne(base1)
              k++
            }
          }
          break
        case 'type3':
        default:
          texte += `Question ${i + 1} par defeaut merci de signaler le problème<br>`
          texteCorr = `Correction ${i + 1} de type 3`
          break
      }
      const lesDessins: ObjetMathalea2D[] = base1.patron('sans', 'sans')
      const lesDessinsCorr: ObjetMathalea2D[] = base1.patron('sans', 'sans')
      const lesBases = base1.trouverDeuxiemeBase()
      const numBase2 = lesBases[0] ? lesBases[0]?.numFace : 0
      const lesSegments: {
        longDepart: ExtremitesSegment
        longAChercher: ExtremitesSegment
        typedeRecherche: string
        longNum: number
      }[] = []
      for (let j = 0; j < 3; j++) {
        lesSegments[j] = fixeCotesQuestionReponse(
          base1,
          dimensions[j],
          numBase2,
          `${listeTypeDeDemande[i * 3 + j]}`,
        )
      }
      const lesSegmentsMelanges = combinaisonListes(lesSegments, 3)
      for (let j = 0; j < 3; j++) {
        lesDessins.push(
          placeLatexSurSegment(
            `${texNombre(lesSegmentsMelanges[j].longNum, 1)}\\text{ cm}`,
            lesSegmentsMelanges[j].longDepart.ext1,
            lesSegmentsMelanges[j].longDepart.ext2,
          ),
        )
        lesDessinsCorr.push(
          placeLatexSurSegment(
            `${texNombre(lesSegmentsMelanges[j].longNum, 1)}\\text{ cm}`,
            lesSegmentsMelanges[j].longDepart.ext1,
            lesSegmentsMelanges[j].longDepart.ext2,
          ),
        )
      }
      if (this.interactif) {
        const inputs = []
        for (let j = 0; j < nbLongueursDemandee; j++) {
          const coordM = coordMultiMathsFieldSurSegment(
            lesSegmentsMelanges[j].longAChercher.ext1,
            lesSegmentsMelanges[j].longAChercher.ext2,
            1,
          )
          inputs.push({
            content: `%{champ1}\\text{ cm}`, // champ1 est à utiliser systématiquement pour tous les inputs
            x: coordM.x,
            y: coordM.y,
            classe: '', // Ici on pourra mettre le clavier à utiliser
            blanc: '\\ldots ',
            opacity: 1,
            index: j,
          })
        }
        const qMetaInteractif = new MetaInteractif2d(inputs, {
          exercice: this,
          question: i,
        })
        const elementsHandleAns = { bareme: toutPourUnPoint }
        Object.assign(elementsHandleAns, {
          field0: {
            value: texNombre(lesSegmentsMelanges[0].longNum, 1),
          },
        })
        if (nbLongueursDemandee > 1) {
          Object.assign(elementsHandleAns, {
            field1: {
              value: texNombre(lesSegmentsMelanges[1].longNum, 1),
            },
          })
        }
        if (nbLongueursDemandee > 2) {
          Object.assign(elementsHandleAns, {
            field2: {
              value: texNombre(lesSegmentsMelanges[2].longNum, 1),
            },
          })
        }
        handleAnswers(this, i, elementsHandleAns, {
          formatInteractif: 'MetaInteractif2d',
        })
        lesDessins.push(qMetaInteractif)
      } else {
        for (let j = 0; j < nbLongueursDemandee; j++) {
          lesDessins.push(
            placeLatexSurSegment(
              '\\text{.......}',

              lesSegmentsMelanges[j].longAChercher.ext1,
              lesSegmentsMelanges[j].longAChercher.ext2,
            ),
          )
        }
      }
      for (let j = 0; j < nbLongueursDemandee; j++) {
        lesDessinsCorr.push(
          placeLatexSurSegment(
            `${texNombre(lesSegmentsMelanges[j].longNum, 1)}\\text{ cm}`,
            lesSegmentsMelanges[j].longAChercher.ext1,
            lesSegmentsMelanges[j].longAChercher.ext2,
          ),
        )
      }
      texte += mathalea2d(
        Object.assign(
          {
            display: 'block', //'inline-block',
            scale: 0.4,
            id: '' /* `correction1Ex${this.numeroExercice}Q${i}` */,
          } as const,
          fixeBordures(lesDessins),
        ),
        lesDessins,
      )
      texteCorr += mathalea2d(
        Object.assign(
          {
            display: 'block', //'inline-block',
            scale: 0.4,
            id: '' /* `correction1Ex${this.numeroExercice}Q${i}` */,
          } as const,
          fixeBordures(lesDessinsCorr),
        ),
        lesDessinsCorr,
      )
      if (this.interactif) {
        texte += '<br>'
      }

      if (
        this.questionJamaisPosee(
          i,
          ...dimensions,
          listeTypeQuestions[i],
          listeTypeDeDemande[i],
        )
      ) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}

type coord = { x: number; y: number }
type ExtremitesSegment = { ext1: PointAbstrait; ext2: PointAbstrait }

function extSegment(cote: ArreteDuPatron, numbase2: number): ExtremitesSegment {
  let exta: PointAbstrait
  let extb: PointAbstrait
  if (cote.face.numFace === numbase2) {
    exta = cote.face.sommeti(cote.numArrete)
    extb = cote.face.sommeti(cote.numArrete + 1)
  } else {
    exta = cote.face.sommeti(cote.numArrete + 1)
    extb = cote.face.sommeti(cote.numArrete)
  }
  return { ext1: exta, ext2: extb }
}

function sommetCommun(
  arrete1: ArreteDuPatron,
  arrete2: ArreteDuPatron,
): boolean {
  return (
    memeCoord(
      coordApprox(arrete1, arrete1.numArrete),
      coordApprox(arrete2, arrete2.numArrete),
    ) ||
    memeCoord(
      coordApprox(arrete1, arrete1.numArrete),
      coordApprox(arrete2, arrete2.numArrete + 1),
    ) ||
    memeCoord(
      coordApprox(arrete1, arrete1.numArrete + 1),
      coordApprox(arrete2, arrete2.numArrete),
    ) ||
    memeCoord(
      coordApprox(arrete1, arrete1.numArrete + 1),
      coordApprox(arrete2, arrete2.numArrete + 1),
    )
  )
}

function quatreEnLigne(faceDepart: FacePrisme): boolean {
  function combienDeFacesParLa(
    faceDepart: FacePrisme,
    numArrete: number,
  ): number {
    let arreteEnCours = faceDepart.arretesi(numArrete)
    let nbFaceEnligne = 0
    while (arreteEnCours.connectee) {
      arreteEnCours = arreteEnCours.autreFace.arretesi(
        arreteEnCours.autreArrete + 2,
      )
      nbFaceEnligne++
    }
    return nbFaceEnligne
  }
  let result =
    1 +
      combienDeFacesParLa(faceDepart, 0) +
      combienDeFacesParLa(faceDepart, 2) >
    3
  result =
    result ||
    1 +
      combienDeFacesParLa(faceDepart, 1) +
      combienDeFacesParLa(faceDepart, 3) >
      3
  return result
}

function TrouveArreteEnFace(
  arrete1: ArreteDuPatron,
  listeArretes: ArreteDuPatron[],
): number {
  const num = arrete1.numArrete + 2
  let ArreteEnCours: Arrete = arrete1.face.arretesi(num)
  let faceEnCours = arrete1.face

  let i = 0
  while (i < 12 && ArreteEnCours.connectee) {
    faceEnCours = ArreteEnCours.autreFace
    ArreteEnCours = ArreteEnCours.autreFace.arretesi(
      ArreteEnCours.autreArrete + 2,
    )
    i++
  }

  let match = 0
  while (
    match < listeArretes.length &&
    (listeArretes[match].face !== faceEnCours ||
      listeArretes[match].numArrete !== ArreteEnCours.numero)
  ) {
    match++
  }
  if (match === listeArretes.length) {
    match = -1
  }

  return match
}

function coordApprox(arrete: ArreteDuPatron, num: number): coord {
  return {
    x: arrondi(arrete.face.sommeti(num).x, 3),
    y: arrondi(arrete.face.sommeti(num).y, 3),
  }
}

function memeCoord(pt1: coord, pt2: coord): boolean {
  return pt1.x === pt2.x && pt1.y === pt2.y
}

function fixeCotesQuestionReponse(
  face: FacePrisme,
  long: number,
  numBase2: number,
  typeLongAChercher: string,
): {
  longDepart: ExtremitesSegment
  longAChercher: ExtremitesSegment
  typedeRecherche: string
  longNum: number
} {
  let arretesTrouvees: ArreteDuPatron[] = []
  arretesTrouvees = face.trouveToutesArretesSurBordDeLongueur(long)

  const choixCoteConnu = randint(1, arretesTrouvees.length - 1)
  const coteConnu = arretesTrouvees.splice(choixCoteConnu, 1)[0]

  const arretesDirectes: ArreteDuPatron[] = []
  for (let j = 0; j < arretesTrouvees.length; j++) {
    if (sommetCommun(arretesTrouvees[j], coteConnu)) {
      arretesDirectes.push(arretesTrouvees[j])
      arretesTrouvees.splice(j, 1)
    }
  }

  const arretesEnface: ArreteDuPatron[] = []
  const numEnFace = TrouveArreteEnFace(coteConnu, arretesTrouvees)
  if (numEnFace > -1) {
    arretesEnface.push(arretesTrouvees[numEnFace])
    arretesTrouvees.splice(numEnFace, 1)
  }

  let arrete: ArreteDuPatron = coteConnu
  let typeQuestion = ''
  if (arretesTrouvees.length > 0 && typeLongAChercher === 'Indirecte') {
    arrete = choice(arretesTrouvees)
    typeQuestion = 'Indirecte'
  } else {
    const choix: string[] = []
    if (arretesEnface.length > 0) {
      choix.push('EnFace')
    }
    if (arretesDirectes.length > 0) {
      choix.push('Direct')
    }

    typeQuestion = choice(choix)

    if (typeQuestion === 'EnFace') {
      arrete = choice(arretesEnface)
    } else {
      arrete = choice(arretesDirectes)
    }
  }

  return {
    longDepart: extSegment(coteConnu, numBase2),
    longAChercher: extSegment(arrete, numBase2),
    typedeRecherche: typeQuestion,
    longNum: long,
  }
}

function coordMultiMathsFieldSurSegment(
  A: PointAbstrait,
  B: PointAbstrait,
  distance: number = 0.7,
): { x: number; y: number } {
  // code copié de placeLatex2d(A, B, distance)
  // Milieu de [AB]
  const Mx = (A.x + B.x) / 2
  const My = (A.y + B.y) / 2
  // Vecteur AB
  const dx = B.x - A.x
  const dy = B.y - A.y
  const len = Math.hypot(dx, dy)
  // Vecteur normal unitaire (perpendiculaire, orientation +90°)
  const nx = len > 1e-12 ? -dy / len : 0
  const ny = len > 1e-12 ? dx / len : 1
  // Point décalé à distance le long de la normale
  return { x: Mx + nx * distance, y: My + ny * distance }
}
