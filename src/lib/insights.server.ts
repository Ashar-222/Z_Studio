import { deepseek, hasKey, parseJson } from "./ai.server";

export interface CreatorPostInput {
  title: string;
  views?: number | undefined;
  likes?: number | undefined;
  comments?: number | undefined;
  publishedAt?: string | undefined;
}

export interface ResearchInput {
  url: string;
  title: string;
  snippet: string;
}

export interface Opportunity {
  topic: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  creatorEvidence: string;
  researchEvidence: string;
  newAngle: string;
  confidence: "High" | "Medium" | "Low";
}

export async function opportunitiesFromData(input: {
  handle: string;
  platform: string;
  niche: string;
  audience: string;
  goal: string;
  posts: CreatorPostInput[];
  research: ResearchInput[];
}): Promise<{ opportunities: Opportunity[] }> {
  if (!hasKey()) throw new Error("AI analysis is unavailable: DeepSeek API key is not configured.");
  if (input.posts.length === 0 && input.research.length === 0) {
    throw new Error("Import a profile or run research first — there is nothing to analyse.");
  }

  const creator = input.posts
    .slice(0, 12)
    .map(
      (p, i) =>
        `C${i + 1}. "${p.title}" — views ${p.views ?? "n/a"}, likes ${p.likes ?? "n/a"}, comments ${
          p.comments ?? "n/a"
        }, published ${p.publishedAt ?? "n/a"}`,
    )
    .join("\n");
  const research = input.research
    .slice(0, 6)
    .map((r, i) => `R${i + 1}. ${r.title} (${r.url})\n${r.snippet.slice(0, 1200)}`)
    .join("\n\n");

  const raw = await deepseek(
    "You are a creator strategist. You only use the supplied data. Never invent statistics or sources. Reply with raw JSON only.",
    `Analyse the creator's own performance data and the public research below, then return 4 content opportunities as a JSON array of objects:
{"topic","title","hook","angle","format","creatorEvidence","researchEvidence","newAngle","confidence"}

Rules:
- "creatorEvidence" must reference the creator's own posts by their C-number and cite the real metric.
- "researchEvidence" must reference research items by R-number and quote the concrete finding. If no research was supplied, write "No public research supplied".
- "newAngle" explains how this differs from simply repeating existing content.
- "confidence" is High, Medium or Low based on how much evidence supports it.

Creator: @${input.handle} on ${input.platform}
Niche: ${input.niche || "unspecified"}
Audience: ${input.audience || "unspecified"}
Goal: ${input.goal || "unspecified"}

CREATOR POSTS:
${creator || "None supplied"}

PUBLIC RESEARCH:
${research || "None supplied"}`,
  );
  return { opportunities: parseJson<Opportunity[]>(raw) };
}
