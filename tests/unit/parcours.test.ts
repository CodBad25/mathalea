import { describe, expect, it } from 'vitest'
import {
  addLevel,
  addSteps,
  missing,
  moveStep,
  nudgeStep,
  removeLevel,
  removeStep,
  splitIntoLevels,
  studentPreviewUrl,
} from '../../src/lib/parcours/parcoursEditing'
import {
  createParcoursFile,
  isParcours,
  readParcoursFile,
  timestampedName,
} from '../../src/lib/parcours/parcoursFile'
import {
  assign,
  emptyLibrary,
  move,
  parcoursOfClass,
  publish,
  removeClass,
  renameClass,
  restore,
  saveParcours,
  setClassParcours,
  unpublishedCount,
} from '../../src/lib/parcours/parcoursLibrary'
import {
  exerciseKey,
  mergeObjectives,
  objectivesToCsv,
  readObjectives,
} from '../../src/lib/parcours/parcoursObjectives'
import { exerciseIndex } from '../../src/lib/parcours/parcoursReferential'
import {
  emptyParcours,
  levelGroups,
  levelName,
  suggestedIcon,
  validationLabels,
  type Parcours,
  type Step,
} from '../../src/lib/parcours/parcoursTypes'

const step = (uuid: string, objectifs?: string[]): Step => ({
  uuid,
  id: uuid,
  titre: uuid,
  nbQuestions: 2,
  ...(objectifs ? { objectifs } : {}),
})

const parcours = (): Parcours =>
  emptyParcours({
    titre: 'Relatifs',
    niveau: '5e',
    theme: 'Nombres relatifs',
    etapes: [
      step('a', ['Additionner']),
      step('b', ['Additionner']),
      step('c', ['Soustraire']),
    ],
  })

describe('édition des paliers', () => {
  it('découpe par objectif, puis déplace un exercice d’un palier à l’autre', () => {
    let p = splitIntoLevels(parcours())
    expect(p.paliers?.map((l) => [l.titre, l.nb])).toEqual([
      ['Additionner', 2],
      ['Soustraire', 1],
    ])
    expect(p.paliers?.[1]).toMatchObject({ acces: 'seuil', seuil: 80 })
    // Le dernier exercice du palier 1 descend : il ouvre le palier 2
    p = nudgeStep(p, 1, 1)
    expect(levelGroups(p)).toEqual([[0], [1, 2]])
    expect(p.etapes.map((s) => s.uuid)).toEqual(['a', 'b', 'c'])
    // Glisser « c » en tête du palier 1
    p = moveStep(p, 2, 0, 0)
    expect(p.etapes.map((s) => s.uuid)).toEqual(['c', 'a', 'b'])
    expect(levelGroups(p)).toEqual([[0, 1], [2]])
    expect(nudgeStep(p, 0, -1)).toBe(p)
  })

  it('ajoute à un palier, signale un palier vide, retire un exercice ou un palier', () => {
    let p = addLevel(splitIntoLevels(parcours()))
    expect(missing(p)).toEqual(['un exercice dans chaque palier'])
    p = addSteps(p, [step('d')], 2)
    expect(missing(p)).toEqual([])
    expect(levelGroups(p)[2]).toEqual([3])
    p = removeStep(p, 0)
    expect(levelGroups(p)).toEqual([[0], [1], [2]])
    p = removeLevel(p, 0)
    expect(p.paliers?.[0]).toMatchObject({ nb: 2, acces: undefined })
    p = removeLevel(p, 1)
    expect(p.paliers).toBeUndefined()
    expect(missing(emptyParcours())).toEqual([
      'un niveau',
      'un chapitre',
      'un titre',
      'un exercice',
    ])
  })

  it('ouvre les exercices dans la vue élève du site', () => {
    const url = new URL(
      studentPreviewUrl('https://mathalea.fr/alea/?v=parcours', [
        { ...step('cbc26'), sup: '2' },
      ]),
    )
    expect(url.searchParams.getAll('uuid')).toEqual(['cbc26'])
    expect(url.searchParams.get('s')).toBe('2')
    expect(url.searchParams.get('i')).toBe('1')
    expect(url.searchParams.get('v')).toBe('eleve')
  })
})

