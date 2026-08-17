import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel, StatusChip } from "@/components/brutal";
import { ThumbnailCanvas } from "@/components/ThumbnailCanvas";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Z Studio" },
      {
        name: "description",
        content:
          "One desk for your whole channel: what to work on next, upcoming posts and your idea pipeline.",
      },
      { property: "og:title", content: "Command Center — Z Studio" },
      {
        property: "og:description",
        content: "The creator dashboard that answers one question: what should I do next?",
      },
    ],
  }),
  component: Dashboard,
});

function nextAction(items: ContentItem[]) {
  const drafting = items.find((i) => i.status === "Draft" && i.script);
  if (drafting) return { item: drafting, verb: "Package it", to: "/pack/$id" as const, why: "Script drafted — turn it into titles, caption and a cover." };
  const scriptless = items.find((i) => i.status === "Idea");
  if (scriptless) return { item: scriptless, verb: "Write the script", to: "/script/$id" as const, why: "This idea is still sitting in the pipeline without a script." };
  const unscheduled = items.find((i) => i.status === "Ready" && !i.publishDate);
  if (unscheduled) return { item: unscheduled, verb: "Schedule it", to: "/pack/$id" as const, why: "Ready to go but no publish date yet." };
  return null;
}

function Dashboard() {
  const { state } = useStore();
  const { profile, items } = state;
  const action = nextAction(items);
  const upcoming = items
    .filter((i) => i.publishDate && i.status !== "Published")
    .sort((a, b) => (a.publishDate! < b.publishDate! ? -1 : 1))
    .slice(0, 4);
  const pipeline = items.slice(0, 5);

  return (
    <AppShell stage="PLAN">
      <section className="grid gap-8 lg:grid-cols-12">
        <div className="animate-slide-up space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-end gap-4">
            <h1 className="font-display text-6xl uppercase leading-none md:text-7xl">
              What&apos;s next?
            </h1>
            <span className="mb-2 bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              {profile?.niche?.toUpperCase() || "STUDIO"} // {profile?.frequency?.toUpperCase()}
            </span>
          </div>

          {action ? (
            <Panel thick className="flex flex-col items-center gap-8 p-6 md:flex-row md:p-8">
              <div className="w-full shrink-0 md:w-2/5">
                {action.item.thumbnail ? (
                  <div className="flex justify-center border-2 border-foreground bg-muted p-2">
                    <div className="origin-center scale-[0.55]">
                      <ThumbnailCanvas thumb={action.item.thumbnail} />
                    </div>
                  </div>
                ) : (
                  <div className="grid aspect-video place-items-center border-2 border-foreground bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    No cover yet
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <StatusChip status={action.item.status} />
                <h2 className="text-2xl font-bold uppercase leading-tight md:text-3xl">
                  {action.item.title}
                </h2>
                <p className="max-w-[52ch] text-sm text-muted-foreground">{action.why}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={action.to}
                    params={{ id: action.item.id }}
                    className="press border-2 border-foreground bg-foreground px-4 py-2 text-xs font-bold uppercase text-background"
                  >
                    {action.verb} →
                  </Link>
                  <Link
                    to="/planner"
                    className="press border-2 border-foreground px-4 py-2 text-xs font-bold uppercase hover:bg-muted"
                  >
                    Open planner
                  </Link>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel thick className="space-y-4 p-10 text-center">
              <p className="font-display text-4xl uppercase">Pipeline is empty</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Start with the idea forge and the rest of the workflow unlocks
              </p>
              <Link
                to="/ideas"
                className="press hard-shadow-sm inline-block border-2 border-foreground bg-primary px-6 py-3 text-xs font-bold uppercase"
              >
                + Create content
              </Link>
            </Panel>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { k: "In pipeline", v: items.filter((i) => i.status !== "Published").length },
              { k: "Ready to post", v: items.filter((i) => i.status === "Ready").length },
              { k: "Published", v: items.filter((i) => i.status === "Published").length },
            ].map((s) => (
              <div key={s.k} className="border-2 border-foreground p-4">
                <p className="font-display text-5xl leading-none">{String(s.v).padStart(2, "0")}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {s.k}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-slide-up space-y-6 lg:col-span-4">
          <div className="space-y-3">
            <h3 className="font-display text-3xl uppercase">Idea pipeline</h3>
            {pipeline.length === 0 && (
              <Panel className="p-4 text-xs uppercase text-muted-foreground">Nothing yet.</Panel>
            )}
            {pipeline.map((i) => (
              <Link
                key={i.id}
                to="/script/$id"
                params={{ id: i.id }}
                className={cn(
                  "group flex items-center justify-between gap-3 border-2 border-foreground p-4 transition-colors",
                  i.status === "Ready" ? "bg-primary" : "hover:bg-muted",
                )}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    {i.status} // {i.platform}
                  </p>
                  <p className="truncate font-bold">{i.title}</p>
                </div>
                <span className="size-4 shrink-0 bg-foreground transition-colors group-hover:bg-secondary" />
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-3xl uppercase">Upcoming</h3>
            {upcoming.length === 0 ? (
              <Panel className="p-4 text-xs uppercase text-muted-foreground">
                Nothing scheduled — drag items onto the calendar.
              </Panel>
            ) : (
              upcoming.map((i) => (
                <div key={i.id} className="flex items-center gap-3 border-2 border-foreground p-3">
                  <span className="bg-foreground px-2 py-1 text-[10px] font-bold text-background">
                    {i.publishDate}
                  </span>
                  <span className="truncate text-xs font-bold uppercase">{i.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
