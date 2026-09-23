import { clampCamera, minZoomFor, panByScreenDelta, screenToWorld, zoomAround } from "./src/engine/viewport/camera";

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log("FAIL:", label);
  }
}

const WORLD = { width: 1536, height: 1024 };
const LIMITS = { maxZoom: 3, edgeBuffer: 0.03 };

// ---- minZoomFor ----
{
  // A 768x512 viewport is exactly half the world on both axes — minZoom
  // should be ~0.5 plus the edge buffer, not less.
  const z = minZoomFor(WORLD, { width: 768, height: 512 }, 0.03);
  check("minZoomFor: matches the exact fit plus the buffer", Math.abs(z - 0.5 * 1.03) < 1e-9);

  // A viewport with a different aspect ratio than the world is bound by
  // whichever axis needs more zoom to fully cover.
  const zTall = minZoomFor(WORLD, { width: 100, height: 1024 }, 0);
  check("minZoomFor: bound by the axis that needs more coverage", Math.abs(zTall - 1) < 1e-9);
}

// ---- clampCamera ----
{
  const viewport = { width: 768, height: 512 };
  const minZoom = minZoomFor(WORLD, viewport, LIMITS.edgeBuffer);

  // The actual safety property the buffer exists for: even at the buffered
  // minZoom, the full viewport width/height in world units must fit inside
  // the world — i.e. you can never see past its edge.
  check(
    "minZoomFor: the buffered floor still keeps the whole viewport within the world",
    viewport.width / minZoom <= WORLD.width && viewport.height / minZoom <= WORLD.height,
  );

  const tooFarOut = clampCamera({ x: 0, y: 0, zoom: 0.01 }, WORLD, viewport, LIMITS);
  check("clampCamera: zoom never goes below the world-covers-viewport floor", tooFarOut.zoom >= minZoom - 1e-9);

  const tooFarIn = clampCamera({ x: 0, y: 0, zoom: 999 }, WORLD, viewport, LIMITS);
  check("clampCamera: zoom never exceeds maxZoom", tooFarIn.zoom <= LIMITS.maxZoom + 1e-9);

  // At the *exact* fit (no buffer), the world matches the viewport exactly
  // on both axes, so there's no slack to pan within on either — center must
  // stay pinned to the world's exact middle no matter what was asked for.
  // (With a nonzero edgeBuffer, minZoom is deliberately a hair past exact
  // fit, which is what guarantees the edge is never visible — but that also
  // means a sliver of slack exists at minZoom itself; this checks the
  // boundary condition in isolation instead.)
  const exactLimits = { maxZoom: LIMITS.maxZoom, edgeBuffer: 0 };
  const exactZoom = minZoomFor(WORLD, viewport, 0);
  const pinned = clampCamera({ x: -99999, y: 99999, zoom: exactZoom }, WORLD, viewport, exactLimits);
  check("clampCamera: no slack at exact fit pins x to world center", Math.abs(pinned.x - WORLD.width / 2) < 1e-6);
  check("clampCamera: no slack at exact fit pins y to world center", Math.abs(pinned.y - WORLD.height / 2) < 1e-6);

  // At a closer zoom there IS slack — panning to an extreme should clamp to
  // the edge (world edge minus half the visible span), not to the center.
  const zoom2 = 2;
  const halfW = viewport.width / 2 / zoom2;
  const edge = clampCamera({ x: -99999, y: 0, zoom: zoom2 }, WORLD, viewport, LIMITS);
  check("clampCamera: with slack, an extreme pan clamps to the world edge, not the center", Math.abs(edge.x - halfW) < 1e-6);
  check("clampCamera: clamped edge never exposes space past the world's left edge", edge.x - halfW >= -1e-6);

  const edgeRight = clampCamera({ x: 99999, y: 0, zoom: zoom2 }, WORLD, viewport, LIMITS);
  const expectedRight = WORLD.width - halfW;
  check("clampCamera: extreme pan the other way clamps to the opposite edge", Math.abs(edgeRight.x - expectedRight) < 1e-6);
}

// ---- screenToWorld / zoomAround ----
{
  const viewport = { width: 800, height: 600 };
  const camera = { x: 500, y: 400, zoom: 1 };

  const centerWorld = screenToWorld(camera, { x: 400, y: 300 }, viewport);
  check("screenToWorld: viewport center maps to the camera's own point", Math.abs(centerWorld.x - 500) < 1e-9 && Math.abs(centerWorld.y - 400) < 1e-9);

  // Zooming in around a point that isn't the viewport center should keep
  // that world point under the same screen position afterward.
  const around = { x: 200, y: 150 };
  const worldUnderCursor = screenToWorld(camera, around, viewport);
  const zoomed = zoomAround(camera, 2, around, WORLD, viewport, LIMITS);
  const worldUnderCursorAfter = screenToWorld(zoomed, around, viewport);
  check(
    "zoomAround: the world point under the cursor stays under the cursor",
    Math.abs(worldUnderCursor.x - worldUnderCursorAfter.x) < 1e-6 &&
      Math.abs(worldUnderCursor.y - worldUnderCursorAfter.y) < 1e-6,
  );
  check("zoomAround: zoom actually increased", zoomed.zoom > camera.zoom);
}

// ---- panByScreenDelta ----
{
  const viewport = { width: 800, height: 600 };
  const camera = { x: 500, y: 400, zoom: 1 };

  // Dragging the pointer right by dx should move the camera's world center
  // left by dx/zoom (the world slides right under a fixed viewport) — same
  // convention as every pan-to-scroll UI.
  const panned = panByScreenDelta(camera, { x: 50, y: 0 }, WORLD, viewport, LIMITS);
  check("panByScreenDelta: dragging right moves the camera center left", panned.x < camera.x);

  // A pan that would exceed the world bounds clamps instead of overshooting.
  const overPanned = panByScreenDelta(camera, { x: -999999, y: 0 }, WORLD, viewport, LIMITS);
  const halfW = viewport.width / 2 / overPanned.zoom;
  check("panByScreenDelta: an extreme pan clamps rather than escaping the world", overPanned.x <= WORLD.width - halfW + 1e-6);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
