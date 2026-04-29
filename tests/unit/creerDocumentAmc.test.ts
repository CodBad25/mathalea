import { describe, expect, it, vi } from 'vitest'

import {
  renderAMCCopyContent,
  renderAMCDocumentStart,
  renderAMCGroupSection,
  renderAMCHeader,
  renderAMCPreamble,
} from '../../src/lib/amc/amcDocumentTemplates'
import { creerDocumentAmc } from '../../src/lib/amc/creerDocumentAmc'

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
    expect(groupSection).toContain('\\setgroupmode{ G1 }{cyclic}')
    expect(groupSection).toContain('\\restituegroupe[2]{ G1 }')
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
})
