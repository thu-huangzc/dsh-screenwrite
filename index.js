/**
 * Screenplay studio — Host half.
 *
 * Owns the local screenplay library, the browser JSON API used by the panel,
 * and the `screenplay` agent tool. The browser panel never touches the file
 * system directly.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  newBlockId,
  normalizeBlocks,
  parseScreenplay,
  statsOf,
  subtitleOf,
  toFountain,
} from './screenplay.js'

export const name = 'screenplay'
export const inject = ['tools', 'webServer']

const API_PREFIX = '/screenplay-api'
const DATA_ROOT = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'screenplay')
const SCRIPT_DIR = join(DATA_ROOT, 'scripts')
const SAMPLE_PATH = fileURLToPath(new URL('./samples/night-shift.fountain', import.meta.url))
const SAMPLE_ID = 'sp-sample-night-shift'
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{3,63}$/
const MAX_BODY_BYTES = 4 * 1024 * 1024
const MAX_TEXT_BYTES = 2 * 1024 * 1024

let writeQueue = Promise.resolve()
let seedPromise = null

/** Serialize mutations so two saves cannot interleave on one document. */
function serialized(operation) {
  const next = writeQueue.then(operation, operation)
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

function newId() {
  return `sp-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
}

function nowIso() {
  return new Date().toISOString()
}

function validId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id)
}

function scriptPath(id) {
  return join(SCRIPT_DIR, `${id}.json`)
}

async function ensureDir() {
  await mkdir(SCRIPT_DIR, { recursive: true })
}

function cleanTitle(value, fallback = '未命名剧本') {
  const title = typeof value === 'string' ? value.trim() : ''
  return (title || fallback).slice(0, 160)
}

function cleanAuthor(value) {
  return (typeof value === 'string' ? value.trim() : '').slice(0, 120)
}

function cleanBlocks(value) {
  const blocks = normalizeBlocks(value)
  if (blocks.length === 0) {
    blocks.push({ id: newBlockId(), type: 'scene', text: '' })
  }
  return blocks
}

function textBytes(blocks) {
  let bytes = 0
  for (const block of blocks) bytes += Buffer.byteLength(block.text, 'utf8')
  return bytes
}

/** Read and validate one stored document. */
async function readScript(id) {
  if (!validId(id)) return null
  let raw
  try {
    raw = await readFile(scriptPath(id), 'utf8')
  } catch (error) {
    if (error && error.code === 'ENOENT') return null
    throw error
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  return {
    v: 1,
    id,
    title: cleanTitle(parsed.title),
    author: cleanAuthor(parsed.author),
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : nowIso(),
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
    blocks: cleanBlocks(parsed.blocks),
  }
}

async function writeScript(doc) {
  await ensureDir()
  const payload = { ...doc, v: 1, updatedAt: nowIso() }
  const path = scriptPath(doc.id)
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await rename(temporary, path)
  return payload
}

/**
 * A brand-new install should open onto something, not an empty shelf. The demo
 * script is seeded only while the library has no scripts at all, so an existing
 * library (and any writer who deletes the demo) is left alone.
 */
async function seedSample() {
  let text
  try {
    text = await readFile(SAMPLE_PATH, 'utf8')
  } catch {
    return
  }
  const parsed = parseScreenplay(text)
  await serialized(async () => {
    const entries = await readdir(SCRIPT_DIR).catch(() => [])
    if (entries.some((entry) => entry.endsWith('.json'))) return
    const stamp = nowIso()
    await writeScript({
      id: SAMPLE_ID,
      title: parsed.meta.title || 'Night Shift',
      author: parsed.meta.author || '',
      createdAt: stamp,
      updatedAt: stamp,
      blocks: parsed.blocks.length > 0 ? parsed.blocks : cleanBlocks([]),
    })
  })
}

function ensureReady() {
  if (!seedPromise) seedPromise = seedSample().catch(() => undefined)
  return seedPromise
}

async function listScripts() {
  await ensureDir()
  let entries
  try {
    entries = await readdir(SCRIPT_DIR, { withFileTypes: true })
  } catch {
    return []
  }
  const summaries = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const id = entry.name.slice(0, -5)
    if (!validId(id)) continue
    try {
      const doc = await readScript(id)
      if (!doc) continue
      summaries.push(summaryOf(doc))
    } catch {
      // One unreadable document never hides the rest of the library.
    }
  }
  summaries.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
  return summaries
}

function summaryOf(doc) {
  const stats = statsOf(doc)
  return {
    id: doc.id,
    title: doc.title,
    author: doc.author,
    subtitle: subtitleOf(doc),
    scenes: stats.scenes,
    pages: stats.pages,
    words: stats.words,
    blocks: stats.blocks,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function createDocument(input) {
  const meta = {}
  const blocks = []
  if (typeof input?.content === 'string' && input.content.trim()) {
    const parsed = parseScreenplay(input.content)
    blocks.push(...parsed.blocks)
    Object.assign(meta, parsed.meta)
  }
  if (textBytes(blocks) > MAX_TEXT_BYTES) {
    const error = new Error('Screenplay text is too large')
    error.statusCode = 413
    throw error
  }
  return {
    v: 1,
    id: newId(),
    title: cleanTitle(input?.title || meta.title),
    author: cleanAuthor(input?.author || meta.author),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    blocks: blocks.length ? cleanBlocks(blocks) : [{ id: newBlockId(), type: 'scene', text: '' }],
  }
}

/* ------------------------------------------------------------------ HTTP API */

function sendJson(response, status, value) {
  const body = JSON.stringify(value)
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Length', Buffer.byteLength(body))
  response.end(body)
}

function httpError(status, message) {
  const error = new Error(message)
  error.statusCode = status
  return error
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw httpError(413, 'Request body is too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw httpError(400, 'Request body must be valid JSON')
  }
}

async function routeApi(request, response) {
  try {
    await ensureReady()
    if (request.headers['x-screenplay'] !== '1') {
      throw httpError(403, 'Missing screenplay API header')
    }
    if (request.method === 'GET' && (request.url === API_PREFIX || request.url === `${API_PREFIX}/`)) {
      sendJson(response, 200, { ok: true })
      return
    }

    const url = new URL(request.url, 'http://localhost')
    const path = url.pathname.startsWith(API_PREFIX)
      ? url.pathname.slice(API_PREFIX.length)
      : ''

    if (path === '/scripts' || path === '/scripts/') {
      if (request.method === 'GET') {
        sendJson(response, 200, { scripts: await listScripts() })
        return
      }
      if (request.method === 'POST') {
        const body = await readJsonBody(request)
        const doc = createDocument(body)
        const saved = await serialized(() => writeScript(doc))
        sendJson(response, 201, { script: saved })
        return
      }
      throw httpError(405, 'Method not allowed')
    }

    const match = /^\/scripts\/([A-Za-z0-9-]+)\/?$/.exec(path)
    if (!match) throw httpError(404, 'Unknown screenplay endpoint')
    const id = match[1]
    if (!validId(id)) throw httpError(400, 'Invalid screenplay id')

    if (request.method === 'GET') {
      const doc = await readScript(id)
      if (!doc) throw httpError(404, 'Screenplay not found')
      sendJson(response, 200, { script: doc })
      return
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request)
      const result = await serialized(async () => {
        const current = await readScript(id)
        if (!current) throw httpError(404, 'Screenplay not found')
        if (!body.force && typeof body.baseUpdatedAt === 'string' && body.baseUpdatedAt !== current.updatedAt) {
          return { conflict: true, script: current }
        }
        const blocks = cleanBlocks(body.blocks ?? current.blocks)
        if (textBytes(blocks) > MAX_TEXT_BYTES) throw httpError(413, 'Screenplay text is too large')
        const next = {
          ...current,
          title: body.title === undefined ? current.title : cleanTitle(body.title),
          author: body.author === undefined ? current.author : cleanAuthor(body.author),
          blocks,
        }
        return { conflict: false, script: await writeScript(next) }
      })
      if (result.conflict) {
        sendJson(response, 409, { error: 'conflict', script: result.script })
        return
      }
      sendJson(response, 200, { script: result.script })
      return
    }

    if (request.method === 'DELETE') {
      const removed = await serialized(async () => {
        try {
          await unlink(scriptPath(id))
          return true
        } catch (error) {
          if (error && error.code === 'ENOENT') return false
          throw error
        }
      })
      if (!removed) throw httpError(404, 'Screenplay not found')
      sendJson(response, 200, { ok: true })
      return
    }

    throw httpError(405, 'Method not allowed')
  } catch (error) {
    const status = error && Number.isInteger(error.statusCode) ? error.statusCode : 500
    if (status === 500) {
      try {
        console.error('[screenplay] API failure', error)
      } catch {
        // Logging must not mask the response.
      }
    }
    if (!response.headersSent) {
      sendJson(response, status, { error: error instanceof Error ? error.message : 'Screenplay API failed' })
    }
  }
}

/* -------------------------------------------------------------- agent tool */

const TOOL_DESCRIPTION = [
  'Create, read and revise screenplays in the Screenplay studio shown in the DSH sidebar.',
  'Scripts are stored as typed screenplay blocks and exchanged as Fountain-like text.',
  'Use this tool whenever the user asks to write, continue, restructure or inspect a script, instead of pasting a whole script into chat.',
  'Actions: list, read, create, write (replace the whole body), append, rename, delete.',
  'The page has five elements: scene heading, action/description, character name, parenthetical, and dialogue.',
  'Scene headings may be Chinese (`内景 咖啡馆 - 日`) or English (`INT. COFFEE - DAY`). Put a character name on its own line, dialogue below it, and parentheticals in （）.',
  'Write the master scene: do not add scene numbers, transitions, or camera/shot directions. Only write what can be seen or heard; never write what a character thinks or realizes.',
  'Content markers: `.` forces a scene, `@` forces a character, `!` forces action.',
].join(' ')

const TOOL_PARAMETERS = {
  type: 'object',
  additionalProperties: false,
  properties: {
    action: {
      type: 'string',
      enum: ['list', 'read', 'create', 'write', 'append', 'rename', 'delete'],
      description: 'Operation to perform.',
    },
    id: {
      type: 'string',
      description: 'Screenplay id, as returned by list or create.',
    },
    title: {
      type: 'string',
      description: 'Title for create or rename.',
    },
    author: {
      type: 'string',
      description: 'Author credit for create or rename.',
    },
    content: {
      type: 'string',
      description:
        'Screenplay body in Fountain-like text for create, write or append. Blank lines separate blocks; a character cue is followed by its dialogue.',
    },
  },
  required: ['action'],
}

const TOOL_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean' },
    message: { type: 'string' },
  },
  required: ['ok', 'message'],
}

function requireId(args) {
  if (!validId(args.id)) {
    throw new Error('`id` must be a screenplay id from the list action')
  }
  return args.id
}

async function requireScript(id) {
  const doc = await readScript(id)
  if (!doc) throw new Error(`Screenplay ${id} was not found`)
  return doc
}

function formatWhen(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
}

function describeStats(doc) {
  const stats = statsOf(doc)
  return `${stats.scenes} 场 · 约 ${stats.pages} 页 · ${stats.words} 字`
}

function readMessage(doc) {
  const body = toFountain(doc, { titlePage: false }).trim()
  return [
    `《${doc.title}》${doc.author ? ` — ${doc.author}` : ''}`,
    `id: ${doc.id} · ${describeStats(doc)} · 更新于 ${formatWhen(doc.updatedAt)}`,
    '',
    body || '（空剧本）',
  ].join('\n')
}

async function runTool(args) {
  await ensureReady()
  const action = args && args.action
  if (typeof action !== 'string') throw new Error('`action` is required')

  if (action === 'list') {
    const scripts = await listScripts()
    if (scripts.length === 0) {
      return { ok: true, message: '剧本库为空。用 create 新建一份剧本。' }
    }
    const lines = scripts.map(
      (script, index) =>
        `${index + 1}. 《${script.title}》 — id ${script.id} — ${script.scenes} 场 · 约 ${script.pages} 页 — 更新于 ${formatWhen(script.updatedAt)}`,
    )
    return {
      ok: true,
      message: `剧本库（${scripts.length}）：\n${lines.join('\n')}`,
    }
  }

  if (action === 'read') {
    const doc = await requireScript(requireId(args))
    return { ok: true, message: readMessage(doc) }
  }

  if (action === 'create') {
    const doc = createDocument({
      title: args.title,
      author: args.author,
      content: args.content,
    })
    const saved = await serialized(() => writeScript(doc))
    return {
      ok: true,
      message: `已创建《${saved.title}》，id: ${saved.id}，${describeStats(saved)}。用 write 重写正文，或用 append 续写。`,
    }
  }

  if (action === 'write') {
    const id = requireId(args)
    if (typeof args.content !== 'string' || !args.content.trim()) {
      throw new Error('`content` is required for write')
    }
    const parsed = parseScreenplay(args.content)
    if (parsed.blocks.length === 0) throw new Error('`content` contains no screenplay text')
    if (textBytes(parsed.blocks) > MAX_TEXT_BYTES) throw new Error('Screenplay text is too large')
    const saved = await serialized(async () => {
      const current = await requireScript(id)
      const next = {
        ...current,
        title: cleanTitle(args.title || parsed.meta.title || current.title),
        author: cleanAuthor(args.author || parsed.meta.author || current.author),
        blocks: cleanBlocks(parsed.blocks),
      }
      return writeScript(next)
    })
    return {
      ok: true,
      message: `已更新《${saved.title}》，id: ${saved.id}，${describeStats(saved)}。`,
    }
  }

  if (action === 'append') {
    const id = requireId(args)
    if (typeof args.content !== 'string' || !args.content.trim()) {
      throw new Error('`content` is required for append')
    }
    const parsed = parseScreenplay(args.content)
    if (parsed.blocks.length === 0) throw new Error('`content` contains no screenplay text')
    const saved = await serialized(async () => {
      const current = await requireScript(id)
      const blocks = [...current.blocks, ...parsed.blocks]
      if (blocks.length > 5_000) throw new Error('Screenplay has too many blocks')
      if (textBytes(blocks) > MAX_TEXT_BYTES) throw new Error('Screenplay text is too large')
      return writeScript({ ...current, blocks })
    })
    return {
      ok: true,
      message: `已向《${saved.title}》追加 ${parsed.blocks.length} 个段落，现共 ${describeStats(saved)}。`,
    }
  }

  if (action === 'rename') {
    const id = requireId(args)
    if (args.title === undefined && args.author === undefined) {
      throw new Error('rename needs `title` and/or `author`')
    }
    const saved = await serialized(async () => {
      const current = await requireScript(id)
      return writeScript({
        ...current,
        title: args.title === undefined ? current.title : cleanTitle(args.title),
        author: args.author === undefined ? current.author : cleanAuthor(args.author),
      })
    })
    return { ok: true, message: `已重命名为《${saved.title}》${saved.author ? `，作者 ${saved.author}` : ''}。` }
  }

  if (action === 'delete') {
    const id = requireId(args)
    const doc = await requireScript(id)
    await serialized(() => unlink(scriptPath(id)))
    return { ok: true, message: `已删除《${doc.title}》（id: ${doc.id}）。` }
  }

  throw new Error(`Unknown action: ${String(action)}`)
}

function buildToolDefinition() {
  return {
    name: 'screenplay',
    description: TOOL_DESCRIPTION,
    parameters: TOOL_PARAMETERS,
    output: {
      schema: TOOL_OUTPUT_SCHEMA,
      render: (_args, value) => [
        { type: 'text', text: value && typeof value.message === 'string' ? value.message : '' },
      ],
    },
    execute: (args) => runTool(args),
    presentCall: (args) => ({
      card: 'generic',
      title: args && args.action ? `Screenplay · ${args.action}` : 'Screenplay',
      kind: 'other',
      rawInput: args && args.id ? { id: args.id } : undefined,
    }),
  }
}

const PROMPT_SECTION = {
  name: 'screenplay:studio',
  order: 700,
  text: [
    '## Screenplay studio',
    'A local screenplay library is available in the DSH sidebar (剧本工坊). When the request involves a script — writing, continuing, restructuring, or reviewing — work in that library with the `screenplay` tool. Read the current script before rewriting it, and prefer targeted write/append edits over pasting the whole script into chat.',
    'Use a five-element page: scene heading, action/description, character name, parenthetical, dialogue. Fountain-like title page: `Title:`/`Author:`. Scene headings may be `内景 咖啡馆 - 日` or `INT. COFFEE - DAY`; action in present tense; a character name on its own line with dialogue beneath; parentheticals in （）.',
    'Write the master scene, not a shot list: no scene numbers, no transitions, no camera/shot language. Only what can be seen or heard — never what a character thinks or realizes. Action over talk; keep it concise and specific.',
    'Craft: give each scene a want, an obstacle and a turn; enter late and leave early; make dialogue specific to the character. A feature draft is about 100 pages. Reply to the user in their language, and describe changes by scene rather than reciting the whole script.',
  ].join('\n'),
}

/* -------------------------------------------------------------------- plugin */

export function apply(ctx) {
  ctx.effect(() => ctx.tools.register(buildToolDefinition()))

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler: routeApi,
    }),
  )

  const prompt = ctx.get('systemPrompt')
  if (prompt && typeof prompt.section === 'function') {
    ctx.effect(() => prompt.section(PROMPT_SECTION))
  }
}
