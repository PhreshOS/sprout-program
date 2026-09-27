import { context } from "@phreshos/client"
import { useClientMemory, useSubscribe } from "@phreshos/react"
import { Badge, Button, Checkbox, copyText, Dialog, Flex, GridList, Heading, Loading, ScrollArea, Snippet, Surface, Text, useRequirement, type Color } from "@phreshos/react-ui"
import { Bot, Check, Copy } from "@phreshos/react-ui/icons"
import { useEffect, useState, type ReactNode } from "react"
import type { InstallationSnapshot, ProgramInstallationStatus } from "../server/core/program-installer"
import { CategoryIcon, sections, type ProgramRelease } from "./catalog"
import { useFinish } from "./leave"

type Catalog = Readonly<{ releases?: readonly ProgramRelease[], error?: string }>

/**
 * Choosing and planting the first Programs. The catalog and the planting both
 * belong to Sprout's Server, so every browser showing Sprout sees the same
 * catalog and follows the same planting.
 */
export default function Plant({ planting, selection }: Readonly<{ planting: InstallationSnapshot, selection: Selection }>) {
    const [catalog, retry] = useCatalog()
    const planted = planting !== undefined && planting.status !== "idle"
    const grown = planting?.status === "completed"
    const heading = grown ? "Your first programs are planted" : planted ? "Planting your first programs" : "Plant your first programs"
    const lede = grown
        ? "They are ready on your desktop."
        : planted ? "They take root one after another. You can watch, or come back later." : "Choose what grows first. You can plant more any time."

    return <main className="step">
        <div className="step-content plant">
            <Flex direction="column" align="center" gap="medium">
                <Heading level={1} size="large">{heading}</Heading>
                <Text tone="secondary">{lede}</Text>
            </Flex>
            {/* The catalog sits recessed into Sprout, scrolling within its corners. */}
            <Surface depth="recessed" className="plant-catalog">
                {/* The catalog shows once it and every icon have arrived, so no card fills in after the others. */}
                <Loading>
                    <Arrived arrived={catalog.releases !== undefined || catalog.error !== undefined} />
                    <Preload images={(catalog.releases ?? []).flatMap(release => release.icon ? [release.icon] : [])} />
                    {catalog.error !== undefined
                        ? <Unavailable error={catalog.error} onRetry={retry} />
                        : planted
                            ? <Planting releases={catalog.releases ?? []} planting={planting} />
                            : <Choosing releases={catalog.releases ?? []} selection={selection} />}
                </Loading>
            </Surface>
            {planted
                ? <PlantingActions planting={planting} />
                : <ChoosingActions selection={selection} />}
        </div>
    </main>
}

/** Reads the catalog from the Server once, and again when asked to retry after a failure. */
function useCatalog() {
    const [catalog, setCatalog] = useState<Catalog>({})
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let current = true
        context.server.ask<readonly ProgramRelease[]>("catalog", { retry: attempt > 0 })
            .then(releases => { if (current) setCatalog({ releases }) })
            .catch((error: unknown) => { if (current) setCatalog({ error: error instanceof Error ? error.message : String(error) }) })
        return () => { current = false }
    }, [attempt])

    return [catalog, () => {
        setCatalog({})
        setAttempt(value => value + 1)
    }] as const
}

/** Follows the Server's planting: its state when the page opens, then every change it announces. */
export function usePlanting() {
    const [initial, setInitial] = useState<InstallationSnapshot>()
    // What the Server sends to this Client arrives in its own context, not through its handle to the Server.
    const announced = useSubscribe(context, "planting", message => message.payload as InstallationSnapshot)

    useEffect(() => {
        void context.server.ask<InstallationSnapshot>("planting").then(setInitial)
    }, [])

    // Whichever is newer wins, so an answer that arrives late never undoes an announcement.
    if (initial === undefined) return announced
    if (announced === undefined) return initial
    return announced.revision >= initial.revision ? announced : initial
}

export type Selection = ReturnType<typeof useSelection>

/** The owner's choice, kept in Client memory so every browser showing Sprout shares it. */
export function useSelection() {
    const [stored, remember] = useClientMemory<string[]>("selection", [])
    // The page answers each choice at once; memory follows in the background, so a reload keeps the
    // choices without every click waiting on a round trip that a quick next click could overtake.
    const [chosen, setChosen] = useState<readonly string[] | undefined>(undefined)
    const selection = new Set(chosen ?? stored ?? [])
    const select = (identities: Iterable<string>) => {
        const next = [...identities]
        setChosen(next)
        void remember(next)
    }
    return { chosen: selection, select, loaded: stored !== undefined } as const
}

