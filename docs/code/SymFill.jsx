// a decaying sine wave filled in with blue
const decay = x => exp(-0.1*x) * sin(x)
return <Graph xlim={[0, 6*pi]} ylim={[-1, 1]} aspect={phi}>
  <SymFill f1={t => [t, decay(t)]} f2={t => [t, 0]} tlim={[0, 6*pi]} fill={blue} fill-opacity={0.5} N={250} />
  <SymLine fy={decay} N={250} />
</Graph>
