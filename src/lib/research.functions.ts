import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ideasFromSources, scrapeUrl, searchWeb } from "./research.server";

export const scrapeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { spendResearchCredit } = await import("./credits.server");
    const remaining = await spendResearchCredit(context.userId);
    return { ...(await scrapeUrl(data.url)), creditsRemaining: remaining };
  });

export const searchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ query: z.string().min(2).max(200), limit: z.number().min(1).max(10).optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { spendResearchCredit } = await import("./credits.server");
    const remaining = await spendResearchCredit(context.userId);
    return {
      sources: await searchWeb(data.query, data.limit ?? 5),
      creditsRemaining: remaining,
    };
  });

const sourceSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  markdown: z.string().optional(),
});

export const researchIdeasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
