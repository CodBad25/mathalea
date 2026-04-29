<script lang="ts">
  import { saveAs } from 'file-saver'
  import JSZip from 'jszip'
  import {
    mathaleaGetExercicesFromParams,
    mathaleaUpdateExercicesParamsFromUrl,
  } from '../../../lib/mathalea'
  import { darkMode, exercicesParams } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import {
    isIExercice,
    type IExercice,
    type IExerciceStatique,
  } from '../../../lib/types'
  import Footer from '../../Footer.svelte'
  import ButtonToggleAlt from '../../shared/forms/ButtonToggleAlt.svelte'
  import FormRadio from '../../shared/forms/FormRadio.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import Tabs from '../../shared/ui/Tabs.svelte'

  const copyCode = async () => {
    const preElt = document.querySelector('pre')
    if (preElt) {
      try {
        const text = preElt.innerText
        await navigator.clipboard.writeText(text)
      } catch (err) {
        console.error('Accès au presse-papier impossible: ', err)
      }
    } else {
      throw new Error("Can't find `pre` selector in document")
    }
  }

  function downloadGift() {
    const preElt = document.querySelector('pre')
    if (preElt) {
      const text = preElt.innerText
      const element = document.createElement('a')
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
      )
      element.setAttribute('download', 'mathalea-gift.txt')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } else {
      throw new Error("Can't find `pre` selector in document")
    }
  }

  function downloadScorm() {
    const zip = new JSZip()
    zip.file('imsmanifest.xml', contentScorm)
    let indexHtml = ''
    indexHtml += '<html>\n'
    indexHtml += '  <head>\n'
    indexHtml += '    <title>MathAlea</title>\n'
    indexHtml +=
      '    <scr' +
      'ipt type="text/javascript" src="https://coopmaths.fr/alea/assets/externalJs/SCORM_API_wrapper.js"></scr' +
      'ipt>\n'
    indexHtml +=
      '    <scr' +
      'ipt type="text/javascript" src="https://coopmaths.fr/alea/assets/externalJs/moodle.scorm.js"></scr' +
      'ipt>\n'
    indexHtml += '  </head>\n'
    indexHtml += '  <body></body>\n'
    indexHtml += '</html>\n'
    zip.file('index.html', indexHtml)
    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, 'mathalea.scorm.zip')
    })
  }

  let contentGift = ''
  let contentScorm = ''
  /*
    <organizations default="coopmaths.fr">
        <organization identifier="coopmaths.fr" structure="hierarchical">
          <title>MathAlea</title>
          <item identifier="MathAlea-Exo1" isvisible="true" identifierref="MathAlea-Exo1">
            <title>Décomposer un nombre entier en produit de (petits) facteurs premiers</title>
          </item>
          <item identifier="MathAlea-Exo2" isvisible="true" identifierref="MathAlea-Exo2">
            <title>Utiliser la simple distributivité</title>
          </item>
        </organization>
      </organizations>
      <resources>
        <resource identifier="MathAlea-Exo1" type="webcontent" adlcp:scormtype="sco"
          href="index.html#uuid=1eaf7&id=4A11-0&alea=3HRw">
          <dependency identifierref="COMMON_FILES"/>
        </resource>
        <resource identifier="MathAlea-Exo2" type="webcontent" adlcp:scormtype="sco"
          href="index.html#uuid=71dd8&id=4L10&alea=9QsD">
          <dependency identifierref="COMMON_FILES"/>
        </resource>
        <resource identifier="COMMON_FILES" type="webcontent" adlcp:scormtype="asset">
          <file href="index.html" />
        </resource>
      </resources>
  */
  let exercices: (IExercice | IExerciceStatique)[] = []

  let justBookmarklet = false

  async function initExercices() {
    contentGift = ''
    let xmlScorm = document.implementation.createDocument('', '', null)
    let xmlManifest = xmlScorm.createElement('manifest')
    xmlManifest.setAttribute('identifier', 'MathAlea')
    xmlManifest.setAttribute('version', '1.0')
    xmlScorm.appendChild(xmlManifest)
    /*<metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    </metadata>*/
    let xmlMetadata = xmlScorm.createElement('metadata')
    let xmlSchema = xmlScorm.createElement('schema')
    xmlSchema.textContent = 'ADL SCORM'
    let xmlSchemaVersion = xmlScorm.createElement('schemaversion')
    xmlSchemaVersion.textContent = '1.2'
    xmlMetadata.appendChild(xmlSchema)
    xmlMetadata.appendChild(xmlSchemaVersion)
    xmlManifest.appendChild(xmlMetadata)
    let xmlOrganizations = xmlScorm.createElement('organizations')
    xmlOrganizations.setAttribute('default', 'coopmaths.fr')
    let xmlOrganization = xmlScorm.createElement('organization')
    xmlOrganization.setAttribute('identifier', 'coopmaths.fr')
    xmlOrganization.setAttribute('structure', 'hierarchical')
    let xmlTitle = xmlScorm.createElement('title')
    xmlTitle.textContent = 'MathAlea'
    xmlOrganization.appendChild(xmlTitle)
    xmlOrganizations.appendChild(xmlOrganization)
    xmlManifest.appendChild(xmlOrganizations)
    let xmlResources = xmlScorm.createElement('resources')
    xmlManifest.appendChild(xmlResources)
    mathaleaUpdateExercicesParamsFromUrl()
    exercices = await mathaleaGetExercicesFromParams($exercicesParams)
    if (exercices.length === 0) {
      tab = 'bookmarklet'
      justBookmarklet = true
    }
    let i = 0
    for (const param of $exercicesParams) {
      let paramUrl = ''
      for (const key of Object.keys(param)) {
        if (key === 'sup') {
          // 28-10-2025 Ajout de encodeURIComponent pour gérer DéfiTable correctement
          // A vérifier que ça ne casse pas d'autres choses
          paramUrl += `s\\=${encodeURIComponent(param[key] || '')}&`
        } else if (key === 'sup2') {
          paramUrl += `s2\\=${param[key]}&`
        } else if (key === 'sup3') {
          paramUrl += `s3\\=${param[key]}&`
        } else if (key === 'sup4') {
          paramUrl += `s4\\=${param[key]}&`
        } else if (key === 'sup5') {
          paramUrl += `s5\\=${param[key]}&`
        } else if (key === 'nbQuestions') {
          paramUrl += `n\\=${param[key]}&`
        } else if (key === 'versionQcm') {
          paramUrl += `qcm\\=${param[key]}&`
        } else if (key !== 'alea' && key !== 'id') {
          paramUrl += `${key}\\=${param[key]}&`
        }
      }
      paramUrl = paramUrl.slice(0, -1)
      const exercice = exercices[i]
      const titre = isIExercice(exercice)
        ? exercice.titre
        : (param.id ?? param.uuid)
      const nbQuestions = isIExercice(exercice) ? exercice.nbQuestions : 1
      let graine
      if (aleaType === 'alea') {
        graine = ' graine\\="-1"'
      } else if (aleaType === 'moodle') {
        graine = ''
      } else {
        graine = ` graine\\="${param.alea}" `
      }
      contentGift += `:: ${param.id} - ${titre} - ${nbQuestions} ${nbQuestions > 1 ? 'questions' : 'question'} ::\n`
      contentGift +=
        '<script src\\="https\\:\/\/coopmaths.fr\/alea\/assets\/externalJs\/moodle.js" type\\="module"><\/script>\n'
      contentGift += `<mathalea-moodle v="4" url\\="${paramUrl}"${showTitle ? '' : ' titre="false"'}${graine}/>\n`
      contentGift += '{\n'
      contentGift +=
        '=%100%100|*=%90%90|*=%83.33333%83.333|*=%80%80|*=%75%75|*=%66.66667%66.666|*=%60%60|*=%50%50|*=%40%40|*=%33.33333%33.333|*=%30%30|*=%25%25|*=%20%20|*=%16.66667%16.666|*=%14.28571%14.2857|*=%12.5%12.5|*=%11.11111%11.111|*=%10%10|*=%5%5|*=%0%0|*\n'
      contentGift +=
        '####<script src\\="https\\:\/\/coopmaths.fr\/alea\/assets\/externalJs\/moodle.js" type\\="module"><\/script>\n'
      contentGift += `<mathalea-moodle v="4" url\\="${paramUrl}"${showTitle ? '' : ' titre="false"'}${graine} correction />\n`
      contentGift += '}\n\n'
      let xmlItem = xmlScorm.createElement('item')
      xmlItem.setAttribute('identifier', `MathAlea-Exo${i + 1}`)
      xmlItem.setAttribute('isvisible', 'true')
      xmlItem.setAttribute('identifierref', `MathAlea-Exo${i + 1}`)
      let xmlTitle = xmlScorm.createElement('title')
      xmlTitle.textContent = titre
      xmlItem.appendChild(xmlTitle)
      xmlOrganization.appendChild(xmlItem)
      let xmlResource = xmlScorm.createElement('resource')
      xmlResource.setAttribute('identifier', `MathAlea-Exo${i + 1}`)
      xmlResource.setAttribute('type', 'webcontent')
      xmlResource.setAttribute('adlcp:scormtype', 'sco')
      xmlResource.setAttribute(
        'href',
        'index.html#' +
          paramUrl.replaceAll('\\=', '=') +
          (useAlea ? '' : '&alea=' + param.alea),
      )
      let xmlDependency = xmlScorm.createElement('dependency')
      xmlDependency.setAttribute('identifierref', 'COMMON_FILES')
      xmlResource.appendChild(xmlDependency)
      xmlResources.appendChild(xmlResource)
      i++
    }
    let xmlResource = xmlScorm.createElement('resource')
    xmlResource.setAttribute('identifier', 'COMMON_FILES')
    xmlResource.setAttribute('type', 'webcontent')
    xmlResource.setAttribute('adlcp:scormtype', 'asset')
    let xmlFile = xmlScorm.createElement('file')
    xmlFile.setAttribute('href', 'index.html')
    xmlResource.appendChild(xmlFile)
    xmlResources.appendChild(xmlResource)
    contentScorm = new XMLSerializer().serializeToString(xmlScorm)
    let ident = ''
    // Debut Beautify XML
    // Remarque : il s'agit d'un code maison qui ne gère probablement pas tous les cas
    //            mais suffit emplement ici
    let dir = 1
    contentScorm =
      '<' +
      contentScorm
        .split('<')
        .slice(1)
        .reduce((a, x) => {
          if (x[0] === '/') {
            if (dir === 1) {
              a += '<' + x
            } else {
              a += '\n' + ident + '<' + x
            }
            ident = ident.slice(1)
            dir = -1
          } else {
            ident += ' '
            a += '\n' + ident + '<' + x
            dir = 1
            if (x.includes('/>')) {
              ident = ident.slice(1)
              dir = -1
            }
          }
          return a
        })
    // Fin Beautify XML
    contentScorm = '<?xml version="1.0" encoding="UTF-8"?>\n' + contentScorm
  }

  let aleaType = 'alea' // 'alea' | 'moodle' | 'graine'
  let useAlea = true
  let showTitle = true
  $: {
    aleaType
    useAlea
    showTitle
    initExercices()
  }

  let tab = 'gift'

  $: moodleTabs = justBookmarklet
    ? [
        {
          id: 'bookmarklet',
          label: 'Marque-page magique',
          ariaControls: 'tabs-bookmarklet',
        },
      ]
    : [
        { id: 'gift', label: 'Export Gift (Quiz)', ariaControls: 'tabs-gift' },
        { id: 'scorm', label: 'Export SCORM', ariaControls: 'tabs-scorm' },
        {
          id: 'bookmarklet',
          label: 'Marque-page magique',
          ariaControls: 'tabs-bookmarklet',
        },
      ]

  function handleTabChange(e: CustomEvent<string>) {
    tab = e.detail
  }
