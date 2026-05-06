// core components

import { THEME } from '../lib/theme'
import { DEFAULTS as D, svgns, sans, regular, blue, red, d2r } from '../lib/const'
import { is_scalar, abs, cos, sin, tan, cot, mul2, div2, filter_object, expand_rect, rect_box, cbox_rect, rect_cbox, merge_points, merge_rects, ensure_vector, broadcast_point, rounder, heavisign, abs_min, abs_max, rect_radial, rotate_aspect, remap_rect, rescaler, resizer, rect_size, vector_angle, polar, upright_rect } from '../lib/utils'
import { random } from '../lib/rng'

import type { Point, Rect, Size, AlignValue, Align, Side, Attrs, MNumber, MPoint, Spec } from '../lib/types'

//
// rect embedding
//

function align_frac(align: AlignValue): number {
    if (is_scalar(align)) {
        return align as number
    } else if (align == 'left' || align == 'top') {
        return 0
    } else if (align == 'center' || align == 'middle') {
        return 0.5
    } else if (align == 'right' || align == 'bottom') {
        return 1
    } else{
        throw new Error(`Unrecognized alignment specification: ${align}`)
    }
}

function anchor_point(rect: Rect, side: Side, loc: number): Point {
    const [ xmin, ymin, xmax, ymax] = rect
    const [ xmid, ymid ] = [ xmin + (xmax - xmin) * loc, ymin + (ymax - ymin) * loc ]
    if (side == 'top' || side == 't') return [ xmid, ymin ]
    if (side == 'bottom' || side == 'b') return [ xmid, ymax ]
    if (side == 'right' || side == 'r') return [ xmax, ymid ]
    if (side == 'left' || side == 'l') return [ xmin, ymid ]
    if (side == 'north' || side == 'n') return [ xmid, ymin ]
    if (side == 'south' || side == 's') return [ xmid, ymax ]
    if (side == 'east' || side == 'e') return [ xmax, ymid ]
    if (side == 'west' || side == 'w') return [ xmin, ymid ]
    throw new Error(`Unrecognized side: ${side}`)
}

// embed a rect of given `aspect` into rect of given `size`
function embed_size(size: Point, { aspect, expand = false }: { aspect?: number, expand?: boolean } = {}): Size {
    if (aspect == null || aspect == 0) return size
    const [ w0, h0 ] = size
    const [ aw, ah ] = [ abs(w0), abs(h0) ]
    const [ sw, sh ] = [ heavisign(w0), heavisign(h0) ]
    const agg = expand ? Math.max : Math.min
    const h = agg(aw / aspect, ah)
    const w = h * aspect
    return [ sw * w, sh * h ]
}

// get the size of an `aspect` rect that will fit in `size` after `rotate`
function rotate_rect(size: Size, rotate: number, { aspect, expand = false, rotate_invar = false, tol = 0.001 }: { aspect?: number, expand?: boolean, rotate_invar?: boolean, tol?: number } = {}): Size {
    // knock out easy case
    if (rotate == 0 || rotate_invar) return embed_size(size, { aspect, expand })

    // unpack inputs
    const [ w0, h0 ] = size
    const [ aw0, ah0 ] = [ abs(w0), abs(h0) ]
    const [ sw, sh ] = [ heavisign(w0), heavisign(h0) ]
    const theta = d2r * rotate

    // trig compute
    const COS = abs(cos(theta))
    const SIN = abs(sin(theta))

    // Fit using absolute extents, then restore signs so flipped coordinate
    // systems preserve their orientation on each axis independently.
    let [ w, h ] = [ aw0, ah0 ]
    if (aspect != null) {
        // this has an exact solution
        const DW = aspect * COS + SIN
        const DH = aspect * SIN + COS
        const agg = expand ? abs_max : abs_min
        h = agg(aw0 / DW, ah0 / DH)
        w = h * aspect
    } else {
        // this has some degeneracy, which we resolve with maximal area
        // max Area = w * h
        // st  C * w + S * h <= w0
        //     C * h + S * w <= h0
        const paspect = aw0 / ah0
        const TAN = abs(tan(theta))
        const COT = abs(cot(theta))
        const [ TL, TH ] = [ Math.min(TAN, COT), Math.max(TAN, COT) ]
        if (paspect < TL) {
            w = aw0 / (2 * COS)
            h = aw0 / (2 * SIN)
        } else if (paspect > TH) {
            w = ah0 / (2 * SIN)
            h = ah0 / (2 * COS)
        } else {
            const denom = COS * COS - SIN * SIN
            if (abs(denom) < tol) {
                // this uses a leontieff objective
                const t = abs_min(aw0, ah0) / (COS + SIN)
                w = h = t
            } else {
                w = (aw0 * COS - ah0 * SIN) / denom
                h = (ah0 * COS - aw0 * SIN) / denom
            }
        }
    }

    // return base and rotated rect sizes
    return [ sw * w, sh * h ]
}

