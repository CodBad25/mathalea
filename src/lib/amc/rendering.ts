import nunjucks from 'nunjucks'
import { decimalTemplate } from './templates/question/decimal'
import { fractionTemplate } from './templates/question/fraction'
import { powerTemplate } from './templates/question/power'
import { qcmTemplate } from './templates/question/qcmTemplates'
import type { AMCNumNormalized, QCMNormalized } from './types'

nunjucks.configure('templates', { autoescape: false })

export function renderQcm(data: QCMNormalized) {
  return nunjucks.renderString(qcmTemplate, data)
}

export function renderAMCNum(data: AMCNumNormalized) {
  const templates = {
    decimal: decimalTemplate,
    fraction: fractionTemplate,
    power: powerTemplate,
  }
  const template = templates[data.mode]

  if (!template) {
    throw new Error(`Unknown AMCNum mode: ${data.mode}`)
  }

  return nunjucks.renderString(template, data)
}
