import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Btn, Field, Input, Panel, Select } from "@/components/brutal";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { importSocialFn } from "@/lib/social.functions";
import type { SocialProfile, SocialPlatform } from "@/lib/social.server";
import {
  FORMATS,
  GOALS,
  PLATFORMS,
  type ContentFormat,
  type Goal,
  type Platform,
} from "@/lib/types";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Set up your studio — Z Studio" },
      {
        name: "description",
        content:
          "Tell Z Studio your niche, platforms and goal to get a personalized creator command center.",
      },
      { property: "og:title", content: "Set up your studio — Z Studio" },
      {
        property: "og:description",
        content: "Onboard in 60 seconds and get a content pipeline built around your niche.",
      },
    ],
  }),
  component: Welcome,
});

const FREQUENCIES = ["Daily", "3x per week", "Weekly", "Bi-weekly"];

type Connection = {
  id: string;
  label: string;
  api: SocialPlatform;
  kind?: "videos" | "shorts";
  platform: Platform;
  hint: string;
  prefix: string;
  placeholder: string;
};

const SOCIALS: Connection[] = [
  {
    id: "youtube-videos",
    label: "YouTube Videos",
    api: "youtube",
    kind: "videos",
    platform: "YouTube",
    hint: "Long-form uploads from your channel",
    prefix: "youtube.com/@",
    placeholder: "mkbhd",
  },
  {
    id: "youtube-shorts",
    label: "YouTube Shorts",
    api: "youtube",
    kind: "shorts",
    platform: "YouTube",
    hint: "Vertical shorts from your channel",
    prefix: "youtube.com/@",
    placeholder: "mkbhd",
  },
  {
    id: "instagram",
    label: "Instagram",
    api: "instagram",
    platform: "Instagram",
    hint: "Reels, carousels and posts",
    prefix: "instagram.com/",
    placeholder: "natgeo",
  },
  {
    id: "tiktok",
    label: "TikTok",
    api: "tiktok",
    platform: "TikTok",
    hint: "Your TikTok video history",
    prefix: "tiktok.com/@",
    placeholder: "khaby.lame",
  },
];

const compact = (n?: number) =>
  typeof n === "number" ? Intl.NumberFormat("en", { notation: "compact" }).format(n) : "—";