</script>

<main
  class="bg-coopmaths-canvas dark:bg-coopmathsdark-canvas {$darkMode.isActive
    ? 'dark'
    : ''}"
>
  <NavBar
    subtitle="Moodle"
    subtitleType="export"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />
  <div
    class="flex flex-col h-full w-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
  >
    <div
      class="h-full w-full md:w-2/3 lg:w-3/5 flex flex-col px-4 pb-4 md:py-10 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark mx-auto"
    >
      <!--
      <div
        class="flex flex-col md:flex-row justify-start px-4 py-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        <h3
          class="font-bold text-2xl text-coopmaths-struct dark:text-coopmathsdark-struct bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
        >
          Choix du type d'export Moodle
        </h3>
      </div>
      -->
      <!-- Tabulations pour la présentation -->
      <Tabs tabs={moodleTabs} activeTab={tab} on:change={handleTabChange} />
      <!-- Pages des réglages -->
      <div class="pb-6 pt-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
        <div
          class="transition-opacity duration-150 ease-linear {tab === 'gift'
            ? 'block opacity-100'
            : 'hidden opacity-0'}"
          id="tabs-gift"
          role="tabpanel"
          aria-labelledby="tabs-gift-btn"
        >
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            <!-- DEBUT GIFT -->
            <section
              class="px-4 py-0 md:py-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas w-full"
            >
              <h1
                class="mt-12 mb-4 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Comment l'utiliser ?
              </h1>

              <p
                class="text-coopmaths-corpus dark:text-coopmathsdark-corpus text-lg md:text-xl"
              >
                MathALÉA vous permet de créer un fichier au format gift que vous
                pourrez ensuite importer dans la banque de questions de votre
                plateforme Moodle. Vous trouverez de plus amples informations
                dans notre <a
                  href="https://forge.apps.education.fr/coopmaths/mathalea/-/wikis/Utilisation-de-Mathalea-avec-Moodle"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-coopmaths-action dark:text-coopmathsdark-action"
                  >documentation</a
                >.
              </p>
              <h1
                class="mt-12 mb-4 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Exportation
              </h1>

              <div class="flex flex-col justify-center items-center space-y-2">
                <div class="pl-4 pt-4">
                  <div
                    class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
                  >
                    Aléatoire
                  </div>
                  <FormRadio
                    title="Type d'aléatoire"
                    bind:valueSelected={aleaType}
                    labelsValues={[
                      {
                        label:
                          "L'énoncé change à chaque actualisation de la page",
                        value: 'alea',
                      },
                      {
                        label:
                          "L'énoncé change à chaque nouvelle tentative du test Moodle et est différente pour chaque élève",
                        value: 'moodle',
                      },
                      {
                        label: "Pas d'aléatoire (utiliser l'énoncé actuel')",
                        value: 'graine',
                      },
                    ]}
                  />
                  <div
                    class="pl-2 pb-2 mt-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
                  >
                    Autres options
                  </div>
                  <ButtonToggleAlt
                    title={'Afficher le titre'}
                    bind:value={showTitle}
                    explanations={[
                      "Le titre et la référence de l'exercice sera affiché",
                      "Le titre et la référence de l'exercice ne sera pas affiché",
                    ]}
                  />
                </div>
                <button
                  type="submit"
                  on:click={downloadGift}
                  class="p-2 rounded-xl text-coopmaths-canvas dark:text-coopmathsdark-canvas bg-coopmaths-action hover:bg-coopmaths-action-lightest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-lightest"
                >
                  <i class="bx bx-download mr-2"></i>Télécharger le fichier gift
                </button>
              </div>
              <!-- <button
                  on:click={copyCode}
                  class="p-2 rounded-xl text-coopmaths-canvas dark:text-coopmathsdark-canvas bg-coopmaths-action hover:bg-coopmaths-action-lightest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-lightest"
                >
                Copier le code
                </button> -->

              <h1
                class="mt-12 md:mt-8 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Code
              </h1>
              <pre
                class="my-10 shadow-md bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus p-4 w-full overflow-auto">{contentGift}
            </pre>
            </section>
            <!-- FIN GIFT -->
          </div>
        </div>
        <div
          class="transition-opacity duration-150 ease-linear {tab === 'scorm'
            ? 'block opacity-100'
            : 'hidden opacity-0'}"
          id="tabs-scorm"
          role="tabpanel"
          aria-labelledby="tabs-scorm-btn"
        >
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            <!-- DEBUT SCORM -->
            <section
              class="px-4 py-0 md:py-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas w-full"
            >
              <h1
                class="mt-12 mb-4 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Comment l'utiliser ?
              </h1>

              <p
                class="text-coopmaths-corpus dark:text-coopmathsdark-corpus text-lg md:text-xl"
              >
                MathALÉA vous permet de créer un fichier au format SCORM que
                vous pourrez ensuite importer dans votre cours Moodle. Vous
                trouverez de plus amples informations dans notre <a
                  href="https://forge.apps.education.fr/coopmaths/mathalea/-/wikis/Utilisation-de-Mathalea-avec-Moodle"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-coopmaths-action dark:text-coopmathsdark-action"
                  >documentation</a
                >.
              </p>
              <h1
                class="mt-12 mb-4 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Exportation
              </h1>

              <div class="flex flex-col justify-center items-center space-y-2">
                <div class="pl-4 pt-4">
                  <ButtonToggleAlt
                    title={'Utiliser des exercices aléatoires'}
                    bind:value={useAlea}
                    explanations={[
                      'Chaque élève aura des exercices différents.',
                      'Tous les élèves auront le même exercice',
                    ]}
                  />
                </div>

                <button
                  type="submit"
                  on:click={downloadScorm}
                  class="p-2 rounded-xl text-coopmaths-canvas dark:text-coopmathsdark-canvas bg-coopmaths-action hover:bg-coopmaths-action-lightest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-lightest"
                >
                  <i class="bx bx-download mr-2"></i>Télécharger le fichier
                  SCORM
                </button>
              </div>
              <h1
                class="mt-12 md:mt-8 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Code
              </h1>
              <pre
                class="my-10 shadow-md bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus p-4 w-full overflow-auto">{contentScorm}</pre>
            </section>
            <!-- FIN SCORM -->
          </div>
        </div>
        <div
          class="transition-opacity duration-150 ease-linear {tab ===
          'bookmarklet'
            ? 'block opacity-100'
            : 'hidden opacity-0'}"
          id="tabs-bookmarklet"
          role="tabpanel"
          aria-labelledby="tabs-bookmarklet-btn"
        >
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            <!-- DEBUT BOOKMARKLET -->
            <section
              class="px-4 py-0 md:py-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas w-full"
            >
              <p
                class="text-coopmaths-corpus dark:text-coopmathsdark-corpus text-lg md:text-xl"
              >
                Le marque-page magique permet de créer des activités MathALÉA
                (au format scorm) en un clic.<br />
                <center
                  ><img
                    src="./assets/images/moodle-bookmarklet-demo.gif"
                    alt="Vidéo de démonstration du marque-page magique"
                    style="height:400px;margin:10px;"
                  /></center
                >
              </p>
              <h1
                class="mt-12 mb-4 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Installation du marque-page magique
              </h1>
              Glissez déposez le lien ci-dessous dans votre barre de favoris / marque
              page :<br />
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a
                href="javascript:var MathAleaBookmarkletScript = document.createElement('script');MathAleaBookmarkletScript.type='text/javascript';MathAleaBookmarkletScript.src='https://coopmaths.fr/alea/assets/externalJs/moodle-bookmarklet.js?v=2';document.body.appendChild(MathAleaBookmarkletScript);void(0);"
                style="color:blue;text-decoration:underline;"
                >Activité MathALÉA</a
              >

              <center
                ><img
                  src="./assets/images/moodle-bookmarklet-installation.gif"
                  alt="Vidéo d'installation du marque-page magique"
                  style="margin:10px;border: 1px solid black;filter:drop-shadow(2px 4px 6px black);transform: scale(0.9) rotate(-5deg) translate(20px, 20px);"
                /></center
              ><br />

              <h1
                class="mt-12 mb-4 text-center md:text-left text-coopmaths-struct dark:text-coopmathsdark-struct text-2xl md:text-4xl font-bold"
              >
                Utilisation
              </h1>

              <ul style="list-style-type: square;margin-left:30px;">
                <li>
                  Pour utilisez le marque-page magique pour créer une <strong
                    >activité MathALÉA</strong
                  >
                  :
                  <ul style="list-style-type: square;margin-left:30px;">
                    <li>Ouvrez la page d'un cours en mode édition.</li>
                    <li>
                      Appuyez sur le bouton permettant d'ajouter une activité à
                      une section.
                    </li>
                    <li>
                      Lorsque le sélecteur d'activité s'affiche, appuyez sur le
                      marque-page magique.
                    </li>
                    <li>
                      La fenêtre vous propose alors de choisir un ou plusieurs
                      exercices MathALÉA à ajouter à votre cours.
                    </li>
                    <li>
                      Une fois les exercices choisis, appuyez sur le bouton
                      "Ajouter" pour les insérer dans votre cours.
                    </li>
                  </ul>
                </li>
                <li>
                  Pour utilisez le marque-page magique pour créer une <strong
                    >question MathALÉA</strong
                  >
                  dans un test :
                  <ul style="list-style-type: square;margin-left:30px;">
                    <li>Se rendre dans l'onglet Questions d'un test</li>
                    <li>
                      Appuyez sur le bouton "Ajouter" puis choisir "Une
                      question"
                    </li>
                    <li>
                      Lorsque le sélecteur de type de questions s'affiche,
                      appuyez sur le marque-page magique.
                    </li>
                    <li>
                      La fenêtre vous propose alors de choisir un ou plusieurs
                      exercices MathALÉA à ajouter à votre cours.
                    </li>
                    <li>
                      Une fois les exercices choisis, appuyez sur le bouton
                      "Ajouter" pour les insérer dans votre quiz (à la fin).
                    </li>
                  </ul>
                </li>
              </ul>
              <!--
                <strong
                >Important : en raison d'un bug moodle, le calcul du score sera
                incorrect dans le cas où plusieurs exercices ont été choisis. Il
                faut donc pour l'instant se limiter à un exercice par activité
                MathALÉA.</strong
                ><br />
              -->
              L'utilisation du marque-page magique revient à importer un
              <strong>fichier SCORM</strong>, ou à importer une question au
              format <strong>GIFT</strong> dans un test Moodle. Le marque-page
              magique ne fait que simplifier le procéssus de création.<br />
              Reportez-vous à la
              <a
                href="https://forge.apps.education.fr/coopmaths/mathalea/-/wikis/1.-Utilisation-de-MathAL%C3%89A/1.2-Int%C3%A9gration-avec-d'autres-plateformes/Utilisation-de-Mathalea-avec-Moodle-ELEA"
                style="text-decoration:underline;">documentation</a
              > pour plus d'information.
            </section>
            <!-- FIN BOOKMARKLET -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <Footer />
  </footer>
</main>

<style>
  footer {
    margin-top: auto;
  }
</style>
