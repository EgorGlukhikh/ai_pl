import { Injectable, Logger } from "@nestjs/common";
import { StoryLines, defaultStoryLines, linesSchema } from "@ai-pl/shared";
import { randomUUID } from "node:crypto";

@Injectable()
export class GigaChatService {
  private readonly logger = new Logger(GigaChatService.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  async generateVariants(input: {
    offerText: string;
    roomLabel: string;
    complexName: string;
    developerName: string;
  }): Promise<StoryLines[]> {
    try {
      const token = await this.getAccessToken();
      const variants = await this.generateWithApi(token, input);
      if (variants.length === 6) {
        return variants;
      }
      this.logger.warn(`GigaChat returned ${variants.length} variants, fallback to template stub`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown GigaChat error";
      this.logger.warn(`GigaChat request failed, using fallback: ${message}`);
    }

    return this.generateFallback(input);
  }

  private async generateWithApi(
    token: string,
    input: { offerText: string; roomLabel: string; complexName: string; developerName: string },
  ): Promise<StoryLines[]> {
    const endpoint =
      process.env.GIGACHAT_API_URL || "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";

    const prompt = [
      "You generate real estate Instagram stories text.",
      "Return STRICT JSON ONLY.",
      "JSON shape: {\"variants\":[StoryLines,StoryLines,StoryLines,StoryLines,StoryLines,StoryLines]}",
      "StoryLines fields: headline, subheadline, bullets(3 strings), cta, footnote, priceLine, deadlineLine.",
      "Use Russian language text.",
      "Do not exceed limits:",
      "headline<=90, subheadline<=120, bullet<=60, cta<=45, footnote<=70, priceLine<=40, deadlineLine<=40.",
      `Developer: ${input.developerName}. Complex: ${input.complexName}. Room type: ${input.roomLabel}.`,
      `Offer: ${input.offerText}`,
    ].join("\n");

    const response = await this.fetchWithOptionalInsecureTls(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GIGACHAT_MODEL || "GigaChat-2-Max",
        temperature: 0.7,
        max_tokens: 1400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a marketing copywriter." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GigaChat API ${response.status}: ${text}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("GigaChat response has empty content");
    }

    const parsed = JSON.parse(content) as { variants?: unknown[] };
    const rawVariants = parsed.variants ?? [];
    const variants = rawVariants
      .map((item) => this.safeParseLines(item))
      .filter((item): item is StoryLines => item !== null)
      .slice(0, 6);

    return variants;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
      return this.cachedToken.value;
    }

    const authUrl = process.env.GIGACHAT_AUTH_URL || "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
    const basicAuth = this.getBasicAuth();
    const body = new URLSearchParams({
      scope: process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS",
    });

    const response = await this.fetchWithOptionalInsecureTls(authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        RqUID: randomUUID(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GigaChat OAuth ${response.status}: ${text}`);
    }

    const payload = (await response.json()) as {
      access_token?: string;
      expires_at?: number;
      expires_in?: number;
    };

    const accessToken = payload.access_token;
    if (!accessToken) {
      throw new Error("GigaChat OAuth missing access_token");
    }

    const expiresAt =
      payload.expires_at ??
      (payload.expires_in ? now + payload.expires_in * 1000 : now + 25 * 60 * 1000);

    this.cachedToken = { value: accessToken, expiresAt };
    return accessToken;
  }

  private async fetchWithOptionalInsecureTls(url: string, init: RequestInit): Promise<Response> {
    if (process.env.GIGACHAT_INSECURE_TLS !== "true") {
      return fetch(url, init);
    }

    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    try {
      return await fetch(url, init);
    } finally {
      if (prev === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
      }
    }
  }

  private getBasicAuth(): string {
    if (process.env.GIGACHAT_AUTH_KEY) {
      return process.env.GIGACHAT_AUTH_KEY;
    }

    const clientId = process.env.GIGACHAT_CLIENT_ID || "";
    const clientSecret = process.env.GIGACHAT_CLIENT_SECRET || "";
    if (!clientId || !clientSecret) {
      throw new Error("Set GIGACHAT_AUTH_KEY or pair GIGACHAT_CLIENT_ID + GIGACHAT_CLIENT_SECRET");
    }
    return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  }

  private safeParseLines(input: unknown): StoryLines | null {
    const parsed = linesSchema.safeParse(input);
    return parsed.success ? parsed.data : null;
  }

  private generateFallback(input: {
    offerText: string;
    roomLabel: string;
    complexName: string;
    developerName: string;
  }): StoryLines[] {
    const base = `${input.offerText.trim()} (${input.roomLabel}, ${input.complexName})`;

    return Array.from({ length: 6 }).map((_, idx) => ({
      ...defaultStoryLines,
      headline: `Variant ${idx + 1}: ${base}`.slice(0, 90),
      subheadline: `Complex ${input.complexName} by ${input.developerName}`.slice(0, 120),
      bullets: [
        `Offer: ${input.offerText}`.slice(0, 60),
        `Room type: ${input.roomLabel}`.slice(0, 60),
        `Choose your best purchase terms`.slice(0, 60),
      ],
      cta: `Leave a request today`.slice(0, 45),
      footnote: `Contact manager for full details`.slice(0, 70),
      priceLine: `Price: on request`.slice(0, 40),
      deadlineLine: `Terms: valid now`.slice(0, 40),
    }));
  }
}

