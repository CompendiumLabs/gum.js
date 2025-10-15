<Slide title="The Art of the Sine Wave">
  Here's a plot of a sine wave below. It has to be the right size to fit in with the figure correctly.

  <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} fill="#f6f6f6" grid margin={[0.25, 0]}>
    <SymPath fy={sin} stroke={blue} stroke-width={2} />
    <SymPoints fy={sin} N={10} size={0.06} fill={white} />
    <Rect pos={[3/2*pi, 0.75]} rad={0.3} stroke={red} />
  </Plot>

  It ranges from low to high and has some extra vertical space to allow us to see the full curve.
</Slide>