function Welcome() {
  const { setProfile } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [audience, setAudience] = useState("");
  const [contentType, setContentType] = useState<ContentFormat>("Short");
  const [frequency, setFrequency] = useState(FREQUENCIES[1]!);
  const [goal, setGoal] = useState<Goal>("Grow audience");
  const [social, setSocial] = useState<Connection | null>(null);
  const [handle, setHandle] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState<SocialProfile | null>(null);
  const runImport = useServerFn(importSocialFn);

  async function doImport() {
    if (!social || !handle.trim() || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const p = (await runImport({
        data: { platform: social.api, handle, ...(social.kind ? { kind: social.kind } : {}) },
      })) as SocialProfile;
      setImported(p);
      setName(p.displayName || p.handle);
      setNiche(p.suggested.niche);
      setAudience(p.suggested.audience);
      setContentType(p.suggested.contentType as ContentFormat);
      const match = social.platform;
      setPlatforms((prev) => (prev.includes(match) ? prev : [...prev, match]));
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const canNext = step === 0 ? name.trim() && niche.trim() : platforms.length > 0;

  const contextLine = [
    platforms[0] ? `${platforms[0]} ${contentType}` : social?.label,
    niche.trim(),
    audience.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  function finish() {
    setProfile({ name, niche, platforms, audience, contentType, frequency, goal });
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background font-mono text-foreground">
      <div className="overflow-hidden border-b-4 border-foreground bg-primary">
        <div className="marquee-track flex w-max gap-8 py-1 text-[10px] font-bold uppercase tracking-[0.3em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-8">
              <span>Plan</span><span>→</span><span>Create</span><span>→</span>
              <span>Package</span><span>→</span><span>Publish</span><span>→</span>
              <span>Analyze</span><span>→</span><span>Improve</span><span>→</span>
              <span>Monetize</span><span>→</span>
              <span>Plan</span><span>→</span><span>Create</span><span>→</span>
              <span>Package</span><span>→</span><span>Publish</span><span>→</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 p-6 lg:grid-cols-2 lg:items-center lg:py-16">
        <div className="space-y-6">
          <h1 className="font-display text-6xl uppercase leading-[1.05] md:text-8xl">
            <span className="ob-line block" style={{ animationDelay: "0.05s" }}>
              Your whole
            </span>
            <span className="ob-line block" style={{ animationDelay: "0.18s" }}>
              channel,
            </span>
            <span className="block">
              <span className="ob-snap box-decoration-clone inline-block bg-secondary px-2 text-secondary-foreground">
                one desk.
              </span>
            </span>
          </h1>
          <p
            className="ob-line max-w-[46ch] text-sm text-muted-foreground"
            style={{ animationDelay: "0.6s" }}
          >
            Z Studio connects idea → script → content pack → schedule. No tab juggling, no
            blank page. Answer seven questions and your pipeline is built.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
            {["Idea forge", "Script studio", "Package module", "Calendar"].map((t, i) => (
              <span
                key={t}
                className="ob-chip border-2 border-foreground px-2 py-1"
                style={{ animationDelay: `${0.72 + i * 0.09}s` }}
              >
                {t}
              </span>
            ))}
          </div>

          {contextLine && (
            <div
              key={contextLine}
              className="ob-ctx inline-flex items-center gap-2 border-2 border-foreground bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <span className="size-2 bg-primary" />
              Learning your profile:
              <span className="bg-foreground px-1.5 py-0.5 text-background">{contextLine}</span>
            </div>
          )}
        </div>

        <Panel thick className="animate-slide-up ob-field p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Setup // step {step + 1} of 3
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="size-3 overflow-hidden border-2 border-foreground bg-background">
                  {i <= step && <div className="ob-dot-on size-full bg-primary" />}
                </div>
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="ob-step space-y-4">
              <div className="border-2 border-foreground bg-muted p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {social ? "Connect this platform" : "Choose one platform to connect"}
                </span>
                {!social ? (
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {SOCIALS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSocial(s);
                          setHandle("");
                          setImported(null);
                          setImportError(null);
                        }}
                        className="ob-card border-2 border-foreground bg-background px-2 py-2 text-left hover:bg-primary/25"
                      >
                        <div className="text-[11px] font-bold uppercase">{s.label}</div>
                        <div className="text-[10px] text-muted-foreground">{s.hint}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="ob-highlight mt-2 flex items-center justify-between gap-2 border-2 border-foreground bg-foreground px-2 py-1 text-background">
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {social.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSocial(null);
                          setHandle("");
                          setImported(null);
                          setImportError(null);
                        }}
                        className="text-[10px] font-bold uppercase underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {social.label} username
                    </p>
                    <div className="mt-1 flex gap-2">
                      <div className="flex min-w-0 flex-1 items-center border-2 border-foreground bg-background">
                        <span className="shrink-0 border-r-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                          {social.prefix}
                        </span>
                        <input
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && void doImport()}
                          placeholder={social.placeholder}
                          aria-label={`${social.label} username`}
                          className="w-full min-w-0 bg-transparent px-2 py-1.5 font-mono text-sm outline-none"
                        />
                      </div>
                      <Btn
                        variant="primary"
                        onClick={() => void doImport()}
                        disabled={importing || !handle.trim()}
                      >
                        {importing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                      </Btn>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      One platform at a time — you can connect another later.
                    </p>
                  </>
                )}
                {importError && (
                  <p className="mt-2 text-[10px] font-bold uppercase text-destructive">{importError}</p>
                )}
                {imported && (
                  <div className="animate-slide-up mt-3 border-2 border-foreground bg-background p-3">
                    <div className="flex items-center gap-2">
                      {imported.avatarUrl && (
                        <img
                          src={imported.avatarUrl}
                          alt={`${imported.displayName} avatar`}
                          className="size-8 border-2 border-foreground object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase">{imported.displayName}</p>
                        <p className="truncate text-[10px] text-muted-foreground">@{imported.handle}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px] font-bold uppercase">
                      {[
                        ["Followers", imported.metrics.followers],
                        ["Posts", imported.metrics.posts],
                        ["Views", imported.metrics.views],
                      ].map(([label, v]) => (
                        <div key={String(label)} className="border-2 border-foreground py-1">
                          <div className="text-sm">{compact(v as number | undefined)}</div>
                          <div className="text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>
                    {imported.topPosts.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {imported.topPosts.slice(0, 3).map((p, i) => (
                          <li key={i} className="truncate text-[10px] text-muted-foreground">
                            ▸ {p.title}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-[10px] font-bold uppercase">Fields prefilled below</p>
                  </div>
                )}
              </div>
              <Field label="Creator name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
              </Field>
              <Field label="Niche">
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Tech productivity"
                />
              </Field>
              <Field label="Target audience">
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Freelancers in their 20s"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="ob-step space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Main platforms
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const on = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setPlatforms((prev) =>
                            on ? prev.filter((x) => x !== p) : [...prev, p],
                          )
                        }
                        className={cn(
                          "ob-card border-2 border-foreground px-3 py-1.5 text-xs font-bold uppercase",
                          on
                            ? "ob-highlight bg-secondary text-secondary-foreground"
                            : "bg-background hover:bg-primary/25",
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Main content type">
                <Select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentFormat)}
                >
                  {FORMATS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Posting frequency">
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {FREQUENCIES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="ob-step space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Main goal
              </span>
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={cn(
                    "ob-card flex w-full items-center justify-between border-2 border-foreground px-4 py-3 text-left text-sm font-bold uppercase",
                    goal === g ? "ob-highlight bg-primary" : "bg-background hover:bg-muted",
                  )}
                >
                  {g}
                  <span className={cn("size-4 border-2 border-foreground", goal === g && "bg-foreground")} />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <Btn onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </Btn>
            {step < 2 ? (
              <Btn
                variant="primary"
                className="ob-cta"
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </Btn>
            ) : (
              <Btn variant="dark" className="ob-cta" onClick={finish}>
                Build my studio →
              </Btn>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}