# Text

*Inherits*: [VStack](/docs/VStack) > [Element](/docs/Element)

Displays text and other elements. Note that you will typically not set the font size of the text here, as this will fill the entire space with the provided text. To set the text color, use `color` instead of `fill` or `stroke`.

If `wrap` is specified, the text will be wrapped to the specified width. In either case, single newlines will be respected, though whitespace will be compressed. There are two wrapper elements related to text:

- [TextBox](/docs/TextBox) / **TextFrame** can handle text with a border and background
- **TextStack** can handle multiple lines of text that are passed in as an array

There are two default fonts that are always provided: `sans = 'IBM Plex Sans'` and `mono ='IBM Plex Mono'`. You can use these global variables anywhere.

Parameters:
- `children` — the text to display
- `wrap` = `null` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)
- `spacing` = `0.2` — the spacing between lines of text
- `justify` = `'left'` — the horizontal justification of the text
- `color` = `black` — sets the text color using both stroke and fill (this is the usual way)
- `font-family` = `sans` — the font family (for display and size calculations)
- `font-weight` = `100` — the font weight (for display and size calculations)
