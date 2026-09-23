import type { CSSProperties } from "react";
import { SpriteIcon } from "../../engine/sprites/SpriteIcon";
import { ICON_POSITIONS, ICON_SHEET_COLS, ICON_SHEET_ROWS, ICON_SHEET_SRC, type IconName } from "../../game/map/icons";

export function MapIcon({
  name,
  size,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [col, row] = ICON_POSITIONS[name];
  return (
    <SpriteIcon
      src={ICON_SHEET_SRC}
      cols={ICON_SHEET_COLS}
      rows={ICON_SHEET_ROWS}
      col={col}
      row={row}
      size={size}
      className={className}
      style={style}
      label={name}
    />
  );
}
