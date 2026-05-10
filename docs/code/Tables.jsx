// load "data.csv" and plot each row as a blue dot
return <Graph aspect coord={[0, 0, 10, 10]}>
  <Mesh2D xlocs={10} ylocs={10} opacity={0.25} />
  {loadTable('data.csv').map(({ x, y }) =>
    <Dot pos={[x, y]} size={0.5} fill={blue} />
  )}
</Graph>