# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A settings panel behind a gear button next to the library's refresh control (and
  in the script header): interface language (follow the app, 中文, English), the
  current version, a check against GitHub releases that also runs quietly every
  twelve hours (a dot on the gear marks an update), and a link to the issue
  tracker.
- Host endpoints `GET /screenplay-api/version` and `GET /screenplay-api/update`
  back the settings panel; the update lookup is cached for ten minutes.
- A parenthetical arrives with its brackets: switching a line to 括号 wraps it in
  `（）` (Chinese) or `()` (English) and puts the caret inside. Leaving the element
  strips them again, and Enter closes the cue before opening the dialogue.

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
