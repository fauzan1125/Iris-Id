"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserProfile, UserRole } from "@/types";
import { loginUser, fetchCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on initial render
  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = localStorage.getItem("auth_token");
        if (savedToken) {
          setToken(savedToken);
          const profile = await fetchCurrentUser(savedToken);
          setUser(profile);
        }
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  // Strict Route Guard: If not logged in and not on /login, redirect to /login
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
    // If already logged in and visiting /login, redirect to respective dashboard
    if (!isLoading && user && pathname === "/login") {
      if (user.role === "EMPLOYEE") {
        router.push("/dashboard");
      } else if (user.role === "MANAGER") {
        router.push("/manager");
      } else if (user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const data = await loginUser(email, pass);
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);

    // Redirect dynamically based on role
    if (data.user.role === "EMPLOYEE") {
      router.push("/dashboard");
    } else if (data.user.role === "MANAGER") {
      router.push("/manager");
    } else if (data.user.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/");
    }

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
