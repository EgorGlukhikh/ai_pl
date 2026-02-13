import { z } from "zod";

export const userRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const planSchema = z.enum(["FREE", "PRO"]);
export type PlanType = z.infer<typeof planSchema>;

export const generationStatusSchema = z.enum(["QUEUED", "PROCESSING", "DONE", "FAILED"]);
export type GenerationStatus = z.infer<typeof generationStatusSchema>;

export const storyTemplateKeySchema = z.enum(["T1", "T2", "T3", "T4", "T5", "T6"]);
export type StoryTemplateKey = z.infer<typeof storyTemplateKeySchema>;

export const roomCountSchema = z.enum(["ONE", "TWO", "THREE", "FOUR_PLUS"]);
export type RoomCount = z.infer<typeof roomCountSchema>;

export const linesSchema = z.object({
  headline: z.string().min(1).max(90),
  subheadline: z.string().min(1).max(120),
  bullets: z.tuple([
    z.string().min(1).max(60),
    z.string().min(1).max(60),
    z.string().min(1).max(60),
  ]),
  cta: z.string().min(1).max(45),
  footnote: z.string().min(1).max(70),
  priceLine: z.string().min(1).max(40),
  deadlineLine: z.string().min(1).max(40),
});

export type StoryLines = z.infer<typeof linesSchema>;

export const createGenerationSchema = z.object({
  complexId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  offerText: z.string().min(20).max(500),
});

export type CreateGenerationDto = z.infer<typeof createGenerationSchema>;

export const patchStoryLinesSchema = z.object({
  lines: linesSchema,
});

export type PatchStoryLinesDto = z.infer<typeof patchStoryLinesSchema>;

export const defaultStoryLines: StoryLines = {
  headline: "РљРІР°СЂС‚РёСЂР° РІР°С€РµР№ РјРµС‡С‚С‹",
  subheadline: "Р›СѓС‡С€РµРµ РїСЂРµРґР»РѕР¶РµРЅРёРµ РІ РІР°С€РµРј Р–Рљ",
  bullets: [
    "Р Р°СЃСЃСЂРѕС‡РєР° Р±РµР· РїРµСЂРІРѕРіРѕ РІР·РЅРѕСЃР°",
    "РЎРґР°С‡Р° РІ Р±Р»РёР¶Р°Р№С€РёРµ СЃСЂРѕРєРё",
    "РЈРґРѕР±РЅР°СЏ РїР»Р°РЅРёСЂРѕРІРєР°",
  ],
  cta: "Р—Р°РїРёС€РёС‚РµСЃСЊ РЅР° РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЋ",
  footnote: "РџРѕРґСЂРѕР±РЅРѕСЃС‚Рё СѓС‚РѕС‡РЅСЏР№С‚Рµ Сѓ РјРµРЅРµРґР¶РµСЂР°",
  priceLine: "РЎС‚РѕРёРјРѕСЃС‚СЊ: РїРѕ Р·Р°РїСЂРѕСЃСѓ",
  deadlineLine: "РЎСЂРѕРє: СѓС‚РѕС‡РЅСЏРµС‚СЃСЏ",
};

