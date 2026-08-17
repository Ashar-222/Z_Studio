import type { ContentFormat, Platform } from "./types";

export interface IdeaSeed {
  niche: string;
  topic: string;
  platform: Platform | string;
  audience: string;
  goal: string;
  format: ContentFormat | string;
  thoughts?: string;
  tone?: string;
}

export interface GeneratedIdea {
  title: string;
  hook: string;
  angle: string;
  format: string;
  why: string;
  approach?: string;
  summary?: string;
}

const ENDPOINT = "https://api.deepseek.com/chat/completions";

function apiKey(): string | undefined {
  return process.env["Deepseek_API_Key"] || process.env["DEEPSEEK_API_KEY"];
}

export function hasKey() {
  return Boolean(apiKey());
}

export async function deepseek(system: string, user: string): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("NO_KEY");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

/* ---------- template engine used when no DeepSeek key is configured ---------- */

const ANGLES = [
  {
    tag: "Story-driven",
    lead: "The moment",
    tail: "changed how I work",
    concept: "A first-person narrative that carries the lesson inside a real moment.",
  },
  {
    tag: "Contrarian",
    lead: "Why the standard advice about",
    tail: "is quietly wrong",
    concept: "Take the popular take apart and replace it with a sharper rule.",
  },
  {
    tag: "Experiment",
    lead: "I tested",
    tail: "for 30 days — here's the data",
    concept: "A measurable challenge with a visible before/after result.",
  },
  {
    tag: "Tutorial",
    lead: "The exact steps behind",
    tail: "start to finish",
    concept: "A repeatable walkthrough the viewer can copy immediately.",
  },
  {
    tag: "Curiosity",
    lead: "Nobody explains this part of",
    tail: "— so here it is",
    concept: "Open an information gap early and pay it off with one concrete reveal.",
  },
];

export function templateIdeas(seed: IdeaSeed, count = 4): GeneratedIdea[] {
  const subject = seed.topic || seed.niche || "your niche";
  return ANGLES.slice(0, count).map((a) => ({
    title: `${a.lead} ${subject} ${a.tail}`.replace(/\s+/g, " "),
    approach: a.tag,
    summary: `${a.concept} Built around ${subject} for ${seed.audience || "your audience"}.`,
    hook: `If you're a ${seed.audience || "creator"} working on ${subject}, stop — you're solving the wrong half of the problem.`,
    angle: `${a.tag} take on ${subject}, framed for ${seed.audience || "your audience"}.`,
    format: String(seed.format || "Short"),
    why: `${a.tag} framing gives ${seed.platform} viewers an immediate reason to stay, and it maps directly to your goal: ${seed.goal || "growth"}.`,
  }));
}

export function templateScript(title: string, hook: string, format: string) {
  return [
    { label: "Hook", body: hook || `Here's the part of "${title}" nobody explains.` },
    {
      label: "Introduction",
      body: `Quick context: what this ${format.toLowerCase()} covers, who it's for, and the exact outcome by the end.`,
    },
    {
      label: "Main point 1",
      body: `The core claim behind "${title}" — state it plainly, then back it with one concrete number or moment.`,
    },
    {
      label: "Main point 2",
      body: "The mechanism: why it works, broken into steps the viewer can repeat today.",
    },
    {
      label: "Example",
      body: "One specific story or on-screen walkthrough that proves the point.",
    },
    {
      label: "CTA",
      body: "Tell them the single next action, then point to the one piece of content that continues it.",
    },
  ];
}

export function templatePack(title: string, hook: string, platform: string, niche: string) {
  const slug = niche.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return {
    titles: [
      title,
      `${title} (what nobody tells you)`,
      `I tried ${title.toLowerCase()} — here's the result`,
    ],
    caption: `${hook}\n\nFull breakdown in this ${platform} post. Save it for later.`,
    description: `${title}\n\n${hook}\n\nIn this video:\n- The core idea\n- The step-by-step system\n- The mistake to avoid\n\nFollow for more.`,
    hashtags: [
      slug || "creator",
      "creatortools",
      "contentstrategy",
      "behindthescenes",
      platform.toLowerCase().replace(/\s+/g, ""),
    ],
    hooks: [
      hook,
      `Nobody warns you about this part of ${title.toLowerCase()}.`,
      `Three minutes on ${title.toLowerCase()} — no fluff.`,
    ],
  };
}

/* ---------- public API used by the server functions ---------- */

