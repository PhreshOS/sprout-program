import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import config from "../phresh.config"
import manifest from "../package.json" with { type: "json" }
import { test } from "vitest"

test("build contract", () => {
  assert.equal(config.identity, "sprout")
  assert.equal(config.name, "Sprout")
  assert.equal(config.version, manifest.version)
  assert.equal(config.server?.worker, "main.js")
  assert.equal(config.client?.location, "dist/client")
  assert(readFileSync("dist/client/index.html", "utf8").length > 0)
  assert(readFileSync("dist/server/main.js", "utf8").length > 0)
}, 120_000)
