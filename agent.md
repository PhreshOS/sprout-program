# Sprout

Sprout is the first Program a new PhreshOS System runs. It welcomes the
owner and plants their first Programs: the official Programs, from verified
releases. Its window and you use the same three operations on its Server, so
the owner sees on Sprout's screen whatever you plant.

## Find Sprout's Process

```sh
phresh process list --program sprout --json
```

Use the `identity` of the Process as `<process>` below. If none is running,
Sprout has finished or was never started.

## The catalog

```sh
phresh endpoint ask --program sprout --process <process> --endpoint server --event catalog --json
```

Each entry has `identity`, `name`, `version`, `description`, and
`categories`. The catalog is read from GitHub, which limits how often it can
be read. When that limit is used up, the error says when it resets; after
that time, ask again with `--payload '{"retry":true}'`. Without `retry`,
Sprout returns the same failure it last saw.

## Plant

Ask the owner what they want first. Then plant their choice by identity:

```sh
phresh endpoint ask --program sprout --process <process> --endpoint server --event plant --payload '{"programs":["terminal","settings"]}' --json
```

Each Program is downloaded, checked against its SHA-256 checksum, and
installed, one after another. A Program that is already installed is left as
it is.

## Follow the planting

```sh
phresh endpoint ask --program sprout --process <process> --endpoint server --event planting --json
```

`status` is `idle`, `running`, `completed`, or `failed`, and each entry of
`programs` has its own `status` and, when it failed, its `error`. Planting
the failed identities again retries them.

Installing a Program lets it run as its definition says, so some Programs
open their windows when they are planted. When planting is done, the owner
closes Sprout from its window.
