/**
 * The welcome scene: the Sprout seed falls to the ground and gives with the
 * impact, light opens a cleft in it, and a sprout rises from inside, bending
 * as it grows, and unfolds its leaves. Shapes deform instead of only moving,
 * so the scene reads as something soft and alive.
 *
 * Every frame is a pure function of the time since the scene began, so the
 * last frame can be drawn directly when motion is off. Shapes are drawn in a
 * 1000-unit square, the same composition as the icon.
 */

/** How long the scene runs, in milliseconds. */
export const sceneDuration = 4700

/** How much of the canvas's shorter side the drawing takes: the mark keeps this size from start to finish. */
export const sceneScale = 0.68

const apricot = ["#faba86", "#f18b5c"] as const
const green = ["#b4e39a", "#4fa35a"] as const
const glow = "250, 186, 134"

/** The moments of the scene, overlapping so each part flows into the next. */
const timing = {
  appear: [0, 250],
  fall: [0, 750],
  land: [750, 1750],
  shadow: [0, 800],
  crack: [1100, 1650],
  open: [1500, 2600],
  light: [1500, 2900],
  stem: [1900, 3300],
  stemSettle: [3100, 4300],
  leftLeaf: [3050, 4300],
  rightLeaf: [3200, 4500],
  motes: [2000, 4700]
} as const

/** Where the seed touches the ground: it gives and recovers about this point. */
const ground = { x: 500, y: 890 } as const

/** The stem runs from inside the cleft to its tip. */
const stemBase = { x: 584, y: 700 } as const
const stemTip = { x: 548, y: 390 } as const

/** Draws the scene at `elapsed` milliseconds into a square centered in the canvas. */
export function drawScene(context: CanvasRenderingContext2D, width: number, height: number, elapsed: number) {
  const size = Math.min(width, height) * sceneScale
  const at = (moment: keyof typeof timing) => {
    const [start, end] = timing[moment]
    return progress(elapsed, start, end)
  }

  context.clearRect(0, 0, width, height)
  context.save()
  context.translate((width - size) / 2, (height - size) / 2)
  context.scale(size / 1000, size / 1000)
  // The whole mark sits centered in its square.
  context.translate(-30, -60)

  drawLight(context, at("light"))
  drawShadow(context, easeOut(at("shadow")), wobble(at("land")))

  context.save()
  context.globalAlpha = easeOut(at("appear"))
  placeSeed(context, at("fall"), at("land"))

  const stem = stemShape(easeInOut(at("stem")), at("stem"), at("stemSettle"))
  drawStem(context, stem)
  drawLeaf(context, at("leftLeaf"), stem.point(0.88), -1, 200)
  drawLeaf(context, at("rightLeaf"), stem.point(stem.grown), 1, 250)
  drawSeed(context, at("open"), easeOut(at("crack")) * (1 - easeOut(at("open"))))
  context.restore()

  drawMotes(context, at("motes"))
  context.restore()
}

/**
 * The seed falls with gravity, stretching a little with its speed, then
 * flattens on impact and recovers with a small rebound.
 */
function placeSeed(context: CanvasRenderingContext2D, fall: number, land: number) {
  const drop = -260 * (1 - fall ** 2)
  const give = wobble(land)
  const stretch = land > 0 ? 0 : 0.07 * fall
  const scaleY = 1 + stretch - 0.13 * give
  const scaleX = 1 - stretch * 0.5 + 0.09 * give

  context.translate(0, drop)
  context.translate(ground.x, ground.y)
  context.scale(scaleX, scaleY)
  context.translate(-ground.x, -ground.y)
}

/** A warm light that blooms behind the seed as it opens, then rests. */
function drawLight(context: CanvasRenderingContext2D, light: number) {
  if (light <= 0) return
  // It swells while the seed opens and fades to a faint rest, so the last frame stays clean on any background.
  const strength = Math.sin(light * Math.PI) * 0.5 + light * 0.08
  const bloom = context.createRadialGradient(560, 600, 0, 560, 600, 420)
  bloom.addColorStop(0, `rgba(${glow}, ${0.55 * strength})`)
  bloom.addColorStop(1, `rgba(${glow}, 0)`)
  context.fillStyle = bloom
  context.fillRect(100, 150, 900, 850)
}

