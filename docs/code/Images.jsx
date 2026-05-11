// load "image.png" and display a 2x1 clip from the center
<Box rounded clip>
  <Group aspect={2}>
    <LoadImage id="image.png" xrect={[0, 1]} />
  </Group>
</Box>
