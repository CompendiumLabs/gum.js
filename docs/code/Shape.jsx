// draw a stop sign
const hexagon = linspace(0, 360, 8, false).map(t => polar(t))
return <Box fill="#bbb" rounded padding margin>
  <Graph xlim={[-1, 1]} ylim={[-1, 1]} aspect={1}>
    <Shape points={hexagon} fill="#CC0202" stroke={white} stroke_width={20} spin={180/8} />
    <Text pos={[0, 0]} xsize={1.5} color={white} font-weight={bold}>STOP</Text>
  </Graph>
</Box>
