import type { Program } from "@phreshos/core"

/** A demo machine's lifetime, as the machine records it. */
export type Demo = Readonly<{ startedAt: string, expiresAt: string }>

/** The name of the Process that shows the demo's clock; there is only ever one. */
export const clockProcess = "clock"

/**
 * Starts the demo's clock behind the Windows, and has it start again with the System, so it stays
 * for the rest of the machine's life whatever becomes of Sprout's own window. Its lifetime travels
 * as the Process's options, so the clock needs nothing else to count.
 */
export async function startClock(program: Program, demo: Demo) {
    const launch = { name: clockProcess, client: { layer: "under" as const }, options: { view: "clock", startedAt: demo.startedAt, expiresAt: demo.expiresAt } }
    await program.startup.set(launch)
    await program.findOrCreateProcess(launch)
}