describe('bibliothèque et fichier publié', () => {
  it('crée pour un niveau, donne à des classes, ordonne, renomme et retire', () => {
    let { library, id } = saveParcours(emptyLibrary(), parcours())
    expect(library.entries[0].classes).toEqual([])
    expect(library.defaults?.niveau).toBe('5e')
    library = assign(library, id, ['5e A'])
    library = saveParcours(library, { ...parcours(), titre: 'Autre' }).library
    const autre = library.entries[1].parcours.id
    library = setClassParcours(library, '5e A', [id, autre])
    library = move(library, autre, '5e A', -1)
    expect(
      parcoursOfClass(library, '5e A').map((e) => e.parcours.titre),
    ).toEqual(['Autre', 'Relatifs'])
    library = renameClass(library, '5e A', '5e B')
    expect(library.entries[0].classes).toEqual(['5e B'])
    library = removeClass(library, '5e B')
    expect(library.entries.every((e) => e.classes.length === 0)).toBe(true)
  })

  it('publie toute la bibliothèque ; une modification après publication ouvre la version suivante', () => {
    let { library, id } = saveParcours(
      emptyLibrary(),
      splitIntoLevels(parcours()),
    )
    library = saveParcours(
      library,
      emptyParcours({
        titre: 'Sans classe',
        niveau: '5e',
        theme: 'T',
        etapes: [step('x')],
      }),
    ).library
    library = assign(library, id, ['5e A'])
    library = {
      ...library,
      objectives: [
        {
          libelle: 'Additionner',
          code: '5N2G',
          niveau: '5e',
          theme: 'Relatifs',
        },
      ],
    }
    expect(unpublishedCount(library)).toBe(1)
    const published = publish(library)
    library = published.library
    expect(unpublishedCount(library)).toBe(0)
    const file = readParcoursFile(published.text)
    expect(file.banque).toBe(true)
    expect(file.classes.map((c) => [c.nom, c.parcours.length])).toEqual([
      ['5e A', 1],
    ])
    expect(file.bibliotheque?.parcours).toHaveLength(2)
    expect(file.classes[0].parcours[0].paliers).toHaveLength(2)
    const p = library.entries[0].parcours
    library = saveParcours(library, {
      ...p,
      titre: 'Relatifs (corrigé)',
    }).library
    expect(library.entries[0].parcours.version).toBe(2)
    library = saveParcours(library, {
      ...library.entries[0].parcours,
      objectif: 'Encore',
    }).library
    expect(library.entries[0].parcours.version).toBe(2)
    expect(unpublishedCount(library)).toBe(1)
  })

  it('ne publie ni ressource sans lien ni pause vide', () => {
    let p = splitIntoLevels(parcours())
    p.paliers![0].ressource = { titre: 'Fiche', lien: '' }
    p.paliers![0].pause = { texte: '  ' }
    p.paliers![1].ressource = { titre: 'Vidéo', lien: 'https://exemple.fr/v' }
    const { library, id } = saveParcours(emptyLibrary(), p)
    const sent = readParcoursFile(publish(assign(library, id, ['5e A'])).text)
      .classes[0].parcours[0]
    expect(sent.paliers?.[0].ressource).toBeUndefined()
    expect(sent.paliers?.[0].pause).toBeUndefined()
    expect(sent.paliers?.[1].ressource?.titre).toBe('Vidéo')
  })

  it('reprend un fichier publié sans rien perdre, sans doublon', () => {
    const { library: source, id } = saveParcours(emptyLibrary(), parcours())
    const file = readParcoursFile(publish(assign(source, id, ['5e A'])).text)
    const local = saveParcours(emptyLibrary(), {
      ...parcours(),
      titre: 'À moi',
    }).library
    let library = restore(local, file)
    expect(library.entries.map((e) => e.parcours.titre)).toEqual([
      'À moi',
      'Relatifs',
    ])
    expect(library.entries[1].classes).toEqual(['5e A'])
    expect(unpublishedCount(library)).toBe(0)
    library = restore(library, file)
    expect(library.entries).toHaveLength(2)
  })

  it('lit le format de l’application et refuse un fichier abîmé', () => {
    expect(
      timestampedName('parcours-mathalea', 'json', new Date(2026, 9, 15, 8, 5)),
    ).toBe('parcours-mathalea-2026-10-15-08h05.json')
    const text = createParcoursFile([
      { nom: '5e A', parcours: [{ ...parcours(), id: 'relatifs' }] },
    ])
    expect(readParcoursFile(text).classes[0].parcours[0].id).toBe('relatifs')
    expect(
      isParcours({
        ...parcours(),
        id: 'relatifs',
        paliers: [{ titre: 'x', nb: 1, acces: 'pause' }],
      }),
    ).toBe(false)
    expect(() => readParcoursFile('{"format":"autre"}')).toThrow(
      'fichier de parcours',
    )
    expect(() =>
      readParcoursFile(
        createParcoursFile([
          { nom: 'A', parcours: [] },
          { nom: 'A', parcours: [] },
        ]),
      ),
    ).toThrow()
  })
})

