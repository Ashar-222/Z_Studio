export type Platform = "YouTube" | "YouTube Shorts" | "Instagram" | "Instagram Reels" | "TikTok";

export type ContentFormat =
  "Long-form video" | "Short" | "Reel" | "Carousel" | "Tutorial" | "Video essay" | "Vlog";

export type Status = "Idea" | "Draft" | "Ready" | "Published";

export const STATUSES: Status[] = ["Idea", "Draft", "Ready", "Published"];

export const PLATFORMS: Platform[] = [
  "YouTube",
  "YouTube Shorts",
  "Instagram",
  "Instagram Reels",
  "TikTok",
];

export const FORMATS: ContentFormat[] = [
  "Long-form video",
  "Short",
  "Reel",
  "Carousel",
  "Tutorial",
  "Video essay",
  "Vlog",
];

export const GOALS = [
  "Grow audience",
  "Increase engagement",
  "Monetize",
  "Build personal brand",
  "Stay consistent",
] as const;

export type Goal = (typeof GOALS)[number];

export interface Profile {
  name: string;
  niche: string;
  platforms: Platform[];
  audience: string;
  contentType: ContentFormat;
  frequency: string;
  goal: Goal;
}

export interface ScriptSection {
  id: string;
  label: string;
  body: string;
}

export interface ContentPack {
  titles: string[];
  selectedTitle: number;
  caption: string;
  description: string;
  hashtags: string[];
  hooks: string[];
}

export interface Thumbnail {
  ratio: "16:9" | "9:16";
  headline: string;
  kicker: string;
  bg: string;
  fg: string;
  accent: string;
  layout: "stack" | "split" | "band";
  imageDataUrl?: string | undefined;
}

export interface ContentItem {
  id: string;
  title: string;
  hook: string;
  angle: string;
  why?: string;
  platform: Platform;
  format: ContentFormat;
  status: Status;
  publishDate?: string; // yyyy-mm-dd
  script?: ScriptSection[];
  pack?: ContentPack;
  thumbnail?: Thumbnail;
  createdAt: number;
  /* reserved for the later analytics phase */
  metrics?: Record<string, number>;
}

export interface AppState {
  profile: Profile | null;
  items: ContentItem[];
}

export const emptyState: AppState = { profile: null, items: [] };
