// The app's TopBar floats over content (see App.tsx) rather than reserving
// its own layout row — that's what lets the map render truly full-bleed.
// Anything with content-that-must-be-visible (not just background art)
// still needs to clear it, so this one constant is shared by App.tsx (for
// Base/Crew) and MapMode.tsx (for its own title), instead of three call
// sites guessing the same magic number independently.
//
// TopBar is two rows on narrow screens (the resource row drops below the
// main row there — see TopBar.tsx) and one row from `sm` up, so the
// clearance itself has to be responsive, not a single number. A literal,
// static class string (not built from a variable) so Tailwind's scanner
// picks it up from every file that imports and uses it.
export const APP_TOPBAR_CLEARANCE_CLASS = "pt-[132px] sm:pt-[54px]";

// Same idea for the app's persistent nav sidebar (see App.tsx): one shared
// width + clearance instead of every call site guessing its own number —
// 220/236/248 had already drifted apart independently before this existed.
export const APP_SIDEBAR_WIDTH_PX = 236;
export const APP_SIDEBAR_CLEARANCE_CLASS = "lg:pl-[252px]";
export const APP_SIDEBAR_CLEARANCE_LEFT_CLASS = "lg:left-[252px]";
