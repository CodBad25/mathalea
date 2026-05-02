import { describe, expect, it, vi } from 'vitest'

import {
  renderAMCCopyContent,
  renderAMCDocumentStart,
  renderAMCGroupSection,
  renderAMCHeader,
  renderAMCPreamble,
} from '../../src/lib/amc/amcDocumentTemplates'
import {
  checkAMCGroupConsistency,
  creerDocumentAmc,
} from '../../src/lib/amc/creerDocumentAmc'

describe('creerDocumentAmc templates', () => {
  it('rend un preambule AMC parametrable', () => {
    const preambule = renderAMCPreamble({
      documentClassOptions: '10pt,a4paper,french,svgnames',
    })

    expect(preambule).toContain(
      '\\documentclass[10pt,a4paper,french,svgnames]{article}',
    )
    expect(preambule).toContain(
      '\\usepackage[francais,bloc,insidebox,nowatermark]{automultiplechoice}',
    )
    expect(preambule).toContain('\\providecommand{\\R}{\\mathbb{R}}')
  })

  it('rend un entete AMC code grid parametrable', () => {
    const entete = renderAMCHeader({
      isA3: false,
      isAssociation: false,
      isCodeGrid: true,
      matiere: 'Mathématiques',
      titre: 'Evaluation',
      nbExemplaires: 2,
    })

    expect(entete).toContain('\\exemplaire{ 2 }{')
    expect(entete).toContain('\\textbf{ Mathématiques }')
    expect(entete).toContain('\\AMCcodeGrid[h]{ID}{ABCDEFGHIJKLMNOPQRSTUVWXYZ,')
  })

  it('rend un entete AMC association parametrable', () => {
    const entete = renderAMCHeader({
      isA3: true,
      isAssociation: true,
      isCodeGrid: false,
      matiere: 'Mathématiques',
      titre: 'Evaluation',
      nbExemplaires: 1,
    })

    expect(entete).toContain('\\newcommand{\\sujet}{')
    expect(entete).toContain('\\begin{multicols}{2}')
    expect(entete).toContain('\\nom{}~\\prenom{}')
  })

  it('rend un debut de document AMC parametrable', () => {
    const documentStart = renderAMCDocumentStart({
      seed: 12345,
      groupsContent: '\\element{G}{\\begin{question}{Q}X\\end{question}}',
    })

    expect(documentStart).toContain('\\begin{document}')
    expect(documentStart).toContain('\\AMCrandomseed{ 12345 }')
    expect(documentStart).toContain('\\FPseed=12345')
    expect(documentStart).toContain(
      '\\element{G}{\\begin{question}{Q}X\\end{question}}',
    )
  })

  it('rend un contenu de copie AMC parametrable', () => {
    const copyContent = renderAMCCopyContent({
      isCodeGrid: true,
      groupsSections:
        '\\begin{center}Titre\\end{center}\\restituegroupe[2]{G1}\\n',
      isA3: true,
      isAssociation: false,
    })

    expect(copyContent).toContain('\\def\\AMCchoiceLabel##1{}')
    expect(copyContent).toContain('\\restituegroupe[2]{G1}')
    expect(copyContent).toContain('\\end{multicols}')
    expect(copyContent).toContain('}')
  })

  it('rend une section de groupe AMC parametrable', () => {
    const groupSection = renderAMCGroupSection({
      groupTitle: 'Titre Groupe',
      groupName: 'G1',
      isMixed: false,
      questionsToRestore: 2,
    })

    expect(groupSection).toContain('\\bf\\Large Titre Groupe')
    expect(groupSection).toContain('\\setgroupmode{G1}{cyclic}')
    expect(groupSection).toContain('\\restituegroupe[2]{G1}')
    expect(groupSection).not.toContain('\\restituegroupe[2]{ G1 }')
  })

  it('propage les options de format et recto-verso au preambule du document', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: true })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Question',
              reponse: {
                valeur: 5,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          id: 'EXO',
          nbQuestions: 1,
          titre: 'Titre',
          listeQuestions: ['Question'],
          listeCorrections: ['Correction'],
        } as any,
      ],
      format: 'A3',
      typeEntete: 'AMCassociation',
    })

    expect(latex).toContain(
      '\\documentclass[twoside,10pt,a3paper,landscape,french,svgnames]{article}',
    )
    expect(latex).toContain('\\AMCrandomseed{')
    expect(latex).toContain('\\newcommand{\\sujet}{')
    expect(latex).toContain('\\begin{multicols}{2}')
    expect(latex).toContain('\\restituegroupe')

    vi.unstubAllGlobals()
  })

  it('ignore les exercices non amcReady lors de la restitution des groupes', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Question valide',
              reponse: {
                valeur: 7,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          id: 'READY',
          nbQuestions: 1,
          titre: 'Titre prêt',
          listeQuestions: ['Question valide'],
          listeCorrections: ['Correction valide'],
        } as any,
        {
          amcReady: false,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Question ignorée',
              reponse: {
                valeur: 3,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          id: 'NOT_READY',
          nbQuestions: 1,
          titre: 'Titre ignoré',
          listeQuestions: ['Question ignorée'],
          listeCorrections: ['Correction ignorée'],
        } as any,
      ],
    })

    expect(latex).toContain('\\element{READY}')
    expect(latex).toContain('\\restituegroupe')
    expect(latex).toContain('READY')
    expect(latex).not.toContain('\\element{NOT_READY}')
    expect(latex).not.toContain('\\restituegroupe{NOT_READY}')

    vi.unstubAllGlobals()
  })

  it('ne restitue pas un groupe sans element AMC genere', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [],
          id: 'EMPTY_READY',
          nbQuestions: 0,
          titre: 'Vide',
          listeQuestions: [],
          listeCorrections: [],
        } as any,
      ],
    })

    expect(latex).not.toContain('\\element{EMPTY_READY}')
    expect(latex).not.toContain('\\restituegroupe{EMPTY_READY}')

    vi.unstubAllGlobals()
  })

  it('detecte les groupes restitues sans element correspondant', () => {
    const report = checkAMCGroupConsistency(`
      \\element{A}{\\begin{question}{A1}X\\end{question}}
      \\restituegroupe{A}
      \\restituegroupe{B}
    `)

    expect(report.missingGroupDefinitions).toContain('B')
    expect(report.missingGroupDefinitions).not.toContain('A')
  })

  it('ne signale pas d incoherence sur un document AMC coherent', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Question',
              reponse: {
                valeur: 9,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          id: 'COHERENT',
          nbQuestions: 1,
          titre: 'Cohérent',
          listeQuestions: ['Question'],
          listeCorrections: ['Correction'],
        } as any,
      ],
    })

    const report = checkAMCGroupConsistency(latex)
    expect(report.missingGroupDefinitions).toHaveLength(0)

    vi.unstubAllGlobals()
  })

  it('injecte des packages dynamiques detectes depuis le contenu AMC', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Mesure : $\\ang{30}$',
              reponse: {
                valeur: 9,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          id: 'DYN_CONTENT',
          nbQuestions: 1,
          titre: 'Dynamique contenu',
          listeQuestions: ['Mesure : $\\ang{30}$'],
          listeCorrections: ['Correction'],
        } as any,
      ],
    })

    expect(latex).toContain('\\usepackage{siunitx}')

    vi.unstubAllGlobals()
  })

  it('injecte les listePackages et commandes latex des exercices dans le preambule AMC', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Question',
              reponse: {
                valeur: 2,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          listePackages: ['siunitx', 'cmd\\newcommand{\\AMCSpec}{ok}'],
          id: 'DYN_PACKAGES',
          nbQuestions: 1,
          titre: 'Dynamique packages',
          listeQuestions: ['Question'],
          listeCorrections: ['Correction'],
        } as any,
      ],
    })

    expect(latex).toContain('\\usepackage{siunitx}')
    expect(latex).toContain('\\newcommand{\\AMCSpec}{ok}')

    vi.unstubAllGlobals()
  })

  it('nettoie les collisions de packages pour eviter les option clash dans le preambule AMC dynamique', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCNum',
          autoCorrection: [
            {
              enonce: 'Tracer \\draw[color={red}] (0,0)--(1,1) puis \\ang{45}.',
              reponse: {
                valeur: 1,
                param: { digits: 1, decimals: 0, tpoint: ',' },
              },
            },
          ],
          listePackages: ['xcolor', 'siunitx', 'siunitx'],
          id: 'DYN_CLASH',
          nbQuestions: 1,
          titre: 'Dynamique collisions',
          listeQuestions: [
            'Tracer \\draw[color={red}] (0,0)--(1,1) puis \\ang{45}.',
          ],
          listeCorrections: ['Correction'],
        } as any,
      ],
    })

    expect(latex).not.toContain('\\usepackage[table,svgnames]{xcolor}')
    expect((latex.match(/\\usepackage\{siunitx\}/g) ?? []).length).toBe(1)

    vi.unstubAllGlobals()
  })

  it('prefere autoCorrectionAMC latex et exclut les balises html/svg du document exporte', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ checked: false })),
    })

    const latex = creerDocumentAmc({
      exercices: [
        {
          amcReady: true,
          amcType: 'AMCOpen',
          autoCorrection: [
            {
              enonce: '<ul><li>Enonce HTML</li></ul><svg><circle /></svg>',
              propositions: [
                {
                  texte: '<li>Correction HTML</li>',
                  statut: 3,
                  pointilles: true,
                },
              ],
            },
          ],
          autoCorrectionAMC: [
            {
              enonce: '\\begin{itemize}\\item Enonce LaTeX\\end{itemize}',
              propositions: [
                {
                  texte: 'Correction LaTeX',
                  statut: 3,
                  pointilles: true,
                },
              ],
            },
          ],
          id: 'AMCOPEN_LATEX',
          nbQuestions: 1,
          titre: 'AMCOpen LaTeX prioritaire',
          listeQuestions: ['Question'],
          listeCorrections: ['Correction'],
        } as any,
      ],
      assumeAmcPrepared: true,
    })

    expect(latex).toContain('Enonce LaTeX')
    expect(latex).toContain('Correction LaTeX')
    expect(latex).not.toContain('<ul>')
    expect(latex).not.toContain('<li>')
    expect(latex).not.toContain('<svg')

    vi.unstubAllGlobals()
  })
})
