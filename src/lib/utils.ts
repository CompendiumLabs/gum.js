// core utils

import { DEFAULTS as D, d2r, r2d } from './const'
import { setSeed, random, uniform, normal, integer } from './rng'
import type { Point, Rect, Limit, RGBA, MNumber, MPoint, Orient, Side, Side0, Angle, Direc, Size, Pair, Grad, Polar, Attrs } from './types'

//
// environment tests
//

function is_browser(): boolean {
    return typeof window != 'undefined'
}

//
// type tests
//

function is_boolean(x: any): x is boolean {
    return typeof(x) == 'boolean'
}

function is_scalar(x: any): x is number {
    return typeof(x) == 'number'
}

function is_point(x: any): x is Point {
    return is_array(x) && x.length == 2
}

function is_size(x: any): x is Size {
    return is_array(x) && x.length == 2
}

function is_rect(x: any): x is Rect {
    return is_array(x) && x.length == 4
}

function is_string(x: any): x is string {
    return typeof(x) == 'string'
}

function is_number(x: any): x is number {
    return typeof(x) == 'number'
}

function is_object(x: any): boolean {
    return typeof(x) == 'object'
}

function is_function(x: any): x is Function {
    return typeof(x) == 'function'
}

function is_array<T>(x: T | T[]): x is T[] {
    return Array.isArray(x)
}

function is_singleton(x: any): boolean {
    return is_array(x) && x.length == 1
}

//
// type conversions
//

function ensure_vector<T>(x: T | T[], n: number): T[] {
    if (!is_array(x)) {
        return range(n).map(_i => x)
    } else {
        return x
    }
}

function ensure_singleton<T>(x: T[] | undefined): T | undefined {
    if (x == null) return undefined
    return is_array(x) ? x[0] : x
}

function ensure_function(x: any): any {
    if (x == null) return
    if (is_function(x)) {
        return x
    } else {
        return () => x
    }
}

//
// type checks
//

function check_singleton<T>(children: (T | null)[] | undefined): T {
    if (children == null || !is_array(children) || children.length > 1) throw new Error('Must have exactly one child')
    const child = ensure_singleton(children)
    if (child == null) throw new Error('Must have exactly one child')
    return child
}

function check_array<T>(x: T[] | undefined, n?: number): T[] {
    if (!is_array(x)) throw new Error('Must be an array')
    if (n != null && x.length != n) throw new Error(`Must have ${n} elements`)
    return x
}

function check_string<T>(children: T[] | undefined): string {
    const child = ensure_singleton(children)
    if (child == null) return ''
    if (is_scalar(child) || is_boolean(child)) return String(child)
    if (!is_string(child)) throw new Error('Child must be a string')
    return child
}

//
// array utils
//

