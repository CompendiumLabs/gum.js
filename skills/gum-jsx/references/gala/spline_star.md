# Spline Star

Here we have a kind of gummy star shaped thing. It is built by generating two rings of interleaved points (inner and outer) and feeding them to a closed **Spline**. The figure is lightly parameterized, allowing you to change the number of points and the radius of the outer ring, in addition to the curvature of the spline.

There are two useful scripting tricks here. The first is using `map` + `polar` to convert a list of angles to Cartesian points. The second is using `zip` + `flat` to interleave the two point lists.

Note the non-standard coordinate system. By default `coord` is the unit box `[0, 0, 1, 1]`, but here we set it to `[-1, -1, 1, 1]` so we can express things in an origin-centered way.

**Code**

```jsx
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
```