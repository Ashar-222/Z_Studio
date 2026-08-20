import { useEffect, useState } from "react";
import { Btn, Input, Panel, Tag } from "@/components/brutal";
import { creditsFn, joinWaitlistFn } from "@/lib/credits.functions";
import { useStore } from "@/lib/store";

export type PaidFeature = "social-fetch" | "web-research";

export interface Credits {
  researchCredits: number;
  researchUsed: number;
  researchRemaining: number;
  waitlist: string[];
}

/** Loads the signed-in creator's credit + waitlist state. */
export function useCredits() {
  const { ready, userId } = useStore();
  const [credits, setCredits] = useState<Credits | null>(null);

  async function refresh() {
    try {
      setCredits((await creditsFn()) as Credits);
    } catch (e) {
      console.error("credits", e);
    }
  }

  useEffect(() => {
    if (ready && userId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId]);

  return { credits, refresh, setCredits };
}

export function isWaitlistError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.startsWith("WAITLIST:") || msg.startsWith("NO_CREDITS:");
}

export function CreditsBadge({ remaining, total }: { remaining: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-2 border-2 border-foreground bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
      <span className={remaining > 0 ? "size-2 bg-primary" : "size-2 bg-destructive"} />
      Research credits {remaining}/{total}
    </span>
  );
}

/** Waitlist form for locked / out-of-credit features. */
export function WaitlistCard({
  feature,
  title,
  reason,
  joined,
  onJoined,
}: {
  feature: PaidFeature;
  title: string;
  reason: string;
  joined?: boolean;
  onJoined?: () => void;
}) {
  const { email: sessionEmail } = useStore();
  const [email, setEmail] = useState(sessionEmail ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(Boolean(joined));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionEmail) setEmail((v) => v || sessionEmail);
  }, [sessionEmail]);
  useEffect(() => {
    if (joined) setDone(true);
  }, [joined]);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      await joinWaitlistFn({ data: { feature, email: email.trim(), note: note.trim() } });
      setDone(true);
      onJoined?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join the waitlist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="animate-slide-up space-y-3 border-2 border-foreground bg-muted p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase leading-tight">{title}</h3>
        <Tag>{done ? "On list" : "Locked"}</Tag>
      </div>
      <p className="text-[11px] leading-relaxed">{reason}</p>
      {done ? (
        <p className="border-2 border-foreground bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest">
          You're on the waitlist — we'll email you when it opens.
        </p>
      ) : (
        <>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Waitlist email"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What would you use it for? (optional)"
            aria-label="Waitlist note"
          />
          {error && <p className="text-[10px] font-bold uppercase text-destructive">{error}</p>}
          <Btn
            variant="primary"
            className="w-full py-2"
            onClick={() => void join()}
            disabled={busy || !email.includes("@")}
          >
            {busy ? "Joining…" : "Join waitlist"}
          </Btn>
        </>
      )}
    </Panel>
  );
}
