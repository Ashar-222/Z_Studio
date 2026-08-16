import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ideasFromSources, scrapeUrl, searchWeb } from "./research.server";

export const scrapeFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data }) => scrapeUrl(data.url));

export const searchFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ query: z.string().min(2).max(200), limit: z.number().min(1).max(10).optional() }).parse(d),
  )
  .handler(async ({ data }) => ({ sources: await searchWeb(data.query, data.limit ?? 5) }));

const sourceSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  markdown: z.string().optional(),
});

export const researchIdeasFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        sources: z.array(sourceSchema).min(1).max(6),
        niche: z.string(),
        audience: z.string(),
        platform: z.string(),
        format: z.string(),
        goal: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => ideasFromSources(data));
