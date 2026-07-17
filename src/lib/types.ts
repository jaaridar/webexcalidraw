// Boardly — central type definitions
// Single source of truth for all shared types across the app.

export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

export type BoardSummary = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  accessMode: "EDIT" | "READ_ONLY";
  shareMode: "PUBLIC_LINK" | "INVITE_ONLY";
  passwordEnabled: boolean;
  allowReshare: boolean;
  allowExport: boolean;
  allowDuplicate: boolean;
  category: string | null;
  workspace: string | null;
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
  role: "EDITOR" | "VIEWER";
  createdAt: string;
  user: User;
};

export type BoardDetail = BoardSummary & {
  elements?: string;
  appState?: string | null;
  owner: User | null;
  collaborators: Collaborator[];
};

export type Access = {
  canView: boolean;
  canEdit: boolean;
  role: "OWNER" | "EDITOR" | "VIEWER" | "GUEST";
  requiresPassword: boolean;
  passwordVerified: boolean;
  isOwner: boolean;
  denied: boolean;
  reason?: string;
};

export type AccessInfo = {
  board: BoardSummary & {
    owner: Pick<User, "id" | "name" | "avatarColor"> | null;
  };
  access: Access;
  currentUser: User | null;
  role: string | null;
};

export type Scene = {
  elements: string;
  appState: string | null;
  access: Access;
  canEdit: boolean;
  allowExport: boolean;
};

export type PresenceUser = User & { role: string };