export async function generateIdeas(
  seed: IdeaSeed,
): Promise<{ ideas: GeneratedIdea[]; mode: string }> {
  if (!hasKey()) return { ideas: templateIdeas(seed), mode: "TEMPLATE" };
  try {
    const notes = (seed.thoughts ?? "").trim();
    const raw = await deepseek(
      "You are a senior content strategist for short and long form creators. When the creator supplies their own raw notes, thoughts or opinions, treat them as the primary creative source: expand, organise and sharpen THEIR idea instead of inventing a different one. Reply with raw JSON only.",
      `Generate exactly 4 content ideas as a JSON array. Each object: {"title","approach","summary","hook","angle","format","why"}.

CRITICAL: the 4 ideas must be four genuinely DIFFERENT creative directions on the same topic — not four rewordings of one concept. Pick the 4 most relevant approaches for this topic from: Story-driven, Educational, Contrarian, Experiment/Challenge, Tutorial, Opinion, Curiosity-driven, Case study, Listicle, Behind-the-scenes. Do not always use the same four.

Field rules:
- "approach": one or two words naming the chosen direction (e.g. "Contrarian").
- "summary": one sentence (max 22 words) describing the concept of the piece.
- "hook": the literal opening line the creator would say.
- "angle": the framing/POV in one sentence.
- "why": why this angle could work for this audience and platform, in one sentence.
- "format": the content format.
Niche: ${seed.niche}
Topic: ${seed.topic}
Platform: ${seed.platform}
Audience: ${seed.audience}
Goal: ${seed.goal}
Preferred format: ${seed.format}
Tone: ${seed.tone || "match the creator's natural voice"}
${notes ? `Creator's own thoughts (PRIMARY SOURCE — build on these, keep their opinions, examples and phrasing where possible):\n"""\n${notes}\n"""` : "The creator gave no extra notes; ground every idea in the topic and niche."}`,
    );
    return { ideas: parseJson<GeneratedIdea[]>(raw), mode: "DEEPSEEK" };
  } catch (e) {
    console.error("deepseek ideas failed", e);
    return { ideas: templateIdeas(seed), mode: "TEMPLATE" };
  }
}

export async function generateScript(input: {
  title: string;
  hook: string;
  angle: string;
  format: string;
  platform: string;
  audience: string;
  niche?: string;
  goal?: string;
  thoughts?: string;
  tone?: string;
}): Promise<{ sections: { label: string; body: string }[]; mode: string }> {
  if (!hasKey())
    return { sections: templateScript(input.title, input.hook, input.format), mode: "TEMPLATE" };
  try {
    const notes = (input.thoughts ?? "").trim();
    const raw = await deepseek(
      "You write tight, spoken-word creator scripts. When the creator supplies their own thoughts, notes or examples, they are the primary creative source: develop, structure and elevate THEIR material — never replace it with a generic concept. Reply with raw JSON only.",
      `Write a script as a JSON array of {"label","body"} using labels: Hook, Introduction, Main point 1, Main point 2, Example, CTA.
Title: ${input.title}
Hook: ${input.hook}
Angle: ${input.angle}
Format: ${input.format} for ${input.platform}
Audience: ${input.audience}
Niche: ${input.niche ?? ""}
Goal: ${input.goal ?? ""}
Tone: ${input.tone || "match the creator's natural voice"}
${notes ? `Creator's own thoughts (PRIMARY SOURCE — expand and organise these, keep their points, examples and opinions):\n"""\n${notes}\n"""` : ""}`,
    );
    return { sections: parseJson<{ label: string; body: string }[]>(raw), mode: "DEEPSEEK" };
  } catch (e) {
    console.error("deepseek script failed", e);
    return { sections: templateScript(input.title, input.hook, input.format), mode: "TEMPLATE" };
  }
}

const OPS: Record<string, string> = {
  improve: "Improve this section. Keep the meaning, sharpen the language.",
  rewrite: "Rewrite this section from a fresh angle, same intent.",
  shorter: "Cut this section to roughly half the length without losing the point.",
  engaging: "Make this section far more engaging and spoken-word punchy.",
  regenerate: "Write a completely new version of this section.",
};

export async function reviseSection(input: {
  op: string;
  label: string;
  body: string;
  title: string;
}): Promise<{ body: string; mode: string }> {
  if (!hasKey()) {
    const b = input.body.trim();
    const local: Record<string, string> = {
      shorter: b
        .split(/(?<=[.!?])\s+/)
        .slice(0, 1)
        .join(" "),
      engaging: `${b.replace(/\.$/, "")} — and that's the part everyone skips.`,
      improve: b.replace(/\s+/g, " "),
      rewrite: `Another way to say it: ${b}`,
      regenerate: `New take on ${input.label} for "${input.title}": ${b}`,
    };
    return { body: local[input.op] ?? b, mode: "TEMPLATE" };
  }
  try {
    const raw = await deepseek(
      "You are an editor for creator scripts. Reply with the revised section text only, no preamble.",
      `${OPS[input.op] ?? OPS["improve"]}\nVideo title: ${input.title}\nSection: ${input.label}\n\n${input.body}`,
    );
    return { body: raw.trim(), mode: "DEEPSEEK" };
  } catch (e) {
    console.error("deepseek section failed", e);
    return { body: input.body, mode: "TEMPLATE" };
  }
}

export async function generatePack(input: {
  title: string;
  hook: string;
  platform: string;
  niche: string;
  script: string;
}) {
  if (!hasKey())
    return {
      pack: templatePack(input.title, input.hook, input.platform, input.niche),
      mode: "TEMPLATE",
    };
  try {
    const raw = await deepseek(
      "You package content for social platforms. Reply with raw JSON only.",
      `Return JSON {"titles":[3 strings],"caption","description","hashtags":[5 strings without #],"hooks":[3 strings]}.
Platform: ${input.platform}
Niche: ${input.niche}
Working title: ${input.title}
Script:\n${input.script.slice(0, 4000)}`,
    );
    return {
      pack: parseJson<ReturnType<typeof templatePack>>(raw),
      mode: "DEEPSEEK",
    };
  } catch (e) {
    console.error("deepseek pack failed", e);
    return {
      pack: templatePack(input.title, input.hook, input.platform, input.niche),
      mode: "TEMPLATE",
    };
  }
}
