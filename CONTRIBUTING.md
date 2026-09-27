# Contributing

Sprout is the official first-run PhreshOS Program. Changes belong here when
they keep a clear, calm path from a newly installed System to the owner's
first Programs, or to a System kept fresh.

## Development

Install the pinned toolchain and verify the repository:

```sh
bun install --frozen-lockfile
bun run verify
```

`bun run dev` attaches Sprout to the running System. Every reload starts
again from the welcome, so each step can be reviewed.

## Changes

- Keep the planting on the Server: the browser only follows its state and
  sends actions.
- Draw with React UI and its Appearance-derived values; do not add fixed
  sizes or colors.
- Keep [agent.md](agent.md) in step with the Server's questions, so agents
  plant the same way the window does.
