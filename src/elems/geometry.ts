// geometry elements

import { THEME } from '../lib/theme'
import { DEFAULTS as D, d2r, none, gray } from '../lib/const'
import { is_boolean, is_scalar, is_array, ensure_vector, ensure_point, check_array, upright_limits, rounder, abs, rect_radial, make_mpoint, merge_points, broadcast_point, add2, sub2, mul2, div2, norm, angle_direc, unit_direc, vector_angle, polar, prefix_split} from '../lib/utils'
import { cubic_spline_data, cubic_spline_tangent } from '../lib/interp'
import { Context, Element, Group, Rectangle } from './core'

import type { Point, Rect, Limit, Grad, Attrs, MPoint, Orient, Rounded, Direc } from '../lib/types'
import type { SplineData } from '../lib/interp'
import type { ElementArgs, GroupArgs, RectArgs } from './core'

//
// line classes
//

function points_graph_coord(points: (Point | MPoint)[]): Rect | undefined {
    return merge_points(points.map(ensure_point))
}

interface LineArgs extends ElementArgs {
    points?: (Point | MPoint)[]
    closed?: boolean
}

class Line extends Element {
    points: (Point | MPoint)[]
    poly: boolean

    constructor(args: LineArgs = {}) {
        const { points: points0, closed = false, ...attr } = THEME(args, 'Line')
        const points = check_array(points0)

        // use line tag for 2 points, polyline for more
        const poly = closed || points.length > 2
        const tag = closed ? 'polygon' : (poly ? 'polyline' : 'line')

        super({ tag, unary: true, ...attr })
        this.args = args

        // additional props
        this.points = points
        this.poly = poly
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        if (this.points.length < 2) return attr
        if (this.poly) {
            const pixels = this.points.map(p => ctx.mapPoint(p))
            const points = pointstring(pixels, ctx.prec)
            return { points, ...attr }
        } else {
            const [ p1, p2 ] = this.points
            const [ x1, y1 ] = ctx.mapPoint(p1)
            const [ x2, y2 ] = ctx.mapPoint(p2)
            return { x1, y1, x2, y2, ...attr }
        }
    }

    graphCoord(): Rect | undefined {
        return super.graphCoord() ?? points_graph_coord(this.points)
    }
}

interface UnitLineArgs extends LineArgs {
    direc?: Orient
    loc?: number
    lim?: Limit
}

class UnitLine extends Line {
    constructor(args: UnitLineArgs = {}) {
        const { direc = 'h', loc = D.loc, lim = D.lim, ...attr } = THEME(args, 'UnitLine')

        // construct line positions
        const [ lo, hi ] = lim
        const points: Point[] = (direc == 'v') ?
            [ [ loc, lo ], [ loc, hi ] ] :
            [ [ lo, loc ], [ hi, loc ] ]

        // pass to Line
        super({ points, ...attr })
        this.args = args
    }
}

