// Boardly — typed API client with auto-session-recovery
import type { AccessInfo, BoardDetail, BoardSummary, Collaborator, Scene, User } from "@/lib/types";

// Auto-recover from 401 by provisioning the owner session, then retry once.
let provisioning: Promise<void> | null = null;
async function ensureSession() {
  if (!provisioning) {
    provisioning = fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "include",
    })
      .then(() => { provisioning = null; })
      .catch(() => { provisioning = null; });
  }
  return provisioning;
}

async function req<T>(url: string, opts: RequestInit = {}, retry = false): Promise<T> {
  const res = await fetch(url, { ...opts, credentials: "include" });
  if (!res.ok) {
    if (res.status === 401 && !retry && !url.includes("/api/auth/")) {
      await ensureSession();
      return req<T>(url, opts, true);
    }
    const e = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((e as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  // session
  getSession: () => req<{ user: User | null }>("/api/auth/session", { cache: "no-store" }),
  provisionSession: () => req<{ user: User }>("/api/auth/session", json({})),
  updateProfile: (body: Partial<User>) => req<{ user: User }>("/api/auth/profile", { ...json(body), method: "PATCH" }),

  // boards
  listBoards: () => req<{ boards: BoardSummary[] }>("/api/boards", { cache: "no-store" }),
  createBoard: (body: Partial<BoardSummary> & { title: string }) =>
    req<{ board: BoardSummary }>("/api/boards", json(body)),
  getBoard: (id: string) => req<{ board: BoardDetail }>(`/api/boards/${id}`),
  updateBoard: (id: string, body: Record<string, unknown>) =>
    req<{ board: BoardDetail }>(`/api/boards/${id}`, { ...json(body), method: "PATCH" }),
  deleteBoard: (id: string) => req<{ ok: boolean }>(`/api/boards/${id}`, { method: "DELETE" }),
  duplicateBoard: (id: string) => req<{ board: BoardSummary }>(`/api/boards/${id}/duplicate`, { method: "POST" }),

  // access & scene
  getAccess: (id: string) => req<AccessInfo>(`/api/boards/${id}/access`),
  verifyPassword: (id: string, password: string) =>
    req<{ ok: boolean }>(`/api/boards/${id}/access`, json({ password })),
  getScene: (id: string) => req<Scene>(`/api/boards/${id}/scene`),
  saveScene: (id: string, body: { elements?: string; appState?: string; thumbnail?: string }) =>
    req<{ ok: boolean; updated: boolean }>(`/api/boards/${id}/save`, json(body)),

  // collaborators
  inviteCollaborator: (id: string, body: { email: string; role: string }) =>
    req<{ collaborator: Collaborator }>(`/api/boards/${id}/collaborators`, json(body)),
  updateCollaborator: (id: string, userId: string, body: { role: string }) =>
    req<{ collaborator: Collaborator }>(`/api/boards/${id}/collaborators/${userId}`, {
      ...json(body),
      method: "PATCH",
    }),
  removeCollaborator: (id: string, userId: string) =>
    req<{ ok: boolean }>(`/api/boards/${id}/collaborators/${userId}`, { method: "DELETE" }),

  // workspaces
  listWorkspaces: () => req<{ workspaces: string[] }>("/api/workspaces"),
  createWorkspace: (name: string) => req<{ ok: boolean; name: string }>("/api/workspaces", json({ name })),
};
