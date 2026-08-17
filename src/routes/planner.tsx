import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Panel, SectionTitle, StatusChip } from "@/components/brutal";
import { useStore } from "@/lib/store";
import { STATUSES, type ContentItem, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Content Planner — Z Studio" },
      {
        name: "description",
        content:
          "Plan, schedule and move content through Idea, Draft, Ready and Published in a calendar or board.",
      },
      { property: "og:title", content: "Content Planner — Z Studio" },
      {
        property: "og:description",
        content: "Calendar and board views for your entire content pipeline.",
      },
    ],
  }),
  component: Planner,
});

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Planner() {
  const { state, updateItem } = useStore();
  const [view, setView] = useState<"calendar" | "board">("calendar");
  const [cursor, setCursor] = useState(() => new Date());

  const byDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const i of state.items) {
      if (!i.publishDate) continue;
      map.set(i.publishDate, [...(map.get(i.publishDate) ?? []), i]);
    }
    return map;
  }, [state.items]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // monday-first
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ];
  const unscheduled = state.items.filter((i) => !i.publishDate);

  return (
    <AppShell stage="PLAN">
      <SectionTitle
        right={
          <div className="flex gap-2">
            <Btn
              variant={view === "calendar" ? "dark" : "default"}
              onClick={() => setView("calendar")}
            >
              Calendar
            </Btn>
            <Btn variant={view === "board" ? "dark" : "default"} onClick={() => setView("board")}>
              Board
            </Btn>
          </div>
        }
      >
        Planner
      </SectionTitle>

      {view === "calendar" ? (
        <div className="grid gap-8 lg:grid-cols-12">
          <Panel thick className="animate-slide-up p-4 lg:col-span-9">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-3xl uppercase">
                {first.toLocaleString("en-US", { month: "long" })} {year}
              </h3>
              <div className="flex gap-2">
                <Btn onClick={() => setCursor(new Date(year, month - 1, 1))}>←</Btn>
                <Btn onClick={() => setCursor(new Date())}>Today</Btn>
                <Btn onClick={() => setCursor(new Date(year, month + 1, 1))}>→</Btn>
              </div>
            </div>
            <div className="grid grid-cols-7 border-2 border-foreground">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                <div
                  key={d}
                  className="border-b-2 border-r-2 border-foreground bg-foreground py-1 text-center text-[10px] font-bold text-background last:border-r-0"
                >
                  {d}
                </div>
              ))}
              {cells.map((d, idx) => {
                const key = d ? iso(d) : `pad-${idx}`;
                const items = d ? (byDate.get(iso(d)) ?? []) : [];
                const isToday = d && iso(d) === iso(new Date());
                return (
                  <div
                    key={key}
                    onDragOver={(e) => d && e.preventDefault()}
                    onDrop={(e) => {
                      if (!d) return;
                      const id = e.dataTransfer.getData("text/plain");
                      if (id) updateItem(id, { publishDate: iso(d) });
                    }}
                    className={cn(
                      "min-h-24 space-y-1 border-b-2 border-r-2 border-foreground p-1 transition-colors",
                      (idx + 1) % 7 === 0 && "border-r-0",
                      !d && "bg-muted/40",
                      isToday && "bg-primary/30",
                    )}
                  >
                    {d && (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {String(d.getDate()).padStart(2, "0")}
                      </span>
                    )}
                    {items.map((i) => (
                      <Link
                        key={i.id}
                        to="/script/$id"
                        params={{ id: i.id }}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                        className={cn(
                          "block cursor-grab truncate border-2 border-foreground px-1 py-0.5 text-[10px] font-bold uppercase transition-transform hover:-translate-y-0.5",
                          i.status === "Published"
                            ? "bg-secondary text-secondary-foreground"
                            : i.status === "Ready"
                              ? "bg-primary"
                              : "bg-background",
                        )}
                      >
                        {i.title}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-3 lg:col-span-3">
            <h3 className="font-display text-2xl uppercase">Unscheduled</h3>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Drag onto a date
            </p>
            {unscheduled.length === 0 && (
              <Panel className="p-4 text-xs uppercase text-muted-foreground">All scheduled.</Panel>
            )}
            {unscheduled.map((i) => (
              <div
                key={i.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                className="cursor-grab space-y-2 border-2 border-foreground p-3 hover:bg-muted"
              >
                <StatusChip status={i.status} />
                <p className="text-sm font-bold leading-tight">{i.title}</p>
                <p className="text-[10px] uppercase text-muted-foreground">
                  {i.platform} // {i.format}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {STATUSES.map((s) => (
            <Column key={s} status={s} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Column({ status }: { status: Status }) {
  const { state, updateItem } = useStore();
  const items = state.items.filter((i) => i.status === status);
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/plain");
        if (id) updateItem(id, { status });
      }}
      className="animate-slide-up space-y-3 border-2 border-foreground p-3"
    >
      <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
        <span className="font-display text-2xl uppercase">{status}</span>
        <span className="text-[10px] font-bold">{String(items.length).padStart(2, "0")}</span>
      </div>
      {items.map((i) => (
        <div
          key={i.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
          className="hard-shadow-hover cursor-grab space-y-2 border-2 border-foreground bg-background p-3"
        >
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            {i.platform} // {i.format}
          </p>
          <p className="text-sm font-bold uppercase leading-tight">{i.title}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/script/$id"
              params={{ id: i.id }}
              className="border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase hover:bg-primary"
            >
              Script
            </Link>
            <Link
              to="/pack/$id"
              params={{ id: i.id }}
              className="border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase hover:bg-primary"
            >
              Pack
            </Link>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Empty
        </p>
      )}
    </div>
  );
}
