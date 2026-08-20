import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Features that are not covered by the free (DeepSeek) tier. */
export type PaidFeature = "social-fetch" | "web-research";

export const WAITLIST_ERROR =
  "WAITLIST: Social profile fetching is not available on your plan yet. Join the waitlist to get early access.";

export const NO_CREDITS_ERROR =
  "NO_CREDITS: You have used all of your free web research credits. Join the waitlist for more.";

export interface CreditsSnapshot {
  researchCredits: number;
  researchUsed: number;
  researchRemaining: number;
  waitlist: string[];
}

export async function readCredits(userId: string): Promise<CreditsSnapshot> {
  const { data } = await supabaseAdmin
    .from("user_credits")
    .select("research_credits, research_used")
    .eq("user_id", userId)
    .maybeSingle();

  const credits = data?.research_credits ?? 2;
  const used = data?.research_used ?? 0;

  const { data: wl } = await supabaseAdmin
    .from("waitlist_signups")
    .select("feature")
    .eq("user_id", userId);

  return {
    researchCredits: credits,
    researchUsed: used,
    researchRemaining: Math.max(0, credits - used),
    waitlist: (wl ?? []).map((r) => r.feature),
  };
}

/** Spends one web-research credit. Throws when the creator is out of credits. */
export async function spendResearchCredit(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("consume_research_credit", {
    _user_id: userId,
  });
  if (error) throw new Error(`Could not check your credits: ${error.message}`);
  const remaining = typeof data === "number" ? data : -1;
  if (remaining < 0) throw new Error(NO_CREDITS_ERROR);
  return remaining;
}

export async function joinWaitlist(input: {
  userId: string;
  feature: PaidFeature;
  email: string;
  note: string;
}): Promise<{ joined: true }> {
  const { error } = await supabaseAdmin.from("waitlist_signups").upsert(
    {
      user_id: input.userId,
      feature: input.feature,
      email: input.email,
      note: input.note,
    },
    { onConflict: "user_id,feature" },
  );
  if (error) throw new Error(`Could not join the waitlist: ${error.message}`);
  return { joined: true };
}
