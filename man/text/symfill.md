# SymFill

*Inherits*: [Polygon](/docs/polygon) > [Element](/docs/element)

Flexible interface to generate filled in paths symbolically or in combination with fixed inputs. This generates a polygon by running through the points generated by `fx1`/`fy1` and then backwards through the points generated by `fx2`/`fy2`. To generate a simple filled curve, pass your function to `fy1` and let `fy2` be `0`.

Parameters:
- `fx1`/`fy1` — a function generating one of the bounds for the fill (or a constant)
- `fx2`/`fy2` — a function generating the other bound for the fill (or a constant)
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
