// embed a five point star in a circle. place red dots at its vertices.
const verts = linspace(0, 360, 10, false).map((t, i) => {
  const radius = i % 2 == 0 ? 1 : 0.5
  return polar(90 + t, radius)
})
return <Graph aspect coord={[-1, -1, 1, 1]}>
  <Circle pos={[0, 0]} size={2} stroke={darkgray} />
  <Shape points={verts} stroke={blue} stroke-width={2} />
  {verts.map(pos => <Dot pos={pos} size={0.05} fill={red} />)}
</Graph>
