# Screenplay studio

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

Restart Harness. The folder name, the package `name`, `cordis.patch.yml`'s `name` and the `id` at the top of `client.js` must all read `dsh-screenplay`, or the plugin never loads.

## Writing

- Five elements: scene heading, action, character, parenthetical, dialogue. `Tab` cycles, `Enter` splits, `⌘S` saves.
- The scene rail follows the page as you scroll; click a scene to jump to it.
- Exports: print/PDF, Fountain, plain text, standalone HTML.
- Scripts are JSON files in `~/.dsh/screenplay/scripts/`; nothing leaves the machine.
- The library ships with *A Real Pain* as a local format reference. It stays copyrighted and unpublished — see [docs/PUBLIC_SCREENPLAYS.md](docs/PUBLIC_SCREENPLAYS.md).

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

- [Public screenplays](docs/PUBLIC_SCREENPLAYS.md) — where to read scripts, and the local *A Real Pain* reference copy.

## License

MIT
