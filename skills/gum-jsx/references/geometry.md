# Geometry Elements

## Rect

*Inherits*: **Element**

This makes a rectangle. Without any arguments it will fill its entire allocated space. Unless otherwise specified, it has a `null` aspect. Use **Square** for a square with a unit aspect.

Specifying a `rounded` argument will round the borders by the same amount for each corner. This can be either a scalar or a pair of scalars corresponding to the x and y radii of the corners. To specify different roundings for each corner, use the **RoundedRect** element. Rounding is expressed as a fractional value between 0 and 1, where 0 means no rounding and 1 will essentially render an ellipse. Values much greater than 0.1 will start to look a little goofy.

Parameters:
- `rounded` = `null` — proportional border rounding, accepts either scalar or pair of scalars

**Example**

Prompt: a rectangle on the left side of the figure with an aspect of roughly 1/2

Generated code:
```jsx
<Rectangle pos={[0.25, 0.5]} size={[0.2, 0.4]}/>
```

## Ellipse

*Inherits*: **Element**

This makes an ellipse. Without any arguments it will inscribe its allocated space. Use **Circle** for a circle with a unit aspect.

**Example**

Prompt: two ellipses, one wider and one taller

Generated code:
```jsx
<Group>
  <Ellipse pos={[0.3, 0.2]} size={[0.4, 0.2]} />
  <Ellipse pos={[0.6, 0.6]} size={[0.4, 0.5]} />
</Group>
```

## Arc

*Inherits*: **Path** > **Element**

This draws an elliptical arc that inscribes its allocated rectangle, like **Ellipse**, but only over a selected angular interval.

Parameters:
- `start` — first angle in degrees
- `end` — second angle in degrees

Angles follow the current coordinate system: `0` points right and positive angles follow positive y. In the default screen coordinate system, `90` points down; inside a default **Graph**, where y is flipped upward, `90` points up. The two angles are treated as an interval; their order does not change the drawn arc.

**Example**

Prompt: elliptical and circular arcs using start and end angles

Generated code:
```jsx
<Group>
  <Arc pos={[0.32, 0.5]} size={[0.44, 0.32]} start={-45} end={210} stroke={blue} stroke-width={2} />
  <Arc pos={[0.72, 0.5]} size={0.32} start={90} end={-150} stroke={red} stroke-width={2} />
</Group>
```

## Line

*Inherits*: **Element**

The `Line` element draws line segments through a series of points. It accepts a list of two or more points and connects them with straight line segments.

There are specialized variants for vertical and horizontal lines called **VLine** and **HLine**, which allow you to specify the position of the line (`loc`) and the range of the line (`lim`). See **UnitLine** for more details.

For smooth curves through points, use **Spline** instead.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)

**Example**

Prompt: draw a diagonal line in blue and a cup shaped line in red

Generated code:
```jsx
<Group>
  <Line stroke={blue} points={[
    [0.2, 0.2],
    [0.8, 0.8],
  ]} />
  <Line stroke={red} points={[
    [0.3, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
    [0.7, 0.3],
  ]} />
</Group>
```

## Shape

*Inherits*: **Pointstring** > **Element**

The `Shape` element draws a closed polygon through a series of points. It accepts a list of two or more points and connects them with straight line segments, automatically closing the shape by connecting the last point back to the first.

For open multiple-segment paths, use **Line** instead.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)

**Example**

Prompt: draw a blue triangle with a semi-transparent green square overlaid on top

Generated code:
```jsx
<Group>
  <Shape fill={blue} stroke={none} points={[
    [0.5, 0.2],
    [0.8, 0.8],
    [0.2, 0.8]
  ]} />
  <Shape fill={green} stroke={none} opacity={0.5} points={[
    [0.3, 0.3],
    [0.7, 0.3],
    [0.7, 0.7],
    [0.3, 0.7]
  ]} />
</Group>
```

## Fill

*Inherits*: **Shape** > **Pointstring** > **Element**

Shades the area between two curves. Generates a closed polygon by running through `points1` forward and then through `points2` in reverse. Either list can be a constant, in which case `direc` controls how the constant is broadcast against the other curve. There are specialized components **VFill** and **HFill** that don't take the `direc` argument.

When both `points1` and `points2` are arrays, `direc` is ignored. When one is a constant `c`:
- `direc="h"` (default) treats `c` as a constant x-coordinate, pairing it with each y from the other curve
- `direc="v"` treats `c` as a constant y-coordinate, pairing it with each x from the other curve (useful for shading under a curve down to a horizontal baseline)

For a symbolic analogue that generates points from functions, see **SymFill**.

Parameters:
- `points1` — array of points for one boundary, or a constant
- `points2` — array of points for the other boundary, or a constant
- `direc` — broadcast direction when one boundary is a constant: `"h"` (default) or `"v"`

**Example**

Prompt: shade the area between a zigzag curve and the x-axis

