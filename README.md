# Screenwriting Tool · DSH plugin

English | [中文](docs/README.zh.md)

A screenwriting desk for DeepSeek Harness: a local screenplay library, a US Letter page, autosave, and an agent writing into the same script.

Look for **Screenplay studio** in the sidebar.

## Install

Requires DeepSeek Harness.

```bash
git clone git@github.com:thu-huangzc/dsh-screenwrite.git
```

Register the folder in `~/.dsh/profiles/<profile>/package.json`:

```json
{
  "dependencies": { "dsh-screenplay": "link:/absolute/path/to/dsh-screenwrite" },
  "dsh": { "profile": { "bundles": ["…", "dsh-screenplay"] } }
}
```

Restart Harness. What has to agree is the package `name`, `cordis.patch.yml`'s `name`, the `id` at the top of `client.js` and the name in `dsh.profile.bundles` — all `dsh-screenplay`. The folder may be called anything.

## Writing

- Five elements: scene heading, action, character, parenthetical, dialogue. `⌥1`–`⌥5` (`Alt+1`–`Alt+5`) jumps straight to an element, `Tab` still cycles, `Enter` splits, `⌘S` saves.
- The scene rail follows the page as you scroll; click a scene to jump to it.
- Exports: PDF (renders in the browser, no print dialog), Fountain, plain text, standalone HTML.
- Scripts are JSON files in `~/.dsh/screenplay/scripts/`; nothing leaves the machine.
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

The plugin registers the `screenplay` tool — `list`, `read`, `create`, `write`, `append`, `rename`, `delete`. Ask the agent to read the live script first and to describe edits scene by scene.

## Docs

- [Where to read scripts](docs/PUBLIC_SCREENPLAYS.md) — screenplay sources, awards seasons, and public-domain material (中文).
- [Public screenplay sources, English edition](docs/PUBLIC_SCREENPLAYS.en.md).
- [Chinese README](docs/README.zh.md).
- [Changelog](CHANGELOG.md).

## License

MIT
