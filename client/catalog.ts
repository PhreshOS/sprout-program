import { Bot, Code, Globe, Layers, Settings2, SquareKanban, type LucideIcon } from "@phreshos/react-ui/icons"
import { createElement } from "react"
import type { ProgramRelease } from "../server/core/program-releases"

export type { ProgramRelease }

/** Groups Programs into sections by their first category, so each appears once, in catalog order. */
export function sections(releases: readonly ProgramRelease[]) {
    const grouped = new Map<string, ProgramRelease[]>()
    for (const release of releases) {
        const category = release.categories[0] ?? "Other"
        grouped.set(category, [...grouped.get(category) ?? [], release])
    }
    return [...grouped].map(([category, members]) => ({ category, members }))
}

/** An icon for each category a Program may declare; any other category takes a general one. */
const categoryIcons: Readonly<Record<string, LucideIcon>> = {
    System: Settings2,
    Internet: Globe,
    Productivity: SquareKanban,
    Development: Code,
    AI: Bot
}

export function CategoryIcon({ category }: Readonly<{ category: string }>) {
    return createElement(categoryIcons[category] ?? Layers, { "aria-hidden": true })
}
