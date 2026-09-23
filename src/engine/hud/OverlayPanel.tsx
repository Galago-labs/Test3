import type { ReactNode } from "react";

/**
 * A panel that's a toggleable off-canvas overlay (with a click-to-close
 * scrim) on narrow screens, and an always-visible overlay on wide ones —
 * same children, same component, no device fork. In both cases it **floats
 * on top of the content** (fixed, out of normal flow) rather than reserving
 * its own layout space — the content behind it stays full-bleed either way,
 * which matters for anything (like a game map) that needs true edge-to-edge
 * rendering. Sibling to `<ResponsiveDrawer>` for the case that doesn't fit
 * it: an open/closed toggle sliding from a *side*, rather than a
 * drag-resizable sheet from the *bottom* that reserves real space. Used for
 * app-shell navigation (see `App.tsx`), but knows nothing about nav items,
 * sections, or any other game/app content.
 */
export function OverlayPanel({
  open,
  onClose,
  side = "left",
  widthPx = 240,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  widthPx?: number;
  className?: string;
  children: ReactNode;
}) {
  const edge = side === "left" ? "left-0" : "right-0";
  const hiddenTranslate = side === "left" ? "-translate-x-full" : "translate-x-full";

  return (
    <>
      {/* Scrim: mobile-only, and only present while open — tap it to close.
          Not shown on wide screens, where the panel is always visible and
          isn't "modal" in the same way. */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={
          className ??
          `pointer-events-auto fixed top-0 z-50 h-full shrink-0 transition-transform duration-200 ease-out ` +
            `${edge} ${open ? "translate-x-0" : hiddenTranslate} lg:translate-x-0 lg:transition-none`
        }
        style={{ width: widthPx }}
      >
        {children}
      </div>
    </>
  );
}