/** A soft shadow under the seed that gathers as it falls and spreads with the impact. */
function drawShadow(context: CanvasRenderingContext2D, reached: number, give: number) {
  const shade = context.createRadialGradient(ground.x, ground.y, 0, ground.x, ground.y, 220)
  shade.addColorStop(0, `rgba(80, 50, 30, ${0.18 * reached})`)
  shade.addColorStop(1, "rgba(80, 50, 30, 0)")
  context.save()
  context.translate(ground.x, ground.y)
  context.scale(0.6 + reached * 0.4 + give * 0.08, 0.14)
  context.translate(-ground.x, -ground.y)
  context.fillStyle = shade
  context.beginPath()
  context.arc(ground.x, ground.y, 220, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

/**
 * The seed is one round body split along a curve. Light shows in the cleft
 * first; then the smaller half tips open on a spring, and both halves give a
 * little as they part.
 */
function drawSeed(context: CanvasRenderingContext2D, opening: number, crack: number) {
  const open = spring(opening)
  const give = wobble(opening)
  const fill = gradient(context, apricot, 360, 520, 640, 880)
  const cleft = () => {
    context.moveTo(566, 470)
    context.bezierCurveTo(520, 580, 530, 720, 612, 900)
  }
  const half = (side: "left" | "right") => {
    context.save()
    context.beginPath()
    cleft()
    if (side === "left") context.lineTo(200, 900), context.lineTo(200, 470)
    else context.lineTo(800, 900), context.lineTo(800, 470)
    context.closePath()
    context.clip()
    context.fillStyle = fill
    context.beginPath()
    context.ellipse(500, 690, 215, 200, -0.2, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
  const turn = (pivotX: number, angle: number, squeeze: number) => {
    context.translate(pivotX, ground.y)
    context.rotate(angle)
    context.scale(1 + squeeze * 0.5, 1 - squeeze)
    context.translate(-pivotX, -ground.y)
  }

  context.save()
  turn(560, -open * 0.05, give * 0.02)
  half("left")
  context.restore()

  context.save()
  turn(620, open * 0.2, give * 0.04)
  half("right")
  context.restore()

  // Before the halves part, a thin line of light runs down the cleft.
  if (crack > 0) {
    context.save()
    context.beginPath()
    context.ellipse(500, 690, 215, 200, -0.2, 0, Math.PI * 2)
    context.clip()
    context.strokeStyle = `rgba(255, 244, 228, ${crack})`
    context.lineWidth = 3 + crack * 5
    context.shadowColor = `rgba(${glow}, ${crack})`
    context.shadowBlur = 24
    context.beginPath()
    cleft()
    context.stroke()
    context.restore()
  }
}

type Point = Readonly<{ x: number, y: number }>

/**
 * The stem as a flexible curve. While it grows its tip leans, as if pushing
 * up through the cleft; when it has grown, the tip swings past upright once
 * and settles.
 */
function stemShape(grown: number, growing: number, settling: number) {
  const lean = Math.sin(growing * Math.PI) * 26 + wobble(settling) * 16
  const control = { x: 560 + lean * 0.5, y: 560 }
  const tip = { x: stemTip.x + lean, y: stemTip.y }
  const point = (t: number): Point => ({
    x: (1 - t) ** 2 * stemBase.x + 2 * (1 - t) * t * control.x + t ** 2 * tip.x,
    y: (1 - t) ** 2 * stemBase.y + 2 * (1 - t) * t * control.y + t ** 2 * tip.y
  })
  return { grown, point }
}

/** The stem is a filled shape that tapers from its base to its tip, drawn only as far as it has grown. */
function drawStem(context: CanvasRenderingContext2D, stem: ReturnType<typeof stemShape>) {
  if (stem.grown <= 0) return
  const width = (t: number) => 30 - t * 14
  const steps = 24
  const left: Point[] = []
  const right: Point[] = []

  for (let step = 0; step <= steps; step += 1) {
    const t = (step / steps) * stem.grown
    const here = stem.point(t)
    const ahead = stem.point(Math.min(1, t + 0.01))
    const length = Math.hypot(ahead.x - here.x, ahead.y - here.y) || 1
    const normal = { x: -(ahead.y - here.y) / length, y: (ahead.x - here.x) / length }
    const half = width(t) / 2
    left.push({ x: here.x + normal.x * half, y: here.y + normal.y * half })
    right.push({ x: here.x - normal.x * half, y: here.y - normal.y * half })
  }

  const tip = stem.point(stem.grown)
  context.save()
  context.fillStyle = gradient(context, green, stemTip.x, stemTip.y, stemBase.x, stemBase.y)
  context.beginPath()
  for (const point of [...left, ...right.reverse()]) context.lineTo(point.x, point.y)
  context.closePath()
  context.fill()
  // A round tip, as wide as the stem there.
  context.beginPath()
  context.arc(tip.x, tip.y, width(stem.grown) / 2, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

/**
 * A leaf unfolds from its base on the stem. Folded, it is a narrow, curled
 * blade; it opens by changing the curve of its edges, grows to full size, and
 * its tip trails a little before it settles. `side` is -1 for left, 1 for right.
 */
function drawLeaf(context: CanvasRenderingContext2D, unfolding: number, base: Point, side: -1 | 1, length: number) {
  if (unfolding <= 0) return
  const open = spring(unfolding)
  const size = 0.25 + 0.75 * easeOut(unfolding)
  const trail = wobble(unfolding) * 0.06
  const blend = (folded: number, opened: number) => folded + (opened - folded) * open
  const x = (folded: number, opened: number) => blend(folded, opened) * length
  const y = (folded: number, opened: number) => blend(folded, opened) * length

  context.save()
  context.translate(base.x, base.y)
  context.scale(side * size, size)
  context.rotate(-0.55 - (1 - open) * 0.5)
  context.fillStyle = gradient(context, green, 0, -40, length, 40)
  context.beginPath()
  context.moveTo(0, 0)
  context.bezierCurveTo(x(0.15, 0.25), y(-0.12, -0.42), x(0.45, 0.8), y(-0.36, -0.36), x(0.55, 1), y(-0.35, -0.08) + trail * length)
  context.bezierCurveTo(x(0.5, 0.72), y(-0.2, 0.2), x(0.15, 0.24), y(0, 0.18), 0, 0)
  context.fill()
  context.restore()
}

/** Small motes of light rise from the cleft and fade as the sprout comes out. */
function drawMotes(context: CanvasRenderingContext2D, rising: number) {
  if (rising <= 0 || rising >= 1) return
  context.save()
  for (let index = 0; index < 18; index += 1) {
    // A fixed pseudo-random spread per mote keeps every frame reproducible.
    const seed = Math.sin(index * 12.9898) * 43758.5453
    const spread = seed - Math.floor(seed)
    const life = (rising - spread * 0.45) / 0.55
    if (life <= 0 || life >= 1) continue
    const alpha = Math.sin(life * Math.PI) * 0.7
    context.fillStyle = `rgba(255, 236, 206, ${alpha})`
    context.shadowColor = `rgba(${glow}, ${alpha})`
    context.shadowBlur = 12
    context.beginPath()
    context.arc(560 + (spread - 0.5) * 260 + Math.sin(life * 6 + index) * 14, 640 - life * (260 + spread * 160), 3 + spread * 4, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function gradient(context: CanvasRenderingContext2D, colors: readonly [string, string], x0: number, y0: number, x1: number, y1: number) {
  const fill = context.createLinearGradient(x0, y0, x1, y1)
  fill.addColorStop(0, colors[0])
  fill.addColorStop(1, colors[1])
  return fill
}

/** Linear progress from 0 to 1 between two moments. */
export function progress(elapsed: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (elapsed - start) / (end - start)))
}

const easeOut = (value: number) => 1 - (1 - value) ** 3
const easeInOut = (value: number) => value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2

/** A damped spring: it arrives quickly, passes its mark slightly, and settles exactly at 1. */
export function spring(value: number) {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return 1 - Math.exp(-6 * value) * Math.cos(value * Math.PI * 2.2)
}

/** A decaying oscillation from 1 to rest: the give of something soft after a push. */
export function wobble(value: number) {
  if (value <= 0 || value >= 1) return 0
  return Math.exp(-5 * value) * Math.cos(value * Math.PI * 3.6)
}