function rotate_repr(rotate: number, pos: Point, prec: number = D.prec): string {
    const [ x, y ] = pos
    return `rotate(${rounder(rotate, prec)}, ${rounder(x, prec)}, ${rounder(y, prec)})`
}

function adjust_rotate(rotate: number, prect: Rect, coord: Rect): number {
    if (rotate == 0) return rotate
    const csize = rect_size(coord)
    const psize = rect_size(prect)
    const proj = div2(psize, csize)
    const vec = polar([ proj, rotate ])
    return vector_angle(vec)
}

//
// context class
//

interface ContextArgs {
    prect?: Rect
    prec?: number
    coord?: Rect
    transform?: string
    meta?: Metadata
}

interface MapArgs {
    offset?: boolean
}

// context holds the current pixel rect and other global settings
// map() will create a new sub-context using rect in coord space
// map*() functions map from coord to pixel space (in prect)
class Context {
    args: ContextArgs
    prect: Rect
    coord: Rect
    prec: number
    meta: Metadata
    transform: string | undefined
    rescalex: (v: number | MNumber, offset?: boolean) => number
    rescaley: (v: number | MNumber, offset?: boolean) => number
    resizex: (v: number | MNumber, offset?: boolean) => number
    resizey: (v: number | MNumber, offset?: boolean) => number

    constructor(args: ContextArgs = {}) {
        const { prect = D.rect, coord = D.coord, transform, prec = D.prec, meta } = args
        this.args = args

        // coordinate transform
        this.prect = prect // drawing rect
        this.coord = coord // coordinate rect
        this.transform = transform // rotation transform

        // top level arguments
        this.prec = prec // string precision

        // percolated upwards
        this.meta = meta ?? new Metadata() // meta data

        // make rescaler / resizer
        // there are heavily used, so precompute what we can (haven't profiled yet)
        const [ cx1, cy1, cx2, cy2 ] = coord
        const [ px1, py1, px2, py2 ] = prect
        this.rescalex = rescaler([ cx1, cx2 ], [ px1, px2 ])
        this.rescaley = rescaler([ cy1, cy2 ], [ py1, py2 ])
        this.resizex = resizer([ cx1, cx2 ], [ px1, px2 ])
        this.resizey = resizer([ cy1, cy2 ], [ py1, py2 ])
    }

    clone(args: ContextArgs): Context {
        return new Context({ ...this.args, meta: this.meta, ...args })
    }

    // map point from coord to pixel
    mapPoint(cpoint: Point | MPoint, offset: boolean = true): Point {
        const [ cx, cy ] = cpoint
        return [ this.rescalex(cx, offset), this.rescaley(cy, offset) ]
    }

    // map rect from coord to pixel
    mapRect(crect: Rect, offset: boolean = true): Rect {
        const [ x1, y1, x2, y2 ] = crect
        return [
            this.rescalex(x1, offset), this.rescaley(y1, offset),
            this.rescalex(x2, offset), this.rescaley(y2, offset),
        ]
    }

    // map size from coord to pixel
    mapSize(csize: Point, offset: boolean = true): Point {
        const [ sw, sh ] = csize
        return [ this.resizex(sw, offset), this.resizey(sh, offset) ]
    }

