// Boardly — central application configuration
// ---------------------------------------------------------------------------
// Edit this file to configure the entire app. No other code changes needed.
// ---------------------------------------------------------------------------

export const BOARDLY_CONFIG = {
  // The single owner of this Boardly instance. Auto-created on first run.
  // All dashboard / board-management endpoints operate as this owner —
  // no login required, no sessions, no 401s.
  owner: {
    email: "you@boardly.app",
    name: "You",
    avatarColor: "#10b981",
  },

  // Collab websocket mini-service port (must match mini-services/collab-service)
  collabPort: 3003,

  // Demo board password (for the password-protected demo board)
  demoPassword: "boardly",

  // Auto-seed demo boards on first run
  autoSeed: true,
} as const;

export type BoardlyConfig = typeof BOARDLY_CONFIG;
