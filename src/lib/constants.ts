// Boardly — shared constants & types

export const VISIBILITY = {
  PRIVATE: "PRIVATE",
  PUBLIC: "PUBLIC",
} as const;
export type Visibility = (typeof VISIBILITY)[keyof typeof VISIBILITY];

export const ACCESS_MODE = {
  READ_ONLY: "READ_ONLY",
  EDIT: "EDIT",
} as const;
export type AccessMode = (typeof ACCESS_MODE)[keyof typeof ACCESS_MODE];

export const SHARE_MODE = {
  PUBLIC_LINK: "PUBLIC_LINK",
  INVITE_ONLY: "INVITE_ONLY",
} as const;
export type ShareMode = (typeof SHARE_MODE)[keyof typeof SHARE_MODE];

export const ROLE = {
  OWNER: "OWNER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const BOARD_CATEGORIES = [
  "Design",
  "Engineering",
  "Product",
  "Brainstorm",
  "Education",
  "Personal",
  "Strategy",
] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

export const AVATAR_COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
];

export const DEFAULT_AVATAR_COLOR = "#10b981";

export const COLLAB_SERVICE_PORT = 3003;

export function roleLabel(role: string): string {
  switch (role) {
    case ROLE.OWNER:
      return "Owner";
    case ROLE.EDITOR:
      return "Editor";
    case ROLE.VIEWER:
      return "Viewer";
    default:
      return role;
  }
}

export function visibilityLabel(v: string): string {
  return v === VISIBILITY.PRIVATE ? "Private" : "Public";
}

export function accessModeLabel(a: string): string {
  return a === ACCESS_MODE.READ_ONLY ? "Read-only" : "Can edit";
}

export function shareModeLabel(s: string): string {
  return s === SHARE_MODE.PUBLIC_LINK ? "Anyone with link" : "Invite only";
}
