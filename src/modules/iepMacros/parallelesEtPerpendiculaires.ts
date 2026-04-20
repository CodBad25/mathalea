import { cercle } from '../../lib/2d/cercle'
import {
  Droite,
  droite,
  droiteParPointEtParallele,
  droiteParPointEtPerpendiculaire,
} from '../../lib/2d/droites'
import type { PointAbstrait } from '../../lib/2d/PointAbstrait'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import {
  homothetie,
  projectionOrtho,
  rotation,
  similitude,
  translation,
  translation2Points,
} from '../../lib/2d/transformations'
import {
  angleOriente,
  longueur,
  pointEstSur,
} from '../../lib/2d/utilitairesGeometriques'
import {
  pointIntersectionLC,
  pointSurDroite,
  pointSurSegment,
} from '../../lib/2d/utilitairesPoint'
import { vecteur } from '../../lib/2d/Vecteur'
import type {
  IAlea2iep,
  OptionsCompas,
  OptionsEquerre,
} from '../Alea2iep.types'

/**
 * Trace la parallèle à (AB) passant par C avec la règle et l'équerre. Peut prolonger le segment [AB] si le pied de la hauteur est trop éloigné des extrémités du segment
 * @param {PointAbstrait} A
 * @param {PointAbstrait} B
 * @param {PointAbstrait} C
 * @param {*} [options]
 */
export const paralleleRegleEquerre2points3epoint = function (
  this: IAlea2iep,
  A: PointAbstrait,
  B: PointAbstrait,
  C: PointAbstrait,
  options?: OptionsEquerre,
) {
  let G, D, H1
  // G est le point le plus à gauche, D le plus à droite et H le projeté de C sur (AB)
  // H1 est un point de (AB) à gauche de H, c'est là où seront la règle et l'équerre avant de glisser
  if (A.x < B.x) {
    G = A
    D = B
  } else {
    G = B
    D = A
  }
  const d = droite(A, B)
  const H = projectionOrtho(C, d)
  if (H.x < D.x) {
    H1 = pointSurSegment(H, D, -2) // H1 sera plus à gauche que H
  } else if (H.x > D.x) {
    H1 = pointSurSegment(H, D, 2)
  } else {
    H1 = pointSurSegment(H, G, 2)
  }
  const C1 = projectionOrtho(H1, droiteParPointEtParallele(C, d))
  // C1 est le point d'arrivée de l'équerre après avoir glissé
  const M = pointSurSegment(C1, C, 6)
  // Le tracé de la parallèle ne fera que 6 cm pour ne pas dépassr de l'équerre. M est la fin de ce tracé

  if (H.x < G.x && longueur(H, G) > 3) {
    // Si le pied de la hauteur est trop à gauche
    this.regleProlongerSegment(D, G, options)
    this.regleMasquer(options)
  }
  if (H.x > D.x && longueur(H, D) > 3) {
    // Si le pied de la hauteur est trop à gauche
    this.regleProlongerSegment(G, D, options)
  }

  this.equerreMontrer(H1, options)
  if (M.x > C1.x) {
    this.equerreRotation(d.angleAvecHorizontale - 90, options)
  } else {
    this.equerreRotation(d.angleAvecHorizontale + 90, options)
  }
  if (H1.y > C1.y) {
    if (this.regle.visibilite) {
      this.regleDeplacer(H1, Object.assign({}, options, { tempo: 0 }))
      this.regleRotation(C1, Object.assign({}, options, { tempo: 0 }))
    } else {
      this.regleDeplacer(
        H1,
        Object.assign({}, options, { vitesse: 1000, tempo: 0 }),
      )
      this.regleRotation(
        C1,
        Object.assign({}, options, { sens: 1000, tempo: 0 }),
      )
    }
  } else {
    const C12 = pointSurSegment(C1, H1, -2) // On monte un peu plus la règle pour que ça soit plus crédible
    if (this.regle.visibilite) {
      this.regleDeplacer(C12, Object.assign({}, options, { tempo: 0 }))
      this.regleRotation(H1, Object.assign({}, options, { tempo: 0 }))
    } else {
      this.regleDeplacer(
        C12,
        Object.assign({}, options, { vitesse: 1000, tempo: 0 }),
      )
      this.regleRotation(
        H1,
        Object.assign({}, options, { sens: 1000, tempo: 0 }),
      )
      this.regleMontrer()
    }
  }
  this.equerreDeplacer(C1, options)
  this.crayonMontrer()
  this.crayonDeplacer(C1, options)
  this.tracer(M, options)
  this.regleMasquer(options)
  this.equerreMasquer(options)
  this.crayonMasquer(options)
}
/**
 * Trace la perpendiculaire à (AB) passant par C avec la règle et l'équerre. Peut prolonger le segment [AB] si le pied de la hauteur est trop éloigné des extrémités du segment
 * Description désactivée par défaut.
 * @param {PointAbstrait} A
 * @param {PointAbstrait} B
 * @param {PointAbstrait} C
 * @param {*} [options]
 */
