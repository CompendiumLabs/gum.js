# Introduction

The `gum.jsx` language allows for the elegant and concise creation of SVG visualizations. It has a React-like JSX syntax. When interpreted, it produces pure SVG of a specified size. It is a library of `Element` derived components such as `Circle`, `Stack`, `Plot`, `Network`, and many more. Some of these map closely to standard SVG objects, while others are higher level abstractions and layout containers. You can add standard SVG attributes (like `fill`, `stroke`, `stroke-width`, `opacity`, etc.) to any `Element` component and they will be applied to the resulting SVG.

*Proportional values*: In most cases, values are passed in proportional floating point terms. So to place an object in the center of its parent, you would specify `pos = [0.5, 0.5]`, with the size specified by `size`. When dealing with inherently absolute concepts like `stroke-width`, standard SVG units are used, and numerical values assumed to be specified in pixels. Most `Element` objects fill the standard coordinate space `[0, 0, 1, 1]` by default. To reposition them, either pass the appropriate internal arguments (such as `pos` or `size`) or use a layout component such as `Box` or `Stack` to arrange them.

*Aspect ratio*: Any `Element` object can have an aspect ratio `aspect`. If `aspect` is not defined, it will stretch to fit any box, while if `aspect` is defined it will be sized so as to fit within the specified rectangle while maintaining its aspect ratio. However, when `expand` is set to `true`, the element will be sized to cover the specified rectangle, while maintaining its aspect ratio.

*Subunit arguments*: For compound elements that inherit `Group`, some keyword arguments are passed down to the constituent parts. For instance, in [Plot](/docs/Plot), one can specify arguments intended for the `XAxis` unit by prefixing them with `xaxis-`. For example, setting the `stroke-width` for this subunit can be achieved with `xaxis-stroke-width`.

*Functional approach*: Avoid explicit for loops. There are `numpy`-like functions such as `range` and `linspace` for generating arrays, `zip` for combining arrays, and `palette` for interpolating colors. Additionally, you can use `map` to generate a list of elements (such as bars for a bar plot).

*Style tips*: There will be cases where a user prompt does not fully specify every detail. In these cases, use your best judgment and consider the following suggestions:
  - Text should be legible and not overlap. Usually a text element `ysize` of about `0.1` to `0.2` works well
  - Points and other small features should be visible but not overwhelming. Usually a size of about `0.03` is good for small features
  - The figure should have appropriate outer margins so that extended features like tick labels do not get cut off. Usually a margin of about `0.1` to `0.2` works well. The best way to create outer margins is to wrap the final output in a `Box` or `Frame` component
  - When the aspect ratio of the figure is not determined, a good default is to use `2` for things like plots and diagrams
  - The top-level `<svg>` element will have `fill="none"` and `stroke="black"` applied automatically, so you only need to specify these attributes when they differ from these defaults

# Examples

Below are some examples of user prompts and code output. In these examples, we try to highlight the most common use cases for the library, as well as some of the common pitfalls that one might encounter.

**Example 1: Basic Frame**

Let's start with a very simple example that creates a blue circle (`aspect = 1`) and encloses it in a rounded frame. In general, `Box` is an extremely useful component, as its child class `Frame`, which simply adds a default `border = 1`. This closely mirrors the behavior of a typical HTML element with Tailwind-like syntax.

*Prompt*: Create a blue circle that is enclosed in a rounded box. It should mostly fill the box, but not completely.

*Generated code*:
```jsx
<Frame padding margin rounded>
  <Circle fill={blue} />
</Frame>
```

Here we used boolean defaults for `padding`, `margin`, and `rounded`. These will get mapped to `padding={0.1}`, `margin={0.1}`, and `rounded={0.1}` respectively. This adds a little bit of a Tailwind-like flavor and is used throughout the library. Adding a `margin` on the outside is usually good so things like borders don't get clipped.

**Example 2: Symbolic Plot**

Now let's do a more complex example that uses a higher level component that is not a standard SVG element. In this case, we use `Plot`, which is a `Graph` subclass that adds axes (with `Axis`/`HAxis`/`VAxis`), labels, and other plot-specific features.

*Prompt*: Create a simple plot of a sine wave titled "Sine Wave" with dashed grid lines.

*Generated code*:
```jsx
<Plot aspect={2} margin={0.2} ylim={[-1.5, 1.5]} title="Sine Wave" grid grid-stroke-dasharray={4}>
  <SymLine fy={sin} xlim={[0, 2*pi]} />
</Plot>
```

