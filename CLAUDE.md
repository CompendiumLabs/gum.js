# `gum.jsx` Framework

`gum.jsx` is a language for creating visualizations using a React-like JSX dialect that evaluates into SVG. It's designed for creating general graphics, plots, graphs, and network diagrams. The language supports declarative component-based rendering with automatic layout and coordinate system mapping.

## Commands

### Running the CLI

To test the output of a particular `gum.jsx` snippet or file, you can pipe it to the `gum` command. If you have vision capabilities, this can be useful for see the actual output of the code, either in SVG or PNG format.

```bash
# Generate SVG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum -f svg

# Generate SVG from a gum.jsx snippet and save to file
echo '<Rectangle rounded fill={blue} />' | bun run cli -o test.svg

# Generate PNG from a gum.jsx snippet and save to file
echo '<Rectangle rounded fill={blue} />' | bun run cli -o test.png

# Generate SVG from a .jsx file and save to file
gum test.jsx -o test.svg

# Generate PNG from a .jsx file and save to file
gum test.jsx -o test.png

# Run options:
# file: gum.jsx file to render (reads from stdin if not provided)
# -s, --size <size>        size of the svg (default: 1000)
# -w, --width <width>      width of the png (default: null)
# -h, --height <height>    height of the png (default: null)
# -f, --format <format>    format: svg, png, kitty (default: kitty or inferred)
# -t, --theme <theme>      theme to use (default: light)
# -b, --background <color> background color (default: white)
# -o, --output <output>    output file (default: null)
```

### Testing

Run type checking:

```bash
bun tsc --noEmit
```

Test examples are in `docs/code/` and `docs/gala/`. Run the full test suite:
```bash
bun scripts/test.ts
```

Or test a single file:
```bash
gum docs/code/box.jsx -o test.svg
```

## Architecture

### Component System

The library is built around a class hierarchy split across element modules:

**Element** (`src/elems/core.ts`) - Base class for all components
- Stores `args` (constructor arguments) as a dictionary for easy cloning
- Has a `spec` object containing layout parameters (rect, coord, aspect, aspect0, expand, align, upright, offset, rotate, rotate_adjust, rotate_invar)
- Has an `attr` object containing SVG attributes (stroke, fill, etc.)
- Renders to SVG via the `svg(ctx)` method that takes a Context object

**Group extends Element** (`src/elems/core.ts`) - Container base class
- Has a `children` array of Elements
- Supports automatic aspect ratio detection (`aspect: 'auto'`)
- Supports automatic coordinate system detection (`coord: 'auto'`)
- Handles clipping and masking

**Layout containers** (`src/elems/layout.ts`):
- `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`
- `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`

