import 'https://cdn.jsdelivr.net/npm/mathlive/+esm'
window.mathVirtualKeyboard.targetOrigin = '*'
if (typeof window.iMathAlea === 'undefined') {
  // Normalement ce script ne devrait être chargé qu'une unique fois car appelé en module
  // On vérifie tout de même au cas où que le fichier ne soit pas appelé en module
  // Ou que l'on appelle des fichiers depuis des serveurs différents
  // Remarque dans ce dernier cas : tout les exos seront chargés depuis le premier serveur
  window.iMathAlea = []

  let DEBUG = false

  if (location.hash.startsWith('#DEBUG=')) {
    const DEBUGURL = new URL('.', location.hash.substring(7))
    try {
      if (
        DEBUGURL.hostname !== 'localhost' &&
        DEBUGURL.hostname !== '127.0.0.1'
      ) {
        throw new Error('Le serveur doit être en localhost ou 127.0.0.1')
      }
      DEBUG = DEBUGURL.href
    } catch (e) {
      console.error(e)
    }
  }

  window.addEventListener('message', (event) => {
    // V3 ou V4
    if (
      typeof event.data.action !== 'undefined' &&
      event.data.action.startsWith('mathalea:')
    ) {
      if (
        typeof event.data.iframe !== 'undefined' &&
        typeof window.iMathAlea[parseInt(event.data.iframe)] !== 'undefined'
      ) {
        const iframe = window.iMathAlea[parseInt(event.data.iframe)].iframe
        const question = window.iMathAlea[parseInt(event.data.iframe)].question
        if (
          (event.data.action === 'mathalea:init' ||
            event.data.action === 'mathalea:resize') &&
          typeof event.data.hauteurExercice !== 'undefined'
        ) {
          const hauteur = event.data.hauteurExercice
          // hauteur += 50
          iframe.setAttribute('height', hauteur.toString())
        }
        if (event.data.action === 'mathalea:score') {
          const score =
            (event.data.resultsByExercice[0].numberOfPoints /
              event.data.resultsByExercice[0].numberOfQuestions) *
            100
          // On regarde le score le plus proche parmi les scores compatibles moodle
          let compatibleScore
          if (iframe.getAttribute('v')) {
            // v4
            compatibleScore = [
              100, 90, 83.333, 80, 75, 66.666, 60, 50, 40, 33.333, 30, 25, 20,
              16.666, 14.2857, 12.5, 11.111, 10, 5, 0,
            ]
          } else {
            // v3
            compatibleScore = [
              100, 90, 80, 75, 66.666, 60, 50, 40, 33.333, 30, 25, 20, 16.666,
              14.2857, 12.5, 11.111, 10, 5, 0,
            ]
          }
          const moodleScore = compatibleScore.reduce((prev, curr) => {
            return Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev
          })
          let seedData = ''
          if (iframe.getAttribute('graine') === '-1') {
            // On est en mode aléatoire, il faut enregistrer la graine avec le score
            seedData = '|' + iframe.aleaSeed
          }
          question.querySelector('[name$="_answer"]').value =
            moodleScore +
            seedData +
            '|' +
            JSON.stringify(event.data.resultsByExercice[0].answers)
          question.querySelector('[name$="_-submit"]')?.click()
        }
      }
    }
    // V2
    if (
      typeof event.data.iMoodle === 'number' &&
      typeof window.iMathAlea[event.data.iMoodle] !== 'undefined'
    ) {
      const iframe = window.iMathAlea[event.data.iMoodle].iframe
      const question = window.iMathAlea[event.data.iMoodle].question
      let hauteur =
        event.data.hauteurExercice || event.data.hauteurExerciceCorrection
      if (typeof hauteur !== 'undefined') {
        hauteur += 50
        iframe.setAttribute('height', hauteur.toString())
      }
      if (typeof event.data.score !== 'undefined') {
        question.querySelector('[name$="_answer"]').value =
          event.data.score + '|' + JSON.stringify(event.data.reponses)
        question.querySelector('[name$="_-submit"]')?.click()
      }
    }
  })

  const style = document.createElement('style')
  style.innerHTML =
    '.mathalea-question-type .form-inline, .mathalea-question-type .im-controls, .mathalea-question-type .rightanswer, .mathalea-question-type .ablock { display: none !important; }'
  document.head.appendChild(style)

  // Create a class for the element
  class MathALeaMoodle extends HTMLElement {
    /*
    // Appelé lors de la création de l'élément
    constructor () {
      // Always call super first in constructor
      super()
    }
    */

    // Appelé lorsque l'élément est inséré dans le DOM
    connectedCallback() {
      let VERSION
      /*
        Il y a actuellement plusieurs versions :
        - 4
        - 3
        - 2
        La version 2 n'est pas explicitement définie. Elle se base sur l'ancien format du site et n'a pas d'attribut url.
        La version 3 n'est pas explicitement définie. Elle se base sur la nouvelle version du site et a un attribut url.
        Les versions 4 ou plus sont explicitement définies par un attribut v.
      */
      if (this.getAttribute('url')) {
        VERSION = Number(this.getAttribute('v') ?? 3)
      } else {
        VERSION = 2
      }

      // Si l'attribut serveur est défini, on l'utilise (url non vérifiée / sécurisée)
      // Sinon on utilise l'url du script actuel récupérée soit via
      // document.currentScript si le fichier n'est pas appelé en mode module
      // import.meta.url si le fichier appelé en mode module
      let SERVEUR_URL
      try {
        if (DEBUG) {
          SERVEUR_URL = new URL(DEBUG)
        } else {
          SERVEUR_URL = new URL(
            '../..',
            this.getAttribute('serveur') ||
              document.currentScript?.src ||
              import.meta.url,
          ) // ou origin + pathname
        }
        if (
          SERVEUR_URL.protocol !== 'http:' &&
          SERVEUR_URL.protocol !== 'https:'
        ) {
          throw new Error('Le serveur doit avoir un protocol en http ou https')
        }
        SERVEUR_URL = SERVEUR_URL.href
      } catch (e) {
        SERVEUR_URL = 'data:text,' + e
      }

      const shadow = this.attachShadow({ mode: 'open' }) // this.shadowRoot

      const iMoodle = window.iMathAlea.length
      let questionSeed = ''

      let questionDiv = this.parentNode
      // On remonte de parent en parent depuis la balise script jusqu'à trouver le div avec le numero de la question en id
      while (questionDiv !== null) {
        // s'arrêtera lorsqu'il n'y aura plus de parents
        if (
          typeof questionDiv.id === 'string' &&
          questionDiv.id.startsWith('question-')
        ) {
          questionSeed = this.getAttribute('graine') || questionDiv.id
          break // la seed a été trouvée
        }
        questionDiv = questionDiv.parentNode
      }
      if (questionSeed === '-1') {
        questionSeed = Math.random().toString(36).substring(2, 15)
        this.aleaSeed = questionSeed
      }
      if (questionDiv === null) {
        // début compatibilité moodle 3.5
        questionDiv = this.parentNode
        while (questionDiv !== null) {
          // s'arrêtera lorsqu'il n'y aura plus de parents
          if (questionDiv.classList.contains('shortanswer')) {
            questionSeed =
              this.getAttribute('graine') ||
              questionDiv
                .querySelector('input[name$=":sequencecheck"]')
                .getAttribute('name')
            break // la seed a été trouvée
          }
          questionDiv = questionDiv.parentNode
        }
        // fin compatibilité moodle 3.5

        if (questionDiv === null) {
          shadow.appendChild(
            document.createTextNode(
              "[Erreur de détection de la l'environnement moodle]",
            ),
          )
          return
        }
      }

      questionDiv.classList.add('mathalea-question-type')

      let answer
      const addIframe = () => {
        iframe.setAttribute('width', '100%')
        iframe.setAttribute('height', '400')
        if (VERSION >= 3) {
          let exoUrl = this.getAttribute('url')
          const ES =
            this.getAttribute('titre') === 'false' ? '01101000' : '01101011'
          // uuid=XXX&id=XXX&cols=2 => uuid=XXX&id=XXX[&alea=XX]&cols=2
          // uuid=XXX&id=XXX => uuid=XXX&id=XXX[&alea=XX]
          exoUrl = exoUrl.replaceAll(
            /(uuid=[A-Za-z0-9]+(?:&id=[A-Za-z0-9-]+)?)(&|$)/g,
            '$1&alea=' + questionSeed + '$2',
          ) // on ajoute la graine
          iframe.setAttribute(
            'src',
            SERVEUR_URL +
              '?' +
              exoUrl +
              '&i=1&v=eleve&recorder=moodle&title=&es=' +
              ES +
              '&iframe=' +
              iMoodle +
              (this.getAttribute('correction') !== null ? '&done=1' : '') +
              (typeof answer !== 'undefined' ? '&answers=' + answer : ''),
          )
        } else {
          // 4A11-0,s\=3,s2\=true,s3\=false,s4\=false,n\=4,video\=0,cc\=1,cd\=1
          // => (les slashs ne sont que dans le gift)
          // id\=4A11-0&s\=3&s2\=true&s3\=false&s4\=false&n\=4&cd\=1
          const exoParams = this.getAttribute('ex').split(',')
          exoParams[0] = 'id=' + exoParams[0]
          exoParams.push('alea=' + questionSeed)
          const exoUrl = exoParams.join('&')
          iframe.setAttribute(
            'src',
            SERVEUR_URL +
              '?' +
              exoUrl +
              '&i=1&v=eleve&recorder=moodle&title=&es=011010&iframe=' +
              iMoodle +
              (this.getAttribute('correction') !== null ? '&done=1' : '') +
              (typeof answer !== 'undefined' ? '&answers=' + answer : ''),
          )
          // iframe.setAttribute('src', SERVEUR_URL + '/mathalea.html?ex=' + this.getAttribute('ex') + ',i=1&v=' + (this.getAttribute('correction') === null ? 'exMoodle' : 'correctionMoodle') + '&z=1&iMoodle=' + iMoodle + '&serie=' + questionSeed + (typeof answer !== 'undefined' ? '&moodleJson=' + answer : ''))
        }
        iframe.setAttribute('frameBorder', '0')
        iframe.setAttribute('allow', 'fullscreen')
        shadow.appendChild(iframe)
      }

      const iframe = document.createElement('iframe')
      this.iframe = iframe
      window.iMathAlea.push({ iframe: this, question: questionDiv })

      if (questionDiv.classList.contains('notyetanswered')) {
        // L'élève n'a pas encore répondu à la question, on affiche immédiatement l'iframe
        addIframe()
      } else {
        // L'élève a répondu, on attend que la page charge pour récupérer ses réponses
        document.addEventListener('DOMContentLoaded', () => {
          // facultatif si le fichier est importé en mode module car l'exécution du script est deferred
          if (VERSION >= 3) {
            if (questionDiv.querySelector('.outcome')) {
              // En v3 la correction est mélangée à l'énoncé. On masque la question (qui contient l'énoncé)
              // pour ne garder que la réponse (qui contient l'énoncé et la correction).
              questionDiv.querySelector('.formulation ').style.display = 'none'
            } else {
              // L'élève a déjà répondu à la question mais est encore en train de passer le test
              // Il ne s'agit donc pas d'un affichage de la corrrection.
              iframe.style.pointerEvents = 'none'
              iframe.style.filter = 'blur(5px)'
              iframe.style.userSelect = 'none'
              const successMessage = document.createElement('div')
              successMessage.textContent =
                'Vous avez déjà effectué cet exercice'
              successMessage.setAttribute(
                'style',
                'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);background-color: lightgreen;padding: 10px;border: 1px solid green;color: green;z-index:1;',
              )
              shadow.appendChild(iframe)
              shadow.appendChild(successMessage)
            }
          }
          answer = questionDiv.querySelector('[name$="_answer"]').value
          if (this.getAttribute('graine') === '-1') {
            // On est en mode aléatoire, il faut récupérer la graine présent avec la réponse
            answer = answer.slice(answer.indexOf('|') + 1)
            questionSeed = answer.slice(0, answer.indexOf('|'))
            answer = answer.slice(answer.indexOf('|') + 1)
          } else {
            answer = answer.slice(answer.indexOf('|') + 1)
          }
          answer = encodeURIComponent(answer)
          addIframe()
        })
      }

      shadow.appendChild(iframe)
    }

    attributeChangedCallback(name, oldValue, newValue) {
      name === 'height' && (this.iframe.height = newValue)
    }

    static get observedAttributes() {
      return ['height']
    }
  }

  // Define the new element
  customElements.define('mathalea-moodle', MathALeaMoodle)
}
