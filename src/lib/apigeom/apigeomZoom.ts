import SuperFigure from 'apigeom'

/**
 * wrapper des figures provenant de Apigeom, transformer en mathalea2d pour gérer le zoom
 */
export function wrapperApigeomToMathalea(figure: SuperFigure) {
  figure.divFigure.classList.add('svgContainer')
  figure.divFigure.querySelector('svg')?.classList.add('mathalea2d')
  for (const di of figure.divFigure.querySelectorAll('div')) {
    di.classList.add('divLatex')
    di.style.whiteSpace = 'nowrap'
    di.style.lineHeight = '1'
  }
  const div = document.createElement('div')
  div.innerHTML = figure.getStaticHtml()
  if (div.firstElementChild instanceof HTMLElement) {
    div.firstElementChild.style.removeProperty('height')
    div.firstElementChild.style.removeProperty('weight')
  }
  return div.innerHTML
}
