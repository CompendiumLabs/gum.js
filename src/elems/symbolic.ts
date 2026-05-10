// symbolic elements

import { THEME } from '../lib/theme'
import { DEFAULTS as D, none, gray } from '../lib/const'
import { zip, linspace, ensure_function, detect_coords, resolve_limits, is_scalar, vector_angle, enumerate, lingrid, check_array } from '../lib/utils'

import { Element, Group, spec_split } from './core'
import { Line, Spline, Shape, Arrow, Dot, Fill } from './geometry'
import { Box } from './layout'

import type { Point, Limit, Rect } from '../lib/types'
import type { ElementArgs, GroupArgs } from './core'
import type { LineArgs, SplineArgs } from './geometry'

//
// utility functions
//

function not_null(arr: number[]): boolean {
    return arr.every(x => x != null && !isNaN(x))
}

// GRAPHABLE ELEMENTS: SymPoints, SymLine, SymShape, SymSpline, SymFill, SymField
// these should take xlim/ylim/coord and give precedence to xlim/ylim over coord
// they should compute their coordinate limits and report them in coord (for Graph)

//
// symbolic data generator
//

interface SymArgsBase {
    xlim?: Limit
    ylim?: Limit
    tlim?: Limit
    xvals?: number[]
    yvals?: number[]
    tvals?: number[]
    N?: number
}

interface SymArgs extends SymArgsBase {
    f?: ((t: number) => Point)
    fx?: ((t: number) => number)
    fy?: ((t: number) => number)
}

// determines actual values given combinations of limits, values, and functions
function sympath({ f, fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N }: SymArgs = {}): [number[], number[], number[]] {
    f = ensure_function(f)
    fx = ensure_function(fx)
    fy = ensure_function(fy)

    // handle underspecified case
    if (
        tlim == null && tvals == null &&
        xlim == null && xvals == null &&
        ylim == null && yvals == null
    ) {
        return [ [], [], [] ]
    }

    // determine data size
    const Ns = new Set(
        [ tvals, xvals, yvals ]
        .filter(v => v != null)
        .map(v => v.length)
    )
    if (Ns.size > 1) {
        throw new Error(`Error: data sizes must be in aggreement but got ${[...Ns]}`)
    } else if (Ns.size == 1) {
        N = [...Ns][0]
    } else {
        N = N ?? D.N
    }

    // generate tvals
    tlim = tlim ?? D.lim
    tvals = tvals ?? linspace(...tlim, N)

    // compute data values
    if (f != null) {
        const points = tvals.map(f)
        xvals = points.map(([x, _y]) => x)
        yvals = points.map(([_x, y]) => y)
    } else if (fx != null && fy != null) {
        xvals = tvals.map(fx)
        yvals = tvals.map(fy)
    } else if (fy != null && xlim != null) {
        xvals ??= linspace(...xlim, N)
        yvals = xvals.map(fy)
    } else if (fx != null && ylim != null) {
        yvals ??= linspace(...ylim, N)
        xvals = yvals.map(fx)
    } else if (yvals != null && xvals == null) {
        xlim ??= D.lim
        xvals = linspace(...xlim, N)
    } else if (xvals != null && yvals == null) {
        ylim ??= D.lim
        yvals = linspace(...ylim, N)
    } else if (xvals == null || yvals == null) {
        throw new Error('Invalid input combination')
    }

    // filter out nan values
    const data = zip(tvals, xvals, yvals).filter(not_null)

    // return dataset
    return zip(...data) as [number[], number[], number[]]
}

//
// sympoints class
//

// a component is a function that returns an element
function ensure_shapefunc(f: any): (...a: any[]) => any {
    const f1 = ensure_function(f)
    return (...a: any[]) => f1(...a)
}

interface SymPointsArgs extends SymArgs, GroupArgs {
    point_shape?: any
    point_size?: number | Point
}