export const perpendiculaireRegleEquerre2points3epoint = function (
  this: IAlea2iep,
  A: PointAbstrait,
  B: PointAbstrait,
  C: PointAbstrait,
  options: OptionsCompas = {},
) {
  const longueurRegle = this.regle.longueur
  const zoomEquerre = this.equerre.zoom
  const d = droite(A, B)
  d.nom = `(${A.nom}${B.nom})`
  let dist
  if (A.nom === undefined) A.nom = 'A'
  if (B.nom === undefined) B.nom = 'B'
  if (pointEstSur(C, droite(A, B))) {
    const H = rotation(C, C, 0)
    const dd = droiteParPointEtPerpendiculaire(C, d)
    C = pointIntersectionLC(dd, cercle(H, 5.5))
    dist = 7.5
  } else {
    const H = projectionOrtho(C, d)
    dist = longueur(H, C) + 2
  }
  this.equerreZoom((dist * 100) / 7.5, options)
  this.regleModifierLongueur(Math.max(dist * 2, 15), options)
  this.perpendiculaireRegleEquerreDroitePoint(d, C, options)
  this.equerreZoom(zoomEquerre, options)
  this.regleModifierLongueur(longueurRegle, options)
  this.regleMasquer(options)
  this.equerreMasquer(options)
  this.crayonMasquer(options)
}

/**
 * Construit à la règle et à l'équerre la perpendiculaire à une droite d passant par un point P n'appartenant pas à d.
 * description désactivable.
 * @param {Droite} d
 * @param {PointAbstrait} P
 * @param {boolean} [description]
 */
export const perpendiculaireRegleEquerreDroitePoint = function (
  this: IAlea2iep,
  d: Droite,
  P: PointAbstrait,
  options: OptionsCompas = {},
) {
  if (!pointEstSur(P, d)) {
    const H = projectionOrtho(P, d)
    const A = rotation(P, H, 90)
    const B = rotation(A, H, 180)
    const P3 = homothetie(P, H, 1.2)
    const alpha = angleOriente(pointAbstrait(10000, H.y), H, B)
    if (options.description)
      this.textePosition(
        `1. Placer un côté de l'angle droit de l'équerre sur la droite ${d.nom} et l'autre côté de l'angle droit passant par le point ${P.nom}.`,
        0,
        10,
        { couleur: 'lightblue' },
      )
    this.equerreRotation(alpha, options)
    this.equerreMontrer(H, options)
    if (options.description)
      this.textePosition(
        `2. Tracer le segment de droite passant par le point ${P.nom}`,
        0,
        9.3,
        { couleur: 'lightblue' },
      )
    this.crayonMontrer(P, options)
    this.tracer(H, options)
    this.equerreMasquer(options)
    if (options.description)
      this.textePosition(
        `3. Prolonger la perpendiculaire à ${d.nom} à la règle.`,
        0,
        8.6,
        { couleur: 'lightblue' },
      )
    this.regleMontrer(P3, options)
    this.regleRotation(alpha - 90, options)
    this.crayonDeplacer(P3, options)
    this.tracer(rotation(P3, H, 180), options)
    if (options.description)
      this.textePosition("4. Coder l'angle droit.", 0, 7.9, {
        couleur: 'lightblue',
      })
    this.regleMasquer(options)
    this.codageAngleDroit(
      A,
      H,
      P,
      Object.assign({}, options, { couleurCodage: 'red' }),
    )
  } else {
    const H = P
    const C = cercle(P, 6)
    const A = pointSurDroite(d, -10000)
    const B = pointSurDroite(d, 10000)
    const pointIntersectionDC = pointIntersectionLC(d, C)
    let P3 = rotation(pointIntersectionDC, P, 90)
    if (P3.y < P.y) P3 = rotation(P3, P, 180)
    const alpha = angleOriente(pointAbstrait(10000, H.y), H, B)
    if (options.description)
      this.textePosition(
        `1. Placer un côté de l'angle droit de l'équerre sur la droite ${d.nom} avec l'angle droit au point ${P.nom}.`,
        0,
        10,
        { couleur: 'lightblue' },
      )
    this.equerreRotation(alpha, options)
    this.equerreMontrer(H, options)
    if (options.description)
      this.textePosition(
        "2. Tracer le long de l'autre côté de l'angle droit de l'équerre",
        0,
        9.3,
        { couleur: 'lightblue' },
      )
    this.crayonMontrer(P3, options)
    this.tracer(H, options)
    this.equerreMasquer(options)
    if (options.description)
      this.textePosition(
        `3. Prolonger la perpendiculaire à ${d.nom} à la règle.`,
        0,
        8.6,
        { couleur: 'lightblue' },
      )
    this.regleMontrer(P3, options)
    this.regleRotation(alpha - 90, options)
    this.crayonDeplacer(P3, options)
    this.tracer(rotation(P3, H, 180), options)
    if (options.description)
      this.textePosition("4. Coder l'angle droit.", 0, 7.9, {
        couleur: 'lightblue',
      })
    this.regleMasquer(options)
    this.codageAngleDroit(A, H, P3, options)
  }
}
/**
 * Trace la perpendiculaire à une droite passant par un point de cette droite à l'équerre et à la règle.
 * @param {Droite} d
 * @param {number} x  // pour choisir le point sur d : l'abscisse de A
 * @param {boolean} description
 */
