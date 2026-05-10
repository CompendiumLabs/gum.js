// load "data.csv" and plot each row as a blue dot
return <Graph aspect xlim={[0, 10]} ylim={[0, 10]}>
  <Mesh2D xlim={[0, 10]} ylim={[0, 10]} xlocs={10} ylocs={10} opacity={0.5} />
  {loadTable('data.csv').map(({ x, y }) =>
    <Dot pos={[x, y]} size={0.5} fill={blue} />
  )}
</Graph>