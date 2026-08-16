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
      { title: "Set up your studio — Studio Zero" },
      {
        name: "description",
        content:
          "Tell Studio Zero your niche, platforms and goal to get a personalized creator command center.",
      },
      { property: "og:title", content: "Set up your studio — Studio Zero" },
      {
        property: "og:description",
        content: "Onboard in 60 seconds and get a content pipeline built around your niche.",
      },
    ],
  }),
  component: Welcome,
});

const FREQUENCIES = ["Daily", "3x per week", "Weekly", "Bi-weekly"];

const SOCIALS: { id: SocialPlatform; label: string; platform: Platform }[] = [
  { id: "youtube", label: "YouTube", platform: "YouTube" },
  { id: "instagram", label: "Instagram", platform: "Instagram" },
  { id: "tiktok", label: "TikTok", platform: "TikTok" },
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
  const [social, setSocial] = useState<SocialPlatform>("youtube");
  const [handle, setHandle] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState<SocialProfile | null>(null);
  const runImport = useServerFn(importSocialFn);

  async function doImport() {
    if (!handle.trim() || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const p = (await runImport({ data: { platform: social, handle } })) as SocialProfile;
      setImported(p);
      setName(p.displayName || p.handle);
      setNiche(p.suggested.niche);
      setAudience(p.suggested.audience);
      setContentType(p.suggested.contentType as ContentFormat);
      const match = SOCIALS.find((s) => s.id === p.platform)!.platform;
      setPlatforms((prev) => (prev.includes(match) ? prev : [...prev, match]));
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const canNext = step === 0 ? name.trim() && niche.trim() : platforms.length > 0;

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
        <div className="animate-slide-up space-y-6">
          <h1 className="font-display text-6xl uppercase leading-[1.05] md:text-8xl">
            Your whole
            <br />
            channel,
            <br />
            <span className="box-decoration-clone bg-secondary px-2 text-secondary-foreground">
              one desk.
            </span>
          </h1>
          <p className="max-w-[46ch] text-sm text-muted-foreground">
            Studio Zero connects idea → script → content pack → schedule. No tab juggling, no
            blank page. Answer seven questions and your pipeline is built.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
            {["Idea forge", "Script studio", "Package module", "Calendar"].map((t) => (
              <span key={t} className="border-2 border-foreground px-2 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>

        <Panel thick className="animate-slide-up p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Setup // step {step + 1} of 3
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "size-3 border-2 border-foreground transition-colors",
                    i <= step ? "bg-primary" : "bg-background",
                  )}
                />
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="border-2 border-foreground bg-muted p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Import from your socials
                </span>
                <div className="mt-2 flex gap-1">
                  {SOCIALS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSocial(s.id)}
                      className={cn(
                        "press flex-1 border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase",
                        social === s.id ? "bg-foreground text-background" : "bg-background",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void doImport()}
                    placeholder="@yourhandle"
                  />
                  <Btn variant="primary" onClick={() => void doImport()} disabled={importing || !handle.trim()}>
                    {importing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </Btn>
                </div>
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
            <div className="animate-slide-up space-y-5">
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
                          "press border-2 border-foreground px-3 py-1.5 text-xs font-bold uppercase",
                          on ? "bg-secondary text-secondary-foreground" : "bg-background",
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
            <div className="animate-slide-up space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Main goal
              </span>
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={cn(
                    "press flex w-full items-center justify-between border-2 border-foreground px-4 py-3 text-left text-sm font-bold uppercase",
                    goal === g ? "bg-primary" : "bg-background hover:bg-muted",
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
              <Btn variant="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Btn>
            ) : (
              <Btn variant="dark" onClick={finish}>
                Build my studio →
              </Btn>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}