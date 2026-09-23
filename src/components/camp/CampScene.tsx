import { Scene } from "../../engine/scene/Scene";
import { Hotspot } from "../../engine/scene/Hotspot";
import { BUILDINGS, type BuildingKey, buildingCost } from "../../game/buildings";
import type { ResKey } from "../../game/data";
import { CAMP_HOTSPOTS, CAMP_IMAGE_HEIGHT, CAMP_IMAGE_SRC, CAMP_IMAGE_WIDTH } from "../../game/camp/layout";
import { CampBuildingMarker } from "./CampBuildingMarker";

export function CampScene({
  buildings,
  resources,
  discount,
  selected,
  onSelect,
}: {
  buildings: Record<BuildingKey, number>;
  resources: Record<ResKey, number>;
  discount: number;
  selected: BuildingKey | null;
  onSelect: (key: BuildingKey) => void;
}) {
  return (
    <Scene src={CAMP_IMAGE_SRC} width={CAMP_IMAGE_WIDTH} height={CAMP_IMAGE_HEIGHT} alt="Your camp">
      {CAMP_HOTSPOTS.map((spot) => {
        const def = BUILDINGS.find((b) => b.key === spot.key)!;
        const level = buildings[spot.key] ?? 0;
        const maxed = level >= def.maxLevel;
        const cost = maxed ? null : buildingCost(def, level, discount);
        const affordable = !cost || Object.entries(cost).every(([k, v]) => resources[k as ResKey] >= (v as number));

        return (
          <Hotspot key={spot.key} xPct={spot.xPct} yPct={spot.yPct} label={def.name} onSelect={() => onSelect(spot.key)}>
            <CampBuildingMarker
              def={def}
              level={level}
              color={spot.color}
              selected={selected === spot.key}
              affordable={affordable}
            />
          </Hotspot>
        );
      })}
    </Scene>
  );
}
