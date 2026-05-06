// Rasterize SVG to PNG via node-canvas

import { createCanvas, loadImage, registerFont, type ImageData as CanvasImageData } from 'canvas'

import type { Size } from './lib/types'
import { FONT_PATHS } from './fonts/fonts'
import { regular, bold } from './lib/const'

// register bundled fonts so SVG <text> resolves consistently
for (const [ family, path ] of Object.entries(FONT_PATHS)) {
  if (typeof path == 'string') {
    registerFont(path, { family })
  } else {
    registerFont(path.regular, { family, weight: String(regular) })
    registerFont(path.bold, { family, weight: String(bold) })
  }
}

interface RasterizeBaseArgs {
  size?: Size
  width?: number
  height?: number
  background?: string
}

interface RasterizePngArgs extends RasterizeBaseArgs {
  pixelData?: false
}

interface RasterizePixelArgs extends RasterizeBaseArgs {
  pixelData: true
}

type RasterizeArgs = RasterizePngArgs | RasterizePixelArgs

interface FormatImageArgs {
  imageId?: number | null
  placementId?: number | null
  chunkSize?: number
  columns?: number
  rows?: number
  cursorMovement?: boolean
}

async function rasterizeSvg(svg: string | Buffer, args: RasterizePixelArgs): Promise<CanvasImageData>
async function rasterizeSvg(svg: string | Buffer, args?: RasterizePngArgs): Promise<Buffer>
async function rasterizeSvg(svg: string | Buffer, { size, width, height, background, pixelData }: RasterizeArgs = {}): Promise<Buffer | CanvasImageData> {
  const buf = typeof svg === 'string' ? Buffer.from(svg) : svg
  const img = await loadImage(buf)
  const w0 = size?.[0] ?? img.width
  const h0 = size?.[1] ?? img.height

  // if both width and height given, scale to fit within (prefer smaller scale)
  if (width != null && height != null) {
    const scaleW = width / w0
    const scaleH = height / h0
    if (scaleW < scaleH) height = undefined
    else width = undefined
  }

  // pick output dimensions; preserve aspect when only one of width/height given
  let outW: number, outH: number
  if (width != null) {
    outW = width
    outH = Math.round(width * h0 / w0)
  } else if (height != null) {
    outH = height
    outW = Math.round(height * w0 / h0)
  } else {
    outW = w0
    outH = h0
  }

  // create canvas
  const canvas = createCanvas(outW, outH)
  const ctx = canvas.getContext('2d')

  // fill background
  if (background != null) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, outW, outH)
  }

  // draw image to canvas and return the requested raster representation
  ctx.drawImage(img, 0, 0, outW, outH)
  return pixelData ? ctx.getImageData(0, 0, outW, outH) : canvas.toBuffer('image/png')
}

// kitty image protocol
function formatImage(
  pngBuffer: Buffer,
  { imageId = null, placementId = null, chunkSize = 4096, columns, rows, cursorMovement = true }: FormatImageArgs = {}
): string {
  const base64 = pngBuffer.toString('base64')
  const head = [ 'f=100', 'a=T', 'q=1' ]

  if (imageId != null) head.push(`i=${imageId}`)
  if (placementId != null) head.push(`p=${placementId}`)
  if (columns != null) head.push(`c=${columns}`)
  if (rows != null) head.push(`r=${rows}`)
  if (!cursorMovement) head.push('C=1')

  let result = ''
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize)
    const isFirst = i === 0
    const isLast = i + chunkSize >= base64.length
    const control = isFirst
      ? [ ...head, `m=${isLast ? 0 : 1}` ].join(',')
      : `m=${isLast ? 0 : 1}`

    result += `\x1b_G${control};${chunk}\x1b\\`
  }

  return result
}

// read from stdin
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

export { rasterizeSvg, formatImage, readStdin }
export type { RasterizeBaseArgs, RasterizePngArgs, RasterizePixelArgs, RasterizeArgs, FormatImageArgs }
