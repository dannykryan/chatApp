"use client";
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthProvider";
import { useRouter } from "next/navigation";

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser, setToken } = useContext(AuthContext);
  const { token } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/chat");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser({ 
          username: data.username,
          profilePictureUrl: data.profilePictureUrl,
        });
        router.push("/chat");
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
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <input
        type="text"
        placeholder="Username or Email"
        value={usernameOrEmail}
        onChange={e => setUsernameOrEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Login
      </button>
      <a href="/register" className="block mt-4 text-center text-blue-600 hover:underline">
        Don't have an account? Register here.
      </a>
    </form>
  );
};

export default Login;