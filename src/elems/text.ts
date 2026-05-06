// text elements

import type { Attrs, AlignValue, Rect, Limit } from '../lib/types'
import { THEME } from '../lib/theme'
import { none, bold, vtext } from '../lib/const'
import { check_string, is_scalar, is_string, is_boolean, compress_whitespace, rect_box, check_singleton, prefix_split, prefix_join } from '../lib/utils'
import { textMetrics, splitWords } from '../lib/text'
import type { TextMetrics } from '../lib/text'
import { wrapWidths } from '../lib/wrap'

import { Context, Element, Group, spec_split, ensure_children, escape_text } from './core'
import type { ElementArgs, GroupArgs } from './core'
import { Box, HStack, VStack } from './layout'
import type { BoxArgs, StackArgs } from './layout'

//
// span class
//

interface SpanArgs extends ElementArgs {
    children?: string[]
    color?: string
    stroke?: string
    vshift?: number
    font_family?: string
    font_weight?: number
    font_style?: string
}

// no wrapping at all, clobber newlines, mainly internal use
class Span extends Element {
    text: string
    metrics: TextMetrics
    vshift: number

    constructor(args: SpanArgs = {}) {
        const { children: children0, color, vshift = vtext, stroke = none, ...attr0 } = THEME(args, 'Span')
        const text0 = check_string(children0)
        const [ font_attr0, attr ] = prefix_split([ 'font' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // compress whitespace, since that's what SVG does
        const text = compress_whitespace(text0)
        const { advance, vrange, raw_vrange = vrange } = textMetrics(text, font_attr)

        // adjust metrics for vertical shift
        const [ ymin, ymax ] = vrange
        const [ raw_ymin, raw_ymax ] = raw_vrange
        const vrange_shift: Limit = [ ymin + vshift, ymax + vshift ]
        const raw_vrange_shift: Limit = [ raw_ymin + vshift, raw_ymax + vshift ]
        const metrics = { advance, vrange: vrange_shift, raw_vrange: raw_vrange_shift }

        // pass to element
        super({ tag: 'text', unary: false, aspect: advance, fill: color, stroke, ...font_attr, ...attr })
        this.args = args

        // additional props
        this.text = text
        this.metrics = metrics
        this.vshift = vshift
    }

    // because text will always be displayed upright,
    // we need to find the ordered bounds of the text
    // and then offset it by the given offset
    props(ctx: Context): Attrs {
        const attr = super.props(ctx)

        // compute glyph rect without vshift (apply vshift in pixel space)
        const { vrange: [ ymin, ymax ] } = this.metrics
        const vshift = this.vshift
        const glyph_rect: Rect = [ 0, ymin - vshift, 1, ymax - vshift ]
        const rect = ctx.mapRect(glyph_rect)

        // get position and size
        const [ x, y0, _w, h ] = rect_box(rect, true)
        const y = y0 + (1 + vshift) * h

        // get adjusted size
        return { x, y, font_size: `${h}px`, ...attr }
    }

    inner(_ctx: Context): string {
        return escape_text(this.text)
    }
}

interface ElemSpanArgs extends GroupArgs {
    spacing?: boolean | number
}

class ElemSpan extends Group {
    constructor(args: ElemSpanArgs = {}) {
        const { children: children0, spacing: spacing0 = true, ...attr } = args
        const child0 = check_singleton(children0)
        const spacing = is_boolean(spacing0) ? (spacing0 ? 0.25 : 0) : spacing0
        const aspect0 = child0.spec.aspect ?? 1
        const aspect = aspect0 + spacing
        const child = child0.clone({ align: 'left' })
        super({ children: [ child ], aspect, ...attr })
    }
}

//
// text class
//

function ensure_tail(text: string): string {
    return `${text.trimEnd()} `
}

function split_span(child: Span, text: string, font_args: Attrs = {}): Element[] {
    return splitWords(text).map((w: string) =>
        child.clone({ children: [ w ], ...font_args })
    )
}

function compress_spans(children: any[], font_args: Attrs = {}): Element[] {
    return children.flatMap((child: any, i: number) => {
        const first_child = i == 0
        const last_child = i == children.length - 1

        // convert scalars to strings
        if (is_scalar(child)) child = child.toString()

        // process strings into Span's
        // process Text into Span's
        // process Spans into Span's (with args)
        // process Elements into ElemSpan's
        if (is_string(child)) {
            let text = compress_whitespace(child)
            if (first_child) text = text.trimStart()
            if (!last_child) text = ensure_tail(text)
            if (last_child) text = text.trimEnd()
            return splitWords(text).map((w: string) =>
                new Span({ children: [ w ], ...font_args })
            )
        } else if (child instanceof Text) {
            return child.spans.map((s: Element, i: number) => {
                if (!(s instanceof Span)) return s
                let { text } = s
                if (i == 0 && first_child) text = text.trimStart()
                if (i == child.spans.length - 1 && !last_child) text = ensure_tail(text)
                if (i == child.spans.length - 1 && last_child) text = text.trimEnd()
                return split_span(s, text, font_args)
            })
            .flat()
        } else if (child instanceof Span) {
            let { text } = child
            if (first_child) text = text.trimStart()
            if (!last_child) text = ensure_tail(text)
            if (last_child) text = text.trimEnd()
            return split_span(child, text, font_args)
        } else if (child instanceof ElemSpan) {
            return child.clone({ spacing: !last_child })
        } else {
            return [ new ElemSpan({ children: [ child ], spacing: !last_child }) ]
        }
    })
}

function trim_line_end(child: Element): Element | null {
    if (child instanceof Span) {
        const text = child.text.trimEnd()
        return text.length > 0 ? child.clone({ children: [ text ] }) : null
    }
    if (child instanceof ElemSpan) {
        return child.clone({ spacing: false })
    }
    return child
}

function normalize_line(children: Element[]): Element[] {
    for (let i = children.length - 1; i >= 0; i--) {
        const child = trim_line_end(children[i])
        if (child == null) continue
        return [ ...children.slice(0, i), child ]
    }
    return []
}

interface TextLineArgs extends GroupArgs {
    padding?: number
    justify?: AlignValue
    wrap?: number
}

class TextLine extends Group {
    constructor(args: TextLineArgs = {}) {
        const { children: children0, padding, justify = 'left', wrap, debug, ...attr } = THEME(args, 'TextLine')
        const children = ensure_children(children0)
        const line = new HStack({ children, spacing: padding, align: justify, debug })
        super({ children: [ line ], aspect: wrap ?? line.spec.aspect, ...attr })
        this.args = args
    }
}

interface TextArgs extends StackArgs {
    font_family?: string
    font_weight?: number
    font_style?: string
}

// wrap text or elements to multiple lines with fixed line height
class Text extends VStack {
    spans: Element[]

    constructor(args: TextArgs = {}) {
        const { children: children0, wrap, spacing, padding, justify, debug, ...attr0 } = THEME(args, 'Text')
        const children = ensure_children(children0)
    	const [ spec, attr ] = spec_split(attr0)

        // split into words and elements
        const spans = compress_spans(children, attr)

        // wrap text to line widths
        const measure = (span: Element) => span.spec.aspect ?? 1
        const { rows } = wrapWidths(spans, measure, wrap)

        // construct text lines
        const lines = rows.map(row =>
            new TextLine({ children: normalize_line(row), padding, justify, wrap, debug })
        )

        // pass to VStack
        super({ children: lines, spacing, even: true, ...spec })
        this.args = args

        // additional props
        this.spans = spans
    }
}

//
// text container classes
//

interface TextStackArgs extends StackArgs {
    wrap?: number
}

class TextStack extends VStack {
    constructor(args: TextStackArgs = {}) {
        const { children: children0, wrap = null, justify = 'left', ...attr0 } = THEME(args, 'TextStack')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children = ensure_children(children0)

        // apply wrap to children
        const elems = children.map((c: Element) =>
            c.clone({ ...font_attr, ...text_attr, wrap, justify })
        )

        // pass to VStack
        super({ children: elems, ...attr })
        this.args = args
    }
}

interface TextBoxArgs extends BoxArgs {
    justify?: AlignValue
    wrap?: number
}

class TextBox extends Box {
    constructor(args: TextBoxArgs = {}) {
        const { children, padding = 0.1, justify, wrap, ...attr0 } = THEME(args, 'TextBox')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const text = new Text({ children, justify, wrap, ...text_attr, ...font_attr })
        super({ children: [ text ], padding, ...attr })
        this.args = args
    }
}

interface TextFrameArgs extends TextBoxArgs {
    border?: number
    rounded?: number
}

class TextFrame extends TextBox {
    constructor(args: TextFrameArgs = {}) {
        const { border = 1, ...attr } = THEME(args, 'TextFrame')
        super({ border, ...attr })
    }
}

class Bold extends Text {
    constructor(args: TextArgs = {}) {
        const attr = THEME(args, 'Bold')
        super({ font_weight: bold, ...attr })
    }
}

class Italic extends Text {
    constructor(args: TextArgs = {}) {
        const attr = THEME(args, 'Italic')
        super({ font_style: 'italic', ...attr })
    }
}

//
// exports
//

export { Span, ElemSpan, TextLine, Text, TextStack, TextBox, TextFrame, Bold, Italic }
export type { SpanArgs, ElemSpanArgs, TextLineArgs, TextArgs, TextStackArgs, TextBoxArgs, TextFrameArgs }
