import { randint } from '../../modules/outils'
import { format as formatLatex } from '../Latex'
import { lettreDepuisChiffre } from '../outils/outilString'
import { renderAMCHybride, renderElement } from './amcRender'
import type { IExerciceAMC } from './amcTypes'

type ExportQcmAmcResult = [string, string, number, string, boolean]

export type CreerDocumentAmcOptions = {
  exercices: IExerciceAMC[]
  nbQuestions?: number[]
  nbExemplaires?: number
  matiere?: string
  titre?: string
  typeEntete?: string
  format?: string
}

/**
 *
 * @param {array} exercice TypeExercice
 * @param {number} idExo c'est un numéro unique pour gérer les noms des éléments d'un groupe de question, il est incrémenté par creerDocumentAmc()
 */

export function exportQcmAmc(
  exercice: IExerciceAMC,
  idExo: number,
): ExportQcmAmcResult {
  let ref = `${exercice.id}/${exercice.sup ? 'S:' + exercice.sup : ''}${exercice.sup2 ? 'S2:' + exercice.sup2 : ''}${exercice.sup3 ? 'S3:' + exercice.sup3 : ''}${exercice.sup4 ? 'S4:' + exercice.sup4 : ''}${exercice.sup5 ? 'S5:' + exercice.sup5 : ''}`
  if (ref[ref.length - 1] === '/') ref = ref.slice(0, -1)
  // Compatibilite transitoire: la structure historique AMCHybride est plus large que le typage strict actuel.
  const autoCorrection = exercice.autoCorrection as any[]
  const titre = exercice.titre
  const type = exercice.amcType
  let texQr = ''
  let id = 0
  let melange = true
  for (let j = 0; j < autoCorrection.length; j++) {
    if (autoCorrection[j] === undefined) {
      // normalement, cela ne devrait jamais arriver !
      autoCorrection[j] = {}
    }
    switch (type) {
      case 'qcmMono': // question QCM
      case 'qcmMult':
        texQr += renderElement(
          { type: 'qcm', data: autoCorrection[j] },
          {
            ref,
            id: `${ref}/${lettreDepuisChiffre(idExo + 1)}${id + 10}`,
            exercice,
            index: j,
          },
        )
        id++
        break
      case 'AMCOpen': // AMCOpen question ouverte corrigée par l'enseignant
        texQr += renderElement(
          { type: 'open', data: autoCorrection[j] },
          {
            ref,
            id: `${ref}/${lettreDepuisChiffre(idExo + 1)}${id + 10}`,
            exercice,
            index: j,
          },
        )
        id++
        break
      case 'AMCNum':
        texQr += renderElement(
          { type: 'num', data: autoCorrection[j] },
          {
            ref,
            id: `${ref}/${lettreDepuisChiffre(idExo + 1)}${id + 10}`,
            exercice,
            index: j,
          },
        )
        id++
        break
      default: {
        // Si on arrive ici, c'est que le type est AMCHybride
        const hybride = renderAMCHybride({
          type,
          autoCorrectionItem: autoCorrection[j],
          exercice,
          ref,
          idExo,
          questionIndex: j,
          currentId: id,
          melange,
        })
        texQr += hybride.texQr
        id = hybride.nextId
        melange = hybride.melange
        break
      }
    }
  }
  texQr = texQr.replaceAll(
    /(<br *\/?>[\n\t ]*)+<br *\/?>/gim,
    '\n\n\\medskip\n',
  )
  texQr = texQr.replaceAll('<br>', '\\\\\n')
  return [texQr, ref, exercice.nbQuestions, titre, melange]
}

/**
 * @author Jean-claude Lhote
 * Fonction qui crée un document pour AMC (pour le compiler, le package automultiplechoice.sty doit être présent)
 *
 *  exercices est un tableau d'exercies TypeExercice[]
 *
 * nbQuestions est un tableau pour préciser le nombre de questions à prendre dans chaque groupe pour constituer une copie
 * s'il est indéfini, toutes les questions du groupe seront posées.
 * nb_exemplaire est le nombre de copies à générer
 * matiere et titre se passent de commentaires : ils renseignent l'entête du sujet.
 * @param {{
 *   exercices: import('../types').IExercice[],
 *   nbQuestions?: number[],
 *   nbExemplaires?: number,
 *   matiere?: string,
 *   titre?: string,
 *   typeEntete?: string,
 *   format?: string
 * }} options
 */
