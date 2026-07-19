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
