"use client";

// Boardly — BoardCanvas: Excalidraw + real-time collaboration.
// Theme follows the app theme (no separate Excalidraw theme toggle).
import * as React from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

type ExcalidrawImperativeAPI = {
  updateScene: (opts: { elements: any[] }) => void;
  getSceneElements: () => any[];
};
import { useTheme } from "next-themes";
import { elementsToSvg, svgToDataUrl } from "@/lib/excalidraw-to-svg";
import { api } from "@/lib/api";
import { useCollab, broadcastAccessChange } from "@/hooks/use-collab";
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
  const [apiRef, setApiRef] = React.useState<any>(null);
  const { resolvedTheme } = useTheme();
  const applyingRemote = React.useRef(false);
  const lastSig = React.useRef("");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialData = React.useMemo(() => {
    try {
      let elements: any[];
      if (Array.isArray(initialElements)) {
        elements = initialElements;
      } else if (typeof initialElements === "string") {
        const parsed = JSON.parse(initialElements || "[]");
        elements = Array.isArray(parsed) ? parsed : [];
      } else {
        elements = [];
      }
      const appState = initialAppState ? JSON.parse(initialAppState) : undefined;
      return { elements, appState: { ...(appState ?? {}), collaborators: [] }, scrollToContent: true } as never;
    } catch {
      return { elements: [], appState: { collaborators: [] }, scrollToContent: true } as never;
    }
  }, [initialElements, initialAppState]);

  const socketRef = useCollab(boardId, identity, role, onPresence);

  // scene:request / scene:hydrate / scene:update listeners
  React.useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const apply = (d: { boardId: string; elements: any[] }) => {
      if (d.boardId !== boardId || !apiRef) return;
      applyingRemote.current = true;
      const elements = Array.isArray(d.elements) ? d.elements : [];
      apiRef.updateScene({ elements });
      lastSig.current = JSON.stringify(elements);
      setTimeout(() => (applyingRemote.current = false), 80);
    };
    const onReq = (d: { boardId: string; fromSocketId: string }) => {
      if (d.boardId === boardId && apiRef) socket.emit("scene:response", { boardId, targetSocketId: d.fromSocketId, elements: apiRef.getSceneElements() });
    };
    socket.on("scene:request", onReq);
    socket.on("scene:hydrate", apply);
    socket.on("scene:update", apply);
    return () => {
      socket.off("scene:request", onReq);
      socket.off("scene:hydrate", apply);
      socket.off("scene:update", apply);
    };
  }, [socketRef, apiRef, boardId]);

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
  }, [boardId, canEdit, onSaved, socketRef]);

  const onPointerUpdate = React.useCallback((payload: any) => {
    if (socketRef.current && payload?.pointer)
      socketRef.current.emit("cursor:move", { boardId, cursor: { x: payload.pointer.x, y: payload.pointer.y }, user: identity });
  }, [boardId, identity, socketRef]);

  // Expose broadcast for the parent to trigger on permission changes
  React.useEffect(() => {
    (window as any).__boardlyBroadcastAccess = (am: string, v: string) => broadcastAccessChange(socketRef, boardId, am, v);
  }, [boardId, socketRef]);

  return (
    <div className="excalidraw-wrapper h-full w-full" data-theme={resolvedTheme}>
      <Excalidraw
        excalidrawAPI={setApiRef}
        initialData={initialData}
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
        viewModeEnabled={!canEdit}
        zenModeEnabled={false}
        gridModeEnabled={false}
         theme={resolvedTheme === "dark" ? "dark" : "light"}
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: allowExport },
            saveToActiveFile: false,
            loadScene: canEdit,
            clearCanvas: canEdit,
            toggleTheme: false, // single theme — no Excalidraw toggle
          },
          tools: { image: canEdit },
        }}
        validateEmbeddable={false}
      />
    </div>
  );
}
