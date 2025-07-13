"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser } from "@/utils/api";
import { getToken, removeToken } from "@/utils/auth";

export type UserRole = "pending" | "student" | "teacher" | "admin" | null;

interface User {
  id: number;
  name: string;
  email: string;
  role: { id: number; name: UserRole };
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
        removeToken();
      });
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role?.name || null, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 