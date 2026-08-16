import { deepseek, hasKey, parseJson, templateIdeas, type GeneratedIdea } from "./ai.server";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export interface Source {
  url: string;
  title: string;
  snippet: string;
  markdown?: string | undefined;
}

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["FIRECRAWL_API_KEY"];
  if (!lovable || !conn) throw new Error("Firecrawl connection is not configured");
  return { lovable, conn };
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const { lovable, conn } = keys();
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": conn,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`firecrawl ${path} failed [${res.status}]: ${text}`);
    throw new Error(`Firecrawl request failed [${res.status}]: ${text}`);
  }
  return (await res.json()) as T;
}

type ScrapeDoc = {
  markdown?: string | undefined;
  summary?: string;
  metadata?: { title?: string; description?: string; sourceURL?: string };
};

export async function scrapeUrl(url: string): Promise<Source> {
  const raw = await call<{ data?: ScrapeDoc } & ScrapeDoc>("/scrape", {
    url,
    formats: ["markdown", "summary"],
    onlyMainContent: true,
  });
  const doc: ScrapeDoc = raw.data ?? raw;
  return {
    url: doc.metadata?.sourceURL ?? url,
    title: doc.metadata?.title ?? url,
    snippet: doc.summary ?? doc.metadata?.description ?? (doc.markdown ?? "").slice(0, 400),
    markdown: doc.markdown,
  };
}

export async function searchWeb(query: string, limit = 5): Promise<Source[]> {
  const raw = await call<{ data?: { web?: unknown[] } | unknown[] }>("/search", {
    query,
    limit,
    tbs: "qdr:m",
    scrapeOptions: { formats: ["markdown"] },
  });
  const list = (Array.isArray(raw.data) ? raw.data : (raw.data as { web?: unknown[] })?.web) ?? [];
  return (list as {
    url?: string;
    title?: string;
    description?: string;
    markdown?: string | undefined;
  }[]).map((r) => ({
    url: r.url ?? "",
    title: r.title ?? r.url ?? "Untitled",
    snippet: r.description ?? (r.markdown ?? "").slice(0, 300),
    markdown: r.markdown,
  }));
}

export async function ideasFromSources(input: {
  sources: Source[];
  niche: string;
  audience: string;
  platform: string;
  format: string;
  goal: string;
}): Promise<{ ideas: GeneratedIdea[]; mode: string }> {
  const seed = {
    niche: input.niche,
    topic: input.sources[0]?.title ?? input.niche,
    platform: input.platform,
    audience: input.audience,
    goal: input.goal,
    format: input.format,
  };
  if (!hasKey()) return { ideas: templateIdeas(seed, 4), mode: "TEMPLATE" };
  const context = input.sources
    .slice(0, 5)
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title} (${s.url})\n${(s.markdown ?? s.snippet ?? "").slice(0, 2500)}`,
    )
    .join("\n\n");
  try {
    const raw = await deepseek(
      "You are a senior content strategist who turns research into original content angles. Reply with raw JSON only.",
      `Using ONLY the research below, generate 4 grounded content ideas as a JSON array of {"title","hook","angle","format","why"}.
In "why", cite the source number(s) like [1] and state the concrete fact used.
Niche: ${input.niche}
Audience: ${input.audience}
Platform: ${input.platform}
Format: ${input.format}
Goal: ${input.goal}

RESEARCH:
${context}`,
    );
    return { ideas: parseJson<GeneratedIdea[]>(raw), mode: "DEEPSEEK" };
  } catch (e) {
    console.error("research ideas failed", e);
    return { ideas: templateIdeas(seed, 4), mode: "TEMPLATE" };
  }
}
