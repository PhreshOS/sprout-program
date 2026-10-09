import { useClientMemory, useDesktop, useDesktopPreferences } from "@phreshos/react"
import { Button, Flex, Heading, Link, SegmentedControl, Select, Text, usePreferences, useReadiness, useRequirement } from "@phreshos/react-ui"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Farewell, FinishContext, useFarewellFont, useFinish, type Finish } from "./leave"
import Plant, { usePlanting, useSelection } from "./plant"
import { usePlacement } from "./placement"
import { drawScene, sceneDuration } from "./scene"

export type Step = "welcome" | "personalize" | "plant" | "farewell"

/**
 * Sprout's steps. The current step lives in Client memory, so a reload or the
 * same Sprout opened from another Desktop continues where it is, while a new
 * run starts again from the welcome. It is read by the page, which opens
 * according to it, and passed here.
 */
export default function Sprout({ step: [stored, setStep] }: Readonly<{ step: ReturnType<typeof useClientMemory<Step>> }>) {
    const leave = usePlacement()
    // Once the owner ends Sprout, its farewell takes the place of every step.
    const [ending, setEnding] = useState<Finish>()
    const step = stored as Step | undefined
    // Everything the steps open with is read here, once, so moving between steps never waits again.
    const selection = useSelection()
    const planting = usePlanting()
    const font = useFarewellFont()
    useRequirement(step !== undefined && selection.loaded && planting !== undefined && font)
    // During development every reload starts from the welcome, so it can be reviewed again.
    const [begun, setBegun] = useState(false)
    // Nothing starts before Sprout has opened, so the welcome's scene plays in front of the owner.
    if (!useReadiness().ready || step === undefined || planting === undefined) return null

    const shown: Step = ending ? "farewell" : (import.meta.env.DEV ? !begun : step === "welcome") ? "welcome" : step

    return <FinishContext.Provider value={setEnding}><StepTransition step={shown}>
        {shown === "farewell"
            ? <Farewell finish={ending!} leave={leave} />
            : shown === "welcome"
            // The welcome counts as done only once the owner chooses to begin.
            ? <Welcome onBegin={() => {
                setBegun(true)
                void setStep("personalize")
            }} />
            : shown === "personalize"
                ? <Personalize onContinue={() => void setStep("plant")} />
                : <Plant planting={planting} selection={selection} />}
    </StepTransition></FinishContext.Provider>
}

/** How long a step takes to leave before the next one arrives, in milliseconds. */
const leaving = 420

/**
 * Moves between steps: the current step fades and lifts away, then the next
 * one arrives, its parts one after another (see style.css). Without motion,
 * the next step replaces the current one at once.
 */
function StepTransition({ step, children }: Readonly<{ step: Step, children: ReactNode }>) {
    const { animations } = usePreferences()
    const [current, setCurrent] = useState(step)
    // The leaving step is drawn as it last was while it fades.
    const last = useRef(children)
    if (step === current) last.current = children

    useEffect(() => {
        if (step === current) return
        if (!animations) {
            setCurrent(step)
            return
        }
        const timer = setTimeout(() => setCurrent(step), leaving)
        return () => clearTimeout(timer)
    }, [step, current, animations])

    return <div key={current} className="step-transition" data-leaving={step !== current} data-motion={animations}>
        {step === current ? children : last.current}
    </div>
}

function Welcome({ onBegin }: Readonly<{ onBegin: () => void }>) {
    const { animations } = usePreferences()
    const [played, setPlayed] = useState(false)
    const finish = useFinish()

    // The scene plays in the middle of the window, then rises to make room for the words.
    return <main className="welcome" data-played={played} data-motion={animations}>
        <Scene animated={animations} onPlayed={() => setPlayed(true)} />
        {/* The heading and its sentence belong together; the actions stand apart from them. */}
        <Flex direction="column" align="center" gap="xlarge" className="welcome-words">
            <Flex direction="column" align="center" gap="medium">
                <Heading level={1} size="xlarge">Welcome to PhreshOS</Heading>
                <Text tone="secondary">The soil is ready. Plant what you need, or keep it fresh.</Text>
            </Flex>
            <Flex direction="column" align="center" gap="large">
                <Button color="primary" size="large" onPress={onBegin}>Let's begin</Button>
                <Link onPress={() => finish("kept fresh")}>Keep it fresh</Link>
            </Flex>
        </Flex>
    </main>
}

