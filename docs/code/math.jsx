// plot the exponential of sin(x) over [0, 2π]
<Frame margin={0.15}>
  <Plot aspect={phi} ylim={[0, 3]}>
    <DataPath fy={x => exp(sin(x))} xlim={[0, 2*pi]} />
  </Plot>
</Frame>
