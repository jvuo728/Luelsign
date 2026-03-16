import type { Field } from "./types";

export interface SigningSession {
  token: string;
  documentId: string;
  senderName: string;
  senderEmail: string;
  signerName: string;
  signerEmail: string;
  fields: Field[];
  fieldValues: Record<string, string>;
  status: "pending" | "completed";
  createdAt: number;
  completedAt?: number;
}

// Global singleton so the store survives Next.js hot-reload in development
const g = globalThis as typeof globalThis & {
  __sessionsStore?: Map<string, SigningSession>;
};
const store: Map<string, SigningSession> =
  g.__sessionsStore ?? (g.__sessionsStore = new Map());

export function createSession(
  documentId: string,
  senderName: string,
  senderEmail: string,
  signerName: string,
  signerEmail: string,
  fields: Field[]
): SigningSession {
  const token = crypto.randomUUID();
  const session: SigningSession = {
    token,
    documentId,
    senderName,
    senderEmail,
    signerName,
    signerEmail,
    fields,
    fieldValues: {},
    status: "pending",
    createdAt: Date.now(),
  };
  store.set(token, session);
  return session;
}

export function getSession(token: string): SigningSession | undefined {
  return store.get(token);
}

export function completeSession(
  token: string,
  fieldValues: Record<string, string>
): boolean {
  const session = store.get(token);
  if (!session) return false;
  store.set(token, {
    ...session,
    fieldValues,
    status: "completed",
    completedAt: Date.now(),
  });
  return true;
}
