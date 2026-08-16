import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { importSocialProfile } from "./social.server";

const schema = z.object({
  platform: z.enum(["youtube", "instagram", "tiktok"]),
  handle: z.string().min(1).max(120),
});

export const importSocialFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => importSocialProfile(data));
