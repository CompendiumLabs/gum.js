// history

import { useState, useEffect } from 'react'
import { useElementSize } from './utils'
import { evaluateGumSafe } from './eval'

function CodePreview({ code }) {
  const [ preview, setPreview ] = useState(true)
  const [ canvasRef, canvasSize ] = useElementSize()
  const [ element, setElement ] = useState(null)
  const [ error, setError ] = useState(null)

  // eval code for element render
  useEffect(() => {
    const size = canvasSize ?? [ 500, 500 ]
    const [ newElement, newError ] = evaluateGumSafe(code, size)
    if (newElement) setElement(newElement)
    setError(newError)
  }, [ code, canvasSize ])

  return <div ref={canvasRef} className="relative w-full h-full">
    { preview && <div className="w-full h-64">
      { error ? <div className="text-red-500 text-sm">{error}</div> : <div dangerouslySetInnerHTML={{ __html: element }} />}
    </div> }
    { !preview && <div className="whitespace-pre-wrap font-mono text-xs">{code}</div> }
    <div className="absolute top-2 right-2 flex flex-row border rounded-sm text-xs bg-white cursor-pointer">
      <div className={`rounded-l-sm p-1 ${!preview ? 'bg-black text-white' : ''}`} onClick={() => setPreview(false)}>Code</div>
      <div className={`rounded-r-sm p-1 ${preview ? 'bg-black text-white' : ''}`} onClick={() => setPreview(true)}>Image</div>
    </div>
  </div>
}

function Message({ role, content }) {
  return <div className="flex flex-col text-sm pb-4">
    <div className="w-fit border border-b-0 border-gray-400 bg-gray-100 ml-2 px-1 rounded-t smallcaps text-xs">{role}</div>
    <div className="border rounded-sm border-gray-400 p-2 whitespace-pre-wrap">
      { role == 'assistant' ? <CodePreview code={content} /> : content }
    </div>
  </div>
}

function History({ history }) {
  return <div className="w-full h-full flex flex-col gap-4 p-4">
    {history.map((h, i) => <Message key={i} {...h} />)}
</div>
}

export { History }
