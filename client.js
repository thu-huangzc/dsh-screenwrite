window.__ModuleLoader__.load({
  id: 'dsh-screenplay',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = React

    const NS = 'screenplay'
    const API = '/screenplay-api'
    // Survives a panel switch in this browser session, so returning to the
    // studio reopens the script the writer was on.
    let lastOpenId = null
    const TYPES = ['scene', 'action', 'character', 'parenthetical', 'dialogue']
    const TYPE_SET = new Set(TYPES)
    const NEXT_TYPE = {
      scene: 'action',
      action: 'action',
      character: 'dialogue',
      parenthetical: 'dialogue',
      dialogue: 'character',
    }
    const CYCLE = ['scene', 'action', 'character', 'parenthetical', 'dialogue']

    function cycleType(type, direction) {
      const index = CYCLE.indexOf(type)
      if (index < 0) return 'action'
      return CYCLE[(index + direction + CYCLE.length) % CYCLE.length]
    }

    // Each element also answers to its own Option/Alt + digit, so a writer can
    // land on a form directly instead of tabbing through the cycle. Tab keeps
    // cycling for the usual flow — the two live side by side.
    const TYPE_SHORTCUT = {
      Digit1: 'scene',
      Digit2: 'action',
      Digit3: 'character',
      Digit4: 'parenthetical',
      Digit5: 'dialogue',
    }

    const IS_MAC = (() => {
      try {
        return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '')
      } catch {
        return false
      }
    })()
    const MOD_LABEL = IS_MAC ? '⌥' : 'Alt+'

    /** The element a key chord asks for, or null. Uses `code` so macOS's
     * Option+digit characters (¡ ™ £ ¢ ∞) never matter. */
    function shortcutType(event) {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null
      const code = String(event.code || '').replace(/^Numpad/, 'Digit')
      return TYPE_SHORTCUT[code] || null
    }

    const DICT = {
      zh: {
        nav: '剧本',
        title: '剧本工坊',
        libraryTitle: '剧本库',
        librarySub: '本地自动保存，发挥想象，尽情创作',
        newScript: '新建剧本',
        titlePlaceholder: '标题',
        authorPlaceholder: '编剧 / 作者',
        create: '创建',
        cancel: '取消',
        emptyLibrary: '还没有剧本',
        emptyLibraryHint: '新建一份，或让 Agent 用 screenplay 工具为你起稿。',
        emptyScriptTitle: '未命名剧本',
        noAuthor: '未署名',
        scenes: '场',
        pagesUnit: '页',
        wordsUnit: '字',
        confirmDelete: '确认删除',
        delete: '删除',
        back: '返回剧本库',
        saving: '保存中…',
        saved: '已保存',
        saveError: '保存失败',
        unsaved: '未保存',
        conflict: '有冲突',
        conflictTitle: '这份剧本已在别处更新',
        conflictHint: 'Agent 或其他窗口写入了新版本。重新载入会放弃你尚未保存的修改。',
        reload: '重新载入',
        keepMine: '保留我的版本',
        format: '格式',
        scene: '场景',
        action: '动作/描述',
        character: '角色名',
        parenthetical: '括号',
        dialogue: '对白',
        tabHint: 'Tab 循环要素 · {mod}1–5 直达 · Enter 下一段',
        addScene: '添加场景',
        noScenes: '还没有场景',
        untitledScene: '未命名场景',
        export: '导出',
        exportPdf: '打印 / 存为 PDF',
        exportFountain: 'Fountain (.fountain)',
        exportTxt: '纯文本 (.txt)',
        exportHtml: '网页 (.html)',
        popupBlocked: '浏览器拦截了打印窗口，请允许弹窗后重试。',
        loadError: '剧本库加载失败',
        refresh: '刷新',
        retry: '重试',
        startWriting: '写下第一场',
        ph_scene: '内景 咖啡馆 - 日',
        ph_action: '描述看到的、听到的。',
        ph_character: '角色名',
        ph_parenthetical: '（低声）',
        ph_dialogue: '台词',
      },
      en: {
        nav: 'Scripts',
        title: 'Screenplay studio',
        libraryTitle: 'Library',
        librarySub: 'Local autosave — imagine freely, and write.',
        newScript: 'New screenplay',
        titlePlaceholder: 'Title',
        authorPlaceholder: 'Writer',
        create: 'Create',
        cancel: 'Cancel',
        emptyLibrary: 'No screenplays yet',
        emptyLibraryHint: 'Create one, or ask the agent to draft with the screenplay tool.',
        emptyScriptTitle: 'Untitled screenplay',
        noAuthor: 'Uncredited',
        scenes: 'scenes',
        pagesUnit: 'pages',
        wordsUnit: 'words',
        confirmDelete: 'Delete?',
        delete: 'Delete',
        back: 'Back to library',
        saving: 'Saving…',
        saved: 'Saved',
        saveError: 'Save failed',
        unsaved: 'Unsaved',
        conflict: 'Conflict',
        conflictTitle: 'This script changed elsewhere',
        conflictHint: 'The agent or another window wrote a newer version. Reloading discards your unsaved edits.',
        reload: 'Reload',
        keepMine: 'Keep mine',
        format: 'Format',
        scene: 'Scene',
        action: 'Action / description',
        character: 'Character name',
        parenthetical: 'Parenthetical',
        dialogue: 'Dialogue',
        tabHint: 'Tab cycles · {mod}1–5 jumps to a form · Enter next block',
        addScene: 'Add scene',
        noScenes: 'No scenes yet',
        untitledScene: 'Untitled scene',
        export: 'Export',
        exportPdf: 'Print / Save as PDF',
        exportFountain: 'Fountain (.fountain)',
        exportTxt: 'Plain text (.txt)',
        exportHtml: 'Web page (.html)',
        popupBlocked: 'The browser blocked the print window. Allow pop-ups and retry.',
        loadError: 'Could not load the library',
        refresh: 'Refresh',
        retry: 'Retry',
        startWriting: 'Write the first scene',
        ph_scene: 'INT. COFFEE SHOP - DAY',
        ph_action: 'Describe what is seen and heard.',
        ph_character: 'CHARACTER',
        ph_parenthetical: '(whispering)',
        ph_dialogue: 'Dialogue',
      },
    }

    /* ------------------------------------------------------------- utilities */

    const WIDE_CHAR =
      /[\u1100-\u115f\u2e80-\u2fdf\u3000-\u303f\u3040-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/

    const SCENE_AUTO =
      /^(?:\d{1,3}[A-Z]?(?:[.、]\s*|\s+))?(?:内景|外景|内外景|日景|夜景|晨景|黄昏|闪回|梦境|INT\b|EXT\b|I\/E\b|EST\b|INT\.\/EXT\b|EXT\.\/INT\b)/i
    const TRANSITION_AUTO =
      /^(?:切至|切到|转场|淡入|淡出|叠化|划像|划出|闪白|字幕|CUT TO|FADE (?:IN|OUT|TO)|DISSOLVE TO|SMASH CUT|MATCH CUT|TIME CUT)/i

    function visualWidth(text) {
      let width = 0
      for (const char of String(text || '')) width += WIDE_CHAR.test(char) ? 1 : 0.55
      return width
    }

    function isWide(char) {
      return WIDE_CHAR.test(char)
    }

    function blockLines(block) {
      const text = String(block.text || '').trim()
      if (!text) return block.type === 'scene' ? 2 : 1
      const width = visualWidth(text)
      if (block.type === 'scene') return 2
      if (block.type === 'action') return Math.max(1, Math.ceil(width / 40)) + 1
      if (block.type === 'character') return 1
      if (block.type === 'parenthetical') return Math.max(1, Math.ceil(width / 26))
      if (block.type === 'dialogue') return Math.max(1, Math.ceil(width / 30)) + 0.6
      return 1
    }

    function statsOf(doc) {
      const blocks = doc && Array.isArray(doc.blocks) ? doc.blocks : []
      let scenes = 0
      let lines = 0
      let cjk = 0
      let latin = 0
      let content = false
      for (const block of blocks) {
        const text = String(block.text || '').trim()
        if (!text) continue
        content = true
        if (block.type === 'scene') scenes += 1
        lines += blockLines(block)
        for (const char of text) if (isWide(char)) cjk += 1
        const words = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)
        if (words) latin += words.length
      }
      return {
        scenes,
        pages: content ? Math.max(0.1, Math.round((lines / 43) * 10) / 10) : 0,
        words: cjk + latin,
        blocks: blocks.length,
      }
    }

    function summaryFromScript(script) {
      const stats = statsOf(script)
      return {
        id: script.id,
        title: script.title,
        author: script.author,
        scenes: stats.scenes,
        pages: stats.pages,
        words: stats.words,
        blocks: stats.blocks,
        createdAt: script.createdAt,
        updatedAt: script.updatedAt,
      }
    }

    function newBlockId() {
      return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    }

    /** Old documents may contain transition/shot blocks; they become action text. */
    function normalizeDoc(script) {
      if (!script || !Array.isArray(script.blocks)) return script
      let changed = false
      const blocks = script.blocks.map((block) => {
        if (block && TYPE_SET.has(block.type)) return block
        changed = true
        return { ...(block || {}), type: 'action' }
      })
      return changed ? { ...script, blocks } : script
    }

    function formatDate(iso, lang) {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })
      } catch {
        return ''
      }
    }

    function slug(title) {
      return (
        String(title || 'screenplay')
          .replace(/[\\/:*?"<>|\s]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60) || 'screenplay'
      )
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    function needsSceneDot(text) {
      return !SCENE_AUTO.test(String(text || '').trim())
    }

    function isCapsCue(text) {
      const core = String(text || '')
        .replace(/\s*[（(][^）)]*[）)]\s*$/, '')
        .trim()
      if (!core || core.length > 48) return false
      if (!/[A-Z]/.test(core) || /[a-z]/.test(core)) return false
      if (/[.!?。！？,，;；:：]$/.test(core)) return false
      if (SCENE_AUTO.test(core) || TRANSITION_AUTO.test(core)) return false
      return true
    }

    function needsCharacterAt(text) {
      const value = String(text || '').trim()
      return !(isCapsCue(value) && !/[：:]$/.test(value))
    }

    function actionNeedsBang(text) {
      const value = String(text || '').trim()
      if (!value) return false
      return (
        /^[.@>~!#]/.test(value) ||
        SCENE_AUTO.test(value) ||
        /^[^\s:：,，.。!！?？;；、()（）[\]【】"'“”‘’]{1,12}[：:]$/.test(value) ||
        isCapsCue(value)
      )
    }

    function toFountain(doc) {
      const out = []
      if (doc.title) out.push(`Title: ${String(doc.title).trim()}`)
      if (doc.author) out.push(`Author: ${String(doc.author).trim()}`)
      if (out.length) out.push('')
      let previous = null
      for (const block of Array.isArray(doc.blocks) ? doc.blocks : []) {
        if (!block || !String(block.text || '').trim()) continue
        let line = String(block.text).replace(/\s+$/, '')
        if (block.type === 'scene' && needsSceneDot(line)) line = `.${line}`
        else if (block.type === 'character' && needsCharacterAt(line)) line = `@${line}`
        else if (block.type === 'action' && actionNeedsBang(line)) line = `!${line}`
        else if (block.type === 'transition' || block.type === 'shot') line = `!${line}`
        const tight =
          (previous === 'character' || previous === 'parenthetical' || previous === 'dialogue') &&
          (block.type === 'parenthetical' || block.type === 'dialogue')
        if (out.length && !tight) out.push('')
        out.push(line)
        previous = block.type
      }
      return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`
    }

    function toPlain(doc) {
      const out = []
      if (doc.title) out.push(String(doc.title).trim())
      if (doc.author) out.push(String(doc.author).trim())
      if (out.length) out.push('')
      for (const block of Array.isArray(doc.blocks) ? doc.blocks : []) {
        if (!String(block.text || '').trim()) continue
        out.push(String(block.text).replace(/\s+$/, ''))
        out.push('')
      }
      return `${out.join('\n').trimEnd()}\n`
    }

    function toHtml(doc) {
      const title = escapeHtml(doc.title || 'Screenplay')
      const author = escapeHtml(doc.author || '')
      const blocks = (Array.isArray(doc.blocks) ? doc.blocks : [])
        .filter((block) => String(block.text || '').trim())
        .map((block) => {
          const text = escapeHtml(block.text).replace(/\n/g, '<br/>')
          return `<div class="block ${block.type}">${text}</div>`
        })
        .join('\n')
      return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title><style>
@page { size: Letter; margin: 1in 1in 1in 1.5in; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; background: #fff; font-family: "Courier Prime", "Courier New", "Songti SC", "Noto Serif SC", "STSong", serif; font-size: 12pt; line-height: 1.2; }
.title-page { min-height: 9in; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; }
.title-page h1 { margin: 0 0 8mm; font-size: 24pt; font-weight: 600; letter-spacing: .02em; }
.title-page p { margin: 0; font-size: 12pt; color: #333; }
.block { white-space: pre-wrap; }
.scene { margin: 16pt 0 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
.action { margin: 6pt 0; }
.character { margin: 12pt 0 0; text-align: center; font-weight: 600; letter-spacing: .04em; }
.parenthetical { margin: 1pt 16% 0; text-align: center; color: #333; }
.dialogue { margin: 1pt 16% 9pt; }
</style></head><body>
<div class="title-page"><h1>${title}</h1>${author ? `<p>${author}</p>` : ''}</div>
${blocks}
</body></html>`
    }

    function download(name, text, type) {
      const blob = new Blob([text], { type })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = name
      anchor.rel = 'noopener'
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    }

    function printDocument(doc) {
      const win = window.open('', '_blank')
      if (!win) return false
      try {
        win.document.open()
        win.document.write(toHtml(doc))
        win.document.close()
        win.focus()
        setTimeout(() => {
          try {
            win.print()
          } catch {
            // The print dialog can be unavailable; the document stays open.
          }
        }, 350)
        return true
      } catch {
        return false
      }
    }

    async function request(path, options) {
      const init = {
        method: (options && options.method) || 'GET',
        headers: { 'x-screenplay': '1' },
        cache: 'no-store',
      }
      if (options && options.body !== undefined) {
        init.body = options.body
        init.headers['content-type'] = 'application/json'
      }
      const response = await fetch(API + path, init)
      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }
      if (!response.ok) {
        const error = new Error((data && data.error) || response.statusText || 'Request failed')
        error.status = response.status
        error.data = data
        throw error
      }
      return data
    }

    function navLabel(ctx) {
      try {
        const active = String(ctx.locale.getLocale().active || '')
        return /^en/i.test(active) ? DICT.en.nav : DICT.zh.nav
      } catch {
        return DICT.zh.nav
      }
    }

    /* ----------------------------------------------------------------- icons */

    function Glyph({ name, size = 16 }) {
      const base = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      }
      if (name === 'plus') return h('svg', base, h('path', { d: 'M12 5v14M5 12h14' }))
      if (name === 'back') return h('svg', base, h('path', { d: 'M15 5l-7 7 7 7' }))
      if (name === 'trash')
        return h(
          'svg',
          base,
          h('path', { d: 'M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12' }),
          h('path', { d: 'M10 11v4M14 11v4' }),
        )
      if (name === 'download') return h('svg', base, h('path', { d: 'M12 4v10M8 10l4 4 4-4M5 19h14' }))
      if (name === 'print')
        return h(
          'svg',
          base,
          h('path', { d: 'M7 8V4h10v4M7 17H5a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2' }),
          h('rect', { x: 7, y: 13, width: 10, height: 7, rx: 1 }),
        )
      if (name === 'chevron') return h('svg', base, h('path', { d: 'M6 9l6 6 6-6' }))
      if (name === 'check') return h('svg', base, h('path', { d: 'M5 12.5l4.2 4.2L19 7' }))
      if (name === 'refresh')
        return h('svg', base, h('path', { d: 'M19 12a7 7 0 1 1-2.1-5M19 4v5h-5' }))
      if (name === 'alert')
        return h('svg', base, h('path', { d: 'M12 4l9 16H3z' }), h('path', { d: 'M12 10v4M12 17h.01' }))
      if (name === 'film')
        return h(
          'svg',
          base,
          h('rect', { x: 3.5, y: 6, width: 17, height: 12, rx: 2 }),
          h('path', { d: 'M3.8 9.4h16.4M8.5 6l2 3.4M13 6l2 3.4M17.5 6l2 3.4' }),
        )
      return h('svg', base, h('circle', { cx: 12, cy: 12, r: 8 }))
    }

    function NavIcon({ size, active, label }) {
      const edge = size || 18
      return h(
        'svg',
        {
          width: edge,
          height: edge,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('rect', {
          x: 4.4,
          y: 3.4,
          width: 15.2,
          height: 17.2,
          rx: 2.2,
          stroke: 'currentColor',
          strokeWidth: active ? 1.9 : 1.6,
          opacity: active ? 1 : 0.85,
        }),
        h('path', { d: 'M7.2 8.2h9.6', stroke: 'currentColor', strokeWidth: 1.4, opacity: 0.55 }),
        h('path', { d: 'M7.6 12h8.4M7.6 15.4h5.6', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.8 }),
        label ? h('title', null, label) : null,
      )
    }

    /* --------------------------------------------------------------- controls */

    function ExportMenu({ t, doc, onNotify }) {
      const [open, setOpen] = useState(false)

      useEffect(() => {
        if (!open) return undefined
        const close = () => setOpen(false)
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
      }, [open])

      const run = (operation) => {
        setOpen(false)
        operation()
      }

      const items = [
        {
          key: 'pdf',
          icon: 'print',
          label: t('exportPdf'),
          action: () => {
            if (!printDocument(doc)) onNotify(t('popupBlocked'))
          },
        },
        {
          key: 'fountain',
          icon: 'download',
          label: t('exportFountain'),
          action: () => download(`${slug(doc.title)}.fountain`, toFountain(doc), 'text/plain;charset=utf-8'),
        },
        {
          key: 'txt',
          icon: 'download',
          label: t('exportTxt'),
          action: () => download(`${slug(doc.title)}.txt`, toPlain(doc), 'text/plain;charset=utf-8'),
        },
        {
          key: 'html',
          icon: 'download',
          label: t('exportHtml'),
          action: () => download(`${slug(doc.title)}.html`, toHtml(doc), 'text/html;charset=utf-8'),
        },
      ]

      return h(
        'div',
        { className: 'sw-menu-wrap', onMouseDown: (event) => event.stopPropagation() },
        h(
          'button',
          {
            type: 'button',
            className: 'sw-btn',
            onClick: () => setOpen((value) => !value),
            'aria-haspopup': 'menu',
            'aria-expanded': open,
          },
          h(Glyph, { name: 'download' }),
          t('export'),
          h(Glyph, { name: 'chevron', size: 12 }),
        ),
        open
          ? h(
              'div',
              { className: 'sw-menu', role: 'menu' },
              items.map((item) =>
                h(
                  'button',
                  {
                    key: item.key,
                    type: 'button',
                    role: 'menuitem',
                    className: 'sw-menu-item',
                    onClick: () => run(item.action),
                  },
                  h(Glyph, { name: item.icon }),
                  item.label,
                ),
              ),
            )
          : null,
      )
    }

    const BlockEditor = React.memo(function BlockEditor({ block, t, onText, onType, onSplit, onMerge, onMove, onFocus, onSave, register }) {
      const ref = useRef(null)

      const resize = useCallback(() => {
        const element = ref.current
        if (!element) return
        element.style.height = '0px'
        element.style.height = `${element.scrollHeight}px`
      }, [])

      useLayoutEffect(() => {
        resize()
      }, [block.text, block.type, resize])

      useEffect(() => {
        const listener = () => resize()
        window.addEventListener('resize', listener)
        return () => window.removeEventListener('resize', listener)
      }, [resize])

      const keydown = (event) => {
        // Never split or cycle while an IME is composing (Chinese/Japanese input).
        if (event.nativeEvent && (event.nativeEvent.isComposing || event.keyCode === 229)) return
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault()
          onSave()
          return
        }
        if (event.key === 'Tab') {
          event.preventDefault()
          const target = cycleType(block.type, event.shiftKey ? -1 : 1)
          onType(block.id, target || 'action', event.currentTarget.selectionStart)
          return
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          const element = event.currentTarget
          const start = element.selectionStart
          const end = element.selectionEnd
          onSplit(block.id, block.text.slice(0, start), block.text.slice(end))
          return
        }
        if (
          event.key === 'Backspace' &&
          event.currentTarget.selectionStart === 0 &&
          event.currentTarget.selectionEnd === 0
        ) {
          event.preventDefault()
          onMerge(block.id)
          return
        }
        if (
          event.key === 'ArrowUp' &&
          event.currentTarget.selectionStart === 0 &&
          event.currentTarget.selectionEnd === 0
        ) {
          event.preventDefault()
          onMove(block.id, -1)
          return
        }
        if (
          event.key === 'ArrowDown' &&
          event.currentTarget.selectionStart === block.text.length &&
          event.currentTarget.selectionEnd === block.text.length
        ) {
          event.preventDefault()
          onMove(block.id, 1)
        }
      }

      return h(
        'div',
        { className: `sw-block sw-block--${block.type}`, 'data-block-id': block.id },
        h('textarea', {
          ref: (element) => {
            ref.current = element
            register(block.id, element)
          },
          className: 'sw-input',
          value: block.text,
          rows: 1,
          placeholder: t(`ph_${block.type}`),
          spellCheck: false,
          'aria-label': t(block.type),
          onChange: (event) => onText(block.id, event.target.value),
          onFocus: () => onFocus(block.id),
          onKeyDown: keydown,
        }),
      )
    })

    /** Non-editing block: plain text. Only the focused block mounts a textarea,
     * which keeps a hundred-page script light enough to open and scroll. */
    const BlockView = React.memo(function BlockView({ block, t, onEdit }) {
      const empty = !block.text.trim()
      return h(
        'div',
        { className: `sw-block sw-block--${block.type}`, 'data-block-id': block.id },
        h(
          'div',
          {
            className: `sw-view${empty ? ' sw-view--empty' : ''}`,
            'aria-label': t(block.type),
            'aria-readonly': true,
            onClick: () => onEdit(block.id),
          },
          empty ? t(`ph_${block.type}`) : block.text,
        ),
      )
    })

    /* ------------------------------------------------------------------ studio */

    function Studio(props) {
      const ctx = props.__ctx
      const [localeTick, setLocaleTick] = useState(0)

      useEffect(() => {
        let dispose = null
        try {
          dispose = ctx.locale.subscribe(() => setLocaleTick((value) => value + 1))
        } catch {
          dispose = null
        }
        return () => {
          if (typeof dispose === 'function') dispose()
        }
      }, [ctx])

      const lang = useMemo(() => {
        try {
          return /^en/i.test(String(ctx.locale.getLocale().active || '')) ? 'en' : 'zh'
        } catch {
          return 'zh'
        }
      }, [ctx, localeTick])

      const t = useCallback(
        (key) => {
          const dict = DICT[lang] || DICT.zh
          return dict[key] !== undefined ? dict[key] : DICT.zh[key] !== undefined ? DICT.zh[key] : key
        },
        [lang],
      )

      const [phase, setPhase] = useState('loading')
      const [loadError, setLoadError] = useState('')
      const [scripts, setScripts] = useState([])
      const [doc, setDoc] = useState(null)
      const [selectedId, setSelectedId] = useState(null)
      const [editingId, setEditingId] = useState(null)
      const [status, setStatus] = useState('saved')
      const [creating, setCreating] = useState(false)
      const [newTitle, setNewTitle] = useState('')
      const [newAuthor, setNewAuthor] = useState('')
      const [busy, setBusy] = useState(false)
      const [confirmId, setConfirmId] = useState(null)
      const [conflict, setConflict] = useState(null)
      const [toast, setToast] = useState('')
      const [focusTick, setFocusTick] = useState(0)
      // Scene number the paper is currently showing; 0 until the first measurement.
      const [viewScene, setViewScene] = useState(0)

      const docRef = useRef(null)
      const baseRef = useRef('')
      const dirtyRef = useRef(false)
      const pendingRef = useRef(null)
      const timerRef = useRef(null)
      const savingRef = useRef(false)
      const toastTimer = useRef(null)
      const inputRefs = useRef(new Map())
      const focusReq = useRef(null)
      const saveFnRef = useRef(null)
      const mountedRef = useRef(true)
      const pageWrapRef = useRef(null)
      const railListRef = useRef(null)
      const railItemRefs = useRef(new Map())
      const spyRaf = useRef(0)
      const spyHoldUntil = useRef(0)

      useEffect(() => {
        mountedRef.current = true
        return () => {
          // A panel switch unmounts the studio; commit the last debounced edit.
          if (dirtyRef.current && saveFnRef.current) {
            try {
              saveFnRef.current()
            } catch {
              // The document remains on disk at its previous revision.
            }
          }
          mountedRef.current = false
          clearTimeout(timerRef.current)
          clearTimeout(toastTimer.current)
        }
      }, [])

      const showToast = useCallback((message) => {
        setToast(message)
        clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => {
          if (mountedRef.current) setToast('')
        }, 2800)
      }, [])

      const refreshList = useCallback(async () => {
        try {
          const data = await request('/scripts')
          if (!mountedRef.current) return
          setScripts(Array.isArray(data.scripts) ? data.scripts : [])
        } catch (error) {
          if (!mountedRef.current) return
          if (!docRef.current) {
            setLoadError(error.message)
            setPhase('error')
          }
        }
      }, [])

      useEffect(() => {
        let alive = true
        request('/scripts')
          .then((data) => {
            if (!alive) return
            const list = Array.isArray(data.scripts) ? data.scripts : []
            setScripts(list)
            setPhase('ready')
            if (lastOpenId) {
              if (list.some((script) => script.id === lastOpenId)) openScript({ id: lastOpenId })
              else lastOpenId = null
            }
          })
          .catch((error) => {
            if (!alive) return
            setLoadError(error.message)
            setPhase('error')
          })
        return () => {
          alive = false
        }
      }, [])

      const requestFocus = useCallback((id, caret) => {
        setEditingId(id)
        focusReq.current = { id, caret: caret === undefined ? 0 : caret }
        setFocusTick((value) => value + 1)
      }, [])

      useEffect(() => {
        const target = focusReq.current
        if (!target) return
        focusReq.current = null
        const element = inputRefs.current.get(target.id)
        if (!element) return
        try {
          element.focus({ preventScroll: true })
        } catch {
          element.focus()
        }
        const position =
          target.caret === 'end' ? element.value.length : Math.min(target.caret || 0, element.value.length)
        try {
          element.setSelectionRange(position, position)
        } catch {
          // Selection can fail for a detached node.
        }
        const row = element.closest('.sw-block')
        if (row) row.scrollIntoView({ block: 'nearest' })
      }, [focusTick])

      const registerInput = useCallback((id, element) => {
        if (element) inputRefs.current.set(id, element)
        else inputRefs.current.delete(id)
      }, [])

      const applyLocal = useCallback((next) => {
        docRef.current = next
        pendingRef.current = next
        dirtyRef.current = true
        setDoc(next)
        setStatus('dirty')
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          if (saveFnRef.current) saveFnRef.current()
        }, 900)
      }, [])

      const saveDocument = useCallback(
        async (options = {}) => {
          const target = pendingRef.current
          if (!target) return true
          if (!dirtyRef.current && !options.force) return true
          if (savingRef.current) return true
          savingRef.current = true
          clearTimeout(timerRef.current)
          setStatus('saving')
          let succeeded = false
          try {
            const data = await request(`/scripts/${target.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                title: target.title,
                author: target.author,
                blocks: target.blocks,
                baseUpdatedAt: baseRef.current,
                force: Boolean(options.force),
              }),
            })
            const saved = data.script
            baseRef.current = saved.updatedAt
            const stillCurrent = pendingRef.current === target
            if (stillCurrent) {
              pendingRef.current = null
              dirtyRef.current = false
              if (mountedRef.current) setStatus('saved')
            } else if (mountedRef.current) {
              setStatus('dirty')
            }
            succeeded = true
            if (mountedRef.current) {
              setDoc((previous) =>
                previous && previous.id === saved.id
                  ? { ...previous, createdAt: saved.createdAt, updatedAt: saved.updatedAt }
                  : previous,
              )
              setScripts((previous) =>
                previous.map((item) => (item.id === saved.id ? summaryFromScript(saved) : item)),
              )
              setConflict(null)
            }
            return true
          } catch (error) {
            if (!mountedRef.current) return false
            if (error.status === 409 && error.data && error.data.script) {
              setConflict({ remote: error.data.script })
              setStatus('conflict')
            } else {
              setStatus('error')
              showToast(`${t('saveError')}：${error.message}`)
            }
            return false
          } finally {
            savingRef.current = false
            if (
              succeeded &&
              mountedRef.current &&
              dirtyRef.current &&
              pendingRef.current &&
              pendingRef.current !== target
            ) {
              clearTimeout(timerRef.current)
              timerRef.current = setTimeout(() => {
                if (saveFnRef.current) saveFnRef.current()
              }, 400)
            }
          }
        },
        [showToast, t],
      )

      saveFnRef.current = saveDocument
      const saveNow = useCallback(() => {
        saveDocument()
      }, [saveDocument])

      const openDoc = useCallback(
        (script) => {
          const normalized = normalizeDoc(script)
          docRef.current = normalized
          baseRef.current = normalized.updatedAt
          dirtyRef.current = false
          pendingRef.current = null
          lastOpenId = normalized.id
          setDoc(normalized)
          setConflict(null)
          setStatus('saved')
          setCreating(false)
          const first = normalized.blocks.find((block) => block.type === 'scene') || normalized.blocks[0]
          setSelectedId(first ? first.id : null)
          setEditingId(first ? first.id : null)
          if (first) requestFocus(first.id, 0)
        },
        [requestFocus],
      )

      const openScript = useCallback(
        async (summary) => {
          try {
            const data = await request(`/scripts/${summary.id}`)
            if (!mountedRef.current) return
            openDoc(data.script)
            setPhase('ready')
          } catch (error) {
            showToast(error.message)
            refreshList()
          }
        },
        [openDoc, refreshList, showToast],
      )

      const backToLibrary = useCallback(async () => {
        if (dirtyRef.current) {
          const ok = await saveDocument()
          if (!ok) return false
        }
        clearTimeout(timerRef.current)
        lastOpenId = null
        docRef.current = null
        pendingRef.current = null
        dirtyRef.current = false
        setDoc(null)
        setSelectedId(null)
        setEditingId(null)
        setConflict(null)
        setStatus('saved')
        refreshList()
        return true
      }, [refreshList, saveDocument])

      const createScript = useCallback(
        async (event) => {
          if (event) event.preventDefault()
          if (busy) return
          setBusy(true)
          try {
            const data = await request('/scripts', {
              method: 'POST',
              body: JSON.stringify({ title: newTitle, author: newAuthor }),
            })
            if (!mountedRef.current) return
            setScripts((previous) => [summaryFromScript(data.script), ...previous])
            setNewTitle('')
            setNewAuthor('')
            openDoc(data.script)
          } catch (error) {
            showToast(error.message)
          } finally {
            if (mountedRef.current) setBusy(false)
          }
        },
        [busy, newAuthor, newTitle, openDoc, showToast],
      )

      const deleteScript = useCallback(
        async (id) => {
          try {
            await request(`/scripts/${id}`, { method: 'DELETE' })
            if (!mountedRef.current) return
            setScripts((previous) => previous.filter((item) => item.id !== id))
            setConfirmId(null)
            if (lastOpenId === id) lastOpenId = null
            if (docRef.current && docRef.current.id === id) {
              setDoc(null)
              docRef.current = null
              setSelectedId(null)
              setEditingId(null)
            }
          } catch (error) {
            showToast(error.message)
          }
        },
        [showToast],
      )

      const updateMeta = useCallback(
        (patch) => {
          const current = docRef.current
          if (!current) return
          applyLocal({ ...current, ...patch })
        },
        [applyLocal],
      )

      const updateBlock = useCallback(
        (id, text) => {
          const current = docRef.current
          if (!current) return
          const blocks = current.blocks.map((block) => (block.id === id ? { ...block, text } : block))
          applyLocal({ ...current, blocks })
        },
        [applyLocal],
      )

      const changeType = useCallback(
        (id, type, caret) => {
          if (!type) return
          const current = docRef.current
          if (!current) return
          const blocks = current.blocks.map((block) => (block.id === id ? { ...block, type } : block))
          setSelectedId(id)
          applyLocal({ ...current, blocks })
          requestFocus(id, caret === undefined ? 'end' : caret)
        },
        [applyLocal, requestFocus],
      )

      const splitBlock = useCallback(
        (id, before, after) => {
          const current = docRef.current
          if (!current) return
          const index = current.blocks.findIndex((block) => block.id === id)
          if (index < 0) return
          const block = current.blocks[index]
          const created = {
            id: newBlockId(),
            type: after.trim() ? block.type : NEXT_TYPE[block.type] || 'action',
            text: after,
          }
          const blocks = current.blocks.slice()
          blocks[index] = { ...block, text: before }
          blocks.splice(index + 1, 0, created)
          setSelectedId(created.id)
          applyLocal({ ...current, blocks })
          requestFocus(created.id, 0)
        },
        [applyLocal, requestFocus],
      )

      const mergeBlock = useCallback(
        (id) => {
          const current = docRef.current
          if (!current) return
          const index = current.blocks.findIndex((block) => block.id === id)
          if (index <= 0) return
          const previous = current.blocks[index - 1]
          const block = current.blocks[index]
          const caret = previous.text.length
          const blocks = current.blocks.slice()
          blocks[index - 1] = { ...previous, text: previous.text + block.text }
          blocks.splice(index, 1)
          setSelectedId(previous.id)
          applyLocal({ ...current, blocks })
          requestFocus(previous.id, caret)
        },
        [applyLocal, requestFocus],
      )

      const moveBlock = useCallback(
        (id, direction) => {
          const current = docRef.current
          if (!current) return
          const index = current.blocks.findIndex((block) => block.id === id)
          const target = index >= 0 ? current.blocks[index + direction] : null
          if (!target) return
          setSelectedId(target.id)
          requestFocus(target.id, direction < 0 ? 'end' : 0)
        },
        [requestFocus],
      )

      const beginEdit = useCallback(
        (id) => {
          setSelectedId(id)
          requestFocus(id, 'end')
        },
        [requestFocus],
      )

      const addScene = useCallback(() => {
        const current = docRef.current
        if (!current) return
        const existing = current.blocks[current.blocks.length - 1]
        if (existing && existing.type === 'scene' && !existing.text.trim()) {
          setSelectedId(existing.id)
          requestFocus(existing.id, 0)
          return
        }
        const created = { id: newBlockId(), type: 'scene', text: '' }
        applyLocal({ ...current, blocks: [...current.blocks, created] })
        setSelectedId(created.id)
        // The new scene sits at the end of the script: light it up now and let the
        // smooth scroll travel there without the spy flicking through every scene.
        spyHoldUntil.current = performance.now() + 700
        setViewScene(current.blocks.filter((block) => block.type === 'scene').length + 1)
        requestFocus(created.id, 0)
        setTimeout(() => {
          const element = inputRefs.current.get(created.id)
          const row = element && element.closest('.sw-block')
          if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 40)
      }, [applyLocal, requestFocus])

      const startNew = useCallback(async () => {
        const left = await backToLibrary()
        if (left !== false) setCreating(true)
      }, [backToLibrary])

      const reloadRemote = useCallback(() => {
        if (!conflict || !conflict.remote) return
        const remote = normalizeDoc(conflict.remote)
        docRef.current = remote
        baseRef.current = remote.updatedAt
        dirtyRef.current = false
        pendingRef.current = null
        setDoc(remote)
        const first = remote.blocks.find((block) => block.type === 'scene') || remote.blocks[0]
        setSelectedId(first ? first.id : null)
        setEditingId(first ? first.id : null)
        setConflict(null)
        setStatus('saved')
        refreshList()
      }, [conflict, refreshList])

      const keepMine = useCallback(() => {
        if (!docRef.current) return
        pendingRef.current = docRef.current
        dirtyRef.current = true
        setConflict(null)
        saveDocument({ force: true })
      }, [saveDocument])

      useEffect(() => {
        const id = doc && doc.id
        if (!id) return undefined
        let alive = true
        const tick = async () => {
          if (document.visibilityState === 'hidden') return
          try {
            const data = await request(`/scripts/${id}`)
            if (!alive || !data || !data.script) return
            const currentId = docRef.current && docRef.current.id
            if (currentId !== id) return
            const remote = normalizeDoc(data.script)
            if (savingRef.current) return
            if (remote.updatedAt === baseRef.current) return
            if (!dirtyRef.current) {
              docRef.current = remote
              baseRef.current = remote.updatedAt
              setDoc(remote)
              setStatus('saved')
              setConflict(null)
              const first = remote.blocks.find((block) => block.type === 'scene') || remote.blocks[0]
              setSelectedId((current) =>
                remote.blocks.some((block) => block.id === current)
                  ? current
                  : first
                    ? first.id
                    : null,
              )
              setEditingId((current) =>
                remote.blocks.some((block) => block.id === current) ? current : first ? first.id : null,
              )
              setScripts((previous) =>
                previous.map((item) => (item.id === remote.id ? summaryFromScript(remote) : item)),
              )
            } else {
              setConflict({ remote })
            }
          } catch {
            // Polling is best-effort; the save path reports real failures.
          }
        }
        const interval = setInterval(tick, 5000)
        return () => {
          alive = false
          clearInterval(interval)
        }
      }, [doc && doc.id])

      useEffect(() => {
        if (!doc) return undefined
        const onKey = (event) => {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
            event.preventDefault()
            saveDocument()
            return
          }
          const type = shortcutType(event)
          if (!type) return
          // Title/author fields keep their own typing.
          if (event.target && event.target.tagName === 'INPUT') return
          const current = docRef.current
          if (!current) return
          const target =
            editingId && current.blocks.some((block) => block.id === editingId) ? editingId : selectedId
          if (!target) return
          event.preventDefault()
          const element = inputRefs.current.get(target)
          const caret = element && element === document.activeElement ? element.selectionStart : undefined
          changeType(target, type, caret)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [doc && doc.id, saveDocument, editingId, selectedId, changeType])

      useEffect(() => {
        if (!confirmId) return undefined
        const timer = setTimeout(() => setConfirmId(null), 3200)
        return () => clearTimeout(timer)
      }, [confirmId])

      useEffect(() => {
        if (doc) return undefined
        let alive = true
        const timer = setInterval(() => {
          if (document.visibilityState === 'hidden') return
          request('/scripts')
            .then((data) => {
              if (alive) setScripts(Array.isArray(data.scripts) ? data.scripts : [])
            })
            .catch(() => {
              // The explicit refresh control reports failures through the error state.
            })
        }, 6000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [doc && doc.id])

      const stats = useMemo(() => statsOf(doc), [doc])
      const scenes = useMemo(() => {
        if (!doc) return []
        const rows = []
        doc.blocks.forEach((block) => {
          if (block.type === 'scene') {
            const number = rows.length + 1
            rows.push({ id: block.id, text: block.text, number, label: String(number).padStart(2, '0') })
          }
        })
        return rows
      }, [doc])
      const activeScene = useMemo(() => {
        if (!doc || !selectedId) return 0
        const index = doc.blocks.findIndex((block) => block.id === selectedId)
        if (index < 0) return 0
        let count = 0
        for (let step = 0; step <= index; step += 1) if (doc.blocks[step].type === 'scene') count += 1
        return count
      }, [doc, selectedId])

      /* -------------------------------------------------------------- scroll spy */

      // The paper, not the cursor, decides which scene is "current": the rail has
      // to track what is on screen, otherwise scrolling a long script leaves scene
      // 01 lit up while the reader is thirty pages down.
      const measureScene = useCallback(() => {
        const wrap = pageWrapRef.current
        const current = docRef.current
        if (!wrap || !current || !current.blocks) return
        const rows = wrap.querySelectorAll('.sw-block[data-block-id]')
        if (!rows.length) return
        const numbers = new Map()
        let count = 0
        for (const block of current.blocks) {
          if (block.type === 'scene') {
            count += 1
            numbers.set(block.id, count)
          }
        }
        if (count === 0) return
        const bar = wrap.querySelector('.sw-toolbar')
        const anchor = wrap.getBoundingClientRect().top + (bar ? bar.offsetHeight : 0) + 28
        // Rows are stacked top to bottom, so binary-search the last row that
        // starts above the anchor instead of measuring the whole script.
        let low = 0
        let high = rows.length - 1
        let last = -1
        while (low <= high) {
          const mid = (low + high) >> 1
          if (rows[mid].getBoundingClientRect().top <= anchor) {
            last = mid
            low = mid + 1
          } else {
            high = mid - 1
          }
        }
        let number = 0
        for (let step = last; step >= 0; step -= 1) {
          const found = numbers.get(rows[step].getAttribute('data-block-id'))
          if (found) {
            number = found
            break
          }
        }
        if (!number) number = 1
        if (performance.now() < spyHoldUntil.current) return
        setViewScene(number)
      }, [])

      const onPaperScroll = useCallback(() => {
        if (spyRaf.current) return
        spyRaf.current = requestAnimationFrame(() => {
          spyRaf.current = 0
          measureScene()
        })
      }, [measureScene])

      // Re-measure whenever another script lands on the paper (open, reload, undo
      // through the agent) so the rail starts on the scene at the top again.
      useLayoutEffect(() => {
        setViewScene(0)
        const frame = requestAnimationFrame(() => measureScene())
        return () => {
          cancelAnimationFrame(frame)
          if (spyRaf.current) {
            cancelAnimationFrame(spyRaf.current)
            spyRaf.current = 0
          }
        }
      }, [doc && doc.id, doc && doc.blocks.length, measureScene])

      // Keep the active scene inside the rail: follow the paper without yanking
      // the list around when the item is already visible.
      useEffect(() => {
        if (!viewScene) return
        const list = railListRef.current
        const current = docRef.current
        if (!list || !current) return
        let targetId = null
        let count = 0
        for (const block of current.blocks) {
          if (block.type !== 'scene') continue
          count += 1
          if (count === viewScene) {
            targetId = block.id
            break
          }
        }
        const element = targetId ? railItemRefs.current.get(targetId) : null
        if (!element) return
        const box = list.getBoundingClientRect()
        const row = element.getBoundingClientRect()
        if (row.top >= box.top + 4 && row.bottom <= box.bottom - 4) return
        list.scrollTo({
          top: list.scrollTop + (row.top - box.top) - (box.height - row.height) / 2,
          behavior: 'smooth',
        })
      }, [viewScene])

      const currentScene = viewScene || activeScene
      const selectedBlock = useMemo(
        () => (doc ? doc.blocks.find((block) => block.id === selectedId) : null),
        [doc, selectedId],
      )

      const statusText =
        status === 'saving'
          ? t('saving')
          : status === 'saved'
            ? t('saved')
            : status === 'error'
              ? t('saveError')
              : status === 'conflict'
                ? t('conflict')
                : t('unsaved')

      // The library has no top bar: it opens straight into 剧本库. The bar only
      // exists in the editor, where it carries the back button, doc meta and export.
      const header = doc
        ? h(
            'header',
            { className: 'sw-top' },
            h(
              'div',
              { className: 'sw-top-left' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'sw-icon-btn',
                  onClick: backToLibrary,
                  title: t('back'),
                  'aria-label': t('back'),
                },
                h(Glyph, { name: 'back', size: 18 }),
              ),
              h(
                'div',
                { className: 'sw-doc-meta' },
                h('input', {
                  className: 'sw-title-input',
                  value: doc.title,
                  placeholder: t('emptyScriptTitle'),
                  'aria-label': t('titlePlaceholder'),
                  onChange: (event) => updateMeta({ title: event.target.value }),
                }),
                h('input', {
                  className: 'sw-author-input',
                  value: doc.author,
                  placeholder: t('authorPlaceholder'),
                  'aria-label': t('authorPlaceholder'),
                  onChange: (event) => updateMeta({ author: event.target.value }),
                }),
              ),
            ),
            h(
              'div',
              { className: 'sw-top-right' },
              h(
                'span',
                { className: 'sw-stats' },
                `${stats.scenes} ${t('scenes')} · ${stats.pages} ${t('pagesUnit')} · ${stats.words} ${t('wordsUnit')}`,
              ),
              h(
                'span',
                { className: `sw-status sw-status--${status}`, role: 'status' },
                h('span', { className: 'sw-dot' }),
                statusText,
              ),
              h(ExportMenu, {
                t,
                doc,
                onNotify: showToast,
              }),
              h(
                'button',
                { type: 'button', className: 'sw-btn', onClick: startNew },
                h(Glyph, { name: 'plus' }),
                t('newScript'),
              ),
            ),
          )
        : null

      const conflictBanner = conflict
        ? h(
            'div',
            { className: 'sw-conflict', role: 'alert' },
            h(
              'div',
              null,
              h('strong', null, t('conflictTitle')),
              h('span', null, t('conflictHint')),
            ),
            h(
              'div',
              { className: 'sw-conflict-actions' },
              h('button', { type: 'button', className: 'sw-btn', onClick: reloadRemote }, t('reload')),
              h(
                'button',
                { type: 'button', className: 'sw-btn sw-btn-primary', onClick: keepMine },
                t('keepMine'),
              ),
            ),
          )
        : null

      if (phase === 'loading') {
        return h(
          'div',
          { className: 'sw-root' },
          h('style', null, CSS),
          h('div', { className: 'sw-center' }, h(Glyph, { name: 'film', size: 22 }), '…'),
        )
      }

      if (phase === 'error') {
        return h(
          'div',
          { className: 'sw-root' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'sw-center' },
            h('span', { className: 'sw-error-title' }, t('loadError')),
            h('span', { className: 'sw-error-detail' }, loadError),
            h(
              'button',
              {
                type: 'button',
                className: 'sw-btn',
                onClick: () => {
                  setPhase('loading')
                  request('/scripts')
                    .then((data) => {
                      setScripts(Array.isArray(data.scripts) ? data.scripts : [])
                      setPhase('ready')
                    })
                    .catch((error) => {
                      setLoadError(error.message)
                      setPhase('error')
                    })
                },
              },
              h(Glyph, { name: 'refresh' }),
              t('retry'),
            ),
          ),
        )
      }

      if (!doc) {
        const library = h(
          'div',
          { className: 'sw-body' },
          h(
            'div',
            { className: 'sw-library' },
            h(
              'div',
              { className: 'sw-lib-head' },
              h(
                'div',
                null,
                h('h2', { className: 'sw-lib-title' }, t('libraryTitle')),
                h('p', { className: 'sw-lib-sub' }, t('librarySub')),
              ),
              h(
                'div',
                { className: 'sw-lib-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'sw-icon-btn',
                    onClick: refreshList,
                    title: t('refresh'),
                    'aria-label': t('refresh'),
                  },
                  h(Glyph, { name: 'refresh' }),
                ),
                creating
                  ? null
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'sw-btn sw-btn-primary',
                        onClick: () => setCreating(true),
                      },
                      h(Glyph, { name: 'plus' }),
                      t('newScript'),
                    ),
              ),
            ),
            creating
              ? h(
                  'form',
                  { className: 'sw-create', onSubmit: createScript },
                  h(
                    'div',
                    { className: 'sw-create-fields' },
                    h(
                      'label',
                      { className: 'sw-field' },
                      h('span', null, t('titlePlaceholder')),
                      h('input', {
                        autoFocus: true,
                        value: newTitle,
                        placeholder: t('emptyScriptTitle'),
                        onChange: (event) => setNewTitle(event.target.value),
                      }),
                    ),
                    h(
                      'label',
                      { className: 'sw-field' },
                      h('span', null, t('authorPlaceholder')),
                      h('input', {
                        value: newAuthor,
                        placeholder: t('noAuthor'),
                        onChange: (event) => setNewAuthor(event.target.value),
                      }),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'sw-create-actions' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'sw-btn',
                        onClick: () => {
                          setCreating(false)
                          setNewTitle('')
                          setNewAuthor('')
                        },
                      },
                      t('cancel'),
                    ),
                    h(
                      'button',
                      { type: 'submit', className: 'sw-btn sw-btn-primary', disabled: busy },
                      h(Glyph, { name: 'plus' }),
                      t('create'),
                    ),
                  ),
                )
              : null,
            scripts.length === 0
              ? h(
                  'div',
                  { className: 'sw-empty' },
                  h('h3', null, t('emptyLibrary')),
                  h('p', null, t('emptyLibraryHint')),
                )
              : h(
                  'div',
                  { className: 'sw-grid' },
                  scripts.map((script) =>
                    h(
                      'div',
                      {
                        key: script.id,
                        className: 'sw-card',
                        role: 'button',
                        tabIndex: 0,
                        onClick: () => openScript(script),
                        onKeyDown: (event) => {
                          if (event.target !== event.currentTarget) return
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openScript(script)
                          }
                        },
                      },
                      h(
                        'div',
                        { className: 'sw-card-top' },
                        h(
                          'span',
                          { className: 'sw-card-badge' },
                          `${script.scenes} ${t('scenes')}`,
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: `sw-card-del${confirmId === script.id ? ' sw-card-del--on' : ''}`,
                            title: t('delete'),
                            'aria-label': t('delete'),
                            onClick: (event) => {
                              event.stopPropagation()
                              if (confirmId === script.id) deleteScript(script.id)
                              else setConfirmId(script.id)
                            },
                          },
                          confirmId === script.id ? t('confirmDelete') : h(Glyph, { name: 'trash', size: 14 }),
                        ),
                      ),
                      h('h3', { className: 'sw-card-title' }, script.title || t('emptyScriptTitle')),
                      h(
                        'div',
                        { className: 'sw-card-meta' },
                        `${script.author || t('noAuthor')} · ${script.words} ${t('wordsUnit')} · ${formatDate(script.updatedAt, lang)}`,
                      ),
                    ),
                  ),
                ),
          ),
        )

        return h(
          'div',
          { className: 'sw-root' },
          h('style', null, CSS),
          header,
          library,
          toast ? h('div', { className: 'sw-toast', role: 'status' }, toast) : null,
        )
      }

      const editor = h(
        'div',
        { className: 'sw-body sw-body--editor' },
        h(
          'aside',
          { className: 'sw-rail', 'aria-label': t('addScene') },
          h(
            'div',
            { className: 'sw-rail-head' },
            h('span', { className: 'sw-eyebrow' }, 'SCENES'),
            h('span', { className: 'sw-rail-count' }, `${scenes.length}`),
          ),
          h(
            'div',
            { className: 'sw-rail-list', ref: railListRef },
            scenes.length === 0
              ? h('p', { className: 'sw-rail-empty' }, t('noScenes'))
              : scenes.map((scene) =>
                  h(
                    'button',
                    {
                      key: scene.id,
                      type: 'button',
                      ref: (element) => {
                        if (element) railItemRefs.current.set(scene.id, element)
                        else railItemRefs.current.delete(scene.id)
                      },
                      className: `sw-scene${currentScene === scene.number ? ' sw-scene--on' : ''}`,
                      'aria-current': currentScene === scene.number ? 'true' : undefined,
                      onClick: () => {
                        setSelectedId(scene.id)
                        // Jumping from the rail knows its destination already; hold
                        // the spy for the length of the smooth scroll so the
                        // highlight does not flicker through the scenes in between.
                        spyHoldUntil.current = performance.now() + 700
                        setViewScene(scene.number)
                        requestFocus(scene.id, 0)
                        setTimeout(() => {
                          const element = inputRefs.current.get(scene.id)
                          const row = element && element.closest('.sw-block')
                          if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' })
                        }, 30)
                      },
                    },
                    h('span', { className: 'sw-scene-no' }, scene.label),
                    h('span', { className: 'sw-scene-text' }, scene.text.trim() || t('untitledScene')),
                  ),
                ),
          ),
          h(
            'button',
            { type: 'button', className: 'sw-rail-add', onClick: addScene },
            h(Glyph, { name: 'plus', size: 14 }),
            t('addScene'),
          ),
        ),
        h(
          'div',
          { className: 'sw-page-wrap', ref: pageWrapRef, onScroll: onPaperScroll },
          h(
            'div',
            { className: 'sw-toolbar' },
            h(
              'div',
              { className: 'sw-types', role: 'toolbar', 'aria-label': t('format') || 'Format' },
              TYPES.map((type, index) =>
                h(
                  'button',
                  {
                    key: type,
                    type: 'button',
                    className: `sw-type${selectedBlock && selectedBlock.type === type ? ' sw-type--on' : ''}`,
                    disabled: !selectedId,
                    title: `${t(type)} · ${MOD_LABEL}${index + 1}`,
                    'aria-keyshortcuts': `Alt+${index + 1}`,
                    onClick: () => {
                      const target = selectedId || (doc.blocks[0] && doc.blocks[0].id)
                      if (target) changeType(target, type)
                    },
                  },
                  t(type),
                  h(
                    'kbd',
                    { className: 'sw-type-key', 'aria-hidden': 'true' },
                    `${index + 1}`,
                  ),
                ),
              ),
            ),
            h('span', { className: 'sw-hint' }, t('tabHint').replace('{mod}', MOD_LABEL)),
          ),
          h(
            'div',
            { className: 'sw-paper' },
            h(
              'div',
              { className: 'sw-page-head' },
              h('span', { className: 'sw-page-title' }, doc.title || t('emptyScriptTitle')),
              h('span', { className: 'sw-page-author' }, doc.author || ''),
            ),
            doc.blocks.length === 0
              ? h(
                  'button',
                  { type: 'button', className: 'sw-empty-page', onClick: addScene },
                  t('startWriting'),
                )
              : doc.blocks.map((block) =>
                  block.id === editingId
                    ? h(BlockEditor, {
                        key: block.id,
                        block,
                        t,
                        onText: updateBlock,
                        onType: changeType,
                        onSplit: splitBlock,
                        onMerge: mergeBlock,
                        onMove: moveBlock,
                        onFocus: setSelectedId,
                        onSave: saveNow,
                        register: registerInput,
                      })
                    : h(BlockView, {
                        key: block.id,
                        block,
                        t,
                        onEdit: beginEdit,
                      }),
                ),
          ),
        ),
      )

      return h(
        'div',
        { className: 'sw-root' },
        h('style', null, CSS),
        header,
        conflictBanner,
        editor,
        toast ? h('div', { className: 'sw-toast', role: 'status' }, toast) : null,
      )
    }

    /* -------------------------------------------------------------------- css */

    const CSS = `
.sw-root{--sw-paper-font:"Courier Prime","Courier New","Songti SC","Noto Serif SC","STSong",serif;height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);overflow:hidden}
/* The studio sits flush in the frame's top-left corner, so the header has to
   clear the shell's window-chrome seat: macOS traffic lights plus the sidebar
   reopen / New Session buttons. The frame publishes the seat's inline width as
   --dsh-frame-leading-clearance whenever that seat is mounted (collapsed macOS
   sidebar, or a narrow drawer); it is absent otherwise. The clearance animates
   with the same duration and easing the frame uses for its column tracks, so
   collapsing the sidebar glides instead of snapping the header across. */
.sw-top{flex:0 0 auto;display:flex;align-items:center;gap:16px;height:58px;padding:0 20px;padding-left:max(20px,var(--dsh-frame-leading-clearance,20px));border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);box-sizing:border-box;transition:padding-left var(--ds-transition-duration-slow,.3s) var(--ds-ease-in-out,cubic-bezier(.4,0,.2,1))}
[data-dragging] .sw-top,[data-sidebar-instant] .sw-top{transition:none}
@media (prefers-reduced-motion:reduce){.sw-top{transition:none}}
.sw-top-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto}
.sw-eyebrow{font:600 9.5px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);margin:0}
.sw-doc-meta{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto;max-width:520px}
.sw-title-input{border:0;background:none;padding:0;margin:0;font:inherit;font-size:16px;font-weight:650;line-height:1.25;color:var(--dsw-alias-label-primary);width:100%;min-width:0;outline:none;border-radius:4px}
.sw-title-input:focus{outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);outline-offset:2px}
.sw-author-input{border:0;background:none;padding:0;margin:0;font:inherit;font-size:11.5px;line-height:1.25;color:var(--dsw-alias-label-secondary);width:100%;outline:none;border-radius:4px}
.sw-author-input:focus{outline:2px solid color-mix(in srgb,var(--dsw-alias-border-l2) 70%,transparent);outline-offset:2px}
.sw-author-input::placeholder,.sw-title-input::placeholder,.sw-field input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.55}
.sw-top-right{display:flex;align-items:center;gap:8px;flex:0 0 auto}
.sw-stats{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}
.sw-status{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.sw-status--saved{color:var(--dsw-alias-state-success-primary)}
.sw-status--error,.sw-status--conflict{color:var(--dsw-alias-state-error-primary)}
.sw-status--dirty{color:var(--dsw-alias-state-warn-primary)}
.sw-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}
.sw-btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap;box-sizing:border-box}
.sw-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.sw-btn:disabled{opacity:.5;cursor:default}
.sw-btn-primary{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary)}
.sw-btn-primary:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}
.sw-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid transparent;border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none;padding:0}
.sw-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sw-body{flex:1 1 auto;min-height:0;display:flex;overflow:hidden}
.sw-library{flex:1 1 auto;overflow-y:auto;padding:40px 32px 80px;box-sizing:border-box}
.sw-library>*{max-width:1080px;margin-left:auto;margin-right:auto}
.sw-lib-head{display:flex;align-items:flex-end;gap:20px;justify-content:space-between;margin-bottom:22px}
.sw-lib-actions{display:flex;align-items:center;gap:6px;flex:none}
.sw-lib-title{font-size:30px;line-height:1.15;font-weight:650;letter-spacing:-.02em;margin:6px 0 6px}
.sw-lib-sub{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.6;max-width:620px;margin:0}
.sw-create{display:flex;gap:12px;align-items:flex-end;padding:14px;margin-bottom:18px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 35%,var(--dsw-alias-border-l1));border-radius:12px;background:var(--dsw-alias-bg-layer-1);box-sizing:border-box}
.sw-create-fields{display:flex;gap:10px;flex:1 1 auto;min-width:0}
.sw-field{display:flex;flex-direction:column;gap:5px;flex:1 1 auto;min-width:0}
.sw-field span{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.sw-field input{height:32px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none;min-width:0}
.sw-field input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}
.sw-create-actions{display:flex;gap:8px;flex:none}
.sw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.sw-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:16px 16px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);cursor:pointer;min-height:108px;box-sizing:border-box;transition:border-color .14s,background .14s}
.sw-card:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,var(--dsw-alias-border-l2));background:var(--dsw-alias-bg-layer-2)}
.sw-card:focus-visible{outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);outline-offset:2px}
.sw-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:24px}
.sw-card-badge{font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.sw-card-del{display:inline-flex;align-items:center;justify-content:center;height:24px;min-width:24px;padding:0 6px;border:1px solid transparent;border-radius:6px;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10.5px;cursor:pointer;box-sizing:border-box}
.sw-card-del:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.sw-card-del--on{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)}
.sw-card-title{font-family:var(--sw-paper-font);font-size:19px;line-height:1.3;font-weight:600;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.sw-card-meta{margin-top:auto;padding-top:8px;font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sw-empty{margin-top:50px;text-align:center;color:var(--dsw-alias-label-secondary)}
.sw-empty h3{font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary);margin:0 0 6px}
.sw-empty p{font-size:12.5px;line-height:1.6;margin:0}
.sw-body--editor{align-items:stretch}
.sw-rail{flex:0 0 auto;width:216px;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);display:flex;flex-direction:column;min-height:0;box-sizing:border-box}
.sw-rail-head{display:flex;align-items:center;justify-content:space-between;padding:16px 14px 10px}
.sw-rail-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.sw-rail-list{flex:1 1 auto;overflow-y:auto;padding:0 8px 12px}
.sw-rail-empty{font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:4px 8px;margin:0}
.sw-scene{display:flex;gap:8px;width:100%;padding:8px;border:1px solid transparent;border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1.45;text-align:left;cursor:pointer;box-sizing:border-box}
.sw-scene:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sw-scene--on{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.sw-scene-no{flex:0 0 auto;width:18px;font:600 10px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);opacity:.8}
.sw-scene-text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-width:0}
.sw-rail-add{display:flex;align-items:center;gap:6px;margin:8px;padding:9px 10px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.sw-rail-add:hover{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.sw-page-wrap{flex:1 1 auto;min-width:0;overflow-y:auto;padding:0 24px 100px;position:relative;box-sizing:border-box}
.sw-toolbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;padding:10px 0;background:var(--dsw-alias-bg-base);border-bottom:1px solid var(--dsw-alias-border-l1)}
.sw-types{display:flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);overflow-x:auto}
.sw-type{display:inline-flex;align-items:center;gap:5px;border:0;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;padding:5px 9px;border-radius:6px;cursor:pointer;white-space:nowrap}
.sw-type:hover{color:var(--dsw-alias-label-primary)}
.sw-type--on{background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary)}
.sw-type:disabled{opacity:.45;cursor:default}
.sw-type-key{font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums;opacity:.45;padding:2px 4px;border:1px solid currentColor;border-radius:4px;color:inherit}
.sw-type:hover .sw-type-key,.sw-type--on .sw-type-key{opacity:.7}
.sw-hint{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-secondary);opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sw-paper{width:100%;max-width:816px;margin:24px auto 0;padding:96px 96px 96px 144px;box-sizing:border-box;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:3px;box-shadow:0 22px 50px -38px var(--dsw-alias-border-l2);min-height:1056px;font-family:var(--sw-paper-font);font-size:16px;line-height:1.5;color:var(--dsw-alias-label-primary)}
.sw-page-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:34px;padding-bottom:10px;border-bottom:1px solid var(--dsw-alias-border-l1);opacity:.75}
.sw-page-title{font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw-page-author{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.sw-block{position:relative}
.sw-input{display:block;width:100%;box-sizing:border-box;margin:0;padding:0;border:0;outline:0;background:transparent;color:inherit;font:inherit;line-height:inherit;resize:none;overflow:hidden;white-space:pre-wrap;word-break:break-word;caret-color:var(--dsw-alias-brand-primary);border-radius:2px}
.sw-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.45}
.sw-input:focus{outline:none;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 5%,transparent)}
.sw-view{display:block;width:100%;box-sizing:border-box;margin:0;padding:0;color:inherit;font:inherit;line-height:inherit;white-space:pre-wrap;word-break:break-word;cursor:text;border-radius:2px}
.sw-view:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 4%,transparent)}
.sw-view--empty{color:var(--dsw-alias-label-secondary);opacity:.45}
.sw-block--scene{margin-top:26px}
.sw-block--scene:first-child{margin-top:0}
.sw-block--scene .sw-input,.sw-block--scene .sw-view{font-weight:700;letter-spacing:.03em;text-transform:uppercase}
.sw-block--action{margin-top:10px}
.sw-block--character{margin-top:20px;text-align:center}
.sw-block--character .sw-input,.sw-block--character .sw-view{font-weight:600;letter-spacing:.04em;text-align:center}
.sw-block--parenthetical{width:56%;margin:2px auto 0;text-align:center}
.sw-block--parenthetical .sw-input,.sw-block--parenthetical .sw-view{text-align:center;color:var(--dsw-alias-label-secondary);font-size:.92em}
.sw-block--dialogue{width:66%;margin:2px auto 12px}
.sw-block--dialogue .sw-input,.sw-block--dialogue .sw-view{text-align:left}
.sw-empty-page{display:block;width:100%;padding:40px 20px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:none;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer}
.sw-menu-wrap{position:relative}
.sw-menu{position:absolute;right:0;top:36px;z-index:10;min-width:190px;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-overlay);box-shadow:0 18px 40px -24px var(--dsw-alias-border-l2)}
.sw-menu-item{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:0;border-radius:6px;background:none;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;text-align:left;cursor:pointer;white-space:nowrap}
.sw-menu-item:hover{background:var(--dsw-alias-bg-layer-2)}
.sw-conflict{flex:0 0 auto;display:flex;align-items:center;gap:12px;justify-content:space-between;padding:10px 20px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 40%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,var(--dsw-alias-bg-base))}
.sw-conflict strong{display:block;font-size:12.5px;font-weight:600}
.sw-conflict span{display:block;font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px;line-height:1.45}
.sw-conflict-actions{display:flex;gap:8px;flex:none}
.sw-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:20;padding:9px 14px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-size:12.5px;box-shadow:0 10px 30px -16px var(--dsw-alias-border-l2);max-width:min(560px,calc(100vw - 32px))}
.sw-center{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--dsw-alias-label-secondary);font-size:13px;padding:40px}
.sw-error-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}
.sw-error-detail{font-size:12px;color:var(--dsw-alias-label-secondary);max-width:520px;text-align:center;line-height:1.5;word-break:break-word}
@media (max-width:980px){.sw-paper{padding:52px 48px 72px}.sw-rail{width:184px}.sw-hint{display:none}}
@media (max-width:760px){.sw-rail{display:none}.sw-top{height:52px;padding:0 12px;padding-left:max(12px,var(--dsh-frame-leading-clearance,12px))}.sw-stats{display:none}.sw-paper{padding:36px 24px 56px;font-size:15px;min-height:0;border-radius:0;border-left:0;border-right:0}.sw-page-wrap{padding:0 8px 60px}.sw-block--dialogue{width:82%}.sw-toolbar{padding:8px 0}.sw-library{padding:28px 14px 60px}.sw-lib-head{flex-direction:column;align-items:flex-start;gap:12px}.sw-create{flex-direction:column;align-items:stretch}.sw-create-fields{flex-direction:column}.sw-conflict{align-items:flex-start;flex-direction:column}.sw-conflict-actions{width:100%}}
`

    /* ---------------------------------------------------------------- register */

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const disposers = []
          try {
            disposers.push(ctx.locale.register(NS, 'zh', DICT.zh))
          } catch {
            // The client locale service always exists in the Web app.
          }
          try {
            disposers.push(ctx.locale.register(NS, 'en', DICT.en))
          } catch {
            // A second dictionary is optional.
          }
          return () => {
            for (const dispose of disposers) {
              try {
                dispose()
              } catch {
                // Disposal is best-effort during unmount.
              }
            }
          }
        })

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'screenplay',
              order: 40,
              label: () => navLabel(ctx),
            },
            (props) => h(NavIcon, { ...props, label: navLabel(ctx) }),
          ),
        )

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: 'screenplay',
            },
            (props) => h(Studio, { ...props, __ctx: ctx }),
          ),
        )
      },
    }
  },
})
