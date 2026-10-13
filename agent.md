# Sprout

Sprout is the first Program a new PhreshOS System runs. It welcomes the
owner and plants their first Programs: the official Programs, from verified
releases. Its window and you use the same three operations on its Server, so
the owner sees on Sprout's screen whatever you plant.

Every request here is an Execute request: a JSON object the System understands
as it is. Ask Sprout's Server with an `endpoint` `ask` request, the event's
payload as its `input`.

## Find Sprout's Process

```json
{ "$domain": "process", "$operation": "list", "program": "sprout" }
```

Use the `identity` of the Process as `<process>` below. If none is running,
Sprout has finished or was never started.

## The catalog

```json
{ "$domain": "endpoint", "$operation": "ask", "process": "<process>", "endpoint": "server", "event": "catalog" }
```

Each entry has `identity`, `name`, `version`, `description`, and
`categories`. The catalog is read from GitHub, which limits how often it can
be read. When that limit is used up, the error says when it resets; after
that time, ask again with `"input": { "retry": true }`. Without `retry`,
Sprout returns the same failure it last saw.

## Plant

Ask the owner what they want first. Then plant their choice by identity:

```json
{ "$domain": "endpoint", "$operation": "ask", "process": "<process>", "endpoint": "server", "event": "plant", "input": { "programs": ["terminal", "settings"] } }
```

Each Program is downloaded, checked against its SHA-256 checksum, and
installed, one after another. A Program that is already installed is left as
it is.

## Follow the planting

```json
{ "$domain": "endpoint", "$operation": "ask", "process": "<process>", "endpoint": "server", "event": "planting" }
```

`status` is `idle`, `running`, `completed`, or `failed`, and each entry of
`programs` has its own `status` and, when it failed, its `error`. Planting
the failed identities again retries them.

Installing a Program lets it run as its definition says, so some Programs
open their windows when they are planted. When planting is done, the owner
closes Sprout from its window.
