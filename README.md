# remnote-bridge

[中文文档](./README.zh-CN.md)

Bridge toolkit that exposes your RemNote knowledge base to AI agents. Single package — CLI, MCP Server, and Plugin all in one.

## Install

```bash
npm install -g remnote-bridge
```

## Super Quick Start (with AI)

One step to connect, then let AI guide you through the rest.

### Option A: Install Skill (works with Claude Code, Cursor, Windsurf, and 40+ tools)

```bash
npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge
```

### Option B: Configure MCP Server (for any MCP-compatible AI client)

Add the following to your AI client's MCP settings:

```json
{
  "mcpServers": {
    "remnote-bridge": {
      "command": "remnote-bridge",
      "args": ["mcp"]
    }
  }
}
```

**Tip: Install both for best results.** MCP documentation is kept concise (loaded all at once), while Skill documentation is detailed (loaded on demand). Together they complement each other. That said, either one works independently — you don't need both.

Once connected, the AI will guide you through connecting to RemNote, loading the plugin, and everything else.

---

## Quick Start

### Standard Mode (recommended)

Recommended for daily use — you control when to load and unload the plugin.

```bash
# 1. Start the daemon (launches WS server + plugin server)
remnote-bridge connect

# 2. Load the plugin in RemNote
#    Open RemNote → Plugins → Develop Your Plugin
#    Enter: http://localhost:8080

# 3. Check system status
remnote-bridge health

# 4. Explore your knowledge base
remnote-bridge read-globe                    # Global document overview
remnote-bridge read-context                  # Current focus in RemNote
remnote-bridge search "machine learning"     # Full-text search
remnote-bridge read-tree <remId>             # Expand a subtree
remnote-bridge read-rem <remId>              # Read Rem properties

# 5. Edit content
remnote-bridge edit-rem <remId> --changes '{"text":["new text"]}'
remnote-bridge edit-tree <remId> --old-str '  old line <!--id-->' --new-str '  new line\n  old line <!--id-->'

# 6. Stop the daemon
remnote-bridge disconnect
```

### Headless Mode (fully automated)

Zero human intervention after initial setup — use only for fully automated workflows.

```bash
# 1. One-time: login to RemNote in Chrome (saves credentials)
remnote-bridge setup

# 2. Auto-connect with headless Chrome (no browser window needed)
remnote-bridge connect --headless

# 3. Verify all layers are ready
remnote-bridge health

# 4. Use any command — done!
remnote-bridge search "machine learning"
```

## Commands

### Infrastructure

| Command | Description |
|:--------|:------------|
| `setup` | Launch Chrome for RemNote login, save credentials for headless mode |
| `connect` | Start the daemon (`--headless` for auto Chrome, default requires manual plugin load) |
| `health` | Check daemon/Plugin/SDK status (`--diagnose` for screenshots, `--reload` to restart Chrome) |
| `disconnect` | Stop the daemon and release resources |
| `clean` | Remove all residual files (.pid / .log / .json / skill dirs) |

### Read

| Command | Description | Caches |
|:--------|:------------|:-------|
| `read-globe` | Global document-level overview | No |
| `read-context` | Current focus/page context view | No |
| `read-tree <remId>` | Subtree as Markdown outline | Yes |
| `read-rem <remId>` | Single Rem's full JSON properties | Yes |
| `search <query>` | Full-text search | No |

### Write

| Command | Description | Prerequisite |
|:--------|:------------|:-------------|
| `edit-rem <remId>` | Directly modify Rem fields (text, backText, type, etc.) | `read-rem` first |
| `edit-tree <remId>` | Edit tree structure via str_replace | `read-tree` first |

### Utilities

