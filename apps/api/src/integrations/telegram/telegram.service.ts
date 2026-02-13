import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class TelegramService {
  private get token(): string {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new ServiceUnavailableException("Telegram bot token is not configured");
    }
    return token;
  }

  async getMe() {
    const endpoint = `https://api.telegram.org/bot${this.token}/getMe`;
    const response = await fetch(endpoint, { method: "GET" });
    const data = (await response.json()) as { ok: boolean; description?: string; result?: unknown };
    if (!response.ok || !data.ok) {
      this.throwTelegramError(data.description, response.status);
    }
    return data.result;
  }

  async sendStory(input: { telegramId: string; imageUrl: string; caption: string }) {
    const endpoint = `https://api.telegram.org/bot${this.token}/sendPhoto`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: input.telegramId,
        photo: input.imageUrl,
        caption: input.caption,
      }),
    });

    const data = (await response.json()) as { ok: boolean; description?: string; result?: unknown };
    if (!response.ok || !data.ok) {
      this.throwTelegramError(data.description, response.status);
    }

    return { ok: true, result: data.result };
  }

  private throwTelegramError(description: string | undefined, status: number): never {
    const message = description || `Telegram API error (${status})`;
    const lowered = message.toLowerCase();
    if (lowered.includes("unauthorized") || lowered.includes("token")) {
      throw new UnauthorizedException(message);
    }
    if (lowered.includes("chat not found") || lowered.includes("forbidden") || lowered.includes("bad request")) {
      throw new BadRequestException(message);
    }
    throw new ServiceUnavailableException(message);
  }
}

