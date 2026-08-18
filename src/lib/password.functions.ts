import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1).max(256) });

export const checkPasswordSafety = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { isPasswordLeaked } = await import("./password.server");

    if (data.password.length < 8) {
      return { ok: false as const, reason: "Password must be at least 8 characters." };
    }
    if (await isPasswordLeaked(data.password)) {
      return {
        ok: false as const,
        reason: "This password appeared in a known data breach. Please choose a different one.",
      };
    }
    return { ok: true as const, reason: null };
  });
