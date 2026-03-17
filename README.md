# remnote-cli

![Status](https://img.shields.io/badge/status-beta-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)
![CI](https://github.com/robert7/remnote-cli/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/robert7/remnote-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/robert7/remnote-cli)

CLI (command-line interface) companion for the [RemNote Automation Bridge](https://github.com/robert7/remnote-mcp-bridge) plugin.
Provides terminal access to your RemNote knowledge base through a lightweight daemon architecture.
Useful e.g. for integration with OpenClaw agents, scripting and other automation.

> This is a working solution, but still experimental. If you run into any issues, please [report them here](https://github.com/robert7/remnote-cli/issues).

## Demo

See CLI flow and troubleshooting in action: **[View Demo →](docs/demo.md)**

## Architecture

```
RemNote + Automation Bridge Plugin (WebSocket client)
         │
         │ ws://127.0.0.1:3002
         ▼
CLI Daemon (background process)
  ├─ WebSocket Server :3002
  └─ HTTP Control API :3100
         ▲
         │ HTTP
CLI Commands (short-lived)
  e.g. remnote-cli create "My Note"
```

Two components: the RemNote Automation Bridge plugin connects to the CLI daemon's WebSocket server. CLI commands talk
to the daemon over a local HTTP control API.

On current bridge builds, the plugin starts its connection attempts when the Automation Bridge sidebar panel is opened.
If that panel was never opened, the CLI daemon can be running correctly while `status` still shows `connected: false`.

## Quick Start

> **Version compatibility (`0.x` semver):** install a `remnote-cli` version compatible with your installed RemNote Automation Bridge plugin version. See the [Bridge / Consumer Version Compatibility Guide](https://github.com/robert7/remnote-mcp-bridge/blob/main/docs/guides/bridge-consumer-version-compatibility.md).

```bash
npm install -g remnote-cli

# Start the daemon
remnote-cli daemon start

# Open RemNote, open the Automation Bridge sidebar panel, and wait for Connected

# Check connection (requires the bridge panel to be open and connected)
remnote-cli status --text

# Create a note
remnote-cli create "My Note" --content-file /tmp/my-note.md --text

# Search
remnote-cli search "My Note" --text

# Stop the daemon
remnote-cli daemon stop
```

## Documentation

### Getting Started

- **[Installation Guide](docs/guides/installation.md)** - Prerequisites and install methods
- **[Bridge / Consumer Version Compatibility Guide](https://github.com/robert7/remnote-mcp-bridge/blob/main/docs/guides/bridge-consumer-version-compatibility.md)** - Match CLI version to installed bridge plugin version (`0.x` semver)
- **[Daemon Management](docs/guides/daemon-management.md)** - Start, stop, status, logs, and PID behavior
- **[Demo & Screenshots](docs/demo.md)** - Terminal walkthrough of daemon startup, connection checks, and search

### Usage

- **[Command Reference](docs/guides/command-reference.md)** - All CLI commands and examples

### Help & Advanced

- **[Troubleshooting](docs/guides/troubleshooting.md)** - Common issues and fixes

### Development

- **[Development Setup](docs/guides/development-setup.md)** - Local setup, workflows, and quality checks
- **[Integration Testing](docs/guides/integration-testing.md)** - End-to-end testing against live RemNote

## Commands

| Command | Description |
|---------|-------------|
| `daemon start` | Start the background daemon |
| `daemon stop` | Stop the daemon |
| `daemon status` | Show daemon process status |
| `create <title>` | Create a new note |
| `search <query>` | Search for notes |
| `search-tag <tag>` | Search for tagged notes with ancestor context |
| `read <rem-id>` | Read a note by ID |
| `update <rem-id>` | Update an existing note |
| `journal [content]` | Append to today's journal |
| `status` | Check bridge connection status |

## Global Options

| Flag | Description |
|------|-------------|
| `--json` | JSON output (default) |
| `--text` | Human-readable output |
| `--control-port <port>` | Override control port (default: 3100) |
| `--verbose` | Enable verbose stderr logging |
| `--version` | Show version |
| `--help` | Show help |

## Configuration

| Setting | Default | Environment |
|---------|---------|-------------|
| WebSocket port | 3002 | `--ws-port` flag on `daemon start` |
| Control port | 3100 | `--control-port` global flag |
| PID file | `~/.remnote-cli/daemon.pid` | — |
| Log file | `~/.remnote-cli/daemon.log` | `--log-file` flag on `daemon start` |

## Prerequisites

- Node.js >= 18
- RemNote desktop app with the [RemNote Automation Bridge plugin](https://github.com/robert7/remnote-mcp-bridge) installed and enabled

## Troubleshooting

**Daemon won't start — port in use:**
Another process is using port 3002 or 3100. Use `--ws-port` or `--control-port` to pick different ports.

**"Bridge not connected" after daemon start:**
Open RemNote, open the Automation Bridge sidebar panel, and make sure it shows **Connected**. If RemNote was already
open before the daemon started, click **Reconnect** in the panel after the daemon is listening.

**Stale PID file:**
If the daemon crashed, `daemon start` will detect the stale PID file and clean it up automatically.

**Commands fail after plugin/CLI upgrade:**
Check bridge plugin version and `remnote-cli --version`, then install a compatible CLI version (prefer same minor line for `0.x`). See the [Bridge / Consumer Version Compatibility Guide](https://github.com/robert7/remnote-mcp-bridge/blob/main/docs/guides/bridge-consumer-version-compatibility.md).

## Related Projects

- [remnote-mcp-server](https://github.com/robert7/remnote-mcp-server) — MCP server integration path
- [remnote-mcp-bridge](https://github.com/robert7/remnote-mcp-bridge) — RemNote Automation Bridge plugin

## License

MIT
