import { deepseek, hasKey, parseJson } from "./ai.server";

const BASE = "https://api.socialfetch.dev";

export type SocialPlatform = "youtube" | "instagram" | "tiktok";

export interface SocialPost {
  externalId: string;
  title: string;
  url?: string | undefined;
  thumbnailUrl?: string | undefined;
  publishedAt?: string | undefined;
  views?: number | undefined;
  likes?: number | undefined;
  comments?: number | undefined;
  shares?: number | undefined;
  durationSeconds?: number | undefined;
}

export interface SocialProfile {
  platform: SocialPlatform;
  kind?: "videos" | "shorts" | undefined;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: string | undefined;
  profileUrl?: string | undefined;
  verified: boolean;
  metrics: { followers?: number | undefined; posts?: number | undefined; views?: number | undefined };
  topPosts: SocialPost[];
  suggested: { niche: string; audience: string; contentType: string };
}

function key() {
  const k = process.env["SocialFetch_API_KEY"] ?? process.env["SOCIALFETCH_API_KEY"];
  if (!k) throw new Error("SocialFetch API key is not configured");
  return k;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-api-key": key() } });
  if (!res.ok) {
    const text = await res.text();
    console.error(`socialfetch ${path} failed [${res.status}]: ${text}`);
    throw new Error(`SocialFetch request failed [${res.status}]: ${text}`);
  }
  return (await res.json()) as T;
}

type Envelope = { data?: Record<string, unknown> };
const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