type ZipArgs = readonly ReadonlyArray<unknown>[]
type ZipRow<T extends ZipArgs> = { [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? U : never }

function* gzip<T extends ZipArgs>(...iterables: T): Generator<ZipRow<T>> {
    if (iterables.length == 0) {
        return
    }
    const iterators = iterables.map(i => i[Symbol.iterator]()) as { [K in keyof T]: Iterator<ZipRow<T>[K]> }
    while (true) {
        const results = iterators.map(iter => iter.next()) as { [K in keyof T]: IteratorResult<ZipRow<T>[K]> }
        if (results.some(res => res.done)) {
            return
        } else {
            yield results.map(res => res.value) as ZipRow<T>
        }
    }
}

function zip<T extends ZipArgs>(...iterables: T): ZipRow<T>[] {
    return [...gzip(...iterables)]
}

function reshape<T>(arr: T[], shape: [number, number]): T[][] {
    const [n, m] = shape
    const ret: T[][] = []
    for (let i = 0; i < n; i++) {
        ret.push(arr.slice(i*m, (i+1)*m))
    }
    return ret
}

function split<T>(arr: T[], len: number): T[][] {
    const n = Math.ceil(arr.length / len)
    return reshape(arr, [n, len])
}

function concat<T>(arrs: T[][]): T[] {
    return arrs.flat()
}

function squeeze<T>(x: T | T[]): T | T[] {
    return is_array(x) && x.length == 1 ? x[0] : x
}

function slice<T>(arr: T[], i0: number, i1: number, step: number = 1): T[] {
    const idx = range(i0, i1, step)
    return arr.filter((_, i) => idx.includes(i))
}

function intersperse<T>(items: T[], spacer: T): T[] {
    return items.flatMap((item, i) => i > 0 ? [ spacer, item ] : [ item ])
}

//
// array reducers
//

function sum(arr: (number | undefined)[]): number {
    return arr.filter(v => v != null)
              .reduce((a: number, b: number) => a + b, 0)
}

function prod(arr: (number | undefined)[]): number {
    return arr.filter(v => v != null)
              .reduce((a: number, b: number) => a * b, 1)
}

function mean(arr: number[]): number {
    return sum(arr) / arr.length
}

function all(arr: boolean[]): boolean {
    return arr.reduce((a, b) => a && b, true)
}

function any(arr: boolean[]): boolean {
    return arr.reduce((a, b) => a || b, false)
}

//
// array ops
//

function cumsum(arr: number[], first: boolean = true): number[] {
    let sum = 0
    const ret = arr.map(x => sum += x)
    return first ? [ 0, ...ret ] : ret
}

function norm(vals: number[], degree: number = 2): number {
    return sum(vals.map(v => v**degree))**(1 / degree)
}

function normalize(vals: number[], degree: number = 1): number[] {
    const mag = norm(vals, degree)
    return (mag == 0) ? vals.map(_v => 0) : vals.map(v => v / mag)
}

//
// array generators
//

function range(ia: number, ib?: number, step: number = 1): number[] {
    const [ i0, i1 ] = (ib == null) ? [ 0, ia ] : [ ia, ib ]
    const n = floor((i1 - i0) / step)
    return [...Array(n).keys()].map(i => i0 + step * i)
}

function linspace(x0: number, x1: number, n: number, end: boolean = true): number[] {
    if (end && n == 1) return [ 0.5 * (x0 + x1) ]
    const n1 = end ? n : n + 1
    const step = (x1 - x0) / (n1 - 1)
    const values = [...Array(n1).keys()].map(i => x0 + step * i)
    return end ? values : values.slice(0, -1)
}

function enumerate<T>(x: T[]): [number, T][] {
    const n = x.length
    const idx = range(n)
    return zip(idx, x)
}

function repeat<T>(x: T, n: number): T[] {
    return Array(n).fill(x)
}

function padvec<T>(vec: T[], len: number, val: T): T[] {
    if (vec.length >= len) return vec
    const m = len - vec.length
    return [...vec, ...repeat(val, m)]
}

//
// array combinators
//

function meshgrid<T, U>(x: T[], y: U[]): [T, U][] {
    return x.flatMap(xi => y.map(yi => [ xi, yi ] as [T, U]))
}

function lingrid(xlim: Limit, ylim: Limit, N: number | Point): Point[] {
    const [Nx, Ny] = ensure_vector(N, 2)
    const xgrid = linspace(...xlim, Nx)
    const ygrid = linspace(...ylim, Ny)
    return meshgrid(xgrid, ygrid)
}

//
// object utils
//

function map_object<T, U>(obj: Record<string, T>, fn: (k: string, v: T) => U): Record<string, U> {
    return Object.fromEntries(
        Object.entries(obj).map(([ k, v ]) => [ k, fn(k, v) ])
    )
}

function filter_object<T>(obj: Record<string, T>, fn: (k: string, v: T) => boolean): Record<string, T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([ k, v ]) => fn(k, v))
    )
}

//
// prefix utils
//

function prefix_split(pres: string[], attr: Attrs): Attrs[] {
    const attr1: Attrs = { ...attr }
    const pres1 = pres.map(p => `${p}_`)
    const out: Attrs[] = pres.map(_p => ({}))
    Object.keys(attr).map(k => {
        for (const i in pres1) {
            const p1 = pres1[i]
            if (k.startsWith(p1)) {
                const k1 = k.slice(p1.length)
                out[i][k1] = attr1[k]
                delete attr1[k]
                break
            }
        }
    })
    return [ ...out, attr1 ]
}

function prefix_join(pre: string, attr: Attrs): Attrs {
    return Object.fromEntries(
        Object.entries(attr).map(([ k, v ]) => [ `${pre}_${k}`, v ])
    )
}

