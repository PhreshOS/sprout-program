import { Badge, Flex, ProgressBar, Text } from "@phreshos/react-ui"
import { useEffect, useState } from "react"

/**
 * The demo's clock: how long this temporary machine has left, drawn behind the
 * Windows. It counts down to the moment the machine is removed, whether or not
 * anyone is looking, and says plainly that nothing here is kept.
 */
export default function Clock({ startedAt, expiresAt }: Readonly<{ startedAt: number, expiresAt: number }>) {
    const now = useNow()
    const left = Math.max(0, expiresAt - now)
    const share = expiresAt > startedAt ? left / (expiresAt - startedAt) : 0

    return <main className="clock">
        <Flex direction="column" gap="medium">
            <Flex align="center" justify="between" gap="small">
                <Text size="small" tone="secondary">This demo returns to seed in</Text>
                <Badge color="primary" size="small" dot>Demo</Badge>
            </Flex>
            <span className="clock-time" role="timer" aria-live="off">{format(left)}</span>
            {/* The time above already says how much is left, so the bar shows no number of its own. */}
            <ProgressBar aria-label="Time left in this demo" value={share * 100} valueLabel="" size="small" color="primary" />
            <Text size="small" tone="secondary">It is a temporary machine: nothing you do here is kept.</Text>
        </Flex>
    </main>
}

/** The current time, updated each second. */
function useNow() {
    const [now, setNow] = useState(Date.now)

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    return now
}

/** Minutes and seconds, with hours only when there are some. */
function format(milliseconds: number) {
    const total = Math.ceil(milliseconds / 1000)
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor(total % 3600 / 60)
    const seconds = total % 60
    const two = (value: number) => String(value).padStart(2, "0")
    return hours ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`
}
