"use client";
import { createContext, useState, useEffect } from "react";
import { API_URL } from "../../utils/api";
import { User } from "../../../types/user";

export const AuthContext = createContext({
  user: null as User | null,
  token: "",
  setUser: (_user: User | null) => {},
  setToken: (_token: string) => {},
});

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setUser(null);
      setToken("");
      setAuthLoading(false);
      return;
    }

    setToken(storedToken);

    fetch(`${API_URL}/user/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem("token");
          setUser(null);
          setToken("");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  if (authLoading) return null;

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}