class VLine extends UnitLine {
    constructor(args: UnitLineArgs = {}) {
        const { ...attr } = THEME(args, 'VLine')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HLine extends UnitLine {
    constructor(args: UnitLineArgs = {}) {
        const { ...attr } = THEME(args, 'HLine')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

interface CoordLineArgs extends LineArgs {
    direc?: Orient
    line_width?: number
}

class CoordLine extends Line {
    direc: Orient
    line_width: number

    constructor(args: CoordLineArgs = {}) {
        const { direc = 'v', line_width = 0.03, ...attr } = args
        super(attr)
        this.args = args
        this.direc = direc
        this.line_width = line_width
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const [ w, h ] = ctx.mapSize([this.line_width, this.line_width])
        const stroke_width = this.direc == 'v' ? h : w
        return { ...attr, stroke_width }
    }
}

//
// shape classes
//

class Square extends Rectangle {
    constructor(args: RectArgs = {}) {
        const { ...attr } = THEME(args, 'Square')
        super({ aspect: 1, ...attr })
        this.args = args
    }
}

class Ellipse extends Element {
    constructor(args: ElementArgs = {}) {
        const { ...attr } = THEME(args, 'Ellipse')
        super({ tag: 'ellipse', unary: true, ...attr })
        this.args = args
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { prect } = ctx
        let [ cx, cy, rx, ry ] = rect_radial(prect, true)
        return { cx, cy, rx, ry, ...attr }
    }
}

class Circle extends Ellipse {
    constructor(args: ElementArgs = {}) {
        const { ...attr } = THEME(args, 'Circle')
        super({ aspect: 1, ...attr })
        this.args = args
    }
}

interface DotArgs extends ElementArgs {
    color?: string
    stroke?: string
    fill?: string
}

class Dot extends Circle {
    constructor(args: DotArgs = {}) {
        const { color = 'black', stroke: stroke0, fill: fill0, ...attr } = THEME(args, 'Dot')
        const stroke = stroke0 ?? color
        const fill = fill0 ?? color
        super({ stroke, fill, ...attr })
        this.args = args
    }
}

interface RayArgs extends LineArgs {
    angle?: number
    loc?: Point
    size?: number | Point
}

class Ray extends Line {
    constructor(args: RayArgs = {}) {
        const { angle = 0, loc = D.pos, size = 0.5, ...attr } = THEME(args, 'Ray')
        const theta = angle * d2r
        const [ x, y ] = loc
        const [ rx, ry ] = ensure_vector(size, 2)
        const points: Point[] = [
            [ x, y ],
            polar(theta, [ rx, ry ], [ x, y ])
        ]
        super({ points, ...attr })
        this.args = args
    }
}

//
// point strings
//

function pointstring(pixels: Point[], prec: number = D.prec): string {
    return pixels.map(([ x, y ]) =>
        `${rounder(x, prec)},${rounder(y, prec)}`
    ).join(' ')
}

interface PointstringArgs extends ElementArgs {
    points?: Point[]
}

class Pointstring extends Element {
    points: Point[]

    constructor(args: PointstringArgs = {}) {
        const { tag, points: points0, ...attr } = THEME(args, 'Pointstring')
        const points = check_array(points0)

        // pass to Element
        super({ tag, unary: true, ...attr })
        this.args = args

        // additional props
        this.points = points
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const pixels = this.points.map(p => ctx.mapPoint(p))
        const points = pointstring(pixels, ctx.prec)
        return { points, ...attr }
    }

    graphCoord(): Rect | undefined {
        return super.graphCoord() ?? points_graph_coord(this.points)
    }
}

class Shape extends Pointstring {
    constructor(args: PointstringArgs = {}) {
        const attr = THEME(args, 'Shape')
        super({ tag: 'polygon', ...attr })
        this.args = args
    }
}

class Triangle extends Shape {
    constructor(args: ElementArgs = {}) {
        const attr = THEME(args, 'Triangle')
        const points: Point[] = [[0.5, 0], [1, 1], [0, 1]]
        super({ points, ...attr })
        this.args = args
    }
}

//
// fill class
//

interface FillArgs extends ElementArgs {
    points1?: Point[] | number
    points2?: Point[] | number
    direc?: 'h' | 'v'
}

function broadcast_points(pts: Point[] | number, ref: Point[], direc: 'h' | 'v'): Point[] {
    if (Array.isArray(pts)) return pts
    const c = pts
    return direc == 'v'
        ? ref.map(([ x, _y ]) => [ x, c ] as Point)
        : ref.map(([ _x, y ]) => [ c, y ] as Point)
}

class Fill extends Shape {
    constructor(args: FillArgs = {}) {
        const { points1, points2, direc = 'v', stroke = none, fill = gray, ...attr } = THEME(args, 'Fill')

        // ensure we have enough points
        if (points1 == null || points2 == null) throw new Error('Fill: must provide points1 and points2')

        // make sure the data is broadcastable
        const a1 = Array.isArray(points1)
        const a2 = Array.isArray(points2)
        if (!a1 && !a2) throw new Error('Fill: at least one of points1, points2 must be an array')

        // broadcast the points
        const ref = (a1 ? points1 : points2) as Point[]
        const pts1 = broadcast_points(points1, ref, direc)
        const pts2 = broadcast_points(points2, ref, direc)
        const points = [ ...pts1, ...pts2.reverse() ]

        // pass to Shape
        super({ points, stroke, fill, ...attr })
        this.args = args
    }
}

class VFill extends Fill {
    constructor(args: FillArgs = {}) {
        const { ...attr } = THEME(args, 'VFill')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HFill extends Fill {
    constructor(args: FillArgs = {}) {
        const { ...attr } = THEME(args, 'HFill')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

//
// path classes
//

interface PathArgs extends ElementArgs {
    children?: Command[]
}

class Path extends Element {
    cmds: Command[]

    constructor(args: PathArgs = {}) {
        const { children = [], ...attr } = THEME(args, 'Path')
        super({ tag: 'path', unary: true, ...attr })
        this.args = args
        this.cmds = children
    }

    data(ctx: Context): string {
        return this.cmds.map(c => c.data(ctx)).join(' ')
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const d = this.data(ctx)
        return { d, ...attr }
    }
}

// TODO: make Commands proper Elements so they work with React
class Command {
    cmd: string

    constructor(cmd: string) {
        this.cmd = cmd
    }

    args(_ctx: Context): string {
        return ''
    }

    data(ctx: Context): string {
        return `${this.cmd} ${this.args(ctx)}`
    }
}

class MoveCmd extends Command {
    pos: Point | MPoint

    constructor(pos: Point | MPoint) {
        super('M')
        this.pos = pos
    }

    args(ctx: Context): string {
        const [ x, y ] = ctx.mapPoint(this.pos)
        return `${rounder(x, ctx.prec)},${rounder(y, ctx.prec)}`
    }
}

class LineCmd extends Command {
    pos: Point | MPoint

    constructor(pos: Point | MPoint) {
        super('L')
        this.pos = pos
    }

    args(ctx: Context): string {
        const [ x, y ] = ctx.mapPoint(this.pos)
        return `${rounder(x, ctx.prec)},${rounder(y, ctx.prec)}`
    }
}

class ArcCmd extends Command {
    pos: Point
    rad: Point
    large: boolean
    sweep: boolean

    constructor(pos: Point, rad: number | Point, sweep: boolean = true, large: boolean = false) {
        super('A')
        this.pos = pos
        this.rad = ensure_vector(rad, 2) as Point
        this.large = large
        this.sweep = sweep
    }

    args(ctx: Context): string {
        const [ x1, y1 ] = ctx.mapPoint(this.pos)
        const [ rx0, ry0 ] = ctx.mapSize(this.rad)
        const [ rx, ry ] = [ abs(rx0), abs(ry0) ]
        const sweep = rx0 * ry0 < 0 ? !this.sweep : this.sweep
        return `${rounder(rx, ctx.prec)},${rounder(ry, ctx.prec)} 0 ${this.large ? 1 : 0} ${sweep ? 1 : 0} ${rounder(x1, ctx.prec)},${rounder(y1, ctx.prec)}`
    }
}

// this makes a rounded corner between two points
// the direction is by default counter-clockwise
// this assumes the cursor is at pos0
class CornerCmd {
    pos0: Point
    pos1: Point

    constructor(pos0: Point, pos1: Point) {
        this.pos0 = pos0
        this.pos1 = pos1
    }

    data(ctx: Context): string {
        const [ x0, y0 ] = ctx.mapPoint(this.pos0)
        const [ x1, y1 ] = ctx.mapPoint(this.pos1)

        // compute aspect ratio
        const [ dx, dy ] = [ Math.abs(x1 - x0), Math.abs(y1 - y0) ]
        const aspect = dx / dy

        // are we in quadrants 1/3 or 2/4?
        const [ top, right ] = [ x1 < x0, y1 < y0 ]
        const [ diag, wide ] = [ top == right, aspect > 1 ]

        // get corner point and fitted radius
        const [ cx, cy ] = diag ? [ x0, y1 ] : [ x1, y0 ]
        const rad = Math.min(dx, dy)

        // get the intra-radial points
        const sigx = right ? -1 :  1
        const sigy = top   ?  1 : -1
        const [ x0p, y0p ] = diag ? [ cx, cy + sigy * rad ] : [ cx + sigx * rad, cy ]
        const [ x1p, y1p ] = diag ? [ cx + sigx * rad, cy ] : [ cx, cy + sigy * rad ]

        // full command
        return (
            ((diag != wide) ? `L ${rounder(x0p, ctx.prec)},${rounder(y0p, ctx.prec)} ` : '')
            + `A ${rounder(rad, ctx.prec)},${rounder(rad, ctx.prec)} 0 0 0 ${rounder(x1p, ctx.prec)},${rounder(y1p, ctx.prec)} `
            + ((diag == wide) ? `L ${rounder(x1, ctx.prec)},${rounder(y1, ctx.prec)} ` : '')
        )
    }
}

// rounds one interior vertex of a polyline. takes the previous point, the
// corner, and the next point, and emits an L-to-entry + arc-to-exit. unlike
// CornerCmd (which is for rectangle traversal), the corner point is given
// explicitly and the radius is rendered as a circular pixel-space fillet.
class RoundedCornerCmd {
    pa: Point | MPoint
    pb: Point | MPoint
    pc: Point | MPoint
    radius: number

    constructor(pa: Point | MPoint, pb: Point | MPoint, pc: Point | MPoint, radius: number) {
        this.pa = pa
        this.pb = pb
        this.pc = pc
        this.radius = radius
    }

    data(ctx: Context): string {
        const ppa = ctx.mapPoint(this.pa)
        const ppb = ctx.mapPoint(this.pb)
        const ppc = ctx.mapPoint(this.pc)

        // pixel-space directions
        const din = sub2(ppb, ppa) as Point
        const dout = sub2(ppc, ppb) as Point
        const lin = norm(din)
        const lout = norm(dout)

        // collinear / degenerate: just draw a line to the corner
        const cross = din[0] * dout[1] - din[1] * dout[0]
        if (lin < 1e-9 || lout < 1e-9 || abs(cross) < 1e-9 * lin * lout) {
            return `L ${rounder(ppb[0], ctx.prec)},${rounder(ppb[1], ctx.prec)}`
        }

        // unit directions
        const uin = div2(din, lin) as Point
        const uout = div2(dout, lout) as Point

        // Pixel-space radius. Use the smaller mapped axis so non-square
        // contexts keep corners circular rather than stretching them.
        const [ rxp, ryp ] = ctx.mapSize([ this.radius, this.radius ]).map(abs) as Point
        const radius0 = Math.min(rxp, ryp)

        // Fit a circular fillet tangent to both segments. For right-angle
        // city-block paths, tangent length equals radius.
        const cos_turn = Math.max(-1, Math.min(1, uin[0] * uout[0] + uin[1] * uout[1]))
        const turn = Math.acos(cos_turn)
        const tan_half = Math.tan(turn / 2)
        if (tan_half < 1e-9) {
            return `L ${rounder(ppb[0], ctx.prec)},${rounder(ppb[1], ctx.prec)}`
        }

        // clamp so adjacent corners can't overlap and we don't overshoot
        const radius = Math.min(radius0, lin / (2 * tan_half), lout / (2 * tan_half))
        const backoff = radius * tan_half

        // entry/exit points in pixel space
        const entry = sub2(ppb, mul2(uin, backoff)) as Point
        const exit = add2(ppb, mul2(uout, backoff)) as Point

        // sweep: positive cross product = clockwise turn in screen space
        const sweep = cross > 0 ? 1 : 0

        return (
            `L ${rounder(entry[0], ctx.prec)},${rounder(entry[1], ctx.prec)} ` +
            `A ${rounder(radius, ctx.prec)},${rounder(radius, ctx.prec)} 0 0 ${sweep} ${rounder(exit[0], ctx.prec)},${rounder(exit[1], ctx.prec)}`
        )
    }
}

type CubicSplineCmdArgs = SplineData<Point | MPoint>

class CubicSplineCmd extends Command {
    pos1: Point | MPoint
    pos2: Point | MPoint
    dir1?: Grad
    dir2?: Grad
    tan1: Point
    tan2: Point
    curve: number

    constructor(args: CubicSplineCmdArgs) {
        const { pos1, pos2, dir1, dir2, tan1, tan2, curve = 0.5 } = args

        // pass to Command
        super('C')

        // additional props
        this.pos1 = pos1
        this.pos2 = pos2
        this.dir1 = dir1
        this.dir2 = dir2
        this.tan1 = tan1
        this.tan2 = tan2
        this.curve = curve
    }

    args(ctx: Context): string {
        // use dir if provided, otherwise use tan
        const tan1 = cubic_spline_tangent(this.pos1, this.pos2, this.dir1, this.tan1)
        const tan2 = cubic_spline_tangent(this.pos1, this.pos2, this.dir2, this.tan2)
        if (tan1 == null || tan2 == null) throw new Error('Spline tangent must be defined')

        // compute scaled tangents
        const stan1 = mul2(tan1, this.curve)
        const stan2 = mul2(tan2, this.curve)

        // get mapped points and tangents
        const ppos1 = ctx.mapPoint(this.pos1)
        const ppos2 = ctx.mapPoint(this.pos2)
        const ptan1 = ctx.mapSize(stan1)
        const ptan2 = ctx.mapSize(stan2)

        // convert to Bernstein form
        const pcon1 = add2(ppos1, div2(ptan1, 3))
        const pcon2 = sub2(ppos2, div2(ptan2, 3))

        // make a path command
        return pointstring([pcon1, pcon2, ppos2], ctx.prec)
    }
}

//
// spline class
//

interface SplineArgs extends ElementArgs {
    points?: (MPoint | Point)[]
    start_dir?: Grad
    end_dir?: Grad
    curve?: number
    closed?: boolean
}

class Spline extends Path {
    points: (MPoint | Point)[]

    constructor(args: SplineArgs = {}) {
        const { points: points0, start_dir, end_dir, curve, closed = false, ...attr } = THEME(args, 'Spline')
        const points = check_array(points0)

        // create path commands
        const move = new MoveCmd(points[0])
        const splines = cubic_spline_data(points, { start_dir, end_dir, curve, closed })
            .map(spline => new CubicSplineCmd(spline))

        // pass to Path
        super({ children: [ move, ...splines ], ...attr })
        this.args = args
        this.points = points
    }

    graphCoord(): Rect | undefined {
        return super.graphCoord() ?? points_graph_coord(this.points)
    }
}

//
// rounded rectangle class
//

function parse_rounded(rounded: Rounded): Point[] {
    if (is_boolean(rounded)) rounded = rounded ? 0.1 : 0
    if (is_scalar(rounded)) {
        rounded = [rounded, rounded, rounded, rounded]
    } else if (is_array(rounded) && rounded.length == 2) {
        const [ rx, ry ] = rounded
        rounded = [[rx, ry], [rx, ry], [rx, ry], [rx, ry]]
    }
    return rounded.map(broadcast_point)
}

interface RoundedRectArgs extends ElementArgs {
    rounded?: Rounded | boolean
    border?: number
}

// supports different rounded for each corner (contra base Rectangle)
class RoundedRect extends Path {
    constructor(args: RoundedRectArgs = {}) {
        const { rounded = 0, border = 1, ...attr } = THEME(args, 'RoundedRect')

        // convert to array of arrays
        const [ rtl, rtr, rbr, rbl ] = parse_rounded(rounded)
        const [ rtlx, rtly ] = rtl
        const [ rtrx, rtry ] = rtr
        const [ rbrx, rbry ] = rbr
        const [ rblx, rbly ] = rbl

        // make command list
        const children = [
            new MoveCmd([1 - rtrx, 0]),
            new LineCmd([rtlx, 0]),
            new CornerCmd([rtlx, 0], [0, rtly]),
            new LineCmd([0, 1 - rbly]),
            new CornerCmd([0, 1 - rbly], [rblx, 1]),
            new LineCmd([1 - rbrx, 1]),
            new CornerCmd([1 - rbrx, 1], [1, 1 - rbry]),
            new LineCmd([1, rtry]),
            new CornerCmd([1, rtry], [1 - rtrx, 0]),
        ]

        // pass to Path
        super({ children, stroke_width: border, upright: true, ...attr })
        this.args = args
    }
}

//
// rounded line class
//

interface RoundedLineArgs extends ElementArgs {
    points?: (Point | MPoint)[]
    radius?: number
}

// polyline with rounded corners — useful for city-block / right-angle routes
// (e.g. network edges) where a Spline produces ugly curvature along the
// straight segments. each interior vertex is replaced by a circular arc whose
// radius is derived from `radius` in coord space and clamped in pixel space.
class RoundedLine extends Path {
    points: (Point | MPoint)[]

    constructor(args: RoundedLineArgs = {}) {
        const { points: points0, radius = 0.05, fill = none, ...attr } = THEME(args, 'RoundedLine')
        const points = check_array(points0)

        // build path commands: Move, then for each interior vertex a rounded
        // corner, then a final Line to the last point
        const corners = points.slice(1, -1).map(
            (p, i) => new RoundedCornerCmd(points[i], p, points[i + 2], radius)
        )
        const children = [
            new MoveCmd(points[0]),
            ...corners,
            new LineCmd(points[points.length - 1]),
        ]

        super({ children, fill, ...attr })
        this.args = args
        this.points = points
    }

    graphCoord(): Rect | undefined {
        return super.graphCoord() ?? points_graph_coord(this.points)
    }
}

//
// arc classe
//

interface ArcArgs extends ElementArgs {
    start?: number
    end?: number
}

class Arc extends Path {
    constructor(args: ArcArgs = {}) {
        const { start, end, upright = true, ...attr } = THEME(args, 'Arc')
        if (start == null || end == null) throw new Error('Must provide `start` and `end` angles')
        const [ angle0, angle1 ] = upright_limits([ start, end ])
        const large = (angle1 - angle0) > 180
        const [ theta0, theta1 ] = [ d2r * angle0, d2r * angle1 ]
        const [ point0, point1 ] = [ theta0, theta1 ].map(t => polar(t, 0.5, [0.5, 0.5]))
        const children = [ new MoveCmd(point0), new ArcCmd(point1, 0.5, true, large) ]
        super({ children, upright, ...attr })
        this.args = args
    }
}

//
// arrow classes
//

interface ArrowHeadArgs extends ElementArgs {
    direc?: number
    arc?: number
    base?: boolean
    exact?: boolean
}

class ArrowHead extends Path {
    constructor(args: ArrowHeadArgs = {}) {
        const { angle = 0, arc = 75, base: base0, exact = true, aspect = 1, fill, stroke_width = 1, stroke_linecap = 'round', stroke_linejoin = 'round', rotate: _rotate, spin: _spin, invar: _invar, rotate_adjust: _rotate_adjust, ...attr } = THEME(args, 'ArrowHead')
        const base = base0 ?? (fill != null)

        // orient the head pointing right
        const [ arc0, arc1, arc2 ] = [ 0, -arc / 2, arc / 2 ]
        const [ dir0, dir1, dir2 ] = [ arc0, arc1, arc2 ].map(angle_direc)

        // get vertex positions
        const off: Point = exact ? mul2(dir0, -0.5 * stroke_width) : [ 0, 0 ]
        const fracs: Point[] = [ [0, 0], dir1, dir2 ]
        const [ fra0, fra1, fra2 ] = fracs.map(d => add2(mul2(d, -0.5), D.pos))
        const [ pos0, pos1, pos2 ] = [ fra0, fra1, fra2 ].map(f => make_mpoint(f, off))

        // make command path
        const commands = fill == null ?
            [ new MoveCmd(pos0), new LineCmd(pos1), new MoveCmd(pos0), new LineCmd(pos2) ] :
            [ new MoveCmd(pos1), new LineCmd(pos0), new LineCmd(pos2) ]
        if (base) commands.push(new MoveCmd(pos1), new LineCmd(pos2))

        // pass to element
        super({ children: commands, aspect, fill, stroke_width, stroke_linecap, stroke_linejoin, orient: -angle, ...attr })
        this.args = args
    }
}

interface ArrowArgs extends GroupArgs {
    points?: Point[]
    start?: Point
    end?: Point
    start_dir?: Direc
    end_dir?: Direc
    arrow?: boolean
    arrow_start?: boolean
    arrow_end?: boolean
    arrow_size?: number
    curve?: number
    rounded?: number
}

class Arrow extends Group {
    constructor(args: ArrowArgs = {}) {
        const { points: points0, start_dir: start_dir0, end_dir: end_dir0, arrow_size = 0.08, arrow, arrow_start: arrow_start0 = false, arrow_end: arrow_end0 = true, curve, rounded, stroke_width = 1, stroke_linecap, fill, coord, ...attr0 } = THEME(args, 'Arrow')
        const [ line_attr0, arrow_attr0, start_attr0, end_attr0, attr ] = prefix_split([ 'line', 'arrow', 'start', 'end' ], attr0)

        // arrow defaults
        const arrow_start = arrow ?? arrow_start0
        const arrow_end   = arrow ?? arrow_end0

        // accumulate arguments
        const stroke_attr = { stroke_width, stroke_linecap }
        const line_attr = { ...stroke_attr, ...line_attr0 }
        const arrow_attr = { fill, ...stroke_attr, ...arrow_attr0 }
        const start_attr = { ...arrow_attr, ...start_attr0 }
        const end_attr = { ...arrow_attr, ...end_attr0 }

        // check for points
        if (points0 == null) throw new Error('Must provide `points`')

        // check for points
        const n = points0.length
        const [ start, start_pre, end_pre, end ] = [ points0[0], points0[1], points0[n-2], points0[n-1] ]
        if (start == null || end == null) throw new Error('Must provide both `start` and `end` points')

        // get the stroke offset
        const stroke_offset = 0.5 * stroke_width

        // infer the from arrow direction
        const start_dir = unit_direc(start_dir0 ?? sub2(start_pre, start))
        const start_ang = 180 - vector_angle(start_dir)
        const start_pos = make_mpoint(start, mul2(start_dir, stroke_offset))

        // infer the to arrow direction
        const end_dir = unit_direc(end_dir0 ?? sub2(end, end_pre))
        const end_ang = -vector_angle(end_dir)
        const end_pos = make_mpoint(end, mul2(end_dir, -stroke_offset))

        // make line path: prefer rounded city-block over spline curve over straight
        const points = [ start_pos, ...points0.slice(1, -1), end_pos ]
        const line_elem = (rounded != null) ?
            new RoundedLine({ points, radius: rounded, coord, ...line_attr }) :
            curve ?
            new Spline({ points, start_dir, end_dir, curve, coord, ...line_attr }) :
            new Line({ points, coord, ...line_attr })

        // make arrowheads
        const start_elem = arrow_start ? new ArrowHead({ angle: start_ang, pos: start, size: arrow_size, ...start_attr }) : null
        const end_elem = arrow_end ? new ArrowHead({ angle: end_ang, pos: end, size: arrow_size, ...end_attr }) : null

        // pass to Group
        super({ children: [ line_elem, start_elem, end_elem ], coord, ...attr })
        this.args = args
    }
}

//
// exports
//

export { Line, UnitLine, VLine, HLine, CoordLine, Square, Ellipse, Arc, Circle, Dot, Ray, Pointstring, Shape, Triangle, Fill, VFill, HFill, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, RoundedCornerCmd, CubicSplineCmd, Spline, RoundedRect, RoundedLine, ArrowHead, Arrow }
export type { LineArgs, UnitLineArgs, CoordLineArgs, ArcArgs, DotArgs, RayArgs, SplineArgs, RoundedRectArgs, RoundedLineArgs, ArrowHeadArgs, ArrowArgs, CubicSplineCmdArgs, FillArgs }
