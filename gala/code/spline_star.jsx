// parameters
const n = 5
const R = 0.7
const c = 0.6

// get inner/outer vertex angles
const theta0 = linspace(0, 2 * pi, n, false).map(t => t - pi / 2)
const theta1 = theta0.map(t => t + pi / n)

// get inner/outer point positions
const points0 = theta0.map(t => polar(t * r2d))
const points1 = theta1.map(t => polar(t * r2d, R))
const points = zip(points0, points1).flat()

// return full spline
return <Frame aspect margin padding rounded fill={gray}>
  <Spline closed fill={blue} curve={c} coord={[-1, -1, 1, 1]} points={points} />
</Frame>
