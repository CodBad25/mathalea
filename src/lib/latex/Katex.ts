export const optionsKatex = {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '$', right: '$', display: false },
  ],
  macros: {
    ':': '{\\char`:}',
    ',': '{\\char`,}',
    '·': '{\\char`·}',
  },
  fleqn: true,
  throwOnError: true,
  errorColor: '#CC0000',
  strict: 'warn',
  trust: false,
}
