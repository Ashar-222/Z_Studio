import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateIdeas,
  generatePack,
  generateScript,
  reviseSection,
} from "./ai.server";

const ideaSchema = z.object({
  niche: z.string(),
  topic: z.string(),
  platform: z.string(),
  audience: z.string(),
  goal: z.string(),
  format: z.string(),
  thoughts: z.string().default(""),
  tone: z.string().default(""),
});

export const ideasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ideaSchema.parse(d))
  .handler(async ({ data }) => generateIdeas(data));

const scriptSchema = z.object({
  title: z.string(),
  hook: z.string(),
  angle: z.string(),
  format: z.string(),
  platform: z.string(),
  audience: z.string(),
  niche: z.string().default(""),
  goal: z.string().default(""),
  thoughts: z.string().default(""),
  tone: z.string().default(""),
});

export const scriptFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => scriptSchema.parse(d))
  .handler(async ({ data }) => generateScript(data));

const sectionSchema = z.object({
  op: z.string(),
  label: z.string(),
  body: z.string(),
  title: z.string(),
});

export const sectionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sectionSchema.parse(d))
  .handler(async ({ data }) => reviseSection(data));

const packSchema = z.object({
  title: z.string(),
  hook: z.string(),
  platform: z.string(),
  niche: z.string(),
  script: z.string(),
});

export const packFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => packSchema.parse(d))
  .handler(async ({ data }) => generatePack(data));