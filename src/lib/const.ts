// constants

import type { Point, Rect, Limit } from './types'

// namespaces
const svgns = 'http://www.w3.org/2000/svg'
const htmlns = 'http://www.w3.org/1999/xhtml'

// fonts names
const sans = 'IBM Plex Sans'
const mono = 'IBM Plex Mono'
const moji = 'Noto Emoji'
const cmoji = 'Noto Color Emoji'

// font metrics
const regular = 400
const bold = 700
const vtext = -0.15

// colors
const none = 'none'
const black = '#000000'
const white = '#ffffff'
const gray = '#f0f0f0'
const blue = '#1e88e5'
const red = '#ff0d57'
const green = '#4caf50'
const yellow = '#ffb300'
const purple = '#9c27b0'
const lightgray = '#f6f6f6'
const darkgray = '#888888'

// math
const e = Math.E
const pi = Math.PI
const phi = (1 + Math.sqrt(5)) / 2
const r2d = 180 / Math.PI
const d2r = Math.PI / 180

// default values
const DEFAULTS = {
    prec: 2,
    loc: 0.5,
    lim: [0, 1] as Limit,
    pos: [0.5, 0.5] as Point,
    size: 1,
    rect: [0, 0, 1, 1] as Rect,
    coord: [0, 0, 1, 1] as Rect,
    point: 0.05,
    N: 100,
    svg_size: 500,
    calc_size: 16,
}

export { DEFAULTS, svgns, htmlns, sans, mono, moji, cmoji, regular, bold, vtext, none, black, white, gray, blue, red, green, yellow, purple, lightgray, darkgray, e, pi, phi, r2d, d2r }
