import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Field, Input, Panel, SectionTitle, Select, Tag } from "@/components/brutal";
import { scriptFn } from "@/lib/ai.functions";
import { opportunitiesFn } from "@/lib/insights.functions";
import { scrapeFn, searchFn } from "@/lib/research.functions";
import { listSocialFn, syncSocialFn, type StoredAccount, type StoredPost } from "@/lib/social.functions";
import { useStore, uid } from "@/lib/store";
import { FORMATS, type ContentFormat, type Platform } from "@/lib/types";

export const Route = createFileRoute("/intel")({
  head: () => ({
    meta: [
      { title: "Creator Intel — Studio Zero" },
      {
        name: "description",
        content:
          "Import your real social profile data, research the public web, and let AI turn both into evidence-backed content opportunities.",
      },
      { property: "og:title", content: "Creator Intel — Studio Zero" },
      {
        property: "og:description",
        content: "Your own performance data plus live public research, turned into what to make next.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Intel,
});

type Row = Record<string, unknown>;


interface Opportunity {
  key: string;
  topic: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  creatorEvidence: string;
  researchEvidence: string;
  newAngle: string;
  confidence: string;
}

interface Source {
  url: string;
  title: string;
  snippet: string;
}

const n = (v: unknown) => (typeof v === "number" ? v : null);
const fmt = (v: unknown) => {
  const x = n(v);
  if (x === null) return "—";
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
  return String(x);
};
const when = (v: unknown) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v))
    ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";

function friendly(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/not configured/i.test(msg)) return `${msg} Add the key in project settings, then retry.`;
  if (/\[404\]|not found/i.test(msg)) return "That profile could not be found. Check the username and try again.";
  if (/\[401\]|\[403\]|Unauthorized/i.test(msg))
    return "The integration rejected our credentials. The API key may be invalid or out of quota.";
  if (/\[429\]|rate limit/i.test(msg)) return "The provider is rate-limiting us right now. Wait a moment and retry.";
  if (/Failed to fetch|network/i.test(msg)) return "Network error reaching the provider. Check your connection and retry.";
  return msg;
}

function Intel() {
  const { state, addItem, updateItem, ready, userId } = useStore();
  const navigate = useNavigate();
  const profile = state.profile;

  // --- SocialFetch state ---
  const [platform, setPlatform] = useState<"youtube" | "instagram" | "tiktok">("youtube");
  const [handle, setHandle] = useState("");
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [posts, setPosts] = useState<Row[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  // --- Firecrawl state ---
  const [mode, setMode] = useState<"TOPIC" | "URL">("TOPIC");
  const [query, setQuery] = useState(profile?.niche ?? "");
  const [url, setUrl] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  // --- AI state ---
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [scripting, setScripting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = (await listSocialFn()) as { accounts: StoredAccount[]; posts: StoredPost[] };
      setAccounts(res.accounts as unknown as Row[]);
      setPosts(res.posts as unknown as Row[]);
      const first = res.accounts[0];
      if (first) setActiveAccount(String(first["id"]));
    } catch (e) {
      console.error("load social", e);
    }
  }, []);

  useEffect(() => {
    if (ready && userId) void load();
  }, [ready, userId, load]);

  const account = accounts.find((a) => String(a["id"]) === activeAccount) ?? null;
  const accountPosts = posts.filter((p) => String(p["account_id"]) === activeAccount);

  async function sync(overrideHandle?: string, overridePlatform?: typeof platform) {
    const h = (overrideHandle ?? handle).trim();
    const p = overridePlatform ?? platform;
    if (!h) return;
    setSyncing(true);
    setSocialError(null);
    try {
      const res = await syncSocialFn({ data: { platform: p, handle: h } });
      await load();
      setActiveAccount(res.accountId);
      setHandle("");
    } catch (e) {
      setSocialError(friendly(e));
    } finally {
      setSyncing(false);
    }
  }

  async function research() {
    setResearching(true);
    setResearchError(null);
    try {
      if (mode === "URL") {
        const s = await scrapeFn({ data: { url: url.trim() } });
        setSources([{ url: s.url, title: s.title, snippet: s.snippet }]);
      } else {
        const res = await searchFn({ data: { query: query.trim(), limit: 5 } });
        if (res.sources.length === 0) {
          setResearchError("Firecrawl returned no results for that topic. Try a different phrasing.");
        }
        setSources(res.sources.map((s) => ({ url: s.url, title: s.title, snippet: s.snippet })));
      }
    } catch (e) {
      setSources([]);
      setResearchError(friendly(e));
    } finally {
      setResearching(false);
    }
  }

  async function analyse() {
    setAnalysing(true);
    setAiError(null);
    setOpps([]);
    try {
      const res = await opportunitiesFn({
        data: {
          handle: account ? String(account["handle"]) : (profile?.name ?? ""),
          platform: account ? String(account["platform"]) : (profile?.platforms[0] ?? ""),
          niche: profile?.niche ?? "",
          audience: profile?.audience ?? "",
          goal: profile?.goal ?? "",
          posts: accountPosts.slice(0, 12).map((p) => ({
            title: String(p["title"] ?? ""),
            ...(n(p["views"]) !== null ? { views: n(p["views"]) as number } : {}),
            ...(n(p["likes"]) !== null ? { likes: n(p["likes"]) as number } : {}),
            ...(n(p["comments"]) !== null ? { comments: n(p["comments"]) as number } : {}),
            ...(typeof p["published_at"] === "string" ? { publishedAt: p["published_at"] } : {}),
          })),
          research: sources.slice(0, 5),
        },
      });
      setOpps(res.opportunities.map((o) => ({ ...o, key: uid() })));
    } catch (e) {
      setAiError(friendly(e));
    } finally {
      setAnalysing(false);
    }
  }

  function save(o: Opportunity) {
    addItem({
      title: o.title,
      hook: o.hook,
      angle: o.angle,
      why: `${o.creatorEvidence} // ${o.researchEvidence} // New angle: ${o.newAngle}`,
      platform: (profile?.platforms[0] ?? "YouTube") as Platform,
      format: (FORMATS.includes(o.format as ContentFormat) ? o.format : "Short") as ContentFormat,
      status: "Idea",
    });
    setOpps((prev) => prev.filter((x) => x.key !== o.key));
  }

  async function toScript(o: Opportunity) {
    const format = (FORMATS.includes(o.format as ContentFormat) ? o.format : "Short") as ContentFormat;
    const plat = (profile?.platforms[0] ?? "YouTube") as Platform;
    const item = addItem({
      title: o.title,
      hook: o.hook,
      angle: o.angle,
      why: `${o.creatorEvidence} // ${o.researchEvidence}`,
      platform: plat,
      format,
      status: "Draft",
    });
    setScripting(o.key);
    try {
      const res = await scriptFn({
        data: {
          title: o.title,
          hook: o.hook,
          angle: o.angle,
          format,
          platform: plat,
          audience: profile?.audience ?? "",
        },
      });
      updateItem(item.id, { script: res.sections.map((sec) => ({ ...sec, id: uid() })) });
    } catch (e) {
      console.error("script generation failed", e);
    } finally {
      setScripting(null);
      navigate({ to: "/script/$id", params: { id: item.id } });
    }
  }

  return (
    <AppShell stage="PLAN">
      <SectionTitle
        right={
          <span className="hidden text-[10px] font-bold uppercase tracking-widest md:block">
            SocialFetch // Firecrawl // DeepSeek
          </span>
        }
      >
        Creator_Intel
      </SectionTitle>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ---------------- SocialFetch ---------------- */}
        <Panel thick className="animate-slide-up space-y-4 p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase">01 / Your data</h2>
            <Tag>SocialFetch</Tag>
          </div>

          <Field label="Platform">
            <Select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as typeof platform)}
            >
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </Select>
          </Field>
          <Field label="Username / profile URL">
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@mkbhd"
              onKeyDown={(e) => {
                if (e.key === "Enter") void sync();
              }}
            />
          </Field>

          <Btn
            variant="primary"
            className="w-full py-3"
            onClick={() => void sync()}
            disabled={syncing || !handle.trim()}
          >
            {syncing ? "Fetching profile…" : "Connect & fetch profile"}
          </Btn>

          {socialError && (
            <div className="space-y-2 border-2 border-destructive bg-destructive/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest">Connection failed</p>
              <p className="text-[11px] leading-relaxed">{socialError}</p>
              <Btn className="w-full py-2 text-[10px]" onClick={() => void sync()} disabled={syncing}>
                Retry
              </Btn>
            </div>
          )}

          {accounts.length > 0 && (
            <div className="space-y-2 border-t-2 border-foreground pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest">Imported accounts</p>
              {accounts.map((a) => (
                <button
                  key={String(a["id"])}
                  type="button"
                  onClick={() => setActiveAccount(String(a["id"]))}
                  className={
                    "flex w-full items-center justify-between gap-2 border-2 border-foreground px-3 py-2 text-left transition-colors " +
                    (String(a["id"]) === activeAccount ? "bg-primary" : "hover:bg-muted")
                  }
                >
                  <span className="truncate text-xs font-bold uppercase">@{String(a["handle"])}</span>
                  <span className="text-[9px] uppercase tracking-widest">{String(a["platform"])}</span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6 lg:col-span-8">
          {syncing && <div className="h-40 animate-pulse border-2 border-foreground bg-muted" />}

          {!syncing && !account && (
            <Panel className="grid min-h-40 place-items-center p-10 text-center">
              <div className="space-y-2">
                <p className="font-display text-3xl uppercase">No profile connected</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Import a real account to unlock evidence-backed recommendations
                </p>
              </div>
            </Panel>
          )}

          {account && !syncing && (
            <Panel thick className="animate-slide-up space-y-5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {typeof account["avatar_url"] === "string" && (
                    <img
                      src={String(account["avatar_url"])}
                      alt={`${String(account["display_name"])} profile picture`}
                      loading="lazy"
                      className="h-14 w-14 border-2 border-foreground object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-display text-2xl uppercase leading-none">
                      {String(account["display_name"] || account["handle"])}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      @{String(account["handle"])} · {String(account["platform"])}
                      {account["verified"] === true ? " · verified" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Last sync</p>
                  <p className="text-[11px] font-bold">{when(account["last_synced_at"])}</p>
                  <Btn
                    className="mt-2 px-3 py-1 text-[10px]"
                    disabled={syncing}
                    onClick={() =>
                      void sync(
                        String(account["handle"]),
                        String(account["platform"]) as typeof platform,
                      )
                    }
                  >
                    {syncing ? "Syncing…" : "Refresh"}
                  </Btn>
                </div>
              </div>

              {typeof account["bio"] === "string" && account["bio"] && (
                <p className="whitespace-pre-line border-l-4 border-foreground pl-3 text-xs leading-relaxed">
                  {String(account["bio"]).slice(0, 320)}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Followers", account["followers"]],
                  ["Posts", account["posts_count"]],
                  ["Views", account["total_views"]],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border-2 border-foreground p-3">
                    <p className="font-display text-2xl leading-none">{fmt(value)}</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      {String(label)}
                    </p>
                  </div>
                ))}
              </div>

              {accountPosts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Top posts ({accountPosts.length})
                  </p>
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {accountPosts.map((p) => (
                      <div
                        key={String(p["id"])}
                        className="flex gap-3 border-2 border-foreground p-2"
                      >
                        {typeof p["thumbnail_url"] === "string" && (
                          <img
                            src={String(p["thumbnail_url"])}
                            alt=""
                            loading="lazy"
                            className="h-12 w-20 shrink-0 border-2 border-foreground object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">{String(p["title"])}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {fmt(p["views"])} views · {fmt(p["likes"])} likes · {fmt(p["comments"])} comments
                            {n(p["shares"]) !== null ? ` · ${fmt(p["shares"])} shares` : ""}
                            {typeof p["published_at"] === "string"
                              ? ` · ${new Date(String(p["published_at"])).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  SocialFetch returned no posts for this profile.
                </p>
              )}
            </Panel>
          )}
        </div>

        {/* ---------------- Firecrawl ---------------- */}
        <Panel thick className="animate-slide-up space-y-4 p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase">02 / Research</h2>
            <Tag>Firecrawl</Tag>
          </div>

          <div className="flex overflow-hidden border-2 border-foreground">
            {(["TOPIC", "URL"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMode(t)}
                className={
                  "flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors " +
                  (mode === t ? "bg-foreground text-background" : "hover:bg-primary")
                }
              >
                {t === "TOPIC" ? "Topic" : "Public URL"}
              </button>
            ))}
          </div>

          {mode === "TOPIC" ? (
            <Field label="Research topic">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="AI coding content trends"
              />
            </Field>
          ) : (
            <Field label="Public page URL">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
              />
            </Field>
          )}

          <Btn
            variant="primary"
            className="w-full py-3"
            onClick={() => void research()}
            disabled={researching || (mode === "TOPIC" ? !query.trim() : !url.trim())}
          >
            {researching ? "Researching…" : "Run research"}
          </Btn>

          {researchError && (
            <div className="space-y-2 border-2 border-destructive bg-destructive/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest">Research failed</p>
              <p className="text-[11px] leading-relaxed">{researchError}</p>
              <Btn
                className="w-full py-2 text-[10px]"
                onClick={() => void research()}
                disabled={researching}
              >
                Retry
              </Btn>
            </div>
          )}

          {sources.length > 0 && (
            <div className="space-y-2 border-t-2 border-foreground pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest">
                {sources.length} source(s) retrieved
              </p>
              {sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block border-2 border-foreground p-3 transition-colors hover:bg-muted"
                >
                  <p className="text-xs font-bold uppercase leading-tight">{s.title}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed">{s.snippet}</p>
                  <p className="mt-1 truncate text-[9px] uppercase tracking-widest text-muted-foreground">
                    {s.url}
                  </p>
                </a>
              ))}
            </div>
          )}
        </Panel>

        {/* ---------------- AI ---------------- */}
        <div className="space-y-6 lg:col-span-8">
          <Panel thick className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl uppercase">03 / What to create next</h2>
              <Tag>
                {accountPosts.length} own posts · {sources.length} sources
              </Tag>
            </div>
            <p className="text-[11px] uppercase leading-relaxed tracking-widest text-muted-foreground">
              Combines your real performance data with the retrieved public research. Every
              recommendation cites both.
            </p>
            <Btn
              variant="primary"
              className="w-full py-3"
              onClick={() => void analyse()}
              disabled={analysing || (accountPosts.length === 0 && sources.length === 0)}
            >
              {analysing ? "Analysing…" : "Find content opportunities"}
            </Btn>
            {aiError && (
              <div className="space-y-2 border-2 border-destructive bg-destructive/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest">Analysis failed</p>
                <p className="text-[11px] leading-relaxed">{aiError}</p>
                <Btn className="px-3 py-2 text-[10px]" onClick={() => void analyse()} disabled={analysing}>
                  Retry
                </Btn>
              </div>
            )}
          </Panel>

          {analysing && (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse border-2 border-foreground bg-muted"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          )}

          {opps.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {opps.map((o, i) => (
                <div
                  key={o.key}
                  className="animate-slide-up hard-shadow-hover space-y-4 border-2 border-foreground p-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <Tag>{o.topic}</Tag>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {o.confidence} confidence
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase leading-tight">{o.title}</h3>
                  <div className="space-y-2 text-xs leading-relaxed">
                    <p>
                      <span className="font-bold uppercase">Hook:</span> {o.hook}
                    </p>
                    <p>
                      <span className="font-bold uppercase">Angle:</span> {o.angle}
                    </p>
                  </div>
                  <div className="space-y-2 border-t-2 border-foreground pt-3 text-[11px] leading-relaxed">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Why this?</p>
                    <p>
                      <span className="font-bold">Your data:</span> {o.creatorEvidence}
                    </p>
                    <p>
                      <span className="font-bold">Research:</span> {o.researchEvidence}
                    </p>
                    <p>
                      <span className="font-bold">New angle:</span> {o.newAngle}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Btn className="flex-1 py-2 text-[10px]" onClick={() => save(o)}>
                      Save idea
                    </Btn>
                    <Btn
                      variant="primary"
                      className="flex-1 py-2 text-[10px]"
                      onClick={() => void toScript(o)}
                      disabled={scripting !== null}
                    >
                      {scripting === o.key ? "Writing…" : "Create script"}
                    </Btn>
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
