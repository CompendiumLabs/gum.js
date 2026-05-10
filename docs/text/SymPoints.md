# SymPoints

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Flexible interface to generate sets of points symbolically or in combination with fixed inputs. The most common usage is to specify the range for x-values with `xlim` and a function to plot with `fy`. But you can specify the transpose with `ylim`/`fx`, or do a fully parametric path using `tlim` with either `f` or `fx`/`fy`.

You can also specify point size functionally with `point-size` and the shape with `point-shape`. Both of these functions take `(x, y, t, i)` values as inputs and return the desired value for each point. As with other groups, the **SymPoints** element itself can still be laid out with the normal `size`/`xsize`/`ysize` element parameters.

Parameters:
- `f` — a function mapping t-values to `[x, y]` points
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `point-size` = `0.05` — a size or a function mapping from `(x, y, t, i)` values to a size
- `point-shape` = `Dot` — a shape or function mapping from `(x, y, t, i)` values to a shape
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
