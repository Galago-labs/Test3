# Junkyard, Robots, and a Dangerous World — Design Document

**Version 2.10** — reconciled against the current implementation. Supersedes ad-hoc
scope decisions scattered across prior planning conversations: from this point on,
**this file is the source of truth** for vision and status, not chat history. Update
it as part of any turn that changes scope, adds a system, or makes an architectural
decision — that's what keeps it trustworthy.

**Recovery note (v2.7):** a prior session's context window overflowed before its
work was fully saved. Section 7 (the HUD phased roadmap, referenced throughout
this doc) had gone missing from the file entirely, along with the changelog
section other parts of this doc still point to ("see changelog"). Section 7 was
reconstructed from prior session notes and re-verified against the actual codebase
(real build + real screenshots) rather than assumed. The changelog itself was not
reconstructed (not needed for forward planning) — old "see changelog" references
elsewhere in this doc are stale and should be read as historical color, not a
working link.

**v2.8:** shipped Section 8's first two phases (8.0 new `engine/scene/`
primitive, 8.1 camp scene composition) same-session as the plan itself, after
the person pushed back on a planning-only turn — see Section 8 for what's
actually done vs. still open, including a real sizing bug (black-void
letterboxing) found and fixed before shipping, and a new open item (8.5,
mobile framing) found while verifying.