describe('objectifs', () => {
  it('importe un CSV au fil de l’année, sans doublon, et l’exporte', () => {
    const csv =
      'Code;Libellé;Niveau;Chapitre\n5N2G;Additionner deux nombres décimaux relatifs;5e;Nombres relatifs\n;"Lire ; écrire";;\n'
    const read = readObjectives(csv, '4e', 'Fractions')
    expect(read).toEqual([
      {
        libelle: 'Additionner deux nombres décimaux relatifs',
        code: '5N2G',
        niveau: '5e',
        theme: 'Nombres relatifs',
      },
      { libelle: 'Lire ; écrire', niveau: '4e', theme: 'Fractions' },
    ])
    expect(
      readObjectives('Additionner, soustraire', '5e', 'R')[0].libelle,
    ).toBe('Additionner, soustraire')
    expect(
      readObjectives('5N2G\tAdditionner\t5e\tRelatifs', '', '')[0].code,
    ).toBe('5N2G')
    expect(mergeObjectives(read, read)).toHaveLength(2)
    expect(readObjectives('﻿' + objectivesToCsv(read), '', '')).toEqual(read)
  })

  it('distingue un exercice par ses réglages, pas par son nombre de questions', () => {
    expect(exerciseKey({ uuid: 'a', sup: '2' })).not.toBe(
      exerciseKey({ uuid: 'a', sup: '3' }),
    )
    expect(exerciseKey({ ...step('a'), nbQuestions: 9 })).toBe(
      exerciseKey(step('a')),
    )
  })

  it('trouve l’objectif du programme d’un exercice dans le référentiel', async () => {
    const index = await exerciseIndex()
    const exercise = index.get('cbc26')
    expect(exercise?.niveau).toBe('5e')
    expect(exercise?.objective).toEqual({
      code: '5N2G',
      libelle: 'Additionner deux nombres décimaux relatifs',
    })
    expect(exercise?.interactif).toBe(true)
  })
})

describe('ceintures, icônes, libellés', () => {
  it('nomme les paliers en ceintures à partir de la première choisie', () => {
    const p = { style: 'ceintures' as const, premiereCeinture: 2 }
    expect([0, 1, 2].map((k) => levelName(p, k))).toEqual([
      'Ceinture orange',
      'Ceinture verte',
      'Ceinture bleue',
    ])
    expect(levelName({ style: 'ceintures', premiereCeinture: 6 }, 1)).toBe(
      'Ceinture noire, 2e dan',
    )
    expect(levelName({}, 1)).toBe('Palier 2')
  })
  it('propose une icône d’après le chapitre et dit « fin du palier » avec des paliers', () => {
    expect(suggestedIcon('Nombres relatifs')).toBe('bx-calculator')
    expect(suggestedIcon('Théorème de Pythagore')).toBe('bx-shape-triangle')
    expect(suggestedIcon('Probabilités')).toBe('bx-dice-5')
    expect(suggestedIcon('Chapitre inventé')).toBe('bx-book-content')
    expect(validationLabels(splitIntoLevels(parcours())).parcours).toBe(
      'À la fin du palier',
    )
    expect(
      validationLabels({ ...splitIntoLevels(parcours()), style: 'ceintures' })
        .parcours,
    ).toBe('À la fin de la ceinture')
    expect(validationLabels(parcours()).parcours).toBe('À la fin du parcours')
  })
})
