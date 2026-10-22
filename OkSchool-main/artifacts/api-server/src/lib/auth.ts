import { logger } from "./logger";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://revrmdtnffgnmnqytedr.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldnJtZHRuZmZnbm1ucXl0ZWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDYyOTYsImV4cCI6MjA5ODM4MjI5Nn0.d_cw9bytgHl9BvN-SSASb6IJDuuliJg6kNOGUyxS_II";

export interface AuthUser {
  id: string;
  email: string | null;
}

export async function verifySupabaseToken(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string; email?: string | null };
    if (!data?.id) return null;
    return { id: data.id, email: data.email ?? null };
  } catch (err) {
    logger.error({ err }, "token verification failed");
    return null;
  }
}

export function isAdmin(user: AuthUser | null): boolean {
  return !!user && user.email === "kartik1911k@gmail.com";
}

export function requireAuth(req: any, res: any, next: any) {
  const header = String(req.headers?.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  verifySupabaseToken(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "Invalid or expired session" });
        return;
      }
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Authentication failed" });
    });
}

export function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (!isAdmin(req.user)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