Generated code:
```jsx
const curve = [[0, 1], [2, 3], [4, 2], [6, 5], [8, 4], [10, 6]]
return <Graph xlim={[0, 10]} ylim={[0, 7]} aspect={phi}>
  <VFill points1={curve} points2={0} fill={blue} fill-opacity={0.4} />
  <Line points={curve} stroke={blue} />
</Graph>
```

## Spline

*Inherits*: **Path** > **Element**

This creates a smooth cardinal spline curve through a series of points. The tangent at each interior point is computed as the central difference between its neighbors, while endpoints use forward/backward differences. This produces a smooth, natural-looking curve that passes through all specified points.

The `curve` parameter controls the tension of the spline. Lower values (e.g., 0.5) create tighter curves with less overshoot, while higher values (e.g., 1.5) create looser, more flowing curves. The default value of 0.5 produces the canonical *Catmull-Rom* spline.

In some cases, you may want to construct spline data explicitly (say to place points or labels along a spline). In this cases, there is a `spline2d` function that accepts the same arguments as this component but returns a t -> (x,y) spline function over `[0, 1]`. There is also a `spline1d` function that returns an x -> y spline function.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)
- `curve` = `0.5` — tension parameter that scales the tangent vectors
- `closed` = `false` — toggles whether to make it a closed loop
- `start-dir`/`end-dir` — the direction vectors at the first and last points (defaults to start and end points direction)

**Example**

Prompt: draw a blue cubic spline path filled with gray that looks like a pacman facing left, using 5 vertices. label the vertices with black dots and connect them with straight red lines. place the whole thing in a rounded frame.

Generated code:
```jsx
const points = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.75, 0.75],
  [0.25, 0.75],
  [0.50, 0.50],
]
return <Frame rounded margin>
  <Spline closed stroke={blue} fill={gray} points={points} />
  <Shape stroke={red} points={points} />
  <Points point-size={0.02} points={points} />
</Frame>
```

## Arrow

*Inherits*: **Group** > **Element**

Draws a straight arrow between two points. This is the straight-line counterpart to **ArrowSpline**: it uses `from` and `to` endpoints, but renders a simple **Line** shaft instead of a curved spline.

The line and arrowhead can be styled separately using prefixed parameters. The head is built from **ArrowHead**-style geometry, while the shaft is a simple **Line**.

The arrow direction is inferred automatically from `from` to `to`.

Parameters:
- `points` — the points to draw the arrow between (can include intermediate points)
- `start-dir` / `end-dir` — the direction of the arrowheads at the start and end
- `arrow` / `arrow-start` / `arrow-end` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow-end` and `false` for `arrow-start`, meaning a directed graph edge
- `arrow-size` = `0.04` — size of the arrowhead
- `curve` = `null` — curvature factor forwarded to the **Spline** (`null` or zero means straight line)
- `rounded` = `null` — corner radius for a city-block path through `points`. When set, the shaft is a **RoundedLine** (takes precedence over `curve`)

Subunit names:
- `line` — forwarded to the shaft line
- `arrow` — forwarded to the arrowhead
- `start` / `end` — forwarded to the start and end arrowheads respectively

**Example**

Prompt: the text "Blue Square" on the left with an arrow pointing to a blue square on the right

Generated code:
```jsx
<Frame rounded>
  <Group aspect={2}>
    <Text pos={[0.2, 0.5]} ysize={0.2} wrap={4} justify="center">Blue Square</Text>
    <Arrow points={[[0.3, 0.5], [0.6, 0.5]]} />
    <Square pos={[0.75, 0.5]} ysize={0.5} rounded fill={blue} />
  </Group>
</Frame>
```

## RoundedLine

*Inherits*: **Path** > **Element**

The `RoundedLine` element draws a polyline through a series of points with rounded corners at each interior vertex. It is most useful for *city-block* (right-angle) routes — for instance, edges in a network diagram that you want to bend cleanly around obstacles rather than curving with **Spline**. Spline curvature along an otherwise-straight `points` route produces undulating bumps; `RoundedLine` keeps the straight segments straight and only rounds the turns.

Each interior vertex is replaced by a circular arc whose radius is derived from `radius` in coord space. When the coordinate system is not square, `RoundedLine` uses the smaller mapped axis so corners stay circular in pixel space instead of stretching into ellipses. If a segment is too short for the requested radius, the corner is automatically clamped so adjacent corners can never overlap.

For straight-line polylines (no corner rounding) use **Line**. For smooth curves through points use **Spline**.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)
- `radius` = `0.05` — corner back-off distance in coord space, applied at each interior vertex

**Example**

Prompt: a city-block route in blue with rounded corners, with the underlying

Generated code:
```jsx
// vertices marked as black dots to show how the corners are rounded
const points = [
  [0.10, 0.20],
  [0.40, 0.20],
  [0.40, 0.80],
  [0.70, 0.80],
  [0.70, 0.50],
  [0.90, 0.50],
]
return <Frame margin>
  <Line opacity={0.3} points={points} />
  <RoundedLine stroke={blue} stroke-width={2} radius={0.08} points={points} />
  <Points point-size={0.015} points={points} />
</Frame>
```
