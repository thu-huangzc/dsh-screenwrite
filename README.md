# Screenwrite · DSH plugin

English | [中文](docs/README.zh.md)

A screenwriting desk for DeepSeek Harness: a local screenplay library, a US Letter page, autosave, and an agent writing into the same script.

Look for **Screenwrite studio** in the sidebar.

## Install

Requires DeepSeek Harness. The bundle is published on npm as **`dsh-screenwrite`**.

**From the plugin manager (recommended).** Install the bundle by its npm name:

```text
install_bundle   target: dsh-screenwrite
```

**By hand.** Add it to `~/.dsh/profiles/<profile>/package.json`, then install:

```json
{
  "dependencies": { "dsh-screenwrite": "^1.5.0" },
  "dsh": { "profile": { "bundles": ["…", "dsh-screenwrite"] } }
}
```

```bash
cd ~/.dsh/profiles/<profile> && pnpm install
```

Restart Harness and look for **Screenwrite studio** in the sidebar.

**From a checkout** — for working on the plugin itself — link the folder instead:

```json
"dependencies": { "dsh-screenwrite": "link:/absolute/path/to/dsh-screenwrite" }
```

Either way the package `name`, `cordis.patch.yml`'s `name`, the `id` at the top of
`client.js` and the entry in `dsh.profile.bundles` have to agree — all read
`dsh-screenwrite`. The folder may be called anything.

## Writing

- Five elements: scene heading, action, character, parenthetical, dialogue. `⌥1`–`⌥5` (`Alt+1`–`Alt+5`) jumps straight to an element, `Tab` still cycles, `Enter` splits, `⌘S` saves.
- The scene rail follows the page as you scroll; click a scene to jump to it.
- Exports: PDF (renders in the browser, no print dialog), Fountain, plain text, standalone HTML.
- Scripts are JSON files in `~/.dsh/screenwrite/scripts/`; nothing leaves the machine. An older `~/.dsh/screenplay/` library is moved over on first run.
- A first run into an empty library seeds a short demo, *Night Shift* (`samples/`), so the page has something on it.

## Format

Fountain-like, one script per page, five elements:

```fountain
Title: Night Flight
Author: Lin Xia

INT. COFFEE - DAY
Morning light through the blinds.

LIN XIA
(low)
He's late again.

INT. OFFICE - NIGHT
SARAH (V.O.)
We should go.
```

Scene headings may be English or Chinese. Prefix a line with `.` for scene, `@` for character, `!` for action.

## Agent

The plugin registers the `screenwrite` tool — `list`, `read`, `create`, `write`, `append`, `rename`, `delete`. Ask the agent to read the live script first and to describe edits scene by scene.

## License

MIT
