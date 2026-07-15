// Boardly — demo Excalidraw scenes (programmatically generated, valid element shapes)
import { v4 as uuid } from "uuid";

type El = {
  type: string;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: null;
  roundness: null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: unknown[];
  updated: number;
  link: null;
  locked: boolean;
  points?: [number, number][];
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: string;
  verticalAlign?: string;
  baseline?: number;
  containerId?: string | null;
  originalText?: string;
  lineHeight?: number;
  startBinding?: unknown;
  endBinding?: unknown;
  startArrowhead?: null;
  endArrowhead?: string | null;
};

let n = 1;
function rid(): number {
  return (n++ * 9301 + 49297) % 233280;
}

function base(p: Partial<El> & { type: string; x: number; y: number }): El {
  return {
    id: uuid(),
    width: 100,
    height: 100,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: rid(),
    version: 1,
    versionNonce: rid(),
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    ...p,
  };
}

function rect(p: Partial<El> & { x: number; y: number; width: number; height: number }): El {
  return base({ type: "rectangle", ...p });
}
function ellipse(p: Partial<El> & { x: number; y: number; width: number; height: number }): El {
  return base({ type: "ellipse", ...p });
}
function diamond(p: Partial<El> & { x: number; y: number; width: number; height: number }): El {
  return base({ type: "diamond", ...p });
}
function line(p: Partial<El> & { x: number; y: number; points: [number, number][] }): El {
  return base({ type: "line", width: 0, height: 0, ...p });
}
function arrow(p: Partial<El> & { x: number; y: number; points: [number, number][] }): El {
  return base({ type: "arrow", width: 0, height: 0, endArrowhead: "arrow", ...p });
}
function text(p: Partial<El> & { x: number; y: number; text: string; fontSize?: number }): El {
  const fs = p.fontSize || 20;
  const t = p.text as string;
  const lines = t.split("\n");
  return base({
    type: "text",
    width: Math.max(...lines.map((l) => l.length)) * fs * 0.55,
    height: lines.length * fs * 1.25,
    strokeColor: "#1e1e1e",
    ...p,
    fontSize: fs,
    fontFamily: 1,
    textAlign: "left",
    verticalAlign: "top",
    baseline: fs,
    containerId: null,
    originalText: t,
    lineHeight: 1.25,
  });
}

// ---------- Scene builders ----------

function roadmapScene(): El[] {
  const cols = [
    { title: "NOW", x: 60, color: "#10b981" },
    { title: "NEXT", x: 460, color: "#f59e0b" },
    { title: "LATER", x: 860, color: "#8b5cf6" },
  ];
  const els: El[] = [];
  els.push(text({ x: 60, y: 20, text: "Product Roadmap — Q4", fontSize: 32, strokeColor: "#0f172a" }));
  for (const c of cols) {
    els.push(rect({ x: c.x, y: 90, width: 340, height: 60, backgroundColor: c.color, strokeColor: c.color, fillStyle: "solid", opacity: 100 }));
    els.push(text({ x: c.x + 20, y: 105, text: c.title, fontSize: 24, strokeColor: "#ffffff" }));
    const items = c.title === "NOW" ? ["Ship real-time collab", "Board templates", "Auth & roles"] : c.title === "NEXT" ? ["AI diagram assist", "Version history", "Comments"] : ["Mobile app", "Public API", "Integrations"];
    items.forEach((it, i) => {
      const y = 180 + i * 110;
      els.push(rect({ x: c.x, y, width: 340, height: 90, backgroundColor: "#ffffff", strokeColor: "#d6d3d1", strokeWidth: 1, fillStyle: "solid" }));
      els.push(text({ x: c.x + 16, y: y + 16, text: it, fontSize: 18, strokeColor: "#1e293b" }));
      els.push(rect({ x: c.x + 16, y: y + 52, width: 60, height: 22, backgroundColor: c.color, strokeColor: c.color, fillStyle: "solid" }));
      els.push(text({ x: c.x + 24, y: y + 55, text: "P" + (i + 1), fontSize: 12, strokeColor: "#ffffff" }));
    });
  }
  return els;
}