//
// string utils
//

function rounder(x: number | string, prec?: number): string {
    prec = prec ?? D.prec

    let suf: string
    if (is_string(x) && x.endsWith('px')) {
        x = Number(x.slice(0, -2))
        suf = 'px'
    } else {
        suf = ''
    }

    let ret: string
    if (is_scalar(x)) {
        ret = x.toFixed(prec)
        ret = ret.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '')
    } else {
        ret = x
    }

    return ret + suf
}

function compress_whitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trimStart()
}

//
// math functions
//

// functions
const exp = Math.exp
const log = Math.log
const log10 = Math.log10
const sin = Math.sin
const cos = Math.cos
const tan = Math.tan
const cot = (x: number): number => 1 / tan(x)
const abs = Math.abs
const pow = Math.pow
const sqrt = Math.sqrt
const sign = Math.sign
const floor = Math.floor
const ceil = Math.ceil
const round = Math.round
const atan = Math.atan
const atan2 = Math.atan2
const isNan = Number.isNaN
const isInf = (x: number): boolean => !Number.isFinite(x)

// follows numpy naming conventions
function minimum(...vals: (number | undefined)[]): number | undefined {
    const vals1 = vals.filter(v => v != null) as number[]
    return (vals1.length > 0) ? Math.min(...vals1) : undefined
}

function maximum(...vals: (number | undefined)[]): number | undefined {
    const vals1 = vals.filter(v => v != null) as number[]
    return (vals1.length > 0) ? Math.max(...vals1) : undefined
}

function heaviside(x: number): number {
    return x >= 0 ? 1 : 0
}

function heavisign(x: number): number {
    return x >= 0 ? 1 : -1
}

function abs_min(x: number, y: number): number {
    return abs(x) < abs(y) ? x : y
}

function abs_max(x: number, y: number): number {
    return abs(x) > abs(y) ? x : y
}

// null on empty
function min(vals: (number | undefined)[]): number | undefined {
    const vals1 = vals.filter(v => v != null) as number[]
    return (vals1.length > 0) ? Math.min(...vals1) : undefined
}
function max(vals: (number | undefined)[]): number | undefined {
    const vals1 = vals.filter(v => v != null) as number[]
    return (vals1.length > 0) ? Math.max(...vals1) : undefined
}

function clamp(x: number, lim: Limit): number {
    const [ lo, hi ] = lim
    return Math.max(lo, Math.min(x, hi))
}

function rescale(x: number, lim: Limit): number {
    const [ lo, hi ] = lim
    return (x - lo) / (hi - lo)
}

function sigmoid(x: number): number {
    return 1 / (1 + exp(-x))
}

function logit(p: number): number {
    return log(p / (1 - p))
}

function smoothstep(x: number, lim?: Limit): number {
    const [ lo, hi ] = lim ?? [ 0, 1 ]
    const t = clamp((x - lo) / (hi - lo), [ 0, 1 ])
    return t * t * (3 - 2 * t)
}

function identity<T>(x: T): T {
    return x
}

function invert(x: number | undefined): number | undefined {
    return x != null ? 1 / x : undefined
}

//
// pair arithmetic
//

function broadcast_point(p: number | Point): Point {
    return is_scalar(p) ? [ p, p ] as Point : p
}

function add2(p0: number | Pair, p1: number | Pair): Pair {
    const [ x0, y0 ] = broadcast_point(p0)
    const [ x1, y1 ] = broadcast_point(p1)
    return [ x0 + x1, y0 + y1 ]
}

function sub2(p0: number | Pair, p1: number | Pair): Pair {
    const [ x0, y0 ] = broadcast_point(p0)
    const [ x1, y1 ] = broadcast_point(p1)
    return [ x0 - x1, y0 - y1 ]
}

function mul2(p0: number | Pair, p1: number | Pair): Pair {
    const [ x0, y0 ] = broadcast_point(p0)
    const [ x1, y1 ] = broadcast_point(p1)
    return [ x0 * x1, y0 * y1 ]
}

function div2(p0: number | Pair, p1: number | Pair): Pair {
    const [ x0, y0 ] = broadcast_point(p0)
    const [ x1, y1 ] = broadcast_point(p1)
    return [ x0 / x1, y0 / y1 ]
}

