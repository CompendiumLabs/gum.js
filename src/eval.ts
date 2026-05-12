// code evaluation

import type { ParseConfig } from 'papaparse'

import { setTheme, type ThemeName } from './lib/theme'
import { is_string, ensure_pair } from './lib/utils'
import { parseTable } from './lib/table'
import { is_element, Svg } from './elems/core'
import type { SvgArgs } from './elems/core'
import { runJSX } from './lib/parse'
import { PngImage, type PngImageArgs } from './elems/image'
import type { LoadFile, Size } from './lib/types'

//
// types
//

class ErrorNoCode extends Error {
  constructor() {
      super('No code provided')
  }
}

class ErrorNoReturn extends Error {
  constructor() {
      super()
  }
}

class ErrorNoElement extends Error {
  value: any

  constructor(value: any) {
      super(`Non-element returned: ${JSON.stringify(value)}`)
      this.value = value
  }
}

class ErrorGenerate extends Error {
  constructor(message: string) {
      super(`Generation error: ${message}`)
  }
}

class ErrorRender extends Error {
  constructor(message: string) {
      super(`Render error: ${message}`)
  }
}

//
// gum evaluator
//

type TableRow = Record<string, unknown>
type LoadTable = (path: string, args?: ParseConfig<TableRow>) => TableRow[]
type GumContext = Record<string, any>

interface EvaluateArgs extends SvgArgs {
  theme?: ThemeName
  context?: GumContext
  debug?: boolean
  loadFile?: LoadFile
}

function uint8ArrayToDataUrl(data: Uint8Array): string {
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  const base64 = btoa(binary)
  return `data:image/png;base64,${base64}`

}

interface LoadImageArgs extends PngImageArgs {
  id?: string
}

function makeContext(loadFile: LoadFile): GumContext {
  // image loader class
  class LoadImage extends PngImage {
    constructor(args: LoadImageArgs = {}) {
      const { id, ...attr } = args

      // check for id
      if (id == null) throw new Error('ImageLoader id is required')

      // load image
      const data = loadFile(id, 'bytes') as Uint8Array
      const dataUrl = uint8ArrayToDataUrl(data)

      // pass to PngImage
      super({ data: dataUrl, ...attr })
    }
  }

  return {
    LoadImage,
    loadTable(path: string, args: ParseConfig<TableRow> = {}): TableRow[] {
      const text = loadFile(path)
      if (!is_string(text)) throw new TypeError(`loadTable("${path}") expected text`)
      return parseTable(text, args)
    }
  }
}

function evaluateGum(code: string, { theme, context = {}, debug = false, loadFile, ...args }: EvaluateArgs = {}): Svg {
  // check if code is provided
  if (code == null || code.trim() == '') {
    throw new ErrorNoCode()
  }

  // set theme
  if (theme != null) {
    setTheme(theme)
  }

  // create evaluation context
  const evalContext = loadFile == null ? context : {
    theme,
    ...context,
    ...makeContext(loadFile)
  }

  // parse to property tree
  const result = runJSX(code, evalContext, debug)

  // handle array result (from JSX fragments)
  if (Array.isArray(result)) {
    return new Svg({ children: result, ...args })
  }

  // check if its actually a tree
  if (!is_element(result)) {
    if (result == null) {
      throw new ErrorNoReturn()
    } else {
      throw new ErrorNoElement(result)
    }
  }

  // wrap it in Svg if not already
  if (!(result instanceof Svg)) {
    return new Svg({ children: [ result ], ...args })
  }

  // return result
  return result
}

function fitSize([ w0, h0 ]: Size, rasterSize?: Size | number): Size {
  if (rasterSize == null) return [ w0, h0 ]
  const [ maxW, maxH ] = ensure_pair(rasterSize)
  const scale = Math.min(maxW / w0, maxH / h0)
  return [
    Math.max(1, Math.round(w0 * scale)),
    Math.max(1, Math.round(h0 * scale)),
  ]
}

//
// export
//

export { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender, runJSX, evaluateGum, parseTable, fitSize }
export type { EvaluateArgs, TableRow, LoadTable, GumContext }
