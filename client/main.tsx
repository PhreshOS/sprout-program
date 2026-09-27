import { ContextProvider, DesktopProvider, SystemProvider, useClientMemory, useDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { context, desktop, system } from "@phreshos/client"
import { ProgressBar, Readiness, resolveRadius, UIProvider, useAppearance, usePreferences, useThemedValue } from "@phreshos/react-ui"
import { StrictMode, useLayoutEffect } from "react"
import client from "react-dom/client"
import Sprout, { type Step } from "./sprout"
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
    const preferences = useDesktopPreferences()

    // The page's color scheme follows the Desktop's theme. When they differ, the
    // browser paints this frame opaque instead of letting the surface behind it show.
    useLayoutEffect(() => {
        document.documentElement.style.colorScheme = preferences.theme
    }, [preferences.theme])

    return <UIProvider appearance={useSystemAppearance()} preferences={preferences}>
        <Page />
    </UIProvider>
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

/** A moving bar while Sprout opens. It measures nothing, so it shows no value. */
function Opening() {
    return <main className="preparing">
        <div className="preparing-bar"><ProgressBar aria-label="Opening Sprout" indeterminate /></div>
    </main>
}