function clean(handle: string) {
  const h = handle.trim().replace(/^@/, "");
  const m = h.match(/(?:youtube\.com\/@|instagram\.com\/|tiktok\.com\/@)([^/?#]+)/i);
  return (m?.[1] ?? h).replace(/\/+$/, "");
}

async function suggest(bio: string, name: string, platform: string, posts: SocialPost[]) {
  const fallback = {
    niche: bio.split(/[\n|.•]/)[0]?.trim().slice(0, 40) || "Content creation",
    audience: `People following ${name || platform} creators`,
    contentType: platform === "youtube" ? "Long-form video" : platform === "tiktok" ? "Short" : "Reel",
  };
  if (!hasKey()) return fallback;
  try {
    const raw = await deepseek(
      "You classify creator accounts. Reply with raw JSON only.",
      `Return {"niche","audience","contentType"} for this ${platform} creator. contentType must be one of: Long-form video, Short, Reel, Carousel, Tutorial, Video essay, Vlog. niche max 4 words, audience max 10 words.
Name: ${name}
Bio: ${bio}
Recent titles: ${posts.slice(0, 6).map((p) => p.title).join(" | ")}`,
    );
    const out = parseJson<{ niche?: string; audience?: string; contentType?: string }>(raw);
    return {
      niche: out.niche || fallback.niche,
      audience: out.audience || fallback.audience,
      contentType: out.contentType || fallback.contentType,
    };
  } catch (e) {
    console.error("social suggest failed", e);
    return fallback;
  }
}

export async function importSocialProfile(input: {
  platform: SocialPlatform;
  handle: string;
  kind?: "videos" | "shorts" | undefined;
}): Promise<SocialProfile> {
  const handle = clean(input.handle);
  if (!handle) throw new Error("Enter a username");

  let core: Record<string, unknown> = {};
  let metrics: Record<string, unknown> = {};
  let topPosts: SocialPost[] = [];

  if (input.platform === "youtube") {
    const r = await get<Envelope>(`/v1/youtube/channel?handle=${encodeURIComponent(handle)}`);
    const d = r.data ?? {};
    if (d["lookupStatus"] === "not_found") throw new Error(`No YouTube channel found for @${handle}`);
    core = (d["channel"] as Record<string, unknown>) ?? {};
    metrics = (d["metrics"] as Record<string, unknown>) ?? {};
    try {
      const v = await get<Envelope>(
        `/v1/youtube/channels/videos?handle=${encodeURIComponent(handle)}&sortBy=popular`,
      );
      const list = ((v.data?.["videos"] as Record<string, unknown>[]) ?? []).slice(0, 12);
      topPosts = list.map((p) => ({
        externalId: str(p["id"], str(p["url"], "")),
        title: str(p["title"], "Untitled"),
        url: typeof p["url"] === "string" ? p["url"] : undefined,
        thumbnailUrl: typeof p["thumbnailUrl"] === "string" ? p["thumbnailUrl"] : undefined,
        publishedAt: typeof p["publishedAt"] === "string" ? p["publishedAt"] : (typeof p["publishDate"] === "string" ? p["publishDate"] : undefined),
        views: num(p["viewCount"]) ?? num((p["metrics"] as Record<string, unknown>)?.["views"]),
        likes: num(p["likeCount"]) ?? num((p["metrics"] as Record<string, unknown>)?.["likes"]),
        comments: num(p["commentCount"]),
        durationSeconds: num(p["durationSeconds"]),
      }));
    } catch (e) {
      console.error("youtube videos failed", e);
    }
    metrics = { followers: metrics["subscribers"], posts: metrics["videos"], views: metrics["views"] };
    if (input.kind === "shorts" || input.kind === "videos") {
      const isShort = (p: SocialPost) =>
        (p.durationSeconds !== undefined && p.durationSeconds <= 60) ||
        (p.url ?? "").includes("/shorts/");
      const filtered = topPosts.filter((p) => (input.kind === "shorts" ? isShort(p) : !isShort(p)));
      if (filtered.length > 0) topPosts = filtered;
    }
  } else if (input.platform === "instagram") {
    const r = await get<Envelope>(`/v1/instagram/profiles/${encodeURIComponent(handle)}`);
    const d = r.data ?? {};
    if (d["lookupStatus"] === "not_found") throw new Error(`No Instagram profile found for @${handle}`);
    core = (d["profile"] as Record<string, unknown>) ?? {};
    metrics = (d["metrics"] as Record<string, unknown>) ?? {};
    topPosts = ((d["recentPosts"] as Record<string, unknown>[]) ?? []).slice(0, 12).map((p) => ({
      externalId: str(p["id"] ?? p["shortcode"], str(p["url"], "")),
      title: str(p["caption"], "Untitled").split("\n")[0]?.slice(0, 120) || "Untitled",
      url: typeof p["url"] === "string" ? p["url"] : undefined,
      thumbnailUrl: typeof p["thumbnailUrl"] === "string" ? p["thumbnailUrl"] : (typeof p["displayUrl"] === "string" ? p["displayUrl"] : undefined),
      publishedAt: typeof p["takenAt"] === "string" ? p["takenAt"] : (typeof p["publishedAt"] === "string" ? p["publishedAt"] : undefined),
      views: num(p["videoViewCount"]) ?? num(p["playCount"]),
      likes: num(p["likeCount"]) ?? num(p["likes"]),
      comments: num(p["commentCount"]) ?? num(p["comments"]),
    }));
  } else {
    const r = await get<Envelope>(`/v1/tiktok/profiles/${encodeURIComponent(handle)}`);
    const d = r.data ?? {};
    if (d["lookupStatus"] === "not_found") throw new Error(`No TikTok profile found for @${handle}`);
    core = (d["profile"] as Record<string, unknown>) ?? {};
    metrics = (d["metrics"] as Record<string, unknown>) ?? {};
    try {
      const v = await get<Envelope>(
        `/v1/tiktok/profiles/${encodeURIComponent(handle)}/videos`,
      );
      const list = ((v.data?.["videos"] as Record<string, unknown>[]) ?? []).slice(0, 12);
      topPosts = list.map((p) => {
        const m = (p["metrics"] as Record<string, unknown>) ?? {};
        return {
          externalId: str(p["id"], str(p["url"], "")),
          title: str(p["description"] ?? p["title"], "Untitled").split("\n")[0]?.slice(0, 120) || "Untitled",
          url: typeof p["url"] === "string" ? p["url"] : undefined,
          thumbnailUrl: typeof p["thumbnailUrl"] === "string" ? p["thumbnailUrl"] : (typeof p["coverUrl"] === "string" ? p["coverUrl"] : undefined),
          publishedAt: typeof p["createdAt"] === "string" ? p["createdAt"] : (typeof p["publishedAt"] === "string" ? p["publishedAt"] : undefined),
          views: num(m["plays"]) ?? num(p["playCount"]),
          likes: num(m["likes"]) ?? num(p["diggCount"]),
          comments: num(m["comments"]) ?? num(p["commentCount"]),
          shares: num(m["shares"]) ?? num(p["shareCount"]),
          durationSeconds: num(p["durationSeconds"]),
        };
      });
    } catch (e) {
      console.error("tiktok videos failed", e);
    }
  }

  const displayName = str(core["displayName"], handle);
  const bio = str(core["bio"]);
  const suggested = await suggest(bio, displayName, input.platform, topPosts);
  if (input.platform === "youtube") {
    suggested.contentType = input.kind === "shorts" ? "Short" : "Long-form video";
  }
  return {
    platform: input.platform,
    kind: input.kind,
    handle,
    displayName,
    bio,
    avatarUrl: typeof core["avatarUrl"] === "string" ? core["avatarUrl"] : undefined,
    profileUrl: typeof core["profileUrl"] === "string" ? core["profileUrl"] : undefined,
    verified: core["verified"] === true,
    metrics: {
      followers: num(metrics["followers"]),
      posts: num(metrics["posts"]),
      views: num(metrics["views"]) ?? num(metrics["likes"]),
    },
    topPosts,
    suggested,
  };
}
