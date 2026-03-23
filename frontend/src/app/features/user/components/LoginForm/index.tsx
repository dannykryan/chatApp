"use client";
import React, { useState, useEffect, useContext } from "react";
import { API_URL } from "../../../../shared/utils/api";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import { useRouter } from "next/navigation";
import Button from "../../../../shared/components/Button";

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser, setToken } = useContext(AuthContext);
  const { token } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser({
          id: data.id,
          isOnline: data.isOnline,
          username: data.username,
          profilePictureUrl: data.profilePictureUrl,
          isSystem: data.isSystem,
          createdAt: data.createdAt,
        });
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Network error: " + err.message);
      } else {
        setError("Network error");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-woodsmoke border border-gray-700 rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold mb-4 text-white">Login</h2>
      <input
        type="text"
        placeholder="Username or Email"
        value={usernameOrEmail}
        onChange={(e) => setUsernameOrEmail(e.target.value)}
        className="w-full mb-3 p-2 border border-gray-700 rounded bg-woodsmoke text-white"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 p-2 border border-gray-700 rounded bg-woodsmoke text-white"
        required
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <Button type="submit" btnStyle="primary" className="w-full">
        Login
      </Button>
      <a
        href="/register"
        className="block mt-4 text-center text-purple hover:underline"
      >
        Don't have an account? Register here.
      </a>
    </form>
  );
};

export default Login;