**v2.9:** the person flagged, correctly and with reference screenshots
annotated in detail, that the settlement badge and sidebar nav didn't match
the reference's composition or style at all — see 7.5's regression note for
the specifics and the fix. Scope of this fix: `TopBar`/`App.tsx` shell chrome
only (shared by every section). 7.6 (six nav destinations vs. today's 3) is
still open and wasn't part of this fix.

**v2.10:** a second, more detailed annotated round on the same nav/top-bar
area, plus two new findings. All fixed same-session:
- Nav icon-chips enlarged (36px → 46px containers, 20px → 40px icons per
  request) and label text enlarged 15px → 22px (~1.5×) — the v2.9 restyle
  had gone flatter in *treatment* but not sized generously enough to read
  well at a glance.
- The map's energy meter/refill widget removed from the HUD entirely, on
  explicit instruction — it has no equivalent in the reference (which tracks
  energy per-robot in the bottom roster, not as a settlement-wide pool shown
  on the map). `map.energy` itself is untouched and still gates mission
  afford-checks; only the display was removed.
- TopBar's currency row was stretching (`flex-1`) to fill all remaining
  width between the settlement area and the population/settings cluster,
  producing one continuous bar; the reference's currency pill is
  content-width with a real gap on either side. Fixed by dropping `flex-1`
  and switching the row to `justify-between`.
- New, more consequential finding: **BaseScreen still had App.tsx's old
  card-list-era padding wrapper** (`px-2 pb-2 sm:px-4 lg:pl-[236px]` plus top
  clearance) even after v2.8 turned it into a full-bleed scene — this left a
  visible gap around the scene on every side, through which the app's own
  `bg-city.jpg` (behind everything, meant only as backdrop for chrome) was
  visible **simultaneously with** the camp scene — a real "two backgrounds"
  bug, not a style nitpick. Root cause: Section 8 added the full-bleed scene
  but nobody went back to remove the padding wrapper that predated it, and
  no screenshot in v2.8's own verification pass happened to make the gap
  obvious. Fixed by giving Base the exact same treatment Map already had
  (render directly, no wrapper, full `inset-0`, clearance handled
  internally) — the two screens' shells were meant to be structurally
  identical from the start (see 2.3/7.1), so this was a real inconsistency
  between them, not a new decision.
- While fixing the above, extracted `APP_SIDEBAR_WIDTH_PX` /
  `APP_SIDEBAR_CLEARANCE_CLASS` / `APP_SIDEBAR_CLEARANCE_LEFT_CLASS` into
  `engine/hud/layout.ts` (same pattern as the existing topbar-clearance
  constant) — the sidebar's width had drifted to three different hardcoded
  values (220/236/248) across `App.tsx` and `MapMode.tsx` independently,
  exactly the kind of silent divergence a shared constant exists to catch.

Verified via real screenshots at 420px and 1600px, both Base and Map.

Status tags used throughout: ✅ Done · 🔶 Partial · ⬜ Not started · ❓ Open question

---

## 1. Vision & Core Loop

The player leads a small camp of survivors in a post-collapse world. Robots are the
only way to interact with the outside world — they scout, gather, fight, research,
and rescue. Progression is a single connected cycle:

> Unknown territory → reconnaissance → discovery (resources / enemies / seeds /
> tech / survivors) → choose a mission → complete it → gain resources / science /
> people → develop the camp and robots → re-explore, go further, go deeper.

**The map is a source of opportunities, not a set of cells with resources.** Every
sector should raise a real question: what's here, how dangerous is it, is it worth
sending a weak robot or should it wait, is there something rare.

**The camp is the heart of the settlement**, not a menu. Its growth should be
*visible*, not just numerical — ruins and junk → first structures → production →
a real settlement.

---

## 2. Architectural Principles (non-negotiable)

These govern *how* everything below gets built, not just what gets built:

- Adding a sector, resource, robot, enemy, building, or mission type should mean
  **adding data**, not writing new logic.
- Systems are independent modules with explicit, narrow interfaces. Changing the
  map must not break the economy; changing the economy must not break robots;
  adding a building must not require touching unrelated systems.
- No temporary hacks standing in for a real system. If something can't be built
  properly yet, it's marked ⬜ here, not faked with a hardcoded shortcut.

Current codebase already follows this in the pieces that exist: `game/map/` (sectors,
hex math, missions, `useMapController`) has zero dependency on the economy or crew
systems — only `useMapController` bridges across, deliberately kept narrow. This
pattern should extend to every new system below (science, production, labor).

### 2.1 Engine vs. Game Boundary

The codebase is split into `src/engine/` and `src/game/`. **The engine knows
nothing about this game** — no resources, robots, sectors, or missions may be
imported into anything under `engine/`. The game depends on the engine; the
engine never depends on the game. If a change to game content (a new resource, a
renamed mission type) would require editing a file under `engine/`, that's a sign
something engine-specific leaked in and needs fixing.

What's already extracted, and why each one qualifies as engine, not game:

| Piece | Location | Why it's engine |
|---|---|---|
| Persistence (load/merge/autosave to localStorage) | `engine/persistence/` | Generic over any serializable state with a `lastSeen` field; doesn't know what a robot is |
| Tick loop | `engine/loop/useGameLoop.ts` | Generic dt-based callback runner; what a tick *computes* is entirely the caller's business |
| Toast notifications | `engine/notifications/` | `useToasts` is content-free; `ToastStack` owns layout/stacking only — the game supplies its own visual theme via a `toneClassName` callback rather than hardcoded styling |
| Hex-grid math | `engine/hexgrid/` | Pure axial-coordinate math, zero knowledge of sectors |
| Sprite-sheet icon rendering | `engine/sprites/SpriteIcon.tsx` | Takes sheet URL + grid + cell position as plain props; has no idea what any icon *means* — that mapping lives in `game/map/icons.ts` plus a thin `MapIcon` adapter in `components/map/` |
| Number/duration formatting | `engine/format.ts` | Pure display utilities |
| Pan/zoom camera (`camera.ts`) + `<Viewport>` | `engine/viewport/` | Pure math (clamp/pan/zoom-around-point) over an abstract `{width,height}` world and viewport — no hexes, no map image, no game state. `<Viewport>` wires pointer-drag + wheel + pinch to that math and renders arbitrary children in world-px space. `HexMap` is the only thing that knows the world is 1536×1024 map art with hexes on it |

**Not yet extracted, and deliberately deferred:** theming (`Bar`, `Banner`,
buttons currently hardcode this game's wood-grain/amber palette via Tailwind
classes rather than taking a theme) and the Modal shell. The "no real
controls layer" gap this used to list is now partly closed — `Viewport`
*is* a real pointer/wheel/pinch input layer — but it's scoped to pan/zoom;
drag-and-drop worker assignment or similar would still need its own layer
built the same way (pure engine math + thin event-wiring component) when it
actually comes up.

### 2.2 Domain Action Pattern

`useGame.ts` no longer contains game-rule logic inline. Each domain owns its own
pure state-transition functions — `applyBuildOrUpgrade` in `buildings.ts`,
`applyHireBot` in `crew.ts`, `applyStartMission`/`applyCollectMission`/
`applyRepairBot` in `map/actions.ts` — each taking a narrow input (only the state
fields it actually needs) and returning a narrow result (`{ ok, message, tone,
...patch }`, the shared shape in `actionResult.ts`). `useGame.ts` itself is just
wiring: pull the slice out of state, call the pure function, toast the message,
apply the patch if `ok`.

This means:
- A change to mission-reward math can't accidentally touch building costs — they
  don't share code, only the result shape.
- **Game logic is now unit-testable without React or a browser.** `test-actions.ts`
  exercises all five actions directly (`npm test`) — cost math, validation
  rejections, mishap/repair timers, sector-reveal-on-scout, all asserted, not
  eyeballed. Any new mission type or building rule should get the same treatment:
  a pure function in the right domain file, plus a few lines in `test-actions.ts`.

### 2.3 Visual Target — ✅ Confirmed, phased roadmap in progress

The person shared a reference screenshot and confirmed it's the real target,
not loose inspiration: a full-bleed illustrated map (art fills the entire
screen, not one bounded card), colored hex outlines per opportunity category
with a legend, a compass, a persistent left sidebar (Map/Robots/Workshop/
Research/Journal) instead of a bottom nav, a top bar with a day counter and all
resources (including a Science resource) visible at once, and a per-sector
"available missions" list (including Seed collection, Research, and
Re-reconnaissance — none of which exist yet; see 4.4/4.6) with a single "send
the selected robot" action, rather than this project's current per-robot
button-list architecture.

v2.0 shipped the two foundational pieces this depends on: a real pan/zoom
camera and a screen-size-agnostic responsive layout for the Map screen (2.1).
**Section 7 is the phased roadmap for the rest** — this is interface work, not
a data/system change, so it proceeds independently of the still-⬜ systems
(Seeds, Research) it will eventually need to display; those stay tracked in
section 4 on their own timeline.

**Platform decision (resolved, not left as a fork):** one interface, not a
separate mobile build and a separate desktop build. Two full interfaces would
itself be the kind of duplication this project's architecture principles
(section 2) already rule out — they'd drift out of sync, and every future HUD
feature would need building twice. See 7.0 for the concrete mechanism.

---

## 3. Current Implementation Snapshot

As of this checkpoint, concretely, what exists:

- **Camp**: 2 starting survivors, 0 starting resources, 1 pre-owned robot
  (RUSTY-01). Population does **not** grow passively — Kitchen + Water Still are a
  *gate* (must be built before survivors can come home), and the only way
  population actually increases is a successful Rescue mission, capped by
  Barracks level. Four buildings total (Barracks, Kitchen, Water Still,
  Workshop), each a simple level-up sink for raw resources.
- **Robots**: 5 defined, each with a resource specialty, a Scavenging skill, a
  Scouting skill, a Combat skill, and a Rescue skill. Hired/upgraded with
  credits (cost scales ×1.75/level). BOLT-7 and NOVA-X lean combat; SPROUT-3 and
  DRIP-9 lean rescue; NOVA-X is the all-round specialist. No condition/damage
  state beyond temporary mission-mishap repairs.
- **Map**: hex grid (flat-top, vertically squashed), 24 sectors + home in two rings
  around the camp. Each sector has one material bias, one danger tier
  (Calm/Rough/Severe), independent enemy data (`enemyStrength`/`enemyName`,
  0 on 6 sectors), independent survivor data (`survivorCount`/`survivorFlavor`,
  present on 12 sectors — 4 of which also have enemies, so Rescue there requires
  Clear first), and flavor text. Locked → reachable → scouted, unlocked by
  proximity to an already-scouted neighbor. **Rendering is a real pannable/
  zoomable camera** (`engine/viewport/`, see 2.1) over the full 1536×1024 map
  image, not a scaled-to-fit static picture — the map does not need to (and at
  the default zoom, does not) show every sector at once. Starts framed close on
  Home (~9 hex-columns across); zoom is clamped so panning/zooming out can never
  reveal space past the image's edge, with a small buffer margin so that's true
  even at the floor. This means the map's *content* can keep growing (more
  sectors, a bigger image) without the rendering approach becoming a problem —
  that was the whole point of building it this way instead of fit-to-container.
