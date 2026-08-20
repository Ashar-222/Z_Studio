import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Field, Input, Panel, SectionTitle, Select, Tag } from "@/components/brutal";
import { scriptFn } from "@/lib/ai.functions";
import { researchIdeasFn, scrapeFn, searchFn } from "@/lib/research.functions";
import { CreditsBadge, WaitlistCard, isWaitlistError, useCredits } from "@/components/Waitlist";
import { useStore, uid } from "@/lib/store";
import { FORMATS, GOALS, PLATFORMS, type ContentFormat, type Platform } from "@/lib/types";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Desk — Z Studio" },
      {
        name: "description",
        content:
          "Scrape any URL or search the live web for your niche, then turn the findings into grounded, cited content ideas.",
      },
      { property: "og:title", content: "Research Desk — Z Studio" },
      {
        property: "og:description",
        content: "Firecrawl-powered web research wired straight into your idea forge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Research,
});

interface Source {
  url: string;
  title: string;
  snippet: string;
  markdown?: string | undefined;
}

interface Idea {
  key: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  why: string;
}

function Research() {
  const { state, addItem, updateItem } = useStore();
  const navigate = useNavigate();
  const profile = state.profile;

  const [tab, setTab] = useState<"URL" | "SEARCH">("URL");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState(profile?.niche ?? "");
  const [platform, setPlatform] = useState<Platform>(profile?.platforms[0] ?? "YouTube");
  const [format, setFormat] = useState<ContentFormat>(profile?.contentType ?? "Short");
  const [goal, setGoal] = useState<string>(profile?.goal ?? GOALS[0]);

  const [sources, setSources] = useState<Source[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [mode, setMode] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const { credits, refresh } = useCredits();

  function toggle(u: string) {
    setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u]));
  }

  async function run() {
    setBusy("research");
    setError(null);
    setIdeas([]);
    try {
      if (tab === "URL") {
        const s = await scrapeFn({ data: { url: url.trim() } });
        setSources([s]);
        setPicked([s.url]);
      } else {
        const res = await searchFn({ data: { query: query.trim(), limit: 6 } });
        setSources(res.sources);
        setPicked(res.sources.slice(0, 3).map((s) => s.url));
      }
      void refresh();
    } catch (e) {
      if (isWaitlistError(e)) {
        setLocked(true);
      } else {
        setError(e instanceof Error ? e.message : "Research failed");
      }
    } finally {
      setBusy(null);
    }
  }

  async function forge() {
    const chosen = sources.filter((s) => picked.includes(s.url)).slice(0, 5);
    if (chosen.length === 0) return;
    setBusy("ideas");
    setError(null);
    try {
      const res = await researchIdeasFn({
        data: {
          sources: chosen.map((s) => ({
            url: s.url,
            title: s.title,
            snippet: s.snippet,
            ...(s.markdown ? { markdown: s.markdown.slice(0, 6000) } : {}),
          })),
          niche: profile?.niche ?? "",
          audience: profile?.audience ?? "",
          platform,
          format,
          goal,
        },
      });
      setMode(res.mode);
      setIdeas(res.ideas.map((i) => ({ ...i, key: uid() })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Idea generation failed");
    } finally {
      setBusy(null);
    }
  }

  function save(idea: Idea) {
    addItem({
      title: idea.title,
      hook: idea.hook,
      angle: idea.angle,
      why: idea.why,
      platform,
      format,
      status: "Idea",
    });
    setIdeas((prev) => prev.filter((i) => i.key !== idea.key));
  }

  async function createScript(idea: Idea) {
    const item = addItem({
      title: idea.title,
      hook: idea.hook,
      angle: idea.angle,
      why: idea.why,
      platform,
      format,
      status: "Draft",
    });
    setBusy("script");
    try {
      const res = await scriptFn({
        data: {
          title: idea.title,
          hook: idea.hook,
          angle: idea.angle,
          format,
          platform,
          audience: profile?.audience ?? "",
        },
      });
      updateItem(item.id, { script: res.sections.map((s) => ({ ...s, id: uid() })) });
    } finally {
      setBusy(null);
      navigate({ to: "/script/$id", params: { id: item.id } });
    }
  }

  return (
    <AppShell stage="CREATE">
      <SectionTitle
        right={
          <span className="hidden text-[10px] font-bold uppercase tracking-widest md:block">
            Crawler: Firecrawl {mode ? `// Engine: ${mode}` : ""}
          </span>
        }
      >
        Research_Desk
      </SectionTitle>

      <div className="grid gap-8 lg:grid-cols-12">
        <Panel thick className="animate-slide-up space-y-4 p-6 lg:col-span-4">
          {credits && (
            <CreditsBadge
              remaining={credits.researchRemaining}
              total={credits.researchCredits}
            />
          )}
          <p className="text-[10px] uppercase leading-relaxed text-muted-foreground">
            Scripts and idea development are free. Each web crawl or search spends one research
            credit.
          </p>

          <div className="flex overflow-hidden border-2 border-foreground">
            {(["URL", "SEARCH"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors " +
                  (tab === t ? "bg-foreground text-background" : "hover:bg-primary")
                }
              >
                {t === "URL" ? "Scrape URL" : "Web search"}
              </button>
            ))}
          </div>

          {tab === "URL" ? (
            <Field label="Article / competitor URL">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/post"
              />
            </Field>
          ) : (
            <Field label="Niche / trend query">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="short-form editing workflow trends"
              />
            </Field>
          )}

          <Field label="Platform">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Format">
            <Select value={format} onChange={(e) => setFormat(e.target.value as ContentFormat)}>
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
          <Field label="Goal">
            <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>

          <Btn
            variant="primary"
            className="w-full py-3"
            onClick={() => void run()}
            disabled={busy !== null || (tab === "URL" ? !url.trim() : !query.trim())}
          >
            {busy === "research" ? "Crawling…" : tab === "URL" ? "Scrape page" : "Search web"}
          </Btn>

          {sources.length > 0 && (
            <Btn
              className="w-full py-3"
              onClick={() => void forge()}
              disabled={busy !== null || picked.length === 0}
            >
              {busy === "ideas" ? "Forging…" : `Forge ideas from ${picked.length} source(s)`}
            </Btn>
          )}

          {(locked || credits?.researchRemaining === 0) && (
            <WaitlistCard
              feature="web-research"
              title="Out of research credits"
              reason="You have used your 2 free Firecrawl research runs. Join the waitlist to get more credits when paid research opens up."
              joined={credits?.waitlist.includes("web-research") ?? false}
              onJoined={() => void refresh()}
            />
          )}

          {error && (
            <p className="border-2 border-destructive bg-destructive/10 p-3 text-[10px] uppercase leading-relaxed">
              {error}
            </p>
          )}
        </Panel>

        <div className="space-y-8 lg:col-span-8">
          {busy === "research" && (
            <div className="grid gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse border-2 border-foreground bg-muted"
                  style={{ animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          )}

          {sources.length === 0 && busy !== "research" && (
            <Panel className="grid min-h-64 place-items-center p-10 text-center">
              <div className="space-y-3">
                <p className="font-display text-4xl uppercase">Nothing crawled yet</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Paste a URL or search your niche
                </p>
              </div>
            </Panel>
          )}

          {sources.length > 0 && (
            <div className="space-y-3">
              {sources.map((s, i) => (
                <button
                  key={s.url + i}
                  type="button"
                  onClick={() => toggle(s.url)}
                  className={
                    "animate-slide-up block w-full border-2 border-foreground p-4 text-left transition-colors " +
                    (picked.includes(s.url) ? "bg-primary" : "hover:bg-muted")
                  }
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold uppercase leading-tight">{s.title}</h3>
                    <Tag>{picked.includes(s.url) ? "USED" : "SKIP"}</Tag>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed">{s.snippet}</p>
                  <p className="mt-2 truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.url}
                  </p>
                </button>
              ))}
            </div>
          )}

          {ideas.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {ideas.map((idea, i) => (
                <div
                  key={idea.key}
                  className="animate-slide-up hard-shadow-hover space-y-4 border-2 border-foreground p-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <Tag>{idea.format || format}</Tag>
                    <span className="text-[10px] font-bold tracking-widest">
                      {String(i + 1).padStart(2, "0")}/{String(ideas.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase leading-tight">{idea.title}</h3>
                  <div className="space-y-2 text-xs leading-relaxed">
                    <p>
                      <span className="font-bold uppercase">Hook:</span> {idea.hook}
                    </p>
                    <p>
                      <span className="font-bold uppercase">Angle:</span> {idea.angle}
                    </p>
                    <p className="border-l-4 border-secondary pl-3 text-muted-foreground">
                      {idea.why}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn
                      variant="primary"
                      className="flex-1"
                      onClick={() => void createScript(idea)}
                    >
                      Create script
                    </Btn>
                    <Btn onClick={() => save(idea)}>Save</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
