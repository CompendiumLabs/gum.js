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
