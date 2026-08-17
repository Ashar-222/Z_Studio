import type { Thumbnail } from "@/lib/types";

const SIZES = {
  "16:9": { w: 1280, h: 720 },
  "9:16": { w: 720, h: 1280 },
} as const;

/** Live preview — pure DOM so editing feels instant. */
export function ThumbnailCanvas({ thumb, scale = 1 }: { thumb: Thumbnail; scale?: number }) {
  const { w, h } = SIZES[thumb.ratio];
  const box = thumb.ratio === "16:9" ? { width: 560, height: 315 } : { width: 236, height: 420 };
  const headlineSize = thumb.ratio === "16:9" ? 54 : 44;

  return (
    <div
      className="relative overflow-hidden border-4 border-foreground transition-all duration-300"
      style={{
        width: box.width * scale,
        height: box.height * scale,
        backgroundColor: thumb.bg,
        color: thumb.fg,
      }}
      aria-label={`${thumb.ratio} cover preview ${w}x${h}`}
    >
      {thumb.imageDataUrl && (
        <img
          src={thumb.imageDataUrl}
          alt=""
          className={
            thumb.layout === "split"
              ? "absolute right-0 top-0 h-full w-1/2 object-cover"
              : "absolute inset-0 h-full w-full object-cover opacity-70"
          }
        />
      )}

      {thumb.layout === "band" && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ backgroundColor: thumb.accent }}
        />
      )}

      <div
        className={
          thumb.layout === "split"
            ? "relative flex h-full w-1/2 flex-col justify-end gap-3 p-5"
            : "relative flex h-full flex-col justify-end gap-3 p-6"
        }
      >
        <span
          className="w-fit px-2 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ backgroundColor: thumb.accent, color: thumb.bg }}
        >
          {thumb.kicker}
        </span>
        <span
          className="font-display uppercase leading-[0.9]"
          style={{
            fontSize: headlineSize * scale,
            color: thumb.layout === "band" ? thumb.fg : thumb.fg,
          }}
        >
          {thumb.headline}
        </span>
      </div>
    </div>
  );
}

/** Export at real platform resolution using canvas 2D. */
export function downloadThumbnail(thumb: Thumbnail, name: string) {
  const { w, h } = SIZES[thumb.ratio];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const paint = (img?: HTMLImageElement) => {
    ctx.fillStyle = thumb.bg;
    ctx.fillRect(0, 0, w, h);

    if (img) {
      if (thumb.layout === "split") {
        ctx.drawImage(img, w / 2, 0, w / 2, h);
      } else {
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    }

    if (thumb.layout === "band") {
      ctx.fillStyle = thumb.accent;
      ctx.fillRect(0, h - h / 3, w, h / 3);
    }

    const pad = Math.round(w * 0.05);
    const colW = thumb.layout === "split" ? w / 2 - pad * 2 : w - pad * 2;

    // kicker
    const kickerSize = Math.round(h * 0.035);
    ctx.font = `bold ${kickerSize}px "Space Mono", monospace`;
    const kicker = thumb.kicker.toUpperCase();
    const kw = ctx.measureText(kicker).width;
    const headSize = Math.round(h * (thumb.ratio === "16:9" ? 0.115 : 0.075));
    ctx.font = `${headSize}px Anton, sans-serif`;

    // wrap headline
    const words = thumb.headline.toUpperCase().split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > colW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);

    const lineH = headSize * 0.95;
    const blockH = lines.length * lineH;
    let y = h - pad - blockH + lineH * 0.8;

    ctx.fillStyle = thumb.accent;
    ctx.fillRect(pad, y - lineH - kickerSize * 2.1, kw + kickerSize, kickerSize * 1.9);
    ctx.fillStyle = thumb.bg;
    ctx.font = `bold ${kickerSize}px "Space Mono", monospace`;
    ctx.fillText(kicker, pad + kickerSize / 2, y - lineH - kickerSize * 0.7);

    ctx.fillStyle = thumb.fg;
    ctx.font = `${headSize}px Anton, sans-serif`;
    for (const l of lines) {
      ctx.fillText(l, pad, y);
      y += lineH;
    }

    const a = document.createElement("a");
    a.download = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}-${thumb.ratio.replace(":", "x")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  if (thumb.imageDataUrl) {
    const img = new Image();
    img.onload = () => paint(img);
    img.src = thumb.imageDataUrl;
  } else {
    paint();
  }
}
