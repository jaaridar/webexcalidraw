// Boardly — global client state (Zustand)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

type Guest = { id: string; name: string; avatarColor: string };

type AppState = {
  // session
  user: User | null;
  setUser: (u: User | null) => void;
  // active board
  currentBoardId: string | null;
  setCurrentBoard: (id: string | null) => void;
  // sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  // workspace filter
  selectedWorkspace: string | null;
  setSelectedWorkspace: (ws: string | null) => void;
  // guest identity (for shared-board presence)
  guest: Guest;
  setGuestName: (name: string) => void;
};

function makeGuest(): Guest {
  const names = ["Sparrow", "Fox", "Maple", "River", "Sage", "Falcon"];
  return {
    id: "g_" + Math.random().toString(36).slice(2, 10),
    name: "Guest " + names[Math.floor(Math.random() * names.length)],
    avatarColor: "#10b981",
  };
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      currentBoardId: null,
      setCurrentBoard: (currentBoardId) => set({ currentBoardId }),
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      selectedWorkspace: null,
      setSelectedWorkspace: (selectedWorkspace) => set({ selectedWorkspace }),
      guest: makeGuest(),
      setGuestName: (name) =>
        set((s) => ({ guest: { ...s.guest, name: name.trim() || "Guest" } })),
    }),
    {
      name: "boardly",
      partialize: (s) => ({ guest: s.guest, sidebarCollapsed: s.sidebarCollapsed, selectedWorkspace: s.selectedWorkspace }),
    }
  )
);