**Geometry elements** (`src/elems/geometry.ts`):
- `Line`, `UnitLine`, `VLine`, `HLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`
- `Shape`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`

**Text elements** (`src/elems/text.ts`):
- `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`, `Latex`, `Equation`

**Plot elements** (`src/elems/plot.ts`):
- `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`

**Network elements** (`src/elems/network.ts`):
- `ArrowSpline`, `Node`, `Edge`, `Network`

**Symbolic elements** (`src/elems/symbolic.ts`):
- `SymPoints`, `SymLine`, `SymSpline`, `SymShape`, `SymFill`, `SymField`

**Slide elements** (`src/elems/slide.ts`):
- `TitleBox`, `TitleFrame`, `Slide`

### Context System

The `Context` class handles coordinate system mapping:
- Maps from logical coordinates (`coord`) to pixel coordinates (`prect`)
- Handles rotations, aspect ratios, alignments, and expansions
- Pre-computes scalers for performance
- Core method: `map(spec)` transforms child specs into new contexts

### Coordinate Systems

Elements can specify positioning via:
- `rect`: logical rectangle `[x1, y1, x2, y2]`
- `coord`: internal coordinate system for children
- `pos` + `rad`: center position and radius (convenience)
- `xlim`/`ylim`: axis limits (convenience)

Key functions for rect manipulation:
- `rect_radial`, `radial_rect` - center/radius format conversion
- `rect_box`, `box_rect` - min/size format conversion
- `merge_rects`, `merge_points` - bounding box calculation
- `expand_rect`, `flip_rect` - transformations

### Evaluation Pipeline

1. **Parse** (`src/lib/parse.ts`): JSX code → AST using Acorn parser
   - Walks the AST and converts JSX elements to `new ComponentName({ ...props })`
   - Handles JSX expressions, spreads, and nested children
   - Imports `KEYS`/`VALS` from `src/gum.ts` to inject all components and utilities as globals

2. **Evaluate** (`src/eval.ts`): AST → Element tree
   - Runs the transformed code to instantiate components
   - Wraps result in `Svg` component if needed
   - Validates that result is an Element

3. **Render** (`src/elems/*.ts`): Element tree → SVG string
   - Each Element's `svg(ctx)` method renders itself
   - Context propagates coordinate transformations down the tree
   - Groups recursively render their children

4. **Rasterize** (`src/render.ts`): SVG string → PNG buffer
   - Uses `node-canvas` to rasterize the SVG string to a PNG buffer
   - Can also format the output as a Kitty terminal image

### File Organization

**Top-level modules:**
- `src/gum.ts` - Re-exports all elements and utilities; defines named constants (`none`, `blue`, `red`, etc.) and `KEYS`/`VALS` for the JSX evaluator
- `src/defaults.ts` - `DEFAULTS`, `THEME()` function, and theme management
- `src/eval.ts` - Code evaluation and element validation
- `src/render.ts` - SVG rendering to PNG via node-canvas

**Element modules (`src/elems/`):**
- `core.ts` - `Context`, `Element`, `Group`, `Svg`, `Rect`, plus `prefix_split`, `spec_split`, `align_frac`, `is_element`
- `layout.ts` - `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`, `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`
- `geometry.ts` - `Line`, `UnitLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`, `Shape`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`
- `text.ts` - `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`, `Latex`, `Equation`
- `plot.ts` - `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`
- `network.ts` - `ArrowSpline`, `Node`, `Edge`, `Network`
- `symbolic.ts` - `SymPoints`, `SymLine`, `SymSpline`, `SymShape`, `SymFill`, `SymField`
- `math.ts` - `MathSpan`, `MathText`, `SupSub`, `Frac`, `Sqrt`, `Bracket`, `Latex`
- `katex.ts` - `Latex`
- `image.ts` - `Image`
- `slide.ts` - `TitleBox`, `TitleFrame`, `Slide`

**Library modules (`src/lib/`):**
- `utils.ts` - Math utilities, array/vector ops, rect manipulation, color handling
- `text.ts` - Text measurement and wrapping using opentype.js
- `parse.ts` - JSX parser (Acorn) and AST walker
- `meta.ts` - Documentation metadata loading
- `term.ts` - Terminal utilities (stdin, Kitty protocol)

**Scripts:**
- `scripts/gum.ts` - The CLI for running the `gum` command
- `scripts/dev.ts` - The development server for running the `gum` command
- `scripts/skill.ts` - Creates a ZIP file for the Claude skill
- `scripts/test.ts` - Runs all `docs/code/` and `gala/code/` examples as a test suite

**Documentation:**
- `docs/text/` - Text documentation
- `docs/code/` - Component examples (one per element type)
- `gala/text/` - Gallery text documentation
- `gala/code/` - Gallery code examples

## Important Patterns

### Component Creation

All components take a single `args` parameter (a dictionary) and store it:
```javascript
class MyComponent extends Element {
    constructor(args = {}) {
        const { myProp, ...attr } = args
        super({ tag: 'g', ...attr })
        this.args = args
        this.myProp = myProp
    }
}
```

### Attribute Splitting

Use `spec_split(attr)` to separate layout params from SVG attributes:
```javascript
const [ spec, attr ] = spec_split(args)
// spec: { rect, coord, aspect, aspect0, expand, align, upright, offset, rotate, rotate_adjust, rotate_invar }
// attr: { stroke, fill, opacity, ... }
```

Use `prefix_split(prefixes, attr)` to split prefixed attributes for passing to sub-components. This allows parent components to accept prefixed props that get forwarded to children:
```javascript
class Plot extends Group {
    constructor(args = {}) {
        const [ xaxis_attr, yaxis_attr, attr ] = prefix_split(['xaxis', 'yaxis'], args)
        const xaxis = new Axis({ ...xaxis_attr, direc: 'h' })
        const yaxis = new Axis({ ...yaxis_attr, direc: 'v' })
        super({ children: [ xaxis, yaxis ], ...attr })
    }
}
```

### Context Mapping

Transform child specs through the context system. The `ctx.map(spec)` method takes a child's spec and returns a new Context with a pixel rect (`prect`) that conforms to the child's aspect ratio and alignment:

```javascript
inner(ctx) {
    return this.children
        .map(c => c.svg(ctx.map(c.spec)))
        .join('\n')
}
```

When mapping, if the child specifies an `aspect` ratio, `ctx.map()` will compute a pixel rect that respects that aspect. The child will be aligned within the available space according to its `align` parameter (e.g., 'center', 'left', [0.5, 0.5]).

## Element Specification

Element specification keys:
- `rect`: A rectangle `[x1, y1, x2, y2]` in coordinate space
- `coord`: The coordinate system for children `[xmin, ymin, xmax, ymax]`
- `aspect`: Width/height ratio
- `aspect0`: Original aspect ratio (before rotation, internal use only)
- `expand`: Whether to expand (true) or shrink (false) when fitting aspect
- `align`: How to align content ('left'/'center'/'right' or 'top'/'middle'/'bottom', or numeric 0-1)
- `rotate`: Rotation in degrees
- `rotate_invar`: Rotation-invariant (apply rotation after layout, not before)
- `rotate_adjust`: Adjust rotation to fit aspect ratio

Convenience keys (these map into the above keys):
- `flex`: Override to set `aspect = null`
- `pos/size`: Center position and size of the child's rectangle
- `xsize/ysize`: Specifies one dimension of `size` and applies `expand`
- `xlim/ylim`: Specify the coordinate limits for a specific dimension
- `spin`: Specifies a `rotate` value and applies `rotate_invar`
- `orient`: Specifies a `rotate` value and applies `rotate_adjust`
- `upright`: Whether to keep the child upright (true) or allow it to rotate (false)
- `offset`: Whether to offset the child by the parent's rect (true) or not (false)

## Math Elements

We use `katex` to parse LaTeX strings into an AST. This is then converted into gum.jsx elements and rendered to SVG. The `Latex` element is a wrapper that parses the LaTeX string and positions the element at the center of the rectangle.

The goal is not always perfectly replicating what LaTeX/KaTeX do. We want the implementation to be simple and easy to understand, and to be able to use the full power of gum.jsx to create complex layouts.
