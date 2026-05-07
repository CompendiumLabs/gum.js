# Plot

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Uses [Graph](/docs/Graph) to plot one or more elements over the desired limits and frame them with axes. If not specified by `xlim` and `ylim`, the limits of the plot will be computed from the bounding box of the constituent elements. By default, the `aspect` will be the ratio of the range of the `xlim` and `ylim`. See [Axis](/docs/Axis) for more details on how to customize the axes, ticks, and labels.

By default, the extent of **Plot** only includes the graphing area itself, not the axes, labels, or title. To include these, you can set the `margin` parameter to a non-zero value. However, it many cases it makes more sense to enclose **Plot** in a [Frame](/docs/Frame)  or [Box](/docs/Box) element and set the `margin` parameter on that instead. This is useful if you want to add border that exactly encloses the graphing area.

Parameters:
- `xlim`/`ylim` = `[0, 1]` — the range over which to graph
- `xanchor`/`yanchor` — the value at which to place the respective axis. Note that the `xanchor` is a y-value and vice versa. Defaults to `xmin`/`ymin`
- `xticks`/`yticks` = `5` — either an integer for evenly spaced ticks, a list of tick locations, or list of tick `[location, label]` pairs (see [Axis](/docs/Axis) for more details)
- `grid`/`xgrid`/`ygrid` = `false` — whether to show a grid in the background. If `true`, the grid lines match the specified ticks. Alternatively, you can pass a list of positions to override this
- `xlabel`/`ylabel` — a string or **Element** to use as the respective label
- `title` — a string or **Element** to use as the title
- `padding` = `0` ­— additional padding to add to auto-detected coordinate limits
- `margin` = `0` — margin to add around the plot (needed to include labels and title)
- `border` = `0` — border width to use
- `clip` = `false` — clip graph contents to specified coordinates

Subunits:
- `axis`/`xaxis`/`yaxis` — the axes, including lines, ticks, and tick labels
- `grid`/`xgrid`/`ygrid` — the grid lines arrayed under the graph
- `label`/`xlabel`/`ylabel` — the axis label elements
- `title` — the plot title element

Title:
- `title-size` = `0.075` — the size of the title element
- `title-offset` = `0.05` — the offset of the title element from the top of the plot

Labels:
- `label-size` = `0.05` — the size of the label elements
- `label-offset` = `0.125` — the offset of the label elements from the axis
- `xlabel-size`/`ylabel-size` — the size of the x/y label element (overrides `label-size`)
- `xlabel-offset`/`ylabel-offset` — the offset of the x/y label element from the axis (overrides `label-offset`)
