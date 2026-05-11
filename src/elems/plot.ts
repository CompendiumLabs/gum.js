// plot elements

import { THEME } from '../lib/theme'
import { DEFAULTS as D, none, blue, white } from '../lib/const'
import { sign, abs, linspace, invert_orient, join_limits, split_limits, ensure_vector, is_scalar, is_string, is_object, ensure_singleton, check_singleton, rounder, enumerate, aspect_invariant, rect_aspect, merge_rects, expand_limits, flip_rect, resolve_limits, smoothstep, prefix_split, prefix_join } from '../lib/utils'
import { Span } from './text'

import { Element, Group, Spacer, spec_split, is_element, ensure_children } from './core'
import { Box, Frame, Attach, HStack, VStack, Anchor } from './layout'
import { RoundedRect, UnitLine, HLine, Arc } from './geometry'

import type { Point, Rect, Limit, Attrs, Orient, Rounded, Zone, AlignValue, Side } from '../lib/types'
import type { ElementArgs, GroupArgs } from './core'
import type { BoxArgs } from './layout'
import type { RoundedRectArgs } from './geometry'

//
// bar components
//

interface BarArgs extends RoundedRectArgs {
    direc?: Orient
    fill?: string
    stroke?: string
    label?: string
    loc?: number
    value?: number
}

class Bar extends RoundedRect {
    constructor(args: BarArgs = {}) {
        const { direc = 'v', fill = blue, stroke = none, rounded: rounded0 = true, ...attr } = THEME(args, 'Bar')
        const rounded1: Rounded = direc == 'v' ? [ 0.1, 0.1, 0, 0 ] : [ 0, 0.1, 0.1, 0 ]
        const rounded = rounded0 == true ? rounded1 : rounded0 == false ? 0 : rounded0
        super({ fill, stroke, rounded, ...attr })
        this.args = args
    }
}

