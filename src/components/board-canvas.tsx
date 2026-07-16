"use client";

// Boardly — Excalidraw canvas with real-time collaboration via socket.io
import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import "@excalidraw/excalidraw/index.css";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import { api } from "@/lib/api";
import type { PresenceUser } from "@/lib/types";

type Identity = { id: string; name: string; avatarColor: string };

export function BoardCanvas({
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
  const [apiRef, setApiRef] = React.useState<ExcalidrawImperativeAPI | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const applyingRemote = React.useRef(false);
  const lastSig = React.useRef("");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialData = React.useMemo(() => {
    try {
      const elements = JSON.parse(initialElements || "[]");
      const appState = initialAppState ? JSON.parse(initialAppState) : undefined;
      return { elements, appState: { ...(appState ?? {}), collaborators: [] }, scrollToContent: true } as never;
    } catch {
      return { elements: [], appState: { collaborators: [] }, scrollToContent: true } as never;
    }
  }, [initialElements, initialAppState]);

  // socket lifecycle
  React.useEffect(() => {
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("board:join", { boardId, user: identity, role }));
    socket.on("presence:update", (d: { boardId: string; users: PresenceUser[] }) =>
      d.boardId === boardId && onPresence(d.users));
    socket.on("scene:request", (d: { boardId: string; fromSocketId: string }) => {
      if (d.boardId === boardId && apiRef) socket.emit("scene:response", { boardId, targetSocketId: d.fromSocketId, elements: apiRef.getSceneElements() });
    });
    const apply = (d: { boardId: string; elements: any[] }) => {
      if (d.boardId !== boardId || !apiRef) return;
      applyingRemote.current = true;
      apiRef.updateScene({ elements: d.elements });
      lastSig.current = JSON.stringify(d.elements);
      setTimeout(() => (applyingRemote.current = false), 80);
    };
    socket.on("scene:hydrate", apply);
    socket.on("scene:update", apply);

    return () => {
      socket.emit("board:leave", { boardId, user: identity });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId, identity.id, identity.name, identity.avatarColor, role, apiRef, onPresence]);

  const onChange = React.useCallback((elements: any) => {
    if (!canEdit || applyingRemote.current) return;
    if (bcTimer.current) clearTimeout(bcTimer.current);
    bcTimer.current = setTimeout(() => {
      const sig = JSON.stringify(elements);
      if (sig !== lastSig.current) {
        lastSig.current = sig;
        socketRef.current?.emit("scene:sync", { boardId, elements });
      }
    }, 250);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const elsJson = JSON.stringify(elements);
      api.saveScene(boardId, { elements: elsJson, thumbnail: svgToDataUrl(elementsToSvg(elsJson, { bg: "#fafaf9" })) })
        .then(() => onSaved?.()).catch(() => {});
    }, 1200);
  }, [boardId, canEdit, onSaved]);

  const onPointerUpdate = React.useCallback((payload: any) => {
    if (socketRef.current && payload?.pointer)
      socketRef.current.emit("cursor:move", { boardId, cursor: { x: payload.pointer.x, y: payload.pointer.y }, user: identity });
  }, [boardId, identity]);

  return (
    <div className="excalidraw-wrapper h-full w-full">
      <Excalidraw
        excalidrawAPI={setApiRef}
        initialData={initialData}
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
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
      />
    </div>
  );
}
