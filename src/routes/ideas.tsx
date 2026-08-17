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

  const contextLine = [
    `${platform} ${format}`,
    profile?.niche,
    profile?.audience,
  ]
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
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {contextLine}
            </span>
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
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse border-2 border-foreground bg-muted"
                  style={{ animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          )}

          {!loading && ideas.length === 0 && (
            <Panel className="grid h-full min-h-64 place-items-center p-10 text-center">
              <div className="space-y-3">
                <p className="font-display text-4xl uppercase">No ideas on the bench</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Set a seed and hit generate
                </p>
              </div>
            </Panel>
          )}

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
                    className={cn("flex-1")}
                    onClick={() => void createScript(idea)}
                  >
                    Create script
                  </Btn>
                  <Btn onClick={() => save(idea)}>Save</Btn>
                  <Btn
                    variant="ghost"
                    onClick={() => setIdeas((p) => p.filter((x) => x.key !== idea.key))}
                  >
                    Discard
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}