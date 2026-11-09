# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-11-09

### Changed

- The settings panel shows the plugin version and nothing else; the line about
  where updates are managed is gone.

## [1.6.0] - 2026-11-09

### Changed

- Updates moved out of the plugin and onto the Harness **Plugins** page. The
  plugin is on npm, so a registry install (`dsh-screenwrite@1.6.0`) gets DSH's
  own version list and *Update* button; the settings panel now shows the version
  and says where updates are managed.
- Removed the in-plugin GitHub release check: `GET /screenwrite-api/update`, the
  twelve-hour background lookup, the dot on the settings cog, and the cached
  `screenwrite.update` state. `/screenwrite-api/version` stays, for the settings
  panel's version line.

## [1.5.1] - 2026-11-09

### Changed

- Everything that used to be called `screenplay` is now `screenwrite`: the npm
  package (`dsh-screenwrite`), the plugin id in `cordis.patch.yml` and
  `client.js`, the agent tool, the `/screenwrite-api` endpoints, the
  `x-screenwrite` request header, the `screenwrite:studio` prompt section, the
  sidebar slot ids, and the settings stored in `localStorage`. The engine module
  is `screenwrite.js`.
- The library moves from `~/.dsh/screenplay/` to `~/.dsh/screenwrite/` on first
  run — by rename, or by copy when the two folders sit on different volumes —
  and an existing `~/.dsh/screenplay/` is left untouched when the new folder is
  already there. `screenplay.*` settings are adopted once into `screenwrite.*`.
- The English product name is **Screenwrite studio**; the Chinese UI keeps
  剧本工坊.

## [1.4.2] - 2026-11-08

### Changed

- The Chinese element labels read 动作/事情 and 插入说明, replacing 动作/描述 and
  括号. The English labels stay Action / description and Parenthetical.

## [1.4.1] - 2026-11-07

### Fixed

- A box selection across lines can be deleted: Backspace or Delete trims the
  selected range out of the first and last line and drops the lines between.
  Starting a drag outside the line being edited closes its textarea first, so
  the selection includes every line it crosses, and a click that ends a
  drag-selection no longer replaces the selection with a textarea.
- The update check no longer reports a false "GitHub unreachable" when the
  unauthenticated API is rate-limited or slow: the API and the release page are
  asked at the same time, the page redirect is followed to its tag, and the
  timeout leaves room for a slow mainland connection. The release link from
  that page is no longer double-prefixed with `https://github.com`.
- A manual "检查更新" now forces a fresh lookup instead of reading back the
  short-lived cached failure, so a network that has just recovered can update
  without waiting for the cache to expire.

## [1.4.0] - 2026-11-07

### Added

- A settings panel, opened from a cog beside the library's refresh control and from
  the script header: interface language (follow the app, 中文, English), the plugin
  version, a check against GitHub releases that also runs on its own every twelve
  hours (a dot on the cog marks an available update), and a link to the issue
  tracker.
- Host endpoints `GET /screenplay-api/version` and `GET /screenplay-api/update`;
  the release lookup is cached for ten minutes.
- A parenthetical arrives with its brackets: switching a line to 括号 wraps it in
  `（）` for Chinese and `()` for English, with the caret inside; leaving the element
  strips them again.

### Changed

- The settings rows sit on one line — label on the left, control or status on the
  right — and the update status names each version once (`1.3.1 → 1.4.0` when
  something newer exists) in plain secondary text instead of colour.

### Fixed

- One Enter could create two blocks: a held key auto-repeated onto the freshly
  created line, and an IME commit could deliver the same keydown twice. Repeats are
  ignored and a block is split at most once per gesture.
- Enter inside a parenthetical closed the cue in place instead of leaving a stray
  `）` block behind.
- The update check no longer treats one failed lookup as final: failures retry
  within two minutes and whenever the panel opens, and the host falls back to the
  GitHub release page when the API host is unreachable.

## [1.3.1] - 2026-11-06

### Added

- Page zoom: pinch on a trackpad, or `⌘=` / `⌘-` (`Ctrl` on Windows and Linux),
  scales the sheet as a whole — type, margins and all. `⌘0` goes back to 100%.
  The level is remembered between sessions.

### Fixed

- Pinch zoom stepped in coarse jumps: sub-percent changes were rounded away, so a
  slow gesture barely moved the page. Steps are now continuous, and the gesture
  itself is twice as sensitive.

## [1.3.0] - 2026-11-06

### Added

- Element shortcuts: `⌥1`–`⌥5` (`Alt+1`–`Alt+5`) jump straight to scene, action,
  character, parenthetical or dialogue. `Tab` and `Shift+Tab` still cycle.
- A hover / keyboard-focus hint above each format button, showing its shortcut.
- "Save as PDF": the page is laid out and written as a Letter-size PDF inside the
  browser — no print dialog, no pop-up window. Title page, page numbers from the
  second script page, CJK-aware line breaking, 216 dpi pages compressed with
  `CompressionStream` (JPEG fallback when it is unavailable).
- The HTML export opens as a readable document: a cover page plus a white Letter
  sheet using the studio's element spacing, with a print stylesheet that restores
  the Letter layout when the file is printed.
- `docs/README.zh.md` — Chinese README.
- `docs/PUBLIC_SCREENPLAYS.en.md` — English edition of the screenplay sources note.

### Changed

- The HTML export no longer carries the small title/author header on the script
  page; it matches the PDF (cover page, then a clean page of script).

### Removed

- The in-page "Add scene" button; the scene rail keeps its own button.
- The print path (`window.open` + `window.print`), which the WebView blocked.

## [1.2.0] - 2026-11-06

### Added

- Initial import: a local screenplay library, the five-element US Letter page,
  autosave, the scene rail, Fountain / plain text / HTML export, and the
  `screenplay` agent tool (`list`, `read`, `create`, `write`, `append`, `rename`,
  `delete`).
