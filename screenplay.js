/**
 * Pure screenplay text engine: the block model shared by the Host tools and the
 * browser editor. No Node or DOM APIs, so it can be tested directly.
 *
 * Canonical storage is a list of typed blocks. Fountain-like text is the
 * interchange format used by the agent tool and by export.
 */

export const BLOCK_TYPES = [
  'scene',
  'action',
  'character',
  'parenthetical',
  'dialogue',
]

const TYPE_SET = new Set(BLOCK_TYPES)
const LEGACY_TYPE_SET = new Set(['transition', 'shot'])

/** Scene headings accepted without a forcing dot. */
const SCENE_AUTO =
  /^(?:\d{1,3}[A-Z]?(?:[.、]\s*|\s+))?(?:内景|外景|内外景|日景|夜景|晨景|黄昏|闪回|梦境|INT\b|EXT\b|I\/E\b|EST\b|INT\.\/EXT\b|EXT\.\/INT\b)/i

/** Transition-like lines are action text; this pattern only keeps them from
 * being read as character cues. */
const TRANSITION_AUTO =
  /^(?:切至|切到|转场|淡入|淡出|叠化|划像|划出|闪白|字幕|CUT TO|FADE (?:IN|OUT|TO)|DISSOLVE TO|SMASH CUT|MATCH CUT|TIME CUT)/i