//
// metaposition arithmetic
//

function make_mpoint(p: Point, off: Point): MPoint {
    const [ x, y ] = p
    const [ ox, oy ] = off
    return [ [ x, ox ], [ y, oy ] ]
}

function ensure_mnumber(p: MNumber | number): MNumber {
    return is_scalar(p) ? [ p, 0 ] as MNumber : p
}

function ensure_number(p: MNumber | number): number {
    return is_scalar(p) ? p : p[0]
}

function ensure_mpoint(p: [MNumber | number, MNumber | number]): MPoint {
    const [ p0, p1 ] = p
    return [ ensure_mnumber(p0), ensure_mnumber(p1) ]
}

function ensure_point(p: Point | MPoint): Point {
    return p.map(ensure_number) as Point
}

function squeeze_mnumber(p: MNumber): number {
    const [ x, _ ] = p
    return x
}

function squeeze_mpoint(p: MPoint): Point {
    const [ x, y ] = p
    return [ squeeze_mnumber(x), squeeze_mnumber(y) ]
}

function addm(p0: MNumber | number, p1: MNumber | number): MNumber {
    const [ x0, c0 ] = ensure_mnumber(p0)
    const [ x1, c1 ] = ensure_mnumber(p1)
    return [ x0 + x1, c0 + c1 ]
}

function subm(p0: MNumber | number, p1: MNumber | number): MNumber {
    const [ x0, c0 ] = ensure_mnumber(p0)
    const [ x1, c1 ] = ensure_mnumber(p1)
    return [ x0 - x1, c0 - c1 ]
}

function add2m(p0: MPoint | Point, p1: MPoint | Point): MPoint {
    const [ x0, y0 ] = ensure_mpoint(p0)
    const [ x1, y1 ] = ensure_mpoint(p1)
    return [ addm(x0, x1), addm(y0, y1) ]
}

function sub2m(p0: MPoint | Point, p1: MPoint | Point): MPoint {
    const [ x0, y0 ] = ensure_mpoint(p0)
    const [ x1, y1 ] = ensure_mpoint(p1)
    return [ subm(x0, x1), subm(y0, y1) ]
}

//
// rect stats
//

function rect_size(rect: Rect): Size {
    const [ x1, y1, x2, y2 ] = rect
    return [ x2 - x1, y2 - y1 ]
}

function rect_dims(rect: Rect): Size {
    const [ w, h ] = rect_size(rect)
    return [ abs(w), abs(h) ]
}

function rect_center(rect: Rect): Point {
    const [ x1, y1, x2, y2 ] = rect
    return [ (x1 + x2) / 2, (y1 + y2) / 2 ]
}

function rect_radius(rect: Rect): Size {
    const [ w, h ] = rect_size(rect)
    return [ w / 2, h / 2 ]
}

function rect_aspect(rect: Rect | undefined): number | undefined {
    if (rect == null) return
    const [ w, h ] = rect_dims(rect)
    return w / h
}

//
// rect formats
//

// radial rect: center, radius
function rect_radial(rect: Rect, absolute: boolean = false): Rect {
    const [ cx, cy ] = rect_center(rect)
    const [ rx0, ry0 ] = rect_radius(rect)
    const [ rx, ry ] = absolute ? [ abs(rx0), abs(ry0) ] : [ rx0, ry0 ]
    return [ cx, cy, rx, ry ]
}

// TODO: add optimized path for Point/number case
function radial_rect(p0: Point | MPoint, r0: number | Size): Rect {
    const p = ensure_mpoint(p0)
    const r = broadcast_point(r0)
    const pa = sub2m(p, r)
    const pb = add2m(p, r)
    return [ ...squeeze_mpoint(pa), ...squeeze_mpoint(pb) ]
}

// box rect: min, size
function rect_box(rect: Rect, absolute: boolean = false): Rect {
    const [ x1, y1, x2, y2 ] = rect
    const [ w, h ] = [ x2 - x1, y2 - y1 ]
    if (absolute) {
        return [ Math.min(x1, x2), Math.min(y1, y2), abs(w), abs(h) ]
    } else {
        return [ x1, y1, w, h ]
    }
}

