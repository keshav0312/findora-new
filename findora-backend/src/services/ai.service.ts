// Findora — AI-powered match explanation via Groq
//
// Groq (https://console.groq.com) hosts open models (Llama 3.3, etc.) behind
// an OpenAI-compatible /chat/completions endpoint, and it's fast + has a
// generous free tier — good fit for a student/startup project. Get a key
// at https://console.groq.com/keys and set GROQ_API_KEY in your .env.
//
// The deterministic scoring in utils/matching.ts already decides *which*
// pairs count as a match (fast, free, works offline). Groq is layered on
// top only to turn that structured score into a short, human-readable
// explanation of *why* two reports look like a match — the kind of
// "AI Matching" callout shown in the product's dashboard. If GROQ_API_KEY
// isn't set, callers get a sensible template-based fallback instead.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface ExplainArgs {
  lostTitle: string;
  foundTitle: string;
  category: string;
  lostLocation: string;
  foundLocation: string;
  score: number;
  breakdown: { category: number; location: number; description: number; date: number; image: number };
}

function fallbackExplanation({ score, category, lostLocation, foundLocation }: ExplainArgs) {
  return `Matched on category "${category}" and nearby locations (${lostLocation} / ${foundLocation}) with an overall confidence of ${score}%.`;
}

export async function explainMatch(args: ExplainArgs): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallbackExplanation(args);

  const prompt = `You help reunite people with lost belongings. Two reports were matched by a scoring
algorithm. Write ONE short, friendly sentence (max 30 words) explaining to a user why these two
reports likely refer to the same item. Be specific but concise, plain text only, no markdown.

Lost item report: "${args.lostTitle}" last seen at ${args.lostLocation}
Found item report: "${args.foundTitle}" found at ${args.foundLocation}
Category: ${args.category}
Match confidence: ${args.score}%
Score breakdown (out of max): category ${args.breakdown.category}/25, location ${args.breakdown.location}/35, description ${args.breakdown.description}/20, date ${args.breakdown.date}/10, photo/color ${args.breakdown.image}/10`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 80,
      }),
    });

    if (!res.ok) {
      console.error(`[ai:error] Groq responded ${res.status}`);
      return fallbackExplanation(args);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return text || fallbackExplanation(args);
  } catch (err) {
    console.error("[ai:error]", (err as Error).message);
    return fallbackExplanation(args);
  }
}

/**
 * Free-text semantic similarity between two item descriptions, used as an
 * optional AI-boost on top of the deterministic Jaccard score for
 * high-value / ambiguous matches. Returns 0-1, or null if unavailable.
 */
export async function semanticSimilarity(a: string, b: string): Promise<number | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || (!a?.trim() && !b?.trim())) return null;

  const prompt = `On a scale of 0 to 100, how likely do these two lost/found item descriptions refer
to the exact same physical object? Reply with ONLY the number, nothing else.

Description A: "${a || "(none)"}"
Description B: "${b || "(none)"}"`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 5,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content || "";
    const n = parseInt(text.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(n)) return null;
    return Math.max(0, Math.min(100, n)) / 100;
  } catch {
    return null;
  }
}
