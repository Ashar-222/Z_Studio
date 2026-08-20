import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SocialProfile } from "./social.server";

const schema = z.object({
  platform: z.enum(["youtube", "instagram", "tiktok"]),
  handle: z.string().min(1).max(120),
  kind: z.enum(["videos", "shorts"]).optional(),
});

/**
 * SocialFetch profile importing is a paid capability and is currently closed.
 * Both entry points refuse the request and steer the creator to the waitlist.
 */
export const importSocialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async (): Promise<SocialProfile> => {
    const { WAITLIST_ERROR } = await import("./credits.server");
    throw new Error(WAITLIST_ERROR);
  });

export const syncSocialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(
    async (): Promise<{ profile: SocialProfile; accountId: string; lastSyncedAt: string }> => {
      const { WAITLIST_ERROR } = await import("./credits.server");
      throw new Error(WAITLIST_ERROR);
    },
  );

export interface StoredAccount {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_url: string | null;
  verified: boolean | null;
  followers: number | null;
  posts_count: number | null;
  total_views: number | null;
  last_synced_at: string | null;
}

export interface StoredPost {
  id: string;
  account_id: string;
  title: string | null;
  url: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  duration_seconds: number | null;
}

/** Load previously imported accounts + posts from the database. */
export const listSocialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: accounts, error } = await supabase
      .from("social_accounts")
      .select(
        "id, platform, handle, display_name, bio, avatar_url, profile_url, verified, followers, posts_count, total_views, last_synced_at",
      )
      .eq("user_id", userId)
      .order("last_synced_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (accounts ?? []).map((a) => a.id);
    let posts: StoredPost[] = [];
    if (ids.length > 0) {
      const { data: postRows, error: pErr } = await supabase
        .from("social_posts")
        .select(
          "id, account_id, title, url, thumbnail_url, published_at, views, likes, comments, shares, duration_seconds",
        )
        .in("account_id", ids)
        .order("views", { ascending: false, nullsFirst: false });
      if (pErr) throw new Error(pErr.message);
      posts = (postRows ?? []) as unknown as StoredPost[];
    }
    return { accounts: (accounts ?? []) as unknown as StoredAccount[], posts };
  });
