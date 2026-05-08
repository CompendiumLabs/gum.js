# Pendulum Physics

This is a diagrammatic example more than a plotting one. The structure is driven by a few physical parameters like the pendulum length and angle, and then the visible points are derived from those with `polar`. That makes the rod, bob, tension arrow, gravity arrow, and labels all stay in sync if you change the setup.

The figure also shows how well simple geometry mixes with mathematical text. Most of the picture is built from basic shapes and arrows, while the labels and equation use `Latex` to give it a textbook feel. The mesh background and muted palette help reinforce that classroom-diagram look without adding much code.

One useful trick used here is setting `clip` on the **Frame** to hide the upper part of the anchoring rectangle. Note that when you do apply `clip`, you may need to increase the `border` value since half of it will be cut off.

**Code**

```jsx
// Pendulum Diagram
const slate = '#4a5568'
const steel = '#718096'
const sand  = '#c4b5a0'
const cream = '#f5f0e8'
const navy  = '#2d3748'
const rose  = '#9e6060'
const sage  = '#5a8a6e'

// Diagram constants
const pivotX = 0.5
const pivotY = 0.08
const rodAng = 25
const rodLen = 0.7
const bobRad = 0.075
const arcRad = 0.25

// Computed positions
const rodRot = 90 - rodAng
const eqnY = pivotY + rodLen
const [ bobX, bobY ] = polar(rodRot, rodLen, [pivotX, pivotY])
const [ midX, midY ] = polar(rodRot, 0.50 * rodLen, [pivotX, pivotY])
const [ tenX, tenY ] = polar(rodRot, 0.75 * rodLen, [pivotX, pivotY])

return <Box margin={0.06}>
  <VStack spacing={0.05}>
    {/* Title */}
    <Text stack-size={0.075} color={navy}>Simple Pendulum</Text>

    {/* Diagram */}
    <Frame rounded={0.02} fill={cream} clip border={2} aspect={1.25}>
      {/* Mesh background */}
      <Mesh2D xlocs={25} ylocs={20} stroke={navy} stroke-opacity={0.05} />

      {/* Ceiling / support */}
      <RoundedRect pos={[0.5, 0]} size={[0.6, 0.16]} fill={sand} stroke={navy} stroke-width={1.5} rounded={0.1} />

      {/* Angle arc */}
      <Arc pos={[pivotX, pivotY]} size={2 * arcRad} start={90} end={rodRot} stroke={rose} stroke-width={2} />
      <Latex pos={[pivotX + 0.04, pivotY + 0.18]} ysize={0.1} color={rose}>\theta</Latex>

      {/* Equilibrium line */}
      <Line stroke={steel} stroke-width={2} stroke-dasharray={4} points={[[pivotX, pivotY], [pivotX, eqnY]]} />
      <Dot pos={[pivotX, eqnY]} size={0.02} color={steel} stroke-width={2}/>

      {/* Rod */}
      <Line stroke={navy} stroke-width={2.5} points={[[pivotX, pivotY], [bobX, bobY]]} />
      <Latex pos={[midX - 0.02, midY + 0.06]} ysize={0.1} color={navy}>\ell</Latex>

      {/* Pivot point */}
      <Circle pos={[pivotX, pivotY]} size={0.02} fill={slate} stroke={navy} stroke-width={1.5} />

      {/* Tension arrow */}
      <Arrow points={[[bobX, bobY], [tenX, tenY]]} stroke={sage} stroke-width={2} arrow-fill={sage} arrow-size={0.08} />
      <Latex pos={[tenX + 0.06, tenY + 0.01]} ysize={0.1} color={sage}>T</Latex>

      {/* Gravity arrow */}
      <Arrow points={[[bobX, bobY], [bobX, bobY + bobRad + 0.13]]} stroke={rose} stroke-width={2} arrow-fill={rose} arrow-size={0.06} />
      <Latex pos={[bobX + 0.09, bobY + bobRad + 0.1]} ysize={0.1} color={rose}>mg</Latex>

      {/* Bob */}
      <Frame aspect={1} pos={[bobX, bobY]} size={2 * bobRad} padding={0.5} fill={sage} stroke={navy}border={2} shape={<Circle />}>
        <Latex color={white}>m</Latex>
      </Frame>
    </Frame>

    {/* Equation of motion */}
    <Latex stack-size={0.075} color={navy}>{"\\ddot{\\theta} = - (g/\\ell) \\sin(\\theta)"}</Latex>
  </VStack>
</Box>
```