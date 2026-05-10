# SymLine

*Inherits*: [Line](/docs/Line) > [Element](/docs/Element)

Flexible interface to generate two-dimensional paths symbolically or in combination with fixed inputs. There are variety of acceptable input combinations, but the most common usage is to specify the range to use for x-values with `xlim` and a function to plot with `fy`. To plot a polygon instead of a line, use [SymShape](/docs/SymShape).

Alternatively, you can specify the transpose with `ylim`/`fx`, or do a fully parametric path using `tlim` with either `f` or `fx`/`fy`. In any of these cases, one can either specify limits with `xlim`/`ylim`/`tlim` or specific values with `xvals`/`yvals`/`tvals`.

Parameters:
- `f` — a function mapping t-values to `[x, y]` points
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