function box_rect(box: Rect): Rect {
    const [ x, y, w, h ] = box
    return [ x, y, x + w, y + h ]
}

// center box rect: center, size
function rect_cbox(rect: Rect): Rect {
    const [ cx, cy ] = rect_center(rect)
    const [ w, h ] = rect_size(rect)
    return [ cx, cy, w, h ]
}

function cbox_rect(cbox: Rect): Rect {
    const [ cx, cy, w, h ] = cbox
    const [ rx, ry ] = [ w / 2, h / 2 ]
    return [ cx - rx, cy - ry, cx + rx, cy + ry ]
}

//
// rect aggregators
//

function merge_rects(rects: (Rect | undefined)[]): Rect | undefined {
    const rects1 = rects.filter(r => r != null) as Rect[]
    if (rects1.length == 0) return
    const [ xa, ya, xb, yb ] = zip(...rects1)
    const [ xs, ys ] = [ [ ...xa, ...xb ], [ ...ya, ...yb ] ]
    return [ min(xs), min(ys), max(xs), max(ys) ] as Rect
}

function merge_points(points: Point[]): Rect | undefined {
    if (points.length == 0) return
    const [ xs, ys ] = zip(...points)
    return [ min(xs), min(ys), max(xs), max(ys) ] as Rect
}

function merge_limits(limits: Limit[]): Limit {
    const [ xa, xb ] = zip(...limits)
    return [ min(xa), max(xb) ] as Limit
}

function merge_values(vals: number[]): Limit {
    return [ min(vals), max(vals) ] as Limit
}

//
// rect transformers
//

function expand_limits(lim: Limit | undefined, fact: number): Limit | undefined {
    if (lim == null) return
    const [ lo, hi ] = lim
    const ex = fact * (hi - lo)
    return [ lo - ex, hi + ex ]
}

function expand_rect(rect: Rect | undefined, expand: number | Size): Rect | undefined {
    if (rect == null) return
    const [ xexp, yexp ] = ensure_vector(expand, 2)
    const [ x1, y1, x2, y2 ] = rect
    return [ x1 - xexp, y1 - yexp, x2 + xexp, y2 + yexp ]
}

function flip_rect(rect: Rect | undefined, vertical: boolean): Rect {
    const [ x1, y1, x2, y2 ] = rect ?? D.rect
    if (vertical) return [ x1, y2, x2, y1 ]
    else return [ x2, y1, x1, y2 ]
}

function upright_rect(rect: Rect | undefined): Rect | undefined {
    if (rect == null) return
    const [ x1, y1, x2, y2 ] = rect
    return [
        Math.min(x1, x2), Math.min(y1, y2),
        Math.max(x1, x2), Math.max(y1, y2),
    ]
}

function upright_limits(lim: Limit): Limit {
    const [ xlo, xhi ] = lim
    return [ Math.min(xlo, xhi), Math.max(xlo, xhi) ]
}

//
// limit utils
//

type LimitArgs = {
    [key in Orient]?: Limit
}

function join_limits({ v, h }: LimitArgs = {}): Rect {
    const [ vlo, vhi ] = v ?? D.lim
    const [ hlo, hhi ] = h ?? D.lim
    return [ hlo, vlo, hhi, vhi ]
}

function split_limits(coord: Rect | undefined): { xlim?: Limit, ylim?: Limit } {
    if (coord == null) return {}
    const [ xlo, ylo, xhi, yhi ] = coord
    return { xlim: [ xlo, xhi ], ylim: [ ylo, yhi ] }
}

function resolve_limits(xlim: Limit | undefined, ylim: Limit | undefined, coord: Rect | undefined): { xlim: Limit, ylim: Limit } {
    const { xlim: xlim0, ylim: ylim0 } = split_limits(coord)
    return { xlim: xlim ?? xlim0!, ylim: ylim ?? ylim0! }
}

function detect_coords(xvals: number[], yvals: number[], xlim: Limit | undefined, ylim: Limit | undefined): Rect {
    return join_limits({
        h: xlim ?? merge_values(xvals) ?? undefined,
        v: ylim ?? merge_values(yvals) ?? undefined,
    })
}

