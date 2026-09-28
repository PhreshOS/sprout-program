import { useContext, useDesktopViewport, useSystemAppearance } from "@phreshos/react"
import { useEffect, useRef } from "react"

/** How long the clock waits, once ready, before it appears, in milliseconds. */
const settling = 700

/** The clock's slow entrance. */
const appearance = { duration: 1400, easing: [0.22, 1, 0.36, 1] as const }

/**
 * The demo's clock sits behind the Windows, mirroring the Taskbar's Sign out across the Desktop:
 * on the edge facing the Taskbar, at the end where Sign out is, a little further in than the
 * Taskbar sits from its edge. With the Taskbar along the bottom, that is the top right. It asks for
 * the System surface behind it, lets every press through to the Desktop, and grows in once.
 */
export function useClockPlacement() {
    const { presentation } = useContext()
    const { size } = useDesktopViewport()
    const { spacing, taskbar } = useSystemAppearance()
    const placed = useRef(false)

    useEffect(() => {
        if (!size.width || !size.height) return
        const width = spacing * 25
        const height = Math.round(spacing * 14.5)
        const inset = spacing * 2
        // Sign out ends the Taskbar: its right end when the Taskbar lies across, its bottom end when it stands.
        const across = taskbar.position === "top" || taskbar.position === "bottom"
        const left = across ? size.width - inset - width : taskbar.position === "left" ? size.width - inset - width : inset
        const top = across ? (taskbar.position === "bottom" ? inset : size.height - inset - height) : size.height - inset - height
        // Positions count from the Desktop's center.
        const geometry = { x: left - size.width / 2, y: top - size.height / 2, width, height }

        if (placed.current) {
            void presentation.setGeometry(geometry)
            return
        }
        placed.current = true
        const start = { width: width * 0.94, height: height * 0.94 }
        void (async () => {
            presentation.setInteractive(false)
            await presentation.setGeometry({ x: geometry.x + (width - start.width) / 2, y: geometry.y + (height - start.height) / 2, ...start })
            // The clock appears only once its words and digits have settled, a moment after Sprout has
            // gone, so it seems to grow there rather than arrive; and it grows in slowly, like the garden.
            await document.fonts.ready
            await new Promise(resolve => setTimeout(resolve, settling))
            const growing = presentation.transaction(appearance)
            await Promise.all([growing.setSurface(true), growing.setGeometry(geometry)])
        })()
    }, [presentation, size.width, size.height, spacing, taskbar.position])
}