export const perpendiculaireRegleEquerrePointSurLaDroite = function (
  this: IAlea2iep,
  d: Droite,
  x: number,
  options: OptionsCompas = {},
) {
  const A = pointSurDroite(d, x, 'A')
  const B = pointSurDroite(d, x + 5)
  const P1 = rotation(B, A, 90)
  const P2 = rotation(P1, A, 180)
  if (d.nom === undefined) {
    d.nom = '(d)'
  }
  this.traitRapide(pointSurDroite(d, -20), pointSurDroite(d, 20), options)
  this.pointCreer(A, options)
  if (options.description)
    this.textePosition(
      `1. Placer un côté de l'angle droit de l'équerre sur la droite ${d.nom}.`,
      0,
      10,
      { couleur: 'lightblue' },
    )
  this.equerreRotation(d.angleAvecHorizontale, options)
  this.equerreMontrer(B, options)
  if (options.description) {
    this.textePosition(
      `2. Faire glisser l'équerre sur la droite jusqu'au point ${A.nom}`,
      0,
      9.3,
      { couleur: 'lightblue' },
    )
  }
  this.equerreDeplacer(A, options)
  if (options.description)
    this.textePosition(
      "3. Tracer le long de l'autre côté de l'angle droit de l'équerre.",
      0,
      8.6,
      { couleur: 'lightblue' },
    )
  this.crayonMontrer(A, options)
  this.tracer(P1, options)
  this.equerreMasquer(options)
  if (options.description)
    this.textePosition(
      `4. Prolonger la perpendiculaire à ${d.nom} à la règle.`,
      0,
      7.9,
      { couleur: 'lightblue' },
    )
  this.regleRotation(d.angleAvecHorizontale - 90, options)
  this.regleMontrer(P1, options)
  this.crayonDeplacer(P1, options)
  this.tracer(P2, options)
  if (options.description)
    this.textePosition("4. Coder l'angle droit.", 0, 7.2, {
      couleur: 'lightblue',
    })
  this.regleMasquer(options)
  this.codageAngleDroit(P1, A, B, options)
}
/**
 * Trace la perpendiculaire à une droite passant par un point de cette droite au compas.
 * @param {Droite} d
 * @param {number} x // pour choisir le point sur d : l'abscisse de A
 * @param {boolean} description
 */
