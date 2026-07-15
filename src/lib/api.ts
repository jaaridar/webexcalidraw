// Boardly — typed frontend API client
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

function json<T>(): (res: Response) => Promise<T> {
  return async (res: Response) => {
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((e as { error?: string }).error || res.statusText);
    }
    return (await res.json()) as T;
  };
}

export const api = {
  // auth
  getSession: () =>
    fetch("/api/auth/session", { cache: "no-store" }).then(json<{ user: SessionUser | null }>()),
  provisionSession: (body?: { name?: string; email?: string; avatarColor?: string }) =>
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then(json<{ user: SessionUser }>()),
  updateProfile: (body: { name?: string; email?: string; avatarColor?: string }) =>
    fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ user: SessionUser }>()),

  // boards
  listBoards: () => fetch("/api/boards", { cache: "no-store" }).then(json<{ boards: BoardCard[] }>()),
  createBoard: (body: {
    title: string;
    description?: string;
    visibility: string;
    accessMode?: string;
    shareMode?: string;
    category?: string | null;
    elements?: string;
  }) =>
    fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ board: BoardCard }>()),
  getBoard: (id: string) => fetch(`/api/boards/${id}`).then(json<{ board: BoardDetail }>()),
  updateBoard: (id: string, body: Record<string, unknown>) =>
    fetch(`/api/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ board: BoardDetail }>()),
  deleteBoard: (id: string) =>
    fetch(`/api/boards/${id}`, { method: "DELETE" }).then(json<{ ok: boolean }>()),
  duplicateBoard: (id: string) =>
    fetch(`/api/boards/${id}/duplicate`, { method: "POST" }).then(json<{ board: BoardCard }>()),

  // access & scene
  getAccess: (id: string) => fetch(`/api/boards/${id}/access`).then(json<AccessInfo>()),
  verifyPassword: (id: string, password: string) =>
    fetch(`/api/boards/${id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(json<{ ok: boolean }>()),
  getScene: (id: string) =>
    fetch(`/api/boards/${id}/scene`).then(
      json<{ elements: string; appState: string | null; access: AccessResult; canEdit: boolean; allowExport: boolean }>()
    ),
  saveScene: (id: string, body: { elements?: string; appState?: string; thumbnail?: string }) =>
    fetch(`/api/boards/${id}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ ok: boolean; updated: boolean; updatedAt?: string }>()),

  // collaborators
  listCollaborators: (id: string) =>
    fetch(`/api/boards/${id}/collaborators`).then(
      json<{ collaborators: Collaborator[]; owner: { id: string } }>()
    ),
  inviteCollaborator: (id: string, body: { email: string; role: string }) =>
    fetch(`/api/boards/${id}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ collaborator: Collaborator }>()),
  updateCollaborator: (id: string, userId: string, body: { role: string }) =>
    fetch(`/api/boards/${id}/collaborators/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ collaborator: Collaborator }>()),
  removeCollaborator: (id: string, userId: string) =>
    fetch(`/api/boards/${id}/collaborators/${userId}`, { method: "DELETE" }).then(
      json<{ ok: boolean }>()
    ),

  // seed
  seedBoards: () =>
    fetch("/api/boards/seed", { method: "POST" }).then(json<{ seeded: boolean; count: number }>()),
};
