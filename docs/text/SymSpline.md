# SymSpline

*Inherits*: [Spline](/docs/Spline) > **Path** > [Element](/docs/Element)

Flexible interface to generate smooth two-dimensional spline curves symbolically or in combination with fixed inputs. Similar to [SymLine](/docs/SymLine), but produces smooth cardinal splines instead of straight line segments. See [Spline](/docs/Spline) for more details on the `curve` parameter.


Parameters:
- `f` — a function mapping t-values to `[x, y]` points
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
- `curve` = `0.5` — tension parameter that scales the tangent vectors