export const perpendiculaireCompasPointSurLaDroite = function (
  this: IAlea2iep,
  d: Droite,
  x: number,
  options: OptionsCompas = {},
) {
  const A = pointSurDroite(d, x, 'A')
  const B = pointSurDroite(d, x + 3, 'B')
  const C = pointSurDroite(d, x - 3, 'C')
  const P1 = similitude(B, A, 90, 1.2)
  const P2 = similitude(B, A, -90, 1.2)
  if (d.nom === undefined) {
    d.nom = '(d)'
  }
  this.traitRapide(pointSurDroite(d, -20), pointSurDroite(d, 20), options)
  this.pointCreer(A, options)
  if (options.description)
    this.textePosition(
      "1. Avec le compas, marquer deux points B et C de part et d'autre de A, tels que AB=AC.",
      0,
      10,
      { couleur: 'lightblue' },
    )
  this.compasEcarter2Points(A, B, options)
  this.compasTracerArcCentrePoint(A, B, { couleur: 'lightgray', epaisseur: 1 })
  this.compasTracerArcCentrePoint(A, C, { couleur: 'lightgray', epaisseur: 1 })
  if (options.description) {
    this.textePosition(
      '2. Choisir un écartement de compas supérieur à la longueur AB.',
      0,
      9.3,
      { couleur: 'lightblue' },
    )
  }
  this.compasEcarter2Points(B, P1, options)
  if (options.description)
    this.textePosition(
      '3. Tracer un arc de cercle de centre B avec cet écartement.',
      0,
      8.6,
      { couleur: 'lightblue' },
    )
  this.compasTracerArcCentrePoint(B, P1, { couleur: 'lightgray', epaisseur: 1 })
  if (options.description)
    this.textePosition(
      '4. Tracer un arc de cercle de centre C en conservant le même écartement.',
      0,
      7.9,
      { couleur: 'lightblue' },
    )
  this.compasTracerArcCentrePoint(C, P1, { couleur: 'lightgray', epaisseur: 1 })
  this.compasMasquer(options)
  if (options.description) {
    this.textePosition(
      "4. Tracer la droite qui passe par le point d'intersection des arcs de cercle et par le point A.",
      0,
      7.2,
      { couleur: 'lightblue' },
    )
  }
  this.regleRotation(d.angleAvecHorizontale - 90, options)
  const P11 = homothetie(P1, A, 1.1)
  const P12 = homothetie(P2, A, 1.1)
  this.regleMontrer(P11, options)
  this.crayonMontrer(P11, options)
  this.tracer(P12, options)
  if (options.description)
    this.textePosition("5. Coder l'angle droit.", 0, 6.5, {
      couleur: 'lightblue',
    })
  this.regleMasquer(options)
  this.codageAngleDroit(P1, A, B, options)
}
/**
 * Trace la perpendiculaire à une droite passant par un point n'appartenant pas à cette droite au compas.
 * @param {Droite} d
 * @param {number} x // pour choisir le point sur d : l'abscisse de A
 * @param {boolean} description
 */
export const perpendiculaireCompasPoint = function (
  this: IAlea2iep,
  d: Droite,
  A: PointAbstrait,
  options: OptionsCompas = {},
) {
  const H = projectionOrtho(A, d)
  const B = similitude(A, H, -90, 1.2, 'B')
  const C = homothetie(B, H, -0.7, 'C')
  const D = rotation(A, H, 180)
  const P1 = homothetie(A, H, 1.2)
  const P2 = homothetie(A, H, -1.2)
  if (d.nom === '') {
    d.nom = '(d)'
  }
  if (A.nom === '') {
    A.nom = 'A'
  }
  this.traitRapide(pointSurDroite(d, -20), pointSurDroite(d, 20), options)
  this.textePoint(
    d.nom,
    translation(pointSurDroite(d, 0), vecteur(0, -0.5)),
    options,
  )
  this.pointCreer(A, options)
  if (options.description)
    this.textePosition(
      `1. Choisir deux points B et C sur la droite ${d.nom}.`,
      0,
      11,
      { couleur: 'lightblue', tempo: 20 },
    )
  this.tempo = 20
  this.pointCreer(B, options)
  this.pointCreer(C, options)
  if (options.description)
    this.textePosition(
      `2. Tracer un arc de cercle de centre B passant par A et un autre de centre C passant par ${A.nom}.`,
      0,
      10.3,
      { couleur: 'lightblue', tempo: 20 },
    )
  this.compasEcarter2Points(B, A, options)
  this.compasTracerArcCentrePoint(
    B,
    D,
    Object.assign({}, options, { couleur: 'lightgray', epaisseur: 1 }),
  )
  this.compasEcarter2Points(C, A, options)
  this.compasTracerArcCentrePoint(
    C,
    D,
    Object.assign({}, options, { couleur: 'lightgray', epaisseur: 1 }),
  )
  if (options.description)
    this.textePosition(
      `3. Ces deux arcs de cercle se recoupent en un point qui est le symétrique de ${A.nom} par rapport à ${d.nom}`,
      0,
      9.6,
      { couleur: 'lightblue', tempo: 20 },
    )
  this.compasMasquer(options)
  if (options.description)
    this.textePosition(
      "4. Tracer la droite qui passe par le point d'intersection des arcs de cercle et par le point A.",
      0,
      8.9,
      { couleur: 'lightblue', tempo: 20 },
    )
  this.regleRotation(d.angleAvecHorizontale - 90, options)
  this.regleMontrer(P1, options)
  this.crayonMontrer(P1, options)
  this.tracer(P2, options)
  if (options.description)
    this.textePosition("5. Coder l'angle droit.", 0, 8.2, {
      couleur: 'lightblue',
      tempo: 20,
    })
  this.regleMasquer(options)
  this.codageAngleDroit(P1, H, B, options)
}
/**
 * Trace la parallèlee à (AB) passant par C avec la règle et l'équerre.
 * Cette macro réalise la construction en décrivant ce qu'elle fait à chaque étape
 * @param {PointAbstrait} A
 * @param {PointAbstrait} B
 * @param {PointAbstrait} M
 * @param {boolean} dessus
 * @param {*} [options]
 */
