"use client";
import React, { createContext, useState, useEffect } from "react";
import { User } from "../../types/user";

export const AuthContext = createContext({
  user: null as User | null,
  token: "",
  setUser: (user: User | null) => {},
  setToken: (token: string) => {},
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [mounted, setMounted] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
    setMounted(true);
  }, []);

  // Whenever token changes, fetch the current user
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    fetch(`http://localhost:4000/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setUser(null);
      });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}