function Choosing({ releases, selection: { chosen: selection, select } }: Readonly<{ releases: readonly ProgramRelease[], selection: Selection }>) {
    const choose = (identities: readonly string[], add: boolean) => {
        const next = new Set(selection)
        for (const identity of identities) add ? next.add(identity) : next.delete(identity)
        select(next)
    }

    return <ScrollArea className="plant-list">
        {/* The space around the content scrolls with it, so the scrollbar stays at the Surface's edge. */}
        <GridList aria-label="Programs" selectionMode="multiple" color="default" itemWidth="15em" style={{ padding: "1.25em" }} value={[...selection]}
            onChange={value => select(value === "all" ? releases.map(release => release.identity) : value)}>
            {sections(releases).map(({ category, members }) => {
                const identities = members.map(member => member.identity)
                const count = identities.filter(identity => selection.has(identity)).length
                return <GridList.Section key={category} id={category}>
                    <GridList.Header>
                        {/* The section's own checkbox plants all of it, or none. */}
                        <Checkbox
                            label={<span className="plant-category"><CategoryIcon category={category} />{category}</span>}
                            checked={count === identities.length}
                            indeterminate={count > 0 && count < identities.length}
                            onChange={add => choose(identities, add)}
                        />
                    </GridList.Header>
                    {members.map(member => <GridList.Item key={member.identity} id={member.identity} textValue={member.name}>
                        <ProgramCard release={member}>
                            <Text tone="secondary" size="small">{member.description}</Text>
                        </ProgramCard>
                    </GridList.Item>)}
                </GridList.Section>
            })}
        </GridList>
    </ScrollArea>
}

/** Two actions: planting with an agent, and planting the choice. Keeping it fresh belongs to the steps before. */
function ChoosingActions({ selection: { chosen: selection } }: Readonly<{ selection: Selection }>) {

    return <Flex align="center" justify="between" className="plant-actions">
        <AgentInvitation />
        <Button color="primary" disabled={selection.size === 0} onPress={() => void context.server.ask("plant", { programs: [...selection] })}>
            {selection.size === 0 ? "Choose what to plant" : `Plant ${selection.size} ${selection.size === 1 ? "program" : "programs"}`}
        </Button>
    </Flex>
}

/** Each step of a Program's planting, as a Badge: its words and the color of what it means. */
const statusBadge: Readonly<Record<ProgramInstallationStatus, Readonly<{ text: string, color?: Color, live?: boolean }>>> = {
    pending: { text: "Waiting" },
    downloading: { text: "Downloading", color: "info", live: true },
    verifying: { text: "Verifying", color: "info", live: true },
    installing: { text: "Planting", color: "info", live: true },
    installed: { text: "Planted", color: "success" },
    "already-installed": { text: "Already planted", color: "success" },
    failed: { text: "Failed", color: "danger" }
}

/** The chosen Programs as they take root: the same cards as the catalog, each with its state at its end. */
function Planting({ releases, planting }: Readonly<{ releases: readonly ProgramRelease[], planting: InstallationSnapshot }>) {
    const known = new Map(releases.map(release => [release.identity, release]))

    return <ScrollArea className="plant-list">
        {/* The catalog's own cards, only shown now: nothing is chosen while planting. */}
        <GridList aria-label="Planting" selectionMode="none" itemWidth="15em" style={{ padding: "1.25em" }}>
            {planting.programs.map(program => {
                const release = known.get(program.identity)
                const badge = statusBadge[program.status]
                // The card fills its row, so every state sits at the same place: the card's bottom end.
                return <GridList.Item key={program.identity} id={program.identity} textValue={program.name} style={{ alignContent: "stretch" }}>
                    <div className="planting-card">
                        <ProgramCard release={release} name={program.name}>
                            <Text tone="secondary" size="small">{release?.description}</Text>
                            {program.status === "failed" && program.error && <Text tone="secondary" size="small" className="planting-error">{program.error}</Text>}
                        </ProgramCard>
                        <Badge color={badge.color} dot={badge.live} className="planting-status">{badge.text}</Badge>
                    </div>
                </GridList.Item>
            })}
        </GridList>
    </ScrollArea>
}

