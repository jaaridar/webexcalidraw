"use client";

// Boardly — useCollab: socket.io hook for real-time collaboration.
// Handles presence, scene hydration, and instant access-mode changes.
import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/hooks/use-data";
import type { PresenceUser } from "@/lib/types";

type Identity = { id: string; name: string; avatarColor: string };

export function useCollab(
  boardId: string,
  identity: Identity,
  role: string,
  onPresence: (users: PresenceUser[]) => void,
  onAccessChange?: (accessMode: string, visibility: string) => void
) {
  const qc = useQueryClient();
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("board:join", { boardId, user: identity, role }));
    socket.on("presence:update", (d: { boardId: string; users: PresenceUser[] }) => {
      if (d.boardId === boardId) onPresence(d.users);
    });

    // Instant permission sync: owner changed Edit→Read-only (or back)
    socket.on("access:changed", (d: { boardId: string; accessMode: string; visibility: string }) => {
      if (d.boardId !== boardId) return;
      // Refetch access + scene so the UI updates to the new permission
      qc.invalidateQueries({ queryKey: qk.access(boardId) });
      qc.invalidateQueries({ queryKey: qk.scene(boardId) });
      onAccessChange?.(d.accessMode, d.visibility);
    });

    return () => {
      socket.emit("board:leave", { boardId, user: identity });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId, identity.id, role]);

  return socketRef;
}

// Broadcast an access change to everyone in the board room (owner only)
export function broadcastAccessChange(
  socket: React.RefObject<Socket | null>,
  boardId: string,
  accessMode: string,
  visibility: string
) {
  socket.current?.emit("access:change", { boardId, accessMode, visibility });
}
