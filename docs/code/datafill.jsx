// a decaying sine wave filled in with blue
const decay = x => exp(-0.1*x) * sin(x)
return <Graph xlim={[0, 6*pi]} ylim={[-1, 1]} aspect={phi}>
  <DataFill fy1={decay} fy2={0} fill={blue} fill_opacity={0.5} N={250} />
  <DataPath fy={decay} N={250} />
</Graph>
