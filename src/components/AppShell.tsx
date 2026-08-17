import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { ZMark } from "@/components/ZMark";

const STAGES = [
  { key: "PLAN", to: "/planner" },
  { key: "CREATE", to: "/ideas" },
  { key: "PACKAGE", to: "/library" },
  { key: "PUBLISH", to: "/planner" },
] as const;

export function AppShell({
  children,
  stage,
}: {
  children: ReactNode;
  stage?: "PLAN" | "CREATE" | "PACKAGE" | "PUBLISH";
}) {
  const { state, ready, userId, email, signOut } = useStore();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      if (path !== "/auth") navigate({ to: "/auth" });
      return;
    }
    if (!state.profile && path !== "/welcome") {
      navigate({ to: "/welcome" });
    }
  }, [ready, userId, state.profile, path, navigate]);

  const counts = {
    active: state.items.filter((i) => i.status === "Draft" || i.status === "Idea").length,
    ready: state.items.filter((i) => i.status === "Ready").length,
    published: state.items.filter((i) => i.status === "Published").length,
  };

  return (
    <div className="min-h-screen bg-background pb-14 font-mono text-foreground">
      <nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b-4 border-foreground bg-background px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="Z Studio home">
            <ZMark className="text-3xl md:text-4xl" />
          </Link>
          <div className="hidden items-center overflow-hidden border-2 border-foreground bg-muted md:flex">
            {STAGES.map((s, idx) => (
              <Link
                key={s.key}
                to={s.to}
                className={cn(
                  "px-4 py-1 text-xs font-bold transition-colors",
                  idx < STAGES.length - 1 && "border-r-2 border-foreground",
                  stage === s.key
                    ? "bg-foreground text-background"
                    : "hover:bg-primary",
                )}
              >
                {s.key}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {[
            { to: "/planner", label: "Calendar" },
            { to: "/intel", label: "Intel" },
            { to: "/research", label: "Research" },
            { to: "/library", label: "Library" },
          ].map((l) => (
            <Link
              key={l.label}
              to={l.to}
              activeProps={{ className: "bg-foreground text-background" }}
              className="border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/ideas"
            className="press hard-shadow-sm border-2 border-foreground bg-primary px-5 py-2 text-xs font-bold uppercase"
          >
            + Create Content
          </Link>
          {userId && (
            <button
              type="button"
              onClick={() => void signOut()}
              title={email ?? undefined}
              className="border-2 border-foreground px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background"
            >
              Sign out
            </button>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-[1600px] p-4 md:p-6">{children}</main>

      <footer className="fixed bottom-0 z-40 flex w-full justify-between gap-4 bg-foreground px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
        <div className="flex gap-6 overflow-hidden">
          <span>CREATOR: {state.profile?.name || "—"}</span>
          <span className="hidden sm:inline">IN_PIPELINE: {counts.active}</span>
          <span className="hidden sm:inline">READY: {counts.ready}</span>
          <span className="hidden md:inline">PUBLISHED: {counts.published}</span>
        </div>
        <div className="hidden md:block">ZSTUDIO_SYSTEMS</div>
      </footer>
    </div>
  );
}