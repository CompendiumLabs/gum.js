import { parse as parseFont, type Font } from 'opentype.js'
import { is_browser, is_string } from '../lib/utils'
import { sans, mono, moji } from '../lib/const'

//
// object utils
//

function map_object<T, U>(obj: Record<string, T>, fn: (v: T) => U): Record<string, U> {
    return Object.fromEntries(
        Object.entries(obj).map(([ k, v ]) => [ k, fn(v) ])
    )
}

async function map_object_async<T, U>(obj: Record<string, T>, fn: (v: T) => Promise<U>): Promise<Record<string, U>> {
    return Object.fromEntries(
        await Promise.all(
            Object.entries(obj).map(
                async ([ k, v ]) => [ k, await fn(v) ]
            )
        )
    )
}

//
// load font data as arraybuffer
//

type FontPath = string | {
    regular: string
    bold: string
}

type FontData = ArrayBuffer | {
    regular: ArrayBuffer
    bold: ArrayBuffer
}

type FontPair = {
    regular: Font,
    bold: Font,
}

type FontEntry = Font | FontPair

async function loadFont(path: string): Promise<ArrayBuffer> {
    if (is_browser()) {
        const response = await fetch(path)
        return response.arrayBuffer()
    } else {
        // @ts-ignore
        const fs = await import('fs/promises')
        const { buffer } = await fs.readFile(path)
        return buffer
    }
}

async function loadFontFamily(path: FontPath): Promise<FontData> {
    if (is_string(path)) {
        return await loadFont(path)
    } else {
        return {
            regular: await loadFont(path.regular),
            bold: await loadFont(path.bold),
        }
    }
}

function parseFontFamily(data: FontData): FontEntry {
    if (data instanceof ArrayBuffer) {
        return parseFont(data)
    } else {
        return {
            regular: parseFont(data.regular),
            bold: parseFont(data.bold),
        }
    }
}

//
// load core fonts (vite resolves these as assets via static string analysis)
//

const FONT_PATHS: Record<string, FontPath> = {
    [sans]: {
        // @ts-ignore
        regular: (await import('./IBMPlexSans-Regular.ttf')).default,
        // @ts-ignore
        bold: (await import('./IBMPlexSans-Bold.ttf')).default,
    },
    [mono]: {
        // @ts-ignore
        regular: (await import('./IBMPlexMono-Regular.ttf')).default,
        // @ts-ignore
        bold: (await import('./IBMPlexMono-Bold.ttf')).default,
    },
    // @ts-ignore
    [moji]: (await import('./NotoEmoji-Variable.ttf')).default,
    // @ts-ignore
    'KaTeX_Math': (await import('katex/dist/fonts/KaTeX_Math-Italic.ttf')).default,
    // @ts-ignore
    'KaTeX_Main': (await import('katex/dist/fonts/KaTeX_Main-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_AMS': (await import('katex/dist/fonts/KaTeX_AMS-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size1': (await import('katex/dist/fonts/KaTeX_Size1-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size2': (await import('katex/dist/fonts/KaTeX_Size2-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size3': (await import('katex/dist/fonts/KaTeX_Size3-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size4': (await import('katex/dist/fonts/KaTeX_Size4-Regular.ttf')).default,
}

// load and parse font data
const FONT_DATA: Record<string, FontData> = await map_object_async(FONT_PATHS, loadFontFamily)
const FONTS: Record<string, FontEntry> = map_object(FONT_DATA, parseFontFamily)

//
// allow additional fonts to be loaded
//

async function registerFont(name: string, path: string) {
    FONT_PATHS[name] = path
    FONT_DATA[name] = await loadFont(path)
    FONTS[name] = parseFont(FONT_DATA[name])
}

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS, registerFont, FontPair, FontEntry }
