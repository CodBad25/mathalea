declare module 'jszip-utils' {
  interface JSZipUtilsStatic {
    getBinaryContent(
      url: string,
      callback: (error: Error | null, data: ArrayBuffer | null) => void,
    ): void
  }

  const JSZipUtils: JSZipUtilsStatic
  export default JSZipUtils
}