export const paralleleRegleEquerreDroitePointAvecDescription = function (
  this: IAlea2iep,
  A: PointAbstrait,
  B: PointAbstrait,
  M: PointAbstrait,
  dessus: boolean,
  options: OptionsCompas = { description: true },
) {
  A.nom = 'A'
  B.nom = 'B'
  M.nom = 'M'
  const AA = homothetie(A, B, 2)
  const BB = homothetie(B, A, 2)
  const d = droite(A, B)
  const dd = rotation(d, A, 90)
  const H = projectionOrtho(M, dd)
  const N = homothetie(M, H, 1.5)
  const P = homothetie(H, M, 2)
  const originalTempo = this.tempo
  this.tempo = 10
  this.pointMasquer(AA, BB, options)
  this.traitRapide(AA, BB, options)
  this.textePosition(
    'Parallèle à une droite passant par un point (règle et équerre)',
    -10,
    10.7,
    { couleur: 'green', taille: 4, tempo: 20 },
  )
  if (options.description)
    this.textePosition(
      "On veut construire la parallèle à (AB) passant par M à la règle et à l'equerre.",
      -10,
      10,
      { couleur: 'red', taille: 4, tempo: 50 },
    )
  if (options.description)
    this.textePosition(
      "1. Placer l'équerre un côté de l'angle droit le long de la droite (AB).",
      -9,
      9.3,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.equerreMontrer(A, options)
  this.equerreRotation(
    d.angleAvecHorizontale + (dessus ? -90 : 0),
    Object.assign({}, options, { tempo: 20 }),
  )
  if (options.description)
    this.textePosition(
      "2. Placer ensuite la règle contre l'autre côté de l'angle droit de l'équerre.",
      -9,
      8.6,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.regleRotation(d.angleAvecHorizontale - 90, options)
  this.regleMontrer(AA, options)
  this.regleDeplacer(
    homothetie(rotation(B, A, 90), A, 1.5),
    Object.assign({}, options, { tempo: 20 }),
  )
  if (options.description)
    this.textePosition(
      'Remarque : On peut tracer des pointillés pour matérialiser la position de la règle.',
      -9.5,
      7.9,
      { couleur: 'pink', taille: 2, tempo: 10 },
    )
  this.crayonMontrer(A, options)
  this.tracer(homothetie(rotation(B, A, dessus ? 90 : -90), A, 1.5), options)
  if (options.description)
    this.textePosition(
      "3. Faire glisser l'équerre le long de la règle jusqu'au point M.",
      -9,
      7.2,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  if (!dessus) {
    this.equerreRotation(d.angleAvecHorizontale - 90, options)
  }
  this.equerreDeplacer(H, Object.assign({}, options, { tempo: 20 }))
  if (options.description)
    this.textePosition(
      '4. Tracer le segment de droite passant par M.',
      -9,
      6.5,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.crayonDeplacer(H, options)
  this.tracer(N, options)
  this.equerreMasquer(options)
  if (options.description)
    this.textePosition(
      '5. Placer la règle sur ce segment et prolonger la parallèle à (AB).',
      -9,
      5.8,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.regleDeplacer(P, options)
  this.regleRotation(d.angleAvecHorizontale, options)
  this.tracer(P, options)
  this.regleMasquer(options)
  if (options.description)
    this.textePosition('6. Pour finir, coder la figure.', -9, 5.1, {
      couleur: 'lightblue',
      taille: 2,
      tempo: 20,
    })
  this.codageAngleDroit(B, A, H, options)
  this.codageAngleDroit(A, H, M, options)
  this.crayonMasquer(options)
  this.tempo = originalTempo
}

/**
 *
 * @param {PointAbstrait} A
 * @param {PointAbstrait} B
 * @param {PointAbstrait} C
 * @param {boolean} description
 */
export const paralleleAuCompasAvecDescription = function (
  this: IAlea2iep,
  A: PointAbstrait,
  B: PointAbstrait,
  C: PointAbstrait,
  options: OptionsCompas = { description: true },
) {
  const D = translation2Points(C, A, B, 'D')
  A.nom = 'A'
  B.nom = 'B'
  C.nom = 'C'
  const AA = homothetie(A, B, 1.5)
  const BB = homothetie(B, A, 1.5)
  const N = homothetie(C, D, 1.5)
  const P = homothetie(D, C, 1.5)
  const originalTempo = this.tempo
  this.tempo = 10
  this.traitRapide(AA, BB, options)
  this.textePosition(
    'Parallèle à une droite passant par un point (compas et règle)',
    -10,
    10.7,
    { couleur: 'green', taille: 4, tempo: 20 },
  )
  if (options.description)
    this.textePosition(
      'On veut construire la parallèle à (AB) passant par C à la règle et au compas.',
      -10,
      10,
      { couleur: 'red', taille: 4, tempo: 30 },
    )
  if (options.description)
    this.textePosition(
      "1. Prendre avec le compas l'écartement correspondant à la longueur AB.",
      -9,
      9.3,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.compasEcarter2Points(A, B, options)
  if (options.description)
    this.textePosition(
      '2. Reporter cette longueur à partir du point C.',
      -9,
      8.6,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.compasTracerArcCentrePoint(
    C,
    D,
    Object.assign({}, options, { couleur: 'lightgray', epaisseur: 1 }),
  )
  if (options.description)
    this.textePosition(
      "3. Prendre ensuite avec le compas l'écartement correspondant à la longueur AC.",
      -9,
      7.9,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.compasEcarter2Points(A, C, options)
  if (options.description)
    this.textePosition(
      '4. Reporter cette longueur à partir du point B.',
      -9,
      7.2,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.compasTracerArcCentrePoint(
    B,
    D,
    Object.assign({}, options, { couleur: 'lightgray', epaisseur: 1 }),
  )
  this.compasMasquer(options)
  if (options.description)
    this.textePosition(
      "5. Noter D, le point d'intersection des deux arcs de cercle.",
      -9,
      6.5,
      { couleur: 'lightblue', taille: 2, tempo: 10 },
    )
  this.pointCreer(D, options)
  if (options.description)
    this.textePosition('6. Tracer la droite passant par C et D.', -9, 5.8, {
      couleur: 'lightblue',
      taille: 2,
      tempo: 10,
    })
  this.regleSegment(N, P, options)
  this.regleMasquer(options)
  this.crayonMasquer(options)
  this.tempo = originalTempo
}

/**
 *
 * @param {PointAbstrait} A
 * @param {PointAbstrait} B
 * @param {PointAbstrait} C
 * @param {boolean} description
 */
export const paralleleAuCompas = function (
  this: IAlea2iep,
  A: PointAbstrait,
  B: PointAbstrait,
  C: PointAbstrait,
  options: OptionsCompas = {},
) {
  const D = translation2Points(C, A, B)
  const N = homothetie(C, D, 1.5)
  const P = homothetie(D, C, 1.5)
  this.compasEcarter2Points(A, B, options)
  this.compasTracerArcCentrePoint(C, D, options)
  this.compasEcarter2Points(A, C, options)
  this.compasTracerArcCentrePoint(B, D, options)
  this.compasMasquer(options)
  // this.pointCreer(D, options)
  this.regleSegment(N, P, options)
  return D
}
