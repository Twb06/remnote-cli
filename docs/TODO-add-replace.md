# TODO: Add Replace Semantics For `update`

This document captures a future enhancement idea so we can resume quickly.

## Goal

Add explicit replace semantics for note content updates in `remnote-cli`, for example:

- `remnote-cli update <rem-id> --replace "<text>"`
- `remnote-cli update <rem-id> --replace-file <path|->`

## Proposed Meaning

`replace` should overwrite existing note child content instead of appending.

Open design question:

- Replace only direct child bullets under `<rem-id>`, or
- Replace the entire descendant subtree.

Direct-child replacement is likely the safer first version.

## Why This Is Cross-Repo

Today the bridge contract supports `appendContent` only.

To implement real replace behavior, changes are needed in all companion repos:

1. `remnote-cli`
   - Add `--replace` / `--replace-file` flags and mutual-exclusion rules with append flags.
   - Map to a new payload field (for example `replaceContent`).
2. `remnote-mcp-bridge`
   - Extend `update_note` payload contract and adapter logic to execute replace semantics.
3. `remnote-mcp-server`
   - Extend Zod schema + MCP tool input schema/docs so MCP consumers get parity.

## Safety Notes

- Replace is potentially destructive; UX should prevent accidental data loss.
- Consider a confirmation gate for non-interactive usage (or strict mutual exclusivity rules).
- Add precise tests for content preservation, tag/title interactions, and empty replacement behavior.

## Suggested Rollout

1. Contract proposal and semantics agreement (all three repos).
2. Bridge implementation + tests.
3. CLI flags + tests.
4. MCP schema/docs parity update.
5. Human-run live validation in RemNote session.
