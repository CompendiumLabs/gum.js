// Draw a rounded star shape with a blue fill. Wrap it in a rounded frame.
const rad = t => 1 - 0.2 * cos(5 * (t - pi/2))
return <Frame rounded padding margin>
  <SymShape aspect fill={blue}
    tlim={[0, 2*pi]} N={200}
    f={t => polar(t, rad(t))}
  />
</Frame>