/** Draws the welcome scene on a canvas the size of its box, sharp at any pixel density. */
function Scene({ animated, onPlayed }: Readonly<{ animated: boolean, onPlayed: () => void }>) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const played = useRef(onPlayed)
    played.current = onPlayed

    useEffect(() => {
        const element = canvas.current!
        const drawing = element.getContext("2d")!
        let size = { width: 0, height: 0 }
        let elapsed = animated ? 0 : sceneDuration
        let frame = 0
        let start: number | undefined

        const draw = () => drawScene(drawing, size.width, size.height, elapsed)
        const resize = () => {
            const box = element.getBoundingClientRect()
            const density = window.devicePixelRatio
            element.width = Math.round(box.width * density)
            element.height = Math.round(box.height * density)
            drawing.setTransform(density, 0, 0, density, 0, 0)
            size = { width: box.width, height: box.height }
            draw()
        }
        const tick = (now: number) => {
            start ??= now
            elapsed = Math.min(now - start, sceneDuration)
            draw()
            // The loop ends with the scene; nothing is drawn afterwards unless the box resizes.
            if (elapsed < sceneDuration) frame = requestAnimationFrame(tick)
            else played.current()
        }

        const observer = new ResizeObserver(resize)
        observer.observe(element)
        if (animated) frame = requestAnimationFrame(tick)
        else played.current()

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
        }
    }, [animated])

    return <canvas ref={canvas} className="welcome-scene" aria-hidden="true" />
}

/** Desktop sizes offered here; any other size stays untouched and shows no choice. */
const sizes = ["0.9", "1", "1.1"] as const

/**
 * The few things the owner sees the System through, applied to the Desktop as
 * they are chosen so the whole Desktop previews them.
 */
function Personalize({ onContinue }: Readonly<{ onContinue: () => void }>) {
    const desktop = useDesktop()
    const preferences = useDesktopPreferences()
    const size = sizes.find(value => Number(value) === preferences.scale)

    return <main className="step">
        <Flex direction="column" align="center" gap="xlarge" className="step-content">
            <Flex direction="column" align="center" gap="medium">
                <Heading level={1} size="large">Make it yours</Heading>
                <Text tone="secondary">Choose how PhreshOS looks to you. You can change it any time.</Text>
            </Flex>
            <Flex direction="column" gap="large" className="step-fields">
                {/* Languages come later; the place is ready for them. */}
                <Select label="Language" value="en">
                    <Select.Item id="en">English</Select.Item>
                </Select>
                <SegmentedControl label="Theme" value={preferences.theme} onChange={value => {
                    void desktop.preferences.update({ theme: value as "light" | "dark" | "browser" })
                }}>
                    <SegmentedControl.Item id="light">Light</SegmentedControl.Item>
                    <SegmentedControl.Item id="browser">Match device</SegmentedControl.Item>
                    <SegmentedControl.Item id="dark">Dark</SegmentedControl.Item>
                </SegmentedControl>
                <SegmentedControl label="Size" value={size} onChange={value => {
                    void desktop.preferences.update({ scale: Number(value) })
                }}>
                    <SegmentedControl.Item id="0.9">90%</SegmentedControl.Item>
                    <SegmentedControl.Item id="1">100%</SegmentedControl.Item>
                    <SegmentedControl.Item id="1.1">110%</SegmentedControl.Item>
                </SegmentedControl>
            </Flex>
            {/* Keeping it fresh is offered once, on the welcome; from here the owner is setting up. */}
            <Button color="primary" size="large" onPress={onContinue}>Continue</Button>
        </Flex>
    </main>
}
