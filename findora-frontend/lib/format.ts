import { API_URL } from "./api";

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Infinity, "y"],
  ];
  let value = seconds;
  let label = "s";
  for (const [amount, unit] of units) {
    if (value < amount) {
      label = unit;
      break;
    }
    value = Math.floor(value / amount);
    label = unit;
  }
  if (seconds < 60) return "just now";
  return `${value}${label} ago`;
}

export function currency(amount: number) {
  if (!amount) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Resolve a possibly-relative photo path (e.g. "/uploads/x.jpg") returned
 * by the backend into an absolute URL against the API origin. */
export function resolveImage(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const origin = API_URL.replace(/\/api\/?$/, "");
  return `${origin}${path}`;
}

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
