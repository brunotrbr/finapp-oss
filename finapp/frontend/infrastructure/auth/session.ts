import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/infrastructure/auth/constants";
import { adminAuth } from "@/infrastructure/firebase/admin";

const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;
const E2E_TOKEN = "finapp-e2e-token";
const E2E_SESSION = "finapp-e2e-session";

function e2eAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.FINAPP_E2E_AUTH === "1";
}

const e2eUser: SessionUser = {
  uid: "e2e-user",
  email: "e2e@finapp.local",
  displayName: "Pessoa de teste",
  photoURL: null,
};

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export async function createSession(idToken: string): Promise<SessionUser> {
  if (e2eAuthEnabled() && idToken === E2E_TOKEN) {
    const cookieStore = await cookies();
    cookieStore.set({ name: SESSION_COOKIE, value: E2E_SESSION, httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS });
    return e2eUser;
  }
  const auth = adminAuth();
  const decoded = await auth.verifyIdToken(idToken, true);
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: sessionCookie,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const user = await auth.getUser(decoded.uid);
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  if (e2eAuthEnabled() && sessionCookie === E2E_SESSION) return e2eUser;

  try {
    const auth = adminAuth();
    // checkRevoked: true so logout and disabled accounts take effect immediately.
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const user = await auth.getUser(decoded.uid);
    return {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (e2eAuthEnabled() && sessionCookie === E2E_SESSION) {
    cookieStore.delete(SESSION_COOKIE);
    return;
  }

  if (sessionCookie) {
    try {
      const auth = adminAuth();
      const decoded = await auth.verifySessionCookie(sessionCookie, false);
      await auth.revokeRefreshTokens(decoded.sub);
    } catch {
      // Already invalid or expired - nothing to revoke.
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}
