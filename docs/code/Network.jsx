// A network with a node on the left saying "Hello world" and two nodes on the right, one saying "This is a test of wrapping capabilities" and the other containing a blue ellipse. There are arrows going from the left node to each of the right nodes. The nodes have gray backgrounds and rounded corners. The edges have white arrowheads.
<Network aspect={1.5} node-ysize={0.3} node-rounded node-fill={gray} edge-fill={white}>
  <Node id="hello" pos={[0.25, 0.5]} wrap={3}>Hello world</Node>
  <Node id="test" pos={[0.75, 0.25]} wrap={6}>This is a test of wrapping capabilities</Node>
  <Node id="ball" pos={[0.75, 0.75]}><Ellipse aspect={1.5} fill={blue}/></Node>
  <Edge start="hello" end="test" />
  <Edge start="hello" end="ball" start-side="s" />
</Network>
