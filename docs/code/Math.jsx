// draw a spirograph in a box for a set of example parameters
const [R, r, d, k] = [10, 7, 4, 7]
const fx = t => (R - r) * cos(t) + d * cos(((R - r) / r) * t)
const fy = t => (R - r) * sin(t) - d * sin(((R - r) / r) * t)
return <TitleFrame title="Spirograph" padding={0.2} margin rounded>
  <Graph aspect coord={[-R, -R, R, R]}>
    <Circle pos={[0, 0]} size={2*R} stroke={darkgray} stroke-dasharray={10} />
    <Circle pos={[0, 0]} size={2*(R - r)} stroke-dasharray={5} />
    <SymSpline fx={fx} fy={fy} tlim={[0, 2*pi*k]} stroke={blue} stroke-width={2} />
  </Graph>
  <Span pos={[0.5, 1.1]} size={[1, 0.05]} font-family={mono}>R = 10 | r = 7 | d = 4</Span>
</TitleFrame>
