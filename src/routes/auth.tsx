import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Btn, Field, Input, Panel } from "@/components/brutal";
import { PasswordInput } from "@/components/PasswordInput";
import { ZMark } from "@/components/ZMark";
import { supabase } from "@/integrations/supabase/client";
import { checkPasswordSafety } from "@/lib/password.functions";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Z Studio" },
      {
        name: "description",
        content:
          "Sign in to Z Studio to sync your creator profile, ideas, scripts and content calendar across devices.",
      },
      { property: "og:title", content: "Sign in — Z Studio" },
      {
        property: "og:description",
        content: "Access your creator content pipeline: ideas, scripts, packaging and planning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { userId, ready } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ready && userId) navigate({ to: "/" });
  }, [ready, userId, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const check = await checkPasswordSafety({ data: { password } });
        if (!check.ok) {
          setMsg(check.reason);
          return;
        }
      }
      const res =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            });
      if (res.error) setMsg(res.error.message);
      else if (res.data.session) navigate({ to: "/" });
      else setMsg("Check your inbox to confirm the account, then sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 font-mono text-foreground">
      <Panel thick className="w-full max-w-md space-y-6 p-8">
        <div>
          <h1 className="text-5xl">
            <ZMark className="text-5xl" />
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            {mode === "signin" ? "Sign in to your desk" : "Create your creator desk"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
            />
          </Field>
          <Field label="Password">
            <PasswordInput required value={password} onChange={setPassword} />
          </Field>
          {msg && (
            <p className="border-2 border-foreground bg-muted p-3 text-xs uppercase">{msg}</p>
          )}
          <Btn variant="primary" className="w-full py-3" disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Btn>
        </form>

        <button
          type="button"
          className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMsg(null);
          }}
        >
          {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
        </button>
      </Panel>
    </main>
  );
}
