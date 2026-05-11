# Element

The base class for all Gum objects. You will usually not be working with this object directly unless you are implementing your own custom elements. However, many of the arguments are common to all elements and are documented here.

The position and size of an element are specified in the internal coordinates (`coord`) of its parent, which defaults to the unit square. Rectangles are always specified in `[left, top, right, bottom]` format. Where the element is placed is ultimately determined by its `rect`. However, it is more common to specify the `rect` using one of the convenience parameters below.

There are several convenience parameters that can be used to specify the `rect` in a more intuitive way. These include `size`/`xsize`/`ysize` for controlling the extent of the rectangle around `pos` and the analogous `rad`/`xrad`/`yrad` for radial specification. You can also specify the limits in either or both dimensions with `xrect`/`yrect`, where a single number is interpreted as a zero-length limit at that position.

The `expand` parameter can be used to control whether the element should be expanded to fully contain its `rect`. This is useful if you have an aspected element with a desired size in one dimension. A very common case is a [Text](/docs/Text) element where you specify `pos` and `ysize` and leave the width to be determined by the aspect ratio.

Parameters:
- `aspect` = `null` — the width to height ratio for this element
- `rect` — a fully specified rectangle to place the child in (takes precedence over other parameters)
- `pos` — the desired position of the center of the child's rectangle
- `size`/`xsize`/`ysize` ­— the desired size of the child's rectangle (`size` can be single number or pair)
- `rad`/`xrad`/`yrad` — the desired radius of the child's rectangle (`rad` can be single number or pair)
- `xrect`/`yrect` — the limits of the child's rectangle in the x and y dimensions (both can be single number or pair)
- `expand` — when `true`, instead of embedding the child within `rect`, it will make the child just large enough to fully contain `rect`
- `align` — how to align the child when it doesn't fit exactly within `rect`, options are `left`, `right`, `center`, or a fractional position (can set vertical and horizontal separately with a pair)
- `rotate` — how much to rotate the child by (degrees counterclockwise)
- `spin` — like rotate but will maintain the same size
- `flex` ­— override to set `aspect = null`
- `...` = `{}` — additional attributes are applied directly to the resulting SVG