function invert_orient(orient: Orient): Orient {
    if (orient == 'v') return 'h'
    if (orient == 'h') return 'v'
    throw new Error(`Invalid orient: ${orient}`)
}

//
// aspect utils
//

function aspect_invariant(value0: number | Size | Rect, aspect: number = 1, alpha: number = 0.5): Size | Rect {
    const wfact = aspect**alpha
    const hfact = aspect**(1 - alpha)
    const value = is_scalar(value0) ? [ value0, value0 ] as Size : value0

    if (is_size(value)) {
        const [ vw, vh ] = value
        return [ vw * wfact, vh / hfact ] as Size
    } else if (is_rect(value)) {
        const [ vl, vt, vr, vb ] = value
        return [ vl * wfact, vt / hfact, vr * wfact, vb / hfact ] as Rect
    } else {
        throw new Error(`Invalid value: ${value}`)
    }
}

// get the aspect of a rect of given `aspect` after rotating it by `rotate` degrees
function rotate_aspect(aspect: number | undefined, rotate: number | undefined): number | undefined {
    if (aspect == null || rotate == null) return aspect
    const theta = d2r * rotate
    const SIN = abs(sin(theta))
    const COS = abs(cos(theta))
    const DW = aspect * COS + SIN
    const DH = aspect * SIN + COS
    return DW / DH
}

//
// rect mappers
//

function remap_rect(rect: Rect, coord_in: Rect, coord_out: Rect): Rect {
    const [ x0, y0, x1, y1 ] = rect
    const [ c0x0, c0y0, c0x1, c0y1 ] = coord_in
    const [ c1x0, c1y0, c1x1, c1y1 ] = coord_out
    const [ cw0, ch0 ] = [ c0x1 - c0x0, c0y1 - c0y0 ]
    const [ cw1, ch1 ] = [ c1x1 - c1x0, c1y1 - c1y0 ]
    const [ fx0, fy0, fx1, fy1 ] = [
        (x0 - c0x0) / cw0, (y0 - c0y0) / ch0,
        (x1 - c0x0) / cw0, (y1 - c0y0) / ch0,
    ]
    return [
        c1x0 + cw1 * fx0, c1y0 + ch1 * fy0,
        c1x0 + cw1 * fx1, c1y0 + ch1 * fy1,
    ]
}

function rescaler(lim_in: Limit, lim_out: Limit): (x0: number | Pair, offset?: boolean) => number {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    return (x0: number | Pair, offset: boolean = true) => {
        const [ x, c ] = is_array(x0) ? x0 : [ x0, 0 ]
        const f = (x - in_lo) / in_len
        const x1 = out_lo + f * out_len
        return offset ? x1 + c : x1
    }
}

function resizer(lim_in: Limit, lim_out: Limit): (x0: number | Pair, offset?: boolean) => number {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    const ratio = out_len / in_len
    return (x0: number | Pair, offset: boolean = true) => {
        const [ x, c ] = is_array(x0) ? x0 : [ x0, 0 ]
        const x1 = x * ratio
        return offset ? x1 + c : x1
    }
}

//
// angle and direction utils
//

function norm_angle(deg: number): number {
    if (deg == 360) return 359.99
    deg = deg % 360
    return deg < 0 ? deg + 360 : deg
}

function vector_angle(vector: Point): number {
    const [ x, y ] = vector
    return r2d * Math.atan2(y, x)
}

function angle_direc(angle: Angle): Point {
    return [ cos(d2r * angle), sin(d2r * angle) ]
}

function polar([radius, angle]: Polar, center?: Point): Point {
    const offset = mul2(radius, angle_direc(angle))
    return center ? add2(center, offset) : offset
}

function norm_side(side: Side): Side0 {
    if (side == 'top' || side == 't' || side == 'north' || side == 'n') return 't'
    if (side == 'bottom' || side == 'b' || side == 'south' || side == 's') return 'b'
    if (side == 'left' || side == 'l' || side == 'west' || side == 'w') return 'l'
    if (side == 'right' || side == 'r' || side == 'east' || side == 'e') return 'r'
    throw new Error(`Invalid side: ${side}`)
}

