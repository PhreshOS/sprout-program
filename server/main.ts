import { context, system } from "@phreshos/server"
import { z } from "zod"
import { readFile } from "node:fs/promises"
import ProgramInstaller from "./core/program-installer"
import ProgramReleases from "./core/program-releases"

/** Where a demo machine records its lifetime. */
const demoFile = "/etc/phreshos/demo.json"

const releases = new ProgramReleases()
// The planting lives here, on the Server, so every browser showing Sprout follows the same one.
const installer = new ProgramInstaller(releases, system.program, snapshot => context.client.publish("planting", snapshot))

const identity = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const catalogRequest = z.object({ retry: z.boolean() }).optional()
const plantRequest = z.object({ programs: z.array(identity).min(1).max(100) })

/** Every official Program that can be planted, with its latest stable release. */
context.answer("catalog", async ({ payload }) => {
    const request = catalogRequest.parse(payload)
    return (await releases.list(1, Number.MAX_SAFE_INTEGER, request?.retry ?? false)).releases
})

/** The planting as it is now; changes follow as `planting` messages. */
context.answer("planting", () => installer.snapshot())

/** Plants the chosen Programs, returning the planting as it starts. */
context.answer("plant", async ({ payload }) => installer.start(plantRequest.parse(payload).programs))

/**
 * Whether this System runs on a demo machine, and its lifetime: the machine it runs on writes it
 * to a file when it boots. On any other machine there is no file, and the answer is nothing.
 */
context.answer("demo", async () => {
    try {
        const { startedAt, expiresAt } = JSON.parse(await readFile(demoFile, "utf8")) as Record<string, unknown>
        if (typeof startedAt !== "string" || typeof expiresAt !== "string" || Number.isNaN(Date.parse(startedAt)) || Number.isNaN(Date.parse(expiresAt))) return null
        return { startedAt, expiresAt }
    }
    catch {
        return null
    }
})
