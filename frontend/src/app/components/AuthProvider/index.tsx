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

  useEffect(() => {
    let storedToken: string | null = null;
    async function fetchToken() {
      storedToken = localStorage.getItem("token");
    }
    fetchToken().then(() => {
      if (storedToken) setToken(storedToken);
      // Fetch user info if needed
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}