"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  pass: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => { error?: string; ok?: boolean };
  register: (name: string, email: string, pass: string) => { error?: string; ok?: boolean };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sicero_current");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  function getUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem("sicero_users") || "[]");
    } catch {
      return [];
    }
  }

  function saveUsers(users: User[]) {
    localStorage.setItem("sicero_users", JSON.stringify(users));
  }

  function setSession(u: User) {
    localStorage.setItem("sicero_current", JSON.stringify(u));
    setUser(u);
  }

  function register(name: string, email: string, pass: string) {
    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: "This email is already registered." };
    }
    const newUser: User = {
      id: Date.now(),
      name,
      email,
      pass: btoa(pass),
      avatar: name.trim()[0].toUpperCase(),
    };
    users.push(newUser);
    saveUsers(users);
    setSession(newUser);
    return { ok: true };
  }

  function login(email: string, pass: string) {
    const users = getUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.pass === btoa(pass)
    );
    if (!found) return { error: "Incorrect email or password." };
    setSession(found);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem("sicero_current");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}