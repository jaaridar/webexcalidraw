// Boardly — render Excalidraw elements to a simplified SVG string (for thumbnails)
// Handles the most common element types with clean (non-sketchy) rendering.

type ExElement = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  opacity?: number;
  angle?: number;
  text?: string;
  fontSize?: number;
  points?: [number, number][];
  width?: number;
  height?: number;
  boundElements?: { id: string; type: string }[];
};

const FONT_FAMILY =
  '"Virgil", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function elementsToSvg(
  elementsJson: string,
  opts?: { padding?: number; bg?: string }
): string {
  let elements: ExElement[] = [];
  try {
    elements = JSON.parse(elementsJson);
  } catch {
    elements = [];
  }
  const visible = elements.filter(
    (e) => e && !e.isDeleted && e.type !== "frame"
  );

  if (visible.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="${opts?.bg ?? "#fafaf9"}"/><text x="200" y="125" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="14" fill="#a8a29e">Empty canvas</text></svg>`;
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const e of visible) {
    const pts = e.points && e.points.length ? e.points : [];
    if (pts.length) {
      for (const [px, py] of pts) {
        minX = Math.min(minX, e.x + px);
        minY = Math.min(minY, e.y + py);
        maxX = Math.max(maxX, e.x + px);
        maxY = Math.max(maxY, e.y + py);
      }
    } else {
      minX = Math.min(minX, e.x);
      minY = Math.min(minY, e.y);
      maxX = Math.max(maxX, e.x + (e.width || 0));
      maxY = Math.max(maxY, e.y + (e.height || 0));
    }
  }
  if (!isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 240;
  }

  const pad = opts?.padding ?? 24;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);

  const body = visible
    .map((e) => renderElement(e))
    .filter(Boolean)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="${minX} ${minY} ${w} ${h}" preserveAspectRatio="xMidYMid meet"><rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="${opts?.bg ?? "#fafaf9"}"/>${body}</svg>`;
}

function renderElement(e: ExElement): string {
  const stroke = e.strokeColor || "#1e1e1e";
  const fill = e.backgroundColor && e.backgroundColor !== "transparent" ? e.backgroundColor : "none";
  const sw = Math.max(1, (e.strokeWidth || 1) * 1.5);
  const op = (e.opacity ?? 100) / 100;

  switch (e.type) {
    case "rectangle":
      return `<rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" rx="2"/>`;
    case "ellipse":
      return `<ellipse cx="${e.x + e.width / 2}" cy="${e.y + e.height / 2}" rx="${e.width / 2}" ry="${e.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`;
    case "diamond": {
      const cx = e.x + e.width / 2;
      const cy = e.y + e.height / 2;
      return `<polygon points="${cx},${e.y} ${e.x + e.width},${cy} ${cx},${e.y + e.height} ${e.x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`;
    }
    case "line":
    case "arrow": {
      if (!e.points || e.points.length < 2) return "";
      const d = e.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${e.x + p[0]} ${e.y + p[1]}`)
        .join(" ");
      const arrowHead =
        e.type === "arrow"
          ? (() => {
              const [x1, y1] = e.points[e.points.length - 2];
              const [x2, y2] = e.points[e.points.length - 1];
              const ang = Math.atan2(y2 - y1, x2 - x1);
              const len = 10;
              const ax = e.x + x2;
              const ay = e.y + y2;
              return `<path d="M ${ax} ${ay} L ${ax - len * Math.cos(ang - 0.5)} ${ay - len * Math.sin(ang - 0.5)} M ${ax} ${ay} L ${ax - len * Math.cos(ang + 0.5)} ${ay - len * Math.sin(ang + 0.5)}" stroke="${stroke}" stroke-width="${sw}" fill="none" opacity="${op}"/>`;
            })()
          : "";
      return `<path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="none" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>${arrowHead}`;
    }
    case "freedraw": {
      if (!e.points || e.points.length < 1) return "";
      const d = e.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${e.x + p[0]} ${e.y + p[1]}`)
        .join(" ");
      return `<path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="none" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case "text": {
      const fs = e.fontSize || 20;
      const lines = (e.text || "").split("\n");
      const lineHeight = fs * 1.25;
      const tspans = lines
        .map(
          (ln, i) =>
            `<tspan x="${e.x}" y="${e.y + (i + 1) * lineHeight - lineHeight * 0.2}">${escapeXml(ln)}</tspan>`
        )
        .join("");
      return `<text font-family="${FONT_FAMILY}" font-size="${fs}" fill="${stroke}" opacity="${op}">${tspans}</text>`;
    }
    default:
      return "";
  }
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
