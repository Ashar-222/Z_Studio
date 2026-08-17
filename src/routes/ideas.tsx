import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Field, Input, Panel, SectionTitle, Select, Tag, Textarea } from "@/components/brutal";
import { ideasFn, scriptFn } from "@/lib/ai.functions";
import { useStore, uid } from "@/lib/store";
import { FORMATS, GOALS, PLATFORMS, type ContentFormat, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ideas")({
  head: () => ({
    meta: [
      { title: "Idea Forge — Z Studio" },
      {
        name: "description",
        content:
          "Generate content ideas with hooks, angles and formats, then turn any idea straight into a script.",
      },
      { property: "og:title", content: "Idea Forge — Z Studio" },
      {
        property: "og:description",
        content: "Niche-aware idea generation wired directly into your script studio.",
      },
    ],
  }),
  component: Ideas,
});

interface Idea {
  key: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  why: string;
  approach?: string;
  summary?: string;
}

function Ideas() {
  const { state, addItem, updateItem } = useStore();
  const navigate = useNavigate();
  const profile = state.profile;

  const [topic, setTopic] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [tone, setTone] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [platform, setPlatform] = useState<Platform>(profile?.platforms[0] ?? "YouTube");
  const [format, setFormat] = useState<ContentFormat>(profile?.contentType ?? "Short");
  const [goal, setGoal] = useState<string>(profile?.goal ?? GOALS[0]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [handoff, setHandoff] = useState(false);

  const contextLine = [`${platform} ${format}`, profile?.niche, profile?.audience]
    .filter(Boolean)
    .join(" · ");

  async function generate() {
    setLoading(true);
    try {
      const res = await ideasFn({
        data: {
          niche: profile?.niche ?? "",
          topic,
          platform,
          audience: profile?.audience ?? "",
          goal,
          format,
          thoughts,
          tone,
        },
      });
      setMode(res.mode);
      setIdeas(res.ideas.map((i) => ({ ...i, key: uid() })));
      setSelected(null);
    } finally {
      setLoading(false);
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
    setHandoff(true);
    const item = addItem({
      title: idea.title,
      hook: idea.hook,
      angle: idea.angle,
      why: idea.why,
      platform,
      format,
      status: "Draft",
    });
    setLoading(true);
    try {
      const res = await scriptFn({
        data: {
          title: idea.title,
          hook: idea.hook,
          angle: idea.angle,
          format,
          platform,
          audience: profile?.audience ?? "",
          niche: profile?.niche ?? "",
          goal,
          thoughts,
          tone,
        },
      });
      updateItem(item.id, {
        script: res.sections.map((s) => ({ ...s, id: uid() })),
      });
    } finally {
      setLoading(false);
      navigate({ to: "/script/$id", params: { id: item.id } });
    }
  }

  return (
    <AppShell stage="CREATE">
      <SectionTitle
        right={
          <span className="hidden text-[10px] font-bold uppercase tracking-widest md:block">
            {mode === "DEEPSEEK"
              ? "Engine: DeepSeek"
              : mode === "TEMPLATE"
                ? "Engine: local template (no API key)"
                : `Niche: ${profile?.niche ?? "—"}`}
          </span>
        }
      >
        Idea_Forge
      </SectionTitle>

      <div className="grid gap-8 lg:grid-cols-12">
        <Panel thick className="animate-slide-up space-y-4 p-6 lg:col-span-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-foreground pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest">{contextLine}</span>
            <Link
              to="/welcome"
              className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4"
            >
              Edit profile
            </Link>
          </div>

          <Field label="Topic / idea">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to make?"
            />
          </Field>

          <Field label="Your thoughts (optional)">
            <Textarea
              rows={7}
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="Your own points, opinions, examples, rough notes… the AI builds on these instead of inventing its own concept."
            />
          </Field>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4"
          >
            {showAdvanced ? "Hide options" : "Optional controls"}
          </button>

          {showAdvanced && (
            <div className="animate-slide-up space-y-4 border-2 border-dashed border-foreground p-4">
              <Field label="Tone / style">
                <Input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Blunt, funny, technical…"
                />
              </Field>
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
            </div>
          )}

          <Btn
            variant="primary"
            className="w-full py-3"
            onClick={generate}
            disabled={loading || (!topic.trim() && !thoughts.trim())}
          >
            {loading ? "Forging…" : thoughts.trim() ? "Develop my idea" : "Generate ideas"}
          </Btn>
        </Panel>

        <div className="lg:col-span-8">
          {loading && ideas.length === 0 && (
            <Panel thick className="relative overflow-hidden p-8">
              <div className="forge-grid pointer-events-none absolute inset-0 opacity-60" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-primary/30">
                <div className="forge-scan h-full w-full bg-primary/50" />
              </div>
              <div className="relative space-y-6">
                <div className="flex items-end gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                    <span
                      key={i}
                      className="forge-bar h-10 w-2 bg-foreground"
                      style={{ animationDelay: `${i * 70}ms` }}
                    />
                  ))}
                </div>
                <p className="font-display text-3xl uppercase leading-none md:text-4xl">
                  Forging 4 directions<span className="forge-kinetic">…</span>
                </p>
                <p className="max-w-md text-xs uppercase tracking-widest text-muted-foreground">
                  Reading your topic, your thoughts and your creator profile
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse border-2 border-dashed border-foreground bg-muted"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {!loading && ideas.length === 0 && (
            <Panel thick className="relative h-full min-h-[26rem] overflow-hidden p-8">
              <div className="forge-grid pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="space-y-4">
                  <span className="inline-block border-2 border-foreground bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Idea engine idle
                  </span>
                  <h3 className="font-display text-4xl uppercase leading-[0.95] md:text-6xl">
                    Your idea <span className="forge-arrow text-primary">→</span>{" "}
                    <span className="forge-kinetic">4 creative directions</span>
                  </h3>
                  <p className="max-w-lg text-xs leading-relaxed uppercase tracking-widest text-muted-foreground">
                    Z Studio takes your topic and your own thoughts, mixes in your creator profile (
                    {contextLine}), and returns four genuinely different concepts — each with a
                    hook, an angle and why it could work.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {["Story", "Contrarian", "Experiment", "Tutorial"].map((label, i) => (
                    <div
                      key={label}
                      className="forge-pop border-2 border-dashed border-foreground p-4"
                      style={{ animationDelay: `${300 + i * 120}ms` }}
                    >
                      <span className="block text-[10px] font-bold tracking-widest text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-bold uppercase">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {ideas.length > 0 && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {ideas.map((idea, i) => {
                  const isSel = selected === idea.key;
                  return (
                    <div
                      key={idea.key}
                      className={cn(
                        "forge-pop group relative flex flex-col gap-4 border-2 border-foreground p-6 transition-all duration-150",
                        isSel
                          ? "hard-shadow -translate-y-1 border-4 bg-primary/15"
                          : "hover:hard-shadow hover:-translate-y-1 hover:border-primary",
                      )}
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      {isSel && (
                        <span className="forge-flash absolute -right-2 -top-3 border-2 border-foreground bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                          Selected
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-3xl leading-none text-primary">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {idea.approach && (
                            <span className="border-2 border-foreground bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
                              {idea.approach}
                            </span>
                          )}
                          <Tag>{`${platform} ${idea.format || format}`}</Tag>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold uppercase leading-tight">{idea.title}</h3>

                      {idea.summary && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {idea.summary}
                        </p>
                      )}

                      <div className="space-y-2 border-t-2 border-dashed border-foreground pt-3 text-xs leading-relaxed">
                        <p>
                          <span className="font-bold uppercase">Hook:</span> {idea.hook}
                        </p>
                        <p>
                          <span className="font-bold uppercase">Angle:</span> {idea.angle}
                        </p>
                        <p className="border-l-4 border-secondary pl-3 text-muted-foreground">
                          <span className="font-bold uppercase text-foreground">Why it works:</span>{" "}
                          {idea.why}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2 pt-2">
                        <Btn
                          variant={isSel ? "dark" : "primary"}
                          className="flex-1"
                          onClick={() => setSelected(isSel ? null : idea.key)}
                        >
                          {isSel ? "Selected ✓" : "Use this idea →"}
                        </Btn>
                        <Btn onClick={() => save(idea)}>Save</Btn>
                        <Btn
                          variant="ghost"
                          onClick={() => {
                            setIdeas((p) => p.filter((x) => x.key !== idea.key));
                            if (isSel) setSelected(null);
                          }}
                        >
                          Discard
                        </Btn>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selected && (
                <div className="forge-pop sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-4 border-4 border-foreground bg-background p-4 hard-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Direction locked ·{" "}
                    <span className="text-muted-foreground">
                      {ideas.find((i) => i.key === selected)?.title}
                    </span>
                  </p>
                  <Btn
                    variant="primary"
                    className="px-6 py-3"
                    disabled={loading}
                    onClick={() => {
                      const idea = ideas.find((i) => i.key === selected);
                      if (idea) void createScript(idea);
                    }}
                  >
                    {loading ? "Writing script…" : "Continue to Script Studio →"}
                  </Btn>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {handoff && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-background/95">
          <div className="forge-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative space-y-5 text-center">
            <p className="font-display text-4xl uppercase leading-none md:text-6xl">
              Idea <span className="forge-arrow text-primary">→</span> Script Studio
            </p>
            <div className="flex items-end justify-center gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <span
                  key={i}
                  className="forge-bar h-8 w-2 bg-foreground"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Building your script from this direction
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
