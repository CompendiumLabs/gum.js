// docs

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

import { ErrorCatcher } from './Error'
import { CodeEditor } from './Editor'
import { useElementSize } from './utils'
import { evaluateGumSafe } from './eval'
import { useManCache } from './utils'

import { Text, HStack, Svg } from '../lib/gum.js'

import './Docs.css'

import meta from '../man/meta.json?7'

function Panel({ children, className }) {
  return <div className={`border rounded-md border-gray-500 bg-white ${className}`}>
    {children}
  </div>
}

function ClickList({ children }) {
  return <div className="w-full h-full flex flex-col gap-1">
    {children}
  </div>
}

function ClickItem({ children, onClick, active }) {
  return <div className={`cursor-pointer select-none hover:bg-slate-300 border-x-5 border-transparent hover:border-l-blue-500 p-2 ${active ? 'bg-slate-300 border-l-slate-500' : ''}`} onClick={onClick}>
    {children}
  </div>
}

function makeGumLogo() {
  const runes = [...'GUM'].map(r => new Text({ children: r }))
  const text = new HStack({ children: runes, spacing: 0.2 })
  const svg = new Svg({ children: text, size: 200, aspect: 2.8 })
  return svg.svg()
}

function GumLogo() {
  return <div className="w-full h-full flex justify-center items-center">
    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: makeGumLogo() }} />
  </div>
}

function splitCode(code) {
  let desc = ''
  if (code.startsWith('//')) {
    const lines = code.split('\n')
    desc = lines[0].slice(2).trim()
    code = lines.slice(1).join('\n')
  }
  return { code: code.trim() + '\n', desc: desc.trim() }
}

export default function Docs() {
  // page loading and navigation
  const { page = 'gum' } = useParams()
  const navigate = useNavigate()

  // docs data
  const [ text, setText ] = useState('')
  const [ code, setCode ] = useState('')
  const [ desc, setDesc ] = useState('')
  const cache = useManCache()

  // code editor setup
  const [ key, setKey ] = useState(0)
  const [ element, setElement ] = useState(null)
  const [ error, setError ] = useState(null)
  const [ canvasRef, canvasSize ] = useElementSize()

  // get page data from doc cache
  useEffect(() => {
    if (!cache) return
    const val_text = cache.text.get(page)
    const code_raw = cache.code.get(page)
    const { code: val_code, desc: val_desc } = splitCode(code_raw)
    setText(val_text)
    setCode(val_code)
    setDesc(val_desc)
  }, [ cache, page ])

  // handle code updates
  function handleCode(c) {
    setCode(c)
    setKey(key + 1)
  }

  // intercept wildcat errors
  function handleError(error, errorInfo) {
    setError(error.message + '\n' + errorInfo.componentStack)
  }

  // eval code for element render
  useEffect(() => {
    const [ width, height ] = canvasSize ?? [ 500, 500 ]
    const size = [ 0.9 * width, 0.9 * height ]
    const [ newElement, newError ] = evaluateGumSafe(code, size)
    setElement(newElement ?? newError)
  }, [ code, canvasSize ])

  // handle sidebar clicks
  function handleClick(name) {
    navigate(`/docs/${name.toLowerCase()}`)
  }

  function handleMarkdownLink({ href, children }) {
    return <a className="cursor-pointer" onClick={e => {
      e.preventDefault()
      if (href.startsWith('/docs/')) {
        navigate(href)
      } else {
        window.open(href, '_blank')
      }
    }}>{children}</a>
  }

  return <div className="w-screen h-screen p-5 bg-gray-100">
    <div className="w-full h-full flex flex-row gap-5">
      <Panel className="h-full w-[55%] flex flex-row">
        <div className="h-full w-[150px] flex flex-col border-r rounded-l-md border-gray-500 bg-slate-200 overflow-y-auto pt-2">
          <ClickList>
            <div className="cursor-pointer select-none border rounded px-2 m-3 hover:bg-slate-300 hover:border-blue-500" onClick={() => handleClick('')}>
              <GumLogo />
            </div>
            {Object.entries(meta).map(([ key, value ]) => <>
              <div key={key} className="pl-2 font-mono smallcaps text-sm text-slate-600 select-none">{key}</div>
              {value.map((item, index) =>
                <ClickItem key={index} onClick={() => handleClick(item)} active={page === item.toLowerCase()}>{item}</ClickItem>
              )}
            </>)}
          </ClickList>
        </div>
        <div className="h-full flex-1 p-5 overflow-y-auto prose max-w-none text-md">
          <ReactMarkdown components={{ a: handleMarkdownLink }}>{text}</ReactMarkdown>
        </div>
      </Panel>
      <div className="h-full flex flex-col gap-5 w-[45%]">
        <Panel className="w-full flex-1 flex flex-col">
          <div className="text-sm text-gray-500 p-2 border-b rounded-t-md border-gray-400 bg-slate-100">{desc}</div>
          <CodeEditor className="h-full" code={code} setCode={handleCode} />
        </Panel>
        <Panel className="w-full h-[50%]">
          <div ref={canvasRef} className="w-full h-full flex justify-center items-center pointer-events-none select-none rounded-md">
            <ErrorCatcher key={key} onError={handleError}>
              <div dangerouslySetInnerHTML={{ __html: element }} />
            </ErrorCatcher>
          </div>
        </Panel>
      </div>
    </div>
  </div>
}

export { GumLogo }
