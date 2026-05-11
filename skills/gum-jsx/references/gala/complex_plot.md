# Complex Plot

This is another nice example of a multi-element **Plot**, but here the elements are doing more explanatory work. The grid, axes, implicit-looking curves, marked points, and text labels all live in the same plotting frame, so the result reads more like a mathematical diagram than a plain chart.

The small `Curve` helper is doing useful cleanup. It wraps **SymLine** with shared styling and a fixed `ylim`, then the actual branches are defined just by their formulas. Notice that these are written as `x = f(y)` rather than the more usual `y = f(x)`, which is a good reminder that the symbolic plot elements can work either way.

One small trick worth noting is the use of `maximum(0, ...)` inside the square roots. That clips away the invalid region and avoids taking square roots of negative values, which keeps the plotted branches well behaved at their endpoints.

**Code**

```jsx
const xlim = [ -4, 4 ]; const ylim = [ -2, 2 ]
const Curve = ({ fx, stroke }) => <SymLine fx={fx} ylim={ylim} stroke={stroke} stroke-width={2} N={200} />
const xlabel = <Latex>x = a + bi</Latex>
const ylabel = <Latex>c</Latex>
return <Plot aspect={2} margin={0.3} xlim={xlim} ylabel={ylabel} xlabel={xlabel} ylabel-offset={0.075}>
  <Mesh2D xlocs={41} ylocs={21} xlim={xlim} ylim={ylim} opacity={0.1} />
  <HLine loc={0} lim={xlim} opacity={0.3} />
  <VLine loc={0} lim={ylim} opacity={0.3} />
  <Curve fx={y => -y + sqrt(maximum(0, y*y-1))} stroke={blue} />
  <Curve fx={y => -y - sqrt(maximum(0, y*y-1))} stroke={blue} />
  <Curve fx={y => +sqrt(maximum(0, 1-y*y))} stroke={red} />
  <Curve fx={y => -sqrt(maximum(0, 1-y*y))} stroke={red} />
  <Dot pos={[-1, 1]} size={0.08} color={blue} />
  <Dot pos={[1, -1]} size={0.08} color={blue} />
  <Dot pos={[0, -1]} size={0.08} color={red} />
  <Dot pos={[0, +1]} size={0.08} color={red} />
  <Dot pos={[0, 0]} size={0.08} />
  <Text color={blue} pos={[-2.5, 1.1]} ysize={0.4}>real</Text>
  <Text color={red} pos={[1.6, -0.4]} ysize={0.4}>imag</Text>
  <Latex pos={[2.5, 1.6]} ysize={0.32}>f(x) = x^2 + 2cx + 1</Latex>
</Plot>
```