- **Screen layout**: the Map screen is a single responsive layout, not separate
  mobile/desktop versions — a column (map on top, info panel below, both
  independently scrollable/pannable) under Tailwind's `lg` breakpoint, a row
  (map fills remaining width, a fixed-width info sidebar) above it. No
  device-specific branching in code, just CSS breakpoints reflowing one layout.
  BaseScreen/CrewPanel/TopBar have **not** been through this pass yet — they're
  still the older mobile-column style; see 2.3 and section 7 (the HUD roadmap)
  for what's planned and in what order.
- **Missions**: Scavenge (resource extraction), Scout (reveals a sector, also
  farmable for credits/cores), Clear (fights a sector's enemies; success steps
  its danger tier down one permanently), and Rescue (brings a sector's survivors
  home; the only source of population growth). Scavenge/Scout use a
  Safe/Risky/Dangerous selector that stacks with the sector's own danger tier;
  Clear and Rescue have no selector — the hazard is the sector's own, not a
  player choice. A mishap costs most of the reward (Scavenge/Scout) or the whole
  attempt (Clear/Rescue) and puts the robot on a repair timer (rushable with
  credits, reduced by Workshop level).
- **Economy**: 4 raw resources (metal, stone, wood, water) plus credits and cores.
  Every unit of every resource is sourced from a mission — nothing accrues
  passively. Base "tier" is derived from population, not bought, and scales
  mission rewards.
