import { useSyncExternalStore } from "react";

const TOKEN_KEY = "unblur_token";

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
