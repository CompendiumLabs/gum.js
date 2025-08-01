# SymPoly

*Inherits*: [Polygon](/docs/polygon) > [Element](/docs/element)

Flexible interface to generate polygons symbolically or in combination with fixed inputs. Operates similarly to [SymPoints](/docs/sympoints), but generates a polygon from the points generated by `fx`/`fy`.

Parameters:
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
