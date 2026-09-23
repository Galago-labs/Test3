import type { CSSProperties } from "react";

// The 9 standard anchor points (parallel to Godot's anchor presets / UMG
// anchor points) — where a HUD widget attaches within its container.
export type AnchorPoint =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type Vertical = "top" | "center" | "bottom";
type Horizontal = "left" | "center" | "right";

function parts(anchor: AnchorPoint): [Vertical, Horizontal] {
  if (anchor === "center") return ["center", "center"];
  const [v, h] = anchor.split("-");
  return [v as Vertical, h as Horizontal];
}

// Pure: given an anchor point and a margin (px from the container's edge),
// returns the CSS needed to position an absolutely-positioned element there.
// Centered axes get a 50%/-50% translate rather than a margin, same as
// hand-centering any absolutely positioned element.
export function anchorStyle(anchor: AnchorPoint, margin: number): CSSProperties {
  const [v, h] = parts(anchor);
  const style: CSSProperties = { position: "absolute" };

  if (v === "top") style.top = margin;
  else if (v === "bottom") style.bottom = margin;
  else style.top = "50%";

  if (h === "left") style.left = margin;
  else if (h === "right") style.right = margin;
  else style.left = "50%";

  const ty = v === "center" ? -50 : 0;
  const tx = h === "center" ? -50 : 0;
  if (tx !== 0 || ty !== 0) style.transform = `translate(${tx}%, ${ty}%)`;

  return style;
}
