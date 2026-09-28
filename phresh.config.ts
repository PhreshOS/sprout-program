import { defineConfig } from "@phreshos/core"

export default defineConfig({
    identity: "sprout",
    name: "Sprout",
    description: "The first welcome to PhreshOS: plant your first programs, or keep it fresh.",
  version: "0.1.8",
    // Installing Sprout starts it: it is the first thing a new System shows.
    installLaunch: true,
    icon: "icon.png",
    // What Sprout offers AI agents: the same catalog and planting its window uses.
    agent: "agent.md",
    categories: ["System"],
    keywords: ["welcome", "setup", "programs"],
    website: "https://github.com/PhreshOS/sprout-program",
    // Installing Programs is equivalent to complete authority: an installer
    // could install a Program it made with more authority than its own.
    permissions: { all: true },
    buildCommand: "vite-node scripts/build.ts",
    // The Server owns finding, verifying, and planting Programs, and keeps the planting's state.
    server: {
        location: "dist/server",
        worker: "main.js",
        devCommand: "vite-node server/main.ts"
    },
    client: {
        location: "dist/client",
        title: "Sprout",
        // Sprout floats above the windows and places itself; see client/placement.ts.
        layer: "over",
        devCommand: "vite --config vite.client.ts"
    }
})
