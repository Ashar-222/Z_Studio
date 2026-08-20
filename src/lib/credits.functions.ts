import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const creditsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { readCredits } = await import("./credits.server");
    return readCredits(context.userId);
  });

export const joinWaitlistFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        feature: z.enum(["social-fetch", "web-research"]),
        email: z.string().email().max(200),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { joinWaitlist } = await import("./credits.server");
    return joinWaitlist({
      userId: context.userId,
      feature: data.feature,
      email: data.email,
      note: data.note ?? "",
    });
  });
