# Text Elements

## Text

*Inherits*: **VStack** > **Element**

Displays text and other elements. Note that you will typically not set the font size of the text here, as this will fill the entire space with the provided text. To set the text color, use `color` instead of `fill` or `stroke`.

If `wrap` is specified, the text will be wrapped to the specified width. In either case, single newlines will be respected, though whitespace will be compressed. There are two wrapper elements related to text:

- **TextBox** / **TextFrame** can handle text with a border and background
- **TextStack** can handle multiple lines of text that are passed in as an array

There are two default fonts that are always provided: `sans = 'IBM Plex Sans'` and `mono ='IBM Plex Mono'`. There are three availabe font weights: `light = 300`, `regular = 400`, and `bold = 700`. The default weight is `light`. You can use these global variables anywhere.

Parameters:
- `children` — the text to display
- `wrap` = `null` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)
- `spacing` = `0.2` — the spacing between lines of text
- `justify` = `'left'` — the horizontal justification of the text
- `color` = `black` — sets the text color using both stroke and fill (this is the usual way)
- `font-family` = `sans` — the font family (for display and size calculations)
- `font-weight` = `300` — the font weight (for display and size calculations)

**Example**

Prompt: The text "Hello World! You can mix text and other elements together." with a blue square between "and" and "other". Put it in a rounded frame with padding.

Generated code:
```jsx
<TextFrame rounded wrap={10} justify="center">
  Hello World! You can mix text and <Square rounded fill={blue} /> other elements together.
</TextFrame>
```

## TitleFrame

*Inherits*: **Frame** > **Element**

A special type of **Frame** that places a title element in a box centered on the line at the top of the frame. The title element can be either a proper Element or a string, in which case it will be wrapped in a **Text** element.

Parameters:
- `title` — the text or element to use as the title
- `title-size` = `0.1` — the size of the title element
- `adjust` = `true` — whether to adjust the padding and margin to account for the title element
- `border` = `1` — the outer frame border width to use

Subunits:
- `title` — the title element

**Example**

Prompt: Various food emojis are arrnaged in a spaced out grid and framed with the title "Fruits & Veggies". Each emoji is framed by a rounded square

Generated code:
```jsx
const emoji = [ '🍇', '🥦', '🍔', '🍉', '🍍', '🌽', '🍩', '🥝', '🍟' ]
return <TitleFrame title="Fruits & Veggies" margin padding rounded>
  <Grid rows={3} spacing={0.05}>
    {emoji.map(e =>
      <Frame aspect rounded padding><Text>{e}</Text></Frame>
    )}
  </Grid>
</TitleFrame>
```

## Slide

*Inherits*: **TitleFrame** > **Frame** > **Group** > **Element**

Create a presentation slide with a title and some content. This stacks various `Text` elements and other `Element`s vertically. It will automatically apply the specified `wrap` value to the text elements. It defaults to using a `TitleFrame` for the title and a light gray rounded border.

Parameters:
- `children` = `[]` — a list of strings or `Element`s to array vertically
- `wrap` = `25` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)

Subunits:
- `title` — the title element
- `text` — the text elements

**Example**

Prompt: A slide with a title, a plot of a sine wave, and some text describing the plot. Let the title be "The Art of the Sine Wave".

Generated code:
```jsx
<Slide title="The Art of the Sine Wave">
  <Text>Here's a plot of a sine wave below. It has to be the right size to fit in with the figure correctly.</Text>
  <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid fill={lightgray} margin={[0.25, 0.05]} aspect={2}>
    <SymLine fy={sin} stroke={blue} stroke-width={2} />
  </Plot>
  <Text>It ranges from low to high and has some extra vertical space to allow us to see the full curve.</Text>
</Slide>
```