Notice how we can pass arguments to sub-components using prefixing. Here we set the `stroke-dasharray` for the grid lines to `4`. For convenience, `Plot` accepts `Box` arguments such as `margin`, `border`, etc.

**Example 3: Custom Component**

Creating custom components is a powerful way to avoid code duplication and to make your code more readable and maintainable. Here we create a `Squire` component that is a `Square` with a default `rounded` border. Then we use this component to create two squares side by side.

*Prompt*: Create two rounded boxes side by side. Left one should be blue, right one should be red.

*Generated code*:
```jsx
const Squire = (attr) => <Square rounded {...attr} />
return <HStack spacing>
  <Squire fill={blue} />
  <Squire fill={red} />
</HStack>
```

Note: Because this is two squares (`aspect = 1`) stacked side by side, the `HStack` will have an aspect ratio of `2`. You can also use the `VStack` component to stack elements vertically. If you wish to override aspect-based sizing, you can use the `stack-size` argument to specify the size of the child elements.

**Example 4: Modular Approach**

Now let's cover a VERY IMPORTANT method of using custom components. We want to create modular and parameterizable components that can be reused in a variety of ways. Here we create a `Star` component that specifies its `Spline` path in internal coordinates, and we then pass the `pos`/`size` arguments to the component to position and scale the star.

*Prompt*: Create a semi-random starfield with about 10 yellow stars.

*Generated code*:
```jsx
const aster = [
  [0.5, 0], [0.65, 0.35],
  [1, 0.5], [0.65, 0.65],
  [0.5, 1], [0.35, 0.65],
  [0, 0.5], [0.35, 0.35],
]
const points = [
  [0.15, 0.20], [0.72, 0.12], [0.45, 0.55],
  [0.88, 0.68], [0.30, 0.80], [0.60, 0.35],
  [0.10, 0.58], [0.82, 0.42], [0.50, 0.90],
  [0.25, 0.10],
]
const Star = (attr) =>
  <Spline size={0.06} aspect closed points={aster} {...attr} />
return <Box border rounded fill={gray}>
  {points.map(p => <Star pos={p} fill={yellow} />)}
</Box>
```

Note: By creating a reusable `Star` component that accepts `pos`/`size` arguments, we can easily create a starfield by mapping over `points`. This offloads the logic of adding and scaling the spline coordinates in `aster` to the positions listed in `points`.

**Example 5: Stacking Layouts**

Stacking components can be tricky. If all your children have well-defined aspect ratios, it's often quite straightforward. But even in that case, you may want to override the default aspect-based sizing. Let's look at the case of a wide figure with a short text label underneath it.

```jsx
<VStack spacing={0.05}>
  <Rect rounded aspect={5} fill={blue} />
  <Text stack-size={0.2}>Hello World!</Text>
</VStack>
```

Without specifying `stack-size`, the `Text` element would be quite large (it has an aspect ratio of around `6`). By specifying `stack-size`, we can force the text to be smaller. Because it will be thinner than its assigned rectangle, we need to take a stance on how to justify it. By default it will be centered, but this can be overridden with the `justify` argument.

# Utilities

Here are the handy array functions provided by the library. All of these mimic the behavior of their counterparts in Python and `numpy`. This can be useful for generating `Element` objects from arrays:
```typescript
function zip(...arrs: any[]): any[]
function range(ia: number, ib?: number, step?: number = 1): number[]
function linspace(x0: number, x1: number, num: number, end?: boolean = false): number[]
function enumerate(x: any[]): any[]
function repeat(x: any, n: number): any[]
```

Some of the most commonly used mathematical constants are pre-defined in the global scope:
```javascript
const e = Math.E // base of the natural logarithm
const pi = Math.PI // ratio of circumference to diameter
const phi = (1 + sqrt(5)) / 2 // golden ratio
const r2d = 180 / Math.PI // conversion from radians to degrees
const d2r = Math.PI / 180 // conversion from degrees to radians
```

Additionally, there is a default `gum.jsx` color palette that is pre-defined in the global scope, but you can also use any valid CSS color string:
```javascript
const none = 'none'
const white = '#ffffff'
const black = '#000000'
const blue = '#1e88e5'
const red = '#ff0d57'
const green = '#4caf50'
const yellow = '#ffb300'
const purple = '#9c27b0'
const gray = '#f0f0f0'
```

To interpolate colors between color values, you can use these functions:
```typescript
function interp(c1: string, c2: string, x: number): string
function palette(c1: string, c2: string, clim: range): number => string
```
