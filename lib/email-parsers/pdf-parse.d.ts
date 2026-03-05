declare module "pdf-parse" {
  interface PDFParseOptions {
    data?: Uint8Array
    url?: string
    verbosity?: number
  }

  interface TextResult {
    text: string
  }

  export class PDFParse {
    constructor(options?: PDFParseOptions)
    getText(): Promise<TextResult>
  }
}