- **Architecture**: split into `src/engine/` (persistence, tick loop, toasts, hex
  math, sprite rendering, haptics, pan/zoom viewport, HUD overlay primitives —
  see 2.1) and `src/game/` (everything specific to this title). Game logic is
  further split by domain into pure, testable functions (`buildings.ts`,
  `crew.ts`, `map/actions.ts` — see 2.2); `useGame.ts` is now a thin
  orchestrator, not where the rules live. A real regression suite (`npm test`)
  asserts core actions, camera math, and HUD anchor/drawer math (88 assertions
  across `test-actions.ts` + `test-viewport.ts` + `test-hud.ts`).
- **Styling & dependencies**: Tailwind CSS (`@tailwindcss/vite`, compiled at
  build time and inlined into the single-file `dist/index.html` output — not a
  runtime dependency; the shipped game needs nothing external at play time)
  was part of the original project scaffold (`package.json`'s `name` is
  literally `react-vite-tailwind`) from before this document's v1.x history,
  not something added along the way. Noted here because it caused real
  confusion once it wasn't obvious where it came from. **New dependencies are
  never added without asking first** — a standing rule, not a one-time
  apology.
- **Tooling**: real production builds verified via an offline npm bundle and a
  local Firefox binary — UI changes get an actual rendered screenshot before
  shipping, not a guess. (v1.8 shipped without this due to an environment gap;
  v1.9 restored it and used it to verify Rescue end-to-end — see changelog.)

---

## 4. Target Systems

