import { ContextProvider, DesktopProvider, SystemProvider, useClientMemory, useResolvedDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { context, desktop, system } from "@phreshos/client"
import { DocumentTheme, Readiness, resolveRadius, Spinner, UIProvider, useAppearance, usePreferences, useThemedValue } from "@phreshos/react-ui"
import { StrictMode, useEffect, useLayoutEffect, useState } from "react"
import client from "react-dom/client"
import Sprout, { type Step } from "./sprout"
import Clock from "./clock"
import { useClockPlacement } from "./clock-placement"
import "./style.css"

client.createRoot(document.getElementById("sprout")!).render(<StrictMode>
    <SystemProvider system={system}>
        <DesktopProvider desktop={desktop}>
            <ContextProvider context={context}>
                <Themed />
            </ContextProvider>
        </DesktopProvider>
    </SystemProvider>
</StrictMode>)

function Themed() {
    const preferences = useResolvedDesktopPreferences()
    const view = useView()

    return <UIProvider appearance={useSystemAppearance()} preferences={preferences}>
        <DocumentTheme />
        {view === undefined ? null : view.view === "clock" ? <ClockPage startedAt={view.startedAt} expiresAt={view.expiresAt} /> : <Page />}
    </UIProvider>
}

/** What this Process of Sprout shows, from the options it was created with: Sprout itself, or the demo's clock. */
function useView() {
    const [view, setView] = useState<Readonly<Record<string, string>>>()
    useEffect(() => {
        void context.options().then(setView)
    }, [])
    return view
}

/** The demo's clock, in its place behind the Windows. */
function ClockPage({ startedAt, expiresAt }: Readonly<{ startedAt?: string, expiresAt?: string }>) {
    useClockPlacement()
    const appearance = useAppearance()
    const { foreground } = useThemedValue(appearance.colors)
    if (!startedAt || !expiresAt) return null
    return <div className="page" style={{ color: foreground }}><Clock startedAt={Date.parse(startedAt)} expiresAt={Date.parse(expiresAt)} /></div>
}

/** Sprout's text takes the Appearance text color of the current theme. */
function Page() {
    const appearance = useAppearance()
    const { foreground } = useThemedValue(appearance.colors)

    // The page keeps the corners of the Surface the Desktop draws behind it, so nothing drawn over
    // the whole page, such as a dialog's backdrop, reaches past them.
    useLayoutEffect(() => {
        const radius = resolveRadius("medium", appearance.radius)
        document.body.style.borderRadius = typeof radius === "number" ? `${radius}px` : String(radius)
    }, [appearance.radius])

    const { animations } = usePreferences()
    const step = useClientMemory<Step>("step", "welcome")
    // During development every reload plays the welcome again, as Sprout does.
    const welcoming = import.meta.env.DEV || step[0] === "welcome"

    // One opening: Sprout shows once the state it opens with has arrived from the System. Before the
    // welcome it waits a moment more, so the welcome's scene never starts before the owner is looking;
    // once the welcome is behind, or without motion, it opens at once.
    return <div className="page" style={{ color: foreground }}>
        <Readiness delay={animations && welcoming ? opening : 0} status={({ ready }) => ready ? null : <Opening />}><Sprout step={step} /></Readiness>
    </div>
}

/** The moment Sprout waits before the welcome, after its state has arrived, in milliseconds. */
const opening = 1500

/** A Spinner while Sprout opens: a short wait for the state it opens with. */
function Opening() {
    return <main className="preparing"><Spinner label="Opening Sprout" /></main>
}
