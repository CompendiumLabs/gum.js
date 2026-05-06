# Stack

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Stack one or more **Element** either vertically or horizontally. There are specialized components **VStack** and **HStack** that don't take the `direc` argument. This element handles child positioning and sizing, so any child `pos`/`size` arguments will be overridden. Proportional spacing between children can be specified with the `spacing` parameter.

The simplest case is when all children have aspect ratios. In the **HStack** case, the overall aspect ratio of the stack is the sum of the child aspect ratios. Children are allocated space in proportion to their aspect ratios. The **VStack** case is similar, but we need to deal in inverse aspect ratio terms.

When some children lack aspect ratios, they will be allocated any remaining space evenly. Regardless of whether a child has an aspect ratio or not, it can be given a fixed size with the `stack-size` parameter. This is specified as a fraction between 0 and 1, independent of spacing. Be warned though, if you specify `stack-size` for a child with an aspect ratio, it will be ignored. If you specify `stack-size` for every child, the resulting stack will have no aspect ratio.

Whenever possible, the aspect ratio of the overall stack is set so that all elements with defined aspect ratios will reach full width (in the **VStack** case) or full height (in the **HStack** case).

Child parameters:
- `stack-size` = `null` — the child's relative share of the available space along the stack axis

Parameters:
- `direc` — the direction of stacking: `v` or `h`
- `spacing` = `0` — total amount of space to add between child elements
- `justify` = `center` — how to justify children along the stack axis
- `even` = `false` — whether to distribute sizes evenly (`stack-size = 1 / n`)
