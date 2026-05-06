# Rect

*Inherits*: [Element](/docs/Element)

This makes a rectangle. Without any arguments it will fill its entire allocated space. Unless otherwise specified, it has a `null` aspect. Use **Square** for a square with a unit aspect.

Specifying a `rounded` argument will round the borders by the same amount for each corner. This can be either a scalar or a pair of scalars corresponding to the x and y radii of the corners. To specify different roundings for each corner, use the **RoundedRect** element. Rounding is expressed as a fractional value between 0 and 1, where 0 means no rounding and 1 will essentially render an ellipse. Values much greater than 0.1 will start to look a little goofy.

Parameters:
- `rounded` = `null` — proportional border rounding, accepts either scalar or pair of scalars
