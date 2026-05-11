#! /usr/bin/env bun

import { Command } from 'commander'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

import { evaluateGum } from '../src/eval'
import { fitRasterSize, rasterizeSvg, formatImage, readStdin } from '../src/render'
import { Element, Group } from '../src/elems/core'
import type { CliArgs, LoadFile } from '../src/lib/types'
import { devCommand } from './dev'

//
// argument transform
//

function transformArgs(cmd: Command) {
  const [ file0 ] = cmd.args
  let { format, output, theme, background, size, rasterSize, dev } = cmd.opts()

  // add white background for light theme
  if (theme == 'light' && background == null) background = 'white'

  // auto-detect format for output
  if (format == null) {
    if (output == null) {
      format = 'kitty'
    } else {
        if (output.endsWith('.svg')) format = 'svg'
        if (output.endsWith('.png')) format = 'png'
    }
  }

  // make loadFile function
  const file = file0 != null ? resolve(file0) : undefined
  const cwd = file != null ? dirname(file) : process.cwd()
  const loadFile: LoadFile = function loadFile(path: string, encoding: string = 'utf8') {
    const file = resolve(cwd, path)
    return encoding == 'bytes'
      ? readFileSync(file)
      : readFileSync(file, encoding as BufferEncoding)
  }

  return { file, format, output, theme, background, size, rasterSize, dev, loadFile }
}

//
// convert to JSON
//

function convertToTree(elem: Element): any {
  const type = elem.constructor.name
  const args = elem.args
  if (elem instanceof Group) {
    const { children, ...args1 } = args
    const children1 = elem.children.map(convertToTree)
    return { type, children: children1, ...args1 }
  }
  return { type, ...args }
}

//
// run command
//

async function runCommand(args: CliArgs) {
  const { file, format, output, theme, background, size: size0 = 1000, rasterSize, dev, loadFile } = args

  // divert to dev command if update is on
  if (dev) {
    devCommand(args)
    return
  }

  // wait for stdin
  const code = file ? readFileSync(file, 'utf-8') : await readStdin()

  // evaluate gum with size
  const elem = evaluateGum(code, { size: size0, theme, loadFile })

  // rasterize output
  let out: string | Buffer
  if (format == 'json') {
    const tree = convertToTree(elem)
    out = JSON.stringify(tree, null, 2)
  } else if (format == 'svg') {
    out = elem.svg()
  } else if (format == 'png' || format == 'kitty') {
    let svg = elem.svg()
    if (rasterSize != null) {
      const [ rasterWidth, rasterHeight ] = fitRasterSize(elem.size, rasterSize)
      const elem1 = elem.clone({ width: rasterWidth, height: rasterHeight })
      svg = elem1.svg()
    }
    const dat = await rasterizeSvg(svg, { background })
    out = (format == 'kitty') ? (formatImage(dat) + '\n') : dat
  } else {
    throw new Error(`Unsupported output format: ${format}`)
  }

  // write output
  if (output) {
    writeFileSync(output, out)
  } else {
    process.stdout.write(out)
  }
}

// main program

const program = new Command()
program.name('gum')
  .description('gum.jsx command line tools')
  .argument('[file]', 'gum.jsx file to render (reads from stdin if not provided)')
  .option('-d, --dev', 'live update display', false)
  .option('-f, --format <format>', 'format to output')
  .option('-t, --theme <theme>', 'theme to use', 'light')
  .option('-b, --background <background>', 'background color')
  .option('-s, --size <size>', 'SVG/viewBox size', (value: string) => parseInt(value))
  .option('-r, --raster-size <size>', 'max rasterized PNG size', (value: string) => parseInt(value))
  .option('-o, --output <output>', 'output file')
  .action(async function(this: Command) {
    const args = transformArgs(this)
    await runCommand(args)
  })
program.parse()
