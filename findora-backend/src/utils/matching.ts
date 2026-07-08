// Findora matching engine
//
// This is a deterministic, explainable scoring function that stands in for
// the "AI-powered similarity" described in the product spec. It weighs
// category / location / description / date / photo overlap and produces a
// 0-100 score plus a per-field breakdown so the UI can show *why* two
// reports were matched. Swapping this out for real vector embeddings or an
// image-similarity model later is a drop-in replacement — keep the same
// return shape.

export interface MatchableItem {
  category: string;
  location: string;
  city?: string;
  description?: string;
  color?: string;
  brand?: string;
  date: Date | string;
  photos?: string[];
}

export interface MatchBreakdown {
  category: number; // 0-25
  location: number; // 0-35
  description: number; // 0-20
  date: number; // 0-10
  image: number; // 0-10
}

export interface MatchResult {
  score: number; // 0-100
  breakdown: MatchBreakdown;
}

const WEIGHTS = {
  category: 25,
  location: 35,
  description: 20,
  date: 10,
  image: 10,
};

function normalize(str?: string) {
  return (str || "").toLowerCase().trim();
}

function tokenize(str?: string) {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/** Jaccard similarity over token sets — cheap stand-in for text embeddings. */
function textSimilarity(a?: string, b?: string) {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

function locationSimilarity(a: MatchableItem, b: MatchableItem) {
  const cityA = normalize(a.city);
  const cityB = normalize(b.city);
  const locA = normalize(a.location);
  const locB = normalize(b.location);

  if (locA && locB && locA === locB) return 1;
  if (cityA && cityB && cityA === cityB) {
    // Same city, different exact spot — partial credit, boosted by any
    // shared words in the free-text location (e.g. "DB Mall" in both).
    const overlap = textSimilarity(locA, locB);
    return 0.6 + overlap * 0.4;
  }
  return textSimilarity(locA, locB) * 0.5;
}

function dateSimilarity(a: Date | string, b: Date | string) {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  const diffDays = Math.abs(da - db) / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 1;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 14) return 0.25;
  return 0;
}

function imageSimilarity(a: MatchableItem, b: MatchableItem) {
  // Placeholder for real image-embedding comparison. For now: reward having
  // photos on both sides (a real signal exists to compare) plus a small
  // bonus if colors described match, since color is often visually salient.
  const bothHavePhotos = (a.photos?.length || 0) > 0 && (b.photos?.length || 0) > 0;
  const colorMatch =
    normalize(a.color) && normalize(a.color) === normalize(b.color) ? 1 : 0;
  if (!bothHavePhotos && !colorMatch) return 0;
  return bothHavePhotos ? 0.6 + colorMatch * 0.4 : colorMatch * 0.5;
}

export function computeMatch(a: MatchableItem, b: MatchableItem): MatchResult {
  const categoryScore = normalize(a.category) === normalize(b.category) ? 1 : 0;

  const description = textSimilarity(
    `${a.description || ""} ${a.brand || ""}`,
    `${b.description || ""} ${b.brand || ""}`
  );

  const location = locationSimilarity(a, b);
  const date = dateSimilarity(a.date, b.date);
  const image = imageSimilarity(a, b);

  const breakdown: MatchBreakdown = {
    category: Math.round(categoryScore * WEIGHTS.category),
    location: Math.round(location * WEIGHTS.location),
    description: Math.round(description * WEIGHTS.description),
    date: Math.round(date * WEIGHTS.date),
    image: Math.round(image * WEIGHTS.image),
  };

  const score =
    breakdown.category +
    breakdown.location +
    breakdown.description +
    breakdown.date +
    breakdown.image;

  return { score, breakdown };
}

/** Reports below this score are not surfaced as a "possible match". */
export const MATCH_THRESHOLD = 45;
