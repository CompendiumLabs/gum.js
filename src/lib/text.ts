// font shaping

import EMOJI_REGEX from 'emojibase-regex'
import LineBreaker from 'linebreak'
import type { Font } from 'opentype.js'

import { DEFAULTS as D, sans, moji, regular, bold } from './const'
import { is_string, compress_whitespace, sum, zip, max, min } from './utils'
import { wrapWidths } from './wrap'
import { FONTS, type FontPair, type FontEntry } from '../fonts/fonts'

import type { Limit } from './types'

//
// create text sizer
//

function is_font_pair(font: FontEntry): font is FontPair {
    return 'regular' in font && 'bold' in font
}

function is_emoji(text: string): boolean {
    return EMOJI_REGEX.test(text)
}

function arrayEquals(a: number[], b: number[]): boolean {
    return a.length == b.length && a.every((x, i) => x == b[i])
}

function rescale(x: number, lim_in: Limit, lim_out: Limit): number {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    return out_lo + (x - in_lo) * out_len / in_len
}

function emojiSizer(text: string): number {
    // get emoji font
    const font0 = FONTS[moji]
    if (font0 == null) return 1.25
    const font = is_font_pair(font0) ? font0.regular : font0

    // get glyphs
    const { unitsPerEm } = font
    const glyphs = font.stringToGlyphs(text)

    // handle simple case
    if (glyphs.length == 1) {
        const { advanceWidth = 0 } = glyphs[0]
        return advanceWidth / unitsPerEm
    }

    // find substitution
    const subs = font.substitution.getFeature('ccmp')
    const indices = glyphs.map(g => g.index)
    const sub = subs.find(s => arrayEquals(s.sub, indices))

    // if no substitution found, return sum of glyph widths
    if (sub == null) {
        const width = sum(glyphs.map(g => g.advanceWidth))
        return width / unitsPerEm
    }

    // get glyph advance
    const { advanceWidth = 0 } = font.glyphs.get(sub.by)
    return advanceWidth / unitsPerEm
}

type TextSizerArgs = {
    font_family?: string
    font_weight?: number
    calc_size?: number
}

function textSizer(text: string, { font_family = sans, font_weight = regular, calc_size = D.calc_size }: TextSizerArgs = {}): number {
    if (is_emoji(text)) return emojiSizer(text)

    // get font info
    const font = FONTS[font_family]
    const sizer = (font: Font) => font.getAdvanceWidth(text, calc_size) / calc_size

    // handle simple cases
    if (!is_font_pair(font)) return sizer(font)
    if (font_weight == regular) return sizer(font.regular)
    if (font_weight == bold) return sizer(font.bold)

    // we need to interpolate
    const w0 = sizer(font.regular)
    const w1 = sizer(font.bold)
    return rescale(font_weight, [ regular, bold ], [ w0, w1 ])
}

function fontVertical(font: Font, text: string): Limit {
    const glyphs = font.stringToGlyphs(text)
    const [yMins = [], yMaxs = []] = zip(...glyphs.map(g => [ g.yMin, g.yMax ]))
    const units = font.unitsPerEm ?? 1000
    const yMin = min(yMins) ?? 0
    const yMax = max(yMaxs) ?? units
    return [ yMin / units, yMax / units ]
}

function textVertical(text: string, { font_family = sans, font_weight = regular }: TextSizerArgs = {}): Limit {
    const font = FONTS[font_family]
    const vertical = (font: Font) => fontVertical(font, text)

    // handle simple cases
    if (!is_font_pair(font)) return vertical(font)
    if (font_weight == regular) return vertical(font.regular)
    if (font_weight == bold) return vertical(font.bold)

    // we need to interpolate
    const [ ymin0, ymax0 ] = fontVertical(font.regular, text)
    const [ ymin1, ymax1 ] = fontVertical(font.bold, text)
    return [
        rescale(font_weight, [ regular, bold ], [ ymin0, ymax0 ]),
        rescale(font_weight, [ regular, bold ], [ ymin1, ymax1 ]),
    ]
}

type TextMetrics = {
    advance: number
    vrange: Limit
    raw_vrange?: Limit
}

const EMPTY_VRANGE: Limit = [ 0, 0 ]
const DEFAULT_VRANGE: Limit = [ -0.25, 0.75 ]

const EMPTY_METRICS: TextMetrics = {
    advance: 0,
    vrange: EMPTY_VRANGE,
    raw_vrange: EMPTY_VRANGE,
}

const DEFAULT_METRICS: TextMetrics = {
    advance: 1,
    vrange: DEFAULT_VRANGE,
    raw_vrange: DEFAULT_VRANGE,
}

function normalizeTextMetrics({ advance, vrange: [ ymin, ymax ] }: TextMetrics): TextMetrics {
    const yrange = ymax - ymin
    const line_height = Math.max(1, yrange)
    const font_height = 1 / line_height
    const glyph_top = (yrange > 1) ? 0.25 : 1 - ymax
    const baseline = glyph_top + ymax * font_height
    return {
        advance: advance / line_height,
        vrange: [ baseline - font_height, baseline ],
        raw_vrange: [ glyph_top + ymin * font_height, glyph_top + ymax * font_height ],
    }
}

function textMetrics(text: string, args: TextSizerArgs = {}): TextMetrics {
    if (text == '\n') return { advance: 0, vrange: [ 0, 1 ], raw_vrange: [ 0, 1 ] }
    const text1 = compress_whitespace(text)
    const advance = textSizer(text1, args)
    const vrange = textVertical(text1, args)
    return normalizeTextMetrics({ advance, vrange })
}

//
// text wrapping
//

function getBreaks(text: string): number[] {
    const breaker = new LineBreaker(text)
    const breaks = [0]
    for (let bk: any; (bk = breaker.nextBreak()); ) {
        breaks.push(bk.position)
    }
    if (breaks[breaks.length - 1] !== text.length) {
        breaks.push(text.length)
    }
    return breaks
}

function splitWords(text: string): string[] {
    const breaks = getBreaks(text)
    const words = breaks.slice(1).map((_b, i) => text.slice(breaks[i], breaks[i+1]))
    return words.map(w =>
        w.length > 1 && w.endsWith('\n') ?
        [ w.slice(0, -1), '\n' ] : w
    ).flat()
}

// compress whitespace, since that's what SVG does
function wrapText(text: string, maxWidth: number | undefined, args: TextSizerArgs = {}): { rows: string[][], widths: number[] } {
    const chunks = splitWords(compress_whitespace(text))
    const measure = (c: string) => textSizer(c, args)
    return wrapWidths(chunks, measure, maxWidth)
}

function mergeStrings(items: any[]): any[] {
    const lines: any[] = []
    let buffer = ''
    for (const item of items) {
        if (is_string(item)) {
            buffer += item
        } else {
            if (buffer.length > 0) {
                lines.push(buffer)
                buffer = ''
            }
            lines.push(item)
        }
    }
    if (buffer.length > 0) {
        lines.push(buffer)
    }
    return lines
}

//
// exports
//

export { is_emoji, textMetrics, textSizer, textVertical, getBreaks, splitWords, wrapWidths, wrapText, mergeStrings }
export { DEFAULT_METRICS, EMPTY_METRICS, DEFAULT_VRANGE, EMPTY_VRANGE }
export type { TextMetrics }
