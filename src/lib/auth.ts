import { useSyncExternalStore } from "react";

const TOKEN_KEY = "unblur_token";
const PENDING_TOKEN_KEY = "unblur_pending_token";

export function saveToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("unblur-auth-change"));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("unblur-auth-change"));
}

// Holds a token for a user who authenticated (password login) but must change their
// password before the login is considered complete -- kept out of the main token
// storage so useIsLoggedIn / the app shell guard never treat them as logged in until
// the forced reset finishes.
export function savePendingToken(token: string) {
  window.sessionStorage.setItem(PENDING_TOKEN_KEY, token);
}

export function getPendingToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PENDING_TOKEN_KEY);
}

export function clearPendingToken() {
  window.sessionStorage.removeItem(PENDING_TOKEN_KEY);
}

function subscribe(callback: () => void) {
  window.addEventListener("unblur-auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("unblur-auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getToken() !== null,
    () => false,
  );
}

// reads the JWT's role claim purely for client-side routing decisions (which shell/nav to
// show) -- never trusted for anything security-relevant, the gateway and every backend service
// independently verify/re-check role on every actual request. No signature verification here,
// just a base64 decode of the payload.
function getRoleFromToken(token: string): string | undefined {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json) as { role?: string }).role;
  } catch {
    return undefined;
  }
}

// superadmin is a strictly higher tier than admin (Version 9 RBAC) -- anywhere "admin" gets
// into the admin shell, "superadmin" does too
function isAdminTierRole(role: string | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function useIsAdmin(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      const token = getToken();
      return token !== null && isAdminTierRole(getRoleFromToken(token));
    },
    () => false,
  );
}

// gates the RBAC (manage other admins) and gateway-route-management tabs -- strictly narrower
// than useIsAdmin
export function useIsSuperadmin(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      const token = getToken();
      return token !== null && getRoleFromToken(token) === "superadmin";
    },
    () => false,
  );
}