function journeyScene(): El[] {
  const els: El[] = [];
  els.push(text({ x: 60, y: 20, text: "User Journey Map", fontSize: 32, strokeColor: "#0f172a" }));
  const stages = ["Discover", "Sign up", "Onboard", "Activate", "Retain"];
  const colors = ["#10b981", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];
  const moods = [4, 3, 2, 4, 5];
  stages.forEach((s, i) => {
    const x = 60 + i * 280;
    els.push(rect({ x, y: 100, width: 240, height: 70, backgroundColor: colors[i], strokeColor: colors[i], fillStyle: "solid" }));
    els.push(text({ x: x + 20, y: 120, text: s, fontSize: 22, strokeColor: "#ffffff" }));
    // mood curve node
    const ny = 320 - moods[i] * 40;
    els.push(ellipse({ x: x + 100, y: ny, width: 40, height: 40, backgroundColor: colors[i], strokeColor: colors[i], fillStyle: "solid" }));
    if (i < stages.length - 1) {
      const nx = 60 + (i + 1) * 280;
      els.push(line({ x: x + 140, y: ny + 20, points: [[0, 0], [nx - x - 140, (320 - moods[i + 1] * 40) - ny]], strokeColor: colors[i], strokeWidth: 3 }));
    }
    els.push(text({ x: x + 70, y: 410, text: "😊".repeat(moods[i]) || "😐", fontSize: 24 }));
  });
  els.push(text({ x: 60, y: 280, text: "Satisfaction", fontSize: 16, strokeColor: "#78716c" }));
  els.push(line({ x: 60, y: 340, points: [[0, 0], [1340, 0]], strokeColor: "#d6d3d1", strokeWidth: 1, strokeStyle: "dashed" }));
  return els;
}

function architectureScene(): El[] {
  const els: El[] = [];
  els.push(text({ x: 60, y: 20, text: "System Architecture", fontSize: 32, strokeColor: "#0f172a" }));
  // Client layer
  els.push(rect({ x: 80, y: 110, width: 220, height: 70, backgroundColor: "#10b981", strokeColor: "#10b981", fillStyle: "solid" }));
  els.push(text({ x: 110, y: 130, text: "Web Client", fontSize: 20, strokeColor: "#ffffff" }));
  els.push(rect({ x: 340, y: 110, width: 220, height: 70, backgroundColor: "#10b981", strokeColor: "#10b981", fillStyle: "solid" }));
  els.push(text({ x: 380, y: 130, text: "Mobile Client", fontSize: 20, strokeColor: "#ffffff" }));
  // Gateway
  els.push(rect({ x: 200, y: 240, width: 240, height: 60, backgroundColor: "#f59e0b", strokeColor: "#f59e0b", fillStyle: "solid" }));
  els.push(text({ x: 250, y: 256, text: "API Gateway", fontSize: 20, strokeColor: "#ffffff" }));
  els.push(arrow({ x: 190, y: 180, points: [[0, 0], [110, 60]], strokeColor: "#475569" }));
  els.push(arrow({ x: 450, y: 180, points: [[0, 0], [-40, 60]], strokeColor: "#475569" }));
  // Services
  const services = [
    { t: "Auth Service", c: "#8b5cf6" },
    { t: "Board Service", c: "#14b8a6" },
    { t: "Collab WS", c: "#ec4899" },
  ];
  services.forEach((s, i) => {
    const x = 80 + i * 260;
    els.push(rect({ x, y: 360, width: 220, height: 70, backgroundColor: s.c, strokeColor: s.c, fillStyle: "solid" }));
    els.push(text({ x: x + 30, y: 380, text: s.t, fontSize: 20, strokeColor: "#ffffff" }));
    els.push(arrow({ x: 320, y: 300, points: [[0, 0], [x - 320 + 110, 60]], strokeColor: "#475569" }));
  });
  // DB
  els.push(rect({ x: 200, y: 500, width: 240, height: 70, backgroundColor: "#0f172a", strokeColor: "#0f172a", fillStyle: "solid" }));
  els.push(text({ x: 250, y: 520, text: "PostgreSQL", fontSize: 20, strokeColor: "#ffffff" }));
  els.push(arrow({ x: 320, y: 430, points: [[0, 0], [0, 70]], strokeColor: "#475569" }));
  return els;
}

