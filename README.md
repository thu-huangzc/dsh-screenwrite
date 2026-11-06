# Screenplay studio · 剧本工坊

A screenwriting desk for DeepSeek Harness: a local screenplay library, a US Letter page, autosave, and an agent writing into the same script.

Look for **剧本工坊** in the sidebar.

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

Restart Harness. The folder name, the package `name`, `cordis.patch.yml`'s `name` and the `id` at the top of `client.js` must all read `dsh-screenplay`, or the plugin never loads.

## Writing

- Five elements: scene heading, action, character, parenthetical, dialogue. `Tab` cycles, `Enter` splits, `⌘S` saves.
- The scene rail follows the page as you scroll; click a scene to jump to it.
- Exports: print/PDF, Fountain, plain text, standalone HTML.
- Scripts are JSON files in `~/.dsh/screenplay/scripts/`; nothing leaves the machine.
- The library ships with *A Real Pain* as a local format reference. It stays copyrighted and unpublished — see [PUBLIC_SCREENPLAYS.md](PUBLIC_SCREENPLAYS.md).

## Format

Fountain-like, Chinese or English scene headings:

```fountain
Title: 夜航
Author: 林夏

内景 咖啡馆 - 日
清晨的光穿过百叶窗。

林夏：
（低声）
他又迟到了。

INT. OFFICE - NIGHT
SARAH (V.O.)
We should go.
```

Prefix a line with `.` for scene, `@` for character, `!` for action.

## Agent

The plugin registers the `screenplay` tool — `list`, `read`, `create`, `write`, `append`, `rename`, `delete`. Ask the agent to read the live script first and to describe edits scene by scene.

## License

MIT
