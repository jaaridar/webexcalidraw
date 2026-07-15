// Boardly — client app state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/lib/api";
import { DEFAULT_AVATAR_COLOR } from "@/lib/constants";

type GuestIdentity = {
  id: string;
  name: string;
  avatarColor: string;
};

type AppState = {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  // guest identity for shared-board presence (when not signed in)
  guest: GuestIdentity;
  ensureGuest: () => GuestIdentity;
  setGuestName: (name: string) => void;
  // bump to refetch boards list
  boardsNonce: number;
  bumpBoards: () => void;
};

function randomId() {
  return "g_" + Math.random().toString(36).slice(2, 10);
}

function randomGuest(): GuestIdentity {
  const names = ["Guest Sparrow", "Guest Fox", "Guest Maple", "Guest River", "Guest Sage"];
  return {
    id: randomId(),
    name: names[Math.floor(Math.random() * names.length)],
    avatarColor: DEFAULT_AVATAR_COLOR,
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      guest: randomGuest(),
      ensureGuest: () => {
        const g = get().guest;
        if (!g?.id) {
          const ng = randomGuest();
          set({ guest: ng });
          return ng;
        }
        return g;
      },
      setGuestName: (name) =>
        set((s) => ({ guest: { ...s.guest, name: name.trim() || "Guest" } })),
      boardsNonce: 0,
      bumpBoards: () => set((s) => ({ boardsNonce: s.boardsNonce + 1 })),
    }),
    {
      name: "boardly-app",
      partialize: (s) => ({ guest: s.guest }) as AppState,
    }
  )
);