    // NOTE: this is the main mapping function! be very careful when changing it!
    map({ rect, aspect0: aspect, expand = false, align = 'center' as Align, upright = false, rotate = 0, rotate_adjust = false, rotate_invar = false, offset = true, coord = D.coord } = {} as Spec & MapArgs): Context {
        // get true pixel rect (default to parent coord)
        const prect0 = this.mapRect(rect ?? this.coord, offset)
        const [ x0, y0, w0, h0 ] = rect_cbox(prect0)

        // possibly adjust rotate for aspect ratio
        const rotate1 = rotate_adjust ? adjust_rotate(rotate, prect0, coord) : rotate

        // rotate rect inside
        const [ w, h ] = rotate_rect([ w0, h0 ], rotate1, { aspect, expand, rotate_invar })
        const transform = rotate1 ? rotate_repr(rotate1, [ x0, y0 ], this.prec) : undefined

        // broadcast align into [ halign, valign ] components
        const [ hafrac, vafrac ] = ensure_vector(align, 2).map(align_frac)
        const [ x, y ] = [
            x0 + (0.5 - hafrac) * (w - w0),
            y0 + (0.5 - vafrac) * (h - h0),
        ]

        // return new context
        const prect1 = cbox_rect([ x, y, w, h ])
        const prect = upright ? upright_rect(prect1)! : prect1
        return new Context({ prect, coord, transform, prec: this.prec, meta: this.meta })
    }
}

//
// attributes
//

function demangle(k: string): string {
    return k.replace('_', '-')
}