function side_direc(side: Side): Point {
    if (side == 'top' || side == 't') return [ 0, -1 ]
    if (side == 'bottom' || side == 'b') return [ 0, 1 ]
    if (side == 'left' || side == 'l') return [ -1, 0 ]
    if (side == 'right' || side == 'r') return [ 1, 0 ]
    if (side == 'north' || side == 'n') return [ 0, -1 ]
    if (side == 'south' || side == 's') return [ 0, 1 ]
    if (side == 'east' || side == 'e') return [ 1, 0 ]
    if (side == 'west' || side == 'w') return [ -1, 0 ]
    throw new Error(`Invalid side: ${side}`)
}

function unit_direc(direc: Direc): Point {
    if (is_string(direc)) return side_direc(direc as Side)
    if (is_scalar(direc)) return angle_direc(direc as number)
    if (is_array(direc) && direc.length == 2) return normalize(direc, 2) as Grad
    throw new Error(`Invalid direction: ${direc}`)
}

//
// color handling
//

function hexToRgba(hex: string): RGBA {
    hex = hex.replace('#', '')
    if (hex.length == 3) {
        hex = hex.split('').map(c => c + c).join('')
    } else if (hex.length == 4) {
        hex = hex.split('').map(c => c + c).join('')
    }
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = hex.length == 8 ? parseInt(hex.slice(6, 8), 16) : 255
    return [ r, g, b, a / 255 ]
}

function rgba_repr(rgba: RGBA): string {
    const [ r, g, b, a ] = rgba
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
}

function lerp_rgba(start: RGBA, stop: RGBA, x: number): RGBA {
    return [
        start[0] + (stop[0] - start[0]) * x,
        start[1] + (stop[1] - start[1]) * x,
        start[2] + (stop[2] - start[2]) * x,
        start[3] + (stop[3] - start[3]) * x,
    ]
}

function interp(start0: string, stop0: string, x: number): string {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    return rgba_repr(lerp_rgba(start, stop, x))
}

function palette(start0: string, stop0: string, lim: Limit = D.lim): (x: number) => string {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const scale = rescaler(lim, D.lim)
    function gradient(x: number): string {
        const x1 = scale(x)
        const c = lerp_rgba(start, stop, x1)
        return rgba_repr(c)
    }
    return gradient
}

//
// binary search
//

// find interval index i such that arr[i] <= t < arr[i+1] in a sorted array
// clamps to valid range [0, arr.length - 2]
function binary_search(arr: number[], t: number): number {
    const n = arr.length
    let lo = 0, hi = n - 2
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (arr[mid + 1] < t) {
            lo = mid + 1
        } else {
            hi = mid
        }
    }
    return lo
}

//
// export
//

export { is_browser, is_boolean, is_scalar, is_string, is_number, is_object, is_function, is_array, is_singleton, is_point, ensure_vector, ensure_singleton, ensure_function, check_singleton, check_array, check_string, gzip, zip, reshape, split, concat, squeeze, slice, intersperse, sum, prod, mean, all, any, cumsum, norm, normalize, range, linspace, enumerate, repeat, padvec, meshgrid, lingrid, map_object, filter_object, compress_whitespace, exp, log, log10, sin, cos, tan, cot, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, isNan, isInf, minimum, maximum, heaviside, heavisign, abs_min, abs_max, min, max, clamp, rescale, sigmoid, logit, smoothstep, identity, invert, setSeed, random, uniform, normal, integer, broadcast_point, add2, sub2, mul2, div2, ensure_number, ensure_point, ensure_mnumber, ensure_mpoint, addm, subm, add2m, sub2m, make_mpoint, squeeze_mnumber, squeeze_mpoint, rect_size, rect_dims, rect_center, rect_radius, rect_aspect, rect_radial, norm_angle, split_limits, vector_angle, angle_direc, polar, side_direc, unit_direc, norm_side, rgba_repr, interp, palette, detect_coords, resolve_limits, join_limits, invert_orient, aspect_invariant, flip_rect, radial_rect, box_rect, rect_box, cbox_rect, rect_cbox, merge_rects, merge_points, merge_limits, merge_values, expand_limits, expand_rect, upright_rect, upright_limits, rounder, remap_rect, resizer, rescaler, rotate_aspect, prefix_split, prefix_join, binary_search }
