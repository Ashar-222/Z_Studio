import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { importSocialProfile } from "./social.server";

const schema = z.object({
  platform: z.enum(["youtube", "instagram", "tiktok"]),
  handle: z.string().min(1).max(120),
  kind: z.enum(["videos", "shorts"]).optional(),
});

export const importSocialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async () => {
    const { WAITLIST_ERROR } = await import("./credits.server");
    throw new Error(WAITLIST_ERROR);
  });

/** Fetch from SocialFetch, then persist the normalized result for the signed-in creator. */
export const syncSocialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { WAITLIST_ERROR } = await import("./credits.server");
    throw new Error(WAITLIST_ERROR);

    /* eslint-disable no-unreachable */
    const { supabase, userId } = context;
    const profile = await importSocialProfile(data);

    const { data: accountRow, error: accErr } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: userId,
          platform: profile.platform,
          handle: profile.handle,
          display_name: profile.displayName,
          bio: profile.bio,
          avatar_url: profile.avatarUrl ?? null,
          profile_url: profile.profileUrl ?? null,
          verified: profile.verified,
          followers: profile.metrics.followers ?? null,
          posts_count: profile.metrics.posts ?? null,
          total_views: profile.metrics.views ?? null,
          raw: { suggested: profile.suggested },
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform,handle" },
      )
      .select()
      .single();
    if (accErr || !accountRow)
      throw new Error(`Could not save profile: ${accErr?.message ?? "unknown error"}`);

    const posts = profile.topPosts.filter((p) => p.externalId);
    if (posts.length > 0) {
      const { error: postErr } = await supabase.from("social_posts").upsert(
        posts.map((p) => ({
          user_id: userId,
          account_id: accountRow.id,
          external_id: p.externalId,
          title: p.title,
          url: p.url ?? null,
          thumbnail_url: p.thumbnailUrl ?? null,
          published_at: p.publishedAt ?? null,
          views: p.views ?? null,
          likes: p.likes ?? null,
          comments: p.comments ?? null,
          shares: p.shares ?? null,
          duration_seconds: p.durationSeconds ?? null,
        })),
        { onConflict: "account_id,external_id" },
      );
      if (postErr) throw new Error(`Could not save posts: ${postErr.message}`);
    }

    return {
      profile,
      accountId: accountRow.id as string,
      lastSyncedAt: accountRow.last_synced_at as string,
    };
  });

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