### 4.1 Starting State — 🔶 Partial
Target: 2 people, a greenhouse, a food source, a workshop, old equipment, **1 old,
damaged robot** with severely limited capability.
Current: 2 people ✅, 1 pre-owned robot 🔶 (not framed as damaged/limited — it's a
full-capability robot at Mk.1). No greenhouse/food-source/old-equipment concept
exists yet; Kitchen fills a similar narrative role but isn't present at start.
**Gap**: the starting robot should probably be mechanically weaker than a
normally-hired one, with its own upgrade path (see 4.2), to make "the beginning of
survival" actually feel that way.

### 4.2 Robots & Progression — 🔶 Partial
Target sources of robot improvement: workshop upgrades, found scientific parts,
discovered tech, research missions, direct scientific research, old
electronics/tech recovery.
Current: robots improve only via credit-cost leveling. None of the
science/research-linked upgrade paths exist (they depend on 4.6).

### 4.3 Map & Sectors — 🔶 Partial
Hex grid: ✅ done, built with the future in mind (axial coordinates, not squares).
**A sector is not one resource** — 🔶 partial. Sectors now carry a material
bias, independent enemy data (`enemyStrength`, `enemyName`), *and* independent
survivor data (`survivorCount`, `survivorFlavor`) — three separate layers with
separate state (a sector can be scavenged repeatedly, cleared, and rescued as
genuinely independent actions). Still missing: seeds and ruins/research as
further independent layers — this remains the target, not yet the full picture.
**Reconnaissance / re-reconnaissance** — 🔶 partial. Scout Run ≈ reconnaissance
(reveals a sector, carries risk). Re-reconnaissance — revisiting an already-worked
sector to surface *new* opportunities — does not exist; Scout Run today is
repeatable but always yields the same kind of thing (credits/cores), not new
discoveries.
This is still the biggest structural gap between the current data model and the
target: **`SectorDef` needs to eventually become a collection of opportunities**,
not a fixed set of typed fields. Enemy data and survivor data were each
deliberately kept as a typed field rather than a first attempt at that generic
model — worth watching whether seeds/research arrive the same way (another typed
field each) or force the real migration to a generic opportunity list.

### 4.4 Mission Types — 🔶 Partial
| Target type | Status | Current equivalent |
|---|---|---|
| Reconnaissance | 🔶 | Scout Run |
| Resource extraction | ✅ | Scavenge Run |
| Seed collection | ⬜ | none |
| Clearing / attack | ✅ | Clear mission — Combat skill vs. sector enemyStrength; success steps the sector's danger tier down by one permanently |
| Research mission | ⬜ | none (needs 4.6) |
| Rescue mission | ✅ | Rescue mission — Rescue skill vs. sector hazard; success brings the sector's survivors home permanently (see 4.5) |

### 4.5 Survivors & Rescue — ✅ Resolved
Target: population should **not** grow on its own — survivors are discovered
(via reconnaissance revealing a shelter) and brought home via a rescue mission.
Resolution: Kitchen + Water Still no longer drive passive growth — they're now a
**gate** (`sustainReady`): both must be built before a Rescue mission can bring
anyone home, same requirement as before, different mechanism. Population only
increases through a successful Rescue mission, capped by Barracks capacity. In
sectors that have enemies, Rescue additionally requires the sector be Cleared
first — you can't safely extract survivors from a sector you haven't cleared of
enemies, which gives the Clear → Rescue mission chain real teeth. A failed Rescue
brings nobody home (same shape as a failed Clear) and puts the robot on a repair
timer; the sector remains available to try again.

### 4.6 Scientific Research — ⬜ Not started
No science resource, no research screen, no tech tree exist. Target: a dedicated
research screen; science earned from research missions and found
electronics/documents/artifacts; unlocks technologies that improve robots, unlock
buildings, and unlock new mission/reconnaissance capabilities.

