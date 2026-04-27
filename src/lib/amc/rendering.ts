import nunjucks from 'nunjucks'
import type { QCMNormalized } from './types'

nunjucks.configure('templates')

export function renderQcmMono(data: QCMNormalized) {
  return nunjucks.render('question/qcmMono.njk', data)
}
