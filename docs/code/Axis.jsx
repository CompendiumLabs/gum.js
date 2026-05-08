// a horizontal axis with 5 ticks labeled with emojis for: mount fuji, a rocket, a whale, a watermellon, and a donut
const emoji = ['🗻', '🚀', '🐳', '🍉', '🍩']
const ticks = zip(linspace(0, 1, emoji.length), emoji)
return <Box padding={[0.5, 1]}>
  <HAxis aspect={10} ticks={ticks} tick-side="outer" label-size={1} label-offset={0.25} />
</Box>