function brainstormScene(): El[] {
  const els: El[] = [];
  els.push(text({ x: 60, y: 20, text: "Team Brainstorm ✦", fontSize: 32, strokeColor: "#0f172a" }));
  const notes: { x: number; y: number; t: string; c: string; r: number }[] = [
    { x: 80, y: 110, t: "Faster sync\nvia CRDT", c: "#fde68a", r: -4 },
    { x: 330, y: 90, t: "AI layout\ngenerator", c: "#bbf7d0", r: 3 },
    { x: 580, y: 120, t: "Voice notes\non boards", c: "#fecdd3", r: -2 },
    { x: 830, y: 100, t: "Templates\nlibrary", c: "#bfdbfe", r: 5 },
    { x: 150, y: 320, t: "Mobile\ndrawing", c: "#ddd6fe", r: 2 },
    { x: 430, y: 340, t: "Live cursors\n+ names", c: "#fde68a", r: -3 },
    { x: 700, y: 330, t: "Export to\nFigma", c: "#bbf7d0", r: 4 },
    { x: 950, y: 350, t: "Comment\nthreads", c: "#fecdd3", r: -5 },
  ];
  notes.forEach((nt) => {
    els.push(rect({ x: nt.x, y: nt.y, width: 180, height: 130, backgroundColor: nt.c, strokeColor: nt.c, fillStyle: "solid", angle: (nt.r * Math.PI) / 180 }));
    els.push(text({ x: nt.x + 16, y: nt.y + 20, text: nt.t, fontSize: 18, strokeColor: "#1e293b", angle: (nt.r * Math.PI) / 180 }));
  });
  // connecting freedraw-like scribble
  els.push(line({ x: 260, y: 180, points: [[0, 0], [80, -20], [160, 10]], strokeColor: "#94a3b8", strokeWidth: 2, strokeStyle: "dashed" }));
  els.push(line({ x: 760, y: 200, points: [[0, 0], [90, 40]], strokeColor: "#94a3b8", strokeWidth: 2, strokeStyle: "dashed" }));
  return els;
}

function designSystemScene(): El[] {
  const els: El[] = [];
  els.push(text({ x: 60, y: 20, text: "Design System", fontSize: 32, strokeColor: "#0f172a" }));
  // color swatches
  const swatches = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
  swatches.forEach((c, i) => {
    const x = 60 + i * 120;
    els.push(rect({ x, y: 100, width: 100, height: 100, backgroundColor: c, strokeColor: c, fillStyle: "solid" }));
    els.push(text({ x, y: 210, text: c, fontSize: 13, strokeColor: "#52525b" }));
  });
  // buttons row
  els.push(text({ x: 60, y: 270, text: "Buttons", fontSize: 20, strokeColor: "#1e293b" }));
  els.push(rect({ x: 60, y: 310, width: 140, height: 48, backgroundColor: "#10b981", strokeColor: "#10b981", fillStyle: "solid" }));
  els.push(text({ x: 90, y: 324, text: "Primary", fontSize: 16, strokeColor: "#ffffff" }));
  els.push(rect({ x: 220, y: 310, width: 140, height: 48, backgroundColor: "transparent", strokeColor: "#10b981", strokeWidth: 2, fillStyle: "solid" }));
  els.push(text({ x: 250, y: 324, text: "Outline", fontSize: 16, strokeColor: "#10b981" }));
  els.push(rect({ x: 380, y: 310, width: 140, height: 48, backgroundColor: "#f5f5f4", strokeColor: "#d6d3d1", strokeWidth: 1, fillStyle: "solid" }));
  els.push(text({ x: 415, y: 324, text: "Ghost", fontSize: 16, strokeColor: "#52525b" }));
  // component box
  els.push(rect({ x: 60, y: 400, width: 460, height: 160, backgroundColor: "#fafaf9", strokeColor: "#d6d3d1", strokeWidth: 1, fillStyle: "solid" }));
  els.push(text({ x: 80, y: 416, text: "Card Component", fontSize: 18, strokeColor: "#1e293b" }));
  els.push(rect({ x: 80, y: 450, width: 200, height: 16, backgroundColor: "#e7e5e4", strokeColor: "#e7e5e4", fillStyle: "solid" }));
  els.push(rect({ x: 80, y: 478, width: 160, height: 12, backgroundColor: "#e7e5e4", strokeColor: "#e7e5e4", fillStyle: "solid" }));
  els.push(rect({ x: 80, y: 500, width: 80, height: 28, backgroundColor: "#10b981", strokeColor: "#10b981", fillStyle: "solid" }));
  return els;
}

