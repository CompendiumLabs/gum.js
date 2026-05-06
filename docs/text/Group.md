# Group

*Inherits*: [Element](/docs/Element)

This is the main container class that all compound elements are derived from. It accepts a list of child elements and attempts to place them according to their declared properties. Child placement positions are specified in the group's internal coordinates (`coord`), which defaults to the unit square. The coordinate space is specified in `[left, top, right, bottom]` format.

The child's `aspect` is an important determinant of its placement. When the child does not have an aspect, it will fit exactly in the given `rect`. When it does have an aspect, it will be made as large as possible while still fitting in the given `rect`. The `align` argument governs the exact placement in this case, while the `expand` flag makes it as small as possible while still covering the given `rect`.

One common pitfall: using `coord` will affect that placement of child elements. But for graphing elements like [Line](/docs/Line) or [Points](/docs/Points), their `points` values are evaluate based on their own coordinate system, not the containing **Group**'s. You must either give them their own `coord` or use [Graph](/docs/Graph), which automatically propagates the coordinate system to all children.

To help with debugging, a `debug` flag can be passed to show stencil lines indicating the childrens' placement. The allocated space is shown in dashed blue, while the realized position (accounting for aspect and alignment) is shown in dashed red.

Parameters:
- `children` = `[]` — a list of child elements
- `aspect` = `null` — the aspect ratio of the group's rectangle (can pass `'auto'` to infer from the children)
- `coord` = `[0, 0, 1, 1]` — the internal coordinate space to use for child elements (can pass `'auto'` to contain children's rects)
- `clip` = `false` — clip children to the group's rectangle if `true` (or a custom shape if specified)
- `debug` = `false` — show debug boxes for the children
