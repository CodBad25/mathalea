declare module 'katex/dist/contrib/auto-render.js' {
  type RenderMathInElement = (
    element: Element,
    options?: Record<string, unknown>,
  ) => void

  const renderMathInElement: RenderMathInElement
  export default renderMathInElement
}