function escape_text(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function escape_attr(s: string): string {
    return escape_text(s)
        .replace(/"/g, '&quot;')
}

function props_repr(d: Attrs, prec: number): string {
    return Object.entries(d)
        .filter(([_k, v]) => v != null)
        .map(([k, v]) => `${demangle(k)}="${escape_attr(rounder(v, prec))}"`)
        .join(' ')
}

// reserved keys
const SPEC_KEYS = [ 'rect', 'coord', 'aspect', 'aspect0', 'expand', 'align', 'upright', 'offset', 'rotate', 'rotate_adjust', 'rotate_invar' ]
const HELP_KEYS = [ 'pos', 'size', 'xsize', 'ysize', 'flex', 'spin', 'orient' ]
const EXTR_KEYS = [ 'stack_size' ]
const RESERVED_KEYS = [ ...SPEC_KEYS, ...HELP_KEYS, ...EXTR_KEYS ]

function spec_split(attr: Attrs, extended: boolean = true): [Attrs, Attrs] {
    const SPLIT_KEYS = extended ? RESERVED_KEYS : SPEC_KEYS
    const spec  = filter_object(attr, (k: string, v: any) => v != null &&  SPLIT_KEYS.includes(k))
    const attr1 = filter_object(attr, (k: string, v: any) => v != null && !SPLIT_KEYS.includes(k))
    return [ spec, attr1 ]
}

//
// element class
//

function is_element(x: any): x is Element {
    return x instanceof Element
}

interface SpecArgs {
    rect?: Rect
    coord?: Rect | 'auto'
    aspect?: number | 'auto'
    aspect0?: number
    expand?: boolean
    align?: Align
    upright?: boolean
    rotate?: number
    rotate_invar?: boolean
    rotate_adjust?: boolean
}

// TODO: children should be Element[] | string
interface ElementArgs extends SpecArgs {
    tag?: string
    unary?: boolean
    children?: any
    pos?: Point
    size?: number | Size
    xsize?: number
    ysize?: number
    flex?: boolean
    spin?: number
    orient?: number
    debug?: boolean
    [key: string]: any
}

// NOTE: if children gets here, it was ignored by the constructor (so dump it)
class Element {
    args: Attrs
    tag: string
    unary: boolean
    spec: Spec
    attr: Attrs

    constructor(args: ElementArgs = {}) {
        const { tag, unary, children, pos, size, xsize, ysize, flex, spin, orient, ...attr0 } = args
        const [ spec, attr ] = spec_split(attr0, false)
        this.args = args

        // check for required keys
        if (tag == null) throw new Error('tag is required')
        if (unary == null) throw new Error('unary is required')

        // core display
        this.tag = tag
        this.unary = unary

        // store layout params
        this.spec = spec
        this.attr = attr

        // handle pos/size conveniences
        if (pos != null || size != null || xsize != null || ysize != null) {
            const has_xy = xsize != null || ysize != null
            const size1 = has_xy ? [ xsize ?? 0, ysize ?? 0 ] as Point : undefined
            this.spec.rect ??= cbox_rect([ ...(pos ?? D.pos), ...(broadcast_point(size ?? size1 ?? D.size)) ])
            if (has_xy) this.spec.expand = true
        }

        // various convenience conversions
        if (spin != null) { this.spec.rotate = spin; this.spec.rotate_invar = true }
        if (orient != null) { this.spec.rotate = orient; this.spec.rotate_adjust = true }
        if (flex === true) this.spec.aspect = undefined

        // adjust aspect for rotation
        this.spec.aspect0 ??= this.spec.aspect
        this.spec.aspect = this.spec.rotate_invar ? this.spec.aspect0 : rotate_aspect(this.spec.aspect0, this.spec.rotate)

        // warn if children are passed
        if (children != null) console.error(`Got children in ${this.constructor.name}`)
    }

    clone(args: Attrs = {}): Element {
        return new (this.constructor as any)({ ...this.args, ...args })
    }

    rect(ctx: Context): Rect {
        const { prect } = ctx.map(this.spec)
        return remap_rect(prect, ctx.prect, ctx.coord)
    }

    graphCoord(): Rect | undefined {
        return this.spec.rect ?? this.spec.coord
    }

    anchor(ctx: Context, side: Side, loc: number = 0.5): Point {
        const prect = this.rect(ctx)
        return anchor_point(prect, side, loc)
    }

    props(ctx: Context): Attrs {
        const { transform } = ctx
        if (transform == null) return this.attr
        return  { ...this.attr, transform }
    }

    inner(_ctx: Context): string {
        return ''
    }

    svg(ctx?: Context): string {
        // default context
        ctx ??= new Context()

        // collect all properties
        const pvals = this.props(ctx)
        const props = props_repr(pvals, ctx.prec)
        const pre = props.length > 0 ? ' ' : ''

        // return final svg
        if (this.unary) {
            return `<${this.tag}${pre}${props} />`
        } else {
            return `<${this.tag}${pre}${props}>${this.inner(ctx)}</${this.tag}>`
        }
    }
}

//
// children geometry
//

function rotated_vertices(rect: Rect, rotate: number | undefined): Point[] {
    // handle zero case first
    if (rotate == null || rotate == 0) {
        const [ x1, y1, x2, y2 ] = rect
        return [ [ x1, y1], [ x2, y2 ] ]
    }

    // get vertices of rect
    const [ cx, cy, rw, rh ] = rect_radial(rect)
    const verts = [
        [-rw, -rh], [ rw, -rh],
        [-rw,  rh], [ rw,  rh],
    ]

    // return rotated vertices
    const theta = d2r * rotate
    const [ SIN, COS ] = [ sin(theta), cos(theta) ]
    return verts.map(([ dx, dy ]) => [
        cx + dx * COS - dy * SIN,
        cy + dx * SIN + dy * COS,
    ])
}

// NOTE: we disable absolute offsets to compute auto aspect
function children_rect(children: Element[], offset: boolean = false): Rect | undefined {
    if (children.length == 0) return

    // get post-rotated vertices of children
    const ctx = new Context()
    const verts = children.flatMap(c => {
        const spec = { ...c.spec, offset }
        const { prect } = ctx.map(spec)
        const prect0 = ctx.mapRect(c.spec.rect ?? ctx.coord, offset)
        const rot0 = c.spec.rotate ?? 0
        const rot1 = c.spec.rotate_adjust ? adjust_rotate(rot0, prect0, c.spec.coord ?? D.coord) : rot0
        const rot = c.spec.rotate_invar ? 0 : rot1
        return rotated_vertices(prect, rot)
    })

    // find enclosing rect for vertices
    return merge_points(verts)
}

function children_aspect(children: Element[]): number | undefined {
    if (children.length == 1) {
        const { aspect } = children[0].spec
        return aspect
    }
}

//
// group class
//

function ensure_children(children: any): Element[] {
    return (children ?? []).filter((c: Element) => c != null)
}

function makeUID(prefix: string): string {
    return `${prefix}-${random().toString(36).slice(2, 10)}`
}

interface GroupArgs extends ElementArgs {
    children?: (Element | null)[]
    coord?: Rect | 'auto'
    clip?: true | Element
    mask?: Element
}

class Group extends Element {
    children: Element[]

    constructor(args: GroupArgs = {}) {
        const { children: children0, aspect: aspect0, coord: coord0, clip: clip0, mask: mask0, debug = false, tag = 'g', ...attr } = args
        const children = ensure_children(children0)

        // handle boolean args
        const clip = clip0 === true ? new Rectangle() : clip0

        // automatic aspect and coord detection
        const aspect = aspect0 == 'auto' ? children_aspect(children) : aspect0
        const coord = coord0 == 'auto' ? children_rect(children) : coord0

        // create debug boxes
        if (debug) {
            const dargs = { stroke_dasharray: 3, opacity: 0.5 }
            const orects = children.map((c: Element) => new Rectangle({ rect: c.spec.rect, ...dargs, stroke: blue }))
            const irects = children.map((c: Element) => new Rectangle({ ...c.spec, ...dargs, stroke: red }))
            children.push(...irects, ...orects)
        }

        // make clip path
        let clip_path: string | undefined
        if (clip != null) {
            const clip_id = makeUID('clip')
            clip_path = `url(#${clip_id})`
            const clip_elem = new ClipPath({ children: [ clip ], id: clip_id })
            children.push(clip_elem)
        }

        // make mask
        let mask: string | undefined
        if (mask0 != null) {
            const mask_id = makeUID('mask')
            mask = `url(#${mask_id})`
            const mask_elem = new Mask({ children: [ mask0 ], id: mask_id })
            children.push(mask_elem)
        }

        // pass to Element
        super({ tag, unary: false, aspect, coord, clip_path, mask, ...attr })
        this.args = args

        // additional props
        this.children = children
    }

    graphCoord(): Rect | undefined {
        const coord = super.graphCoord()
        if (coord != null) return coord
        return merge_rects(
            this.children
                .filter(c => c.spec.rect == null)
                .map(c => c.graphCoord())
        )
    }

    inner(ctx: Context): string {
        const inner = this.children
            .map(c => c.svg(ctx.map(c.spec)))
            .filter(s => s.length > 0)
            .join('\n')
        return `\n${inner}\n`
    }

    svg(ctx?: Context): string {
        const props = this.props(ctx!)
        if (Object.keys(props).length == 0) return this.inner(ctx!).trim()
        return super.svg(ctx)
    }
}

//
// metadata classes
//

class ClipPath extends Group {
    constructor(args: GroupArgs = {}) {
        const { children, ...attr } = args
        super({ tag: 'clipPath', children, ...attr })
        this.args = args
    }

    svg(ctx?: Context): string {
        const def = super.svg(ctx)
        ctx!.meta.addDef(def)
        return ''
    }
}

class Mask extends Group {
    constructor(args: GroupArgs = {}) {
        const { children, ...attr } = args
        super({ tag: 'mask', children, ...attr })
        this.args = args
    }

    svg(ctx?: Context): string {
        const def = super.svg(ctx)
        ctx!.meta.addDef(def)
        return ''
    }
}

class Style extends Element {
    text: string

    constructor(args: ElementArgs = {}) {
        const { children } = args
        super({ tag: 'style', unary: false })
        this.text = children
    }

    svg(_ctx?: Context): string {
        if (this.text.length == 0) return ''
        return `<style>\n${this.text}\n</style>`
    }
}

class Metadata {
    uuid: number
    defs: string[]

    constructor() {
        this.uuid = 0 // next uuid
        this.defs = [] // defs list
    }

    getUid(): string {
        return `uid-${this.uuid++}`
    }

    addDef(def: string): void {
        this.defs.push(def)
    }

    svg(): string {
        if (this.defs.length == 0) return ''
        return `<defs>\n${this.defs.join('\n')}\n</defs>`
    }
}

//
// svg class
//

interface SvgArgs extends GroupArgs {
    size?: number | Size
    padding?: number
    bare?: boolean
    dims?: boolean
    filters?: any
    view?: Rect
    style?: string
    xmlns?: string
    font_family?: string
    font_weight?: number
    prec?: number
}

class Svg extends Group {
    size: Size
    viewrect: Rect
    style: Style
    prec: number

    constructor(args: SvgArgs = {}) {
        const { children: children0, size : size0 = D.svg_size, padding = 1, bare = false, dims = true, filters, aspect: aspect0 = 'auto', view: view0, style, xmlns = svgns, font_family = sans, font_weight = regular, prec = D.prec, ...attr } = THEME(args, 'Svg')
        const children = ensure_children(children0)
        const size_base = broadcast_point(size0)

        // precompute aspect info
        const aspect = aspect0 == 'auto' ? children_aspect(children) : aspect0
        const [ width, height ] = embed_size(size_base, { aspect })

        // compute outer viewBox
        const viewrect0 = view0 ?? [ 0, 0, width, height ]
        const viewrect = expand_rect(viewrect0, padding) as Rect

        // make style element
        const style_elem = new Style({ children: style ?? '' })
        const dims_attr = dims ? { width, height } : {}

        // pass to Group
        super({ tag: 'svg', children, aspect, xmlns, font_family, font_weight, ...dims_attr, ...attr })
        this.args = args

        // additional props
        this.size = [ width, height ]
        this.viewrect = viewrect
        this.style = style_elem
        this.prec = prec
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { viewrect } = this
        const { prec } = ctx

        // construct viewBox
        const [ x, y, w, h ] = rect_box(viewrect)
        const viewBox = `${rounder(x, prec)} ${rounder(y, prec)} ${rounder(w, prec)} ${rounder(h, prec)}`

        // return attributes
        return { viewBox, ...attr }
    }

    inner(ctx: Context): string {
        const inner = super.inner(ctx)
        const defs = ctx.meta.svg()
        const style = this.style.svg(ctx)
        const body = [ defs, style, inner ]
            .filter(s => s.length > 0)
            .map(s => s.trim())
            .join('\n')
        return `\n${body}\n`
    }

    svg(args?: ContextArgs): string {
        const { size, prec } = this

        // make new context
        const [ w, h ] = size
        const prect = [ 0, 0, w, h ] as Rect
        const ctx = new Context({ prect, prec, ...args })

        // render children
        return super.svg(ctx)
    }
}

//
// rectangle class
//

interface RectArgs extends ElementArgs {
    rounded?: number | Size
}

class Rectangle extends Element {
    rounded?: number | Size

    constructor(args: RectArgs = {}) {
        const { rounded, ...attr } = THEME(args, 'Rect')

        // pass to Element
        super({ tag: 'rect', unary: true, ...attr })
        this.args = args

        // additional props
        this.rounded = rounded
    }

    props(ctx: Context): Attrs {
        // get core attributes
        const attr = super.props(ctx)

        // get true pixel rect
        const { prect } = ctx
        let [ x, y, w, h ] = rect_box(prect, true)

        // scale border rounded
        let rx: number | undefined
        let ry: number | undefined
        if (this.rounded != null) {
            const s = 0.5 * (w + h)
            if (is_scalar(this.rounded)) {
                rx = s * this.rounded
            } else {
                [ rx, ry ] = mul2(this.rounded, s)
            }
        }

        // output properties
        return { x, y, width: w, height: h, rx, ry, ...attr }
    }
}

//
// spacer class
//

// this can have an aspect, which is utilized by layouts
class Spacer extends Element {
    constructor(args: ElementArgs = {}) {
        const attr = THEME(args, 'Spacer')
        super({ tag: 'g', unary: true, ...attr })
        this.args = args
    }

    svg(_ctx?: Context): string {
        return ''
    }
}

//
// exports
//

export { Context, Element, Group, Svg, Rectangle, Spacer, Mask, ClipPath, Style, Metadata, is_element, ensure_children, spec_split, align_frac, escape_text }
export type { SpecArgs, ElementArgs, GroupArgs, ContextArgs, SvgArgs, RectArgs }
