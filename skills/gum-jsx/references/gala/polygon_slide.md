# Polygon Slide

This one is built in a nicely modular way. The key move is the local `RegularPolygon` component, which wraps **SymShape** and hides the circle parameterization with `fx={cos}`, `fy={sin}`, and `tvals`. Once that helper exists, the slide can generate six examples by simply mapping over `[n, name]` pairs.

The overall composition is handled with layout elements rather than manual positioning. A **Slide** provides the title text, and a **Grid** lays out the six cards in two rows. Each card is just a `Frame` plus a `VStack`, which keeps the polygon and its label in a consistent proportion. Notice how we set `stack-size` on the text so it doesn't get too tall.

The color handling is also worth noting. `palette(blue, purple, [3, 8])` turns the side count into a smooth color ramp, so the sequence reads as a progression rather than a collection of unrelated fills. There is also a small `spin` adjustment in `RegularPolygon`, which helps each shape sit in a more natural upright orientation.

**Code**

```jsx
const pal = palette(blue, purple, [3, 8])
const shapes = [
  [3, 'Triangle'], [4, 'Square'  ], [5, 'Pentagon'],
  [6, 'Hexagon' ], [7, 'Heptagon'], [8, 'Octagon' ],
]

const RegularPolygon = ({ n, ...args }) =>
  <SymShape {...args} aspect
    xlim={[-1, 1]} ylim={[-1, 1]}
    tvals={linspace(0, 2*pi, n, false)}
    f={t => polar(t+pi/2*(n-2)/n)}
  />

return <Slide title="Simple Regular Polygons" wrap={25}>
  <Text>
    A regular polygon has equal side lengths and equal interior angles. Below are examples for
    <Tex>{"n \\in \\{3, \\ldots, 8\\}"}</Tex>
  </Text>
  <Grid rows={2} spacing={[0.05, 0.075]}>
    { shapes.map(([n, s]) =>
      <Frame rounded fill padding>
        <VStack spacing aspect>
          <RegularPolygon n={n} fill={pal(n)} />
          <Text stack-size={0.2}>{`${s} (${n})`}</Text>
        </VStack>
      </Frame>
    ) }
  </Grid>
</Slide>
```