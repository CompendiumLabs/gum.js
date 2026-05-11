// A plot of three different increasing curves of varying steepness and multiple points spaced at regular intervals. The x-axis label is "time (seconds)", the y-axis label is "space (meters)", and the title is "Spacetime Vibes". There are axis ticks in both directions with assiated faint grid lines.
<Plot coord={[-1, -1, 1, 1]} margin={0.2} grid
  xlabel="time (seconds)" ylabel="space (meters)"
  title="Spacetime Vibes"
>
  <Points point-size={0.04} points={[
    [0, 0.5], [0.5, 0], [-0.5, 0], [0, -0.5]
  ]} />
  <Rectangle pos={[0.5, 0.5]} size={0.2} />
  <Circle pos={[-0.5, -0.5]} size={0.2} />
  {[0.5, 0.9, 1.5].map(a =>
    <SymLine fy={x => sin(a*x)} />
  )}
</Plot>
