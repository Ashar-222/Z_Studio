import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Panel, SectionTitle, StatusChip } from "@/components/brutal";
import { ThumbnailCanvas } from "@/components/ThumbnailCanvas";
import { useStore } from "@/lib/store";
import { STATUSES, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Content Library — Z Studio" },
      {
        name: "description",
        content:
          "Every idea, script, content pack and cover you've built, filtered by pipeline status.",
      },
      { property: "og:title", content: "Content Library — Z Studio" },
      {
        property: "og:description",
        content: "Your full catalogue of ideas, scripts, packs and covers in one place.",
      },
    ],
  }),
  component: Library,
});

function Library() {
  const { state, removeItem } = useStore();
  const [filter, setFilter] = useState<Status | "All">("All");
  const items = state.items.filter((i) => filter === "All" || i.status === filter);

  return (
    <AppShell stage="PACKAGE">
      <SectionTitle
        right={
          <div className="flex flex-wrap gap-2">
            {(["All", ...STATUSES] as const).map((s) => (
              <Btn key={s} variant={filter === s ? "dark" : "default"} onClick={() => setFilter(s)}>
                {s}
              </Btn>
            ))}
          </div>
        }
      >
        Library
      </SectionTitle>

      {items.length === 0 ? (
        <Panel thick className="grid min-h-64 place-items-center p-10 text-center">
          <div className="space-y-3">
            <p className="font-display text-4xl uppercase">Nothing here yet</p>
            <Link
              to="/ideas"
              className="inline-block border-2 border-foreground bg-primary px-4 py-2 text-xs font-bold uppercase"
            >
              Forge some ideas
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((i, idx) => (
            <div
              key={i.id}
              className="animate-slide-up hard-shadow-hover flex flex-col border-2 border-foreground"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex min-h-32 items-center justify-center overflow-hidden border-b-2 border-foreground bg-muted p-3">
                {i.thumbnail ? (
                  <div className="scale-[0.42] origin-center">
                    <ThumbnailCanvas thumb={i.thumbnail} />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    No cover yet
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <StatusChip status={i.status} />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {i.publishDate ?? "unscheduled"}
                  </span>
                </div>
                <p className="text-sm font-bold uppercase leading-tight">{i.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{i.hook}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <Link
                    to="/script/$id"
                    params={{ id: i.id }}
                    className={cn(
                      "border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase hover:bg-primary",
                      i.script && "bg-primary",
                    )}
                  >
                    Script
                  </Link>
                  <Link
                    to="/pack/$id"
                    params={{ id: i.id }}
                    className={cn(
                      "border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase hover:bg-primary",
                      i.pack && "bg-primary",
                    )}
                  >
                    Pack
                  </Link>
                  <button
                    onClick={() => removeItem(i.id)}
                    className="ml-auto text-[10px] font-bold uppercase text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
