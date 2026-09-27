# Sprout

The first Program a new PhreshOS System runs. It welcomes the owner, helps
them plant their first Programs, then steps aside.

[Installation](https://phreshos.com/docs/installation) ·
[Programs](https://phreshos.com/docs/runtime/programs) ·
[Source](https://github.com/PhreshOS/sprout-program)

## Role

A new System comes empty: no Settings, no Files, no Terminal. Sprout is the
one Program it starts with, and it offers the rest:

- a short welcome;
- the few choices the owner sees the System through: theme and Desktop size;
- the official Programs, from their latest verified releases, to plant.

The owner can also keep the System fresh: Sprout ends, and nothing else is
installed.

Sprout lives in the Desktop's `over` layer and places, draws, and ends
itself. Its Server finds the official releases, checks each package against
its SHA-256 checksum, and installs the chosen Programs, keeping the planting's
state so every browser showing Sprout follows the same one. An AI agent can
plant through the same Server; see [agent.md](agent.md).

## Installation

```sh
phresh install sprout --run
```

## Development

```sh
bun install --frozen-lockfile
bun run verify
bun run dev
```

During development, every reload starts again from the welcome.

Build, run the production definition, or package a release with:

```sh
bun run build
bun run start
bun run pack
```

## License

MIT. See [LICENSE](LICENSE).
