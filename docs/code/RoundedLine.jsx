// a city-block route in blue with rounded corners, with the underlying
// vertices marked as black dots to show how the corners are rounded
const points = [
  [-0.8,  0.6], [-0.2,  0.6], [-0.2, -0.6],
  [ 0.4, -0.6], [ 0.4,  0.0], [ 0.8,  0.0],
]
return <Graph aspect padding>
  <Line points={points} opacity={0.3} />
  <RoundedLine points={points} stroke={blue} stroke-width={2} radius={0.1} />
  <Points points={points} point-size={0.03} />
</Graph>
