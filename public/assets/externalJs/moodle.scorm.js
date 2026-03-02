const scorm = window.pipwerks.SCORM

window.onload = function () {
  const style = document.createElement('style')
  style.innerHTML = 'body, html { margin: 0px; padding: 0px; height: 100%; overflow: auto; }'
  document.head.appendChild(style)
  const chargement = document.createElement('div')
  chargement.innerHTML = 'Chargement en cours...'
  document.body.appendChild(chargement)
  scorm.init()
  let exo = location.hash.slice(1)
  const iframe = document.createElement('iframe')
  const suspendData = scorm.get('cmi.suspend_data')
  /*
    Trois cas possibles :
    - L'élève n'a jamais accédé à l'exercice : suspendData = ''
    - L'élève a déjà accédé à l'exercice mais n'a pas encore répondu : suspendData = seed
    - L'élève a déjà répondu à l'exercice : suspendData = seed|answers
  */
  let seed, answers
  if (suspendData) {
    // L'élève a déjà accédé à l'exercice
    if (suspendData.includes('|')) {
      // L'élève a déjà répondu à l'exercice
      seed = suspendData.slice(0, suspendData.indexOf('|'))
      answers = suspendData.slice(suspendData.indexOf('|') + 1)
    } else {
      // L'élève a déjà accédé à l'exercice mais n'a pas encore répondu
      seed = suspendData
      answers = ''
    }
  } else {
    // L'élève n'a pas encore accédé à l'exercice
    answers = ''
  }
  const randomSeed = exo.includes('&alea=-1') || !exo.includes('&alea')
  // Il faut générer une graine si alea n'est pas fourni ou est égal à -1
  if (randomSeed) {
    // La graine n'est pas fourni, il faut la générer si ce n'est pas déjà fait
    if (!seed) {
      seed = Math.floor(Math.random() * 100000)
      // On sauvegarde immédiatement la graine pour éviter la triche
      scorm.set('cmi.suspend_data', seed)
    }
    // Il faut remplacer tous les alea aux cas où on est dans une CAN
    if (exo.includes('&alea=-1')) {
      exo = exo.replaceAll('&alea=-1', '&alea=' + seed)
    } else {
      exo = exo.replaceAll(/((?:^|&)uuid=[^&]+(?:&id=[^&]+)?)/g, '$1&alea=' + seed)
    }
  }
  let src = 'https://coopmaths.fr/alea/?'
  src += exo
  if (!exo.includes('&v=can')) {
    src += '&i=1&v=eleve&title=&es=011010'
  }
  src += '&recorder=moodle'
  if (answers !== '') {
    src += '&done=1&answers=' + answers
  }
  iframe.src = src
  iframe.setAttribute('frameborder', '0')
  iframe.setAttribute('width', '100%')
  iframe.setAttribute('height', '100%')
  iframe.style.display = 'none'
  iframe.onload = function () {
    chargement.style.display = 'none'
    iframe.style.display = 'block'
  }
  document.body.appendChild(iframe)

  try {
    // Pour éviter que les élèves ne se rendent pas compte qu'il y a plusieurs exercices, on déplie le menu si besoin
    const boutonSommaire = window.parent.document.getElementById('scorm_toc_toggle_btn')
    const sommaireCache = window.parent.document.getElementById('scorm_toc').classList.contains('disabled')
    const multiplesExos = window.parent.document.getElementById('scorm_tree').getElementsByTagName('li').length > 1
    if (sommaireCache && multiplesExos) {
      boutonSommaire.click()
    }
  } catch (e) { }
}

window.onunload = function () {
  scorm.quit()
}

window.addEventListener('message', (event) => {
  if (typeof event.data.action !== 'undefined' && event.data.action.startsWith('mathalea:')) {
    if (event.data.action === 'mathalea:score') {
      const seed = event.data.resultsByExercice[0].alea
      let points = 0
      let max = 0
      for (let result of event.data.resultsByExercice) {
        points += result.numberOfPoints
        max += result.numberOfQuestions
      }
      const scoreMax = Math.ceil(10000 / (window?.parent?.document?.getElementById('scorm_tree')?.getElementsByTagName('li')?.length || 1)) / 100
      const score = Math.round(100 * (points / max) * scoreMax) / 100
      scorm.status('set', 'completed')
      scorm.set('cmi.core.score.raw', score)
      scorm.set('cmi.core.score.min', '0')
      scorm.set('cmi.core.score.max', scoreMax.toString())
      let answers = event.data.resultsByExercice.map(x => x.answers)
      // todo : gérer les can où il y a plusieurs exos
      scorm.set('cmi.suspend_data', seed + '|' + JSON.stringify(event.data.resultsByExercice[0].answers))
      let copieEleveUrl = document.getElementsByTagName('iframe')[0].src
      copieEleveUrl = copieEleveUrl.replace(/&alea=[^&]+/, '&alea=' + seed) // On remplace la seed au cas où qu'elle ait changé
      copieEleveUrl += '&done=1&answers=' + encodeURIComponent(JSON.stringify(event.data.resultsByExercice[0].answers))
      scorm.set('cmi.interactions_0.student_response', copieEleveUrl)
      // scorm.set("cmi.success_status", "passed");
      scorm.save()
    }
  }
})