class SymPoints extends Group {
    constructor(args: SymPointsArgs = {}) {
        const { f, fx, fy, point_size = D.point, point_shape: point_shape0, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr0 } = THEME(args, 'SymPoints')
        const [ spec, attr ] = spec_split(attr0)
        const fsize = ensure_function(point_size)
        const fshap = ensure_shapefunc(point_shape0 ?? new Dot(attr))
        const { h: xlim, v: ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute point values
        const [ tvals1, xvals1, yvals1 ] = sympath({
            f, fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // make points
        const points = zip(tvals1, xvals1, yvals1).filter(not_null)

        // make children
        const children = enumerate(points).map(([i, [t, x, y]]) =>
            fshap(x, y, t, i).clone({ pos: [x, y], size: fsize(x, y, t, i) })
        )

        // compute coords
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to element
        super({ children, coord, ...spec })
        this.args = args
    }
}

//
// symline class
//

interface SymLineArgs extends SymArgs, LineArgs {
}

class SymLine extends Line {
    constructor(args: SymLineArgs = {}) {
        const { f, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr } = THEME(args, 'SymLine')
        const { h: xlim, v: ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute path values
        const [ _tvals1, xvals1, yvals1 ] = sympath({
            f, fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const points = zip(xvals1, yvals1).filter(not_null)

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Line
        super({ points, coord, ...attr })
        this.args = args
    }
}

//
// symspline class
//

interface SymSplineArgs extends SymArgs, SplineArgs {
}

class SymSpline extends Spline {
    constructor(args: SymSplineArgs = {}) {
        const { f, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, curve, ...attr } = THEME(args, 'SymSpline')
        const { h: xlim, v: ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute path values
        const [ _tvals1, xvals1, yvals1 ] = sympath({
            f, fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const points = zip(xvals1, yvals1).filter(not_null)

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Spline
        super({ points, coord, curve, ...attr })
        this.args = args
    }
}

//
// symshape class
//

interface SymShapeArgs extends SymArgs, ElementArgs {
}

class SymShape extends Shape {
    constructor(args: SymShapeArgs = {}) {
        const { f, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr } = THEME(args, 'SymShape')
        const { h: xlim, v: ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute point values
        const [ _tvals1, xvals1, yvals1 ] = sympath({
            f, fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const points = zip(xvals1, yvals1).filter(not_null)

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Shape
        super({ points, coord, ...attr })
        this.args = args
    }
}

//
// symfill class
//

interface SymFillArgs extends SymArgsBase, GroupArgs {
    f1?: ((t: number) => Point)
    fx1?: ((t: number) => number)
    fy1?: ((t: number) => number)
    f2?: ((t: number) => Point)
    fx2?: ((t: number) => number)
    fy2?: ((t: number) => number)
}

class SymFill extends Fill {
    constructor(args: SymFillArgs = {}) {
        const { f1, fx1, fy1, f2, fx2, fy2, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, stroke = none, fill = gray, coord: coord0, ...attr } = THEME(args, 'SymFill')
        const { h: xlim, v: ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute point values
        const [ _tvals1, xvals1, yvals1 ] = sympath({
            f: f1, fx: fx1, fy: fy1, xlim, ylim, tlim, xvals, yvals, tvals, N
        })
        const [ _tvals2, xvals2, yvals2 ] = sympath({
            f: f2, fx: fx2, fy: fy2, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const points1 = zip(xvals1, yvals1).filter(not_null)
        const points2 = zip(xvals2, yvals2).filter(not_null)

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Shape
        super({ points1, points2, stroke, fill, coord, ...attr })
        this.args = args
    }
}

//
// symfield class
//

function default_arrow(direc: number | Point): Box {
    const theta = is_scalar(direc) ? direc : vector_angle(direc)
    const arrow = new Arrow({ points: [ [0, 0.5], [1, 0.5] ] })
    return new Box({ children: [ arrow ], spin: theta })
}

interface FieldArgs extends GroupArgs {
    points?: Point[]
    shape?: Element
    size?: number | Point
    arrow_size?: number
}

class Field extends Group {
    constructor(args: FieldArgs = {}) {
        const { points: points0, shape: shape0, size = D.point, arrow_size = 0.5, ...attr0 } = THEME(args, 'Field')
        const [ spec, attr ] = spec_split(attr0)
        const points = check_array(points0)
        const shape = shape0 ?? new Arrow({ points: [ [0, 0.5], [1, 0.5] ], arrow_size })

        // create children
        const children = points.map(([ p, d ]) =>
            shape.clone({ pos: p, size, spin: d, ...attr })
        )

        // pass to Group
        super({ children, ...spec })
        this.args = args
    }
}

interface SymFieldArgs extends SymArgs, GroupArgs {
    func?: (x: number, y: number) => number | Point
    shape?: Element | ((direc: Point) => Element)
}

class SymField extends SymPoints {
    constructor(args: SymFieldArgs = {}) {
        const { func, xlim: xlim0, ylim: ylim0, N = 10, point_size: point_size0, shape: shape0, coord: coord0, ...attr } = THEME(args, 'SymField')
        const { h: xlim, v: ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)
        const shape = ensure_shapefunc(shape0 ?? default_arrow)
        const point_size = point_size0 ?? 0.25 / N

        // check for function
        if (func == null) throw new Error('`func` must be provided')

        // create points and shape function
        const points = (xlim != null && ylim != null) ? lingrid(xlim, ylim, N) : []
        const fshap = (x: number, y: number, _t: number, _i: number) => shape(func(x, y))

        // compute real limits
        const [ xvals, yvals ] = points.length > 0 ? zip(...points) as [number[], number[]] : [ [], [] ]
        const coord = coord0 ?? detect_coords(xvals, yvals, xlim, ylim)

        // pass to SymPoints
        super({ shape: fshap, xvals, yvals, point_size, coord, ...attr })
        this.args = args
    }
}

//
// exports
//

export { SymPoints, SymLine, SymSpline, SymShape, SymFill, Field, SymField }
export type { SymArgsBase, SymArgs, SymPointsArgs, SymLineArgs, SymSplineArgs, SymShapeArgs, SymFillArgs, FieldArgs, SymFieldArgs }
