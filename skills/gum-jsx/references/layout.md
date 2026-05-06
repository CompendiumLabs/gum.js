# Layout Elements

## Box

*Inherits*: **Group** > **Element**

This is a simple container class allowing you to add padding, margins, and a border to a single **Element**. It's pretty versatile and is often used to set up the outermost positioning of a figure. Mirroring the standard CSS definitions, padding is space inside the border and margin is space outside the border. This has no border by default, but there is a specialized subclass of this called **Frame** that defaults to `border = 1`.

**Box** can be pretty handly in various situations. It is differentiated from **Group** in that it will adopt the `aspect` of the child element. This is useful if you want to do something like shift an element up or down by a certain amount while maintaining its aspect ratio. Simply wrap it in a **Box** and set child's `pos` to the desired offset.

There are multiple ways to specify padding and margins. If given as a scalar, it is constant across all sides. If two values are given, they correspond to the horizontal and vertical sides. If four values are given, they correspond to `[left, top, right, bottom]`.

The `adjust` flag controls whether padding/margins are adjusted for the aspect ratio. If `true`, horizontal and vertical components are scaled so that their ratio is equal to the `child` element's aspect ratio. This yields padding/margins of constant apparent size regardless of aspect ratio. If `false`, the inputs are used as-is.

Parameters:
- `padding` = `0` / `0.1` — the padding to be added (inside border)
- `margin` = `0` / `0.1` — the margin to be added (outside border)
- `border` = `0` / `1` — the border width to use (stroke in pixels)
- `rounded` = `0` / `0.1` — the border rounding to use (proportional to the box size)
- `fill` = `null` — the background color to use (default is no fill)
- `adjust` = `true` — whether to adjust values for aspect ratio
- `shape` = `Rect` — the shape class to use for the border
- `clip` = `false` — whether to clip the contents to the border shape

Subunit names:
- `border` — keywords to pass to border, such as `stroke` or `stroke-dasharray`

**Example**

Prompt: the text "hello!" in a frame with a dashed border and rounded corners

Generated code:
```jsx
<Box padding border rounded border-stroke-dasharray={5}>
  <Text>hello!</Text>
</Box>
```

## Stack

*Inherits*: **Group** > **Element**

Stack one or more **Element** either vertically or horizontally. There are specialized components **VStack** and **HStack** that don't take the `direc` argument. This element handles child positioning and sizing, so any child `pos`/`size` arguments will be overridden. Proportional spacing between children can be specified with the `spacing` parameter.

The simplest case is when all children have aspect ratios. In the **HStack** case, the overall aspect ratio of the stack is the sum of the child aspect ratios. Children are allocated space in proportion to their aspect ratios. The **VStack** case is similar, but we need to deal in inverse aspect ratio terms.

When some children lack aspect ratios, they will be allocated any remaining space evenly. Regardless of whether a child has an aspect ratio or not, it can be given a fixed size with the `stack-size` parameter. This is specified as a fraction between 0 and 1, independent of spacing. Be warned though, if you specify `stack-size` for a child with an aspect ratio, it will be ignored. If you specify `stack-size` for every child, the resulting stack will have no aspect ratio.

Whenever possible, the aspect ratio of the overall stack is set so that all elements with defined aspect ratios will reach full width (in the **VStack** case) or full height (in the **HStack** case).

Child parameters:
- `stack-size` = `null` — the child's relative share of the available space along the stack axis

Parameters:
- `direc` — the direction of stacking: `v` or `h`
- `spacing` = `0` — total amount of space to add between child elements
- `justify` = `center` — how to justify children along the stack axis
- `even` = `false` — whether to distribute sizes evenly (`stack-size = 1 / n`)

**Example**

Prompt: a wide blue rectangle on top, with red and green squares side by side on the bottom. each one has rounded corners.

Generated code:
```jsx
<VStack spacing>
  <Rectangle rounded aspect={2} fill={blue} />
  <HStack spacing>
    <Square rounded fill={red} />
    <Square rounded fill={green} />
  </HStack>
</VStack>
```

## Grid

*Inherits*: **Group** > **Element**

This element arranges its children in a grid. The grid is specified by the number of rows and columns, and the gap between the cells. In the case where `widths` and `heights` are not specified, a reasonable effort is made to best accomodate the grid elements based on their aspects (if specified).

Parameters:
- `rows` = `N` — the number of rows in the grid (autodetected)
- `cols` = `M` — the number of columns in the grid (autodetected)
- `widths` = `[1/N,...]` — an array of widths for each column
- `heights` = `[1/M,...]` — an array of heights for each row
- `spacing` = `0` — the gap between the cells in the grid

**Example**

Prompt: draw a grid of square boxes filled in light gray. each box contains an arrow that is pointing in a particular direction. that direction rotates clockwise as we move through the grid.

Generated code:
```jsx
<Frame padding rounded>
  <Grid rows={3} spacing>
    { linspace(0, 360, 10).slice(0, 9).map(th =>
      <Frame padding rounded>
        <Group aspect={1} spin={th}>
          <Arrow points={[[0, 0.5], [1, 0.5]]} arrow-size={0.4} />
        </Group>
      </Frame>
    ) }
  </Grid>
</Frame>
```

## Points

*Inherits*: **Group** > **Element**

Place copies of a common shape at various points. Marker size is controlled with `point-size`, while the **Points** element itself can still be laid out with the normal `size`/`xsize`/`ysize` element parameters. The default shape is a black dot.

When used inside **Graph** or **Plot**, the point coordinates are also reported for automatic limit detection. This means point clouds can now expand plot limits without requiring `coord="auto"` on the **Points** element itself.

Keyword arguments:
- `points` — a list of points, where each point is either an `[x, y]` pair
- `point-shape` = `Dot` — the default shape to use for children
- `point-size` = `0.05` — the default size to use for children
- `...` = `{}` — additional attributes are passed to the default shape (like `stroke` or `fill`)

**Example**

Prompt: A plot of three different increasing curves of varying steepness and multiple points spaced at regular intervals. The x-axis label is "time (seconds)", the y-axis label is "space (meters)", and the title is "Spacetime Vibes". There are axis ticks in both directions with assiated faint grid lines.

Generated code:
```jsx
<Plot xlim={[-1, 1]} ylim={[-1, 1]} grid margin={0.3} aspect xlabel="time (seconds)" ylabel="space (meters)" title="Spacetime Vibes">
  <Points point-size={0.04} points={[
    [0, 0.5], [0.5, 0], [-0.5, 0], [0, -0.5]
  ]} />
  <Rectangle pos={[0.5, 0.5]} size={0.2} />
  <Circle pos={[-0.5, -0.5]} size={0.2} />
  {[0.5, 0.9, 1.5].map(a =>
    <SymLine fy={x => sin(a*x)} />
  )}
</Plot>
```
