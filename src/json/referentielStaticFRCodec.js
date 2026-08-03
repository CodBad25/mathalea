import referentielStaticFRSessions from './referentielStaticFRSessions.json' with { type: 'json' }

const { sessions, numeroOverrides, entryOverrides } = referentielStaticFRSessions

/**
 * Décode le dernier segment de l'uuid (le "code numéro") en numeroInitial.
 * Seul le CRPE encode systématiquement son numéro sous une forme à décoder
 * (exN, ex0N, pb) ; les autres familles utilisent le segment tel quel (et
 * les rares exceptions passent par numeroOverrides).
 */
function decodeNumero(typeExercice, numeroCode) {
  if (typeExercice === 'crpe') {
    if (numeroCode === 'pb') return 'Problème'
    const match = /^ex0*(\d+)$/.exec(numeroCode)
    if (match) return match[1]
  }
  return numeroCode
}

/**
 * Reconstruit {typeExercice, annee, mois?, lieu, jour?, numeroInitial, filiere?}
 * à partir de l'uuid d'un exercice statique du référentiel FR (dnb, dnbpro,
 * bac, sti2d, stl, e3c, eam, crpe), en s'appuyant sur la table de sessions
 * générée depuis les dictionnaires (référentielStaticFRSessions.json).
 */
export function deriveInfosExerciceStatique(uuid) {
  if (uuid in entryOverrides) {
    const override = entryOverrides[uuid]
    const infos = {
      typeExercice: override.typeExercice,
      annee: override.annee,
      lieu: override.lieu,
      numeroInitial: override.numeroInitial,
    }
    if (override.mois !== undefined) infos.mois = override.mois
    if (override.jour !== undefined) infos.jour = override.jour
    if (override.filiere !== undefined) infos.filiere = override.filiere
    return infos
  }

  const segments = uuid.split('_')
  const numeroCode = segments[segments.length - 1]
  const sessionKey = segments.slice(0, -1).join('_')
  const session = sessions[sessionKey]
  if (!session) {
    throw new Error(
      `Session inconnue pour l'uuid statique "${uuid}" (clé de session "${sessionKey}"). ` +
        'Ajoutez une entrée dans src/json/referentielStaticFRSessions.json ou vérifiez cet uuid.',
    )
  }

  const numeroInitial =
    uuid in numeroOverrides ? numeroOverrides[uuid] : decodeNumero(session.typeExercice, numeroCode)

  const infos = {
    typeExercice: session.typeExercice,
    annee: session.annee,
    lieu: session.lieu,
    numeroInitial,
  }
  if (session.mois !== undefined) infos.mois = session.mois
  if (session.jour !== undefined) infos.jour = session.jour
  if (session.filiere !== undefined) infos.filiere = session.filiere
  return infos
}

/**
 * Parcourt récursivement un arbre du référentiel statique FR et complète,
 * pour chaque feuille possédant un uuid, les champs annee/lieu/mois/
 * numeroInitial/typeExercice (et jour/filiere le cas échéant) déduits de
 * l'uuid. Mutation en place.
 */
export function hydrateReferentielTree(tree) {
  if (tree && typeof tree === 'object') {
    if (typeof tree.uuid === 'string') {
      Object.assign(tree, deriveInfosExerciceStatique(tree.uuid))
      return tree
    }
    for (const key of Object.keys(tree)) {
      hydrateReferentielTree(tree[key])
    }
  }
  return tree
}
