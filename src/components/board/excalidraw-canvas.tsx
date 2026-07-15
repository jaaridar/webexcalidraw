"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { Excalidraw } from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import "@excalidraw/excalidraw/index.css";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import { api } from "@/lib/api";

type Identity = { id: string; name: string; avatarColor: string };

type RemoteUser = Identity & { role: string };

export type PresenceUser = RemoteUser;

export function ExcalidrawCanvas({
  boardId,
  initialElements,
  initialAppState,
  canEdit,
  allowExport,
  identity,
  role,
  onPresence,
  onSaved,
}: {
  boardId: string;
  initialElements: string;
  initialAppState: string | null;
  canEdit: boolean;
  allowExport: boolean;
  identity: Identity;
  role: string;
  onPresence: (users: PresenceUser[]) => void;
  onSaved?: () => void;
}) {
  const [excalidrawAPI, setExcalidrawAPI] =
    React.useState<ExcalidrawImperativeAPI | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const applyingRemote = React.useRef(false);
  const lastSyncedSig = React.useRef<string>("");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse initial data once
  const initialData = React.useMemo<ExcalidrawInitialDataState | null>(() => {
    try {
      const elements = JSON.parse(initialElements || "[]");
      const appState = initialAppState ? JSON.parse(initialAppState) : undefined;
      return {
        elements,
        appState: {
          ...(appState ?? {}),
          collaborators: [],
        },
        scrollToContent: true,
      } as ExcalidrawInitialDataState;
    } catch {
      return { elements: [], appState: { collaborators: [] }, scrollToContent: true };
    }
  }, [initialElements, initialAppState]);

  // Connect socket + set up listeners
  React.useEffect(() => {
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("board:join", {
        boardId,
        user: identity,
        role,
      });
    });

    socket.on("presence:update", (data: { boardId: string; users: RemoteUser[] }) => {
      if (data.boardId === boardId) onPresence(data.users);
    });

    socket.on("scene:request", (data: { boardId: string; fromSocketId: string }) => {
      if (data.boardId !== boardId || !excalidrawAPI) return;
      const els = excalidrawAPI.getSceneElements();
      socket.emit("scene:response", {
        boardId,
        targetSocketId: data.fromSocketId,
        elements: els,
      });
    });

    socket.on("scene:hydrate", (data: { boardId: string; elements: any[] }) => {
      if (data.boardId !== boardId || !excalidrawAPI) return;
      applyingRemote.current = true;
      excalidrawAPI.updateScene({ elements: data.elements });
      lastSyncedSig.current = JSON.stringify(data.elements);
      setTimeout(() => {
        applyingRemote.current = false;
      }, 80);
    });

    socket.on("scene:update", (data: { boardId: string; elements: any[] }) => {
      if (data.boardId !== boardId || !excalidrawAPI) return;
      applyingRemote.current = true;
      excalidrawAPI.updateScene({ elements: data.elements });
      lastSyncedSig.current = JSON.stringify(data.elements);
      setTimeout(() => {
        applyingRemote.current = false;
      }, 80);
    });

    return () => {
      socket.emit("board:leave", { boardId, user: identity });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId, identity.id]);

  const handleChange = React.useCallback(
    (elements: any) => {
      if (!canEdit) return;
      if (applyingRemote.current) return;

      // Debounced broadcast
      if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
      broadcastTimer.current = setTimeout(() => {
        const sig = JSON.stringify(elements);
        if (sig !== lastSyncedSig.current) {
          lastSyncedSig.current = sig;
          socketRef.current?.emit("scene:sync", { boardId, elements });
        }
      }, 250);

      // Debounced save to DB + thumbnail regen
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const elsJson = JSON.stringify(elements);
        const thumb = svgToDataUrl(elementsToSvg(elsJson, { bg: "#fafaf9" }));
        api
          .saveScene(boardId, { elements: elsJson, thumbnail: thumb })
          .then(() => onSaved?.())
          .catch(() => {});
      }, 1200);
    },
    [boardId, canEdit, onSaved]
  );

  const handlePointerUpdate = React.useCallback(
    (payload: any) => {
      if (!socketRef.current) return;
      if (payload?.pointer) {
        socketRef.current.emit("cursor:move", {
          boardId,
          cursor: { x: payload.pointer.x, y: payload.pointer.y },
          user: identity,
        });
      }
    },
    [boardId, identity]
  );

  return (
    <div className="excalidraw-wrapper h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData ?? undefined}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        viewModeEnabled={!canEdit}
        zenModeEnabled={false}
        gridModeEnabled={false}
        lang="en"
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: allowExport },
            saveToActiveFile: false,
            loadScene: canEdit,
            clearCanvas: canEdit,
            toggleTheme: true,
          },
          tools: { image: canEdit },
        }}
        validateEmbeddable={false}
        renderTopRightUI={() => null}
      />
    </div>
  );
}