function onboardingScene(): El[] {
  const els: El[] = [];
  els.push(text({ x: 60, y: 20, text: "Onboarding Flow", fontSize: 32, strokeColor: "#0f172a" }));
  // Start
  els.push(ellipse({ x: 80, y: 120, width: 160, height: 70, backgroundColor: "#10b981", strokeColor: "#10b981", fillStyle: "solid" }));
  els.push(text({ x: 120, y: 140, text: "Sign up", fontSize: 20, strokeColor: "#ffffff" }));
  els.push(arrow({ x: 240, y: 155, points: [[0, 0], [100, 0]], strokeColor: "#475569", strokeWidth: 2 }));
  // Create board
  els.push(rect({ x: 340, y: 120, width: 200, height: 70, backgroundColor: "#ffffff", strokeColor: "#10b981", strokeWidth: 2, fillStyle: "solid" }));
  els.push(text({ x: 365, y: 140, text: "Create board", fontSize: 20, strokeColor: "#1e293b" }));
  els.push(arrow({ x: 540, y: 155, points: [[0, 0], [100, 0]], strokeColor: "#475569", strokeWidth: 2 }));
  // Decision
  els.push(diamond({ x: 640, y: 100, width: 220, height: 110, backgroundColor: "#fef3c7", strokeColor: "#f59e0b", strokeWidth: 2, fillStyle: "solid" }));
  els.push(text({ x: 690, y: 145, text: "Invite\nteam?", fontSize: 18, strokeColor: "#92400e" }));
  // yes branch
  els.push(arrow({ x: 750, y: 210, points: [[0, 0], [0, 90]], strokeColor: "#475569", strokeWidth: 2 }));
  els.push(text({ x: 760, y: 230, text: "yes", fontSize: 14, strokeColor: "#10b981" }));
  els.push(rect({ x: 650, y: 300, width: 200, height: 70, backgroundColor: "#14b8a6", strokeColor: "#14b8a6", fillStyle: "solid" }));
  els.push(text({ x: 680, y: 320, text: "Share link", fontSize: 20, strokeColor: "#ffffff" }));
  // no branch
  els.push(arrow({ x: 860, y: 155, points: [[0, 0], [100, 0]], strokeColor: "#475569", strokeWidth: 2 }));
  els.push(text({ x: 880, y: 130, text: "no", fontSize: 14, strokeColor: "#ef4444" }));
  // finish
  els.push(ellipse({ x: 960, y: 120, width: 160, height: 70, backgroundColor: "#8b5cf6", strokeColor: "#8b5cf6", fillStyle: "solid" }));
  els.push(text({ x: 1000, y: 140, text: "Draw!", fontSize: 20, strokeColor: "#ffffff" }));
  els.push(arrow({ x: 750, y: 370, points: [[0, 0], [280, -250]], strokeColor: "#475569", strokeWidth: 2 }));
  return els;
}

export type DemoScene = {
  title: string;
  description: string;
  category: string;
  visibility: string;
  accessMode: string;
  shareMode: string;
  passwordEnabled: boolean;
  favorited: boolean;
  elements: El[];
};

export function getDemoScenes(): DemoScene[] {
  return [
    {
      title: "Product Roadmap — Q4",
      description: "Now / Next / Later planning with priorities",
      category: "Product",
      visibility: "PUBLIC",
      accessMode: "EDIT",
      shareMode: "PUBLIC_LINK",
      passwordEnabled: true,
      favorited: true,
      elements: roadmapScene(),
    },
    {
      title: "User Journey Map",
      description: "End-to-end experience with satisfaction curve",
      category: "Product",
      visibility: "PUBLIC",
      accessMode: "READ_ONLY",
      shareMode: "PUBLIC_LINK",
      passwordEnabled: false,
      favorited: true,
      elements: journeyScene(),
    },
    {
      title: "System Architecture",
      description: "Client → gateway → services → data layer",
      category: "Engineering",
      visibility: "PRIVATE",
      accessMode: "EDIT",
      shareMode: "INVITE_ONLY",
      passwordEnabled: false,
      favorited: false,
      elements: architectureScene(),
    },
    {
      title: "Team Brainstorm",
      description: "Sticky-note ideas for the next quarter",
      category: "Brainstorm",
      visibility: "PUBLIC",
      accessMode: "EDIT",
      shareMode: "PUBLIC_LINK",
      passwordEnabled: false,
      favorited: false,
      elements: brainstormScene(),
    },
    {
      title: "Design System",
      description: "Color palette, buttons & card components",
      category: "Design",
      visibility: "PRIVATE",
      accessMode: "EDIT",
      shareMode: "INVITE_ONLY",
      passwordEnabled: false,
      favorited: true,
      elements: designSystemScene(),
    },
    {
      title: "Onboarding Flow",
      description: "Decision flowchart from signup to first board",
      category: "Strategy",
      visibility: "PUBLIC",
      accessMode: "READ_ONLY",
      shareMode: "INVITE_ONLY",
      passwordEnabled: false,
      favorited: false,
      elements: onboardingScene(),
    },
  ];
}
