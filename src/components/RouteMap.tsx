import { useMemo } from "react";
import { dayColor } from "@/lib/journeyStyles";

type Stop = {
  id: number;
  name: string;
  day: number;
  lat: number | null;
  lng: number | null;
};

/** Stylized frosted route map — plots journey stops with a flowing path. */
export default function RouteMap({ stops, height = 300 }: { stops: Stop[]; height?: number }) {
  const { points, path } = useMemo(() => {
    const located = stops.filter((s) => s.lat != null && s.lng != null);
    if (located.length < 2) return { points: [], path: "" };
    const lats = located.map((s) => s.lat as number);
    const lngs = located.map((s) => s.lng as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const pad = 0.12;
    const W = 800;
    const H = 100;
    const pts = located.map((s) => {
      const x =
        minLng === maxLng
          ? 0.5
          : pad + ((s.lng as number) - minLng) / (maxLng - minLng) * (1 - 2 * pad);
      const y =
        minLat === maxLat
          ? 0.5
          : 1 - (pad + ((s.lat as number) - minLat) / (maxLat - minLat) * (1 - 2 * pad));
      return { s, x: x * W, y: y * H };
    });
    // smooth path through points (catmull-rom → bezier)
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return { points: pts, path: d };
  }, [stops]);

  if (points.length < 2) {
    return (
      <div className="glass-subtle flex items-center justify-center rounded-atlas text-sm text-muted-foreground" style={{ height }}>
        Route map unavailable — stops have no coordinates yet.
      </div>
    );
  }

  return (
    <div className="glass-subtle relative overflow-hidden rounded-atlas" style={{ height }}>
      {/* faint grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" preserveAspectRatio="none">
        <defs>
          <pattern id="atlas-grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="hsl(226 30% 12% / 0.10)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#atlas-grid)" />
      </svg>
      <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={path} fill="none" stroke="hsl(226 30% 12% / 0.14)" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          stroke="url(#route-grad)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
        <defs>
          <linearGradient id="route-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--atlas-sky))" />
            <stop offset="50%" stopColor="hsl(var(--atlas-lavender))" />
            <stop offset="100%" stopColor="hsl(var(--atlas-peach))" />
          </linearGradient>
        </defs>
      </svg>
      {points.map(({ s, x, y }, i) => (
        <div
          key={s.id}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(x / 800) * 100}%`, top: `${y}%` }}
        >
          <span
            className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125"
            style={{ background: dayColor(s.day) }}
          />
          <span className="glass-strong pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-44 -translate-x-1/2 rounded-xl px-2.5 py-1.5 text-center text-[11px] font-bold opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Day {s.day} · Stop {i + 1}
            </span>
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
}
