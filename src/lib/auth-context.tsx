"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { clearToken, getToken, saveToken } from "./auth";

interface AuthContextValue {
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribe(callback: () => void) {
  window.addEventListener("unblur-auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("unblur-auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useSyncExternalStore(subscribe, getToken, () => null);

  const login = useCallback((newToken: string) => saveToken(newToken), []);
  const logout = useCallback(() => clearToken(), []);

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: token !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
