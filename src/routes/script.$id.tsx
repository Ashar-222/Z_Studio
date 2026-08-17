import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Panel, StatusChip, Textarea } from "@/components/brutal";
import { scriptFn, sectionFn } from "@/lib/ai.functions";
import { uid, useStore } from "@/lib/store";
import { STATUSES, type ScriptSection, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/script/$id")({
  head: () => ({
    meta: [
      { title: "Script Studio — Z Studio" },
      {
        name: "description",
        content:
          "Write and refine your script section by section with targeted AI edits — hook, intro, points, CTA.",
      },
      { property: "og:title", content: "Script Studio — Z Studio" },
      {
        property: "og:description",
        content: "Section-level AI editing that keeps the creator in control of the draft.",
      },
    ],
  }),
  component: ScriptStudio,
});

const OPS = [
  { op: "improve", label: "Improve" },
  { op: "rewrite", label: "Rewrite" },
  { op: "shorter", label: "Shorter" },
  { op: "engaging", label: "More engaging" },
  { op: "regenerate", label: "Regenerate" },
] as const;

function ScriptStudio() {
  const { id } = Route.useParams();
  const { getItem, updateItem, addItem, ready, state } = useStore();
  const navigate = useNavigate();
  const item = getItem(id);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!ready) return <AppShell stage="CREATE"><div className="p-10" /></AppShell>;

  if (!item) {
    return (
      <AppShell stage="CREATE">
        <Panel thick className="p-10 text-center">
          <p className="font-display text-4xl uppercase">Content not found</p>
          <Link to="/library" className="mt-4 inline-block border-2 border-foreground px-4 py-2 text-xs font-bold uppercase">
            Back to library
          </Link>
        </Panel>
      </AppShell>
    );
  }

  const sections = item.script ?? [];
  const scriptText = sections.map((s) => `${s.label.toUpperCase()}\n${s.body}`).join("\n\n");

  async function buildScript() {
    if (!item) return;
    setBusy("all");
    try {
      const res = await scriptFn({
        data: {
          title: item.title,
          hook: item.hook,
          angle: item.angle,
          format: item.format,
          platform: item.platform,
          audience: state.profile?.audience ?? "",
          niche: state.profile?.niche ?? "",
          goal: state.profile?.goal ?? "",
        },
      });
      updateItem(item.id, { script: res.sections.map((s) => ({ ...s, id: uid() })), status: "Draft" });
    } finally {
      setBusy(null);
    }
  }

  async function runOp(section: ScriptSection, op: string) {
    if (!item) return;
    setBusy(section.id + op);
    try {
      const res = await sectionFn({
        data: { op, label: section.label, body: section.body, title: item.title },
      });
      updateItem(item.id, {
        script: sections.map((s) => (s.id === section.id ? { ...s, body: res.body } : s)),
      });
    } finally {
      setBusy(null);
    }
  }

  function editSection(sid: string, body: string) {
    if (!item) return;
    updateItem(item.id, { script: sections.map((s) => (s.id === sid ? { ...s, body } : s)) });
  }

  function duplicate() {
    if (!item) return;
    const copy = addItem({
      ...item,
      title: `${item.title} (copy)`,
      status: "Draft",
    });
    navigate({ to: "/script/$id", params: { id: copy.id } });
  }

  return (
    <AppShell stage="CREATE">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-foreground pb-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={item.status} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {item.platform} // {item.format}
            </span>
          </div>
          <h1 className="max-w-[24ch] font-display text-4xl uppercase leading-none md:text-6xl">
            {item.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Btn
              key={s}
              variant={item.status === s ? "dark" : "default"}
              onClick={() => updateItem(item.id, { status: s })}
            >
              {s}
            </Btn>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {sections.length === 0 ? (
            <Panel thick className="space-y-4 p-10 text-center">
              <p className="font-display text-4xl uppercase">No script yet</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Build a structured draft from this idea
              </p>
              <Btn variant="primary" className="px-8 py-3" onClick={() => void buildScript()} disabled={busy === "all"}>
                {busy === "all" ? "Writing…" : "Generate script"}
              </Btn>
            </Panel>
          ) : (
            sections.map((s, i) => (
              <div
                key={s.id}
                className="animate-slide-up group border-2 border-foreground p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
                    {String(i + 1).padStart(2, "0")} — {s.label}
                  </span>
                  <div className="flex flex-wrap gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    {OPS.map((o) => (
                      <button
                        key={o.op}
                        onClick={() => void runOp(s, o.op)}
                        disabled={busy === s.id + o.op}
                        className={cn(
                          "border-2 border-foreground px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-primary disabled:opacity-40",
                          busy === s.id + o.op && "animate-pulse bg-primary",
                        )}
                      >
                        {busy === s.id + o.op ? "…" : o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={s.body}
                  rows={Math.max(3, Math.ceil(s.body.length / 90))}
                  onChange={(e) => editSection(s.id, e.target.value)}
                  className="border-0 px-0 text-base focus:bg-transparent"
                />
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Panel thick className="space-y-3 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest">Pipeline</p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
              <span className="bg-foreground px-2 py-1 text-background">Idea</span>
              <span>→</span>
              <span className="bg-primary px-2 py-1">Script</span>
              <span>→</span>
              <Link to="/pack/$id" params={{ id: item.id }} className="border-2 border-foreground px-2 py-1 hover:bg-primary">
                Pack
              </Link>
            </div>
            <Link
              to="/pack/$id"
              params={{ id: item.id }}
              className="press hard-shadow-sm block border-2 border-foreground bg-secondary px-4 py-3 text-center text-xs font-bold uppercase text-secondary-foreground"
            >
              Continue to content pack →
            </Link>
          </Panel>

          <Panel className="space-y-3 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest">Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Btn
                onClick={() => {
                  void navigator.clipboard.writeText(scriptText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </Btn>
              <Btn onClick={duplicate}>Duplicate</Btn>
              <Btn onClick={() => void buildScript()} disabled={busy === "all"}>
                {busy === "all" ? "…" : "Rebuild"}
              </Btn>
              <Btn variant="primary" onClick={() => updateItem(item.id, { status: "Ready" })}>
                Mark ready
              </Btn>
            </div>
            <div className="border-t-2 border-dashed border-foreground pt-3 text-[10px] uppercase text-muted-foreground">
              {sections.length} sections // {scriptText.split(/\s+/).filter(Boolean).length} words //
              ~{Math.max(1, Math.round(scriptText.split(/\s+/).filter(Boolean).length / 140))} min
            </div>
          </Panel>

          <Panel className="space-y-2 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest">Schedule</p>
            <input
              type="date"
              value={item.publishDate ?? ""}
              onChange={(e) => updateItem(item.id, { publishDate: e.target.value })}
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-sm"
            />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}