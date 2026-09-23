import type { CSSProperties } from "react";

export interface SpriteIconProps {
  /** URL of the sprite sheet image. */
  src: string;
  /** Grid dimensions of the sheet. */
  cols: number;
  rows: number;
  /** 0-indexed cell to display. */
  col: number;
  row: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible label — the engine doesn't know what the icon means, so the caller supplies this. */
  label?: string;
}

export function SpriteIcon({
  src,
  cols,
  rows,
  col,
  row,
  size = 24,
  className = "",
  style,
  label,
}: SpriteIconProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundImage: `url(${src})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
        backgroundRepeat: "no-repeat",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
