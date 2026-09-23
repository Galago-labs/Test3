export function fmt(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 2 : 1).replace(/\.0+$/, "") + "K";
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
  return (n / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + "B";
}

export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