| Command | Description |
|:--------|:------------|
| `mcp` | Start the MCP Server (stdio transport) |
| `install skill` | Install AI agent skill (via [Vercel Skills](https://github.com/vercel-labs/skills)) |
| `addon list\|install\|uninstall` | Manage addon projects (e.g. remnote-rag) |

## MCP Server

Use `remnote-bridge mcp` as an MCP server for AI clients:

```json
{
  "mcpServers": {
    "remnote-bridge": {
      "command": "remnote-bridge",
      "args": ["mcp"]
    }
  }
}
```

The MCP server exposes all CLI commands as tools. Documentation is inlined into tool descriptions and server instructions (no separate resources).

## AI Agent Skill

The Skill provides detailed instructions (SKILL.md + 11 command docs) that teach AI agents how to use remnote-bridge — including command selection, workflows, safety rules, and flashcard operations.

### Install via Vercel Skills (recommended)

Powered by the [Vercel Skills](https://github.com/vercel-labs/skills) ecosystem. Supports **40+ AI coding tools** including Claude Code, Cursor, Windsurf, GitHub Copilot, Cline, and more.

```bash
# Direct — interactive agent selection
npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge

# Or through the built-in wrapper (same interactive experience)
remnote-bridge install skill
```

The interactive installer will detect your installed AI tools and let you choose which ones to install the skill for.

### Fallback: Claude Code only

If `npx` is not available, or you prefer manual installation:

```bash
remnote-bridge install skill --copy
```

This copies the skill files directly to `~/.claude/skills/remnote-bridge/`.

### What gets installed

```
<agent-skills-dir>/remnote-bridge/
├── SKILL.md              # Core skill — command decisions, workflows, safety rules
└── instructions/         # Detailed per-command documentation
    ├── overall.md        # Global overview
    ├── connect.md        # connect command
    ├── read-tree.md      # read-tree command
    ├── edit-tree.md      # edit-tree command
    └── ...               # 8 more command docs
```

## JSON Mode

All commands support `--json` for programmatic usage. In JSON mode, both input and output are JSON:

```bash
# Input: all parameters packed in a JSON string
remnote-bridge --json read-rem '{"remId":"abc123","fields":["text","type"]}'

# Output: single-line JSON
# {"ok":true,"command":"read-rem","timestamp":"...","data":{...}}
```

## Multi-Instance

Run multiple daemon instances in parallel (e.g. different knowledge bases):

```bash
# Named instances
remnote-bridge --instance work connect
remnote-bridge --instance personal connect

# Headless shorthand
remnote-bridge --headless connect    # equivalent to --instance headless

# Commands auto-route to the right instance
remnote-bridge --instance work search "project notes"
```

Instances are managed via a global registry at `~/.remnote-bridge/`. Each instance gets its own port allocation, PID file, and log file.

## Architecture

```
AI Agent (Claude Code / MCP Client)
    ↕  CLI commands (stateless short processes)
remnote-bridge CLI
    ↕  WebSocket IPC
Daemon (long-lived process: WS server + handlers + cache)
    ↕  WebSocket
remnote-plugin (runs inside RemNote browser or headless Chrome)
    ↕
RemNote SDK → Knowledge Base
```

- **CLI commands** are stateless — each invocation is an independent OS process
- **Daemon** holds state: cache, WS connections, timeout timer
- **Plugin** runs in the browser (or headless Chrome), calls RemNote SDK on behalf of the daemon
- **Multi-instance** — multiple daemons can run simultaneously, each plugin can connect to multiple daemons with twin priority
- **Headless mode** launches Chrome automatically using saved credentials — no browser window needed
- **Three safety guards** protect edits: cache existence check, optimistic concurrency detection, str_replace exact match (for edit-tree)

## Configuration

Optional config file: `.remnote-bridge.json` in project root.

```json
{
  "wsPort": 3002,
  "devServerPort": 8080,
  "configPort": 3003,
  "daemonTimeoutMinutes": 30,
  "defaults": {
    "maxNodes": 200,
    "maxSiblings": 20,
    "readTreeDepth": 3
  }
}
```

All values have sensible defaults — the config file is not required.

## Acknowledgements

This project was inspired by and learned from:

- [remnote-mcp-bridge](https://github.com/quentintou/remnote-mcp-bridge) by [@quentintou](https://github.com/quentintou) — The original MCP bridge connecting RemNote to AI assistants. Pioneered the idea of bridging RemNote SDK to external tools via MCP.
- [remnote-mcp-bridge (fork)](https://github.com/robert7/remnote-mcp-bridge) by [@robert7](https://github.com/robert7) — Extended the original with a generic, extensible WebSocket bridge architecture. Its Plugin ↔ WebSocket ↔ CLI layered design gave us valuable architectural insights.

## Addons

Addon projects extend remnote-bridge with additional capabilities:

| Addon | Description |
|:------|:------------|
| [remnote-rag](https://github.com/baobao700508/remnote-rag) | Semantic search via ChromaDB + DashScope embeddings |
| [remnote-chat](https://github.com/baobao700508/remnote-chat) | Chat interface for RemNote knowledge base |

```bash
# List available addons
remnote-bridge addon list

# Install an addon
remnote-bridge addon install remnote-rag

# Uninstall (--purge to remove data)
remnote-bridge addon uninstall remnote-rag --purge
```

## Roadmap

- **RAG-powered search** — Semantic retrieval via local SQLite + ChromaDB, complementing SDK full-text search
- **Multi-language support** — Internationalization for broader accessibility

## Changelog

### 0.1.13 (2026-03-15)

- **edit-rem rewrite** — Replaced str_replace with direct field modification (`--changes` flag)
- **MCP resources removed** — All documentation inlined into tool descriptions and server instructions
- **MCP return format standardized** — Frontmatter+Body for outline tools, Data JSON for action tools

### 0.1.12 (2026-03-15)

- **Multi-instance support** — `--instance <name>` flag, global registry at `~/.remnote-bridge/`, parallel daemons
- **Multi-connection Plugin** — Single Plugin connects to multiple daemons with twin priority mechanism
- **Addon system** — `addon list|install|uninstall` commands for managing extension projects (remnote-rag, remnote-chat)
- **read-context focusRemId** — Optional parameter to specify focus target without changing RemNote UI
- **Output refinements** — `children` moved from default to full mode (`read-rem --full`)

### 0.1.9 (2026-03-09)

- Recommend standard mode for daily use; headless only for full automation

### 0.1.8 (2026-03-09)

- **Headless Chrome** — `setup` + `connect --headless` + `health --diagnose/--reload` for zero-intervention workflows
- **Static plugin server** — Lightweight production server replacing webpack-dev-server in non-dev mode

### 0.1.7 (2026-03-08)

- **Portal support** — Read/edit Portal Rem with dual-path resolution (portal ↔ source)
- **Tree operations** — Create and delete Rem via `edit-tree`

### 0.1.6 (2026-03-07)

- Connect timeout extended from 10s to 60s

### 0.1.5 (2026-03-07)

- Dev-server crash self-healing (clean reinstall + retry)

### 0.1.4 (2026-03-07)

- **Windows compatibility** fixes
- `clean` command for removing residual files
- `read-context` prompt enhancements

### 0.1.3 (2026-03-07)

- RichText documentation overhaul

### 0.1.2 (2026-03-07)

- **Vercel Skills** ecosystem integration (`npx skills add ...`)
- `connect` user guidance improvements

### 0.1.1 (2026-03-07)

- Slim npm package (precise `files` whitelist)

### 0.1.0 (2026-03-07)

- Initial release — CLI + MCP Server + Plugin as single `remnote-bridge` package
- Commands: `connect`, `disconnect`, `health`, `read-rem`, `edit-rem`, `read-tree`, `edit-tree`, `read-globe`, `read-context`, `search`
- Three-layer architecture: Plugin (RemNote SDK) → CLI (commands) → MCP/Skill (AI agents)
- Session-based LRU cache with optimistic concurrency control
- Powerup noise filtering, ancestor breadcrumbs, ellipsis for large trees

## License

MIT
