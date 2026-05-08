// a city-block route in blue with rounded corners, with the underlying
// vertices marked as black dots to show how the corners are rounded
const points = [
  [-0.8,  0.6], [-0.2,  0.6], [-0.2, -0.6],
  [ 0.4, -0.6], [ 0.4,  0.0], [ 0.8,  0.0],
]
return <Frame margin>
  <Graph aspect coord={[-1, -1, 1, 1]}>
    <Line opacity={0.3} points={points} />
    <RoundedLine stroke={blue} stroke-width={2} radius={0.15} points={points} />
    <Points point-size={0.03} points={points} />
  </Graph>
</Frame>
