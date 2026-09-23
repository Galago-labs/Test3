import { useState } from "react";
import { MAP_LEGEND } from "../../game/map/icons";
import { MapIcon } from "./MapIcon";

/**
 * Explains the hex map's icon badges. A small toggle button on narrow
 * screens (tap to reveal the list, tap again to hide it — screen space is
 * precious there); always expanded on wide screens where there's room to
 * just show it. One component, one list of entries — which half renders is
 * decided by the `lg` breakpoint, not by device detection.
 */
export function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="panel-hud flex items-center gap-1.5 px-2.5 py-1.5 lg:hidden"
      >
        <MapIcon name="info" size={16} />
        <span className="text-xs font-extrabold text-amber-100/90">Legend</span>
      </button>

      <div className={`panel-hud mt-1.5 flex-col gap-1 px-3 py-2 lg:mt-0 lg:flex ${expanded ? "flex" : "hidden"}`}>
        {MAP_LEGEND.map(({ icon, label }) => (
          <div key={icon} className="flex items-center gap-2">
            <MapIcon name={icon} size={16} />
            <span className="text-xs font-bold whitespace-nowrap text-amber-100/85">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
