// interpolation functions

import { range, clamp, abs, binary_search, squeeze_mpoint, sub2m, add2, sub2, mul2, div2 } from './utils'

import type { Point, Grad, MPoint } from './types'

//
// spline data types
//

interface SplineData<T extends Point | MPoint = Point | MPoint> {
    pos1: T
    pos2: T
    tan1: Point
    tan2: Point
    dir1?: Grad
    dir2?: Grad
    curve?: number
}

interface SplineFuncArgs {
    start_dir?: Grad
    end_dir?: Grad
    curve?: number
    closed?: boolean
    t?: number[]
}

//
// 2d spline helpers
//

function cubic_spline_data<T extends Point | MPoint>(points: T[], { start_dir, end_dir, curve, closed = false }: SplineFuncArgs = {}): SplineData<T>[] {
    const n = points.length
    const tans = range(n).map(i => {
        const i1 = (closed && i == 0    ) ? n - 1 : Math.max(0    , i - 1)
        const i2 = (closed && i == n - 1) ? 0     : Math.min(n - 1, i + 1)
        return squeeze_mpoint(sub2m(points[i2], points[i1]))
    })

    const num = Math.max(0, closed ? n : n - 1)
    return range(num).map(i => {
        const ip = (closed && i == num - 1) ? 0 : i + 1
        return {
            pos1: points[i],
            pos2: points[ip],
            tan1: tans[i],
            tan2: tans[ip],
            dir1: (!closed && i == 0) ? start_dir : undefined,
            dir2: (!closed && i == num - 1) ? end_dir : undefined,
            curve,
        }
    })
}

function cubic_spline_tangent(pos1: Point | MPoint, pos2: Point | MPoint, dir: Grad | undefined, tan: Point): Point {
    if (dir == null) return tan
    const delta = squeeze_mpoint(sub2m(pos2, pos1)).map(abs)
    const scale = Math.max(...delta)
    return mul2(dir, scale)
}

function cubic_spline_points({ pos1, pos2, dir1, dir2, tan1, tan2, curve = 0.5 }: SplineData<Point>): [Point, Point, Point, Point] {

    // use dir if provided, otherwise use tan
    const tan1a = cubic_spline_tangent(pos1, pos2, dir1, tan1)
    const tan2a = cubic_spline_tangent(pos1, pos2, dir2, tan2)
    if (tan1a == null || tan2a == null) throw new Error('Spline tangent must be defined')

    // compute scaled tangents and Bernstein controls in spline coordinates
    const stan1 = div2(mul2(tan1a, curve), 3) as Point
    const stan2 = div2(mul2(tan2a, curve), 3) as Point
    const con1 = add2(pos1, stan1) as Point
    const con2 = sub2(pos2, stan2) as Point

    return [ pos1, con1, con2, pos2 ]
}

function mix_point(p1: Point, p2: Point, t: number): Point {
    return add2(mul2(p1, 1 - t), mul2(p2, t)) as Point
}

function cubic_bezier_point(points: [Point, Point, Point, Point], t: number): Point {
    const [ p0, p1, p2, p3 ] = points
    const q0 = mix_point(p0, p1, t)
    const q1 = mix_point(p1, p2, t)
    const q2 = mix_point(p2, p3, t)
    const r0 = mix_point(q0, q1, t)
    const r1 = mix_point(q1, q2, t)
    return mix_point(r0, r1, t)
}

//
// 2d spline function
//

function spline2d(points: Point[], args: SplineFuncArgs = {}): (t: number) => Point {
    const n = points.length

    // ensure enough data points
    if (n < 2) {
        throw new Error('Spline must have at least two points')
    }

    const splines = cubic_spline_data(points, args)
        .map(spline => cubic_spline_points(spline))
    const num = splines.length
    const tv = args.t ?? null

    return (t: number) => {
        const t1 = clamp(t, [ 0, 1 ])
        let i: number, u: number
        if (tv != null) {
            i = binary_search(tv, t1)
            const dt = tv[i + 1] - tv[i]
            u = dt > 0 ? (t1 - tv[i]) / dt : 0
        } else {
            [i, u] = (t1 >= 1) ?
                [ num - 1, 1 ] :
                [ Math.floor(t1 * num), t1 * num % 1 ]
        }
        return cubic_bezier_point(splines[i], u)
    }
}

//
// 1d spline function
//

function spline1d(points: Point[], { curve = 0.5 }: { curve?: number } = {}): (t: number) => number {
    const n = points.length
    if (n < 2) {
        throw new Error('Spline must have at least two points')
    }
    const x = points.map(p => p[0])
    const y = points.map(p => p[1])

    // catmull-rom tangents (central differences, forward/backward at endpoints)
    const tans = range(n).map(i => {
        const i1 = Math.max(0, i - 1)
        const i2 = Math.min(n - 1, i + 1)
        return (y[i2] - y[i1]) / (x[i2] - x[i1])
    })

    // cubic hermite segments as bezier control points
    const h = range(n - 1).map(i => x[i + 1] - x[i])
    const segs = range(n - 1).map(i => {
        const p0 = y[i]
        const p3 = y[i + 1]
        const p1 = p0 + tans[i] * h[i] * curve / 3
        const p2 = p3 - tans[i + 1] * h[i] * curve / 3
        return [p0, p1, p2, p3]
    })

    return (t: number) => {
        const tc = clamp(t, [x[0], x[n - 1]])
        const lo = binary_search(x, tc)

        // evaluate cubic bezier (de casteljau)
        const u = h[lo] > 0 ? (tc - x[lo]) / h[lo] : 0
        const [p0, p1, p2, p3] = segs[lo]
        const q0 = p0 + (p1 - p0) * u
        const q1 = p1 + (p2 - p1) * u
        const q2 = p2 + (p3 - p2) * u
        const r0 = q0 + (q1 - q0) * u
        const r1 = q1 + (q2 - q1) * u
        return r0 + (r1 - r0) * u
    }
}

//
// export
//

export { cubic_spline_data, cubic_spline_points, cubic_spline_tangent, spline1d, spline2d }
export type { SplineData, SplineFuncArgs }
