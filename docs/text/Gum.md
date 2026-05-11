# Gum

Welcome to the Gum documentation! Click on an item in the list on the left to get more info about a particular class (usually an [Element](/docs/Element), function, or constant).

Each entry has a description of the operation and arguments of the item and an associated example code snippet. You can edit the code snippet, but note that these will get clobbered if you navigate to another entry! Go to the [main editor](/gum/studio) for non-ephemeral work.

The syntax is a JSX component style familiar to React developers. The output is pure SVG. You can nest objects in interesting ways and specify their parameters. Positions and sizes are specified proportionally (i.e. between `0` and `1`), but some quantities like `border` or `stroke-width` are still specified in pixel units.

## Common Patterns

*Parameter specification*: You can specify boolean parameters like `border` just by writing their name. Some parameters, such as `margin` or `padding` default to `0` when not specified, but also take a specific value when specified as boolean `true` (in both cases `0.1`). You can also pass SVG properties such as `stroke-width` directly.

*Subunit arguments*: for compound elements that inherit [Group](/docs/Group), some keyword arguments are passed down to the constituent parts. For instance, in [Plot](/docs/Plot), one can specify arguments intended for the [XAxis](/docs/Axis) unit by prefixing them with `xaxis-`. For example, setting the `stroke-width` for this subunit can be achieved with `xaxis-stroke-width`.

*Constructive layout*: we try to avoid hard-coding absolute values as much as possible. Instead, we use proportions relative to the parent element's size. For instance, `margin = 0.1` means "10% of the parent's width/height". Similarly, instead of manually positioning elements in a row, we use [HStack](/docs/Stack) or [VStack](/docs/Stack) to automatically arrange them.