class VBar extends Bar {
    constructor(args: BarArgs = {}) {
        const { ...attr } = THEME(args, 'VBar')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HBar extends Bar {
    constructor(args: BarArgs = {}) {
        const { ...attr } = THEME(args, 'HBar')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

interface BarsArgs extends GroupArgs {
    data?: any[]
    direc?: Orient
    width?: number
    zero?: number
}

class Bars extends Group {
    constructor(args: BarsArgs = {}) {
        const { children: children0, data, direc = 'v', width = 0.75, zero = 0, ...attr0 } = THEME(args, 'Bars')
        const [ spec, attr ] = spec_split(attr0)
        const children = ensure_children(children0)
        const idirec = invert_orient(direc)

        // handle data array case
        const bars = data != null ?
          data.map((value: any) => new Bar({ direc, value, ...attr })) :
          children

        // make rects from sizes
        const items = bars.map((child: any, i: number) => {
            const { loc = i, value } = child.attr
            const rect = join_limits({
                [direc]: [ zero, value ],
                [idirec]: [ loc - width / 2, loc + width / 2 ],
            })
            return child.clone({ direc, rect, label: undefined, value: undefined, ...attr })
        })

        // pass to Group
        super({ children: items, coord: 'auto', ...spec })
        this.args = args
    }
}

class VBars extends Bars {
    constructor(args: BarsArgs = {}) {
        const { ...attr } = THEME(args, 'VBars')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HBars extends Bars {
    constructor(args: BarsArgs = {}) {
        const { ...attr } = THEME(args, 'HBars')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

//
// axis/tick/label elements
//

function auto_array<T>(vals: number | T[] = 0, lim: Limit): (number | T)[] {
    return is_scalar(vals) ? linspace(...lim, vals) : vals
}

interface ScaleArgs extends GroupArgs {
    locs?: number | number[]
    direc?: Orient
    span?: Limit
}

class Scale extends Group {
    constructor(args: ScaleArgs = {}) {
        const { children: children0, locs, direc = 'h', span = D.lim, ...attr0 } = THEME(args, 'Scale')
        const [ spec, tick_attr ] = spec_split(attr0)
        const tick_dir = invert_orient(direc)

        // make tick placeholders
        const ticks0 = children0 != null ? ensure_children(children0) :
          auto_array(locs, span).map((t: number) =>
            new UnitLine({ direc: tick_dir, tick_loc: t, tick_span: span })
          )

        // arrange tick lines
        const ticks = ticks0.map((t: Element) => {
            const { tick_loc, tick_span } = t.args
            const rect = join_limits({ [direc]: [tick_loc, tick_loc], [tick_dir]: tick_span })
            return t.clone({ rect, expand: true, tick_loc: undefined, tick_span: undefined, ...tick_attr })
        })

        // set coordinate system
        super({ children: ticks, ...spec })
        this.args = args
    }
}

class VScale extends Scale {
    constructor(args: ScaleArgs = {}) {
        const { ...attr } = THEME(args, 'VScale')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HScale extends Scale {
    constructor(args: ScaleArgs = {}) {
        const { ...attr } = THEME(args, 'HScale')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

function calcLabelJustify(direc: Orient, rot0: number): number {
    const rot = rot0 ?? 0
    const t = (direc == 'h') ?
        -sign(rot) * smoothstep(     abs(rot), [ 0, 45 ]) :
                     smoothstep(90 - abs(rot), [ 0, 45 ])
    return 0.5 * (1 + t)
}

interface LabelArgs extends GroupArgs {
    loc?: number
    tick?: Element
    direc?: Orient
    justify?: AlignValue
}

class Label extends Anchor {
    loc?: number

    constructor(args: LabelArgs = {}) {
        const { children: children0, loc, tick, direc = 'h', spin = 0, justify: justify0, ...attr } = THEME(args, 'Label')
        const child = ensure_singleton(children0)
        const elem = is_element(child) ? child : new Span({ children: [ child ?? '' ] })
        const justify = justify0 ?? calcLabelJustify(direc, spin)
        super({ children: [ elem ], spin, justify, aspect: 1, ...attr })
        this.args = args
        this.loc = loc
    }
}

class HLabel extends Label {
    constructor(args: LabelArgs = {}) {
        const attr = THEME(args, 'HLabel')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VLabel extends Label {
    constructor(args: LabelArgs = {}) {
        const attr = THEME(args, 'VLabel')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

interface LabelsArgs extends GroupArgs {
    direc?: Orient
}

// label elements must have an aspect to properly size them
class Labels extends Group {
    constructor(args: LabelsArgs = {}) {
        const { children: children0, direc = 'h', ...attr0 } = THEME(args, 'Labels')
        const [ spec, label_attr ] = spec_split(attr0)
        const children = ensure_children(children0)

        // place tick boxes using expanded lines
        const items = children.map((c: Element) => {
            const loc = c.args.loc
            const rect = join_limits({ [direc]: [ loc, loc ] })
            return c.clone({ rect, expand: true, ...label_attr })
        })

        // pass to Group
        super({ children: items, ...spec })
        this.args = args
    }
}

class HLabels extends Labels {
    constructor(args: LabelsArgs = {}) {
        const { ...attr } = THEME(args, 'HLabels')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VLabels extends Labels {
    constructor(args: LabelsArgs = {}) {
        const { ...attr } = THEME(args, 'VLabels')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

function get_tick_lim(lim: string | Limit): Limit {
    if (lim == 'inner') {
        return [0.5, 1]
    } else if (lim == 'outer') {
        return [0, 0.5]
    } else if (lim == 'both') {
        return [0, 1]
    } else if (lim == 'none') {
        return [0, 0]
    } else {
        return lim as Limit
    }
}

function get_tick_span(size: number = 1, side: Zone): Limit {
    if (side == 'inner') {
        return [ 0, size ]
    } else if (side == 'outer') {
        return [ 1 - size, 1 ]
    } else if (side == 'both') {
        return [ 0.5 - size / 2, 0.5 + size / 2 ]
    } else {
        throw new Error(`Invalid tick side: ${side}`)
    }
}

function ensure_ticklabel(label: Element | Label | number | [number, string], args: Attrs = {}): Label {
    const { direc = 'h', prec = D.prec, ...attr } = args

    // handle element cases
    if (label instanceof Label) return label.clone(attr) as Label
    if (is_element(label)) return new Label({ children: [ label ], direc, loc: label.args.loc, ...attr })

    // handle scalar case
    const [ spec, attr1 ] = spec_split(attr)
    const [ loc, str ] = is_scalar(label) ? [ label, label ] : label
    const child = new Span({ children: [ rounder(str, prec) ], ...attr1 })
    return new Label({ children: [ child ], direc, loc, ...spec })
}

type TickArgs = Label | number | [number, string]

interface AxisArgs extends GroupArgs {
    lim?: Limit
    direc?: Orient
    ticks?: number | TickArgs[]
    tick_side?: Zone
    label_side?: Zone
    label_size?: number
    label_offset?: number
    label_justify?: AlignValue
    label_loc?: number
    discrete?: boolean
    prec?: number
    debug?: boolean
}

// this is designed to be plotted directly
// this takes a nested coord approach, not entirely sure about that
class Axis extends Group {
    locs: number[]

    constructor(args: AxisArgs = {}) {
        const { children, lim = D.lim, direc = 'h', ticks: ticks0, tick_side = 'inner', label_side = 'outer', label_size = 1.5, label_offset = 0, label_justify: label_justify0, label_loc, discrete = false, prec = D.prec, debug, ...attr0 } = THEME(args, 'Axis')
        const [ label_attr, tick_attr, line_attr, attr ] = prefix_split([ 'label', 'tick', 'line' ], attr0)
        const tick_lim = get_tick_lim(tick_side)
        const [ tick_lo, tick_hi ] = tick_lim

        // get tick and label limits
        const label_justify = label_justify0 ?? ((direc == 'v') ? (label_side == 'outer' ? 'right' : 'left') : undefined)
        const label_base = (label_side == 'inner') ? (tick_hi + label_offset) : (tick_lo - label_offset - label_size)
        const label_lim: Limit = [ label_base, label_base + label_size ]

        // set up one-sides coordinate system
        const idirec = invert_orient(direc)
        const coord = join_limits({ [direc]: lim })
        const scale_rect = join_limits({ [idirec]: tick_lim })
        const label_rect = join_limits({ [idirec]: label_lim })

        // extract tick information
        const label_attr1 = { direc, prec, ...label_attr }
        const label_elems = children != null ?
          ensure_children(children).map((c: Element) => c.clone({ ...label_attr1 })) :
          auto_array(ticks0, lim).map((t: TickArgs) => ensure_ticklabel(t, label_attr1))

        // extract tick elements from labels
        const tick_elems = label_elems.map((l: Element) => {
            const tick = l.args.tick ?? new UnitLine({ direc: idirec })
            const span = get_tick_span(l.args.tick_size, tick_side)
            return tick.clone({ tick_loc: l.args.loc, tick_span: span })
        })

        // accumulate children
        const cline = new UnitLine({ direc, lim, coord, ...line_attr })
        const scale = new Scale({ children: tick_elems, direc, rect: scale_rect, coord, debug, ...tick_attr })
        const label = new Labels({ children: label_elems, direc, justify: label_justify, loc: label_loc, rect: label_rect, coord, debug })

        // pass to Group
        super({ children: [ cline, scale, label ], debug, ...attr })
        this.args = args

        // additional props (for Plot grids)
        this.locs = label_elems.map((c: Element) => c.args.loc)
    }
}

class HAxis extends Axis {
    constructor(args: AxisArgs = {}) {
        const { ...attr } = THEME(args, 'HAxis')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VAxis extends Axis {
    constructor(args: AxisArgs = {}) {
        const { ...attr } = THEME(args, 'VAxis')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

interface OuterLabelArgs extends ElementArgs {
    children?: (Element | string)[]
    extent?: number
    offset?: number
    side?: Side
}

class OuterLabel extends Attach {
    constructor(args: OuterLabelArgs = {}) {
        const { children: children0, side = 'top', extent = 0.1, offset, loc, justify, ...attr0 } = args
        const text = check_singleton(children0)
        const [ spec, attr ] = spec_split(attr0)
        const label0 = is_element(text) ? text : new Span({ children: [ text ], ...attr })
        const label = (side == 'left' || side == 'right') ? label0.clone({ rotate: -90 }) : label0
        super({ children: [ label ], side, extent, offset, loc, justify, ...spec })
        this.args = args
    }
}

//
// decorator classes
//

interface MeshArgs extends ScaleArgs {
    lim?: Limit
}

interface Mesh2DArgs extends GroupArgs {
    locs?: number | number[]
    xlocs?: number | number[]
    ylocs?: number | number[]
    xlim?: Limit
    ylim?: Limit
    xspan?: Limit
    yspan?: Limit
}

interface LegendArgs extends ElementArgs {
    lines?: any
    vspacing?: number
    hspacing?: number
    rounded?: number
    padding?: number
    fill?: string
    justify?: AlignValue
    debug?: boolean
}

class Mesh extends Scale {
    constructor(args: MeshArgs = {}) {
        const { children: children0, locs: locs0 = 10, direc = 'h', xlim, ylim, coord, ...attr } = THEME(args, 'Mesh')
        const { [direc]: lim, [invert_orient(direc)]: span } = resolve_limits(xlim, ylim, coord as Rect)
        const locs = auto_array(locs0, lim ?? D.lim)
        super({ locs, direc, span, xlim, ylim, coord, ...attr })
        this.args = args
    }
}

class HMesh extends Mesh {
    constructor(args: MeshArgs = {}) {
        const { ...attr } = THEME(args, 'HMesh')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VMesh extends Mesh {
    constructor(args: MeshArgs = {}) {
        const { ...attr } = THEME(args, 'VMesh')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class Mesh2D extends Group {
    constructor(args: Mesh2DArgs = {}) {
        let { children: children0, locs, xlocs, ylocs, direc = 'h', xlim, ylim, coord, ...attr } = THEME(args, 'Mesh2D')
        const hmesh = new HMesh({ locs: xlocs ?? locs, xlim, ylim, coord })
        const vmesh = new VMesh({ locs: ylocs ?? locs, xlim, ylim, coord })
        super({ children: [ hmesh, vmesh ], ...attr })
        this.args = args
    }
}

function ensure_legendbadge(c: any, attr: Attrs = {}): Element {
    if (is_element(c)) return c
    if (is_string(c)) {
        attr = { stroke: c, ...attr }
    } else if (is_object(c)) {
        attr = { ...c, ...attr }
    } else {
        throw new Error(`Unrecognized legend badge specification: ${c}`)
    }
    return new HLine({ aspect: 1, ...attr })
}

function ensure_legendlabel(label: any, attr: Attrs = {}): Element {
    if (is_element(label)) return label
    if (is_string(label)) {
        return new Span({ children: [ label ], ...attr })
    } else {
        throw new Error(`Unrecognized legend label specification: ${label}`)
    }
}

// TODO: have a .badge/.label api for plottable elements
class Legend extends Frame {
    constructor(args: LegendArgs = {}) {
        const { children, lines, vspacing = 0.1, hspacing = 0.25, rounded = 0.025, padding = 0.05, fill = white, justify = 'left', debug, ...attr0 } = THEME(args, 'Legend')
        const [ badge_attr, text_attr, attr ] = prefix_split([ 'badge', 'text' ], attr0)

        // construct legend badges and labels
        const badges = children.map((b: any) => ensure_legendbadge(b, badge_attr))

        // construct legend grid
        const rows = badges.map((b: any) => {
            const { label } = b.attr
            const { aspect } = b.spec
            const b1 = b.clone({ aspect: aspect ?? 1, label: null })
            const spacer = new Spacer({ aspect: hspacing })
            const text = ensure_legendlabel(label, text_attr)
            return new HStack({ children: [ b1, spacer, text ], debug })
        })
        const vs = new VStack({ children: rows, spacing: vspacing, justify, even: true })

        // pass to Frame
        super({ children: [ vs ], rounded, padding, fill, ...attr })
        this.args = args
    }
}

//
// graph class
//

interface GraphArgs extends GroupArgs {
    xlim?: Limit
    ylim?: Limit
    padding?: number
    flip?: boolean
}

// find minimal containing limits
function outer_limits(children: Element[], { xlim, ylim, padding = 0 }: { xlim?: Limit, ylim?: Limit, padding?: number } = {}): Rect | undefined {
    if (children.length == 0) return

    // pull in child coordinate system
    const coord = merge_rects(children.map((c: Element) => c.graphCoord()))
    const { h: xlim0, v: ylim0 } = resolve_limits(xlim, ylim, coord)

    // expand with padding
    const [ xpad, ypad ] = ensure_vector(padding, 2)
    xlim = expand_limits(xlim0 ?? D.lim, xpad)
    ylim = expand_limits(ylim0 ?? D.lim, ypad)

    // return coordinate system
    return join_limits({ h: xlim, v: ylim })
}

// plottable things should accept xlim/ylim and may report coords on their own
class Graph extends Group {
    constructor(args: GraphArgs = {}) {
        let { children: children0, xlim, ylim, coord: coord0 = 'auto', aspect, padding = 0, flip = true, ...attr } = THEME(args, 'Graph')
        const children = ensure_children(children0)

        // get default outer limits
        let coord = coord0 == 'auto' ? outer_limits(children, { xlim, ylim, padding }) : coord0
        aspect = aspect == 'auto' ? rect_aspect(coord) : aspect

        // flip coordinate system if requested
        if (flip) coord = flip_rect(coord, true)

        // map coordinate system to all elements
        const items = children.map((e: any) => {
            if (e.spec.rect != null) {
                const child = e instanceof Arc && flip ? e.clone({ upright: false }) : e
                return new Group({ children: [ child ], coord })
            } else {
                return e.clone({ coord })
            }
        })

        // pass to Group
        super({ children: items, aspect, ...attr })
        this.args = args
    }
}

//
// plot class
//

interface PlotArgs extends BoxArgs {
    xlim?: Limit
    ylim?: Limit
    axis?: true
    xaxis?: boolean | HAxis
    yaxis?: boolean | VAxis
    xticks?: number | any[]
    yticks?: number | any[]
    xanchor?: number
    yanchor?: number
    grid?: boolean | number[]
    xgrid?: boolean | number[]
    ygrid?: boolean | number[]
    xlabel?: string | Element
    ylabel?: string | Element
    title?: string | Element
    tick_size?: number
    label_size?: number
    label_offset?: number | Point
    title_size?: number
    title_offset?: number
    xlabel_size?: number
    ylabel_size?: number
    xlabel_offset?: number
    ylabel_offset?: number
    xtick_size?: number
    ytick_size?: number
    margin?: number
    padding?: number
    debug?: boolean
}

class Plot extends Box {
    constructor(args: PlotArgs = {}) {
        let {
            children: children0, xlim, ylim, axis = true, xaxis, yaxis, xticks = 5, yticks = 5, xanchor, yanchor, grid, xgrid, ygrid, xlabel, ylabel, title, tick_size = 0.015, label_size = 0.05, label_offset = 0.125, title_size = 0.075, title_offset = 0.05, xlabel_size, ylabel_size, xlabel_offset, ylabel_offset, xtick_label_offset = 0.75, ytick_label_offset = 0.25, xtick_size, ytick_size, padding, margin, coord: coord0 = 'auto', aspect: aspect0 = 'auto', clip, debug = false, ...attr0
        } = THEME(args, 'Plot')
        const children = ensure_children(children0)

        // determine coordinate system and aspect
        const coord = coord0 == 'auto' ? outer_limits(children, { xlim, ylim, padding }) : coord0
        const [ xmin, ymin, xmax, ymax ] = coord ?? D.coord
        xlim = [ xmin, xmax ]
        ylim = [ ymin, ymax ]

        // determine aspect and tick/size/offset
        const aspect = aspect0 == 'auto' ? rect_aspect(coord) : aspect0
        const [ xtick_size0, ytick_size0 ] = aspect_invariant(tick_size, aspect)
        const [ xlabel_size0, ylabel_size0 ] = aspect_invariant(label_size, aspect)
        const [ xlabel_offset0, ylabel_offset0 ] = aspect_invariant(label_offset, aspect)

        // default anchor points
        xanchor ??= ymin
        yanchor ??= xmin

        // default boolean values
        xaxis ??= axis
        yaxis ??= axis
        xgrid ??= grid
        ygrid ??= grid

        // set aspect aware default values
        xtick_size ??= xtick_size0
        ytick_size ??= ytick_size0
        xlabel_size ??= xlabel_size0
        ylabel_size ??= ylabel_size0
        xlabel_offset ??= xlabel_offset0
        ylabel_offset ??= ylabel_offset0

        // some advanced piping
        let [
            xaxis_attr, yaxis_attr, axis_attr, xtick_label_attr, xtick_attr, ytick_label_attr, ytick_attr, tick_label_attr, tick_attr, xgrid_attr, ygrid_attr, grid_attr, xlabel_attr, ylabel_attr, label_attr, title_attr, attr
        ] = prefix_split([
            'xaxis', 'yaxis', 'axis', 'xtick_label', 'xtick', 'ytick_label', 'ytick', 'tick_label', 'tick', 'xgrid', 'ygrid', 'grid', 'xlabel', 'ylabel', 'label', 'title'
        ], attr0)
        xtick_attr = { ...xtick_attr, ...tick_attr }
        ytick_attr = { ...ytick_attr, ...tick_attr }
        xtick_label_attr = { offset: xtick_label_offset, ...xtick_label_attr, ...tick_label_attr }
        ytick_label_attr = { offset: ytick_label_offset, ...ytick_label_attr, ...tick_label_attr }
        xaxis_attr = { ...axis_attr, ...xaxis_attr, ...prefix_join('tick', xtick_attr), ...prefix_join('label', xtick_label_attr) }
        yaxis_attr = { ...axis_attr, ...yaxis_attr, ...prefix_join('tick', ytick_attr), ...prefix_join('label', ytick_label_attr) }
        xgrid_attr = { ...grid_attr, ...xgrid_attr }
        ygrid_attr = { ...grid_attr, ...ygrid_attr }
        xlabel_attr = { ...label_attr, ...xlabel_attr }
        ylabel_attr = { ...label_attr, ...ylabel_attr }

        // collect axis elements
        const bg_elems: Element[] = []
        const fg_elems: Element[] = []

        // default xaxis generation
        if (xaxis === true) xaxis = new HAxis({ ticks: xticks, lim: xlim })
        if (xaxis != null && xaxis !== false) {
            const xtick_size1 = xtick_size * (ymax - ymin)
            const xaxis_ylim = [ xanchor - xtick_size1, xanchor + xtick_size1 ]
            xaxis = xaxis.clone({ xrect: xlim, yrect: xaxis_ylim, ...xaxis_attr }) as HAxis
            fg_elems.push(xaxis)
        }

        // default yaxis generation
        if (yaxis === true) yaxis = new VAxis({ ticks: yticks, lim: ylim })
        if (yaxis != null && yaxis !== false) {
            const ytick_size1 = ytick_size * (xmax - xmin)
            const yaxis_xlim = [ yanchor - ytick_size1, yanchor + ytick_size1 ]
            yaxis = yaxis.clone({ xrect: yaxis_xlim, yrect: ylim, ...yaxis_attr }) as VAxis
            fg_elems.push(yaxis)
        }

        // automatic xgrid generation
        if (xgrid != null && xgrid !== false) {
            const locs = (xgrid === true && xaxis != null && xaxis !== false) ? xaxis.locs : xgrid
            const xgrid_elem = new HMesh({ locs: locs as number[], ...xgrid_attr })
            bg_elems.unshift(xgrid_elem)
        } else {
            xgrid = undefined
        }

        // automatic ygrid generation
        if (ygrid != null && ygrid !== false) {
            const locs = (ygrid === true && yaxis != null && yaxis !== false) ? yaxis.locs : ygrid
            const ygrid_elem = new VMesh({ locs: locs as number[], ...ygrid_attr })
            bg_elems.unshift(ygrid_elem)
        } else {
            ygrid = undefined
        }

        // create graph from core elements
        const bg_graph = new Graph({ children: bg_elems, coord, aspect: undefined })
        const fg_graph = new Graph({ children: fg_elems, coord, aspect: undefined })
        const el_graph = new Graph({ children, coord, aspect: undefined, clip, debug })
        const items: Element[] = [ bg_graph, el_graph, fg_graph ]

        // optional xaxis label
        if (xlabel != null) {
            xlabel = new OuterLabel({ children: [ xlabel ], side: 'bottom', debug, extent: xlabel_size, offset: xlabel_offset, ...xlabel_attr })
            items.push(xlabel)
        }

        // optional yaxis label
        if (ylabel != null) {
            const ylabel_text = is_element(ylabel) ? ylabel : new Span({ children: [ ylabel ], rotate: -90 })
            ylabel = new OuterLabel({ children: [ ylabel_text ], side: 'left', extent: ylabel_size, offset: ylabel_offset, debug, ...ylabel_attr })
            items.push(ylabel)
        }

        // optional plot title
        if (title != null) {
            title = new OuterLabel({ children: [ title ], side: 'top', extent: title_size, offset: title_offset, debug, ...title_attr })
            items.push(title)
        }

        // pass to Box
        const inner = new Group({ children: items, aspect })
        super({ children: [ inner ], margin, ...attr })
        this.args = args
    }
}

//
// bar plot class
//

interface BarPlotArgs extends PlotArgs {
    direc?: Orient
    data?: any[]
    xtick_side?: string
}

class BarPlot extends Plot {
    constructor(args: BarPlotArgs = {}) {
        const { children: children0, direc = 'v', data, aspect = 2, xtick_side = 'outer', ...attr0 } = THEME(args, 'BarPlot')
        const [ bar_attr, attr ] = prefix_split([ 'bar' ], attr0)
        const children = ensure_children(children0)

        // handle data array case
        const sibs = data != null ? data.map((child: any) => {
            const [ label, value ] = ensure_vector(child, 2)
            return new Bar({ label, value })
        }) : children

        // separate out bars and not-bars
        const yes_bars = sibs.filter((child: any) => child instanceof Bar)
        const not_bars = sibs.filter((child: any) => !(child instanceof Bar))

        // extract labels and create bars
        const labs = yes_bars.map((child: any) => child.attr.label)
        const bars = new Bars({ children: yes_bars, direc, ...bar_attr })

        // determine axis ticks
        const tickdir = direc === 'v' ? 'x' : 'y'
        const [ tname, ticks ] = [ `${tickdir}ticks`, enumerate(labs) ]
        const [ lname, limit ] = [ `${tickdir}lim`, [ -0.75, yes_bars.length - 0.25 ] ]

        // pass on to Plot
        super({ children: [ bars, ...not_bars ], [tname]: ticks, [lname]: limit, aspect, xtick_side, ...attr })
        this.args = args
    }
}

//
// exports
//

export { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Legend, Graph, Plot, BarPlot }
export type { BarArgs, BarsArgs, ScaleArgs, LabelsArgs, AxisArgs, OuterLabelArgs, MeshArgs, Mesh2DArgs, LegendArgs, GraphArgs, PlotArgs, BarPlotArgs }
