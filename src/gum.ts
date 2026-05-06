// gum.js

import './types/opentype.d.ts'
import './types/linebreak.d.ts'
import './types/katex.d.ts'

import { setTheme } from './lib/theme'
import { sans, mono, moji, cmoji, regular, bold, none, black, white, gray, blue, red, green, yellow, purple, lightgray, darkgray, e, pi, phi, r2d, d2r } from './lib/const'
import { is_scalar, is_string, is_boolean, is_object, is_function, is_array, zip, reshape, split, concat, slice, sum, prod, mean, cumsum, norm, range, linspace, enumerate, repeat, meshgrid, lingrid, exp, log, log10, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, minimum, maximum, min, max, clamp, rescale, sigmoid, logit, smoothstep, setSeed, random, uniform, normal, integer, interp, palette, polar, rounder, add2, sub2, mul2, div2, normalize } from './lib/utils'
import { registerFont } from './fonts/fonts'

import { Context, Element, Group, Svg, Rectangle, Spacer, is_element, type ElementArgs } from './elems/core'
import { Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute } from './elems/layout'
import { Line, UnitLine, VLine, HLine, Square, Ellipse, Arc, Circle, Dot, Ray, Shape, Triangle, Fill, VFill, HFill, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, RoundedCornerCmd, CubicSplineCmd, Spline, RoundedRect, RoundedLine, ArrowHead, Arrow } from './elems/geometry'
import { spline1d, spline2d } from './lib/interp'
import { Span, TextLine, Text, TextBox, TextFrame, TextStack, Bold, Italic } from './elems/text'
import { Node, Edge, Network } from './elems/network'
import { SymPoints, SymLine, SymSpline, SymShape, SymFill, Field, SymField } from './elems/symbolic'
import { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend } from './elems/plot'
import { LabelBox, TitleBox, TitleFrame, Slide } from './elems/slide'
import { MathSpan, MathSymbol, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathText, SupSub, Frac, Sqrt, Accent, Bracket, Latex, Tex } from './elems/math'
import { PngImage, SvgImage, calcPngAspect } from './elems/image'
import { parseTable } from './lib/table'

const Rect = Rectangle

type ElementConstructor = new (args: ElementArgs) => Element

const CONST = {
    e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, cmoji, regular, bold,
}

const UTILS = {
    range, linspace, enumerate, repeat, meshgrid, lingrid, zip, reshape, split, concat, slice, sum, prod, mean, cumsum, min, max, minimum, maximum, norm, clamp, rescale, normalize, exp, log, log10, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, sigmoid, logit, smoothstep, polar, rounder, interp, palette, add2, sub2, mul2, div2, spline1d, spline2d,
}

const RAND = {
    setSeed, random, uniform, normal, integer,
}

const ELEMS: Record<string, ElementConstructor> = {
    Element, Group, Svg, Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rectangle, Rect, RoundedRect, RoundedLine, Square, Ellipse, Arc, Circle, Dot, Shape, Path, Spline, Triangle, Fill, VFill, HFill, Arrow, Field, Span, TextLine, Text, TextBox, TextFrame, TextStack, Bold, Italic, LabelBox, TitleBox, TitleFrame, ArrowHead, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, Latex, Tex, MathSpan, MathSymbol, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathText, SupSub, Frac, Sqrt, Accent, Bracket, PngImage, SvgImage
}

const CONTEXT = { ...CONST, ...UTILS, ...RAND, ...ELEMS }

export {
    ELEMS, CONTEXT, Context,
    setTheme, registerFont, calcPngAspect, parseTable,
    is_string, is_boolean, is_array, is_object, is_function, is_element, is_scalar,
    e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, cmoji, regular, bold,
    range, linspace, enumerate, repeat, meshgrid, lingrid, zip, reshape, split, concat, slice, sum, prod, mean, cumsum, min, max, minimum, maximum, norm, clamp, rescale, normalize, exp, log, log10, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, sigmoid, logit, smoothstep, polar, rounder, interp, palette, add2, sub2, mul2, div2, spline1d, spline2d,
    setSeed, random, uniform, normal, integer,
    Element, Group, Svg, Box, Frame, Stack, HWrap, VStack, HStack, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rectangle, Rect, RoundedRect, RoundedLine, Square, Ellipse, Arc, Circle, Dot, Shape, Path, Spline, Triangle, Fill, Arrow, Field, Span, TextLine, Text, TextBox, TextFrame, TextStack, Bold, Italic, LabelBox, TitleBox, TitleFrame, ArrowHead, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, Latex, MathSpan, MathSymbol, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathText, SupSub, Frac, Sqrt, Accent, Bracket, PngImage, SvgImage,
    Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, RoundedCornerCmd, CubicSplineCmd,
}

export type { ElementConstructor }
export type { ThemeName } from './lib/theme'
export type { SplineFuncArgs } from './lib/interp'
export type { PngImageArgs, SvgImageArgs } from './elems/image'

export type * from './lib/types'