### 4.7 Economy: Raw → Material → Product — ⬜ Not started
Target: raw resources from expeditions (e.g. scrap metal) aren't directly usable —
they need processing (e.g. a Sorting Center or smelter) into a usable material
before they fund repairs, construction, or production. A **Sorting Center** should
be an early, free-to-assemble building (built from junk, not metal) that extracts
a small amount of usable material from raw hauls — the first step of a longer
chain that later unlocks smelting, electronics, alloys, etc.
Current: Scavenge Run resources are used directly on buildings — no raw/processed
distinction. This is a meaningful economy rework, not a small addition: it likely
means splitting today's 4 resources into raw + processed pairs, and giving
buildings a processing recipe (inputs → outputs) rather than a flat cost.

### 4.8 The Camp as a Visual Location — 🔶 Partial
Target: a real visual location (in the spirit of Map Mode's treatment) where
the camp's growth — ruins → first structures → production → a real settlement
— is something you *see*, not just a number going up. As of v2.8: BaseScreen
renders the illustrated `Camp-01.png` scene full-bleed with buildings as
clickable hotspots and a real (if still basic) per-building detail panel — no
longer a flat menu/panel. See Section 8 for what's shipped vs. still open.

### 4.9 Resource Balance Across the Map — ⬜ Not started
Target: resource distribution across sectors should follow legible patterns
(terrain type, distance from camp, danger) with room for random/rare finds, and
avoid clustering one resource type too heavily near the camp.
Current: each sector's material bias is hand-picked per sector with no systematic
rule. Fine at 24 sectors; won't scale gracefully if the map grows much further
without a real distribution rule.

### 4.10 Labor & Worker Assignment — ⬜ Not started
Target: population is a real resource — buildings and research consume assigned
workers, creating a constant allocation decision (production vs. research vs.
camp work). Current: population is a passive number with no assignment mechanic.
Depends on 4.6 (research) and 4.7 (production buildings) existing first to have
anywhere meaningful to assign people.

---

## 5. Terminology Map

| Design-doc term | Current codebase term |
|---|---|
| Settlement | Camp / Base |
| Reconnaissance | Scout Run |
| Resource extraction | Scavenge Run |
| Sector danger level | Danger tier (sector) × Safe/Risky/Dangerous (player-chosen) |

No renames have been made yet — flagging the mapping so future work can decide
whether to converge naming (e.g. rename Scout Run → Reconnaissance once
re-reconnaissance exists and the two are genuinely distinct) rather than carry two
vocabularies indefinitely.

---

## 6. Open Design Questions

1. **Sector data model migration**: move to multi-opportunity sectors now (bigger
   upfront cost, avoids a painful migration later) or keep single-opportunity a
   while longer and migrate once content volume forces it?
2. **Science as a resource**: a 5th material, or a separate currency alongside
   credits/cores?
3. **Raw/processed split**: do existing metal/stone/wood/water become the "raw"
   tier with new processed counterparts, or does processing produce entirely new
   resource types?

---

## 7. Interface Roadmap — Map HUD (Phased)

Reconstructed in v2.7 after this section was lost to a context-window overflow
in a prior session; status below is re-verified against the actual repo (real
`vite build` + real headless-Firefox screenshots at 420px/1024px/1536px), not
carried over from the lost text.

**7.0 Platform mechanism — ✅ Done.** One interface, not a device fork — same
principle as Unreal's CommonUI or Godot's Control-anchor system: one tree of
anchored/responsive containers reflows by breakpoint, input is abstracted via
the `pointer` media feature / Pointer Events rather than `isMobile` checks.

**7.1 HUD overlay architecture — ✅ Done.** `engine/hud/`: `HudLayer` (transparent
overlay over the map viewport), `Anchored` (9-point anchor math, pure in
`anchor.ts`), `ResponsiveDrawer` (draggable bottom sheet ↔ fixed sidebar, pure
snap logic in `drawer.ts`), `OverlayPanel` (open/closed slide-in with scrim, the
non-drag-resizable sibling used for app-wide nav). Core rule, proven the hard
way (see 7.2's regression note): chrome must float (`position: fixed`/
`absolute`), never reserve layout space, at any breakpoint.

**7.2 Map chrome — ✅ Done.** `MapLegend` + `Compass` (bottom-left), multi-badge
hex rendering (a sector can show enemy + survivor + cleared + rescued state
simultaneously, not one badge). A real regression happened here once already —
TopBar/OverlayPanel briefly reverted to space-reserving layout at the app-shell
level — fixed by making all app chrome unconditionally floating. Keep that
failure mode in mind for Section 8: it's the single most-repeated mistake in
this project's history.

**7.3 Sector-centric mission list + selected-robot model — ⬜ Still open.** The
single largest remaining gap vs. the map reference. Current: a per-robot list,
one inline mission button per robot, a difficulty picker. Reference target: a
flat list of available mission *types* for the selected sector (each with a
duration estimate), a single robot-roster status bar pinned to the bottom of
the screen (HP/energy/skill readout, current task), and one prominent "Send"
action once a mission + robot are both selected. Effectively retires
`RobotDispatchList`'s current per-robot-grid shape.

**7.4 Top bar redesign + day counter — ✅ Done.** Settlement-name/day pill, full
resource row, population pill, settings gear — confirmed via screenshot to
already match the reference's top bar layout closely.

**7.5 Sidebar / hamburger nav — ✅ Done, 🔶 scoped down.** Persistent sidebar
≥`lg`, hamburger-toggled `OverlayPanel` below it, shared nav-items list, real
sprite icons (not emoji). Scope gap: only 3 destinations (Base / Junkyard /
Crew) vs. the reference's 6 (Camp / Map / Robots / Workshop / Research /
Journal) — tracked as 7.6 below rather than left silently inconsistent.

