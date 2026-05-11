const aspect = 2
const ratio = pi / aspect
return <Box margin={0.3}>
  <Group coord={[0, 1, 2*pi, -1]} aspect={aspect}>
    <HMesh locs={5} opacity={0.15} />
    <VMesh locs={5} opacity={0.15} />
    <HAxis ticks={5} lim={[0, 2*pi]} pos={[pi, -1]} size={[2*pi, 0.08]} />
    <VAxis ticks={5} lim={[-1, 1]} pos={[0, 0]} size={[0.08*ratio, 2]} />
    <SymLine fy={sin} xlim={[0, 2*pi]} />
  </Group>
</Box>
