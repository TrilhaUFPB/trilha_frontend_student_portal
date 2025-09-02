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
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: () => {},
  refreshAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    console.log('AuthContext: Checking authentication...');
    const token = getToken();
    console.log('AuthContext: Token exists:', !!token);
    
    if (!token) {
      console.log('AuthContext: No token found, setting user to null');
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Attempt to fetch user data immediately, with retry logic for failures
    const attemptFetch = (retryCount = 0) => {
      console.log(`AuthContext: Fetching user data (attempt ${retryCount + 1})`);
      fetchCurrentUser()
        .then((u) => {
          console.log('AuthContext: User data fetched successfully:', u);
          setUser(u);
          setLoading(false);
        })
        .catch((error) => {
          console.error(`Failed to fetch user (attempt ${retryCount + 1}):`, error);
          
          // If this is not the last retry and it's a temporary error, try again
          if (retryCount < 2 && !error.message.includes('401') && !error.message.includes('403')) {
            console.log(`Retrying in ${(retryCount + 1) * 500}ms...`);
            setTimeout(() => attemptFetch(retryCount + 1), (retryCount + 1) * 500);
            return;
          }
          
          // Remove token only on authentication errors or after all retries
          if (error.message.includes('401') || error.message.includes('403')) {
            console.log('AuthContext: Removing invalid token');
            removeToken();
          }
          setUser(null);
          setLoading(false);
        });
    };

    // Start immediately, no initial delay
    attemptFetch();
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (when token is set in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt') {
        console.log('AuthContext: JWT token changed in storage, rechecking auth');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for focus events (when user returns to tab after login)
    const handleFocus = () => {
      console.log('AuthContext: Window focused, rechecking auth');
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role?.name || null, loading, logout, refreshAuth: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 