**Composition regression found + fixed (v2.9):** the settlement icon/name/day
badge was living in `TopBar` — part of the horizontal top strip, pushed right
via `lg:pl-[248px]` specifically to clear the sidebar. The reference has it
leading the sidebar's own column instead (icon+pill at the very top-left,
nav list directly under it, same left edge — one column, not the badge and
the sidebar as two unrelated floating pieces that happen to sit near each
other). Fixed by extracting `SettlementBadge` (used by both) and moving it
into the nav panel's header on ≥`lg`, keeping it in `TopBar` next to the
hamburger only on mobile (where the sidebar itself isn't visible by
default). Nav buttons were also restyled from bordered/filled `.btn` pills to
flat icon-chip + text rows with a subtle active-row tint, matching the
reference's minimal style instead of this project's general chunky-button
language. Verified via real screenshots at 420px/1600px, both Base and Map
sections (TopBar/nav are shared app-shell chrome, not per-screen).

**7.6 Full six-item navigation — ⬜ Not started, new in v2.7.** Splitting
Workshop out as its own destination is low-risk (it's today's Workshop building
card, relocated). A Journal destination (mission/event log) is buildable now
with no new systems needed. A Research destination is blocked on 4.6
(Scientific Research, ⬜ not started) — open question: stub it as "coming soon"
now, or wait until 4.6 has real content to show.

---

## 8. Interface Roadmap — Camp as a Visual Location (Phased)

