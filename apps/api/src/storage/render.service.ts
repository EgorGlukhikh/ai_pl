import { Injectable } from "@nestjs/common";
import { PNG } from "pngjs";
import { StoryLines, StoryTemplateKey } from "@ai-pl/shared";

@Injectable()
export class RenderService {
  renderPng(lines: StoryLines, template: StoryTemplateKey): Buffer {
    const png = new PNG({ width: 1080, height: 1920 });
    const palette: Record<StoryTemplateKey, [number, number, number]> = {
      T1: [20, 30, 60],
      T2: [32, 56, 78],
      T3: [51, 64, 89],
      T4: [34, 45, 67],
      T5: [56, 45, 45],
      T6: [18, 58, 45],
    };
    const [r, g, b] = palette[template];

    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = Math.min(255, r + Math.floor((x / png.width) * 50));
        png.data[idx + 1] = Math.min(255, g + Math.floor((y / png.height) * 50));
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      }
    }

    // Minimal watermark-like encoding marker to verify render lineage.
    const tag = `${template}|${lines.headline.slice(0, 16)}`;
    for (let i = 0; i < tag.length && i < 64; i++) {
      const idx = (png.width * (png.height - 2) + i) << 2;
      png.data[idx] = tag.charCodeAt(i);
    }

    return PNG.sync.write(png);
  }
}

