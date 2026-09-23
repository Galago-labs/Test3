import { anchorStyle } from "./src/engine/hud/anchor";
import { clampDrawerHeight, heightForSnap, nearestSnap } from "./src/engine/hud/drawer";

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

// ---- anchorStyle ----
{
  const tl = anchorStyle("top-left", 10);
  check("anchorStyle: top-left sets top/left to the margin", tl.top === 10 && tl.left === 10);
  check("anchorStyle: top-left has no centering transform", tl.transform === undefined);

  const br = anchorStyle("bottom-right", 8);
  check("anchorStyle: bottom-right sets bottom/right to the margin", br.bottom === 8 && br.right === 8);

  const center = anchorStyle("center", 20);
  check("anchorStyle: center ignores margin on both axes (50% + translate instead)", center.top === "50%" && center.left === "50%");
  check("anchorStyle: center transform pulls back by 50% on both axes", center.transform === "translate(-50%, -50%)");

  const topCenter = anchorStyle("top-center", 12);
  check("anchorStyle: top-center pins top to the margin, centers horizontally", topCenter.top === 12 && topCenter.left === "50%");
  check("anchorStyle: top-center transform only offsets x", topCenter.transform === "translate(-50%, 0%)");

  const centerLeft = anchorStyle("center-left", 5);
  check("anchorStyle: center-left pins left to the margin, centers vertically", centerLeft.left === 5 && centerLeft.top === "50%");
  check("anchorStyle: center-left transform only offsets y", centerLeft.transform === "translate(0%, -50%)");
}

// ---- drawer snap logic ----
{
  const limits = { peekHeight: 200, expandedHeight: 600 };

  check("heightForSnap: peek returns peekHeight", heightForSnap("peek", limits) === 200);
  check("heightForSnap: expanded returns expandedHeight", heightForSnap("expanded", limits) === 600);

  check("clampDrawerHeight: never goes below peekHeight", clampDrawerHeight(0, limits) === 200);
  check("clampDrawerHeight: never exceeds expandedHeight", clampDrawerHeight(9999, limits) === 600);
  check("clampDrawerHeight: passes through an in-range value unchanged", clampDrawerHeight(400, limits) === 400);

  check("nearestSnap: below the midpoint settles to peek", nearestSnap(300, limits) === "peek");
  check("nearestSnap: above the midpoint settles to expanded", nearestSnap(500, limits) === "expanded");
  check("nearestSnap: exactly at the midpoint settles to expanded (tie-break)", nearestSnap(400, limits) === "expanded");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
