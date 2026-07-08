import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const PIN_POSITIONS = [
  { top: "22%", left: "28%", color: "text-brand-red" },
  { top: "42%", left: "58%", color: "text-brand-green" },
  { top: "65%", left: "38%", color: "text-brand-red" },
  { top: "30%", left: "72%", color: "text-brand-green" },
  { top: "72%", left: "68%", color: "text-brand-indigo" },
];

/**
 * A stylized map preview used in place of a live Leaflet/Google Maps embed.
 * Swap this for a real map component (see README) once you add a maps API key.
 */
export function MapPreview({ className, dense = false }: { className?: string; dense?: boolean }) {
  const pins = dense ? PIN_POSITIONS : PIN_POSITIONS.slice(0, 3);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#eef2ff_0%,#e0e7ff_35%,#dbeafe_100%)] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#1e1b4b_0%,#1e293b_50%,#0f172a_100%)]",
        className
      )}
    >
      <svg className="absolute inset-0 h-full w-full opacity-40 dark:opacity-20" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#c7d2fe" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {pins.map((p, i) => (
        <span
          key={i}
          className={cn("absolute -translate-x-1/2 -translate-y-full animate-bounce drop-shadow-sm", p.color)}
          style={{ top: p.top, left: p.left, animationDelay: `${i * 300}ms`, animationDuration: "2.4s" }}
        >
          <MapPin className="size-6 fill-current stroke-white" strokeWidth={1.5} />
        </span>
      ))}
    </div>
  );
}
