// draw a blue cubic spline path filled with gray that looks like a pacman facing left, using 5 vertices. label the vertices with black dots and connect them with straight red lines. place the whole thing in a rounded frame.
const points = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.75, 0.75],
  [0.25, 0.75],
  [0.50, 0.50],
]
return <Frame rounded margin>
  <Group>
    <Spline closed stroke={blue} fill={gray} points={points} />
    <Shape stroke={red} points={points} />
    <Points point-size={0.02} points={points} />
  </Group>
</Frame>
