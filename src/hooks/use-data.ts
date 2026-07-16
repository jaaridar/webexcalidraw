// Boardly — centralized React Query hooks
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const qk = {
  session: ["session"] as const,
  boards: ["boards"] as const,
  board: (id: string) => ["board", id] as const,
  access: (id: string) => ["access", id] as const,
  scene: (id: string) => ["scene", id] as const,
};

// --- queries ---
export const useSession = () => useQuery({ queryKey: qk.session, queryFn: api.getSession });
export const useBoards = (enabled = true) =>
  useQuery({ queryKey: qk.boards, queryFn: api.listBoards, enabled });
export const useBoard = (id: string | null) =>
  useQuery({ queryKey: id ? qk.board(id) : ["board", "none"], queryFn: () => api.getBoard(id!), enabled: !!id });
export const useAccess = (id: string) =>
  useQuery({ queryKey: qk.access(id), queryFn: () => api.getAccess(id) });
export const useScene = (id: string, enabled: boolean) =>
  useQuery({ queryKey: qk.scene(id), queryFn: () => api.getScene(id), enabled });

// --- mutations (auto-invalidate relevant queries) ---
export const useCreateBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBoard,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards }),
  });
};

export const useUpdateBoard = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.updateBoard(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.boards });
      qc.invalidateQueries({ queryKey: qk.board(id) });
      qc.invalidateQueries({ queryKey: qk.access(id) });
    },
  });
};

export const useDeleteBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteBoard,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards }),
  });
};

export const useDuplicateBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.duplicateBoard,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards }),
  });
};

export const useInviteCollaborator = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: string }) => api.inviteCollaborator(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.board(id) });
      qc.invalidateQueries({ queryKey: qk.boards });
      qc.invalidateQueries({ queryKey: qk.access(id) });
    },
  });
};

export const useUpdateCollaborator = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateCollaborator(id, userId, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.board(id) }),
  });
};

export const useRemoveCollaborator = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.removeCollaborator(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.board(id) });
      qc.invalidateQueries({ queryKey: qk.boards });
    },
  });
};

export const useVerifyPassword = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.verifyPassword(id, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.access(id) }),
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.session }),
  });
};
