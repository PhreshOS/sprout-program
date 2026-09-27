import { ContextProvider, DesktopProvider, SystemProvider, useDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { context, desktop, system } from "@phreshos/client"
import { ProgressBar, Readiness, resolveRadius, UIProvider, useAppearance, usePreferences, useThemedValue } from "@phreshos/react-ui"
import { StrictMode, useLayoutEffect } from "react"
import client from "react-dom/client"
import Sprout from "./sprout"
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

    // One opening: Sprout shows once the state it opens with has arrived from the System, and a moment
    // after that, so the welcome never starts before the owner is looking. Without motion, no moment.
    return <div className="page" style={{ color: foreground }}>
        <Readiness delay={animations ? opening : 0} status={({ ready }) => ready ? null : <Opening />}><Sprout /></Readiness>
    </div>
}

/** The moment Sprout waits after its state has arrived, in milliseconds. */
const opening = 1500

/** A moving bar while Sprout opens. It measures nothing, so it shows no value. */
function Opening() {
    return <main className="preparing">
        <div className="preparing-bar"><ProgressBar aria-label="Opening Sprout" indeterminate /></div>
    </main>
}