function PlantingActions({ planting }: Readonly<{ planting: InstallationSnapshot }>) {
    const finish = useFinish()
    const failed = planting.programs.filter(program => program.status === "failed").map(program => program.identity)

    if (planting.status === "running") {
        return <Flex align="center" justify="end" className="plant-actions">
            <Text tone="secondary">Planting {Math.min(planting.completed + 1, planting.total)} of {planting.total}</Text>
        </Flex>
    }

    return <Flex align="center" justify="between" className="plant-actions">
        {failed.length > 0
            ? <Button onPress={() => void context.server.ask("plant", { programs: failed })}>Try again</Button>
            : <span />}
        <Button color="primary" onPress={() => finish("planted")}>Done</Button>
    </Flex>
}

/** A Program's icon beside its name and version, with whatever else the card says under them. */
function ProgramCard({ release, name, children }: Readonly<{ release: ProgramRelease | undefined, name?: string, children: ReactNode }>) {
    return <div className="plant-card">
        {release?.icon
            ? <img src={release.icon} alt="" className="plant-icon" />
            : <span className="plant-icon"><CategoryIcon category={release?.categories[0] ?? "Other"} /></span>}
        <div>
            <span className="plant-name">{release?.name ?? name} {release && <Text tone="secondary" size="small">{release.version}</Text>}</span>
            {children}
        </div>
    </div>
}

/** Shown in place of the catalog when it could not be read, such as when GitHub limits requests. */
function Unavailable({ error, onRetry }: Readonly<{ error: string, onRetry: () => void }>) {
    return <Flex direction="column" align="center" justify="center" gap="medium" className="plant-unavailable">
        <Text>The catalog could not be reached.</Text>
        <Text tone="secondary" size="small">{error}</Text>
        <Button onPress={onRetry}>Try again</Button>
    </Flex>
}

/** Holds the nearest Readiness boundary until something has arrived. */
function Arrived({ arrived }: Readonly<{ arrived: boolean }>) {
    useRequirement(arrived, "Finding programs")
    return null
}

/**
 * Loads and decodes images ahead of showing them, holding the nearest Readiness
 * boundary until all have settled. An image that fails still counts as settled,
 * so one missing icon never holds the page.
 */
function Preload({ images }: Readonly<{ images: readonly string[] }>) {
    const [settled, setSettled] = useState(false)
    const key = images.join("\n")

    useEffect(() => {
        let current = true
        setSettled(false)
        void Promise.all(images.map(source => {
            const image = new Image()
            image.src = source
            return image.decode().catch(() => undefined)
        })).then(() => { if (current) setSettled(true) })
        return () => { current = false }
    // The list is compared by its contents, not its identity.
    }, [key])

    useRequirement(settled, "Loading programs")
    return null
}

/**
 * What the owner hands their agent: a short entry point. The agent learns the
 * CLI by itself, then reads Sprout's agent document for the rest.
 */
const invitation = `PhreshOS is running on this machine, and its first-run program, Sprout, is waiting to plant my first programs. Run \`phresh describe --all --json\` to learn the CLI, then \`phresh program agent --program sprout\` to see how to plant. Ask me what I need, then plant it.`

function AgentInvitation() {
    return <Dialog>
        <Dialog.Trigger><Bot aria-hidden="true" />Plant with your agent</Dialog.Trigger>
        <Dialog.Backdrop dismissable variant="blur">
            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>Plant with your agent</Dialog.Title>
                    <Dialog.Description>Give this to your AI agent. It finds its own way from here, and you see what it plants on this screen.</Dialog.Description>
                </Dialog.Header>
                <Dialog.Body>
                    <Snippet copyLabel="Copy the message">{invitation}</Snippet>
                </Dialog.Body>
                <Dialog.Footer>
                    <Dialog.Close>Close</Dialog.Close>
                    <CopyButton text={invitation} />
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Backdrop>
    </Dialog>
}

/** The dialog's main action: copies the message, and says so. */
function CopyButton({ text }: Readonly<{ text: string }>) {
    const [copied, setCopied] = useState(false)
    return <Button color="primary" onPress={() => void copyText(text).then(setCopied)}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copied" : "Copy"}
    </Button>
}
