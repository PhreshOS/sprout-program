import { useContext } from "@phreshos/react"
import { usePreferences, type AppearanceTransaction } from "@phreshos/react-ui"
import { createContext, useContext as useReactContext, useEffect, useRef, useState, type CSSProperties } from "react"

/** How Sprout ended: the owner kept the System empty, or planted what they chose. */
export type Finish = "kept fresh" | "planted"

/** The last words Sprout shows, in the language of the garden. */
const farewell: Readonly<Record<Finish, string>> = {
    planted: "Let it grow.",
    "kept fresh": "Stay fresh."
}

/** How Sprout starts to end: Sprout itself shows the farewell, then leaves. */
export const FinishContext = createContext<((finish: Finish) => void) | null>(null)

/** Begins Sprout's ending, from any step. */
export function useFinish() {
    const begin = useReactContext(FinishContext)
    if (!begin) throw new Error("useFinish needs Sprout's FinishContext")
    return begin
}

/**
 * Whether the farewell's display font has arrived. Sprout waits for it while
 * opening, so the last words never appear in a fallback font first. A font
 * that fails to load does not hold Sprout: the words fall back to Georgia.
 */
export function useFarewellFont() {
    const [arrived, setArrived] = useState(false)

    useEffect(() => {
        let current = true
        const arrive = () => { if (current) setArrived(true) }
        // Only the files covering the farewell's own characters are fetched.
        document.fonts.load(`1em "Fraunces Variable"`, Object.values(farewell).join("")).then(arrive, arrive)
        return () => { current = false }
    }, [])

    return arrived
}

/** How long the words hold before they fade, in milliseconds. */
const holding = 2400

/** The calm pace of the ending: the words fade, then the Surface goes, both at this timing. */
export const departure: AppearanceTransaction = { duration: 1100, easing: [0.45, 0, 0.25, 1] }

/**
 * Sprout's ending. Its end is recorded first, so Sprout does not start again
 * even if the owner leaves mid-way. The farewell holds a moment and fades;
 * then Sprout takes its own Surface away and its Process exits. The Desktop
 * does not shape a Program's ending in the over layer, so Sprout does.
 */
export function Farewell({ finish, leave }: Readonly<{ finish: Finish, leave: (animated: boolean) => Promise<void> }>) {
    const context = useContext()
    const { animations } = usePreferences()
    const [fadingOut, setFadingOut] = useState(false)
    const leaving = useRef(leave)
    leaving.current = leave

    useEffect(() => {
        let current = true
        const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, animations ? milliseconds : 0))
        void (async () => {
            const program = await context.program()
            await program.store.set("finished", finish)
            await wait(holding)
            if (!current) return
            setFadingOut(true)
            await wait(departure.duration)
            await leaving.current(animations)
            await (await context.process()).exit()
        })()
        return () => { current = false }
    }, [context, finish, animations])

    return <main className="farewell" data-fading={fadingOut} data-motion={animations}
        style={{ "--departure": `${departure.duration}ms cubic-bezier(${(departure.easing as readonly number[]).join(", ")})` } as CSSProperties}>
        <p className="farewell-words">{farewell[finish]}</p>
    </main>
}
