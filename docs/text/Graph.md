# Graph

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

This is the core graphing functionality used in [Plot](/docs/Plot) without the axes and labels. By default, the coordinate system is automatically inferred from the limits of child elements. This can be overridden with custom `xlim`/`ylim`/`coord` specifications. The Elements that are passed to **Graph** can express their position and size information in this new coordinate system.

Unlike [Group](/docs/Group), **Graph** will automatically pass the given `coord` to all children, so they can express their position and size information in this new coordinate system. This is very useful for elements like [Line](/docs/Line) or [Points](/docs/Points), which evaluate their `points` values based on their own coordinate system, not that of the container.

You'll often want to use **Graph** (directly or indirectly) to display mathematical curves, as they might otherwise come out looking upside down relative to what you expect (as higher y-values mean "down" in raw SVG).

Parameters:
- `xlim`/`ylim`/`coord` = `'auto'` — the coordinate system to use for the graph
- `padding` = `0` — proportional padding to add when limits are auto-detected from children
