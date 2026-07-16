// Boardly — typed frontend API client with auto-session-recovery
import type { AccessResult } from "@/lib/boards";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
};

export type BoardCard = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  accessMode: string;
  shareMode: string;
  passwordEnabled: boolean;
  allowReshare: boolean;
  allowExport: boolean;
  allowDuplicate: boolean;
  category: string | null;
  archived: boolean;
  favorited: boolean;
  thumbnail: string | null;
  ownerId: string;
  collaboratorCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Collaborator = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
};

export type BoardDetail = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  accessMode: string;
  shareMode: string;
  passwordEnabled: boolean;
  allowReshare: boolean;
  allowExport: boolean;
  allowDuplicate: boolean;
  category: string | null;
  archived: boolean;
  favorited: boolean;
  thumbnail: string | null;
  elements?: string;
  appState?: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string; avatarColor: string } | null;
  collaborators: Collaborator[];
  createdAt: string;
  updatedAt: string;
};

export type AccessInfo = {
  board: {
    id: string;
    title: string;
    description: string | null;
    visibility: string;
    accessMode: string;
    shareMode: string;
    passwordEnabled: boolean;
    allowReshare: boolean;
    allowExport: boolean;
    allowDuplicate: boolean;
    category: string | null;
    owner: { id: string; name: string; avatarColor: string } | null;
    collaboratorCount: number;
    updatedAt: string;
  };
  access: AccessResult;
  currentUser: SessionUser | null;
  role: string | null;
};

// --- Auto-session-recovery fetch wrapper ---
// If any authenticated request returns 401, we automatically provision a
// session (POST /api/auth/session) and retry the original request once.
// This eliminates "Unauthorized" errors from race conditions where the
// session cookie isn't established yet.

let provisioningPromise: Promise<void> | null = null;

async function provisionSession(): Promise<void> {
  if (!provisioningPromise) {
    provisioningPromise = fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "include",
    })
      .then(() => {
        provisioningPromise = null;
      })
      .catch(() => {
        provisioningPromise = null;
      });
  }
  return provisioningPromise;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    cache: options.cache || "default",
  });

  if (!res.ok) {
    // Auto-recover from 401 by provisioning a session and retrying once
    if (res.status === 401 && !isRetry && !url.includes("/api/auth/")) {
      await provisionSession();
      return request<T>(url, options, true);
    }
    const e = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((e as { error?: string }).error || res.statusText);
  }
  return (await res.json()) as T;
}

export const api = {
  // auth
  getSession: () =>
    request<{ user: SessionUser | null }>("/api/auth/session", {
      cache: "no-store",
    }),
  provisionSession: (body?: {
    name?: string;
    email?: string;
    avatarColor?: string;
  }) =>
    request<{ user: SessionUser }>("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  updateProfile: (body: {
    name?: string;
    email?: string;
    avatarColor?: string;
  }) =>
    request<{ user: SessionUser }>("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // boards
  listBoards: () =>
    request<{ boards: BoardCard[] }>("/api/boards", { cache: "no-store" }),
  createBoard: (body: {
    title: string;
    description?: string;
    visibility: string;
    accessMode?: string;
    shareMode?: string;
    category?: string | null;
    elements?: string;
  }) =>
    request<{ board: BoardCard }>("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  getBoard: (id: string) => request<{ board: BoardDetail }>(`/api/boards/${id}`),
  updateBoard: (id: string, body: Record<string, unknown>) =>
    request<{ board: BoardDetail }>(`/api/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteBoard: (id: string) =>
    request<{ ok: boolean }>(`/api/boards/${id}`, { method: "DELETE" }),
  duplicateBoard: (id: string) =>
    request<{ board: BoardCard }>(`/api/boards/${id}/duplicate`, {
      method: "POST",
    }),

  // access & scene
  getAccess: (id: string) => request<AccessInfo>(`/api/boards/${id}/access`),
  verifyPassword: (id: string, password: string) =>
    request<{ ok: boolean }>(`/api/boards/${id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),
  getScene: (id: string) =>
    request<{
      elements: string;
      appState: string | null;
      access: AccessResult;
      canEdit: boolean;
      allowExport: boolean;
    }>(`/api/boards/${id}/scene`),
  saveScene: (
    id: string,
    body: { elements?: string; appState?: string; thumbnail?: string }
  ) =>
    request<{ ok: boolean; updated: boolean; updatedAt?: string }>(
      `/api/boards/${id}/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    ),

  // collaborators
  listCollaborators: (id: string) =>
    request<{
      collaborators: Collaborator[];
      owner: { id: string };
    }>(`/api/boards/${id}/collaborators`),
  inviteCollaborator: (id: string, body: { email: string; role: string }) =>
    request<{ collaborator: Collaborator }>(`/api/boards/${id}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateCollaborator: (
    id: string,
    userId: string,
    body: { role: string }
  ) =>
    request<{ collaborator: Collaborator }>(
      `/api/boards/${id}/collaborators/${userId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    ),
  removeCollaborator: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/boards/${id}/collaborators/${userId}`, {
      method: "DELETE",
    }),

  // seed
  seedBoards: () =>
    request<{ seeded: boolean; count: number }>("/api/boards/seed", {
      method: "POST",
    }),
};
