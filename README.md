# remnote-bridge

[中文文档](./README_CN.md)

Bridge toolkit that exposes your RemNote knowledge base to AI agents. Single package — CLI, MCP Server, and Plugin all in one.

## Install

```bash
npm install -g remnote-bridge
```

## Quick Start

```bash
# 1. Start the daemon (launches WS server + plugin dev server)
remnote-bridge connect

# 2. Load the plugin in RemNote
#    Open RemNote → Settings → Plugins → Add Local Plugin
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
remnote-bridge edit-rem <remId> --old-str '"concept"' --new-str '"descriptor"'
remnote-bridge edit-tree <remId> --old-str '  old line <!--id-->' --new-str '  new line\n  old line <!--id-->'

# 6. Stop the daemon
remnote-bridge disconnect
```

## Commands

### Infrastructure

| Command | Description |
|:--------|:------------|
| `connect` | Start the daemon process (WS server + plugin dev server) |
| `health` | Check daemon, Plugin, and SDK status |
| `disconnect` | Stop the daemon and release resources |

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
| `edit-rem <remId>` | Edit Rem JSON fields via str_replace | `read-rem` first |
| `edit-tree <remId>` | Edit tree structure via str_replace | `read-tree` first |

### Utilities

| Command | Description |
|:--------|:------------|
| `mcp` | Start the MCP Server (stdio transport) |
| `install skill` | Install Claude Code skill to `~/.claude/skills/remnote-bridge/` |

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

The MCP server exposes all CLI commands as tools, plus documentation resources.

## Claude Code Skill

```bash
remnote-bridge install skill
```

Installs the skill to `~/.claude/skills/remnote-bridge/`, enabling Claude Code to operate your RemNote knowledge base through natural language.

## JSON Mode

All commands support `--json` for programmatic usage. In JSON mode, both input and output are JSON:

```bash
# Input: all parameters packed in a JSON string
remnote-bridge --json read-rem '{"remId":"abc123","fields":["text","type"]}'

# Output: single-line JSON
# {"ok":true,"command":"read-rem","timestamp":"...","data":{...}}
```

## Architecture

```
AI Agent (Claude Code / MCP Client)
    ↕  CLI commands (stateless short processes)
remnote-bridge CLI
    ↕  WebSocket IPC
Daemon (long-lived process: WS server + handlers + cache)
    ↕  WebSocket
remnote-plugin (runs inside RemNote browser)
    ↕
RemNote SDK → Knowledge Base
```

- **CLI commands** are stateless — each invocation is an independent OS process
- **Daemon** holds state: cache, WS connections, timeout timer
- **Plugin** runs in the browser, calls RemNote SDK on behalf of the daemon
- **Three safety guards** protect edits: cache existence check, optimistic concurrency detection, str_replace exact match

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

## Roadmap

- **MCP tool decomposition** — Break the current 1:1 CLI-to-MCP mapping into finer-grained tools, giving AI agents more flexible and composable operations
- **Improved agent instructions** — Refine Skill documentation and MCP server instructions for better AI agent comprehension
- **RAG-powered search** — Research RemNote's local database structure to enable retrieval-augmented search, replacing the current SDK-based full-text search with more efficient semantic retrieval
- **Multi-language support** — Internationalization for broader accessibility

## License

MIT
