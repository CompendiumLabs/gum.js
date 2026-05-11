// Rasterize SVG to PNG via node-canvas

import { createCanvas, loadImage, registerFont, type ImageData as CanvasImageData } from 'canvas'

import type { Size } from './lib/types'
import { FONT_PATHS } from './fonts/fonts'
import { light, regular, bold } from './lib/const'
import { broadcast_point, is_string } from './lib/utils'

// register bundled fonts so SVG <text> resolves consistently
for (const [ family, path ] of Object.entries(FONT_PATHS)) {
  if (typeof path == 'string') {
    registerFont(path, { family })
  } else {
    registerFont(path.light, { family, weight: String(light) })
    registerFont(path.regular, { family, weight: String(regular) })
    registerFont(path.bold, { family, weight: String(bold) })
  }
}

interface RasterizeBaseArgs {
  size?: Size
  rasterSize?: Size
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

function fitRasterSize([ w0, h0 ]: Size, rasterSize?: Size): Size {
  if (rasterSize == null) return [ w0, h0 ]
  const [ maxW, maxH ] = broadcast_point(rasterSize)
  const scale = Math.min(maxW / w0, maxH / h0)
  return [
    Math.max(1, Math.round(w0 * scale)),
    Math.max(1, Math.round(h0 * scale)),
  ]
}

async function rasterizeSvg(svg: string | Buffer, args: RasterizePixelArgs): Promise<CanvasImageData>
async function rasterizeSvg(svg: string | Buffer, args?: RasterizePngArgs): Promise<Buffer>
async function rasterizeSvg(svg: string | Buffer, { size, rasterSize, background, pixelData }: RasterizeArgs = {}): Promise<Buffer | CanvasImageData> {
  const buf = is_string(svg) ? Buffer.from(svg) : svg
  const img = await loadImage(buf)
  const imgSize = size ?? [ img.width, img.height ]
  const [ outW, outH ] = fitRasterSize(imgSize, rasterSize)

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

export { fitRasterSize, rasterizeSvg, formatImage, readStdin }
export type { RasterizeBaseArgs, RasterizePngArgs, RasterizePixelArgs, RasterizeArgs, FormatImageArgs }
