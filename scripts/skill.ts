#! /usr/bin/env bun

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Command } from 'commander'
import { getDocs, getGala, prepareDocsPage, prepareGalaPage } from '../src/meta'

// capitalize a string
function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

// parse arguments
const program = new Command()
program.option('-o, --output <output>', 'the output directory for the skill')
program.parse(process.argv)
const { output = 'skills/gum-jsx' } = program.opts()

// load docs pages
const { tags: docs_tags, cats, text: docs_text, code: docs_code } = getDocs('docs')
const { tags: gala_tags, text: gala_text, code: gala_code } = getGala('gala')

// make reference pages

// load prompt files
const head = readFileSync('prompt/head.md', 'utf8').trim()
const intro = readFileSync('prompt/intro.md', 'utf8').trim()
const docs = readFileSync('prompt/docs.md', 'utf8').trim()
const refs = readFileSync('prompt/refs.md', 'utf8').trim()
const gen = readFileSync('prompt/gen.md', 'utf8').trim()

// build skill file
const skill = `
${head}

${intro}

${docs}

${prepareDocsPage(docs_text['Element'], docs_code['Element'], true)}

${prepareDocsPage(docs_text['Group'], docs_code['Group'], true)}

${prepareDocsPage(docs_text['Box'], docs_code['Box'], true)}

${refs}

${gen}
`.trim()

// write skill directory
mkdirSync(output, { recursive: true })
writeFileSync(`${output}/SKILL.md`, skill + '\n')

// write reference pages
mkdirSync(`${output}/references`, { recursive: true })
Object.entries(cats).forEach(([c, ps]) => {
    if (c == 'core') return
    const content = ps.map(p =>
        prepareDocsPage(docs_text[p], docs_code[p], true)
    ).join('\n\n')
    const entry = `# ${capitalize(c)} Elements\n\n${content}\n`
    writeFileSync(`${output}/references/${c}.md`, entry)
})

// write gala pages
mkdirSync(`${output}/references/gala`, { recursive: true })
gala_tags.forEach(t => {
    const entry = prepareGalaPage(gala_text[t], gala_code[t])
    writeFileSync(`${output}/references/gala/${t}.md`, entry)
})
