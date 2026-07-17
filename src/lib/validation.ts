// Boardly — zod schemas for API validation
import { z } from "zod";

export const createBoardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
  accessMode: z.enum(["EDIT", "READ_ONLY"]).default("EDIT"),
  shareMode: z.enum(["PUBLIC_LINK", "INVITE_ONLY"]).default("INVITE_ONLY"),
  category: z.string().max(100).optional().nullable(),
  workspace: z.string().max(100).optional().nullable(),
  elements: z.string().optional().default("[]"),
});

export const updateBoardSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
  accessMode: z.enum(["EDIT", "READ_ONLY"]).optional(),
  shareMode: z.enum(["PUBLIC_LINK", "INVITE_ONLY"]).optional(),
  category: z.string().max(100).optional().nullable(),
  workspace: z.string().max(100).optional().nullable(),
  archived: z.boolean().optional(),
  favorited: z.boolean().optional(),
  passwordEnabled: z.boolean().optional(),
  password: z.string().optional(),
  passwordHash: z.string().optional().nullable(),
  allowReshare: z.boolean().optional(),
  allowExport: z.boolean().optional(),
  allowDuplicate: z.boolean().optional(),
  elements: z.string().optional(),
  appState: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
});

export const inviteCollaboratorSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(", ");
}