/** A Chinese character cue on its own line, e.g. `林夏：`. */
const STANDALONE_CN_CUE = /^([^\s:：,，.。!！?？;；、()（）[\]【】"'“”‘’]{1,12})[：:]$/

const TITLE_KEYS = new Map([
  ['title', 'title'],
  ['标题', 'title'],
  ['author', 'author'],
  ['作者', 'author'],
  ['编剧', 'author'],
  ['draft date', null],
  ['contact', null],
  ['copyright', null],
  ['notes', null],
  ['source', null],
  ['日期', null],
])

const TITLE_LINE = /^([A-Za-z][A-Za-z ]{0,20}|标题|作者|编剧|日期)\s*[:：]\s*(.*)$/

const WIDE_CHAR =
  /[\u1100-\u115f\u2e80-\u2fdf\u3000-\u303f\u3040-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/

let counter = 0

/** A short unique block id that is stable for one process and readable. */
export function newBlockId() {
  counter = (counter + 1) % 1_000_000
  return `b-${Date.now().toString(36)}-${counter.toString(36)}`
}

/** Width of text in monospaced CJK units (a CJK glyph counts 1, Latin 0.55). */
export function visualWidth(text) {
  let width = 0
  for (const char of String(text ?? '')) width += WIDE_CHAR.test(char) ? 1 : 0.55
  return width
}

/** Number of CJK characters. */
function cjkCount(text) {
  let count = 0
  for (const char of text) if (WIDE_CHAR.test(char)) count += 1
  return count
}

/** Approximate physical lines one block occupies on a screenplay page. */
function blockLines(block) {
  const text = block.text.trim()
  if (!text) return block.type === 'scene' ? 2 : 1
  const width = visualWidth(text)
  switch (block.type) {
    case 'scene':
      return 1 + 1
    case 'action':
      return Math.max(1, Math.ceil(width / 40)) + 1
    case 'character':
      return 1
    case 'parenthetical':
      return Math.max(1, Math.ceil(width / 26))
    case 'dialogue':
      return Math.max(1, Math.ceil(width / 30)) + 0.6
    default:
      return 1
  }
}

/** Page, scene and word statistics for a document. */
export function statsOf(doc) {
  const blocks = Array.isArray(doc?.blocks) ? doc.blocks : []
  let scenes = 0
  let lines = 0
  let cjk = 0
  let latinWords = 0
  let content = false

  for (const block of blocks) {
    if (!block || typeof block.text !== 'string') continue
    const text = block.text.trim()
    if (!text) continue
    content = true
    if (block.type === 'scene') scenes += 1
    lines += blockLines(block)
    cjk += cjkCount(text)
    const words = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)
    if (words) latinWords += words.length
  }

  const pages = content ? Math.max(0.1, Math.round((lines / 43) * 10) / 10) : 0
  return { scenes, pages, chars: cjk, words: cjk + latinWords, blocks: blocks.length }
}

/** One-line description of the first scene (or first block) for library cards. */
export function subtitleOf(doc) {
  const blocks = Array.isArray(doc?.blocks) ? doc.blocks : []
  const scene = blocks.find((block) => block.type === 'scene' && block.text.trim())
  const first = scene || blocks.find((block) => block.text.trim())
  if (!first) return ''
  const text = first.text.trim().replace(/\s+/g, ' ')
  return text.length > 68 ? `${text.slice(0, 66)}…` : text
}

/** Whether a line reads as an English character cue. */
function isCapsCue(text) {
  const core = text.replace(/\s*[（(][^）)]*[）)]\s*$/, '').trim()
  if (!core || core.length > 48) return false
  if (!/[A-Z]/.test(core) || /[a-z]/.test(core)) return false
  if (/[.!?。！？,，;；:：]$/.test(core)) return false
  if (SCENE_AUTO.test(core) || TRANSITION_AUTO.test(core)) return false
  return true
}

/** A character cue only counts when something follows it before a blank line. */
function isCueAt(lines, index) {
  const next = lines[index + 1]
  return typeof next === 'string' && next.trim() !== ''
}

/**
 * Parse Fountain-like screenplay text into metadata and typed blocks.
 *
 * Supported forcing markers at line start: `.` scene, `@` character,
 * `!` action. Legacy `>` and `~` markers from older documents are kept as
 * action text.
 */
export function parseScreenplay(input) {
  const text = String(input ?? '').replace(/\r\n?/g, '\n')
  const lines = text.split('\n')
  const meta = { title: '', author: '' }
  const blocks = []

  let index = 0
  let first = 0
  while (first < lines.length && lines[first].trim() === '') first += 1

  // Fountain title page: a leading run of known `Key: value` lines.
  if (first < lines.length) {
    const match = TITLE_LINE.exec(lines[first].trim())
    if (match && TITLE_KEYS.has(match[1].toLowerCase())) {
      index = first
      while (index < lines.length) {
        const line = lines[index].trim()
        if (!line) {
          index += 1
          break
        }
        const page = TITLE_LINE.exec(line)
        if (!page) break
        const key = TITLE_KEYS.get(page[1].toLowerCase())
        if (key && page[2]) meta[key] = page[2].trim()
        index += 1
      }
    }
  }

  let dialogueOpen = false
  let lastType = null

  const add = (type, raw) => {
    if (!TYPE_SET.has(type)) return
    const value = String(raw ?? '').replace(/\s+$/, '')
    if (!value.trim()) return
    if (type === 'action' && lastType === 'action') {
      blocks[blocks.length - 1].text += `\n${value}`
    } else if (type === 'dialogue' && lastType === 'dialogue') {
      blocks[blocks.length - 1].text += `\n${value}`
    } else {
      blocks.push({ id: newBlockId(), type, text: value })
    }
    lastType = type
  }

  for (; index < lines.length; index += 1) {
    const raw = lines[index]
    const line = raw.trim()

    if (!line) {
      dialogueOpen = false
      lastType = null
      continue
    }

    // Forced markers.
    if (line.startsWith('.') && !line.startsWith('..')) {
      add('scene', line.slice(1).trim())
      dialogueOpen = false
      continue
    }
    if (line.startsWith('@')) {
      add('character', line.slice(1).trim())
      dialogueOpen = true
      continue
    }
    if (line.startsWith('>') || line.startsWith('~')) {
      add('action', line.slice(1).trim())
      dialogueOpen = false
      continue
    }
    if (line.startsWith('!')) {
      add('action', line.slice(1).trim())
      dialogueOpen = false
      continue
    }

    if (SCENE_AUTO.test(line)) {
      add('scene', line)
      dialogueOpen = false
      continue
    }

    if (!dialogueOpen) {
      const cnCue = STANDALONE_CN_CUE.exec(line)
      if (cnCue) {
        add('character', cnCue[1].trim())
        dialogueOpen = true
        continue
      }
      if (isCapsCue(line) && isCueAt(lines, index)) {
        add('character', line)
        dialogueOpen = true
        continue
      }
    }

    if (dialogueOpen) {
      if (/^[（(].*[）)]$/.test(line)) {
        add('parenthetical', line)
      } else {
        add('dialogue', line)
      }
      continue
    }

    add('action', line)
  }

  return { meta, blocks }
}

/** Whether an existing block would be recognized as a scene heading. */
function sceneNeedsDot(text) {
  return !SCENE_AUTO.test(text.trim())
}

/** Whether an existing block would be recognized as a character cue. */
function characterNeedsAt(text) {
  const value = text.trim()
  if (!value) return false
  return !(isCapsCue(value) && !/[：:]$/.test(value))
}

/** Whether an action line would be misread as another element. */
function actionNeedsBang(text) {
  const value = text.trim()
  if (!value) return false
  return (
    /^[.@>~!#]/.test(value) ||
    SCENE_AUTO.test(value) ||
    STANDALONE_CN_CUE.test(value) ||
    isCapsCue(value)
  )
}

/**
 * Serialize a document to Fountain-like text that parses back to the same blocks.
 * @param doc - `{ title, author, blocks }`
 * @param options.titlePage - include the `Title:`/`Author:` header (default true)
 */
export function toFountain(doc, options = {}) {
  const { titlePage = true } = options
  const out = []
  if (titlePage) {
    if (doc?.title) out.push(`Title: ${String(doc.title).trim()}`)
    if (doc?.author) out.push(`Author: ${String(doc.author).trim()}`)
    if (out.length) out.push('')
  }

  let previous = null
  for (const block of Array.isArray(doc?.blocks) ? doc.blocks : []) {
    if (!block || typeof block.text !== 'string' || !block.text.trim()) continue
    let line = block.text.replace(/\s+$/, '')
    switch (block.type) {
      case 'scene':
        if (sceneNeedsDot(line)) line = `.${line}`
        break
      case 'character':
        if (characterNeedsAt(line)) line = `@${line}`
        break
      case 'action':
        if (actionNeedsBang(line)) line = `!${line}`
        break
      default:
        // Legacy transition/shot blocks are serialized as forced action text.
        if (block.type === 'transition' || block.type === 'shot') line = `!${line}`
        break
    }
    const tight =
      (previous === 'character' || previous === 'parenthetical' || previous === 'dialogue') &&
      (block.type === 'parenthetical' || block.type === 'dialogue')
    if (out.length && !tight) out.push('')
    out.push(line)
    previous = block.type
  }

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`
}

/** Plain-text rendering for clipboard or `.txt` export. */
export function toPlainText(doc) {
  const out = []
  if (doc?.title) out.push(String(doc.title).trim())
  if (doc?.author) out.push(String(doc.author).trim())
  if (out.length) out.push('')
  for (const block of Array.isArray(doc?.blocks) ? doc.blocks : []) {
    if (!block || !String(block.text ?? '').trim()) continue
    out.push(String(block.text).replace(/\s+$/, ''))
    out.push('')
  }
  return `${out.join('\n').trimEnd()}\n`
}

/** Coerce arbitrary stored JSON into a safe document block list. */
export function normalizeBlocks(input, ids = newBlockId) {
  const blocks = []
  const seen = new Set()
  for (const item of Array.isArray(input) ? input : []) {
    if (!item) continue
    const type = TYPE_SET.has(item.type)
      ? item.type
      : LEGACY_TYPE_SET.has(item.type)
        ? 'action'
        : null
    if (!type) continue
    const text = typeof item.text === 'string' ? item.text : ''
    if (text.length > 200_000) continue
    const rawId = typeof item.id === 'string' ? item.id.slice(0, 80) : ''
    const id = rawId && !seen.has(rawId) ? rawId : ids()
    seen.add(id)
    blocks.push({ id, type, text })
    if (blocks.length >= 5_000) break
  }
  return blocks
}