export function creerDocumentAmc(options: CreerDocumentAmcOptions): string {
  const {
    exercices,
    nbQuestions = [] as number[],
    nbExemplaires = 1,
    matiere = 'Mathématiques',
    titre = 'Evaluation',
    typeEntete = 'AMCcodeGrid',
    format = 'A4',
  } = options
  // Attention exercices est maintenant un tableau de tous les exercices.
  // Dans cette partie, la fonction récupère toutes les exercices et les trie pour les rassembler par groupe
  // Toutes les questions d'un même exercice seront regroupées ce qui permet éventuellement de les récupérer dans des fichiers individuels pour se constituer une base
  let idExo = 0
  let indexOfCode
  const nombreDeQuestionsIndefinie: boolean[] = []
  const graine = randint(1, 100000)
  const groupeDeQuestions: string[] = []
  const texQuestions: string[] = ['']
  const titreQuestion: string[] = []
  const melangeQuestion: boolean[] = []
  const nombreExoAmc = exercices.filter((el) => el.amcReady).length
  if (nombreExoAmc === 0) return ''
  for (const exercice of exercices) {
    const code = exportQcmAmc(exercice, idExo)
    idExo++
    indexOfCode = groupeDeQuestions.indexOf(code[1])
    if (indexOfCode === -1) {
      // si le groupe n'existe pas
      groupeDeQuestions.push(code[1])
      indexOfCode = groupeDeQuestions.indexOf(code[1])
      texQuestions[indexOfCode] = formatLatex(code[0])

      // Si le nombre de questions du groupe n'est pas défini, alors on met toutes les questions sinon on laisse le nombre choisi par l'utilisateur
      if (typeof nbQuestions[indexOfCode] === 'undefined') {
        nombreDeQuestionsIndefinie[indexOfCode] = true
        nbQuestions[indexOfCode] = code[2]
      } else {
        // Si le nombre de question (à restituer pour ce groupe de question) a été défini par l'utilisateur, alors on le laisse !
        nombreDeQuestionsIndefinie[indexOfCode] = false
      }
      // Si le nombre de questions du groupe n'est pas défini, alors on met toutes les questions sinon on laisse le nombre choisi par l'utilisateur
      titreQuestion[indexOfCode] = code[3]
      melangeQuestion[indexOfCode] = code[4]
    } else {
      // Donc le groupe existe, on va vérifier si la question existe déjà et si non, on l'ajoute.
      if (texQuestions[indexOfCode].indexOf(code[0]) === -1) {
        texQuestions[indexOfCode] += code[0]
        // Si le nombre de questions du groupe n'est pas défini, alors on met toutes les questions sinon on laisse le nombre choisi par l'utilisateur
        if (nombreDeQuestionsIndefinie[indexOfCode]) {
          nbQuestions[indexOfCode] += code[2]
        }
      }
    }
  }
  // Fin de la préparation des groupes

  let isImpressionRectoVerso = false
  const checkBoxImpressionRectoVerso = document.getElementById(
    'impression_recto_verso',
  ) as HTMLInputElement | null
  if (checkBoxImpressionRectoVerso !== null)
    isImpressionRectoVerso = checkBoxImpressionRectoVerso.checked
  // variable qui contiendra le code LaTeX pour AMC
  let codeLatex = ''

  // variable preambule à abonder le cas échéant si des packages sont nécessaires.
  // Merci à Sébastien Lozano pour la vérification des dépendances
  // Merci à Liouba Leroux pour ses documents qui ont servi de base
  // A faire : abonder le preambule pour qu'il colle à tous les exos Mathalea_AMC

  let preambule = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  %%%%% -I- PRÉAMBULE %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  \n`
  if (format === 'A3') {
    preambule += `\t \\documentclass[${isImpressionRectoVerso ? 'twoside,' : ''}10pt,a3paper,landscape,french,svgnames]{article}\n`
  } else {
    preambule += `\t \\documentclass[${isImpressionRectoVerso ? 'twoside,' : ''}10pt,a4paper,french,svgnames]{article}\n`
  }

  preambule += `\t
  %%%%%% EE : Le mettre le plus tôt possible pour éviter un Warning à la compilation
  \\RequirePackage{etex}\t  % pour avoir plus de "registres" mémoires / tikz...
  %%%%% PACKAGES LANGUE %%%%%
  \\usepackage{babel} % sans option => langue définie dans la classe du document
   \\usepackage[T1]{fontenc} % pour de la compilation en luaLaTex, faudra changer : voir alacarte.ts
   \\usepackage[utf8x]{inputenc} % pour de la compilation en luaLaTex, faudra changer : voir alacarte.ts
   \\usepackage{lmodern}\t        \t% Choix de la fonte (Latin Modern de D. Knuth)
   \\usepackage{fp}
   \\usepackage{ProfCollege}

  %%%%%%%%%%%%%%%%%%%%% SPÉCIFICITÉS A.M.C. %%%%%%%%%%%%%%%%%%%%%%
  %\\usepackage[francais,bloc,completemulti]{automultiplechoice}
  %   remarque : avec completmulti => "aucune réponse ne convient" en +
   \\usepackage[francais,bloc,insidebox,nowatermark]{automultiplechoice} %//,insidebox
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  %%%%% PACKAGES MISE EN PAGE %%%%%
   \\usepackage{multicol}
   \\usepackage{wrapfig}
   \\usepackage{fancybox}  % pour \\doublebox \\shadowbox  \\ovalbox \\Ovalbox
   \\usepackage{calc} \t% Calculs
   \\usepackage{enumerate}\t% Pour modifier les numérotations
   \\usepackage{enumitem}
   \\usepackage{tabularx}\t% Pour faire des tableaux

   \\usepackage{xargs}\t% EE : pour permettre DES options dans newcommand

  %%%%% PACKAGES FIGURES %%%%%
  %\\usepackage{pstricks,pst-plot,pstricks-add}
  %   POUR PSTRICKS d'où compilation sans PDFLateX mais : dvi, dvi2ps, ps2PDF...
  %   MAIS ON PRÉFÉRERA UTILISER TIKZ...
  \\usepackage{xcolor}% [avant tikz] xcolor permet de nommer + de couleurs
  \\usepackage{pgf,tikz}
  \\usepackage{graphicx} % pour inclure une image
  \\usetikzlibrary{arrows,calc,fit,patterns,plotmarks,shapes.geometric,shapes.misc,shapes.symbols,shapes.arrows,
    shapes.callouts, shapes.multipart, shapes.gates.logic.US,shapes.gates.logic.IEC, er, automata,backgrounds,chains,topaths,trees,petri,mindmap,matrix, calendar, folding,fadings,through,positioning,scopes,decorations.fractals,decorations.shapes,decorations.text,decorations.pathmorphing,decorations.pathreplacing,decorations.footprints,decorations.markings,shadows,babel} % Charge toutes les librairies de Tikz
  \\usepackage{tkz-tab,tkz-fct,tkz-euclide}\t% Géométrie euclidienne avec TikZ
  %\\usetkzobj{all} %problème de compilation

  %%%%% PACKAGES MATHS %%%%%
   \\usepackage{ucs}
   \\usepackage{bm}
   \\usepackage{amsmath}
   \\usepackage{amsfonts}
   \\usepackage{amssymb}
   \\usepackage{gensymb}
   \\usepackage{eurosym}
   \\usepackage{frcursive}
   \\newcommand{\\Vcurs}{\\begin{cursive}V\\end{cursive}}
   \\usepackage[normalem]{ulem}
   % plus utilisé avec ProfCollege
   % \\usepackage{sistyle} \\SIdecimalsign{,} %% => \\num{...} \\num*{...}
   % cf. http://fr.wikibooks.org/wiki/LaTeX/%C3%89crire_de_la_physique
   %  sous Ubuntu, paquet texlive-science à installer
   %\\usepackage[autolanguage,np]{numprint} % déjà appelé par défaut dans introLatex
   \\usepackage{mathrsfs}  % Spécial math
   %\\usepackage[squaren]{SIunits}\t% Pour les unités (gère le conflits avec  \\square de l'extension amssymb)
   \\usepackage{pifont}\t% Pour les symboles "ding"
   \\usepackage{bbding}\t% Pour les symboles
   \\usepackage[misc]{ifsym}\t% Pour les symboles
   \\usepackage{cancel}\t% Pour pouvoir barrer les nombres

  %%%%% AUTRES %%%%%
   \\usepackage{ifthen}
   \\usepackage{url} \t        \t% Pour afficher correctement les url
   \\urlstyle{sf}                          \t% qui s'afficheront en police sans serif
   \\usepackage{fancyhdr,lastpage}          \t% En-têtes et pieds
    \\pagestyle{fancy}                      \t% de pages personnalisés
   \\usepackage{fancybox}\t% Pour les encadrés
   \\usepackage{xlop}\t% Pour les calculs posés
  %\\usepackage{standalone}\t% Pour avoir un apercu d'un fichier qui sera utilisé avec un input
   \\usepackage{multido}\t% Pour faire des boucles
  %\\usepackage{hyperref}\t% Pour gérer les liens hyper-texte
   \\usepackage{fourier}
   \\usepackage{colortbl} \t% Pour des tableaux en couleur
   \\usepackage{setspace}\t% Pour \\begin{spacing}{2.0} \\end{spacing}
   \\usepackage{multirow}\t% Pour des cellules multilignes dans un tableau
  %\\usepackage{import}\t% Equivalent de input mais en spécifiant le répertoire de travail
  %\\usepackage[]{qrcode}
  %\\usepackage{pdflscape}
   \\usepackage[framemethod=tikz]{mdframed} % Pour les cadres
   \\usepackage{tikzsymbols}
   \\usepackage{scratch3}
  %\\usepackage{tasks}\t% Pour les listes horizontales
\\usepackage{csvsimple}

  %%%%% Librairies utilisées par Mathgraphe32 %%%%
  \\usepackage{fix-cm}
  \\usepackage{textcomp}
  
  %%%%% PERSONNALISATION %%%%%
  \\renewcommand{\\multiSymbole}{$\\begin{smallmatrix}\\circ\\bullet\\bullet \\\\
           \\circ\\bullet\\circ \\end{smallmatrix}$\\noindent} % par défaut $\\clubsuit$
  %\\renewcommand{\\multiSymbole}{\\textbf{(! Évent. plusieurs réponses !)}\\noindent} % par défaut $\\clubsuit$
  \\renewcommand{\\AMCbeginQuestion}[2]{\\noindent{\\colorbox{gray!20}{\\bf#1}}#2}
  %\\renewcommand{\\AMCIntervalFormat}[2]{\\texttt{[}#1\\,;\\,#2\\texttt{[}}
                           % Crochets plus nets, virgule...
  %\\AMCboxDimensions{size=1.7ex,down=.2ex} %% taille des cases à cocher diminuée
  \\newcommand{\\collerVertic}{\\vspace{-3mm}} % évite un trop grand espace vertical
  \\newcommand{\\TT}{\\sout{\\textbf{Tiers Temps}} \\noindent} %
  \\newcommand{\\Prio}{\\fbox{\\textbf{PRIORITAIRE}} \\noindent} %
  \\newcommandx{\\notation}[3][2=false,3=true]{
    \\AMCOpen{lines=#1,lineup=#2,lineuptext=\\hspace{1cm},dots=#3}{\\mauvaise[{\\tiny NR}]{NR}\\scoring{0}\\mauvaise[{\\tiny RR}]{RR}\\scoring{0.01}\\mauvaise[{\\tiny R}]{R}\\scoring{0.33}\\mauvaise[{\\tiny V}]{V}\\scoring{0.67}\\bonne[{\\tiny VV}]{VV}\\scoring{1}}
  }
  %%\\newcommand{\\notation}[1]{
  %%\\AMCOpen{lines=#1}{\\mauvaise[{\\tiny NR}]{NR}\\scoring{0}\\mauvaise[{\\tiny RR}]{RR}\\scoring{0.01}\\mauvaise[{\\tiny R}]{R}\\scoring{0.33}\\mauvaise[{\\tiny V}]{V}\\scoring{0.67}\\bonne[{\\tiny VV}]{VV}\\scoring{1}}
  %%}
  
  %%pour afficher ailleurs que dans une question
  \\makeatletter
  \\newcommand{\\AffichageSiCorrige}[1]{\\ifAMC@correc #1\\fi}
  \\makeatother
  
  
  %%%%% TAILLES %%%%%
   \\usepackage{geometry}
   \\geometry{headsep=0.3cm, left=1.5cm,right=1.5cm,top=2.4cm,bottom=1.5cm}
   \\DecimalMathComma
  
   \\AMCcodeHspace=.3em % réduction de la taille des cases pour le code élève
   \\AMCcodeVspace=.3em
  % \\AMCcodeBoxSep=.1em
   
   \\def\\AMCotextReserved{\\emph{Ne rien cocher, réservé au prof !}}
   
  %%%%%% Définition des barèmes
  \\baremeDefautS{
    e=0.0001,% incohérence (plusieurs réponses données à 0,0001 pour définir des manquements au respect de consignes)
    b=1,% bonne réponse 1
    m=-0.01,% mauvaise réponse 0,01 pour différencier de la
    v=0} % non réponse qui reste à 0
  
  \\baremeDefautM{formula=((NBC-NMC)/NB)*((NBC-NMC)/NB>0)} % nombre de bonnes réponses cochées minorées des mauvaises réponses cochées, ramenées à 1, et ramenée à 0 si résultat négatif.
  
  %%%%%%%%% Paramètres pour réponses à construire
  \\AMCinterIrep=0pt \\AMCinterBrep=.5ex \\AMCinterIquest=0pt \\AMCinterBquest=3ex \\AMCpostOquest=7mm \\setlength{\\AMChorizAnswerSep}{3em plus 4em} \\setlength{\\AMChorizBoxSep}{1em}
  %%%%% Fin du préambule %%%%%%%
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  `

  // Variable contenant la partie document
  // Celle-ci contient une partie statique et une partie variable (la zone de définition des groupes qui est construite à la volée à partir de la variable groupeDeQuestions alimentée au début)

  let debutDocument = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%% -II-DOCUMENT %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\\begin{document}
\\AMCrandomseed{${graine}}   % On choisit les "graines" pour initialiser le "hasard"
\\FPseed=${graine}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%% -II-a. CONCEPTION DU QCM %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  %%% préparation des groupes
  \\setdefaultgroupmode{cyclic}\n`

  for (const g of groupeDeQuestions) {
    const i = groupeDeQuestions.indexOf(g)
    debutDocument += texQuestions[i]
  }

  // Variable qui contient l'entête d'une copie
  // A faire : Proposer différent type d'entête en fonction d'un paramètre ?
  const enteteTypeCodeGrid = `\\begin{minipage}{10cm}
  \\champnom{\\fbox{\\parbox{10cm}{
    Écrivez vos nom, prénom et classe : \\\\
  }}}
  \\end{minipage}
  
  %\\\\
  \\vspace{2mm}
  
  Puis remplir les cases des trois premières lettres de votre \\textbf{nom de famille} PUIS des deux premières lettres de votre \\textbf{prénom}
  \\vspace{1mm}

  \\def\\AMCchoiceLabelFormat##1{\\textcolor{black!70}{{\\tiny ##1}}}  % pour alléger la couleur des lettres dans les cases et les réduire
  \\AMCcodeGrid[h]{ID}{ABCDEFGHIJKLMNOPQRSTUVWXYZ,
  ABCDEFGHIJKLMNOPQRSTUVWXYZ,
  ABCDEFGHIJKLMNOPQRSTUVWXYZ,
  ABCDEFGHIJKLMNOPQRSTUVWXYZ,
  ABCDEFGHIJKLMNOPQRSTUVWXYZ}
  `
  const enteteTypeChampnomSimple = `\\begin{minipage}{10cm}
  \\champnom{\\fbox{\\parbox{10cm}{
    Écrivez vos nom, prénom et classe : \\\\
   \\\\
  }}}
  \\end{minipage}
  
  %\\\\
  \\vspace{2mm}
  `
  const enteteTypePreremplie = `\\begin{center}
  \\noindent{}\\fbox{\\vspace*{3mm}
       \\Large\\bf\\nom{}~\\prenom{}\\normalsize{}%
        \\vspace*{3mm}
      }
  \\end{center}\n`

  let enteteCopie = ''
  if (typeEntete === 'AMCassociation') {
    enteteCopie += '\\newcommand{\\sujet}{\n'
  }
  enteteCopie += `
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  %%%% -II-b. MISE EN PAGE DU QCM %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  \\exemplaire{${nbExemplaires}}{   % <======  /!\\ PENSER À ADAPTER /!\\  ===  %
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  \n`
  if (format === 'A3') {
    enteteCopie += '\\begin{multicols}{2}\n'
  }
  enteteCopie += `
  %%%%% EN-TÊTE, IDENTIFICATION AUTOMATIQUE DE L'ÉLÈVE %%%%%
  
  \\vspace*{-17mm}
  
  %%%%% INTRODUCTION ÉVENTUELLE %%%%%
  
  \\vspace{5mm}
  %\\noindent\\AMCcode{num.etud}{8}\\hspace*{\\fill} % Pour la version "verticale"
  %\\noindent\\AMCcodeH{num.etud}{8}\t % version "horizontale"
  \\begin{minipage}{7cm}
  \\begin{center}
    \\textbf{${matiere}}
    
    \\textbf{${titre}}
  \\end{center}
  \\end{minipage}
  \\hfill\n`
  if (typeEntete === 'AMCassociation') {
    enteteCopie += enteteTypePreremplie
  } else if (typeEntete === 'AMCcodeGrid') {
    enteteCopie += enteteTypeCodeGrid
  } else {
    enteteCopie += enteteTypeChampnomSimple
  }
  enteteCopie += `\n{\\footnotesize REMPLIR avec un stylo NOIR la ou les cases pour chaque question. Si vous devez modifier un choix, NE PAS chercher à redessiner la case cochée par erreur, mettez simplement un coup de "blanc" dessus.
  
  Les questions précédées de \\multiSymbole peuvent avoir plusieurs réponses.\\\\ Les questions qui commencent par \\TT ne doivent pas être faites par les élèves disposant d'un tiers temps.
  
   Il est fortement conseillé de faire les calculs dans sa tête ou sur la partie blanche de la feuille sans regarder les solutions proposées avant de remplir la bonne case plutôt que d'essayer de choisir entre les propositions (ce qui demande de toutes les examiner et prend donc plus de temps) }
  
  `

  // Ici On ajoute les commandes pour insérer les questions issues des groupes en quantité selon le nb_question[i]
  // nb_question est un tableau passé en paramètre à la fonction creerDocumentAmc pour déterminer le nombre de questions à restituer par groupe.
  // si ce nombre est 0, on restitue toutes les questions du groupe
  let contenuCopie = ''
  if (typeEntete === 'AMCcodeGrid') {
    contenuCopie += '\t \\def\\AMCchoiceLabel##1{}'
  }
  for (const g of groupeDeQuestions) {
    const i = groupeDeQuestions.indexOf(g)
    contenuCopie += `
  \\begin{center}
    \\hrule
    \\vspace{2mm}
    \\bf\\Large ${titreQuestion[i]}
    \\vspace{1mm}
    \\hrule
  \\end{center}\n`
    if (!melangeQuestion[i]) {
      contenuCopie += `\\setgroupmode{${g}}{cyclic}\n\n`
    }
    // contenuCopie += `\\melangegroupe{${g}}\n` // Pour Eric, ne pas effacer
    if (nbQuestions[i] > 0) {
      contenuCopie += `\\restituegroupe[${nbQuestions[i]}]{${g}}\n\n`
    } else {
      contenuCopie += `\\restituegroupe{${g}}\n\n`
    }
  }
  if (format === 'A3') {
    contenuCopie += '\\end{multicols}\n'
  }
  if (typeEntete === 'AMCassociation') {
    contenuCopie += `\\AMCassociation{\\id}\n
    }
  }\n`
  } else {
    contenuCopie += '}\n'
  }

  // On assemble les différents morceaux et on retourne le résultat
  codeLatex =
    preambule + '\n' + debutDocument + '\n' + enteteCopie + contenuCopie
  if (typeEntete === 'AMCassociation') {
    codeLatex +=
      '\n \n \\csvreader[head to column names]{liste.csv}{}{\\sujet}\n'
  }
  codeLatex += '\\end{document}\n'
  return codeLatex
}
