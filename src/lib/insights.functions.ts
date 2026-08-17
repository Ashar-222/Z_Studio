import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { opportunitiesFromData } from "./insights.server";

const schema = z.object({
  handle: z.string().default(""),
  platform: z.string().default(""),
  niche: z.string().default(""),
  audience: z.string().default(""),
  goal: z.string().default(""),
  posts: z
    .array(
      z.object({
        title: z.string(),
        views: z.number().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        publishedAt: z.string().optional(),
      }),
    )
    .max(20)
    .default([]),
  research: z
    .array(z.object({ url: z.string(), title: z.string(), snippet: z.string() }))
    .max(6)
    .default([]),
});

export const opportunitiesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => opportunitiesFromData(data));
