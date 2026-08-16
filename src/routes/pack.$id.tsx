import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Field, Input, Panel, StatusChip, Textarea } from "@/components/brutal";
import { ThumbnailCanvas, downloadThumbnail } from "@/components/ThumbnailCanvas";
import { packFn } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import type { Thumbnail } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pack/$id")({
  head: () => ({
    meta: [
      { title: "Content Pack — Studio Zero" },
      {
        name: "description",
        content:
          "Turn a finished script into titles, captions, hashtags, hook variations and a 16:9 or 9:16 cover.",
      },
      { property: "og:title", content: "Content Pack — Studio Zero" },
      {
        property: "og:description",
        content: "Packaging and cover design in the same flow as your script.",
      },
    ],
  }),
  component: Pack,
});

const PALETTES = [
  { bg: "#fbff00", fg: "#000000", accent: "#0000ff" },
  { bg: "#000000", fg: "#ffffff", accent: "#fbff00" },
  { bg: "#0000ff", fg: "#ffffff", accent: "#fbff00" },
  { bg: "#ffffff", fg: "#000000", accent: "#0000ff" },
];

function Pack() {
  const { id } = Route.useParams();
  const { getItem, updateItem, state } = useStore();
  const item = getItem(id);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!item) {
    return (
      <AppShell stage="PACKAGE">
        <Panel thick className="p-10 text-center">
          <p className="font-display text-4xl uppercase">Content not found</p>
          <Link to="/library" className="mt-4 inline-block border-2 border-foreground px-4 py-2 text-xs font-bold uppercase">
            Back to library
          </Link>
        </Panel>
      </AppShell>
    );
  }

  const thumb: Thumbnail = item.thumbnail ?? {
    ratio: "16:9",
    headline: item.title.slice(0, 40).toUpperCase(),
    kicker: item.platform.toUpperCase(),
    bg: "#fbff00",
    fg: "#000000",
    accent: "#0000ff",
    layout: "stack",
  };
  const setThumb = (patch: Partial<Thumbnail>) =>
    updateItem(item.id, { thumbnail: { ...thumb, ...patch } });

  async function build() {
    if (!item) return;
    setBusy(true);
    try {
      const res = await packFn({
        data: {
          title: item.title,
          hook: item.hook,
          platform: item.platform,
          niche: state.profile?.niche ?? "",
          script: (item.script ?? []).map((s) => `${s.label}: ${s.body}`).join("\n"),
        },
      });
      updateItem(item.id, { pack: { ...res.pack, selectedTitle: 0 } });
    } finally {
      setBusy(false);
    }
  }

  const pack = item.pack;

  return (
    <AppShell stage="PACKAGE">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-foreground pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusChip status={item.status} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {item.platform} // {item.format}
            </span>
          </div>
          <h1 className="font-display text-4xl uppercase leading-none md:text-6xl">Package_Module</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/script/$id"
            params={{ id: item.id }}
            className="border-2 border-foreground px-4 py-2 text-xs font-bold uppercase hover:bg-muted"
          >
            ← Script
          </Link>
          <Btn variant="primary" onClick={() => void build()} disabled={busy}>
            {busy ? "Packaging…" : pack ? "Regenerate pack" : "Generate pack"}
          </Btn>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Cover studio */}
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl uppercase">Cover_Studio</h2>
            <div className="flex gap-2">
              {(["16:9", "9:16"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setThumb({ ratio: r })}
                  className={cn(
                    "press border-2 border-foreground px-3 py-1 text-xs font-bold",
                    thumb.ratio === r ? "bg-foreground text-background" : "bg-background",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center border-4 border-foreground bg-muted p-4">
            <ThumbnailCanvas thumb={thumb} />
          </div>

          <Panel className="space-y-4 p-5">
            <Field label="Headline">
              <Input value={thumb.headline} onChange={(e) => setThumb({ headline: e.target.value })} />
            </Field>
            <Field label="Kicker">
              <Input value={thumb.kicker} onChange={(e) => setThumb({ kicker: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Palette
                </span>
                <div className="mt-2 flex gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.bg + p.fg}
                      onClick={() => setThumb(p)}
                      className="press size-8 border-2 border-foreground"
                      style={{ background: `linear-gradient(135deg, ${p.bg} 60%, ${p.accent} 60%)` }}
                      aria-label={`palette ${p.bg}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Layout
                </span>
                <div className="mt-2 flex gap-2">
                  {(["stack", "split", "band"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setThumb({ layout: l })}
                      className={cn(
                        "press border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase",
                        thumb.layout === l ? "bg-primary" : "bg-background",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setThumb({ imageDataUrl: String(reader.result) });
                  reader.readAsDataURL(f);
                }}
              />
              <Btn onClick={() => fileRef.current?.click()}>Upload photo</Btn>
              {thumb.imageDataUrl && (
                <Btn onClick={() => setThumb({ imageDataUrl: undefined })}>Remove photo</Btn>
              )}
              <Btn variant="dark" onClick={() => downloadThumbnail(thumb, item.title)}>
                Export PNG
              </Btn>
            </div>
          </Panel>
        </div>

        {/* Copy pack */}
        <div className="animate-slide-up space-y-6">
          <h2 className="font-display text-3xl uppercase">Copy_Package</h2>

          {!pack ? (
            <Panel thick className="grid min-h-64 place-items-center p-10 text-center">
              <div className="space-y-3">
                <p className="font-display text-3xl uppercase">Nothing packaged yet</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Generate titles, caption, description, hashtags and hook variations from your script
                </p>
              </div>
            </Panel>
          ) : (
            <>
              <div className="border-l-4 border-foreground pl-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Title options
                </span>
                <ul className="mt-3 space-y-3">
                  {pack.titles.map((t, i) => (
                    <li key={t + i}>
                      <button
                        onClick={() => updateItem(item.id, { pack: { ...pack, selectedTitle: i } })}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span
                          className={cn(
                            "size-4 shrink-0 border-2 border-foreground transition-colors",
                            pack.selectedTitle === i && "bg-foreground",
                          )}
                        />
                        <span className={cn("text-sm", pack.selectedTitle === i && "font-bold")}>{t}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <Panel thick className="space-y-4 bg-secondary p-6 text-secondary-foreground">
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Smart_Caption</h4>
                <Textarea
                  value={pack.caption}
                  rows={4}
                  onChange={(e) => updateItem(item.id, { pack: { ...pack, caption: e.target.value } })}
                  className="border-secondary-foreground/40 bg-transparent text-sm text-secondary-foreground"
                />
                <div className="flex flex-wrap gap-2">
                  {pack.hashtags.map((h) => (
                    <span key={h} className="bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase text-foreground">
                      #{h.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel className="space-y-3 p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Hook variations
                </span>
                {pack.hooks.map((h, i) => (
                  <p key={h + i} className="border-2 border-foreground p-3 text-sm">
                    <span className="mr-2 font-bold">{String(i + 1).padStart(2, "0")}</span>
                    {h}
                  </p>
                ))}
              </Panel>

              <Panel className="space-y-2 p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Description
                </span>
                <Textarea
                  rows={6}
                  value={pack.description}
                  onChange={(e) => updateItem(item.id, { pack: { ...pack, description: e.target.value } })}
                />
              </Panel>
            </>
          )}

          <Panel thick className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest">Next step</p>
              <p className="text-sm font-bold uppercase">Schedule & mark ready</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={item.publishDate ?? ""}
                onChange={(e) => updateItem(item.id, { publishDate: e.target.value })}
                className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm"
              />
              <Btn variant="primary" onClick={() => updateItem(item.id, { status: "Ready" })}>
                Mark ready
              </Btn>
              <Btn variant="dark" onClick={() => updateItem(item.id, { status: "Published" })}>
                Mark published
              </Btn>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}