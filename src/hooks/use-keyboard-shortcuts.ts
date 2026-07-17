"use client";

// Boardly — global keyboard shortcuts
import * as React from "react";
import { useApp } from "@/lib/store";

type ShortcutMap = {
  newBoard: () => void;
  focusSearch: () => void;
  closeBoard: () => void;
  toggleSidebar: () => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const { sidebarCollapsed, toggleSidebar } = useApp();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N — new board
      if (isMeta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        shortcuts.newBoard();
        return;
      }

      // Cmd/Ctrl + K — focus search
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        shortcuts.focusSearch();
        return;
      }

      // Cmd/Ctrl + W — close board
      if (isMeta && e.key.toLowerCase() === "w") {
        e.preventDefault();
        shortcuts.closeBoard();
        return;
      }

      // Cmd/Ctrl + \ — toggle sidebar
      if (isMeta && e.key === "\\") {
        e.preventDefault();
        shortcuts.toggleSidebar();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
