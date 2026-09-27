import { useContext, useDesktopViewport, useSystemAppearance } from "@phreshos/react"
import { useEffect, useRef } from "react"
import { departure } from "./leave"

/** The size Sprout asks for; it shrinks to fit a smaller Desktop. */
const preferred = { width: 880, height: 600 } as const

/**
 * Sprout floats in the `over` layer, where the Desktop does not manage it as a
 * Window: it centers itself in the space the Desktop leaves for Windows, asks
 * for the System surface behind it, and follows the Desktop's size at once. It
 * grows in with the Appearance timing only the first time it appears.
 */
export function usePlacement() {
    const { presentation } = useContext()
    const { size } = useDesktopViewport()
    // The System Appearance holds the Taskbar settings as well as the spacing.
    const { spacing, taskbar } = useSystemAppearance()
    const placed = useRef(false)
    const current = useRef<Readonly<{ x: number, y: number, width: number, height: number }>>(undefined)

    useEffect(() => {
        // The same space standard Windows get: the spacing on every edge, and the Taskbar's edge
        // reserved as well unless the Taskbar overlays Windows.
        const inset = { top: spacing, right: spacing, bottom: spacing, left: spacing }
        if (!taskbar.overlay) inset[taskbar.position] += taskbar.size + spacing
        const area = {
            x: inset.left,
            y: inset.top,
            width: size.width - inset.left - inset.right,
            height: size.height - inset.top - inset.bottom
        }
        const width = Math.min(preferred.width, area.width)
        const height = Math.min(preferred.height, area.height)
        const center = { x: area.x + area.width / 2, y: area.y + area.height / 2 }
        const geometry = { x: center.x - width / 2, y: center.y - height / 2, width, height }
        current.current = geometry

        if (placed.current) {
            // Following a change to the Desktop, Sprout is simply in its new place, as if built
            // there, instead of trailing the Desktop with its own motion.
            void presentation.setGeometry(geometry)
            return
        }
        placed.current = true
        // It starts a little smaller at the same center, then grows to its place.
        const start = { width: width * 0.94, height: height * 0.94 }
        void (async () => {
            await presentation.setGeometry({ x: center.x - start.width / 2, y: center.y - start.height / 2, ...start })
            await presentation.setSurface(true)
            await presentation.transaction().setGeometry(geometry)
        })()
    }, [presentation, size.width, size.height, spacing, taskbar.position, taskbar.size, taskbar.overlay])

    /**
     * The reverse of the entrance: Sprout eases a little smaller at the same center while the Desktop
     * takes its Surface away, and resolves once that has finished. Without motion, it is simply gone.
     */
    return async function leave(animated: boolean) {
        const geometry = current.current
        if (!animated || !geometry) return presentation.setSurface(false)
        const end = { width: geometry.width * 0.94, height: geometry.height * 0.94 }
        const center = { x: geometry.x + geometry.width / 2, y: geometry.y + geometry.height / 2 }
        // The same calm pace as the farewell's words, slower than the Appearance's.
        const leaving = presentation.transactionAndWait(departure)
        await Promise.all([
            leaving.setGeometry({ x: center.x - end.width / 2, y: center.y - end.height / 2, ...end }),
            leaving.setSurface(false)
        ])
    }
}