Extends 4.8. Target, confirmed against the person's reference screenshot and
their `Camp-01.png` placeholder art: a full-bleed illustrated isometric camp
scene (matching Map Mode's treatment of the sector map) with buildings as
spatial, clickable objects, a per-building detail panel, and a bottom
Build/Upgrade/Plan toolbar.

**8.0 New engine primitive: scene hotspot layer — ✅ Done.** The map places
markers on a *regular hex grid* (`engine/hexgrid/`); the camp places markers at
*arbitrary* art-defined positions over a static illustrated image — a
genuinely different primitive, not a reskin of the hex layer. Shipped as
`engine/scene/` (mirrors the `engine/hud/`/`engine/viewport/` split — knows
nothing about buildings or camps specifically): `Scene` (locks a container to
the source image's aspect ratio, filling whichever axis of its parent is
limiting via CSS container-query units — `min(100cqw, 100cqh * ratio)` — with
zero crop and no JS measurement) + `Hotspot` (a button anchored at a
percentage `(x, y)` within it). One real bug found and fixed in this same
pass, worth recording since it's the exact failure this section already
warned about: the first working version rendered the scene letterboxed with
large black bars (a width-only cap, no matching height cap) — precisely
DESIGN.md 7.2's "black void" mistake, reintroduced a second time despite the
explicit warning two paragraphs above it. Fixed with the container-query
formula before shipping, not patched around. Verified via real headless-
Firefox screenshots at 1600px and 420px wide.

**8.1 Camp scene composition — ✅ Done, first pass.** `BaseScreen` now renders
`Camp-01.png` full-bleed (via `Scene`) with the 4 existing buildings
(Barracks/Kitchen/Water Still/Workshop) as hotspots (`game/camp/layout.ts`),
each showing a name+level tag, a category-colored ring (green/gold/cyan/
orange), and a build/upgrade corner badge; unbuilt buildings render as a
dashed, grayscale "· Site" marker rather than disappearing. Hotspot
coordinates are hand-picked against the current placeholder by eye (a 10%
grid overlay was used to read them off, not a random guess, but still not a
traced footprint) — noted in code as needing to be re-picked once final art
replaces `Camp-01.png`. The image's central tower and its satellite-dish
structure are deliberately left unclaimed (see the code comment in
`layout.ts`): the former is the camp's own core, already labeled by
`WoodTitle`; the latter is reserved as a natural home for a future Research
building once 4.6 exists.

**8.2 Building detail panel — 🔶 Partial.** Clicking a hotspot opens a real
detail panel in the existing `ResponsiveDrawer` (icon, name, level, tagline,
effect line, live cost chips, a working Build/Upgrade button wired to the same
`actions.buildOrUpgrade` the old card list used) — verified end-to-end via a
temporary, reverted `?selectBuilding=` query hook (same disposable-hook
pattern as every prior session's interactive verification) showing Workshop
selected with real cost data. Still missing vs. the reference: no building
thumbnail image, no separate stat-chip row (Comfort/Residents/Energy/Health-
style), no distinct "characteristics" vs. "available upgrades" breakdown —
today's panel is one step, not the reference's fuller layout. Left for a
follow-up pass rather than guessed at now.

**8.3 Camp tasks reattachment — ⬜ Not started, ❓ open question.** Reference
ties tasks to the specific building they concern ("Feed residents 12/20" lives
under the Residential-block panel). Today's "What's next" checklist is still
site-wide, shown above the selected-building panel rather than merged into it.
Open question unresolved: does a global objectives view still have a role once
(if) tasks move into per-building panels, or does it go away entirely?

**8.4 Bottom action bar — ⬜ Not started.** A floating Build / Upgrade / Plan
mode switcher, mirroring the reference's bottom toolbar and 7.1's
floating-chrome rule (must not reserve layout space, at any breakpoint).

**8.5 Mobile framing — ⬜ Not started, new gap found in v2.8.** Confirmed via a
420px-wide screenshot: since the scene never crops or pans (8.0's deliberate
choice) and the reference art is landscape (1536×1024), a narrow tall screen
ends up width-limited with a lot of empty vertical space above/below the
scene within its own drawer-bounded container. Not a black-void bug (nothing
is cut off or misaligned) but not great use of the space either — open for a
follow-up pass; possibly wants its own mobile-specific framing rather than
literally the same box math as desktop.

**Status: 8.0 and 8.1 done, 8.2 started, 8.3/8.4/8.5 open.** Each phase still
gets real-build + real-headless-Firefox-screenshot verification before being
marked done — non-negotiable per the person's standing instruction against
temporary patches.

---

