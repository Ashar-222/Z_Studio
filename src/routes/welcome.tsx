import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, Field, Input, Panel, Select } from "@/components/brutal";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
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
          <h1 className="font-display text-6xl uppercase leading-[0.9] md:text-8xl">
            Your whole
            <br />
            channel,
            <br />
            <span className="bg-secondary px-2 text-secondary-foreground">one desk.</span>
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