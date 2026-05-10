// draw a piecewise line spiraling outwards (with dots at vertices)
const spiral = linspace(0, 5, 25).map(t => polar(2*pi * t, t/5))
return <Box margin>
  <Graph coord={[-1, -1, 1, 1]}>
    <Line points={spiral} />
    <Points points={spiral} point-size={0.03} />
  </Graph>
</Box>
